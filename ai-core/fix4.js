const fs = require('fs');
let ing = fs.readFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-ingestion.js', 'utf8');

ing = ing.replace('return conflicts.map(c => c.document.id);', 'return conflicts.map(c => c.document ? c.document.id : c);');

fs.writeFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-ingestion.js', ing);
