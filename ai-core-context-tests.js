global.window = { AI_CORE: {} };
require('./ai-core/ai-context.js');
const ContextManager = window.AI_CORE.ContextManager;

function test(name, condition, msg) {
    if (condition) {
        console.log(`[PASS] ${name}: ${msg}`);
        return true;
    } else {
        console.error(`[FAIL] ${name}: ${msg}`);
        return false;
    }
}

function runTests() {
    console.log("=== CONTEXT CONTRACT RUNTIME TESTS ===");
    let passed = 0;
    let total = 0;
    
    function runTest(name, fn, msg) {
        total++;
        try {
            if(test(name, fn(), msg)) passed++;
        } catch(e) {
            console.error(`[FAIL] ${name} threw error: ${e.message}`);
        }
    }

    // IK01
    runTest("IK01", () => {
        const ctx = new ContextManager();
        ctx.setCreatorKnowledge([{ knowledgeId: "k1", category: "CREATOR_FACT" }]);
        const built = ctx.buildContext();
        return built.blocks.creatorKnowledge && 
               built.blocks.creatorKnowledge.status === 'AVAILABLE' &&
               built.blocks.creatorKnowledge.content.length === 1 &&
               built.blocks.creatorKnowledge.content[0].knowledgeId === "k1";
    }, "Creator Knowledge entra al Context correctamente en bloque aislado.");

    // IK02
    runTest("IK02", () => {
        const ctx = new ContextManager();
        ctx.setCreatorKnowledge([
            { knowledgeId: "k1", applicabilityScope: "SCOPE_UNCERTAIN" },
            { knowledgeId: "k2", applicabilityScope: { domain: "SYS" } }
        ]);
        const built = ctx.buildContext();
        return built.blocks.creatorKnowledge.content.length === 1 &&
               built.blocks.creatorKnowledge.content[0].knowledgeId === "k2";
    }, "SCOPE_UNCERTAIN queda fuera del context assembled (HARD-DROP en profundidad).");

    // IK13
    runTest("IK13", () => {
        const ctx = new ContextManager();
        ctx.setCreatorKnowledge([]);
        const built = ctx.buildContext();
        return built.blocks.creatorKnowledge && 
               built.blocks.creatorKnowledge.status === 'MISSING';
    }, "Ausencia de CK produce bloque status: MISSING fluido.");

    // IK15
    runTest("IK15", () => {
        const ctx = new ContextManager();
        ctx.setCreatorKnowledge([{ 
            knowledgeId: "k3", 
            category: "CREATOR_PREFERENCE", 
            integrityRecord: { hash: "abc1234" } 
        }]);
        const built = ctx.buildContext();
        const content = built.blocks.creatorKnowledge.content[0];
        return content.knowledgeId === "k3" && content.integrityRecord === undefined;
    }, "Snapshot es limpio y elimina integrityRecord (evita alucinaciones).");

    console.log(`\nRESUMEN: ${passed} PASS / ${total} TOTAL`);
}

runTests();
