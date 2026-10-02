window.AI_CORE = window.AI_CORE || {};

class LanguageUnderstandingEngine {
    constructor() {
        this.stopWords = new Set(['el','la','los','las','que','de','en','un','una','me','mi','por','para','con','su','sus','al','del','es','son','hay','a']);
        this.correctionsKey = 'guardian_nlu_corrections';
        this.learnedCorrections = JSON.parse(localStorage.getItem(this.correctionsKey)) || {};
        
        // Define dictionaries for intents
        this.dictionaries = {
            SOCIAL_GREETING: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'saludos', 'hey'],
            SOCIAL_QUESTION: ['como estas', 'como te va', 'que tal', 'todo bien', 'como andamos'],
            SOCIAL_THANKS: ['gracias', 'muchas gracias', 'te lo agradezco', 'mil gracias'],
            SOCIAL_FAREWELL: ['adios', 'hasta luego', 'nos vemos', 'chao', 'hasta pronto', 'bye'],
            KNOWLEDGE_SHARING: ['compartir conocimiento', 'enseñarte algo', 'guarda esta informacion', 'guarda esta info', 'aprende esto'],
            HELP_REQUEST: ['necesito ayuda', 'ayudame', 'auxilio', 'dame una mano', 'ayuda', 'apoyame'],
            FINANCIAL_COST: ['cuanto cuesta', 'costo de', 'costo produccion', 'cuanto vale', 'precio de', 'precio'],
            FINANCIAL_MARGIN: ['margen', 'rentabilidad', 'ganancia', 'porcentaje'],
            FINANCIAL_INGREDIENTS: ['ingredientes', 'receta', 'insumos', 'que lleva', 'que contiene'],
            FINANCIAL_LOSS: ['perdida', 'perder', 'por debajo', 'poca ganancia'],
            ANALYSIS_REQUEST: ['analiza', 'compara', 'revisa', 'evalua', 'analizar'],
            RESEARCH_REQUEST: ['investiga', 'research', 'busca informacion', 'averigua', 'busca en internet', 'buscalo en internet', 'indaga', 'busca', 'buscalo'],
            USER_COMPLAINT: ['no me respondes', 'no entiendes', 'por que no respondes', 'que te pasa', 'estas mal', 'responde bien', 'no sabes', 'error', 'que necesitas', 'por que preguntas'],
            AUTHORIZATION_GRANTED: ['si', 'autorizado', 'procede', 'adelante', 'hazlo', 'de acuerdo', 'claro', 'por supuesto', 'dale'],
            AUTHORIZATION_DENIED: ['no', 'denegado', 'cancela', 'no lo hagas', 'detente', 'espera', 'omite', 'ignora']
        };
    }

    // Levenshtein distance calculation
    _levenshtein(a, b) {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }
        return matrix[b.length][a.length];
    }

    _isSimilar(word, target, maxDistance = 1) {
        if (Math.abs(word.length - target.length) > maxDistance) return false;
        return this._levenshtein(word, target) <= maxDistance;
    }

    _containsPhrase(normalizedText, phrases, maxDistancePerWord = 1) {
        for (const phrase of phrases) {
            const exactRegex = new RegExp(`\\b${phrase}\\b`, 'i');
            if (exactRegex.test(normalizedText)) return true; // exact word match
            
            const phraseWords = phrase.split(' ');
            const textWords = normalizedText.split(' ');
            
            for (let i = 0; i <= textWords.length - phraseWords.length; i++) {
                let match = true;
                for (let j = 0; j < phraseWords.length; j++) {
                    const tw = textWords[i + j];
                    const pw = phraseWords[j];
                    let allowedDist = 0;
                    if (pw.length > 5) allowedDist = 2;
                    else if (pw.length >= 4) allowedDist = maxDistancePerWord;
                    if (!this._isSimilar(tw, pw, allowedDist)) {
                        match = false;
                        break;
                    }
                }
                if (match) return true;
            }
        }
        return false;
    }

    _correctTypos(normalizedText) {
        const textWords = normalizedText.split(' ');
        const knownWords = new Set();
        for (const list of Object.values(this.dictionaries)) {
            for (const phrase of list) {
                for (const w of phrase.split(' ')) {
                    if (w.length > 3) knownWords.add(w);
                }
            }
        }
        
        for (let i = 0; i < textWords.length; i++) {
            const tw = textWords[i];
            if (tw.length <= 3) continue;
            if (knownWords.has(tw)) continue;
            
            for (const kw of knownWords) {
                const allowedDist = 1;
                if (this._isSimilar(tw, kw, allowedDist)) {
                    textWords[i] = kw;
                    break;
                }
            }
        }
        return textWords.join(' ');
    }

    _normalize(text) {
        let normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        // colloquial normalization
        normalized = normalized.replace(/\bq\b/g, 'que').replace(/\bxq\b/g, 'porque').replace(/\bpa\b/g, 'para');
        
        for (const [wrong, right] of Object.entries(this.learnedCorrections)) {
            const regex = new RegExp(`\\b${wrong}\\b`, 'g');
            normalized = normalized.replace(regex, right);
        }
        
        return this._correctTypos(normalized);
    }

    _extractTokens(normalized) {
        return normalized.replace(/[^a-z0-9\s]/g, ' ')
                         .split(/\s+/)
                         .filter(t => t.length > 2 && !this.stopWords.has(t));
    }

    learnCorrection(wrongWord, correctWord) {
        this.learnedCorrections[wrongWord] = correctWord;
        localStorage.setItem(this.correctionsKey, JSON.stringify(this.learnedCorrections));
    }

    analyze(text, conversationContext = []) {
        const normalized = this._normalize(text);
        const tokens = this._extractTokens(normalized);
        const interpretation = {
            originalText: text,
            normalizedText: normalized,
            intent: "UNKNOWN_FACTUAL",
            topic: "",
            confidence: 0.0,
            entities: tokens,
            missingInformation: [],
            ambiguity: [],
            isClarificationNeeded: false
        };

        const isShortResponse = tokens.length <= 2;
        let lastIntent = null;
        let lastClarification = null;
        
        if (conversationContext && conversationContext.length > 0) {
            const lastMsg = conversationContext[conversationContext.length - 1];
            if (lastMsg && lastMsg.metadata) {
                lastIntent = lastMsg.metadata.intent;
                if (lastMsg.metadata.isClarification) {
                    lastClarification = lastMsg.metadata.pendingIntent;
                }
            }
        }

        // Handle user correction explicitly
        if (/^(perdon|disculpa|quise decir|corrijo)/.test(normalized) && normalized.includes('quise decir')) {
            const match = normalized.match(/quise decir\s+([a-z\s]+)/);
            if (match) {
                interpretation.intent = "CORRECTION";
                interpretation.topic = match[1].trim();
                interpretation.confidence = 0.95;
                return interpretation;
            }
        }

        if (lastClarification && isShortResponse && !this._containsPhrase(normalized, this.dictionaries.SOCIAL_GREETING)) {
            interpretation.intent = lastClarification;
            interpretation.topic = tokens.join(' ');
            interpretation.confidence = 0.9;
            return interpretation;
        }

        if (this._containsPhrase(normalized, this.dictionaries.SOCIAL_GREETING)) {
            interpretation.intent = "SOCIAL_GREETING";
            interpretation.confidence = 0.95;
            return interpretation;
        }
        
        if (this._containsPhrase(normalized, this.dictionaries.AUTHORIZATION_GRANTED)) {
            interpretation.intent = "AUTHORIZATION_GRANTED";
            interpretation.confidence = 0.9;
            return interpretation;
        }
        if (this._containsPhrase(normalized, this.dictionaries.AUTHORIZATION_DENIED)) {
            interpretation.intent = "AUTHORIZATION_DENIED";
            interpretation.confidence = 0.9;
            return interpretation;
        }
        if (this._containsPhrase(normalized, this.dictionaries.SOCIAL_QUESTION)) {
            interpretation.intent = "SOCIAL_QUESTION";
            interpretation.confidence = 0.95;
            return interpretation;
        }
        if (this._containsPhrase(normalized, this.dictionaries.SOCIAL_THANKS)) {
            interpretation.intent = "SOCIAL_THANKS";
            interpretation.confidence = 0.95;
            return interpretation;
        }
        if (this._containsPhrase(normalized, this.dictionaries.SOCIAL_FAREWELL)) {
            interpretation.intent = "SOCIAL_FAREWELL";
            interpretation.confidence = 0.95;
            return interpretation;
        }

        if (this._containsPhrase(normalized, this.dictionaries.USER_COMPLAINT) || normalized.includes('porque no me respondes') || normalized.includes('que necesitas')) {
            interpretation.intent = "USER_COMPLAINT";
            interpretation.confidence = 0.95;
            return interpretation;
        }

        if (this._containsPhrase(normalized, this.dictionaries.HELP_REQUEST)) {
            interpretation.intent = "HELP_REQUEST";
            interpretation.confidence = 0.9;
            if (tokens.length <= 1 || (tokens.length === 2 && /necesito|ayuda|ayudame/.test(tokens[0]))) {
                interpretation.confidence = 0.5;
                interpretation.isClarificationNeeded = true;
                interpretation.ambiguity.push("no sé en qué necesitas ayuda");
                interpretation.missingInformation.push("el tema en el que te puedo ayudar");
            } else {
                interpretation.topic = tokens.filter(t => !/necesito|ayuda|ayudame|auxilio|apoyame|mano/.test(t)).join(' ');
            }
            return interpretation;
        }

        if (this._containsPhrase(normalized, this.dictionaries.KNOWLEDGE_SHARING)) {
            interpretation.intent = "KNOWLEDGE_SHARING";
            interpretation.confidence = 0.9;
            return interpretation;
        }

        if (this._containsPhrase(normalized, this.dictionaries.RESEARCH_REQUEST)) {
            interpretation.intent = "RESEARCH_REQUEST";
            const researchStops = new Set([...this.dictionaries.RESEARCH_REQUEST.flatMap(p => p.split(' ')), 'sobre']);
            interpretation.topic = tokens.filter(t => !researchStops.has(t) && !/necesito|ayuda|ayudame|auxilio|quiero|alludes|ayudes/.test(t)).join(' ');
            interpretation.confidence = 0.85;

            if (interpretation.topic.trim() === '') {
                interpretation.confidence = 0.3;
                interpretation.ambiguity.push("el objetivo de búsqueda está vacío");
                interpretation.missingInformation.push("qué tema específico necesitas que investigue");
                interpretation.isClarificationNeeded = true;
            }
            return interpretation;
        }

        const esCosto   = this._containsPhrase(normalized, this.dictionaries.FINANCIAL_COST);
        const esMargen  = this._containsPhrase(normalized, this.dictionaries.FINANCIAL_MARGIN);
        const esIngred  = this._containsPhrase(normalized, this.dictionaries.FINANCIAL_INGREDIENTS);
        const esPerdida = this._containsPhrase(normalized, this.dictionaries.FINANCIAL_LOSS);
        
        if (esCosto || esMargen || esIngred || esPerdida) {
            interpretation.intent = "FINANCIAL_QUERY";
            const financeStops = new Set([...this.dictionaries.FINANCIAL_COST, ...this.dictionaries.FINANCIAL_MARGIN, ...this.dictionaries.FINANCIAL_INGREDIENTS, ...this.dictionaries.FINANCIAL_LOSS].flatMap(p => p.split(' ')));
            interpretation.topic = tokens.filter(t => !financeStops.has(t)).join(' ');
            interpretation.confidence = 0.9;
            
            if (interpretation.topic.trim() === '' && tokens.length <= 3 && !esPerdida) {
                interpretation.confidence = 0.4;
                interpretation.ambiguity.push("no se menciona el producto objetivo");
                interpretation.missingInformation.push("el nombre del producto o insumo");
                interpretation.isClarificationNeeded = true;
            }
            return interpretation;
        }

        if (this._containsPhrase(normalized, this.dictionaries.ANALYSIS_REQUEST)) {
            interpretation.intent = "ANALYSIS_REQUEST";
            const analysisStops = new Set(this.dictionaries.ANALYSIS_REQUEST);
            interpretation.topic = tokens.filter(t => !analysisStops.has(t) && t !== 'algo' && !/necesito|ayuda|ayudame|auxilio|alludes|ayudes|quiero|podrias/.test(t)).join(' ');
            interpretation.confidence = 0.85;
            
            if (interpretation.topic.trim() === '') {
                interpretation.isClarificationNeeded = true;
                interpretation.ambiguity.push("falta contexto de análisis");
                interpretation.missingInformation.push("qué situación o datos debo analizar");
            }
            return interpretation;
        }

        if (isShortResponse && lastIntent && !lastClarification) {
            interpretation.intent = lastIntent; 
            interpretation.confidence = 0.6;
            interpretation.topic = tokens.join(' ');
            return interpretation;
        }

        const isQuestion = normalized.includes('?') || this._containsPhrase(normalized, ['cual', 'como', 'donde', 'cuando', 'quien', 'porque', 'por que', 'que es', 'que son', 'que significa', 'que hace']);
        
        if (isQuestion) {
            interpretation.intent = "FACTUAL_QUESTION";
            interpretation.confidence = 0.8;
            interpretation.topic = tokens.join(' ');
        } else {
            interpretation.intent = "UNKNOWN_STATEMENT";
            interpretation.confidence = 0.4;
            interpretation.isClarificationNeeded = true;
            interpretation.ambiguity.push("no logro identificar la intención exacta de tu mensaje");
            interpretation.missingInformation.push("si deseas que analice datos, calcule costos, o investigue un tema");
            interpretation.topic = tokens.join(' ');
        }
        
        if (tokens.length <= 1 && interpretation.intent === "UNKNOWN_STATEMENT") {
            interpretation.ambiguity.push("el mensaje es demasiado corto y ambiguo aisladamente");
        }

        return interpretation;
    }

    generateClarificationMessage(interpretation) {
        if (interpretation.intent === "ANALYSIS_REQUEST" && interpretation.topic === "") {
            return "Creo que necesitas ayuda para analizar algo, pero todavía no sé qué tema. ¿Qué quieres que revisemos?";
        }
        
        const missing = interpretation.missingInformation[0] || 'más detalles';
        const ambiguo = interpretation.ambiguity[0] || 'la solicitud no es clara';
        return `[CLARIFICACIÓN] Necesito un poco de ayuda para entenderte bien. Detecté que ${ambiguo}. ¿Podrías indicarme ${missing}?`;
    }
}

window.AI_CORE.LanguageUnderstandingEngine = LanguageUnderstandingEngine;
