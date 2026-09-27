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

        // FASE 6.4 - Security & Execution Integration
        if (window.AI_CORE.SecurityEngine && window.AI_CORE.ToolRegistry) {
            this.toolRegistry = new window.AI_CORE.ToolRegistry();
            this.securityEngine = new window.AI_CORE.SecurityEngine(this.toolRegistry, this.permissionManager);
            
            if (window.AI_CORE.ExecutionGateway) {
                this.adapterRegistry = new window.AI_CORE.AdapterRegistry();
                this.executionGateway = new window.AI_CORE.ExecutionGateway(
                    this.securityEngine,
                    this.adapterRegistry,
                    new window.AI_CORE.ExecutionSlotManager(),
                    new window.AI_CORE.VerificationLayer(),
                    new window.AI_CORE.RealExecutionHistory(),
                    new window.AI_CORE.AuditTrail(),
                    null // inventoryAuthority
                );
            }
        }
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
            if (this.securityEngine && this.executionGateway) {
                try {
                    const toolId = analysis.authorizationRequirement.toolId || "UNKNOWN_TOOL";
                    const version = analysis.authorizationRequirement.toolVersion || "1.0";
                    const parameters = analysis.authorizationRequirement.parameters || {};
                    
                    const req = this.securityEngine.createApprovalRequest(
                        toolId, version, parameters, "Autonomous Request", context
                    );
                    
                    if (req.status === "PENDING_APPROVAL") {
                        responseText = `[PENDING_APPROVAL] Requiere aprobación explícita para la operación (Tool: ${toolId}). ID: ${req.requestId}`;
                    } else {
                        responseText = `[FAIL_CLOSED] Estado de autorización desconocido.`;
                    }
                } catch (e) {
                    responseText = `[FAIL_CLOSED] Ejecución denegada por seguridad: ${e.message}`;
                }
            } else {
                responseText = `[FAIL_CLOSED] Subsistema de ejecución/seguridad no disponible.`;
            }
        } else {
            responseText = await this.provider.generate(message, context);
        }

        this.memoryManager.addTurn('assistant', responseText, {
            isGeneratedResponse: true,
            personalityMode: personalityOrientation.conversationMode,
            personalityTone: personalityOrientation.epistemicTone,
            personalityInitiative: personalityOrientation.initiative,
            reasoningUncertaintyLevel: analysis.uncertainty.level,
            isSubjective: Boolean(analysis.uncertainty.isSubjective),
            hadConflict: Boolean(analysis.uncertainty.conflictingInformation && analysis.uncertainty.conflictingInformation.length > 0),
            hadMissingInformation: Boolean(analysis.uncertainty.missingInformation && analysis.uncertainty.missingInformation.length > 0)
        });

        return responseText;
    }

    async processApprovalAndExecute(requestId, approverIdentity, context) {
        if (!this.securityEngine || !this.executionGateway) throw new Error("FAIL_CLOSED: Subsystems not initialized");
        const request = this.securityEngine._humanApprovals ? this.securityEngine._humanApprovals.get(requestId) : null;
        if (!request) throw new Error("FAIL_CLOSED: APPROVAL_NOT_FOUND");
        
        const authRecord = await this.securityEngine.approveRequest(request, approverIdentity);
        
        try {
            const result = await this.executionGateway.execute(
                authRecord.approvalId,
                request.proposedParameters,
                approverIdentity,
                context
            );
            
            const resultMsg = `[SUCCESS] Acción ejecutada. Resultado: ${JSON.stringify(result.verifiedOutput)}`;
            this.memoryManager.addTurn('assistant', resultMsg, {
                isGeneratedResponse: true,
                isExecutionResult: true,
                evidenceId: result.evidenceId
            });
            return result;
        } catch (e) {
            this.memoryManager.addTurn('assistant', `[FAIL_CLOSED] Falla en ejecución: ${e.message}`, {
                isGeneratedResponse: true
            });
            throw new Error(`FAIL_CLOSED: ${e.message}`);
        }
    }

    clearSession() {
        this.memoryManager.clearShortTermMemory();
    }
}

window.AI_CORE.chatBridgeInstance = new ChatBridge();
window.AI_CORE.ChatBridge = ChatBridge;
