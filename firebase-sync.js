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
                try {
                    await db.collection("usuarios").doc(window.currentUser.email).set({
                        nombre: window.currentUser.name || window.currentUser.nombre || window.currentUser.email.split('@')[0],
                        email: window.currentUser.email,
                        foto: window.currentUser.picture || window.currentUser.foto || "",
                        rol: window.currentUser.role || "cliente",
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
        
        // Actualizar db_users localmente (fusionando para no perder los no subidos si hay fallback)
        if (typeof db_users !== 'undefined') {
            firebaseUsers.forEach(fbUser => {
                const idx = db_users.findIndex(u => u.email === fbUser.email);
                if (idx !== -1) {
                    db_users[idx] = { ...db_users[idx], ...fbUser };
                } else {
                    db_users.push(fbUser);
                }
            });
            localStorage.setItem('dt_users_db', JSON.stringify(db_users));
            
            // Re-renderizar si estamos en la vista de admin de usuarios
            if (typeof renderAdminUsers === 'function') {
                renderAdminUsers();
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
            if (uObj && (uObj.rol === 'admin' || uObj.rol === 'trabajador')) {
                isPrivileged = true;
            }
        } else if (typeof currentUser !== 'undefined' && currentUser) {
            // Fallback si usan currentUser global de script.js en su lugar
            if (currentUser.rol === 'admin' || currentUser.rol === 'trabajador') {
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
                        products.push({
                            id: data.id || k,
                            name: data.name,
                            price: data.price,
                            cat: data.category,
                            img: data.img,
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

    // --- SINCRONIZACIÓN DE RECOMPENSAS (DULCE-PUNTOS) ---
    window.renderRecompensasPublico = function() {
        const modal = document.getElementById('modal-puntos');
        const container = document.getElementById('rewards-container');
        if (!container || !modal) return;
        
        const rewards = window.dt_puntos_recompensas || [];
        const user = window.currentUser;
        const userPoints = user ? (user.points || 0) : 0;
        
        // Renderizar diferenciación VIP vs Normal
        let headerDiv = document.getElementById('dt-puntos-header');
        if (!headerDiv) {
            headerDiv = document.createElement('div');
            headerDiv.id = 'dt-puntos-header';
            headerDiv.style.marginBottom = '20px';
            container.parentNode.insertBefore(headerDiv, container);
        }
        
        // Ocultar la info genérica que estaba en el modal
        const infoGenerica = Array.from(modal.querySelectorAll('div')).find(div => 
            div.innerText && 
            div.innerText.includes('Beneficios Club VIP') && 
            div.id !== 'dt-puntos-header' && 
            !div.classList.contains('auth-modal-content') && 
            div !== modal &&
            !div.querySelector('.auth-modal-content')
        );
        if (infoGenerica) infoGenerica.style.display = 'none';

        window.esExVip = function(usuario) {
            if (!usuario) return false;
            if (usuario.rol === 'vip' || usuario.vip) return false; // Sigue siendo VIP
            if (usuario.historialVIP && usuario.historialVIP.length > 0) {
                // Si tiene historial y no es VIP actualmente, es Ex-VIP
                return true;
            }
            return false;
        };

        const esExVip = window.esExVip(user);

        // Limpiar para renderizar
        headerDiv.innerHTML = '';
        
        if (user && user.rol === 'vip') {
            headerDiv.innerHTML = `
                <div style="background:linear-gradient(135deg, #fef08a 0%, #f59e0b 100%); padding:16px; border-radius:12px; text-align:left; color:#78350f; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <div style="font-weight:900; font-size:1.1rem; display:flex; align-items:center; gap:6px;">
                            👑 Miembro VIP Activo
                        </div>
                        <button onclick="window.abrirHistorialPuntos()" style="background:#fde68a; border:1px solid #f59e0b; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700; color:#b45309; cursor:pointer;">📜 Movimientos</button>
                    </div>
                    <div style="font-size:0.9rem;">
                        ✨ Tu membresía VIP está activa: Tienes 5% de descuento directo en tus compras y acumulación preferencial de puntos.
                    </div>
                </div>
            `;
        } else {
            headerDiv.innerHTML = `
                <div style="background:linear-gradient(135deg, #fff7ed 0%, #fff1f2 100%); border:1px solid #fecdd3; padding:14px 16px; border-radius:14px; text-align:left; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-weight:700; font-size:13px; display:flex; align-items:center; gap:6px; color:#9f1239;">
                            ✨ Membresía Dulce Tentación
                        </div>
                        <button onclick="window.abrirHistorialPuntos()" style="background:none; border:none; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700; color:#b45309; text-decoration:underline; cursor:pointer;">📜 Ver Mis Movimientos</button>
                    </div>
                    <div style="font-size:12px; color:#713f12; margin-top:4px;">
                        Acumulas 1 punto por cada $1.000 COP en tus compras.
                    </div>
                </div>
                      <span>💰</span> 5% OFF en cada compra
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; font-weight:600;">
                      <span>⚡</span> Acumulas Puntos x2
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; font-weight:600;">
                      <span>🎂</span> Descuento Especial Cumpleaños
                    </div>
                    <div style="display:flex; align-items:center; gap:6px; font-weight:600;">
                      <span>🚀</span> Despacho prioritario
                    </div>
                  </div>

                  <button onclick="window.abrirModalTerminosVIP()" style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; background:#d97706; color:#ffffff; font-weight:700; font-size:13px; padding:10px; border-radius:10px; border:none; cursor:pointer; box-shadow:0 3px 8px rgba(217, 119, 6, 0.3); transition:all 0.2s ease; box-sizing:border-box;">
                    👑 ¡Quiero ser Miembro VIP!
                  </button>
                </div>
            `;
        }
        
        if (rewards.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#64748b; font-size:13px; padding:20px;">No hay recompensas configuradas en este momento.</p>';
            return;
        }
        
        let html = '';
        rewards.forEach((rec, i) => {
            const canRedeem = userPoints >= rec.puntos;
            html += `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#ffffff; border:1px solid #f1f5f9; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.04); margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:12px;">
                  <img src="${rec.img || 'logo-pys.png'}" style="width:52px; height:52px; border-radius:10px; object-fit:cover; box-shadow:0 2px 5px rgba(0,0,0,0.08);" onerror="this.src='logo-pys.png'">
                  <div>
                    <h4 style="margin:0; font-size:13px; color:#1e293b; text-transform:capitalize;">${rec.nombre}</h4>
                    <span style="font-size:11px; font-weight:700; color:#b45309;">🎟️ ${rec.puntos} Pts</span>
                  </div>
                </div>
                <div>
                    ${canRedeem 
                        ? `<button onclick="window.canjearRecompensa('${rec.nombre}', ${rec.puntos})" style="background:#e11d48; color:#fff; border:none; padding:6px 14px; border-radius:20px; font-weight:700; cursor:pointer; font-size:12px; box-shadow:0 2px 6px rgba(225,29,72,0.25);">🎁 Canjear</button>`
                        : `<span style="background:#f8fafc; color:#94a3b8; border:1px solid #e2e8f0; padding:5px 10px; border-radius:20px; font-weight:600; font-size:11px;">Te faltan ${rec.puntos - userPoints} pts</span>`
                    }
                </div>
              </div>
            `;
        });
        container.innerHTML = html;
        
        // Restaurar visibilidad del modal si estuviera oculto por CSS residual
        modal.style.display = 'flex';
        const modalContent = modal.querySelector('.auth-modal-content');
        if (modalContent) {
            modalContent.style.display = 'block';
            modalContent.style.opacity = '1';
        }
        
        // Actualizar el valor del modal si es posible y destacar el color a carmín
        const valEl = document.getElementById('modal-ticket-val');
        if (valEl) {
            valEl.textContent = userPoints;
            valEl.style.color = '#be123c';
        }
    };
    
    // --- SISTEMA DE HISTORIAL Y AUDITORÍA DE PUNTOS ---
    window.registrarMovimientoPuntos = function(monto, tipo, concepto) {
        if (!window.currentUser || typeof db === 'undefined') return;
        const nuevoSaldo = window.currentUser.points || 0;
        const isCanje = tipo === 'canje';
        const log = {
            id: "MOV-" + Date.now(),
            fecha: new Date().toLocaleString('es-CO'),
            tipo: tipo, // 'ganancia' o 'canje'
            monto: monto,
            saldoRestante: nuevoSaldo,
            concepto: concepto,
            codigoBono: isCanje ? "CJ-" + Math.floor(1000 + Math.random() * 9000) : null,
            entregado: isCanje ? false : true
        };
        
        // Guardar en array local de history_puntos para facilidad inmediata
        if (!window.currentUser.historialPuntos) window.currentUser.historialPuntos = [];
        window.currentUser.historialPuntos.unshift(log);
        
        // Sincronizar usuario completo si existe saveUsersDB en script.js
        if (typeof db_users !== 'undefined' && typeof saveUsersDB === 'function') {
            const uidx = db_users.findIndex(u => u.email === window.currentUser.email);
            if (uidx !== -1) {
                db_users[uidx].historialPuntos = window.currentUser.historialPuntos;
                saveUsersDB();
            }
        }
        
        // Guardar en Firestore
        db.collection('usuarios').doc(window.currentUser.email.toLowerCase()).collection('movimientos_puntos').doc(log.id).set(log).catch(e => console.warn('No se pudo guardar el log en firestore', e));
    };

    // Interceptar processOrder para registrar ganancias de puntos
    if (typeof window.processOrder === 'function' && !window.processOrder_interceptada) {
        const originalProcessOrder = window.processOrder;
        window.processOrder = function() {
            const pointsBefore = (window.currentUser && window.currentUser.points) || 0;
            originalProcessOrder.apply(this, arguments);
            const pointsAfter = (window.currentUser && window.currentUser.points) || 0;
            if (pointsAfter > pointsBefore) {
                window.registrarMovimientoPuntos(pointsAfter - pointsBefore, 'ganancia', 'Puntos por compra de pedido');
            }
        };
        window.processOrder_interceptada = true;
    }

    // Interceptar updateUserPoints (ajustes manuales de administrador)
    if (typeof window.updateUserPoints === 'function' && !window.updateUserPoints_interceptada) {
        const originalUpdateUserPoints = window.updateUserPoints;
        window.updateUserPoints = function(email, change) {
            const uidx = db_users.findIndex(u => u.email === email);
            if (uidx !== -1) {
                const pointsBefore = db_users[uidx].points || 0;
                originalUpdateUserPoints.apply(this, arguments);
                const pointsAfter = db_users[uidx].points || 0;
                if (pointsAfter !== pointsBefore) {
                    const tipo = pointsAfter > pointsBefore ? 'ganancia' : 'canje';
                    const diff = Math.abs(pointsAfter - pointsBefore);
                    // Para que se guarde en currentUser si es el admin que se suma a sí mismo (raro, pero bueno)
                    // Haremos el registro directo para ese usuario.
                    const log = {
                        id: "MOV-" + Date.now(),
                        fecha: new Date().toLocaleString('es-CO'),
                        tipo: tipo,
                        monto: diff,
                        saldoRestante: pointsAfter,
                        concepto: 'Ajuste manual del administrador',
                        codigoBono: tipo === 'canje' ? "CJ-" + Math.floor(1000 + Math.random() * 9000) : null,
                        entregado: tipo === 'canje' ? false : true
                    };
                    if (!db_users[uidx].historialPuntos) db_users[uidx].historialPuntos = [];
                    db_users[uidx].historialPuntos.unshift(log);
                    saveUsersDB();
                    if (window.currentUser && window.currentUser.email === email) {
                        window.currentUser.historialPuntos = db_users[uidx].historialPuntos;
                    }
                    if (typeof db !== 'undefined') {
                        db.collection('usuarios').doc(email.toLowerCase()).collection('movimientos_puntos').doc(log.id).set(log).catch(e => {});
                    }
                }
            } else {
                originalUpdateUserPoints.apply(this, arguments);
            }
        };
        window.updateUserPoints_interceptada = true;
    }

    // Función de canje interceptada con registro
    window.canjearRecompensa = function(nombre, puntos) {
        if (!window.currentUser || (window.currentUser.points || 0) < puntos) return;
        
        // Restar puntos localmente
        window.currentUser.points -= puntos;
        
        // Persistir en array global de script.js
        if (typeof db_users !== 'undefined' && typeof saveUsersDB === 'function') {
            const uidx = db_users.findIndex(u => u.email === window.currentUser.email);
            if (uidx !== -1) { 
                db_users[uidx].points = window.currentUser.points; 
                saveUsersDB(); 
            }
        }
        if (typeof saveUser === 'function') saveUser();
        
        // Registrar el movimiento
        window.registrarMovimientoPuntos(puntos, 'canje', 'Canje de recompensa: ' + nombre);
        
        if(typeof showToast === 'function') showToast(`Has canjeado: ${nombre}. Revisa tu historial.`, '🎉');
        
        // Actualizar UI
        window.renderRecompensasPublico();
        if (typeof syncUserUI === 'function') syncUserUI();
    };

    // Modal de Historial
    window.abrirHistorialPuntos = function() {
        const container = document.getElementById('rewards-container');
        if (!container || !window.currentUser) return;
        
        let html = '<div style="margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">';
        html += '<h3 style="margin:0; color:#b45309;">📜 Mis Movimientos</h3>';
        html += '<button onclick="window.renderRecompensasPublico()" style="background:#f1f5f9; border:none; padding:5px 10px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:bold; color:#64748b;">⬅ Volver</button>';
        html += '</div>';
        
        const historial = window.currentUser.historialPuntos || [];
        
        if (historial.length === 0) {
            html += '<p style="text-align:center; color:#64748b; font-size:13px; padding:20px;">Aún no tienes movimientos registrados.</p>';
        } else {
            historial.forEach(mov => {
                const isCanje = mov.tipo === 'canje';
                const sign = isCanje ? '-' : '+';
                const color = isCanje ? '#ef4444' : '#16a34a';
                const icon = isCanje ? '🎁' : '🛍️';
                html += `
                    <div style="background:#fff; border:1px solid #f1f5f9; border-radius:12px; padding:12px; margin-bottom:10px; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <span style="font-size:11px; color:#94a3b8;">${mov.fecha}</span>
                            <span style="font-weight:800; font-size:14px; color:${color};">${sign}${mov.monto} Pts</span>
                        </div>
                        <div style="font-size:13px; color:#334155; font-weight:600; margin-bottom:6px;">
                            ${icon} ${mov.concepto}
                        </div>
                        ${isCanje ? `
                            <div style="background:#fffbeb; border:1px dashed #f59e0b; padding:8px; border-radius:8px; text-align:center;">
                                <div style="font-size:11px; color:#92400e; margin-bottom:4px;">Código de Canje:</div>
                                <div style="font-size:16px; font-weight:900; color:#b45309; letter-spacing:1px;">${mov.codigoBono}</div>
                                <div style="font-size:11px; font-weight:bold; color:#d97706; margin-top:4px;">
                                    ${mov.entregado ? '✅ Reclamado' : '⏳ Pendiente por reclamar en mostrador'}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
        const valEl = document.getElementById('modal-ticket-val');
        if (valEl) {
            valEl.textContent = window.currentUser.points || 0;
        }
    };

    // Sobrescribir openPointsModal
    if (typeof window.openPointsModal === 'function' && !window.openPointsModal_interceptada) {
        const originalOpenPointsModal = window.openPointsModal;
        window.openPointsModal = function() {
            originalOpenPointsModal.apply(this, arguments);
            // Inmediatamente después de que el original renderiza los hojaldres, los pisamos con la info en vivo:
            window.renderRecompensasPublico();
        };
        window.openPointsModal_interceptada = true;
    }
    
    // --- FLUJO DE SUSCRIPCIÓN VIP ---
    window.abrirModalTerminosVIP = function(esReactivacion = false) {
        if (!document.getElementById('modal-suscripcion-vip')) {
            const modal = document.createElement('div');
            modal.className = 'auth-modal';
            modal.id = 'modal-suscripcion-vip';
            modal.style.display = 'none';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.zIndex = '999999';
            document.body.appendChild(modal);
        }
        
        const m = document.getElementById('modal-suscripcion-vip');
        const precio = esReactivacion ? "14.900" : "19.900";
        const tachado = esReactivacion ? `<span style="text-decoration:line-through; color:#92400e; font-size:14px; font-weight:normal; margin-right:6px;">$19.900</span>` : '';
        const tituloPromo = esReactivacion ? "🎁 Reactivación VIP Punto Dulce" : "👑 Membresía Club VIP Punto Dulce";
        const montoEnvio = esReactivacion ? 14900 : 19900;
        
        m.innerHTML = `
            <div class="auth-content" style="max-width:400px; width:90%; padding:24px; background:#fff; border-radius:20px; position:relative; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                <button class="auth-close-btn" onclick="document.getElementById('modal-suscripcion-vip').style.display='none'" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b;">✕</button>
                <h3 style="margin-top:0; color:#d97706; text-align:center; font-size:1.3rem;">${tituloPromo}</h3>
                
                <div style="background:#fffbeb; border:1px solid #fde68a; padding:12px; border-radius:12px; text-align:center; margin-bottom:14px;">
                    <span style="font-size:12px; color:#92400e; font-weight:700; text-transform:uppercase;">Inversión Mensual</span>
                    <div style="font-size:24px; font-weight:900; color:#b45309;">${tachado}$${precio} COP <span style="font-size:13px; font-weight:600; color:#78350f;">/ mes</span></div>
                </div>
                
                <div style="margin-bottom:16px; font-size:13px; color:#334155;">
                    <strong style="display:block; margin-bottom:8px; color:#1e293b;">Resumen de Beneficios:</strong>
                    <ul style="margin:0; padding-left:20px; list-style-type:circle;">
                        <li style="margin-bottom:4px;">5% OFF automático en cada compra.</li>
                        <li style="margin-bottom:4px;">Acumulación doble de Dulce-Puntos (Puntos x2).</li>
                        <li style="margin-bottom:4px;">Descuento especial y sorpresa el día de tu cumpleaños.</li>
                        <li style="margin-bottom:4px;">Atención y despacho prioritario en cocina.</li>
                    </ul>
                </div>
                
                <div style="margin-bottom:16px;">
                    <strong style="display:block; margin-bottom:4px; font-size:12px; color:#64748b;">Términos y Condiciones:</strong>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:8px; height:80px; overflow-y:auto; font-size:11px; color:#64748b; line-height:1.4;">
                        - La suscripción VIP tiene vigencia de 30 días calendario renovables.<br>
                        - Los beneficios aplican únicamente a la cuenta del titular registrado.<br>
                        - La membresía se activa una vez validado el comprobante de pago por transferencia o en caja.<br>
                        - Nos reservamos el derecho de modificar los beneficios notificando a los miembros activos.
                    </div>
                </div>
                
                <label style="display:flex; align-items:center; gap:8px; font-size:12px; color:#334155; margin:12px 0 16px 0; cursor:pointer;">
                    <input type="checkbox" id="check-acepto-vip" onchange="document.getElementById('btn-confirmar-solicitud-vip').disabled = !this.checked">
                    He leído y acepto los términos y beneficios de la membresía.
                </label>
                
                <button id="btn-confirmar-solicitud-vip" disabled onclick="window.confirmarSolicitudVIP(${montoEnvio})" style="width:100%; background:#d97706; color:#fff; font-weight:700; padding:12px; border-radius:10px; border:none; cursor:pointer;">
                    ✅ Confirmar y Activar por WhatsApp
                </button>
            </div>
        `;
        m.style.display = 'flex';
        // Ocultar modal de puntos para dar paso a este
        const mp = document.getElementById('modal-puntos');
        if (mp) mp.style.display = 'none';
    };
    
    window.confirmarSolicitudVIP = function(monto) {
        const user = window.currentUser || JSON.parse(localStorage.getItem('currentUser') || '{}');
        const nombreCliente = user.name || user.nombre || 'Cliente Registrado';
        const phoneCliente = user.phone || 'No registrado';
        const emailCliente = user.email || '';
        const precio = monto || 19900;
        
        if (typeof db !== 'undefined') {
            db.collection('solicitudes_vip').add({
                cliente: nombreCliente,
                telefono: phoneCliente,
                email: emailCliente,
                fecha: new Date().toISOString(),
                estado: 'pendiente_pago',
                monto: precio
            }).then(() => {
                const phoneApp = typeof PHONE !== 'undefined' ? PHONE : '573229512693';
                let msgWp = `Hola P&S Punto Dulce, acabo de aceptar los términos y condiciones de la membresía VIP en la plataforma web.\n\n`;
                if (precio < 19900) {
                    msgWp += `*¡Aproveché la Promo de Reactivación por $${precio.toLocaleString()} COP!*\n\n`;
                } else {
                    msgWp += `*Inversión:* $${precio.toLocaleString()} COP/mes\n\n`;
                }
                msgWp += `¿A qué cuenta Nequi o Bancolombia puedo transferir para activarla?`;
                window.open(`https://wa.me/${phoneApp}?text=${encodeURIComponent(msgWp)}`, '_blank');
                document.getElementById('modal-suscripcion-vip').style.display = 'none';
                if(typeof showToast === 'function') showToast('Redirigiendo a WhatsApp...', '👑');
            }).catch(e => {
                console.error("Error registrando solicitud VIP:", e);
                alert("Hubo un error al registrar la solicitud, por favor contáctanos directamente.");
            });
        }
    };

    db.collection('config').doc('puntos_recompensas').onSnapshot(doc => {
        if (doc.exists) {
            window.dt_puntos_recompensas = doc.data().recompensas || [];
            localStorage.setItem('dt_puntos_recompensas', JSON.stringify(window.dt_puntos_recompensas));
            window.renderRecompensasPublico();
            if (document.getElementById('modal-config-puntos') && document.getElementById('modal-config-puntos').style.display !== 'none') {
                if (typeof window.renderModalConfigPuntosInterno === 'function') {
                    window.renderModalConfigPuntosInterno();
                }
            }
        }
    }, err => console.warn("Error escuchando puntos_recompensas:", err));

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
