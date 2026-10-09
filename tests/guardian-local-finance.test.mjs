import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const recipes = [
    { id: 'rec_a', nombre: 'Pan de prueba A', ingredientes: [{ insumoId: 'harina', cantidad: 100 }, { insumoId: 'azucar', cantidad: 100 }], rendimiento: 10, precioVenta: 10, factorServiciosPct: 10 },
    { id: 'rec_b', nombre: 'Pan de prueba B', ingredientes: [{ insumoId: 'harina', cantidad: 200 }], rendimiento: 5, precioVenta: 10, factorServiciosPct: 10 }
];
const insumos = [
    { id: 'harina', nombre: 'Harina', unidadBase: 'g', costoUnitario: 0.1, costoTotal: 10000 },
    { id: 'azucar', nombre: 'Azúcar', unidadBase: 'g', costoUnitario: 0.05, costoTotal: 20000 }
];

const localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
};
const window = { AI_CORE: {}, costosState: { recetas: recipes, insumos } };
const document = {
    getElementById() { return { value: '', innerHTML: '', style: {}, appendChild() {}, remove() {} }; },
    querySelectorAll() { return []; },
    createElement() { return { style: {}, appendChild() {} }; }
};
const sandbox = { window, document, localStorage, console: { log() {}, warn() {}, error() {} }, setTimeout, clearTimeout, alert() {}, confirm() { return true; } };

class IdentityManager {
    getCurrentUser(user) { return user || { roles: ['admin'] }; }
    getBotIdentity() { return {}; }
}
class PermissionManager { getGovernanceRules() { return {}; } }
class Store { async load() { return []; } async save() {} }
class MemoryManager {
    constructor() { this.turns = []; }
    getShortTermMemory() { return [...this.turns]; }
    addTurn(role, text, metadata) { this.turns.push({ role, text, metadata }); }
    async getAllPersistent() { return []; }
    clearShortTermMemory() { this.turns = []; }
}
class KnowledgeManager { async search() { return []; } }
class ContextManager {
    async assembleContext() {}
    setKnowledge() {}
    setCreatorKnowledge() {}
    buildContext() { return { blocks: {} }; }
}
class LocalMockProvider { async generate() { return 'MOCK'; } }
class ReasoningEngine { async reason() { throw new Error('La consulta financiera debió resolver antes del mock.'); } }
class PersonalityEngine { applyPersonality() { return {}; } }

Object.assign(window.AI_CORE, {
    IdentityManager, PermissionManager, LocalStorageKnowledgeStore: Store,
    MemoryManager, KnowledgeManager, ContextManager, LocalMockProvider,
    ReasoningEngine, PersonalityEngine
});

runInNewContext(read('ai-core/ai-understanding.js'), sandbox, { filename: 'ai-understanding.js' });
runInNewContext(read('guardian-financiero.js'), sandbox, { filename: 'guardian-financiero.js' });
runInNewContext(read('ai-core/ai-chat-bridge.js'), sandbox, { filename: 'ai-chat-bridge.js' });

const bridge = window.AI_CORE.chatBridgeInstance;
assert.equal(bridge.provider, undefined, 'El ChatBridge activo no debe crear el proveedor simulado.');
assert.equal(bridge.reasoningEngine.aiProvider, undefined, 'El razonador activo no debe depender del proveedor simulado.');

for (const query of ['¿Cuál es el pan más rentable?', 'Dime el pan menos rentable']) {
    const intent = bridge.understandingEngine.analyze(query);
    assert.equal(intent.intent, 'FINANCIAL_QUERY', `La consulta debe reconocerse como financiera: ${query}`);
    assert.equal(intent.isClarificationNeeded, false, `El ranking general no debe pedir un producto: ${query}`);
}

const best = await bridge.receiveMessage('¿Cuál es el pan más rentable?', null, window.costosState);
assert.match(best, /Pan de prueba A/, 'Debe elegir el mayor margen calculado desde recetas e insumos.');
assert.match(best, /83\.5%/, 'Debe reportar el margen esperado con el factor de servicios.');

const worst = await bridge.receiveMessage('Dime el pan menos rentable', null, window.costosState);
assert.match(worst, /Pan de prueba B/, 'Debe elegir el menor margen calculado.');

const mostExpensive = await bridge.receiveMessage('¿Qué insumo es más costoso?', null, window.costosState);
assert.match(mostExpensive, /Azúcar/, 'Debe usar el costoTotal del registro de compra del insumo.');

const validIngredients = recipes[1].ingredientes;
recipes[1].ingredientes = [{ insumoId: 'missing', cantidad: 500 }];
const incompleteData = window._gf_resolverLocalmente('¿Cuál es el pan más rentable?');
assert.match(incompleteData, /No puedo comparar la rentabilidad con seguridad/i, 'No debe tratar un insumo faltante como costo cero.');
recipes[1].ingredientes = validIngredients;

window.costosState.recetas = [];
const noRecipes = window._gf_resolverLocalmente('¿Cuál es el pan más rentable?');
assert.match(noRecipes, /no hay recetas registradas/i, 'Sin recetas debe comunicar el dato faltante claramente.');

console.log('PASS: clasificación y resolución financiera local integradas en ChatBridge (12 comprobaciones).');
