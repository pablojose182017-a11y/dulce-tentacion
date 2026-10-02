const fs = require('fs');
const assert = require('assert').strict;

// Mock DOM/Browser environment
global.window = {};
global.document = {
    getElementById: () => ({
        value: '',
        innerHTML: '',
        style: {},
        appendChild: () => {},
        remove: () => {}
    }),
    createElement: () => ({ style: {} })
};
global.localStorage = { 
    data: {}, 
    setItem(k,v){this.data[k]=v;}, 
    getItem(k){return this.data[k]||null;}, 
    removeItem(k){delete this.data[k];} 
};
global.prompt = () => "test_key";
global.alert = (msg) => { console.log("ALERT:", msg); };

// Track fetch calls
let fetchCalled = false;
global.fetch = async (url) => {
    if (url.includes('generativelanguage')) {
        fetchCalled = true;
    }
    return { ok: true, json: async () => ({}) };
};

// Cargar script
const code = fs.readFileSync('./guardian-financiero.js', 'utf8');
eval(code);

async function runTests() {
    console.log("=== Guardian AI Independence Verification ===\n");
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
        // T1: configurarGeminiKey should NOT save a key
        global.localStorage.data = {};
        window.configurarGeminiKey();
        record("T1: API Key configuration blocked", !global.localStorage.getItem('pd_gemini_api_key'), "Key should not be saved");

        // T2: enviarMensajeIA should fail closed and return limitation message
        global.localStorage.setItem('pd_gemini_api_key', 'fake_key');
        fetchCalled = false;
        const res = await window.enviarMensajeIA("hola", { recetas: [], insumos: [] }, []);
        
        record("T2: External API fetch prevented", fetchCalled === false, "Fetch to Gemini API was called!");
        record("T3: Limitation report returned", res.includes("RESTRICCIÓN DEL SISTEMA") || res.includes("prohíbe delegar el razonamiento"), "Did not return correct limitation message");

        console.log(`\n--- Resultados ---\nPASS: ${passed}   FAIL: ${failed}`);
        process.exit(failed > 0 ? 1 : 0);
    } catch (e) {
        console.error("Test execution failed:", e);
        process.exit(1);
    }
}

runTests();
