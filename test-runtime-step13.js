const fs = require('fs');

global.window = {};
global.document = {
    getElementById: () => ({ value: '', innerHTML: '', style: {}, appendChild: () => {}, remove: () => {} }),
    createElement: () => ({ style: {} })
};
global.localStorage = { 
    data: {}, 
    setItem(k,v){this.data[k]=v;}, 
    getItem(k){return this.data[k]||null;}, 
    removeItem(k){delete this.data[k];} 
};
global.prompt = () => "test_key";
global.alert = () => {};
global.currentUser = { email: "usuario_normal@gmail.com" }; 

let fetchUrls = [];
global.fetch = async (url) => {
    fetchUrls.push(url);
    if (url.includes('duckduckgo') || url.includes('html')) {
        return { 
            ok: true, 
            headers: new Map([['content-type', 'text/html']]),
            text: async () => '<html><title>Mock</title><body>Contenido mockeado suficientemente largo para pasar la validacion. Esto debe ser mayor a 50 caracteres para ser considerado util.</body></html>', 
            json: async () => ({ 
                Abstract: 'Mock web research result. Contenido lo suficientemente largo para ser considerado un buen snippet de busqueda web.', 
                AbstractURL: 'https://mock.com',
                Heading: 'Mock title'
            }) 
        };
    }
    return { ok: true, json: async () => ({}) };
};

window.costosState = {
    insumos: [ { id: "ins1", nombre: "Harina", costoUnitario: 2000 } ],
    recetas: [ 
        { 
            id: "rec1", nombre: "Pan", rendimiento: 10, precioVenta: 1000, factorServiciosPct: 10,
            ingredientes: [ { insumoId: "ins1", cantidad: 1 } ]
        } 
    ]
};

const deps = [
    'ai-core/ai-store.js',
    'ai-core/ai-knowledge.js',
    'ai-core/ai-security.js',
    'ai-core/ai-identity.js',
    'ai-core/ai-memory.js',
    'ai-core/ai-context.js',
    'ai-core/ai-provider.js',
    'ai-core/ai-reasoning.js',
    'ai-core/ai-personality.js',
    'ai-core/ai-offline-resolver.js',
    'ai-core/ai-web-fetcher.js',
    'ai-core/ai-ingestion.js',
    'ai-core/ai-investigation.js',
    'ai-core/ai-research-engine.js',
    'ai-core/ai-understanding.js',
    'ai-core/ai-chat-bridge.js',
    'guardian-financiero.js'
];

deps.forEach(file => {
    const code = fs.readFileSync('./' + file, 'utf8');
    eval(code);
});

let chatOutput = [];
window.appendMensajeGuardian = function(html, sender, save) {
    if (sender === 'guardian') {
        const history = window.AI_CORE.chatBridgeInstance.memoryManager.getShortTermMemory();
        const lastMsg = history[history.length - 1];
        if (lastMsg && lastMsg.metadata) {
            console.log(`[DEBUG] Intent: ${lastMsg.metadata.intent}`);
        }
    }
    chatOutput.push({ html, sender });
};

async function checkIntent(name, message, expectedStrings) {
    chatOutput = [];
    await window.enviarMensajeGuardian(message);
    const out = chatOutput.map(c => c.html).join(' ');
    
    const passed = Array.isArray(expectedStrings) 
        ? expectedStrings.some(s => out.includes(s)) 
        : out.includes(expectedStrings);
        
    if (passed) {
        console.log(`✅ [PASS] ${name}`);
        return true;
    }
    console.error(`❌ [FAIL] ${name}\n         Expected '${expectedStrings}'. Got: ${out}`);
    return false;
}

async function runTests() {
    console.log("=== Guardian Phase 13 Integration Tests ===\n");
    let passed = 0, failed = 0;
    
    global.localStorage.setItem('USE_NEW_AI_CORE', 'true');
    window.AI_CORE.chatBridgeInstance.permissionManager.rules = { maxLevel: 5, allowedCapabilities: ['WEB_SEARCH', 'KNOWLEDGE_INGEST_UNVERIFIED'] };
    window.AI_CORE.chatBridgeInstance.permissionManager.getGovernanceRules = function() { return this.rules; };
    window.AI_CORE.chatBridgeInstance.researchEngine.permissionManager = window.AI_CORE.chatBridgeInstance.permissionManager;
    fetchUrls = [];

    // 1. A factual query creates a pending web-approval request
    window.AI_CORE.chatBridgeInstance.clearSession();
    if (await checkIntent("T1: Factual Query -> Web Approval Request", "quien invento el pan", "Necesito tu autorización explícita para buscar esta información en internet")) passed++; else failed++;

    // 2. Explicit authorization with spelling errors resumes the correct pending query
    // and The original research topic, not the approval text, reaches WebFetcher
    let queryPassedToFetch = "";
    global.fetch = async (url) => {
        fetchUrls.push(url);
        if (url.includes('duckduckgo')) {
            queryPassedToFetch = url;
        }
        return { 
            ok: true, 
            json: async () => ({
                RelatedTopics: [{ FirstURL: "https://mock.com", Text: "El pan fue inventado por los egipcios hace miles de años." }]
            }) 
        };
    };
    if (await checkIntent("T2: Explicit authorization with spelling errors resumes pending query", "si sal y investigas a fonto", "INVESTIGACIÓN COMPLETA")) passed++; else failed++;
    if (queryPassedToFetch.includes("quien+invento+pan") || queryPassedToFetch.includes("quien%20invento%20pan")) {
        console.log(`✅ [PASS] T2.1: Original research topic reached WebFetcher`);
        passed++;
    } else {
        console.error(`❌ [FAIL] T2.1: Original research topic did not reach WebFetcher. URL: ${queryPassedToFetch}`);
        failed++;
    }

    // 3. "Búscalo en internet" is recognized as an explicit web-search instruction (and authorization)
    window.AI_CORE.chatBridgeInstance.clearSession();
    await checkIntent("Setup: Factual Query", "cuando se descubrio america", "Necesito tu autorización explícita");
    if (await checkIntent("T3: 'Búscalo en internet' explicit instruction resumes pending", "búscalo en internet", "INVESTIGACIÓN COMPLETA")) passed++; else failed++;

    // 4. A standalone "sí" with no pending task asks for clarification
    window.AI_CORE.chatBridgeInstance.clearSession();
    if (await checkIntent("T4: Standalone 'sí' asks for clarification", "si", "[CLARIFICACIÓN] Me autorizaste o afirmaste algo, pero no tengo ninguna consulta pendiente.")) passed++; else failed++;

    // 5. Denial cancels the pending research
    window.AI_CORE.chatBridgeInstance.clearSession();
    await checkIntent("Setup: Factual Query", "quien escribio la odisea", "Necesito tu autorización explícita");
    let fetchCalled = false;
    global.fetch = async () => { fetchCalled = true; throw new Error(); };
    if (await checkIntent("T5.1: Denial cancels pending research", "no lo hagas", "He cancelado la búsqueda en internet")) passed++; else failed++;
    if (!fetchCalled) {
        console.log(`✅ [PASS] T5.2: Denied request does not invoke WebFetcher`);
        passed++;
    } else {
        console.error(`❌ [FAIL] T5.2: Denied request invoked WebFetcher!`);
        failed++;
    }

    // 6. A new unrelated query does not inherit an old query's approval
    window.AI_CORE.chatBridgeInstance.clearSession();
    await checkIntent("Setup: Factual Query", "quien pinto la mona lisa", "Necesito tu autorización explícita");
    if (await checkIntent("T6: New query doesn't inherit approval", "cual es el margen de la harina", "Costo de producción")) passed++; else failed++;

    // 7. A successful web result is returned with its real provenance
    if (fetchUrls.some(u => u.includes('mock.com'))) {
        console.log(`✅ [PASS] T7: Web result has real provenance`);
        passed++;
    } else {
        console.error(`❌ [FAIL] T7: Provenance missing`);
        failed++;
    }

    // 8. A failed search produces a truthful failure and a safe retry option
    window.AI_CORE.chatBridgeInstance.clearSession();
    global.fetch = async () => { throw new Error('CORS fail'); }; // Mock fail
    await checkIntent("Setup: Factual Query", "cuando acabo la segunda guerra", "Necesito tu autorización explícita");
    if (await checkIntent("T8.1: Failed WebFetcher call reports error and offers retry", "si, dale", ["INVESTIGACIÓN FALLIDA", "¿Deseas que intente buscar de nuevo en la web?"])) passed++; else failed++;
    
    // Test that the retry works!
    global.fetch = async (url) => {
        return { 
            ok: true, 
            json: async () => ({
                RelatedTopics: [{ FirstURL: "https://mock.com", Text: "La segunda guerra acabo en 1945 con la rendicion." }]
            }) 
        };
    };
    if (await checkIntent("T8.2: Safe retry works from failure state", "si sal y busca", "INVESTIGACIÓN COMPLETA")) passed++; else failed++;

    // 9. Knowledge Ingestion & Reuse (Phase 14)
    window.AI_CORE.chatBridgeInstance.clearSession();
    global.fetch = async () => ({
        ok: true,
        json: async () => ({
            RelatedTopics: [{ FirstURL: "https://mock.com/pan", Text: "El pan fue inventado por los antiguos egipcios hace muchisimos años." }]
        })
    });
    // First query - requires auth
    await checkIntent("Setup: New Knowledge", "cual es el origen de la panaderia", "Necesito tu autorización explícita");
    // Authorize - will ingest
    await checkIntent("T9.1: Authorize and Ingest", "si", "INVESTIGACIÓN COMPLETA");
    
    // Clear session so we don't use short-term memory
    window.AI_CORE.chatBridgeInstance.clearSession();
    
    // Ask the same thing again - should be LOCAL_SUFFICIENT, no auth required!
    // We mock fetch to fail so if it tries to hit the web, it crashes or fails.
    fetchCalled = false;
    global.fetch = async () => { fetchCalled = true; throw new Error('Should not be called'); };
    
    if (await checkIntent("T9.2: Local Reuse without Web", "cual es el origen de la panaderia", "INVESTIGACIÓN COMPLETA")) passed++; else failed++;
    if (!fetchCalled) {
        console.log(`✅ [PASS] T9.3: WebFetcher was NOT called on reuse`);
        passed++;
    } else {
        console.error(`❌ [FAIL] T9.3: WebFetcher WAS called`);
        failed++;
    }

    // 10. No external AI
    const noExternal = !fetchUrls.some(u => u.includes('generative'));
    if (noExternal) { console.log(`✅ [PASS] T10: No external AI calls made`); passed++; }
    else { console.error(`❌ [FAIL] T10: Gemini invoked`); failed++; }

    console.log(`\n--- Resultados ---\nPASS: ${passed}   FAIL: ${failed}`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
