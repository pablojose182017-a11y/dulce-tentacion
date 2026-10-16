const assert = require('assert');

// 1. Configurar entorno global simulado similar al browser
global.window = { AI_CORE: {} };
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};

// Cargar dependencias requeridas
require('./ai-core/ai-creator-knowledge.js');
require('./ai-core/ai-context.js');
require('./ai-core/ai-memory.js');
require('./ai-core/ai-reasoning.js');
require('./ai-core/ai-personality.js');
require('./ai-core/ai-understanding.js');
require('./ai-core/ai-text-processor.js');

// Mock Dependencies para ChatBridge
window.AI_CORE.IdentityManager = class {
    getCurrentUser(user) {
        if (user && user.email === 'pablojose182017@gmail.com') {
            return { id: 1, email: 'pablojose182017@gmail.com', isCreator: true };
        }
        return { id: 2, email: 'invitado@dulcetentacion.com', isCreator: false };
    }
    getBotIdentity() { return { id: 'guardian_bot', name: 'Guardián Financiero' }; }
};
window.AI_CORE.PermissionManager = class { getGovernanceRules() { return {}; } };
window.AI_CORE.LocalStorageKnowledgeStore = class { load() { return []; } save() {} };
window.AI_CORE.KnowledgeManager = class { 
    constructor() {} 
    async search() { return []; } 
};

// Cargar ChatBridge
require('./ai-core/ai-chat-bridge.js');

async function runTests() {
    console.log("=================================================");
    console.log("TEST SUITE: MEMORIA MULTI-TURNO & GATEKEEPER & TEXT PROCESSOR");
    console.log("=================================================");

    const bridge = new window.AI_CORE.ChatBridge();
    const pabloUser = { email: 'pablojose182017@gmail.com' };

    // TEST 1: Prueba de Consulta Abierta ("que me recomindas hacer" / "que me recomiendas hacer")
    // Validar que responde como socio consultor y NO busca en Wikipedia/DDG ni arroja [INVESTIGACIÓN FALLIDA]
    console.log("\n[TEST 1] Consulta abierta de recomendación");
    const res1 = await bridge.receiveMessage("que me recomindas hacer", pabloUser, null);
    console.log("Respuesta obtenida:", res1.substring(0, 150) + "...");
    assert(res1.includes("recomendaciones estratégicas inmediatas"), "Debe ofrecer las 4 recomendaciones estratégicas");
    assert(res1.includes("P&S Punto Dulce") || res1.includes("Punto Dulce"), "Debe referenciar a Punto Dulce");
    assert(res1.includes("Pan Cascarita"), "Debe mencionar productos emblemáticos como Pan Cascarita");
    assert(res1.includes("Club Puntos VIP"), "Debe mencionar el Club Puntos VIP");
    assert(!res1.includes("Wikipedia") && !res1.includes("INVESTIGACIÓN FALLIDA") && !res1.includes("Lenin"), "PROHIBIDO Wikipedia o INVESTIGACIÓN FALLIDA");
    console.log("✅ TEST 1 PASADO: Consulta abierta asesorada correctamente.");

    // TEST 2: Turno 1 de Preparación de Texto
    // Validar que 'te voy apasar un texto para que le corrijas errores ortograficos'
    // activa pendingTask = 'CORRECT_AND_IMPROVE_TEXT' y responde con naturalidad
    console.log("\n[TEST 2] Turno 1: 'te voy apasar un texto para que le corrijas errores ortograficos'");
    const res2 = await bridge.receiveMessage("te voy apasar un texto para que le corrijas errores ortograficos", pabloUser, null);
    console.log("Respuesta obtenida:", res2);
    assert(res2.includes("Pásame el texto aquí abajo") || res2.includes("corrijo la ortografía"), "Debe responder con naturalidad invitando a pasar el texto");
    assert(bridge.conversationState.pendingTask === 'CORRECT_AND_IMPROVE_TEXT', "Debe activar pendingTask = 'CORRECT_AND_IMPROVE_TEXT'");
    assert(!res2.includes("INVESTIGACIÓN FALLIDA") && !res2.includes("Wikipedia"), "NO debe realizar investigación web");
    console.log("✅ TEST 2 PASADO: Turno 1 preparó la tarea pendiente sin buscar en la web.");

    // TEST 3: Turno 2: Pegar texto largo de marketing para panadería
    // Validar que se ejecuta la habilidad sobre el texto, corrige ortografía, limpia formato,
    // y agrega el Bono de Adaptación Directa a Punto Dulce en Cúcuta.
    console.log("\n[TEST 3] Turno 2: Pegar texto largo de panadería y marketing");
    const textoMarketing = `esta es una gran estrategia de marketing para panaderia y reposteria en nuestro negocio.
1. promocion de desayunos con pan fresco todas las mananas
2. combos de cafe con pan de queso horneado al dia
3. tortas personalizadas bajo pedido para cumpleanos y fechas especiales
Si me cuentas en que ciudad o zona estas podemos ajustar la propuesta.`;

    const res3 = await bridge.receiveMessage(textoMarketing, pabloUser, null);
    console.log("Respuesta obtenida (primeros 300 caracteres):\n", res3.substring(0, 300) + "...\n");
    
    assert(res3.includes("Texto Corregido y Optimizado"), "Debe incluir encabezado de corrección");
    assert(res3.includes("Adaptación Directa para P&S Punto Dulce en Cúcuta"), "Debe incluir el Bono de Socio Estratégico");
    assert(res3.includes("Pan Cascarita"), "Debe aterrizar a Pan Cascarita");
    assert(res3.includes("Roliqueso"), "Debe aterrizar a Roliqueso");
    assert(res3.includes("Club Puntos VIP"), "Debe aterrizar a Club Puntos VIP");
    assert(bridge.conversationState.pendingTask === null, "pendingTask debe quedar limpio tras completarse");
    assert(!res3.includes("P y S Punto Dulce es una panaderia y reposteria artesanal fundada por Pablo Carrascal, especializada en panaderia tradicional"), 
           "NO debe escupir el registro estático de definición de la empresa en lugar de procesar el texto");
    console.log("✅ TEST 3 PASADO: Flujo exacto de 2 turnos ejecutado con corrección y adaptación estratégica.");

    // TEST 4: Query Gatekeeper Anti-Búsquedas Absurdas en Wikipedia
    console.log("\n[TEST 4] Query Gatekeeper para frases abiertas");
    const resGate1 = await bridge.receiveMessage("¿cómo vamos?", pabloUser, null);
    assert(!resGate1.includes("INVESTIGACIÓN FALLIDA") && !resGate1.includes("Wikipedia"), "No debe buscar en Wikipedia 'cómo vamos'");
    assert(resGate1.includes("recomendaciones estratégicas") || resGate1.includes("Punto Dulce"), "Debe responder como socio");

    const resGate2 = await bridge.receiveMessage("dame ideas", pabloUser, null);
    assert(!resGate2.includes("INVESTIGACIÓN FALLIDA") && !resGate2.includes("Wikipedia"), "No debe buscar en Wikipedia 'dame ideas'");
    console.log("✅ TEST 4 PASADO: Query Gatekeeper bloquea búsquedas absurdas.");

    // TEST 5: Eliminación de [INVESTIGACIÓN FALLIDA]
    console.log("\n[TEST 5] Mensaje cálido conversacional ante falta de evidencia");
    // Forzamos un test de _executeResearch simulando INSUFFICIENT_EVIDENCE
    bridge.researchEngine = {
        investigate: async () => ({ status: 'INSUFFICIENT_EVIDENCE', limitations: ['Sin cobertura'], confidence: 0.1 })
    };
    const resFallida = await bridge._executeResearch("termino_inexistente_xyz_12345", {}, "investiga termino_inexistente_xyz_12345");
    assert(!resFallida.includes("[INVESTIGACIÓN FALLIDA]"), "Jamás debe mostrar el cartel frío [INVESTIGACIÓN FALLIDA]");
    assert(resFallida.includes("He consultado minuciosamente las fuentes disponibles"), "Debe responder con mensaje cálido y constructivo");
    console.log("✅ TEST 5 PASADO: Mensaje frío sustituido por respuesta conversacional.");

    console.log("\n🎉 ¡TODOS LOS TESTS (1 a 5) PASARON CON ÉXITO TOTAL!");
}

runTests().catch(err => {
    console.error("❌ Error en tests:", err);
    process.exit(1);
});
