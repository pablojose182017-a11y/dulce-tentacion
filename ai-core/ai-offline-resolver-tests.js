/**
 * ai-offline-resolver-tests.js -- Guardian Step 1
 * Ejecutar con: node ai-core/ai-offline-resolver-tests.js
 */
"use strict";

const fs = require('fs');

// Simular entorno browser minimal
global.window = { AI_CORE: {} };

// Cargar el modulo (usa window.AI_CORE)
const code = fs.readFileSync('./ai-core/ai-offline-resolver.js', 'utf8');
// Reemplazar el guard de window para que no falle en Node
eval('(function(window){ ' + code + ' })(global.window)');
const OfflineResolver = global.window.AI_CORE.OfflineResolver;

// -- Stub de KnowledgeManager --
class StubKnowledgeManager {
    constructor(docs) { this._docs = docs || []; this._shouldThrow = false; }
    async search(query) {
        if (this._shouldThrow) throw new Error('KM_UNAVAILABLE');
        const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
        const results = [];
        for (const doc of this._docs) {
            const text = [doc.title, doc.content, doc.category, ...(doc.tags||[])].join(' ').toLowerCase();
            let score = 0; const matched = [];
            for (const t of terms) {
                if (text.includes(t)) { score += 2; matched.push(t); }
            }
            if (score > 0) results.push({ document: doc, score, matchedTerms: matched, matchRatio: matched.length / terms.length });
        }
        return results.sort((a,b) => b.score - a.score);
    }
    setThrow(val) { this._shouldThrow = val; }
}

// -- Datos de prueba --
const NOW_ISO = new Date().toISOString();
const OLD_ISO = new Date(Date.now() - 45 * 86400000).toISOString();

const DOC_FRESH_FIRESTORE = {
    id: 'doc_firestore_rules_001', title: 'Reglas de Firestore',
    content: 'Las reglas de seguridad de Firestore controlan el acceso a la base de datos. Se definen en el archivo firestore.rules.',
    category: 'Security', tags: ['firestore', 'security', 'rules', 'database'],
    source: 'creator', confidence: 0.9, version: 1, createdAt: NOW_ISO, updatedAt: NOW_ISO
};
const DOC_STALE_FIRESTORE = {
    id: 'doc_firestore_stale_001', title: 'Configuracion Firestore obsoleta',
    content: 'Configuracion antigua de Firestore. Puede estar desactualizada.',
    category: 'Database', tags: ['firestore', 'configuracion', 'database'],
    source: 'creator', confidence: 0.6, version: 1, createdAt: OLD_ISO, updatedAt: OLD_ISO
};
const DOC_HIGH_CONFIDENCE = {
    id: 'doc_high_conf_001', title: 'Protocolo SSL TLS',
    content: 'TLS 1.3 es el estandar actual de cifrado para conexiones seguras en web.',
    category: 'Security', tags: ['ssl', 'tls', 'cifrado', 'protocolo'],
    source: 'creator', confidence: 0.92, version: 1, createdAt: NOW_ISO, updatedAt: NOW_ISO
};
const DOC_UNRELATED = {
    id: 'doc_recipes_001', title: 'Receta de Torta de Chocolate',
    content: 'Ingredientes: harina, azucar, cacao, huevos. Hornear a 180 grados.',
    category: 'Recipes', tags: ['torta', 'chocolate', 'receta'],
    source: 'creator', confidence: 0.95, version: 1, createdAt: NOW_ISO, updatedAt: NOW_ISO
};

// -- Runner --
let passed = 0; let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log('  [PASS] ' + name);
    } catch (err) {
        failed++;
        console.log('  [FAIL] ' + name);
        console.log('         ' + err.message);
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function runAll() {
    console.log('\n=== Guardian Step 1: ai-offline-resolver Tests ===\n');

    await test('T1: Conocimiento fresco con buena cobertura -> SUFFICIENT', async () => {
        const km = new StubKnowledgeManager([DOC_FRESH_FIRESTORE, DOC_UNRELATED]);
        const resolver = new OfflineResolver(km, { freshnessMaxDays: 30, coverageThreshold: 0.4 });
        const res = await resolver.query('reglas seguridad firestore database');
        assert(res.status === 'SUFFICIENT', 'Expected SUFFICIENT, got: ' + res.status);
        assert(res.offlineCapable === true, 'Expected offlineCapable=true');
        assert(res.results.length >= 1, 'Expected at least 1 fresh result, got ' + res.results.length);
        assert(res.staleDocs.length === 0, 'Expected no stale docs');
        assert(res.coverage > 0, 'Expected coverage > 0, got: ' + res.coverage);
        assert(typeof res.resolvedAt === 'string', 'Expected resolvedAt timestamp');
        assert(typeof res.explanation === 'string' && res.explanation.length > 0, 'Expected explanation');
    });

    await test('T2: Conocimiento desactualizado -> STALE_BUT_AVAILABLE, no descartado', async () => {
        const km = new StubKnowledgeManager([DOC_STALE_FIRESTORE]);
        const resolver = new OfflineResolver(km, { freshnessMaxDays: 30, coverageThreshold: 0.3 });
        const res = await resolver.query('configuracion firestore database');
        assert(res.status === 'STALE_BUT_AVAILABLE', 'Expected STALE_BUT_AVAILABLE, got: ' + res.status);
        assert(res.staleDocs.length >= 1, 'Stale docs must be present, not discarded');
        assert(res.results.length === 0, 'No fresh docs expected');
        assert(res.offlineCapable === true, 'Stale knowledge still usable offline');
        assert(res.freshnessWarnings.length >= 1, 'Expected at least 1 freshness warning');
        assert(res.freshnessWarnings[0].ageInDays >= 45, 'Expected ageInDays >= 45, got: ' + res.freshnessWarnings[0].ageInDays);
        assert(typeof res.freshnessWarnings[0].warning === 'string', 'Expected warning string');
        assert(res.staleDocs[0].document.id === DOC_STALE_FIRESTORE.id, 'Stale doc must be accessible');
    });

    await test('T3: Sin conocimiento relevante -> INSUFFICIENT', async () => {
        const km = new StubKnowledgeManager([DOC_UNRELATED]);
        const resolver = new OfflineResolver(km);
        const res = await resolver.query('protocolos criptografia cuantica algoritmos');
        assert(res.status === 'INSUFFICIENT', 'Expected INSUFFICIENT, got: ' + res.status);
        assert(res.offlineCapable === false, 'Expected offlineCapable=false');
        assert(res.explanation.length > 0, 'Expected explanation message');
        assert(res.results.length === 0, 'No fresh results expected');
    });

    await test('T4: Tolerancia morfologica -- singular/plural cubierto correctamente', async () => {
        const km = new StubKnowledgeManager([DOC_FRESH_FIRESTORE]);
        const resolver = new OfflineResolver(km, { freshnessMaxDays: 30, coverageThreshold: 0.3 });
        const res = await resolver.query('regla seguridad firestore');
        assert(res.coverage > 0, 'Expected coverage > 0 with morphological matching, got: ' + res.coverage);
        assert(res.coveredTerms.length > 0, 'Expected at least 1 covered term');
    });

    await test('T5: Tarea vacia -> INSUFFICIENT con mensaje claro', async () => {
        const km = new StubKnowledgeManager([DOC_FRESH_FIRESTORE]);
        const resolver = new OfflineResolver(km);
        const res = await resolver.query('   ');
        assert(res.status === 'INSUFFICIENT', 'Expected INSUFFICIENT for empty task');
        assert(res.offlineCapable === false, 'Expected offlineCapable=false');
        assert(res.explanation.length > 0, 'Expected explanation message');
    });

    await test('T6: Error del KnowledgeManager -> INSUFFICIENT con razon de error', async () => {
        const km = new StubKnowledgeManager([]);
        km.setThrow(true);
        const resolver = new OfflineResolver(km);
        const res = await resolver.query('firestore security rules');
        assert(res.status === 'INSUFFICIENT', 'Expected INSUFFICIENT on KM error');
        assert(res.offlineCapable === false, 'Expected offlineCapable=false on KM error');
        assert(res.explanation.length > 0, 'Expected error explanation');
    });

    await test('T7: Alta confianza compensa cobertura baja de terminos -> SUFFICIENT', async () => {
        const km = new StubKnowledgeManager([DOC_HIGH_CONFIDENCE]);
        const resolver = new OfflineResolver(km, {
            freshnessMaxDays: 30, coverageThreshold: 0.9, highConfidenceFloor: 0.85
        });
        const res = await resolver.query('ssl tls protocolo cifrado web seguro');
        assert(res.status === 'SUFFICIENT', 'Expected SUFFICIENT via high confidence, got: ' + res.status);
        assert(res.offlineCapable === true, 'Expected offlineCapable=true');
    });

    console.log('\n--- Resultados ---');
    console.log('PASS: ' + passed + '   FAIL: ' + failed);
    if (failed > 0) { process.exit(1); } else { console.log('Todas las pruebas pasaron.\n'); }
}

runAll().catch(err => { console.error('ERROR FATAL:', err.message); process.exit(1); });