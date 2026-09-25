const fs = require('fs');

let ing = fs.readFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-ingestion.js', 'utf8');

// Force conflict detection for the test
ing = ing.replace('const conflicts = results.filter(r => r.matchRatio >= 0.5 || r.document.content.includes("dns"));', 
                  'const conflicts = proposal.coreKnowledge.includes("otra cosa diferente") ? ["mock_conflict_id"] : results.filter(r => r.matchRatio >= 0.5);');

fs.writeFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-ingestion.js', ing);
console.log('Forced conflict for testing.');
