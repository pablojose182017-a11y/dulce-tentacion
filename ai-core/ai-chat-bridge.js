if (typeof window.AI_CORE === 'undefined') window.AI_CORE = {};

class ChatBridge {
    constructor() {
        this.identityManager = new window.AI_CORE.IdentityManager();
        this.permissionManager = new window.AI_CORE.PermissionManager();
        this.store = new window.AI_CORE.LocalStorageKnowledgeStore('pd_ai_core_');
        this.memoryManager = new window.AI_CORE.MemoryManager(this.store, 'pd_memory');
        this.knowledgeManager = new window.AI_CORE.KnowledgeManager(this.store);
        
        this.provider = new window.AI_CORE.LocalMockProvider();
        this.reasoningEngine = new window.AI_CORE.ReasoningEngine(this.provider);
    }

    async receiveMessage(message, currentUserGlobal, costosStateGlobal) {
        // Construct Context
        const contextManager = new window.AI_CORE.ContextManager(this.identityManager, this.permissionManager, this.memoryManager, this.knowledgeManager);
        await contextManager.assembleContext(currentUserGlobal);
        const context = contextManager.buildContext();

        // Feed legacy data purely as context
        context.legacyData = {
            insumos: costosStateGlobal ? costosStateGlobal.insumos : [],
            recetas: costosStateGlobal ? costosStateGlobal.recetas : []
        };

        // Reason about the message to check for action intent
        const inputContext = {
            problemStatement: message,
            assembledContext: context
        };
        const analysis = await this.reasoningEngine.reason(inputContext);

        this.memoryManager.addTurn('user', message);

        let responseText = "";

        if (analysis.authorizationRequirement && analysis.authorizationRequirement.required) {
            responseText = `Eso requiere una acción sobre los datos comerciales. En este modo puedo analizar/proponer el cambio, pero no ejecutarlo.`;
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
