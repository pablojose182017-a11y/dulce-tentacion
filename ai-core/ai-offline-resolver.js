window.AI_CORE = window.AI_CORE || {};

/**
 * OfflineResolver -- Guardian Step 1
 * ============================================================
 * Consulta el KnowledgeManager local y evalua si el conocimiento
 * existente es suficiente, fresco y relevante para responder una
 * tarea antes de considerar una busqueda web.
 *
 * Principios:
 *  - Local-first: nunca realiza peticiones de red.
 *  - Sin IA externa: toda evaluacion es determinista y local.
 *  - El conocimiento obsoleto no se descarta. Se devuelve con
 *    advertencia de frescura para que los modulos superiores decidan.
 *  - La evaluacion de cobertura usa normalizacion lexica y
 *    coincidencia de prefijo/sufijo para tolerar variaciones de redaccion.
 */
class OfflineResolver {

    /**
     * @param {KnowledgeManager} knowledgeManager
     * @param {Object} options
     * @param {number} options.freshnessMaxDays       - Dias maximos antes de considerar doc obsoleto (default: 30).
     * @param {number} options.coverageThreshold      - Ratio minimo de terminos cubiertos (default: 0.5).
     * @param {number} options.minResultsForSufficiency - Minimo de docs relevantes requeridos (default: 1).
     * @param {number} options.highConfidenceFloor    - Umbral de confidence para ignorar baja cobertura (default: 0.85).
     */
    constructor(knowledgeManager, options = {}) {
        if (!knowledgeManager || typeof knowledgeManager.search !== 'function') {
            throw new Error('OfflineResolver: Se requiere una instancia valida de KnowledgeManager.');
        }
        this._km = knowledgeManager;
        this._freshnessMaxDays = (typeof options.freshnessMaxDays === 'number' && options.freshnessMaxDays > 0)
            ? options.freshnessMaxDays : 30;
        this._coverageThreshold = (typeof options.coverageThreshold === 'number')
            ? Math.min(1, Math.max(0, options.coverageThreshold)) : 0.5;
        this._minResults = (typeof options.minResultsForSufficiency === 'number' && options.minResultsForSufficiency > 0)
            ? options.minResultsForSufficiency : 1;
        this._highConfidenceFloor = (typeof options.highConfidenceFloor === 'number')
            ? options.highConfidenceFloor : 0.85;
    }

    // -- Normalizacion y tokenizacion --

    _normalize(text) {
        if (!text || typeof text !== 'string') return [];
        const normalized = text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        const tokens = normalized
            .replace(/[?!.,;:"'()\[\]{}/_\\-]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 1);
        const stopwords = new Set([
            'el','la','los','las','un','una','unos','unas',
            'de','del','en','a','por','para','con','sin','sobre',
            'y','o','e','u','ni','pero','sino','porque','aunque',
            'que','como','quien','cual','cuales','donde','cuando',
            'este','esta','estos','estas','ese','esa','esos','esas',
            'mi','mis','tu','tus','su','sus','nuestro','nuestra',
            'es','son','fui','fue','fueron','ser','estar','soy','eres',
            'me','te','se','nos','le','les','lo',
            'explicame','dime','funciona','sistema','quiero','saber',
            'informacion','puede','hacer','tiene','hay','tengo',
            'necesito','ayuda','explica','describe','cuanto','cuanta'
        ]);
        return tokens.filter(t => !stopwords.has(t));
    }

    _stemVariants(token) {
        const variants = new Set([token]);
        const t = token;
        if (t.endsWith('es') && t.length > 4) variants.add(t.slice(0, -2));
        if (t.endsWith('s')  && t.length > 3) variants.add(t.slice(0, -1));
        if (t.endsWith('as') && t.length > 4) variants.add(t.slice(0, -2) + 'o');
        if (t.endsWith('a')  && t.length > 3) variants.add(t.slice(0, -1) + 'o');
        const suffixes = ['cion', 'sion', 'idad', 'mente', 'ando', 'iendo', 'ado', 'ido'];
        for (const suf of suffixes) {
            if (t.endsWith(suf) && t.length > suf.length + 3) {
                variants.add(t.slice(0, -suf.length));
            }
        }
        if (t.length >= 6) variants.add(t.slice(0, 4));
        return variants;
    }

    _tokensMatch(queryToken, docToken) {
        if (queryToken === docToken) return true;
        const qVariants = this._stemVariants(queryToken);
        const dVariants = this._stemVariants(docToken);
        for (const qv of qVariants) {
            if (dVariants.has(qv)) return true;
            for (const dv of dVariants) {
                if (qv.length >= 4 && dv.length >= 4 && qv.startsWith(dv.slice(0, 4))) return true;
            }
        }
        return false;
    }

    // -- Evaluacion de Frescura --

    _evaluateFreshness(doc) {
        const now = Date.now();
        const msPerDay = 86400000;
        const candidates = [
            { field: 'updatedAt', value: doc.updatedAt },
            { field: 'learnedAt', value: doc.learnedAt },
            { field: 'createdAt', value: doc.createdAt }
        ];
        for (const c of candidates) {
            if (c.value === null || c.value === undefined) continue;
            const ts = typeof c.value === 'number' ? c.value : new Date(c.value).getTime();
            if (!isNaN(ts)) {
                const ageInDays = Math.floor((now - ts) / msPerDay);
                return { fresh: ageInDays <= this._freshnessMaxDays, ageInDays, field: c.field };
            }
        }
        return { fresh: false, ageInDays: Infinity, field: 'none' };
    }

    // -- Evaluacion de Cobertura --

    _assessCoverage(task, searchResults) {
        const taskTokens = this._normalize(task);
        if (taskTokens.length === 0) return { coverage: 0, coveredTerms: [], uncoveredTerms: [] };
        if (searchResults.length === 0) return { coverage: 0, coveredTerms: [], uncoveredTerms: [...taskTokens] };

        const corpusTokens = new Set();
        for (const result of searchResults) {
            const doc = result.document;
            const fields = [doc.title, doc.content, doc.category, ...(doc.tags || [])];
            for (const field of fields) {
                for (const tok of this._normalize(field || '')) {
                    corpusTokens.add(tok);
                }
            }
        }

        const coveredTerms = [];
        const uncoveredTerms = [];
        for (const qt of taskTokens) {
            let matched = false;
            for (const ct of corpusTokens) {
                if (this._tokensMatch(qt, ct)) { matched = true; break; }
            }
            if (matched) coveredTerms.push(qt); else uncoveredTerms.push(qt);
        }
        const coverage = coveredTerms.length / taskTokens.length;
        return { coverage, coveredTerms, uncoveredTerms };
    }

    // -- API Publica --

    async query(task) {
        if (!task || typeof task !== 'string' || task.trim().length === 0) {
            return this._buildResolution({
                status: 'INSUFFICIENT', task: task || '', results: [], staleDocs: [],
                coverage: 0, coveredTerms: [], uncoveredTerms: [],
                offlineCapable: false, freshnessWarnings: [],
                explanation: 'La tarea esta vacia o es invalida.'
            });
        }
        const normalizedTask = task.trim();

        let searchResults = [];
        try {
            searchResults = await this._km.search(normalizedTask);
        } catch (err) {
            return this._buildResolution({
                status: 'INSUFFICIENT', task: normalizedTask, results: [], staleDocs: [],
                coverage: 0, coveredTerms: [], uncoveredTerms: this._normalize(normalizedTask),
                offlineCapable: false, freshnessWarnings: [],
                explanation: 'Error al consultar el KnowledgeManager: ' + err.message
            });
        }

        const freshResults = [];
        const staleResults = [];
        const freshnessWarnings = [];

        for (const result of searchResults) {
            const freshness = this._evaluateFreshness(result.document);
            const enriched = Object.assign({}, result, { freshness });
            if (freshness.fresh) {
                freshResults.push(enriched);
            } else {
                staleResults.push(enriched);
                freshnessWarnings.push({
                    docId: result.document.id,
                    docTitle: result.document.title,
                    ageInDays: freshness.ageInDays,
                    field: freshness.field,
                    warning: freshness.ageInDays === Infinity
                        ? 'Sin fecha conocida -- se asume desactualizado.'
                        : 'Documento actualizado hace ' + freshness.ageInDays + ' dias (umbral: ' + this._freshnessMaxDays + ' dias).'
                });
            }
        }

        const freshCoverage = this._assessCoverage(normalizedTask, freshResults);
        const totalCoverage = this._assessCoverage(normalizedTask, searchResults);

        const hasSufficientFreshDocs = freshResults.length >= this._minResults;
        const hasSufficientCoverage  = freshCoverage.coverage >= this._coverageThreshold;
        const hasHighConfidenceDoc   = freshResults.some(r => (r.document.confidence || 0) >= this._highConfidenceFloor);

        let status, offlineCapable, explanation;

        if (hasSufficientFreshDocs && (hasSufficientCoverage || hasHighConfidenceDoc)) {
            status = 'SUFFICIENT';
            offlineCapable = true;
            explanation = freshResults.length + ' documento(s) fresco(s) con cobertura '
                + (freshCoverage.coverage * 100).toFixed(0) + '%. Se puede responder sin conexion.';
        } else if (staleResults.length > 0 && totalCoverage.coverage >= this._coverageThreshold) {
            status = 'STALE_BUT_AVAILABLE';
            offlineCapable = true;
            explanation = 'Conocimiento disponible pero desactualizado (' + staleResults.length + ' doc(s) obsoleto(s)). '
                + 'Se incluye en los resultados con advertencia de frescura. '
                + 'Cobertura total: ' + (totalCoverage.coverage * 100).toFixed(0) + '%.';
        } else {
            status = 'INSUFFICIENT';
            offlineCapable = false;
            const reason = searchResults.length === 0
                ? 'No se encontraron documentos relevantes en la base de conocimiento local.'
                : 'Documentos encontrados: ' + searchResults.length + ', pero cobertura insuficiente (' + (freshCoverage.coverage * 100).toFixed(0) + '%).';
            explanation = reason + ' Terminos sin cubrir: [' + freshCoverage.uncoveredTerms.join(', ') + '].';
        }

        const useTotal = status === 'STALE_BUT_AVAILABLE';
        return this._buildResolution({
            status,
            task: normalizedTask,
            results: freshResults,
            staleDocs: staleResults,
            coverage: useTotal ? totalCoverage.coverage : freshCoverage.coverage,
            coveredTerms: useTotal ? totalCoverage.coveredTerms : freshCoverage.coveredTerms,
            uncoveredTerms: useTotal ? totalCoverage.uncoveredTerms : freshCoverage.uncoveredTerms,
            offlineCapable,
            freshnessWarnings,
            explanation
        });
    }

    _buildResolution({ status, task, results, staleDocs, coverage, coveredTerms, uncoveredTerms, offlineCapable, freshnessWarnings, explanation }) {
        return Object.freeze({
            status,
            task,
            results,
            staleDocs,
            coverage,
            coveredTerms,
            uncoveredTerms,
            offlineCapable,
            freshnessWarnings,
            explanation,
            resolvedAt: new Date().toISOString()
        });
    }
}

window.AI_CORE.OfflineResolver = OfflineResolver;