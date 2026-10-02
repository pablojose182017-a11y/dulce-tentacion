const fs = require('fs');
global.window = {};
global.document = {};
const deps = [
    'ai-core/ai-research-engine.js'
];
deps.forEach(file => {
    const code = fs.readFileSync('./' + file, 'utf8');
    eval(code);
});

const engine = new window.AI_CORE.ResearchEngine({
    offlineResolver: {}, investigationEngine: {}, reasoningEngine: {}, webFetcher: {}
});

function assert(condition, message) {
    if (!condition) {
        console.error("❌ [FAIL]", message);
        process.exit(1);
    } else {
        console.log("✅ [PASS]", message);
    }
}

console.log("=== Guardian Phase 14 Evidence Analysis Tests ===\n");

// Test 1: Relevance assessment (rejects unrelated)
const findings1 = [
    { url: "https://mock.com", content: "El origen de la panaderia se remonta a los egipcios.", type: "WEB" },
    { url: "https://mock2.com", content: "Las mejores laptops para programar en 2026.", type: "WEB" }
];
const a1 = engine._analyzeEvidence("cual es el origen de la panaderia", findings1);
assert(a1.relevantFindings.length === 1, "Should filter out unrelated findings (laptop)");
assert(a1.relevantFindings[0].url === "https://mock.com", "Should keep relevant finding");
assert(a1.finalConfidence >= 0.7, "Confidence should be >= 0.7 with web results");

// Test 2: Business Discovery & Location
const findings2 = [
    { url: "https://mock3.com", content: "Directorio de panaderias en Cucuta: La Mejor Pan, Panaderia Central.", type: "WEB" },
    { url: "https://mock4.com", content: "Panaderias en Bogota que debes conocer.", type: "WEB" }
];
const a2 = engine._analyzeEvidence("busca en internet panaderias de cucuta", findings2);
assert(a2.relevantFindings.length === 1, "Should filter by location (Cucuta vs Bogota)");
assert(a2.conclusion.includes("Cucuta") || a2.conclusion.includes("cucuta"), "Conclusion should mention the location");
assert(a2.conclusion.includes("incompleta o desactualizada"), "Conclusion should warn about business directories");

// Test 3: Insufficient evidence
const findings3 = [
    { url: "https://mock5.com", content: "Receta de galletas de chocolate.", type: "WEB" }
];
const a3 = engine._analyzeEvidence("quien invento el internet", findings3);
assert(a3.relevantFindings.length === 0, "Should find no relevant evidence");
assert(a3.finalConfidence < 0.5, "Confidence should be low (<0.5)");
assert(a3.limitations.length > 0, "Should produce limitations explaining failure");

// Test 4: finalStatus resolution logic
async function testEngine() {
    engine.offlineResolver = { query: async () => ({ status: 'INSUFFICIENT', results: [], staleDocs: [] }) };
    engine.permissionManager = null;
    
    // Simulate web fetcher returning irrelevant stuff
    engine.webFetcher = { 
        search: async () => [{ url: 'http://bad', snippet: 'nothing useful' }],
        fetchPage: async () => ({ error: true })
    };
    
    const res = await engine.investigate('cual es el origen de la panaderia', { webSearchApproved: true });
    assert(res.status === 'INSUFFICIENT_EVIDENCE', "Should be INSUFFICIENT_EVIDENCE when relevant findings are empty");
    assert(res.conclusion.includes('No encontré información relevante'), "Should include failure conclusion");
    assert(res.confidence === 0.2, "Confidence should be exactly 0.2");
    
    console.log("\nAll tests passed!");
    process.exit(0);
}
testEngine().catch(e => { console.error(e); process.exit(1); });
