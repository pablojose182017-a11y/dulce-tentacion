const assert = require('assert');

// Mocks
global.window = { AI_CORE: {} };

class KnowledgeStoreMock {
    async save(collection, data) {}
    async load(collection) { return []; }
}
window.AI_CORE.LocalStorageKnowledgeStore = KnowledgeStoreMock;

require('./ai-core/ai-memory');

async function runTests() {
    console.log("=== INICIANDO TESTS MEMORY EPISTEMIC RESPONSE V1 ===");
    let passed = 0; let total = 0;
    
    const test = (name, cond, msg) => {
        total++;
        if (cond) {
            console.log(`[PASS] ${name}: ${msg}`);
            passed++;
        } else {
            console.error(`[FAIL] ${name}: ${msg}`);
        }
    };

    const store = new KnowledgeStoreMock();

    // ME01
    const mem1 = new window.AI_CORE.MemoryManager(store);
    mem1.addTurn("assistant", "test");
    const turn1 = mem1.getShortTermMemory()[0];
    test("ME01", turn1.role === "assistant" && turn1.text === "test" && turn1.timestamp && !turn1.metadata, "Turno sin metadata mantiene compatibilidad.");

    // ME02
    const mem2 = new window.AI_CORE.MemoryManager(store);
    mem2.addTurn("assistant", "test 2", {
        isGeneratedResponse: true,
        personalityMode: "COLLABORATIVE",
        personalityTone: "QUALIFIED",
        personalityInitiative: "SUGGEST"
    });
    const turn2 = mem2.getShortTermMemory()[0];
    test("ME02", turn2.metadata && turn2.metadata.personalityMode === "COLLABORATIVE" && turn2.metadata.personalityTone === "QUALIFIED" && turn2.metadata.personalityInitiative === "SUGGEST", "Turno con metadata conserva mode/tone/initiative.");

    // ME03
    const mem3 = new window.AI_CORE.MemoryManager(store);
    mem3.addTurn("assistant", "test 3", {
        isGeneratedResponse: true,
        isSubjective: true,
        hadConflict: false,
        hadMissingInformation: true
    });
    const turn3 = mem3.getShortTermMemory()[0];
    test("ME03", turn3.metadata.isSubjective === true && turn3.metadata.hadConflict === false && turn3.metadata.hadMissingInformation === true, "isSubjective y banderas se conservan correctamente.");

    // ME04, ME07
    test("ME04/ME07", turn3.metadata.isCreatorKnowledge !== true, "Generated Response no se convierte en Creator Knowledge ni CREATOR_FACT.");

    // ME05, ME06
    test("ME05/ME06", turn2.metadata.personalityInitiative === "SUGGEST" && turn2.metadata.personalityTone === "QUALIFIED", "SUGGEST no es COMMAND y QUALIFIED no es CERTAIN.");

    // ME08
    const mem8 = new window.AI_CORE.MemoryManager(store);
    mem8.addTurn("assistant", "test 8", { isGeneratedResponse: true });
    const turn8 = mem8.getShortTermMemory()[0];
    test("ME08", Object.isFrozen(turn8.metadata), "Metadata es inmutable despues de almacenamiento.");

    // ME09
    const mem9 = new window.AI_CORE.MemoryManager(store);
    const metaObj = { isGeneratedResponse: true, personalityMode: "CASUAL" };
    mem9.addTurn("assistant", "t1", metaObj);
    mem9.addTurn("assistant", "t2", metaObj);
    const m9_1 = mem9.getShortTermMemory()[0];
    const m9_2 = mem9.getShortTermMemory()[1];
    test("ME09", m9_1.metadata !== m9_2.metadata, "Dos turnos consecutivos no comparten metadata mutable.");

    // ME10
    const mem10 = new window.AI_CORE.MemoryManager(store);
    mem10.addTurn("assistant", "test 10");
    const turn10 = mem10.getShortTermMemory()[0];
    test("ME10", !turn10.metadata, "Metadata ausente no se interpreta como CERTAIN.");

    // ME11
    const mem11 = new window.AI_CORE.MemoryManager(store);
    mem11.addTurn("system", "ck", {
        isCreatorKnowledge: true,
        knowledgeId: "k1",
        category: "CREATOR_FACT",
        provenance: { source: "test" },
        applicabilityScope: "GLOBAL",
        evidenceReference: { type: "test" }
    });
    const turn11 = mem11.getShortTermMemory()[0];
    test("ME11", turn11.metadata.isCreatorKnowledge === true && turn11.metadata.knowledgeId === "k1", "Creator Knowledge turns existentes conservan metadatos.");

    // ME12
    test("ME12", typeof window.AI_CORE.SecurityEngine === 'undefined', "Memory permanece sin autoridad Security/Execution.");

    // ME13
    const mem13 = new window.AI_CORE.MemoryManager(store);
    try {
        mem13.addTurn("assistant", "hibrido", {
            isGeneratedResponse: true,
            category: "CREATOR_FACT"
        });
        test("ME13", false, "Deberia haber fallado al mezclar campos.");
    } catch (e) {
        test("ME13", e.message.includes("FAIL-CLOSED"), "Intento de mezclar Generated Response + Creator Knowledge -> FAIL_CLOSED.");
    }

    console.log(`\nRESUMEN: ${passed} / ${total} TESTS EVALUADOS.`);
}

runTests();
