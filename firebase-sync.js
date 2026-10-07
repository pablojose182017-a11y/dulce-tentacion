/**
 * firebase-sync.js
 * Módulo de integración con Firebase Firestore para P&S Punto Dulce.
 * Sobreescribe funciones de script.js para agregar la persistencia en la nube
 * y sincronización en tiempo real sin modificar el código legacy directamente.
 */
window._adminModulesLoaded = false;
window._adminModulesLoading = false;
window.loadPhase2AdminModules = async function() {
    if (window._adminModulesLoaded || window._adminModulesLoading) return;
    window._adminModulesLoading = true;
    
    const scripts = [
        "https://cdn.jsdelivr.net/npm/chart.js",
        "costos-recetas.js?v=1",
        "ai-core/ai-store.js",
        "ai-core/ai-persistence.js",
        "ai-core/ai-hash.js",
        "ai-core/ai-knowledge.js",
        "ai-core/ai-security.js",
        "ai-core/ai-execution.js",
        "ai-core/ai-autonomous.js",
        "ai-core/ai-identity.js",
        "ai-core/ai-memory.js",
        "ai-core/ai-context.js",
        "ai-core/ai-provider.js",
        "ai-core/ai-legacy-rag-adapter.js",
        "ai-core/ai-reasoning.js",
        "ai-core/ai-personality.js",
        "ai-core/ai-offline-resolver.js",
        "ai-core/ai-web-fetcher.js",
        "ai-core/ai-ingestion.js",
        "ai-core/ai-investigation.js",
        "ai-core/ai-research-engine.js",
        "ai-core/ai-understanding.js",
        "ai-core/ai-semantic.js",
        "ai-core/ai-provenance.js",
        "ai-core/ai-retention.js",
        "ai-core/ai-connectivity.js",
        "ai-core/ai-cyber-defense.js",
        "ai-core/ai-owner-authority.js",
        "ai-core/ai-controlled-execution.js",
        "ai-core/ai-tests.js",
        "ai-core/ai-chat-bridge.js",
        "guardian-financiero.js?v=1"
    ];

    for (const src of scripts) {
        await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => { console.warn("Fallo al cargar", src); resolve(); };
            document.head.appendChild(script);
        });
    }
    
    window._adminModulesLoaded = true;
    window._adminModulesLoading = false;
};

// 1. Inicialización de Firebase
let firebaseConfig = {
    apiKey: "AIzaSyAXsUDZeDStUV1oqfBfHre84u4u9TxYr1E",
    authDomain: "ps-punto-dulce.firebaseapp.com",
    projectId: "ps-punto-dulce",
    storageBucket: "ps-punto-dulce.firebasestorage.app",
    messagingSenderId: "1058887587986",
    appId: "1:1058887587986:web:aa2b9db7f5d6b72f15ee4b",
    measurementId: "G-806J8JJ3VD"
};

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const urlParams = new URLSearchParams(window.location.search);
const useEmulator = urlParams.get('emulator') === 'true';

// NOTA: Se eliminó el bloqueo de localhost. Ahora la aplicación en desarrollo local 
// se conecta por defecto al proyecto real de Firebase (producción) usando la configuración original.
// Si se desea usar el emulador, aún se puede habilitar con ?emulator=true.
if (isLocalhost && useEmulator) {
    firebaseConfig.projectId = "demo-punto-dulce";
    firebaseConfig.apiKey = "fake-api-key-for-emulator";
    console.warn("⚠️ MODO EMULADOR ACTIVADO ⚠️");
}

// Evitar inicializar si ya existe
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;

if (isLocalhost && useEmulator) {
    db.useEmulator('127.0.0.1', 8080);
    if (auth) {
        auth.useEmulator('http://127.0.0.1:9099');
    }
}

window.db = db; // Expuesto globalmente para acceso desde script.js y otros módulos
console.log("Firebase Firestore y Auth inicializados.");

// --- CONFIGURACIÓN DINÁMICA GLOBAL (VIP) ---
window.vipConfig = { precioMensual: 20000 };
db.collection('configuracion').doc('vip').onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        if (data && data.precioMensual) {
            window.vipConfig.precioMensual = Number(data.precioMensual);
        }
    }
    // Formatear el precio para inyectarlo en la UI
    const formattedPrice = `$${window.vipConfig.precioMensual.toLocaleString('es-CO')} COP`;
    const promoEl = document.getElementById('uiVipPricePromo');
    const termsEl = document.getElementById('uiVipPriceTerms');
    if (promoEl) promoEl.innerText = formattedPrice;
    if (termsEl) termsEl.innerText = formattedPrice;
}, (error) => {
    console.warn("No se pudo escuchar configuración VIP:", error);
});

// --- CATÁLOGO PERSONALIZADO — TIEMPO REAL (top-level, igual que vipConfig) ---
// Definido aquí, fuera de DOMContentLoaded, para garantizar que el listener
// siempre se registre independientemente de lo que ocurra más tarde en el DOM.
(function initCatalogListener() {
    /**
     * Aplica un mapa de personalización de Firestore sobre el array global `products`.
     * Actualiza precios, nombres, imágenes, disponibilidad e inyecta productos custom.
     * Después de aplicar los cambios, solicita un re-render de los componentes afectados.
     * Si el DOM aún no está listo, difiere el render hasta DOMContentLoaded.
     *
     * @param {Object} customCatalog  - Mapa { [productId]: { price, name, img, agotado, ... } }
     */
    function applyCustomCatalog(customCatalog) {
        if (typeof products === 'undefined' || !customCatalog) return;

        // 1. Inyectar productos nuevos personalizados (isCustom)
        Object.keys(customCatalog).forEach(k => {
            const data = customCatalog[k];
            if (data.isCustom && !data.eliminado) {
                if (!products.find(x => String(x.id) === String(k))) {
                    const pPts = data.points !== undefined ? Number(data.points) : (data.puntos !== undefined ? Number(data.puntos) : 0);
                    products.push({
                        id: data.id || k,
                        name: data.name,
                        price: data.price,
                        cat: data.category,
                        img: data.img,
                        points: pPts,
                        puntos: pPts,
                        desc: data.desc || 'Producto fresco del día',
                        isCustom: true
                    });
                }
            }
        });

        // 2. Modificar existentes y procesar eliminaciones (iterando en reversa)
        for (let i = products.length - 1; i >= 0; i--) {
            const p = products[i];
            const customData = customCatalog[p.id] !== undefined ? customCatalog[p.id] : customCatalog[String(p.id)];
            if (customData !== undefined) {

                if (customData.eliminado) {
                    products.splice(i, 1);
                    continue;
                }

                if (!p.originalName) p.originalName = p.name;
                if (!p.originalImg && p.img && !p.img.startsWith('data:image/')) p.originalImg = p.img;

                if (customData.name) {
                    // Respetar badges de oferta en el nombre si los hay
                    const hasBadge = p.name.includes('[Promo:');
                    const badgePart = hasBadge ? p.name.substring(p.name.indexOf('[Promo:')) : '';
                    p.name = customData.name + (badgePart ? ' ' + badgePart : '');
                }
                if (customData.img) p.img = customData.img;
                if (customData.category) {
                    if (!p.originalCat) p.originalCat = p.cat;
                    p.cat = customData.category;
                }

                if (customData.price !== undefined) {
                    const newPrice = Number(customData.price);
                    if (p.enOferta) {
                        p.oldPrice = newPrice;
                        if (window.dtOfertasActivas && window.dtOfertasActivas[p.id]) {
                            window.dtOfertasActivas[p.id].precioOriginal = newPrice;
                            if (typeof window.saveOfertas === 'function') window.saveOfertas();
                        }
                    } else {
                        p.price = newPrice;
                    }
                }

                if (customData.points !== undefined || customData.puntos !== undefined) {
                    const pts = Number(customData.points !== undefined ? customData.points : customData.puntos);
                    p.points = pts;
                    p.puntos = pts;
                }

                // FIX B companion: write directly into window.stockConfig so
                // createCardHTML (script.js) always reads the correct object.
                if (customData.agotado !== undefined) {
                    if (typeof window.stockConfig !== 'undefined') {
                        window.stockConfig[p.id] = customData.agotado;
                    }
                }
            }
        }

        // Sincronizar localStorage (local-only — sin disparar escritura a Firestore)
        try {
            if (typeof window.stockConfig !== 'undefined') {
                localStorage.setItem('dt_stock_config', JSON.stringify(window.stockConfig));
            }
        } catch (e) { /* cuota de almacenamiento */ }

        // Re-renderizar — diferir si el DOM aún no está listo
        function doRender() {
            if (typeof renderProducts   === 'function') renderProducts();
            if (typeof renderFeatured   === 'function') renderFeatured();
            if (typeof renderStockAdmin === 'function') renderStockAdmin();
            if (typeof renderKitchenStock === 'function') renderKitchenStock();
        }

        if (document.readyState === 'loading') {
            // DOM no listo: diferir hasta DOMContentLoaded para evitar errores de render
            document.addEventListener('DOMContentLoaded', doRender, { once: true });
        } else {
            doRender();
        }
    }

    // Exponer para uso externo (tests, diagnóstico)
    window._applyCustomCatalog = applyCustomCatalog;

    // Aplicar inmediatamente desde localStorage (Offline First / instantáneo)
    try {
        const localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado'));
        if (localCatalog) applyCustomCatalog(localCatalog);
    } catch (e) { /* JSON malformado en localStorage */ }

    // Registrar onSnapshot exactamente una vez (cancelar suscripción previa si existía)
    if (typeof window.unsubCatalogo === 'function') {
        window.unsubCatalogo();
    }
    window.unsubCatalogo = db.collection('config').doc('catalogo_personalizado').onSnapshot(
        function(doc) {
            if (doc.exists) {
                const remoteCatalog = doc.data();
                try {
                    localStorage.setItem('dt_catalogo_personalizado', JSON.stringify(remoteCatalog));
                } catch (e) { /* cuota */ }
                applyCustomCatalog(remoteCatalog);
            }
        },
        function(err) {
            // El error se registra pero no se vuelve a suscribir automáticamente.
            // Firestore reconecta por sí solo en la mayoría de casos de red.
            console.warn('[catalogo_personalizado] onSnapshot error — code:', err.code, '|', err.message);
        }
    );
})();

// Función global para sincronizar el usuario activo de forma atómica en Cloud Firestore
// FIX: Lee Firestore primero para preservar el rol asignado por el admin.
// Solo asigna 'cliente' si el documento no existe aún (primera vez).
window.syncCurrentUserToCloud = async function(extraData = {}) {
    if (!window.currentUser || !window.currentUser.email) return;
    const email = (window.currentUser.email || '').toLowerCase().trim();
    const isSuper = (typeof window.SUPER_ADMINS !== 'undefined') ? window.SUPER_ADMINS.includes(email) : false;

    // Determinar el rol correcto: Super Admin siempre 'admin'.
    // Para el resto: consultar Firestore primero para respetar el rol asignado por el admin.
    // Solo si el documento no existe se usa el rol en memoria o 'cliente' por defecto.
    let rolFinal = isSuper ? 'admin' : (window.currentUser.role || window.currentUser.rol || 'cliente');
    try {
        const existingDoc = await db.collection("usuarios").doc(email).get();
        if (!isSuper && existingDoc.exists) {
            const existingData = existingDoc.data();
            const rolEnFirestore = existingData.rol || existingData.role;
            // Preservar el rol guardado en Firestore si es más privilegiado que 'cliente'
            if (rolEnFirestore && rolEnFirestore !== 'cliente') {
                rolFinal = rolEnFirestore;
                // Actualizar también el objeto en memoria para mantener coherencia
                window.currentUser.role = rolFinal;
                window.currentUser.rol = rolFinal;
                window.currentUser.isAdmin = (rolFinal === 'admin');
            }
        }
    } catch (readErr) {
        console.warn("syncCurrentUserToCloud: no se pudo leer el doc previo, se usará el rol en memoria.", readErr);
    }

    const payload = {
        nombre: window.currentUser.name || window.currentUser.nombre || email.split('@')[0],
        email: email,
        foto: window.currentUser.picture || window.currentUser.foto || "",
        rol: rolFinal,
        role: rolFinal,
        isAdmin: isSuper || (rolFinal === 'admin'),
        vip: !!(window.currentUser.vip || window.currentUser.isVip),
        isVip: !!(window.currentUser.vip || window.currentUser.isVip),
        points: (window.currentUser.points !== undefined && window.currentUser.points !== null) ? Number(window.currentUser.points) : 0,
        telefono: window.currentUser.phone || window.currentUser.telefono || "",
        direccion: window.currentUser.address || window.currentUser.direccion || "",
        estado: 'activo',
        blocked: false,
        ultimaSincronizacion: new Date().toISOString(),
        ...extraData
    };

    try {
        await db.collection("usuarios").doc(email).set(payload, { merge: true });
        console.log("✓ Usuario y puntos sincronizados permanentemente en Cloud Firestore:", email, payload.points, "pts | rol:", rolFinal);
    } catch (err) {
        console.error("Error al persistir usuario en Firestore:", err);
    }
};

// Login alternativo directo con Popup de Google vía Firebase Auth
window.loginWithGooglePopup = async function() {
    if (!auth) {
        alert("Firebase Auth no está listo. Por favor recarga la página.");
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    try {
        const result = await auth.signInWithPopup(provider);
        const fbUser = result.user;
        if (fbUser && fbUser.email) {
            const email = fbUser.email.toLowerCase().trim();
            const isSuper = (typeof window.SUPER_ADMINS !== 'undefined') ? window.SUPER_ADMINS.includes(email) : false;
            
            // Consultar datos previos en Firestore
            let pts = 15;
            let isVip = false;
            let role = isSuper ? 'admin' : 'cliente';
            try {
                const doc = await db.collection("usuarios").doc(email).get();
                if (doc.exists) {
                    const data = doc.data();
                    pts = (data.points !== undefined && data.points !== null) ? Number(data.points) : 15;
                    isVip = !!data.vip;
                    role = isSuper ? 'admin' : (data.role || data.rol || 'cliente');
                }
            } catch (e) {
                console.warn("Error leyendo Firestore en popup login:", e);
            }

            const userObj = {
                name: fbUser.displayName || email.split('@')[0],
                email: email,
                picture: fbUser.photoURL || '',
                points: pts,
                vip: isVip,
                isVip: isVip,
                role: role,
                isAdmin: isSuper || (role === 'admin'),
                blocked: false
            };

            window.currentUser = userObj;
            localStorage.setItem('dt_user', JSON.stringify(userObj));
            
            if (typeof window.saveUsersDB === 'function') window.saveUsersDB();
            if (typeof window.syncUserUI === 'function') window.syncUserUI();
            await window.syncCurrentUserToCloud();
            
            if (typeof window.showToast === 'function') {
                window.showToast(`¡Bienvenido, ${userObj.name}!`, '✨');
            }
            if (typeof closeAuthModal === 'function') closeAuthModal();
            return userObj;
        }
    } catch (err) {
        console.error("Error en loginWithGooglePopup:", err);
        if (err.code !== 'auth/popup-closed-by-user') {
            alert("Error al iniciar sesión con Google: " + (err.message || err.code));
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    // 2. Sincronización de Usuarios en la Nube con Credenciales GIS + Firebase Auth
    if (typeof handleCredentialResponse !== 'undefined') {
        const originalHandleCredentialResponse = window.handleCredentialResponse;
        window.handleCredentialResponse = async function(response) {
            // Llama a la lógica original (decodificación, guardado en db_users/localStorage, render)
            originalHandleCredentialResponse.apply(this, arguments);

            // Autenticar la sesión en Firebase Authentication con el ID Token de Google
            if (auth && response && response.credential) {
                try {
                    const googleCred = firebase.auth.GoogleAuthProvider.credential(response.credential);
                    if (auth.currentUser && auth.currentUser.isAnonymous) {
                        await auth.currentUser.linkWithCredential(googleCred).catch(async (e) => {
                            if (e.code === 'auth/credential-already-in-use') {
                                await auth.signInWithCredential(googleCred);
                            } else throw e;
                        });
                        console.log("✓ Cuenta autenticada/vinculada exitosamente con Google.");
                    } else {
                        await auth.signInWithCredential(googleCred);
                        console.log("✓ Firebase Auth autenticado con ID Token de Google.");
                    }
                } catch (authErr) {
                    console.warn("Aviso Firebase Auth:", authErr.message || authErr);
                }
            }

            // Sincronizar de inmediato el usuario activo con Firestore
            if (window.currentUser) {
                const email = (window.currentUser.email || '').toLowerCase().trim();
                // Si el usuario ya tenía puntos en Firestore, mantenerlos intactos
                try {
                    const doc = await db.collection("usuarios").doc(email).get();
                    if (doc.exists) {
                        const data = doc.data();
                        if (data.points !== undefined && data.points !== null) {
                            window.currentUser.points = Number(data.points);
                        }
                        if (data.vip !== undefined) {
                            window.currentUser.vip = !!data.vip;
                            window.currentUser.isVip = !!data.vip;
                        }
                        // FIX: Aplicar el rol guardado en Firestore para todos los usuarios
                        // (no solo para los que no son admin), respetando a los Super Admins.
                        if (!isSuper) {
                            const savedRole = data.rol || data.role;
                            if (savedRole) {
                                window.currentUser.role = savedRole;
                                window.currentUser.rol = savedRole;
                                window.currentUser.isAdmin = (savedRole === 'admin');
                            }
                        }
                        localStorage.setItem('dt_user', JSON.stringify(window.currentUser));
                        if (typeof window.syncUserUI === 'function') window.syncUserUI();
                    }
                } catch(e) {
                    console.warn("Error leyendo perfil previo:", e);
                }

                await window.syncCurrentUserToCloud({ ultimoIngreso: new Date().toISOString() });
            }
        };
    }

    // Enganche para sincronización automática de puntos en saveUser
    if (typeof window.saveUser === 'function') {
        const originalSaveUser = window.saveUser;
        window.saveUser = function() {
            originalSaveUser.apply(this, arguments);
            if (window.currentUser && window.currentUser.email && typeof window.syncCurrentUserToCloud === 'function') {
                window.syncCurrentUserToCloud();
            }
        };
    }

    // Enganche para cierre de sesión real en Firebase Auth
    if (typeof window.logoutUser === 'function') {
        const originalLogoutUser = window.logoutUser;
        window.logoutUser = function(e) {
            if (auth) {
                auth.signOut().catch(err => console.warn("Error en Firebase Auth signOut:", err));
            }
            originalLogoutUser.apply(this, arguments);
            if (typeof window.initAdminListener === 'function') window.initAdminListener();
        };
    }

    // --- LISTENER GLOBAL DE CLIENTE (FASE 1) ---
    let _globalClientOrdersUnsub = null;
    function initGlobalClientOrderListener(uid) {
        if (_globalClientOrdersUnsub) {
            _globalClientOrdersUnsub();
            _globalClientOrdersUnsub = null;
        }
        if (!uid) return;
        
        // Listener Global suscrito a pedidos activos (0 costo al navegar entre paneles)
        _globalClientOrdersUnsub = db.collection('pedidos')
            .where('ownerId', '==', uid)
            .where('estado', 'in', ['Pendiente', 'En preparación', 'En Camino'])
            .onSnapshot(snapshot => {
                let changed = false;
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'modified' || change.type === 'added') {
                        const newData = change.doc.data();
                        const nuevoEstado = newData.estado;
                        if (!nuevoEstado) return;
                        
                        if (!window.pedidosHistorial) window.pedidosHistorial = [];
                        const idx = window.pedidosHistorial.findIndex(hist => hist.id === newData.id || hist.idDoc === change.doc.id);
                        
                        let estadoPrevio = null;
                        if (idx !== -1) {
                            estadoPrevio = window.pedidosHistorial[idx].estado || window.pedidosHistorial[idx].status;
                            window.pedidosHistorial[idx] = { idDoc: change.doc.id, ...newData, status: nuevoEstado };
                        } else {
                            window.pedidosHistorial.push({ idDoc: change.doc.id, ...newData, status: nuevoEstado });
                        }
                        
                        const ESTADOS_NOTIFICABLES = ['En preparación', 'En Camino', 'Entregado'];
                        if (change.type === 'modified' && nuevoEstado !== estadoPrevio && ESTADOS_NOTIFICABLES.includes(nuevoEstado)) {
                            if (typeof window.showOrderStatusToast === 'function') {
                                window.showOrderStatusToast(newData.id || change.doc.id, nuevoEstado);
                            }
                        }
                        changed = true;
                    }
                });
                if (changed) {
                    if (typeof currentUser !== 'undefined' && currentUser) {
                        currentUser.history = window.pedidosHistorial.filter(p => p.ownerId === uid || p.email === currentUser.email);
                        if (typeof saveUser === 'function') saveUser();
                    }
                    const modalHistory = document.getElementById('modal-order-history');
                    if (modalHistory && (modalHistory.style.display === 'flex' || modalHistory.style.display === 'block')) {
                        if (typeof originalOpenOrderHistory === 'function') {
                            originalOpenOrderHistory(false);
                        }
                    }
                }
            }, err => console.warn('Error en global client listener:', err));
    }

    // Observador permanente del estado de autenticación (Firebase Auth onAuthStateChanged)
    // FIX: Restaura el rol completo (rol/role) desde Firestore al detectar sesión activa.
    // Esto evita que syncCurrentUserToCloud sobreescriba con el rol en caché local.
    if (auth) {
        auth.onAuthStateChanged(async (fbUser) => {
            if (!fbUser) {
                // FASE 5.9: Lazy Auth. No se crea identidad anónima automáticamente al navegar.
                return;
            }
            
            // Iniciar listener global para el usuario activo (Guest o Auth)
            initGlobalClientOrderListener(fbUser.uid);

            if (fbUser.isAnonymous) {
                console.log("Sesión de invitado activa:", fbUser.uid);
                return;
            }

            if (fbUser && fbUser.email) {
                const email = fbUser.email.toLowerCase().trim();
                const isSuper = (typeof window.SUPER_ADMINS !== 'undefined')
                    ? window.SUPER_ADMINS.includes(email)
                    : (email === 'pablojose182017@gmail.com' || email === 'dulcestentaciones2004@gmail.com');
                try {
                    const doc = await db.collection("usuarios").doc(email).get();
                    if (doc.exists) {
                        const data = doc.data();
                        if (window.currentUser && (window.currentUser.email || '').toLowerCase().trim() === email) {
                            let changed = false;

                            // Restaurar puntos
                            if (data.points !== undefined && data.points !== window.currentUser.points) {
                                window.currentUser.points = Number(data.points);
                                changed = true;
                            }

                            // Restaurar vip
                            if (data.vip !== undefined && data.vip !== window.currentUser.vip) {
                                window.currentUser.vip = !!data.vip;
                                window.currentUser.isVip = !!data.vip;
                                changed = true;
                            }

                            // FIX: Restaurar rol/role desde Firestore (nunca sobrescribir con 'cliente' si Firestore dice otra cosa)
                            if (!isSuper) {
                                const rolEnFirestore = data.rol || data.role;
                                if (rolEnFirestore && rolEnFirestore !== (window.currentUser.role || window.currentUser.rol)) {
                                    window.currentUser.role = rolEnFirestore;
                                    window.currentUser.rol = rolEnFirestore;
                                    window.currentUser.isAdmin = (rolEnFirestore === 'admin');
                                    changed = true;
                                    console.log("✓ onAuthStateChanged: rol restaurado desde Firestore:", email, rolEnFirestore);
                                }
                            }

                            if (changed) {
                                localStorage.setItem('dt_user', JSON.stringify(window.currentUser));
                                if (typeof window.syncUserUI === 'function') window.syncUserUI();
                            }
                        }
                    }
                } catch (err) {
                    console.warn("Error en onAuthStateChanged:", err);
                }
            }
        });
    }

    // --- LISTENER EN TIEMPO REAL: Solicitudes VIP ---
    // Escucha la colección 'solicitudes_vip' y notifica al panel admin en cualquier dispositivo.
    let solicitudesVipPrimeraCarga = true;
    db.collection('solicitudes_vip')
        .orderBy('timestamp', 'desc')
        .limit(20)
        .onSnapshot((snapshot) => {
            if (!solicitudesVipPrimeraCarga) {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const data = change.doc.data();
                        // Inyectar en el array de notificaciones local
                        const newNotif = {
                            id: data.id || ('notif_vip_' + Date.now()),
                            type: 'solicitud_vip',
                            title: '👑 Nueva Solicitud VIP',
                            message: `${data.message || (data.email || 'Cliente')}`,
                            time: 'Hace un momento',
                            read: false,
                            timestamp: data.timestamp || Date.now()
                        };
                        try {
                            let notifs = JSON.parse(localStorage.getItem('dt_notifications') || '[]');
                            notifs.unshift(newNotif);
                            if (notifs.length > 50) notifs = notifs.slice(0, 50);
                            localStorage.setItem('dt_notifications', JSON.stringify(notifs));
                        } catch(e) {}
                        // Actualizar UI del panel de notificaciones
                        if (typeof window.renderAdminNotifList === 'function') {
                            window.renderAdminNotifList();
                        }
                        // Sonar campana y mostrar toast
                        if (typeof window.sonarCampanaNuevoPedido === 'function') {
                            window.sonarCampanaNuevoPedido();
                        }
                        if (typeof showToast === 'function') {
                            showToast('👑 ¡Nueva Solicitud de Membresía VIP!');
                        }
                        console.log('✓ Solicitud VIP recibida en tiempo real:', data);
                    }
                });
            }
            solicitudesVipPrimeraCarga = false;
        }, (err) => {
            console.warn('Error escuchando solicitudes_vip:', err);
        });

    let usuariosQuery = db.collection("usuarios");
    try {
        let isPriv = false;
        let uEmail = null;
        const uStr = localStorage.getItem('dt_user');
        if (uStr) {
            const uObj = JSON.parse(uStr);
            uEmail = (uObj.email || '').toLowerCase().trim();
            const isSuper = (typeof window.SUPER_ADMINS !== 'undefined') ? window.SUPER_ADMINS.includes(uEmail) : (uEmail === 'pablojose182017@gmail.com' || uEmail === 'dulcestentaciones2004@gmail.com');
            if (isSuper || uObj.rol === 'admin' || uObj.rol === 'trabajador' || uObj.role === 'admin' || uObj.role === 'trabajador') {
                isPriv = true;
            }
        }
        if (!isPriv && uEmail) {
            usuariosQuery = db.collection("usuarios").where("email", "==", uEmail);
        } else if (!isPriv) {
            usuariosQuery = db.collection("usuarios").where("email", "==", "guest_no_match");
        }
    } catch(e) {}

    usuariosQuery.onSnapshot((snapshot) => {
        let firebaseUsers = [];
        snapshot.forEach(doc => {
            firebaseUsers.push(doc.data());
        });
        
        // Actualizar db_users y dt_registered_users localmente (fusionando en tiempo real)
        if (typeof db_users !== 'undefined') {
            let regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
            if (!Array.isArray(regUsers)) regUsers = [];
            let currentUserUpdated = false;

            firebaseUsers.forEach(fbUser => {
                const fbEmail = (fbUser.email || '').toLowerCase().trim();
                const isSuper = (typeof window.SUPER_ADMINS !== 'undefined') ? window.SUPER_ADMINS.includes(fbEmail) : (fbEmail === 'pablojose182017@gmail.com' || fbEmail === 'dulcestentaciones2004@gmail.com');
                if (isSuper) {
                    fbUser.rol = 'admin';
                    fbUser.role = 'admin';
                    fbUser.isAdmin = true;
                    fbUser.blocked = false;
                    fbUser.estado = 'activo';
                    if (typeof adminEmails !== 'undefined' && !adminEmails.includes(fbEmail)) {
                        adminEmails.push(fbEmail);
                    }
                    if (typeof workerEmails !== 'undefined') {
                        workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== fbEmail);
                    }
                } else {
                    const r = fbUser.role || fbUser.rol || 'cliente';
                    if (r === 'admin') {
                        if (typeof adminEmails !== 'undefined' && !adminEmails.includes(fbEmail)) adminEmails.push(fbEmail);
                        if (typeof workerEmails !== 'undefined') workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== fbEmail);
                    } else if (r === 'trabajador') {
                        if (typeof workerEmails !== 'undefined' && !workerEmails.includes(fbEmail)) workerEmails.push(fbEmail);
                        if (typeof adminEmails !== 'undefined') adminEmails = adminEmails.filter(e => (e || '').toLowerCase().trim() !== fbEmail);
                    } else {
                        if (typeof adminEmails !== 'undefined') adminEmails = adminEmails.filter(e => (e || '').toLowerCase().trim() !== fbEmail);
                        if (typeof workerEmails !== 'undefined') workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== fbEmail);
                    }
                }

                // Sincronizar en db_users
                const idx = db_users.findIndex(u => (u.email || '').toLowerCase().trim() === fbEmail);
                if (idx !== -1) {
                    db_users[idx] = { ...db_users[idx], ...fbUser };
                } else {
                    db_users.push(fbUser);
                }

                // Sincronizar en dt_registered_users
                const rIdx = regUsers.findIndex(u => (u.email || '').toLowerCase().trim() === fbEmail);
                if (rIdx !== -1) {
                    regUsers[rIdx] = { ...regUsers[rIdx], ...fbUser };
                } else {
                    regUsers.push(fbUser);
                }

                // Sincronizar en currentUser si es el usuario activo
                if (typeof currentUser !== 'undefined' && currentUser && (currentUser.email || '').toLowerCase().trim() === fbEmail) {
                    const updatedRole = isSuper ? 'admin' : (fbUser.role || fbUser.rol || currentUser.role || 'cliente');
                    const updatedIsVip = isSuper || !!(fbUser.isVip || fbUser.vip || (updatedRole === 'vip'));
                    const updatedVipStatus = fbUser.vipStatus || (updatedIsVip ? 'activo' : (currentUser.vipStatus || 'inactivo'));
                    const updatedPoints = (fbUser.points !== undefined && fbUser.points !== null) ? fbUser.points : currentUser.points;

                    currentUser.role = updatedRole;
                    currentUser.rol = updatedRole;
                    currentUser.isAdmin = isSuper || (updatedRole === 'admin');
                    currentUser.isVip = updatedIsVip;
                    currentUser.vip = updatedIsVip;
                    currentUser.vipStatus = updatedVipStatus;
                    currentUser.points = updatedPoints;
                    if (fbUser.blocked !== undefined) currentUser.blocked = !!fbUser.blocked;
                    currentUserUpdated = true;
                }
            });

            localStorage.setItem('dt_users_db', JSON.stringify(db_users));
            localStorage.setItem('dt_registered_users', JSON.stringify(regUsers));
            if (typeof saveAdminEmails === 'function') saveAdminEmails();
            try { localStorage.setItem('dt_worker_emails', JSON.stringify(workerEmails)); } catch(e){}

            if (currentUserUpdated) {
                localStorage.setItem('dt_user', JSON.stringify(currentUser));
                if (typeof window.syncUserUI === 'function') window.syncUserUI();
            }
            
            // Re-renderizar si estamos en la vista de admin de usuarios
            if (typeof renderAdminUsers === 'function') {
                renderAdminUsers();
            }
            if (typeof renderKitchenUsers === 'function') {
                renderKitchenUsers();
            }
            if (typeof renderLiveOrders === 'function') {
                renderLiveOrders();
            }
        }
    });


    // --- 1. GESTOR DE AUDIO SILENCIOSO Y SEGURO ---
    window.sonarCampanaNuevoPedido = function() {
        if (typeof window.playOrderAlert === 'function') {
            window.playOrderAlert();
        } else {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.8);
            } catch (e) {
                console.warn('Audio bloqueado hasta primer clic del usuario:', e);
            }
        }
    };

    // --- 2. LISTENER EN TIEMPO REAL (onSnapshot) PARA PEDIDOS ---
    let _adminOrderListenerUnsub = null;
    window.initAdminListener = function() {
        if (_adminOrderListenerUnsub) {
            _adminOrderListenerUnsub();
            _adminOrderListenerUnsub = null;
        }

        let isPrivileged = false;
        try {
            const uStr = localStorage.getItem('dt_user');
            if (uStr) {
                const uObj = JSON.parse(uStr);
                const uEmail = (uObj.email || '').toLowerCase().trim();
                const isSuper = (typeof window.SUPER_ADMINS !== 'undefined') ? window.SUPER_ADMINS.includes(uEmail) : (uEmail === 'pablojose182017@gmail.com' || uEmail === 'dulcestentaciones2004@gmail.com');
                if (isSuper || (uObj && (uObj.rol === 'admin' || uObj.rol === 'trabajador' || uObj.role === 'admin' || uObj.role === 'trabajador'))) {
                    isPrivileged = true;
                }
            } else if (typeof currentUser !== 'undefined' && currentUser) {
                const uEmail = (currentUser.email || '').toLowerCase().trim();
                const isSuper = (typeof window.SUPER_ADMINS !== 'undefined') ? window.SUPER_ADMINS.includes(uEmail) : (uEmail === 'pablojose182017@gmail.com' || uEmail === 'dulcestentaciones2004@gmail.com');
                if (isSuper || (currentUser.rol === 'admin' || currentUser.rol === 'trabajador' || currentUser.role === 'admin' || currentUser.role === 'trabajador')) {
                    isPrivileged = true;
                }
            }
        } catch(e) {}

        if (isPrivileged) {
            let primeraCarga = true;
            _adminOrderListenerUnsub = db.collection('pedidos')
                .orderBy('fechaISO', 'desc')
                .limit(25)
                .onSnapshot((snapshot) => {
                let hayNuevos = false;
                const pedidosRemotos = [];
                snapshot.forEach(doc => {
                    pedidosRemotos.push({ idDoc: doc.id, ...doc.data() });
                });

                // Detectar si entró un pedido nuevo después de la carga inicial
                if (!primeraCarga) {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            hayNuevos = true;
                            const data = change.doc.data();
                            const orderObj = { id: change.doc.id, ...data };
                            if (typeof window.recordNewOrderNotification === 'function') {
                                window.recordNewOrderNotification(orderObj, { playSound: false });
                            }
                        }
                    });
                    if (hayNuevos) {
                        if (typeof window.playOrderAlert === 'function') {
                            window.playOrderAlert();
                        } else if (typeof window.sonarCampanaNuevoPedido === 'function') {
                            window.sonarCampanaNuevoPedido();
                        }
                        if (typeof showToast === 'function') {
                            showToast('🔔 ¡Nuevo pedido recibido en la plataforma!');
                        }
                    }
                }
                primeraCarga = false;

                // Actualizar pedidosHistorial y refrescar vistas
                window.pedidosHistorial = pedidosRemotos;
                if (typeof pedidosHistorial !== 'undefined') {
                    try {
                        pedidosHistorial = pedidosRemotos;
                    } catch (e) {
                        console.warn("No se pudo sincronizar pedidosHistorial léxico:", e);
                    }
                }
                localStorage.setItem('dt_pedidos_historial', JSON.stringify(pedidosRemotos));
                if (typeof renderLiveOrders === 'function') renderLiveOrders();
                if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
                
                // Si el libro contable está abierto, actualizarlo también
                const modalContent = document.getElementById('contabilidad-detalle-content');
                if (modalContent && modalContent.innerHTML.includes('Libro Contable de Pedidos')) {
                    if (typeof abrirLibroContable === 'function') abrirLibroContable();
                }
            }, (err) => {
                console.error("Error al escuchar pedidos en tiempo real:", err);
            });
        } else {
            console.log("Listener de pedidos omitido para ahorrar cuota (Usuario sin privilegios).");
        }
    };
    window.initAdminListener();

    // --- 3. ACTUALIZACIÓN DE ESTADOS HACIA FIRESTORE (Interceptor global) ---
    const originalUpdateOrderStatus = window.updateOrderStatus;
    window.updateOrderStatus = function(orderId, nuevoEstado) {
        if(originalUpdateOrderStatus) originalUpdateOrderStatus(orderId, nuevoEstado);
        
        const pedido = window.pedidosHistorial.find(p => p.id === orderId || p.idDoc === orderId);
        if(pedido && pedido.idDoc) {
            db.collection('pedidos').doc(pedido.idDoc).update({ estado: nuevoEstado, status: nuevoEstado })
                .catch(err => console.error("Error actualizando estado en Firestore:", err));
        }
    };

    const originalUpdateOrderAbono = window.updateOrderAbono;
    window.updateOrderAbono = function(orderId, nuevoAbono, historialPagos = null) {
        if(originalUpdateOrderAbono) originalUpdateOrderAbono(orderId, nuevoAbono, historialPagos);
        
        const pedido = window.pedidosHistorial.find(p => p.id === orderId || p.idDoc === orderId);
        if(pedido && pedido.idDoc) {
            const updatePayload = { abono: nuevoAbono };
            if (historialPagos !== null) {
                updatePayload.historialPagos = historialPagos;
            }
            db.collection('pedidos').doc(pedido.idDoc).update(updatePayload)
                .catch(err => console.error("Error actualizando abono en Firestore:", err));
        }
    };

    // --- 4. CONSULTA DE ESTADOS PARA CLIENTES EN TIEMPO REAL (MIS PEDIDOS) ---
    const originalOpenOrderHistory = window.openOrderHistory;
    if (originalOpenOrderHistory) {
        window.openOrderHistory = function(fromProfile = false) {
            // Llamar a la función original para que abra el modal inmediatamente con los datos locales
            originalOpenOrderHistory(fromProfile);
            
            // FASE 1: Historial Bajo Demanda (sin listeners adicionales aquí)
            // Se invoca solo al abrir Mis Pedidos.
            if (typeof currentUser !== 'undefined' && currentUser && currentUser.email) {
                db.collection('pedidos')
                    .where('email', '==', currentUser.email)
                    .limit(20)
                    .get()
                    .then((snapshot) => {
                        const pedidosActualizados = snapshot.docs.map(doc => ({
                            idDoc: doc.id,
                            ...doc.data()
                        }));
                        
                        pedidosActualizados.forEach(p => {
                            if (p.estado) p.status = p.estado;
                        });
                        
                        // Ordenar cronológicamente (más recientes primero)
                        pedidosActualizados.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                        
                        currentUser.history = pedidosActualizados;
                        
                        if (!window.pedidosHistorial) window.pedidosHistorial = [];
                        pedidosActualizados.forEach(p => {
                            const idx = window.pedidosHistorial.findIndex(hist => hist.id === p.id);
                            if (idx !== -1) window.pedidosHistorial[idx] = p;
                            else window.pedidosHistorial.push(p);
                        });
                        
                        if (typeof saveUser === 'function') saveUser();
                        
                        const modalHistory = document.getElementById('modal-order-history');
                        if (modalHistory && (modalHistory.style.display === 'flex' || modalHistory.style.display === 'block')) {
                            if (typeof originalOpenOrderHistory === 'function') {
                                originalOpenOrderHistory(false);
                            }
                        }
                    })
                    .catch((error) => {
                        console.error("Error al obtener historial de pedidos del cliente:", error);
                    });
            } else if (auth && auth.currentUser && auth.currentUser.isAnonymous) {
                // Fallback temporal si no hay email (usamos ownerId)
                db.collection('pedidos')
                    .where('ownerId', '==', auth.currentUser.uid)
                    .limit(20)
                    .get()
                    .then((snapshot) => {
                        const pedidosActualizados = snapshot.docs.map(doc => ({
                            idDoc: doc.id,
                            ...doc.data()
                        }));
                        pedidosActualizados.forEach(p => { if (p.estado) p.status = p.estado; });
                        
                        pedidosActualizados.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                        
                        if (typeof currentUser !== 'undefined') {
                            currentUser.history = pedidosActualizados;
                        }
                        
                        if (!window.pedidosHistorial) window.pedidosHistorial = [];
                        pedidosActualizados.forEach(p => {
                            const idx = window.pedidosHistorial.findIndex(hist => hist.id === p.id);
                            if (idx !== -1) window.pedidosHistorial[idx] = p;
                            else window.pedidosHistorial.push(p);
                        });
                        
                        const modalHistory = document.getElementById('modal-order-history');
                        if (modalHistory && (modalHistory.style.display === 'flex' || modalHistory.style.display === 'block')) {
                            if (typeof originalOpenOrderHistory === 'function') {
                                originalOpenOrderHistory(false);
                            }
                        }
                    })
                    .catch(e => console.error(e));
            }
        };
    }

    // --- 5. INTERCEPTOR DUAL DE CHECKOUT (WHATSAPP + FIRESTORE + PUNTOS) ---
    let lazyAuthPromise = null;
    const originalSendOrder = window.sendOrder;
    if (originalSendOrder) {
        window.sendOrder = async function() {
            // 1. FASE 5.11.2: Contexto Síncrono - Abrir ventana de WhatsApp en blanco inmediatamente
            let whatsappWin = null;
            try {
                whatsappWin = window.open('about:blank', '_blank');
                if (whatsappWin) {
                    whatsappWin.document.write('<div style="font-family:sans-serif; padding:20px;">Procesando pedido y preparando WhatsApp...</div>');
                }
            } catch(e) {
                console.warn("No se pudo abrir la pestaña síncrona:", e);
            }

            // FASE 5.9: LAZY AUTH
            if (auth && !auth.currentUser) {
                if (!lazyAuthPromise) {
                    lazyAuthPromise = auth.signInAnonymously();
                }
                try {
                    await lazyAuthPromise;
                } catch (err) {
                    console.error("Error en Lazy Auth:", err);
                    alert("No se pudo iniciar la sesión de invitado para tu pedido. Verifica tu conexión.");
                    lazyAuthPromise = null;
                    if (whatsappWin && !whatsappWin.closed) whatsappWin.close();
                    return; // Detiene la creación del pedido
                }
                lazyAuthPromise = null;
            }

            // Validar que tengamos UID antes de proceder
            if (auth && (!auth.currentUser || !auth.currentUser.uid)) {
                alert("Error crítico: No se pudo obtener la identidad de Firebase para guardar el pedido.");
                if (whatsappWin && !whatsappWin.closed) whatsappWin.close();
                return;
            }

            // 2. FASE 5.11.2: Interceptor de window.open temporal
            const originalOpen = window.open;
            let overrideActive = true;
            let timeoutId = null;
            let capturedWhatsAppUrl = null;
            let resolveWhatsAppUrl = null;
            const whatsAppUrlPromise = new Promise(resolve => { resolveWhatsAppUrl = resolve; });

            const restoreOpen = () => {
                if (overrideActive) {
                    overrideActive = false;
                    window.open = originalOpen;
                    if (timeoutId) clearTimeout(timeoutId);
                }
            };

            window.open = function(url, target, features) {
                if (!overrideActive) return originalOpen.apply(this, arguments);

                // Si es la URL de WhatsApp generada por script.js, la capturamos
                if (url && (url.includes('wa.me') || url.includes('whatsapp'))) {
                    capturedWhatsAppUrl = url;
                    if (resolveWhatsAppUrl) resolveWhatsAppUrl(url);
                    return whatsappWin;
                } else {
                    return originalOpen.apply(this, arguments);
                }
            };

            // Timeout de seguridad: Si script.js nunca llama a window.open en 8s
            timeoutId = setTimeout(() => {
                if (overrideActive) {
                    restoreOpen();
                    if (whatsappWin && !whatsappWin.closed) {
                        whatsappWin.document.body.innerHTML = '<div style="font-family:sans-serif; padding:20px; color:red;">Hubo un error al conectar con WhatsApp.</div>';
                    }
                    console.warn("[WhatsApp Override] Timeout de seguridad de 8000ms alcanzado.");
                }
            }, 8000);

            const histLenBefore = typeof pedidosHistorial !== 'undefined' ? pedidosHistorial.length : 0;
            let cartBackup = null;
            try {
                cartBackup = (typeof cart !== 'undefined' && Array.isArray(cart)) ? JSON.parse(JSON.stringify(cart)) : null;
            } catch(e) {}
            
            // Ejecutar la función original que genera el ID, valida, abre WhatsApp y vacía el carrito
            try {
                originalSendOrder.apply(this, arguments);
            } catch (err) {
                restoreOpen();
                if (whatsappWin && !whatsappWin.closed) whatsappWin.close();
                throw err;
            }
            
            // Si el pedido se generó, el historial local habrá crecido
            if (typeof pedidosHistorial !== 'undefined') {
                if (pedidosHistorial.length === histLenBefore) {
                    // La validación original de script.js falló (ej. falta nombre, carrito vacío)
                    restoreOpen();
                    if (whatsappWin && !whatsappWin.closed) whatsappWin.close();
                    return; // No hubo pedido, salimos sin hacer nada en Firebase
                }
                
                const nuevoPedido = pedidosHistorial[pedidosHistorial.length - 1];
                const initialId = nuevoPedido.id;
                let currentOrderId = initialId;
                
                // Estandarizar fechas para el monitor
                if (!nuevoPedido.fechaISO) {
                    nuevoPedido.fechaISO = nuevoPedido.timestamp 
                        ? new Date(nuevoPedido.timestamp).toISOString() 
                        : new Date().toISOString();
                }
                if (!nuevoPedido.estado) nuevoPedido.estado = 'Pendiente';
                if (typeof nuevoPedido.abono === 'undefined') nuevoPedido.abono = 0;
                
                // FASE 1 & 2A: Inyectar ownerId y Claim Secret para invitados
                let anonymousSecret = null;
                if (auth && auth.currentUser) {
                    nuevoPedido.ownerId = auth.currentUser.uid;
                    if (auth.currentUser.isAnonymous) {
                        const array = new Uint32Array(4);
                        window.crypto.getRandomValues(array);
                        anonymousSecret = Array.from(array, dec => dec.toString(16).padStart(8, '0')).join('');
                        nuevoPedido.claimSecret = anonymousSecret;
                        try {
                            let secrets = JSON.parse(localStorage.getItem('dt_claim_secrets') || '{}');
                            secrets[currentOrderId] = anonymousSecret;
                            localStorage.setItem('dt_claim_secrets', JSON.stringify(secrets));
                        } catch(e) { console.warn("No se pudo guardar claimSecret"); }
                    }
                }
                
                // ESCRITURA SEGURA EN FIRESTORE CON PROTECCIÓN ANTI-COLISIÓN (Reintentos acotados a 3)
                let writeSuccess = false;
                let lastError = null;
                const MAX_ATTEMPTS = 3;

                for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                    try {
                        nuevoPedido.id = currentOrderId;
                        nuevoPedido.idDoc = currentOrderId;

                        await db.collection('pedidos').doc(currentOrderId).set(nuevoPedido);
                        writeSuccess = true;
                        console.log(`[Checkout] Pedido ${currentOrderId} guardado en Firestore con éxito (intento ${attempt}).`);
                        break;
                    } catch (err) {
                        lastError = err;
                        console.warn(`[Checkout] Error al guardar pedido ${currentOrderId} en Firestore (intento ${attempt}):`, err);

                        const isPermissionDenied = err && (err.code === 'permission-denied' || (err.message && err.message.includes('permission-denied')));
                        const isCreationCollision = isPermissionDenied &&
                            auth && auth.currentUser && auth.currentUser.uid &&
                            nuevoPedido.ownerId === auth.currentUser.uid &&
                            nuevoPedido.estado === 'Pendiente';

                        if (isCreationCollision && attempt < MAX_ATTEMPTS) {
                            const oldId = currentOrderId;
                            const newId = (typeof window.generateSecureOrderId === 'function')
                                ? window.generateSecureOrderId()
                                : ('DT-' + String(new Date().getFullYear()).slice(-2) + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase());

                            console.warn(`[Checkout] Colisión de ID detectada para ${oldId}. Regenerando a ${newId}...`);
                            currentOrderId = newId;
                            continue;
                        } else {
                            break;
                        }
                    }
                }

                // SI LA CREACIÓN EN FIRESTORE FALLÓ: No abrir WhatsApp ni engañar al cliente
                if (!writeSuccess) {
                    restoreOpen();
                    if (timeoutId) clearTimeout(timeoutId);
                    if (whatsappWin && !whatsappWin.closed) whatsappWin.close();

                    // Revertir pedido local no guardado de pedidosHistorial
                    if (typeof pedidosHistorial !== 'undefined' && Array.isArray(pedidosHistorial)) {
                        const pIdx = pedidosHistorial.findIndex(p => p.id === initialId || p.id === currentOrderId);
                        if (pIdx !== -1) {
                            pedidosHistorial.splice(pIdx, 1);
                            if (typeof savePedidosHistorial === 'function') savePedidosHistorial();
                        }
                    }

                    // Revertir en currentUser.history si aplica
                    if (typeof currentUser !== 'undefined' && currentUser && Array.isArray(currentUser.history)) {
                        const uIdx = currentUser.history.findIndex(p => p.id === initialId || p.id === currentOrderId);
                        if (uIdx !== -1) {
                            currentUser.history.splice(uIdx, 1);
                            if (typeof saveUsersDB === 'function') saveUsersDB();
                            if (typeof saveUser === 'function') saveUser();
                        }
                    }

                    // Restaurar carrito si se había vaciado
                    if (cartBackup && cartBackup.length > 0 && typeof cart !== 'undefined' && cart.length === 0) {
                        cart = cartBackup;
                        if (typeof saveCart === 'function') saveCart();
                        if (typeof updateCart === 'function') updateCart();
                    }

                    alert("No se pudo registrar tu pedido en el servidor. Por favor verifica tu conexión a internet e intenta nuevamente.");
                    return;
                }

                // SI HUBO REGENERACIÓN DE ID POR COLISIÓN: Sincronizar todas las referencias
                if (currentOrderId !== initialId) {
                    nuevoPedido.id = currentOrderId;
                    nuevoPedido.idDoc = currentOrderId;

                    if (typeof savePedidosHistorial === 'function') savePedidosHistorial();

                    if (typeof currentUser !== 'undefined' && currentUser && Array.isArray(currentUser.history)) {
                        const hOrder = currentUser.history.find(p => p.id === initialId || p.id === currentOrderId);
                        if (hOrder) {
                            hOrder.id = currentOrderId;
                            hOrder.idDoc = currentOrderId;
                            if (typeof saveUsersDB === 'function') saveUsersDB();
                            if (typeof saveUser === 'function') saveUser();
                        }
                    }

                    if (anonymousSecret) {
                        try {
                            let secrets = JSON.parse(localStorage.getItem('dt_claim_secrets') || '{}');
                            delete secrets[initialId];
                            secrets[currentOrderId] = anonymousSecret;
                            localStorage.setItem('dt_claim_secrets', JSON.stringify(secrets));
                        } catch(e) {}
                    }

                    try {
                        let notifs = JSON.parse(localStorage.getItem('dt_notifications') || '[]');
                        let nMod = false;
                        notifs.forEach(n => {
                            if (n.orderId === initialId || (n.title && n.title.includes(initialId))) {
                                n.orderId = currentOrderId;
                                n.title = `Nuevo Pedido #${currentOrderId}`;
                                nMod = true;
                            }
                        });
                        if (nMod) localStorage.setItem('dt_notifications', JSON.stringify(notifs));

                        let alerts = JSON.parse(localStorage.getItem('dt_live_alerts') || '[]');
                        let aMod = false;
                        alerts.forEach(a => {
                            if (a.title && a.title.includes(initialId)) {
                                a.title = `🛍️ Nuevo Pedido #${currentOrderId}`;
                                aMod = true;
                            }
                        });
                        if (aMod) localStorage.setItem('dt_live_alerts', JSON.stringify(alerts));
                        if (typeof renderNotificationBell === 'function') renderNotificationBell();
                    } catch(e) {}
                }

                // ESPERAR Y REDIRIGIR WHATSAPP SOLO TRAS CONFIRMACIÓN EXITOSA EN FIRESTORE
                let targetUrl = capturedWhatsAppUrl;
                if (!targetUrl) {
                    try {
                        targetUrl = await Promise.race([
                            whatsAppUrlPromise,
                            new Promise(res => setTimeout(() => res(null), 2500))
                        ]);
                    } catch(e) {}
                }

                if (currentOrderId !== initialId && targetUrl) {
                    targetUrl = targetUrl
                        .split(encodeURIComponent(initialId)).join(encodeURIComponent(currentOrderId))
                        .split(initialId).join(currentOrderId);
                }

                restoreOpen();

                if (targetUrl) {
                    if (whatsappWin && !whatsappWin.closed) {
                        whatsappWin.location.href = targetUrl;
                    } else {
                        originalOpen(targetUrl, '_blank');
                    }
                }
                  
                // SEGUNDO (INDEPENDIENTE): Registrar puntos ganados en Firestore
                // ⚠️ Encapsulado en try/catch: cualquier fallo aquí NO bloquea WhatsApp
                try {
                    const userEmail = (typeof currentUser !== 'undefined' && currentUser && currentUser.email)
                        ? currentUser.email : null;
                    
                    const ptsGanados = (typeof window.calcularPuntosPedido === 'function' && typeof currentUser !== 'undefined')
                        ? window.calcularPuntosPedido(nuevoPedido, currentUser)
                        : 0;
                    
                    if (userEmail && ptsGanados > 0 && typeof window.registrarMovimientoPuntos === 'function') {
                        window.registrarMovimientoPuntos(userEmail, {
                            tipo: 'ganancia',
                            cantidad: ptsGanados,
                            motivo: `Compra completada (${nuevoPedido.id})`,
                            orderId: nuevoPedido.id
                        });
                    }
                } catch (pErr) {
                    console.warn('[Puntos] Error no crítico al registrar puntos:', pErr);
                }
                  
                // Refrescar monitor si está visible
                if (typeof renderLiveOrders === 'function') {
                    renderLiveOrders();
                }
            }
        };
    }

    // --- 6. CORRECCIÓN DEL FILTRO DE FECHAS EN EL MONITOR ---
    const originalFilterLiveOrders = window.renderLiveOrders;
    if (originalFilterLiveOrders) {
        window.renderLiveOrders = function() {
            if (typeof window.pedidosHistorial !== 'undefined' && Array.isArray(window.pedidosHistorial)) {
                window.pedidosHistorial.forEach(p => {
                    // Si el pedido no tiene timestamp pero sí fechaISO o date, lo generamos para que el filtro de contabilidad.js no lo ignore
                    if (!p.timestamp) {
                        if (p.fechaISO) {
                            p.timestamp = new Date(p.fechaISO).getTime();
                        } else if (p.date) {
                            // Intento parsear "18/9/2026, 12:00:00" a timestamp
                            const parts = p.date.split(',')[0].split('/');
                            if(parts.length === 3) p.timestamp = new Date(`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}T00:00:00`).getTime();
                        }
                    }
                });
            }
            originalFilterLiveOrders.apply(this, arguments);
        };
    }

    // --- 7. SANEAMIENTO DE DOM (ETIQUETAS FLOTANTES DESFASADAS) ---
    // Movemos los elementos huérfanos al root del body y aplicamos estilos estrictos
    setTimeout(() => {
        const notif = document.getElementById('orderToast');
        if (notif) document.body.appendChild(notif);
        
        const footer = document.querySelector('footer');
        if (footer) document.body.appendChild(footer);
        
        const fixStyle = document.createElement('style');
        fixStyle.innerHTML = `
            /* Ocultar toast de nuevo pedido fantasma si no está activo */
            #orderToast:not(.show) { display: none !important; }
            
            /* Asegurar que el footer no flote a la izquierda y se quede abajo */
            footer {
                width: 100% !important;
                clear: both !important;
                position: relative !important;
                margin-top: 40px !important;
            }
        `;
        document.head.appendChild(fixStyle);
    }, 1500);

    // --- 8. AUTO-CARGA DE "PEDIDOS DE HOY" AL ENTRAR AL MONITOR ---
    const originalCambiarPestana = window.cambiarPestanaAdmin;
    if (originalCambiarPestana) {
        window.cambiarPestanaAdmin = async function(tabId) {
            if (tabId === 'costos' && typeof window.loadPhase2AdminModules === 'function') {
                const btnCostos = document.getElementById('admin-tab-btn-costos');
                const origText = btnCostos ? btnCostos.innerText : '';
                if (btnCostos) btnCostos.innerText = '⏳ Cargando...';
                await window.loadPhase2AdminModules();
                if (btnCostos) btnCostos.innerText = origText;
                
                if (typeof window.cambiarSubtabCostos === 'function') {
                    window.cambiarSubtabCostos('insumos');
                }
            }
            originalCambiarPestana.apply(this, arguments);
            if (tabId === 'pedidos') {
                const dateInput = document.getElementById('orderDateFilter');
                if (dateInput && !dateInput.value) {
                    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                    const today = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
                    dateInput.value = today;
                    
                    // Disparar el evento change para que script.js aplique el filtro interno
                    const event = new Event('change');
                    dateInput.dispatchEvent(event);
                    
                    if (typeof renderLiveOrders === 'function') {
                        renderLiveOrders();
                    }
                }
            }
        };
    }

    // --- 9. SINCRONIZACIÓN DE CATÁLOGO PERSONALIZADO ---
    // NOTA: applyCustomCatalog y onSnapshot han sido movidos al ámbito global (top-level)
    // justo después del listener de vipConfig, para garantizar que siempre se registren.
    // Ver la función initCatalogListener() definida más arriba en este mismo archivo.

    // --- SINCRONIZACIÓN DE RECOMPENSAS CLUB VIP & PUNTOS ---
    try {
        const localRewards = JSON.parse(localStorage.getItem('dt_point_rewards'));
        if (localRewards && Array.isArray(localRewards) && localRewards.length > 0) {
            window.pointRewards = localRewards;
            if (typeof pointRewards !== 'undefined') pointRewards = localRewards;
            if (typeof renderRewards === 'function') renderRewards();
        }
    } catch(e) {}

    db.collection('config').doc('point_rewards').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data && Array.isArray(data.rewards)) {
                window.pointRewards = data.rewards;
                if (typeof pointRewards !== 'undefined') pointRewards = data.rewards;
                localStorage.setItem('dt_point_rewards', JSON.stringify(data.rewards));
                if (typeof renderRewards === 'function') renderRewards();
            }
        }
    }, err => console.warn("Aviso Firestore point_rewards:", err));

    // --- SINCRONIZACIÓN DE TORTAS PERSONALIZADAS ---
    db.collection('config').doc('tortas_config').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            window.dt_tortas_config = typeof window.asegurarEstructuraTortasConfig === 'function' ? window.asegurarEstructuraTortasConfig(data) : data;
            localStorage.setItem('dt_tortas_config', JSON.stringify(window.dt_tortas_config));
            if (typeof window.renderConfigTortasPublica === 'function') {
                window.renderConfigTortasPublica();
            }
            if (document.getElementById('modal-config-tortas') && document.getElementById('modal-config-tortas').style.display !== 'none') {
                if (typeof window.renderModalConfigTortasInterno === 'function') {
                    window.renderModalConfigTortasInterno();
                }
            }
        }
    }, err => {
        console.warn("Error escuchando tortas_config:", err);
    });

    // --- SINCRONIZACIÓN DE PROMO REGALO ---
    window.renderPromoBanner = function() {
        let banner = document.getElementById('dt-promo-banner');
        const conf = window.dt_promo_regalo;
        
        if (!conf || !conf.activa) {
            if (banner) banner.style.display = 'none';
            return;
        }
        
        const giftProduct = typeof products !== 'undefined' ? products.find(p => p.id == conf.productoId) : null;
        if (!giftProduct) return;
        
        const nombrePromo = conf.nombrePromo || 'Promoción Especial';
        
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'dt-promo-banner';
            // Insertar debajo del hero o del navbar
            const target = document.querySelector('.hero') || document.querySelector('header') || document.body.firstChild;
            if (target && target.parentNode) {
                target.parentNode.insertBefore(banner, target.nextSibling);
            } else {
                document.body.prepend(banner);
            }
        }
        
        banner.style.display = 'block';
        banner.style.background = 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 100%)';
        banner.style.color = '#fff';
        banner.style.padding = '12px 20px';
        banner.style.textAlign = 'center';
        banner.style.fontSize = '14px';
        banner.style.position = 'relative';
        banner.style.zIndex = '999';
        banner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        
        banner.innerHTML = `
            <span style="display:inline-block; max-width:90%;">🎁 <strong>${nombrePromo}:</strong> ¡Por compras superiores a $${conf.montoMinimo.toLocaleString()} lleva ${conf.cantidad}x ${giftProduct.name} totalmente GRATIS!</span>
            <button onclick="document.getElementById('dt-promo-banner').style.display='none'" style="position:absolute; right:15px; top:50%; transform:translateY(-50%); background:none; border:none; color:#fff; font-size:18px; cursor:pointer;">✕</button>
        `;
    };

    db.collection('config').doc('promocion_regalo').onSnapshot(doc => {
        if (doc.exists) {
            window.dt_promo_regalo = doc.data();
            localStorage.setItem('dt_promo_regalo', JSON.stringify(window.dt_promo_regalo));
            if (typeof updateCart === 'function') updateCart();
            if (typeof window.renderPromoBanner === 'function') window.renderPromoBanner();
            if (typeof window.renderAdminPromoCard === 'function') window.renderAdminPromoCard();
        }
    }, err => console.warn("Error escuchando promocion_regalo:", err));

    db.collection('config').doc('tienda').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.minFreeDelivery !== undefined) {
                window.dt_min_free_delivery = data.minFreeDelivery;
                if (typeof updateCart === 'function') updateCart();
            }
        }
    }, err => console.warn("Error escuchando config tienda:", err));

    db.collection('config').doc('ofertas_activas').onSnapshot(doc => {
        if (doc.exists) {
            window.dtOfertasActivas = doc.data();
            localStorage.setItem('dt_ofertas_activas', JSON.stringify(window.dtOfertasActivas));
            
            if (typeof products !== 'undefined') {
                products.forEach(p => {
                    // Restaurar todo producto primero por si se eliminó una oferta en otra pestaña
                    if (p.oldPrice) p.price = p.oldPrice;
                    if (p.originalName) p.name = p.originalName;
                    delete p.oldPrice;
                    delete p.enOferta;
                    delete p.tag;
                    
                    // Reaplicar las ofertas que sí existen en la fuente remota
                    if (window.dtOfertasActivas[p.id]) {
                        if (!p.originalName) p.originalName = p.name;
                        p.oldPrice = window.dtOfertasActivas[p.id].precioOriginal;
                        
                        if (window.dtOfertasActivas[p.id].porcentaje && window.dtOfertasActivas[p.id].porcentaje > 0) {
                            p.price = Math.round(p.oldPrice * (1 - (window.dtOfertasActivas[p.id].porcentaje / 100)));
                            window.dtOfertasActivas[p.id].precioOferta = p.price; // Sincronizar en memoria por si acaso
                        } else {
                            p.price = window.dtOfertasActivas[p.id].precioOferta;
                        }
                        
                        p.enOferta = true;
                        if (window.dtOfertasActivas[p.id].badgePromo) {
                            p.tag = window.dtOfertasActivas[p.id].badgePromo;
                            p.name = `${p.originalName} [Promo: ${window.dtOfertasActivas[p.id].badgePromo}]`;
                        }
                    }
                });
            }
            
            if (typeof window.renderAdminOfertasActivas === 'function') window.renderAdminOfertasActivas();
            if (typeof renderProducts === 'function') renderProducts();
            if (typeof renderFeatured === 'function') renderFeatured();
            if (typeof renderStockAdmin === 'function') renderStockAdmin();
        }
    }, err => console.warn("Error escuchando ofertas_activas:", err));

    // INTERCEPCIÓN DEL CARRITO PARA INYECTAR REGALO (Sin tocar script.js)
    if (typeof window.updateCart === 'function') {
        const originalUpdateCart = window.updateCart;
        window.updateCart = function() {
            if (typeof cart !== 'undefined' && window.dt_promo_regalo) {
                const conf = window.dt_promo_regalo;
                // Filtrar el carrito quitando regalos previos para calcular subtotal real
                const realItems = cart.filter(item => !item.isPromoGift);
                let subtotal = 0;
                realItems.forEach(item => {
                    subtotal += (item.price * item.qty);
                });

                if (conf.activa && subtotal >= conf.montoMinimo && conf.productoId) {
                    const giftExists = cart.find(item => item.isPromoGift);
                    const nombrePromo = conf.nombrePromo || 'Promo Especial';
                    const giftProduct = typeof products !== 'undefined' ? products.find(p => p.id == conf.productoId) : null;
                    
                    if (!giftExists) {
                        if (giftProduct) {
                            cart.push({
                                id: 'promo-gift-' + Date.now(),
                                name: `🎁 CORTESÍA (${nombrePromo}): ${giftProduct.name}`,
                                price: 0,
                                qty: conf.cantidad || 1,
                                isPromoGift: true
                            });
                        }
                    } else {
                        // Actualizar cantidad y nombre por si el admin cambió la config
                        if (giftProduct) {
                            giftExists.name = `🎁 CORTESÍA (${nombrePromo}): ${giftProduct.name}`;
                            giftExists.qty = conf.cantidad || 1;
                        }
                    }
                } else {
                    // Remover regalos si no cumple el mínimo o si se desactivó
                    for (let i = cart.length - 1; i >= 0; i--) {
                        if (cart[i].isPromoGift) {
                            cart.splice(i, 1);
                        }
                    }
                }
            }
            
            const res = originalUpdateCart.apply(this, arguments);
            
            // LÓGICA DEL MOTIVADOR
            if (typeof cart !== 'undefined' && window.dt_promo_regalo && window.dt_promo_regalo.activa && document.getElementById('cartModal')) {
                const conf = window.dt_promo_regalo;
                const realItems = cart.filter(item => !item.isPromoGift);
                let subtotal = 0;
                realItems.forEach(item => {
                    subtotal += (item.price * item.qty);
                });
                
                let motivator = document.getElementById('dt-cart-motivator');
                const cartContainer = document.getElementById('cart-items-container');
                
                if (subtotal > 0 && subtotal < conf.montoMinimo) {
                    if (!motivator) {
                        motivator = document.createElement('div');
                        motivator.id = 'dt-cart-motivator';
                        if (cartContainer) {
                            cartContainer.parentNode.insertBefore(motivator, cartContainer.nextSibling);
                        }
                    }
                    const faltante = conf.montoMinimo - subtotal;
                    const porcentaje = Math.min(100, Math.round((subtotal / conf.montoMinimo) * 100));
                    motivator.innerHTML = `
                        <div style="background:#fdf2f8; border:1px solid #fbcfe8; border-radius:10px; padding:12px; margin:15px 0; text-align:center;">
                            <p style="margin:0 0 8px 0; color:#db2777; font-size:13px; font-weight:bold;">¡Te faltan $${faltante.toLocaleString()} para recibir tu regalo de cortesía 🎁!</p>
                            <div style="width:100%; background:#fce7f3; height:8px; border-radius:4px; overflow:hidden;">
                                <div style="width:${porcentaje}%; background:linear-gradient(90deg, #ec4899 0%, #db2777 100%); height:100%; transition:width 0.4s ease-out;"></div>
                            </div>
                        </div>
                    `;
                } else if (motivator) {
                    motivator.remove();
                }
            }
            
            return res;
        };
    }

});

// =============================================================
// MOTOR CONTABLE DE PUNTOS - FASE 1
// Definido FUERA del DOMContentLoaded para estar disponible
// en cuanto firebase-sync.js se ejecuta, sin depender del DOM.
// =============================================================

/**
 * Registra un movimiento de puntos de forma atómica en Firestore.
 * Usa FieldValue.increment para el saldo y FieldValue.arrayUnion para el historial.
 * Actualiza también localStorage (currentUser + dt_user) para que la UI sea instantánea.
 * SIEMPRE debe llamarse dentro de un try/catch para no interrumpir flujos críticos.
 *
 * @param {string} userEmail  - Email del usuario (clave del doc en colección 'usuarios')
 * @param {object} movimiento - { tipo: 'ganancia'|'canje', cantidad: number, motivo: string, orderId?: string }
 */
window.registrarMovimientoPuntos = async function(userEmail, { tipo, cantidad, motivo, orderId }) {
    if (!userEmail || !tipo || typeof cantidad !== 'number' || cantidad === 0) {
        console.warn('[Puntos] Parámetros inválidos para registrarMovimientoPuntos:', { userEmail, tipo, cantidad });
        return;
    }

    // Determinar el delta real (+cantidad para ganancia, -cantidad para canje)
    const delta = (tipo === 'canje') ? -Math.abs(cantidad) : Math.abs(cantidad);

    const movEntry = {
        id: 'mov_' + Date.now(),
        tipo,
        cantidad,
        motivo: motivo || '',
        fechaISO: new Date().toISOString(),
        orderId: orderId || null
    };

    try {
        const db = window.db || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
        if (!db) throw new Error('Firestore no disponible');
        
        const isAdmin = window.currentUser && window.currentUser.isAdmin;
        
        if (!isAdmin && tipo === 'ganancia') {
            if (!orderId) throw new Error('Se requiere orderId para reclamar puntos');
            const claimRef = db.collection('solicitudes_puntos').doc(orderId);
            await claimRef.set({
                userEmail: userEmail,
                estado: 'Pendiente',
                timestamp: new Date().toISOString()
            });
            console.log(`[Puntos] 📝 Solicitud de puntos creada para el pedido ${orderId}`);
            if (typeof showToast === 'function') {
                showToast('Tus puntos han sido solicitados y serán validados por un administrador.', '🕒');
            }
            return;
        }
        
        const userRef = db.collection('usuarios').doc(userEmail);
        
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            
            let currentPoints = 0;
            let currentReclamados = [];
            let currentHistorial = [];
            let docExists = userDoc.exists;
            
            if (docExists) {
                const data = userDoc.data();
                currentPoints = data.points || 0;
                currentReclamados = data.puntosReclamadosIDs || [];
                currentHistorial = data.historialPuntos || [];
            }
            
            // FASE 2B: Protección contra doble ejecución (Idempotencia)
            if (tipo === 'ganancia' && orderId) {
                if (currentReclamados.includes(orderId)) {
                    throw new Error('already_claimed');
                }
                currentReclamados.push(orderId);
            }
            
            const newPoints = Math.max(0, currentPoints + delta);
            currentHistorial.push(movEntry);
            
            const updatePayload = {
                points: newPoints,
                puntosActuales: newPoints,
                historialPuntos: currentHistorial,
                puntosReclamadosIDs: currentReclamados
            };
            
            if (!docExists) {
                updatePayload.email = userEmail;
                transaction.set(userRef, updatePayload, { merge: true });
            } else {
                transaction.update(userRef, updatePayload);
            }
        });
        
        console.log(`[Puntos] ✅ ${tipo} de ${cantidad} pts registrado para ${userEmail}. Motivo: ${motivo}`);
        
        // Actualizar UI optimista si la transacción fue exitosa
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.email === userEmail) {
            currentUser.points = Math.max(0, (currentUser.points || 0) + delta);
            currentUser.puntosActuales = currentUser.points;
            if (!Array.isArray(currentUser.historialPuntos)) currentUser.historialPuntos = [];
            currentUser.historialPuntos.push(movEntry);
            if (!Array.isArray(currentUser.puntosReclamadosIDs)) currentUser.puntosReclamadosIDs = [];
            if (tipo === 'ganancia' && orderId) currentUser.puntosReclamadosIDs.push(orderId);
            
            localStorage.setItem('dt_user', JSON.stringify(currentUser));
        }
        
        try {
            const regStr = localStorage.getItem('dt_registered_users');
            if (regStr) {
                const regArr = JSON.parse(regStr);
                if (Array.isArray(regArr)) {
                    const idx = regArr.findIndex(u => u && u.email && u.email.toLowerCase() === userEmail.toLowerCase());
                    if (idx !== -1) {
                        regArr[idx].points = Math.max(0, (regArr[idx].points || 0) + delta);
                        regArr[idx].puntosActuales = regArr[idx].points;
                        if (!Array.isArray(regArr[idx].historialPuntos)) regArr[idx].historialPuntos = [];
                        regArr[idx].historialPuntos.push(movEntry);
                        if (!Array.isArray(regArr[idx].puntosReclamadosIDs)) regArr[idx].puntosReclamadosIDs = [];
                        if (tipo === 'ganancia' && orderId) regArr[idx].puntosReclamadosIDs.push(orderId);
                        localStorage.setItem('dt_registered_users', JSON.stringify(regArr));
                    }
                }
            }
        } catch(e) {}
        
        if (typeof syncUserUI === 'function') syncUserUI();
        if (typeof window.renderHistorialPuntos === 'function') window.renderHistorialPuntos();
        
    } catch (err) {
        if (err.message === 'already_claimed') {
            console.log(`[Puntos] ⚠️ Recompensa ya fue reclamada para el pedido ${orderId} (Idempotencia exitosa)`);
        } else {
            console.error('[Puntos] ❌ Error en transacción de puntos:', err);
        }
    }
};

/**
 * Renderiza la tabla del historial de puntos del usuario en el contenedor
 * #historial-puntos-tabla (si existe en el DOM - modal VIP del cliente).
 * Debe llamarse desde syncUserUI o al abrir el perfil del usuario.
 */
window.renderHistorialPuntos = function() {
    const user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null;
    const historial = (user && Array.isArray(user.historialPuntos)) ? user.historialPuntos : [];

    // Actualizar saldo visible en el modal
    const balEl = document.getElementById('modal-points-balance');
    if (balEl && user) {
        balEl.innerText = `${user.points || 0} Pts`;
    }

    // Genera el HTML de las tarjetas para inyectar en el modal
    function buildMovimientosCardsHTML() {
        if (!user) {
            return `
                <div style="text-align:center; padding:30px 10px; color:#6b7280;">
                    <div style="font-size:3rem; margin-bottom:12px;">🔒</div>
                    <strong style="display:block; font-size:1.05rem; color:#374151; margin-bottom:4px;">Inicia sesión para ver tu historial.</strong>
                    <p style="font-size:0.85rem; margin:0;">Tus puntos y beneficios se sincronizan con tu cuenta.</p>
                </div>`;
        }
        if (historial.length === 0) {
            return `
                <div style="text-align:center; padding:30px 10px; color:#6b7280;">
                    <div style="font-size:3rem; margin-bottom:12px;">🌟</div>
                    <strong style="display:block; font-size:1.05rem; color:#374151; margin-bottom:4px;">Aún no tienes movimientos de puntos.</strong>
                    <p style="font-size:0.85rem; margin:0;">¡Realiza compras o canjea premios para ver tu historial aquí!</p>
                </div>`;
        }
        const sorted = [...historial].reverse();
        return sorted.map(m => {
            const isCanje = m.tipo === 'canje';
            let fechaFormatted = 'Fecha reciente';
            if (m.fechaISO) {
                try {
                    const d = new Date(m.fechaISO);
                    fechaFormatted = d.toLocaleString('es-CO', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    });
                } catch(e) {
                    fechaFormatted = m.fechaISO;
                }
            }

            // Título y Motivo
            let iconTitle = '';
            let motivoText = '';
            if (isCanje) {
                iconTitle = '🎁 Canje de Recompensa:';
                motivoText = m.motivo ? m.motivo.replace(/^Canje:\s*/i, '') : 'Premio VIP';
            } else {
                iconTitle = '🛍️ Compra completada';
                if (m.orderId) {
                    const cleanId = String(m.orderId).startsWith('#') ? m.orderId : '#' + m.orderId;
                    motivoText = `(${cleanId})`;
                } else if (m.motivo) {
                    motivoText = m.motivo.replace(/^Compra\s*/i, '');
                }
            }

            const badgeColor = isCanje ? '#dc2626' : '#16a34a';
            const badgeBg = isCanje ? '#fef2f2' : '#ecfdf5';
            const badgeBorder = isCanje ? '#fecaca' : '#bbf7d0';
            const sign = isCanje ? '-' : '+';
            const ptsQty = Math.abs(m.cantidad || 0);

            return `
                <div class="history-order-card" style="background:#ffffff; border:1px solid #f1f1f1; border-radius:12px; padding:14px; box-shadow:0 2px 8px rgba(0,0,0,0.04); display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                        <div style="display:flex; flex-direction:column;">
                            <strong style="color:#1e293b; font-size:0.95rem; line-height:1.3;">
                                ${iconTitle} <span style="color:var(--brand-pink); font-weight:700;">${motivoText}</span>
                            </strong>
                            <span style="font-size:0.78rem; color:#64748b; margin-top:3px;">
                                📅 ${fechaFormatted}
                            </span>
                        </div>
                        <span style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; font-weight:800; font-size:0.82rem; padding:4px 10px; border-radius:20px; white-space:nowrap; flex-shrink:0;">
                            ${sign}${ptsQty} Puntos Dulce
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Inyectar en el nuevo modal dedicado
    const modalContent = document.getElementById('points-history-content');
    if (modalContent) modalContent.innerHTML = buildMovimientosCardsHTML();

    // Compatibilidad retroactiva si existen contenedores previos
    const mobileContainer = document.getElementById('historial-puntos-tabla');
    if (mobileContainer) mobileContainer.innerHTML = buildMovimientosCardsHTML();

    const deskContainer = document.getElementById('historial-puntos-tabla-desk');
    if (deskContainer) deskContainer.innerHTML = buildMovimientosCardsHTML();
};

window.checkForGuestOrdersToLink = function() {
    if (!auth || !auth.currentUser || auth.currentUser.isAnonymous) return;
    try {
        const secrets = JSON.parse(localStorage.getItem('dt_claim_secrets') || '{}');
        const orderIds = Object.keys(secrets);
        if (orderIds.length === 0) return;
        
        const doLink = window.confirm(`Tienes ${orderIds.length} pedido(s) realizados como invitado en este dispositivo.\n¿Deseas vincularlos a tu cuenta actual?`);
        if (!doLink) {
            localStorage.removeItem('dt_claim_secrets');
            return;
        }

        let linkedCount = 0;
        let processed = 0;
        
        orderIds.forEach(orderId => {
            const secret = secrets[orderId];
            db.collection('pedidos').doc(orderId).update({
                ownerId: auth.currentUser.uid,
                claimSecret: secret + "_claimed"
            }).then(() => {
                linkedCount++;
                delete secrets[orderId];
                localStorage.setItem('dt_claim_secrets', JSON.stringify(secrets));
            }).catch(err => {
                console.warn(`No se pudo vincular el pedido ${orderId}:`, err);
            }).finally(() => {
                processed++;
                if (processed === orderIds.length) {
                    if (typeof showToast === 'function' && linkedCount > 0) {
                        showToast(`¡Se han vinculado ${linkedCount} pedidos a tu cuenta!`, '🔗');
                        if (typeof renderOrders === 'function') renderOrders('curso');
                    }
                }
            });
        });
    } catch(e) {
        console.error("Error comprobando claim secrets:", e);
    }
};

/**
 * FUENTE DE VERDAD ÚNICA: Cálculo Oficial de Puntos Dulce (Fase 2B)
 */
window.calcularPuntosPedido = function(pedido, usuario) {
    if (!usuario || !usuario.email || usuario.isAnonymous) return 0;
    
    const minPurchase = (typeof adminConfig !== 'undefined' && adminConfig.minPurchase) ? adminConfig.minPurchase : 0;
    const vipEnabled = (typeof adminConfig !== 'undefined' && adminConfig.vipEnabled !== undefined) ? adminConfig.vipEnabled : true;
    
    if (!vipEnabled) return 0;
    
    const bruto = pedido.subtotal || 0;
    const descuento = pedido.discount || pedido.descuento || 0;
    
    const baseNeta = Math.max(0, bruto - descuento);
    
    if (baseNeta < minPurchase) return 0;
    
    const puntos = Math.floor(baseNeta / 1000);
    return puntos > 0 ? puntos : 0;
};


