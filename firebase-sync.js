/**
 * firebase-sync.js
 * Módulo de integración con Firebase Firestore para P&S Punto Dulce.
 * Sobreescribe funciones de script.js para agregar la persistencia en la nube
 * y sincronización en tiempo real sin modificar el código legacy directamente.
 */

// 1. Inicialización de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAXsUDZeDStUV1oqfBfHre84u4u9TxYr1E",
    authDomain: "ps-punto-dulce.firebaseapp.com",
    projectId: "ps-punto-dulce",
    storageBucket: "ps-punto-dulce.firebasestorage.app",
    messagingSenderId: "1058887587986",
    appId: "1:1058887587986:web:aa2b9db7f5d6b72f15ee4b",
    measurementId: "G-806J8JJ3VD"
};

// Evitar inicializar si ya existe
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;
console.log("Firebase Firestore y Auth inicializados.");

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
                    await auth.signInWithCredential(googleCred);
                    console.log("✓ Firebase Auth autenticado con ID Token de Google.");
                } catch (authErr) {
                    console.warn("Aviso Firebase Auth (signInWithCredential):", authErr.message || authErr);
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
        };
    }

    // Observador permanente del estado de autenticación (Firebase Auth onAuthStateChanged)
    // FIX: Restaura el rol completo (rol/role) desde Firestore al detectar sesión activa.
    // Esto evita que syncCurrentUserToCloud sobreescriba con el rol en caché local.
    if (auth) {
        auth.onAuthStateChanged(async (fbUser) => {
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

    // Oyente para "Usuarios y Personal" (Tiempo Real)
    db.collection("usuarios").onSnapshot((snapshot) => {
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
        }
    });

    // 3. Sincronización de Pedidos en Vivo (Escritura)
    // Debemos atrapar el momento exacto donde se genera el nuevo pedido.
    // Usualmente es dentro de `sendOrder` antes de vaciar el carrito,
    // pero sendOrder ya fue sobreescrito. Haremos un wrapper final.
    if (typeof window.sendOrder !== 'undefined') {
        const originalSendOrder = window.sendOrder;
        window.sendOrder = function() {
            // Replicar la captura de datos temporal para subir a firebase
            // Nota: La lógica original empuja a pedidosHistorial localmente
            // Lo más seguro es dejar que el original opere
            
            // Justo antes de que el original envíe el WhatsApp y limpie todo,
            // podemos pre-capturar el pedido (leyendo localStorage o el array modificado).
            // Pero es más fácil extender la sobreescritura actual, o simplemente:
            
            let historialPrevio = (typeof pedidosHistorial !== 'undefined') ? pedidosHistorial.length : 0;
            
            // Llamar al original
            const res = originalSendOrder.apply(this, arguments);

            if (typeof pedidosHistorial !== 'undefined' && pedidosHistorial.length > historialPrevio) {
                // Un nuevo pedido fue añadido al final del arreglo
                const nuevoPedidoLocal = pedidosHistorial[pedidosHistorial.length - 1];
                
                try {
                    db.collection("pedidos").doc(nuevoPedidoLocal.id).set({
                        ...nuevoPedidoLocal,
                        fechaISO: new Date().toISOString()
                    });
                    console.log("Pedido enviado a Firestore:", nuevoPedidoLocal.id);
                } catch (error) {
                    console.error("Error al enviar pedido a Firestore:", error);
                }
            }
            
            return res;
        };
    }

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
        db.collection('pedidos')
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

    // --- 3. ACTUALIZACIÓN DE ESTADOS HACIA FIRESTORE (Interceptor global) ---
    const originalUpdateOrderStatus = window.updateOrderStatus;
    window.updateOrderStatus = function(orderId, nuevoEstado) {
        if(originalUpdateOrderStatus) originalUpdateOrderStatus(orderId, nuevoEstado);
        
        const pedido = window.pedidosHistorial.find(p => p.id === orderId || p.idDoc === orderId);
        if(pedido && pedido.idDoc) {
            db.collection('pedidos').doc(pedido.idDoc).update({ estado: nuevoEstado })
                .catch(err => console.error("Error actualizando estado en Firestore:", err));
        }
    };

    const originalUpdateOrderAbono = window.updateOrderAbono;
    window.updateOrderAbono = function(orderId, nuevoAbono) {
        if(originalUpdateOrderAbono) originalUpdateOrderAbono(orderId, nuevoAbono);
        
        const pedido = window.pedidosHistorial.find(p => p.id === orderId || p.idDoc === orderId);
        if(pedido && pedido.idDoc) {
            db.collection('pedidos').doc(pedido.idDoc).update({ abono: nuevoAbono })
                .catch(err => console.error("Error actualizando abono en Firestore:", err));
        }
    };

    // --- 4. CONSULTA DE ESTADOS PARA CLIENTES (MIS PEDIDOS) ---
    const originalOpenOrdersModal = window.openOrdersModal;
    if (originalOpenOrdersModal) {
        window.openOrdersModal = function() {
            if (typeof currentUser !== 'undefined' && currentUser && currentUser.email) {
                // Hacer una lectura rápida (one-shot) solo de sus pedidos
                db.collection('pedidos')
                  .where('email', '==', currentUser.email)
                  .get()
                  .then((snapshot) => {
                      const misPedidosRemotos = [];
                      snapshot.forEach(doc => misPedidosRemotos.push(doc.data()));
                      
                      if (misPedidosRemotos.length > 0) {
                          misPedidosRemotos.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                          
                          // Mapear el estado de Firebase a 'status' que usa script.js
                          misPedidosRemotos.forEach(p => {
                              if(p.estado) p.status = p.estado;
                          });
                          
                          currentUser.history = misPedidosRemotos;
                          if (typeof saveUser === 'function') saveUser();
                      }
                      originalOpenOrdersModal();
                  })
                  .catch(err => {
                      console.warn("No se pudo obtener actualización de pedidos:", err);
                      originalOpenOrdersModal();
                  });
            } else {
                originalOpenOrdersModal();
            }
        };
    }

    // --- 5. INTERCEPTOR DUAL DE CHECKOUT (WHATSAPP + FIRESTORE + PUNTOS) ---
    const originalSendOrder = window.sendOrder;
    if (originalSendOrder) {
        window.sendOrder = function() {
            const histLenBefore = typeof pedidosHistorial !== 'undefined' ? pedidosHistorial.length : 0;
            
            // Ejecutar la función original que genera el ID, abre WhatsApp y vacía el carrito
            originalSendOrder.apply(this, arguments);
            
            // Si el pedido se generó, el historial local habrá crecido
            if (typeof pedidosHistorial !== 'undefined' && pedidosHistorial.length > histLenBefore) {
                const nuevoPedido = pedidosHistorial[pedidosHistorial.length - 1];
                
                // Estandarizar fechas para el monitor
                if (!nuevoPedido.fechaISO) {
                    nuevoPedido.fechaISO = nuevoPedido.timestamp 
                        ? new Date(nuevoPedido.timestamp).toISOString() 
                        : new Date().toISOString();
                }
                if (!nuevoPedido.estado) nuevoPedido.estado = 'Pendiente';
                if (typeof nuevoPedido.abono === 'undefined') nuevoPedido.abono = 0;
                
                // PRIMERO: Guardar de inmediato en Firestore
                db.collection('pedidos').doc(nuevoPedido.id).set(nuevoPedido)
                  .then(() => console.log("Pedido guardado exitosamente en Firestore:", nuevoPedido.id))
                  .catch((err) => console.error("Error al guardar pedido en Firestore:", err));
                  
                // SEGUNDO (INDEPENDIENTE): Registrar puntos ganados en Firestore
                // ⚠️ Encapsulado en try/catch: cualquier fallo aquí NO bloquea WhatsApp
                try {
                    const userEmail = (typeof currentUser !== 'undefined' && currentUser && currentUser.email)
                        ? currentUser.email : null;
                    const totalPedido = nuevoPedido.total || nuevoPedido.subtotal || 0;
                    // Regla: 1 punto por cada $1.000 COP (igual que en script.js línea 3985)
                    const ptsGanados = Math.floor(totalPedido / 1000);
                    
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
            if (typeof pedidosHistorial !== 'undefined') {
                pedidosHistorial.forEach(p => {
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
        window.cambiarPestanaAdmin = function(tabId) {
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

    // --- 9. SINCRONIZACIÓN DE CATÁLOGO PERSONALIZADO (NOMBRE, PRECIO E IMAGEN) ---
    const applyCustomCatalog = (customCatalog) => {
        if (typeof products !== 'undefined' && customCatalog) {
            
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
                if (customCatalog[p.id] !== undefined) {
                    const customData = customCatalog[p.id];
                    
                    if (customData.eliminado) {
                        products.splice(i, 1);
                        continue;
                    }
                    
                    if (!p.originalName) p.originalName = p.name;
                    if (!p.originalImg) p.originalImg = p.img;
                    
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
                                window.saveOfertas();
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
                }
            }
            if (typeof renderProducts === 'function') renderProducts();
            if (typeof renderFeatured === 'function') renderFeatured();
            if (typeof renderStockAdmin === 'function') renderStockAdmin();
        }
    };

    // Leer primero de localStorage para ser instantáneo (Offline First)
    try {
        const localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado'));
        if (localCatalog) applyCustomCatalog(localCatalog);
    } catch(e) {}

    // Luego consultar Firestore
    db.collection('config').doc('catalogo_personalizado').get().then(doc => {
        if (doc.exists) {
            const remoteCatalog = doc.data();
            localStorage.setItem('dt_catalogo_personalizado', JSON.stringify(remoteCatalog));
            applyCustomCatalog(remoteCatalog);
        }
    }).catch(err => console.warn("No se pudo cargar el catálogo personalizado de Firestore", err));

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
            window.renderPromoBanner();
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

    // 1. Persistir atómicamente en Firestore
    try {
        const db = window.db || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
        if (!db) throw new Error('Firestore no disponible');

        const FieldValue = window.firebase.firestore.FieldValue;
        await db.collection('usuarios').doc(userEmail).update({
            points:          FieldValue.increment(delta),
            puntosActuales:  FieldValue.increment(delta),
            historialPuntos: FieldValue.arrayUnion(movEntry)
        });
        console.log(`[Puntos] ✅ ${tipo} de ${cantidad} pts registrado para ${userEmail}. Motivo: ${motivo}`);
    } catch (fsErr) {
        // Si el documento no existe aún, usar set con merge
        try {
            const db = window.db || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
            if (db) {
                await db.collection('usuarios').doc(userEmail).set({
                    email: userEmail,
                    points: Math.max(0, delta),
                    puntosActuales: Math.max(0, delta),
                    historialPuntos: [movEntry]
                }, { merge: true });
                console.log('[Puntos] ✅ Documento creado con puntos iniciales para:', userEmail);
            }
        } catch (setErr) {
            console.warn('[Puntos] ⚠️ No se pudo persistir en Firestore:', setErr);
        }
    }

    // 2. Actualizar localStorage de forma optimista (UI instantánea sin esperar red)
    try {
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.email === userEmail) {
            currentUser.points = Math.max(0, (currentUser.points || 0) + delta);
            currentUser.puntosActuales = currentUser.points;
            if (!Array.isArray(currentUser.historialPuntos)) currentUser.historialPuntos = [];
            currentUser.historialPuntos.push(movEntry);
            localStorage.setItem('dt_user', JSON.stringify(currentUser));
        }

        // Sincronizar también en dt_registered_users
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
                    localStorage.setItem('dt_registered_users', JSON.stringify(regArr));
                }
            }
        }

        // Refrescar la UI de puntos si está disponible
        if (typeof syncUserUI === 'function') syncUserUI();
        if (typeof window.renderHistorialPuntos === 'function') window.renderHistorialPuntos();
    } catch (lsErr) {
        console.warn('[Puntos] ⚠️ No se pudo actualizar localStorage:', lsErr);
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

