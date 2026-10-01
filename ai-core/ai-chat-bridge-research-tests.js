/**
 * ai-chat-bridge-research-tests.js -- Guardian Step 4
 * Ejecutar con: node ai-core/ai-chat-bridge-research-tests.js
 */
"use strict";

const fs = require('fs');

global.window = { AI_CORE: {} };

// Mock dependencies required by ChatBridge
window.AI_CORE.IdentityManager = class { 
    getBotIdentity() { return {}; }
    getCurrentUser(u) { return u || { roles: ['user'] }; } 
};
window.AI_CORE.PermissionManager = class { getGovernanceRules() { return { allowedCapabilities: ['WEB_SEARCH'] }; } };
window.AI_CORE.LocalStorageKnowledgeStore = class { 
    async load() { return []; } 
    async save() {} 
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
    async assembleContext() {} 
    setKnowledge() {} setCreatorKnowledge() {} 
    buildContext() { return {}; } 
};
window.AI_CORE.LocalMockProvider = class { async generate() { return "Respuesta generica"; } };
window.AI_CORE.ReasoningEngine = class { async reason() { return { uncertainty: { level: 'LOW' } }; } };
window.AI_CORE.PersonalityEngine = class { applyPersonality() { return { conversationMode: 'CASUAL' }; } };

// Research modules
window.AI_CORE.OfflineResolver = class { async query() { return { status: 'INSUFFICIENT', results: [], staleDocs: [], coverage: 0 }; } };
window.AI_CORE.WebFetcher = class {};
window.AI_CORE.DdgWebFetcher = class { async search() { return []; } async fetchPage() { return {}; } };
window.AI_CORE.KnowledgeIngestionEngine = class { async ingest() { return { status: 'STORED' }; } };

// Stub ResearchEngine to verify routing
let lastTask = null;
let lastContext = null;
let throwError = false;
window.AI_CORE.ResearchEngine = class {
    constructor() {}
    async investigate(task, context) {
        if (throwError) throw new Error("Simulated research error");
        lastTask = task;
        lastContext = context;
        return {
            status: 'COMPLETED',
            conclusion: 'Test conclusion',
            confidence: 0.9,
            contradictions: [],
            localResultsUsed: [],
            webResultsUsed: ['fake_web_result'],
            limitations: [],
            ingestStatus: 'SKIPPED'
        };
    }
};

const code = fs.readFileSync('./ai-core/ai-chat-bridge.js', 'utf8');
eval('(function(window){ ' + code + ' })(global.window)');
const { ChatBridge } = global.window.AI_CORE;

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
    console.log('\n=== Guardian Step 4: Chat Bridge Research Integration Tests ===\n');

    await test('T1: Mensaje normal -> Flujo regular de chat', async () => {
        lastTask = null;
        const bridge = new ChatBridge();
        const res = await bridge.receiveMessage('Hola, ¿como estas?');
        assert(res === 'Respuesta generica', 'Debe usar flujo regular');
        assert(lastTask === null, 'No debio llamar a ResearchEngine');
        assert(bridge.memoryManager.shortTerm.length === 2, 'Debe guardar turnos en memoria');
    });

    await test('T2: Mensaje de investigacion -> Flujo de investigacion', async () => {
        lastTask = null;
        const bridge = new ChatBridge();
        const res = await bridge.receiveMessage('Investiga sobre redes neuronales');
        assert(lastTask === 'Investiga sobre redes neuronales', 'Debio llamar a ResearchEngine con la tarea');
        assert(res.includes('[INVESTIGACIÓN COMPLETA]'), 'La respuesta debe ser el reporte de investigacion');
        assert(res.includes('Test conclusion'), 'Debe incluir conclusion');
        
        // Check memory
        const memory = bridge.memoryManager.shortTerm;
        const lastTurn = memory[memory.length - 1];
        assert(lastTurn.meta && lastTurn.meta.isResearchReport, 'Debe guardar metadata isResearchReport');
    });

    await test('T3: Manejo de error en investigacion', async () => {
        throwError = true;
        const bridge = new ChatBridge();
        const res = await bridge.receiveMessage('Investigate this error');
        assert(res.includes('[ERROR DE INVESTIGACIÓN]'), 'Debe capturar el error y devolver formato error');
        assert(res.includes('Simulated research error'), 'Debe incluir el mensaje de error');
        
        // Check memory
        const memory = bridge.memoryManager.shortTerm;
        const lastTurn = memory[memory.length - 1];
        assert(lastTurn.meta && lastTurn.meta.isError, 'Debe guardar metadata isError');
        throwError = false;
    });

    console.log('\n--- Resultados ---');
    console.log('PASS: ' + passed + '   FAIL: ' + failed);
    if (failed > 0) { process.exit(1); } else { console.log('Todas las pruebas pasaron.\n'); }
}
runAll().catch(err => { console.error(err); process.exit(1); });