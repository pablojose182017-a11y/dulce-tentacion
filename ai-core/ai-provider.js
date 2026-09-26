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
        if (knowledgeBlock.length > 0) {
            // Construir respuesta en español a partir del contenido real de los documentos
            let respuesta = `**Basado en el conocimiento disponible:**\n\n`;

            for (const doc of knowledgeBlock) {
                const titulo = doc.title || doc.id;
                const contenido = doc.content || '';
                const fuente = doc.source || 'fuente desconocida';
                const confianza = doc.confidence != null ? `(confianza: ${(doc.confidence * 100).toFixed(0)}%)` : '';

                respuesta += `📄 **${titulo}** ${confianza}\n`;
                respuesta += `${contenido}\n`;
                if (doc.tags && doc.tags.length > 0) {
                    respuesta += `*Etiquetas: ${doc.tags.join(', ')}*\n`;
                }
                respuesta += `\n`;
            }

            // Indicar limitación lingüística honesamente
            respuesta += `---\n`;
            respuesta += `⚠️ *Nota de idioma: El conocimiento recuperado puede estar en inglés u otro idioma. `;
            respuesta += `En esta fase (FASE 2) no existe un traductor automático. `;
            respuesta += `El contenido se muestra tal como fue almacenado. `;
            respuesta += `Para respuestas completamente en español se requiere un proveedor de IA externo (Gemini) — no conectado en esta fase.*\n\n`;
            respuesta += `*Proveedor: LOCAL (sin internet, sin Gemini, sin invención de datos)*`;

            return respuesta;
        }

        // === CASO B: Sin conocimiento disponible para esta consulta ===
        let respuesta = `**No tengo información suficiente para responder esta pregunta.**\n\n`;
        respuesta += `🔍 **Consulta:** "${prompt}"\n\n`;
        respuesta += `📭 **Situación:** No encontré documentos de conocimiento almacenados relevantes para esta pregunta.\n\n`;
        respuesta += `**Para que pueda responder necesito:**\n`;
        respuesta += `- Documentos de conocimiento sobre el tema de tu pregunta\n`;
        respuesta += `- Puedes ingresar conocimiento usando el mecanismo de ingesta del sistema\n\n`;

        // Indicar el estado del contexto para diagnóstico
        if (contextData && contextData.blocks) {
            const memBlock = contextData.blocks.memory;
            const hasMemory = memBlock && memBlock.status === 'AVAILABLE' &&
                memBlock.content && memBlock.content.shortTerm && memBlock.content.shortTerm.length > 0;
            if (hasMemory) {
                respuesta += `📝 *Tengo ${memBlock.content.shortTerm.length} turno(s) de conversación en memoria de corto plazo.*\n`;
            }
        }

        respuesta += `\n*Proveedor: LOCAL (sin internet, sin Gemini, sin invención de datos)*`;

        return respuesta;
    }
}

window.AI_CORE.AIProvider = AIProvider;
window.AI_CORE.LocalMockProvider = LocalMockProvider;
