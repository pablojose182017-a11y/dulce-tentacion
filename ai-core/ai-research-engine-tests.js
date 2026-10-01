/**
 * ai-research-engine-tests.js
 * Ejecutar con: node ai-core/ai-research-engine-tests.js
 */
"use strict";

const fs = require('fs');

global.window = { AI_CORE: {} };

eval(fs.readFileSync('./ai-core/ai-offline-resolver.js', 'utf8').replace('window.AI_CORE = window.AI_CORE || {};', ''));
eval(fs.readFileSync('./ai-core/ai-web-fetcher.js', 'utf8').replace('window.AI_CORE = window.AI_CORE || {};', ''));
eval(fs.readFileSync('./ai-core/ai-research-engine.js', 'utf8').replace('window.AI_CORE = window.AI_CORE || {};', ''));

const { OfflineResolver, StubWebFetcher, ResearchEngine } = global.window.AI_CORE;

// Stubs minimos
class MockKM {
    async search(q) {
        if (q.includes('local_known')) {
            return [{ document: { id: 'd1', content: 'Local fact', confidence: 0.9, updatedAt: new Date().toISOString() } }];
        }
        return [];
    }
}
class MockIngestion {
    async ingest(text, source) {
        return { status: 'STORED' }; // Simula guardado exitoso
    }
}
class MockPermission {
    constructor(allows) { this.allows = allows; }
    getGovernanceRules(user) {
        return { allowedCapabilities: this.allows };
    }
}

let passed = 0; let failed = 0;

function assert(condition, message) {
    if (!condition) throw new Error('ASSERT FAILED: ' + message);
}

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

async function runAll() {
    console.log('\n=== Guardian Step 3: ai-research-engine Tests ===\n');

    const resolver = new OfflineResolver(new MockKM());
    const webFetcher = new StubWebFetcher({
        search: {
            'web_query': [{ url: 'http://example.com', title: 'Web Fact', snippet: 'A fact from web' }],
            'contradiction_test': [{ url: 'http://example.com', title: 'Fact A', snippet: 'Fact A' }]
        },
        pages: {
            'http://example.com': { html: 'Full content', title: 'Title' }
        }
    });
    
    // T1: Local Only
    await test('T1: Conocimiento local suficiente, omite web fetch', async () => {
        const engine = new ResearchEngine({ offlineResolver: resolver, reasoningEngine: {}, webFetcher });
        const res = await engine.investigate('local_known', {});
        assert(res.status === 'LOCAL_SUFFICIENT', 'Expected LOCAL_SUFFICIENT');
        assert(res.localResultsUsed.length === 1, 'Debe usar local');
        assert(res.webResultsUsed.length === 0, 'No debe usar web');
    });

    // T2: Web Fetch (Permitido)
    await test('T2: Conocimiento insuficiente -> Web Fetch -> No Ingestion', async () => {
        const pm = new MockPermission(['WEB_SEARCH']);
        const engine = new ResearchEngine({ offlineResolver: resolver, reasoningEngine: {}, webFetcher, permissionManager: pm });
        const res = await engine.investigate('web_query', { user: { data: { roles: ['user'] } } });
        assert(res.status === 'COMPLETED', 'Expected COMPLETED');
        assert(res.webResultsUsed.length === 1, 'Debe usar web');
        assert(res.webResultsUsed[0].content === 'Full content', 'Debe extraer texto de fetchPage');
        assert(res.ingestStatus === 'SKIPPED', 'No debe ingestar sin permiso');
    });

    // T3: Ingestion permitida
    await test('T3: Ingestion exitosa cuando hay permiso', async () => {
        const pm = new MockPermission(['WEB_SEARCH', 'KNOWLEDGE_INGEST_UNVERIFIED']);
        const engine = new ResearchEngine({ offlineResolver: resolver, reasoningEngine: {}, webFetcher, permissionManager: pm, ingestionEngine: new MockIngestion() });
        const res = await engine.investigate('web_query', { user: { data: { roles: ['user'] } } });
        assert(res.webResultsUsed.length === 1, 'Debe usar web');
        assert(res.ingestStatus === 'STORED_UNVERIFIED', 'Debe ingestar');
    });

    // T4: Sin permiso web
    await test('T4: Permiso WEB_SEARCH denegado -> OFFLINE_ONLY', async () => {
        const pm = new MockPermission([]); // Sin permisos
        const engine = new ResearchEngine({ offlineResolver: resolver, reasoningEngine: {}, webFetcher, permissionManager: pm });
        const res = await engine.investigate('web_query', { user: { data: { roles: ['user'] } } });
        assert(res.status === 'INSUFFICIENT_EVIDENCE', 'Falla por falta de evidencia al no usar web');
        assert(res.webResultsUsed.length === 0, 'No debe hacer web fetch');
    });

    // T5: Contradiccion
    await test('T5: Deteccion de contradiccion', async () => {
        const pm = new MockPermission(['WEB_SEARCH']);
        const engine = new ResearchEngine({ offlineResolver: resolver, reasoningEngine: {}, webFetcher, permissionManager: pm });
        const res = await engine.investigate('contradiction_test', { user: { data: { roles: ['user'] } } });
        assert(res.contradictions.length > 0, 'Debe detectar contradiccion');
        assert(res.confidence < 0.5, 'Confianza debe bajar');
    });

    console.log('\n--- Resultados ---');
    console.log('PASS: ' + passed + '   FAIL: ' + failed);
    if (failed > 0) { process.exit(1); }
}
runAll().catch(err => { console.error(err); process.exit(1); });
