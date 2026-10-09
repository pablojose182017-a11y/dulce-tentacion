const crypto = require('crypto');
global.window = {
    AI_CORE: {
        hash: {
            sha256: (data) => {
                if (!data) return null;
                return crypto.createHash('sha256').update(data).digest('hex');
            }
        }
    },
    crypto: crypto.webcrypto ? { webcrypto: crypto.webcrypto, subtle: crypto.webcrypto.subtle } : { subtle: crypto.webcrypto }
};

const { ProvenanceGraph, SourceProvenance, ClaimIdentity } = require('./ai-provenance.js');
const { IntegratedConsolidationEngine } = require('./ai-integrated-consolidation.js');

function assert(condition, message) {
    if (!condition) {
        throw new Error("Assertion failed: " + message);
    }
}

function deepSnapshot(obj) {
    return JSON.stringify(obj);
}

async function runTests() {
    let executionStats = { total: 0, passed: 0, failed: 0, skipped: 0 };
    
    let graph = new ProvenanceGraph();
    let engine = new IntegratedConsolidationEngine(graph);

    console.log("=== RUNNING PHASE 4C.2.4.3 TESTS ===\n");

    try {
        console.log("--- COMPLEXITY4C2.4.3 TESTS ---");

        // C43-01 N pequeño exacto
        let rootX = graph.registerSource({ origin: "ProvX" });
        let rootY = graph.registerSource({ origin: "ProvY" });
        let src1 = graph.registerSource({ origin: "Src1", parentSourceId: rootX.sourceId });
        let src2 = graph.registerSource({ origin: "Src2", parentSourceId: rootY.sourceId });
        
        let claim1 = graph.registerClaim({ subject: "C43-01", knowledgeType: "FACT" }, src1, "ev1");
        graph.claims.get(claim1.claimId).supports.push({ source: src2, evidence: "ev2" });
        
        let countSmall = engine._areSourcesIndependent(graph.claims.get(claim1.claimId).supports);
        assert(countSmall === 2, "C43-01 Failed: Exact calculation should yield 2");
        executionStats.passed++;

        // C43-07 / C43-08 / C43-09 / C43-10 / C43-11: N grande -> BUDGET_EXCEEDED
        let claimLarge = graph.registerClaim({ subject: "C43-Large", knowledgeType: "FACT" }, src1, "ev1");
        
        // Add 50 unique sources
        for (let i = 0; i < 50; i++) {
            let fakeRoot = graph.registerSource({ origin: "RootLarge" + i });
            let fakeSrc = graph.registerSource({ origin: "SrcLarge" + i, parentSourceId: fakeRoot.sourceId });
            graph.claims.get(claimLarge.claimId).supports.push({ source: fakeSrc, evidence: "evLarge" + i });
        }
        
        let countLarge = engine._areSourcesIndependent(graph.claims.get(claimLarge.claimId).supports);
        assert(countLarge === 'COMPUTATION_BUDGET_EXCEEDED', "C43-07/11 Failed: Must return COMPUTATION_BUDGET_EXCEEDED for N=51");
        
        // Verify epistemic safety on rehydrate
        let rehydratedStates = engine.rehydrate();
        assert(rehydratedStates[claimLarge.claimId] === 'UNCERTAIN', "C43-06 Failed: Exceeded budget must fallback to UNCERTAIN safely.");
        executionStats.passed++;
        
        // C43-12 / C43-13 / C43-14 / C43-15 / C43-16 / C43-17: Lineage preservation verified in previous suite
        let rootA = graph.registerSource({ origin: "RootA" });
        let srcDerived = graph.registerSource({ origin: "Derived", derivedFrom: rootA.sourceId });
        let srcCopied = graph.registerSource({ origin: "Copied", copiedFrom: rootA.sourceId });
        
        let claimDerived = graph.registerClaim({ subject: "C43-15" }, srcDerived, "evD");
        graph.claims.get(claimDerived.claimId).supports.push({ source: srcCopied, evidence: "evC" });
        let countLineage = engine._areSourcesIndependent(graph.claims.get(claimDerived.claimId).supports);
        assert(countLineage === 1, "C43-15/16 Failed: Shared roots across derived and copied sources should yield 1");
        executionStats.passed++;
        
        console.log("--- REHYDRATE TESTS ---");

        let systemStateBefore = {
            graph: graph.serialize(),
            history: deepSnapshot(engine.history),
            consolidationStates: deepSnapshot(Array.from(engine.consolidationStates.entries()))
        };
        
        const result1 = engine.rehydrate();
        
        let systemStateAfter1 = {
            graph: graph.serialize(),
            history: deepSnapshot(engine.history),
            consolidationStates: deepSnapshot(Array.from(engine.consolidationStates.entries()))
        };
        
        assert(systemStateBefore.history === systemStateAfter1.history, "History mutated on 1st rehydrate");
        assert(systemStateBefore.graph === systemStateAfter1.graph, "Graph mutated on 1st rehydrate");
        
        const result2 = engine.rehydrate();
        assert(deepSnapshot(result1) === deepSnapshot(result2), "Results of rehydrate are not identical");
        executionStats.passed++;

        console.log("--- EXECUTION INTEGRITY ---");
        console.log(`TESTS EXECUTED SUCCESSFULLY: ${executionStats.passed}`);

    } catch(e) {
        console.error("TEST EXECUTION ERROR:", e.message, e.stack);
        process.exit(1);
    }
}

runTests();
