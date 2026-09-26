const fs = require('fs');

global.window = {
    AI_CORE: {}
};

global.localStorage = {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, value) { this._data[key] = String(value); },
    removeItem(key) { delete this._data[key]; }
};
window.localStorage = global.localStorage;

let script = fs.readFileSync('./ai-store.js', 'utf8') + '\n';
script += fs.readFileSync('./ai-knowledge.js', 'utf8') + '\n';
script += fs.readFileSync('./ai-ingestion.js', 'utf8') + '\n';
script += fs.readFileSync('./ai-context.js', 'utf8') + '\n';

script += `
(async function runTests() {
    let passed = 0; let failed = 0;
    const assert = (condition, msg) => {
        if (condition) { console.log("✅ PASS: " + msg); passed++; }
        else { console.error("❌ FAIL: " + msg); failed++; }
    };
    const assertThrows = (fn, msg) => {
        try { fn(); assert(false, msg + " (Did not throw)"); } 
        catch(e) { assert(true, msg); }
    };

    console.log("=== INICIANDO PRUEBAS FASE 4A ===");

    const baseDoc = {
        id: "test_doc_1", title: "Test", content: "Test Content", category: "Test",
        tags: ["test"], source: "manual", confidence: 1.0, version: 1, 
        createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z"
    };

    // K41 - KnowledgeType válido
    assert(KnowledgeSchema.validate({ ...baseDoc, knowledgeType: "FACT" }).knowledgeType === "FACT", "K41 - KnowledgeType válido FACT");
    // K42 - KnowledgeType inválido rechazado
    assertThrows(() => KnowledgeSchema.validate({ ...baseDoc, knowledgeType: "INVALID_TYPE" }), "K42 - KnowledgeType inválido rechazado");
    // K43 - Language válido
    assert(KnowledgeSchema.validate({ ...baseDoc, language: "es" }).language === "es", "K43 - Language válido");
    // K44 - Language inválido rechazado
    assertThrows(() => KnowledgeSchema.validate({ ...baseDoc, language: "" }), "K44 - Language inválido rechazado (vacio)");
    assertThrows(() => KnowledgeSchema.validate({ ...baseDoc, language: 123 }), "K44 - Language inválido rechazado (numero)");
    // K45 - Provenance válida
    assert(KnowledgeSchema.validate({ ...baseDoc, provenance: { method: "manual" } }).provenance.method === "manual", "K45 - Provenance válida");
    // K46 - Provenance inválida rechazada
    assertThrows(() => KnowledgeSchema.validate({ ...baseDoc, provenance: "not_an_object" }), "K46 - Provenance inválida rechazada");
    // K47 - Confidence válida (ya estaba)
    assert(KnowledgeSchema.validate({ ...baseDoc, confidence: 0.5 }).confidence === 0.5, "K47 - Confidence válida");
    // K48 - Confidence inválida rechazada (ya estaba)
    assertThrows(() => KnowledgeSchema.validate({ ...baseDoc, confidence: 1.5 }), "K48 - Confidence inválida rechazada");
    // K49 - Version válida (ya estaba)
    assert(KnowledgeSchema.validate({ ...baseDoc, version: 2 }).version === 2, "K49 - Version válida");
    // K50 - Version inválida rechazada (ya estaba)
    assertThrows(() => KnowledgeSchema.validate({ ...baseDoc, version: 0 }), "K50 - Version inválida rechazada");
    // K51 - Status válido
    assert(KnowledgeSchema.validate({ ...baseDoc, status: "ACTIVE" }).status === "ACTIVE", "K51 - Status válido");
    assertThrows(() => KnowledgeSchema.validate({ ...baseDoc, status: "INVALID_STATUS" }), "K51 - Status inválido rechazado");
    // K52 - EvidenceReferences válido
    assert(KnowledgeSchema.validate({ ...baseDoc, evidenceReferences: ["doc_x"] }).evidenceReferences[0] === "doc_x", "K52 - EvidenceReferences válido");
    assertThrows(() => KnowledgeSchema.validate({ ...baseDoc, evidenceReferences: "doc_x" }), "K52 - EvidenceReferences inválido rechazado");

    // K54 - Documento legacy continúa funcionando
    assert(KnowledgeSchema.validate(baseDoc).id === "test_doc_1", "K54 - Documento legacy validado sin errores");
    assert(KnowledgeSchema.validate(baseDoc).language === undefined, "K54 - Documento legacy sin campos extra");

    // K53, K60 - Persistencia
    const store = new LocalStorageKnowledgeStore("app_");
    let km = new KnowledgeManager(store, "test_col");
    await km.add({ ...baseDoc, id: "pers_test", language: "fr", status: "DEPRECATED" });
    
    let km2 = new KnowledgeManager(store, "test_col");
    const recDoc = await km2.get("pers_test");
    assert(recDoc.language === "fr" && recDoc.status === "DEPRECATED", "K53/K60 - Persistencia conserva metadata y recupera conocimiento");

    // K55 - Search
    const searchRes = await km2.search("test");
    assert(searchRes.length > 0 && searchRes[0].document.id === "pers_test", "K55 - Search continúa funcionando");

    // K57 - Ingestion conserva provenance
    const ingestion = new KnowledgeIngestionEngine(km2, null);
    const ingested = await ingestion.ingest("aprende esto sobre python que es un lenguaje", "test_source");
    assert(ingested.status === "STORED", "Ingestion completada");
    
    // Validate stored doc
    const docs = await km2.search("python");
    const storedDoc = docs.find(d => d.document.id === ingested.documentId).document;
    assert(storedDoc.language === "UNSPECIFIED" && storedDoc.provenance.sourceId === "test_source", "K57/K59 - Ingestion conserva metadata de procedencia");

    // K58 - Fuente y conocimiento permanecen diferenciables
    assert(storedDoc.source === "test_source" && storedDoc.content.includes("python"), "K58 - Fuente y conocimiento diferenciables");

    console.log("\\nRESULTADO FASE 4A: " + passed + " PASS | " + failed + " FAIL");
})();
`;

eval(script);
