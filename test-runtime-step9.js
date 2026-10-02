const fs = require('fs');

// Mock DOM/Browser environment
global.window = {};
global.document = {
    getElementById: (id) => {
        return {
            value: '',
            innerHTML: '',
            style: {},
            appendChild: () => {},
            remove: () => {}
        };
    },
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

let fetchUrls = [];
global.fetch = async (url) => {
    fetchUrls.push(url);
    if (url.includes('duckduckgo')) {
        return { ok: true, json: async () => ({ Abstract: 'Mock web research result' }) };
    }
    return { ok: true, json: async () => ({}) };
};

// Mock financial state
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
    'ai-core/ai-chat-bridge.js',
    'guardian-financiero.js'
];

deps.forEach(file => {
    const code = fs.readFileSync('./' + file, 'utf8');
    eval(code);
});

// Capture chat output (override AFTER loading files)
let chatOutput = [];
window.appendMensajeGuardian = function(html, sender, save) {
    chatOutput.push({ html, sender });
};

async function runTests() {
    console.log("=== Guardian Runtime Verification ===\n");
    let passed = 0, failed = 0;
    function record(name, condition, msg, out) {
        if (condition) {
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } else {
            console.log(`❌ [FAIL] ${name}\n         ASSERT FAILED: ${msg}\n         ACTUAL OUTPUT: ${out}`);
            failed++;
        }
    }

    try {
        // T1: Greeting -> Local response
        global.localStorage.setItem('USE_NEW_AI_CORE', 'false');
        chatOutput = [];
        fetchUrls = [];
        await window.enviarMensajeGuardian("Hola");
        const out1 = chatOutput.map(c => c.html).join(' ');
        record("T1: Greeting reaches local response", out1.includes("¡Hola! 👋 Soy el Guardián Financiero"), "Greeting did not match local interceptor", out1);
        record("T1.1: No external AI fetch", !fetchUrls.some(u => u.includes('generative')), "Gemini fetch was called", fetchUrls.join(','));

        // T2: Supported financial query
        chatOutput = [];
        await window.enviarMensajeGuardian("cuanto cuesta el pan");
        const out2 = chatOutput.map(c => c.html).join(' ');
        record("T2: Financial query uses local calculation", out2.includes("Costo de producción:") && out2.includes("Pan"), "Financial query did not match local interceptor", out2);
        record("T2.1: Existing financial calculation works", out2.includes("$220 COP"), "Math was wrong or missing", out2); // (2000 + 10%)/10 = 220
        
        // T3: Residual API key does not enable Gemini (Legacy routing fallback)
        global.localStorage.setItem('pd_gemini_api_key', 'fake_key');
        chatOutput = [];
        await window.enviarMensajeGuardian("Cuentame un chiste"); // Unsupported intent
        const out3 = chatOutput.map(c => c.html).join(' ');
        record("T3: Residual API key blocked", out3.includes("RESTRICCIÓN DEL SISTEMA") || out3.includes("No lo sé todavía") || out3.includes("No tengo suficiente evidencia"), "Did not block Gemini / fall back properly", out3);
        record("T3.1: No Gemini API call made", !fetchUrls.some(u => u.includes('generativelanguage')), "A fetch call to Gemini was made!", fetchUrls.join(','));

        // T4: Research request via AI_CORE
        global.localStorage.setItem('USE_NEW_AI_CORE', 'true');
        chatOutput = [];
        fetchUrls = [];
        // Inject permission so it can research
        window.AI_CORE.chatBridgeInstance.permissionManager.rules = { allowedCapabilities: ['WEB_SEARCH'] };
        window.AI_CORE.chatBridgeInstance.permissionManager.getGovernanceRules = function() { return this.rules; };
        window.AI_CORE.chatBridgeInstance.researchEngine.permissionManager = window.AI_CORE.chatBridgeInstance.permissionManager;

        await window.enviarMensajeGuardian("investiga tendencias panaderia");
        const out4 = chatOutput.map(c => c.html).join(' ');
        record("T4: Research request reaches ResearchEngine", out4.includes("INVESTIGACIÓN") || out4.includes("Fuentes:"), "Research engine was not invoked", out4);
        record("T4.1: Internet fetch used (DuckDuckGo)", fetchUrls.some(u => u.includes('duckduckgo')), "DuckDuckGo was not called", fetchUrls.join(','));
        record("T4.2: Gemini NOT called during research", !fetchUrls.some(u => u.includes('generative')), "Gemini was called during research!", fetchUrls.join(','));

        console.log(`\n--- Resultados ---\nPASS: ${passed}   FAIL: ${failed}`);
        process.exit(failed > 0 ? 1 : 0);
    } catch (e) {
        console.error("Test execution failed:", e);
        process.exit(1);
    }
}

runTests();
