const { CreatorKnowledgeStore, CreatorKnowledgeManager, deepClone, deepFreeze } = require('./ai-core/ai-creator-knowledge.js');
const { canonicalizeJSON } = require('./ai-core/ai-creator-knowledge.js'); // Assuming we'd export it if we needed to, but we'll test via side effects mostly, or we can just test the public APIs. Wait, canonicalizeJSON isn't exported. Let's just write tests for the manager which implicitly tests canonicalization by ensuring different sets don't collide.

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
    console.log("=== CREATOR KNOWLEDGE RUNTIME TESTS ===");
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

    const store = new CreatorKnowledgeStore();
    const manager = new CreatorKnowledgeManager(store);

    // T00
    runTest("T00", () => {
        manager.rehydrate();
        return manager.isReady;
    }, "Rehydration inicial exitosa (vacía).");

    // T01 - Registro válido
    runTest("T01", () => {
        manager.insertAtomic([{
            category: "CREATOR_PREFERENCE",
            statement: "Usa bullets",
            applicabilityScope: { domain: "TEXT" },
            provenance: { source: "CREATOR" }
        }]);
        const records = manager.retrieveActive();
        return records.length === 1 && records[0].statement === "Usa bullets";
    }, "Inserta registro válido correctamente.");

    // T02 - Registro inválido (falta provenance)
    runTest("T02", () => {
        let threw = false;
        try {
            manager.insertAtomic([{
                category: "CREATOR_PREFERENCE",
                statement: "Bad record",
                applicabilityScope: { domain: "TEXT" }
            }]);
        } catch (e) {
            if (e.message.includes("Invalid structure") || e.message.includes("Missing Provenance")) {
                threw = true;
            }
        }
        return threw;
    }, "Falla cerradamente ante registro incompleto en RAM (falta provenance).");

    // T03 - Scope global inválido -> SCOPE_UNCERTAIN
    runTest("SCOPE-WILDCARD-01", () => {
        manager.insertAtomic([{
            category: "CREATOR_PREFERENCE",
            statement: "Regla global",
            applicabilityScope: { domain: "*" },
            provenance: { source: "CREATOR" }
        }]);
        const records = manager.retrieveActive();
        return !records.some(r => r.statement === "Regla global");
    }, "Scope * fuerza SCOPE_UNCERTAIN y HARD-DROP en retrieval.");

    runTest("SCOPE-UNKNOWN-01", () => {
        manager.insertAtomic([{
            category: "CREATOR_PREFERENCE",
            statement: "Regla fake",
            applicabilityScope: { domain: "SYSTEM_ALL" },
            provenance: { source: "CREATOR" }
        }]);
        const records = manager.retrieveActive();
        return !records.some(r => r.statement === "Regla fake");
    }, "Scope desconocido fuera de vocabulario fuerza SCOPE_UNCERTAIN.");

    runTest("SCOPE-ENUM-01", () => {
        manager.insertAtomic([{
            category: "CREATOR_PREFERENCE",
            statement: "Regla financial",
            applicabilityScope: { domain: "FINANCIAL", context: "REPORTING" },
            provenance: { source: "CREATOR" }
        }]);
        const records = manager.retrieveActive();
        return records.some(r => r.statement === "Regla financial");
    }, "Acepta Scope Enum válido (FINANCIAL/REPORTING).");

    // T04 - Epistemic Escalation
    runTest("EVIDENCE-MISSING", () => {
        let threw = false;
        try {
            manager.insertAtomic([{
                category: "CREATOR_FACT",
                statement: "Soy el admin",
                applicabilityScope: { domain: "SYS" },
                provenance: { source: "CREATOR" }
            }]);
        } catch(e) {
            if (e.message.includes("evidenceReference")) threw = true;
        }
        return threw;
    }, "Prohíbe CREATOR_FACT sin evidenceReference.");

    runTest("EVIDENCE-CIRCULAR", () => {
        let threw = false;
        try {
            manager.insertAtomic([{
                category: "CREATOR_FACT",
                statement: "La tierra es plana",
                applicabilityScope: { domain: "SYS" },
                provenance: { source: "CREATOR" },
                evidenceReference: { resourceId: "123", origin: "CREATOR_BELIEF", fingerprint: "abc" }
            }]);
        } catch(e) {
            if (e.message.includes("Circular epistemic")) threw = true;
        }
        return threw;
    }, "Prohíbe CREATOR_FACT si la evidencia proviene de CREATOR_BELIEF.");

    // T05 - Inmutabilidad (Deep Freeze)
    runTest("T05", () => {
        const records = manager.retrieveActive();
        const rec = records.find(r => r.statement === "Usa bullets");
        if(!rec) return false;
        try {
            rec.applicabilityScope.domain = "HACKED";
            return false;
        } catch(e) {
            return true;
        }
    }, "Los objetos recuperados son inmutables (Deep Frozen).");

    // T06 - Rehydration Fail-Closed
    runTest("T06", () => {
        store.disk[0].statement = "HACKED STATEMENT";
        const newManager = new CreatorKnowledgeManager(store);
        let threw = false;
        try {
            newManager.rehydrate();
        } catch(e) {
            if (e.message.includes("Integrity Fingerprint Mismatch")) threw = true;
        }
        return threw;
    }, "Rehidratación falla cerradamente si el JSON persistido es alterado.");

    store.disk[0].statement = "Usa bullets"; // Restauramos

    // T07 - Atomicidad y Supersedes
    runTest("T07", () => {
        const diskRead = store.readAllPhysical();
        const originalId = diskRead.find(r => r.statement === "Usa bullets").knowledgeId;
        manager.insertAtomic([{
            category: "CREATOR_PREFERENCE",
            statement: "No uses bullets",
            applicabilityScope: { domain: "TEXT" },
            provenance: { source: "CREATOR" },
            supersedesId: originalId
        }]);
        
        const records = manager.retrieveActive();
        const activeRecs = records.filter(r => r.statement === "No uses bullets" || r.statement === "Usa bullets");
        return activeRecs.length === 1 && activeRecs[0].statement === "No uses bullets";
    }, "Atomic Insert + Supersedes funciona correctamente.");

    // T08 - Crash recovery
    runTest("T08", () => {
        const txId = store.beginTransaction();
        store.prepare(txId, [{
            category: "CREATOR_PREFERENCE",
            statement: "Fantasma",
            knowledgeId: "ghost_123"
        }]);
        store.abort(txId);
        const disk = store.readAllPhysical();
        return !disk.some(r => r.knowledgeId === "ghost_123");
    }, "Crash o Abort antes del commit no persiste estado parcial.");

    console.log(`\nRESUMEN: ${passed} / ${total} TESTS EVALUADOS.`);
}

if (typeof module !== 'undefined' && require.main === module) {
    runTests();
}
