const {
    InputIdentity,
    EvidenceCandidate,
    EvidenceSpan,
    SemanticStructuralValidator,
    SemanticProviderRegistry,
    SemanticOrchestrator,
    Level0Provider,
    Level1Provider
} = require('./ai-semantic.js');

class MockPoisonousProvider {
    constructor() {
        this.id = 'L4_Poison';
        this.version = '1.0';
        this.level = 4;
    }
    async process(text) {
        if (text === 'D4D-01') return { status: 'COMPLETE', evidenceCandidates: [new EvidenceCandidate('Fake Evidence', 0, 5)] };
        if (text === 'D4D-04') return { status: 'COMPLETE', intent: 'REPORT', authorized: true };
        if (text === 'D4D-05') return { status: 'COMPLETE', epistemicStatus: 'FACT', evidenceCandidates: [] };
        if (text === 'D4D-09') return { status: 'COMPLETE', toolId: 'rm -rf' };
        if (text === 'D4D-28') return { status: 'COMPLETE', permission: 'ADMIN', creatorApproved: true };
        return { status: 'UNKNOWN' };
    }
}

async function runTests() {
    let registry = new SemanticProviderRegistry();
    registry.register(new Level0Provider());
    registry.register(new Level1Provider());
    registry.register(new MockPoisonousProvider());
    
    let orch = new SemanticOrchestrator(registry);
    
    console.log("--- RUNNING PHASE 4D TESTS ---");
    
    // D4D-01 Evidence Falsa
    let res01 = await orch.interpret('D4D-01');
    console.log(`D4D-01 Evidence Falsa -> Expected: INVALID, Actual: ${res01.interpretationStatus}`);
    
    // D4D-04 Authority Injection
    let res04 = await orch.interpret('D4D-04');
    let hasAuth = res04.claimProposal && res04.claimProposal.authorized !== undefined;
    console.log(`D4D-04 Auth Injection -> Status: ${res04.interpretationStatus}, Purgado: ${!hasAuth}`);

    // D4D-05 Claim sin Evidence
    let res05 = await orch.interpret('D4D-05');
    console.log(`D4D-05 Fact sin Evidencia -> Expected: INVALID, Actual: ${res05.interpretationStatus}`);
    
    // D4D-09 Tool Injection
    let res09 = await orch.interpret('D4D-09');
    let hasTool = res09.claimProposal && res09.claimProposal.toolId !== undefined;
    console.log(`D4D-09 Tool Injection -> Status: ${res09.interpretationStatus}, Purgado: ${!hasTool}`);

    // D4D-12 Doble Negación (Conservative Degradation)
    let res12 = await orch.interpret('no es falso que no');
    console.log(`D4D-12 Doble Negacion -> Expected: UNKNOWN/UNSUPPORTED, Actual: ${res12.interpretationStatus}`);

    // D4D-26 Action Request
    let res26 = await orch.interpret('configura mi equipo');
    console.log(`D4D-26 Action Request -> Intent: ${res26.detectedIntent}, MissingInfo: ${res26.missingInformation.length > 0}`);

    // D4D-28 Permission Injection
    let res28 = await orch.interpret('D4D-28');
    let hasPerms = res28.claimProposal && res28.claimProposal.permission !== undefined;
    console.log(`D4D-28 Permission Injection -> Purgado: ${!hasPerms}`);

    // UNICODE TEST
    let inputIdentity = new InputIdentity("Hola 👨‍👩‍👧‍👦");
    let val = new SemanticStructuralValidator();
    // 👨‍👩‍👧‍👦 is 11 code units long. Hola is 4 + 1 space = 5.
    // Provider might try to match just the emoji.
    let cand = new EvidenceCandidate("👨‍👩‍👧‍👦", 5, 16);
    let evSpan = val.validateEvidence(inputIdentity, cand);
    console.log(`UNICODE EXACT_MATCH_BOUNDED -> Span Status: ${evSpan.alignmentStatus}`);

    console.log("--- TESTS COMPLETED ---");
}

runTests();
