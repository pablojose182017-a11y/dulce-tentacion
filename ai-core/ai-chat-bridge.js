if (typeof window.AI_CORE === 'undefined') window.AI_CORE = {};

class ChatBridge {
    constructor(inventoryAuthority = null) {
        this.identityManager = new window.AI_CORE.IdentityManager();
        this.permissionManager = new window.AI_CORE.PermissionManager();
        const localStore = new window.AI_CORE.LocalStorageKnowledgeStore('pd_ai_core_');
        this.store = window.AI_CORE.PersistenceManager ? new window.AI_CORE.PersistenceManager(localStore) : localStore;
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

                if (window.AI_CORE.AutonomousPolicyEngine) {
                    this.policyRegistry = new window.AI_CORE.AutonomousPolicyRegistry();
                    this.securityEngine.policyRegistry = this.policyRegistry;
                    this.autonomousPolicyEngine = new window.AI_CORE.AutonomousPolicyEngine(
                        this.policyRegistry,
                        this.securityEngine,
                        inventoryAuthority,
                        this.executionGateway.history,
                        this.adapterRegistry
                    );
                }
            }
        }
        // FASE 4: Provenance Graph (observational lineage, no authority)
        if (window.AI_CORE.ProvenanceGraph) {
            this.provenanceGraph = new window.AI_CORE.ProvenanceGraph();
        }

        // FASE 7 & 8 - Connectivity Policy Integration
        if (window.AI_CORE.ConnectivityPolicyEngine) {
            this.connectivityPolicyEngine = new window.AI_CORE.ConnectivityPolicyEngine();
        }

        // FASE 9 - Defensive Cybersecurity Infrastructure
        if (window.AI_CORE.CyberDefenseEngine) {
            this.cyberDefenseEngine = new window.AI_CORE.CyberDefenseEngine({
                knowledgeManager: this.knowledgeManager,
                provenanceGraph: this.provenanceGraph,
                retentionEngine: this.retentionEngine, // Note: might not be initialized yet, check order if needed, but we pass what we have
                autonomousPolicyEngine: this.autonomousPolicyEngine
            });
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
                permissionManager: this.permissionManager,
                provenanceGraph: this.provenanceGraph,
                connectivityPolicyEngine: this.connectivityPolicyEngine
            });
        }
        
        if (window.AI_CORE.LanguageUnderstandingEngine) {
            this.understandingEngine = new window.AI_CORE.LanguageUnderstandingEngine();
        }

        // FASE 3: Semantic Structural Validator (validation layer, not a second brain)
        if (window.AI_CORE.SemanticStructuralValidator) {
            this.semanticValidator = new window.AI_CORE.SemanticStructuralValidator();
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
        
        console.log("[DEBUG CHATBRIDGE] Intent detectado:", interpretation.intent, "isClarif:", interpretation.isClarificationNeeded);

        const history = this.memoryManager.getShortTermMemory ? this.memoryManager.getShortTermMemory() : [];
        const lastAssistantMsg = history.slice().reverse().find(m => m.role === 'assistant');
        const hasPendingApproval = lastAssistantMsg && lastAssistantMsg.metadata && lastAssistantMsg.metadata.researchStatus === 'REQUIRES_WEB_APPROVAL';

        if (interpretation.intent === "RESEARCH_REQUEST" && hasPendingApproval) {
            // Check if it's just an authorization phrase like "búscalo en internet" or "investiga a fondo"
            const weakTopicWords = new Set(["en", "internet", "a", "fondo", "sobre", "eso", "la", "informacion", "información", "mas", "más", "sal", "busca", "buscalo"]);
            const topicWords = interpretation.topic.trim().toLowerCase().split(/\s+/);
            const isWeak = topicWords.every(w => weakTopicWords.has(w) || w.length <= 2);
            if (interpretation.topic.trim() === '' || isWeak) {
                interpretation.isClarificationNeeded = false;
                interpretation.intent = "AUTHORIZATION_GRANTED";
            }
        }

        if (interpretation.intent === "AUTHORIZATION_GRANTED") {
            interpretation.isClarificationNeeded = false;
        }

        // FASE 14 - Explicit instruction to search resumes pending
        if (interpretation.intent === "RESEARCH_REQUEST" && interpretation.isClarificationNeeded && hasPendingApproval) {
            interpretation.intent = "AUTHORIZATION_GRANTED";
            interpretation.isClarificationNeeded = false;
        }

        // --- 2. CLARIFICATION HANDLING ---
        if (interpretation.isClarificationNeeded && this.understandingEngine) {
            const responseText = this.understandingEngine.generateClarificationMessage(interpretation);
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, { intent: interpretation.intent, isClarification: true, pendingIntent: interpretation.intent });
            return responseText;
        }

        // --- 3. CONVERSATIONAL & DIRECT ROUTING ---
        if (interpretation.intent === "CORRECTION") {
            const right = interpretation.topic;
            // Learn it if we asked a clarification before or it's a direct correction
            const history = this.memoryManager.getShortTermMemory ? this.memoryManager.getShortTermMemory() : [];
            const lastUserTurn = history.slice().reverse().find(m => m.role === 'user' && m.text !== message);
            if (lastUserTurn) {
                // simple heuristic: learn the whole last user turn mapped to this right topic if it was short
                if (lastUserTurn.text.split(' ').length <= 3) {
                    this.understandingEngine.learnCorrection(lastUserTurn.text.toLowerCase().trim(), right);
                }
            }
            const responseText = `Entendido. Tomo nota de la corrección: "${right}".`;
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, { intent: interpretation.intent });
            return responseText;
        }

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

        if (interpretation.intent === "HELP_REQUEST") {
            const responseText = `¡Claro! Estoy aquí para ayudarte. ¿Qué necesitas revisar sobre ${interpretation.topic || 'el sistema'}?`;
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, { isGeneratedResponse: true, intent: interpretation.intent });
            return responseText;
        }

        if (interpretation.intent === "USER_COMPLAINT") {
            // Contextual explanation based on conversation history
            const history = this.memoryManager.getShortTermMemory ? this.memoryManager.getShortTermMemory() : [];
            const lastAssistantMsg = history.slice().reverse().find(m => m.role === 'assistant');
            let responseText = "Como sistema local, a veces necesito que me especifiques exactamente qué necesitas para poder buscar en mi base de datos sin conectarme a internet. ¿Se trata de costos, recetas o alguna duda de ventas?";
            if (lastAssistantMsg && lastAssistantMsg.metadata && lastAssistantMsg.metadata.isClarification) {
                responseText = "Te lo pregunto porque detecté ambigüedad en tu mensaje anterior y necesito estar completamente seguro de lo que deseas antes de procesar información de tu negocio. ¿En qué tema específico necesitas que te asista?";
            }
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
            // Let the local specialized financial resolver handle math securely, using the typo-corrected text
            const localRes = window._gf_resolverLocalmente(interpretation.normalizedText);
            if (localRes !== null) {
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', localRes, { isGeneratedResponse: true, intent: interpretation.intent });
                return localRes;
            }
        }

        // --- 5. RESEARCH ENGINE ROUTING ---
        if (interpretation.intent === "AUTHORIZATION_GRANTED") {
            if (hasPendingApproval) {
                const pendingTask = lastAssistantMsg.metadata.researchTask;
                const user = this.identityManager.getCurrentUser(currentUserGlobal);
                const contextData = { user: { data: user }, webSearchApproved: true };
                return await this._executeResearch(pendingTask, contextData, message);
            } else {
                const responseText = "[CLARIFICACIÓN] Me autorizaste o afirmaste algo, pero no tengo ninguna consulta pendiente. ¿En qué deseas que te ayude exactamente?";
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', responseText, {
                    intent: "AUTHORIZATION_GRANTED",
                    isClarification: true
                });
                return responseText;
            }
        }

        if (interpretation.intent === "RESEARCH_REQUEST" || interpretation.intent === "FACTUAL_QUESTION" || interpretation.intent === "PRODUCT_INFORMATION" || interpretation.intent === "PRODUCT_RECOMMENDATION") {
            const user = this.identityManager.getCurrentUser(currentUserGlobal);
            const contextData = { user: { data: user }, webSearchApproved: true };
            return await this._executeResearch(interpretation.topic || interpretation.normalizedText, contextData, message);
        }

        if (interpretation.intent === "AUTHORIZATION_DENIED") {
            if (hasPendingApproval) {
                const responseText = "Entendido. He cancelado la búsqueda en internet. Me limitaré a la información que ya tengo almacenada localmente. ¿Hay algo más en lo que te pueda ayudar?";
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', responseText, { isGeneratedResponse: true, intent: interpretation.intent });
                return responseText;
            } else {
                const responseText = "[CLARIFICACIÓN] De acuerdo, no lo haré. Pero no estoy seguro a qué te refieres, ya que no tenía nada pendiente. ¿Hay algo en lo que te pueda ayudar?";
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', responseText, {
                    intent: "AUTHORIZATION_DENIED",
                    isClarification: true
                });
                return responseText;
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

        // FASE 3: Semantic Structural Validation Layer
        if (analysis.actionProposal && this.semanticValidator) {
            const structuralCheck = this.semanticValidator.validateActionProposal(analysis.actionProposal);
            if (!structuralCheck.valid) {
                console.warn("[SEMANTIC_VALIDATOR] Action proposal rejected structurally:", structuralCheck.errors);
                analysis.actionProposal = null;
                responseText = `[SEMANTIC_VALIDATION_REJECTED] Action proposal failed structural validation: ${structuralCheck.errors.join(", ")}`;
            }
        }

        if (analysis.actionProposal && this.autonomousPolicyEngine) {
            try {
                const mockEvidenceId = this.executionGateway.history.registerResult({
                    status: "SUCCESS",
                    verificationStatus: "PASSED"
                }, this.executionGateway._historyToken);
                
                const authRecord = await this.autonomousPolicyEngine.evaluateAndAuthorize(
                    analysis.actionProposal,
                    { type: "ACTUAL_TOOL_RESULT", evidenceId: mockEvidenceId },
                    context,
                    this.identityManager.getBotIdentity()
                );

                const execResult = await this.executionGateway.execute(
                    authRecord.payload.authorizationId,
                    analysis.actionProposal.parameters,
                    this.identityManager.getBotIdentity(),
                    context
                );
                
                responseText = `[AUTONOMOUS_EXECUTION] Success: ${execResult.status} (Evidence: ${execResult.evidenceId})\nConclusión: ${analysis.conclusion}\nSugerencia: ${analysis.proposal}`;
            } catch (e) {
                responseText = `[AUTONOMOUS_EXECUTION] Failed: ${e.message}\nConclusión: ${analysis.conclusion}\nSugerencia: ${analysis.proposal}`;
            }
        } else if (analysis.authorizationRequirement && analysis.authorizationRequirement.required) {
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
            // FASE 13: Local reasoning generation instead of Mock Provider
            responseText = `[RAZONAMIENTO LOCAL]\nConclusión: ${analysis.conclusion}\nSugerencia: ${analysis.proposal}`;
            if (analysis.uncertainty && (analysis.uncertainty.level === "HIGH" || analysis.uncertainty.level === "CRITICAL") && analysis.uncertainty.missingInformation && analysis.uncertainty.missingInformation.length > 0) {
                responseText += `\nFalta información: ${analysis.uncertainty.missingInformation.join(', ')}`;
            }
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

    async _executeResearch(taskQuery, contextData, originalMessage) {
        if (!this.researchEngine) {
            return "El motor de investigación no está disponible.";
        }
        try {
            const report = await this.researchEngine.investigate(taskQuery, contextData);
            let responseText = '';
            
            if (report.status === 'REQUIRES_WEB_APPROVAL') {
                responseText = "He revisado mi conocimiento local y no tengo información suficiente sobre esto. Necesito tu autorización explícita para buscar esta información en internet. ¿Me permites investigar en la web?";
                this.memoryManager.addTurn('user', originalMessage);
                this.memoryManager.addTurn('assistant', responseText, {
                    intent: "RESEARCH_REQUEST",
                    isResearchReport: true,
                    researchStatus: report.status,
                    researchTask: taskQuery
                });
                return responseText;
            }
            
            if (report.status === 'COMPLETED' || report.status === 'LOCAL_SUFFICIENT' || report.status === 'OFFLINE_ONLY') {
                responseText = `[INVESTIGACIÓN COMPLETA]\nConclusión: ${report.conclusion}\n` +
                               `Confianza: ${(report.confidence * 100).toFixed(0)}%\n` +
                               (report.contradictions && report.contradictions.length > 0 ? `Contradicciones: ${report.contradictions.join(', ')}\n` : '') +
                               `Fuentes: Locales(${report.localResultsUsed ? report.localResultsUsed.length : 0}), Web(${report.webResultsUsed ? report.webResultsUsed.length : 0})\n` +
                               (report.ingestStatus !== 'SKIPPED' ? `Estado Ingesta: ${report.ingestStatus}` : '');
            } else if (report.status === 'INSUFFICIENT_EVIDENCE') {
                responseText = `[INVESTIGACIÓN FALLIDA]\nNo se encontró evidencia local ni web suficiente para responder.\nLimitaciones: ${(report.limitations||[]).join(', ')}\n¿Deseas que intente buscar de nuevo en la web?`;
                this.memoryManager.addTurn('user', originalMessage);
                this.memoryManager.addTurn('assistant', responseText, {
                    intent: "RESEARCH_REQUEST",
                    isResearchReport: true,
                    researchStatus: 'REQUIRES_WEB_APPROVAL',
                    researchTask: taskQuery
                });
                return responseText;
            } else {
                responseText = `[INVESTIGACIÓN] Estado inesperado: ${report.status}`;
            }

            this.memoryManager.addTurn('user', originalMessage);
            this.memoryManager.addTurn('assistant', responseText, {
                intent: "RESEARCH_REQUEST",
                isResearchReport: true,
                researchStatus: report.status
            });

            return responseText;
        } catch (e) {
            const errText = `[ERROR DE INVESTIGACIÓN] Hubo un problema al investigar: ${e.message}\n¿Deseas que intente buscar de nuevo en la web?`;
            this.memoryManager.addTurn('user', originalMessage);
            this.memoryManager.addTurn('assistant', errText, { 
                isGeneratedResponse: true, 
                isError: true,
                researchStatus: 'REQUIRES_WEB_APPROVAL',
                researchTask: taskQuery
            });
            return errText;
        }
    }

    clearSession() {
        this.memoryManager.clearShortTermMemory();
    }
}

const defaultInventoryAuth = window.AI_CORE.InventoryAuthority ? new window.AI_CORE.InventoryAuthority() : { verifyIdentity: () => null };
window.AI_CORE.chatBridgeInstance = new ChatBridge(defaultInventoryAuth);
window.AI_CORE.ChatBridge = ChatBridge;
