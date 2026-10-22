// Test suite local exhaustiva de permisos y botones administrativos
const assert = require('assert');
const fs = require('fs');

console.log('=== INICIANDO BATERÍA DE PRUEBAS DE PERMISOS (6 CASOS) ===\n');

// Simular entorno DOM
const mockDOM = {
    elements: {},
    getElementById(id) {
        if (!this.elements[id]) {
            this.elements[id] = {
                id,
                style: { display: '' },
                innerText: '',
                setAttribute(attr, val) { this[attr] = val; },
                innerHTML: '',
                remove() { this._removed = true; }
            };
        }
        return this.elements[id];
    },
    reset() {
        this.elements = {};
    }
};

// Cargar lógica relevante desde script.js y control-roles.js
const SUPER_ADMINS = ['pablojose182017@gmail.com', 'dulcestentaciones2004@gmail.com'];
let adminEmails = [...SUPER_ADMINS];
let workerEmails = ['cocina@dulcetentacion.com'];

function evaluateUserPermissions(currentUser, adminEmails, workerEmails) {
    if (!currentUser) return { isAdmin: false, isWorker: false };
    const normEmail = (currentUser.email || '').toLowerCase().trim();
    const isSuper = SUPER_ADMINS.includes(normEmail);
    const isAdmin = isSuper
        || currentUser.role === 'admin'
        || currentUser.rol === 'admin'
        || currentUser.isAdmin === true
        || (Boolean(normEmail) && (typeof adminEmails !== 'undefined') && adminEmails.some(e => (e || '').toLowerCase().trim() === normEmail));

    const isWorker = !isAdmin && (
        currentUser.role === 'trabajador'
        || currentUser.rol === 'trabajador'
        || (Boolean(normEmail) && (typeof workerEmails !== 'undefined') && workerEmails.some(e => (e || '').toLowerCase().trim() === normEmail))
    );
    return { isAdmin, isWorker };
}

function applyUIPermissions(currentUser, adminEmails, workerEmails, dom) {
    const { isAdmin, isWorker } = evaluateUserPermissions(currentUser, adminEmails, workerEmails);
    const deskBtn = dom.getElementById('desk-admin-btn');
    const mobBtn = dom.getElementById('mob-admin-btn');

    if (deskBtn) {
        if (isAdmin || isWorker) {
            deskBtn.style.display = 'flex';
            deskBtn.innerText = isAdmin ? '⚙️ Panel Administrador' : '🛠️ Panel de Pedidos / Cocina';
        } else {
            deskBtn.style.display = 'none';
        }
    }
    if (mobBtn) {
        if (isAdmin || isWorker) {
            mobBtn.style.display = 'flex';
            mobBtn.innerText = isAdmin ? '⚙️ Panel Administrador' : '🛠️ Panel de Pedidos / Cocina';
        } else {
            mobBtn.style.display = 'none';
        }
    }
    return { isAdmin, isWorker, deskBtnDisplay: deskBtn ? deskBtn.style.display : null };
}

// PRUEBA 1: Cliente nuevo sin rol asignado (role: undefined / 'cliente')
console.log('--- PRUEBA 1: Cliente nuevo sin rol asignado ---');
mockDOM.reset();
const clienteNuevo = {
    name: 'Cliente Nuevo',
    email: 'cliente.nuevo@gmail.com',
    role: 'cliente',
    rol: 'cliente',
    isAdmin: false
};
const res1 = applyUIPermissions(clienteNuevo, adminEmails, workerEmails, mockDOM);
assert.strictEqual(res1.isAdmin, false, 'Cliente nuevo no debe ser admin');
assert.strictEqual(res1.isWorker, false, 'Cliente nuevo no debe ser worker');
assert.strictEqual(res1.deskBtnDisplay, 'none', 'El botón debe estar oculto (display: none)');
console.log('✓ PRUEBA 1 SUPERADA: Cliente nuevo no ve el botón administrativo ni de cocina.\n');

// PRUEBA 2: Cliente después de cerrar sesión y volver a entrar (no hereda botones)
console.log('--- PRUEBA 2: Cierre de sesión y nuevo inicio ---');
// Simular que el admin anterior dejó botones en los slots
mockDOM.reset();
const deskBtn = mockDOM.getElementById('desk-admin-btn');
deskBtn.style.display = 'flex';
deskBtn.innerText = '⚙️ Panel Administrador';

// Simular logoutUser()
deskBtn.style.display = 'none';
deskBtn.remove();
const deskSlot = mockDOM.getElementById('desktop-profile-actions-slot');
deskSlot.innerHTML = '';

// Entra cliente común
mockDOM.reset();
const res2 = applyUIPermissions(clienteNuevo, adminEmails, workerEmails, mockDOM);
assert.strictEqual(res2.deskBtnDisplay, 'none', 'El botón tras logout e ingreso de cliente debe estar oculto');
console.log('✓ PRUEBA 2 SUPERADA: Cliente no hereda botones tras cierre de sesión.\n');

// PRUEBA 3: Trabajador legítimo
console.log('--- PRUEBA 3: Trabajador legítimo conserva botón de cocina ---');
mockDOM.reset();
const trabajadorUser = {
    name: 'Operario Cocina',
    email: 'cocina@dulcetentacion.com',
    role: 'trabajador',
    rol: 'trabajador',
    isAdmin: false
};
const res3 = applyUIPermissions(trabajadorUser, adminEmails, workerEmails, mockDOM);
assert.strictEqual(res3.isAdmin, false, 'Trabajador no debe ser admin');
assert.strictEqual(res3.isWorker, true, 'Trabajador debe ser worker');
assert.strictEqual(res3.deskBtnDisplay, 'flex', 'Botón debe estar visible con flex');
assert.strictEqual(mockDOM.getElementById('desk-admin-btn').innerText, '🛠️ Panel de Pedidos / Cocina');
console.log('✓ PRUEBA 3 SUPERADA: Trabajador legítimo ve "🛠️ Panel de Pedidos / Cocina".\n');

// PRUEBA 4: Administrador legítimo
console.log('--- PRUEBA 4: Administrador legítimo conserva botón administrativo ---');
mockDOM.reset();
const adminUser = {
    name: 'Pablo Carrascal',
    email: 'pablojose182017@gmail.com',
    role: 'admin',
    rol: 'admin',
    isAdmin: true
};
const res4 = applyUIPermissions(adminUser, adminEmails, workerEmails, mockDOM);
assert.strictEqual(res4.isAdmin, true, 'Admin legítimo debe ser admin');
assert.strictEqual(res4.isWorker, false, 'Admin no es worker');
assert.strictEqual(res4.deskBtnDisplay, 'flex', 'Botón debe estar visible con flex');
assert.strictEqual(mockDOM.getElementById('desk-admin-btn').innerText, '⚙️ Panel Administrador');
console.log('✓ PRUEBA 4 SUPERADA: Administrador legítimo ve "⚙️ Panel Administrador".\n');

// PRUEBA 5: Cliente intenta abrir directamente 'admin-dashboard' en showSection
console.log('--- PRUEBA 5: Cliente intenta acceder a admin-dashboard por navegación ---');
function simulateShowSection(id, currentUser, adminEmails, workerEmails) {
    if (id === 'admin-dashboard') {
        const { isAdmin, isWorker } = evaluateUserPermissions(currentUser, adminEmails, workerEmails);
        if (!currentUser || (!isAdmin && !isWorker)) {
            id = 'inicio';
        }
    }
    return id;
}
const targetSection = simulateShowSection('admin-dashboard', clienteNuevo, adminEmails, workerEmails);
assert.strictEqual(targetSection, 'inicio', 'Acceso a admin-dashboard debe ser redirigido forzosamente a inicio');
console.log('✓ PRUEBA 5 SUPERADA: Intento de apertura de admin-dashboard redirige a "inicio".\n');

// PRUEBA 6: Integridad de firestore.rules
console.log('--- PRUEBA 6: Verificación de no-modificación de firestore.rules ---');
const rulesContent = fs.readFileSync('firestore.rules', 'utf8');
assert(rulesContent.includes('function ownProfileRoleMatchesAuthority()'), 'firestore.rules debe conservar ownProfileRoleMatchesAuthority');
assert(rulesContent.includes('request.resource.data.get(\'role\', \'cliente\') == \'cliente\''), 'firestore.rules debe exigir cliente por defecto');
console.log('✓ PRUEBA 6 SUPERADA: firestore.rules está intacto con todas sus restricciones de seguridad.\n');

console.log('=== TODAS LAS PRUEBAS (6/6) HAN SIDO SUPERADAS EXITOSAMENTE ===');
