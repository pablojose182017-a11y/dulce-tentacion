/**
 * Módulo control-roles.js
 * Estandariza la definición de roles y controles de acceso 
 * sin modificar script.js
 */

window.addEventListener('DOMContentLoaded', () => {
    // --- 1. INYECTAR MODAL DE CONTRASEÑA SI NO EXISTE ---
    if (!document.getElementById('adminPasswordModal')) {
        const modalHTML = `
        <div id="adminPasswordModal" class="modal-overlay" style="display:none !important; align-items:center; justify-content:center; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999;">
            <div class="modal-content" style="max-width:400px; padding:20px; text-align:center; background:#fff; border-radius:12px; width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                <h3 style="color:var(--brand-pink); margin-bottom:15px; font-size:1.5rem;">🔑 Restablecer Contraseña</h3>
                <p id="adminPasswordModalUser" style="margin-bottom:15px; font-weight:bold; color:#475569; font-size:0.95rem;"></p>
                <input type="password" id="adminNewPasswordInput" placeholder="Nueva Contraseña..." style="width:100%; padding:12px; border-radius:8px; border:1px solid #ddd; margin-bottom:20px; box-sizing:border-box; font-size:1rem;">
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button class="btn-hero-secondary" onclick="document.getElementById('adminPasswordModal').style.setProperty('display', 'none', 'important')" style="padding:10px 20px; border:1px solid #ddd; background:#f1f5f9; border-radius:8px; cursor:pointer; font-weight:bold; flex:1;">Cancelar</button>
                    <button class="btn-gold" onclick="saveAdminNewPassword()" style="padding:10px 20px; border:none; background:var(--brand-pink); color:#fff; border-radius:8px; cursor:pointer; font-weight:bold; flex:1;">Guardar</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // --- SANITIZACIÓN DE CARRITO DE EMERGENCIA ---
    if (typeof cart !== 'undefined' && Array.isArray(cart)) {
        cart = cart.filter(i => !isNaN(Number(i.price)) && Number(i.price) >= 0);
        cart.forEach(i => { i.quantity = Number(i.quantity) || 1; i.price = Number(i.price) || 0; });
        try { localStorage.setItem('dt_cart', JSON.stringify(cart)); } catch(e){}
        if (typeof updateCart === 'function') updateCart();
    }

    // --- 3. SOBRESCRIBIR SYNCUSERUI ---
    const originalSyncUserUI = window.syncUserUI;
    if (originalSyncUserUI) {
        window.syncUserUI = function() {
            originalSyncUserUI();

            if (typeof currentUser !== 'undefined' && currentUser) {
                const isAdmin = (typeof adminEmails !== 'undefined') && adminEmails.includes(currentUser.email);
                const isWorker = (typeof workerEmails !== 'undefined') && workerEmails.includes(currentUser.email);
                
                const deskAdminBtn = document.getElementById('desk-admin-btn');
                const mobAdminBtn = document.getElementById('mob-admin-btn');
                const deskKitchenBtn = document.getElementById('desk-kitchen-btn');
                const mobKitchenBtn = document.getElementById('mob-kitchen-btn');
                
                const adminOnlyDiv = document.getElementById('admin-only-sections');
                const adminTitle = document.getElementById('admin-title-panel');

                if (deskAdminBtn) deskAdminBtn.style.display = 'none';
                if (mobAdminBtn) mobAdminBtn.style.display = 'none';
                if (deskKitchenBtn) deskKitchenBtn.style.display = 'none';
                if (mobKitchenBtn) mobKitchenBtn.style.display = 'none';
                if (adminOnlyDiv) adminOnlyDiv.style.display = 'none';

                if (isAdmin) {
                    if (deskAdminBtn) {
                        deskAdminBtn.style.display = 'flex';
                        deskAdminBtn.innerText = '⚙️ Panel Administrador';
                    }
                    if (mobAdminBtn) {
                        mobAdminBtn.style.display = 'flex';
                        mobAdminBtn.innerText = '⚙️ Panel Administrador';
                        mobAdminBtn.setAttribute('onclick', "closeMobileProfile(); showSection('admin-dashboard'); renderAdminUsers(); renderAdminDashboard(); renderLiveOrders(); renderStockAdmin(); cambiarPestanaAdmin('pedidos');");
                    }
                    if (adminOnlyDiv) adminOnlyDiv.style.display = 'block';
                    if (adminTitle) adminTitle.innerText = '📊 Panel Administrativo & Financiero';
                    
                    if (deskAdminBtn) {
                         deskAdminBtn.setAttribute('onclick', "showSection('admin-dashboard'); renderAdminUsers(); renderAdminDashboard(); renderLiveOrders(); renderStockAdmin(); cambiarPestanaAdmin('pedidos');");
                    }
                } else if (isWorker) {
                    if (deskKitchenBtn) deskKitchenBtn.style.display = 'flex';
                    if (mobKitchenBtn) {
                        mobKitchenBtn.style.display = 'flex';
                        mobKitchenBtn.setAttribute('onclick', "closeMobileProfile(); openKitchenModal();");
                    }
                }
            }
        };
        if (typeof currentUser !== 'undefined' && currentUser) {
            window.syncUserUI();
        }
    }

    // --- 4. SOBRESCRIBIR INTERCEPTOR DE LOGIN PARA CUENTAS BLOQUEADAS ---
    const originalLoginCustomUser = window.loginCustomUser;
    if (originalLoginCustomUser) {
        window.loginCustomUser = function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value.trim().toLowerCase();
            const pass = document.getElementById('loginPassword')?.value.trim();
            const user = db_users.find(u => (u.email.trim().toLowerCase() === email || (u.username && u.username.trim().toLowerCase() === email)) && u.password === pass);
            
            if (user && user.blocked) {
                if (typeof showAuthMessage === 'function') showAuthMessage('⛔ Tu cuenta ha sido suspendida por incumplimiento de políticas.', 'error');
                return;
            }
            originalLoginCustomUser(e);
        };
    }

    // --- 5. RENDER ADMIN USERS (Roles Estandarizados: Normal, VIP, Trabajador, Admin) ---
    window.renderAdminUsers = function() {
        const tbody = document.getElementById('admin-users-table');
        if (!tbody) return;
        const q = (document.getElementById('adminUserSearch')?.value || '').toLowerCase();
        
        const filteredUsers = db_users.filter(u => {
            const matchSearch = (u.name || '').toLowerCase().includes(q) || 
                                (u.email || '').toLowerCase().includes(q) || 
                                (u.phone || '').toLowerCase().includes(q);
            if(!matchSearch) return false;

            const isAdm = adminEmails.includes(u.email);
            const isWork = workerEmails.includes(u.email);

            if (typeof currentRoleFilter !== 'undefined') {
                if (currentRoleFilter === 'Administradores') return isAdm;
                if (currentRoleFilter === 'Trabajadores') return isWork;
                if (currentRoleFilter === 'VIP') return u.vip;
                if (currentRoleFilter === 'Normales') return !isAdm && !isWork && !u.vip;
            }
            return true;
        });

        if (filteredUsers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="padding:15px;text-align:center;">No se encontraron clientes.</td></tr>`;
            return;
        }
        tbody.innerHTML = filteredUsers.map(u => {
            const isUserAdmin = adminEmails.includes(u.email);
            const isUserWorker = workerEmails.includes(u.email);

            let levelHtml = '';
            if (isUserAdmin) {
                levelHtml = '<span style="color:#1d4ed8;font-weight:bold;">Administrador</span>';
            } else if (isUserWorker) {
                levelHtml = '<span style="color:#8b5cf6;font-weight:bold;">Trabajador</span>';
            } else if (u.vip) {
                levelHtml = '<span style="color:#d97706;font-weight:bold;">👑 VIP</span>';
            } else {
                levelHtml = '<span style="color:#64748b;font-weight:bold;">Normal</span>';
            }
            
            return `
        <tr style="border-bottom:1px solid #eee; background:${u.blocked ? '#fff1f2' : (isUserAdmin ? '#eff6ff' : (isUserWorker ? '#f3e8ff' : 'transparent'))}">
            <td style="padding:10px; display:flex; align-items:center; gap:10px;">
                <img src="${u.picture}" style="width:30px;height:30px;border-radius:50%;">
                <strong>${u.name}</strong>
            </td>
            <td style="padding:10px; font-size:0.85rem; color:#555;">${u.phone || '-'}</td>
            <td style="padding:10px; font-size:0.85rem; color:#555;">${u.email}</td>
            <td style="padding:10px; text-align:center;">${levelHtml}</td>
            <td style="padding:10px; text-align:center; font-weight:bold; color:${u.blocked ? '#e11d48' : '#10b981'};">${u.blocked ? 'Bloqueado' : 'Activo'}</td>
            <td style="padding:10px; text-align:center;">
                ${(u.email === 'dulcestentaciones2004@gmail.com') ? '-' : `
                <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
                    <div style="display:flex; gap:4px; width:100%; align-items:center;">
                        <select id="roleSel_${u.email.replace(/[@.]/g, '_')}" style="flex:1; padding:4px; font-size:0.75rem; border-radius:4px; border:1px solid #ccc; outline:none;">
                            <option value="Normal" ${!isUserAdmin && !isUserWorker && !u.vip ? 'selected' : ''}>Normal</option>
                            <option value="VIP" ${u.vip && !isUserAdmin && !isUserWorker ? 'selected' : ''}>VIP</option>
                            <option value="Trabajador" ${isUserWorker ? 'selected' : ''}>Trabajador</option>
                            <option value="Admin" ${isUserAdmin ? 'selected' : ''}>Admin</option>
                        </select>
                        <button onclick="confirmRoleChange('${u.email}')" style="background:var(--brand-pink); color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;">Guardar</button>
                    </div>
                    ${(u.password !== undefined) ? `<button onclick="adminChangePassword('${u.email}')" style="background:#f3f4f6; color:#4b5563; border:1px solid #d1d5db; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; width:100%;">🔑 Cambiar Clave</button>` : ''}
                    <button onclick="adminToggleBlock('${u.email}')" style="background:${u.blocked ? '#d1fae5' : '#fee2e2'}; color:${u.blocked ? '#059669' : '#e11d48'}; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; width:100%;">${u.blocked ? 'Desbloquear' : 'Bloquear'}</button>
                </div>`}
            </td>
        </tr>
        `;
        }).join('');
    };
});

// --- FUNCIONES GLOBALES INTERCEPTADAS ---

window.confirmRoleChange = function(email) {
    const selectEl = document.getElementById(`roleSel_${email.replace(/[@.]/g, '_')}`);
    if (!selectEl) return;
    const newRole = selectEl.value; // 'Normal', 'VIP', 'Trabajador', 'Admin'

    const u = db_users.find(x => x.email === email);
    if (!u) return;

    if (typeof ADMIN_EMAILS !== 'undefined' && ADMIN_EMAILS.includes(email) && newRole !== 'Admin') {
        if(typeof showToast === 'function') showToast('No se puede quitar el rol al administrador principal', 'error');
        return;
    }

    // Limpiar roles previos
    adminEmails = adminEmails.filter(e => e !== email);
    workerEmails = workerEmails.filter(e => e !== email);
    u.vip = false;
    delete u.vipExpiresAt;
    u.role = 'cliente';
    u.isAdmin = false;

    // Aplicar nuevo rol y vigencia VIP si aplica
    if (newRole === 'Admin') {
        adminEmails.push(email);
        u.role = 'admin';
        u.isAdmin = true;
    } else if (newRole === 'Trabajador') {
        workerEmails.push(email);
        u.role = 'trabajador';
    } else if (newRole === 'VIP') {
        u.vip = true;
        u.role = 'vip';
        u.vipExpiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // Vigencia 30 días
    }

    // Persistir localmente en los DB targets explícitos
    if (typeof saveAdminEmails === 'function') saveAdminEmails();
    try { localStorage.setItem('dt_worker_emails', JSON.stringify(workerEmails)); } catch(e){}
    if (typeof saveUsersDB === 'function') saveUsersDB();
    
    renderAdminUsers();
    if (typeof renderKitchenUsers === 'function') renderKitchenUsers();
    if (currentUser && currentUser.email === email) { window.syncUserUI(); }
    
    if(typeof showToast === 'function') showToast('Rol actualizado a: ' + newRole, '✅');
};

window.adminToggleBlock = function(email) {
    const u = db_users.find(x => x.email === email);
    if (!u) return;
    u.blocked = !u.blocked;
    if (typeof saveUsersDB === 'function') saveUsersDB();
    renderAdminUsers();
    
    // Si el usuario bloqueado es el actual, forzar cierre
    if (currentUser && currentUser.email === email && u.blocked) { 
        if(typeof logoutUser === 'function') {
            logoutUser(new Event('click')); 
        }
    }
    if(typeof showToast === 'function') showToast(u.blocked ? 'Usuario bloqueado. No podrá iniciar sesión.' : 'Usuario desbloqueado.', u.blocked ? '⛔' : '✅');
};

window.adminChangePassword = function(email) {
    const user = db_users.find(u => u.email === email);
    if (!user) return;
    window.userToChangePassword = user;
    const label = document.getElementById('adminPasswordModalUser');
    if (label) label.innerText = `Usuario: ${user.name} (${email})`;
    const input = document.getElementById('adminNewPasswordInput');
    if (input) input.value = '';
    const modal = document.getElementById('adminPasswordModal');
    if (modal) modal.style.setProperty('display', 'flex', 'important');
};

window.saveAdminNewPassword = function() {
    const input = document.getElementById('adminNewPasswordInput');
    const newPass = input ? input.value.trim() : '';
    if (!newPass) {
        if(typeof showToast === 'function') showToast('La contraseña no puede estar vacía', 'error');
        return;
    }
    if (!window.userToChangePassword) return;

    const u = db_users.find(x => x.email === window.userToChangePassword.email);
    if (!u) return;

    u.password = newPass;
    if (typeof saveUsersDB === 'function') saveUsersDB();
    
    const modal = document.getElementById('adminPasswordModal');
    if (modal) modal.style.setProperty('display', 'none', 'important');
    if(typeof showToast === 'function') showToast('Contraseña restablecida exitosamente', '✅');
};

// Sincronizar roles en Modo Cocina también
window.renderKitchenUsers = function() {
    const container = document.getElementById('k-users-grid');
    if (!container) return;
    const q = (document.getElementById('k-user-search')?.value || '').toLowerCase();
    const filter = document.getElementById('k-user-filter')?.value || 'todos';
    
    const filtered = db_users.filter(u => {
        const matchSearch = (u.name || '').toLowerCase().includes(q) || 
                            (u.email || '').toLowerCase().includes(q) || 
                            (u.phone || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
        const isAdm = adminEmails.includes(u.email);
        const isWork = workerEmails.includes(u.email);
        
        if (filter === 'vip') return u.vip === true;
        if (filter === 'cocina') return isWork; 
        if (filter === 'admin') return isAdm;
        return true;
    });

    container.innerHTML = filtered.map(u => {
        const isAdm = adminEmails.includes(u.email);
        const isWork = workerEmails.includes(u.email);
        
        let currentRoleVal = 'Normal';
        let roleBadgeHtml = '<span class="k-role-badge k-role-regular">Normal</span>';
        
        if (isAdm) { currentRoleVal = 'Admin'; roleBadgeHtml = '<span class="k-role-badge k-role-admin">🛡️ Administrador</span>'; }
        else if (isWork) { currentRoleVal = 'Trabajador'; roleBadgeHtml = '<span class="k-role-badge k-role-cocina">👨‍🍳 Trabajador</span>'; }
        else if (u.vip) { currentRoleVal = 'VIP'; roleBadgeHtml = '<span class="k-role-badge k-role-vip">⭐ VIP</span>'; }

        const pts = u.points || 0;
        
        return `
        <div class="k-user-card">
            <div class="k-user-header">
                <div class="k-user-avatar">${(u.name || 'U').charAt(0).toUpperCase()}</div>
                <div class="k-user-info">
                    <h3>${u.name || 'Sin Nombre'}</h3>
                    <p>📞 ${u.phone || 'Sin número'}</p>
                    <p style="font-size:0.8rem; color:#94a3b8; margin-top:2px;">✉️ ${u.email}</p>
                </div>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:bold; color:#475569; font-size:0.95rem;">Rol actual:</span>
                ${roleBadgeHtml}
            </div>

            <select class="k-role-select" onchange="updateUserRole('${u.email}', this.value)">
                <option value="Normal" ${currentRoleVal==='Normal'?'selected':''}>Normal</option>
                <option value="VIP" ${currentRoleVal==='VIP'?'selected':''}>⭐ VIP</option>
                <option value="Trabajador" ${currentRoleVal==='Trabajador'?'selected':''}>👨‍🍳 Trabajador</option>
                <option value="Admin" ${currentRoleVal==='Admin'?'selected':''}>🛡️ Administrador</option>
            </select>

            <div style="margin-top:8px;">
                <span style="font-weight:bold; color:#475569; font-size:0.95rem; margin-bottom:8px; display:block;">Dulce-Puntos:</span>
                <div class="k-points-control">
                    <button class="k-btn-point" onclick="updateUserPoints('${u.email}', -10)">-10</button>
                    <strong style="color:var(--brand-pink); font-size:1.1rem;">🎟️ ${pts}</strong>
                    <button class="k-btn-point" onclick="updateUserPoints('${u.email}', 10)">+10</button>
                    <button class="k-btn-point" onclick="updateUserPoints('${u.email}', 50)">+50</button>
                </div>
            </div>
        </div>`;
    }).join('');
};

window.updateUserRole = function(email, role) {
    // Redirige al método de admin para evitar duplicar lógica
    const selWrapper = document.createElement('div');
    selWrapper.innerHTML = `<select id="roleSel_${email.replace(/[@.]/g, '_')}"><option value="${role}" selected></option></select>`;
    document.body.appendChild(selWrapper);
    confirmRoleChange(email);
    selWrapper.remove();
};


// === AJUSTES Y PESTAÑAS (SOBREESCRITURAS) ===
window.cambiarPestanaAdmin = function(tab) {
    const containers = document.querySelectorAll('.admin-tab-container');
    containers.forEach(c => c.style.setProperty('display', 'none', 'important'));

    const selected = document.getElementById('admin-tab-' + tab);
    if (selected) {
        selected.style.setProperty('display', 'block', 'important');
    }

    const btnIds = ['pedidos', 'productos', 'contabilidad', 'usuarios'];
    btnIds.forEach(id => {
        const btn = document.getElementById('admin-tab-btn-' + id);
        if (btn) btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById('admin-tab-btn-' + tab);
    if (activeBtn) activeBtn.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
    // 3. EVITAR PANTALLA EN BLANCO Y REPARAR CARRITO:
    const modales = ['modal-detalle-pedido', 'rankingModal', 'adminPasswordModal'];
    modales.forEach(id => {
        const m = document.getElementById(id);
        if (m) {
            m.style.setProperty('display', 'none', 'important');
        }
    });

    if (typeof cambiarPestanaAdmin === 'function') {
        cambiarPestanaAdmin('pedidos');
    }
});

// === RESCATE DE FUNCIONES PERDIDAS ===

// 1. RESCATE DE WHATSAPP LIMPIO Y SIN ROMBOS
window.sendOrder = function() {
    if (cart.length === 0) return alert("¡Tu carrito está vacío!");

    const nameElement = document.getElementById('orderName');
    const addrElement = document.getElementById('orderAddress');
    const notesElement = document.getElementById('orderNotes');
    
    const name = nameElement ? nameElement.value.trim() : (typeof currentUser !== 'undefined' && currentUser ? currentUser.name : '');
    const addr = addrElement ? addrElement.value.trim() : '';
    const notes = notesElement ? notesElement.value.trim() : '';

    if (!name || !addr) return alert("Por favor, llena tu nombre y dirección.");
    if (typeof selectedPay === 'undefined' || !selectedPay) return alert("Por favor, selecciona un método de pago.");

    if (cart.some(i => i.type === 'evento' || i.id.toString().startsWith('custom'))) {
        orderType = 'evento';
    }

    if (typeof currentUser !== 'undefined' && currentUser) {
        const u = typeof db_users !== 'undefined' ? db_users.find(x => x.email === currentUser.email) : null;
        if (u && u.blocked) {
            return alert("Tu cuenta ha sido bloqueada. No puedes realizar pedidos.");
        }
    }

    const tq = cart.reduce((a, i) => a + i.quantity, 0);
    const tp = cart.reduce((a, i) => a + (i.price * i.quantity), 0);
    
    let discount = 0;
    let finalTotal = tp;

    if (typeof currentUser !== 'undefined' && currentUser && typeof adminConfig !== 'undefined' && adminConfig.vipEnabled && tp >= adminConfig.minPurchase) {
        let isCumple = false;
        if (currentUser.birthday) {
            const parts = currentUser.birthday.split('-');
            if (parts.length === 3) {
                const hoy = new Date();
                const bDay = parseInt(parts[2], 10);
                const bMonth = parseInt(parts[1], 10) - 1;
                if (hoy.getDate() === bDay && hoy.getMonth() === bMonth) {
                    isCumple = true;
                }
            }
        }

        if (isCumple) {
            discount = Math.floor(tp * (currentUser.vip ? 0.08 : 0.04));
        } else {
            discount = currentUser.vip ? Math.floor(tp * 0.05) : 0;
        }

        if (discount > adminConfig.maxDiscount) discount = adminConfig.maxDiscount;
        finalTotal = tp - discount;

        let ptsEarned = Math.floor(tp / 1000);

        if (ptsEarned > 0 && typeof db_users !== 'undefined') {
            currentUser.points = (currentUser.points || 0) + ptsEarned;
            const uidx = db_users.findIndex(u => u.email === currentUser.email);
            if (uidx !== -1) { db_users[uidx].points = currentUser.points; if (typeof saveUsersDB === 'function') saveUsersDB(); }
            if (typeof saveUser === 'function') saveUser();
            if (typeof syncUserUI === 'function') syncUserUI();
        }
    }

    // Generar Orden y Guardar en Historial
    const orderId = 'DT-' + Date.now().toString().slice(-4);
    const dateStr = new Date().toLocaleString('es-CO');
    const newOrder = {
        id: orderId,
        date: dateStr,
        customer: name,
        email: typeof currentUser !== 'undefined' && currentUser?.email ? currentUser.email : 'N/A',
        phone: typeof currentUser !== 'undefined' && currentUser?.phone ? currentUser.phone : 'N/A',
        address: addr,
        products: cart.map(i => `${i.quantity}x ${i.name}`).join(', '),
        subtotal: tp,
        discount: discount,
        total: finalTotal,
        status: 'Pendiente',
        payStatus: 'Pendiente - ' + (typeof selectedPay !== 'undefined' ? selectedPay : ''),
        type: (typeof orderType !== 'undefined' ? orderType : 'inmediato'),
        timestamp: Date.now()
    };
    
    if (typeof pedidosHistorial !== 'undefined') {
        pedidosHistorial.push(newOrder);
        if (typeof lastOrderCount !== 'undefined') { lastOrderCount = pedidosHistorial.length; }
        if (typeof savePedidosHistorial === 'function') savePedidosHistorial();
    }
    
    if (typeof currentUser !== 'undefined' && currentUser) {
        if (!currentUser.history) currentUser.history = [];
        currentUser.history.push(newOrder);
        if (typeof db_users !== 'undefined') {
            const uidx = db_users.findIndex(u => u.email === currentUser.email);
            if (uidx !== -1) { db_users[uidx].history = currentUser.history; if (typeof saveUsersDB === 'function') saveUsersDB(); }
        }
        if (typeof saveUser === 'function') saveUser();
    }

    let msg = '¡Hola P&S Punto Dulce! Quiero agendar este pedido para mi celebración:\n\n';
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.vip) {
        msg += `⭐ *PEDIDO PRIORITARIO VIP* ⭐\n\n`;
    }
    msg += `📲 *NUEVO PEDIDO ${orderId}*\n`;
    if (typeof orderType !== 'undefined' && orderType === 'evento') {
        msg = '¡Hola P&S Punto Dulce! Quiero agendar este pedido para mi celebración:\n\n';
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.vip) {
            msg += `⭐ *PEDIDO PRIORITARIO VIP* ⭐\n\n`;
        }
        msg += `🎂 *ENCARGO ESPECIAL DE TORTA PERSONALIZADA*\n`;
        const evtItem = cart.find(i => i.type === 'evento' || i.id.toString().startsWith('custom'));
        if (evtItem && evtItem.customData) {
            msg += `📅 *Fecha de entrega:* ${evtItem.customData.date}\n`;
            msg += `⏰ *Hora:* ${evtItem.customData.time}\n`;
        } else {
            msg += `📅 *Fecha:* ${document.getElementById('eventDate')?.value || 'N/A'}\n`;
            msg += `⏰ *Hora:* ${document.getElementById('eventTime')?.value || 'N/A'}\n`;
        }
    }
    msg += `📍 *Ciudad:* Cúcuta, Norte de Santander\n`;
    if (typeof currentUser !== 'undefined' && currentUser && discount > 0) {
        if (currentUser.vip) {
            msg += `👑 *[CLIENTE VIP ORO - APLICANDO DESCUENTO Y PRIORIDAD]*\n`;
        } else {
            msg += `🎁 *[CLIENTE CLUB DULCE - APLICANDO DESCUENTO Y PUNTOS]*\n`;
        }
    }
    msg += `—————————————————————\n`;
    msg += `👤 *Cliente:* ${name}\n`;
    msg += `🏠 *Dirección / Barrio:* ${addr}\n`;
    msg += `💵 *Pago:* ${typeof selectedPay !== 'undefined' ? selectedPay : ''}\n`;
    if (notes) msg += `📝 *Notas:* ${notes}\n`;
    msg += `—————————————————————\n`;
    msg += `*PRODUCTOS PEDIDOS:*\n`;
    cart.forEach(i => {
        if (i.id.toString().startsWith('custom')) {
            msg += `  • 🎂 ${i.name}\n`;
            msg += `    *Precio:* $${(i.price * i.quantity).toLocaleString()} COP\n`;
            if(i.customData) {
                msg += `    *Detalles:* Sabor: ${i.customData.sabor} | Tamaño: ${i.customData.tamano} | Diseño: ${i.customData.diseno}\n`;
                if (i.customData.message) msg += `    *Mensaje:* "${i.customData.message}"\n`;
                msg += `    🎁 *Kit de Fiesta GRATIS Incluido*\n`;
            }
        } else {
            msg += `  • ${i.quantity}x ${i.name} → $${(i.price * i.quantity).toLocaleString()} COP\n`;
        }
    });
    msg += `—————————————————————\n`;
    msg += `*Total unidades:* ${tq}\n`;
    if (discount > 0) {
        msg += `💰 *Subtotal:* $${tp.toLocaleString()} COP\n`;
        msg += `*Descuento ${typeof currentUser !== 'undefined' && currentUser?.vip ? 'VIP Oro' : 'Base'}:* -$${discount.toLocaleString()} COP\n`;
    }
    msg += `*TOTAL A PAGAR:* $${finalTotal.toLocaleString()} COP\n`;
    if (typeof orderType !== 'undefined' && orderType === 'evento') {
        const dep = Math.ceil(finalTotal / 2);
        msg += `\n⚠️ *Pedido de Evento (Anticipo requerido)*\n`;
        msg += `*Abonar 50% para reservar:* $${dep.toLocaleString()} COP\n`;
        msg += `*Saldo pendiente contra entrega:* $${(finalTotal - dep).toLocaleString()} COP\n`;
    }
    msg += `—————————————————————\n`;
    msg += `¿Me confirman el tiempo estimado de entrega? ¡Muchas gracias! 🙏`;

    // Saneamiento FINAL: Quita los rombos corruptos si la version original los trajo escondidos y previene "undefined"
    msg = msg.replace(/\uFFFD/g, '').replace(/undefined/g, '');

    // Vaciar carrito
    cart = [];
    if (typeof saveCart === 'function') saveCart();
    if (typeof updateCart === 'function') updateCart();
    if (typeof showToast === 'function') showToast("Procesando pedido...", "⏳", 1500);

    setTimeout(() => {
        window.open(`https://wa.me/573229512693?text=${encodeURIComponent(msg)}`, '_blank');
    }, 1000);
};

// 2. RESCATE DEL SELECTOR DE FECHAS
document.addEventListener('DOMContentLoaded', () => {
    const wDate = document.getElementById('w-date');
    const eDate = document.getElementById('eventDate');
    const inputs = [];
    if (wDate) inputs.push(wDate);
    if (eDate) inputs.push(eDate);

    // Mañana en formato YYYY-MM-DD
    const tomorrow = new Date(Date.now() + 86400000);
    const minDateStr = tomorrow.toISOString().split('T')[0];

    inputs.forEach(input => {
        input.min = minDateStr;
        input.addEventListener('click', () => {
            if (typeof input.showPicker === 'function') {
                try { input.showPicker(); } catch(e){}
            }
        });
    });
});

// 3. RESCATE DE PROTECCIÓN DE IMÁGENES ROTAS
window.addEventListener('error', function(e) {
    if (e.target && e.target.tagName === 'IMG') {
        e.target.onerror = null;
        e.target.src = 'logo-pys.png';
    }
}, true);
