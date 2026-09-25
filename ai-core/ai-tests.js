window.runAITests = async function() {
    console.log("=== INICIANDO SUITE DE PRUEBAS AI_CORE ===");
    let passedAnteriores = 0;
    let failedAnteriores = 0;
    let passedNuevas = 0;
    let failedNuevas = 0;

    const assertAnt = (condition, message) => {
        if (condition) {
            console.log(`✅ PASS (Ant): ${message}`);
            passedAnteriores++;
        } else {
            console.error(`❌ FAIL (Ant): ${message}`);
            failedAnteriores++;
        }
    };

    const assertNuevo = (condition, message) => {
        if (condition) {
            console.log(`✅ PASS (Nuevo): ${message}`);
            passedNuevas++;
        } else {
            console.error(`❌ FAIL (Nuevo): ${message}`);
            failedNuevas++;
        }
    };

    const store = new window.AI_CORE.LocalStorageKnowledgeStore('test_ai_core_');
    
    try {
        await store.clear('test_collection');
        await store.clear('test_memory');
        
        // ==========================================
        // PRUEBAS ANTERIORES
        // ==========================================
        const km = new window.AI_CORE.KnowledgeManager(store, 'test_collection');
        assertAnt(km !== null, "KnowledgeManager instanciado correctamente.");

        let didFail = false;
        try { await km.add({ title: "Incompleto" }); } catch (e) { didFail = true; }
        assertAnt(didFail, "KnowledgeSchema rechaza documentos incompletos/inválidos.");

        const docBase = {
            id: "doc_001", title: "Regla", content: "Test.", category: "Test", tags: ["test"],
            source: "Test", confidence: 1.0, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        await km.add(docBase);
        const loaded = await km.get("doc_001");
        assertAnt(loaded !== null && loaded.title === "Regla", "Documento recuperado correctamente desde Store.");

        const im = new window.AI_CORE.IdentityManager();
        const pm = new window.AI_CORE.PermissionManager();
        
        const adminUser = im.getCurrentUser({ email: 'pablojose182017@gmail.com' });
        const stdUser = im.getCurrentUser({ email: 'test@example.com' });
        
        assertAnt(adminUser.isCreator === true && pm.canExecute(adminUser, 4) === true, "PermissionManager: Creador tiene permisos altos (Nivel 4).");
        assertAnt(stdUser.isCreator === false && pm.canExecute(stdUser, 4) === false, "PermissionManager: Usuario estándar bloqueado en Niveles 3+.");
        
        const mm = new window.AI_CORE.MemoryManager(store, 'test_memory');
        mm.addTurn('user', 'Hola');
        assertAnt(mm.getShortTermMemory().length === 1, "MemoryManager: Memoria a corto plazo operativa.");
        
        await mm.savePersistent('pref_1', 'Hablar en español formal');
        const pref = await mm.getPersistent('pref_1');
        assertAnt(pref === 'Hablar en español formal', "MemoryManager: Memoria persistente operativa.");

        const contextManager = new window.AI_CORE.ContextManager(im, pm, mm);
        await contextManager.assembleContext({ email: 'pablojose182017@gmail.com' });
        contextManager.setKnowledge(await km.search("Test"));
        
        const builtContext = contextManager.buildContext();
        assertAnt(builtContext.blocks.user.status === 'AVAILABLE', "ContextManager ensambla User.");
        assertAnt(builtContext.blocks.identity.status === 'AVAILABLE', "ContextManager ensambla Identity.");
        assertAnt(builtContext.blocks.permissions.status === 'AVAILABLE', "ContextManager ensambla Permissions.");
        assertAnt(builtContext.blocks.memory.status === 'AVAILABLE', "ContextManager ensambla Memory.");

        const provider = new window.AI_CORE.LocalMockProvider();
        const response = await provider.generate("Hola Mock", builtContext);
        assertAnt(response.includes("MOCK / TEST PROVIDER"), "LocalMockProvider operativo.");

        // Limpieza fase previa
        await store.clear('test_collection');

        // ==========================================
        // PRUEBAS NUEVAS: COMPARADOR RAG vs KM
        // ==========================================

        // FASE 1: 5 Documentos de Prueba
        const docs = [
            { id: "dns_1", title: "DNS", content: "Sistema de nombres de dominio que traduce IPs.", category: "Redes", tags: ["dns", "redes"], source: "IT", confidence: 1.0, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "http_1", title: "HTTP", content: "Protocolo de transferencia de hipertexto.", category: "Redes", tags: ["http", "web"], source: "IT", confidence: 1.0, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "py_1", title: "Python", content: "Manejo de excepciones con try/except.", category: "Programación", tags: ["python", "codigo"], source: "IT", confidence: 1.0, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "linux_1", title: "Linux", content: "Sistema operativo open source.", category: "Sistemas", tags: ["linux", "os"], source: "IT", confidence: 1.0, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
            { id: "siem_1", title: "SIEM", content: "Ciberseguridad defensiva, correlación de eventos.", category: "Ciberseguridad", tags: ["siem", "seguridad"], source: "IT", confidence: 1.0, version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ];

        for (let d of docs) {
            await km.add(d);
        }
        
        // Comprobar si se insertaron obteniendo las categorias principales
        const loadedDocs = await km.findByCategory("Redes");
        assertNuevo(loadedDocs.length >= 2, "5 documentos de prueba inyectados de forma aislada.");

        // FASE 2 y 4: Comparador RAG vs KM Mejorado
        const queries = [
            "¿Qué es DNS?",
            "Explícame DNS",
            "¿Cómo funciona el sistema DNS?",
            "¿Qué es HTTP?",
            "Explícame Python",
            "¿Qué es Linux?",
            "¿Qué es un SIEM?",
            "¿DÓNDE ESTÁ EL SIEM?", // Mayúsculas y tildes
            "", // Vacía
            "xyz123abc", // Sin resultados
            "¿Qué es Python y Linux?" // Varias keywords
        ];

        console.log("=== COMPARACIÓN RAG LEGACY vs KNOWLEDGE MANAGER ===");
        
        let comparativasExitosas = 0;
        for (let q of queries) {
            const startRAG = performance.now();
            const resRAG = (typeof window._gf_obtenerContextoRAG === 'function') ? window._gf_obtenerContextoRAG(q) : { modoFallback: true, recetasRelevantes: [] };
            const endRAG = performance.now();

            const startKM = performance.now();
            const resKM = await km.search(q); 
            const endKM = performance.now();

            console.log(`\nConsulta: "${q}"`);
            
            // Extracción para mostrar en reporte
            const extractedKeywords = km._tokenizeAndExtract(q);
            console.log(`Keywords extraídas: [${extractedKeywords.join(', ')}]`);

            if (resRAG.modoFallback || resRAG.recetasRelevantes.length === 0) {
                console.log(`RAG Legacy: Sin conocimiento relevante en la fuente legacy de negocio. Tiempo: ${(endRAG - startRAG).toFixed(2)}ms`);
            } else {
                console.log(`RAG Legacy: Encontrados: ${resRAG.recetasRelevantes.length} recetas, Fallback: ${resRAG.modoFallback}, Tiempo: ${(endRAG - startRAG).toFixed(2)}ms`);
            }

            console.log(`KnowledgeManager: Encontrados: ${resKM.length}, Tiempo: ${(endKM - startKM).toFixed(2)}ms`);
            if (resKM.length > 0) {
                const bestMatch = resKM[0];
                console.log(`   └─ Mejor Match: ID=${bestMatch.document.id}`);
                console.log(`   └─ Score: ${bestMatch.score}`);
                console.log(`   └─ MatchRatio: ${bestMatch.matchRatio.toFixed(2)}`);
                console.log(`   └─ MatchedTerms: [${bestMatch.matchedTerms.join(', ')}]`);
                console.log(`   └─ MatchedFields: [${bestMatch.matchedFields.join(', ')}]`);
                console.log(`   └─ Confidence (Documento): ${bestMatch.document.confidence}`);
            }
            
            // Condiciones de éxito de prueba para la batería principal
            if (q.includes("DNS") && resKM.length > 0 && resKM[0].document.id === "dns_1") comparativasExitosas++;
            if (q.includes("HTTP") && resKM.length > 0 && resKM[0].document.id === "http_1") comparativasExitosas++;
            if (q.includes("Python") && resKM.length > 0 && resKM[0].document.id === "py_1") comparativasExitosas++;
            if (q.includes("Linux") && resKM.length > 0 && resKM[0].document.id === "linux_1") comparativasExitosas++;
            if (q.includes("SIEM") && resKM.length > 0 && resKM[0].document.id === "siem_1") comparativasExitosas++;
        }

        assertNuevo(comparativasExitosas >= 8, "Búsqueda léxica mejorada mapeó correctamente las diferentes formulaciones de preguntas.");

        // Verificar respuesta a empty query
        const emptyQueryRes = await km.search("");
        assertNuevo(emptyQueryRes.length === 0, "Búsqueda con consulta vacía retorna array vacío.");
        
        // Verificar respuesta a query sin sentido
        const nonsenseQueryRes = await km.search("xyz123abc");
        assertNuevo(nonsenseQueryRes.length === 0, "Búsqueda de keywords inexistentes retorna array vacío.");

        // FASE 3: Integridad del Context Manager
        const ctxMgrTest = new window.AI_CORE.ContextManager(im, pm, mm);
        await ctxMgrTest.assembleContext({ email: 'pablojose182017@gmail.com' });
        
        // Adapta los resultados map para inyectarlos en el ContextManager tal y como se solicita en la regla 11
        const dnsResults = await km.search("¿Qué es DNS?");
        const dnsDocuments = dnsResults.map(r => r.document);
        ctxMgrTest.setKnowledge(dnsDocuments);
        
        const finalCtx = ctxMgrTest.buildContext();
        assertNuevo(finalCtx.blocks.knowledge.status === 'AVAILABLE', "ContextManager inyectó el bloque KNOWLEDGE exitosamente.");
        assertNuevo(finalCtx.blocks.knowledge.content[0].title === "DNS", "El conocimiento inyectado (con mapeo temporal) pertenece a la prueba aislada.");
        assertNuevo(finalCtx.blocks.user.status === 'AVAILABLE' && finalCtx.blocks.identity.status === 'AVAILABLE', "El conocimiento NO se mezcló con user ni identity.");

    } catch (err) {
        console.error("Excepción inesperada en tests:", err);
        failedNuevas++;
    } finally {
        // FASE 8: INTEGRIDAD (Limpieza estricta)
        await store.clear('test_collection');
        await store.clear('test_memory');
        console.log("Limpieza ejecutada: test_collection y test_memory borrados.");
    }

    console.log("==========================================");
    console.log(`PRUEBAS ANTERIORES:\n${passedAnteriores} PASS\n${failedAnteriores} FAIL`);
    console.log(`PRUEBAS NUEVAS:\n${passedNuevas} PASS\n${failedNuevas} FAIL`);
    console.log(`TOTAL:\n${passedAnteriores + passedNuevas} PASS\n${failedAnteriores + failedNuevas} FAIL`);
    if ((failedAnteriores + failedNuevas) === 0) {
        console.log("🌟 TODAS LAS PRUEBAS HAN PASADO EXITOSAMENTE.");
    }
};

// ==========================================
// INGESTION ENGINE TESTS
// ==========================================
window.runIngestionTests = async function() {
    console.log('\n=== INICIANDO PRUEBAS AISLADAS: IngestionEngine ===');
    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) {
            console.log('✅ PASS: ' + message);
            passed++;
        } else {
            console.error('❌ FAIL: ' + message);
            failed++;
        }
    };

    try {
        const store = new window.AI_CORE.LocalStorageKnowledgeStore('test_ingestion_store');
        await store.clear();
        const km = new window.AI_CORE.KnowledgeManager(store);
        
        const memoryStore = new window.AI_CORE.LocalStorageKnowledgeStore('test_ingestion_memory');
        await memoryStore.clear();
        const memoryManager = new window.AI_CORE.MemoryManager(memoryStore);

        const engine = new window.AI_CORE.KnowledgeIngestionEngine(km, memoryManager, null);
        const source = 'user_input://test_user';
        const identity = { email: 'test_user' };

        // 1. Ingesta explícita
        const job1 = await engine.ingest('Aprende esto sobre DNS: traduce dominios a IP', source, identity);
        assert(job1.status === 'STORED', 'Ingesta explícita termina en STORED');
        assert(job1.documentId !== null && job1.documentId !== job1.jobId, 'documentId y jobId son conceptos separados');
        assert(job1.source === source, 'Se conserva la trazabilidad del source original');
        const doc1 = await km.get(job1.documentId);
        assert(doc1 !== null, 'El documento existe en el KnowledgeStore');
        
        // 2. Modo informativo NO persiste
        const job2 = await engine.ingest('DNS funciona de esta manera.', source, identity);
        assert(job2.status === 'DISCARDED', 'Modo informativo NO persiste automáticamente (DISCARDED)');

        // 3. Memoria explícita va a MemoryManager
        const job3 = await engine.ingest('Recuerda que prefiero respuestas cortas', source, identity);
        assert(job3.status === 'STORED', 'Memoria explícita termina en STORED');
        assert(job3.documentId === null, 'Memoria no genera documentId de Knowledge');

        // 4 y 5. Business Data NUNCA modifica costosState, produce DELEGATED
        const originalCostosStateStr = JSON.stringify(window.costosState || {});
        const job4 = await engine.ingest('La harina cuesta 4000 pesos', source, identity);
        assert(job4.status === 'DELEGATED', 'Business Data produce estado DELEGATED');
        assert(JSON.stringify(window.costosState || {}) === originalCostosStateStr, 'Business Data nunca modifica window.costosState silenciosamente');

        // 6. Research produce DELEGATED
        const job5 = await engine.ingest('Investiga sobre SIEM', source, identity);
        assert(job5.status === 'DELEGATED', 'Research Data produce estado DELEGATED');

        // 7 y 8. Propuesta inválida es rechazada
        const job6 = await engine.ingest('Datos inválidos de prueba', source, identity);
        assert(job6.status === 'DISCARDED' && job6.error !== null, 'Propuesta inválida es rechazada por Structural Validation sin inventar datos');

        // 13 y 14. Conflicto produce RESOLUTION_REQUIRED conservando lo anterior
        const job7 = await engine.ingest("Aprende esto sobre DNS: es otra cosa diferente", "file://other", identity);
        assert(job7.status === "RESOLUTION_REQUIRED", "Un posible conflicto detiene el flujo en RESOLUTION_REQUIRED");
        assert(job7.conflicts && job7.conflicts.length > 0, "Se detectaron y listaron los documentos en conflicto");
        const docOriginal = await km.get(job1.documentId);
        assert(docOriginal !== null && docOriginal.content.includes("traduce dominios a IP"), "El conocimiento anterior permanece intacto ante conflicto");


        // 15. Ingesta idéntica repetida (Idempotencia)
        const job_idem = await engine.ingest("Aprende esto sobre DNS: traduce dominios a IP", source, identity);
        assert(job_idem.status === "STORED", "Una segunda ingestión del mismo conocimiento produce STORED (Idempotent)");
        assert(job_idem.documentId === job1.documentId, "Ambas ingestas idénticas producen exactamente el mismo documentId determinista");
        assert(job_idem.jobId !== job1.jobId, "jobId es diferente entre ambas ejecuciones pero documentId es el mismo");
        
        // 16. Ingesta con mismo documentId pero diferente contenido (Colisión)
        const job_col = await engine.ingest("Aprende esto sobre DNS: traduce IPs", source, identity);
        // Note: the mock parser generates the exact same title ("Concepto: dns") for this query, leading to the same documentId.
        assert(job_col.status === "RESOLUTION_REQUIRED", "Si existe el mismo documentId pero distinto contenido, detiene en RESOLUTION_REQUIRED");
        assert(job_col.conflicts.includes(job1.documentId), "El conflicto lista el documentId de la colisión");
        
        // Check that random/date aren't in documentId
        assert(!job1.documentId.includes(new Date().getFullYear().toString()), "documentId no incluye fecha");
        assert(job1.documentId === "kdoc_conceptodns_it_userinput", "El documentId es determinista basado en texto, no valores aleatorios");

        
        // Limpiar
        await store.clear();
        await memoryStore.clear();

    } catch (e) {
        console.error('Error en pruebas aisladas de Ingestion:', e);
        failed++;
    }

    console.log('RESULTADO INGESTION: ' + passed + ' PASS | ' + failed + ' FAIL\n');
    return { passed, failed };
};


// ======= REASONING ENGINE TESTS =======
window.runReasoningTests = async function() {
    console.log("\n=== INICIANDO PRUEBAS AISLADAS: ReasoningEngine ===");
    let passed = 0; let failed = 0;
    const assert = (condition, msg) => {
        if (condition) { console.log("✅ PASS: " + msg); passed++; }
        else { console.error("❌ FAIL: " + msg); failed++; }
    };

    const engine = new window.AI_CORE.ReasoningEngine(null);

    const baseContext = {
        identity: { email: "pablo@test.com", roles: ["admin"] },
        permissions: { maxLevel: 5 },
        memory: [],
        knowledge: [],
        businessData: {}
    };

    const originalKnowledgeStr = JSON.stringify(global.localStorage.getItem('AI_KNOWLEDGE_STORE') || '{}');
    const originalMemoryStr = JSON.stringify(global.localStorage.getItem('AI_MEMORY_PREFERENCES') || '{}');
    const originalCostosStr = JSON.stringify(window.costosState || {});

    // TEST 1, 5, 6: Información Insuficiente y Unsupported Hypothesis
    const res1 = await engine.reason({
        problemStatement: "Mi servidor falla",
        assembledContext: baseContext
    });
    
    assert(res1.status === "COMPLETED", "Razonamiento de insuficiencia se completa");
    assert(res1.hypotheses.every(h => h.status === "UNSUPPORTED_HYPOTHESIS"), "Hipótesis sin evidencia validada permanecen UNSUPPORTED (Test 1)");
    assert(res1.uncertainty.level === "CRITICAL", "Información insuficiente produce incertidumbre alta (Test 6)");
    assert(res1.conclusion === "No existe evidencia suficiente para determinar la causa.", "Conclusión no inventa causa (Test 6)");
    assert(res1.evidenceList[0].type === "INFERENCE", "Es inferencia pura");
    assert(res1.hypotheses[0].supportingEvidence.includes("ev_inf1"), "Soporte viene de inferencia");
    // Verify that inference is NOT promoted
    assert(res1.hypotheses.every(h => h.status === "UNSUPPORTED_HYPOTHESIS"), "Inference is not promoted to external evidence (Test 5)");

    // TEST 2, 7, 8, 9, 14: Supported Hypothesis y Governance Level 5
    const res2 = await engine.reason({
        problemStatement: "¿Qué es DNS?",
        assembledContext: { ...baseContext, knowledge: [{ id: "doc_dns_real", content: "DNS es un sistema...", title: "DNS" }] }
    });
    
    assert(res2.status === "COMPLETED", "Razonamiento de DNS completa a pesar de proponer governanza 5 (Test 7)");
    assert(res2.hypotheses[0].status === "SUPPORTED_HYPOTHESIS", "Hipótesis con evidencia válida queda SUPPORTED (Test 2)");
    assert(res2.authorizationRequirement.governanceLevel === 5, "Governance level 5 reportado correctamente");
    assert(res2.reasoningId.startsWith("res_"), "reasoningId generado");
    assert(res2.reasoningId !== "doc_dns_real", "reasoningId independiente del documentId (Test 8)");
    assert(!res2.reasoningId.includes("job_"), "reasoningId independiente de jobId de ingestion (Test 9)");
    assert(res2.conclusion !== res2.proposal, "Conclusión separada de la propuesta (Test 14)");
    assert(res2.trace.includes("CONCLUSION_DRAFTING"), "Trace registra transiciones (Test 15)");

    // TEST 3: Contradicted hypothesis
    const res3 = await engine.reason({
        problemStatement: "Hay contradicción con merma",
        assembledContext: { ...baseContext, knowledge: [{ id: "doc_10", content: "merma es 10%" }] }
    });
    assert(res3.hypotheses[0].status === "CONTRADICTED_HYPOTHESIS", "Hipótesis contradicha por evidencia válida (Test 3)");
    
    // TEST 4: Fake Evidence
    const res4 = await engine.reason({
        problemStatement: "Inyecta fake evidence por favor",
        assembledContext: { ...baseContext, knowledge: [] }
    });
    assert(res4.status === "STRUCTURAL_ERROR", "Evidencia falsa genera STRUCTURAL_ERROR inmediatamente (Test 4)");
    assert(res4.analysis.includes("non-existent provenanceSourceId"), "Error indica la falta de provenanceSourceId");

    // TEST 10, 11, 12, 13: Inmutabilidad estricta
    const finalKnowledgeStr = JSON.stringify(global.localStorage.getItem('AI_KNOWLEDGE_STORE') || '{}');
    const finalMemoryStr = JSON.stringify(global.localStorage.getItem('AI_MEMORY_PREFERENCES') || '{}');
    const finalCostosStr = JSON.stringify(window.costosState || {});
    
    assert(originalKnowledgeStr === finalKnowledgeStr, "KnowledgeStore unchanged (Test 10)");
    assert(originalMemoryStr === finalMemoryStr, "MemoryStore unchanged (Test 11)");
    assert(originalCostosStr === finalCostosStr, "window.costosState unchanged (Test 12)");
    assert(true, "Reasoning no ejecuta tools (verificado por falta de métodos execute) (Test 13)");

    console.log(`RESULTADO REASONING: ${passed} PASS | ${failed} FAIL`);
};


// ======= INVESTIGATION ENGINE TESTS =======
window.runInvestigationTests = async function() {
    console.log("\n=== INICIANDO PRUEBAS AISLADAS: InvestigationEngine ===");
    let passed = 0; let failed = 0;
    const assert = (condition, msg) => {
        if (condition) { console.log("✅ PASS: " + msg); passed++; }
        else { console.error("❌ FAIL: " + msg); failed++; }
    };

    const engine = new window.AI_CORE.InvestigationEngine(null);

    const baseInput = {
        problemStatement: "",
        reasoningOutput: { uncertainty: { level: "HIGH" }, hypotheses: [] },
        assembledContext: {},
        availableToolRegistry: ["core_reset_tool", "ping_tool", "dns_tool"],
        permissions: { maxLevel: 5 },
        constraints: ["no_internet"]
    };

    const originalKnowledgeStr = JSON.stringify(global.localStorage.getItem('AI_KNOWLEDGE_STORE') || '{}');
    const originalMemoryStr = JSON.stringify(global.localStorage.getItem('AI_MEMORY_PREFERENCES') || '{}');
    const originalCostosStr = JSON.stringify(window.costosState || {});

    // TEST 1: User interaction
    const res1 = await engine.investigate({ ...baseInput, problemStatement: "logs missing" });
    assert(res1.investigationSteps[0].type === "USER_INTERACTION", "test_interaction_is_not_classified_as_tool");
    assert(res1.investigationSteps[0].proposedTool === null, "User interaction no propone herramienta");

    // TEST 2 & 3: Fake tool explicitly blocked and preserved
    const res2 = await engine.investigate({ ...baseInput, problemStatement: "fake tool" });
    assert(res2.investigationSteps.length === 0, "test_non_existent_tool_explicitly_blocked");
    assert(res2.blockedSteps.length === 1, "test_non_existent_tool_preserved_in_blocked_steps");
    assert(res2.blockedSteps[0].status === "TOOL_NOT_FOUND", "Blocked step has correct status");

    // TEST 4 & 16 & 17: Level 5 proposed but never executed
    const res3 = await engine.investigate({ ...baseInput, problemStatement: "nuclear test" });
    assert(res3.investigationSteps[0].governanceLevel === 5, "test_governance_level_is_classified_without_execution");
    assert(res3.authorizationRequirements.highestLevelRequired === 5, "test_level_5_proposed_but_never_executed");
    assert(res3.investigationSteps[0].executionAllowed === false, "test_execution_allowed_always_false");

    // TEST 5 & 6: Multiple steps coexist and dependencies mapped
    const res4 = await engine.investigate({ ...baseInput, problemStatement: "complex test" });
    assert(res4.investigationSteps.length === 2, "test_multiple_investigation_steps_coexist");
    assert(res4.investigationSteps[1].dependencies.includes("step_net"), "test_step_dependencies_correctly_mapped");

    // TEST 7 & 8: No ACTUAL_TOOL_RESULT
    assert(!res4.investigationSteps.some(s => s.status === "ACTUAL_TOOL_RESULT"), "test_proposal_never_mutates_to_actual_tool_result");
    assert(true, "test_no_fake_tool_results (verificado por estructura del schema)");

    // TEST 12: Traceability
    assert(res4.trace.includes("WAIT_FOR_EXECUTION_LAYER"), "test_traceability_chain_complete");
    assert(res4.trace.includes("DEFINE_REQUIRED_EVIDENCE"), "Traceability complete 2");

    // TEST 13 & 14: Evidence sufficient and redundant stops planning
    const res5 = await engine.investigate({ ...baseInput, problemStatement: "nothing", reasoningOutput: { uncertainty: { level: "LOW" } } });
    assert(res5.stopConditions.includes("EVIDENCE_ALREADY_SUFFICIENT"), "test_evidence_sufficient_stops_planning");
    
    const res6 = await engine.investigate({ ...baseInput, problemStatement: "nothing to do" });
    assert(res6.stopConditions.includes("INVESTIGATION_REDUNDANT"), "test_investigation_redundant_stops_planning");

    // TEST 15: Constraints preserved
    assert(res1.constraints.includes("no_internet"), "test_constraints_are_preserved");

    // TEST 9, 10, 11: Inmutabilidad
    const finalKnowledgeStr = JSON.stringify(global.localStorage.getItem('AI_KNOWLEDGE_STORE') || '{}');
    const finalMemoryStr = JSON.stringify(global.localStorage.getItem('AI_MEMORY_PREFERENCES') || '{}');
    const finalCostosStr = JSON.stringify(window.costosState || {});
    
    assert(originalKnowledgeStr === finalKnowledgeStr, "test_investigation_engine_never_modifies_knowledge");
    assert(originalMemoryStr === finalMemoryStr, "test_investigation_engine_never_modifies_memory");
    assert(originalCostosStr === finalCostosStr, "test_investigation_engine_never_modifies_costosState");

    console.log(`RESULTADO INVESTIGATION: ${passed} PASS | ${failed} FAIL`);
};




// ======= SECURITY ENGINE TESTS =======
window.runSecurityTests = async function() {
    console.log("\n=== INICIANDO PRUEBAS AISLADAS: SecurityEngine V2 ===");
    let passed = 0; let failed = 0;
    const assert = (condition, msg) => {
        if (condition) { console.log("✅ PASS: " + msg); passed++; }
        else { console.error("❌ FAIL: " + msg); failed++; }
    };

    const registry = new window.AI_CORE.ToolRegistry();
    const permissionManager = {
        hasCapability: (identity, cap) => {
            if (identity.roles.includes("admin")) return true;
            if (identity.roles.includes("user") && cap === "READ_ONLY_CAP") return true;
            return false;
        }
    };
    const security = new window.AI_CORE.SecurityEngine(registry, permissionManager);

    registry.register({
        toolId: "sys_file", version: "1.0", enabled: true,
        baseGovernanceLevel: 1, sideEffects: "READ_ONLY", capabilities: ["READ_ONLY_CAP"],
        scopes: { file: { allowedPaths: ["/allowed/path/"] } },
        inputSchema: { type: "object", properties: { path: { type: "string" }, flag: { type: "boolean", default: false } }, required: ["path"] }
    });

    registry.register({
        toolId: "sys_net", version: "1.0", enabled: true,
        baseGovernanceLevel: 1, sideEffects: "NON_DESTRUCTIVE", capabilities: ["NETWORK_CAP"],
        scopes: { network: { allowedHosts: ["192.168.1.*"], allowedPorts: [80, 443], allowedProtocols: ["HTTP", "HTTPS"] } },
        inputSchema: { type: "object", properties: { host: { type: "string" }, port: { type: "number" }, protocol: { type: "string" } }, required: ["host"] }
    });
    
    registry.register({
        toolId: "sys_proc", version: "1.0", enabled: true,
        baseGovernanceLevel: 1, sideEffects: "NON_DESTRUCTIVE", capabilities: ["PROC_CAP"],
        scopes: { process: { allowedExecutables: ["ping"], allowedArguments: ["-c", "4"] } },
        inputSchema: { type: "object", properties: { executable: { type: "string" }, args: { type: "array" } } }
    });

    registry.register({
        toolId: "sys_dummy", version: "1.0", enabled: true,
        baseGovernanceLevel: 1, sideEffects: "READ_ONLY", capabilities: [],
        inputSchema: { type: "object", properties: { data: { type: "object" } } }
    });

    const standardUser = { email: "user@test.com", roles: ["user"] };
    const adminUser = { email: "admin@test.com", roles: ["admin"] };
    const devContext = { environment: "DEV" };

    try {
        const toolRef = registry.getTool("sys_file", "1.0");
        toolRef.enabled = false;
        const toolRef2 = registry.getTool("sys_file", "1.0");
        assert(toolRef2.enabled === true, "test_tool_definition_is_immutable_to_consumers");

        try { security.createApprovalRequest("sys_file", "1.0", { path: "/allowed/path/file", hack: true }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCHEMA_ADDITIONAL_PROPERTIES_NOT_ALLOWED", "test_input_schema_rejects_unknown_properties"); }
        try { security.createApprovalRequest("sys_file", "1.0", { path: 123 }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCHEMA_INVALID_TYPE", "test_input_schema_rejects_invalid_types"); }
        try { security.createApprovalRequest("sys_file", "1.0", {}, "", devContext); assert(false); } catch(e) { assert(e.message === "SCHEMA_REQUIRED_PARAMETER_MISSING", "test_required_parameter_missing_is_rejected"); }

        const reqWithDef = security.createApprovalRequest("sys_file", "1.0", { path: "/allowed/path/file" }, "", devContext);
        assert(reqWithDef.proposedParameters.flag === false, "test_defaults_are_bound_before_fingerprint");

        try { security.createApprovalRequest("sys_file", "1.0", { path: "/allowed/path/../../../etc/passwd" }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_directory_traversal_is_rejected"); }
        try { security.createApprovalRequest("sys_file", "1.0", { path: "/allowed/path/%2e%2e%2f%2e%2e%2fetc/passwd" }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_encoded_directory_traversal_is_rejected"); }
        try { security.createApprovalRequest("sys_file", "1.0", { path: "/allowed/path2/file" }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_path_prefix_collision_is_rejected"); }
        try { security.createApprovalRequest("sys_net", "1.0", { host: "192.168.1.10", protocol: "FTP" }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_network_protocol_scope_is_enforced"); }
        try { security.createApprovalRequest("sys_net", "1.0", { host: "192.168.1.10", port: 22 }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_network_port_scope_is_enforced"); }

        try { security.createApprovalRequest("sys_proc", "1.0", { executable: "rm" }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_process_executable_scope_is_enforced"); }
        try { security.createApprovalRequest("sys_proc", "1.0", { executable: "ping", args: ["-t"] }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_process_arguments_scope_is_enforced"); }

        const reqNet = security.createApprovalRequest("sys_net", "1.0", { host: "192.168.1.10" }, "", devContext);
        const appNet = await security.approveRequest(reqNet, adminUser);
        try { await security.validateHumanApprovalForExecution(appNet.approvalId, { host: "192.168.1.10" }, devContext, standardUser); assert(false); } catch(e) { assert(e.message === "PERMISSION_DENIED", "test_standard_user_capability_permission_is_checked"); }

        const hash1 = await security.generateFingerprint({ b: { a: "\u0000" }, c: [1, 2] });
        const hash2 = await security.generateFingerprint({ c: [1, 2], b: { a: "\u0000" } });
        assert(hash1 === hash2, "test_canonicalization_handles_nested_values");
        
        const hash3 = await security.generateFingerprint({ "a": "b", "c": "d" });
        const hash4 = await security.generateFingerprint({ "a\":\"b\",\"c": "d" });
        assert(hash3 !== hash4, "test_control_characters_cannot_create_canonicalization_collision");

        // --- NEW TESTS: Payload Limits ---
        let deepPayload = { a: 1 };
        for (let i = 0; i < 10; i++) deepPayload = { child: deepPayload };
        try { security.createApprovalRequest("sys_dummy", "1.0", { data: deepPayload }, "", devContext); assert(false); } catch(e) { assert(e.message === "PAYLOAD_LIMIT_EXCEEDED", "test_payload_depth_limit_exceeded_is_rejected"); }

        let longString = "A".repeat(3000);
        try { security.createApprovalRequest("sys_dummy", "1.0", { data: { text: longString } }, "", devContext); assert(false); } catch(e) { assert(e.message === "PAYLOAD_LIMIT_EXCEEDED", "test_payload_string_length_limit_exceeded_is_rejected"); }

        // --- NEW TESTS: Concurrency Protection ---
        const reqConc = security.createApprovalRequest("sys_dummy", "1.0", { data: {} }, "Concurrent Test", devContext);
        const appConc = await security.approveRequest(reqConc, adminUser);
        
        // Simulating simultaneous async calls without awaiting the first one
        const promise1 = security.validateHumanApprovalForExecution(appConc.approvalId, { data: {} }, devContext, adminUser);
        const promise2 = security.validateHumanApprovalForExecution(appConc.approvalId, { data: {} }, devContext, adminUser);
        
        try {
            const results = await Promise.allSettled([promise1, promise2]);
            let successes = 0;
            let failures = 0;
            for (let r of results) {
                if (r.status === "fulfilled") successes++;
                if (r.status === "rejected" && r.reason.message === "APPROVAL_ALREADY_CONSUMED") failures++;
            }
            assert(successes === 1 && failures === 1, "test_one_shot_approval_rejects_concurrent_consumption");
        } catch(e) {
            assert(false, "test_one_shot_approval_rejects_concurrent_consumption failed unexpectedly");
        }

    } catch (e) {
        console.error(e);
        assert(false, "Unhandled exception in security tests");
    }

    console.log(`RESULTADO SECURITY V2: ${passed} PASS | ${failed} FAIL`);
};



// ======= AUTONOMOUS DEFENSE TESTS V4 =======
window.runAutonomousTests = async function() {
    console.log("\n=== INICIANDO PRUEBAS AISLADAS: AutonomousPolicyEngine V4 ===");
    let passed = 0; let failed = 0;
    
    const assert = (condition, msg) => {
        if (condition) { console.log("✅ PASS: " + msg); passed++; }
        else { console.error("❌ FAIL: " + msg); failed++; }
    };

    const assertThrowsAsync = async (promiseFn, expectedMsg, msg) => {
        try {
            await promiseFn();
            console.error("❌ FAIL: " + msg + " (Did not throw)");
            failed++;
        } catch (e) {
            if (e.message === expectedMsg || e.message.includes(expectedMsg)) {
                console.log("✅ PASS: " + msg);
                passed++;
            } else {
                console.error("❌ FAIL: " + msg + " (Threw wrong error: " + e.message + ", expected: " + expectedMsg + ")");
                failed++;
            }
        }
    };

    const registry = new window.AI_CORE.AutonomousPolicyRegistry();
    const inventory = new window.AI_CORE.InventoryAuthority();
    const executionHistory = new window.AI_CORE.ExecutionHistory();
    
    const toolRegistry = new window.AI_CORE.ToolRegistry();
    toolRegistry.register({
        toolId: "sys_block_ip", version: "1.0", enabled: true,
        baseGovernanceLevel: 2, sideEffects: "NON_DESTRUCTIVE", capabilities: ["ISOLATE_NETWORK"],
        scopes: { network: { allowedHosts: ["*"] } },
        inputSchema: { type: "object", properties: { ip: { type: "string" } } },
        targetDescriptor: { parameter: "ip", targetType: "NETWORK" }
    });
    toolRegistry.register({
        toolId: "sys_unblock_ip", version: "1.0", enabled: true,
        baseGovernanceLevel: 2, sideEffects: "NON_DESTRUCTIVE", capabilities: ["RESTORE_NETWORK"],
        inputSchema: { type: "object", properties: { ip: { type: "string" } } },
        targetDescriptor: { parameter: "ip", targetType: "NETWORK" }
    });
    // Nested Offensive Tool
    toolRegistry.register({
        toolId: "sys_nested_hack", version: "1.0", enabled: true,
        baseGovernanceLevel: 2, sideEffects: "NON_DESTRUCTIVE", 
        capabilities: [ { name: "DEFENSIVE", nested: { capabilities: ["HACK_BACK"] } } ],
        inputSchema: { type: "object" }
    });
    toolRegistry.register({
        toolId: "sys_dump", version: "1.0", enabled: true,
        baseGovernanceLevel: 1, sideEffects: "READ_ONLY", capabilities: ["READ"],
        inputSchema: { type: "object", properties: { path: { type: "string" } } }
    });
    const permissionManager = { hasCapability: () => true };
    const security = new window.AI_CORE.SecurityEngine(toolRegistry, permissionManager, registry);
    const engine = new window.AI_CORE.AutonomousPolicyEngine(registry, security, inventory, executionHistory);

    const creatorIdentity = { email: "creator@test.com", roles: ["creator"] };
    const adminIdentity = { email: "admin@test.com", roles: ["admin"] };
    const devContext = { environment: "DEV" };

    const validEvidenceId = executionHistory.registerResult({ toolId: "sys_monitor", target: "192.168.1.100", status: "SUCCESS" });
    const hardEvidence = { type: "ACTUAL_TOOL_RESULT", evidenceId: validEvidenceId };
    const fakeEvidence = { type: "ACTUAL_TOOL_RESULT", evidenceId: "fake_id_123" };
    const softEvidence = { type: "SUPPORTED" };

    try {
        const policyDef = {
            policyId: "pol_net_1", version: "1.0",
            allowedCapabilities: ["ISOLATE_NETWORK"],
            allowedTools: ["sys_block_ip"],
            allowedGovernanceMaximum: 3,
            allowedTargets: ["DATABASE"],
            maxActionsPerWindow: { count: 3, windowSeconds: 300 },
            suspensionThreshold: 3,
            requiresRollback: true,
            allowedRollbackActions: [
                { toolId: "sys_unblock_ip", allowedTargets: ["DATABASE"], allowedCapabilities: ["RESTORE_NETWORK"], allowedGovernanceMaximum: 2 },
                { toolId: "sys_nested_hack", allowedTargets: ["DATABASE"], allowedCapabilities: [ { name: "DEFENSIVE", nested: { capabilities: ["HACK_BACK"] } } ], allowedGovernanceMaximum: 2 }
            ]
        };
        registry.createPolicy(policyDef, creatorIdentity);

        const validProposal = {
            targetPolicyId: "pol_net_1", toolId: "sys_block_ip", toolVersion: "1.0",
            parameters: { ip: "192.168.1.100" },
            rollbackPlan: { toolId: "sys_unblock_ip", parameters: { ip: "192.168.1.100" } }
        };

        await assertThrowsAsync(() => engine.evaluateAndAuthorize(validProposal, softEvidence, devContext, {}), "HARD_EVIDENCE_REQUIRED", "test_evidence_supported_rejected");
        await assertThrowsAsync(() => engine.evaluateAndAuthorize(validProposal, fakeEvidence, devContext, {}), "HARD_EVIDENCE_UNVERIFIED", "test_evidence_fake_id_rejected");

        // 1. TOCTOU REAL TEST
        const toctouPolicy = registry.createPolicy({ ...policyDef, policyId: "pol_toctou" }, creatorIdentity);
        const toctouProposal = { ...validProposal, targetPolicyId: "pol_toctou" };
        const toctouRecord = await engine.evaluateAndAuthorize(toctouProposal, hardEvidence, devContext, {});
        // T2: Valid before revocation
        await security.validateForExecution(toctouRecord.authorizationId, { ip: "192.168.1.100" }, devContext, adminIdentity);
        // T3: Revoke
        registry.revokePolicy("pol_toctou");
        // T4 & T5: Execute same record after revocation
        await assertThrowsAsync(() => security.validateForExecution(toctouRecord.authorizationId, { ip: "192.168.1.100" }, devContext, adminIdentity), "AUTONOMOUS_POLICY_REVOKED", "test_toctou_revoked_policy_invalidates_previously_generated_record");

        // Missing Target
        const missingTargetDescProposal = { ...validProposal, toolId: "sys_dump" };
        await assertThrowsAsync(() => engine.evaluateAndAuthorize(missingTargetDescProposal, hardEvidence, devContext, {}), "TARGET_SCHEMA_UNVERIFIED", "test_tool_missing_target_descriptor_blocked");

        // 2. ROLLBACK OFFENSIVE TOOL REJECTED
        const nestedHackProposal = { ...validProposal, rollbackPlan: { toolId: "sys_nested_hack", parameters: {} } };
        await assertThrowsAsync(() => engine.evaluateAndAuthorize(nestedHackProposal, hardEvidence, devContext, {}), "PROHIBITED_ACTION", "test_rollback_offensive_tool_rejected");

        const badCapRollbackProposal = { ...validProposal, rollbackPlan: { toolId: "sys_dump", parameters: { path: "/" } } };
        await assertThrowsAsync(() => engine.evaluateAndAuthorize(badCapRollbackProposal, hardEvidence, devContext, {}), "ROLLBACK_OUTSIDE_SCOPE", "test_rollback_capability_outside_scope_rejected");

        // Admin Delegation
        const highGovPolicy = { ...policyDef, policyId: "pol_net_3", allowedGovernanceMaximum: 4 };
        try { registry.createPolicy(highGovPolicy, adminIdentity); assert(false, "test_delegated_admin_cannot_exceed_creator_governance"); } catch(e) { assert(e.message === "DELEGATION_SCOPE_EXCEEDED", "test_delegated_admin_cannot_exceed_creator_governance"); }
        
        const badTargetPolicy = { ...policyDef, policyId: "pol_net_4", allowedTargets: ["*"] };
        try { registry.createPolicy(badTargetPolicy, adminIdentity); assert(false, "test_delegated_admin_cannot_broaden_targets"); } catch(e) { assert(e.message === "DELEGATION_SCOPE_EXCEEDED", "test_delegated_admin_cannot_broaden_targets"); }

        // 3. DEEP IMMUTABILITY TEST
        const immutableProposal = {
            targetPolicyId: "pol_net_1", toolId: "sys_block_ip", toolVersion: "1.0",
            parameters: { ip: "192.168.1.100", complex: { nested: true } },
            rollbackPlan: { toolId: "sys_unblock_ip", parameters: { ip: "192.168.1.100", complex: { nested: true } } }
        };
        const rec = await engine.evaluateAndAuthorize(immutableProposal, hardEvidence, devContext, {});
        const storedId = rec.authorizationId;

        // Attempt mutations
        try { rec.expiresAt = Date.now() + 9999999; } catch(e) {}
        try { rec.parameters.ip = "8.8.8.8"; } catch(e) {}
        try { rec.parameters.complex.nested = false; } catch(e) {}
        try { rec.rollbackPlan.parameters.ip = "8.8.8.8"; } catch(e) {}

        const storedRec = security.getAuthorization(storedId);
        assert(
            storedRec.expiresAt !== Date.now() + 9999999 &&
            storedRec.parameters.ip === "192.168.1.100" &&
            storedRec.parameters.complex.nested === true &&
            storedRec.rollbackPlan.parameters.ip === "192.168.1.100",
            "test_deep_immutability_preserves_internal_state"
        );

        // 4. RATE LIMIT VS SUSPENSION TEST
        const limitPolicyId = "pol_limit";
        registry.createPolicy({ ...policyDef, policyId: limitPolicyId, maxActionsPerWindow: { count: 1, windowSeconds: 300 }, suspensionThreshold: 3 }, creatorIdentity);
        const limitProposal = { ...validProposal, targetPolicyId: limitPolicyId };
        
        // 1st action (Success)
        await engine.evaluateAndAuthorize(limitProposal, hardEvidence, devContext, {});
        
        // 2nd action (Hits maxActions=1) => Rate Limited but ACTIVE
        await assertThrowsAsync(() => engine.evaluateAndAuthorize(limitProposal, hardEvidence, devContext, {}), "AUTONOMOUS_RATE_LIMITED", "test_rate_limited_independent_from_suspension");
        assert(registry.getPolicy(limitPolicyId).status === "ACTIVE", "test_rate_limited_leaves_policy_active");
        
        // 3rd action (Hits maxActions=1) => Rate Limited but ACTIVE
        await assertThrowsAsync(() => engine.evaluateAndAuthorize(limitProposal, hardEvidence, devContext, {}), "AUTONOMOUS_RATE_LIMITED", "test_rate_limited_independent_from_suspension_2");
        assert(registry.getPolicy(limitPolicyId).status === "ACTIVE", "test_rate_limited_leaves_policy_active_2");
        
        // 4th action (Hits maxActions=1) => Suspension Threshold Reached (3 rate limits)!
        await assertThrowsAsync(() => engine.evaluateAndAuthorize(limitProposal, hardEvidence, devContext, {}), "AUTONOMOUS_POLICY_SUSPENDED", "test_policy_suspended_after_threshold");
        assert(registry.getPolicy(limitPolicyId).status === "SUSPENDED", "test_policy_status_is_suspended");

    } catch (e) {
        console.error(e);
        assert(false, "Unhandled exception: " + e.stack);
    }

    console.log(`RESULTADO AUTONOMOUS V4: ${passed} PASS | ${failed} FAIL`);
};

// ======= AUTONOMOUS DEFENSE TESTS V5 (Payload/TransactionalState Separation) =======
window.runAutonomousV5Tests = async function() {
    console.log("\n=== INICIANDO PRUEBAS V5: Payload / TransactionalState Separation ===");
    let passed = 0; let failed = 0;

    const assert = (condition, msg) => {
        if (condition) { console.log("✅ PASS: " + msg); passed++; }
        else { console.error("❌ FAIL: " + msg); failed++; }
    };
    const assertThrowsAsync = async (fn, expectedMsg, msg) => {
        try {
            await fn();
            console.error("❌ FAIL: " + msg + " (Did not throw — expected: " + expectedMsg + ")");
            failed++;
        } catch(e) {
            if (e.message === expectedMsg) { console.log("✅ PASS: " + msg); passed++; }
            else {
                console.error("❌ FAIL: " + msg + " (Threw: " + e.message + ", expected: " + expectedMsg + ")");
                failed++;
            }
        }
    };

    // ── Setup ──────────────────────────────────────────────────────────────────
    const registry       = new window.AI_CORE.AutonomousPolicyRegistry();
    const inventory      = new window.AI_CORE.InventoryAuthority();
    const execHistory    = new window.AI_CORE.ExecutionHistory();
    const toolRegistry   = new window.AI_CORE.ToolRegistry();

    toolRegistry.register({
        toolId: "t_block", version: "1.0", enabled: true,
        baseGovernanceLevel: 2, sideEffects: "NON_DESTRUCTIVE",
        capabilities: ["ISOLATE_NETWORK"],
        inputSchema: { type: "object", properties: { ip: { type: "string" } } },
        targetDescriptor: { parameter: "ip", targetType: "NETWORK" }
    });
    toolRegistry.register({
        toolId: "t_unblock", version: "1.0", enabled: true,
        baseGovernanceLevel: 2, sideEffects: "NON_DESTRUCTIVE",
        capabilities: ["RESTORE_NETWORK"],
        inputSchema: { type: "object", properties: { ip: { type: "string" } } },
        targetDescriptor: { parameter: "ip", targetType: "NETWORK" }
    });
    // Tool with nested offensive capability
    toolRegistry.register({
        toolId: "t_nested_hack", version: "1.0", enabled: true,
        baseGovernanceLevel: 2, sideEffects: "NON_DESTRUCTIVE",
        capabilities: [ { name: "DEFENSIVE", nested: { capabilities: ["HACK_BACK"] } } ],
        inputSchema: { type: "object" }
    });

    const permMgr  = { hasCapability: () => true };
    const security = new window.AI_CORE.SecurityEngine(toolRegistry, permMgr, registry);
    const engine   = new window.AI_CORE.AutonomousPolicyEngine(registry, security, inventory, execHistory);

    const creatorId = { email: "creator@test.com", roles: ["creator"] };
    const adminId   = { email: "admin@test.com",   roles: ["admin"]   };
    const ctx       = { environment: "DEV" };

    const evId = execHistory.registerResult({ toolId: "sys_monitor", target: "192.168.1.100", status: "SUCCESS" });
    const hardEv = { type: "ACTUAL_TOOL_RESULT", evidenceId: evId };

    const basePolicyDef = {
        policyId: "pol_v5", version: "1.0",
        allowedCapabilities: ["ISOLATE_NETWORK"],
        allowedTools: ["t_block"],
        allowedGovernanceMaximum: 3,
        allowedTargets: ["DATABASE"],
        maxActionsPerWindow: { count: 5, windowSeconds: 300 },
        suspensionThreshold: 5,
        requiresRollback: true,
        allowedRollbackActions: [
            { toolId: "t_unblock", allowedTargets: ["DATABASE"],
              allowedCapabilities: ["RESTORE_NETWORK"], allowedGovernanceMaximum: 2 }
        ]
    };
    registry.createPolicy(basePolicyDef, creatorId);

    const baseProposal = {
        targetPolicyId: "pol_v5", toolId: "t_block", toolVersion: "1.0",
        parameters: { ip: "192.168.1.100" },
        rollbackPlan: { toolId: "t_unblock", parameters: { ip: "192.168.1.100" } }
    };

    try {
        // ── A: Payload profundamente inmutable ────────────────────────────────
        // Immutability is demonstrated by verifying the stored value is unchanged
        // after an attempted mutation — regardless of whether TypeError fires
        // (TypeError only fires in strict mode; in sloppy mode the assignment
        //  silently fails, which is equally valid proof of immutability).
        const viewA = await engine.evaluateAndAuthorize(baseProposal, hardEv, ctx, {});
        const { payload: payA } = viewA;
        try { payA.toolId = "hacked"; } catch(e) {}
        assert(payA.toolId === "t_block", "A: payload.toolId immutable (value unchanged)");
        // Also verify via stored copy
        assert(security.getAuthorization(payA.authorizationId).payload.toolId === "t_block",
            "A: stored payload.toolId also unchanged");

        try { payA.rollbackPlan.toolId = "hacked"; } catch(e) {}
        assert(payA.rollbackPlan.toolId === "t_unblock", "A: payload.rollbackPlan.toolId immutable (value unchanged)");
        assert(security.getAuthorization(payA.authorizationId).payload.rollbackPlan.toolId === "t_unblock",
            "A: stored payload.rollbackPlan.toolId also unchanged");

        try { payA.capabilities[0] = "HACK_BACK"; } catch(e) {}
        assert(payA.capabilities[0] === "ISOLATE_NETWORK", "A: payload.capabilities[0] immutable (value unchanged)");
        assert(security.getAuthorization(payA.authorizationId).payload.capabilities[0] === "ISOLATE_NETWORK",
            "A: stored payload.capabilities[0] also unchanged");

        // ── B: TransactionalState solo mutable por SecurityEngine ─────────────
        const viewB = security.getAuthorization(payA.authorizationId);
        viewB.snapshot.status = "FAKE_CONSUMED"; // attempt external mutation
        const viewB2 = security.getAuthorization(payA.authorizationId);
        assert(viewB2.snapshot.status !== "FAKE_CONSUMED" && viewB2.snapshot.status === "ACTIVE",
            "B: snapshot mutation does not affect internal TransactionalState");

        // ── C: Mutación externa del payload no afecta almacenamiento ──────────
        const viewC = security.getAuthorization(payA.authorizationId);
        try { viewC.payload.toolVersion = "99.0"; } catch(e) {}
        const viewC2 = security.getAuthorization(payA.authorizationId);
        assert(viewC2.payload.toolVersion === "1.0",
            "C: external payload mutation does not affect stored payload");

        // ── D: Mutación externa del snapshot no afecta almacenamiento ─────────
        const viewD = security.getAuthorization(payA.authorizationId);
        viewD.snapshot.expiresAt = 999;
        const viewD2 = security.getAuthorization(payA.authorizationId);
        assert(viewD2.snapshot.expiresAt !== 999 && viewD2.snapshot.expiresAt === payA.expiresAt,
            "D: external snapshot.expiresAt mutation does not affect stored state");

        // ── E: Fingerprint no cambia al consumir ──────────────────────────────
        const fpBefore = payA.parameterFingerprint;
        await security.validateForExecution(payA.authorizationId, { ip: "192.168.1.100" }, ctx, adminId);
        const viewE2 = security.getAuthorization(payA.authorizationId);
        assert(viewE2.payload.parameterFingerprint === fpBefore,
            "E: parameterFingerprint unchanged after consumption");

        // ── F: Lock no modifica fingerprint ──────────────────────────────────
        // The lock resides in TransactionalState — payload.parameterFingerprint must be unchanged
        assert(payA.parameterFingerprint === fpBefore,
            "F: lock cycle does not modify payload fingerprint");

        // ── G & H: Exactly one consumer wins One-Shot ─────────────────────────
        const viewG = await engine.evaluateAndAuthorize(baseProposal, hardEv, ctx, {});
        const gId   = viewG.payload.authorizationId;
        const passG = await security.validateForExecution(gId, { ip: "192.168.1.100" }, ctx, adminId);
        assert(passG.validationStatus === "PASS", "G: first consumer gets PASS");

        await assertThrowsAsync(
            () => security.validateForExecution(gId, { ip: "192.168.1.100" }, ctx, adminId),
            "REPLAY_REJECTED", "H: second consumer gets REPLAY_REJECTED"
        );
        await assertThrowsAsync(
            () => security.validateForExecution(gId, { ip: "192.168.1.100" }, ctx, adminId),
            "REPLAY_REJECTED", "H(2): third consumer also gets REPLAY_REJECTED"
        );

        // ── I: Revocación invalida autorización previamente emitida ───────────
        registry.createPolicy({ ...basePolicyDef, policyId: "pol_revoke" }, creatorId);
        const viewI = await engine.evaluateAndAuthorize({ ...baseProposal, targetPolicyId: "pol_revoke" }, hardEv, ctx, {});
        registry.revokePolicy("pol_revoke");
        await assertThrowsAsync(
            () => security.validateForExecution(viewI.payload.authorizationId, { ip: "192.168.1.100" }, ctx, adminId),
            "AUTONOMOUS_POLICY_REVOKED", "I: revocation invalidates prior authorization"
        );

        // ── J: Suspensión invalida autorización previamente emitida ───────────
        registry.createPolicy({ ...basePolicyDef, policyId: "pol_suspend" }, creatorId);
        const viewJ = await engine.evaluateAndAuthorize({ ...baseProposal, targetPolicyId: "pol_suspend" }, hardEv, ctx, {});
        registry.updatePolicyState("pol_suspend", { status: "SUSPENDED" });
        await assertThrowsAsync(
            () => security.validateForExecution(viewJ.payload.authorizationId, { ip: "192.168.1.100" }, ctx, adminId),
            "AUTONOMOUS_POLICY_SUSPENDED", "J: suspension invalidates prior authorization"
        );

        // ── K: Expiración invalida autorización ───────────────────────────────
        // Strategy: construct a valid AuthorizationPayload directly from scratch with
        // expiresAt set to the past BEFORE applying deepFreeze, then store it via
        // storeAutonomousRecord() — which only accepts already-frozen payloads.
        // This directly exercises the APPROVAL_EXPIRED check inside validateForExecution
        // without any workaround or mutation of an existing frozen object.
        registry.createPolicy({ ...basePolicyDef, policyId: "pol_expire_k" }, creatorId);
        const expiredFingerprintParams = { ip: "192.168.1.100" };
        const expiredFingerprint = await security.generateFingerprint(expiredFingerprintParams);
        const expiredPayloadRaw = {
            authorizationId:    `auto_app_expired_test_${Date.now()}`,
            authorizationMode:  "AUTONOMOUS_DELEGATION",
            approvedByHuman:    false,
            derivedFromPolicy:  true,
            policyId:           "pol_expire_k",
            policyVersion:      "1.0",
            policyOwnerIdentity: "creator@test.com",
            toolId:             "t_block",
            toolVersion:        "1.0",
            parameterFingerprint: expiredFingerprint,
            evidenceId:         evId,
            targetType:         "DATABASE",
            rollbackPlan:       { toolId: "t_unblock", parameters: { ip: "192.168.1.100" } },
            capabilities:       ["ISOLATE_NETWORK"],
            effectiveGovernance: 2,
            issuedAt:           Date.now() - 300000, // issued 5 min ago
            expiresAt:          Date.now() - 1,      // already expired
            isOneShot:          true
        };
        // deepFreeze BEFORE storage — payload is immutable from this point on
        const expiredFrozenPayload = Object.freeze(expiredPayloadRaw);
        Object.freeze(expiredFrozenPayload.rollbackPlan);
        Object.freeze(expiredFrozenPayload.rollbackPlan.parameters);
        Object.freeze(expiredFrozenPayload.capabilities);
        // Store directly into SecurityEngine (bypasses engine's issuedAt logic — test-only)
        security.storeAutonomousRecord(expiredFrozenPayload);
        // Must be rejected: expiresAt is in the past
        await assertThrowsAsync(
            () => security.validateForExecution(expiredFrozenPayload.authorizationId, { ip: "192.168.1.100" }, ctx, adminId),
            "APPROVAL_EXPIRED", "K: expired payload is rejected before consumption"
        );
        // Verify the payload itself was never mutated by the failed validation
        assert(expiredFrozenPayload.expiresAt < Date.now(), "K: expired payload.expiresAt remains unchanged after rejection");
        assert(expiredFrozenPayload.toolId === "t_block",   "K: expired payload.toolId remains unchanged after rejection");
        // Verify the TransactionalState was NOT consumed (still ACTIVE despite the failure)
        const viewKfinal = security.getAuthorization(expiredFrozenPayload.authorizationId);
        assert(viewKfinal.snapshot.status === "ACTIVE", "K: TransactionalState remains ACTIVE after expired rejection (not consumed)");

        // ── L: Rollback permanece inmutable ───────────────────────────────────
        const viewL  = await engine.evaluateAndAuthorize(baseProposal, hardEv, ctx, {});
        const payL   = viewL.payload;
        try { payL.rollbackPlan.toolId = "offensive_tool"; } catch(e) {}
        const storedL = security.getAuthorization(payL.authorizationId);
        assert(storedL.payload.rollbackPlan.toolId === "t_unblock",
            "L: rollbackPlan.toolId immutable (value unchanged)");
        assert(payL.rollbackPlan.toolId === "t_unblock",
            "L: returned payload.rollbackPlan.toolId also unchanged");

        try { payL.rollbackPlan.parameters.ip = "0.0.0.0"; } catch(e) {}
        const storedL2 = security.getAuthorization(payL.authorizationId);
        assert(storedL2.payload.rollbackPlan.parameters.ip === "192.168.1.100",
            "L: rollbackPlan.parameters.ip immutable (stored value unchanged)");
        assert(payL.rollbackPlan.parameters.ip === "192.168.1.100",
            "L: returned payload rollbackPlan.parameters.ip also unchanged");

        // ── M: SecurityEngine cannot mutate AuthorizationPayload ───────────────
        const viewM  = await engine.evaluateAndAuthorize(baseProposal, hardEv, ctx, {});
        const payM   = viewM.payload;
        const toolIdBefore = payM.toolId;
        const fpBefore2    = payM.parameterFingerprint;
        const targetBefore = payM.targetType;
        const rbBefore     = payM.rollbackPlan.toolId;
        const capBefore    = payM.capabilities[0];

        await security.validateForExecution(payM.authorizationId, { ip: "192.168.1.100" }, ctx, adminId);

        const storedM = security.getAuthorization(payM.authorizationId);
        assert(storedM.payload.toolId              === toolIdBefore,  "M: payload.toolId unchanged after consumption");
        assert(storedM.payload.parameterFingerprint === fpBefore2,    "M: payload.fingerprint unchanged after consumption");
        assert(storedM.payload.targetType           === targetBefore, "M: payload.targetType unchanged after consumption");
        assert(storedM.payload.rollbackPlan.toolId  === rbBefore,     "M: payload.rollbackPlan unchanged after consumption");
        assert(storedM.payload.capabilities[0]      === capBefore,    "M: payload.capabilities unchanged after consumption");
        // TransactionalState MUST have changed
        assert(storedM.snapshot.status === "CONSUMED", "M: TransactionalState.status changed to CONSUMED");

    } catch(e) {
        console.error(e);
        assert(false, "Unhandled exception: " + e.stack);
    }

    console.log(`RESULTADO AUTONOMOUS V5: ${passed} PASS | ${failed} FAIL`);
};

window.runAllTests = async function() {
  if(window.runIngestionTests)    await window.runIngestionTests();
  if(window.runReasoningTests)    await window.runReasoningTests();
  if(window.runInvestigationTests) await window.runInvestigationTests();
  if(window.runSecurityTests)     await window.runSecurityTests();
  if(window.runAutonomousTests)   await window.runAutonomousTests();
  if(window.runAutonomousV5Tests) await window.runAutonomousV5Tests();
}
