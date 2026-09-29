const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');

const target = `    if (currentUser.history && Array.isArray(currentUser.history)) {
        const ids = new Set(todosLosPedidos.map(p => p.id));
        currentUser.history.forEach(h => {
            if (h && h.id && !ids.has(h.id)) todosLosPedidos.push(h);
        });
    }`;

const replacement = `    if (currentUser.history && Array.isArray(currentUser.history)) {
        currentUser.history.forEach(h => {
            if (h && h.id) {
                const idx = todosLosPedidos.findIndex(p => p.id === h.id);
                if (idx !== -1) {
                    todosLosPedidos[idx] = h;
                } else {
                    todosLosPedidos.push(h);
                }
            }
        });
    }`;

// use regex with \r?\n to ignore line ending issues
const targetRegex = /if \(currentUser\.history && Array\.isArray\(currentUser\.history\)\) \{\s*const ids = new Set\(todosLosPedidos\.map\(p => p\.id\)\);\s*currentUser\.history\.forEach\(h => \{\s*if \(h && h\.id && !ids\.has\(h\.id\)\) todosLosPedidos\.push\(h\);\s*\}\);\s*\}/m;

if (targetRegex.test(content)) {
    fs.writeFileSync('script.js', content.replace(targetRegex, replacement));
    console.log("Success");
} else {
    console.log("Not found");
}
