if (typeof window.AI_CORE === 'undefined') window.AI_CORE = {};

class ChatBridge {
    constructor() {
        this.identityManager = new window.AI_CORE.IdentityManager();
        this.permissionManager = new window.AI_CORE.PermissionManager();
        this.store = new window.AI_CORE.LocalStorageKnowledgeStore('pd_ai_core_');
        this.memoryManager = new window.AI_CORE.MemoryManager(this.store, 'pd_memory');
        this.knowledgeManager = new window.AI_CORE.KnowledgeManager(this.store);
        
        // Fase 3: Integración de Creator Knowledge con degradación segura
        if (window.AI_CORE.CreatorKnowledgeStore && window.AI_CORE.CreatorKnowledgeManager) {
            this.creatorKnowledgeStore = new window.AI_CORE.CreatorKnowledgeStore();
            this.creatorKnowledgeManager = new window.AI_CORE.CreatorKnowledgeManager(this.creatorKnowledgeStore);
            try {
                // Forzamos rehidratación. Si los datos están corruptos, fallará cerradamente.
                this.creatorKnowledgeManager.rehydrate();
            } catch (e) {
                console.warn("[ChatBridge] Creator Knowledge rehydration failed:", e.message);
                this.creatorKnowledgeManager = null; // Degradación segura: Anula la instancia
            }
        } else {
            this.creatorKnowledgeManager = null;
        }

        this.provider = new window.AI_CORE.LocalMockProvider();
        this.reasoningEngine = new window.AI_CORE.ReasoningEngine(this.provider);
        this.personalityEngine = new window.AI_CORE.PersonalityEngine();
    }

    async receiveMessage(message, currentUserGlobal, costosStateGlobal) {
        // FASE 2 — CAMBIO 1: Recuperar conocimiento relevante ANTES de buildContext()
        // Flujo oficial: KnowledgeManager -> búsqueda -> ContextManager -> ReasoningEngine
        const contextManager = new window.AI_CORE.ContextManager(
            this.identityManager,
            this.permissionManager,
            this.memoryManager
        );
        await contextManager.assembleContext(currentUserGlobal);

        // Buscar documentos relevantes genéricos para la pregunta actual
        let relevantDocs = [];
        try {
            const searchResults = await this.knowledgeManager.search(message);
            relevantDocs = searchResults.map(r => r.document);
        } catch (e) {
            relevantDocs = [];
        }

        // FASE 3: Recuperar Creator Knowledge de manera independiente
        let creatorDocs = [];
        if (this.creatorKnowledgeManager && this.creatorKnowledgeManager.isReady) {
            try {
                creatorDocs = this.creatorKnowledgeManager.retrieveActive();
            } catch (e) {
                creatorDocs = [];
            }
        }

        // Inyectar conocimiento al ContextManager manteniendo separación estricta
        contextManager.setKnowledge(relevantDocs);
        contextManager.setCreatorKnowledge(creatorDocs);

        // Construir contexto completo
        const context = contextManager.buildContext();

        // Feed legacy data purely as context
        context.legacyData = {
            insumos: costosStateGlobal ? costosStateGlobal.insumos : [],
            recetas: costosStateGlobal ? costosStateGlobal.recetas : []
        };

        // Reason about the message using full context (incluyendo knowledge)
        const inputContext = {
            problemStatement: message,
            assembledContext: context
        };
        const analysis = await this.reasoningEngine.reason(inputContext);

        const personalityOrientation = this.personalityEngine.applyPersonality(analysis, inputContext);
        context.personality = personalityOrientation;

        this.memoryManager.addTurn('user', message);

        let responseText = "";

        if (analysis.authorizationRequirement && analysis.authorizationRequirement.required) {
            // Solo bloquear si realmente se requiere una tool/acción (governance >= 1)
            // En FASE 2 no ejecutamos herramientas, pero tampoco bloqueamos respuestas informativas
            if (analysis.authorizationRequirement.governanceLevel >= 3) {
                responseText = `Eso requiere una acción sobre los datos comerciales. En este modo puedo analizar/proponer el cambio, pero no ejecutarlo.`;
            } else {
                // Governance 1-2: el sistema puede responder con lo que sabe,
                // indicando que hace falta información adicional
                responseText = await this.provider.generate(message, context);
            }
        } else {
            responseText = await this.provider.generate(message, context);
        }

        this.memoryManager.addTurn('assistant', responseText);

        return responseText;
    }

    clearSession() {
        this.memoryManager.clearShortTermMemory();
    }
}

window.AI_CORE.chatBridgeInstance = new ChatBridge();
window.AI_CORE.ChatBridge = ChatBridge;
