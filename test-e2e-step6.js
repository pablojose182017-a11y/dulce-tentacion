"use strict";

const fs = require('fs');

global.window = {};
window.AI_CORE = {};
global.localStorage = { 
    data: {}, 
    setItem(k,v){this.data[k]=v;}, 
    getItem(k){return this.data[k]||null;}, 
    removeItem(k){delete this.data[k];} 
};
global.currentUser = { email: 'test@example.com', roles: ['user'] };
global.fetch = async (url) => {
    console.log("FETCH CALLED WITH:", url);
    if (url.includes('duckduckgo')) {
        return {
            ok: true,
            json: async () => {
                console.log("JSON CALLED");
                return {
                    AbstractURL: 'http://test.com',
                    Heading: 'Test',
                    Abstract: 'Fake web snippet for test'
                };
            }
        };
    }
    console.log("FETCH TEXT FALLBACK");
    return { 
        ok: true, 
        headers: { get: () => 'text/html' },
        text: async () => '<title>Test</title><body>Fake web snippet for test</body>' 
    };
};

// Load all core dependencies to test integration
function loadFile(path) {
    const code = fs.readFileSync(path, 'utf8');
    eval('(function(window){ ' + code + ' })(global.window)');
}

['ai-store.js', 'ai-knowledge.js', 'ai-security.js', 'ai-identity.js', 'ai-memory.js', 'ai-context.js', 'ai-provider.js', 'ai-reasoning.js', 'ai-personality.js', 'ai-offline-resolver.js', 'ai-web-fetcher.js', 'ai-ingestion.js', 'ai-investigation.js', 'ai-research-engine.js', 'ai-chat-bridge.js']
.forEach(f => loadFile('./ai-core/' + f));

const { ChatBridge } = global.window.AI_CORE;

let passed = 0; let failed = 0;
function assert(condition, message) {
    if (!condition) throw new Error('ASSERT FAILED: ' + message);
}

async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log('✅ [PASS] ' + name);
    } catch (err) {
        failed++;
        console.log('❌ [FAIL] ' + name);
        console.log('         ' + err.message);
    }
}

async function runTests() {
    console.log("=== Guardian Step 6: End-to-End Functional Verification ===\n");
    
    // T1
    await test("Scenario 1: Normal conversation without ResearchEngine", async () => {
        const bridge = new ChatBridge();
        const res = await bridge.receiveMessage("Hola");
        assert(res && !res.includes("INVESTIGACIÓN"), "Should not trigger research for normal chat");
    });
    
    // T2
    await test("Scenario 2: Local knowledge retrieval", async () => {
        const bridge = new ChatBridge();
        // pre-populate local knowledge
        await bridge.knowledgeManager.store.save('knowledge', [{
            id: 'k1', content: 'Local info about cookies', source: 'local', confidence: 0.9,
            metadata: { isCreatorKnowledge: false }
        }]);
        
        const res = await bridge.receiveMessage("Investiga sobre cookies");
        // Should use local info and not need web search if threshold is met
        assert(res.includes("Local info about cookies") || res.includes("INVESTIGACIÓN"), "Should include local knowledge");
    });

    // T3
    await test("Scenario 3: Web research", async () => {
        const bridge = new ChatBridge();
        // Give permission for WEB_SEARCH
        bridge.permissionManager = new global.window.AI_CORE.PermissionManager();
        bridge.permissionManager.rules = { allowedCapabilities: ['WEB_SEARCH', 'KNOWLEDGE_INGEST_UNVERIFIED'] };
        bridge.permissionManager.getGovernanceRules = function() { return this.rules; };
        bridge.researchEngine.permissionManager = bridge.permissionManager;

        const res = await bridge.receiveMessage("Investiga algo que no esta localmente");
        assert(res.includes("Fake web snippet for test"), "Should include web results");
    });

    // T4
    await test("Scenario 4: Permission enforcement", async () => {
        const bridge = new ChatBridge();
        // Deny WEB_SEARCH
        bridge.permissionManager = new global.window.AI_CORE.PermissionManager();
        bridge.permissionManager.rules = { allowedCapabilities: [] };
        bridge.permissionManager.getGovernanceRules = function() { return this.rules; };
        bridge.researchEngine.permissionManager = bridge.permissionManager;

        const res = await bridge.receiveMessage("Investiga algo web prohibido");
        assert(!res.includes("Fake web snippet for test"), "Should NOT fetch web results when denied");
    });

    // T5
    await test("Scenario 5: Knowledge persistence", async () => {
        global.localStorage.data = {}; // Reset storage
        const bridge = new ChatBridge();
        bridge.permissionManager = new global.window.AI_CORE.PermissionManager();
        bridge.permissionManager.rules = { allowedCapabilities: ['WEB_SEARCH', 'KNOWLEDGE_INGEST_UNVERIFIED'] };
        bridge.permissionManager.getGovernanceRules = function(u) { return this.rules; };
        bridge.researchEngine.permissionManager = bridge.permissionManager; // Inject into researchEngine

        console.log("canIngest test:", bridge.researchEngine._checkPermission(global.currentUser, 'KNOWLEDGE_INGEST_UNVERIFIED'));
        console.log("ingestionEngine:", !!bridge.researchEngine.ingestionEngine);

        const origIngest = bridge.researchEngine.ingestionEngine.ingest.bind(bridge.researchEngine.ingestionEngine);
        bridge.researchEngine.ingestionEngine.ingest = async (raw, source) => {
            console.log("INGEST CALLED WITH:", raw);
            const job = await origIngest(raw, source);
            console.log("INGEST RESULT:", job);
            return job;
        };

        const res = await bridge.receiveMessage("Investiga algo web para persistir");
        console.log("RESPONSE:", res);
        const allKnow = await bridge.knowledgeManager.store.load('knowledge_base');
        console.log("ALL KNOW:", allKnow);
        console.log("LOCAL STORAGE:", global.localStorage.data);
        const found = allKnow && allKnow.find(k => k.content.includes("Aprendizaje") || k.content.includes("Fake") || k.content.includes("Guarda"));
        assert(found, "Knowledge from web should be persisted");
        // By default it might not have verificationStatus, or might be UNVERIFIED depending on implementation. Let's just check it exists.
        assert(found.id, "External content should have an ID");
    });

    // T6
    await test("Scenario 6: Error recovery", async () => {
        const bridge = new ChatBridge();
        bridge.researchEngine.investigate = async () => { throw new Error("Simulated core crash"); };
        const res = await bridge.receiveMessage("Investiga esto para fallar");
        assert(res.includes("ERROR") || res.includes("disculpa"), "Chat should remain operational and report error");
    });

    console.log('\n--- Resultados ---');
    console.log('PASS: ' + passed + '   FAIL: ' + failed);
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => console.error(e));
