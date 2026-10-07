
// Extracted from script.js
window.renderAdminUsers = function() {
    if (typeof window.renderAdminClaims === 'function') window.renderAdminClaims();
    const tbody = document.getElementById('admin-users-table');
    if (!tbody) return;
    const q = (document.getElementById('adminUserSearch')?.value || '').toLowerCase();

    const filteredUsers = db_users.filter(u => {
        const matchSearch = (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.phone || '').toLowerCase().includes(q);
        if (!matchSearch) return false;

        const isAdm = adminEmails.includes(u.email);
        const isWork = workerEmails.includes(u.email);

        if (currentRoleFilter === 'Administradores') return isAdm;
        if (currentRoleFilter === 'Trabajadores') return isWork;
        if (currentRoleFilter === 'VIP') return u.vip;
        if (currentRoleFilter === 'Normales') return !isAdm && !isWork && !u.vip;
        return true;
    });

    if (filteredUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding:15px;text-align:center;">No se encontraron clientes.</td></tr>`;
        return;
    }
    tbody.innerHTML = filteredUsers.map(u => {
        const userEmailNorm = (u.email || '').toLowerCase().trim();
        const isSuper = SUPER_ADMINS.includes(userEmailNorm);
        const isUserAdmin = isSuper || adminEmails.includes(u.email);
        const isUserWorker = !isSuper && workerEmails.includes(u.email);

        let levelHtml = '';
        if (isSuper) {
            levelHtml = '<span style="background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; font-weight:800; padding:4px 10px; border-radius:20px; font-size:0.8rem; box-shadow:0 2px 6px rgba(217,119,6,0.3); display:inline-flex; align-items:center; gap:4px;">👑 Super Admin (Dueño)</span>';
        } else if (isUserAdmin) {
            levelHtml = '<span style="color:#1d4ed8;font-weight:bold;">Administrador</span>';
        } else if (isUserWorker) {
            levelHtml = '<span style="color:#8b5cf6;font-weight:bold;">Trabajador</span>';
        } else if (u.vip) {
            if (u.vipExpiresAt) {
                const fechaExp = new Date(u.vipExpiresAt);
                const diasRestantes = Math.ceil((fechaExp - new Date()) / (1000 * 60 * 60 * 24));
                const fechaFormateada = fechaExp.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
                levelHtml = `<span style="color:#d97706;font-weight:bold;">👑 VIP Oro</span><br><small style="color:#888;">Vence: ${fechaFormateada}<br>(${diasRestantes > 0 ? diasRestantes + ' días' : 'Vencido'})</small>`;
            } else {
                levelHtml = '<span style="color:#d97706;font-weight:bold;">👑 VIP Oro</span>';
            }
        } else {
            levelHtml = '<span style="color:#64748b;font-weight:bold;">Cliente Normal</span>';
        }

        return `
            <tr style="border-bottom:1px solid #eee; background:${!isSuper && u.blocked ? '#fff1f2' : (isSuper ? '#fffbeb' : (isUserAdmin ? '#eff6ff' : (isUserWorker ? '#f3e8ff' : 'transparent')))}">
                <td style="padding:10px; display:flex; align-items:center; gap:10px;">
                    <img src="${safeImg(u.picture)}" onerror="this.onerror=null; this.src='logo-pys.png';" style="width:30px;height:30px;border-radius:50%;">
                    <strong>${escapeHTML(u.name)}</strong>
                </td>
                <td style="padding:10px; font-size:0.85rem; color:#555;">${escapeHTML(u.phone || '-')}</td>
                <td style="padding:10px; font-size:0.85rem; color:#555;">${escapeHTML(u.email)}</td>
                <td style="padding:10px; text-align:center;">${levelHtml}</td>
                <td style="padding:10px; text-align:center; font-weight:bold; color:${isSuper ? '#10b981' : (u.blocked ? '#e11d48' : '#10b981')};">${isSuper ? 'Inmutable (Activo)' : (u.blocked ? 'Bloqueado' : 'Activo')}</td>
                <td style="padding:10px; text-align:center;">
                    ${isSuper ? `
                    <div style="display:inline-flex; align-items:center; gap:5px; background:#fef3c7; color:#b45309; border:1px solid #fde68a; padding:6px 12px; border-radius:8px; font-size:0.75rem; font-weight:bold;">
                        <span>🛡️ Cuenta Inmutable</span>
                    </div>` : `
                    <div style="display:flex; flex-direction:column; gap:4px; align-items:center;">
                        <div style="display:flex; gap:4px; width:100%; align-items:center;">
                            <select id="roleSel_${(u.email || '').replace(/[@.]/g, '_')}" style="flex:1; padding:4px; font-size:0.75rem; border-radius:4px; border:1px solid #ccc; outline:none;">
                                <option value="normal" ${!isUserAdmin && !isUserWorker && !u.vip ? 'selected' : ''}>Normal</option>
                                <option value="vip" ${u.vip && !isUserAdmin && !isUserWorker ? 'selected' : ''}>VIP</option>
                                <option value="trabajador" ${isUserWorker ? 'selected' : ''}>Trabajador</option>
                                <option value="admin" ${isUserAdmin ? 'selected' : ''}>Admin</option>
                            </select>
                            <button onclick="confirmRoleChange('${u.email}')" style="background:var(--brand-pink); color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;">Guardar</button>
                        </div>
                        <div style="display:flex; gap:4px; width:100%;">
                            <button onclick="window.abrirModalEditarUsuarioAdmin('${u.email}')" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; flex:1; font-weight:600;">✏️ Editar</button>
                            ${(u.password !== undefined) ? `<button onclick="adminChangePassword('${u.email}')" style="background:#f3f4f6; color:#4b5563; border:1px solid #d1d5db; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; flex:1;">🔑 Cambiar Clave</button>` : ''}
                        </div>
                        <button onclick="adminToggleBlock('${u.email}')" style="background:${u.blocked ? '#d1fae5' : '#fee2e2'}; color:${u.blocked ? '#059669' : '#e11d48'}; border:none; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; width:100%;">${u.blocked ? 'Desbloquear' : 'Bloquear'}</button>
                        <button onclick="adminDeleteUser('${u.email}')" style="background:#fff1f2; color:#e11d48; border:1px solid #fecdd3; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; width:100%;">Eliminar</button>
                    </div>`}
                </td>
            </tr>
            `;
    }).join('');
}

// Extracted from script.js
window.adminRegisterUser = function() {
    const name = document.getElementById('adminNewName').value.trim();
    const email = document.getElementById('adminNewEmail').value.trim().toLowerCase();
    if (!name || !email) return alert('Por favor, completa ambos campos.');
    if (db_users.find(u => u.email === email)) return alert('Este correo ya está registrado.');

    db_users.push({
        name, email,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d81b60&color=fff&bold=true`,
        blocked: false,
        points: 15
    });
    saveUsersDB();
    document.getElementById('adminNewName').value = '';
    document.getElementById('adminNewEmail').value = '';
    renderAdminUsers();
    showToast('Cliente registrado exitosamente', '✅');
}

// Extracted from script.js
window.filterAdminUsers = function() {
    renderAdminUsers();
}


// Extracted from script.js
window.adminDeleteUser = function(email) {
    const targetEmail = (email || '').toLowerCase().trim();
    if (SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }
    if (!confirm(`¿Estás seguro de que deseas eliminar el correo ${email}?`)) return;
    db_users = db_users.filter(u => (u.email || '').toLowerCase().trim() !== targetEmail);
    saveUsersDB();
    renderAdminUsers();
    showToast('Cliente eliminado', '🗑️');
}


// Extracted from script.js
window.openAdminPointsModal = function (e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    console.log("-> Abriendo modal de puntos y club VIP...");

    const modal = document.getElementById('adminPointsModal') || document.getElementById('modal-admin-points');
    if (!modal) {
        console.error("No se encontró el elemento #adminPointsModal en el DOM");
        alert("Error: El modal de configuración de puntos no existe en la página.");
        return;
    }

    const currentList = (window.pointRewards && Array.isArray(window.pointRewards) && window.pointRewards.length > 0)
        ? window.pointRewards
        : ((typeof pointRewards !== 'undefined' && Array.isArray(pointRewards) && pointRewards.length > 0) ? pointRewards : defaultPointRewards);

    window.tempAdminRewards = JSON.parse(JSON.stringify(currentList));

    if (typeof renderAdminRewardsTable === 'function') {
        renderAdminRewardsTable();
    } else if (typeof renderAdminPointsRewards === 'function') {
        renderAdminPointsRewards();
    } else if (typeof renderAdminPointsModalContent === 'function') {
        renderAdminPointsModalContent();
    }

    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.style.zIndex = '999999';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
};

// Extracted from script.js
window.saveConfigFromAdmin = function() {
    const min = parseInt(document.getElementById('adminMinPurchase').value) || 0;
    const max = parseInt(document.getElementById('adminMaxDiscount').value) || 0;
    const en = document.getElementById('adminVipEnabled').checked;

    adminConfig.minPurchase = min;
    adminConfig.maxDiscount = max;
    adminConfig.vipEnabled = en;
    saveAdminConfig();
    updateCart();

    showToast('Configuración guardada', '✅');
}

// Extracted from script.js
window.renderAdminNotifList = function () {
    const listEl = document.getElementById('adminNotifList');
    const badgeEl = document.getElementById('adminNotifBadge');

    let notifications = [];
    try {
        notifications = JSON.parse(localStorage.getItem('dt_notifications') || '[]');
    } catch (e) {
        notifications = [];
    }

    // Fallback a dt_live_alerts si dt_notifications está vacío
    if (notifications.length === 0) {
        try {
            const alerts = JSON.parse(localStorage.getItem('dt_live_alerts') || '[]');
            if (alerts.length > 0) {
                notifications = alerts.map((a, idx) => ({
                    id: 'alert_' + idx,
                    title: a.title || 'Notificación',
                    message: (a.user ? `${a.user} - ` : '') + (a.email || ''),
                    time: a.date || 'Hace un momento',
                    read: false,
                    timestamp: Date.now()
                }));
            }
        } catch (e) { }
    }

    const unreadCount = notifications.filter(n => !n.read).length;

    // Actualizar badge rojo sobre la campana
    if (badgeEl) {
        if (unreadCount > 0) {
            badgeEl.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badgeEl.style.display = 'inline-block';
        } else {
            badgeEl.style.display = 'none';
        }
    }

    if (!listEl) return;

    if (notifications.length === 0) {
        listEl.innerHTML = '<p style="font-size: 0.82rem; color: #999; text-align: center; margin: 15px 0;">No hay notificaciones nuevas</p>';
        return;
    }

    listEl.innerHTML = notifications.map(item => {
        const isUnread = !item.read;
        let timeDisplay = item.time || 'Hace un momento';
        if (item.timestamp) {
            const diffSec = Math.max(0, Math.floor((Date.now() - item.timestamp) / 1000));
            if (diffSec < 60) timeDisplay = 'Hace unos segundos';
            else if (diffSec < 3600) timeDisplay = `Hace ${Math.floor(diffSec / 60)} min`;
            else if (diffSec < 86400) timeDisplay = `Hace ${Math.floor(diffSec / 3600)} h`;
            else timeDisplay = new Date(item.timestamp).toLocaleDateString('es-CO');
        }

        const payloadStr = encodeURIComponent(JSON.stringify(item));
        return `
            <div onclick="window.handleNotifClick(event, '${payloadStr}')" style="cursor: pointer; background: ${isUnread ? '#fff5f7' : '#fafafa'}; border-left: 3px solid ${isUnread ? '#e91e63' : '#cbd5e1'}; border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
                    <div style="font-weight: 700; color: #1e293b;">${item.title || '🔔 Notificación'}</div>
                    <span style="font-size: 0.68rem; color: #94a3b8; white-space: nowrap;">${timeDisplay}</span>
                </div>
                <div style="color: #475569; font-size: 0.78rem; margin-top: 3px; word-break: break-word;">${item.message || ''}</div>
            </div>
        `;
    }).join('');
};

// Extracted from script.js
window.toggleAdminNotifDropdown = function () {
    const dd = document.getElementById('adminNotifDropdown');
    if (!dd) return;
    const isOpen = dd.style.display === 'block';
    if (isOpen) {
        dd.style.display = 'none';
    } else {
        dd.style.display = 'block';
        if (typeof window.adjustNotifDropdownPosition === 'function') {
            window.adjustNotifDropdownPosition();
        }
        // Marcar todas las notificaciones como leídas al abrir la bandeja
        try {
            let notifs = JSON.parse(localStorage.getItem('dt_notifications') || '[]');
            let changed = false;
            notifs.forEach(n => {
                if (!n.read) {
                    n.read = true;
                    changed = true;
                }
            });
            if (changed) {
                localStorage.setItem('dt_notifications', JSON.stringify(notifs));
            }
        } catch (e) { }
        if (window.renderAdminNotifList) window.renderAdminNotifList();
    }
};

// Extracted from script.js
window.clearAdminNotifs = function () {
    localStorage.setItem('dt_notifications', '[]');
    localStorage.setItem('dt_live_alerts', '[]');
    if (window.renderAdminNotifList) window.renderAdminNotifList();
};


// Extracted from control-roles.js
window.adminToggleBlock = function (email) {
    const targetEmail = (email || '').toLowerCase().trim();
    if (SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }

    const u = db_users.find(x => x && x.email && (x.email || '').toLowerCase().trim() === targetEmail);
    if (!u) return;
    u.blocked = !u.blocked;
    if (typeof saveUsersDB === 'function') saveUsersDB();
    renderAdminUsers();

    // Si el usuario bloqueado es el actual, forzar cierre
    if (currentUser && (currentUser.email || '').toLowerCase().trim() === targetEmail && u.blocked) {
        if (typeof logoutUser === 'function') {
            logoutUser(new Event('click'));
        }
    }
    if (typeof showToast === 'function') showToast(u.blocked ? 'Usuario bloqueado. No podrá iniciar sesión.' : 'Usuario desbloqueado.', u.blocked ? '⛔' : '✅');
};



// Extracted from control-roles.js
window.updateUserRole = function (email, role) {
    const targetEmail = (email || '').toLowerCase().trim();
    if (SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }
    // Redirige al método de admin para evitar duplicar lógica
    const selWrapper = document.createElement('div');
    selWrapper.innerHTML = `<select id="roleSel_${(email || '').replace(/[@.]/g, '_')}"><option value="${role}" selected></option></select>`;
    document.body.appendChild(selWrapper);
    confirmRoleChange(email);
    selWrapper.remove();
};

// Extracted from control-roles.js
window.abrirModalConfigTortas = function () {
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

// Extracted from control-roles.js
window.guardarConfigTortas = function () {
    window.guardarEstadoTemporalTortas();

    if (!window.dt_tortas_config.sabores || window.dt_tortas_config.sabores.length === 0) {
        if (typeof showToast === 'function') showToast("Debe haber al menos un sabor configurado", "⚠️");
        return;
    }

    localStorage.setItem('dt_tortas_config', JSON.stringify(window.dt_tortas_config));

    if (typeof db !== 'undefined') {
        db.collection('config').doc('tortas_config').set(window.dt_tortas_config)
            .then(() => {
                if (typeof showToast === 'function') showToast("Configuración de tortas guardada", "✅");
            })
            .catch(e => {
                console.error("Error guardando config tortas:", e);
                if (typeof showToast === 'function') showToast("Error guardando en la nube", "⚠️");
            });
    } else {
        if (typeof showToast === 'function') showToast("Guardado localmente", "✅");
    }

    const modal = document.getElementById('modal-config-tortas');
    if (modal) modal.style.display = 'none';
    window.renderConfigTortasPublica();
};

// Extracted from control-roles.js
window.abrirModalConfigDelivery = function () {
    if (!document.getElementById('modal-config-delivery')) {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.id = 'modal-config-delivery';
        modal.style.display = 'none';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '999999';
        document.body.appendChild(modal);
    }

    const m = document.getElementById('modal-config-delivery');

    m.innerHTML = `
        <div class="auth-content" style="max-width:350px; width:90%; padding:20px; background:#fff; border-radius:15px; position:relative; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <button class="auth-close-btn" onclick="document.getElementById('modal-config-delivery').style.display='none'" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:1.5rem; cursor:pointer;">✕</button>
            <h3 style="margin-top:0; color:#f59e0b; text-align:center;">🛵 Domicilio Gratis</h3>
            
            <div style="margin-bottom:15px; text-align:left;">
                <label style="display:block; font-size:0.9rem; font-weight:bold; margin-bottom:5px;">Monto mínimo de compra (COP)</label>
                <input type="number" id="config-delivery-min" value="${window.dt_min_free_delivery}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; font-size:1rem;" placeholder="Ej. 10000">
                <small style="color:#64748b; font-size:0.8rem; display:block; margin-top:5px;">Los clientes que superen este monto no pagarán domicilio ($5.000).</small>
            </div>
            
            <button onclick="window.guardarConfigDelivery()" style="width:100%; padding:12px; background:#f59e0b; color:#fff; border:none; border-radius:8px; font-weight:bold; font-size:1rem; cursor:pointer;">💾 Guardar Configuración</button>
        </div>
    `;
    m.style.display = 'flex';
};

// Extracted from control-roles.js
window.guardarConfigDelivery = function () {
    const val = parseInt(document.getElementById('config-delivery-min').value);
    if (isNaN(val) || val < 0) {
        if (typeof showToast === 'function') showToast('Ingresa un monto válido', '⚠️');
        return;
    }

    window.dt_min_free_delivery = val;

    if (typeof db !== 'undefined') {
        db.collection('config').doc('tienda').set({ minFreeDelivery: val }, { merge: true })
            .then(() => {
                if (typeof showToast === 'function') showToast("Monto guardado con éxito", "🛵");
                document.getElementById('modal-config-delivery').style.display = 'none';
                if (typeof updateCart === 'function') updateCart();
            })
            .catch(err => {
                console.error("Error guardando config:", err);
                if (typeof showToast === 'function') showToast("Error al guardar", "❌");
            });
    } else {
        if (typeof showToast === 'function') showToast("No hay conexión a BD", "⚠️");
    }
};

// Extracted from control-roles.js
window.abrirModalEdicionProducto = function (pId = null) {
    let p = null;
    let isOferta = null;
    let actualBasePrice = 0;
    let actualName = '';
    let actualImg = '';
    let catSelect = 'panaderia';

    let actualPoints = '';
    if (pId) {
        p = products.find(x => x.id === pId);
        if (!p) return;
        isOferta = window.dtOfertasActivas[pId];
        actualBasePrice = isOferta ? isOferta.precioOriginal : p.price;
        actualName = p.originalName || p.name;
        actualImg = p.img || p.originalImg;
        catSelect = p.cat;
        actualPoints = p.points !== undefined ? p.points : (p.puntos !== undefined ? p.puntos : '');
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

            <div style="margin-bottom:16px;">
                <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:6px;">⭐ Puntos que otorga (Club VIP)</label>
                <input type="number" id="newProductPoints" value="${actualPoints !== undefined && actualPoints !== '' ? actualPoints : ''}" min="0" placeholder="Puntos que otorga (ej: 10)" style="width:100%; padding:10px 14px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0; font-size:14px; color:#1e293b; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#10b981'" onblur="this.style.borderColor='#e2e8f0'">
            </div>
            
            <div style="margin-bottom:24px;">
                <label style="display:block; font-size:13px; font-weight:600; color:#475569; margin-bottom:6px;">Fotografía del Producto</label>
                <div style="border:1.5px dashed #cbd5e1; border-radius:12px; background:#f8fafc; padding:16px; display:flex; flex-direction:column; align-items:center; gap:12px; position:relative; transition:border-color 0.2s;" onmouseover="this.style.borderColor='#94a3b8'" onmouseout="this.style.borderColor='#cbd5e1'">
                    <img id="editProductImgPreview" class="product-img-preview" src="${actualImg || 'logo-pys.png'}" alt="Vista previa" onerror="this.onerror=null; this.src='logo-pys.png';" style="height:100px; width:100px; border-radius:8px; object-fit:cover; box-shadow:0 2px 8px rgba(0,0,0,0.08); display: ${actualImg ? 'block' : 'none'};">
                    
                    <div style="display:flex; flex-direction:column; align-items:center; width:100%;">
                        <input type="file" id="edit-prod-file-input" class="product-file-input" accept="image/*" style="display:none;" onchange="window.handleProductPhotoUpload && window.handleProductPhotoUpload(this)">
                        <button type="button" onclick="document.getElementById('edit-prod-file-input').click()" style="background:#fff; color:#334155; border:1px solid #cbd5e1; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:all 0.2s;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#fff'">
                            📁 Seleccionar Foto
                        </button>
                    </div>
                    
                    <input type="text" id="edit-prod-img" class="product-img-input" value="${actualImg}" style="width:100%; padding:6px; border-radius:6px; border:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center; background:#fff; margin-top:4px; outline:none;" placeholder="Nombre de archivo o URL" oninput="const prev = document.querySelector('#editProductImgPreview, .product-img-preview'); if(prev) { prev.src = this.value; prev.style.display = 'block'; }">
                </div>
            </div>
            
            <button onclick="window.guardarEdicionProducto(${pId ? pId : 'null'})" style="width:100%; padding:12px; background:#10b981; color:#fff; border:none; border-radius:10px; font-weight:700; font-size:15px; cursor:pointer; box-shadow:0 4px 12px rgba(16,185,129,0.25); transition:all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 16px rgba(16,185,129,0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16,185,129,0.25)';">${btnGuardarText}</button>
            
            ${pId ? `<div style="display:flex; gap:10px; margin-top:12px;">${btnRestaurar}${btnEliminar}</div>` : ''}
        </div>
    `;
    modal.style.display = 'flex';
};

// Extracted from control-roles.js
window.guardarEdicionProducto = function (pId) {
    const nuevoNombre = (document.getElementById('edit-prod-name')?.value || '').trim();
    const nuevoPrecioStr = document.getElementById('edit-prod-price')?.value || '0';
    const imgInput = document.querySelector('#edit-prod-img, #editProductImg, .product-img-input');
    const nuevaImg = (window.tempProductImg || (imgInput ? imgInput.value.trim() : '') || 'logo-pys.png');
    const nuevaCategoria = document.getElementById('edit-prod-category')?.value || 'panaderia';
    const puntosInput = document.getElementById('newProductPoints');
    const nuevosPuntos = puntosInput && puntosInput.value.trim() !== '' ? Math.max(0, parseInt(puntosInput.value) || 0) : 0;

    const nuevoPrecio = parseInt(nuevoPrecioStr.replace(/\D/g, ''));
    if (!nuevoNombre || isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
        if (typeof showToast === 'function') showToast('Completa el nombre y precio', '⚠️');
        return;
    }

    let isNew = !pId;
    let targetId = isNew ? Date.now() : pId;

    // Guardar en catálogo personalizado (preparación)
    let localCatalog = {};
    try { localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado')) || {}; } catch (e) { }

    const existingCatalogEntry = localCatalog[targetId] || {};
    
    // 1. Crear el entry exclusivo para Firestore (Whitelist estricta - Zero Leakage)
    const firestorePayload = {
        name: nuevoNombre,
        price: nuevoPrecio,
        category: nuevaCategoria,
        cat: nuevaCategoria,
        points: nuevosPuntos,
        puntos: nuevosPuntos
    };
    
    // Si la imagen actual es un Base64 enorme pero el administrador no subió una foto nueva,
    // OMITIMOS enviarla a Firestore. Al usar { merge: true }, el servidor conservará el Base64 que ya tiene.
    // Esto ahorra cientos de KBs de ancho de banda y mitiga el problema del tamaño al editar precios.
    const isOldBase64 = nuevaImg.startsWith('data:image/') && !window.tempProductImg;
    if (!isOldBase64) {
        firestorePayload.img = nuevaImg;
    }
    
    // Preservar metadatos requeridos para UI si existen
    const allowedFields = ['permiteRelleno', 'unidades', 'tag', 'oldPrice', 'originalName', 'originalCat', 'originalImg', 'enOferta', 'desc'];
    allowedFields.forEach(key => {
        if (existingCatalogEntry[key] !== undefined) {
            if (key === 'originalImg' && typeof existingCatalogEntry[key] === 'string' && existingCatalogEntry[key].startsWith('data:image/')) {
                // Prevenir migración de Base64 al campo originalImg
            } else {
                firestorePayload[key] = existingCatalogEntry[key];
            }
        }
    });

    // Preservar explícitamente el estado de disponibilidad / agotado existente
    if (existingCatalogEntry.agotado !== undefined) {
        firestorePayload.agotado = existingCatalogEntry.agotado;
    } else if (typeof stockConfig !== 'undefined' && stockConfig[targetId] !== undefined) {
        firestorePayload.agotado = stockConfig[targetId];
    } else if (typeof window !== 'undefined' && window.stockConfig && window.stockConfig[targetId] !== undefined) {
        firestorePayload.agotado = window.stockConfig[targetId];
    }

    if (isNew) {
        firestorePayload.id = targetId;
        firestorePayload.isCustom = true;
    }

    // 2. Crear el entry completo para localStorage (conserva costos y data local privada)
    const fullLocalEntry = {
        ...existingCatalogEntry,
        ...firestorePayload
    };

    // Asignar al catálogo temporalmente para validación de tamaño local
    localCatalog[targetId] = fullLocalEntry;

    // Conexión a la Base de Datos
    const firestoreDb = (typeof window !== 'undefined' && window.db) || (typeof db !== 'undefined' ? db : null);
    
    const saveBtn = document.querySelector('#modal-editar-producto button[onclick^="window.guardarEdicionProducto"]');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerText = 'Guardando...';
    }

    if (!firestoreDb || typeof firestoreDb.collection !== 'function') {
        alert("🚨 ERROR: No hay conexión con la base de datos (Firestore no está disponible). No se puede guardar en el servidor.");
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = isNew ? '💾 Crear Producto' : '💾 Guardar Cambios';
        }
        if (typeof showToast === 'function') showToast('Error de conexión', '❌');
        return;
    }

    const guardarEnFirestore = (finalUrl) => {
        if (finalUrl) {
            firestorePayload.img = finalUrl;
            fullLocalEntry.img = finalUrl;
            localCatalog[targetId] = fullLocalEntry;
        }

        const sizeKB = JSON.stringify(localCatalog).length / 1024;
        if (sizeKB > 900) {
            console.warn("⚠️ Estimación: El catálogo personalizado está consumiendo " + sizeKB.toFixed(2) + " KB (Límite 1024 KB).");
        }

        firestoreDb.collection('config').doc('catalogo_personalizado').set({
            [targetId]: firestorePayload
        }, { merge: true })
        .then(() => {
            // 1. Confirmado por el servidor, ahora sí aplicamos localmente
            try {
                localStorage.setItem('dt_catalogo_personalizado', JSON.stringify(localCatalog));
            } catch (e) {
                console.warn("El catálogo se guardó en Firestore, pero falló al guardar en localStorage (caché local):", e);
            }

            // 2. Aplicar en memoria (products)
            if (isNew) {
                products.push({
                    id: targetId,
                    name: nuevoNombre,
                    price: nuevoPrecio,
                    cat: nuevaCategoria,
                    img: firestorePayload.img,
                    points: nuevosPuntos,
                    puntos: nuevosPuntos,
                    desc: 'Producto fresco del día',
                    isCustom: true
                });
            } else {
                const p = products.find(x => x.id === pId);
                if (p) {
                    if (!p.originalName) p.originalName = p.name;
                    if (!p.originalImg && p.img && !p.img.startsWith('data:image/')) p.originalImg = p.img;
                    if (!p.originalCat) p.originalCat = p.cat;

                    const hasBadge = p.name.includes('[Promo:');
                    const badgePart = hasBadge ? p.name.substring(p.name.indexOf('[Promo:')) : '';
                    p.name = nuevoNombre + (badgePart ? ' ' + badgePart : '');

                    p.img = firestorePayload.img;
                    p.cat = nuevaCategoria;
                    p.points = nuevosPuntos;
                    p.puntos = nuevosPuntos;

                    const isOferta = window.dtOfertasActivas ? window.dtOfertasActivas[pId] : null;
                    if (isOferta) {
                        p.oldPrice = nuevoPrecio;
                        isOferta.precioOriginal = nuevoPrecio;

                        if (isOferta.porcentaje && isOferta.porcentaje > 0) {
                            const nuevoPrecioOferta = Math.round(nuevoPrecio * (1 - (isOferta.porcentaje / 100)));
                            isOferta.precioOferta = nuevoPrecioOferta;
                            p.price = nuevoPrecioOferta;
                        }

                        if (typeof window.saveOfertas === 'function') window.saveOfertas();
                    } else {
                        p.price = nuevoPrecio;
                    }
                }
            }

            try {
                const cleanProducts = products.map(p => {
                    const cleanP = { ...p };
                    if (cleanP.oldPrice !== undefined) cleanP.price = cleanP.oldPrice;
                    if (cleanP.originalName !== undefined) cleanP.name = cleanP.originalName;
                    delete cleanP.enOferta;
                    delete cleanP.oldPrice;
                    delete cleanP.tag;
                    return cleanP;
                });
                localStorage.setItem('dt_products', JSON.stringify(cleanProducts));
            } catch (e) {
                console.warn("No se pudo guardar dt_products:", e);
            }

            // 3. Cerrar UI y limpiar
            window.tempProductImg = null;
            const modalEdit = document.getElementById('modal-editar-producto');
            if (modalEdit) modalEdit.style.display = 'none';

            if (typeof showToast === 'function') showToast(isNew ? 'Producto creado' : 'Producto actualizado', '✅');

            // 4. Refrescar el catálogo
            if (typeof renderProducts === 'function') renderProducts();
            if (typeof renderStockAdmin === 'function') renderStockAdmin();
            if (typeof renderFeatured === 'function') renderFeatured();
        })
        .catch(e => {
            console.error("Error guardando producto en Firestore:", e);
            alert("🚨 ERROR CRÍTICO: Firestore rechazó la escritura. Revisa el tamaño de la imagen. Motivo: " + (e.message || "Desconocido"));
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerText = isNew ? '💾 Crear Producto' : '💾 Guardar Cambios';
            }
            if (typeof showToast === 'function') showToast('Error al guardar en el servidor', '❌');
        });
    };

    // 3. Guardar directamente usando Base64 (sin Storage)
    if (window.tempProductImg && window.tempProductImg.startsWith('data:image/')) {
        guardarEnFirestore(window.tempProductImg);
    } else {
        guardarEnFirestore(null);
    }
};

// Extracted from control-roles.js
window.eliminarProducto = function (pId) {
    if (!confirm("¿Seguro que deseas eliminar este producto del catálogo?")) return;

    let localCatalog = {};
    try { localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado')) || {}; } catch (e) { }

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

    const modalEditar = document.getElementById('modal-editar-producto');
    if (modalEditar) modalEditar.style.display = 'none';
    if (typeof showToast === 'function') showToast('Producto eliminado', '✅');

    if (typeof renderStockAdmin === 'function') renderStockAdmin();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderFeatured === 'function') renderFeatured();
};

// Extracted from control-roles.js
window.renderAdminClaims = function() {
    const db = window.db || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
    if (!db) return;
    const container = document.getElementById('admin-claims-container');
    const tbody = document.getElementById('admin-claims-table');
    if (!container || !tbody) return;

    db.collection('solicitudes_puntos').where('estado', '==', 'Pendiente').onSnapshot(snap => {
        if (snap.empty) {
            container.style.display = 'none';
            tbody.innerHTML = '';
            return;
        }
        container.style.display = 'block';
        let html = '';
        snap.forEach(doc => {
            const data = doc.data();
            const pedidoId = doc.id;
            html += `
                <tr id="claim-row-${pedidoId}">
                    <td>${data.userEmail}</td>
                    <td>${pedidoId}</td>
                    <td>${new Date(data.timestamp).toLocaleString()}</td>
                    <td id="claim-pts-${pedidoId}">Calculando...</td>
                    <td>
                        <button onclick="window.approveClaim('${pedidoId}', '${data.userEmail}')" style="background:#10b981; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Aprobar</button>
                        <button onclick="window.rejectClaim('${pedidoId}')" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:5px; cursor:pointer;">Rechazar</button>
                    </td>
                </tr>
            `;
            
            db.collection('pedidos').doc(pedidoId).get().then(orderDoc => {
                const ptsTd = document.getElementById(`claim-pts-${pedidoId}`);
                if (orderDoc.exists && ptsTd) {
                    const order = orderDoc.data();
                    const total = order.total || order.totalDescuento || 0;
                    const calculatedPts = Math.floor(total / 1000);
                    ptsTd.innerText = `${calculatedPts} pts`;
                    ptsTd.dataset.pts = calculatedPts;
                } else if (ptsTd) {
                    ptsTd.innerText = 'Pedido no encontrado';
                }
            });
        });
        tbody.innerHTML = html;
    });
};

// Extracted from control-roles.js
window.approveClaim = async function(pedidoId, userEmail) {
    if (!confirm('¿Seguro que deseas aprobar esta solicitud de puntos?')) return;
    
    const ptsTd = document.getElementById(`claim-pts-${pedidoId}`);
    if (!ptsTd || !ptsTd.dataset.pts) {
        if (typeof showToast === 'function') showToast('Calculando puntos, espera un momento...', '⏳');
        return;
    }
    const delta = parseInt(ptsTd.dataset.pts);
    if (isNaN(delta) || delta <= 0) {
        if (typeof showToast === 'function') showToast('Monto de puntos inválido', '❌');
        return;
    }

    try {
        const db = window.db || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
        const userRef = db.collection('usuarios').doc(userEmail);
        const claimRef = db.collection('solicitudes_puntos').doc(pedidoId);

        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            let currentPoints = 0;
            let currentReclamados = [];
            let currentHistorial = [];
            
            if (userDoc.exists) {
                const data = userDoc.data();
                currentPoints = data.points || 0;
                currentReclamados = data.puntosReclamadosIDs || [];
                currentHistorial = data.historialPuntos || [];
            }
            
            if (currentReclamados.includes(pedidoId)) {
                throw new Error('already_claimed');
            }
            
            currentReclamados.push(pedidoId);
            const newPoints = currentPoints + delta;
            
            const movEntry = {
                id: 'mov_' + Date.now(),
                tipo: 'ganancia',
                cantidad: delta,
                motivo: 'Aprobación manual de compra',
                fechaISO: new Date().toISOString(),
                orderId: pedidoId
            };
            currentHistorial.push(movEntry);
            
            const updatePayload = {
                points: newPoints,
                puntosActuales: newPoints,
                historialPuntos: currentHistorial,
                puntosReclamadosIDs: currentReclamados
            };

            if (userDoc.exists) {
                transaction.update(userRef, updatePayload);
            } else {
                updatePayload.email = userEmail;
                transaction.set(userRef, updatePayload, { merge: true });
            }

            transaction.update(claimRef, { estado: 'Aprobado' });
        });
        
        if (typeof showToast === 'function') showToast('Puntos otorgados con éxito', '✅');
    } catch(err) {
        console.error("Error aprobando puntos:", err);
        if (typeof showToast === 'function') showToast('Error al aprobar', '❌');
    }
};

// Extracted from control-roles.js
window.rejectClaim = function(pedidoId) {
    if (!confirm('¿Seguro que deseas rechazar y eliminar esta solicitud?')) return;
    const db = window.db || (window.firebase && window.firebase.firestore ? window.firebase.firestore() : null);
    if (!db) return;
    db.collection('solicitudes_puntos').doc(pedidoId).update({ estado: 'Rechazado' }).catch(err => {
        console.error("Error rechazando", err);
    });
};

// Extracted from control-roles.js
window.renderAdminOfertasActivas = function () {
    const container = document.getElementById('admin-ofertas-activas-container');
    if (!container) return;

    const keys = Object.keys(window.dtOfertasActivas);
    if (keys.length === 0) {
        container.innerHTML = '<p style="font-size:0.9rem; color:#94a3b8; margin:10px 0;">No hay productos en oferta actualmente.</p>';
        return;
    }

    let html = `
        <div style="background:#fff1f2; border:1px solid #fecdd3; border-radius:12px; padding:15px; margin-bottom:20px; width:100%;">
            <h4 style="margin:0 0 15px 0; color:#be123c; font-size:1.1rem;">🔥 Ofertas y Descuentos Activos (${keys.length})</h4>
            <div style="display:flex; flex-direction:column; gap:10px;">
    `;

    keys.forEach(id => {
        const of = window.dtOfertasActivas[id];
        let pName = 'Producto ' + id;
        if (typeof products !== 'undefined') {
            const p = products.find(x => x.id == id);
            if (p) pName = p.originalName || p.name;
        }

        html += `
            <div style="background:#fff; border-radius:8px; padding:10px 15px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div>
                    <strong style="color:#334155;">${pName}</strong>
                    ${of.badgePromo ? `<span style="background:#fecdd3; color:#be123c; padding:2px 6px; border-radius:4px; font-size:0.75rem; margin-left:8px; font-weight:bold;">${of.badgePromo}</span>` : ''}
                    <div style="font-size:0.85rem; color:#64748b; margin-top:4px;">
                        <span style="text-decoration:line-through; margin-right:8px;">$${of.precioOriginal.toLocaleString()}</span>
                        <strong style="color:#e11d48; font-size:0.95rem;">$${of.precioOferta.toLocaleString()}</strong>
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button onclick="window.abrirModalEdicionOferta('${id}')" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.85rem;">✏️ Editar</button>
                    <button onclick="if(confirm('¿Seguro que deseas quitar la oferta de este producto?')) window.quitarOferta('${id}')" style="background:#fef2f2; color:#ef4444; border:1px solid #fecaca; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.85rem;">🗑️ Quitar</button>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
};

// Extracted from control-roles.js
window.saveOfertas = function () {
    localStorage.setItem('dt_ofertas_activas', JSON.stringify(window.dtOfertasActivas));
    if (typeof db !== 'undefined') {
        // Guardar sin merge:true para que al eliminar una oferta local, se borre en remoto
        db.collection('config').doc('ofertas_activas').set(window.dtOfertasActivas)
            .catch(e => console.warn('Error guardando ofertas en Firestore', e));
    }
};

// Extracted from control-roles.js
window.guardarOfertaNueva = function () {
    const id = document.getElementById('oferta-producto').value;
    const precioOriginal = parseInt(document.getElementById('oferta-precio-original').value);
    const precioOferta = parseInt(document.getElementById('oferta-precio-nuevo').value);
    const badgePromo = document.getElementById('oferta-badge-promo').value.trim();
    const porcentajeInput = document.getElementById('input-oferta-porcentaje').value;
    const porcentaje = parseFloat(porcentajeInput) || 0;

    if (!id || !precioOriginal || !precioOferta) {
        if (typeof showToast === 'function') showToast('Llena todos los campos', '⚠️');
        return;
    }
    if (precioOferta >= precioOriginal) {
        if (typeof showToast === 'function') showToast('La oferta debe ser menor al precio', '⚠️');
        return;
    }

    window.dtOfertasActivas[id] = {
        enOferta: true,
        precioOferta: precioOferta,
        precioOriginal: precioOriginal,
        porcentaje: porcentaje,
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
    if (typeof showToast === 'function') showToast('Oferta guardada con éxito', '🔥');

    // Re-render
    if (typeof renderStockAdmin === 'function') renderStockAdmin();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderFeatured === 'function') renderFeatured();
};

// Extracted from control-roles.js
window.eliminarOfertaDesdeModal = function () {
    const id = document.getElementById('oferta-producto').value;
    if (id) {
        window.quitarOferta(id);
        document.getElementById('modal-ofertas').style.display = 'none';
    }
};
