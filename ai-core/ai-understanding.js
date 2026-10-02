window.AI_CORE = window.AI_CORE || {};

class LanguageUnderstandingEngine {
    constructor() {
        this.stopWords = new Set(['el','la','los','las','que','de','en','un','una','me','mi','por','para','con','su','sus','al','del','es','son','hay']);
    }

    _normalize(text) {
        return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    _extractTokens(normalized) {
        return normalized.replace(/[^a-z0-9\s]/g, ' ')
                         .split(/\s+/)
                         .filter(t => t.length > 2 && !this.stopWords.has(t));
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

        // 1. Social / Conversational Intents
        if (/^(hola|buenas|buenos dias|buenas tardes|buenas noches|que tal|saludos|hey)[\s]*$/.test(normalized)) {
            interpretation.intent = "SOCIAL_GREETING";
            interpretation.confidence = 0.95;
            return interpretation;
        }
        if (/^(como estas|como te va|que tal estas|todo bien|como andamos)/.test(normalized) || normalized.includes('como estas')) {
            interpretation.intent = "SOCIAL_QUESTION";
            interpretation.confidence = 0.95;
            return interpretation;
        }
        if (/^(gracias|muchas gracias|te lo agradezco|mil gracias)/.test(normalized) || normalized === 'gracias') {
            interpretation.intent = "SOCIAL_THANKS";
            interpretation.confidence = 0.95;
            return interpretation;
        }
        if (/^(adios|hasta luego|nos vemos|chao|hasta pronto|bye)/.test(normalized)) {
            interpretation.intent = "SOCIAL_FAREWELL";
            interpretation.confidence = 0.95;
            return interpretation;
        }

        // 2. Knowledge Sharing Intent
        if (/compartir conocimiento|enseñarte algo|guarda esta informacion|guarda esta info|aprende esto/.test(normalized)) {
            interpretation.intent = "KNOWLEDGE_SHARING";
            interpretation.confidence = 0.9;
            return interpretation;
        }

        // 3. Financial Query Intent
        const esCosto    = /cuanto\s*cuesta|costo\s*de|costo\s*produccion|cuanto\s*vale|precio/.test(normalized);
        const esMargen   = /margen|rentabilidad|ganancia|porcentaje/.test(normalized);
        const esIngred   = /ingredientes|receta|insumos|que\s*lleva|que\s*contiene/.test(normalized);
        const esPerdida  = /perdida|perder|por\s*debajo/.test(normalized);
        
        if (esCosto || esMargen || esIngred || esPerdida) {
            interpretation.intent = "FINANCIAL_QUERY";
            interpretation.topic = tokens.filter(t => !/cuanto|cuesta|costo|produccion|vale|precio|margen|rentabilidad|ganancia|porcentaje|ingredientes|receta|insumos|lleva|contiene|perdida|perder|debajo/.test(t)).join(' ');
            interpretation.confidence = 0.9;
            
            // Si la consulta es específica (e.g. "cuanto cuesta") pero no hay entidades (e.g. "pan")
            if (interpretation.topic.trim() === '' && tokens.length <= 2) {
                // Wait, some global questions are fine: "qué productos dan pérdida?"
                if (!esPerdida) {
                    interpretation.confidence = 0.4;
                    interpretation.ambiguity.push("no se menciona el producto objetivo");
                    interpretation.missingInformation.push("el nombre del producto o insumo");
                    interpretation.isClarificationNeeded = true;
                }
            }
            return interpretation;
        }

        // 4. Analysis Request
        const isAnalysis = /analiza|compara|revisa|evalua/.test(normalized);
        if (isAnalysis) {
            interpretation.intent = "ANALYSIS_REQUEST";
            interpretation.topic = tokens.filter(t => !/analiza|compara|revisa|evalua/.test(t)).join(' ');
            interpretation.confidence = 0.85;
            if (interpretation.topic.trim() === '') {
                interpretation.isClarificationNeeded = true;
                interpretation.ambiguity.push("falta contexto de análisis");
                interpretation.missingInformation.push("qué situación o datos debo analizar");
            }
            return interpretation;
        }

        // 5. Research Request
        const isResearch = /investiga|research|busca informacion|averigua|busca en internet|indaga/.test(normalized) || normalized.startsWith('busca ');
        if (isResearch) {
            interpretation.intent = "RESEARCH_REQUEST";
            interpretation.topic = tokens.filter(t => !/investiga|busca|informacion|averigua|internet|indaga/.test(t)).join(' ');
            interpretation.confidence = 0.85;

            if (interpretation.topic.trim() === '') {
                interpretation.confidence = 0.3;
                interpretation.ambiguity.push("el objetivo de búsqueda está vacío");
                interpretation.missingInformation.push("qué tema específico necesitas que investigue");
                interpretation.isClarificationNeeded = true;
            }
            return interpretation;
        }

        // 6. General / Factual Question (fallback)
        const isQuestion = normalized.includes('?') || /cual|que|como|donde|cuando|quien|porque/.test(normalized);
        interpretation.intent = isQuestion ? "FACTUAL_QUESTION" : "UNKNOWN_STATEMENT";
        interpretation.topic = tokens.join(' ');
        interpretation.confidence = 0.6;
        
        // Use conversational context if the statement is very brief
        if (tokens.length <= 1 && conversationContext && conversationContext.length > 0) {
            interpretation.ambiguity.push("el mensaje es demasiado corto y ambiguo aisladamente");
            interpretation.confidence = 0.4;
        }

        return interpretation;
    }

    generateClarificationMessage(interpretation) {
        const missing = interpretation.missingInformation[0] || 'más detalles';
        const ambiguo = interpretation.ambiguity[0] || 'la solicitud no es clara';
        return `[CLARIFICACIÓN] Necesito un poco de ayuda para entenderte bien. Detecté que ${ambiguo}. ¿Podrías indicarme ${missing}?`;
    }
}

window.AI_CORE.LanguageUnderstandingEngine = LanguageUnderstandingEngine;
