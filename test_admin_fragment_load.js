const fs = require('fs');
const assert = require('assert');

// Cargar el script a testear
const firebaseSyncCode = fs.readFileSync('./firebase-sync.js', 'utf8');

// Mock del entorno DOM y Window
global.window = {
    _adminFragmentLoaded: false,
    _adminFragmentLoading: false,
    currentUser: null,
    SUPER_ADMINS: ['super@admin.com'],
    fetchAdminAsset: async () => ({ text: async () => '<div id="protected-admin-actions"><button id="desk-admin-btn"></button><button id="desk-kitchen-btn"></button><button id="mob-admin-btn"></button><button id="mob-kitchen-btn"></button></div>' }),
    loadProtectedAdminScript: async () => {},
    syncUserUI: function() { this.syncUserUICalled = true; },
    syncUserUICalled: false,
    location: { search: '', hostname: 'localhost' },
    addEventListener: () => {}
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

global.localStorage = { getItem: () => null, setItem: () => {} };
global.console = { warn: () => {}, error: () => {}, log: () => {} };

global.firebase = {
    apps: [],
    initializeApp: () => {},
    auth: () => global.mockAuth,
    firestore: () => global.db,
    storage: () => ({})
};

global.mockAuth = {
    currentUser: null,
    onAuthStateChanged: (cb) => { global.authCallback = cb; }
};

global.db = {
    collection: () => ({ doc: () => ({ 
        get: async () => ({ exists: true, data: () => ({ points: 10, role: 'cliente' }) }),
        onSnapshot: () => {} 
    }) })
};

// Evaluar el código (solo las partes necesarias, se simulará onAuthStateChanged)
eval(firebaseSyncCode);

async function runTests() {
    console.log("Iniciando pruebas de regresión...");
    
    // PRUEBA 1: Autenticación no lista
    global.mockAuth.currentUser = null;
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
    window.syncUserUICalled = false;
    window.currentUser = { email: 'super@admin.com', points: 10, vip: false };
    // Disparar auth callback
    await global.authCallback({ email: 'super@admin.com', isAnonymous: false });
    assert.strictEqual(window.syncUserUICalled, true, "PRUEBA 3 FALLA: syncUserUI no fue llamado para el SuperAdmin.");
    console.log("✓ PRUEBA 3 SUPERADA: syncUserUI se llama para el SuperAdmin al confirmar Auth.");

    console.log("Todas las pruebas pasaron exitosamente.");
}

runTests().catch(console.error);
