/**
 * Módulo control-roles.js
 * Estandariza la definición de roles y controles de acceso 
 * sin modificar script.js
 */

window.addEventListener('DOMContentLoaded', () => {
    // 1. Sobrescribir syncUserUI para aislar el acceso de trabajadores
    const originalSyncUserUI = window.syncUserUI;
    if (originalSyncUserUI) {
        window.syncUserUI = function() {
            // Llamamos a la original para actualizar avatar, puntos, carrito
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

                // Ocultar todo por defecto
                if (deskAdminBtn) deskAdminBtn.style.display = 'none';
                if (mobAdminBtn) mobAdminBtn.style.display = 'none';
                if (deskKitchenBtn) deskKitchenBtn.style.display = 'none';
                if (mobKitchenBtn) mobKitchenBtn.style.display = 'none';
                if (adminOnlyDiv) adminOnlyDiv.style.display = 'none';

                if (isAdmin) {
                    // Admin ve el panel de administrador
                    if (deskAdminBtn) {
                        deskAdminBtn.style.display = 'flex';
                        deskAdminBtn.innerText = '⚙️ Panel Administrador';
                    }
                    if (mobAdminBtn) {
                        mobAdminBtn.style.display = 'flex';
                        mobAdminBtn.innerText = '⚙️ Panel Administrador';
                        mobAdminBtn.setAttribute('onclick', "closeMobileProfile(); showSection('admin-dashboard'); renderAdminUsers(); renderAdminDashboard(); renderLiveOrders(); renderStockAdmin();");
                    }
                    if (adminOnlyDiv) adminOnlyDiv.style.display = 'block';
                    if (adminTitle) adminTitle.innerText = '📊 Panel Administrativo & Financiero';
                } else if (isWorker) {
                    // Trabajador ve EXCLUSIVAMENTE el panel de cocina
                    if (deskKitchenBtn) deskKitchenBtn.style.display = 'flex';
                    if (mobKitchenBtn) {
                        mobKitchenBtn.style.display = 'flex';
                        mobKitchenBtn.setAttribute('onclick', "closeMobileProfile(); openKitchenModal();");
                    }
                    // Ocultamos panel administrativo
                    if (deskAdminBtn) deskAdminBtn.style.display = 'none';
                    if (mobAdminBtn) mobAdminBtn.style.display = 'none';
                }
            }
        };
        // Forzar actualización inmediata si el script cargó después
        if (typeof currentUser !== 'undefined' && currentUser) {
            window.syncUserUI();
        }
    }

    // 2. Sobrescribir renderAdminUsers para estandarizar roles: admin, trabajador, vip, cliente
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
                levelHtml = '<span style="color:#64748b;font-weight:bold;">Cliente Regular</span>';
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
                            <option value="cliente" ${!isUserAdmin && !isUserWorker && !u.vip ? 'selected' : ''}>Cliente</option>
                            <option value="vip" ${u.vip && !isUserAdmin && !isUserWorker ? 'selected' : ''}>VIP</option>
                            <option value="trabajador" ${isUserWorker ? 'selected' : ''}>Trabajador</option>
                            <option value="admin" ${isUserAdmin ? 'selected' : ''}>Admin</option>
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

    // 3. Sobrescribir confirmRoleChange para Admin Panel
    window.confirmRoleChange = function(email) {
        const selectEl = document.getElementById(`roleSel_${email.replace(/[@.]/g, '_')}`);
        if (!selectEl) return;
        const newRole = selectEl.value;

        if (typeof ADMIN_EMAILS !== 'undefined' && ADMIN_EMAILS.includes(email) && newRole !== 'admin') {
            showToast('No se puede quitar el rol al administrador principal', 'error');
            return;
        }

        const u = db_users.find(x => x.email === email);
        if (!u) return;

        // Reset roles
        adminEmails = adminEmails.filter(e => e !== email);
        workerEmails = workerEmails.filter(e => e !== email);
        u.vip = false;
        u.role = 'cliente';
        u.isAdmin = false;

        // Apply new role: 'cliente', 'vip', 'trabajador', 'admin'
        if (newRole === 'admin') {
            adminEmails.push(email);
            u.role = 'admin';
            u.isAdmin = true;
        } else if (newRole === 'trabajador') {
            workerEmails.push(email);
            u.role = 'trabajador';
        } else if (newRole === 'vip') {
            u.vip = true;
            u.role = 'vip';
        }

        if (typeof saveAdminEmails === 'function') saveAdminEmails();
        if (typeof saveUsersDB === 'function') saveUsersDB();
        
        renderAdminUsers();
        if (typeof renderKitchenUsers === 'function') renderKitchenUsers(); // Actualizar panel cocina también
        if (currentUser && currentUser.email === email) { window.syncUserUI(); }
        
        showToast('Rol actualizado a: ' + newRole, '✅');
    };

    // 4. Sobrescribir renderKitchenUsers para Modo Cocina
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
            if (filter === 'cocina') return isWork; // Aunque sea trabajador
            if (filter === 'admin') return isAdm;
            return true;
        });

        container.innerHTML = filtered.map(u => {
            const isAdm = adminEmails.includes(u.email);
            const isWork = workerEmails.includes(u.email);
            
            let currentRoleVal = 'cliente';
            let roleBadgeHtml = '<span class="k-role-badge k-role-regular">Cliente Regular</span>';
            
            if (isAdm) { currentRoleVal = 'admin'; roleBadgeHtml = '<span class="k-role-badge k-role-admin">🛡️ Administrador</span>'; }
            else if (isWork) { currentRoleVal = 'trabajador'; roleBadgeHtml = '<span class="k-role-badge k-role-cocina">👨‍🍳 Trabajador</span>'; }
            else if (u.vip) { currentRoleVal = 'vip'; roleBadgeHtml = '<span class="k-role-badge k-role-vip">⭐ VIP</span>'; }

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
                    <option value="cliente" ${currentRoleVal==='cliente'?'selected':''}>Cliente Regular</option>
                    <option value="vip" ${currentRoleVal==='vip'?'selected':''}>⭐ VIP</option>
                    <option value="trabajador" ${currentRoleVal==='trabajador'?'selected':''}>👨‍🍳 Trabajador</option>
                    <option value="admin" ${currentRoleVal==='admin'?'selected':''}>🛡️ Administrador</option>
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

    // 5. Sobrescribir updateUserRole para Modo Cocina
    window.updateUserRole = function(email, role) {
        const u = db_users.find(x => x.email === email);
        if(!u) return;

        u.vip = false;
        workerEmails = workerEmails.filter(e => e !== email);
        adminEmails = adminEmails.filter(e => e !== email);
        u.role = 'cliente';

        if (role === 'vip') { u.vip = true; u.role = 'vip'; }
        if (role === 'trabajador') { workerEmails.push(email); u.role = 'trabajador'; }
        if (role === 'admin') { adminEmails.push(email); u.role = 'admin'; }

        if (typeof saveUsersDB === 'function') saveUsersDB();
        if (typeof saveAdminEmails === 'function') saveAdminEmails();
        
        if (currentUser && currentUser.email === email) {
            currentUser.vip = u.vip;
            if (typeof saveUser === 'function') saveUser();
            window.syncUserUI();
        }

        renderKitchenUsers();
        if (typeof renderAdminUsers === 'function') renderAdminUsers(); // Sincronizar admin
        showToast(`Rol de ${u.name} actualizado a ${role}`, "✅");
    };
});
