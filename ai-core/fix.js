const fs = require('fs');
const path = 'c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-tests.js';
let content = fs.readFileSync(path, 'utf8');

const sep1 = '// ==========================================\n// INGESTION ENGINE TESTS';
const sep2 = '// ==========================================\r\n// INGESTION ENGINE TESTS';
let splitIndex = content.indexOf(sep1);
if (splitIndex === -1) splitIndex = content.indexOf(sep2);

if(splitIndex !== -1) {
    content = content.substring(0, splitIndex);
}

const newTests = `// ==========================================
// INGESTION ENGINE TESTS
// ==========================================
window.runIngestionTests = async function() {
    console.log('\\n=== INICIANDO PRUEBAS AISLADAS: IngestionEngine ===');
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
        const doc1 = await km.getDocument(job1.documentId);
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
        const job7 = await engine.ingest('Aprende esto sobre DNS: es otra cosa diferente', source, identity);
        assert(job7.status === 'RESOLUTION_REQUIRED', 'Un posible conflicto detiene el flujo en RESOLUTION_REQUIRED');
        assert(job7.conflicts && job7.conflicts.length > 0, 'Se detectaron y listaron los documentos en conflicto');
        const docOriginal = await km.getDocument(job1.documentId);
        assert(docOriginal !== null && docOriginal.content.includes('traduce dominios a IP'), 'El conocimiento anterior permanece intacto ante conflicto');
        
        // Limpiar
        await store.clear();
        await memoryStore.clear();

    } catch (e) {
        console.error('Error en pruebas aisladas de Ingestion:', e);
        failed++;
    }

    console.log('RESULTADO INGESTION: ' + passed + ' PASS | ' + failed + ' FAIL\\n');
    return { passed, failed };
};
`;

fs.writeFileSync(path, content + newTests);
console.log('Fixed');
