const { ProvenanceGraph, SourceProvenance, ClaimIdentity } = require('./ai-provenance.js');
const { IntegratedConsolidationEngine, EvidenceValidator } = require('./ai-integrated-consolidation.js');
const crypto = require('crypto');

function assert(condition, message) {
    if (!condition) {
        throw new Error("Assertion failed: " + message);
    }
}

async function runTests() {
    let graph = new ProvenanceGraph();
    let engine = new IntegratedConsolidationEngine(graph);

    console.log("=== RUNNING PHASE 4C.2.4 TESTS ===\n");

    try {
        // MULTIPARENT4C2.4
        console.log("Running MULTIPARENT4C2.4 / LINEAGE4C2.4 tests...");
        
        let rootA = graph.registerSource({ origin: "ProviderA", content: "Fact A" });
        let rootB = graph.registerSource({ origin: "ProviderB", content: "Fact B" });
        let rootC = graph.registerSource({ origin: "ProviderC", content: "Fact C" });
        
        // Multi-parent inference (Legacy string vs array representation)
        let inf1 = graph.registerSource({ 
            origin: "AI_INFERENCE",
            content: "Derived from A and B",
            parentSourceIds: [rootA.sourceId, rootB.sourceId]
        });
        
        // M24-01 dos padres
        assert(graph._getCausalParentIds(inf1).length === 2, "inf1 should have 2 parents");

        // L24-03 copiedFrom + derivedFrom (Hidden connector attack)
        let hiddenAttack = graph.registerSource({
            origin: "ATTACKER",
            content: "Derived from B but pretending to copy C",
            copiedFrom: rootC.sourceId,
            derivedFrom: rootB.sourceId
        });
        let hiddenParents = graph._getCausalParentIds(hiddenAttack);
        assert(hiddenParents.includes(rootB.sourceId) && hiddenParents.includes(rootC.sourceId), "L24-03 Failed: hidden connector wasn't resolved");

        // Ancestry resolution
        let supportRoots = Array.from(graph._findRootSources(hiddenAttack));
        let rootIds = supportRoots.map(r => r.sourceId);
        assert(rootIds.includes(rootB.sourceId) && rootIds.includes(rootC.sourceId), "L24-02 Failed: multi-parent root search failed");

        console.log("MULTIPARENT & LINEAGE passed.\n");

        // EVIDENCE4C2.4
        console.log("Running EVIDENCE4C2.4 tests...");
        let claim1 = graph.registerClaim(
            { subject: "X", predicate: "is", objectValue: "Y", knowledgeType: "FACT" },
            rootA,
            null // null evidence
        );
        let claimRecord = graph.claims.get(claim1.claimId);
        claimRecord.supports.push({ source: rootB, evidence: { broken: true } }); // Broken evidence
        claimRecord.supports.push({ source: rootC, evidence: "Valid string evidence" }); // Valid evidence
        
        let validRoots = engine._areSourcesIndependent(claimRecord.supports);
        assert(validRoots === 1, "E24-02/E24-04 Failed: Only one valid evidence should count. Counted: " + validRoots);
        
        await engine.consolidateClaim(claim1.claimId);
        let state1 = engine.getConsolidatedState(claim1.claimId);
        assert(state1 === 'SUPPORTED' || state1 === 'UNCERTAIN', "E24-07 Failed: Should not be CONSOLIDATED because valid independent root count is 1");
        
        console.log("EVIDENCE passed.\n");

        // REHYDRATE4C2.4
        console.log("Running REHYDRATE4C2.4 tests...");
        let beforeHistoryLen = engine.history.length;
        
        await engine.rehydrate();
        let after1Len = engine.history.length;
        assert(beforeHistoryLen === after1Len, "R24-02 Failed: history length mutated on 1st rehydrate");
        
        await engine.rehydrate();
        await engine.rehydrate();
        await engine.rehydrate();
        await engine.rehydrate();
        
        let after5Len = engine.history.length;
        assert(beforeHistoryLen === after5Len, "R24-04 Failed: history length mutated on 5th rehydrate");
        
        console.log("REHYDRATE passed.\n");

        console.log("All tests completed successfully.");
    } catch(e) {
        console.error("Test failed:", e.message);
        process.exit(1);
    }
}

runTests();
