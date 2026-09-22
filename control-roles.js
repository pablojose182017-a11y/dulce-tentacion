/**
 * Módulo control-roles.js
 * Estandariza la definición de roles y controles de acceso 
 * sin modificar script.js
 */

// 1. Limpieza preventiva de sesión fantasma ('correo@google.com')
try {
    const rawUser = localStorage.getItem('dt_user');
    if (rawUser) {
        const uObj = JSON.parse(rawUser);
        if (uObj && (uObj.email || '').toLowerCase().trim() === 'correo@google.com') {
            localStorage.removeItem('dt_user');
            localStorage.removeItem('dt_logged_user');
            if (typeof currentUser !== 'undefined') currentUser = null;
        }
    }
} catch (e) { }

// Saneamiento preventivo de usuarios en localStorage
try {
    let storedUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
    if (Array.isArray(storedUsers)) {
        const cleanedUsers = storedUsers.filter(u => u && u.email && typeof u.email === 'string' && u.email.trim() !== '' && u.email !== 'undefined');
        if (cleanedUsers.length !== storedUsers.length) {
            localStorage.setItem('dt_registered_users', JSON.stringify(cleanedUsers));
        }
    }
} catch (e) { }

try {
    let storedDB = JSON.parse(localStorage.getItem('dt_users_db') || '[]');
    if (Array.isArray(storedDB)) {
        const cleanedDB = storedDB.filter(u => u && u.email && typeof u.email === 'string' && u.email.trim() !== '' && u.email !== 'undefined');
        if (cleanedDB.length !== storedDB.length) {
            localStorage.setItem('dt_users_db', JSON.stringify(cleanedDB));
        }
    }
} catch (e) { }

// Semilla de Super Admins locales ('dt_registered_users' y 'dt_users_db')
try {
    const superAdminSeeds = [
        {
            name: "Pablo Carrascal",
            email: "pablojose182017@gmail.com",
            password: "Admin123*",
            role: "admin",
            isAdmin: true,
            blocked: false,
            points: 500,
            picture: "https://ui-avatars.com/api/?name=Pablo+Carrascal&background=e11d48&color=fff&bold=true"
        },
        {
            name: "Dulce Tentación",
            email: "dulcestentaciones2004@gmail.com",
            password: "Admin123*",
            role: "admin",
            isAdmin: true,
            blocked: false,
            points: 500,
            picture: "https://ui-avatars.com/api/?name=Dulce+Tentacion&background=e11d48&color=fff&bold=true"
        }
    ];

    let regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
    if (!Array.isArray(regUsers)) regUsers = [];
    let updatedReg = false;
    superAdminSeeds.forEach(seed => {
        const idx = regUsers.findIndex(u => u && u.email && u.email.toLowerCase().trim() === seed.email.toLowerCase().trim());
        if (idx === -1) {
            regUsers.push({ ...seed });
            updatedReg = true;
        } else if (!regUsers[idx].password || regUsers[idx].password !== seed.password) {
            regUsers[idx].name = regUsers[idx].name || seed.name;
            regUsers[idx].password = seed.password;
            regUsers[idx].role = 'admin';
            regUsers[idx].isAdmin = true;
            regUsers[idx].blocked = false;
            regUsers[idx].points = regUsers[idx].points || seed.points;
            updatedReg = true;
        }
    });
    if (updatedReg) {
        localStorage.setItem('dt_registered_users', JSON.stringify(regUsers));
    }

    let dbUsersLocal = JSON.parse(localStorage.getItem('dt_users_db') || '[]');
    if (!Array.isArray(dbUsersLocal)) dbUsersLocal = [];
    let updatedDbLocal = false;
    superAdminSeeds.forEach(seed => {
        const idx = dbUsersLocal.findIndex(u => u && u.email && u.email.toLowerCase().trim() === seed.email.toLowerCase().trim());
        if (idx === -1) {
            dbUsersLocal.push({ ...seed });
            updatedDbLocal = true;
        } else if (!dbUsersLocal[idx].password || dbUsersLocal[idx].password !== seed.password) {
            dbUsersLocal[idx].name = dbUsersLocal[idx].name || seed.name;
            dbUsersLocal[idx].password = seed.password;
            dbUsersLocal[idx].role = 'admin';
            dbUsersLocal[idx].isAdmin = true;
            dbUsersLocal[idx].blocked = false;
            dbUsersLocal[idx].points = dbUsersLocal[idx].points || seed.points;
            updatedDbLocal = true;
        }
    });
    if (updatedDbLocal) {
        localStorage.setItem('dt_users_db', JSON.stringify(dbUsersLocal));
    }
} catch (e) { }

window.SUPER_ADMINS = window.SUPER_ADMINS || Object.freeze([
    'pablojose182017@gmail.com',
    'dulcestentaciones2004@gmail.com'
]);
var SUPER_ADMINS = window.SUPER_ADMINS;

function isSuperAdmin(email) {
    if (!email) return false;
    const list = window.SUPER_ADMINS || SUPER_ADMINS || [];
    return list.includes(email.toLowerCase().trim());
}
window.isSuperAdmin = isSuperAdmin;

window.addEventListener('DOMContentLoaded', () => {
    // --- 1. INYECTAR MODAL DE CONTRASEÑA SI NO EXISTE ---
    if (!document.getElementById('adminPasswordModal')) {
        const modalHTML = `
        <div id="adminPasswordModal" class="modal-overlay" style="display:none !important; align-items:center; justify-content:center; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999;">
            <div class="modal-content" style="max-width:400px; padding:20px; text-align:center; background:#fff; border-radius:12px; width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
                <h3 style="color:var(--brand-pink); margin-bottom:15px; font-size:1.5rem;">🔑 Restablecer Contraseña</h3>
                <p id="adminPasswordModalUser" style="margin-bottom:15px; font-weight:bold; color:#475569; font-size:0.95rem;"></p>
                <div class="password-wrapper" style="margin-bottom:20px;">
                    <input type="password" id="adminNewPasswordInput" placeholder="Nueva Contraseña..." style="width:100%; padding:12px 42px 12px 12px; border-radius:8px; border:1px solid #ddd; box-sizing:border-box; font-size:1rem;">
                    <button type="button" class="btn-toggle-password" onclick="togglePasswordVisibility('adminNewPasswordInput', this)" aria-label="Mostrar contraseña" style="right:12px;">👁️</button>
                </div>
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

    // --- 3. SOBRESCRIBIR SYNCUSERUI (robusto ante cualquier orden de carga) ---
    //
    // Patrón: se define primero la lógica pura de UI en una función auxiliar (_crRolesApplyUI),
    // luego se intercepta window.syncUserUI si ya existe, o se registra un listener de
    // DOMContentLoaded para interceptarlo una vez que script.js haya terminado de ejecutarse.
    //
    // Los onclicks están separados limpiamente:
    //   Admin/SuperAdmin → acceso completo (métricas, usuarios, contabilidad)
    //   Trabajador       → solo funciones operativas (pedidos, stock, cocina)

    const _ADMIN_ONCLICK      = "showSection('admin-dashboard'); renderAdminUsers(); renderAdminDashboard(); renderLiveOrders(); renderStockAdmin(); cambiarPestanaAdmin('pedidos');";
    const _WORKER_ONCLICK     = "showSection('admin-dashboard'); renderLiveOrders(); renderStockAdmin(); cambiarPestanaAdmin('pedidos');";
    const _ADMIN_ONCLICK_MOB  = "closeMobileProfile(); " + _ADMIN_ONCLICK;
    const _WORKER_ONCLICK_MOB = "closeMobileProfile(); " + _WORKER_ONCLICK;

    /**
     * Aplica la UI de rol (botones, labels, pestañas) al usuario actualmente logueado.
     * Se llama al finalizar syncUserUI() base para aplicar los ajustes correctos de roles.
     * No toca precios, VIP ni Super Admins (los preserva y los fuerza a admin).
     */
    window._crRolesApplyUI = function() {
        if (typeof currentUser === 'undefined' || !currentUser) return;

        const normEmail = (currentUser.email || '').toLowerCase().trim();
        const isSuper   = isSuperAdmin(normEmail);

        // Proteger Super Admins: siempre admin, nunca modificable
        if (isSuper) {
            currentUser.role = 'admin';
            currentUser.rol  = 'admin';
            currentUser.isAdmin = true;
            currentUser.blocked = false;
            currentUser.estado  = 'activo';
            if (typeof adminEmails !== 'undefined' && !adminEmails.map(e => (e||'').toLowerCase()).includes(normEmail)) {
                adminEmails.push(currentUser.email);
            }
            if (typeof workerEmails !== 'undefined') {
                workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== normEmail);
            }
            try { localStorage.setItem('dt_user', JSON.stringify(currentUser)); } catch(e) {}
            try { localStorage.setItem('dt_logged_user', JSON.stringify(currentUser)); } catch(e) {}
        }

        const isAdmin  = isSuper
            || currentUser.role === 'admin'
            || currentUser.rol  === 'admin'
            || currentUser.isAdmin === true
            || ((typeof adminEmails !== 'undefined') && adminEmails.includes(currentUser.email));

        const isWorker = !isAdmin && (
            currentUser.role === 'trabajador'
            || currentUser.rol  === 'trabajador'
            || ((typeof workerEmails !== 'undefined') && workerEmails.includes(currentUser.email))
        );

        // ── Botón escritorio
        const deskBtn = document.getElementById('desk-admin-btn');
        if (deskBtn) {
            if (isAdmin || isWorker) {
                deskBtn.style.display = 'flex';
                deskBtn.innerText     = isAdmin ? '⚙️ Panel Administrador' : '🛠️ Panel de Pedidos / Cocina';
                deskBtn.setAttribute('onclick', isAdmin ? _ADMIN_ONCLICK : _WORKER_ONCLICK);
            } else {
                deskBtn.style.display = 'none';
            }
        }

        // ── Botón móvil
        const mobBtn = document.getElementById('mob-admin-btn');
        if (mobBtn) {
            if (isAdmin || isWorker) {
                mobBtn.style.display = 'flex';
                mobBtn.innerText     = isAdmin ? '⚙️ Panel Administrador' : '🛠️ Panel de Pedidos / Cocina';
                mobBtn.setAttribute('onclick', isAdmin ? _ADMIN_ONCLICK_MOB : _WORKER_ONCLICK_MOB);
            } else {
                mobBtn.style.display = 'none';
            }
        }

        // ── Secciones y título del panel
        const adminOnlyDiv = document.getElementById('admin-only-sections');
        const adminTitle   = document.getElementById('admin-title-panel');
        if (adminOnlyDiv) adminOnlyDiv.style.display = (isAdmin || isWorker) ? 'block' : 'none';
        if (adminTitle) {
            adminTitle.innerText = isAdmin
                ? '📊 Panel Administrativo & Financiero'
                : (isWorker ? '👨‍🍳 Panel Operativo Diario' : '');
        }

        // ── Pestañas: Contabilidad y Usuarios solo visibles para Admin
        const tabContabilidad = document.getElementById('admin-tab-btn-contabilidad');
        const tabUsuarios     = document.getElementById('admin-tab-btn-usuarios');
        if (tabContabilidad) tabContabilidad.style.display = isAdmin ? '' : 'none';
        if (tabUsuarios)     tabUsuarios.style.display     = isAdmin ? '' : 'none';

        // ── Botones de cocina auxiliares (si existen en el DOM)
        const deskKitchenBtn = document.getElementById('desk-kitchen-btn');
        const mobKitchenBtn  = document.getElementById('mob-kitchen-btn');
        if (deskKitchenBtn) deskKitchenBtn.style.display = 'none'; // gestionados por el panel
        if (mobKitchenBtn)  mobKitchenBtn.style.display  = 'none';
    };

    /**
     * Registra el override sobre window.syncUserUI de forma segura.
     * Se llama inmediatamente y también diferido para cubrir el caso de que
     * script.js termine su evaluación después de control-roles.js.
     */
    function _crRegistrarOverrideSyncUI() {
        const base = window.syncUserUI;
        if (typeof base !== 'function') return false; // todavía no disponible

        // Evitar doble-envoltura si ya aplicamos el override
        if (base._crWrapped) return true;

        window.syncUserUI = function() {
            base(); // Ejecutar la función base (script.js) que ya maneja VIP y puntos
            window._crRolesApplyUI(); // Post-procesar con la lógica de roles
        };
        window.syncUserUI._crWrapped = true;

        // Ejecutar de inmediato si hay sesión activa
        if (typeof currentUser !== 'undefined' && currentUser) {
            window.syncUserUI();
        }

        return true;
    }

    // Intento inmediato (script.js ya cargó antes que control-roles.js → el caso normal)
    const _aplicadoInmediato = _crRegistrarOverrideSyncUI();

    // Fallback: si por alguna razón script.js no estaba listo, reintentamos al finalizar el DOM
    if (!_aplicadoInmediato) {
        document.addEventListener('DOMContentLoaded', function _crDOMReady() {
            _crRegistrarOverrideSyncUI();
            document.removeEventListener('DOMContentLoaded', _crDOMReady);
        });
        // Segundo fallback con setTimeout para entornos donde DOMContentLoaded ya disparó
        setTimeout(function() {
            if (typeof window.syncUserUI !== 'function' || !window.syncUserUI._crWrapped) {
                _crRegistrarOverrideSyncUI();
            }
        }, 100);
    }


    // --- 4. SOBRESCRIBIR INTERCEPTOR DE LOGIN PARA CUENTAS BLOQUEADAS ---
    const originalLoginCustomUser = window.loginCustomUser;
    if (originalLoginCustomUser) {
        window.loginCustomUser = function(e) {
            e.preventDefault();
            const emailInput = (document.getElementById('loginEmail')?.value || '').trim();
            const email = emailInput.toLowerCase();
            const pass = (document.getElementById('loginPassword')?.value || '').trim();

            const users = (typeof db_users !== 'undefined' && Array.isArray(db_users))
                ? db_users
                : (JSON.parse(localStorage.getItem('dt_registered_users') || localStorage.getItem('dt_users_db') || '[]'));

            const user = users.find(u => u && u.email && u.email.trim().toLowerCase() === emailInput.trim().toLowerCase());

            // Validación de credenciales maestras para Super Admins en local
            if (isSuperAdmin(email) && pass === 'Admin123*') {
                const adminName = (email === 'pablojose182017@gmail.com') ? 'Pablo Carrascal' : 'Dulce Tentación';
                const superAdminObj = {
                    name: adminName,
                    email: email,
                    password: 'Admin123*',
                    role: 'admin',
                    isAdmin: true,
                    blocked: false,
                    points: 500,
                    picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=e11d48&color=fff&bold=true`
                };

                if (typeof db_users !== 'undefined' && Array.isArray(db_users)) {
                    const uidx = db_users.findIndex(u => u && u.email && u.email.toLowerCase().trim() === email);
                    if (uidx !== -1) {
                        db_users[uidx] = { ...db_users[uidx], ...superAdminObj };
                    } else {
                        db_users.push({ ...superAdminObj });
                    }
                    if (typeof saveUsersDB === 'function') saveUsersDB();
                }

                if (typeof adminEmails !== 'undefined' && !adminEmails.includes(email)) {
                    adminEmails.push(email);
                    if (typeof saveAdminEmails === 'function') saveAdminEmails();
                }
                if (typeof workerEmails !== 'undefined') {
                    workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== email);
                    try { localStorage.setItem('dt_worker_emails', JSON.stringify(workerEmails)); } catch(e){}
                }

                if (typeof loginUserObj === 'function') {
                    loginUserObj(superAdminObj);
                } else {
                    currentUser = superAdminObj;
                    localStorage.setItem('dt_user', JSON.stringify(superAdminObj));
                    localStorage.setItem('dt_logged_user', JSON.stringify(superAdminObj));
                    if (typeof syncUserUI === 'function') syncUserUI();
                    if (typeof closeAuthModal === 'function') closeAuthModal();
                    if (typeof showToast === 'function') showToast(`¡Bienvenido Administrador ${adminName}!`, '👑');
                }
                return;
            }

            if (isSuperAdmin(email)) {
                if (user) {
                    user.blocked = false;
                    user.role = 'admin';
                    user.isAdmin = true;
                }
            } else {
                if (user && user.blocked) {
                    if (typeof showAuthMessage === 'function') showAuthMessage('⛔ Tu cuenta ha sido suspendida por incumplimiento de políticas.', 'error');
                    return;
                }
            }
            originalLoginCustomUser(e);
        };
    }

    // --- 5. RENDER ADMIN USERS (Roles Estandarizados: Normal, VIP, Trabajador, Admin, Super Admin) ---
    window.renderAdminUsers = function() {
        const tbody = document.getElementById('admin-users-table');
        if (!tbody) return;
        const q = (document.getElementById('adminUserSearch')?.value || '').toLowerCase();
        
        const filteredUsers = db_users.filter(u => {
            if (!u || !u.email) return false;
            const matchSearch = (u.name || '').toLowerCase().includes(q) || 
                                (u.email || '').toLowerCase().includes(q) || 
                                (u.phone || '').toLowerCase().includes(q);
            if(!matchSearch) return false;

            const uEmailNorm = (u.email || '').toLowerCase().trim();
            const isSuper = isSuperAdmin(uEmailNorm);
            const isAdm = isSuper || adminEmails.includes(u.email);
            const isWork = !isSuper && workerEmails.includes(u.email);

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
            const uEmailNorm = (u.email || '').toLowerCase().trim();
            const isSuper = isSuperAdmin(uEmailNorm);
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
                levelHtml = '<span style="color:#d97706;font-weight:bold;">👑 VIP</span>';
            } else {
                levelHtml = '<span style="color:#64748b;font-weight:bold;">Normal</span>';
            }
            
            return `
        <tr style="border-bottom:1px solid #eee; background:${!isSuper && u.blocked ? '#fff1f2' : (isSuper ? '#fffbeb' : (isUserAdmin ? '#eff6ff' : (isUserWorker ? '#f3e8ff' : 'transparent')))}">
            <td style="padding:10px; display:flex; align-items:center; gap:10px;">
                <img src="${u.picture || 'logo-pys.png'}" onerror="this.onerror=null; this.src='logo-pys.png';" style="width:30px;height:30px;border-radius:50%;">
                <strong>${u.name}</strong>
            </td>
            <td style="padding:10px; font-size:0.85rem; color:#555;">${u.phone || '-'}</td>
            <td style="padding:10px; font-size:0.85rem; color:#555;">${u.email}</td>
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
                            <option value="Normal" ${!isUserAdmin && !isUserWorker && !u.vip ? 'selected' : ''}>Normal</option>
                            <option value="VIP" ${u.vip && !isUserAdmin && !isUserWorker ? 'selected' : ''}>VIP</option>
                            <option value="Trabajador" ${isUserWorker ? 'selected' : ''}>Trabajador</option>
                            <option value="Admin" ${isUserAdmin ? 'selected' : ''}>Admin</option>
                        </select>
                        <button onclick="confirmRoleChange('${u.email}')" style="background:var(--brand-pink); color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;">Guardar</button>
                    <div style="display:flex; gap:4px; width:100%;">
                        <button onclick="window.abrirModalEditarUsuarioAdmin('${u.email}')" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; flex:1; font-weight:600;">✏️ Editar</button>
                        ${(u.password !== undefined) ? `<button onclick="adminChangePassword('${u.email}')" style="background:#f3f4f6; color:#4b5563; border:1px solid #d1d5db; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; flex:1;">🔑 Cambiar Clave</button>` : ''}
                    </div>
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
    const targetEmail = (email || '').toLowerCase().trim();
    if (SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }

    const selectEl = document.getElementById(`roleSel_${(email || '').replace(/[@.]/g, '_')}`);
    if (!selectEl) return;
    const newRole = selectEl.value; // 'Normal', 'VIP', 'Trabajador', 'Admin'

    const u = (typeof db_users !== 'undefined' && Array.isArray(db_users))
        ? db_users.find(x => x && x.email && (x.email || '').toLowerCase().trim() === targetEmail)
        : null;
    if (!u) return;

    if (typeof ADMIN_EMAILS !== 'undefined' && ADMIN_EMAILS.includes(email) && newRole !== 'Admin') {
        if(typeof showToast === 'function') showToast('No se puede quitar el rol al administrador principal', 'error');
        return;
    }

    // Limpiar roles previos
    adminEmails = (typeof adminEmails !== 'undefined') ? adminEmails.filter(e => (e || '').toLowerCase().trim() !== targetEmail) : [];
    workerEmails = (typeof workerEmails !== 'undefined') ? workerEmails.filter(e => (e || '').toLowerCase().trim() !== targetEmail) : [];
    u.vip = false;
    u.isVip = false;
    delete u.vipExpiresAt;
    u.role = 'cliente';
    u.rol = 'cliente';
    u.vipStatus = 'inactivo';
    u.isAdmin = false;

    // Aplicar nuevo rol y vigencia VIP si aplica
    if (newRole === 'Admin') {
        adminEmails.push(u.email);
        u.role = 'admin';
        u.rol = 'admin';
        u.isAdmin = true;
    } else if (newRole === 'Trabajador') {
        workerEmails.push(u.email);
        u.role = 'trabajador';
        u.rol = 'trabajador';
        u.isAdmin = false;
    } else if (newRole === 'VIP') {
        u.vip = true;
        u.isVip = true;
        u.role = 'vip';
        u.rol = 'vip';
        u.vipStatus = 'activo';
        u.vipExpiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // Vigencia 30 días
    } else { // Normal
        u.role = 'cliente';
        u.rol = 'cliente';
        u.vip = false;
        u.isVip = false;
        u.vipStatus = 'inactivo';
    }

    // 1. Guardar en 'dt_registered_users'
    let regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
    if (!Array.isArray(regUsers)) regUsers = [];
    let rIdx = regUsers.findIndex(x => x && x.email && x.email.toLowerCase().trim() === targetEmail);
    const regObj = {
        role: u.role,
        rol: u.rol,
        isAdmin: !!u.isAdmin,
        vip: !!u.vip,
        isVip: !!u.isVip,
        vipStatus: u.vipStatus,
        points: u.points !== undefined ? u.points : 0
    };
    if (rIdx !== -1) {
        regUsers[rIdx] = { ...regUsers[rIdx], ...regObj };
    } else {
        regUsers.push({
            name: u.name || '',
            email: u.email,
            phone: u.phone || '',
            ...regObj
        });
    }
    localStorage.setItem('dt_registered_users', JSON.stringify(regUsers));

    // 2. Persistir localmente en los DB targets explícitos
    if (typeof saveAdminEmails === 'function') saveAdminEmails();
    try { localStorage.setItem('dt_admin_emails', JSON.stringify(adminEmails)); } catch(e){}
    try { localStorage.setItem('dt_worker_emails', JSON.stringify(workerEmails)); } catch(e){}
    if (typeof saveUsersDB === 'function') saveUsersDB();

    // 3. Si el usuario modificado es el que está logueado en este navegador, actualizar su 'dt_user' al instante
    const currUser = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : JSON.parse(localStorage.getItem('dt_user') || 'null');
    if (currUser && (currUser.email || '').toLowerCase().trim() === targetEmail) {
        currUser.role = u.role;
        currUser.rol = u.rol;
        currUser.isAdmin = !!u.isAdmin;
        currUser.vip = !!u.vip;
        currUser.isVip = !!u.isVip;
        currUser.vipStatus = u.vipStatus;
        currUser.points = u.points !== undefined ? u.points : currUser.points;
        currentUser = currUser;
        localStorage.setItem('dt_user', JSON.stringify(currentUser));
        localStorage.setItem('dt_logged_user', JSON.stringify(currentUser));
        if (typeof window.syncUserUI === 'function') window.syncUserUI();
    }

    // 4. Sincronizar el documento correspondiente en Firestore
    if (window.db && typeof window.db.collection === 'function') {
        const firestoreData = {
            nombre: u.name || '',
            email: u.email,
            rol: u.rol,
            role: u.role,
            isAdmin: !!u.isAdmin,
            vip: !!u.vip,
            isVip: !!u.isVip,
            vipStatus: u.vipStatus,
            points: u.points !== undefined ? u.points : 0,
            blocked: !!u.blocked,
            updatedAt: new Date().toISOString()
        };
        window.db.collection('usuarios').doc(u.email).set(firestoreData, { merge: true })
            .then(() => console.log('Usuario sincronizado con Firestore exitosamente:', u.email))
            .catch(err => console.warn('Error sincronizando usuario con Firestore:', err));
    }

    renderAdminUsers();
    if (typeof renderKitchenUsers === 'function') renderKitchenUsers();
    
    if(typeof showToast === 'function') showToast('Rol actualizado a: ' + newRole, '✅');
};

window.adminToggleBlock = function(email) {
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
        if(typeof logoutUser === 'function') {
            logoutUser(new Event('click')); 
        }
    }
    if(typeof showToast === 'function') showToast(u.blocked ? 'Usuario bloqueado. No podrá iniciar sesión.' : 'Usuario desbloqueado.', u.blocked ? '⛔' : '✅');
};

window.adminChangePassword = function(email) {
    const target = (email || '').toLowerCase().trim();
    const user = db_users.find(u => u && u.email && u.email.toLowerCase().trim() === target);
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
    if (!window.userToChangePassword || !window.userToChangePassword.email) return;

    const targetEmail = window.userToChangePassword.email.toLowerCase().trim();
    const u = db_users.find(x => x && x.email && x.email.toLowerCase().trim() === targetEmail);
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
        if (!u || !u.email) return false;
        const matchSearch = (u.name || '').toLowerCase().includes(q) || 
                            (u.email || '').toLowerCase().includes(q) || 
                            (u.phone || '').toLowerCase().includes(q);
        if (!matchSearch) return false;
        const uEmailNorm = (u.email || '').toLowerCase().trim();
        const isSuper = isSuperAdmin(uEmailNorm);
        const isAdm = isSuper || adminEmails.includes(u.email);
        const isWork = !isSuper && workerEmails.includes(u.email);
        
        if (filter === 'vip') return u.vip === true;
        if (filter === 'cocina') return isWork; 
        if (filter === 'admin') return isAdm;
        return true;
    });

    container.innerHTML = filtered.map(u => {
        const uEmailNorm = (u.email || '').toLowerCase().trim();
        const isSuper = isSuperAdmin(uEmailNorm);
        const isAdm = isSuper || adminEmails.includes(u.email);
        const isWork = !isSuper && workerEmails.includes(u.email);
        
        let currentRoleVal = 'Normal';
        let roleBadgeHtml = '<span class="k-role-badge k-role-regular">Normal</span>';
        
        if (isSuper) { currentRoleVal = 'Admin'; roleBadgeHtml = '<span class="k-role-badge" style="background:#fef3c7; color:#b45309; font-weight:800; border:1px solid #fde68a;">👑 Super Admin (Dueño)</span>'; }
        else if (isAdm) { currentRoleVal = 'Admin'; roleBadgeHtml = '<span class="k-role-badge k-role-admin">🛡️ Administrador</span>'; }
        else if (isWork) { currentRoleVal = 'Trabajador'; roleBadgeHtml = '<span class="k-role-badge k-role-cocina">👨‍🍳 Trabajador</span>'; }
        else if (u.vip) { currentRoleVal = 'VIP'; roleBadgeHtml = '<span class="k-role-badge k-role-vip">⭐ VIP</span>'; }

        const pts = u.points || 0;
        
        return `
        <div class="k-user-card" style="${isSuper ? 'border: 2px solid #f59e0b; background:#fffdf5;' : ''}">
            <div class="k-user-header">
                <div class="k-user-avatar" style="${isSuper ? 'background:linear-gradient(135deg,#f59e0b,#d97706);' : ''}">${(u.name || 'U').charAt(0).toUpperCase()}</div>
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

            ${isSuper ? `
            <div style="background:#fef3c7; color:#b45309; padding:8px; border-radius:8px; font-size:0.8rem; font-weight:bold; text-align:center; margin-top:8px; border:1px solid #fde68a;">
                🛡️ Rol Inmutable (Super Admin)
            </div>
            ` : `
            <select class="k-role-select" onchange="updateUserRole('${u.email}', this.value)">
                <option value="Normal" ${currentRoleVal==='Normal'?'selected':''}>Normal</option>
                <option value="VIP" ${currentRoleVal==='VIP'?'selected':''}>⭐ VIP</option>
                <option value="Trabajador" ${currentRoleVal==='Trabajador'?'selected':''}>👨‍🍳 Trabajador</option>
                <option value="Admin" ${currentRoleVal==='Admin'?'selected':''}>🛡️ Administrador</option>
            </select>
            `}

            <div style="margin-top:8px;">
                <span style="font-weight:bold; color:#475569; font-size:0.95rem; margin-bottom:8px; display:block;">Dulce-Puntos:</span>
                <div class="k-points-control">
                    <button class="k-btn-point" onclick="updateUserPoints('${u.email}', -10)">-10</button>
                    <strong style="color:var(--brand-pink); font-size:1.1rem;">🎟️ ${pts}</strong>
                    <button class="k-btn-point" onclick="updateUserPoints('${u.email}', 10)">+10</button>
                    <button class="k-btn-point" onclick="updateUserPoints('${u.email}', 50)">+50</button>
                </div>
            </div>

            ${!isSuper ? `
            <div style="margin-top:10px; display:flex; gap:6px;">
                <button type="button" onclick="window.abrirModalEditarUsuarioAdmin('${u.email}')" style="flex:1; padding:6px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; border-radius:6px; font-weight:600; font-size:0.8rem; cursor:pointer;">✏️ Editar</button>
                <button type="button" onclick="adminChangePassword('${u.email}')" style="flex:1; padding:6px; background:#f8fafc; color:#475569; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8rem; cursor:pointer;">🔑 Clave</button>
            </div>
            ` : ''}
        </div>`;
    }).join('');
};

window.updateUserRole = function(email, role) {
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


// === AJUSTES Y PESTAÑAS (SOBREESCRITURAS) ===
window.cambiarPestanaAdmin = function(tab) {
    const isWorker = (typeof currentUser !== 'undefined' && currentUser && typeof workerEmails !== 'undefined' && workerEmails.includes(currentUser.email));
    const isAdmin = (typeof currentUser !== 'undefined' && currentUser && typeof adminEmails !== 'undefined' && adminEmails.includes(currentUser.email));

    // 1. Bloqueo estricto para clientes comunes y VIP
    if (!isWorker && !isAdmin) {
        if(typeof showSection === 'function') showSection('inicio');
        return;
    }

    // 2. Bloqueo de secciones para trabajador
    if (isWorker && !isAdmin && (tab === 'contabilidad' || tab === 'usuarios')) {
        tab = 'pedidos'; // Redirección defensiva
        if (typeof showToast === 'function') showToast('Acceso denegado: Área exclusiva de administración.', '🚫');
    }

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

// 1. EL ENVÍO DE PEDIDOS SE HA CENTRALIZADO EXCLUSIVAMENTE EN SCRIPT.JS PARA EVITAR DUPLICIDADES Y ROMBOS (ENCODING).

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
    if (e && e.preventDefault) e.preventDefault();
    const correoInput = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
    const passInput = (document.getElementById('loginPassword')?.value || '').trim();
    
    if (!correoInput || !passInput) {
        if (typeof showAuthMessage === 'function') showAuthMessage('Por favor ingresa correo y contraseña', 'error');
        else if (typeof showToast === 'function') showToast('Por favor ingresa correo y contraseña', '❌');
        return;
    }

    const isSuper = isSuperAdmin(correoInput);

    // Acceso inmediato offline/online para Super Admins con credenciales maestras fijas
    if (isSuper && passInput === 'Admin123*') {
        const adminName = (correoInput === 'pablojose182017@gmail.com') ? 'Pablo Carrascal' : 'Dulce Tentación';
        const superAdminObj = {
            name: adminName,
            nombre: adminName,
            email: correoInput,
            password: 'Admin123*',
            role: 'admin',
            rol: 'admin',
            isAdmin: true,
            blocked: false,
            estado: 'activo',
            vip: true,
            isVip: true,
            vipStatus: 'activo',
            points: 500,
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=e11d48&color=fff&bold=true`
        };

        if (typeof db_users !== 'undefined' && Array.isArray(db_users)) {
            const uidx = db_users.findIndex(u => u && u.email && u.email.toLowerCase().trim() === correoInput);
            if (uidx !== -1) {
                db_users[uidx] = { ...db_users[uidx], ...superAdminObj };
            } else {
                db_users.push({ ...superAdminObj });
            }
            if (typeof saveUsersDB === 'function') saveUsersDB();
        }

        try {
            let regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
            if (!Array.isArray(regUsers)) regUsers = [];
            const rIdx = regUsers.findIndex(u => u && u.email && u.email.toLowerCase().trim() === correoInput);
            if (rIdx !== -1) regUsers[rIdx] = { ...regUsers[rIdx], ...superAdminObj };
            else regUsers.push({ ...superAdminObj });
            localStorage.setItem('dt_registered_users', JSON.stringify(regUsers));
        } catch(e) {}

        if (typeof adminEmails !== 'undefined' && !adminEmails.includes(correoInput)) {
            adminEmails.push(correoInput);
            if (typeof saveAdminEmails === 'function') saveAdminEmails();
        }
        if (typeof workerEmails !== 'undefined') {
            workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== correoInput);
            try { localStorage.setItem('dt_worker_emails', JSON.stringify(workerEmails)); } catch(e){}
        }

        localStorage.setItem('dt_logged_user', JSON.stringify(superAdminObj));
        localStorage.setItem('dt_user', JSON.stringify(superAdminObj));
        currentUser = superAdminObj;

        if (typeof db !== 'undefined' && db && db.collection) {
            db.collection('usuarios').doc(correoInput).set({
                nombre: adminName,
                name: adminName,
                email: correoInput,
                rol: 'admin',
                role: 'admin',
                estado: 'activo',
                blocked: false,
                password: 'Admin123*'
            }, { merge: true }).catch(() => {});
        }

        if (typeof loginUserObj === 'function') {
            loginUserObj(superAdminObj);
        } else {
            if (typeof actualizarInterfazSesion === 'function') {
                actualizarInterfazSesion(superAdminObj);
            } else if (typeof syncUserUI === 'function') {
                syncUserUI();
            }
            if (typeof closeAuthModal === 'function') closeAuthModal();
            if (typeof closeMobileProfile === 'function') closeMobileProfile();
            if (typeof showToast === 'function') showToast(`¡Bienvenido Administrador ${adminName}!`, '👑');
        }
        return;
    }

    // 1. Verificar primero en almacenamiento local: dt_registered_users y dt_users_db
    let regUsers = [];
    try { regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]'); } catch(e) {}
    if (!Array.isArray(regUsers)) regUsers = [];

    let dbUsers = [];
    try { dbUsers = JSON.parse(localStorage.getItem('dt_users_db') || '[]'); } catch(e) {}
    if (!Array.isArray(dbUsers) || dbUsers.length === 0) {
        dbUsers = (typeof db_users !== 'undefined' && Array.isArray(db_users)) ? db_users : [];
    }

    let foundUser = regUsers.find(u => u && u.email && ((u.email.trim().toLowerCase() === correoInput || (u.username && u.username.trim().toLowerCase() === correoInput)) && u.password === passInput));
    if (!foundUser) {
        foundUser = dbUsers.find(u => u && u.email && ((u.email.trim().toLowerCase() === correoInput || (u.username && u.username.trim().toLowerCase() === correoInput)) && u.password === passInput));
    }

    if (foundUser) {
        if (!isSuper && (foundUser.estado === 'bloqueado' || foundUser.blocked)) {
            if (typeof showAuthMessage === 'function') return showAuthMessage('⛔ Tu cuenta ha sido suspendida por incumplimiento de políticas.', 'error');
            return alert('Tu cuenta está suspendida.');
        }

        const resolvedRole = foundUser.role || foundUser.rol || 'cliente';
        const isVip = !!(foundUser.isVip || foundUser.vip || resolvedRole === 'vip');
        const userToLogin = {
            name: foundUser.name || foundUser.nombre || (correoInput.split('@')[0]),
            nombre: foundUser.name || foundUser.nombre || (correoInput.split('@')[0]),
            email: (foundUser.email || correoInput).toLowerCase().trim(),
            phone: foundUser.phone || foundUser.telefono || '',
            password: foundUser.password || passInput,
            role: resolvedRole,
            rol: resolvedRole,
            isAdmin: (resolvedRole === 'admin'),
            isVip: isVip,
            vip: isVip,
            vipStatus: foundUser.vipStatus || (isVip ? 'activo' : 'inactivo'),
            points: (foundUser.points !== undefined && foundUser.points !== null) ? foundUser.points : (foundUser.puntos || 15),
            picture: foundUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(foundUser.name || 'Usuario')}&background=d81b60&color=fff&bold=true`,
            blocked: false
        };

        // Sincronizar en db_users / dt_users_db
        if (typeof db_users !== 'undefined' && Array.isArray(db_users)) {
            const dbIdx = db_users.findIndex(u => u && u.email && u.email.toLowerCase().trim() === userToLogin.email);
            if (dbIdx !== -1) db_users[dbIdx] = { ...db_users[dbIdx], ...userToLogin };
            else db_users.push({ ...userToLogin });
            if (typeof saveUsersDB === 'function') saveUsersDB();
        }

        // Sincronizar en dt_registered_users
        const rIdx = regUsers.findIndex(u => u && u.email && u.email.toLowerCase().trim() === userToLogin.email);
        if (rIdx !== -1) regUsers[rIdx] = { ...regUsers[rIdx], ...userToLogin };
        else regUsers.push({ ...userToLogin });
        localStorage.setItem('dt_registered_users', JSON.stringify(regUsers));

        // Sincronizar Firestore asíncronamente
        if (typeof db !== 'undefined' && db && db.collection) {
            db.collection('usuarios').doc(correoInput).set({
                nombre: userToLogin.name,
                name: userToLogin.name,
                email: userToLogin.email,
                rol: userToLogin.role,
                role: userToLogin.role,
                estado: 'activo',
                blocked: false,
                isVip: userToLogin.isVip,
                vip: userToLogin.vip,
                points: userToLogin.points
            }, { merge: true }).catch(() => {});
        }

        if (typeof loginUserObj === 'function') {
            return loginUserObj(userToLogin);
        } else {
            currentUser = userToLogin;
            localStorage.setItem('dt_user', JSON.stringify(userToLogin));
            localStorage.setItem('dt_logged_user', JSON.stringify(userToLogin));
            if (typeof syncUserUI === 'function') syncUserUI();
            if (typeof closeAuthModal === 'function') closeAuthModal();
            if (typeof closeMobileProfile === 'function') closeMobileProfile();
            if (typeof showToast === 'function') showToast(`¡Bienvenido, ${userToLogin.name}!`, '🎉');
            return;
        }
    }

    // 2. Si no se encontró localmente pero Firestore está disponible, consultar en la nube
    if (typeof db !== 'undefined' && db && db.collection) {
        db.collection('usuarios').doc(correoInput).get().then((doc) => {
            if (!doc.exists) {
                const userExistsWrongPass = regUsers.some(u => u && u.email && (u.email.trim().toLowerCase() === correoInput || (u.username && u.username.trim().toLowerCase() === correoInput))) ||
                                            dbUsers.some(u => u && u.email && (u.email.trim().toLowerCase() === correoInput || (u.username && u.username.trim().toLowerCase() === correoInput)));
                if (userExistsWrongPass) {
                    if (typeof showAuthMessage === 'function') return showAuthMessage('Contraseña incorrecta. Por favor intenta de nuevo.', 'error');
                    return alert('Contraseña incorrecta.');
                }
                if (typeof showAuthMessage === 'function') return showAuthMessage('El usuario no existe o la contraseña es incorrecta.', 'error');
                return alert('El usuario no existe.');
            }
            const data = doc.data();
            if (!isSuper && (data.estado === 'bloqueado' || data.blocked)) {
                if (typeof showAuthMessage === 'function') return showAuthMessage('⛔ Tu cuenta está suspendida.', 'error');
                return alert('Tu cuenta está suspendida.');
            }
            if (data.password !== passInput) {
                if (typeof showAuthMessage === 'function') return showAuthMessage('Contraseña incorrecta. Verifica e intenta nuevamente.', 'error');
                return alert('Contraseña incorrecta.');
            }
            
            const resolvedRole = data.role || data.rol || (isSuper ? 'admin' : 'cliente');
            const isVip = !!(data.isVip || data.vip || resolvedRole === 'vip');
            const remoteUser = {
                name: data.nombre || data.name || (correoInput.split('@')[0]),
                nombre: data.nombre || data.name || (correoInput.split('@')[0]),
                email: correoInput,
                password: passInput,
                role: resolvedRole,
                rol: resolvedRole,
                isAdmin: (resolvedRole === 'admin'),
                isVip: isVip,
                vip: isVip,
                vipStatus: data.vipStatus || (isVip ? 'activo' : 'inactivo'),
                points: (data.points !== undefined && data.points !== null) ? data.points : (data.puntos || 15),
                picture: data.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.nombre || 'Usuario')}&background=d81b60&color=fff&bold=true`,
                blocked: false
            };

            // Guardar localmente para futuras sesiones
            try {
                let regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
                if (!Array.isArray(regUsers)) regUsers = [];
                const rIdx = regUsers.findIndex(u => u && u.email && u.email.toLowerCase().trim() === correoInput);
                if (rIdx !== -1) regUsers[rIdx] = { ...regUsers[rIdx], ...remoteUser };
                else regUsers.push({ ...remoteUser });
                localStorage.setItem('dt_registered_users', JSON.stringify(regUsers));
            } catch(e) {}

            if (typeof db_users !== 'undefined' && Array.isArray(db_users)) {
                const dbIdx = db_users.findIndex(u => u && u.email && u.email.toLowerCase().trim() === correoInput);
                if (dbIdx !== -1) db_users[dbIdx] = { ...db_users[dbIdx], ...remoteUser };
                else db_users.push({ ...remoteUser });
                if (typeof saveUsersDB === 'function') saveUsersDB();
            }

            if (typeof loginUserObj === 'function') {
                loginUserObj(remoteUser);
            } else {
                currentUser = remoteUser;
                localStorage.setItem('dt_logged_user', JSON.stringify(remoteUser));
                localStorage.setItem('dt_user', JSON.stringify(remoteUser));
                if (typeof syncUserUI === 'function') syncUserUI();
                if (typeof closeAuthModal === 'function') closeAuthModal();
                if (typeof closeMobileProfile === 'function') closeMobileProfile();
                if (typeof showToast === 'function') showToast('¡Bienvenido, ' + remoteUser.name + '!', '🎉');
            }
        }).catch(err => {
            console.warn("Firestore error consultando usuario:", err);
            if (typeof showAuthMessage === 'function') showAuthMessage('El usuario no existe o la contraseña es incorrecta.', 'error');
            else alert('El usuario no existe o la contraseña es incorrecta.');
        });
    } else {
        const userExistsWrongPass = regUsers.some(u => u && u.email && (u.email.trim().toLowerCase() === correoInput || (u.username && u.username.trim().toLowerCase() === correoInput))) ||
                                    dbUsers.some(u => u && u.email && (u.email.trim().toLowerCase() === correoInput || (u.username && u.username.trim().toLowerCase() === correoInput)));
        if (userExistsWrongPass) {
            if (typeof showAuthMessage === 'function') return showAuthMessage('Contraseña incorrecta. Por favor intenta de nuevo.', 'error');
            return alert('Contraseña incorrecta.');
        }
        if (typeof showAuthMessage === 'function') return showAuthMessage('El usuario no existe o la contraseña es incorrecta.', 'error');
        return alert('El usuario no existe o la contraseña es incorrecta.');
    }
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
        const emailLower = (decoded.email || '').toLowerCase().trim();
        const isSuper = isSuperAdmin(emailLower);
        
        const firestoreData = {
            nombre: decoded.name || 'Usuario Google',
            email: emailLower,
            telefono: 'Sin registrar',
            rol: isSuper ? 'admin' : 'cliente',
            role: isSuper ? 'admin' : 'cliente',
            isAdmin: isSuper,
            estado: 'activo',
            blocked: false,
            foto: decoded.picture || '',
            origen: 'google',
            ultimaConexion: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (isSuper) {
            if (typeof adminEmails !== 'undefined' && !adminEmails.includes(emailLower)) {
                adminEmails.push(emailLower);
                if (typeof saveAdminEmails === 'function') saveAdminEmails();
            }
            if (typeof workerEmails !== 'undefined') {
                workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== emailLower);
            }
            if (typeof currentUser !== 'undefined' && currentUser) {
                currentUser.role = 'admin';
                currentUser.isAdmin = true;
                currentUser.blocked = false;
                currentUser.estado = 'activo';
                try { localStorage.setItem('dt_user', JSON.stringify(currentUser)); } catch(e){}
                try { localStorage.setItem('dt_logged_user', JSON.stringify(currentUser)); } catch(e){}
            }
        }
        
        db.collection('usuarios').doc(emailLower).set(firestoreData, { merge: true });
    } catch(e) {
        console.error("Error procesando token de Google:", e);
    }
};

// 3. TABLA DE USUARIOS DEL ADMINISTRADOR EN TIEMPO REAL
window.renderUsersTable = function() {
    db.collection('usuarios').onSnapshot((snapshot) => {
        const listaUsuarios = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const email = (data.email || doc.id || '').toLowerCase().trim();
            if (isSuperAdmin(email)) {
                data.rol = 'admin';
                data.role = 'admin';
                data.isAdmin = true;
                data.blocked = false;
                data.estado = 'activo';
                if (doc.data().rol !== 'admin' || doc.data().estado === 'bloqueado' || doc.data().blocked) {
                    db.collection('usuarios').doc(doc.id).update({ rol: 'admin', estado: 'activo', blocked: false }).catch(() => {});
                }
            }
            listaUsuarios.push({ id: doc.id, ...data });
        });
        localStorage.setItem('dt_users_db', JSON.stringify(listaUsuarios));
        
        if (typeof pintarTablaUsuarios === 'function') {
            pintarTablaUsuarios(listaUsuarios);
        } else {
            // Compatibilidad con el sistema actual
            if (typeof db_users !== 'undefined') {
                db_users.length = 0;
                listaUsuarios.forEach(u => {
                    if (!u || !u.email) return;
                    // Mapeo para asegurar compatibilidad
                    if(!u.name) u.name = u.nombre;
                    if(!u.blocked) u.blocked = (u.estado === 'bloqueado');
                    const uEmail = (u.email || '').toLowerCase().trim();
                    if (isSuperAdmin(uEmail)) {
                        u.role = 'admin';
                        u.rol = 'admin';
                        u.isAdmin = true;
                        u.blocked = false;
                        u.estado = 'activo';
                    }
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

// Sincronización integral de roles manejada en window.confirmRoleChange

// Extender el bloqueo para actualizar en Firestore
const originalAdminToggleBlockFS = window.adminToggleBlock;
window.adminToggleBlock = function(emailTarget) {
    const targetEmail = (emailTarget || '').toLowerCase().trim();
    if (SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }
    const u = typeof db_users !== 'undefined' ? db_users.find(x => x && x.email && (x.email || '').toLowerCase().trim() === targetEmail) : null;
    if (u) {
        const nuevoEstado = !u.blocked ? 'bloqueado' : 'activo';
        db.collection('usuarios').doc(emailTarget).update({ estado: nuevoEstado, blocked: !u.blocked })
            .catch(err => console.warn('No se pudo guardar el estado en Firestore:', err));
    }
    if (originalAdminToggleBlockFS) originalAdminToggleBlockFS(emailTarget);
};

// Extender eliminación de usuario para proteger a los Super Admins
const originalAdminDeleteUser = window.adminDeleteUser;
window.adminDeleteUser = function(emailTarget) {
    const targetEmail = (emailTarget || '').toLowerCase().trim();
    if (SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }
    if (originalAdminDeleteUser) {
        originalAdminDeleteUser(emailTarget);
    } else if (typeof db_users !== 'undefined') {
        if (!confirm(`¿Estás seguro de que deseas eliminar el correo ${emailTarget}?`)) return;
        db_users = db_users.filter(u => u && u.email && (u.email || '').toLowerCase().trim() !== targetEmail);
        if (typeof saveUsersDB === 'function') saveUsersDB();
        if (typeof renderAdminUsers === 'function') renderAdminUsers();
        if (typeof showToast === 'function') showToast('Cliente eliminado', '🗑️');
    }
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
                } else if (text.includes('especial')) {
                    opt.text = "🔥 Especial Trío ($3.500)";
                    opt.value = "especial";
                } else if (text.includes('pollo')) {
                    opt.text = "🍗 Pollo Desmechado ($3.000)";
                    opt.value = "pollo";
                } else if (text.includes('jamon') || text.includes('jamón')) {
                    opt.text = "🥓 Jamón y Queso ($3.000)";
                    opt.value = "jamon_queso";
                }
                opt.dataset.cleaned = 'true'; // Marcado como procesado
            });
        });
    };

    // 1. RECÁLCULO DINÁMICO DE PRECIO SEGÚN RELLENO
    // [ELIMINADO] El listener global redundante fue removido. La funcionalidad nativa está en script.js.

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
    if (typeof window.showAddToCartToast === 'function') {
        window.showAddToCartToast(p.name, qty);
    } else if (typeof showToast === 'function') {
        showToast(`¡${qty}x ${p.name} al carrito!`, '🥐');
    }
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
    
    let actualPoints = '';
    if (pId) {
        p = products.find(x => x.id === pId);
        if (!p) return;
        isOferta = window.dtOfertasActivas[pId];
        actualBasePrice = isOferta ? isOferta.precioOriginal : p.price;
        actualName = p.originalName || p.name;
        actualImg = p.originalImg || p.img;
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

window.handleProductPhotoUpload = function(input) {
    if (input && input.files && input.files[0]) {
        const file = input.files[0];
        const previewImg = document.querySelector('#editProductImgPreview, .product-img-preview');
        if (previewImg) previewImg.style.opacity = '0.4';
        if (typeof showToast === 'function') showToast("Optimizando foto...", "⏳");

        const compressor = typeof window.comprimirImagen === 'function' ? window.comprimirImagen : (f) => new Promise(res => {
            const r = new FileReader();
            r.onload = e => res(e.target.result);
            r.readAsDataURL(f);
        });

        compressor(file, { maxWidth: 600, maxHeight: 600, quality: 0.75 })
            .then(dataUrl => {
                if (previewImg) {
                    previewImg.src = dataUrl;
                    previewImg.style.display = 'block';
                    previewImg.style.opacity = '1';
                }
                const imgInput = document.querySelector('#edit-prod-img, #editProductImg, .product-img-input');
                if (imgInput) {
                    imgInput.value = dataUrl;
                    imgInput.setAttribute('data-file-name', file.name);
                }
                window.tempProductImg = dataUrl;
                if (typeof showToast === 'function') showToast("Foto optimizada con éxito", "📸");
            })
            .catch(err => {
                console.error("Error procesando foto de producto:", err);
                if (previewImg) previewImg.style.opacity = '1';
                if (typeof showToast === 'function') showToast("Error al cargar la foto", "⚠️");
            });
    }
};

window.guardarEdicionProducto = function(pId) {
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
    
    // Guardar en catálogo personalizado
    let localCatalog = {};
    try { localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado')) || {}; } catch(e){}
    
    localCatalog[targetId] = {
        name: nuevoNombre,
        price: nuevoPrecio,
        img: nuevaImg,
        image: nuevaImg,
        category: nuevaCategoria,
        points: nuevosPuntos,
        puntos: nuevosPuntos
    };
    
    if (isNew) {
        localCatalog[targetId].id = targetId;
        localCatalog[targetId].isCustom = true;
    }
    localStorage.setItem('dt_catalogo_personalizado', JSON.stringify(localCatalog));
    
    // Aplicar en memoria (products)
    if (isNew) {
        products.push({
            id: targetId,
            name: nuevoNombre,
            price: nuevoPrecio,
            cat: nuevaCategoria,
            img: nuevaImg,
            image: nuevaImg,
            points: nuevosPuntos,
            puntos: nuevosPuntos,
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
            p.image = nuevaImg;
            p.cat = nuevaCategoria;
            p.points = nuevosPuntos;
            p.puntos = nuevosPuntos;
            
            const isOferta = window.dtOfertasActivas ? window.dtOfertasActivas[pId] : null;
            if (isOferta) {
                p.oldPrice = nuevoPrecio;
                isOferta.precioOriginal = nuevoPrecio;
                if (typeof window.saveOfertas === 'function') window.saveOfertas();
            } else {
                p.price = nuevoPrecio;
            }
        }
    }

    // Guardar en localStorage('dt_products')
    try {
        localStorage.setItem('dt_products', JSON.stringify(products));
    } catch(e) {
        console.warn("No se pudo guardar dt_products:", e);
    }
    
    // Guardar en Firestore
    if (typeof db !== 'undefined') {
        db.collection('config').doc('catalogo_personalizado').set({
            [targetId]: localCatalog[targetId]
        }, { merge: true }).catch(e => console.error("Error guardando producto en Firestore:", e));
    }
    
    window.tempProductImg = null;
    const modalEdit = document.getElementById('modal-editar-producto');
    if (modalEdit) modalEdit.style.display = 'none';
    
    if (typeof showToast === 'function') showToast(isNew ? 'Producto creado' : 'Producto actualizado', '✅');
    
    // Refrescar el catálogo inmediatamente
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderStockAdmin === 'function') renderStockAdmin();
    if (typeof renderFeatured === 'function') renderFeatured();
};

window.saveProduct = window.guardarEdicionProducto;
window.updateProduct = window.guardarEdicionProducto;

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
    
    const modalEditar = document.getElementById('modal-editar-producto');
    if (modalEditar) modalEditar.style.display = 'none';
    if(typeof showToast === 'function') showToast('Producto eliminado', '✅');
    
    if (typeof renderStockAdmin === 'function') renderStockAdmin();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderFeatured === 'function') renderFeatured();
};
window.deleteProduct = window.eliminarProducto;

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
            if (!document.getElementById('btnAdminClubPuntos')) {
                const clubBtn = document.createElement('button');
                clubBtn.type = 'button';
                clubBtn.className = 'btn-admin-action';
                clubBtn.id = 'btnAdminClubPuntos';
                clubBtn.style.background = 'linear-gradient(135deg, #e91e63, #ff5722)';
                clubBtn.style.color = 'white';
                clubBtn.innerHTML = '⭐ Configurar Puntos & Club VIP';
                clubBtn.setAttribute('onclick', 'window.openAdminPointsModal && window.openAdminPointsModal(event)');
                clubBtn.onclick = (e) => window.openAdminPointsModal && window.openAdminPointsModal(e);
                controlsDiv.appendChild(clubBtn);
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
                    
                    // Asegurar presencia del selector de Puntos
                    let pointsBox = child.querySelector('.prod-stock-points-container');
                    if (!pointsBox && typeof products !== 'undefined') {
                        const p = products.find(x => x.id === pId);
                        const currentPoints = p ? (p.points !== undefined ? p.points : (p.puntos !== undefined ? p.puntos : 0)) : 0;
                        pointsBox = document.createElement('div');
                        pointsBox.className = 'prod-stock-points-container';
                        pointsBox.style.cssText = 'width:100%; display:flex; align-items:center; justify-content:space-between; background:#fff7ed; padding:4px 8px; border-radius:6px; border:1px solid #ffedd5; box-sizing:border-box; margin-top:4px;';
                        pointsBox.innerHTML = `
                            <span style="font-size:0.75rem; font-weight:700; color:#c2410c;">⭐ Puntos:</span>
                            <input type="number" min="0" value="${currentPoints}" onchange="updateProductPoints(${pId}, this.value)" style="width:55px; padding:3px 6px; border:1px solid #fed7aa; border-radius:4px; text-align:center; font-size:0.8rem; font-weight:700; color:#ea580c; background:#fff; outline:none;" title="Puntos que otorga al comprar">
                        `;
                        if (btn.nextSibling) {
                            child.insertBefore(pointsBox, btn.nextSibling);
                        } else {
                            child.appendChild(pointsBox);
                        }
                    }
                    
                    // Botón Editar Producto
                    let btnEditPrice = child.querySelector('.btn-edit-price');
                    if (!btnEditPrice) {
                        btnEditPrice = document.createElement('button');
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
                    }
                    
                    // Botón Oferta
                    let btnOferta = child.querySelector('.btn-oferta-action');
                    if (!btnOferta) {
                        btnOferta = document.createElement('button');
                        btnOferta.className = 'btn-oferta-action';
                        btnOferta.style.width = '100%';
                        btnOferta.style.padding = '8px';
                        btnOferta.style.borderRadius = '6px';
                        btnOferta.style.marginTop = '4px';
                        btnOferta.style.cursor = 'pointer';
                        btnOferta.style.border = 'none';
                        btnOferta.style.fontWeight = 'bold';
                        btnOferta.style.fontSize = '0.8rem';
                        child.appendChild(btnOferta);
                    }
                    
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

                    // Botón Eliminar Producto (siempre al fondo)
                    let btnDelete = child.querySelector('.btn-delete-stock-prod');
                    if (!btnDelete) {
                        btnDelete = document.createElement('button');
                        btnDelete.type = 'button';
                        btnDelete.className = 'btn-delete-stock-prod';
                        btnDelete.style.width = '100%';
                        btnDelete.style.padding = '6px';
                        btnDelete.style.borderRadius = '6px';
                        btnDelete.style.marginTop = '4px';
                        btnDelete.style.cursor = 'pointer';
                        btnDelete.style.border = '1px solid #fecaca';
                        btnDelete.style.background = '#fef2f2';
                        btnDelete.style.color = '#ef4444';
                        btnDelete.style.fontWeight = 'bold';
                        btnDelete.style.fontSize = '0.75rem';
                        btnDelete.innerHTML = '🗑️ Eliminar';
                        btnDelete.onclick = () => window.deleteProduct(pId);
                        child.appendChild(btnDelete);
                    } else {
                        child.appendChild(btnDelete);
                    }
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

// --- HELPER GLOBAL DE COMPRESIÓN DE IMÁGENES (CANVAS / BASE64 OPTIMIZADO) ---
window.comprimirImagen = function(file, options = {}) {
    const maxWidth = options.maxWidth || 600;
    const maxHeight = options.maxHeight || 600;
    const quality = options.quality !== undefined ? options.quality : 0.75;
    const mimeType = options.mimeType || 'image/jpeg';

    return new Promise((resolve, reject) => {
        if (!file) return reject(new Error("No se proporcionó ningún archivo"));
        if (typeof file === 'string') return resolve(file);

        const reader = new FileReader();
        reader.onerror = (err) => reject(err);
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = (err) => reject(err);
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width / height > maxWidth / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, width);
                canvas.height = Math.max(1, height);
                const ctx = canvas.getContext('2d');
                
                if (mimeType === 'image/jpeg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                try {
                    const dataUrl = canvas.toDataURL(mimeType, quality);
                    resolve(dataUrl);
                } catch (err) {
                    resolve(e.target.result);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

// --- MÓDULO DE GESTIÓN DINÁMICA DE TORTAS ---
window.asegurarEstructuraTortasConfig = function(cfg) {
    if (!cfg || typeof cfg !== 'object') cfg = {};
    
    if (!Array.isArray(cfg.sabores) || cfg.sabores.length === 0) {
        cfg.sabores = [
            {
                id: 'tresleches',
                name: 'Clásica Tres Leches',
                icon: '🥛',
                desc: 'Bizcocho suave bañado en infusión de tres leches y cubierta en chantilly artesanal.',
                tag: 'La Favorita ⭐',
                q: (cfg.preciosPorSabor && cfg.preciosPorSabor.tresleches ? cfg.preciosPorSabor.tresleches.q : 45000),
                m: (cfg.preciosPorSabor && cfg.preciosPorSabor.tresleches ? cfg.preciosPorSabor.tresleches.m : 75000),
                l: (cfg.preciosPorSabor && cfg.preciosPorSabor.tresleches ? cfg.preciosPorSabor.tresleches.l : 130000),
                activo: true
            },
            {
                id: 'chocoarequipe',
                name: 'Chocoarequipe',
                icon: '🍫',
                desc: 'Capas de bizcocho de chocolate oscuro rellenas de arequipe suave y ganache.',
                tag: 'Más Pedida 🔥',
                q: (cfg.preciosPorSabor && cfg.preciosPorSabor.chocoarequipe ? cfg.preciosPorSabor.chocoarequipe.q : 45000),
                m: (cfg.preciosPorSabor && cfg.preciosPorSabor.chocoarequipe ? cfg.preciosPorSabor.chocoarequipe.m : 75000),
                l: (cfg.preciosPorSabor && cfg.preciosPorSabor.chocoarequipe ? cfg.preciosPorSabor.chocoarequipe.l : 130000),
                activo: true
            },
            {
                id: 'ponque',
                name: 'Ponqué Clásico',
                icon: '🍰',
                desc: 'Masa tradicional esponjosa con notas cítricas y vainilla de primera calidad.',
                tag: 'Clásico 🎂',
                q: (cfg.preciosPorSabor && cfg.preciosPorSabor.ponque ? cfg.preciosPorSabor.ponque.q : 38000),
                m: (cfg.preciosPorSabor && cfg.preciosPorSabor.ponque ? cfg.preciosPorSabor.ponque.m : 65000),
                l: (cfg.preciosPorSabor && cfg.preciosPorSabor.ponque ? cfg.preciosPorSabor.ponque.l : 110000),
                activo: true
            },
            {
                id: 'frutosrojos',
                name: 'Frutos Rojos',
                icon: '🍓',
                desc: 'Bizcocho con reducción artesanal de moras, fresas y arándanos silvestres.',
                tag: 'Fresco & Frutal 🍒',
                q: (cfg.preciosPorSabor && cfg.preciosPorSabor.frutosrojos ? cfg.preciosPorSabor.frutosrojos.q : 45000),
                m: (cfg.preciosPorSabor && cfg.preciosPorSabor.frutosrojos ? cfg.preciosPorSabor.frutosrojos.m : 75000),
                l: (cfg.preciosPorSabor && cfg.preciosPorSabor.frutosrojos ? cfg.preciosPorSabor.frutosrojos.l : 130000),
                activo: true
            }
        ];
    } else {
        cfg.sabores.forEach((s, idx) => {
            if (!s.id) s.id = 'sabor_' + idx;
            if (s.activo === undefined) s.activo = true;
            s.q = Number(s.q) || 0;
            s.m = Number(s.m) || 0;
            s.l = Number(s.l) || 0;
        });
    }

    if (!cfg.preciosPorSabor) {
        cfg.preciosPorSabor = {};
    }
    cfg.sabores.forEach(s => {
        const key = s.id || s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        cfg.preciosPorSabor[key] = { q: Number(s.q) || 0, m: Number(s.m) || 0, l: Number(s.l) || 0 };
    });
    const pq = cfg.sabores.find(s => s.id === 'ponque' || s.name.toLowerCase().includes('ponqu'));
    if (pq) cfg.preciosPorSabor.ponque = { q: Number(pq.q) || 0, m: Number(pq.m) || 0, l: Number(pq.l) || 0 };
    const tl = cfg.sabores.find(s => s.id === 'tresleches' || s.name.toLowerCase().includes('tres'));
    if (tl) cfg.preciosPorSabor.tresleches = { q: Number(tl.q) || 0, m: Number(tl.m) || 0, l: Number(tl.l) || 0 };
    const ch = cfg.sabores.find(s => s.id === 'chocoarequipe' || s.name.toLowerCase().includes('choco'));
    if (ch) cfg.preciosPorSabor.chocoarequipe = { q: Number(ch.q) || 0, m: Number(ch.m) || 0, l: Number(ch.l) || 0 };

    if (!Array.isArray(cfg.disenos)) {
        cfg.disenos = [
            { id: 1, name: '#1', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150' },
            { id: 2, name: '#2', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150' },
            { id: 3, name: '#3', img: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=150' },
            { id: 4, name: '#4', img: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=150' },
            { id: 5, name: '#5', img: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=400&auto=format&fit=crop&q=80' },
            { id: 6, name: '#6', img: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=150' }
        ];
    }
    return cfg;
};

window.dt_tortas_config = window.asegurarEstructuraTortasConfig(window.dt_tortas_config || {});

// Cargar desde localStorage inicialmente
try {
    const cached = localStorage.getItem('dt_tortas_config');
    if (cached) {
        window.dt_tortas_config = window.asegurarEstructuraTortasConfig(JSON.parse(cached));
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
    if (typeof window.asegurarEstructuraTortasConfig === 'function') {
        window.dt_tortas_config = window.asegurarEstructuraTortasConfig(window.dt_tortas_config);
    }
    const config = window.dt_tortas_config;
    const modal = document.getElementById('modal-config-tortas');
    if (!modal) return;

    let saboresHtml = '';
    (config.sabores || []).forEach((sabor, index) => {
        const isAgotado = sabor.activo === false;
        saboresHtml += `
            <tr style="border-bottom:1px solid #f1f5f9; ${isAgotado ? 'opacity:0.65; background:#f8fafc;' : ''}">
                <td style="padding:10px 8px;">
                    <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                        <input type="text" id="sabor-icon-${index}" value="${sabor.icon || '🍰'}" title="Icono / Emoji" style="width:34px; text-align:center; padding:5px 2px; border-radius:6px; border:1px solid #e2e8f0; font-size:1rem; background:#fff;">
                        <input type="text" id="sabor-name-${index}" value="${sabor.name || ''}" placeholder="Nombre del Sabor" style="flex:1; padding:6px 8px; border-radius:6px; border:1px solid #e2e8f0; font-weight:700; color:#1e293b; font-size:0.85rem; background:#fff; outline:none;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'">
                    </div>
                    <div style="display:flex; gap:6px;">
                        <input type="text" id="sabor-tag-${index}" value="${sabor.tag || ''}" placeholder="Etiqueta (ej. Más Pedida 🔥)" style="width:40%; padding:4px 6px; border-radius:6px; border:1px solid #e2e8f0; font-size:0.75rem; color:#be123c; font-weight:600; background:#fff; outline:none;">
                        <input type="text" id="sabor-desc-${index}" value="${sabor.desc || ''}" placeholder="Descripción breve" style="flex:1; padding:4px 6px; border-radius:6px; border:1px solid #e2e8f0; font-size:0.75rem; color:#64748b; background:#fff; outline:none;">
                    </div>
                </td>
                <td style="padding:10px 6px; vertical-align:middle; width:105px;">
                    <div style="position:relative;">
                        <span style="position:absolute; left:6px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.8rem;">$</span>
                        <input type="number" id="sabor-q-${index}" value="${sabor.q || ''}" style="width:100%; padding:6px 4px 6px 16px; border-radius:6px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; font-size:0.85rem; outline:none; text-align:right;" placeholder="0" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'">
                    </div>
                </td>
                <td style="padding:10px 6px; vertical-align:middle; width:105px;">
                    <div style="position:relative;">
                        <span style="position:absolute; left:6px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.8rem;">$</span>
                        <input type="number" id="sabor-m-${index}" value="${sabor.m || ''}" style="width:100%; padding:6px 4px 6px 16px; border-radius:6px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; font-size:0.85rem; outline:none; text-align:right;" placeholder="0" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'">
                    </div>
                </td>
                <td style="padding:10px 6px; vertical-align:middle; width:105px;">
                    <div style="position:relative;">
                        <span style="position:absolute; left:6px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.8rem;">$</span>
                        <input type="number" id="sabor-l-${index}" value="${sabor.l || ''}" style="width:100%; padding:6px 4px 6px 16px; border-radius:6px; border:1px solid #e2e8f0; font-weight:600; color:#1e293b; font-size:0.85rem; outline:none; text-align:right;" placeholder="0" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'">
                    </div>
                </td>
                <td style="padding:10px 6px; vertical-align:middle; text-align:center; width:110px;">
                    <button type="button" onclick="window.toggleDisponibilidadSabor(${index})" style="background:${!isAgotado ? '#ecfdf5' : '#fff1f2'}; color:${!isAgotado ? '#059669' : '#e11d48'}; border:1px solid ${!isAgotado ? '#a7f3d0' : '#fecdd3'}; padding:6px 8px; border-radius:8px; font-size:0.75rem; font-weight:700; cursor:pointer; width:100%; transition:all 0.2s;" title="Clic para alternar disponibilidad">
                        ${!isAgotado ? '🟢 Disponible' : '⏸️ Agotado'}
                    </button>
                </td>
                <td style="padding:10px 6px; vertical-align:middle; text-align:center; width:40px;">
                    <button type="button" onclick="window.eliminarSaborTorta(${index})" style="background:#fef2f2; color:#ef4444; border:1px solid #fecaca; padding:6px 8px; border-radius:6px; font-size:0.85rem; cursor:pointer; transition:all 0.2s;" title="Eliminar sabor">🗑️</button>
                </td>
            </tr>
        `;
    });

    let disenosHtml = '';
    config.disenos.forEach((d, index) => {
        disenosHtml += `
            <div style="background:#fff; border:1px solid #f1f5f9; border-radius:14px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.06); position:relative;">
                <div style="position:absolute; top:8px; left:8px; background:rgba(15,23,42,0.6); backdrop-filter:blur(4px); color:#fff; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold; z-index:2;">
                    ${d.name}
                </div>
                <img id="preview-torta-img-${index}" src="${d.img || 'logo-pys.png'}" onerror="this.onerror=null; this.src='logo-pys.png';" style="width:100%; height:140px; object-fit:cover; display:block; transition:opacity 0.2s;">
                
                <div style="padding:10px; display:flex; flex-direction:column; gap:8px;">
                    <input type="text" id="torta-name-${index}" value="${d.name}" style="width:100%; padding:6px; border-radius:6px; border:1px solid #e2e8f0; background:#f8fafc; font-size:0.8rem; text-align:center; outline:none;" onfocus="this.style.borderColor='#db2777'" onblur="this.style.borderColor='#e2e8f0'">
                    <input type="hidden" id="torta-img-${index}" value="${d.img}">
                    
                    <div style="display:flex; width:100%; gap:6px;">
                        <input type="file" id="torta-file-${index}" accept="image/*" style="display:none;" onchange="window.handleTortaDesignUpload(${index}, this)">
                        <button type="button" onclick="document.getElementById('torta-file-${index}').click()" style="flex:1; background:#f8fafc; color:#475569; border:1px solid #e2e8f0; padding:6px; border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer; transition:all 0.2s;">✏️ Cambiar</button>
                        <button type="button" onclick="window.eliminarDisenoTorta(${index})" style="background:#fef2f2; color:#ef4444; border:1px solid #fecaca; padding:6px 10px; border-radius:6px; font-size:0.8rem; cursor:pointer; transition:all 0.2s;">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    });

    modal.innerHTML = `
        <div class="auth-content" style="max-width:850px; width:95%; max-height:90vh; overflow-y:auto; padding:30px; background:#f8fafc; border-radius:24px; position:relative; box-shadow:0 20px 40px rgba(0,0,0,0.15);">
            <button class="auth-close-btn" onclick="document.getElementById('modal-config-tortas').style.display='none'" style="position:absolute; top:15px; right:15px; background:#fff; border:1px solid #e2e8f0; border-radius:50%; width:36px; height:36px; font-size:1.2rem; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; color:#64748b; box-shadow:0 2px 5px rgba(0,0,0,0.05);">✕</button>
            <div style="text-align:center; margin-bottom:24px;">
                <h2 style="margin:0; color:#1e293b; font-size:1.6rem; font-weight:800;">🎂 Configuración de Tortas</h2>
                <p style="margin:6px 0 0 0; color:#64748b; font-size:0.95rem;">Gestiona los sabores, precios por tamaño y catálogo de diseños.</p>
            </div>
            
            <!-- BLOQUE A: SABORES Y PRECIOS -->
            <div style="background:#fff; border:1px solid #f1f5f9; padding:20px; border-radius:16px; margin-bottom:24px; box-shadow:0 4px 12px rgba(0,0,0,0.04);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
                    <h4 style="margin:0; color:#1e293b; font-size:1.1rem; display:flex; align-items:center; gap:8px;">
                        <span>🍰</span> Gestión de Sabores y Precios
                    </h4>
                </div>
                
                <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse:collapse; min-width:620px;">
                        <thead>
                            <tr style="border-bottom:2px solid #f1f5f9; background:#f8fafc;">
                                <th style="text-align:left; padding:10px 8px; color:#64748b; font-size:0.85rem; font-weight:700;">Sabor y Detalles</th>
                                <th style="text-align:right; padding:10px 6px; color:#64748b; font-size:0.85rem; font-weight:700;">1/4 Lb <span style="display:block; font-size:0.7rem; font-weight:normal;">(10 porc.)</span></th>
                                <th style="text-align:right; padding:10px 6px; color:#64748b; font-size:0.85rem; font-weight:700;">1/2 Lb <span style="display:block; font-size:0.7rem; font-weight:normal;">(20 porc.)</span></th>
                                <th style="text-align:right; padding:10px 6px; color:#64748b; font-size:0.85rem; font-weight:700;">1 Lb <span style="display:block; font-size:0.7rem; font-weight:normal;">(30 porc.)</span></th>
                                <th style="text-align:center; padding:10px 6px; color:#64748b; font-size:0.85rem; font-weight:700;">Estado</th>
                                <th style="text-align:center; padding:10px 6px; color:#64748b; font-size:0.85rem; font-weight:700;"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${saboresHtml}
                        </tbody>
                    </table>
                </div>

                <div style="margin-top:14px;">
                    <button type="button" onclick="window.agregarSaborTorta()" style="width:100%; padding:10px; background:#fdf2f8; color:#db2777; border:2px dashed #fbcfe8; border-radius:10px; font-weight:700; cursor:pointer; font-size:0.9rem; transition:all 0.2s;" onmouseover="this.style.borderColor='#db2777'; this.style.background='#fce7f3';" onmouseout="this.style.borderColor='#fbcfe8'; this.style.background='#fdf2f8';">
                        ➕ Agregar Sabor
                    </button>
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

window.handleTortaDesignUpload = function(index, input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    const previewImg = document.getElementById(`preview-torta-img-${index}`);
    const hiddenInput = document.getElementById(`torta-img-${index}`);
    
    if (previewImg) previewImg.style.opacity = '0.4';
    if (typeof showToast === 'function') showToast("Optimizando diseño...", "⏳");
    
    window.comprimirImagen(file, { maxWidth: 600, maxHeight: 600, quality: 0.75 })
        .then(dataUrl => {
            if (hiddenInput) hiddenInput.value = dataUrl;
            if (previewImg) {
                previewImg.src = dataUrl;
                previewImg.style.opacity = '1';
            }
            if (window.dt_tortas_config && window.dt_tortas_config.disenos && window.dt_tortas_config.disenos[index]) {
                window.dt_tortas_config.disenos[index].img = dataUrl;
            }
            if (typeof showToast === 'function') showToast("Diseño optimizado y cargado", "📸");
        })
        .catch(err => {
            console.error("Error comprimiendo imagen de torta:", err);
            if (previewImg) previewImg.style.opacity = '1';
            if (typeof showToast === 'function') showToast("Error procesando imagen", "⚠️");
        });
};

window.agregarSaborTorta = function() {
    window.guardarEstadoTemporalTortas();
    if (!window.dt_tortas_config.sabores) window.dt_tortas_config.sabores = [];
    window.dt_tortas_config.sabores.push({
        id: 'sabor_' + Date.now(),
        name: 'Nuevo Sabor',
        icon: '🍰',
        desc: 'Descripción del sabor',
        tag: '',
        q: 45000,
        m: 75000,
        l: 130000,
        activo: true
    });
    window.renderModalConfigTortasInterno();
};

window.eliminarSaborTorta = function(index) {
    if (!confirm("¿Eliminar este sabor?")) return;
    window.guardarEstadoTemporalTortas();
    window.dt_tortas_config.sabores.splice(index, 1);
    window.renderModalConfigTortasInterno();
};

window.toggleDisponibilidadSabor = function(index) {
    window.guardarEstadoTemporalTortas();
    if (window.dt_tortas_config.sabores && window.dt_tortas_config.sabores[index]) {
        const s = window.dt_tortas_config.sabores[index];
        s.activo = (s.activo === false ? true : false);
    }
    window.renderModalConfigTortasInterno();
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
    if (!config.sabores) config.sabores = [];
    
    config.sabores.forEach((s, i) => {
        const nIcon = document.getElementById(`sabor-icon-${i}`);
        const nName = document.getElementById(`sabor-name-${i}`);
        const nTag = document.getElementById(`sabor-tag-${i}`);
        const nDesc = document.getElementById(`sabor-desc-${i}`);
        const nQ = document.getElementById(`sabor-q-${i}`);
        const nM = document.getElementById(`sabor-m-${i}`);
        const nL = document.getElementById(`sabor-l-${i}`);

        if (nIcon) s.icon = nIcon.value.trim();
        if (nName) s.name = nName.value.trim();
        if (nTag) s.tag = nTag.value.trim();
        if (nDesc) s.desc = nDesc.value.trim();
        if (nQ) s.q = parseInt(nQ.value) || 0;
        if (nM) s.m = parseInt(nM.value) || 0;
        if (nL) s.l = parseInt(nL.value) || 0;
        if (!s.id) s.id = 'sabor_' + i;
    });

    if (!config.preciosPorSabor) config.preciosPorSabor = {};
    config.sabores.forEach(s => {
        const key = s.id || s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        config.preciosPorSabor[key] = {
            q: Number(s.q) || 0,
            m: Number(s.m) || 0,
            l: Number(s.l) || 0
        };
        if (s.name.toLowerCase().includes('ponqu') || s.id === 'ponque') {
            config.preciosPorSabor.ponque = { q: Number(s.q) || 0, m: Number(s.m) || 0, l: Number(s.l) || 0 };
        }
        if (s.name.toLowerCase().includes('tres') || s.id === 'tresleches') {
            config.preciosPorSabor.tresleches = { q: Number(s.q) || 0, m: Number(s.m) || 0, l: Number(s.l) || 0 };
        }
        if (s.name.toLowerCase().includes('choco') || s.id === 'chocoarequipe') {
            config.preciosPorSabor.chocoarequipe = { q: Number(s.q) || 0, m: Number(s.m) || 0, l: Number(s.l) || 0 };
        }
    });

    if (config.disenos) {
        config.disenos.forEach((d, i) => {
            const nName = document.getElementById(`torta-name-${i}`);
            const nImg = document.getElementById(`torta-img-${i}`);
            if(nName) d.name = nName.value;
            if(nImg) d.img = nImg.value;
        });
    }
};

window.guardarConfigTortas = function() {
    window.guardarEstadoTemporalTortas();
    
    if (!window.dt_tortas_config.sabores || window.dt_tortas_config.sabores.length === 0) {
        if(typeof showToast === 'function') showToast("Debe haber al menos un sabor configurado", "⚠️");
        return;
    }

    localStorage.setItem('dt_tortas_config', JSON.stringify(window.dt_tortas_config));
    
    if (typeof db !== 'undefined') {
        db.collection('config').doc('tortas_config').set(window.dt_tortas_config)
            .then(() => {
                if(typeof showToast === 'function') showToast("Configuración de tortas guardada", "✅");
            })
            .catch(e => {
                console.error("Error guardando config tortas:", e);
                if(typeof showToast === 'function') showToast("Error guardando en la nube", "⚠️");
            });
    } else {
        if(typeof showToast === 'function') showToast("Guardado localmente", "✅");
    }
    
    const modal = document.getElementById('modal-config-tortas');
    if (modal) modal.style.display = 'none';
    window.renderConfigTortasPublica();
};

window.renderConfigTortasPublica = function() {
    if (typeof window.asegurarEstructuraTortasConfig === 'function') {
        window.dt_tortas_config = window.asegurarEstructuraTortasConfig(window.dt_tortas_config);
    }
    const config = window.dt_tortas_config;
    
    // Renderizar grilla de sabores en el modal del cliente
    const flavorGrid = document.querySelector('.wizard-flavor-grid');
    if (flavorGrid && Array.isArray(config.sabores)) {
        const saboresActivos = config.sabores.filter(s => s.activo !== false);
        const listaSabores = saboresActivos.length > 0 ? saboresActivos : config.sabores;

        if (typeof wizardData !== 'undefined') {
            const saborExiste = listaSabores.some(s => s.name === wizardData.sabor);
            if (!saborExiste && listaSabores.length > 0) {
                wizardData.sabor = listaSabores[0].name;
            }
        }

        let flavorsHtml = '';
        listaSabores.forEach(s => {
            const isSelected = typeof wizardData !== 'undefined' && wizardData.sabor === s.name;
            const safeName = (s.name || '').replace(/'/g, "\\'");
            flavorsHtml += `
                <div class="flavor-card ${isSelected ? 'selected' : ''}" onclick="selectSaborCard('${safeName}', this)" data-flavor="${s.name || ''}">
                    <div class="card-check-icon">✓</div>
                    <span class="flavor-icon">${s.icon || '🍰'}</span>
                    <div class="flavor-info">
                        <strong>${s.name || 'Sabor'}</strong>
                        ${s.tag ? `<span class="flavor-badge-tag">${s.tag}</span>` : ''}
                        ${s.desc ? `<p>${s.desc}</p>` : ''}
                    </div>
                </div>
            `;
        });
        flavorGrid.innerHTML = flavorsHtml;
    }

    // Forzar actualización de los precios según el sabor seleccionado actualmente
    if (typeof wizardData !== 'undefined' && typeof getCakePrices === 'function') {
        const saborAUsar = wizardData.sabor || (config.sabores && config.sabores.length > 0 ? config.sabores[0].name : 'Clásica Tres Leches');
        const prices = getCakePrices(saborAUsar);
        if (typeof updateSizePrices === 'function') {
            updateSizePrices(prices);
        }
        if (wizardData.tamano && prices[wizardData.tamano]) {
            wizardData.precio = prices[wizardData.tamano];
        }
        if (typeof updateWizardSummary === 'function') {
            updateWizardSummary();
        }
    }
    
    // Renderizar diseños disponibles
    const grid = document.getElementById('cake-design-grid');
    if (grid && Array.isArray(config.disenos)) {
        let html = '';
        config.disenos.forEach(d => {
            const isSelected = typeof wizardData !== 'undefined' && wizardData.diseno === d.name;
            html += `
                <div class="design-thumb ${isSelected ? 'selected' : ''}" onclick="selectDiseno('${(d.name || '').replace(/'/g, "\\'")}', this)">
                    <img src="${d.img || 'logo-pys.png'}" alt="Diseño ${d.name}" style="width:100%; border-radius:8px; object-fit:cover; aspect-ratio:1;" onerror="this.onerror=null; this.src='logo-pys.png';">
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

window.closeCartModal = function() {
    const m = document.getElementById('cartModal');
    if (m) {
        m.style.display = 'none';
        document.body.style.overflow = '';
    }
};

window.openDeliveryCoverageModal = function() {
    const m = document.getElementById('deliveryCoverageModal');
    if (m) {
        m.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
};

window.closeDeliveryCoverageModal = function(e) {
    if (e && e.target && e.target !== e.currentTarget && e.target.id !== 'deliveryCoverageModal') {
        return;
    }
    const m = document.getElementById('deliveryCoverageModal');
    if (m) {
        m.style.display = 'none';
        document.body.style.overflow = '';
    }
};

window.toggleMobileMenu = function(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const m = document.getElementById('mobileDropdownMenu');
    if (!m) return;
    if (m.style.display === 'block') {
        window.closeMobileMenu();
    } else {
        window.openMobileMenu();
    }
};

window.openMobileMenu = function() {
    const m = document.getElementById('mobileDropdownMenu');
    if (m) {
        m.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
};

window.closeMobileMenu = function() {
    const m = document.getElementById('mobileDropdownMenu');
    if (m) {
        m.style.display = 'none';
        document.body.style.overflow = '';
    }
};

// ===== PRODUCT IMAGE LIGHTBOX =====
window.openProductImageModal = function(src, title) {
    const modal = document.getElementById('productImageModal');
    if (!modal) return;
    const imgEl = document.getElementById('productLightboxImg');
    const captionEl = document.getElementById('productLightboxCaption');
    if (imgEl) {
        imgEl.src = src || 'logo-pys.png';
        imgEl.alt = title || 'Producto';
    }
    if (captionEl) {
        captionEl.textContent = title || '';
        captionEl.style.display = title ? 'block' : 'none';
    }
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeProductImageModal = function() {
    const modal = document.getElementById('productImageModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
};

if (!window._productLightboxKeydownAttached) {
    window._productLightboxKeydownAttached = true;
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            const modal = document.getElementById('productImageModal');
            if (modal && modal.style.display === 'flex') {
                window.closeProductImageModal();
            }
        }
    });
}

// --- SISTEMA DE CONFIGURACIÓN DE DOMICILIO GRATIS ---
window.dt_min_free_delivery = window.dt_min_free_delivery || 10000;

window.abrirModalConfigDelivery = function() {
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

window.guardarConfigDelivery = function() {
    const val = parseInt(document.getElementById('config-delivery-min').value);
    if (isNaN(val) || val < 0) {
        if(typeof showToast === 'function') showToast('Ingresa un monto válido', '⚠️');
        return;
    }

    window.dt_min_free_delivery = val;
    
    if (typeof db !== 'undefined') {
        db.collection('config').doc('tienda').set({ minFreeDelivery: val }, { merge: true })
            .then(() => {
                if(typeof showToast === 'function') showToast("Monto guardado con éxito", "🛵");
                document.getElementById('modal-config-delivery').style.display = 'none';
                if (typeof updateCart === 'function') updateCart();
            })
            .catch(err => {
                console.error("Error guardando config:", err);
                if(typeof showToast === 'function') showToast("Error al guardar", "❌");
            });
    } else {
        if(typeof showToast === 'function') showToast("No hay conexión a BD", "⚠️");
    }
};