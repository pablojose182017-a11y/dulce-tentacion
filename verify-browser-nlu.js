// Pega este código en la consola del navegador (DevTools) en la página index.html
// para verificar la corrección del flujo NLU.

(async () => {
    console.log("🛠️ Iniciando prueba de regresión NLU en navegador...");
    localStorage.setItem('USE_NEW_AI_CORE', 'true');
    
    // Guardamos la función original
    const oldAppend = window.appendMensajeGuardian;
    let respuestas = [];
    
    // Interceptamos las respuestas
    window.appendMensajeGuardian = (html, role) => {
        if (role === 'bot' && !html.includes("procesando")) {
            respuestas.push(html.replace(/<[^>]+>/g, '').trim());
        }
        // Llamamos a la original para verla en la interfaz también
        oldAppend(html, role, false);
    };
    
    console.log("Prueba 1: 'hola amgo' (Error ortográfico en saludo)");
    window.AI_CORE.chatBridgeInstance.clearSession();
    await window.enviarMensajeGuardian("hola amgo");
    
    console.log("Prueba 2: 'nesesito ayuda' (Error ortográfico en solicitud de ayuda)");
    window.AI_CORE.chatBridgeInstance.clearSession();
    await window.enviarMensajeGuardian("nesesito ayuda");
    
    console.log("Prueba 3: 'como estas' (Pregunta social)");
    window.AI_CORE.chatBridgeInstance.clearSession();
    await window.enviarMensajeGuardian("como estas");
    
    console.log("Prueba 4: 'investiga sobre los presios' (Investigación)");
    window.AI_CORE.chatBridgeInstance.clearSession();
    await window.enviarMensajeGuardian("investiga sobre los presios");

    // Restauramos
    window.appendMensajeGuardian = oldAppend;
    
    console.log("\n================ RESULTADOS ================");
    console.log("1. hola amgo ->", respuestas[0]);
    console.log("2. nesesito ayuda ->", respuestas[1]);
    console.log("3. como estas ->", respuestas[2]);
    console.log("4. investiga sobre los presios ->", respuestas[3]);
    
    if (respuestas.some(r => r && r.includes("UNKNOWN"))) {
        console.error("❌ FALLO: La regresión persiste. Al menos una respuesta fue I DON'T KNOW / UNKNOWN.");
    } else {
        console.log("✅ ÉXITO: El NLU responde conversacionalmente o redirige correctamente.");
    }
})();
