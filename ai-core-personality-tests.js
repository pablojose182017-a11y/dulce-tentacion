const assert = require('assert');

// Mock components to test Personality Engine in isolation
global.window = { AI_CORE: {} };
require('./ai-core/ai-personality');

function runTests() {
    console.log("=== INICIANDO TESTS ESTRUCTURALES GUARDIAN PERSONALITY V1 ===");
    let passed = 0; let total = 0;
    
    const test = (name, cond, msg) => {
        total++;
        if (cond) {
            console.log(`[PASS] ${name}: ${msg}`);
            passed++;
        } else {
            console.error(`[FAIL] ${name}: ${msg}`);
        }
    };

    const engine = new window.AI_CORE.PersonalityEngine();

    // P1 — saludo natural
    const p1 = engine.applyPersonality({ uncertainty: { level: "UNKNOWN" } }, { problemStatement: "Hola Guardian" });
    test("P1", p1.conversationMode === "CASUAL" && p1.epistemicTone === "CERTAIN", "Saludo natural detectado (CASUAL/CERTAIN).");

    // P2 — conversación casual
    const p2 = engine.applyPersonality({ uncertainty: { level: "UNKNOWN" } }, { problemStatement: "¿Cómo estás?" });
    test("P2", p2.conversationMode === "CASUAL", "Conversación casual detectada.");

    // P3 — pregunta factual sin evidencia
    const p3 = engine.applyPersonality({ uncertainty: { level: "HIGH" } }, { problemStatement: "¿Cuánto cuesta la harina?" });
    test("P3", p3.conversationMode === "UNCERTAIN" && p3.epistemicTone === "UNKNOWN", "Pregunta factual sin evidencia -> UNKNOWN/UNCERTAIN.");

    // P4 — respuesta con evidencia disponible
    const p4 = engine.applyPersonality({ uncertainty: { level: "LOW" }, hypotheses: [] }, { problemStatement: "¿Qué dice el documento?" });
    test("P4", p4.conversationMode === "INFORMATIONAL" && p4.epistemicTone === "CERTAIN", "Respuesta con evidencia -> INFORMATIONAL/CERTAIN.");

    // P5 — contradicción entre evidencias
    const p5 = engine.applyPersonality({ uncertainty: { level: "HIGH", conflictingInformation: ["Diferencia de datos"] } }, { problemStatement: "Revisa esto" });
    test("P5", p5.conversationMode === "INVESTIGATIVE" && p5.epistemicTone === "QUALIFIED" && p5.initiative === "FLAG", "Contradicción -> INVESTIGATIVE/FLAG.");

    // P6 — hipótesis presentada como hipótesis
    // P8 — iniciativa propone sin ejecutar
    const p6 = engine.applyPersonality({ uncertainty: { level: "LOW" }, hypotheses: [{ status: "UNSUPPORTED_HYPOTHESIS" }] }, { problemStatement: "¿Qué opinas?" });
    test("P6/P8", p6.conversationMode === "COLLABORATIVE" && p6.initiative === "SUGGEST", "Hipótesis no soportada pero con evidencia parcial -> COLLABORATIVE/SUGGEST.");

    // P7 — información faltante genera pregunta útil
    const p7 = engine.applyPersonality({ uncertainty: { level: "CRITICAL", missingInformation: ["Falta fecha"] } }, { problemStatement: "¿Qué día fue?" });
    test("P7", p7.conversationMode === "COLLABORATIVE" && p7.epistemicTone === "UNKNOWN" && p7.initiative === "QUESTION", "Falta de información -> COLLABORATIVE/QUESTION.");

    // P9 — Personality no puede conceder autoridad
    // P10 — Personality no puede acceder a Execution
    // P11 — Personality no puede modificar Security
    const keys = Object.keys(p1);
    test("P9/P10/P11", !keys.includes("execute") && !keys.includes("grantPermission") && !keys.includes("authority"), "Personality solo retorna orientaciones (Mode, Tone, Initiative). No permisos.");

    // P12 — Personality no puede convertir UNKNOWN en FACT
    const p12 = engine.applyPersonality({ uncertainty: { level: "HIGH", missingInformation: ["Sin datos"] } }, { problemStatement: "Dime la IP" });
    test("P12", p12.epistemicTone === "UNKNOWN", "No puede convertir incertidumbre alta en CERTAIN fact.");

    // P13 — ¿Qué puedes hacer?
    const p13 = engine.applyPersonality({ uncertainty: { level: "UNKNOWN" } }, { problemStatement: "¿Qué puedes hacer?" });
    test("P13", p13.conversationMode === "CAPABILITIES", "Evita CASUAL, se marca como CAPABILITIES.");

    // P14 — ¿En qué me puedes ayudar?
    const p14 = engine.applyPersonality({ uncertainty: { level: "UNKNOWN" } }, { problemStatement: "¿En qué me puedes ayudar?" });
    test("P14", p14.conversationMode === "CAPABILITIES", "Evita CASUAL, se marca como CAPABILITIES.");

    // P15 — ¿Cuáles son tus capacidades?
    const p15 = engine.applyPersonality({ uncertainty: { level: "UNKNOWN" } }, { problemStatement: "¿Cuáles son tus capacidades?" });
    test("P15", p15.conversationMode === "CAPABILITIES", "Evita CASUAL, se marca como CAPABILITIES.");

    // P16 — Preferencia subjetiva aplicable
    const p16 = engine.applyPersonality({ uncertainty: { level: "HIGH", isSubjective: true } }, { problemStatement: "hazlo corto" });
    test("P16", p16.conversationMode === "COLLABORATIVE" && p16.epistemicTone === "QUALIFIED" && p16.initiative === "SUGGEST", "Preferencia subjetiva aplicable -> COLLABORATIVE + QUALIFIED + SUGGEST.");

    // P17 — UNSUPPORTED_HYPOTHESIS en LOW no puede producir CERTAIN
    const p17 = engine.applyPersonality({ uncertainty: { level: "LOW" }, hypotheses: [{ status: "UNSUPPORTED_HYPOTHESIS" }] }, { problemStatement: "test" });
    test("P17", p17.epistemicTone !== "CERTAIN" && p17.epistemicTone === "QUALIFIED", "UNSUPPORTED_HYPOTHESIS en LOW -> no puede producir CERTAIN.");

    // P18 — isSubjective + conflicto -> prioridad al conflicto
    const p18 = engine.applyPersonality({ uncertainty: { level: "HIGH", isSubjective: true, conflictingInformation: ["conflicto"] } }, { problemStatement: "test" });
    test("P18", p18.conversationMode === "INVESTIGATIVE" && p18.epistemicTone === "QUALIFIED" && p18.initiative === "FLAG", "isSubjective + conflicto -> INVESTIGATIVE + QUALIFIED + FLAG.");

    // P19 — Incertidumbre factual sin isSubjective -> QUESTION
    const p19 = engine.applyPersonality({ uncertainty: { level: "HIGH", isSubjective: false, missingInformation: ["falta"] } }, { problemStatement: "test" });
    test("P19", p19.initiative === "QUESTION", "Incertidumbre factual sin isSubjective -> QUESTION.");

    // P20 — Personality no importa Creator Knowledge ni Security/Execution
    const hasBadImports = typeof window.AI_CORE.CreatorKnowledgeManager !== 'undefined' || typeof window.AI_CORE.SecurityEngine !== 'undefined';
    test("P20", !hasBadImports, "Personality no importa Creator Knowledge ni Security/Execution.");

    console.log(`\nRESUMEN: ${passed} / ${total} TESTS EVALUADOS.`);
    console.log("NOTA: Tests STATIC. Node.js runtime no disponible.");
}

runTests();
