const fs = require('fs');
const { PersonalityEngine } = require('./ai-core/ai-personality.js');

const engine = new PersonalityEngine();

function test(name, res, expectedMode) {
    console.log(`${name} -> mode: ${res.conversationMode}, tone: ${res.epistemicTone}, init: ${res.initiative}`);
}

try {
    const p1 = engine.applyPersonality({ uncertainty: { level: "UNKNOWN" } }, { problemStatement: "Hola Guardian" });
    test("P1", p1);
} catch (e) { console.error("P1 Error:", e.message); }

try {
    const p2 = engine.applyPersonality({ uncertainty: { level: "UNKNOWN" } }, { problemStatement: "¿Cómo estás?" });
    test("P2", p2);
} catch (e) { console.error("P2 Error:", e.message); }

try {
    const p13 = engine.applyPersonality({ uncertainty: { level: "UNKNOWN" } }, { problemStatement: "¿Qué puedes hacer?" });
    test("P13", p13);
} catch (e) { console.error("P13 Error:", e.message); }

try {
    const p14 = engine.applyPersonality({ uncertainty: { level: "UNKNOWN" } }, { problemStatement: "¿En qué me puedes ayudar?" });
    test("P14", p14);
} catch (e) { console.error("P14 Error:", e.message); }

try {
    const p15 = engine.applyPersonality({ uncertainty: { level: "UNKNOWN" } }, { problemStatement: "¿Cuáles son tus capacidades?" });
    test("P15", p15);
} catch (e) { console.error("P15 Error:", e.message); }
