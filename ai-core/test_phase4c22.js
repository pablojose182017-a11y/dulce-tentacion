const { SemanticOrchestrator, SemanticProviderRegistry, Level1Provider, Level0Provider } = require('./ai-semantic.js');
const { ProvenanceGraph } = require('./ai-provenance.js');
const { IntegratedConsolidationEngine, SemanticConsolidationPipeline } = require('./ai-integrated-consolidation.js');

function assert(condition, testName) {
    console.log(`${testName}: ${condition ? 'PASS' : 'FAIL'}`);
    if (!condition) throw new Error(`Test failed: ${testName}`);
}

async function runTests() {
    console.log("=== INICIANDO TESTS DE REMEDIACIÓN PROFUNDA 4C.2.2 ===");

    let graph = new ProvenanceGraph();
    let engine = new IntegratedConsolidationEngine(graph);

    // ============================================
    // VULN-01: DESERIALIZATION ESCALATION BYPASS (DS4C2.2)
    // ============================================
    
    // Injecting fake state via rehydrate (since deserialize is gone, we test rehydrate behaviour)
    engine.consolidationStates.set("fake_claim", "CONSOLIDATED");
    await engine.rehydrate(); // should clear the cache and rebuild from provenance
    assert(engine.getConsolidatedState("fake_claim") === "RAW", "DS4C2.2-01 (Fake CONSOLIDATED wiped by rehydrate)");

    // Test rollback on failure
    let dummyClaim = graph.registerClaim({ intent: 'REPORT', subject: 'Dummy' }, graph.registerSource({sourceId: 'SDummy'}), []);
    engine.consolidationStates.set(dummyClaim.claimId, "SUPPORTED"); // Inject existing state
    engine.consolidationStates.set("old_claim", "SUPPORTED");
    let originalConsolidate = engine.consolidateClaim;
    engine.consolidateClaim = async function() { throw new Error("mock error"); };
    try {
        await engine.rehydrate();
    } catch(e) {}
    assert(engine.getConsolidatedState("old_claim") === "SUPPORTED", "DS4C2.2-12 (Atomic rollback on logical validation fail)");
    engine.consolidateClaim = originalConsolidate; // restore

    // ============================================
    // VULN-02: USER_ASSERTION ESCALATION (EP4C2.2)
    // ============================================
    
    // 1 USER_ASSERTION -> SUPPORTED or UNCERTAIN
    let uClaim1 = graph.registerClaim({ intent: 'REPORT', knowledgeType: 'USER_ASSERTION', subject: 'U1' }, graph.registerSource({sourceId: 'SU1', sourceType: 'USER_PROVIDED'}), []);
    let stateU1 = await engine.consolidateClaim(uClaim1.claimId);
    assert(stateU1 === 'UNCERTAIN', 'EP4C2.2-01 (1 USER_ASSERTION -> UNCERTAIN)');

    // 2 USER_ASSERTION -> SUPPORTED
    graph.registerClaim({ intent: 'REPORT', knowledgeType: 'USER_ASSERTION', subject: 'U1' }, graph.registerSource({sourceId: 'SU2', sourceType: 'USER_PROVIDED'}), []);
    let stateU2 = await engine.consolidateClaim(uClaim1.claimId);
    assert(stateU2 === 'SUPPORTED', 'EP4C2.2-02 (2 USER_ASSERTION -> SUPPORTED)');

    // 100 USER_ASSERTION -> SUPPORTED
    for (let i = 3; i <= 100; i++) {
        graph.registerClaim({ intent: 'REPORT', knowledgeType: 'USER_ASSERTION', subject: 'U1' }, graph.registerSource({sourceId: `SU${i}`, sourceType: 'USER_PROVIDED'}), []);
    }
    let stateU100 = await engine.consolidateClaim(uClaim1.claimId);
    assert(stateU100 === 'SUPPORTED', 'EP4C2.2-04 (100 USER_ASSERTION -> SUPPORTED)');


    // ============================================
    // VULN-03: GAP LINKAGE LOSS (GAP4C2.2)
    // ============================================
    
    let gap = graph.createKnowledgeGap("Test Gap Linkage", ['claim_A'], 'INDISPENSABLE');
    assert(gap.relatedClaims.length === 1 && gap.relatedClaims[0] === 'claim_A', "GAP4C2.2-01 (Create with claim_A)");

    let gap2 = graph.createKnowledgeGap("Test Gap Linkage", ['claim_B'], 'INDISPENSABLE');
    assert(gap2.gapId === gap.gapId, "GAP4C2.2-02 (Deterministic Identity Preserved)");
    assert(gap2.relatedClaims.length === 2 && gap2.relatedClaims.includes('claim_B'), "GAP4C2.2-03 (Linkage Appended)");

    let gap3 = graph.createKnowledgeGap("Test Gap Linkage", ['claim_A'], 'INDISPENSABLE');
    assert(gap3.relatedClaims.length === 2, "GAP4C2.2-04 (Idempotent for same claim)");

    // Immutability Check
    let threw = false;
    try { gap3.relatedClaims.push('claim_C'); } catch(e) { threw = true; }
    assert(threw, "GAP4C2.2-06 (Gap remains immutable)");

    console.log("\n=== TESTS DE REMEDIACIÓN PROFUNDA COMPLETADOS ===");
}
runTests();
