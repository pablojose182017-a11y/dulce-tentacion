window.AI_CORE = window.AI_CORE || {};

// ==========================================
// AI PROVIDER ABSTRACTION
// ==========================================

class AIProvider {
    constructor() {
        if (new.target === AIProvider) {
            throw new TypeError("Cannot construct AIProvider abstract instances directly");
        }
    }

    /**
     * Genera una respuesta basada en un prompt y un contexto estructurado.
     * @param {string} prompt - Mensaje del usuario.
     * @param {Object} contextData - Contexto ensamblado por ContextManager.
     * @returns {Promise<string>} - Respuesta de la IA.
     */
    async generate(prompt, contextData) {
        throw new Error("Method 'generate()' must be implemented.");
    }
}

// ==========================================
// LOCAL MOCK PROVIDER (SOLO PARA PRUEBAS)
// ==========================================

class LocalMockProvider extends AIProvider {
    constructor() {
        super();
        this.name = "MOCK / TEST PROVIDER";
    }

    async generate(prompt, contextData) {
        // FASE 2 — CAMBIO 5: Construir respuesta real desde el conocimiento inyectado en el contexto.
        // NO se inventa información. NO se conecta a internet. NO se usa Gemini.
        // Si hay conocimiento disponible: se usa. Si no: se indica honestamente qué falta.

        // Simular delay mínimo (realista para UI)
        await new Promise(resolve => setTimeout(resolve, 150));

        const knowledgeBlock = (contextData && contextData.blocks && contextData.blocks.knowledge &&
            contextData.blocks.knowledge.status === 'AVAILABLE')
            ? contextData.blocks.knowledge.content
            : [];

        // === CASO A: Hay conocimiento disponible ===
        // FASE 3: Utilizar Personality Orientation
        const orientation = contextData.personality || { conversationMode: "INFORMATIONAL", epistemicTone: "UNKNOWN", initiative: "NONE" };

        if (orientation.conversationMode === "CASUAL") {
            return `¡Hola! Soy Guardian. ¿Cómo te puedo ayudar hoy? Si necesitas investigar algo, dímelo.`;
        }

        if (orientation.conversationMode === "CAPABILITIES") {
            return `**Estas son mis capacidades actuales (Guardian V1):**\n\n` +
                   `✅ **IMPLEMENTADO:**\n` +
                   `- Conversación natural\n` +
                   `- Gestión de memoria y contexto disponible\n` +
                   `- Ingesta de conocimiento (Knowledge)\n` +
                   `- Razonamiento y análisis de evidencia (Reasoning)\n` +
                   `- Personalidad cognitiva para moderar el tono (Personality)\n` +
                   `- Detección de contradicciones en los datos cuando existen\n` +
                   `- Señalar información faltante (Honestidad Epistémica)\n` +
                   `- Proponer o preguntar antes de asumir (sin ejecutar)\n\n` +
                   `❌ **NO DISPONIBLE TODAVÍA:**\n` +
                   `- Ejecución de acciones reales sobre el sistema (Execution = NOT READY)\n` +
                   `- Conexión a Internet\n` +
                   `- Interacción por voz real o comandos de voz biométricos\n` +
                   `- Autonomía operacional y uso de herramientas externas\n` +
                   `- Autorización mediante voz (Creator Identity = EXPERIMENTAL)\n`;
        }

        // Si hay conflicto de evidencias
        if (orientation.conversationMode === "INVESTIGATIVE" && orientation.epistemicTone === "QUALIFIED") {
            let res = `**He encontrado un conflicto en los datos:**\n`;
            res += `Hay información contradictoria sobre este tema. Sería prudente revisarlo juntos.\n`;
            return res;
        }

        // Si falta información (UNKNOWN)
        if (orientation.epistemicTone === "UNKNOWN" || knowledgeBlock.length === 0) {
            let res = `**No lo sé todavía.** (I DON'T KNOW / UNKNOWN)\n`;
            res += `No tengo suficiente evidencia factual para responder a: "${prompt}".\n`;
            
            if (orientation.initiative === "QUESTION") {
                res += `¿Tienes algún documento o contexto extra que podamos revisar?\n`;
            } else if (orientation.initiative === "SUGGEST") {
                res += `Te sugiero que busquemos la información fuente antes de asumir nada.\n`;
            }
            return res;
        }

        // Si hay evidencia y soporte sólido
        if (orientation.epistemicTone === "CERTAIN") {
            let respuesta = `**Basado en el conocimiento disponible:**\n\n`;

            for (const doc of knowledgeBlock) {
                const titulo = doc.title || doc.id;
                const contenido = doc.content || '';
                const confianza = doc.confidence != null ? `(confianza: ${(doc.confidence * 100).toFixed(0)}%)` : '';

                respuesta += `📄 **${titulo}** ${confianza}\n`;
                respuesta += `${contenido}\n\n`;
            }

            if (orientation.initiative === "SUGGEST") {
                respuesta += `*Nota:* Observo detalles adicionales que podríamos explorar si te interesa.\n`;
            }

            return respuesta;
        }

        return `**I DON'T KNOW / UNKNOWN**\nSin información suficiente.`;
    }
}

window.AI_CORE.AIProvider = AIProvider;
window.AI_CORE.LocalMockProvider = LocalMockProvider;
