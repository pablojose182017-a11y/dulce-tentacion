const fs = require('fs');
const assert = require('assert');

// Cargar el script a testear
const firebaseSyncCode = fs.readFileSync('./firebase-sync.js', 'utf8');

let storedData = {};
global.localStorage = {
    getItem: (key) => storedData[key] || null,
    setItem: (key, val) => { storedData[key] = String(val); },
    removeItem: (key) => { delete storedData[key]; }
};

// Mock del entorno DOM y Window
global.window = {
    _adminFragmentLoaded: false,
    _adminFragmentLoading: false,
    currentUser: null,
    SUPER_ADMINS: ['super@admin.com', 'pablojose182017@gmail.com'],
    fetchAdminAsset: async () => ({ text: async () => '<div id="protected-admin-actions"><button id="desk-admin-btn"></button><button id="desk-kitchen-btn"></button><button id="mob-admin-btn"></button><button id="mob-kitchen-btn"></button></div>' }),
    loadProtectedAdminScript: async () => {},
    syncUserUI: function() { this.syncUserUICalled = true; },
    _crRolesApplyUI: function() { this._crRolesApplyUICalled = true; },
    syncUserUICalled: false,
    _crRolesApplyUICalled: false,
    location: { search: '', hostname: 'localhost' },
    addEventListener: (evt, cb) => {
        if (evt === 'DOMContentLoaded') global.domContentLoadedCb = cb;
    }
};

global.document = {
    getElementById: (id) => {
        if (id === 'admin-mount-point') return {
            innerHTML: '',
            querySelector: (sel) => {
                if (sel === '#protected-admin-actions') return {
                    querySelector: () => ({}),
                    remove: () => {}
                };
            }
        };
        if (id.includes('actions-slot')) return { appendChild: () => {} };
        return null;
    },
    querySelector: () => null,
    createElement: () => ({ dataset: {} }),
    head: { appendChild: () => {} }
};

const origConsole = console;
global.console = { warn: (...args) => origConsole.warn(...args), error: (...args) => origConsole.error(...args), log: (...args) => origConsole.log(...args) };

global.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => '<div id="protected-admin-actions"><button id="desk-admin-btn"></button><button id="desk-kitchen-btn"></button><button id="mob-admin-btn"></button><button id="mob-kitchen-btn"></button></div>'
});

global.authListeners = [];
global.mockAuth = {
    currentUser: null,
    signInAnonymouslyCalled: false,
    signInAnonymously: async () => {
        global.mockAuth.signInAnonymouslyCalled = true;
        return { user: { uid: 'guest-123', isAnonymous: true } };
    },
    onAuthStateChanged: (cb) => {
        global.authListeners.push(cb);
        global.authCallback = cb;
        return () => {
            const idx = global.authListeners.indexOf(cb);
            if (idx !== -1) global.authListeners.splice(idx, 1);
        };
    }
};

global.triggerAuthChange = async (user) => {
    global.mockAuth.currentUser = user;
    const listeners = [...global.authListeners];
    for (const cb of listeners) {
        if (typeof cb === 'function') await cb(user);
    }
};

global.firebase = {
    apps: [],
    initializeApp: () => {},
    auth: () => global.mockAuth,
    firestore: () => global.db,
    storage: () => ({})
};

const makeQuery = () => {
    const q = {
        doc: () => ({ 
            get: async () => ({ exists: true, data: () => ({ points: 10, role: 'cliente' }) }),
            onSnapshot: () => () => {} 
        }),
        orderBy: () => q,
        limit: () => q,
        where: () => q,
        onSnapshot: () => () => {}
    };
    return q;
};
global.db = { collection: makeQuery };

// Evaluar el código
eval(firebaseSyncCode);
if (global.domContentLoadedCb) global.domContentLoadedCb();

async function runTests() {
    console.log("Iniciando pruebas de regresión y condición de carrera...");
    
    // PRUEBA 1: Autenticación no lista sin usuario
    global.mockAuth.currentUser = null;
    window.currentUser = null;
    storedData = {};
    window._adminFragmentLoaded = false;
    window._adminFragmentLoading = false;
    await window.loadAdminHTMLFragment();
    assert.strictEqual(window._adminFragmentLoaded, false, "PRUEBA 1 FALLA: El fragmento se marcó como cargado sin autenticación.");
    assert.strictEqual(window._adminFragmentLoading, false, "PRUEBA 1 FALLA: Loading state inconsistente.");
    console.log("✓ PRUEBA 1 SUPERADA: El fragmento no se carga sin autenticación.");
    
    // PRUEBA 2: Reintento tras Auth exitoso
    global.mockAuth.currentUser = { isAnonymous: false };
    await window.loadAdminHTMLFragment();
    assert.strictEqual(window._adminFragmentLoaded, true, "PRUEBA 2 FALLA: No se pudo reintentar la carga del fragmento.");
    console.log("✓ PRUEBA 2 SUPERADA: Se puede reintentar la carga si las condiciones son válidas.");
    
    // PRUEBA 3: onAuthStateChanged con Super Admin
    window._adminFragmentLoaded = false;
    window.syncUserUICalled = false;
    window.currentUser = { email: 'super@admin.com', points: 10, vip: false };
    // Disparar auth callback
    await global.triggerAuthChange({ email: 'super@admin.com', isAnonymous: false });
    assert.strictEqual(window.syncUserUICalled, true, "PRUEBA 3 FALLA: syncUserUI no fue llamado para el SuperAdmin.");
    console.log("✓ PRUEBA 3 SUPERADA: syncUserUI se llama para el SuperAdmin al confirmar Auth.");

    // PRUEBA 4: NO llamar a signInAnonymously() si ya existe dt_user en localStorage
    storedData = { 'dt_user': JSON.stringify({ email: 'pablojose182017@gmail.com', name: 'Pablo' }) };
    global.mockAuth.signInAnonymouslyCalled = false;
    await global.triggerAuthChange(null);
    assert.strictEqual(global.mockAuth.signInAnonymouslyCalled, false, "PRUEBA 4 FALLA: signInAnonymously fue llamado existiendo sesión en localStorage.");
    console.log("✓ PRUEBA 4 SUPERADA: No se crea sesión anónima si existe sesión previa en localStorage.");

    // PRUEBA 5: NO llamar a signInAnonymously() si window._authLoginInProgress = true
    storedData = {};
    window._authLoginInProgress = true;
    global.mockAuth.signInAnonymouslyCalled = false;
    await global.triggerAuthChange(null);
    assert.strictEqual(global.mockAuth.signInAnonymouslyCalled, false, "PRUEBA 5 FALLA: signInAnonymously fue llamado durante login en progreso.");
    window._authLoginInProgress = false;
    console.log("✓ PRUEBA 5 SUPERADA: No se crea sesión anónima si hay un proceso de login en curso.");

    // PRUEBA 6: SuperAdmin (pablojose182017@gmail.com o UID JT7c41zATQNrhzvWL4CdQxCAiby1) carga inmediatamente el fragmento
    window._adminFragmentLoaded = false;
    window.syncUserUICalled = false;
    const superUser = { email: 'pablojose182017@gmail.com', uid: 'JT7c41zATQNrhzvWL4CdQxCAiby1', isAnonymous: false };
    await global.triggerAuthChange(superUser);
    assert.strictEqual(window._adminFragmentLoaded, true, "PRUEBA 6 FALLA: loadAdminHTMLFragment no fue completado para el SuperAdmin.");
    assert.strictEqual(window.syncUserUICalled, true, "PRUEBA 6 FALLA: syncUserUI no fue llamado tras autenticación de SuperAdmin.");
    console.log("✓ PRUEBA 6 SUPERADA: SuperAdmin por email/UID carga inmediatamente loadAdminHTMLFragment.");

    // PRUEBA 7: SuperAdmin por solo UID JT7c41zATQNrhzvWL4CdQxCAiby1
    window._adminFragmentLoaded = false;
    window.syncUserUICalled = false;
    const creatorUser = { email: '', uid: 'JT7c41zATQNrhzvWL4CdQxCAiby1', isAnonymous: false };
    await global.triggerAuthChange(creatorUser);
    assert.strictEqual(window._adminFragmentLoaded, true, "PRUEBA 7 FALLA: SuperAdmin por UID no cargó el fragmento.");
    console.log("✓ PRUEBA 7 SUPERADA: SuperAdmin por UID absoluto sin email también carga el fragmento.");

    console.log("\nTODAS las pruebas pasaron exitosamente sin errores.");
}

runTests().catch(err => {
    console.error("ERROR EN PRUEBAS:", err);
    process.exit(1);
});
