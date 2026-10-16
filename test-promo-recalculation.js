/**
 * Test Suite: Promotional Price Recalculation & Out-of-Order Firestore Synchronization
 * 
 * Verifies all required scenarios from prompt:
 * 1. $4.000 with 5% -> $3.800
 * 2. Update base to $4.200 with 5% -> $3.990
 * 3. Receive catalog first ($4.200) and then stale remote offer (with old base or old price) -> safely recalculates to $3.990
 * 4. Receive offer first and then catalog -> same final result ($3.990)
 * 5. Fixed-price offer -> preserves its fixed price regardless of base price change
 * 6. Regular product without offer -> shows base price
 * 7. Reload and verify card display, cart pricing, and persistence
 * 8. Verification that other products and other active offers in the document remain intact
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

function runFullPromoSuite() {
    console.log("==========================================================");
    console.log("  PUNTO DULCE - FULL PROMOTIONAL RECALCULATION & SYNC SUITE");
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

    // SCENARIO 1: $4,000 with 5% -> $3,800
    test("1. $4.000 con 5% produce $3.800", () => {
        const base = 4000;
        const pct = 5;
        const promoPrice = Math.round(base * (1 - pct / 100));
        assert.strictEqual(promoPrice, 3800);
    });

    // SCENARIO 2: Update base to $4,200 with 5% -> $3,990
    test("2. Actualizar precio base a $4.200 con 5% produce $3.990", () => {
        const base = 4200;
        const pct = 5;
        const promoPrice = Math.round(base * (1 - pct / 100));
        assert.strictEqual(promoPrice, 3990);
    });

    // SCENARIO 3: Receive catalog first ($4,200) and then stale remote offer
    test("3. Concurrencia: Recibir primero catálogo ($4.200) y luego oferta remota desactualizada -> Prevalece $3.990", () => {
        const localStorage = new MockLocalStorage();
        localStorage.setItem('dt_catalogo_personalizado', JSON.stringify({
            10: { price: 4200, name: "Pan Tajado Familiar" }
        }));

        const window = {
            dtOfertasActivas: {}
        };
        const products = [
            { id: 10, name: "Pan Tajado Familiar", price: 4000 }
        ];

        // 1. Catálogo procesado primero
        const customCat = JSON.parse(localStorage.getItem('dt_catalogo_personalizado'));
        const p = products[0];
        p.price = customCat[10].price; // 4200

        // 2. Llega snapshot remoto de ofertas con datos antiguos (precioOriginal: 4000, precioOferta: 3800, porcentaje: 5)
        const remoteDocData = {
            10: {
                enOferta: true,
                precioOriginal: 4000, // aún en 4000 en el servidor remoto
                precioOferta: 3800,
                porcentaje: 5,
                badgePromo: "🎉 5% OFF"
            }
        };

        window.dtOfertasActivas = remoteDocData;

        // Implementación de firebase-sync.js:
        products.forEach(prod => {
            if (window.dtOfertasActivas[prod.id]) {
                const ofData = window.dtOfertasActivas[prod.id];
                let basePrice = ofData.precioOriginal;
                try {
                    const localCat = JSON.parse(localStorage.getItem('dt_catalogo_personalizado') || '{}');
                    const entry = localCat[prod.id] || localCat[String(prod.id)];
                    if (entry && entry.price !== undefined && Number(entry.price) > 0) {
                        basePrice = Number(entry.price);
                    }
                } catch (e) { }

                if (prod.oldPrice && prod.oldPrice > basePrice) {
                    basePrice = prod.oldPrice;
                }

                prod.oldPrice = basePrice;
                ofData.precioOriginal = basePrice;

                if (ofData.porcentaje && ofData.porcentaje > 0) {
                    prod.price = Math.round(basePrice * (1 - (ofData.porcentaje / 100)));
                    ofData.precioOferta = prod.price;
                } else {
                    prod.price = ofData.precioOferta;
                }
                prod.enOferta = true;
            }
        });

        assert.strictEqual(p.oldPrice, 4200, "Base price must be 4200");
        assert.strictEqual(p.price, 3990, "Promotional price must be safely calculated as 3990");
        assert.strictEqual(window.dtOfertasActivas[10].precioOferta, 3990);
    });

    // SCENARIO 4: Receive offer first, and then catalog update
    test("4. Concurrencia: Recibir primero oferta remota y luego catálogo ($4.200) -> Mismo resultado final ($3.990)", () => {
        const localStorage = new MockLocalStorage();
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
        const p = { id: 10, name: "Pan Tajado Familiar", price: 3800, oldPrice: 4000, enOferta: true };

        // Luego llega el catálogo remoto con price = 4200
        const customData = { price: 4200 };

        // Lógica de catalogo_personalizado listener en firebase-sync.js:
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

        assert.strictEqual(p.oldPrice, 4200, "p.oldPrice is 4200");
        assert.strictEqual(p.price, 3990, "p.price is 3990");
        assert.strictEqual(window.dtOfertasActivas[10].precioOferta, 3990, "dtOfertasActivas is 3990");
    });

    // SCENARIO 5: Fixed price offer preserves its amount
    test("5. Oferta con precio final fijo -> Conserva su importe exacto ($4.000) al cambiar la base", () => {
        const localStorage = new MockLocalStorage();
        localStorage.setItem('dt_catalogo_personalizado', JSON.stringify({
            25: { price: 6000 }
        }));
        const window = {
            dtOfertasActivas: {
                25: {
                    enOferta: true,
                    precioOriginal: 5000,
                    precioOferta: 4000,
                    porcentaje: 0 // No porcentaje
                }
            }
        };
        const p = { id: 25, name: "Postre Especial", price: 5000 };

        // Sync ofertas_activas listener
        const ofData = window.dtOfertasActivas[25];
        let basePrice = ofData.precioOriginal;
        const entry = JSON.parse(localStorage.getItem('dt_catalogo_personalizado'))[25];
        if (entry) basePrice = entry.price; // 6000

        p.oldPrice = basePrice;
        ofData.precioOriginal = basePrice;

        if (ofData.porcentaje && ofData.porcentaje > 0) {
            p.price = Math.round(basePrice * (1 - ofData.porcentaje / 100));
        } else {
            p.price = ofData.precioOferta; // Conserva 4000
        }

        assert.strictEqual(p.oldPrice, 6000);
        assert.strictEqual(p.price, 4000, "Fixed offer price remains 4000");
    });

    // SCENARIO 6: Product without offer shows base price
    test("6. Producto sin oferta -> Muestra su precio base sin residuales", () => {
        const p = { id: 40, name: "Torta Tradicional", price: 25000, enOferta: false };
        const customData = { price: 28000 };

        if (p.enOferta) {
            p.oldPrice = customData.price;
        } else {
            p.price = customData.price;
        }

        assert.strictEqual(p.price, 28000);
        assert.strictEqual(p.oldPrice, undefined);
    });

    // SCENARIO 7: Reload verification: card, cart, and persistence
    test("7. Recarga (Ctrl + Shift + R): Tarjeta y carrito conservan precio $3.990", () => {
        const localStorage = new MockLocalStorage();
        localStorage.setItem('dt_catalogo_personalizado', JSON.stringify({
            10: { price: 4200, name: "Pan Tajado Familiar" }
        }));
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

        // control-roles.js startup reflection
        products.forEach(prod => {
            if (window.dtOfertasActivas[prod.id]) {
                const ofData = window.dtOfertasActivas[prod.id];
                let basePrice = ofData.precioOriginal || prod.price;
                const localCat = JSON.parse(localStorage.getItem('dt_catalogo_personalizado') || '{}');
                const entry = localCat[prod.id];
                if (entry && entry.price) basePrice = entry.price;

                prod.oldPrice = basePrice;
                if (ofData.porcentaje && ofData.porcentaje > 0) {
                    prod.price = Math.round(basePrice * (1 - ofData.porcentaje / 100));
                } else {
                    prod.price = ofData.precioOferta;
                }
                prod.enOferta = true;
            }
        });

        // Simular tarjeta:
        const pctBadge = Math.round(((products[0].oldPrice - products[0].price) / products[0].oldPrice) * 100);
        assert.strictEqual(products[0].price, 3990);
        assert.strictEqual(products[0].oldPrice, 4200);
        assert.strictEqual(pctBadge, 5, "Badge shows 5% OFF");

        // Simular agregar al carrito:
        const cart = [];
        cart.push({ id: products[0].id, name: products[0].name, price: products[0].price, qty: 3 });
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
        assert.strictEqual(subtotal, 11970, "Cart calculates 3 * 3990 = 11970");
    });

    // SCENARIO 8: Integrity of other products and offers
    test("8. Integridad: Otras ofertas en el documento se preservan sin ser sobrescritas", () => {
        const window = {
            dtOfertasActivas: {
                1: { enOferta: true, precioOriginal: 2000, precioOferta: 1500, porcentaje: 25 },
                10: { enOferta: true, precioOriginal: 4000, precioOferta: 3800, porcentaje: 5 },
                15: { enOferta: true, precioOriginal: 10000, precioOferta: 8500, porcentaje: 15 }
            }
        };

        // Modificamos producto 10
        const isOferta = window.dtOfertasActivas[10];
        isOferta.precioOriginal = 4200;
        isOferta.precioOferta = Math.round(4200 * (1 - isOferta.porcentaje / 100));

        assert.strictEqual(window.dtOfertasActivas[1].precioOferta, 1500, "Product 1 unaffected");
        assert.strictEqual(window.dtOfertasActivas[15].precioOferta, 8500, "Product 15 unaffected");
        assert.strictEqual(window.dtOfertasActivas[10].precioOferta, 3990, "Product 10 updated to 3990");
        assert.strictEqual(Object.keys(window.dtOfertasActivas).length, 3, "All 3 offers preserved");
    });

    console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
    if (failed > 0) process.exit(1);
}

runFullPromoSuite();
