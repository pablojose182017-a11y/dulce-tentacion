global.window = { AI_CORE: {} };
require('./ai-core/ai-reasoning.js');
const ReasoningEngine = window.AI_CORE.ReasoningEngine;

function test(name, condition, msg) {
    if (condition) {
        console.log(`[PASS] ${name}: ${msg}`);
        return true;
    } else {
        console.error(`[FAIL] ${name}: ${msg}`);
        return false;
    }
}

async function runTests() {
    console.log("=== REASONING CONTRACT RUNTIME TESTS ===");
    let passed = 0;
    let total = 0;
    
    async function runTest(name, fn, msg) {
        total++;
        try {
            if(test(name, await fn(), msg)) passed++;
        } catch(e) {
            console.error(`[FAIL] ${name} threw error: ${e.message}`);
        }
    }

    const mockProvider = {}; // Mock provider (unused by internal reasoning mock for now)
    
    // Helper to generate context
    function getContext(problem, ckList = [], genList = []) {
        return {
            problemStatement: problem,
            assembledContext: {
                blocks: {
                    knowledge: { status: 'AVAILABLE', content: genList },
                    creatorKnowledge: { status: 'AVAILABLE', content: ckList }
                }
            }
        };
    }

    // IR01
    await runTest("IR01", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("hello", [{ knowledgeId: "k1", category: "CREATOR_FACT", statement: "The sky is blue" }]);
        const res = await engine.reason(ctx);
        return res.evidenceList.some(e => e.provenanceSourceId === "k1") &&
               res.hypotheses.some(h => h.epistemicCategory === "CREATOR_FACT");
    }, "Reasoning recibe Creator Knowledge.");

    // IR02
    await runTest("IR02", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("hello", [{ knowledgeId: "k1", category: "CREATOR_FACT", statement: "CK" }], [{ id: "g1", content: "Gen" }]);
        const res = await engine.reason(ctx);
        const hasCK = res.evidenceList.some(e => e.type === "CREATOR_KNOWLEDGE");
        const hasGen = res.evidenceList.some(e => e.type === "KNOWLEDGE_DOCUMENT");
        return hasCK && hasGen;
    }, "Creator Knowledge permanece separado de Knowledge genérico en la evidencia.");

    // IR03
    await runTest("IR03", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("test pref", [{ knowledgeId: "k2", category: "CREATOR_PREFERENCE", statement: "Prefiero X" }]);
        const res = await engine.reason(ctx);
        return res.hypotheses.some(h => h.epistemicCategory === "CREATOR_PREFERENCE" && h.supportingEvidence.length === 0) &&
               !res.authorizationRequirement.required &&
               res.proposal.includes("Prefiero X");
    }, "CREATOR_PREFERENCE ≠ COMMAND (No altera auth, solo propuesta).");

    // IR04
    await runTest("IR04", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("test exp", [{ knowledgeId: "k3", category: "CREATOR_EXPECTATION", statement: "Espero Y" }]);
        const res = await engine.reason(ctx);
        return !res.authorizationRequirement.required;
    }, "CREATOR_EXPECTATION ≠ AUTHORIZATION.");

    // IR05
    await runTest("IR05", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("test belief", [{ knowledgeId: "k4", category: "CREATOR_BELIEF", statement: "Creo que Z" }]);
        const res = await engine.reason(ctx);
        const isBelief = res.hypotheses.some(h => h.epistemicCategory === "CREATOR_BELIEF");
        const hasEvidence = res.evidenceList.some(e => e.provenanceSourceId === "k4");
        return isBelief && !hasEvidence;
    }, "CREATOR_BELIEF ≠ FACT (No se convierte en evidencia).");

    // IR06
    await runTest("IR06", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("test hyp", [{ knowledgeId: "k5", category: "CREATOR_HYPOTHESIS", statement: "Supongo que A" }]);
        const res = await engine.reason(ctx);
        const isHyp = res.hypotheses.some(h => h.epistemicCategory === "CREATOR_HYPOTHESIS");
        const hasEvidence = res.evidenceList.some(e => e.provenanceSourceId === "k5");
        return isHyp && !hasEvidence;
    }, "CREATOR_HYPOTHESIS ≠ EVIDENCE.");

    // IR07
    await runTest("IR07", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("hello", [{ knowledgeId: "k6", category: "CREATOR_FACT", statement: "Fact A" }]);
        const res = await engine.reason(ctx);
        const ev = res.evidenceList.find(e => e.provenanceSourceId === "k6");
        return ev && ev.reasoningConfidence < 1.0;
    }, "CREATOR_FACT no recibe confidence=1 automáticamente.");

    // IR08
    await runTest("IR08", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("hello", [{ knowledgeId: "k7", category: "CREATOR_FACT", statement: "Fact B", applicabilityScope: "SCOPE_UNCERTAIN" }]);
        const res = await engine.reason(ctx);
        return res.status === "STRUCTURAL_ERROR" && res.analysis.includes("FAIL-CLOSED: SCOPE_UNCERTAIN");
    }, "SCOPE_UNCERTAIN permanece excluido (fail-closed defensivo).");

    // IR09
    await runTest("IR09", async () => {
        const engine = new ReasoningEngine(mockProvider);
        // "conflicto ck" is a keyword I added in the mock to simulate generic vs CK contradiction
        const ctx = getContext("conflicto ck", [{ knowledgeId: "k8", category: "CREATOR_FACT", statement: "Blanco" }], [{ id: "doc_generico_1", content: "Negro" }]);
        const res = await engine.reason(ctx);
        return res.uncertainty.level === "HIGH" && res.uncertainty.conflictingInformation.length > 0;
    }, "Conflicto genérico vs Creator Knowledge no tiene auto-winner.");

    // IR10
    await runTest("IR10", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("hello"); // no CK, no Generic
        const res = await engine.reason(ctx);
        return res.status === "COMPLETED";
    }, "Ausencia de Creator Knowledge no rompe Reasoning.");

    // IR11
    await runTest("IR11", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("hello");
        const res = await engine.reason(ctx);
        return Array.isArray(res.hypotheses) && Array.isArray(res.evidenceList) && 
               res.uncertainty && res.uncertainty.level && 
               Array.isArray(res.uncertainty.missingInformation) && Array.isArray(res.uncertainty.conflictingInformation) && 
               res.conclusion !== undefined && res.proposal !== undefined && res.authorizationRequirement !== undefined;
    }, "Salida completa compatible con Personality.");

    // IR12
    await runTest("IR12", async () => {
        // Just verify ReasoningEngine exists without bringing in SecurityEngine, etc.
        return typeof window.AI_CORE.SecurityEngine === 'undefined';
    }, "Reasoning no importa Security/Execution.");

    // IR13
    await runTest("IR13", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("hello", [{ knowledgeId: "k9", category: "CREATOR_FACT", statement: "Fact" }]);
        const res = await engine.reason(ctx);
        const ev = res.evidenceList.find(e => e.provenanceSourceId === "k9");
        return ev && ev.type === "CREATOR_KNOWLEDGE";
    }, "Evidencia/provenance de CK se conserva explícitamente.");

    // IR14
    await runTest("IR14", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("hello pref", [{ knowledgeId: "k10", category: "CREATOR_PREFERENCE", statement: "Use short answers" }]);
        const res = await engine.reason(ctx);
        return res.proposal.includes("Use short answers");
    }, "Preferencias afectan propuestas cognitivas.");

    // IR15
    await runTest("IR15", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("hello exp", [{ knowledgeId: "k11", category: "CREATOR_EXPECTATION", statement: "Expect quick processing" }]);
        const res = await engine.reason(ctx);
        return !res.authorizationRequirement.required;
    }, "Expectativa no altera autorización.");

    // IR16
    await runTest("IR16", async () => {
        const engine = new ReasoningEngine(mockProvider);
        const ctx = getContext("hello hyp", [{ knowledgeId: "k12", category: "CREATOR_HYPOTHESIS", statement: "May rain" }]);
        const res = await engine.reason(ctx);
        return !res.evidenceList.some(e => e.provenanceSourceId === "k12");
    }, "Hipótesis del creador no se convierte en evidencia por razonamiento.");

    console.log(`\nRESUMEN: ${passed} PASS / ${total} TOTAL`);
}

runTests();
