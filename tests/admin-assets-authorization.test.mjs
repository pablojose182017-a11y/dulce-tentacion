import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const middlewareSource = await readFile(new URL('../functions/_middleware.js', import.meta.url), 'utf8');
const middleware = await import(`data:text/javascript;base64,${Buffer.from(middlewareSource).toString('base64')}`);
const routeConfig = JSON.parse(await readFile(new URL('../_routes.json', import.meta.url), 'utf8'));

const accounts = new Map([
    ['customer-token', { localId: 'customer-uid', email: 'customer@example.test' }],
    ['worker-token', { localId: 'worker-uid', email: 'worker@example.test' }],
    ['admin-token', { localId: 'admin-uid', email: 'admin@example.test' }],
    ['disabled-token', { localId: 'disabled-uid', email: 'disabled@example.test', disabled: true }]
]);
const levels = new Map([
    ['worker-uid', 20],
    ['admin-uid', 50]
]);

function mockFetch(url, options = {}) {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/accounts:lookup')) {
        const token = JSON.parse(options.body || '{}').idToken;
        const user = accounts.get(token);
        return Promise.resolve(user
            ? Response.json({ users: [user] })
            : new Response('invalid token', { status: 400 }));
    }

    if (parsed.pathname.includes('/documents/roles/')) {
        const uid = decodeURIComponent(parsed.pathname.split('/').at(-1));
        if (!levels.has(uid)) return Promise.resolve(new Response('', { status: 404 }));
        return Promise.resolve(Response.json({ fields: { nivel: { integerValue: String(levels.get(uid)) } } }));
    }
    return Promise.resolve(new Response('unexpected request', { status: 500 }));
}

async function request(path, token, fetcher = mockFetch) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const req = new Request(`https://dulce.test${path}`, { headers });
    let nextCalls = 0;
    const result = await middleware.handleAdminAssetRequest({
        request: req,
        env: {},
        next: async () => {
            nextCalls += 1;
            return new Response('private asset', { status: 200 });
        }
    }, fetcher);
    return { result, nextCalls };
}

const expectedProtectedRoutes = [
    '/admin-dashboard-fragment.html*', '/admin-core.js*', '/contabilidad.js*',
    '/costos-recetas.js*', '/guardian-financiero.js*', '/ai-guardian-bundle.js*',
    '/ai-guardian-bundle.min.js*', '/*.bak', '/*.backup-*', '/*.before-*'
];
assert.deepEqual(routeConfig.include, expectedProtectedRoutes, 'Pages debe invocar la barrera en cada archivo y patrón de respaldo privado.');

for (const path of [
    '/admin-dashboard-fragment.html', '/admin-dashboard-fragment.html.before-old',
    '/admin-core.js', '/admin-core.js.bak', '/contabilidad.js', '/costos-recetas.js',
    '/guardian-financiero.js', '/ai-guardian-bundle.js', '/ai-guardian-bundle.min.js',
    '/firebase-sync.js.backup-20261009'
]) {
    const { result, nextCalls } = await request(path, null);
    assert.equal(result.status, 401, `${path}: un visitante no debe recibir el recurso.`);
    assert.equal(nextCalls, 0, `${path}: la función no debe continuar a los archivos estáticos sin sesión.`);
}
console.log('PASS: visitante y rutas alternativas de respaldo quedan bloqueados antes del asset.');

for (const path of ['/admin-dashboard-fragment.html', '/admin-core.js']) {
    const { result, nextCalls } = await request(path, 'customer-token');
    assert.equal(result.status, 403, `${path}: cliente no autorizado.`);
    assert.equal(nextCalls, 0);
}
console.log('PASS: cliente autenticado no puede recibir módulos internos.');

for (const path of ['/admin-dashboard-fragment.html', '/admin-core.js']) {
    const { result, nextCalls } = await request(path, 'worker-token');
    assert.equal(result.status, 200, `${path}: trabajador debe conservar la operación.`);
    assert.equal(nextCalls, 1);
    assert.equal(result.headers.get('cache-control'), 'private, no-store, max-age=0');
}
for (const path of ['/contabilidad.js', '/costos-recetas.js', '/ai-guardian-bundle.min.js', '/admin-core.js.bak']) {
    const { result, nextCalls } = await request(path, 'worker-token');
    assert.equal(result.status, 403, `${path}: recurso exclusivo de administración.`);
    assert.equal(nextCalls, 0);
}
console.log('PASS: trabajador recibe su panel operativo, pero no archivos de administración ni respaldos.');

for (const path of ['/admin-dashboard-fragment.html', '/admin-core.js', '/contabilidad.js', '/costos-recetas.js', '/guardian-financiero.js', '/ai-guardian-bundle.js', '/ai-guardian-bundle.min.js', '/admin-core.js.bak']) {
    const { result, nextCalls } = await request(path, 'admin-token');
    assert.equal(result.status, 200, `${path}: administrador autorizado.`);
    assert.equal(nextCalls, 1);
}
console.log('PASS: administrador conserva sus recursos y recibe cabecera privada sin caché compartida.');

const invalid = await request('/admin-core.js', 'forged-token');
assert.equal(invalid.result.status, 401);
assert.equal(invalid.nextCalls, 0);
const disabled = await request('/admin-core.js', 'disabled-token');
assert.equal(disabled.result.status, 401);
assert.equal(disabled.nextCalls, 0);
const outage = await request('/admin-core.js', 'admin-token', async () => { throw new Error('offline'); });
assert.equal(outage.result.status, 503, 'Falla de Firebase debe cerrar el acceso.');
assert.equal(outage.nextCalls, 0);
console.log('PASS: token inválido, cuenta deshabilitada y fallo del autorizador cierran el acceso.');

console.log('RESULTADO: todas las pruebas unitarias de autorización de assets pasaron.');
