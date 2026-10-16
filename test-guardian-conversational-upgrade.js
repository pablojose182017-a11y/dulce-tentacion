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
    constructor() { this.docs = []; } 
    async _ensureLoaded() { return true; }
    async add(doc) { this.docs.push(doc); return doc; }
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

    // TEST 6: Cambio de planes a Guardar Conocimiento ('no mejor guarda ese conosimiento para en una proxima oprotunidad...')
    console.log("\n[TEST 6] Cambio de planes a Guardar Conocimiento a mitad de camino");
    // Activamos un pendingTask de corrección primero
    await bridge.receiveMessage("te voy a pasar un texto para corregir", pabloUser, null);
    assert.strictEqual(bridge.conversationState.pendingTask, 'CORRECT_AND_IMPROVE_TEXT');

    const res6 = await bridge.receiveMessage("no mejor guarda ese conosimiento para en una proxima oprotunidad o consejo que te pida ya la tengas clara", pabloUser, null);
    console.log("Respuesta obtenida:", res6);
    assert(res6.includes("He guardado este conocimiento en mi Bóveda Local (KnowledgeVault)") || res6.includes("Bóveda Local"), "Debe guardar el conocimiento");
    assert(!res6.includes("un aproxima"), "PROHIBIDO el error 'un aproxima'");
    assert(bridge.conversationState.pendingTask === null || bridge.conversationState.pendingTask === 'AWAITING_KNOWLEDGE_TO_SAVE', "pendingTask previo debe cancelarse");
    console.log("✅ TEST 6 PASADO: Interrupción por 'guardar conocimiento' procesada limpiamente.");

    // TEST 7: Cancelación explícita con palabras de corrección ('cancelar correccion de texto vamos a hacer otra cosa')
    console.log("\n[TEST 7] Cancelación con frase mixta");
    // Volvemos a activar pendingTask
    await bridge.receiveMessage("ayudame a corregir esto", pabloUser, null);
    assert.strictEqual(bridge.conversationState.pendingTask, 'CORRECT_AND_IMPROVE_TEXT');

    const res7 = await bridge.receiveMessage("cancelar correccion de texto vamos a hacer otra cosa", pabloUser, null);
    console.log("Respuesta obtenida:", res7);
    assert(res7.includes("Cancelamos la corrección de texto"), "Debe confirmar la cancelación cordialmente");
    assert(bridge.conversationState.pendingTask === null, "pendingTask debe quedar en null");
    // TEST 8: Reproducción exacta del reporte en vivo del usuario
    console.log("\n[TEST 8] Reproducción exacta de la conversación reportada en vivo");
    // Turno 1: "dime como podemos implementar eun texto que te voy a comprtir en la panaderia"
    const turn1Msg = "dime como podemos implementar eun texto que te voy a comprtir en la panaderia";
    const resTurn1 = await bridge.receiveMessage(turn1Msg, pabloUser, null);
    console.log("Respuesta Turno 1:", resTurn1);
    assert.strictEqual(bridge.conversationState.pendingTask, 'CORRECT_AND_IMPROVE_TEXT', "Debe activar pendingTask = CORRECT_AND_IMPROVE_TEXT en turno 1");
    assert(!resTurn1.includes("P y S Punto Dulce es una panaderia y reposteria artesanal"), "NO debe responder con la ficha estática del KnowledgeVault");
    assert(resTurn1.includes("Pásame el texto") || resTurn1.includes("pasame el texto"), "Debe pedir el texto de forma cordial");

    // Turno 2: El texto largo de marketing pegado con 'cuentas' en el cuerpo
    const marketingReporte = `Resumen de marketing para una panadería nueva

Con mucha competencia, no ganas por ser “una panadería más”, sino por ser memorable y fácil de elegir. Estas son las claves.

1. Define qué te hace diferente
Elige una o dos cosas en las que seas el mejor y comunícalas siempre: masa madre, pan artesanal, productos sin gluten o veganos, recetas de la región, pan caliente a toda hora, repostería personalizada. Si intentas ser todo para todos, nadie te recuerda.

2. Cuida la marca y el local
Un nombre, logo y colores coherentes en bolsas, vitrinas, redes y letrero.
Un escaparate limpio, bien iluminado y con producto a la vista. El aroma a pan recién horneado es tu mejor publicidad.
Una fachada que se note desde lejos.
3. Domina lo local
Crea y optimiza tu perfil de Google Maps (Google Business): fotos buenas, horarios, teléfono y dirección. Es de lo que más clientes trae.
Pide reseñas a los clientes satisfechos y responde todas, incluso las malas.
Colabora con negocios cercanos: cafeterías, oficinas, colegios, restaurantes y tiendas.
4. Redes sociales
Instagram, Facebook y TikTok funcionan muy bien para panadería porque la comida entra por los ojos.
Publica videos cortos: sacando el pan del horno, el proceso de amasado, el relleno de un producto.
Muestra a tu equipo y tu historia. La gente compra a personas, no a logos.
Publica con regularidad (3 a 5 veces por semana) y usa WhatsApp Business para pedidos.
5. Ofertas que generan hábito
Pan del día o producto estrella con precio atractivo.
Tarjeta de fidelidad: cada cierto número de compras, un producto gratis.
Descuentos en la última hora del día, para reducir desperdicio y atraer público.
Combos de desayuno y onces (pan + bebida).
Cuando abras, una inauguración con degustaciones gratis, para que la gente pruebe.
6. Amplía tus canales de venta
Pedidos por WhatsApp y domicilios (propios o con apps).
Pedidos por encargo para cumpleaños, eventos y empresas.
Suscripciones o pedidos fijos semanales para oficinas y cafeterías.
7. Servicio y consistencia
Un buen producto que a veces falla pierde clientes. Mantén calidad constante, atención amable, recordar el nombre o el pedido habitual de los clientes, y rapidez en caja. El voz a voz es el marketing más barato y poderoso.

8. Mide y ajusta
Revisa cada mes qué productos se venden más, qué horas tienen más movimiento y qué publicaciones atraen más gente. Invierte más en lo que funciona y elimina lo que no.

Plan rápido para los primeros 30 días
Termina tu perfil de Google Maps y redes富 social.
Haz una inauguración con degustaciones.
Lanza tu producto estrella y una promoción de apertura.
Empieza a pedir reseñas y a publicar videos a diario.
Habla con 5 negocios cercanos para posibles alianzas.

Si me cuentas en qué ciudad o zona estás, qué tipo de panadería es y tu presupuesto aproximado, puedo adaptarte estas ideas a tu caso.`;

    const resTurn2 = await bridge.receiveMessage(marketingReporte, pabloUser, null);
    console.log("Respuesta Turno 2 (primeros 350 caracteres):\n", resTurn2.substring(0, 350) + "...\n");
    assert(resTurn2.includes("Texto Corregido y Optimizado"), "Debe devolver el texto corregido y formateado");
    assert(resTurn2.includes("Adaptación Directa para P&S Punto Dulce en Cúcuta"), "Debe incluir el plan estratégico adaptado a Punto Dulce");
    assert(!resTurn2.includes("P y S Punto Dulce es una panaderia y reposteria artesanal fundada por Pablo Carrascal"), "PROHIBIDO responder con la ficha estática del KnowledgeVault");
    assert.strictEqual(bridge.conversationState.pendingTask, null, "pendingTask debe ser null tras procesar el texto");
    console.log("✅ TEST 8 PASADO: Caso en vivo del usuario resuelto impecablemente.");

    console.log("\n🎉 ¡TODOS LOS TESTS (1 a 8) PASARON CON ÉXITO TOTAL!");
}

runTests().catch(err => {
    console.error("❌ Error en tests:", err);
    process.exit(1);
});

