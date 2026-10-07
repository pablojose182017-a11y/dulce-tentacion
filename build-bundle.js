const fs = require('fs');
const { execSync } = require('child_process');

// Extract the scripts array from firebase-sync.js
const firebaseSyncContent = fs.readFileSync('firebase-sync.js', 'utf8');
const match = firebaseSyncContent.match(/const scripts = \[\s*([\s\S]*?)\s*\];/);
if (!match) {
    console.error('Could not find scripts array in firebase-sync.js');
    process.exit(1);
}

const lines = match[1].split(',').map(l => l.trim().replace(/"/g, '').replace(/\?v=1$/, ''));
const targetFiles = lines.filter(l => !l.includes('chart.js'));

console.log('Target files to bundle:');
console.log(targetFiles.join('\n'));

// Concatenate them
let bundleContent = '';
for (const file of targetFiles) {
    bundleContent += `\n/* --- SOURCE: ${file} --- */\n`;
    bundleContent += fs.readFileSync(file, 'utf8');
}
fs.writeFileSync('ai-guardian-bundle.js', bundleContent, 'utf8');
console.log(`Concatenated ${targetFiles.length} files into ai-guardian-bundle.js`);

// Minify with esbuild
try {
    execSync('npx esbuild ai-guardian-bundle.js --minify --outfile=ai-guardian-bundle.min.js', { stdio: 'inherit' });
    console.log('Successfully minified using esbuild to ai-guardian-bundle.min.js');
} catch (e) {
    console.error('Failed to minify using esbuild', e);
    process.exit(1);
}

// Sizes
const originalSize = fs.statSync('ai-guardian-bundle.js').size;
const minifiedSize = fs.statSync('ai-guardian-bundle.min.js').size;
console.log(`Original concatenated size: ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`Minified bundle size: ${(minifiedSize / 1024).toFixed(2)} KB`);

// Modify firebase-sync.js
const newScriptsArray = `const scripts = [
        "https://cdn.jsdelivr.net/npm/chart.js",
        "ai-guardian-bundle.min.js"
    ];`;
const updatedContent = firebaseSyncContent.replace(match[0], newScriptsArray);
fs.writeFileSync('firebase-sync.js', updatedContent, 'utf8');
console.log('Updated firebase-sync.js to load the bundle.');
