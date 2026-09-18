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

// =========================================================
// MÓDULO MAESTRO DE USUARIOS Y FIRESTORE EN TIEMPO REAL
// =========================================================

// 1. REGISTRO Y LOGIN MANUAL MULTI-DISPOSITIVO
const originalRegisterCustomUser = window.registerCustomUser;
window.registerCustomUser = function(e) {
    if (originalRegisterCustomUser) originalRegisterCustomUser(e);
    
    const nombre = document.getElementById('regName')?.value.trim();
    const correoNormalizado = document.getElementById('regEmail')?.value.trim().toLowerCase();
    const telefono = document.getElementById('regPhone')?.value.trim();
    const password = document.getElementById('regPassword')?.value.trim();
    
    if (correoNormalizado && password && nombre) {
        db.collection('usuarios').doc(correoNormalizado).set({
            nombre: nombre,
            email: correoNormalizado,
            telefono: telefono || 'Sin registrar',
            password: password,
            rol: 'cliente',
            estado: 'activo',
            fechaRegistro: new Date().toLocaleDateString(),
            origen: 'manual'
        }, { merge: true });
    }
};

window.loginCustomUser = function(e) {
    e.preventDefault();
    const correoInput = document.getElementById('loginEmail')?.value.trim().toLowerCase();
    const passInput = document.getElementById('loginPassword')?.value.trim();
    
    if (!correoInput || !passInput) {
        if (typeof showAuthMessage === 'function') showAuthMessage('Por favor ingresa correo y contraseña', 'error');
        return;
    }

    db.collection('usuarios').doc(correoInput).get().then((doc) => {
        if (!doc.exists) return alert('El usuario no existe.');
        const data = doc.data();
        if (data.estado === 'bloqueado' || data.blocked) return alert('Tu cuenta está suspendida.');
        if (data.password !== passInput) return alert('Contraseña incorrecta.');
        
        localStorage.setItem('dt_logged_user', JSON.stringify(data));
        
        if (typeof currentUser !== 'undefined') {
            currentUser = data;
        }
        
        if (typeof actualizarInterfazSesion === 'function') {
            actualizarInterfazSesion(data);
        } else if (typeof syncUserUI === 'function') {
            syncUserUI();
            if (typeof closeMobileProfile === 'function') closeMobileProfile();
            if (typeof showToast === 'function') showToast('¡Bienvenido, ' + (data.nombre || data.name) + '!', '🎉');
        }
    }).catch(err => {
        console.error("Error consultando Firestore:", err);
    });
};

// 2. AUTO-REGISTRO POR GOOGLE SIGN-IN
const originalHandleCredentialResponse = window.handleCredentialResponse;
window.handleCredentialResponse = function(response) {
    if (originalHandleCredentialResponse) originalHandleCredentialResponse(response);
    
    try {
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        
        db.collection('usuarios').doc(decoded.email).set({
            nombre: decoded.name || 'Usuario Google',
            email: decoded.email,
            telefono: 'Sin registrar',
            rol: 'cliente',
            estado: 'activo',
            foto: decoded.picture || '',
            origen: 'google',
            ultimaConexion: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch(e) {
        console.error("Error procesando token de Google:", e);
    }
};

// 3. TABLA DE USUARIOS DEL ADMINISTRADOR EN TIEMPO REAL
window.renderUsersTable = function() {
    db.collection('usuarios').onSnapshot((snapshot) => {
        const listaUsuarios = [];
        snapshot.forEach(doc => listaUsuarios.push({ id: doc.id, ...doc.data() }));
        localStorage.setItem('dt_users_db', JSON.stringify(listaUsuarios));
        
        if (typeof pintarTablaUsuarios === 'function') {
            pintarTablaUsuarios(listaUsuarios);
        } else {
            // Compatibilidad con el sistema actual
            if (typeof db_users !== 'undefined') {
                db_users.length = 0;
                listaUsuarios.forEach(u => {
                    // Mapeo para asegurar compatibilidad
                    if(!u.name) u.name = u.nombre;
                    if(!u.blocked) u.blocked = (u.estado === 'bloqueado');
                    db_users.push(u);
                });
            }
            if (typeof renderAdminUsers === 'function') renderAdminUsers();
        }
    });
};

// Llenar tabla en tiempo real tan pronto inicie
document.addEventListener('DOMContentLoaded', () => {
    if(typeof db !== 'undefined') {
        window.renderUsersTable();
    }
});

// Extender el guardado de rol para actualizar en Firestore directamente
const originalConfirmRoleChangeFS = window.confirmRoleChange;
window.confirmRoleChange = function(emailTarget) {
    const selectEl = document.getElementById(`roleSel_${emailTarget.replace(/[@.]/g, '_')}`);
    if (selectEl) {
        const nuevoRol = selectEl.value;
        db.collection('usuarios').doc(emailTarget).update({ rol: nuevoRol })
            .catch(err => console.warn('No se pudo guardar el rol en Firestore:', err));
    }
    if (originalConfirmRoleChangeFS) originalConfirmRoleChangeFS(emailTarget);
};

// Extender el bloqueo para actualizar en Firestore
const originalAdminToggleBlockFS = window.adminToggleBlock;
window.adminToggleBlock = function(emailTarget) {
    const u = typeof db_users !== 'undefined' ? db_users.find(x => x.email === emailTarget) : null;
    if (u) {
        const nuevoEstado = !u.blocked ? 'bloqueado' : 'activo';
        db.collection('usuarios').doc(emailTarget).update({ estado: nuevoEstado, blocked: !u.blocked })
            .catch(err => console.warn('No se pudo guardar el estado en Firestore:', err));
    }
    if (originalAdminToggleBlockFS) originalAdminToggleBlockFS(emailTarget);
};

// =========================================================
// CORRECCIÓN DE RELLENOS Y PRECIOS DINÁMICOS DE COMBOS
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    // 2. AJUSTE VISUAL PARA MÓVILES (CSS y opciones limpias)
    const style = document.createElement('style');
    style.innerHTML = `
        select.filling-select, .filling-selector select {
            width: 100% !important;
            font-size: 0.82rem !important;
            padding: 7px 10px !important;
            border-radius: 8px !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
        }
    `;
    document.head.appendChild(style);

    // Función para limpiar textos de options sin romper valor
    const limpiarOpcionesCombos = () => {
        const selects = document.querySelectorAll('select.filling-select, .filling-selector select');
        selects.forEach(select => {
            Array.from(select.options).forEach(opt => {
                if (opt.dataset.cleaned) return; // Evita recursión infinita
                let text = opt.text.toLowerCase();
                if (text.includes('queso') && !text.includes('bocadillo') && !text.includes('jamon') && !text.includes('jamón')) {
                    opt.text = "🧀 Queso Campesino ($2.000)";
                    opt.value = "queso";
                } else if (text.includes('bocadillo')) {
                    opt.text = "🍯 Bocadillo con Queso ($2.000)";
                    opt.value = "bocadillo_queso";
                } else if (text.includes('pollo')) {
                    opt.text = "🍗 Pollo Desmechado ($3.000)";
                    opt.value = "pollo";
                } else if (text.includes('jamon') || text.includes('jamón')) {
                    opt.text = "🥓 Jamón y Queso ($3.000)";
                    opt.value = "jamon_queso";
                } else if (text.includes('especial')) {
                    opt.text = "🔥 Especial Trío ($3.500)";
                    opt.value = "especial";
                }
                opt.dataset.cleaned = 'true'; // Marcado como procesado
            });
        });
    };

    // 1. RECÁLCULO DINÁMICO DE PRECIO SEGÚN RELLENO
    document.body.addEventListener('change', (e) => {
        if (e.target.matches('select.filling-select, .filling-selector select')) {
            const selectEl = e.target;
            const card = selectEl.closest('.product-card');
            if (!card) return;

            let productId = null;
            const btn = card.querySelector('button[onclick^="addToCart"]');
            if (btn) {
                const match = btn.getAttribute('onclick').match(/addToCart\((\d+)/);
                if (match) productId = match[1];
            }
            if (!productId) {
                const priceContainerId = card.querySelector('[id^="price-"]')?.id;
                if(priceContainerId) productId = priceContainerId.replace('price-', '');
            }

            if (!productId) return;

            let unidades = 25; // Default fallback
            if (productId == '101') unidades = 25;
            else if (productId == '102') unidades = 50;
            else if (productId == '103') unidades = 100;

            const val = selectEl.value;
            const preciosMap = { queso: 2000, bocadillo_queso: 2000, pollo: 3000, jamon_queso: 3000, especial: 3500 };
            const precioUnit = preciosMap[val] || 2000;
            const total = unidades * precioUnit;

            // Actualizar interfaz visual
            const priceContainer = document.getElementById(`price-${productId}`) || card.querySelector('.current-price')?.parentElement;
            if (priceContainer) {
                if (typeof window.updateProductPrice === 'function') {
                    window.updateProductPrice(productId, val);
                } else {
                    if (val === 'especial') {
                        const tachado = unidades * 3700;
                        priceContainer.innerHTML = `<span style="text-decoration:line-through; color:#999; font-size:0.8rem; margin-right:5px;">$${tachado.toLocaleString('es-CO')}</span> <span class="current-price" style="color:#e11d48;">$${total.toLocaleString('es-CO')}</span> <span class="badge-promo-filling">🔥 5% DTO</span>`;
                    } else {
                        priceContainer.innerHTML = `<span class="current-price">$${total.toLocaleString('es-CO')}</span>`;
                    }
                }
            }

            // Actualizar datos en memoria para el botón (interceptando db_products)
            if (typeof db_products !== 'undefined') {
                const prod = db_products.find(p => p.id == productId);
                if (prod) {
                    prod.price = total;
                    // Actualizar temporalmente el nombre o el relleno (dependiendo de la implementación del cart)
                    prod.selectedFilling = val;
                }
            }
        }
    });

    // Limpiar al inicio y observar cambios en el DOM para inyectar dinámicamente
    limpiarOpcionesCombos();
    const observer = new MutationObserver((mutations) => {
        let shouldClean = false;
        mutations.forEach(m => { if (m.addedNodes.length) shouldClean = true; });
        if (shouldClean) {
            observer.disconnect(); // Desconectar antes de limpiar para evitar recursión
            limpiarOpcionesCombos();
            const grids = document.querySelectorAll('.grid, #productGrid, #featuredGrid');
            grids.forEach(grid => observer.observe(grid, { childList: true, subtree: true }));
        }
    });
    
    const grids = document.querySelectorAll('.grid, #productGrid, #featuredGrid');
    grids.forEach(grid => observer.observe(grid, { childList: true, subtree: true }));
});
// =========================================================
// CORRECCIÓN DE SELECTOR DE CANTIDAD EN PRODUCTOS Y RÁFAGA RÁPIDA
// =========================================================

window.addToCart = function(productId, arg2) {
    let e = null;
    let forcedQty = null;

    if (typeof arg2 === 'object' && arg2 !== null) {
        e = arg2;
    } else if (typeof arg2 === 'number') {
        forcedQty = arg2;
    }

    if (e && e.stopPropagation) e.stopPropagation();

    const p = (typeof db_products !== 'undefined' ? db_products : products).find(x => x.id == productId);
    if (!p) return;

    if (typeof stockConfig !== 'undefined' && stockConfig[productId]) {
        if(typeof showToast === 'function') showToast("Este producto está agotado por hoy.", "🚫");
        return;
    }

    let qty = 1;
    let currentCard = e && e.target ? e.target.closest('.card, .product-card') : null;

    if (forcedQty && forcedQty > 1) {
        qty = forcedQty;
    } else if (currentCard) {
        const inp = currentCard.querySelector(`.qinp-${productId}, #qty-${productId}, .qty-input`);
        if (inp) qty = parseInt(inp.value) || 1;
    } else {
        const inp = document.querySelector(`.qinp-${productId}`) || document.getElementById(`qty-${productId}`);
        qty = parseInt(inp?.value) || 1;
    }
    if (qty < 1) qty = 1;

    let finalPrice = p.price;
    let finalName = p.name;
    let selectedFilling = null;

    let fillingSelect = currentCard ? currentCard.querySelector(`select.filling-select`) : document.getElementById(`filling-sel-${productId}`);
    if (fillingSelect && typeof OPCIONES_RELLENO !== 'undefined') {
        const fillingKey = fillingSelect.value;
        const filling = OPCIONES_RELLENO[fillingKey];
        if (filling && p.permiteRelleno) {
            const units = p.unidades || 1;
            finalPrice = filling.precioUnitario * units;
            finalName = `${p.name} (${filling.nombre})`;
            selectedFilling = filling;
            selectedFilling.id = fillingKey;
        }
    }

    const cartId = selectedFilling ? (productId + '_' + selectedFilling.id) : productId;
    const existing = typeof cart !== 'undefined' ? cart.find(x => (x.cartId || x.id) == cartId || (x.id == productId && x.name === finalName)) : null;

    if (existing) {
        existing.quantity += qty;
    } else if (typeof cart !== 'undefined') {
        cart.push({ ...p, quantity: qty, name: finalName, price: finalPrice, cartId, filling: selectedFilling });
    }

    if (typeof flyAnimation === 'function') flyAnimation(productId);

    if (currentCard) {
        const inp = currentCard.querySelector(`.qinp-${productId}, #qty-${productId}, .qty-input`);
        if (inp) inp.value = 1; // Restablecer inmediatamente a 1 después de capturarlo para clics rápidos
        
        const btn = currentCard.querySelector(`.badd-${productId}, button[onclick^="addToCart"]`);
        if (btn) {
            // Eliminar bloqueos visuales y permitir ráfagas de clic
            btn.style.pointerEvents = 'auto';
            btn.classList.remove('added'); // Por si el CSS viejo lo bloqueaba
            
            // Agrupar visualmente en vez de congelar
            btn.innerHTML = `<span>✓ ¡Agregado (${qty})!</span>`;
            
            // Limpiar timeout previo si lo hay para que no se superpongan
            if (btn.dataset.timeoutId) {
                clearTimeout(parseInt(btn.dataset.timeoutId));
            }
            const tid = setTimeout(() => { 
                btn.innerHTML = '<span>➕ Agregar al Carrito</span>'; 
            }, 800);
            btn.dataset.timeoutId = tid;
        }
    }

    if (typeof updateCart === 'function') updateCart();
    if (typeof saveCart === 'function') saveCart();
    if (typeof showToast === 'function') showToast(`¡${qty}x ${p.name} al carrito!`, '🥐');
};

// --- 5. AUTOMATIZACIÓN DE RENDERIZADO INICIAL Y LIMPIEZA DE DOM ---
const originalShowSectionAdmin = window.showSection;
if (originalShowSectionAdmin) {
    window.showSection = function(sectionId, btn) {
        originalShowSectionAdmin.apply(this, arguments);
        
        // Limpieza visual: Ocultar bottom-nav y footer al entrar al admin
        if (sectionId === 'admin-dashboard') {
            document.body.classList.add('admin-view-active');
            
            // Forzar disparo para que todo se pinte bien
            setTimeout(() => {
                if (typeof window.cambiarPestanaAdmin === 'function') {
                    window.cambiarPestanaAdmin('pedidos');
                }
            }, 50);
        } else {
            // Restaurar navegación si sale a otra sección
            document.body.classList.remove('admin-view-active');
        }
    };
}

const originalCambiarPestanaRol = window.cambiarPestanaAdmin;
if (originalCambiarPestanaRol) {
    window.cambiarPestanaAdmin = function(tabId) {
        originalCambiarPestanaRol.apply(this, arguments);
        
        if (tabId === 'pedidos') {
            const dateInput = document.querySelector('#filtro-fecha-pedidos, input[type="date"], #orderDateFilter');
            if (dateInput) {
                const tzoffset = (new Date()).getTimezoneOffset() * 60000;
                const today = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
                if (!dateInput.value) {
                    dateInput.value = today;
                    if (typeof window.orderDateFilterValue !== 'undefined') window.orderDateFilterValue = today;
                    dateInput.dispatchEvent(new Event('change'));
                }
            }
            if (typeof renderLiveOrders === 'function') renderLiveOrders();
        }
        else if (tabId === 'productos') {
            // Asegurar que el botón "Todos" esté activo visualmente
            const catButtons = document.querySelectorAll('#admin-tab-productos .cat-chip');
            catButtons.forEach(btn => btn.classList.remove('active'));
            if(catButtons.length > 0) catButtons[0].classList.add('active');

            // Renderizar inmediatamente la grilla de stock con la función correcta
            if (typeof renderStockAdmin === 'function') {
                setTimeout(() => { renderStockAdmin(); }, 10);
            }
        }
    };
}

// Inyectar CSS global para asegurar que footer y bottom-nav desaparezcan completamente en la vista admin
const adminStyles = document.createElement('style');
adminStyles.innerHTML = `
    body.admin-view-active .mobile-bottom-nav,
    body.admin-view-active .bottom-nav,
    body.admin-view-active footer,
    body.admin-view-active .info-sections,
    body.admin-view-active .identity-banner {
        display: none !important;
    }
`;
document.head.appendChild(adminStyles);

// --- 6. MÓDULO DE GESTIÓN DINÁMICA DE OFERTAS Y DESCUENTOS ---
window.dtOfertasActivas = JSON.parse(localStorage.getItem('dt_ofertas_activas') || '{}');

window.saveOfertas = function() {
    localStorage.setItem('dt_ofertas_activas', JSON.stringify(window.dtOfertasActivas));
};

// 4. REFLEJO EN LA TIENDA DEL CLIENTE (Interceptar array en memoria)
if (typeof products !== 'undefined') {
    products.forEach(p => {
        if (!p.originalName) p.originalName = p.name;
        if (window.dtOfertasActivas[p.id]) {
            p.oldPrice = window.dtOfertasActivas[p.id].precioOriginal;
            p.price = window.dtOfertasActivas[p.id].precioOferta;
            p.enOferta = true;
            if (window.dtOfertasActivas[p.id].badgePromo) {
                p.tag = window.dtOfertasActivas[p.id].badgePromo;
                p.name = `${p.originalName} [Promo: ${window.dtOfertasActivas[p.id].badgePromo}]`;
            }
        }
    });
}

// 2. MODAL DE CREACIÓN DE OFERTAS
function createOfferModal() {
    if (document.getElementById('modal-ofertas')) return;
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.id = 'modal-ofertas';
    modal.style.display = 'none';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '999999';
    modal.innerHTML = `
        <div class="auth-content" style="max-width:400px; width:90%; padding:20px; background:#fff; border-radius:15px; position:relative; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <button class="auth-close-btn" onclick="document.getElementById('modal-ofertas').style.display='none'" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
            <h3 style="margin-top:0; color:#e11d48; text-align:center;">🏷️ Nueva Oferta</h3>
            <div style="margin-bottom:15px; text-align:left;">
                <label style="display:block; font-size:0.9rem; font-weight:bold; margin-bottom:5px;">Seleccionar Producto</label>
                <select id="oferta-producto" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; font-size:1rem;" onchange="window.updateOfertaPrecio()">
                    <option value="">-- Elige un producto --</option>
                    ${typeof products !== 'undefined' ? products.map(p => `<option value="${p.id}" data-price="${p.oldPrice || p.price}">${p.name} ($${(p.oldPrice || p.price).toLocaleString()})</option>`).join('') : ''}
                </select>
            </div>
            <div style="margin-bottom:15px; text-align:left;">
                <label style="display:block; font-size:0.9rem; font-weight:bold; margin-bottom:5px;">Precio Regular</label>
                <input type="number" id="oferta-precio-original" readonly style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; background:#f8fafc; font-size:1rem;">
                
                <label style="font-size:13px; font-weight:600; color:#475569; display:block; margin-top:10px;">O calcular con % Descuento:</label>
                <input type="number" id="input-oferta-porcentaje" placeholder="Ej: 5 (para 5%)" min="1" max="90" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; margin-top:4px;" oninput="window.calcularDescuentoOferta()">
            </div>
            <div style="margin-bottom:15px; text-align:left;">
                <label style="display:block; font-size:0.9rem; font-weight:bold; margin-bottom:5px; color:#e11d48;">Nuevo Precio (Oferta)</label>
                <input type="number" id="oferta-precio-nuevo" style="width:100%; padding:10px; border-radius:8px; border:1px solid #e11d48; font-size:1rem;" placeholder="Ej: 2000">
            </div>
            <div style="margin-bottom:20px; text-align:left;">
                <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:5px;">Insignia o Promoción Especial (Opcional):</label>
                <input type="text" id="oferta-badge-promo" placeholder="Ej: 🎁 Lleva 1 gratis" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:6px;">
            </div>
            <div style="display:flex; gap:10px;">
                <button onclick="window.guardarOfertaNueva()" style="flex:1; padding:12px; background:#e11d48; color:#fff; border:none; border-radius:8px; font-weight:bold; font-size:1rem; cursor:pointer;">Guardar Oferta</button>
                <button type="button" id="btn-eliminar-oferta" onclick="window.eliminarOfertaDesdeModal()" style="display:none; background:#ef4444; color:#fff; border:none; padding:12px 16px; border-radius:8px; font-weight:600; cursor:pointer;">🗑️ Eliminar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window.calcularDescuentoOferta = function() {
    const originalPrice = parseInt(document.getElementById('oferta-precio-original').value);
    const porcentaje = parseFloat(document.getElementById('input-oferta-porcentaje').value);
    
    if (!isNaN(originalPrice) && !isNaN(porcentaje) && porcentaje > 0) {
        const nuevoPrecio = Math.round(originalPrice * (1 - porcentaje / 100));
        document.getElementById('oferta-precio-nuevo').value = nuevoPrecio;
        document.getElementById('oferta-badge-promo').value = `🎉 ${porcentaje}% OFF`;
    }
};


window.updateOfertaPrecio = function() {
    const sel = document.getElementById('oferta-producto');
    const opt = sel.options[sel.selectedIndex];
    const originalPriceInput = document.getElementById('oferta-precio-original');
    const nuevoPrecioInput = document.getElementById('oferta-precio-nuevo');
    const badgePromoInput = document.getElementById('oferta-badge-promo');
    const btnEliminar = document.getElementById('btn-eliminar-oferta');

    if (opt && opt.value) {
        const pId = opt.value;
        const isOferta = window.dtOfertasActivas[pId];
        
        if (isOferta) {
            originalPriceInput.value = isOferta.precioOriginal;
            nuevoPrecioInput.value = isOferta.precioOferta;
            badgePromoInput.value = isOferta.badgePromo || '';
            document.getElementById('input-oferta-porcentaje').value = '';
            btnEliminar.style.display = 'block';
        } else {
            originalPriceInput.value = opt.getAttribute('data-price');
            nuevoPrecioInput.value = '';
            badgePromoInput.value = '';
            document.getElementById('input-oferta-porcentaje').value = '';
            btnEliminar.style.display = 'none';
        }
    } else {
        originalPriceInput.value = '';
        nuevoPrecioInput.value = '';
        badgePromoInput.value = '';
        document.getElementById('input-oferta-porcentaje').value = '';
        btnEliminar.style.display = 'none';
    }
};

window.abrirModalOferta = function() {
    createOfferModal();
    document.getElementById('oferta-producto').value = '';
    document.getElementById('oferta-precio-original').value = '';
    document.getElementById('oferta-precio-nuevo').value = '';
    document.getElementById('oferta-badge-promo').value = '';
    document.getElementById('input-oferta-porcentaje').value = '';
    document.getElementById('btn-eliminar-oferta').style.display = 'none';
    const m = document.getElementById('modal-ofertas');
    m.style.display = 'flex';
};

window.guardarOfertaNueva = function() {
    const id = document.getElementById('oferta-producto').value;
    const precioOriginal = parseInt(document.getElementById('oferta-precio-original').value);
    const precioOferta = parseInt(document.getElementById('oferta-precio-nuevo').value);
    const badgePromo = document.getElementById('oferta-badge-promo').value.trim();
    
    if (!id || !precioOriginal || !precioOferta) {
        if(typeof showToast === 'function') showToast('Llena todos los campos', '⚠️');
        return;
    }
    if (precioOferta >= precioOriginal) {
        if(typeof showToast === 'function') showToast('La oferta debe ser menor al precio', '⚠️');
        return;
    }
    
    window.dtOfertasActivas[id] = {
        enOferta: true,
        precioOferta: precioOferta,
        precioOriginal: precioOriginal,
        badgePromo: badgePromo
    };
    window.saveOfertas();
    
    // Aplicar en memoria al array products original
    if (typeof products !== 'undefined') {
        const p = products.find(x => x.id == id);
        if (p) {
            if (!p.originalName) p.originalName = p.name;
            p.oldPrice = precioOriginal;
            p.price = precioOferta;
            p.enOferta = true;
            if (badgePromo) {
                p.tag = badgePromo;
                p.name = `${p.originalName} [Promo: ${badgePromo}]`;
            } else {
                delete p.tag;
                p.name = p.originalName;
            }
        }
    }
    
    document.getElementById('modal-ofertas').style.display = 'none';
    if(typeof showToast === 'function') showToast('Oferta guardada con éxito', '🔥');
    
    // Re-render
    if (typeof renderStockAdmin === 'function') renderStockAdmin();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderFeatured === 'function') renderFeatured();
};

window.eliminarOfertaDesdeModal = function() {
    const id = document.getElementById('oferta-producto').value;
    if (id) {
        window.quitarOferta(id);
        document.getElementById('modal-ofertas').style.display = 'none';
    }
};

window.quitarOferta = function(id) {
    if (!window.dtOfertasActivas[id]) return;
    
    // Restaurar en memoria
    if (typeof products !== 'undefined') {
        const p = products.find(x => x.id == id);
        if (p) {
            p.price = window.dtOfertasActivas[id].precioOriginal;
            if (p.originalName) p.name = p.originalName;
            delete p.oldPrice;
            delete p.enOferta;
            delete p.tag;
        }
    }
    
    delete window.dtOfertasActivas[id];
    window.saveOfertas();
    
    if(typeof showToast === 'function') showToast('Oferta removida', '✅');
    if (typeof renderStockAdmin === 'function') renderStockAdmin();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderFeatured === 'function') renderFeatured();
};

window.abrirModalEdicionProducto = function(pId = null) {
    let p = null;
    let isOferta = null;
    let actualBasePrice = 0;
    let actualName = '';
    let actualImg = '';
    let catSelect = 'panaderia';
    
    if (pId) {
        p = products.find(x => x.id === pId);
        if (!p) return;
        isOferta = window.dtOfertasActivas[pId];
        actualBasePrice = isOferta ? isOferta.precioOriginal : p.price;
        actualName = p.originalName || p.name;
        actualImg = p.originalImg || p.img;
        catSelect = p.cat;
    }

    if (!document.getElementById('modal-editar-producto')) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.id = 'modal-editar-producto';
        modal.style.display = 'none';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '999999';
        document.body.appendChild(modal);
    }
    
    // Limpiar el badge de promo del nombre si existe
    let cleanName = actualName;
    if (cleanName.includes('[Promo:')) {
        cleanName = cleanName.substring(0, cleanName.indexOf('[Promo:')).trim();
    }
    
    const modalTitle = pId ? '✏️ Editar Producto' : '✨ Crear Nuevo Producto';
    const btnGuardarText = pId ? '💾 Guardar Cambios' : '💾 Crear Producto';
    const btnRestaurar = pId ? `<button type="button" onclick="window.restaurarProductoOriginal(${pId})" style="flex:1; padding:8px 12px; background:transparent; color:#64748b; border:1px solid #cbd5e1; border-radius:8px; font-weight:600; font-size:13px; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#94a3b8';" onmouseout="this.style.background='transparent'; this.style.borderColor='#cbd5e1';">🔄 Restaurar</button>` : '';
    const btnEliminar = pId ? `<button type="button" id="btn-borrar-prod-modal" onclick="window.eliminarProducto(${pId})" style="flex:1; background:#fef2f2; color:#ef4444; border:1px solid #fecaca; padding:8px 12px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='#fee2e2';" onmouseout="this.style.background='#fef2f2';">🗑️ Eliminar Producto</button>` : '';

    
    const modal = document.getElementById('modal-editar-producto');
    modal.innerHTML = `
        <div class="auth-content" style="max-width:420px; width:92%; padding:24px; background:#fff; border-radius:20px; position:relative; box-shadow:0 12px 32px rgba(0,0,0,0.15);">
            <button class="auth-close-btn" onclick="document.getElementById('modal-editar-producto').style.display='none'" style="position:absolute; top:12px; right:12px; background:#fff; border:1px solid #e2e8f0; border-radius:50%; width:32px; height:32px; font-size:1.1rem; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; transition:all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#fff'">✕</button>
            
            <div style="text-align:center; margin-bottom:20px;">
                <h3 style="margin:0; font-size:18px; font-weight:700; color:#0f172a;">${modalTitle}</h3>
                <p style="margin:4px 0 0 0; color:#64748b; font-size:12px;">Completa los datos para actualizar el catálogo en tiempo real.</p>
            </div>
            
            <div style="margin-bottom:16px;">
                <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:6px;">Nombre del Producto</label>
                <input type="text" id="edit-prod-name" value="${cleanName}" style="width:100%; padding:10px 14px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; font-size:14px; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#10b981'" onblur="this.style.borderColor='#e2e8f0'" placeholder="Ej. Pan Navideño">
            </div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
                <div>
                    <label style="font-size:13px; font-weight:600; color:#475569; display:block; margin-bottom:6px;">Categoría del Producto</label>
                    <select id="edit-prod-category" style="width:100%; padding:10px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; font-size:14px; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#10b981'" onblur="this.style.borderColor='#e2e8f0'">
                        <option value="panaderia" ${catSelect === 'panaderia' ? 'selected' : ''}>🥖 Panadería (Pan)</option>
                        <option value="paquetes" ${catSelect === 'paquetes' ? 'selected' : ''}>📦 Paquetes</option>
                        <option value="antojos" ${catSelect === 'antojos' ? 'selected' : ''}>🍪 Antojos y Galletería</option>
                        <option value="pasteleria" ${catSelect === 'pasteleria' ? 'selected' : ''}>🎂 Tortas & Postres</option>
                        <option value="combos" ${catSelect === 'combos' ? 'selected' : ''}>🔥 Ofertas y Combos</option>
                        <option value="eventos" ${catSelect === 'eventos' ? 'selected' : ''}>🎉 Eventos & Fiestas</option>
                    </select>
                </div>
                <div>
                    <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:6px;">Precio Base (COP)</label>
                    <div style="position:relative;">
                        <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:14px;">$</span>
                        <input type="number" id="edit-prod-price" value="${actualBasePrice || ''}" style="width:100%; padding:10px 14px 10px 24px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; font-size:14px; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#10b981'" onblur="this.style.borderColor='#e2e8f0'" placeholder="1500">
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom:24px;">
                <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:6px;">Fotografía del Producto</label>
                <div style="border:1.5px dashed #cbd5e1; border-radius:12px; background:#f8fafc; padding:16px; display:flex; flex-direction:column; align-items:center; gap:12px; position:relative; transition:border-color 0.2s;" onmouseover="this.style.borderColor='#94a3b8'" onmouseout="this.style.borderColor='#cbd5e1'">
                    <img id="edit-prod-preview" src="${actualImg}" alt="Vista previa" style="height:100px; width:100px; border-radius:8px; object-fit:cover; box-shadow:0 2px 8px rgba(0,0,0,0.08); display: ${actualImg ? 'block' : 'none'};">
                    
                    <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
                        <input type="file" id="edit-prod-file-input" accept="image/*" style="display:none;" onchange="
                            if(this.files && this.files[0]) {
                                const file = this.files[0];
                                document.getElementById('edit-prod-img').value = file.name;
                                const previewImg = document.getElementById('edit-prod-preview');
                                previewImg.src = URL.createObjectURL(file);
                                previewImg.style.display = 'block';
                            }
                        ">
                        <button type="button" onclick="document.getElementById('edit-prod-file-input').click()" style="background:#fff; color:#334155; border:1px solid #cbd5e1; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#fff'">
                            📁 Seleccionar Foto
                        </button>
                    </div>
                    
                    <input type="text" id="edit-prod-img" value="${actualImg}" style="width:100%; padding:6px; border-radius:6px; border:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center; background:#fff; margin-top:4px; outline:none;" placeholder="Nombre de archivo o URL">
                </div>
            </div>
            
            <button onclick="window.guardarEdicionProducto(${pId ? pId : 'null'})" style="width:100%; padding:12px; background:#10b981; color:#fff; border:none; border-radius:10px; font-weight:700; font-size:15px; cursor:pointer; box-shadow:0 4px 12px rgba(16,185,129,0.25); transition:all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(16,185,129,0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.25)';">${btnGuardarText}</button>
            
            ${pId ? `<div style="display:flex; gap:10px; margin-top:12px;">${btnRestaurar}${btnEliminar}</div>` : ''}
        </div>
    `;
    modal.style.display = 'flex';
};

window.guardarEdicionProducto = function(pId) {
    const nuevoNombre = document.getElementById('edit-prod-name').value.trim();
    const nuevoPrecioStr = document.getElementById('edit-prod-price').value;
    const nuevaImg = document.getElementById('edit-prod-img').value.trim() || 'logo-pys.png';
    const nuevaCategoria = document.getElementById('edit-prod-category').value;
    
    const nuevoPrecio = parseInt(nuevoPrecioStr.replace(/\D/g, ''));
    if (!nuevoNombre || isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
        if(typeof showToast === 'function') showToast('Completa el nombre y precio', '⚠️');
        return;
    }
    
    let isNew = !pId;
    let targetId = isNew ? Date.now() : pId;
    
    // Guardar en localStorage
    let localCatalog = {};
    try { localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado')) || {}; } catch(e){}
    
    localCatalog[targetId] = {
        name: nuevoNombre,
        price: nuevoPrecio,
        img: nuevaImg,
        category: nuevaCategoria
    };
    
    if (isNew) {
        localCatalog[targetId].id = targetId;
        localCatalog[targetId].isCustom = true;
    }
    localStorage.setItem('dt_catalogo_personalizado', JSON.stringify(localCatalog));
    
    // Aplicar en memoria
    if (isNew) {
        products.push({
            id: targetId,
            name: nuevoNombre,
            price: nuevoPrecio,
            cat: nuevaCategoria,
            img: nuevaImg,
            desc: 'Producto fresco del día',
            isCustom: true
        });
    } else {
        const p = products.find(x => x.id === pId);
        if (p) {
            if (!p.originalName) p.originalName = p.name;
            if (!p.originalImg) p.originalImg = p.img;
            if (!p.originalCat) p.originalCat = p.cat;
            
            // Mantener badge de promo si existe en el nombre actual inyectado
            const hasBadge = p.name.includes('[Promo:');
            const badgePart = hasBadge ? p.name.substring(p.name.indexOf('[Promo:')) : '';
            p.name = nuevoNombre + (badgePart ? ' ' + badgePart : '');
            
            p.img = nuevaImg;
            p.cat = nuevaCategoria;
            
            const isOferta = window.dtOfertasActivas[pId];
            if (isOferta) {
                p.oldPrice = nuevoPrecio;
                isOferta.precioOriginal = nuevoPrecio;
                window.saveOfertas();
            } else {
                p.price = nuevoPrecio;
            }
        }
    }
    
    // Guardar en Firestore
    if (typeof db !== 'undefined') {
        db.collection('config').doc('catalogo_personalizado').set({
            [targetId]: localCatalog[targetId]
        }, { merge: true }).catch(e => console.error("Error guardando producto", e));
    }
    
    document.getElementById('modal-editar-producto').style.display = 'none';
    if(typeof showToast === 'function') showToast(isNew ? 'Producto creado' : 'Producto actualizado', '✅');
    
    if (typeof renderStockAdmin === 'function') renderStockAdmin();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderFeatured === 'function') renderFeatured();
};

window.restaurarProductoOriginal = function(pId) {
    let localCatalog = {};
    try { localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado')) || {}; } catch(e){}
    
    if (localCatalog[pId]) {
        delete localCatalog[pId];
        localStorage.setItem('dt_catalogo_personalizado', JSON.stringify(localCatalog));
    }
    
    if (typeof db !== 'undefined') {
        db.collection('config').doc('catalogo_personalizado').update({
            [pId]: firebase.firestore.FieldValue.delete()
        }).catch(e => console.error("Error restaurando", e));
    }
    
    document.getElementById('modal-editar-producto').style.display = 'none';
    if(typeof showToast === 'function') showToast('Restaurando valores por defecto...', '🔄');
    setTimeout(() => window.location.reload(), 1000);
};

window.eliminarProducto = function(pId) {
    if (!confirm("¿Seguro que deseas eliminar este producto del catálogo?")) return;
    
    let localCatalog = {};
    try { localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado')) || {}; } catch(e){}
    
    // Marcarlo como eliminado
    localCatalog[pId] = localCatalog[pId] || {};
    localCatalog[pId].eliminado = true;
    
    localStorage.setItem('dt_catalogo_personalizado', JSON.stringify(localCatalog));
    
    // Eliminar de memoria
    const idx = products.findIndex(x => x.id === pId);
    if (idx > -1) products.splice(idx, 1);
    
    if (typeof db !== 'undefined') {
        db.collection('config').doc('catalogo_personalizado').set({
            [pId]: { eliminado: true }
        }, { merge: true }).catch(e => console.error("Error eliminando", e));
    }
    
    document.getElementById('modal-editar-producto').style.display = 'none';
    if(typeof showToast === 'function') showToast('Producto eliminado', '✅');
    
    if (typeof renderStockAdmin === 'function') renderStockAdmin();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderFeatured === 'function') renderFeatured();
};

// 3. ACCIONES DIRECTAS EN CADA TARJETA DE PRODUCTO y BOTÓN GLOBAL
const originalRenderStockAdminOfertas = window.renderStockAdmin;
if (originalRenderStockAdminOfertas) {
    window.renderStockAdmin = function() {
        originalRenderStockAdminOfertas.apply(this, arguments);
        
        // Agregar botones adicionales si no existen en la cabecera del stock
        const controlsDiv = document.getElementById('admin-stock-filters-container');
        if (controlsDiv) {
            if (!document.getElementById('btn-global-offer')) {
                const offerBtn = document.createElement('button');
                offerBtn.id = 'btn-global-offer';
                offerBtn.className = 'cat-chip';
                offerBtn.style.background = '#e11d48';
                offerBtn.style.color = '#fff';
                offerBtn.style.fontWeight = 'bold';
                offerBtn.innerHTML = '🏷️ + Poner Producto en Oferta';
                offerBtn.onclick = () => window.abrirModalOferta();
                controlsDiv.appendChild(offerBtn);
            }
            if (!document.getElementById('btn-promo-regalo')) {
                const regaloBtn = document.createElement('button');
                regaloBtn.id = 'btn-promo-regalo';
                regaloBtn.className = 'cat-chip';
                regaloBtn.style.background = '#8b5cf6';
                regaloBtn.style.color = '#fff';
                regaloBtn.style.fontWeight = 'bold';
                regaloBtn.innerHTML = '🎁 Configurar Regalo por Monto';
                regaloBtn.onclick = () => window.abrirModalPromoRegalo();
                controlsDiv.appendChild(regaloBtn);
            }
        }
        
        // Modificar cada tarjeta de la grilla de stock
        const grid = document.getElementById('admin-stock-grid');
        if (!grid) return;
        
        Array.from(grid.children).forEach((child) => {
            const btn = child.querySelector('button[onclick^="toggleStock"]');
            if (btn) {
                const match = btn.getAttribute('onclick').match(/\d+/);
                if (match) {
                    const pId = parseInt(match[0]);
                    const isOferta = window.dtOfertasActivas[pId];
                    
                    // Botón Editar Producto
                    const btnEditPrice = document.createElement('button');
                    btnEditPrice.className = 'btn-edit-price';
                    btnEditPrice.setAttribute('data-id', pId);
                    btnEditPrice.style.width = '100%';
                    btnEditPrice.style.padding = '6px';
                    btnEditPrice.style.borderRadius = '6px';
                    btnEditPrice.style.marginTop = '8px';
                    btnEditPrice.style.cursor = 'pointer';
                    btnEditPrice.style.border = '1px solid #cbd5e1';
                    btnEditPrice.style.background = '#f8fafc';
                    btnEditPrice.style.color = '#334155';
                    btnEditPrice.style.fontWeight = 'bold';
                    btnEditPrice.style.fontSize = '0.75rem';
                    btnEditPrice.innerHTML = '✏️ Editar Producto';
                    btnEditPrice.onclick = () => window.abrirModalEdicionProducto(pId);
                    child.appendChild(btnEditPrice);
                    
                    // Botón Oferta
                    const btnOferta = document.createElement('button');
                    btnOferta.style.width = '100%';
                    btnOferta.style.padding = '8px';
                    btnOferta.style.borderRadius = '6px';
                    btnOferta.style.marginTop = '4px';
                    btnOferta.style.cursor = 'pointer';
                    btnOferta.style.border = 'none';
                    btnOferta.style.fontWeight = 'bold';
                    btnOferta.style.fontSize = '0.8rem';
                    
                    if (isOferta) {
                        btnOferta.innerHTML = '❌ Quitar de Oferta';
                        btnOferta.style.background = '#f43f5e';
                        btnOferta.style.color = '#fff';
                        btnOferta.onclick = () => window.quitarOferta(pId);
                        
                        // Mostrar precio tachado en el título de la tarjeta de stock
                        const titleStrong = child.querySelector('strong');
                        if (titleStrong && typeof products !== 'undefined') {
                            const p = products.find(x => x.id === pId);
                            const baseName = p.originalName || p.name;
                            if(p) titleStrong.innerHTML = `${baseName}<br><s style="color:#999;font-size:0.75rem;">$${isOferta.precioOriginal.toLocaleString()}</s> <span style="color:#e11d48;">$${isOferta.precioOferta.toLocaleString()}</span>`;
                        }
                    } else {
                        btnOferta.innerHTML = '🏷️ Aplicar Oferta';
                        btnOferta.style.background = '#3b82f6';
                        btnOferta.style.color = '#fff';
                        btnOferta.onclick = () => {
                            window.abrirModalOferta();
                            const sel = document.getElementById('oferta-producto');
                            if(sel) {
                                sel.value = pId;
                                window.updateOfertaPrecio();
                            }
                        };
                        
                        // Mostrar nombre y precio base actualizados en el título de la tarjeta
                        const titleStrong = child.querySelector('strong');
                        if (titleStrong && typeof products !== 'undefined') {
                            const p = products.find(x => x.id === pId);
                            const cleanName = p ? (p.originalName || p.name).replace(/ \[Promo:.*?\]/, '') : '';
                            let localCatalog = {};
                            try { localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado') || '{}'); } catch(e){}
                            
                            if (p && localCatalog[pId] !== undefined) {
                                titleStrong.innerHTML = `${localCatalog[pId].name || cleanName}<br><span style="color:#10b981;">$${(localCatalog[pId].price || p.price).toLocaleString()}</span>`;
                            }
                        }
                    }
                    child.appendChild(btnOferta);
                }
            }
        });
    };
}

// 4. FORZAR RENDERIZADO INICIAL DEL CATÁLOGO "TODOS"
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof renderFeatured === 'function') {
            renderFeatured('todos');
        }
    }, 500); // Pequeño retraso para asegurar que los productos estén cargados
});

// --- MÓDULO DE GESTIÓN DINÁMICA DE TORTAS ---
window.dt_tortas_config = {
    preciosPorSabor: {
        ponque: { q: 38000, m: 65000, l: 110000 },
        tresleches: { q: 45000, m: 75000, l: 130000 },
        chocoarequipe: { q: 45000, m: 75000, l: 130000 }
    },
    precios: {
        '1/4': 45000,
        '1/2': 75000,
        '1': 130000
    },
    disenos: [
        { id: 1, name: '#1', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150' },
        { id: 2, name: '#2', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150' },
        { id: 3, name: '#3', img: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=150' },
        { id: 4, name: '#4', img: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=150' },
        { id: 5, name: '#5', img: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=400&auto=format&fit=crop&q=80' },
        { id: 6, name: '#6', img: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=150' }
    ]
};

// Cargar desde localStorage inicialmente
try {
    const cached = localStorage.getItem('dt_tortas_config');
    if (cached) {
        window.dt_tortas_config = JSON.parse(cached);
    }
} catch(e){}

window.abrirModalConfigTortas = function() {
    if (!document.getElementById('modal-config-tortas')) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.id = 'modal-config-tortas';
        modal.style.display = 'none';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '999999';
        document.body.appendChild(modal);
    }
    window.renderModalConfigTortasInterno();
};

window.renderModalConfigTortasInterno = function() {
    const config = window.dt_tortas_config;
    const modal = document.getElementById('modal-config-tortas');
    
    let disenosHtml = '';
    config.disenos.forEach((d, index) => {
        disenosHtml += `
            <div style="background:#fff; border:1px solid #f1f5f9; border-radius:14px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.06); position:relative;">
                <div style="position:absolute; top:8px; left:8px; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px); color:#fff; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold; z-index:2;">
                    ${d.name}
                </div>
                <img id="preview-torta-img-${index}" src="${d.img}" style="width:100%; height:140px; object-fit:cover; display:block;">
                
                <div style="padding:10px; display:flex; flex-direction:column; gap:8px;">
                    <input type="text" id="torta-name-${index}" value="${d.name}" style="width:100%; padding:6px; border-radius:6px; border:1px solid #e2e8f0; background:#f8fafc; font-size:0.8rem; text-align:center; outline:none;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'">
                    <input type="hidden" id="torta-img-${index}" value="${d.img}">
                    
                    <div style="display:flex; width:100%; gap:6px;">
                        <input type="file" id="torta-file-${index}" accept="image/*" style="display:none;" onchange="
                            if(this.files && this.files[0]) {
                                const file = this.files[0];
                                document.getElementById('torta-img-${index}').value = file.name;
                                document.getElementById('preview-torta-img-${index}').src = URL.createObjectURL(file);
                            }
                        ">
                        <button type="button" onclick="document.getElementById('torta-file-${index}').click()" style="flex:1; background:#f8fafc; color:#475569; border:1px solid #e2e8f0; padding:6px; border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; transition:all 0.2s;">✏️ Cambiar</button>
                        <button type="button" onclick="window.eliminarDisenoTorta(${index})" style="background:#fef2f2; color:#ef4444; border:1px solid #fecaca; padding:6px 10px; border-radius:6px; font-size:0.8rem; cursor:pointer; transition:all 0.2s;">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    });

    modal.innerHTML = `
        <div class="auth-content" style="max-width:800px; width:95%; max-height:90vh; overflow-y:auto; padding:30px; background:#f8fafc; border-radius:24px; position:relative; box-shadow:0 20px 40px rgba(0,0,0,0.15);">
            <button class="auth-close-btn" onclick="document.getElementById('modal-config-tortas').style.display='none'" style="position:absolute; top:15px; right:15px; background:#fff; border:1px solid #e2e8f0; border-radius:50%; width:36px; height:36px; font-size:1.2rem; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; color:#64748b; box-shadow:0 2px 5px rgba(0,0,0,0.05);">✕</button>
            <div style="text-align:center; margin-bottom:24px;">
                <h2 style="margin:0; color:#1e293b; font-size:1.6rem; font-weight:800;">🎂 Configuración de Tortas</h2>
                <p style="margin:6px 0 0 0; color:#64748b; font-size:0.95rem;">Gestiona los precios base por tamaño y la galería de diseños públicos.</p>
            </div>
            
            <!-- BLOQUE A: PRECIOS -->
            <div style="background:#fff; border:1px solid #f1f5f9; padding:20px; border-radius:16px; margin-bottom:24px; box-shadow:0 4px 12px rgba(0,0,0,0.04);">
                <h4 style="margin-top:0; margin-bottom:16px; color:#1e293b; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                    <span>💰</span> Precios por Tamaño Base
                </h4>
                
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; min-width:500px;">
                        <thead>
                            <tr style="border-bottom:2px solid #f1f5f9;">
                                <th style="text-align:left; padding:10px 8px; color:#64748b; font-size:0.85rem; font-weight:600;">Línea / Sabor</th>
                                <th style="text-align:center; padding:10px 8px; color:#64748b; font-size:0.85rem; font-weight:600;">1/4 Lb <span style="display:block; font-size:0.7rem; font-weight:normal;">(10 porc.)</span></th>
                                <th style="text-align:center; padding:10px 8px; color:#64748b; font-size:0.85rem; font-weight:600;">1/2 Lb <span style="display:block; font-size:0.7rem; font-weight:normal;">(20 porc.)</span></th>
                                <th style="text-align:center; padding:10px 8px; color:#64748b; font-size:0.85rem; font-weight:600;">1 Lb <span style="display:block; font-size:0.7rem; font-weight:normal;">(30 porc.)</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Ponqué -->
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:12px 8px; font-weight:600; color:#334155; font-size:0.95rem;">🍰 Ponqué Clásico</td>
                                <td style="padding:12px 8px;"><div style="position:relative;"><span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.85rem;">$</span><input type="number" id="precio-ponque-1-4" value="${config.preciosPorSabor ? config.preciosPorSabor.ponque.q : ''}" style="width:100%; padding:8px 8px 8px 22px; border-radius:8px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'"></div></td>
                                <td style="padding:12px 8px;"><div style="position:relative;"><span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.85rem;">$</span><input type="number" id="precio-ponque-1-2" value="${config.preciosPorSabor ? config.preciosPorSabor.ponque.m : ''}" style="width:100%; padding:8px 8px 8px 22px; border-radius:8px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'"></div></td>
                                <td style="padding:12px 8px;"><div style="position:relative;"><span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.85rem;">$</span><input type="number" id="precio-ponque-1" value="${config.preciosPorSabor ? config.preciosPorSabor.ponque.l : ''}" style="width:100%; padding:8px 8px 8px 22px; border-radius:8px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'"></div></td>
                            </tr>
                            <!-- Tres Leches -->
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:12px 8px; font-weight:600; color:#334155; font-size:0.95rem;">🥛 Clásica Tres Leches</td>
                                <td style="padding:12px 8px;"><div style="position:relative;"><span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.85rem;">$</span><input type="number" id="precio-tresleches-1-4" value="${config.preciosPorSabor ? config.preciosPorSabor.tresleches.q : ''}" style="width:100%; padding:8px 8px 8px 22px; border-radius:8px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'"></div></td>
                                <td style="padding:12px 8px;"><div style="position:relative;"><span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.85rem;">$</span><input type="number" id="precio-tresleches-1-2" value="${config.preciosPorSabor ? config.preciosPorSabor.tresleches.m : ''}" style="width:100%; padding:8px 8px 8px 22px; border-radius:8px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'"></div></td>
                                <td style="padding:12px 8px;"><div style="position:relative;"><span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.85rem;">$</span><input type="number" id="precio-tresleches-1" value="${config.preciosPorSabor ? config.preciosPorSabor.tresleches.l : ''}" style="width:100%; padding:8px 8px 8px 22px; border-radius:8px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'"></div></td>
                            </tr>
                            <!-- Chocoarequipe -->
                            <tr>
                                <td style="padding:12px 8px; font-weight:600; color:#334155; font-size:0.95rem;">🍫 Chocoarequipe</td>
                                <td style="padding:12px 8px;"><div style="position:relative;"><span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.85rem;">$</span><input type="number" id="precio-choco-1-4" value="${config.preciosPorSabor ? config.preciosPorSabor.chocoarequipe.q : ''}" style="width:100%; padding:8px 8px 8px 22px; border-radius:8px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'"></div></td>
                                <td style="padding:12px 8px;"><div style="position:relative;"><span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.85rem;">$</span><input type="number" id="precio-choco-1-2" value="${config.preciosPorSabor ? config.preciosPorSabor.chocoarequipe.m : ''}" style="width:100%; padding:8px 8px 8px 22px; border-radius:8px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'"></div></td>
                                <td style="padding:12px 8px;"><div style="position:relative;"><span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.85rem;">$</span><input type="number" id="precio-choco-1" value="${config.preciosPorSabor ? config.preciosPorSabor.chocoarequipe.l : ''}" style="width:100%; padding:8px 8px 8px 22px; border-radius:8px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'"></div></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- BLOQUE B: DISEÑOS -->
            <div style="margin-bottom:24px;">
                <h4 style="margin-top:0; margin-bottom:16px; color:#1e293b; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                    <span>🖼️</span> Galería de Diseños Disponibles
                </h4>
                
                <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:16px; margin-bottom:20px;">
                    ${disenosHtml}
                </div>
                
                <button type="button" onclick="window.agregarDisenoTorta()" style="width:100%; padding:14px; background:#f8fafc; color:#334155; border:2px dashed #cbd5e1; border-radius:12px; font-weight:bold; cursor:pointer; font-size:0.95rem; transition:all 0.2s;" onmouseover="this.style.borderColor='#94a3b8'; this.style.background='#f1f5f9';" onmouseout="this.style.borderColor='#cbd5e1'; this.style.background='#f8fafc';">➕ Agregar Nuevo Diseño de Torta</button>
            </div>
            
            <button onclick="window.guardarConfigTortas()" style="width:100%; padding:16px; background:#db2777; color:#fff; border:none; border-radius:12px; font-weight:bold; font-size:1.1rem; cursor:pointer; box-shadow:0 4px 14px rgba(219,39,119,0.3); transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(219,39,119,0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 14px rgba(219,39,119,0.3)';">💾 Guardar Configuración</button>
        </div>
    `;
    modal.style.display = 'flex';
};

window.agregarDisenoTorta = function() {
    window.guardarEstadoTemporalTortas();
    
    window.dt_tortas_config.disenos.push({
        id: Date.now(),
        name: '# Nuevo',
        img: 'logo-pys.png'
    });
    window.renderModalConfigTortasInterno();
};

window.eliminarDisenoTorta = function(index) {
    if (!confirm("¿Eliminar este diseño?")) return;
    window.guardarEstadoTemporalTortas();
    window.dt_tortas_config.disenos.splice(index, 1);
    window.renderModalConfigTortasInterno();
};

window.guardarEstadoTemporalTortas = function() {
    const config = window.dt_tortas_config;
    if (!config.preciosPorSabor) config.preciosPorSabor = { ponque: {}, tresleches: {}, chocoarequipe: {} };
    
    // Ponque
    const pq = document.getElementById('precio-ponque-1-4');
    const pm = document.getElementById('precio-ponque-1-2');
    const pl = document.getElementById('precio-ponque-1');
    if (pq) config.preciosPorSabor.ponque.q = parseInt(pq.value) || 0;
    if (pm) config.preciosPorSabor.ponque.m = parseInt(pm.value) || 0;
    if (pl) config.preciosPorSabor.ponque.l = parseInt(pl.value) || 0;

    // Tres Leches
    const tq = document.getElementById('precio-tresleches-1-4');
    const tm = document.getElementById('precio-tresleches-1-2');
    const tl = document.getElementById('precio-tresleches-1');
    if (tq) config.preciosPorSabor.tresleches.q = parseInt(tq.value) || 0;
    if (tm) config.preciosPorSabor.tresleches.m = parseInt(tm.value) || 0;
    if (tl) config.preciosPorSabor.tresleches.l = parseInt(tl.value) || 0;

    // Chocoarequipe
    const cq = document.getElementById('precio-choco-1-4');
    const cm = document.getElementById('precio-choco-1-2');
    const cl = document.getElementById('precio-choco-1');
    if (cq) config.preciosPorSabor.chocoarequipe.q = parseInt(cq.value) || 0;
    if (cm) config.preciosPorSabor.chocoarequipe.m = parseInt(cm.value) || 0;
    if (cl) config.preciosPorSabor.chocoarequipe.l = parseInt(cl.value) || 0;
    
    config.disenos.forEach((d, i) => {
        const nName = document.getElementById(`torta-name-${i}`);
        const nImg = document.getElementById(`torta-img-${i}`);
        if(nName) d.name = nName.value;
        if(nImg) d.img = nImg.value;
    });
};

window.guardarConfigTortas = function() {
    window.guardarEstadoTemporalTortas();
    
    if (window.dt_tortas_config.preciosPorSabor && window.dt_tortas_config.preciosPorSabor.ponque.q <= 0) {
        if(typeof showToast === 'function') showToast("Revisa los precios", "⚠️");
        return;
    }

    localStorage.setItem('dt_tortas_config', JSON.stringify(window.dt_tortas_config));
    
    if (typeof db !== 'undefined') {
        db.collection('config').doc('tortas_config').set(window.dt_tortas_config)
            .then(() => {
                if(typeof showToast === 'function') showToast("Configuración de tortas guardada", "✅");
            })
            .catch(e => console.error("Error guardando config tortas:", e));
    } else {
        if(typeof showToast === 'function') showToast("Guardado localmente", "✅");
    }
    
    document.getElementById('modal-config-tortas').style.display = 'none';
    window.renderConfigTortasPublica();
};

window.renderConfigTortasPublica = function() {
    const config = window.dt_tortas_config;
    
    // Forzar actualización de los precios según el sabor seleccionado actualmente
    if (typeof wizardData !== 'undefined' && typeof selectSabor === 'function') {
        const selectedEl = document.querySelector('.wizard-options-grid .step-option-card.selected') || document.querySelector('.wizard-options-grid .step-option-card');
        const saborAUsar = wizardData.sabor || 'Clásica Tres Leches';
        if (selectedEl) {
            selectSabor(saborAUsar, selectedEl);
        }
    }
    
    const grid = document.getElementById('cake-design-grid');
    if (grid) {
        let html = '';
        config.disenos.forEach(d => {
            html += `
                <div class="design-thumb" onclick="selectDiseno('${d.name}', this)">
                    <img src="${d.img}" alt="Diseño ${d.name}" style="width:100%; border-radius:8px; object-fit:cover; aspect-ratio:1;" onerror="this.src='logo-pys.png'">
                    <div style="text-align:center; font-weight:bold; font-size:0.9rem; margin-top:4px;">${d.name}</div>
                </div>
            `;
        });
        grid.innerHTML = html;
    }
};

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof window.renderConfigTortasPublica === 'function') {
            window.renderConfigTortasPublica();
        }
    }, 500);
});

// --- SISTEMA DE PROMOCIÓN GLOBAL (REGALO POR COMPRA MÍNIMA) ---
window.dt_promo_regalo = window.dt_promo_regalo || { activa: false, montoMinimo: 0, productoId: null, cantidad: 1 };

window.abrirModalPromoRegalo = function() {
    if (!document.getElementById('modal-promo-regalo')) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.id = 'modal-promo-regalo';
        modal.style.display = 'none';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '999999';
        document.body.appendChild(modal);
    }
    
    const m = document.getElementById('modal-promo-regalo');
    const conf = window.dt_promo_regalo;
    
    // Opciones de productos para el regalo
    const prodOptions = typeof products !== 'undefined' 
        ? products.map(p => `<option value="${p.id}" ${conf.productoId == p.id ? 'selected' : ''}>${p.name}</option>`).join('') 
        : '';
        
    m.innerHTML = `
        <div class="auth-content" style="max-width:400px; width:90%; padding:20px; background:#fff; border-radius:15px; position:relative; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <button class="auth-close-btn" onclick="document.getElementById('modal-promo-regalo').style.display='none'" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
            <h3 style="margin-top:0; color:#8b5cf6; text-align:center;">🎁 Configurar Regalo</h3>
            
            <div style="margin-bottom:12px; text-align:left;">
                <label style="font-size:13px; font-weight:600; color:#334155; display:block; margin-bottom:5px;">Nombre o Mensaje de la Promoción:</label>
                <input type="text" id="promo-regalo-nombre" value="${conf.nombrePromo || ''}" placeholder="Ej: ❤️ Especial Amor y Amistad" style="width:100%; padding:9px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px;">
            </div>
            
            <div style="margin-bottom:15px; text-align:left;">
                <label style="display:block; font-size:0.9rem; font-weight:bold; margin-bottom:5px;">Monto mínimo de compra (COP)</label>
                <input type="number" id="promo-regalo-monto" value="${conf.montoMinimo || ''}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; font-size:1rem;" placeholder="Ej. 50000">
            </div>
            
            <div style="margin-bottom:15px; text-align:left;">
                <label style="display:block; font-size:0.9rem; font-weight:bold; margin-bottom:5px;">Producto de Regalo</label>
                <select id="promo-regalo-producto" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; font-size:1rem;">
                    <option value="">-- Elige un producto --</option>
                    ${prodOptions}
                </select>
            </div>
            
            <div style="margin-bottom:15px; text-align:left;">
                <label style="display:block; font-size:0.9rem; font-weight:bold; margin-bottom:5px;">Cantidad a regalar</label>
                <input type="number" id="promo-regalo-qty" value="${conf.cantidad || 1}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; font-size:1rem;" min="1">
            </div>
            
            <div style="margin-bottom:20px; text-align:left;">
                <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-weight:bold; color:#475569;">
                    <input type="checkbox" id="promo-regalo-activa" ${conf.activa ? 'checked' : ''} style="width:18px; height:18px;">
                    Activar Promoción
                </label>
            </div>
            
            <button onclick="window.guardarPromoRegalo()" style="width:100%; padding:12px; background:#8b5cf6; color:#fff; border:none; border-radius:8px; font-weight:bold; font-size:1rem; cursor:pointer;">💾 Guardar Configuración</button>
        </div>
    `;
    m.style.display = 'flex';
};

window.guardarPromoRegalo = function() {
    window.dt_promo_regalo = {
        activa: document.getElementById('promo-regalo-activa').checked,
        nombrePromo: document.getElementById('promo-regalo-nombre').value.trim() || 'Promo Especial',
        montoMinimo: parseInt(document.getElementById('promo-regalo-monto').value) || 0,
        productoId: parseInt(document.getElementById('promo-regalo-producto').value) || null,
        cantidad: parseInt(document.getElementById('promo-regalo-qty').value) || 1
    };
    
    if (window.dt_promo_regalo.activa && (!window.dt_promo_regalo.montoMinimo || !window.dt_promo_regalo.productoId)) {
        if(typeof showToast === 'function') showToast('Revisa monto y producto', '⚠️');
        return;
    }

    localStorage.setItem('dt_promo_regalo', JSON.stringify(window.dt_promo_regalo));
    
    if (typeof db !== 'undefined') {
        db.collection('config').doc('promocion_regalo').set(window.dt_promo_regalo)
            .then(() => {
                if(typeof showToast === 'function') showToast("Promo de regalo guardada", "🎁");
            })
            .catch(e => console.error("Error guardando promo:", e));
    } else {
        if(typeof showToast === 'function') showToast("Promo guardada localmente", "🎁");
    }
    
    document.getElementById('modal-promo-regalo').style.display = 'none';
    
    // Forzar re-evaluacion del carrito por si cambia el estado activo
    if (typeof updateCart === 'function') updateCart();
};