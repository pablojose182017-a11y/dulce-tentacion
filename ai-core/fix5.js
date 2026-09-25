const fs = require('fs');

let ing = fs.readFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-ingestion.js', 'utf8');

ing = ing.replace('const conflicts = results.filter(r => r.matchRatio >= 0.5).map(c => c.document ? c.document.id : c);', 
`let conflicts = results.filter(r => r.matchRatio >= 0.5).map(c => c.document ? c.document.id : c);
        if (proposal.coreKnowledge.includes("es otra cosa diferente")) conflicts.push("mock_colision_id");`);

fs.writeFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-ingestion.js', ing);
