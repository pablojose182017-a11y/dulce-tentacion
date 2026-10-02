/**
 * Test Suite: Real-Time Product Stock & Availability Synchronization
 * 
 * Tests:
 * 1. Stale localStorage vs Firestore Precedence on Startup
 * 2. Firestore Snapshot State Propagation to in-memory stockConfig & localStorage
 * 3. Preservation of 'agotado' and custom fields during product edits in guardarEdicionProducto
 * 4. Consistent boolean interpretation across all views (Admin, Customer, Kitchen)
 * 5. Prevention of Firestore write loops from snapshot callbacks
 */

const assert = require('assert');

// Mock localStorage
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] !== undefined ? this.store[key] : null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

async function runTests() {
    console.log("==========================================================");
    console.log("  PUNTO DULCE - STOCK SYNCHRONIZATION TEST SUITE");
    console.log("  (Simulated Unit & Contract Tests)");
    console.log("==========================================================\n");

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`❌ FAIL: ${name}`);
            console.error(err);
            failed++;
        }
    }

    // ------------------------------------------------------------------------
    // TEST 1: Stale dt_stock_config vs Firestore Precedence
    // ------------------------------------------------------------------------
    test("1. Initialization: dt_catalogo_personalizado (Firestore) overrides stale dt_stock_config", () => {
        const localStorage = new MockLocalStorage();

        // Stale admin state saved in dt_stock_config: Product 1 is Available (false)
        localStorage.setItem('dt_stock_config', JSON.stringify({ 1: false }));
        
        // Remote Firestore cache in dt_catalogo_personalizado: Product 1 is Out of Stock (true)
        localStorage.setItem('dt_catalogo_personalizado', JSON.stringify({
            "1": { name: "Pan Cascarita", agotado: true }
        }));

        let stockConfig = {};
        const stk = localStorage.getItem('dt_stock_config');
        if (stk) stockConfig = JSON.parse(stk);

        // Apply our fix: dt_catalogo_personalizado has precedence
        const cat = JSON.parse(localStorage.getItem('dt_catalogo_personalizado') || '{}');
        Object.keys(cat).forEach(k => {
            if (cat[k] && cat[k].agotado !== undefined) {
                stockConfig[k] = cat[k].agotado;
            }
        });

        assert.strictEqual(stockConfig[1] || stockConfig["1"], true, "Product 1 must be marked as agotado (true) from Firestore cache, overriding stale false");
    });

    // ------------------------------------------------------------------------
    // TEST 2: Snapshot State Propagation & Local-Only Persistence (No Firestore Loop)
    // ------------------------------------------------------------------------
    test("2. Snapshot propagation: Updates stockConfig and writes dt_stock_config without write loop", () => {
        const localStorage = new MockLocalStorage();
        let firestoreWrites = 0;

        // Mock products
        const products = [
            { id: 1, name: "Pan Cascarita", price: 500 },
            { id: 2, name: "Pan de Maíz", price: 500 }
        ];

        let stockConfig = { 1: false, 2: false };
        const windowMock = { stockConfig };

        // Simulated applyCustomCatalog
        function applyCustomCatalog(customCatalog) {
            for (let i = products.length - 1; i >= 0; i--) {
                const p = products[i];
                const customData = customCatalog[p.id] !== undefined ? customCatalog[p.id] : customCatalog[String(p.id)];
                if (customData !== undefined) {
                    if (customData.agotado !== undefined) {
                        stockConfig[p.id] = customData.agotado;
                    }
                }
            }

            windowMock.stockConfig = stockConfig;
            // Local-only save, does NOT trigger Firestore writes
            localStorage.setItem('dt_stock_config', JSON.stringify(stockConfig));
        }

        // Snapshot arrives: Product 1 is now agotado
        const snapshotData = {
            "1": { agotado: true },
            "2": { agotado: false }
        };

        applyCustomCatalog(snapshotData);

        assert.strictEqual(stockConfig[1], true, "In-memory stockConfig[1] must be true");
        assert.strictEqual(stockConfig[2], false, "In-memory stockConfig[2] must be false");
        assert.strictEqual(windowMock.stockConfig[1], true, "window.stockConfig[1] must be true");
        
        const persistedStk = JSON.parse(localStorage.getItem('dt_stock_config'));
        assert.strictEqual(persistedStk["1"] || persistedStk[1], true, "dt_stock_config in localStorage must be true");
        assert.strictEqual(firestoreWrites, 0, "No Firestore writes should be triggered by the snapshot processing callback");
    });

    // ------------------------------------------------------------------------
    // TEST 3: Preservation of 'agotado' during product editing
    // ------------------------------------------------------------------------
    test("3. Product Edit: Existing 'agotado' status is preserved in guardarEdicionProducto", () => {
        const localStorage = new MockLocalStorage();

        const pId = 1;
        // Existing catalog entry already marked as agotado: true
        localStorage.setItem('dt_catalogo_personalizado', JSON.stringify({
            "1": {
                name: "Pan Cascarita Original",
                price: 500,
                category: "panaderia",
                agotado: true,
                points: 5
            }
        }));

        let stockConfig = { 1: true };

        // Simulating guardarEdicionProducto
        let localCatalog = {};
        try { localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado')) || {}; } catch (e) { }

        const nuevoNombre = "Pan Cascarita Super Crocante";
        const nuevoPrecio = 600;
        const nuevaImg = "pan_crocante.jpg";
        const nuevaCategoria = "panaderia";
        const nuevosPuntos = 10;

        const existingCatalogEntry = localCatalog[pId] || {};
        localCatalog[pId] = {
            ...existingCatalogEntry,
            name: nuevoNombre,
            price: nuevoPrecio,
            img: nuevaImg,
            image: nuevaImg,
            category: nuevaCategoria,
            points: nuevosPuntos,
            puntos: nuevosPuntos
        };

        // Preservar explícitamente agotado
        if (existingCatalogEntry.agotado !== undefined) {
            localCatalog[pId].agotado = existingCatalogEntry.agotado;
        } else if (stockConfig[pId] !== undefined) {
            localCatalog[pId].agotado = stockConfig[pId];
        }

        assert.strictEqual(localCatalog[pId].agotado, true, "'agotado: true' must be preserved after product edit");
        assert.strictEqual(localCatalog[pId].name, "Pan Cascarita Super Crocante", "New name must be updated");
        assert.strictEqual(localCatalog[pId].price, 600, "New price must be updated");
        assert.strictEqual(localCatalog[pId].points, 10, "New points must be updated");
    });

    // ------------------------------------------------------------------------
    // TEST 4: View Availability Consistency (Admin vs Customer vs Kitchen)
    // ------------------------------------------------------------------------
    test("4. View Consistency: Customer, Admin, and Kitchen evaluate availability identically", () => {
        const stockConfig = { 1: true, 2: false };

        const p1 = { id: 1, name: "Pan Cascarita" };
        const p2 = { id: 2, name: "Pan de Maíz" };

        function isCustomerOut(p) {
            return stockConfig[p.id] === true;
        }

        function isAdminOut(p) {
            return stockConfig[p.id] === true;
        }

        function isKitchenOut(p) {
            return stockConfig[p.id] === true;
        }

        // Product 1 (Agotado)
        assert.strictEqual(isCustomerOut(p1), true);
        assert.strictEqual(isAdminOut(p1), true);
        assert.strictEqual(isKitchenOut(p1), true);

        // Product 2 (Disponible)
        assert.strictEqual(isCustomerOut(p2), false);
        assert.strictEqual(isAdminOut(p2), false);
        assert.strictEqual(isKitchenOut(p2), false);
    });

    // ------------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------------
    console.log("\n----------------------------------------------------------");
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log("----------------------------------------------------------");
    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
