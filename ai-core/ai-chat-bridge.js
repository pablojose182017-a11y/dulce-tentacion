if (typeof window.AI_CORE === 'undefined') window.AI_CORE = {};

class ChatBridge {
    constructor(inventoryAuthority = null) {
        this.identityManager = new window.AI_CORE.IdentityManager();
        this.permissionManager = new window.AI_CORE.PermissionManager();
        const localStore = new window.AI_CORE.LocalStorageKnowledgeStore('pd_ai_core_');
        this.store = window.AI_CORE.PersistenceManager ? new window.AI_CORE.PersistenceManager(localStore) : localStore;
        this.memoryManager = new window.AI_CORE.MemoryManager(this.store, 'pd_memory');
        this.knowledgeManager = new window.AI_CORE.KnowledgeManager(this.store);
        if (window.AI_CORE.KnowledgeVault) {
            this.knowledgeVault = new window.AI_CORE.KnowledgeVault(this.knowledgeManager);
            // Rehidratar semillas si la base de conocimiento está fresca o vacía
            setTimeout(async () => {
                try {
                    await this.knowledgeManager._ensureLoaded();
                    if (this.knowledgeManager._cache.length === 0) {
                        let repoData = null;
                        if (typeof require === 'function') {
                            try { repoData = require('./knowledge-repository.json'); } catch(e) {}
                        }
                        if (!repoData && typeof window !== 'undefined' && window.PD_KNOWLEDGE_REPOSITORY) {
                            repoData = window.PD_KNOWLEDGE_REPOSITORY;
                        }
                        if (repoData) {
                            await this.knowledgeManager.syncFromRepository(repoData);
                            await this.knowledgeVault.backup();
                        }
                    }
                } catch(e) {
                    console.warn('[ChatBridge] Rehidratación de KnowledgeVault omitida:', e.message);
                }
            }, 0);
        }
        // Evolution observa patrones de salida y genera propuestas locales.
        // Nunca modifica permisos, memoria, conocimiento ni ejecuta acciones.
        this.evolutionAdvisor = window.AI_CORE.EvolutionAdvisor
            ? new window.AI_CORE.EvolutionAdvisor()
            : null;
        
        // Fase 3: Integración de Creator Knowledge con degradación segura
        if (window.AI_CORE.CreatorKnowledgeStore && window.AI_CORE.CreatorKnowledgeManager) {
            this.creatorKnowledgeStore = new window.AI_CORE.CreatorKnowledgeStore();
            this.creatorKnowledgeManager = new window.AI_CORE.CreatorKnowledgeManager(this.creatorKnowledgeStore);
            try {
                // Forzamos rehidratación. Si los datos están corruptos, fallará cerradamente.
                this.creatorKnowledgeManager.rehydrate();
                if (this.creatorKnowledgeManager.retrieveActive().length === 0) {
                    this.creatorKnowledgeManager.insertAtomic([
                        {
                            category: "CREATOR_FACT",
                            statement: "P y S Punto Dulce es una panaderia y reposteria artesanal fundada por Pablo Carrascal, especializada en panaderia tradicional, tortas personalizadas, postres y pasabocas al por mayor.",
                            applicabilityScope: { domain: "TEXT", context: "DEFAULT" },
                            provenance: { source: "CREATOR", author: "Pablo Carrascal" },
                            evidenceReference: { resourceId: "doc_fundacion_pd", origin: "CREATOR_RECORD", fingerprint: "fp_fundacion_01" }
                        },
                        {
                            category: "CREATOR_FACT",
                            statement: "Los productos estrella de panaderia tradicional son: Pan de queso (harina, queso costeno, mantequilla, huevos), Pan cascarita, Pan tajado, Bolitas de leche, Bolitas de maiz, Galletas artesanales y Paledonias.",
                            applicabilityScope: { domain: "TEXT", context: "DEFAULT" },
                            provenance: { source: "CREATOR", author: "Pablo Carrascal" },
                            evidenceReference: { resourceId: "doc_productos_estrella", origin: "CREATOR_RECORD", fingerprint: "fp_recetas_01" }
                        },
                        {
                            category: "CREATOR_PREFERENCE",
                            statement: "El calculo del costo de produccion se basa en la suma de insumos directos (harina, azucar, lacteos, grasas) mas el porcentaje de merma y empaque, manteniendo un margen de ganancia objetivo minimo del 35% al 45% en reposteria y 30% en panaderia.",
                            applicabilityScope: { domain: "FINANCIAL", context: "ANALYSIS" },
                            provenance: { source: "CREATOR", author: "Pablo Carrascal" }
                        },
                        {
                            category: "CREATOR_GOAL",
                            statement: "El Guardian Financiero debe proteger la rentabilidad del negocio, alertar sobre perdidas o ventas por debajo del costo y guiar amablemente al administrador con datos claros y precisos.",
                            applicabilityScope: { domain: "FINANCIAL", context: "DEFAULT" },
                            provenance: { source: "CREATOR", author: "Pablo Carrascal" }
                        }
                    ]);
                }
            } catch (e) {
                console.warn("[ChatBridge] Creator Knowledge rehydration failed:", e.message);
                this.creatorKnowledgeManager = null; // Degradación segura: Anula la instancia
            }
        } else {
            this.creatorKnowledgeManager = null;
        }

        // El puente usa el motor local estructurado directamente. El LocalMockProvider
        // se conserva solo para compatibilidad con el flujo legacy y sus pruebas.
        this.reasoningEngine = new window.AI_CORE.ReasoningEngine();
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
        if (window.AI_CORE.IntegratedConsolidationEngine && this.provenanceGraph) {
            this.consolidationEngine = new window.AI_CORE.IntegratedConsolidationEngine(this.provenanceGraph);
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
                consolidationEngine: this.consolidationEngine,
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

        // Habilidad Nativa de Procesamiento de Texto (Corrección, Redacción y Adaptación)
        if (window.AI_CORE.TextProcessor) {
            this.textProcessor = new window.AI_CORE.TextProcessor();
        }

        // Memoria de Contexto Multi-Turno y Estado Conversacional
        this.conversationState = {
            pendingTask: null, // ej. 'CORRECT_AND_IMPROVE_TEXT', 'AWAITING_TEXT_TO_CORRECT', 'AWAITING_TEXT_TO_SUMMARIZE', etc.
            pendingData: null,
            lastTopic: null,
            updatedAt: Date.now()
        };
    }

    async receiveMessage(message, currentUserGlobal, costosStateGlobal, fileAttachment = null) {
        // V1 & V3: Task Envelope, Presupuesto y Estado (OBSERVE -> ... -> EVOLUTION_REVIEW)
        const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2);
        const taskEnvelope = {
            id: requestId,
            state: 'OBSERVE',
            budget: 10,
            user: this.identityManager.getCurrentUser(currentUserGlobal),
            objective: message
        };

        let responseText;
        try {
            responseText = await this._processMessageInner(message, currentUserGlobal, costosStateGlobal, fileAttachment, taskEnvelope);
            taskEnvelope.state = 'RECORD';
        } catch (e) {
            console.error("[ChatBridge] Error en procesamiento:", e);
            responseText = `[FAIL_CLOSED] Error interno: ${e.message}`;
            taskEnvelope.state = 'FAIL_CLOSED';
        }

        // V5: Evolution Review
        if (this.evolutionAdvisor) {
            taskEnvelope.state = 'EVOLUTION_REVIEW';
            const evoResult = this.evolutionAdvisor.observe(responseText);
            if (evoResult && evoResult.proposal) {
                console.log("[ChatBridge] Evolution V5 Proposal generated:", evoResult.proposal);
            }
        }
        return responseText;
    }

    async _processMessageInner(message, currentUserGlobal, costosStateGlobal, fileAttachment, taskEnvelope) {
        if (taskEnvelope.budget <= 0) return "[BUDGET_EXCEEDED] Presupuesto agotado para esta petición.";
        taskEnvelope.budget--;
        taskEnvelope.state = 'UNDERSTAND';
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
        console.log("[DEBUG CHATBRIDGE] Topic final:", interpretation.topic);

        // 0. MEMORIA MULTI-TURNO: Verificar si hay una tarea pendiente (pendingTask)
        const wordCount = message.trim().split(/\s+/).length;
        const isLongText = wordCount > 25 || message.length > 180;
        const currentPendingTask = (this.conversationState && this.conversationState.pendingTask) || null;

        // 0. DETECTOR DE CANCELACIÓN Y CAMBIO DE PLANES (Prioridad Máxima)
        const isCancelMsg = interpretation.intent === "CANCEL_TASK" ||
            /\b(?:cancelar|cancela|cancelacorreccion|olvidalo|olvida eso|dejemoslo asi|vamos a hacer otra cosa|cambiemos de tema|ya no|no quiero)\b/i.test(message) ||
            /^cancel[a-z]*$/i.test(message.trim().toLowerCase());

        // DETECTOR DE GUARDAR EN MEMORIA / APRENDER CONOCIMIENTO
        const isSaveKnowledgeMsg = interpretation.intent === "SAVE_TO_KNOWLEDGE_VAULT" ||
            /\b(?:guarda(?:r)?\s+(?:este|ese|esta|la|el|dicho)?\s*(?:conocimiento|informacion|info|dato|receta|secreto|nota)|aprende\s+(?:este|esto|ese|esa)|memoriza\s+(?:esto|este|ese)|boveda\s+local|knowledgevault)\b/i.test(message) ||
            (/\bguarda\b/i.test(message) && /\b(?:conosimiento|conocimiento|memoria)\b/i.test(message));

        if (isCancelMsg) {
            this.conversationState.pendingTask = null;
            this.conversationState.pendingData = null;
            this.conversationState.updatedAt = Date.now();

            const user = this.identityManager.getCurrentUser(currentUserGlobal);
            const isCreator = user && user.email === 'pablojose182017@gmail.com';
            const name = isCreator ? "Pablo" : "socio";
            const responseText = `¡Listo, ${name}! Cancelamos la corrección de texto. Cuéntame, ¿qué hacemos o revisamos ahora?`;
            
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, {
                intent: "CANCEL_TASK",
                isGeneratedResponse: true
            });
            return responseText;
        }

        if (isSaveKnowledgeMsg) {
            // Limpiar cualquier pendingTask previo
            this.conversationState.pendingTask = null;
            this.conversationState.updatedAt = Date.now();

            const user = this.identityManager.getCurrentUser(currentUserGlobal);
            const isCreator = user && user.email === 'pablojose182017@gmail.com';
            const name = isCreator ? "Pablo" : "socio";

            // Buscar si en el historial reciente ya hay un texto largo pegado por el usuario
            const history = this.memoryManager.getShortTermMemory ? this.memoryManager.getShortTermMemory() : [];
            const lastLongUserMsg = history.slice().reverse().find(m => m.role === 'user' && m.text !== message && (m.text.split(/\s+/).length > 25 || m.text.length > 150));

            // Si hay un texto largo previo o si este mismo mensaje contiene el texto largo a guardar:
            const textToSave = (wordCount > 25) ? message : (lastLongUserMsg ? lastLongUserMsg.text : null);

            if (textToSave) {
                if (this.knowledgeManager) {
                    try {
                        await this.knowledgeManager._ensureLoaded();
                        const docId = `user_taught_${Date.now()}`;
                        await this.knowledgeManager.add({
                            id: docId,
                            title: `Conocimiento Aportado por ${name}`,
                            content: textToSave,
                            category: "conocimiento_general",
                            tags: ["usuario", "punto_dulce", "estrategia"],
                            source: "USER_TAUGHT",
                            confidence: 1.0,
                            version: 1,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });
                        if (this.knowledgeVault) {
                            await this.knowledgeVault.backup();
                        }
                    } catch(eSave) {
                        console.warn("[ChatBridge] Error al guardar en KnowledgeVault:", eSave.message);
                    }
                }

                const responseText = `¡Entendido, ${name}! He guardado este conocimiento en mi Bóveda Local (KnowledgeVault) para tenerlo bien claro y aplicarlo en futuros consejos y análisis de Punto Dulce. ¿Qué más revisamos hoy?`;
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', responseText, {
                    intent: "SAVE_TO_KNOWLEDGE_VAULT",
                    isGeneratedResponse: true,
                    action: "KNOWLEDGE_SAVED"
                });
                return responseText;
            } else {
                // Aún no ha pasado el dato a guardar
                this.conversationState.pendingTask = 'AWAITING_KNOWLEDGE_TO_SAVE';
                this.conversationState.updatedAt = Date.now();
                const responseText = `¡De una, ${name}! Pásame aquí el dato o texto que quieres que memorice y lo guardo bajo llave en mi bóveda para futuras consultas.`;
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', responseText, {
                    intent: "SAVE_TO_KNOWLEDGE_VAULT",
                    isGeneratedResponse: true,
                    pendingTask: 'AWAITING_KNOWLEDGE_TO_SAVE'
                });
                return responseText;
            }
        }

        // Si la tarea pendiente era esperar conocimiento para guardar
        if (currentPendingTask === 'AWAITING_KNOWLEDGE_TO_SAVE') {
            this.conversationState.pendingTask = null;
            this.conversationState.updatedAt = Date.now();
            const user = this.identityManager.getCurrentUser(currentUserGlobal);
            const isCreator = user && user.email === 'pablojose182017@gmail.com';
            const name = isCreator ? "Pablo" : "socio";

            if (this.knowledgeManager) {
                try {
                    await this.knowledgeManager._ensureLoaded();
                    const docId = `user_taught_${Date.now()}`;
                    await this.knowledgeManager.add({
                        id: docId,
                        title: `Conocimiento Aportado por ${name}`,
                        content: message,
                        category: "conocimiento_general",
                        tags: ["usuario", "punto_dulce", "estrategia"],
                        source: "USER_TAUGHT",
                        confidence: 1.0,
                        version: 1,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    if (this.knowledgeVault) {
                        await this.knowledgeVault.backup();
                    }
                } catch(eSave) {
                    console.warn("[ChatBridge] Error al guardar en KnowledgeVault:", eSave.message);
                }
            }

            const responseText = `¡Entendido, ${name}! He guardado este conocimiento en mi Bóveda Local (KnowledgeVault) para tenerlo bien claro y aplicarlo en futuros consejos y análisis de Punto Dulce. ¿Qué más revisamos hoy?`;
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, {
                intent: "SAVE_TO_KNOWLEDGE_VAULT",
                isGeneratedResponse: true,
                action: "KNOWLEDGE_SAVED"
            });
            return responseText;
        }

        // Si el usuario tenía pendiente entregar un texto para corrección / mejora:
        if (currentPendingTask === 'CORRECT_AND_IMPROVE_TEXT' || currentPendingTask === 'AWAITING_TEXT_TO_CORRECT') {
            // Limpiar estado pendiente
            this.conversationState.pendingTask = null;
            this.conversationState.updatedAt = Date.now();

            if (this.textProcessor) {
                const processed = await this.textProcessor.processText(message);
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', processed, {
                    intent: "TEXT_PROCESSED",
                    isGeneratedResponse: true,
                    action: "CORRECT_AND_IMPROVE_TEXT"
                });
                return processed;
            }
        }

        // Si el usuario envió en un solo mensaje la orden y el texto largo juntos
        const hasTextProcessVerb = /\b(?:corrijas|corregir|correccion|ortograficos?|ortografia|redactar|resumir|adapta(?:r)?)\b/i.test(message);
        if (hasTextProcessVerb && isLongText && this.textProcessor) {
            this.conversationState.pendingTask = null;
            this.conversationState.updatedAt = Date.now();
            const processed = await this.textProcessor.processText(message);
            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', processed, {
                intent: "TEXT_PROCESSED",
                isGeneratedResponse: true,
                action: "CORRECT_AND_IMPROVE_TEXT"
            });
            return processed;
        }

        // Si la intención detectada es preparar el procesamiento de texto (Turno 1)
        if (interpretation.intent === "TEXT_PROCESS_PREPARATION") {
            this.conversationState.pendingTask = 'CORRECT_AND_IMPROVE_TEXT';
            this.conversationState.updatedAt = Date.now();
            const user = this.identityManager.getCurrentUser(currentUserGlobal);
            const isCreator = user && user.email === 'pablojose182017@gmail.com';
            const name = isCreator ? "Pablo" : "socio";

            const isImplement = /\b(?:implementar|aplicar|ejecutar|usar)\b/i.test(message);
            const responseText = isImplement
                ? `¡Claro que sí, ${name}! Pásame el texto aquí abajo y lo revisamos en detalle para adaptarlo e implementarlo directamente en la operación de Punto Dulce.`
                : `¡Claro que sí, ${name}! Pásame el texto aquí abajo y enseguida le corrijo la ortografía, puntuación y estilo (y si quieres también lo adaptamos a Punto Dulce).`;

            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, {
                intent: "TEXT_PROCESS_PREPARATION",
                isGeneratedResponse: true,
                pendingTask: 'CORRECT_AND_IMPROVE_TEXT'
            });
            return responseText;
        }

        // Si la intención es pedir recomendación / asesoría estratégica de negocio (Query Gatekeeper)
        if (interpretation.intent === "ADVICE_REQUEST") {
            const user = this.identityManager.getCurrentUser(currentUserGlobal);
            const isCreator = user && user.email === 'pablojose182017@gmail.com';
            const saludo = isCreator ? "¡Con gusto, Pablo! Como tu socio asesor en Punto Dulce" : "¡Con gusto! Como asesor estratégico de P&S Punto Dulce";
            
            const responseText = `${saludo}, te planteo estas 4 recomendaciones estratégicas inmediatas basadas en la operación real de nuestro negocio:\n\n` +
                `1. 🥐 **Optimizar Margen en Panadería Tradicional:** Revisar las recetas con margen menor al 30% (como el Pan Cascarita o Pan de Queso) ajustando gramajes o reduciendo merma de insumos lácteos para proteger la utilidad neta.\n\n` +
                `2. ☕ **Lanzar Combo Desayuno y Tarde en Cúcuta:** Crear el 'Combo Cascarita + Café caliente' en la mañana y 'Roliqueso + Bebida' en la tarde, incentivando compra rápida en horas pico.\n\n` +
                `3. ⭐ **Fidelización con Club Puntos VIP:** Incentivar la recurrencia premiando a clientes frecuentes que compran pan tajado o tortas con puntos redimibles en bolitas de maíz o leche.\n\n` +
                `4. 🎂 **Impulsar Catálogo Digital de Tortas Bajo Pedido:** Promocionar en WhatsApp Business nuestras tortas artesanales personalizadas con anticipo del 50%, garantizando márgenes del 38% al 45%.\n\n` +
                `¿Sobre cuál de estas 4 opciones te gustaría que profundicemos hoy?`;

            this.memoryManager.addTurn('user', message);
            this.memoryManager.addTurn('assistant', responseText, {
                intent: "ADVICE_REQUEST",
                isGeneratedResponse: true,
                topic: "BUSINESS_STRATEGY"
            });
            return responseText;
        }

        // Si es un texto largo aislado pegado por el usuario sin pendingTask previo
        if (interpretation.intent === "LONG_TEXT_INPUT" || (isLongText && interpretation.intent === "RESEARCH_REQUEST")) {
            if (this.textProcessor) {
                const processed = await this.textProcessor.processText(message);
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', processed, {
                    intent: "TEXT_PROCESSED",
                    isGeneratedResponse: true,
                    action: "CORRECT_AND_IMPROVE_TEXT"
                });
                return processed;
            }
        }

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
                const responseText = "Me autorizaste o afirmaste algo, pero no tengo ninguna consulta pendiente en este momento. ¿En qué deseas que te ayude exactamente?";
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', responseText, {
                    intent: "AUTHORIZATION_GRANTED",
                    isClarification: true
                });
                return responseText;
            }
        }

        if (interpretation.intent === "RESEARCH_REQUEST") {
            const queryCandidate = (interpretation.topic || interpretation.normalizedText || message).trim();
            const qWordCount = queryCandidate.split(/\s+/).length;
            const isDisallowed = qWordCount > 25 ||
                /^(?:que\s+(?:me\s+)?(?:recomiendas|sugieres|aconsejas)|que\s+hacer|que\s+hago|como\s+vamos|dame\s+ideas|que\s+opinas|necesito\s+ayuda|ayudame)\b/i.test(queryCandidate.toLowerCase()) ||
                /^(?:te\s+voy\s+a\s+pasar|voy\s+a\s+pasar|corrigeme|corrige|revisa)\b/i.test(queryCandidate.toLowerCase());

            if (isDisallowed) {
                // Si es un pedido de consejo o ayuda
                if (/recomiend|ideas|opinas|hacer|hago|vamos/i.test(queryCandidate)) {
                    const user = this.identityManager.getCurrentUser(currentUserGlobal);
                    const isCreator = user && user.email === 'pablojose182017@gmail.com';
                    const saludo = isCreator ? "¡Con gusto, Pablo! Como tu socio asesor en Punto Dulce" : "¡Con gusto! Como asesor estratégico de P&S Punto Dulce";
                    const responseText = `${saludo}, te planteo estas 4 recomendaciones estratégicas inmediatas basadas en la operación real de nuestro negocio:\n\n` +
                        `1. 🥐 **Optimizar Margen en Panadería Tradicional:** Revisar las recetas con margen menor al 30% (como el Pan Cascarita o Pan de Queso) ajustando gramajes o reduciendo merma de insumos lácteos para proteger la utilidad neta.\n\n` +
                        `2. ☕ **Lanzar Combo Desayuno y Tarde en Cúcuta:** Crear el 'Combo Cascarita + Café caliente' en la mañana y 'Roliqueso + Bebida' en la tarde, incentivando compra rápida en horas pico.\n\n` +
                        `3. ⭐ **Fidelización con Club Puntos VIP:** Incentivar la recurrencia premiando a clientes frecuentes que compran pan tajado o tortas con puntos redimibles en bolitas de maíz o leche.\n\n` +
                        `4. 🎂 **Impulsar Catálogo Digital de Tortas Bajo Pedido:** Promocionar en WhatsApp Business nuestras tortas artesanales personalizadas con anticipo del 50%, garantizando márgenes del 38% al 45%.\n\n` +
                        `¿Sobre cuál de estas 4 opciones te gustaría que profundicemos hoy?`;

                    this.memoryManager.addTurn('user', message);
                    this.memoryManager.addTurn('assistant', responseText, {
                        intent: "ADVICE_REQUEST",
                        isGeneratedResponse: true,
                        topic: "BUSINESS_STRATEGY"
                    });
                    return responseText;
                }

                if (this.textProcessor && qWordCount > 25) {
                    const processed = await this.textProcessor.processText(message);
                    this.memoryManager.addTurn('user', message);
                    this.memoryManager.addTurn('assistant', processed, {
                        intent: "TEXT_PROCESSED",
                        isGeneratedResponse: true,
                        action: "CORRECT_AND_IMPROVE_TEXT"
                    });
                    return processed;
                }
            }

            const user = this.identityManager.getCurrentUser(currentUserGlobal);
            const contextData = { user: { data: user }, webSearchApproved: true };
            return await this._executeResearch(queryCandidate, contextData, message);
        }

        if (interpretation.intent === "AUTHORIZATION_DENIED") {
            if (hasPendingApproval) {
                const responseText = "Entendido. He cancelado la búsqueda en internet. Me limitaré a la información que ya tengo almacenada localmente. ¿Hay algo más en lo que te pueda ayudar?";
                this.memoryManager.addTurn('user', message);
                this.memoryManager.addTurn('assistant', responseText, { isGeneratedResponse: true, intent: interpretation.intent });
                return responseText;
            } else {
                const responseText = "De acuerdo, no lo haré. Pero no estoy seguro a qué te refieres, ya que no tenía nada pendiente. ¿Hay algo en lo que te pueda ayudar?";
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
        const activeTopic = interpretation.topic || message;
        let relevantDocs = [];
        try {
            const searchResults = await this.knowledgeManager.search(activeTopic);
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
            problemStatement: activeTopic,
            assembledContext: context,
            fileAttachment: fileAttachment
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

        if (analysis.actionProposal) {
            // Razonar puede proponer; nunca fabrica evidencia ni ejecuta. La
            // propuesta pasa por la aprobación humana configurada.
            if (this.securityEngine && this.executionGateway) {
                try {
                    const proposal = analysis.actionProposal;
                    const toolId = proposal.toolId || "UNKNOWN_TOOL";
                    const version = proposal.toolVersion || "1.0";
                    const req = this.securityEngine.createApprovalRequest(
                        toolId, version, proposal.parameters || {},
                        "Guardian action proposal: " + String(analysis.conclusion || "").slice(0, 240), context
                    );
                    req.requiresCreatorApproval = true;
                    this._pendingApprovals.set(req.requestId, req);
                    responseText = `[PENDING_APPROVAL] La propuesta requiere aprobaciÃ³n del creador y las comprobaciones de seguridad configuradas (Tool: ${toolId}). ID: ${req.requestId}`;
                } catch (e) {
                    responseText = `[FAIL_CLOSED] Propuesta no autorizada: ${e.message}`;
                }
            } else {
                responseText = "[FAIL_CLOSED] Subsistema de aprobaciÃ³n no disponible; no se ejecutÃ³ ninguna acciÃ³n.";
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
                    req.requiresCreatorApproval = true;
                    
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
            // FASE 13: Autonomía Web Silenciosa y Conversacional con Query Gatekeeper
            const isOnline = (typeof navigator !== "undefined" && navigator.onLine !== undefined) ? navigator.onLine : true;
            const queryCandidate = (activeTopic || message).trim();
            const qWordCount = queryCandidate.split(/\s+/).length;
            const isDisallowedQuery = qWordCount > 25 ||
                /^(?:que\s+(?:me\s+)?(?:recomiendas|sugieres|aconsejas)|que\s+hacer|que\s+hago|como\s+vamos|dame\s+ideas|que\s+opinas|necesito\s+ayuda|ayudame)\b/i.test(queryCandidate.toLowerCase()) ||
                /^(?:te\s+voy\s+a\s+pasar|voy\s+a\s+pasar|corrigeme|corrige|revisa)\b/i.test(queryCandidate.toLowerCase());

            if (this.researchEngine && isOnline && !isDisallowedQuery && (analysis.conclusion.indexOf("No existe conocimiento") !== -1 || (analysis.uncertainty && (analysis.uncertainty.level === "HIGH" || analysis.uncertainty.level === "CRITICAL")))) {
                try {
                    const user = this.identityManager.getCurrentUser(currentUserGlobal);
                    const contextData = { user: { data: user }, webSearchApproved: true };
                    return await this._executeResearch(queryCandidate, contextData, message);
                } catch(errAutoRes) {}
            }
            // Formatear respuesta base
            let baseText = "";
            if (analysis.conclusion && analysis.conclusion.indexOf("No existe conocimiento") !== -1) {
                baseText = "Estimado socio, he consultado nuestra memoria local y por el momento no cuento con registros detallados sobre este punto específico en modo desconectado.\n\n" +
                           "💡 **¿Cómo podemos proceder?**\n" +
                           "- Si cuentas con los datos o especificaciones, indícamelos y los integraré de inmediato al almacén de conocimiento permanente.\n" +
                           "- Tan pronto estemos en línea podré realizar una búsqueda autónoma en fuentes abiertas para complementar.";
            } else if (analysis.hypotheses && analysis.hypotheses.some(h => h.epistemicCategory === "CREATOR_FACT")) {
                const facts = analysis.hypotheses.filter(h => h.epistemicCategory === "CREATOR_FACT").map(h => h.description);
                baseText = facts.join("\n\n");
            } else if (analysis.conclusion && analysis.conclusion.indexOf("Existe evidencia local") !== -1) {
                baseText = String(analysis.proposal).replace(/^Proceder con la acci[oó]n basada en conocimiento\.?\s*(\([^)]*\))?\s*/i, "").trim() || String(analysis.proposal);
            } else {
                if (analysis.uncertainty && (analysis.uncertainty.level === "HIGH" || analysis.uncertainty.level === "CRITICAL")) {
                    baseText = "Estimado socio, he evaluado la consulta y no cuento con suficiente certeza empírica en el sistema para darte una cifra exacta sin riesgo de equivocarnos.\n\n" +
                               "¿Deseas que profundicemos con una búsqueda autónoma o me indicas la regla exacta que deseas consolidar en el almacén?";
                } else {
                    baseText = String(analysis.conclusion) + "\n\n" + String(analysis.proposal);
                }
            }

            // Análisis Proactivo de Negocio y Finanzas con live costosState
            let strategicAdvice = "";
            const insumos = (context.legacyData && Array.isArray(context.legacyData.insumos)) ? context.legacyData.insumos : [];
            const recetas = (context.legacyData && Array.isArray(context.legacyData.recetas)) ? context.legacyData.recetas : [];

            if (recetas.length > 0 && (/margen|costo|precio|ganancia|rentab|receta|pan|torta/i.test(message) || /margen|costo|precio|receta|torta|pan/i.test(activeTopic))) {
                // Buscar receta mencionada o tomar la primera
                let targetReceta = recetas.find(r => (r.nombre || "").toLowerCase().includes("torta") || (r.nombre || "").toLowerCase().includes("fresa") || (r.nombre || "").toLowerCase().includes("pan")) || recetas[0];
                const nombreReceta = targetReceta.nombre || "Receta activa";
                const costoUnit = Number(targetReceta.costoUnitario || targetReceta.costo || 0);
                const precioVenta = Number(targetReceta.precioVenta || targetReceta.precio || 0);

                if (precioVenta > 0 && costoUnit > 0) {
                    const margenCalculado = Math.round(((precioVenta - costoUnit) / precioVenta) * 100);
                    strategicAdvice += `\n\n---\n📊 **Diagnóstico Financiero Estratégico (P&S Punto Dulce):**\n` +
                                       `- **Producto analizado:** ${nombreReceta}\n` +
                                       `- **Costo Directo:** $${costoUnit.toLocaleString('es-CO')} | **Precio Actual:** $${precioVenta.toLocaleString('es-CO')}\n` +
                                       `- **Margen Bruto:** **${margenCalculado}%** (Margen objetivo: **30% - 45%**)\n`;

                    if (margenCalculado < 30) {
                        strategicAdvice += `⚠️ *Alerta de Rentabilidad:* El margen está por debajo del umbral mínimo del 30%. Sugiero revisar merma de insumos o reajustar el precio para proteger la utilidad neta.\n`;
                    } else if (margenCalculado >= 30 && margenCalculado <= 45) {
                        strategicAdvice += `✅ *Rango Saludable:* El producto se encuentra perfectamente equilibrado con nuestra meta de rentabilidad.\n`;
                    } else {
                        strategicAdvice += `🌟 *Alta Rentabilidad:* Excelente desempeño con margen superior al 45%.\n`;
                    }
                }
            }

            responseText = baseText + strategicAdvice;
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
        if (request.requiresCreatorApproval) {
            const auth = typeof firebase !== "undefined" && typeof firebase.auth === "function"
                ? firebase.auth()
                : null;
            const authUser = auth && auth.currentUser && !auth.currentUser.isAnonymous
                ? auth.currentUser
                : null;
            const authenticatedActor = authUser ? this.identityManager.getCurrentUser(authUser) : null;
            const suppliedEmail = approverIdentity && typeof approverIdentity.email === "string"
                ? approverIdentity.email.toLowerCase().trim()
                : null;
            if (!authenticatedActor || authenticatedActor.isCreator !== true || suppliedEmail !== authenticatedActor.email) {
                throw new Error("FAIL_CLOSED: CREATOR_APPROVAL_REQUIRED");
            }
        }        
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
                const fuentesCount = (report.webResultsUsed ? report.webResultsUsed.length : 0) + (report.localResultsUsed ? report.localResultsUsed.length : 0);
                const confPercent = Math.round((report.confidence || 0.8) * 100);
                responseText = `[INVESTIGACIÓN COMPLETA]\nConclusión: ${report.conclusion}\n` +
                               `Confianza: ${confPercent}%\n` +
                               (report.contradictions && report.contradictions.length > 0 ? `Contradicciones: ${report.contradictions.join(', ')}\n` : '') +
                               `Fuentes: Locales(${report.localResultsUsed ? report.localResultsUsed.length : 0}), Web(${report.webResultsUsed ? report.webResultsUsed.length : 0})\n` +
                               (report.ingestStatus && report.ingestStatus !== 'SKIPPED' ? `Estado Ingesta: ${report.ingestStatus}\n` : '') +
                               `\n---\n💡 *Análisis del Guardián:* Información asimilada para responder en menos de 5ms en futuras consultas.`;
            } else if (report.status === 'INSUFFICIENT_EVIDENCE') {
                responseText = `He consultado minuciosamente las fuentes disponibles y por el momento no encuentro evidencia suficiente sobre "${taskQuery}".\n\n` +
                               `💡 **¿Cómo podemos avanzar?**\n` +
                               `- Puedes brindarme un poco más de contexto, palabras clave o detalles específicos.\n` +
                               `- Si lo deseas, puedo intentar realizar una búsqueda complementaria con términos más amplios. ¿Te gustaría que busquemos con otra perspectiva?`;
            } else if (report.status === 'EXTERNAL_UNAVAILABLE') {
                responseText = `Detecté que no hay acceso fluido a la red en este momento. Sin embargo, mantengo activa mi base de conocimiento local para asistirte con costos, recetas y seguridad del negocio.`;
            } else {
                responseText = report.conclusion ? `[INVESTIGACIÓN]\n${report.conclusion}` : `He revisado la información disponible sobre "${taskQuery}". ¿En qué aspecto específico deseas que profundicemos?`;
            }

            this.memoryManager.addTurn('user', originalMessage);
            this.memoryManager.addTurn('assistant', responseText, {
                intent: "RESEARCH_REQUEST",
                isResearchReport: true,
                researchStatus: report.status,
                researchTask: taskQuery,
                topic: taskQuery
            });

            return responseText;
        } catch (e) {
            const errText = `Hubo un inconveniente temporal al consultar información externa: ${e.message}.\n\n` +
                           `💡 Sin embargo, todos mis módulos locales de costos, recetas y seguridad siguen operando normalmente. ¿Deseas que reintentemos la consulta o la abordamos desde los datos locales del negocio?`;
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
        this.conversationState = {
            pendingTask: null,
            pendingData: null,
            lastTopic: null,
            updatedAt: Date.now()
        };
    }

    getEvolutionProposals() {
        return this.evolutionAdvisor ? this.evolutionAdvisor.getProposals() : Object.freeze([]);
    }
}

// Observa todas las respuestas sin interceptar ni reescribir el flujo del chat.
const _receiveMessageBeforeEvolutionObservation = ChatBridge.prototype.receiveMessage;
ChatBridge.prototype.receiveMessage = async function(message, ...args) {
    let response;
    try {
        response = await _receiveMessageBeforeEvolutionObservation.call(this, message, ...args);
        return response;
    } finally {
        if (this.evolutionAdvisor) {
            try {
                this.evolutionAdvisor.observe(response);
            } catch (error) {
                console.warn('[EvolutionAdvisor] Observación omitida:', error && error.message);
            }
        }
    }
};

const defaultInventoryAuth = window.AI_CORE.InventoryAuthority ? new window.AI_CORE.InventoryAuthority() : { verifyIdentity: () => null };
window.AI_CORE.chatBridgeInstance = new ChatBridge(defaultInventoryAuth);
window.AI_CORE.ChatBridge = ChatBridge;

