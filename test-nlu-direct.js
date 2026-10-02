const fs = require('fs');

global.window = {};
global.localStorage = { getItem: () => null, setItem: () => {} };

const code = fs.readFileSync('./ai-core/ai-understanding.js', 'utf8');
eval(code);

const engine = new window.AI_CORE.LanguageUnderstandingEngine();

console.log("T2:", engine.analyze("nesesito ayuda").isClarificationNeeded);
console.log("T3:", engine.analyze("el pan me esta dejando poca ganansia").intent);
console.log("T4:", engine.analyze("investiga sobre los presios de la harina").intent);
console.log("T5:", engine.analyze("necesito que me alludes a analizar algo").intent, engine.analyze("necesito que me alludes a analizar algo").isClarificationNeeded);
