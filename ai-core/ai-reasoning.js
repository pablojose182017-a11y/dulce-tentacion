window.AI_CORE = window.AI_CORE || {};

/**
 * Reasoning Engine
 * Motor analítico pasivo. Procesa un contexto y genera un árbol de razonamiento 
 * (hipótesis, evidencia, conclusiones, propuestas). NO ejecuta acciones ni modifica datos.
 */
class ReasoningEngine {
    constructor(aiProvider) {
        this.aiProvider = aiProvider; // Mock / AIProvider
    }

    _generateReasoningId() {
        return `res_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    _transition(output, newStatus) {
        output.status = newStatus;
        output.trace.push(newStatus);
    }

    /**
     * Falso AI Parser: Simula las estructuras del AIProvider para las pruebas deterministas.
     */
    async _mockAIProvider(inputContext) {
        const problem = inputContext.problemStatement.toLowerCase();
        
        let evidenceList = [];
        let hypotheses = [];

        // FASE 2 — CAMBIO 3: Leer knowledge desde blocks.knowledge.content (ruta correcta del contexto)
        const ctx = inputContext.assembledContext;
        const knowledgeBlock = (ctx && ctx.blocks && ctx.blocks.knowledge && ctx.blocks.knowledge.status === 'AVAILABLE')
            ? ctx.blocks.knowledge.content
            : [];

        // CASO 1: Fake Evidence Trigger
        if (problem.includes("fake evidence")) {
            evidenceList.push({
                id: "ev_fake",
                type: "KNOWLEDGE_DOCUMENT",
                provenanceSourceId: "doc_inventado_xyz",
                content: "El documento dice X",
                verificationStatus: "UNVERIFIED",
                reasoningConfidence: 0.9
            });
            hypotheses.push({
                id: "h_fake",
                description: "Hipótesis falsa",
                supportingEvidence: ["ev_fake"],
                contradictingEvidence: [],
                status: "GENERATED_HYPOTHESIS",
                reasoningConfidence: 0.9,
                uncertaintyFactors: []
            });
            return { evidenceList, hypotheses };
        }

        // CASO 2: Insufficient Information
        if (problem.includes("mi servidor falla")) {
            // El modelo propone inferencias pero no hay logs
            evidenceList.push({
                id: "ev_inf1",
                type: "INFERENCE",
                content: "Generalmente un fallo sin logs puede ser red o disco",
                verificationStatus: "UNVERIFIED",
                reasoningConfidence: 0.5
            });
            hypotheses.push({
                id: "h_red",
                description: "Fallo de red",
                supportingEvidence: ["ev_inf1"],
                contradictingEvidence: [],
                status: "GENERATED_HYPOTHESIS",
                reasoningConfidence: 0.5,
                uncertaintyFactors: ["No hay logs de red"]
            });
            hypotheses.push({
                id: "h_disco",
                description: "Disco lleno",
                supportingEvidence: ["ev_inf1"],
                contradictingEvidence: [],
                status: "GENERATED_HYPOTHESIS",
                reasoningConfidence: 0.5,
                uncertaintyFactors: ["No hay logs de disco"]
            });
            return { evidenceList, hypotheses };
        }

        // CASO 3: Supported Hypothesis con evidencia válida (incluyendo keyword "dns")
        if (problem.includes("dns")) {
            // Leer desde la ruta corregida del contexto
            const hasDNSDoc = knowledgeBlock.find(d => (d.title || d.content || '').toLowerCase().includes("dns"));
            if (hasDNSDoc) {
                evidenceList.push({
                    id: "ev_dns_real",
                    type: "KNOWLEDGE_DOCUMENT",
                    provenanceSourceId: hasDNSDoc.id,
                    content: hasDNSDoc.content,
                    verificationStatus: "LOCAL_STORE",
                    reasoningConfidence: 1.0
                });
                hypotheses.push({
                    id: "h_dns_supp",
                    description: "El problema es DNS y DNS traduce nombres a IPs",
                    supportingEvidence: ["ev_dns_real"],
                    contradictingEvidence: [],
                    status: "GENERATED_HYPOTHESIS",
                    reasoningConfidence: 0.9,
                    uncertaintyFactors: []
                });
            } else {
                hypotheses.push({
                    id: "h_dns_unsupp",
                    description: "Problema de DNS",
                    supportingEvidence: [],
                    contradictingEvidence: [],
                    status: "GENERATED_HYPOTHESIS",
                    reasoningConfidence: 0.4,
                    uncertaintyFactors: ["Falta documento de DNS"]
                });
            }
            return { evidenceList, hypotheses };
        }

        // CASO 4: Contradicted Hypothesis
        if (problem.includes("contradicción")) {
            // Leer desde la ruta corregida del contexto
            const docConflicto = knowledgeBlock.find(d => d.content && d.content.includes("10%"));
            if (docConflicto) {
                evidenceList.push({
                    id: "ev_contra",
                    type: "KNOWLEDGE_DOCUMENT",
                    provenanceSourceId: docConflicto.id,
                    content: docConflicto.content,
                    verificationStatus: "LOCAL_STORE",
                    reasoningConfidence: 1.0
                });
                hypotheses.push({
                    id: "h_contra",
                    description: "La merma es 5%",
                    supportingEvidence: [],
                    contradictingEvidence: ["ev_contra"],
                    status: "GENERATED_HYPOTHESIS",
                    reasoningConfidence: 0.2,
                    uncertaintyFactors: ["Choque con documento local"]
                });
            }
            return { evidenceList, hypotheses };
        }

        // CASO 5 (FASE 2 — NUEVO): Caso general con conocimiento disponible
        // Si el contexto tiene documentos de knowledge, construir evidencia real desde ellos.
        // Esto permite que cualquier pregunta se beneficie del conocimiento almacenado.
        if (knowledgeBlock.length > 0) {
            // Extraer keywords de la pregunta (tokenización básica, reutilizando lógica existente)
            const stopwords = new Set(['que','es','el','la','los','las','un','una','de','del','en',
                'y','o','a','al','por','para','como','con','qué','cómo','cuál','cuáles',
                'dónde','cuando','quien','quién','what','is','the','how','does','a','an','of']);
            const queryTokens = problem
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter(t => t.length > 2 && !stopwords.has(t));

            // Construir evidencia desde documentos relevantes recuperados
            for (let i = 0; i < knowledgeBlock.length; i++) {
                const doc = knowledgeBlock[i];
                const evId = `ev_km_${i}`;
                evidenceList.push({
                    id: evId,
                    type: "KNOWLEDGE_DOCUMENT",
                    provenanceSourceId: doc.id,
                    content: doc.content,
                    verificationStatus: "LOCAL_STORE",
                    reasoningConfidence: doc.confidence || 0.8
                });
                hypotheses.push({
                    id: `h_km_${i}`,
                    description: `Conocimiento relevante recuperado: ${doc.title || doc.id}`,
                    supportingEvidence: [evId],
                    contradictingEvidence: [],
                    status: "GENERATED_HYPOTHESIS",
                    reasoningConfidence: doc.confidence || 0.8,
                    uncertaintyFactors: queryTokens.length === 0 ? ["Consulta sin términos específicos"] : []
                });
            }
            return { evidenceList, hypotheses };
        }

        // Caso base: sin conocimiento disponible para esta pregunta
        return { evidenceList: [], hypotheses: [] };
    }

    /**
     * Evalúa las hipótesis contra el contexto inyectado
     */
    _evaluateEvidence(output, assembledContext) {
        // FASE 2 — CAMBIO 4: Leer knowledge desde blocks.knowledge.content (ruta correcta)
        // 1. Validar Anti-Hallucination: ProvenanceSourceId existe?
        const knowledgeContent = (assembledContext && assembledContext.blocks &&
            assembledContext.blocks.knowledge &&
            assembledContext.blocks.knowledge.status === 'AVAILABLE')
            ? assembledContext.blocks.knowledge.content
            : [];
        const availableKnowledgeIds = new Set(knowledgeContent.map(d => d.id));
        
        for (let ev of output.evidenceList) {
            if (ev.type !== "INFERENCE") {
                if (!ev.provenanceSourceId || !availableKnowledgeIds.has(ev.provenanceSourceId)) {
                    throw new Error(`Anti-Hallucination Triggered: Evidence \${ev.id} references non-existent provenanceSourceId \${ev.provenanceSourceId}`);
                }
            }
        }

        // 2. Transitar Hipótesis basadas en evidencia evaluada
        const evidenceMap = new Map();
        for (let ev of output.evidenceList) {
            evidenceMap.set(ev.id, ev);
        }

        for (let hyp of output.hypotheses) {
            let hasValidSupport = false;
            let hasValidContradiction = false;

            // Revisar soporte
            for (let evId of hyp.supportingEvidence) {
                const ev = evidenceMap.get(evId);
                // Inferencia no se convierte silenciosamente en external evidence
                if (ev && ev.type !== "INFERENCE") hasValidSupport = true;
            }

            // Revisar contradicción
            for (let evId of hyp.contradictingEvidence) {
                const ev = evidenceMap.get(evId);
                if (ev && ev.type !== "INFERENCE") hasValidContradiction = true;
            }

            if (hasValidContradiction) {
                hyp.status = "CONTRADICTED_HYPOTHESIS";
            } else if (hasValidSupport) {
                hyp.status = "SUPPORTED_HYPOTHESIS";
            } else {
                hyp.status = "UNSUPPORTED_HYPOTHESIS";
            }
        }
    }

    /**
     * Analiza incertidumbre y concluye
     */
    _draftConclusionsAndProposals(output, inputContext) {
        const supported = output.hypotheses.filter(h => h.status === "SUPPORTED_HYPOTHESIS");
        const unsupported = output.hypotheses.filter(h => h.status === "UNSUPPORTED_HYPOTHESIS");
        const contradicted = output.hypotheses.filter(h => h.status === "CONTRADICTED_HYPOTHESIS");
        
        const problem = inputContext.problemStatement.toLowerCase();

        // FASE 2 — CAMBIO 2: Leer knowledge desde la ruta correcta del contexto
        const ctx = inputContext.assembledContext;
        const knowledgeContent = (ctx && ctx.blocks && ctx.blocks.knowledge &&
            ctx.blocks.knowledge.status === 'AVAILABLE')
            ? ctx.blocks.knowledge.content
            : [];

        if (supported.length > 0) {
            output.uncertainty.level = "LOW";
            output.conclusion = "Existe evidencia local válida que apoya las hipótesis principales.";
            output.proposal = "Proceder con la acción basada en conocimiento.";
            
            // DNS sigue siendo informativo; el hardcode de governance=5 solo aplica
            // a herramientas destructivas reales. En FASE 2 no hay tools reales.
            output.authorizationRequirement = { required: false, governanceLevel: 0, reason: "Informativo" };

        } else if (contradicted.length > 0) {
            output.uncertainty.level = "HIGH";
            output.uncertainty.conflictingInformation = ["Hipótesis contradice conocimiento local."];
            output.conclusion = "El conocimiento interno presenta datos equivalentes pero contradictorios.";
            output.proposal = "Solicitar revisión humana del conflicto.";
            output.authorizationRequirement = { required: false, governanceLevel: 0, reason: "Reportar" };

        } else if (knowledgeContent.length === 0) {
            // FASE 2 — CAMBIO 2: Sin conocimiento disponible en absoluto
            // No bloquear con required=true; en su lugar indicar qué falta.
            // El provider construirá una respuesta honesta sobre la falta de información.
            output.uncertainty.level = "HIGH";
            output.uncertainty.missingInformation = [
                `No se encontraron documentos de conocimiento relevantes para: "${inputContext.problemStatement}"`
            ];
            output.conclusion = "No existe conocimiento almacenado relevante para esta consulta.";
            output.proposal = "El sistema no tiene información suficiente para responder esta pregunta. Se necesita ingresar conocimiento sobre el tema.";
            // IMPORTANTE: required=false permite que la respuesta llegue al provider,
            // que generará un mensaje honesto sobre la falta de información.
            output.authorizationRequirement = { required: false, governanceLevel: 0, reason: "Sin información" };

        } else {
            // Unsupported con algo de evidencia (hipótesis generadas pero no soportadas por docs reales)
            output.uncertainty.level = "CRITICAL";
            const missingTopics = unsupported.flatMap(h => h.uncertaintyFactors || []);
            output.uncertainty.missingInformation = missingTopics.length > 0
                ? missingTopics
                : ["Evidencia factual verificable"];
            output.conclusion = "No existe evidencia verificable suficiente para determinar la respuesta.";
            output.proposal = "Solicitar información adicional al usuario.";
            // FASE 2 — CAMBIO 2: governanceLevel=1 -> no bloquear (solo gov>=3 bloquea en ChatBridge)
            output.authorizationRequirement = { required: true, governanceLevel: 1, reason: "Información insuficiente" };
        }
    }

    /**
     * Ejecuta el pipeline completo de razonamiento.
     */
    async reason(inputContext) {
        const output = {
            reasoningId: this._generateReasoningId(),
            status: "RECEIVED",
            question: inputContext.problemStatement,
            hypotheses: [],
            evidenceList: [],
            analysis: "",
            uncertainty: {
                level: "UNKNOWN",
                missingInformation: [],
                conflictingInformation: []
            },
            conclusion: "",
            proposal: "",
            authorizationRequirement: { required: false, governanceLevel: 0, reason: "" },
            trace: []
        };

        try {
            this._transition(output, "CONTEXT_ASSEMBLY");
            if (!inputContext.assembledContext) throw new Error("Missing Context");

            this._transition(output, "HYPOTHESIS_GENERATION");
            const rawProposals = await this._mockAIProvider(inputContext);
            output.hypotheses = rawProposals.hypotheses;
            output.evidenceList = rawProposals.evidenceList;

            this._transition(output, "EVIDENCE_EVALUATION");
            this._evaluateEvidence(output, inputContext.assembledContext);

            this._transition(output, "UNCERTAINTY_ASSESSMENT");
            
            this._transition(output, "CONCLUSION_DRAFTING");
            this._transition(output, "PROPOSAL_DRAFTING");
            this._draftConclusionsAndProposals(output, inputContext);

            this._transition(output, "COMPLETED");

        } catch (e) {
            output.analysis = e.message;
            this._transition(output, "STRUCTURAL_ERROR");
        }

        return output;
    }
}

window.AI_CORE.ReasoningEngine = ReasoningEngine;
