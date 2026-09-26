global.window = { AI_CORE: {} };
require('./ai-core/ai-creator-knowledge.js');
Object.assign(global.window.AI_CORE, require('./ai-core/ai-creator-knowledge.js'));
require('./ai-core/ai-context.js');
require('./ai-core/ai-memory.js');
require('./ai-core/ai-reasoning.js');
require('./ai-core/ai-personality.js');

// Mock Dependencies
window.AI_CORE.IdentityManager = class { getCurrentUser() { return { id: 1 }; } getBotIdentity() { return {}; } };
window.AI_CORE.PermissionManager = class { getGovernanceRules() { return {}; } };
window.AI_CORE.LocalStorageKnowledgeStore = class { load() { return []; } save() {} };
window.AI_CORE.KnowledgeManager = class { 
    constructor() {} 
    async search() { 
        return [{ document: { id: "generic1", content: "Generic Info" } }]; 
    } 
};
window.AI_CORE.LocalMockProvider = class { async generate() { return "Response"; } };

require('./ai-core/ai-chat-bridge.js');

function test(name, condition, msg) {
    if (condition) {
        console.log(`[PASS] ${name}: ${msg}`);
        return true;
    } else {
        console.error(`[FAIL] ${name}: ${msg}`);
        return false;
    }
}

async function runTests() {
    console.log("=== CHATBRIDGE CONTRACT RUNTIME TESTS ===");
    let passed = 0;
    let total = 0;
    
    async function runTest(name, fn, msg) {
        total++;
        try {
            if(test(name, await fn(), msg)) passed++;
        } catch(e) {
            console.error(`[FAIL] ${name} threw error: ${e.message}`);
        }
    }

    // IK17
    await runTest("IK17", async () => {
        const bridge = new window.AI_CORE.ChatBridge();
        return bridge.creatorKnowledgeManager !== null && bridge.creatorKnowledgeManager.isReady === true;
    }, "ChatBridge inicializa CreatorKnowledgeManager sin interferir con subsistemas.");

    // IK18
    await runTest("IK18", async () => {
        // Corrompemos intencionalmente la rehidratación
        const backupRehydrate = window.AI_CORE.CreatorKnowledgeManager.prototype.rehydrate;
        window.AI_CORE.CreatorKnowledgeManager.prototype.rehydrate = function() {
            throw new Error("FAIL-CLOSED: Integrity Fingerprint Mismatch");
        };

        try {
            const bridge = new window.AI_CORE.ChatBridge();
            // bridge debe tragar el error y degradarse (manager null)
            const isDegraded = bridge.creatorKnowledgeManager === null;

            // Simulamos receiveMessage para comprobar si sigue funcionando el flujo general
            // interceptamos reasoningEngine.reason
            let receivedContext = null;
            bridge.reasoningEngine.reason = async function(ctx) {
                receivedContext = ctx.assembledContext;
                return { authorizationRequirement: { required: false }, uncertainty: { level: 'LOW' }, hypotheses: [] }; // mock response fix
            };

            await bridge.receiveMessage("Hello", null, null);

            return isDegraded && 
                   receivedContext.blocks.creatorKnowledge.status === 'MISSING' &&
                   receivedContext.blocks.knowledge.status === 'AVAILABLE';
        } finally {
            window.AI_CORE.CreatorKnowledgeManager.prototype.rehydrate = backupRehydrate; // restaurar siempre
        }
    }, "Falla en rehidratación degrada CK (MISSING) pero flujo genérico continúa.");

    // IK19 & IK20
    await runTest("IK19_IK20", async () => {
        const bridge = new window.AI_CORE.ChatBridge();
        
        // Inyectamos CK manualmente
        bridge.creatorKnowledgeManager.insertAtomic([{
            category: "CREATOR_PREFERENCE",
            statement: "Regla CK",
            applicabilityScope: { domain: "TEXT" },
            provenance: { source: "CREATOR" }
        }]);

        let receivedContext = null;
        bridge.reasoningEngine.reason = async function(ctx) {
            receivedContext = ctx.assembledContext;
                return { authorizationRequirement: { required: false }, uncertainty: { level: 'LOW' }, hypotheses: [] }; // mock response fix
        };

        await bridge.receiveMessage("test", null, null);

        const genericBlock = receivedContext.blocks.knowledge;
        const ckBlock = receivedContext.blocks.creatorKnowledge;

        const hasGeneric = genericBlock && genericBlock.status === "AVAILABLE" && genericBlock.content[0].id === "generic1";
        const hasCK = ckBlock && ckBlock.status === "AVAILABLE" && ckBlock.content[0].statement === "Regla CK";
        
        return hasGeneric && hasCK && 
               !genericBlock.content.some(d => d.statement === "Regla CK") &&
               !ckBlock.content.some(d => d.id === "generic1");
    }, "Recuperación exitosa preservando separación estricta entre Knowledge genérico y Creator Knowledge.");

    console.log(`\nRESUMEN: ${passed} PASS / ${total} TOTAL`);
}

runTests();
