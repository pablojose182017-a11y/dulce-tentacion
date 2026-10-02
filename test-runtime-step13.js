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
    window.AI_CORE.chatBridgeInstance.permissionManager.rules = { allowedCapabilities: ['WEB_SEARCH'] };
    window.AI_CORE.chatBridgeInstance.permissionManager.getGovernanceRules = function() { return this.rules; };
    window.AI_CORE.chatBridgeInstance.researchEngine.permissionManager = window.AI_CORE.chatBridgeInstance.permissionManager;
    fetchUrls = [];

    // 1. Análisis genérico (Missing topic -> isClarificationNeeded)
    window.AI_CORE.chatBridgeInstance.clearSession();
    if (await checkIntent("T1: Análisis sin contexto", "necesito que me alludes a analizar algo", ["Creo que necesitas ayuda para analizar algo", "qué tema"])) passed++; else failed++;

    // 2. Mensaje corto ambiguo -> Clarificación genérica (UNKNOWN_STATEMENT)
    window.AI_CORE.chatBridgeInstance.clearSession();
    if (await checkIntent("T2: Mensaje corto ambiguo", "costos", "CLARIFICACIÓN")) passed++; else failed++;

    // 3. Factual Question local knowledge check & Web Auth
    window.AI_CORE.chatBridgeInstance.clearSession();
    if (await checkIntent("T3: Factual Question (requiere web auth)", "quien es el presidente de francia", "Necesito tu autorización explícita para buscar esta información en internet")) passed++; else failed++;

    // 4. Aprobación concedida
    if (await checkIntent("T4: Aprobación Web concedida", "si, hazlo", "INVESTIGACIÓN COMPLETA")) passed++; else failed++;

    // 5. Factual Question again, but this time denegación
    window.AI_CORE.chatBridgeInstance.clearSession();
    if (await checkIntent("T5: Factual Question", "quien escribio don quijote", "Necesito tu autorización explícita para buscar esta información en internet")) passed++; else failed++;
    if (await checkIntent("T6: Aprobación Web denegada", "no lo hagas", "He cancelado la búsqueda en internet")) passed++; else failed++;

    // 7. Statement con análisis y sin info local
    window.AI_CORE.chatBridgeInstance.clearSession();
    if (await checkIntent("T7: Request con ReasoningEngine Fallback local", "analiza esto por favor que esta muy raro", "[RAZONAMIENTO LOCAL]")) passed++; else failed++;

    // T8: No external AI
    const noExternal = !fetchUrls.some(u => u.includes('generative'));
    if (noExternal) { console.log(`✅ [PASS] T8: No external AI calls made`); passed++; }
    else { console.error(`❌ [FAIL] T8: Gemini invoked`); failed++; }

    console.log(`\n--- Resultados ---\nPASS: ${passed}   FAIL: ${failed}`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
