if (typeof window.AI_CORE === 'undefined') window.AI_CORE = {};

class ChatBridge {
    constructor(inventoryAuthority = null) {
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
        this._pendingApprovals = new Map();

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
                    inventoryAuthority
                );
            }
        }
        // FASE 7 - Research Integration
        if (window.AI_CORE.ResearchEngine && window.AI_CORE.OfflineResolver && window.AI_CORE.WebFetcher) {
            const offlineResolver = new window.AI_CORE.OfflineResolver(this.knowledgeManager);
            const webFetcher = new window.AI_CORE.DdgWebFetcher(); 
            const ingestionEngine = window.AI_CORE.KnowledgeIngestionEngine 
                ? new window.AI_CORE.KnowledgeIngestionEngine(this.knowledgeManager, this.memoryManager) 
                : null;
            this.researchEngine = new window.AI_CORE.ResearchEngine({
                offlineResolver,
                investigationEngine: null,
                reasoningEngine: this.reasoningEngine,
                webFetcher,
                ingestionEngine,
                permissionManager: this.permissionManager
            });
        }
        
        if (window.AI_CORE.LanguageUnderstandingEngine) {
            this.understandingEngine = new window.AI_CORE.LanguageUnderstandingEngine();
        }
    }

    async receiveMessage(message, currentUserGlobal, costosStateGlobal) {
        // --- 1. NATURAL LANGUAGE UNDERSTANDING ---
        let interpretation = { intent: "UNKNOWN_FACTUAL", isClarificationNeeded: false };
        if (this.understandingEngine) {
            const contextHistory = this.memoryManager.getShortTermMemory ? this.memoryManager.getShortTermMemory() : [];
            interpretation = this.understandingEngine.analyze(message, contextHistory);
        } else {
            // Fallback legacy research detection
            const msgLower = message.toLowerCase();
            const isLegacyResearch = msgLower.startsWith('investiga') || msgLower.startsWith('research') || msgLower.includes('busca información');
            if (isLegacyResearch) interpretation.intent = "RESEARCH_REQUEST";
        }

        // --- 2. CLARIFICATION HANDLING ---
        if (interpretation.isClarificationNeeded && this.understandingEngine) {
            const responseText = this.understandingEngine.generateClarificationMessage(interpretation);
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, { isGeneratedResponse: true, isClarification: true });
            return responseText;
        }

        // --- 3. CONVERSATIONAL & DIRECT ROUTING ---
        if (interpretation.intent === "SOCIAL_GREETING") {
            const user = this.identityManager.getCurrentUser(currentUserGlobal);
            const isCreator = user && user.email === 'pablojose182017@gmail.com';
            const responseText = isCreator ? "¡Hola, Pablo! 😄 Todo listo por aquí. ¿Qué revisamos hoy en el sistema, costos o código?" : "¡Hola! 👋 Soy el Guardián Financiero. Estoy aquí para ayudarte. ¿Qué necesitas revisar hoy?";
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, { isGeneratedResponse: true, intent: interpretation.intent });
            return responseText;
        }

        if (interpretation.intent === "SOCIAL_QUESTION") {
            const responseText = "¡Estoy listo y operando al 100%! 🚀 ¿Qué vamos a resolver hoy?";
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, { isGeneratedResponse: true, intent: interpretation.intent });
            return responseText;
        }

        if (interpretation.intent === "SOCIAL_THANKS") {
            const responseText = "¡De nada! Es mi deber como tu Guardián. Cuenta conmigo para lo que necesites.";
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, { isGeneratedResponse: true, intent: interpretation.intent });
            return responseText;
        }

        if (interpretation.intent === "SOCIAL_FAREWELL") {
            const responseText = "¡Hasta luego! 👋 Estaré aquí vigilando los números y la seguridad del sistema mientras no estás.";
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, { isGeneratedResponse: true, intent: interpretation.intent });
            return responseText;
        }

        if (interpretation.intent === "KNOWLEDGE_SHARING") {
            const responseText = "Perfecto. Compárteme la información y la analizaré. Para almacenarla permanentemente, utiliza el formato estricto iniciando tu mensaje con la frase 'Guarda este conocimiento: '. Antes de guardarla, revisaré su validez estructural según nuestros protocolos.";
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, { isGeneratedResponse: true, intent: interpretation.intent });
            return responseText;
        }

        // --- 4. FINANCIAL QUERIES DELEGATION ---
        if (interpretation.intent === "FINANCIAL_QUERY" && window._gf_resolverLocalmente) {
            // Let the local specialized financial resolver handle math securely
            const localRes = window._gf_resolverLocalmente(message);
            if (localRes !== null) {
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', localRes, { isGeneratedResponse: true, intent: interpretation.intent });
                return localRes;
            }
        }

        // --- 5. RESEARCH ENGINE ROUTING ---
        if (interpretation.intent === "RESEARCH_REQUEST" && this.researchEngine) {
            const user = this.identityManager.getCurrentUser(currentUserGlobal);
            const contextData = { user: { data: user } };
            try {
                const report = await this.researchEngine.investigate(message, contextData);
                
                let responseText = '';
                if (report.status === 'COMPLETED' || report.status === 'LOCAL_SUFFICIENT' || report.status === 'OFFLINE_ONLY') {
                    responseText = `[INVESTIGACIÓN COMPLETA]\nConclusión: ${report.conclusion}\n` +
                                   `Confianza: ${(report.confidence * 100).toFixed(0)}%\n` +
                                   (report.contradictions.length > 0 ? `Contradicciones: ${report.contradictions.join(', ')}\n` : '') +
                                   `Fuentes: Locales(${report.localResultsUsed.length}), Web(${report.webResultsUsed.length})\n` +
                                   (report.ingestStatus !== 'SKIPPED' ? `Estado Ingesta: ${report.ingestStatus}` : '');
                } else if (report.status === 'INSUFFICIENT_EVIDENCE') {
                    responseText = `[INVESTIGACIÓN FALLIDA]\nNo se encontró evidencia local ni web suficiente para responder.\nLimitaciones: ${report.limitations.join(', ')}`;
                } else {
                    responseText = `[INVESTIGACIÓN] Estado inesperado: ${report.status}`;
                }

                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', responseText, {
                    isGeneratedResponse: true,
                    isResearchReport: true,
                    researchStatus: report.status
                });

                return responseText;
            } catch (e) {
                const errText = `[ERROR DE INVESTIGACIÓN] Hubo un problema al investigar: ${e.message}`;
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', errText, { isGeneratedResponse: true, isError: true });
                return errText;
            }
        }

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
                        this._pendingApprovals.set(req.requestId, req);
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
        const request = this._pendingApprovals.get(requestId);
        if (!request) throw new Error("FAIL_CLOSED: APPROVAL_NOT_FOUND");
        
        let authRecord;
        try {
            authRecord = await this.securityEngine.approveRequest(request, approverIdentity);
            // Eliminación segura: la solicitud solo se consume formalmente cuando 
            // SecurityEngine emite satisfactoriamente el ApprovalRecord (autoridad confirmada).
            // Esto evita doble aprobación y previene pérdida en caso de fallo intermedio.
            this._pendingApprovals.delete(requestId);
        } catch (e) {
            throw new Error(`FAIL_CLOSED: ${e.message}`);
        }
        
        try {
            const result = await this.executionGateway.executeHumanApproval(
                authRecord.approvalId,
                request.proposedParameters,
                approverIdentity,
                context
            );
            
            const resultMsg = `[SUCCESS] Acción ejecutada. Resultado: ${JSON.stringify(result)}`;
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

window.AI_CORE.chatBridgeInstance = new ChatBridge({ verifyIdentity: () => null });
window.AI_CORE.ChatBridge = ChatBridge;
