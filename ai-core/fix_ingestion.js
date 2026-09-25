const fs = require('fs');

let ing = fs.readFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-ingestion.js', 'utf8');

// 1. Generate Deterministic ID
const genIdMethod = `
    _generateDeterministicId(proposal, source) {
        const clean = str => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const titlePart = clean(proposal.extractedFields.title).substring(0, 20);
        const catPart = clean(proposal.extractedFields.category);
        const sourcePart = clean(source.split("://")[0]);
        return \`kdoc_\${titlePart}_\${catPart}_\${sourcePart}\`;
    }
`;
if (!ing.includes('_generateDeterministicId')) {
    ing = ing.replace('async _checkConflicts(proposal', genIdMethod + '\n    async _checkConflicts(proposal');
}

// 2. Change Conflict Check to handle idempotency
const newConflictCheck = `
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
        const conflicts = results.filter(r => r.matchRatio >= 0.5).map(c => c.document ? c.document.id : c);
        
        if (conflicts.length > 0) {
            return { action: 'conflict', conflicts: conflicts };
        }
        
        return { action: 'proceed', conflicts: [] };
    }
`;
ing = ing.replace(/async _checkConflicts\(proposal\) \{[\s\S]*?return conflicts\.map[\s\S]*?\}/m, newConflictCheck);

// 3. Update ingest to use new conflict check and ID
const ingestConflictLogic = `
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
`;
ing = ing.replace(/\/\/ 3\. CONFLICT_EVALUATION[\s\S]*?\/\/ 4\. ROUTING & FINALIZATION/m, ingestConflictLogic + '\n            // 4. ROUTING & FINALIZATION');

// 4. Update routeToKnowledge
const newRoute = `
    async _routeToKnowledge(job) {
        const proposal = job.proposal;
        const documentId = job.documentId;
        
        const doc = {
            id: documentId,
            title: proposal.extractedFields.title,
            content: proposal.coreKnowledge,
            category: proposal.extractedFields.category,
            tags: [...proposal.extractedFields.tags, \`jobId:\${job.jobId}\`],
            source: job.source,
            // NOTA IMPORTANTE: confidence representa la confianza en la extracción
            // y la procedencia, NO representa una garantía de verdad factual universal.
            confidence: 1.0, 
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await this.knowledgeManager.add(doc);
    }
`;
ing = ing.replace(/async _routeToKnowledge\(job\) \{[\s\S]*?job\.documentId = documentId;\s*\}/m, newRoute);

fs.writeFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-ingestion.js', ing);

// Update tests
let tests = fs.readFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-tests.js', 'utf8');

const additionalTests = `
        // 15. Ingesta idéntica repetida (Idempotencia)
        const job_idem = await engine.ingest("Aprende esto sobre DNS: traduce dominios a IP", source, identity);
        assert(job_idem.status === "STORED", "Una segunda ingestión del mismo conocimiento produce STORED (Idempotent)");
        assert(job_idem.documentId === job1.documentId, "Ambas ingestas idénticas producen exactamente el mismo documentId determinista");
        assert(job_idem.jobId !== job1.jobId, "jobId es diferente entre ambas ejecuciones pero documentId es el mismo");
        
        // 16. Ingesta con mismo documentId pero diferente contenido (Colisión)
        const job_col = await engine.ingest("Aprende esto sobre DNS: traduce IPs", source, identity);
        // Note: the mock parser generates the exact same title ("Concepto: dns") for this query, leading to the same documentId.
        assert(job_col.status === "RESOLUTION_REQUIRED", "Si existe el mismo documentId pero distinto contenido, detiene en RESOLUTION_REQUIRED");
        assert(job_col.conflicts.includes(job1.documentId), "El conflicto lista el documentId de la colisión");
        
        // Check that random/date aren't in documentId
        assert(!job1.documentId.includes(new Date().getFullYear().toString()), "documentId no incluye fecha");
        assert(job1.documentId === "kdoc_conceptodns_it_userinput", "El documentId es determinista basado en texto, no valores aleatorios");
`;

// Remove the old job7 test as it used to do something similar and add our new tests
tests = tests.replace(/\/\/ 13 y 14\. Conflicto produce[\s\S]*?\/\/ Limpiar/m, `// 13 y 14. Conflicto produce RESOLUTION_REQUIRED conservando lo anterior
        const job7 = await engine.ingest("Aprende esto sobre DNS: es otra cosa diferente", "file://other", identity);
        assert(job7.status === "RESOLUTION_REQUIRED", "Un posible conflicto detiene el flujo en RESOLUTION_REQUIRED");
        assert(job7.conflicts && job7.conflicts.length > 0, "Se detectaron y listaron los documentos en conflicto");
        const docOriginal = await km.get(job1.documentId);
        assert(docOriginal !== null && docOriginal.content.includes("traduce dominios a IP"), "El conocimiento anterior permanece intacto ante conflicto");

${additionalTests}
        
        // Limpiar`);

fs.writeFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-tests.js', tests);
console.log('Fixed ai-ingestion and tests for deterministic ID and idempotency.');
