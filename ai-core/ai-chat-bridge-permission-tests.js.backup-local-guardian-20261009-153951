/**
 * ai-chat-bridge-permission-tests.js -- Guardian Step 5
 * Ejecutar con: node ai-core/ai-chat-bridge-permission-tests.js
 */
"use strict";

const fs = require('fs');

global.window = { AI_CORE: {} };

// Mock dependencies
window.AI_CORE.IdentityManager = class { 
    getBotIdentity() { return {}; }
    getCurrentUser(u) { return u || { roles: ['user'] }; } 
};
let allowedCapabilities = [];
window.AI_CORE.PermissionManager = class { 
    getGovernanceRules() { return { allowedCapabilities }; } 
};
window.AI_CORE.LocalStorageKnowledgeStore = class { 
    async load() { return []; } async save() {} 
};
window.AI_CORE.MemoryManager = class { 
    constructor() { this.shortTerm = []; }
    addTurn(role, text, meta) { this.shortTerm.push({ role, text, meta }); }
    getShortTermMemory() { return this.shortTerm; }
    async getAllPersistent() { return []; }
    clearShortTermMemory() { this.shortTerm = []; }
};
window.AI_CORE.KnowledgeManager = class { async search() { return []; } };
window.AI_CORE.ContextManager = class { 
    async assembleContext() {} setKnowledge() {} setCreatorKnowledge() {} 
    buildContext() { return {}; } 
};
window.AI_CORE.LocalMockProvider = class { async generate() { return "ChatFlow"; } };
window.AI_CORE.ReasoningEngine = class { async reason() { return { uncertainty: { level: 'LOW' } }; } };
window.AI_CORE.PersonalityEngine = class { applyPersonality() { return { conversationMode: 'CASUAL' }; } };

// Mock real ResearchEngine
eval(fs.readFileSync('./ai-core/ai-offline-resolver.js', 'utf8').replace('window.AI_CORE = window.AI_CORE || {};', ''));
eval(fs.readFileSync('./ai-core/ai-web-fetcher.js', 'utf8').replace('window.AI_CORE = window.AI_CORE || {};', ''));
eval(fs.readFileSync('./ai-core/ai-research-engine.js', 'utf8').replace('window.AI_CORE = window.AI_CORE || {};', ''));
const { OfflineResolver, StubWebFetcher, ResearchEngine } = global.window.AI_CORE;

// ChatBridge
const code = fs.readFileSync('./ai-core/ai-chat-bridge.js', 'utf8');
eval('(function(window){ ' + code + ' })(global.window)');
const { ChatBridge } = global.window.AI_CORE;

let passed = 0; let failed = 0;
function assert(condition, message) { if (!condition) throw new Error('ASSERT FAILED: ' + message); }

async function test(name, fn) {
    try { await fn(); passed++; console.log('  [PASS] ' + name); } 
    catch (err) { failed++; console.log('  [FAIL] ' + name); console.log('         ' + err.message); }
}

async function runAll() {
    console.log('\n=== Guardian Step 5: ChatBridge Permission and Intent Tests ===\n');

    const resolver = new OfflineResolver(new window.AI_CORE.KnowledgeManager());
    const webFetcher = new StubWebFetcher({
        search: { 'test': [{ url: 'http://example.com', title: 'Example', snippet: 'A snippet longer than 10 chars' }] },
        pages: { 'http://example.com': { title: 'T', html: 'content longer than 10 chars' } }
    });
    
    // Configurar ChatBridge para usar el ResearchEngine real pero con stubs locales
    const buildBridge = () => {
        const bridge = new ChatBridge();
        bridge.researchEngine = new ResearchEngine({
            offlineResolver: resolver,
            reasoningEngine: bridge.reasoningEngine,
            webFetcher,
            ingestionEngine: { async ingest() { return { status: 'STORED' }; } },
            permissionManager: bridge.permissionManager
        });
        return bridge;
    };

    await test('T1: Reconocimiento de nuevas intenciones en espanol', async () => {
        allowedCapabilities = ['WEB_SEARCH'];
        const intents = [
            'Investiga sobre esto', 'investiga por que falla',
            'Busca informacion sobre X', 'Averigua que esta causando Y'
        ];
        
        for (const intent of intents) {
            const bridge = buildBridge();
            const res = await bridge.receiveMessage(intent);
            assert(!res.includes('ChatFlow'), 'Debe enrutarse a investigacion, no a ChatFlow para: ' + intent);
            assert(bridge.memoryManager.shortTerm[1].meta.isResearchReport, 'Falta meta.isResearchReport');
        }
    });

    await test('T2: Chat ordinario preservado', async () => {
        allowedCapabilities = ['WEB_SEARCH'];
        const bridge = buildBridge();
        const res = await bridge.receiveMessage('Hola, como estas hoy?');
        assert(res === 'ChatFlow', 'Debe usar el flujo normal de ChatBridge');
        assert(!bridge.memoryManager.shortTerm[1].meta.isResearchReport, 'No debe tener isResearchReport');
    });

    await test('T3: Permiso WEB_SEARCH denegado', async () => {
        allowedCapabilities = []; // Sin permisos
        const bridge = buildBridge();
        const res = await bridge.receiveMessage('Busca informacion sobre test');
        assert(res.includes('[INVESTIGACIÓN FALLIDA]') || res.includes('OFFLINE_ONLY'), 'Debe fallar al requerir web sin permiso');
        assert(!res.includes('A snippet'), 'No debe incluir contenido web');
    });

    await test('T4: Permiso KNOWLEDGE_INGEST_UNVERIFIED denegado', async () => {
        allowedCapabilities = ['WEB_SEARCH']; // Puede buscar, pero no ingestar
        const bridge = buildBridge();
        const res = await bridge.receiveMessage('Busca informacion sobre test');
        assert(res.includes('[INVESTIGACIÓN COMPLETA]'), 'La investigacion debe completarse');
        assert(!res.includes('Estado Ingesta:'), 'La ingestion debe omitirse (SKIPPED)');
    });

    await test('T5: Permiso concedido -> Ingestion y Web funcionan', async () => {
        allowedCapabilities = ['WEB_SEARCH', 'KNOWLEDGE_INGEST_UNVERIFIED']; 
        const bridge = buildBridge();
        const res = await bridge.receiveMessage('Busca informacion sobre test');
        assert(res.includes('Estado Ingesta: STORED_UNVERIFIED'), 'La ingestion debe proceder (STORED_UNVERIFIED)');
        assert(res.includes('content longer than 10 chars'), 'Debe procesar la evidencia web con el contenido correcto');
    });

    console.log('\n--- Resultados ---');
    console.log('PASS: ' + passed + '   FAIL: ' + failed);
    if (failed > 0) { process.exit(1); } else { console.log('Todas las pruebas pasaron.\n'); }
}
runAll().catch(err => { console.error(err); process.exit(1); });