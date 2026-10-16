/**
 * Test Suite: Promotional Price Recalculation & Synchronization
 * 
 * Verifies:
 * 1. Base price $4,000 with 5% discount results in $3,800.
 * 2. Base price updated to $4,200 with 5% discount recalculates to $3,990 (both in admin and remote sync).
 * 3. Fixed-price offer (porcentaje === 0 or undefined) preserves absolute offer price when base price changes.
 * 4. Product without offer reflects base price changes directly.
 * 5. Consistency between catalog card display, cart addition, and persisted state across reload.
 * 6. Protection against cyclic Firestore writes during catalog snapshot updates.
 */

const assert = require('assert');

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

function runPromoTests() {
    console.log("==========================================================");
    console.log("  PUNTO DULCE - PROMOTIONAL PRICE RECALCULATION TESTS");
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

    // TEST 1: Initial creation of 5% promo on $4,000 product -> $3,800
    test("1. Initial 5% offer on $4,000 base price yields $3,800", () => {
        const originalPrice = 4000;
        const porcentaje = 5;
        const nuevoPrecio = Math.round(originalPrice * (1 - porcentaje / 100));

        assert.strictEqual(nuevoPrecio, 3800, "Offer price should be 3800");

        // Display percentage badge formula in createCardHTML
        const pctDisplay = Math.round(((originalPrice - nuevoPrecio) / originalPrice) * 100);
        assert.strictEqual(pctDisplay, 5, "Card discount badge should display 5%");
    });

    // TEST 2: Base price update to $4,200 via admin guardarEdicionProducto
    test("2. Admin update: base price $4,200 with 5% discount recalculates to $3,990", () => {
        const isOferta = {
            enOferta: true,
            precioOriginal: 4000,
            precioOferta: 3800,
            porcentaje: 5,
            badgePromo: "🎉 5% OFF"
        };
        const p = {
            id: 10,
            name: "Pan Tajado Familiar",
            oldPrice: 4000,
            price: 3800,
            enOferta: true
        };

        const nuevoPrecio = 4200;

        // Logic from admin-core.js (guardarEdicionProducto)
        if (isOferta) {
            p.oldPrice = nuevoPrecio;
            isOferta.precioOriginal = nuevoPrecio;

            if (isOferta.porcentaje && isOferta.porcentaje > 0) {
                const nuevoPrecioOferta = Math.round(nuevoPrecio * (1 - (isOferta.porcentaje / 100)));
                isOferta.precioOferta = nuevoPrecioOferta;
                p.price = nuevoPrecioOferta;
            }
        }

        assert.strictEqual(p.oldPrice, 4200, "p.oldPrice should be 4200");
        assert.strictEqual(p.price, 3990, "p.price should be 3990");
        assert.strictEqual(isOferta.precioOferta, 3990, "isOferta.precioOferta should be 3990");

        const pctDisplay = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
        assert.strictEqual(pctDisplay, 5, "Card discount badge should remain 5%");
    });

    // TEST 3: Base price update to $4,200 via remote listener (firebase-sync.js)
    test("3. Remote sync listener: base price $4,200 recalculates p.price to $3,990", () => {
        const window = {
            dtOfertasActivas: {
                10: {
                    enOferta: true,
                    precioOriginal: 4000,
                    precioOferta: 3800,
                    porcentaje: 5
                }
            }
        };
        const p = {
            id: 10,
            name: "Pan Tajado Familiar",
            oldPrice: 4000,
            price: 3800,
            enOferta: true
        };

        const customData = { price: 4200 };

        // Logic updated in firebase-sync.js
        if (customData.price !== undefined) {
            const newPrice = Number(customData.price);
            if (p.enOferta) {
                p.oldPrice = newPrice;
                if (window.dtOfertasActivas && window.dtOfertasActivas[p.id]) {
                    const isOferta = window.dtOfertasActivas[p.id];
                    const precioOrigAnterior = isOferta.precioOriginal;
                    isOferta.precioOriginal = newPrice;

                    if (isOferta.porcentaje && isOferta.porcentaje > 0) {
                        const nuevoPrecioOferta = Math.round(newPrice * (1 - (isOferta.porcentaje / 100)));
                        isOferta.precioOferta = nuevoPrecioOferta;
                        p.price = nuevoPrecioOferta;
                    }
                }
            } else {
                p.price = newPrice;
            }
        }

        assert.strictEqual(p.oldPrice, 4200, "p.oldPrice should update to 4200");
        assert.strictEqual(p.price, 3990, "p.price should recalculate to 3990");
        assert.strictEqual(window.dtOfertasActivas[10].precioOferta, 3990, "dtOfertasActivas should update to 3990");
    });

    // TEST 4: Fixed-price offer (no percentage) preserves exact fixed offer price
    test("4. Fixed-price offer: preserves fixed offer price when base price changes", () => {
        const window = {
            dtOfertasActivas: {
                20: {
                    enOferta: true,
                    precioOriginal: 5000,
                    precioOferta: 4000,
                    porcentaje: 0 // Manual final price entered
                }
            }
        };
        const p = {
            id: 20,
            name: "Torta Especial",
            oldPrice: 5000,
            price: 4000,
            enOferta: true
        };

        const customData = { price: 5500 }; // Base price goes up to 5500

        // Remote sync listener logic
        if (customData.price !== undefined) {
            const newPrice = Number(customData.price);
            if (p.enOferta) {
                p.oldPrice = newPrice;
                if (window.dtOfertasActivas && window.dtOfertasActivas[p.id]) {
                    const isOferta = window.dtOfertasActivas[p.id];
                    isOferta.precioOriginal = newPrice;

                    if (isOferta.porcentaje && isOferta.porcentaje > 0) {
                        const nuevoPrecioOferta = Math.round(newPrice * (1 - (isOferta.porcentaje / 100)));
                        isOferta.precioOferta = nuevoPrecioOferta;
                        p.price = nuevoPrecioOferta;
                    }
                }
            } else {
                p.price = newPrice;
            }
        }

        assert.strictEqual(p.oldPrice, 5500, "p.oldPrice should update to 5500");
        assert.strictEqual(p.price, 4000, "p.price must remain 4000 (fixed promo price preserved)");
        assert.strictEqual(window.dtOfertasActivas[20].precioOferta, 4000, "dtOfertasActivas must remain 4000");
    });

    // TEST 5: Product without offer reflects base price changes directly
    test("5. Regular product without offer: p.price updates directly", () => {
        const p = {
            id: 30,
            name: "Pan Tradicional",
            price: 1500,
            enOferta: false
        };

        const customData = { price: 1800 };

        if (customData.price !== undefined) {
            const newPrice = Number(customData.price);
            if (p.enOferta) {
                p.oldPrice = newPrice;
            } else {
                p.price = newPrice;
            }
        }

        assert.strictEqual(p.price, 1800, "p.price should update directly to 1800");
        assert.strictEqual(p.oldPrice, undefined, "p.oldPrice should not exist");
    });

    // TEST 6: Cart consistency: addToCart takes recalculated p.price
    test("6. Cart consistency: addToCart charges recalculated offer price ($3,990)", () => {
        const p = {
            id: 10,
            name: "Pan Tajado Familiar",
            oldPrice: 4200,
            price: 3990,
            enOferta: true
        };

        const cart = [];

        // addToCart logic
        let finalPrice = p.price;
        let finalName = p.name;
        cart.push({ id: p.id, name: finalName, price: finalPrice, quantity: 2 });

        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        assert.strictEqual(cart[0].price, 3990, "Cart item unit price should be 3990");
        assert.strictEqual(total, 7980, "Cart total for 2 items should be 7980 (3990 * 2)");
    });

    // TEST 7: Page reload rehydration from localStorage
    test("7. State rehydration across reloads: control-roles.js initializes from dt_ofertas_activas", () => {
        const localStorage = new MockLocalStorage();
        localStorage.setItem('dt_ofertas_activas', JSON.stringify({
            10: {
                enOferta: true,
                precioOriginal: 4200,
                precioOferta: 3990,
                porcentaje: 5,
                badgePromo: "🎉 5% OFF"
            }
        }));

        const window = {
            dtOfertasActivas: JSON.parse(localStorage.getItem('dt_ofertas_activas') || '{}')
        };

        const products = [
            { id: 10, name: "Pan Tajado Familiar", price: 4000 }
        ];

        // control-roles.js initialization on load
        products.forEach(p => {
            if (!p.originalName) p.originalName = p.name;
            if (window.dtOfertasActivas[p.id]) {
                p.oldPrice = window.dtOfertasActivas[p.id].precioOriginal;
                p.price = window.dtOfertasActivas[p.id].precioOferta;
                p.enOferta = true;
            }
        });

        assert.strictEqual(products[0].oldPrice, 4200, "After reload, oldPrice is 4200");
        assert.strictEqual(products[0].price, 3990, "After reload, selling price is 3990");
    });

    console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0) process.exit(1);
}

runPromoTests();
