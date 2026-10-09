const { SemanticOrchestrator, SemanticProviderRegistry, Level1Provider, Level0Provider } = require('./ai-semantic.js');
const { ProvenanceGraph } = require('./ai-provenance.js');
const { IntegratedConsolidationEngine, SemanticConsolidationPipeline } = require('./ai-integrated-consolidation.js');

function assert(condition, testName) {
    console.log(`${testName}: ${condition ? 'PASS' : 'FAIL'}`);
    if (!condition) throw new Error(`Test failed: ${testName}`);
}

async function runTests() {
    console.log("=== INICIANDO TESTS DE PURIFICACIÓN FINAL 4C.2.3 ===");

    let graph = new ProvenanceGraph();
    let engine = new IntegratedConsolidationEngine(graph);

    // ============================================
    // VULN-01: ECHO CHAMBER / ROOT LINEAGE
    // ============================================
    
    // Create Root A
    let sA = graph.registerSource({sourceId: 'SA'});
    
    // Create B derived from A, C transformed from A
    let sB = graph.registerSource({sourceId: 'SB', derivedFrom: 'SA'});
    let sC = graph.registerSource({sourceId: 'SC', transformedFrom: 'SA'});

    // Create D copied from C
    let sD = graph.registerSource({sourceId: 'SD', copiedFrom: 'SC'});

    // Attempt to consolidate B + C + D
    // We register the claim with B, then directly add C and D bypassing freeze for test or using registerClaim multiple times?
    // Since ProvenanceGraph.registerClaim doesn't append if it exists (actually wait, let's see)
    // Actually I can just mock a claim directly into the Map since it's a test.
    let claimLineage = {
        claimId: 'testLineage',
        claimProposal: { intent: 'REPORT', knowledgeType: 'FACT', subject: 'LineageTest' },
        supports: [
            { source: sB, evidence: [] },
            { source: sC, evidence: [] },
            { source: sD, evidence: [] }
        ]
    };
    graph.claims.set('testLineage', claimLineage);

    let stateLineage = await engine.consolidateClaim('testLineage');
    // Since all originate from A, independence count is 1. Thus it should be SUPPORTED, not CONSOLIDATED
    assert(stateLineage === 'SUPPORTED', 'LINEAGE4C2.3-01 (Derived sources do not inflate corroboration)');


    // ============================================
    // VULN-02: REHYDRATE SIDE EFFECT PURE FUNCTION
    // ============================================
    
    // Inject a CONFLICTED scenario directly into the graph
    let claimConA = graph.registerClaim({ intent: 'REPORT', knowledgeType: 'FACT', subject: 'Con' }, sA, []);
    let claimConB = graph.registerClaim({ intent: 'REPORT', knowledgeType: 'FACT', subject: 'Con2' }, sB, []);
    
    // Create conflict directly
    graph.conflicts.set('test_conf', {
        conflictId: 'test_conf',
        status: 'OPEN',
        claimA: claimConA,
        claimB: claimConB
    });

    let beforeHash = graph.serialize();

    // Rehydrate
    await engine.rehydrate();

    let afterHash = graph.serialize();

    assert(beforeHash === afterHash, 'PURE4C2.3-01 (rehydrate() does not mutate graph or create gaps)');


    // ============================================
    // VULN-03: ZERO EVIDENCE ESCALATION
    // ============================================
    
    // Create FACT with 0 supports
    let claimZero = {
        claimId: 'testZero',
        claimProposal: { intent: 'REPORT', knowledgeType: 'FACT', subject: 'Zero' },
        supports: []
    };
    graph.claims.set('testZero', claimZero);

    let stateZero = await engine.consolidateClaim('testZero');
    assert(stateZero === 'UNCERTAIN', 'EVID4C2.3-01 (FACT with 0 valid sources -> UNCERTAIN, not SUPPORTED)');

    console.log("\n=== TESTS DE PURIFICACIÓN COMPLETADOS ===");
}
runTests();
