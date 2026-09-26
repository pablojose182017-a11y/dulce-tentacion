const { SemanticOrchestrator, SemanticProviderRegistry, Level1Provider, Level0Provider } = require('./ai-semantic.js');
const { ProvenanceGraph } = require('./ai-provenance.js');
const { IntegratedConsolidationEngine, SemanticConsolidationPipeline } = require('./ai-integrated-consolidation.js');

function assert(condition, testName) {
    console.log(`${testName}: ${condition ? 'PASS' : 'FAIL'}`);
    if (!condition) throw new Error(`Test failed: ${testName}`);
}

async function runRemediationTests() {
    console.log("=== INICIANDO TESTS DE REMEDIACIÓN 4C.2.1 ===");

    let registry = new SemanticProviderRegistry();
    registry.register(new Level0Provider());
    registry.register(new Level1Provider());
    let orchestrator = new SemanticOrchestrator(registry);
    let graph = new ProvenanceGraph();
    let engine = new IntegratedConsolidationEngine(graph);
    let pipeline = new SemanticConsolidationPipeline(orchestrator, graph, engine);

    // ============================================
    // VULN-01: DESERIALIZATION TRUST FAILURE (DS4C2)
    // ============================================
    // Handled in DS4C2.2 (Rehydrate logic)

    // ============================================
    // VULN-02: EPISTEMIC ESCALATION (EP4C2)
    // ============================================
    
    // EP4C2-01: OPINION + OPINION -> SUPPORTED, not CONSOLIDATED
    let opClaim = graph.registerClaim({ intent: 'REPORT', knowledgeType: 'OPINION', subject: 'X' }, graph.registerSource({sourceId: 'S1'}), []);
    await engine.consolidateClaim(opClaim.claimId);
    graph.registerClaim({ intent: 'REPORT', knowledgeType: 'OPINION', subject: 'X' }, graph.registerSource({sourceId: 'S2'}), []); // Adds support
    let stateOp = await engine.consolidateClaim(opClaim.claimId);
    assert(stateOp === 'SUPPORTED', 'EP4C2-01 (OPINION + OPINION remains SUPPORTED)');

    // EP4C2-02: HYPOTHESIS + HYPOTHESIS -> SUPPORTED
    let hypClaim = graph.registerClaim({ intent: 'REPORT', knowledgeType: 'HYPOTHESIS', subject: 'Y' }, graph.registerSource({sourceId: 'S3'}), []);
    await engine.consolidateClaim(hypClaim.claimId);
    graph.registerClaim({ intent: 'REPORT', knowledgeType: 'HYPOTHESIS', subject: 'Y' }, graph.registerSource({sourceId: 'S4'}), []);
    let stateHyp = await engine.consolidateClaim(hypClaim.claimId);
    assert(stateHyp === 'SUPPORTED', 'EP4C2-02 (HYPOTHESIS + HYPOTHESIS remains SUPPORTED)');

    // EP4C2-04: INFERENCE + INFERENCE -> SUPPORTED
    let infClaim = graph.registerClaim({ intent: 'REPORT', knowledgeType: 'INFERENCE', subject: 'Z' }, graph.registerSource({sourceId: 'S5'}), []);
    await engine.consolidateClaim(infClaim.claimId);
    graph.registerClaim({ intent: 'REPORT', knowledgeType: 'INFERENCE', subject: 'Z' }, graph.registerSource({sourceId: 'S6'}), []);
    let stateInf = await engine.consolidateClaim(infClaim.claimId);
    assert(stateInf === 'SUPPORTED', 'EP4C2-04 (INFERENCE + INFERENCE remains SUPPORTED)');

    // FACT + FACT -> CONSOLIDATED
    let factClaim = graph.registerClaim({ intent: 'REPORT', knowledgeType: 'FACT', subject: 'W' }, graph.registerSource({sourceId: 'S7'}), []);
    await engine.consolidateClaim(factClaim.claimId);
    graph.registerClaim({ intent: 'REPORT', knowledgeType: 'FACT', subject: 'W' }, graph.registerSource({sourceId: 'S8'}), []);
    let stateFact = await engine.consolidateClaim(factClaim.claimId);
    assert(stateFact === 'CONSOLIDATED', 'EP4C2-08 (FACT + FACT achieves CONSOLIDATED)');


    // ============================================
    // VULN-03: KNOWLEDGE GAP LOSS (GAP4C2)
    // ============================================
    
    // We need to pass a mock semantic result with missingInformation
    // Since Level0/Level1 don't output missingInformation, we intercept the orchestrator temporarily
    let oldInterpret = orchestrator.interpret.bind(orchestrator);
    orchestrator.interpret = async function(text) {
        let originalRes = await oldInterpret(text);
        let res = JSON.parse(JSON.stringify(originalRes)); // Clone to unfreeze
        if (text === "Incompleto") {
            res.interpretationStatus = 'PARTIAL'; // Bypass UNSUPPORTED skip
            res.claimProposal = { intent: 'REPORT', subject: 'Incompleto' };
            res.missingInformation = [{ info: 'precio', type: 'INDISPENSABLE' }];
            delete res.candidates; // force single
        }
        return res;
    };

    let out = await pipeline.process("Incompleto", { sourceId: 'S9', content: 'Incompleto' });
    console.log("Output:", out);
    let gaps = Array.from(graph.knowledgeGaps.values());
    console.log("Found gaps:", gaps);
    let missingGap = gaps.find(g => g.description.includes('precio') && g.priority === 'INDISPENSABLE');
    assert(missingGap !== undefined, 'GAP4C2-01 (Semantic missingInformation preserved as KnowledgeGap)');

    // Idempotency: process again
    await pipeline.process("Incompleto", { sourceId: 'S10', content: 'Incompleto' });
    let gapCount = Array.from(graph.knowledgeGaps.values()).filter(g => g.description.includes('precio')).length;
    assert(gapCount === 1, 'GAP4C2-03 (Duplicate semantic gaps are idempotent)');

    console.log("\n=== TESTS DE REMEDIACIÓN COMPLETADOS ===");
}
runRemediationTests();
