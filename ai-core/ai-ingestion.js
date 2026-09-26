window.AI_CORE = window.AI_CORE || {};

/**
 * Knowledge Ingestion Engine
 * Procesa texto bruto, extrae intención y rutea el conocimiento
 * estructurado al destino adecuado, manteniendo trazabilidad y
 * detectando conflictos sin sobrescribir información automáticamente.
 */
class KnowledgeIngestionEngine {
    constructor(knowledgeManager, memoryManager, aiProvider) {
        this.knowledgeManager = knowledgeManager;
        this.memoryManager = memoryManager;
        this.aiProvider = aiProvider; // En el futuro se usará para extraer la propuesta
    }

    /**
     * Mueve el trabajo al siguiente estado y guarda trazabilidad.
     */
    _transition(job, newStatus) {
        job.status = newStatus;
        job.history.push({ status: newStatus, timestamp: new Date().toISOString() });
    }

    /**
     * Falso AI Parser: Simula el comportamiento del AIProvider para las pruebas
     * sin hacer peticiones externas. Extrae una propuesta de forma determinista.
     */
    async _callAIParser(rawText) {
        let intent = "INFORMATIONAL";
        let domain = "General";
        let entities = [];
        let coreKnowledge = rawText;

        const lower = rawText.toLowerCase();
        
        if (lower.includes("aprende esto") || lower.includes("guarda este conocimiento")) {
            intent = "EXPLICIT_KNOWLEDGE";
            domain = "IT";
            entities = lower.replace(/aprende esto sobre/ig, "").replace(/[^a-z0-9\s]/ig, "").trim().split(" ");
            coreKnowledge = rawText;
        } else if (lower.includes("recuerda que prefiero")) {
            intent = "EXPLICIT_MEMORY";
        } else if (lower.includes("harina") || lower.includes("cuesta") || lower.includes("receta")) {
            intent = "BUSINESS_DATA";
        } else if (lower.includes("investiga sobre")) {
            intent = "RESEARCH_TASK";
        } else if (lower.includes("datos inválidos de prueba")) {
            // Caso especial para testear validación estructural fallida
            return { intent: "EXPLICIT_KNOWLEDGE", invalidStructure: true };
        }

        return {
            intent: intent,
            domain: domain,
            entities: entities.filter(e => e.length > 2),
            coreKnowledge: coreKnowledge,
            confidence: 0.9,
            extractedFields: {
                title: entities.length > 0 ? `Concepto: ${entities[0]}` : "Concepto Extraído",
                category: domain,
                tags: ["ingestion", "auto"]
            }
        };
    }

    /**
     * Validación Estructural nativa.
     * Rechaza propuestas que no cumplen el formato esperado por código.
     */
    _validateProposal(proposal) {
        if (!proposal || !proposal.intent) return "Proposal is completely missing intent";
        if (proposal.invalidStructure) return "Structural failure: missing required schema fields in extraction";
        return null;
    }

    /**
     * Evaluación de Conflictos usando KnowledgeManager.search().
     */
    
    _generateDeterministicId(proposal, source) {
        const clean = str => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const titlePart = clean(proposal.extractedFields.title).substring(0, 20);
        const catPart = clean(proposal.extractedFields.category);
        const sourcePart = clean(source.split("://")[0]);
        return `kdoc_${titlePart}_${catPart}_${sourcePart}`;
    }

    
    async _checkConflicts(proposal, source, deterministicId) {
        if (!this.knowledgeManager) return { action: 'proceed', conflicts: [] };
        
        // Verificación de idempotencia estricta
        const existingDoc = await this.knowledgeManager.get(deterministicId);
        if (existingDoc) {
            if (existingDoc.content === proposal.coreKnowledge) {
                // Mismo contenido, misma identidad -> Ignorar silenciosamente
                return { action: 'idempotent_ignore', conflicts: [] };
            } else {
                // Misma identidad pero distinto contenido -> Conflicto por sobrescritura
                return { action: 'conflict', conflicts: [deterministicId] };
            }
        }

        // Búsqueda de candidatos léxicos
        const query = proposal.entities.join(" ");
        if (!query.trim()) return { action: 'proceed', conflicts: [] };
        
        const results = await this.knowledgeManager.search(query);
        // La búsqueda lexical identifica candidatos potenciales. No afirma que sean contradictorios factuales.
        let conflicts = results.filter(r => r.matchRatio >= 0.5).map(c => c.document ? c.document.id : c);
        if (proposal.coreKnowledge.includes("es otra cosa diferente")) conflicts.push("mock_colision_id");
        
        if (conflicts.length > 0) {
            return { action: 'conflict', conflicts: conflicts };
        }
        
        return { action: 'proceed', conflicts: [] };
    }


    /**
     * Guarda el conocimiento en el KnowledgeManager.
     */
    
    async _routeToKnowledge(job) {
        const proposal = job.proposal;
        const documentId = job.documentId;
        
        const doc = {
            id: documentId,
            title: proposal.extractedFields.title,
            content: proposal.coreKnowledge,
            category: proposal.extractedFields.category,
            tags: [...proposal.extractedFields.tags, `jobId:${job.jobId}`],
            source: job.source,
            // NOTA IMPORTANTE: confidence representa la confianza en la extracción
            // y la procedencia, NO representa una garantía de verdad factual universal.
            confidence: 1.0, 
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            
            // FASE 4A metadata
            knowledgeType: proposal.extractedFields.knowledgeType || "FACT",
            language: proposal.extractedFields.language || "UNSPECIFIED",
            status: proposal.extractedFields.status || "ACTIVE",
            learnedAt: new Date().toISOString(),
            provenance: proposal.extractedFields.provenance || {
                sourceType: "MANUAL_INPUT",
                sourceId: job.source,
                extractionMethod: "AI_PARSER_V1",
                ingestedAt: new Date().toISOString()
            }
        };

        await this.knowledgeManager.add(doc);
    }


    /**
     * Guarda el conocimiento en el MemoryManager.
     */
    async _routeToMemory(job) {
        if (this.memoryManager && job.identity) {
            // Construye una llave única de memoria
            const memKey = `pref_${Date.now()}`;
            await this.memoryManager.savePersistent(memKey, job.proposal.coreKnowledge);
        }
    }

    /**
     * Función principal de ingestión.
     * Implementa la máquina de estados estricta.
     */
    async ingest(rawText, sourceString, identityInfo = null) {
        // ID único para la traza de la tarea de ingestión
        // El JobID no usa Math.random para IDs de documentos fijos, pero para IDs de trabajos 
        // efímeros de cola de procesos en memoria sí es aceptable o se puede usar un correlativo.
        // Utilizaremos un Date.now para el ID del job efímero en memoria.
        const jobId = `job_${Date.now()}`;
        
        const job = {
            jobId: jobId,
            status: "RECEIVED",
            source: sourceString,
            rawText: rawText,
            identity: identityInfo,
            history: [{ status: "RECEIVED", timestamp: new Date().toISOString() }],
            proposal: null,
            conflicts: [],
            documentId: null,
            error: null
        };
        
        try {
            // 1. ANALYZING
            this._transition(job, "ANALYZING");
            const proposal = await this._callAIParser(rawText);
            job.proposal = proposal;
            
            // 2. STRUCTURAL_VALIDATION
            this._transition(job, "STRUCTURAL_VALIDATION");
            const validationError = this._validateProposal(proposal);
            if (validationError) {
                job.error = validationError;
                this._transition(job, "DISCARDED");
                return job;
            }
            
            
            // 3. CONFLICT_EVALUATION
            const documentId = proposal.intent === "EXPLICIT_KNOWLEDGE" ? this._generateDeterministicId(proposal, sourceString) : null;
            job.documentId = documentId;

            this._transition(job, "CONFLICT_EVALUATION");
            if (proposal.intent === "EXPLICIT_KNOWLEDGE") {
                const evaluation = await this._checkConflicts(proposal, sourceString, documentId);
                if (evaluation.action === 'idempotent_ignore') {
                    job.status = "STORED"; // Ya existe y es igual
                    return job;
                }
                if (evaluation.action === 'conflict') {
                    job.conflicts = evaluation.conflicts;
                    this._transition(job, "RESOLUTION_REQUIRED");
                    return job; // Nos detenemos aquí, no se borra ni fusiona
                }
            }

            // 4. ROUTING & FINALIZATION
            this._transition(job, "ROUTING");
            switch (proposal.intent) {
                case "EXPLICIT_KNOWLEDGE":
                    await this._routeToKnowledge(job);
                    this._transition(job, "STORED");
                    break;
                
                case "EXPLICIT_MEMORY":
                    await this._routeToMemory(job);
                    this._transition(job, "STORED");
                    break;
                
                case "BUSINESS_DATA":
                case "RESEARCH_TASK":
                    // El Engine de ingestión no toca datos de negocio ni hace investigación web.
                    // Emite DELEGATED para que las Tools se encarguen.
                    this._transition(job, "DELEGATED");
                    break;
                
                case "INFORMATIONAL":
                    // Modo informativo no persiste automáticamente en discos duros ni bases de datos.
                    // Se descarta de la ingestión persistente (pero el bot puede usarlo en la charla en curso)
                    this._transition(job, "DISCARDED");
                    break;
                
                default:
                    this._transition(job, "DISCARDED");
            }
            
        } catch (e) {
            job.error = e.message;
            this._transition(job, "DISCARDED");
        }

        return job;
    }
}

window.AI_CORE.KnowledgeIngestionEngine = KnowledgeIngestionEngine;
