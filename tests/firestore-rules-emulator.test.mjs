import assert from 'node:assert/strict';

const PROJECT_ID = 'demo-punto-dulce';
const AUTH_BASE = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const FIRESTORE_BASE = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const ownerHeaders = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

async function request(url, { token, method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: response.status, data };
}

function docUrl(collection, id, query = '') {
    return `${FIRESTORE_BASE}/${collection}/${encodeURIComponent(id)}${query}`;
}

async function signup(label) {
    const email = `${label}.${suffix}@example.test`;
    const result = await request(`${AUTH_BASE}/accounts:signUp?key=fake-api-key`, {
        method: 'POST',
        body: { email, password: 'LocalTest123!', returnSecureToken: true }
    });
    assert.equal(result.status, 200, `Auth Emulator no creó ${label}: ${JSON.stringify(result.data)}`);
    return { email, uid: result.data.localId, token: result.data.idToken };
}

async function seedDoc(collection, id, fields) {
    const result = await fetch(docUrl(collection, id), {
        method: 'PATCH',
        headers: ownerHeaders,
        body: JSON.stringify({ fields })
    });
    assert.equal(result.status, 200, `No se pudo preparar ${collection}/${id} en el emulador.`);
}

async function seedRole(user, level) {
    await seedDoc('roles', user.uid, { nivel: { integerValue: String(level) } });
}

function profile(user, role = 'cliente') {
    const isAdmin = role === 'admin';
    return {
        email: { stringValue: user.email },
        nombre: { stringValue: user.email.split('@')[0] },
        role: { stringValue: role },
        rol: { stringValue: role },
        isAdmin: { booleanValue: isAdmin },
        vip: { booleanValue: false },
        isVip: { booleanValue: false },
        blocked: { booleanValue: false },
        estado: { stringValue: 'activo' },
        points: { integerValue: '15' },
        ultimaSincronizacion: { stringValue: new Date().toISOString() },
        ultimoIngreso: { stringValue: new Date().toISOString() }
    };
}

async function expectStatus(name, promise, status) {
    const result = await promise;
    assert.equal(result.status, status, `${name}: esperado HTTP ${status}; recibido ${result.status}: ${JSON.stringify(result.data)}`);
    return result;
}

async function createProfile(user, role, status) {
    return expectStatus(`crear perfil ${role}`, request(docUrl('usuarios', user.email), {
        token: user.token,
        method: 'PATCH',
        body: { fields: profile(user, role) }
    }), status);
}

async function createOrder(user, id, status = 200) {
    return expectStatus(`crear pedido ${id}`, request(docUrl('pedidos', id), {
        token: user.token,
        method: 'PATCH',
        body: { fields: {
            ownerId: { stringValue: user.uid },
            estado: { stringValue: 'Pendiente' },
            total: { integerValue: '20000' }
        } }
    }), status);
}

async function updateField(user, collection, id, field, value, status) {
    const query = `?updateMask.fieldPaths=${encodeURIComponent(field)}`;
    return expectStatus(`actualizar ${collection}/${id}.${field}`, request(docUrl(collection, id, query), {
        token: user.token,
        method: 'PATCH',
        body: { fields: { [field]: value } }
    }), status);
}

async function updateRole(user, uid, level, status) {
    return expectStatus(`nivel ${level} en roles/${uid}`, request(docUrl('roles', uid), {
        token: user.token,
        method: 'PATCH',
        body: { fields: { nivel: { integerValue: String(level) } } }
    }), status);
}

// Visitante: catálogo/configuración pública sí; pedidos/perfiles no.
await seedDoc('config', `catalogo_test_${suffix}`, { visible: { booleanValue: true } });
await expectStatus('lectura pública de configuración', request(docUrl('config', `catalogo_test_${suffix}`)), 200);
const guest = { email: `guest.${suffix}@example.test`, uid: 'guest-no-auth', token: null };
await createProfile(guest, 'cliente', 403);
await createOrder(guest, `guest-order-${suffix}`, 403);
console.log('PASS: visitante anónimo conserva lectura pública y no crea perfiles ni pedidos.');

// Cliente: perfil y pedido propios, sin privilegios ni lectura de otra compra.
const customer = await signup('cliente');
await createProfile(customer, 'admin', 403);
await createProfile(customer, 'trabajador', 403);
await createProfile(customer, 'cliente', 200);
await updateField(customer, 'usuarios', customer.email, 'role', { stringValue: 'admin' }, 403);
await createOrder(customer, `customer-order-${suffix}`, 200);
await expectStatus('lectura del pedido propio', request(docUrl('pedidos', `customer-order-${suffix}`), { token: customer.token }), 200);
await expectStatus('escritura de configuración por cliente', request(docUrl('config', `catalogo_test_${suffix}`), {
    token: customer.token,
    method: 'PATCH',
    body: { fields: { visible: { booleanValue: false } } }
}), 403);
console.log('PASS: cliente conserva perfil/pedido propios y no puede autoasignarse admin o trabajador.');

// Trabajador: el nivel canónico 20 permite el perfil correcto y tareas de pedido.
const worker = await signup('trabajador');
await seedRole(worker, 20);
await createProfile(worker, 'admin', 403);
await createProfile(worker, 'trabajador', 200);
await createOrder(worker, `worker-order-${suffix}`, 200);
await expectStatus('trabajador lee pedido operativo', request(docUrl('pedidos', `customer-order-${suffix}`), { token: worker.token }), 200);
await updateField(worker, 'pedidos', `worker-order-${suffix}`, 'estado', { stringValue: 'En preparación' }, 200);
await updateField(worker, 'pedidos', `worker-order-${suffix}`, 'total', { integerValue: '1' }, 403);
await expectStatus('escritura de configuración por trabajador', request(docUrl('config', `catalogo_test_${suffix}`), {
    token: worker.token,
    method: 'PATCH',
    body: { fields: { visible: { booleanValue: false } } }
}), 403);
console.log('PASS: trabajador conserva lectura y cambio operativo de estado, sin alterar importes o configuración.');

// Cliente no puede leer el pedido creado por otro UID.
await expectStatus('cliente no lee pedido ajeno', request(docUrl('pedidos', `worker-order-${suffix}`), { token: customer.token }), 403);

// Administrador nivel 50 mantiene perfiles/pedidos, pero no sube autoridad ni cambia configuración de nivel 80.
const admin = await signup('admin');
await seedRole(admin, 50);
await createProfile(admin, 'admin', 200);
await updateField(admin, 'usuarios', customer.email, 'points', { integerValue: '21' }, 200);
await updateField(admin, 'pedidos', `customer-order-${suffix}`, 'total', { integerValue: '21000' }, 200);
await expectStatus('escritura global por admin nivel 50', request(docUrl('config', `catalogo_test_${suffix}`), {
    token: admin.token,
    method: 'PATCH',
    body: { fields: { visible: { booleanValue: false } } }
}), 403);
await updateRole(admin, `new-lower-role-${suffix}`, 20, 403);
console.log('PASS: administrador conserva gestión de usuarios/pedidos sin superar su nivel de autoridad.');

// Superadministrador nivel 80 conserva cambios globales y delegación limitada.
const superAdmin = await signup('superadmin');
await seedRole(superAdmin, 80);
await createProfile(superAdmin, 'admin', 200);
await expectStatus('escritura global por superadmin', request(docUrl('config', `catalogo_test_${suffix}`), {
    token: superAdmin.token,
    method: 'PATCH',
    body: { fields: { visible: { booleanValue: false } } }
}), 200);
await updateRole(superAdmin, `new-lower-role-${suffix}`, 20, 200);
await updateRole(superAdmin, `new-high-role-${suffix}`, 80, 403);
console.log('PASS: superadministrador conserva permisos globales y no asigna niveles 80 o superiores.');

console.log('RESULTADO: reglas locales firestore.rules probadas con Auth + Firestore Emulator.');
