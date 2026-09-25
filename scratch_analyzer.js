const fs = require('fs');
const files = [
  'script.js',
  'control-roles.js',
  'contabilidad.js',
  'costos-recetas.js',
  'guardian-financiero.js',
  'firebase-sync.js'
];

files.forEach(file => {
    console.log(`\n=== FILE: ${file} ===`);
    try {
        const content = fs.readFileSync(file, 'utf8');
        // Find functions
        const funcs = [...content.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\(/g)].map(m => m[1]);
        const arrowFuncs = [...content.matchAll(/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/g)].map(m => m[1]);
        const windowAssigns = [...content.matchAll(/window\.([a-zA-Z0-9_]+)\s*=/g)].map(m => m[1]);
        const documentListeners = [...content.matchAll(/document\.addEventListener\(['"]([^'"]+)['"]/g)].map(m => m[1]);
        const idListeners = [...content.matchAll(/document\.getElementById\(['"]([^'"]+)['"]\)\.addEventListener\(['"]([^'"]+)['"]/g)].map(m => `${m[1]} -> ${m[2]}`);
        const localStorages = [...content.matchAll(/localStorage\.(?:get|set|remove)Item\(['"]([^'"]+)['"]/g)].map(m => m[1]);
        const fetches = [...content.matchAll(/fetch\(['"]([^'"]+)['"]/g)].map(m => m[1]);
        const geminiCalls = [...content.matchAll(/https:\/\/generativelanguage.googleapis.com\/v1beta\/models\/gemini-[^:'"]+/g)].map(m => m[0]);
        
        console.log("Functions:", funcs.slice(0, 20).join(", ") + (funcs.length > 20 ? "..." : ""));
        console.log("Arrow Funcs:", arrowFuncs.slice(0, 20).join(", ") + (arrowFuncs.length > 20 ? "..." : ""));
        console.log("Window Exports:", [...new Set(windowAssigns)].join(", "));
        console.log("Global Listeners:", [...new Set(documentListeners)].join(", "));
        console.log("Element Listeners:", [...new Set(idListeners)].slice(0, 15).join(" | ") + (idListeners.length > 15 ? "..." : ""));
        console.log("LocalStorage Keys:", [...new Set(localStorages)].join(", "));
        console.log("Fetch calls:", [...new Set(fetches)].join(", "));
        console.log("Gemini endpoints:", [...new Set(geminiCalls)].join(", "));
    } catch(e) {
        console.error("Error reading file:", e.message);
    }
});
