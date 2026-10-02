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
global.currentUser = { email: "usuario_normal@gmail.com" }; // Para testear el saludo estándar

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
    'ai-core/ai-understanding.js',
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

async function checkIntent(intentName, message, expectedStrings) {
    chatOutput = [];
    await window.enviarMensajeGuardian(message);
    const out = chatOutput.map(c => c.html).join(' ');
    
    if (Array.isArray(expectedStrings)) {
        for (let s of expectedStrings) {
            if (out.includes(s)) return true;
        }
    } else if (out.includes(expectedStrings)) {
        return true;
    }
    
    console.error(`\n    [FAIL] Expected '${expectedStrings}' in output for message '${message}'.\n    Got: ${out}\n`);
    return false;
}

async function runTests() {
    console.log("=== Guardian Conversational Intent Verification ===\n");
    let passed = 0, failed = 0;
    
    function record(name, condition, msg) {
        if (condition) {
            console.log(`✅ [PASS] ${name}`);
            passed++;
        } else {
            console.log(`❌ [FAIL] ${name}\n         ASSERT FAILED: ${msg}`);
            failed++;
        }
    }

    try {
        // ALWAYS use USE_NEW_AI_CORE = true for these tests
        global.localStorage.setItem('USE_NEW_AI_CORE', 'true');
        
        // Setup permissions for Research
        window.AI_CORE.chatBridgeInstance.permissionManager.rules = { allowedCapabilities: ['WEB_SEARCH'] };
        window.AI_CORE.chatBridgeInstance.permissionManager.getGovernanceRules = function() { return this.rules; };
        window.AI_CORE.chatBridgeInstance.researchEngine.permissionManager = window.AI_CORE.chatBridgeInstance.permissionManager;

        fetchUrls = [];

        // 1. Spanish greetings and variations
        record("T1.1: Greeting 'hola'", await checkIntent("Greeting", "hola", ["¡Hola! 👋 Soy el Guardián Financiero", "¡Hola! Estoy operando con normalidad"]), "Failed on 'hola'");
        record("T1.2: Greeting 'buenos dias'", await checkIntent("Greeting", "buenos dias", ["¡Hola! 👋 Soy el Guardián Financiero", "¡Hola! Estoy operando con normalidad"]), "Failed on 'buenos dias'");
        
        // 2. Social questions
        record("T2.1: Social 'como estas'", await checkIntent("Social", "como estas", "🚀 ¿Qué vamos a resolver hoy?"), "Failed on 'como estas'");
        record("T2.2: Social 'que tal estas'", await checkIntent("Social", "que tal estas", "🚀 ¿Qué vamos a resolver hoy?"), "Failed on 'que tal estas'");

        // 3. Thanks and farewells
        record("T3.1: Thanks 'gracias'", await checkIntent("Thanks", "gracias", "¡De nada! Es mi deber"), "Failed on 'gracias'");
        record("T3.2: Farewells 'adios'", await checkIntent("Farewell", "adios", "¡Hasta luego! 👋 Estaré aquí vigilando"), "Failed on 'adios'");

        // 4. Knowledge-sharing intent
        record("T4: Knowledge sharing intent", await checkIntent("Knowledge", "te voy a compartir conocimiento", "Para almacenarla permanentemente, utiliza el formato estricto"), "Failed on knowledge intent");

        // 5. Financial questions retaining existing route
        record("T5: Financial query", await checkIntent("Financial", "cuanto cuesta el pan", "Costo de producción: <strong>$220 COP</strong>"), "Failed on financial calculation");

        // 6. Research requests retaining existing route
        record("T6: Research request", await checkIntent("Research", "investiga la masa madre", "INVESTIGACIÓN"), "Failed to invoke ResearchEngine");

        // 7. Unknown factual questions retaining honest uncertainty
        record("T7: Unknown factual", await checkIntent("Unknown", "cual es el secreto de la vida", "No tengo suficiente evidencia factual para responder a"), "Failed to return honest unknown");

        // 8. Clarification
        record("T8: Clarification for ambiguous research", await checkIntent("Clarification", "busca informacion", "[CLARIFICACIÓN] Necesito un poco de ayuda para entenderte bien"), "Failed to clarify");

        // 9. No external AI calls
        record("T9: No external AI calls made", !fetchUrls.some(u => u.includes('generative')), "Gemini fetch was invoked!");

        console.log(`\n--- Resultados ---\nPASS: ${passed}   FAIL: ${failed}`);
        process.exit(failed > 0 ? 1 : 0);
    } catch (e) {
        console.error("Test execution failed:", e);
        process.exit(1);
    }
}

runTests();
