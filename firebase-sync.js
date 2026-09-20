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
console.log("Firebase Firestore inicializado.");

window.addEventListener('DOMContentLoaded', () => {
    // 2. Sincronización de Usuarios en la Nube
    if (typeof handleCredentialResponse !== 'undefined') {
        const originalHandleCredentialResponse = window.handleCredentialResponse;
        window.handleCredentialResponse = async function(response) {
            // Llama a la lógica original (decodificación, guardado en db_users/localStorage, render)
            originalHandleCredentialResponse.apply(this, arguments);

            // Obtener al usuario recién logueado
            if (window.currentUser) {
                const isSuper = (typeof window.SUPER_ADMINS !== 'undefined') ? window.SUPER_ADMINS.includes(window.currentUser.email?.toLowerCase().trim()) : false;
                if (isSuper) {
                    window.currentUser.role = 'admin';
                    window.currentUser.rol = 'admin';
                    window.currentUser.isAdmin = true;
                    window.currentUser.blocked = false;
                }
                try {
                    await db.collection("usuarios").doc(window.currentUser.email).set({
                        nombre: window.currentUser.name || window.currentUser.nombre || window.currentUser.email.split('@')[0],
                        email: window.currentUser.email,
                        foto: window.currentUser.picture || window.currentUser.foto || "",
                        rol: isSuper ? 'admin' : (window.currentUser.role || "cliente"),
                        role: isSuper ? 'admin' : (window.currentUser.role || "cliente"),
                        isAdmin: isSuper || (window.currentUser.role === 'admin'),
                        estado: 'activo',
                        blocked: false,
                        vip: window.currentUser.vip || false,
                        points: window.currentUser.points || 0,
                        ultimoIngreso: new Date().toISOString()
                    }, { merge: true });
                    console.log("Usuario sincronizado con Firestore:", window.currentUser.email);
                } catch (e) {
                    console.error("Error sincronizando usuario con Firestore:", e);
                }
            }
        };
    }

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
                localStorage.setItem('dt_logged_user', JSON.stringify(currentUser));
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
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Tono D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // Sube a A5
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.8);
        } catch (e) {
            console.warn('Audio bloqueado hasta primer clic del usuario:', e);
        }
    };

    // --- 2. LISTENER EN TIEMPO REAL (onSnapshot) PARA PEDIDOS ---
    let isPrivileged = false;
    try {
        const uStr = localStorage.getItem('dt_logged_user');
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
                    }
                });
                if (hayNuevos) {
                    window.sonarCampanaNuevoPedido();
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

    // --- 5. INTERCEPTOR DUAL DE CHECKOUT (WHATSAPP + FIRESTORE) ---
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
            window.dt_tortas_config = data;
            localStorage.setItem('dt_tortas_config', JSON.stringify(data));
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
