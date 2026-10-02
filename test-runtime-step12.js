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
    if (url.includes('duckduckgo')) return { ok: true, json: async () => ({ Abstract: 'Mock web research result' }) };
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
    console.log("=== Guardian Phase 12 NLU Validation ===\n");
    let passed = 0, failed = 0;
    
    global.localStorage.setItem('USE_NEW_AI_CORE', 'true');
    window.AI_CORE.chatBridgeInstance.permissionManager.rules = { allowedCapabilities: ['WEB_SEARCH'] };
    window.AI_CORE.chatBridgeInstance.permissionManager.getGovernanceRules = function() { return this.rules; };
    window.AI_CORE.chatBridgeInstance.researchEngine.permissionManager = window.AI_CORE.chatBridgeInstance.permissionManager;
    fetchUrls = [];

    const tests = [
        ["T1.1: Greeting with typo", "hola amgo", "¡Hola! 👋 Soy el Guardián Financiero"],
        ["T1.2: Greeting multi-word", "buenos dias amigo", "¡Hola! 👋 Soy el Guardián Financiero"],
        ["T2: Help request with typo", "nesesito ayuda", "[CLARIFICACIÓN] Necesito un poco de ayuda para entenderte bien"],
        ["T3: Financial query with typo", "cuanto kuesta el pan", "Costo de producción: <strong>$220 COP</strong>"],
        ["T4: Research request with typo", "investiga sobre los presios de la harina", "INVESTIGACIÓN"]
    ];

    for (let [name, msg, expected] of tests) {
        window.AI_CORE.chatBridgeInstance.clearSession(); // Reset context
        if (await checkIntent(name, msg, expected)) passed++; else failed++;
    }

    // T5 and T6: Ambiguous analysis and context follow up (Sequential)
    window.AI_CORE.chatBridgeInstance.clearSession();
    if (await checkIntent("T5: Ambiguous analysis request", "necesito que me alludes a analizar algo", "Creo que necesitas ayuda para analizar algo, pero todavía no sé qué tema. ¿Qué quieres que revisemos?")) passed++; else failed++;
    
    // T5.5 and T6: Ambiguous research and context follow up
    window.AI_CORE.chatBridgeInstance.clearSession();
    if (await checkIntent("T5.5: Ambiguous research", "busca informacion", "[CLARIFICACIÓN] Necesito un poco de ayuda para entenderte bien")) passed++; else failed++;
    if (await checkIntent("T6: Contextual follow-up", "la calidad del pan", "INVESTIGACIÓN")) passed++; else failed++;

    // T7: Context short message ("eso")
    window.AI_CORE.chatBridgeInstance.clearSession();
    chatOutput = [];
    await window.enviarMensajeGuardian("investiga los huevos");
    chatOutput = [];
    await window.enviarMensajeGuardian("eso"); 
    const isEsoContextual = chatOutput.some(c => c.html.includes('INVESTIGACIÓN'));
    if (isEsoContextual) { console.log(`✅ [PASS] T7: Context short message ("eso")`); passed++; }
    else { console.error(`❌ [FAIL] T7: Expected context follow-up. Got: ${chatOutput.map(c=>c.html).join(' ')}`); failed++; }

    // T8: User correction learning
    window.AI_CORE.chatBridgeInstance.clearSession();
    chatOutput = [];
    await window.enviarMensajeGuardian("presios");
    await window.enviarMensajeGuardian("perdon, quise decir precios");
    const learned = JSON.parse(global.localStorage.getItem('guardian_nlu_corrections'));
    if (learned && (learned["presios"] === "precios" || learned["presios"] === "precio")) {
        console.log(`✅ [PASS] T8: User correction learning`); passed++;
    } else {
        console.error(`❌ [FAIL] T8: Expected correction to be saved. Got:`, learned); failed++;
    }

    // T9: No external AI
    const noExternal = !fetchUrls.some(u => u.includes('generative'));
    if (noExternal) { console.log(`✅ [PASS] T9: No external AI calls made`); passed++; }
    else { console.error(`❌ [FAIL] T9: Gemini invoked`); failed++; }

    console.log(`\n--- Resultados ---\nPASS: ${passed}   FAIL: ${failed}`);
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
