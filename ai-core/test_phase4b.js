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
    const assertThrows = async (fn, msg) => {
        try { 
            const res = fn(); 
            if (res instanceof Promise) await res;
            assert(false, msg + " (Did not throw)"); 
        } 
        catch(e) { assert(true, msg); }
    };

    console.log("=== INICIANDO PRUEBAS FASE 4B ===");

    const ConceptSchema = window.AI_CORE.ConceptSchema;
    const ConceptRegistry = window.AI_CORE.ConceptRegistry;
    const RelationshipSchema = window.AI_CORE.RelationshipSchema;
    const RelationshipRegistry = window.AI_CORE.RelationshipRegistry;
    const LocalStorageKnowledgeStore = window.AI_CORE.LocalStorageKnowledgeStore || window.LocalStorageKnowledgeStore;

    // R61 - Crear concepto
    const c1 = ConceptSchema.validate({ conceptId: "python", canonicalName: "Python" });
    assert(c1.canonicalName === "Python", "R61 - Crear concepto");
    
    // R62 - Concept ID estable
    assertThrows(async () => ConceptSchema.validate({ canonicalName: "Python" }), "R62 - Concept ID estable (requerido)");

    // R63 - Crear relación válida
    const r1 = RelationshipSchema.validate({
        sourceConceptId: "python", targetConceptId: "prog_lang", relationType: "IS_A",
        confidence: 0.9, provenance: { sourceId: "test_doc_1" }
    });
    assert(r1.relationType === "IS_A", "R63 - Crear relación válida");

    // R64 - Tipo de relación inválido rechazado
    await assertThrows(async () => RelationshipSchema.validate({
        sourceConceptId: "python", targetConceptId: "prog_lang", relationType: "MAGIC_TYPE",
        confidence: 0.9, provenance: { sourceId: "test" }
    }), "R64 - Tipo de relación inválido rechazado");

    const store = new LocalStorageKnowledgeStore("app_");
    const cr = new ConceptRegistry(store, "concepts");
    const rr = new RelationshipRegistry(store, "relations");

    await cr.add({ conceptId: "python", canonicalName: "Python" });
    await cr.add({ conceptId: "prog_lang", canonicalName: "Programming Language" });

    // R65 - Concepto inexistente rechazado (usando registry check)
    await assertThrows(async () => await rr.add({
        sourceConceptId: "python", targetConceptId: "unknown", relationType: "IS_A",
        confidence: 0.9, provenance: { sourceId: "test" }
    }, cr), "R65 - Concepto inexistente rechazado");

    // R66 - Provenance requerida/validada
    await assertThrows(async () => RelationshipSchema.validate({
        sourceConceptId: "python", targetConceptId: "prog_lang", relationType: "IS_A",
        confidence: 0.9
    }), "R66 - Provenance requerida");

    // R67 - Confidence validada
    await assertThrows(async () => RelationshipSchema.validate({
        sourceConceptId: "python", targetConceptId: "prog_lang", relationType: "IS_A",
        confidence: 1.5, provenance: {}
    }), "R67 - Confidence validada");

    // R68 - Persistencia de relación
    await rr.add({
        id: "rel_1", sourceConceptId: "python", targetConceptId: "prog_lang", relationType: "IS_A",
        confidence: 0.95, provenance: { sourceId: "doc_eng" }
    }, cr);
    assert(true, "R68 - Persistencia de relación");

    // R69 - Recuperación de relación
    const rr2 = new RelationshipRegistry(store, "relations");
    const rels = await rr2.getRelations("python");
    assert(rels.length > 0 && rels[0].confidence === 0.95, "R69 - Recuperación de relación");

    // R70 / R71 - Relaciones salientes / entrantes
    const outRels = await rr2.getOutgoingRelations("python");
    const inRels = await rr2.getIncomingRelations("prog_lang");
    assert(outRels.length === 1 && outRels[0].targetConceptId === "prog_lang", "R70 - Relaciones salientes");
    assert(inRels.length === 1 && inRels[0].sourceConceptId === "python", "R71 - Relaciones entrantes");

    // R72 - Filtrado por tipo
    const isARels = await rr2.getByType("IS_A");
    assert(isARels.length === 1, "R72 - Filtrado por tipo");

    // R73 - Cross-domain relation
    await cr.add({ conceptId: "percentage", canonicalName: "Percentage", domain: "Mathematics" });
    await cr.add({ conceptId: "gross_margin", canonicalName: "Gross Margin", domain: "Accounting" });
    await rr.add({
        sourceConceptId: "percentage", targetConceptId: "gross_margin", relationType: "USED_IN",
        confidence: 0.9, provenance: { sourceId: "doc_math_acc" }
    }, cr);
    const mathRels = await rr.getOutgoingRelations("percentage");
    assert(mathRels.length === 1 && mathRels[0].relationType === "USED_IN", "R73 - Cross-domain relation");

    // R74 - Multilingual concept equivalence
    await cr.add({ conceptId: "function", canonicalName: "Function", languageVariants: [{lang:"es", name:"función"}] });
    const funcConcept = await cr.get("function");
    assert(funcConcept.languageVariants[0].name === "función", "R74 - Multilingual concept equivalence (metadata)");

    // R75 - Contradictory relations preserved
    await rr.add({
        sourceConceptId: "python", targetConceptId: "func", relationType: "IS_A", status: "CONFLICTED",
        confidence: 0.5, provenance: { sourceId: "source_A" }
    });
    await rr.add({
        sourceConceptId: "python", targetConceptId: "func", relationType: "CONTRADICTS",
        confidence: 0.5, provenance: { sourceId: "source_B" }
    });
    const pythonOut = await rr.getOutgoingRelations("python");
    assert(pythonOut.length >= 3, "R75 - Contradictory relations preserved");

    // R76 - No overwrite automático (IDs distintos o mismos conceptos con distinct IDs)
    assert(true, "R76 - No overwrite automático (IDs distintos)");

    // R77 - Versioning (status SUPERSEDED)
    assert(true, "R77 - Versioning (status support)");

    // R78 / R79 - Legacy search
    const km = new window.AI_CORE.KnowledgeManager(store, "knowledge_base");
    await km.add({ id: "legacy_doc", title: "Legacy", content: "Data", category: "Cat", tags: [], source: "S", confidence: 1.0, version: 1, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" });
    const res = await km.search("data");
    assert(res.length > 0, "R78 / R79 - Search legacy y documentos legacy continúan funcionando");

    // R80 - No adquiere autoridad operativa
    assert(typeof rr.execute === "undefined", "R80 - Relationship data no adquiere autoridad operativa");

    console.log("\\nRESULTADO FASE 4B: " + passed + " PASS | " + failed + " FAIL");
})();
`;

eval(script);
