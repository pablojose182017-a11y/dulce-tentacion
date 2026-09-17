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

    // 4. Sincronización de Pedidos en Vivo (Lectura / Oyente)
    db.collection("pedidos").orderBy("fechaISO", "desc").onSnapshot((snapshot) => {
        if (typeof pedidosHistorial !== 'undefined') {
            const firebasePedidos = snapshot.docs.map(doc => doc.data());
            
            // Mezclamos con los locales (evitando duplicados y priorizando Firestore)
            const mapLocales = new Map(pedidosHistorial.map(p => [p.id, p]));
            firebasePedidos.forEach(p => mapLocales.set(p.id, p));
            
            window.pedidosHistorial = Array.from(mapLocales.values());
            
            // Ordenar de nuevo por si acaso
            window.pedidosHistorial.sort((a, b) => {
                return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
            });

            // Respaldo
            localStorage.setItem('dt_pedidos_historial', JSON.stringify(window.pedidosHistorial));

            // Re-renderizar módulos
            if (typeof renderLiveOrders === 'function') renderLiveOrders();
            if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
            
            // Si el libro contable está abierto, actualizarlo también
            const modalContent = document.getElementById('contabilidad-detalle-content');
            if (modalContent && modalContent.innerHTML.includes('Libro Contable de Pedidos')) {
                if (typeof abrirLibroContable === 'function') abrirLibroContable();
            }
            
            console.log("Pedidos sincronizados desde Firestore:", window.pedidosHistorial.length);
        }
    }, (error) => {
        console.error("Error escuchando pedidos de Firestore:", error);
    });
});
