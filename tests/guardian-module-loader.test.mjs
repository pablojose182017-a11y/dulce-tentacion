import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../firebase-sync.js', import.meta.url), 'utf8');
const phaseBoundary = source.indexOf('// FASE 2.2A');
assert.notEqual(phaseBoundary, -1, 'Debe encontrarse el límite de carga del fragmento HTML.');

const requests = [];
const warnings = [];
const window = {
    Chart: undefined,
    async loadProtectedAdminScript(path, marker) {
        requests.push({ path, marker });
        await new Promise(resolve => setTimeout(resolve, 5));
    }
};
const document = {
    head: {
        appendChild(script) {
            setTimeout(() => script.onerror(), 0);
        }
    },
    createElement() { return {}; }
};

runInNewContext(source.slice(0, phaseBoundary), {
    window,
    document,
    console: { warn: (...args) => warnings.push(args) }
}, { filename: 'firebase-sync-admin-loader.js' });
window.loadProtectedAdminScript = async (path, marker) => {
    requests.push({ path, marker });
    await new Promise(resolve => setTimeout(resolve, 5));
};

const loadA = window.loadPhase2AdminModules();
const loadB = window.loadPhase2AdminModules();
await Promise.all([loadA, loadB]);

assert.equal(requests.length, 1, 'Dos aperturas simultáneas deben compartir una carga del bundle.');
assert.equal(requests[0].path, '/ai-guardian-bundle.js?v=2', 'Debe solicitar el bundle protegido no minificado.');
assert.equal(requests[0].marker, 'ai-guardian-bundle.js');
assert.equal(window._adminModulesLoaded, true, 'El fallo de Chart.js no debe bloquear al Guardián.');
assert.equal(warnings.length, 1, 'El fallo del gráfico debe quedar reportado.');

console.log('PASS: el Guardián carga una sola vez aunque Chart.js falle (5 comprobaciones).');
