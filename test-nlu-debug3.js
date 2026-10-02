const fs = require('fs');

global.window = {};
global.localStorage = { getItem: () => null, setItem: () => {} };

const code = fs.readFileSync('./ai-core/ai-understanding.js', 'utf8');
eval(code);

const engine = new window.AI_CORE.LanguageUnderstandingEngine();

console.log(engine._normalize("investiga los huevos"));
