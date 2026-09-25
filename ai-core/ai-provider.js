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
        // Simulamos un delay de red
        await new Promise(resolve => setTimeout(resolve, 500));

        let mockResponse = `[${this.name}] Recibí tu mensaje: "${prompt}"\n\n`;
        
        // Verificamos qué información recibió del contexto
        if (contextData && contextData.blocks) {
            if (contextData.blocks.user && contextData.blocks.user.status === 'AVAILABLE') {
                mockResponse += `- Detecté usuario: ${JSON.stringify(contextData.blocks.user.content)}\n`;
            } else {
                mockResponse += `- NO detecté usuario en el contexto.\n`;
            }

            if (contextData.blocks.knowledge && contextData.blocks.knowledge.status === 'AVAILABLE') {
                mockResponse += `- Detecté ${contextData.blocks.knowledge.content.length} documentos de conocimiento inyectados.\n`;
            } else {
                mockResponse += `- NO detecté conocimiento en el contexto.\n`;
            }
        }

        mockResponse += `\n*Nota: Esta es una respuesta generada localmente para probar la arquitectura. No me conecté a Internet ni usé Gemini. No realizo acciones reales.*`;

        return mockResponse;
    }
}

window.AI_CORE.AIProvider = AIProvider;
window.AI_CORE.LocalMockProvider = LocalMockProvider;
