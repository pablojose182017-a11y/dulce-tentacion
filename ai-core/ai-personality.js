if (typeof window.AI_CORE === 'undefined') window.AI_CORE = {};

/**
 * PERSONALITY ENGINE V1
 * A layer that controls tone, conversational style, and epistemic honesty.
 * Does not handle permissions, authority, execution, or knowledge storage.
 */
class PersonalityEngine {
    
    applyPersonality(reasoningAnalysis, inputContext) {
        const prompt = (inputContext.problemStatement || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        
        const orientation = {
            conversationMode: "INFORMATIONAL", // CASUAL, INFORMATIONAL, ANALYTICAL, UNCERTAIN, INVESTIGATIVE, COLLABORATIVE, WARNING
            epistemicTone: "UNKNOWN",        // CERTAIN, QUALIFIED, UNCERTAIN, UNKNOWN
            initiative: "NONE",              // NONE, SUGGEST, QUESTION, FLAG
            styleGuidelines: []
        };

        // 1. Detección de conversación puramente social (P1, P2)
        const esConversacional = /^(hola|buenas|buenos dias|buenas tardes|buenas noches|que tal|saludos|hey|como estas|gracias|de nada|quien eres|conversemos)[\s\?\!\.]*$/.test(prompt);

        if (esConversacional) {
            orientation.conversationMode = "CASUAL";
            orientation.epistemicTone = "CERTAIN";
            orientation.styleGuidelines.push("cercano", "amigable");
            return orientation;
        }

        // 1.5 Detección de consulta de capacidades (P13, P14, P15)
        const esCapacidades = /^(que puedes hacer|que puedes hacer por mi|cuales son tus capacidades|en que me puedes ayudar|que sabes hacer|que funciones tienes)[\s\?\!\.]*$/.test(prompt);
        if (esCapacidades) {
            orientation.conversationMode = "CAPABILITIES";
            orientation.epistemicTone = "CERTAIN";
            orientation.styleGuidelines.push("honesto", "preciso", "solo lo implementado");
            return orientation;
        }

        // 2. Evaluamos el nivel de incertidumbre dictado por el Reasoning Engine (P3, P4, P5, P6)
        const uncertainty = reasoningAnalysis.uncertainty;
        
        if (uncertainty.level === "HIGH" || uncertainty.level === "CRITICAL") {
            
            // Hay conflicto entre evidencias (P5)
            if (uncertainty.conflictingInformation && uncertainty.conflictingInformation.length > 0) {
                orientation.conversationMode = "INVESTIGATIVE";
                orientation.epistemicTone = "QUALIFIED";
                orientation.initiative = "FLAG";
                orientation.styleGuidelines.push("critico", "honesto", "señalar contradiccion");
            } 
            // Falta información para afirmar un hecho (P3, P7)
            else if (uncertainty.missingInformation && uncertainty.missingInformation.length > 0) {
                // Si faltan datos, preguntamos antes de asumir (P7) o simplemente reconocemos desconocimiento (P3)
                orientation.conversationMode = "COLLABORATIVE";
                orientation.epistemicTone = "UNKNOWN";
                orientation.initiative = "QUESTION";
                orientation.styleGuidelines.push("humilde", "no inventar", "indicar falta de datos");
            } 
            // Incertidumbre general
            else {
                orientation.conversationMode = "UNCERTAIN";
                orientation.epistemicTone = "UNKNOWN";
                orientation.initiative = "NONE";
                orientation.styleGuidelines.push("humilde");
            }

        } else if (uncertainty.level === "LOW") {
            // Hay soporte sólido
            orientation.conversationMode = "INFORMATIONAL";
            orientation.epistemicTone = "CERTAIN";
            orientation.styleGuidelines.push("directo", "preciso");

            // Si hay hipótesis soportadas, pero otras rechazadas, actuamos proactivos (P8)
            const hasUnsupported = reasoningAnalysis.hypotheses.some(h => h.status === "UNSUPPORTED_HYPOTHESIS");
            if (hasUnsupported) {
                orientation.conversationMode = "COLLABORATIVE";
                orientation.initiative = "SUGGEST";
                orientation.styleGuidelines.push("proactivo", "presentar como hipotesis");
            }
        }

        return orientation;
    }
}

window.AI_CORE.PersonalityEngine = PersonalityEngine;
if (typeof module !== 'undefined') module.exports = { PersonalityEngine };
