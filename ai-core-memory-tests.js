global.window = { AI_CORE: {} };
require('./ai-core/ai-memory.js');
const MemoryManager = window.AI_CORE.MemoryManager;

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
    console.log("=== MEMORY CONTRACT RUNTIME TESTS ===");
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

    const getManager = () => new MemoryManager(null, 'test_mem');

    // MK01
    runTest("MK01", () => {
        const mem = getManager();
        mem.addTurn("user", "Hello World");
        const turns = mem.getShortTermMemory();
        return turns.length === 1 && turns[0].role === "user" && turns[0].text === "Hello World" && !turns[0].metadata;
    }, "Turno normal sigue funcionando correctamente.");

    // MK02
    runTest("MK02", () => {
        const mem = getManager();
        mem.addTurn("assistant", "I see", {
            isCreatorKnowledge: true,
            knowledgeId: "k1",
            category: "CREATOR_PREFERENCE",
            provenance: { source: "CREATOR" },
            applicabilityScope: { domain: "SYS" }
        });
        const turns = mem.getShortTermMemory();
        const m = turns[0].metadata;
        return m && m.isCreatorKnowledge && m.knowledgeId === "k1" && m.category === "CREATOR_PREFERENCE";
    }, "Creator Knowledge conserva metadata completa.");

    // MK03
    runTest("MK03", () => {
        const mem = getManager();
        let threw = false;
        try {
            mem.addTurn("assistant", "Fail", {
                isCreatorKnowledge: true,
                category: "CREATOR_PREFERENCE",
                provenance: { source: "CREATOR" },
                applicabilityScope: { domain: "SYS" }
            });
        } catch (e) {
            if (e.message.includes("FAIL-CLOSED: Missing knowledgeId")) threw = true;
        }
        return threw && mem.getShortTermMemory().length === 0;
    }, "Falta knowledgeId -> fail-closed.");

    // MK04
    runTest("MK04", () => {
        const mem = getManager();
        let threw = false;
        try {
            mem.addTurn("assistant", "Fail", {
                isCreatorKnowledge: true,
                knowledgeId: "k2",
                provenance: { source: "CREATOR" },
                applicabilityScope: { domain: "SYS" }
            });
        } catch (e) {
            if (e.message.includes("FAIL-CLOSED: Missing category")) threw = true;
        }
        return threw && mem.getShortTermMemory().length === 0;
    }, "Falta category -> fail-closed.");

    // MK05
    runTest("MK05", () => {
        const mem = getManager();
        let threw = false;
        try {
            mem.addTurn("assistant", "Fail", {
                isCreatorKnowledge: true,
                knowledgeId: "k3",
                category: "CREATOR_PREFERENCE",
                applicabilityScope: { domain: "SYS" }
            });
        } catch (e) {
            if (e.message.includes("FAIL-CLOSED: Missing provenance")) threw = true;
        }
        return threw && mem.getShortTermMemory().length === 0;
    }, "Falta provenance -> fail-closed.");

    // MK06
    runTest("MK06", () => {
        const mem = getManager();
        let threw = false;
        try {
            mem.addTurn("assistant", "Fail", {
                isCreatorKnowledge: true,
                knowledgeId: "k4",
                category: "CREATOR_PREFERENCE",
                provenance: { source: "CREATOR" }
            });
        } catch (e) {
            if (e.message.includes("FAIL-CLOSED: Missing applicabilityScope")) threw = true;
        }
        return threw && mem.getShortTermMemory().length === 0;
    }, "Falta applicabilityScope -> fail-closed.");

    // MK07
    runTest("MK07", () => {
        const mem = getManager();
        let threw = false;
        try {
            mem.addTurn("assistant", "Fail", {
                isCreatorKnowledge: true,
                knowledgeId: "k5",
                category: "CREATOR_FACT",
                provenance: { source: "CREATOR" },
                applicabilityScope: { domain: "SYS" }
            });
        } catch (e) {
            if (e.message.includes("FAIL-CLOSED: CREATOR_FACT requires evidenceReference")) threw = true;
        }
        return threw && mem.getShortTermMemory().length === 0;
    }, "CREATOR_FACT sin evidenceReference -> fail-closed.");

    // MK08
    runTest("MK08", () => {
        const mem = getManager();
        const inputMeta = {
            isCreatorKnowledge: true,
            knowledgeId: "k6",
            category: "CREATOR_PREFERENCE",
            provenance: { source: "CREATOR" },
            applicabilityScope: { domain: "SYS" }
        };
        mem.addTurn("assistant", "Frozen", inputMeta);
        
        // Mutar el input no debe afectar el almacenado
        inputMeta.category = "HACKED_CATEGORY";
        inputMeta.applicabilityScope.domain = "HACKED_DOMAIN";
        
        const stored = mem.getShortTermMemory()[0].metadata;
        if (stored.category !== "CREATOR_PREFERENCE" || stored.applicabilityScope.domain !== "SYS") return false;

        // Mutar el output devuelto no debe ser posible (lanzará error en strict o fallará silente)
        try {
            stored.category = "HACKED2";
        } catch(e) {}

        return stored.category === "CREATOR_PREFERENCE";
    }, "Metadata no puede mutar el estado almacenado (Inmutabilidad).");

    // MK09
    runTest("MK09", () => {
        const mem = getManager();
        mem.addTurn("user", "Pregunta normal");
        mem.addTurn("assistant", "Respuesta", { isCreatorKnowledge: true, knowledgeId: "k7", category: "CREATOR_PREFERENCE", provenance: { source: "CREATOR" }, applicabilityScope: { domain: "SYS" }});
        mem.addTurn("user", "Otra normal", { context: "generic" });
        const turns = mem.getShortTermMemory();
        return turns.length === 3 
            && !turns[0].metadata
            && turns[1].metadata.isCreatorKnowledge === true
            && turns[2].metadata.context === "generic";
    }, "Mezcla de turnos normales y Creator Knowledge coexisten sin mezclar contratos.");

    // MK10
    runTest("MK10", () => {
        const mem = getManager();
        mem.addTurn("assistant", "Belief", { isCreatorKnowledge: true, knowledgeId: "k8", category: "CREATOR_BELIEF", provenance: { source: "CREATOR" }, applicabilityScope: { domain: "SYS" }});
        return mem.getShortTermMemory()[0].metadata.category === "CREATOR_BELIEF";
    }, "BELIEF permanece BELIEF sin transformaciones.");

    // MK11
    runTest("MK11", () => {
        const mem = getManager();
        mem.addTurn("assistant", "Hypothesis", { isCreatorKnowledge: true, knowledgeId: "k9", category: "CREATOR_HYPOTHESIS", provenance: { source: "CREATOR" }, applicabilityScope: { domain: "SYS" }});
        return mem.getShortTermMemory()[0].metadata.category === "CREATOR_HYPOTHESIS";
    }, "HYPOTHESIS permanece HYPOTHESIS.");

    // MK12
    runTest("MK12", () => {
        const mem = getManager();
        mem.addTurn("assistant", "Pref", { isCreatorKnowledge: true, knowledgeId: "k10", category: "CREATOR_PREFERENCE", provenance: { source: "CREATOR" }, applicabilityScope: { domain: "SYS" }});
        return mem.getShortTermMemory()[0].metadata.category === "CREATOR_PREFERENCE";
    }, "PREFERENCE permanece PREFERENCE.");

    // MK13
    runTest("MK13", () => {
        const mem = getManager();
        mem.addTurn("assistant", "Exp", { isCreatorKnowledge: true, knowledgeId: "k11", category: "CREATOR_EXPECTATION", provenance: { source: "CREATOR" }, applicabilityScope: { domain: "SYS" }});
        return mem.getShortTermMemory()[0].metadata.category === "CREATOR_EXPECTATION";
    }, "EXPECTATION permanece EXPECTATION.");

    console.log(`\nRESUMEN: ${passed} PASS / ${total} TOTAL`);
}

runTests();
