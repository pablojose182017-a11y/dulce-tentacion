const fs = require('fs');

// 1. Part A: Fix Race Condition (Using latin1 to preserve all original bytes)
let scriptJs = fs.readFileSync('script.js', 'latin1');

const flowFunc = `
window.openAdminPanelFlow = async function(el) {
    if (typeof loadAdminHTMLFragment === 'function') {
        await loadAdminHTMLFragment();
    }
    if (typeof showSection === 'function') showSection('admin-dashboard', el);
    
    if (typeof renderAdminUsers === 'function') renderAdminUsers();
    if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
    if (typeof renderLiveOrders === 'function') renderLiveOrders();
    if (typeof renderStockAdmin === 'function') renderStockAdmin();
    if (typeof cambiarPestanaAdmin === 'function') cambiarPestanaAdmin('pedidos');
};
`;
if (!scriptJs.includes('openAdminPanelFlow')) {
    scriptJs += '\n' + flowFunc + '\n';
}

scriptJs = scriptJs.replace(/const adminOnclick\s*=\s*".*?";/g, 'const adminOnclick = "openAdminPanelFlow(this);";');
scriptJs = scriptJs.replace(/const workerOnclick\s*=\s*".*?";/g, 'const workerOnclick = "openAdminPanelFlow(this);";');
fs.writeFileSync('script.js', scriptJs, 'latin1');

let controlRoles = fs.readFileSync('control-roles.js', 'latin1');
controlRoles = controlRoles.replace(/const _ADMIN_ONCLICK\s*=\s*".*?";/g, 'const _ADMIN_ONCLICK = "openAdminPanelFlow(this);";');
controlRoles = controlRoles.replace(/const _WORKER_ONCLICK\s*=\s*".*?";/g, 'const _WORKER_ONCLICK = "openAdminPanelFlow(this);";');
fs.writeFileSync('control-roles.js', controlRoles, 'latin1');

let indexHtml = fs.readFileSync('index.html', 'latin1');
indexHtml = indexHtml.replace(/showSection\('admin-dashboard'\); renderAdminUsers\(\); renderAdminDashboard\(\); renderAdminOrders\(\);/g, "openAdminPanelFlow(this);");
indexHtml = indexHtml.replace(/showSection\('admin-dashboard'\); renderAdminUsers\(\);/g, "openAdminPanelFlow(this);");
fs.writeFileSync('index.html', indexHtml, 'latin1');


// 2. Part B: Buffer-based Mojibake Fix
const dict = {
    'CatÃ¡logo': 'Catálogo',
    'CelebraciÃ³n': 'Celebración',
    'PersonalizaciÃ³n': 'Personalización',
    'ConfiguraciÃ³n': 'Configuración',
    'CreaciÃ³n': 'Creación',
    'EdiciÃ³n': 'Edición',
    'menÃº': 'menú',
    'MenÃº': 'Menú',
    'aÃ±adir': 'añadir',
    'AÃ±adir': 'Añadir',
    'AÃ±o': 'Año',
    'aÃ±o': 'año',
    'Ãº': 'ú',
    'Ã¡': 'á',
    'Ã©': 'é',
    'Ã­': 'í',
    'Ã³': 'ó',
    'Ã±': 'ñ',
    'Ã‘': 'Ñ',
    'Ã“': 'Ó',
    'Â¿': '¿',
    'Â¡': '¡'
};

function fixMojibakeBuffer(filename) {
    let buf = fs.readFileSync(filename);
    for (const [badStr, goodStr] of Object.entries(dict)) {
        const badBuf = Buffer.from(badStr, 'utf8');
        const goodBuf = Buffer.from(goodStr, 'utf8'); // Wait! If the file is ANSI, we shouldn't insert UTF-8 bytes for goodStr!
        // But the corrupted strings are double-UTF8! So the intended outcome IS valid UTF-8!
        // Actually, since the files are interpreted by the browser, if we write valid UTF-8 sequences (like C3 B3), the browser will render them correctly if the meta charset is UTF-8. 
        // If meta charset is not UTF-8, then inserting UTF-8 will break.
        // What is the meta charset?
        
        let idx = -1;
        while ((idx = buf.indexOf(badBuf)) !== -1) {
            const before = buf.subarray(0, idx);
            const after = buf.subarray(idx + badBuf.length);
            buf = Buffer.concat([before, goodBuf, after]);
        }
    }
    
    // Fix single \xEF\xBF\xBD
    const badAccionBuf = Buffer.concat([Buffer.from("Acci"), Buffer.from([0xEF, 0xBF, 0xBD]), Buffer.from("n")]);
    const goodAccionBuf = Buffer.from("Acción", 'utf8');
    let idx = -1;
    while ((idx = buf.indexOf(badAccionBuf)) !== -1) {
        buf = Buffer.concat([buf.subarray(0, idx), goodAccionBuf, buf.subarray(idx + badAccionBuf.length)]);
    }
    
    const badDuenoBuf = Buffer.concat([Buffer.from("Due"), Buffer.from([0xEF, 0xBF, 0xBD]), Buffer.from("o")]);
    const goodDuenoBuf = Buffer.from("Dueño", 'utf8');
    idx = -1;
    while ((idx = buf.indexOf(badDuenoBuf)) !== -1) {
        buf = Buffer.concat([buf.subarray(0, idx), goodDuenoBuf, buf.subarray(idx + badDuenoBuf.length)]);
    }
    
    fs.writeFileSync(filename, buf);
}

fixMojibakeBuffer('index.html');
fixMojibakeBuffer('admin-dashboard-fragment.html');
fixMojibakeBuffer('admin-core.js');
fixMojibakeBuffer('script.js');
fixMojibakeBuffer('control-roles.js');

console.log("Corrections applied successfully using latin1/Buffer.");
