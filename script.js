const PHONE = "573229512693";

function safeImg(src) {
    if (!src || src === 'undefined' || src === 'null' || typeof src !== 'string' || src.trim() === '' || src.startsWith('img/')) {
        return 'logo-pys.png';
    }
    return src;
}

const products = [
    // --- PANADERÍA TRADICIONAL ($500) ---
    { id: 1, name: "Pan Cascarita Tradicional", price: 500, cat: "panaderia", img: "pan cascarita 500 pesos.jpeg", desc: "Pan tradicional de costra crocante y miga suave" },
    { id: 2, name: "Pan de Maíz", price: 500, cat: "panaderia", img: "bolitas de maiz 500 pesos.jpeg", desc: "Sabor suave y tradicional de maíz horneado" },
    { id: 3, name: "Pan de Leche", price: 500, cat: "panaderia", img: "bolitas de leche 500 pesos.jpeg", desc: "Miga extra esponjosa y dulce aroma a leche" },
    { id: 4, name: "Pan de Bocadillo", price: 500, cat: "panaderia", img: "bolita de bocadillo.jpeg", desc: "Relleno del tradicional dulce de guayaba" },
    { id: 16, name: "Lengua", price: 500, cat: "panaderia", img: "logo-pys.png", desc: "Pan tradicional alargado con toque dulce" },
    { id: 17, name: "Tostado", price: 500, cat: "panaderia", img: "logo-pys.png", desc: "Pan crocante y tostado al punto ideal" },

    // --- PANES ESPECIALES ($1.000 a $4.000) ---
    { id: 18, name: "Pan de Salchicha", price: 1000, cat: "panaderia", img: "logo-pys.png", desc: "Relleno de salchicha con masa fresca horneada" },
    { id: 19, name: "Roscón", price: 2000, cat: "panaderia", img: "logo-pys.png", desc: "Clásico roscón azucarado con relleno tradicional" },
    { id: 9, name: "Roliqueso", price: 2500, cat: "panaderia", img: "roliqueso 3000.jpeg", desc: "Rollo crocante relleno de abundante queso fundido" },
    { id: 20, name: "Pan Largo de Leche", price: 3000, cat: "panaderia", img: "logo-pys.png", desc: "Presentación familiar suave y esponjosa" },
    { id: 21, name: "Pan Largo de Maíz", price: 3000, cat: "panaderia", img: "logo-pys.png", desc: "Presentación familiar con auténtico sabor a maíz" },
    { id: 22, name: "Pan Largo Azucarado", price: 3000, cat: "panaderia", img: "logo-pys.png", desc: "Pan familiar con cobertura dulce azucarada" },
    { id: 10, name: "Pan Tajado Familiar", price: 4000, cat: "panaderia", img: "pan tajado a 4000.jpeg", desc: "Ideal para sándwiches y desayunos diarios" },

    // --- GALLETERÍA Y ANTOJOS POR UNIDAD ($500 a $700) ---
    { id: 23, name: "Polvorosas", price: 500, cat: "antojos", img: "galletas a 500.jpeg", desc: "Galleta artesanal suave que se deshace en la boca" },
    { id: 24, name: "Galleta de Grajea", price: 500, cat: "antojos", img: "galletas a 500.jpeg", desc: "Galleta crujiente con lluvia de colores" },
    { id: 25, name: "Merengue", price: 500, cat: "antojos", img: "galletas a 500.jpeg", desc: "Dulce, crocante y horneado artesanalmente" },
    { id: 26, name: "Paledonea Negra", price: 600, cat: "antojos", img: "paleedonias a 500.jpeg", desc: "Elaborada con auténtica panela y especias dulces" },
    { id: 27, name: "Paledonea Blanca", price: 600, cat: "antojos", img: "paleedonias a 500.jpeg", desc: "Receta tradicional dorada y aromática" },
    { id: 28, name: "Galleta de Coco", price: 700, cat: "antojos", img: "galletas a 500.jpeg", desc: "Crujiente con rico sabor a coco tostado" },
    { id: 7, name: "Galletas Corazón", price: 500, cat: "antojos", img: "galletas a 500.jpeg", desc: "Con relleno central de mermelada" },

    // --- PAQUETES Y PARA LLEVAR ($3.000) ---
    { id: 29, name: "Paquete Paledonea Negra (x5)", price: 3000, cat: "paquetes", img: "paleedonias a 500.jpeg", desc: "Bolsa sellada con 5 galletas de panela" },
    { id: 30, name: "Paquete Paledonea Blanca (x5)", price: 3000, cat: "paquetes", img: "paleedonias a 500.jpeg", desc: "Bolsa sellada con 5 galletas tradicionales" },
    { id: 31, name: "Paquete Galleta de Coco (x4)", price: 3000, cat: "paquetes", img: "galletas a 500.jpeg", desc: "Bolsa sellada con 4 galletas crujientes de coco" },

    // --- PASTELERÍA Y COMBOS (SE MANTIENEN) ---
    { id: 12, name: "Porción Torta Chocolate Húmeda", price: 4000, cat: "pasteleria", img: "logo-pys.png", desc: "Rellena de chocolate húmedo especial" },
    { id: 13, name: "Combo Desayuno Tentación", price: 5500, cat: "combos", img: "logo-pys.png", desc: "Café con leche + 2 panes cascarita + galleta" },
    { id: 15, name: "👑 Caja VIP 'Dulce Despertar'", price: 25000, cat: "combos", img: "logo-pys.png", desc: "Surtido especial en caja de regalo artesanal" },

    // --- EVENTOS Y FIESTAS (PRECIO BASE) ---
    { id: 101, name: "Combo Compartir Familiar (25 und)", price: 50000, cat: "eventos", img: "WhatsApp Image 2026-08-19 at 19.32.35.jpeg", desc: "Pasabocas surtidos con relleno a elección", unidades: 25, permiteRelleno: true },
    { id: 102, name: "Combo Oficina & Fiesta (50 und)", price: 100000, cat: "eventos", img: "WhatsApp Image 2026-08-19 at 19.32.59.jpeg", desc: "Ideal para reuniones y eventos corporativos", unidades: 50, permiteRelleno: true },
    { id: 103, name: "Combo Gran Gala & Evento (100 und)", price: 200000, cat: "eventos", img: "WhatsApp Image 2026-08-25 at 20.32.38.jpeg", desc: "Bandeja para grandes celebraciones", unidades: 100, permiteRelleno: true },
    { id: 106, name: "Rosca Navideña Trenzada", price: 48000, cat: "eventos", img: "logo-pys.png", desc: "Tradicional trenza navideña con frutas y glaseado", unidades: 1, permiteRelleno: false }
];
const OPCIONES_RELLENO = {
    'queso': { nombre: '🧀 Queso Campesino — $2.000 c/u', precioUnitario: 2000, promo: false },
    'bocadillo_queso': { nombre: '🍯 Bocadillo con Queso — $2.000 c/u', precioUnitario: 2000, promo: false },
    'pollo': { nombre: '🍗 Pechuga de Pollo — $3.000 c/u', precioUnitario: 3000, promo: false },
    'jamon_queso': { nombre: '🥓 Jamón y Queso — $3.000 c/u', precioUnitario: 3000, promo: false },
    'especial': { nombre: '🔥 Especial Trío (Pollo+Jamón+Queso) — $3.500 c/u', precioUnitario: 3500, promo: true, tachadoUnitario: 3700 }
};

let cart = [];
let orderType = 'inmediato';
let currentUser = null;
let selectedPay = "Nequi / Daviplata";

let adminConfig = { minPurchase: 0, maxDiscount: 20000, vipEnabled: true };
let pedidosHistorial = [];
let orderSoundEnabled = true;
let lastOrderCount = 0;

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
    try {
        const savedProds = JSON.parse(localStorage.getItem('dt_products'));
        if (savedProds && Array.isArray(savedProds) && savedProds.length > 0) {
            savedProds.forEach(sp => {
                const idx = products.findIndex(p => p.id === sp.id);
                if (idx > -1) {
                    products[idx] = { ...products[idx], ...sp };
                } else {
                    products.push(sp);
                }
            });
        }
    } catch (e) { }
    try { const c = localStorage.getItem('dt_cart'); if (c) cart = JSON.parse(c); } catch (e) { }
    try {
        const u = localStorage.getItem('dt_user');
        if (u) {
            const parsed = JSON.parse(u);
            if (parsed && (parsed.email || '').toLowerCase().trim() === 'correo@google.com') {
                localStorage.removeItem('dt_user');
                localStorage.removeItem('dt_logged_user');
                currentUser = null;
            } else {
                currentUser = parsed;
            }
        }
    } catch (e) { }
    try { const a = localStorage.getItem('dt_admin_config'); if (a) adminConfig = JSON.parse(a); } catch (e) { }
    try { const p = localStorage.getItem('dt_pedidos_historial'); if (p) pedidosHistorial = JSON.parse(p); } catch (e) { }
    try {
        const s = localStorage.getItem('dt_sound_enabled');
        if (s !== null) {
            orderSoundEnabled = (s === 'true');
        } else {
            orderSoundEnabled = true;
            localStorage.setItem('dt_sound_enabled', 'true');
        }
    } catch (e) {
        orderSoundEnabled = true;
    }

    // Initialize Flatpickr for birthday
    if (typeof flatpickr !== 'undefined') {
        flatpickr("#reg-birthday", {
            locale: "es",
            dateFormat: "d/m/Y",
            maxDate: "today",
            disableMobile: true,
            yearSelectorType: "static"
        });
        flatpickr("#eventTime", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "h:i K",
            time_24hr: false,
            defaultHour: 15,
            defaultMinute: 0,
            minTime: "08:00",
            maxTime: "19:30",
            minuteIncrement: 15,
            disableMobile: true
        });
    }

    lastOrderCount = pedidosHistorial.length;
    const soundTog = document.getElementById('soundToggle');
    if (soundTog) soundTog.checked = orderSoundEnabled;
    setInterval(checkNewOrders, 3000);

    renderFeatured();
    renderProducts(products);
    updateCart();
    syncUserUI();
    if (window.renderAdminNotifList) window.renderAdminNotifList();
    if (typeof window.checkRemoteUserSession === 'function') window.checkRemoteUserSession();

    // Configurar scroll de categorías con el ratón en PC
    const sliders = document.querySelectorAll('.cat-chip-scroll');
    sliders.forEach(slider => {
        let isDown = false;
        let startX;
        let scrollLeft;

        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            slider.style.cursor = 'grabbing';
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        slider.addEventListener('mouseleave', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });
        slider.addEventListener('mouseup', () => {
            isDown = false;
            slider.style.cursor = 'grab';
        });
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 1.5; // Velocidad del arrastre
            slider.scrollLeft = scrollLeft - walk;
        });
    });
});

function saveCart() { try { localStorage.setItem('dt_cart', JSON.stringify(cart)); } catch (e) { } }
function saveUser() { try { if (currentUser) localStorage.setItem('dt_user', JSON.stringify(currentUser)); else localStorage.removeItem('dt_user'); } catch (e) { } }
function saveAdminConfig() { try { localStorage.setItem('dt_admin_config', JSON.stringify(adminConfig)); } catch (e) { } }
function savePedidosHistorial() { try { localStorage.setItem('dt_pedidos_historial', JSON.stringify(pedidosHistorial)); } catch (e) { } }

// ===== SECTION NAVIGATION =====
function showSection(id, element) {
    if (id === 'admin-dashboard') {
        const normEmail = (currentUser?.email || '').toLowerCase().trim();
        const isSuper = currentUser ? (
            (typeof window.SUPER_ADMINS !== 'undefined')
                ? window.SUPER_ADMINS.includes(normEmail)
                : (normEmail === 'pablojose182017@gmail.com' || normEmail === 'dulcestentaciones2004@gmail.com')
        ) : false;
        const isAdmin = isSuper || (currentUser?.role === 'admin') || (currentUser?.rol === 'admin') || (currentUser?.isAdmin === true) || ((typeof adminEmails !== 'undefined') && adminEmails.includes(currentUser?.email));
        const isWorker = !isSuper && !isAdmin && ((currentUser?.role === 'trabajador') || (currentUser?.rol === 'trabajador') || ((typeof workerEmails !== 'undefined') && workerEmails.includes(currentUser?.email)));
        if (!currentUser || (!isAdmin && !isWorker)) {
            id = 'inicio';
        }
    }

    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        if (s.id === 'admin-dashboard' && id !== 'admin-dashboard') {
            s.style.display = 'none';
        }
    });
    document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.bottom-nav-btn').forEach(b => b.classList.remove('active'));

    const el = document.getElementById(id);
    if (el) {
        if (id === 'admin-dashboard') {
            el.style.display = 'block';
            const soundTog = document.getElementById('soundToggle');
            if (soundTog) soundTog.checked = orderSoundEnabled;
        }
        el.classList.add('active');
    }
    if (element && element.classList && element.classList.contains('nav-link')) element.classList.add('active');

    // Sync bottom nav
    const bnMap = { inicio: 'bnInicio', productos: 'bnProductos', nosotros: 'bnNosotros' };
    const bnEl = document.getElementById(bnMap[id]);
    if (bnEl) bnEl.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'instant' });
}

function goToCatalog(e) {
    if (e) e.preventDefault();
    showSection('productos', document.querySelectorAll('.nav-link')[1]);
    setTimeout(() => {
        const cat = document.getElementById('productos');
        if (cat) cat.scrollIntoView({ behavior: 'smooth' });
    }, 10);
}

// ===== MOBILE SEARCH TOGGLE =====
function toggleMobileSearch() {
    const bar = document.getElementById('mobileSearchBar');
    bar.classList.toggle('open');
    if (bar.classList.contains('open')) {
        document.getElementById('searchInputMobile').focus();
    }
}

// ===== AUTH =====
window.togglePasswordVisibility = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
        btn.setAttribute('aria-label', 'Ocultar contraseña');
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
        btn.setAttribute('aria-label', 'Mostrar contraseña');
    }
};

function openAuthModal() { document.getElementById('authModal').style.display = 'flex'; }
function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    const msgEl = document.getElementById('authMsg');
    if (msgEl) {
        msgEl.style.display = 'none';
        msgEl.className = 'auth-msg';
    }
    document.querySelectorAll('.custom-form input').forEach(inp => inp.value = '');
    document.querySelectorAll('.password-wrapper input').forEach(inp => inp.type = 'password');
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.textContent = '👁️';
        btn.setAttribute('aria-label', 'Mostrar contraseña');
    });
}
function handleAuthBdrop(e) { if (e.target === document.getElementById('authModal')) closeAuthModal(); }

function switchAuthTab(tab) {
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
    document.getElementById('paneLogin').classList.toggle('active', tab === 'login');
    document.getElementById('paneRegister').classList.toggle('active', tab === 'register');

    const paneRecovery = document.getElementById('paneRecovery');
    if (paneRecovery) {
        paneRecovery.classList.remove('active');
        paneRecovery.style.display = 'none';
    }

    const msgEl = document.getElementById('authMsg');
    if (msgEl) {
        msgEl.style.display = 'none';
        msgEl.className = 'auth-msg';
    }
}

function showRecoveryForm(e) {
    e.preventDefault();
    document.getElementById('paneLogin').classList.remove('active');
    document.getElementById('paneRegister').classList.remove('active');

    const paneRecovery = document.getElementById('paneRecovery');
    paneRecovery.style.display = 'block';
    paneRecovery.classList.add('active');

    document.getElementById('recoveryWhatsAppContainer').style.display = 'none';
    const msgEl = document.getElementById('authMsg');
    if (msgEl) { msgEl.style.display = 'none'; msgEl.className = 'auth-msg'; }
}

function requestPasswordRecovery() {
    const email = document.getElementById('recoveryEmail').value.trim().toLowerCase();
    if (!email) return showAuthMessage('Por favor, ingresa tu correo electrónico.', 'error');

    const user = db_users.find(u => u.email === email);
    if (!user) {
        return showAuthMessage('No encontramos ninguna cuenta con ese correo.', 'error');
    }

    const waLink = document.getElementById('recoveryWhatsAppLink');
    const msg = `Hola Dulce Tentación, olvidé la contraseña de mi cuenta: ${email}. ¿Me ayudan a restablecerla, por favor?`;
    waLink.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;

    document.getElementById('recoveryWhatsAppContainer').style.display = 'block';
    showAuthMessage('Cuenta encontrada. Usa el botón de abajo para solicitarla.', 'success');
}

function showAuthMessage(msg, type) {
    const msgEl = document.getElementById('authMsg');
    if (!msgEl) return;
    msgEl.innerText = msg;
    msgEl.className = 'auth-msg ' + type;
    msgEl.style.display = 'block';
}

function loginCustomUser(e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = (document.getElementById('loginEmail')?.value || '').trim().toLowerCase();
    const pass = (document.getElementById('loginPassword')?.value || '').trim();

    if (!email || !pass) {
        return showAuthMessage('Por favor, completa todos los campos.', 'error');
    }

    if (SUPER_ADMINS.includes(email) && pass === 'Admin123*') {
        const adminName = (email === 'pablojose182017@gmail.com') ? 'Pablo Carrascal' : 'Dulce Tentación';
        const superAdminObj = {
            name: adminName,
            nombre: adminName,
            email: email,
            password: 'Admin123*',
            role: 'admin',
            rol: 'admin',
            isAdmin: true,
            blocked: false,
            points: 500,
            vip: true,
            isVip: true,
            vipStatus: 'activo',
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=e11d48&color=fff&bold=true`
        };
        const uidx = db_users.findIndex(u => u && u.email && u.email.toLowerCase().trim() === email);
        if (uidx !== -1) {
            db_users[uidx] = { ...db_users[uidx], ...superAdminObj };
        } else {
            db_users.push({ ...superAdminObj });
        }
        saveUsersDB();

        let regUsers = [];
        try {
            regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
            if (!Array.isArray(regUsers)) regUsers = [];
        } catch(err) { regUsers = []; }
        const rIdx = regUsers.findIndex(u => u && u.email && u.email.toLowerCase().trim() === email);
        if (rIdx !== -1) regUsers[rIdx] = { ...regUsers[rIdx], ...superAdminObj };
        else regUsers.push({ ...superAdminObj });
        localStorage.setItem('dt_registered_users', JSON.stringify(regUsers));

        return loginUserObj(superAdminObj);
    }

    // Buscar en dt_users_db y dt_registered_users
    let dbUsers = [];
    try {
        dbUsers = JSON.parse(localStorage.getItem('dt_users_db') || '[]');
        if (!Array.isArray(dbUsers) || dbUsers.length === 0) {
            dbUsers = (typeof db_users !== 'undefined' && Array.isArray(db_users)) ? db_users : [];
        }
    } catch(err) { dbUsers = db_users || []; }

    let regUsers = [];
    try {
        regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
        if (!Array.isArray(regUsers)) regUsers = [];
    } catch(err) { regUsers = []; }

    // Buscar coincidencia en dt_registered_users y luego en dbUsers
    let foundUser = regUsers.find(u => u && u.email && ((u.email.trim().toLowerCase() === email || (u.username && u.username.trim().toLowerCase() === email)) && (u.password === pass)));
    if (!foundUser) {
        foundUser = dbUsers.find(u => u && u.email && ((u.email.trim().toLowerCase() === email || (u.username && u.username.trim().toLowerCase() === email)) && (u.password === pass)));
    }

    // Si aún no se encontró con contraseña exacta, comprobar si el usuario existe para mensaje claro
    if (!foundUser) {
        const userExists = regUsers.some(u => u && u.email && (u.email.trim().toLowerCase() === email || (u.username && u.username.trim().toLowerCase() === email))) ||
                           dbUsers.some(u => u && u.email && (u.email.trim().toLowerCase() === email || (u.username && u.username.trim().toLowerCase() === email)));
        if (userExists) {
            return showAuthMessage('Contraseña incorrecta. Por favor intenta de nuevo.', 'error');
        }
        return showAuthMessage('El usuario no existe o la contraseña es incorrecta.', 'error');
    }

    if (foundUser.blocked || foundUser.estado === 'bloqueado') {
        return showAuthMessage('⛔ Tu cuenta ha sido suspendida por incumplimiento de políticas.', 'error');
    }

    // Normalizar objeto de usuario con rol y estado VIP correctos
    const resolvedRole = foundUser.role || foundUser.rol || 'cliente';
    const isVip = !!(foundUser.isVip || foundUser.vip || resolvedRole === 'vip');
    const userToLogin = {
        name: foundUser.name || foundUser.nombre || (email.split('@')[0]),
        nombre: foundUser.name || foundUser.nombre || (email.split('@')[0]),
        email: (foundUser.email || email).toLowerCase().trim(),
        phone: foundUser.phone || foundUser.telefono || '',
        password: foundUser.password || pass,
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
    const dbIdx = db_users.findIndex(u => u && u.email && u.email.toLowerCase().trim() === userToLogin.email);
    if (dbIdx !== -1) {
        db_users[dbIdx] = { ...db_users[dbIdx], ...userToLogin };
    } else {
        db_users.push({ ...userToLogin });
    }
    saveUsersDB();

    // Sincronizar en dt_registered_users
    const rIdx = regUsers.findIndex(u => u && u.email && u.email.toLowerCase().trim() === userToLogin.email);
    if (rIdx !== -1) {
        regUsers[rIdx] = { ...regUsers[rIdx], ...userToLogin };
    } else {
        regUsers.push({ ...userToLogin });
    }
    localStorage.setItem('dt_registered_users', JSON.stringify(regUsers));

    loginUserObj(userToLogin);
}

function registerCustomUser(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const pass = document.getElementById('regPassword').value;
    const birthday = document.getElementById('reg-birthday') ? document.getElementById('reg-birthday').value : '';

    if (!name || !phone || !email || !pass) {
        return showAuthMessage('Por favor, completa todos los campos obligatorios para registrarte.', 'error');
    }

    if (db_users.find(u => u && u.email && u.email.trim().toLowerCase() === email)) {
        return showAuthMessage('Este correo ya está registrado. Por favor inicia sesión.', 'error');
    }

    const newUser = {
        name,
        email,
        phone,
        password: pass,
        birthday: birthday,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d81b60&color=fff&bold=true`,
        points: 15
    };
    db_users.push(newUser);
    currentUser = newUser;
    saveUsersDB();
    saveUser();
    syncUserUI();
    closeAuthModal();
    showToast("¡Registro exitoso! Bienvenido al Club P&S Punto Dulce 🍰", "🎉");
}

const defaultPointRewards = [
    { id: 'r1', name: 'Hojaldre de Bocadillo y Queso', cost: 1000, img: 'WhatsApp Image 2026-08-19 at 19.32.35.jpeg' },
    { id: 'r2', name: 'Hojaldre de Pollo', cost: 2000, img: 'WhatsApp Image 2026-08-19 at 19.32.59.jpeg' },
    { id: 'r3', name: 'Hojaldre de Pollo, Jamón y Queso', cost: 3000, img: 'WhatsApp Image 2026-08-25 at 20.32.38.jpeg' }
];

let pointRewards = defaultPointRewards;
try {
    const savedPointRewards = JSON.parse(localStorage.getItem('dt_point_rewards'));
    if (savedPointRewards && Array.isArray(savedPointRewards) && savedPointRewards.length > 0) {
        pointRewards = savedPointRewards;
    }
} catch(e) {
    console.warn("Aviso cargando pointRewards de localStorage:", e);
}
window.pointRewards = pointRewards;

function renderRewards() {
    const currentList = window.pointRewards || pointRewards;
    const pts = currentUser ? (currentUser.points || 0) : 0;
    const ticketValEl = document.getElementById('modal-ticket-val');
    if (ticketValEl) ticketValEl.innerText = pts;

    const container = document.getElementById('rewards-container');
    if (!container) return;

    container.innerHTML = currentList.map(r => {
        const canRedeem = currentUser && pts >= r.cost;
        const missing = r.cost - pts;
        let btnText = 'Canjear premio';
        let clickAttr = `onclick="redeemReward('${r.id}')"`;
        let disabledAttr = '';

        if (!currentUser) {
            btnText = 'Inicia sesión para canjear';
            clickAttr = `onclick="openAuthModal()"`;
        } else if (!canRedeem) {
            btnText = `Te faltan ${missing} pts`;
            clickAttr = '';
            disabledAttr = 'disabled';
        }

        return `
            <div class="ticket-card">
                <img src="${safeImg(r.img)}" alt="${r.name}" onerror="this.onerror=null; this.src='logo-pys.png';">
                <div class="ticket-card-info">
                    <h4>${r.name}</h4>
                    <p>🎟️ ${r.cost} Pts</p>
                </div>
                <button class="btn-redeem" ${clickAttr} ${disabledAttr}>
                    ${btnText}
                </button>
            </div>
        `;
    }).join('');
}

function openPointsModal() {
    renderRewards();
    const inicioSec = document.getElementById('inicio');
    if (inicioSec && !inicioSec.classList.contains('active')) {
        showSection('inicio', document.querySelectorAll('.nav-link')[0]);
    }
    const target = document.getElementById('club-puntos');
    if (target) {
        const root = document.documentElement;
        const prevBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        requestAnimationFrame(() => {
            root.style.scrollBehavior = prevBehavior;
        });
    }
}

function redeemReward(rewardId) {
    const currentList = window.pointRewards || pointRewards;
    const reward = currentList.find(x => x.id === rewardId);
    if (!reward || !currentUser || (currentUser.points || 0) < reward.cost) return;

    currentUser.points -= reward.cost;
    const uidx = db_users.findIndex(u => u.email === currentUser.email);
    if (uidx !== -1) { db_users[uidx].points = currentUser.points; saveUsersDB(); }
    saveUser();
    syncUserUI();
    renderRewards();

    cart.push({
        id: Date.now(),
        name: '🎁 Cortesía: ' + reward.name,
        price: 0,
        quantity: 1,
        cat: 'cortesia',
        tag: '¡Canjeado!',
        img: reward.img || 'logo-pys.png'
    });
    saveCart();
    updateCart();

    const mPuntos = document.getElementById('modal-puntos');
    if (mPuntos) mPuntos.style.display = 'none';

    showToast("¡Premio canjeado! Revisa tu carrito 🎉", "🍰");
    toggleCart();
}

function openOrderHistory() {
    const modal = document.getElementById('modal-order-history');
    const container = document.getElementById('order-history-content');
    if (!modal || !container) return;

    if (!currentUser) {
        openAuthModal();
        return;
    }

    const todosLosPedidos = pedidosHistorial || [];
    const misPedidos = todosLosPedidos.filter(p => p.clienteEmail === currentUser.email || p.email === currentUser.email);

    if (misPedidos.length === 0) {
        container.innerHTML = `
                <div style="text-align:center; padding:30px 10px; color:#6b7280;">
                    <div style="font-size:3rem; margin-bottom:15px;">🧁</div>
                    <strong style="display:block; font-size:1.1rem; color:#374151; margin-bottom:5px;">Aún no tienes pedidos registrados.</strong>
                    <p style="font-size:0.9rem;">¡Haz tu primer antojito y aparecerá aquí en tiempo real!</p>
                </div>`;
    } else {
        misPedidos.reverse();
        container.innerHTML = misPedidos.map(pedido => {
            const statusColor = pedido.estado === 'Entregado' ? '#10b981' : (pedido.estado === 'En preparación' ? '#3b82f6' : '#f59e0b');
            return `
                    <div class="history-order-card">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <strong>Pedido #${pedido.id || Math.floor(Math.random() * 9000 + 1000)}</strong>
                            <span class="badge-status" style="background:${statusColor}20; color:${statusColor};">${pedido.estado || 'Pendiente'}</span>
                        </div>
                        <div style="font-size:0.8rem; color:#6b7280; margin-bottom:10px;">${pedido.fecha || 'Fecha reciente'}</div>
                        <div style="font-size:0.85rem; color:#4b5563; margin-bottom:10px;">
                            ${(pedido.items || []).map(item => `
                            <div style="display:flex; justify-content:space-between;">
                                <span>${item.cantidad || 1}x ${item.nombre || item.title}</span>
                            </div>
                            `).join('')}
                        </div>
                        <div style="display:flex; justify-content:flex-end; border-top:1px solid #f3f4f6; padding-top:10px;">
                            <strong>Total: $${(pedido.total || 0).toLocaleString('es-CO')}</strong>
                        </div>
                    </div>`;
        }).join('');
    }
    modal.style.display = 'flex';
}

function closeOrderHistory() {
    const modal = document.getElementById('modal-order-history');
    if (modal) modal.style.display = 'none';
}

function openOrdersModal() {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    document.getElementById('modal-mis-pedidos').style.display = 'flex';
    switchOrderTab('curso');
}

function switchOrderTab(tabId) {
    document.querySelectorAll('.order-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.orders-tab-content').forEach(content => content.classList.remove('active'));

    document.getElementById(`tab-btn-${tabId}`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');

    renderOrders(tabId);
}

function renderOrders(tabId) {
    const container = document.getElementById(`tab-${tabId}`);
    container.innerHTML = '';

    if (!currentUser || !currentUser.history) {
        container.innerHTML = '<p style="text-align:center; color:#94a3b8; margin: 20px 0;">Aún no tienes pedidos registrados... ¡antójate de algo rico!</p>';
        return;
    }

    let filteredOrders = [];
    const todayStr = new Date().toLocaleDateString('es-CO');

    if (tabId === 'curso') {
        // Pedidos inmediatos del día
        filteredOrders = currentUser.history.filter(o => o.type !== 'evento' && new Date(o.timestamp).toLocaleDateString('es-CO') === todayStr);
    } else if (tabId === 'eventos') {
        filteredOrders = currentUser.history.filter(o => o.type === 'evento');
    } else if (tabId === 'historial') {
        // Historial de compras anteriores
        filteredOrders = currentUser.history.filter(o => o.type !== 'evento' && new Date(o.timestamp).toLocaleDateString('es-CO') !== todayStr);
    }

    if (filteredOrders.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#94a3b8; margin: 20px 0;">Aún no tienes pedidos en esta sección... ¡antójate de algo rico!</p>';
        return;
    }

    container.innerHTML = filteredOrders.map(order => {
        let extraHtml = '';

        if (tabId === 'curso') {
            let fillWidth = '0%';
            let act1 = 'active', act2 = '', act3 = '', act4 = '';
            const st = order.status || 'Pendiente';

            if (st === 'En Horno') { fillWidth = '33%'; act2 = 'active'; }
            else if (st === 'En Camino') { fillWidth = '66%'; act2 = 'active'; act3 = 'active'; }
            else if (st === 'Entregado' || st.includes('Entregado')) { fillWidth = '100%'; act2 = 'active'; act3 = 'active'; act4 = 'active'; }

            extraHtml = `
                    <div class="progress-bar-container">
                        <div class="progress-line"></div>
                        <div class="progress-line-fill" style="width: ${fillWidth};"></div>
                        <div class="progress-step ${act1}">
                            <div class="step-circle">1</div>
                            <span class="step-label">Recibido</span>
                        </div>
                        <div class="progress-step ${act2}">
                            <div class="step-circle">2</div>
                            <span class="step-label">En Horno</span>
                        </div>
                        <div class="progress-step ${act3}">
                            <div class="step-circle">3</div>
                            <span class="step-label">En Camino</span>
                        </div>
                        <div class="progress-step ${act4}">
                            <div class="step-circle">4</div>
                            <span class="step-label">Entregado</span>
                        </div>
                    </div>`;
        } else if (tabId === 'eventos') {
            const deposit = Math.ceil(order.total / 2);
            const balance = order.total - deposit;
            extraHtml = `
                    <div style="margin-top: 12px; background: #fff5f8; padding: 12px; border-radius: 8px;">
                        <span class="order-badge-event">Anticipo 50% Cubierto: $${deposit.toLocaleString()}</span>
                        <p style="margin: 8px 0 0 0; color: #475569; font-size: 0.9rem;">
                            <strong>Saldo contra entrega:</strong> $${balance.toLocaleString()} COP
                        </p>
                    </div>`;
        }

        return `
                <div class="order-card">
                    <div class="order-card-header">
                        <div>
                            <h4 class="order-card-title">Pedido ${order.id}</h4>
                            <p class="order-card-date">${order.date}</p>
                        </div>
                        <strong style="color: var(--brand-pink); font-size: 1.1rem;">$${order.total.toLocaleString()}</strong>
                    </div>
                    <p style="margin:0; font-size: 0.9rem; color: #475569;">${order.products}</p>
                    ${extraHtml}
                </div>`;
    }).reverse().join('');
}

function decodeJwtResponse(token) {
    let base64Url = token.split('.')[1];
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

// ===== MODO COCINA / DESPACHO =====
function openKitchenModal() {
    document.getElementById('kitchen-modal').style.display = 'flex';
    switchKitchenTab('activos');
}

function closeKitchenModal() {
    document.getElementById('kitchen-modal').style.display = 'none';
}

function switchKitchenTab(tabId) {
    document.querySelectorAll('.kitchen-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.kitchen-tab-content').forEach(content => content.classList.remove('active'));

    document.getElementById(`k-tab-btn-${tabId}`).classList.add('active');
    document.getElementById(`k-tab-${tabId}`).classList.add('active');

    if (tabId === 'stock') {
        renderKitchenStock();
    } else if (tabId === 'clientes') {
        renderKitchenUsers();
    } else {
        renderKitchenOrders(tabId);
    }
}

function renderKitchenStock() {
    const container = document.getElementById('k-tab-stock');
    if (!container) return;

    container.innerHTML = products.map(p => {
        const isOut = stockConfig[p.id] === true;
        return `
                <div class="kitchen-stock-item">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <img src="${safeImg(p.img)}" alt="${p.name}" onerror="this.onerror=null; this.src='logo-pys.png';" style="width:40px; height:40px; border-radius:6px; object-fit:cover; ${isOut ? 'filter:grayscale(100%); opacity:0.5;' : ''}">
                        <div>
                            <strong style="display:block; font-size:1.1rem; margin-bottom:4px;">${p.name}</strong>
                            <span style="font-size:0.9rem; color:#64748b;">${isOut ? '🔴 Agotado' : '✅ Disponible'}</span>
                        </div>
                    </div>
                    <label class="stock-toggle-label">
                        <input type="checkbox" class="stock-toggle-input" ${!isOut ? 'checked' : ''} onchange="toggleStock(${p.id})">
                        <span class="stock-toggle-slider"></span>
                    </label>
                </div>`;
    }).join('');
}

function renderKitchenUsers() {
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

        let currentRoleVal = 'regular';
        let roleBadgeHtml = '<span class="k-role-badge k-role-regular">Regular</span>';

        if (isAdm) { currentRoleVal = 'admin'; roleBadgeHtml = '<span class="k-role-badge k-role-admin">🛡️ Administrador</span>'; }
        else if (isWork) { currentRoleVal = 'cocina'; roleBadgeHtml = '<span class="k-role-badge k-role-cocina">👨‍🍳 Cocina</span>'; }
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
                        <option value="regular" ${currentRoleVal === 'regular' ? 'selected' : ''}>Cliente Regular</option>
                        <option value="vip" ${currentRoleVal === 'vip' ? 'selected' : ''}>⭐ Cliente VIP</option>
                        <option value="cocina" ${currentRoleVal === 'cocina' ? 'selected' : ''}>👨‍🍳 Equipo de Cocina</option>
                        <option value="admin" ${currentRoleVal === 'admin' ? 'selected' : ''}>🛡️ Administrador</option>
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
}

function updateUserRole(email, role) {
    const targetEmail = (email || '').toLowerCase().trim();
    if (typeof SUPER_ADMINS !== 'undefined' && SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }
    const u = db_users.find(x => (x.email || '').toLowerCase().trim() === targetEmail);
    if (!u) return;

    u.vip = false;
    workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== targetEmail);
    adminEmails = adminEmails.filter(e => (e || '').toLowerCase().trim() !== targetEmail);

    if (role === 'vip') u.vip = true;
    if (role === 'cocina') workerEmails.push(email);
    if (role === 'admin') adminEmails.push(email);

    saveUsersDB();
    saveAdminEmails(); // Guarda workerEmails y adminEmails

    if (currentUser && (currentUser.email || '').toLowerCase().trim() === targetEmail) {
        currentUser.vip = u.vip;
        saveUser();
        updateUserUI();
    }

    renderKitchenUsers();
    showToast(`Rol de ${u.name} actualizado a ${role}`, "✅");
}

function updateUserPoints(email, change) {
    const u = db_users.find(x => x.email === email);
    if (!u) return;

    if (!u.points) u.points = 0;
    u.points += change;
    if (u.points < 0) u.points = 0;

    saveUsersDB();

    if (currentUser && currentUser.email === email) {
        currentUser.points = u.points;
        saveUser();
        updateUserUI(); // Actualiza el header del usuario local
    }

    renderKitchenUsers();
    showToast(`Puntos actualizados: ${u.points} pts`, "🎟️");
}

function renderKitchenOrders(tabId) {
    const container = document.getElementById(`k-tab-${tabId}`);
    container.innerHTML = '';

    if (typeof pedidosHistorial === 'undefined' || pedidosHistorial.length === 0) {
        container.innerHTML = '<h3 style="color:#94a3b8; width:100%; text-align:center;">No hay comandas registradas.</h3>';
        return;
    }

    let filtered = [];
    const todayStr = new Date().toLocaleDateString('es-CO');

    if (tabId === 'activos') {
        filtered = pedidosHistorial.filter(o => o.status !== 'Entregado' && o.status !== 'Cancelado');
    } else {
        filtered = pedidosHistorial.filter(o => o.status === 'Entregado' && new Date(o.timestamp).toLocaleDateString('es-CO') === todayStr);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<h3 style="color:#94a3b8; width:100%; text-align:center;">No hay comandas en esta sección.</h3>';
        return;
    }

    container.innerHTML = filtered.map(order => {
        const u = db_users.find(x => x.email === order.email);
        const isVip = u && u.vip;

        let eventHtml = '';
        if (order.type === 'evento') {
            const deposit = Math.ceil(order.total / 2);
            eventHtml = `
                    <div style="background: #fef2f2; color: #991b1b; padding: 8px; border-radius: 6px; margin-bottom: 8px; font-weight: bold;">
                        ⚠️ EVENTO AGENDADO<br>
                        <span style="font-size: 0.9rem; font-weight: normal;">Saldo Pdto: $${(order.total - deposit).toLocaleString()}</span>
                    </div>`;
        }

        // Phone for WhatsApp
        const cPhone = (u && u.phone) ? u.phone.replace(/\D/g, '') : '573229512693';

        let actionsHtml = '';
        if (tabId === 'activos') {
            actionsHtml = `
                    <div class="k-actions">
                        ${order.status === 'Pendiente' ? `<button class="k-btn k-btn-horno" onclick="updateKitchenOrderState('${order.id}', 'En Horno')">👨‍🍳 En Horno</button>` : ''}
                        ${(order.status === 'Pendiente' || order.status === 'En Horno') ? `<button class="k-btn k-btn-camino" onclick="updateKitchenOrderState('${order.id}', 'En Camino')">🛵 En Camino</button>` : ''}
                        <button class="k-btn k-btn-entregado" onclick="updateKitchenOrderState('${order.id}', 'Entregado')">✅ Entregado</button>
                        <a href="https://wa.me/${cPhone}?text=¡Hola!%20Te%20escribimos%20de%20Dulce%20Tentación.%20Tu%20pedido%20${order.id}%20tiene%20una%20novedad." target="_blank" class="k-btn k-btn-whatsapp">💬 WA</a>
                    </div>`;
        }

        return `
                <div class="kitchen-card">
                    <div class="kitchen-card-header">
                        <div>
                            <h3>${order.id}</h3>
                            <span style="color:#64748b; font-size:0.9rem;">${order.date.split(',')[1]}</span>
                        </div>
                        <strong style="color: #0f172a; font-size: 1.2rem;">$${order.total.toLocaleString()}</strong>
                    </div>
                    ${eventHtml}
                    <p><strong>Cliente:</strong> ${order.customer} ${isVip ? '<span class="k-vip-badge">⭐ VIP</span>' : ''}</p>
                    <p><strong>Dirección:</strong> ${order.address || 'Para recoger'}</p>
                    <div class="kitchen-products">
                        ${order.products.replace(/, /g, '<br>')}
                    </div>
                    <p style="margin-bottom: 12px; color: #64748b; font-weight: bold;">Estado actual: ${order.status}</p>
                    ${actionsHtml}
                </div>`;
    }).reverse().join('');
}

function updateKitchenOrderState(orderId, newState) {
    // Update global orders
    const p = pedidosHistorial.find(x => x.id === orderId);
    if (p) {
        p.status = newState;
        if (typeof savePedidosHistorial === 'function') savePedidosHistorial();
        if (typeof renderLiveOrders === 'function') renderLiveOrders();

        // Sync with user's specific history
        const u = db_users.find(x => x.email === p.email);
        if (u && u.history) {
            const uOrder = u.history.find(o => o.id === orderId);
            if (uOrder) {
                uOrder.status = newState;
                saveUsersDB();
                if (currentUser && currentUser.email === u.email) {
                    currentUser = u;
                    saveUser();
                    // Si el modal del cliente está abierto, refrescar
                    if (document.getElementById('modal-mis-pedidos').style.display === 'flex') {
                        const activeTab = document.querySelector('.order-tab-btn.active').id.replace('tab-btn-', '');
                        renderOrders(activeTab);
                    }
                }
            }
        }

        showToast(`Comanda ${orderId} movida a: ${newState}`, "👨‍🍳");
        const activeTab = document.querySelector('.kitchen-tab-btn.active').id.replace('k-tab-btn-', '');
        renderKitchenOrders(activeTab);
    }
}

function handleCredentialResponse(response) {
    const payload = decodeJwtResponse(response.credential);
    const email = (payload.email || '').toLowerCase().trim();
    const name = payload.name;
    const picture = payload.picture;

    const isSuper = (typeof SUPER_ADMINS !== 'undefined') ? SUPER_ADMINS.includes(email) : (email === 'pablojose182017@gmail.com' || email === 'dulcestentaciones2004@gmail.com');

    let user = db_users.find(u => (u.email || '').toLowerCase().trim() === email);
    if (user && user.blocked && !isSuper) {
        openAuthModal();
        switchAuthTab('login');
        return showAuthMessage('⛔ Tu cuenta ha sido suspendida por incumplimiento de políticas.', 'error');
    }

    if (!user) {
        user = {
            name,
            email,
            picture,
            points: 15,
            joinDate: new Date().toLocaleDateString('es-CO'),
            vip: false,
            role: isSuper ? 'admin' : 'cliente',
            isAdmin: isSuper,
            blocked: false
        };
        db_users.push(user);
    } else {
        user.name = name;
        user.picture = picture;
        if (isSuper) {
            user.role = 'admin';
            user.isAdmin = true;
            user.blocked = false;
        }
    }

    if (isSuper) {
        if (!adminEmails.includes(email)) adminEmails.push(email);
        workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== email);
        saveAdminEmails();
    }

    saveUsersDB();
    loginUserObj(user);
}

window.initGoogleSignIn = function() {
    if (window.googleGsiInitialized) return;

    if (window.google && window.google.accounts && window.google.accounts.id && typeof window.google.accounts.id.initialize === 'function') {
        try {
            window.google.accounts.id.initialize({
                client_id: "463408522513-9uor2ppoh7vvkcq0vfbtuu3f0jgpei29.apps.googleusercontent.com",
                callback: handleCredentialResponse,
                auto_select: false
            });
            window.googleGsiInitialized = true;

            const gsiDivs = document.querySelectorAll('.g_id_signin');
            gsiDivs.forEach(div => {
                try {
                    window.google.accounts.id.renderButton(div, {
                        type: "standard",
                        size: "large",
                        theme: "outline",
                        text: div.getAttribute('data-text') || "sign_in_with",
                        shape: "rectangular",
                        logo_alignment: "left"
                    });
                } catch (btnErr) {
                    console.warn('GSI renderButton Error:', btnErr);
                }
            });
        } catch (e) {
            console.warn('GSI initialize Error:', e);
        }
    } else {
        // Wait until Google Identity Services is fully loaded
        let attempts = 0;
        const checkTimer = setInterval(() => {
            attempts++;
            if (window.google && window.google.accounts && window.google.accounts.id && typeof window.google.accounts.id.initialize === 'function') {
                clearInterval(checkTimer);
                window.initGoogleSignIn();
            } else if (attempts >= 25) {
                clearInterval(checkTimer);
            }
        }, 150);
    }
};

function handleMobilePillClick() {
    if (currentUser) document.getElementById('mobileProfileModal').style.display = 'flex';
    else openAuthModal();
}
function closeMobileProfile() { document.getElementById('mobileProfileModal').style.display = 'none'; }
function handleMobileProfileBdrop(e) { if (e.target === document.getElementById('mobileProfileModal')) closeMobileProfile(); }

let db_users = [];
window.SUPER_ADMINS = window.SUPER_ADMINS || Object.freeze([
    'pablojose182017@gmail.com',
    'dulcestentaciones2004@gmail.com'
]);
var SUPER_ADMINS = window.SUPER_ADMINS;

const ADMIN_EMAILS = [
    ...SUPER_ADMINS,
    'pablojose182020@gmail.com'
];
let adminEmails = [...ADMIN_EMAILS];
let workerEmails = [];
let stockConfig = {};
window.addEventListener('DOMContentLoaded', () => {
    try { const db = localStorage.getItem('dt_users_db'); if (db) db_users = JSON.parse(db); } catch (e) { }
    try { const adms = localStorage.getItem('dt_admin_emails'); if (adms) { adminEmails = [...new Set([...JSON.parse(adms), ...ADMIN_EMAILS])]; } } catch (e) { }
    try { const wks = localStorage.getItem('dt_worker_emails'); if (wks) workerEmails = JSON.parse(wks); } catch (e) { }
    try { const stk = localStorage.getItem('dt_stock_config'); if (stk) stockConfig = JSON.parse(stk); } catch (e) { }

    // Garantizar Super Admins en adminEmails y db_users con contraseña fija Admin123*
    SUPER_ADMINS.forEach(saEmail => {
        const normSa = saEmail.toLowerCase().trim();
        if (!adminEmails.includes(normSa)) adminEmails.push(normSa);
        workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== normSa);
        const adminName = (normSa === 'pablojose182017@gmail.com') ? 'Pablo Carrascal' : 'Dulce Tentación';
        let saUser = db_users.find(u => (u.email || '').toLowerCase().trim() === normSa);
        if (saUser) {
            saUser.name = saUser.name || adminName;
            saUser.role = 'admin';
            saUser.isAdmin = true;
            saUser.blocked = false;
            if (!saUser.password) saUser.password = 'Admin123*';
            if (!saUser.points) saUser.points = 500;
        } else {
            db_users.push({
                name: adminName,
                email: normSa,
                password: 'Admin123*',
                role: 'admin',
                isAdmin: true,
                blocked: false,
                points: 500,
                picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=e11d48&color=fff&bold=true`
            });
        }
    });
    saveUsersDB();

    // 2. Función de migración / sincronización automática
    if (currentUser && currentUser.email) {
        const normEmail = currentUser.email.toLowerCase().trim();
        let existingUser = db_users.find(u => (u.email || '').toLowerCase().trim() === normEmail);
        if (!existingUser) {
            existingUser = {
                name: currentUser.name || normEmail.split('@')[0],
                email: normEmail,
                picture: currentUser.picture || '',
                points: currentUser.points || 15,
                joinDate: currentUser.joinDate || new Date().toLocaleDateString('es-CO'),
                vip: currentUser.vip || false,
                phone: currentUser.phone || ''
            };
            db_users.push(existingUser);
        }

        // Forzar rol de admin si es SUPER_ADMIN o está en la whitelist
        if (SUPER_ADMINS.includes(normEmail) || ADMIN_EMAILS.includes(normEmail)) {
            existingUser.role = 'admin';
            existingUser.isAdmin = true;
            existingUser.blocked = false;
            currentUser.role = 'admin';
            currentUser.isAdmin = true;
            currentUser.blocked = false;
            if (!adminEmails.includes(normEmail)) adminEmails.push(normEmail);
            workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== normEmail);
        }

        // Refrescar currentUser con datos de db_users por si los cambió un admin
        currentUser = { ...currentUser, ...existingUser };

        saveUsersDB();
        saveAdminEmails();
        saveUser();
    }
});
function saveAdminEmails() {
    ADMIN_EMAILS.forEach(email => {
        if (!adminEmails.includes(email)) adminEmails.push(email);
    });
    try { localStorage.setItem('dt_admin_emails', JSON.stringify(adminEmails)); } catch (e) { }
    try { localStorage.setItem('dt_worker_emails', JSON.stringify(workerEmails)); } catch (e) { }
}
function saveStockConfig() { try { localStorage.setItem('dt_stock_config', JSON.stringify(stockConfig)); } catch (e) { } }
function saveUsersDB() { try { localStorage.setItem('dt_users_db', JSON.stringify(db_users)); } catch (e) { } }

function loginUserObj(userObj) {
    if (userObj && userObj.email) {
        const uEmail = userObj.email.toLowerCase().trim();
        const isSuper = (typeof SUPER_ADMINS !== 'undefined' && SUPER_ADMINS.includes(uEmail));
        if (isSuper) {
            userObj.role = 'admin';
            userObj.rol = 'admin';
            userObj.isAdmin = true;
            userObj.blocked = false;
            userObj.vip = true;
            userObj.isVip = true;
            userObj.vipStatus = 'activo';
            if (typeof adminEmails !== 'undefined' && !adminEmails.includes(uEmail)) adminEmails.push(uEmail);
            if (typeof workerEmails !== 'undefined') workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== uEmail);
            saveAdminEmails();
        } else {
            // Cruzar con dt_registered_users o dt_users_db
            const regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
            const dbUsers = (typeof db_users !== 'undefined' && Array.isArray(db_users)) ? db_users : JSON.parse(localStorage.getItem('dt_users_db') || '[]');
            const reg = regUsers.find(u => u && u.email && u.email.toLowerCase().trim() === uEmail) ||
                        dbUsers.find(u => u && u.email && u.email.toLowerCase().trim() === uEmail);
            if (reg) {
                userObj.role = reg.role || reg.rol || userObj.role || 'cliente';
                userObj.rol = userObj.role;
                userObj.isAdmin = (userObj.role === 'admin');
                userObj.isVip = !!(reg.isVip || reg.vip || (userObj.role === 'vip'));
                userObj.vip = userObj.isVip;
                userObj.vipStatus = reg.vipStatus || (userObj.isVip ? 'activo' : (userObj.vipStatus || 'inactivo'));
                userObj.points = (reg.points !== undefined && reg.points !== null) ? reg.points : (userObj.points || 0);
                if (reg.blocked !== undefined) userObj.blocked = !!reg.blocked;
            }
        }
    }
    currentUser = userObj;
    saveUser(); syncUserUI(); closeAuthModal();
    try { localStorage.setItem('dt_logged_user', JSON.stringify(currentUser)); } catch (e) { }
    if (typeof window.checkRemoteUserSession === 'function') {
        window.checkRemoteUserSession();
    }
    const orderName = document.getElementById('orderName');
    if (orderName && !orderName.value) orderName.value = currentUser.name;
    const firstName = (currentUser.name || '').split(' ')[0];
    showToast(`¡Hola, ${firstName}! Qué delicia tenerte de vuelta en Dulce Tentación ✨`, '🎉', 4000);
}



function adminRegisterUser() {
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

function adminDeleteUser(email) {
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

function adminToggleVIP(email) {
    const targetEmail = (email || '').toLowerCase().trim();
    if (SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }
    const u = db_users.find(x => (x.email || '').toLowerCase().trim() === targetEmail);
    if (!u) return;
    u.vip = !u.vip;
    saveUsersDB(); renderAdminUsers();
    if (currentUser && currentUser.email === email) { currentUser.vip = u.vip; saveUser(); syncUserUI(); updateCart(); }
    showToast(u.vip ? 'Membresía VIP activada' : 'Membresía VIP retirada', '👑');
}

function adminToggleBlock(email) {
    const targetEmail = (email || '').toLowerCase().trim();
    if (SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }
    const u = db_users.find(x => (x.email || '').toLowerCase().trim() === targetEmail);
    if (!u) return;
    u.blocked = !u.blocked;
    saveUsersDB(); renderAdminUsers();
    if (currentUser && currentUser.email === email && u.blocked) { logoutUser(new Event('click')); }
    showToast(u.blocked ? 'Usuario bloqueado' : 'Usuario desbloqueado', '⛔');
}

function saveConfigFromAdmin() {
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

// ===== PEDIDOS: ALERTAS SONORAS Y WEB AUDIO API =====
let sharedAudioCtx = null;
function getSharedAudioContext() {
    try {
        if (!sharedAudioCtx) {
            const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
            if (AudioCtxClass) {
                sharedAudioCtx = new AudioCtxClass();
            }
        }
        if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
            sharedAudioCtx.resume().catch(() => {});
        }
        return sharedAudioCtx;
    } catch (e) {
        return null;
    }
}

// Desbloqueo preventivo en la primera interacción del usuario
const unlockAudioOnGesture = () => {
    try {
        const ctx = getSharedAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
    } catch (e) {}
    document.removeEventListener('click', unlockAudioOnGesture);
    document.removeEventListener('touchstart', unlockAudioOnGesture);
    document.removeEventListener('keydown', unlockAudioOnGesture);
};
document.addEventListener('click', unlockAudioOnGesture, { passive: true });
document.addEventListener('touchstart', unlockAudioOnGesture, { passive: true });
document.addEventListener('keydown', unlockAudioOnGesture, { passive: true });

window.playOrderAlert = function() {
    if (typeof orderSoundEnabled !== 'undefined' && !orderSoundEnabled) return;
    try {
        const ctx = getSharedAudioContext() || new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;
        // Acorde melódico tipo chime (C5 = 523.25Hz, E5 = 659.25Hz, G5 = 783.99Hz)
        const notes = [
            { freq: 523.25, start: now, dur: 0.7 },
            { freq: 659.25, start: now + 0.12, dur: 0.7 },
            { freq: 783.99, start: now + 0.24, dur: 1.1 }
        ];

        notes.forEach(({ freq, start, dur }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(0.35, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + dur);
        });
    } catch (e) {
        console.warn('Audio chime no pudo reproducirse:', e);
    }
};
window.playChime = window.playOrderAlert;
window.sonarCampanaNuevoPedido = window.playOrderAlert;

function toggleOrderSound() {
    const tog = document.getElementById('soundToggle');
    if (tog) {
        orderSoundEnabled = tog.checked;
        try { localStorage.setItem('dt_sound_enabled', orderSoundEnabled.toString()); } catch (e) { }
        if (orderSoundEnabled && typeof window.playOrderAlert === 'function') {
            window.playOrderAlert();
        }
    }
}

// ===== REGISTRO CENTRALIZADO DE NOTIFICACIONES =====
window.recordNewOrderNotification = function(newOrder, options = { playSound: true }) {
    if (!newOrder) return;
    try {
        const orderId = newOrder.id || ('DT-' + Date.now().toString().slice(-4));
        const customerName = newOrder.customerName || newOrder.customer || (typeof currentUser !== 'undefined' && currentUser ? currentUser.name : '') || 'Cliente';
        const rawTotal = (typeof newOrder.totalFormatted !== 'undefined') 
            ? newOrder.totalFormatted 
            : (typeof newOrder.total === 'number' ? newOrder.total.toLocaleString('es-CO') : (newOrder.total || '0'));

        const notif = {
            id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            orderId: orderId,
            title: `Nuevo Pedido #${orderId}`,
            message: `${customerName} - $${rawTotal} COP`,
            time: 'Hace un momento',
            read: false,
            timestamp: Date.now()
        };

        // Guardar en dt_notifications
        let notifications = [];
        try {
            notifications = JSON.parse(localStorage.getItem('dt_notifications') || '[]');
        } catch (e) {
            notifications = [];
        }

        const alreadyRecorded = notifications.some(n => n.orderId === orderId || (n.title && n.title.includes(orderId)));
        if (!alreadyRecorded) {
            notifications.unshift(notif);
            if (notifications.length > 50) notifications = notifications.slice(0, 50);
            localStorage.setItem('dt_notifications', JSON.stringify(notifications));
        }

        // Sincronizar dt_live_alerts por compatibilidad
        try {
            let alerts = JSON.parse(localStorage.getItem('dt_live_alerts') || '[]');
            if (!alerts.some(a => a.title && a.title.includes(orderId))) {
                alerts.unshift({
                    type: 'nuevo_pedido',
                    title: `🛍️ Nuevo Pedido #${orderId}`,
                    user: customerName,
                    email: `${customerName} ($${rawTotal} COP)`,
                    date: new Date().toLocaleString('es-CO')
                });
                if (alerts.length > 50) alerts = alerts.slice(0, 50);
                localStorage.setItem('dt_live_alerts', JSON.stringify(alerts));
            }
        } catch (e) {}

        // Actualizar la interfaz de la campanita
        if (typeof window.renderAdminNotifList === 'function') {
            window.renderAdminNotifList();
        }

        // Reproducir sonido si está habilitado
        if (options && options.playSound !== false) {
            if (typeof window.playOrderAlert === 'function') {
                window.playOrderAlert();
            }
        }
    } catch (e) {
        console.warn('Error al registrar notificación de pedido:', e);
    }
};

function checkNewOrders() {
    try {
        const p = localStorage.getItem('dt_pedidos_historial');
        if (p) {
            const parsed = JSON.parse(p);
            if (parsed.length > lastOrderCount) {
                const newOrders = parsed.slice(lastOrderCount);
                pedidosHistorial = parsed;
                lastOrderCount = parsed.length;

                // Registrar notificación para cada pedido nuevo entrante
                newOrders.forEach(ord => {
                    if (typeof window.recordNewOrderNotification === 'function') {
                        window.recordNewOrderNotification(ord, { playSound: false });
                    }
                });

                if (orderSoundEnabled && typeof window.playOrderAlert === 'function') {
                    window.playOrderAlert();
                }

                const lastO = newOrders[newOrders.length - 1];
                showOrderToast(lastO.customerName || lastO.customer || 'Cliente');

                const adminSect = document.getElementById('admin-dashboard');
                if (adminSect && adminSect.classList.contains('active')) {
                    if (typeof renderLiveOrders === 'function') renderLiveOrders();
                    if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
                }
                if (window.renderAdminNotifList) window.renderAdminNotifList();
            } else if (parsed.length !== pedidosHistorial.length) {
                // Resincronizar en caso de borrado desde otro tab
                pedidosHistorial = parsed;
                lastOrderCount = parsed.length;
            }
        }
    } catch (e) { }
}

function showOrderToast(name) {
    const t = document.getElementById('orderToast');
    if (!t) return;
    document.getElementById('orderToastBody').innerText = 'Cliente: ' + name;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 6000);
}

function goToOrders() {
    document.getElementById('orderToast')?.classList.remove('show');
    showSection('admin-dashboard');
    renderLiveOrders();
    setTimeout(() => {
        const el = document.getElementById('live-orders-grid');
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    }, 100);
}

let orderDateFilterValue = '';
function filterOrdersByDate() {
    orderDateFilterValue = document.getElementById('orderDateFilter').value;
    renderLiveOrders();
}
function setOrderDateToToday() {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const today = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
    document.getElementById('orderDateFilter').value = today;
    orderDateFilterValue = today;
    renderLiveOrders();
}
function clearOrderDateFilter() {
    document.getElementById('orderDateFilter').value = '';
    orderDateFilterValue = '';
    renderLiveOrders();
}

function renderAdminDashboard() {
    document.getElementById('adminMinPurchase').value = adminConfig.minPurchase;
    document.getElementById('adminMaxDiscount').value = adminConfig.maxDiscount;
    document.getElementById('adminVipEnabled').checked = adminConfig.vipEnabled;

    let totalNet = 0, totalDisc = 0;
    const totalOrders = pedidosHistorial.length;
    let cTotals = {};

    // Métricas de ventas de hoy y mejor día
    let todayVentas = 0;
    let daySalesMap = {};
    const todayStr = new Date().toLocaleDateString('es-CO');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    pedidosHistorial.forEach(p => {
        if (p.status !== 'Cancelado') {
            totalNet += p.total;
            totalDisc += p.discount;
            if (p.email !== 'N/A') { cTotals[p.email] = (cTotals[p.email] || 0) + p.total; }

            const pDateObj = p.timestamp ? new Date(p.timestamp) : new Date(); // Fallback si no tiene
            const pDateStr = pDateObj.toLocaleDateString('es-CO');

            if (pDateStr === todayStr) {
                todayVentas += p.total;
            }
            if (pDateObj.getMonth() === currentMonth && pDateObj.getFullYear() === currentYear) {
                daySalesMap[pDateStr] = (daySalesMap[pDateStr] || 0) + p.total;
            }
        }
    });

    let bestDay = null;
    let bestDayTotal = 0;
    for (let day in daySalesMap) {
        if (daySalesMap[day] > bestDayTotal) {
            bestDayTotal = daySalesMap[day];
            bestDay = day;
        }
    }
    const bestDayText = bestDay ? `${bestDay} ($${bestDayTotal.toLocaleString()})` : 'Aún no hay ventas este mes';

    let topClients = Object.keys(cTotals).map(k => ({ email: k, total: cTotals[k] })).sort((a, b) => b.total - a.total);
    let estrella = topClients.length > 0 ? topClients[0] : null;
    let estrellaName = estrella ? (db_users.find(u => u.email === estrella.email)?.name || estrella.email) : 'Nadie aún';

    document.getElementById('admin-dashboard-cards').innerHTML = `
                <div style="background:#fdf4ff; padding:15px; border-radius:10px; border:1px solid #fbcfe8;">
                    <div style="font-size:0.85rem; color:#831843;">💵 Ventas de Hoy</div>
                    <div style="font-size:1.3rem; font-weight:bold; color:#be185d;">$${todayVentas.toLocaleString()}</div>
                </div>
                <div style="background:#f0fdfa; padding:15px; border-radius:10px; border:1px solid #ccfbf1;">
                    <div style="font-size:0.85rem; color:#134e4a;">🏆 Día más Rentable del Mes</div>
                    <div style="font-size:0.9rem; font-weight:bold; color:#0f766e;">${bestDayText}</div>
                </div>
                <div style="background:#f0fdf4; padding:15px; border-radius:10px; border:1px solid #bbf7d0;">
                    <div style="font-size:0.85rem; color:#166534;">💵 Ventas Netas (Histórico)</div>
                    <div style="font-size:1.3rem; font-weight:bold; color:#15803d;">$${totalNet.toLocaleString()}</div>
                </div>
                <div style="background:#fefce8; padding:15px; border-radius:10px; border:1px solid #fef08a;">
                    <div style="font-size:0.85rem; color:#854d0e;">🏷️ Total Ahorrado (Dcto)</div>
                    <div style="font-size:1.3rem; font-weight:bold; color:#a16207;">$${totalDisc.toLocaleString()}</div>
                </div>
                <div style="background:#eff6ff; padding:15px; border-radius:10px; border:1px solid #bfdbfe;">
                    <div style="font-size:0.85rem; color:#1e40af;">📦 Pedidos Recibidos</div>
                    <div style="font-size:1.3rem; font-weight:bold; color:#1d4ed8;">${totalOrders}</div>
                </div>
                <div style="background:#fff1f2; padding:15px; border-radius:10px; border:1px solid #fecdd3;">
                    <div style="font-size:0.85rem; color:#be123c;">👑 Cliente Estrella</div>
                    <div style="font-size:1.1rem; font-weight:bold; color:#e11d48; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${estrellaName}</div>
                </div>
            `;

    let top5Html = '';
    topClients.slice(0, 5).forEach((c, idx) => {
        const uName = db_users.find(u => u.email === c.email)?.name || c.email;
        top5Html += `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">
                    <span><strong>#${idx + 1}</strong> ${uName}</span>
                    <strong style="color:var(--brand-pink);">$${c.total.toLocaleString()}</strong>
                </div>`;
    });
    document.getElementById('admin-top-clients').innerHTML = top5Html || '<p style="color:#888;">No hay compras registradas.</p>';
}

function renderLiveOrders() {
    const grid = document.getElementById('live-orders-grid');
    if (!grid) return;

    let list = [...pedidosHistorial];

    // Ordenar por timestamp más reciente
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (!list.some(p => p.timestamp)) {
        list = list.slice().reverse();
    }

    // Filtrar por fecha exacta
    if (orderDateFilterValue) {
        const [y, m, d] = orderDateFilterValue.split('-');
        list = list.filter(p => {
            if (p.timestamp) {
                const pd = new Date(p.timestamp);
                return pd.getFullYear() == y && (pd.getMonth() + 1) == m && pd.getDate() == d;
            }
            return true; // Mostrar pedidos sin timestamp
        });
    }

    if (list.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--text-soft);">No hay pedidos para mostrar.</div>`;
        return;
    }

    grid.innerHTML = list.map(p => {
        const isEvent = p.type === 'evento';
        const tagColor = isEvent ? '#fef3c7' : '#e0f2fe';
        const tagTextColor = isEvent ? '#d97706' : '#0369a1';
        const tagIcon = isEvent ? '🎉 Evento Programado' : '⚡ Entrega Inmediata';
        const depositHtml = isEvent ? `<div style="margin-top:8px; font-size:0.85rem; color:#b45309; font-weight:bold;">Anticipo (50%): $${Math.ceil(p.total / 2).toLocaleString()} COP</div>` : '';

        return `
                <div style="background:#fff; border-radius:12px; padding:15px; border:1px solid #eee; box-shadow:0 2px 8px rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:10px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <span style="background:${tagColor}; color:${tagTextColor}; padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold;">${tagIcon}</span>
                            <div style="margin-top:8px; font-size:0.8rem; color:#666;">ID: ${p.id} • ${p.date}</div>
                        </div>
                        <div style="font-size:1.1rem; font-weight:bold; color:var(--brand-pink);">$${p.total.toLocaleString()}</div>
                    </div>
                    
                    <div style="font-size:0.95rem; line-height:1.4;">
                        <strong>👤 ${p.customer}</strong><br>
                        📞 <a href="https://wa.me/57${p.phone.replace(/[^0-9]/g, '')}" target="_blank" style="color:#25D366; text-decoration:none;">${p.phone}</a><br>
                        📍 ${p.address}
                    </div>
                    
                    <div style="background:#f8fafc; padding:10px; border-radius:8px; font-size:0.85rem; color:#334155; border:1px dashed #cbd5e1;">
                        <strong>📝 Detalle:</strong><br>${p.products}
                        ${depositHtml}
                    </div>

                    <div style="display:flex; gap:8px; margin-top:auto; padding-top:10px; border-top:1px solid #eee;">
                        <button onclick="markOrderState('${p.id}', 'Pendiente')" style="flex:1; padding:10px 5px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:0.8rem; border:2px solid ${p.status === 'Pendiente' ? '#eab308' : '#fef08a'}; background:${p.status === 'Pendiente' ? '#fef08a' : '#fff'}; color:#a16207; transition:all 0.2s;">🟡 Pendiente</button>
                        
                        <button onclick="markOrderState('${p.id}', 'En preparación')" style="flex:1; padding:10px 5px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:0.8rem; border:2px solid ${p.status === 'En preparación' ? '#3b82f6' : '#bfdbfe'}; background:${p.status === 'En preparación' ? '#bfdbfe' : '#fff'}; color:#1d4ed8; transition:all 0.2s;">🔵 Preparando</button>
                        
                        <button onclick="markOrderState('${p.id}', 'Entregado')" style="flex:1; padding:10px 5px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:0.8rem; border:2px solid ${p.status === 'Entregado' ? '#22c55e' : '#bbf7d0'}; background:${p.status === 'Entregado' ? '#bbf7d0' : '#fff'}; color:#15803d; transition:all 0.2s;">🟢 Entregado</button>
                    </div>
                </div>`;
    }).join('');
}

let currentStockFilter = 'todos';
function setStockFilter(cat, el) {
    currentStockFilter = cat;
    document.querySelectorAll('.stock-filter-chip').forEach(btn => btn.classList.remove('active'));
    if (el) el.classList.add('active');
    renderStockAdmin();
}

function renderStockAdmin() {
    const grid = document.getElementById('admin-stock-grid');
    if (!grid) return;

    const filteredProducts = currentStockFilter === 'todos'
        ? products
        : products.filter(p => p.cat === currentStockFilter);

    grid.innerHTML = filteredProducts.map(p => {
        const isOut = stockConfig[p.id] === true;
        const currentPoints = p.points !== undefined ? p.points : (p.puntos !== undefined ? p.puntos : 0);
        return `
                <div class="admin-stock-card" data-id="${p.id}" style="flex: 1 1 calc(33% - 10px); min-width: 140px; background:#fff; border:1px solid ${isOut ? '#fecdd3' : '#bbf7d0'}; border-radius:10px; padding:10px; display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px;">
                    <img src="${safeImg(p.img || p.image)}" onerror="this.onerror=null; this.src='logo-pys.png';" style="width:50px; height:50px; object-fit:cover; border-radius:8px; opacity:${isOut ? '0.5' : '1'}; filter:${isOut ? 'grayscale(100%)' : 'none'};">
                    <strong style="font-size:0.85rem; line-height:1.2;">${p.name}</strong>
                    <button onclick="toggleStock(${p.id})" style="width:100%; padding:8px; border-radius:6px; font-weight:bold; font-size:0.8rem; cursor:pointer; border:none; color:#fff; background:${isOut ? '#e11d48' : '#10b981'}; transition:all 0.2s;">
                        ${isOut ? '❌ Agotado' : '✅ Disponible'}
                    </button>
                    <div class="prod-stock-points-container" style="width:100%; display:flex; align-items:center; justify-content:space-between; background:#fff7ed; padding:4px 8px; border-radius:6px; border:1px solid #ffedd5; box-sizing:border-box;">
                        <span style="font-size:0.75rem; font-weight:700; color:#c2410c;">⭐ Puntos:</span>
                        <input type="number" min="0" value="${currentPoints}" onchange="updateProductPoints(${p.id}, this.value)" style="width:55px; padding:3px 6px; border:1px solid #fed7aa; border-radius:4px; text-align:center; font-size:0.8rem; font-weight:700; color:#ea580c; background:#fff; outline:none;" title="Puntos que otorga al comprar">
                    </div>
                    <button type="button" class="btn-delete-stock-prod" onclick="deleteProduct(${p.id})" style="width:100%; padding:6px 8px; border-radius:6px; font-weight:600; font-size:0.75rem; cursor:pointer; border:1px solid #fecaca; color:#ef4444; background:#fef2f2; transition:all 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
                        🗑️ Eliminar
                    </button>
                </div>`;
    }).join('');
}

function toggleStock(id) {
    stockConfig[id] = !stockConfig[id];
    saveStockConfig();
    renderStockAdmin();
    if (typeof renderKitchenStock === 'function') renderKitchenStock();
    renderProducts();
    renderFeatured();
    showToast(stockConfig[id] ? 'Producto marcado como Agotado' : 'Producto disponible nuevamente', '✅');
}

function deleteProduct(pId) {
    if (typeof window.eliminarProducto === 'function') {
        window.eliminarProducto(pId);
        return;
    }
    if (!confirm("¿Seguro que deseas eliminar este producto del catálogo?")) return;

    let localCatalog = {};
    try { localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado')) || {}; } catch(e){}
    localCatalog[pId] = localCatalog[pId] || {};
    localCatalog[pId].eliminado = true;
    localStorage.setItem('dt_catalogo_personalizado', JSON.stringify(localCatalog));

    const idx = products.findIndex(x => x.id === pId);
    if (idx > -1) products.splice(idx, 1);

    if (typeof db !== 'undefined') {
        db.collection('config').doc('catalogo_personalizado').set({
            [pId]: { eliminado: true }
        }, { merge: true }).catch(e => console.error("Error eliminando producto:", e));
    }

    const modalEditar = document.getElementById('modal-editar-producto');
    if (modalEditar) modalEditar.style.display = 'none';

    if (typeof showToast === 'function') showToast('Producto eliminado', '✅');
    if (typeof renderStockAdmin === 'function') renderStockAdmin();
    if (typeof renderProducts === 'function') renderProducts();
    if (typeof renderFeatured === 'function') renderFeatured();
}
window.deleteProduct = deleteProduct;

function updateProductPoints(pId, pointsVal) {
    const pts = Math.max(0, parseInt(pointsVal) || 0);
    const p = products.find(x => x.id === pId);
    if (p) {
        p.points = pts;
        p.puntos = pts;
    }
    let localCatalog = {};
    try { localCatalog = JSON.parse(localStorage.getItem('dt_catalogo_personalizado')) || {}; } catch(e){}
    localCatalog[pId] = localCatalog[pId] || {};
    localCatalog[pId].points = pts;
    localCatalog[pId].puntos = pts;
    localStorage.setItem('dt_catalogo_personalizado', JSON.stringify(localCatalog));

    if (typeof db !== 'undefined') {
        db.collection('config').doc('catalogo_personalizado').set({
            [pId]: { points: pts, puntos: pts }
        }, { merge: true }).catch(e => console.error("Error actualizando puntos de producto:", e));
    }

    if (typeof showToast === 'function') showToast(`Puntos asignados: ${pts} ⭐`, '✅');
}
window.updateProductPoints = updateProductPoints;

// ===== CARGA Y EDICIÓN DE FOTOS DE PRODUCTOS (FILEREADER / BASE64) =====
function handleProductPhotoUpload(input) {
    if (input && input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = reader.result;
            const previewImg = document.querySelector('#editProductImgPreview, .product-img-preview');
            if (previewImg) {
                previewImg.src = dataUrl;
                previewImg.style.display = 'block';
            }
            const imgInput = document.querySelector('#edit-prod-img, #editProductImg, .product-img-input');
            if (imgInput) {
                imgInput.value = dataUrl;
                imgInput.setAttribute('data-file-name', file.name);
            }
            window.tempProductImg = dataUrl;
            if (typeof showToast === 'function') showToast("Foto cargada con éxito", "📸");
        };
        reader.readAsDataURL(file);
    }
}
window.handleProductPhotoUpload = handleProductPhotoUpload;

function saveProduct(pId) {
    if (typeof window.guardarEdicionProducto === 'function') {
        window.guardarEdicionProducto(pId);
        return;
    }
}
window.saveProduct = saveProduct;
window.updateProduct = saveProduct;

// --- GESTIÓN DE RECOMPENSAS CLUB VIP & PUNTOS ---
window.tempAdminRewards = null;

function getAdminPointsModal() {
    let modal = document.getElementById('adminPointsModal');
    if (!modal) modal = document.getElementById('modal-admin-points');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'adminPointsModal';
        modal.className = 'auth-modal';
        modal.style.display = 'none';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '999999';
        modal.onclick = function(e) {
            if (e.target === modal) window.closeAdminPointsModal();
        };
        document.body.appendChild(modal);
    }
    return modal;
}

window.openAdminPointsModal = function(e) {
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
const openAdminPointsModal = window.openAdminPointsModal;

window.closeAdminPointsModal = function(e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const m1 = document.getElementById('adminPointsModal');
    if (m1) {
        m1.style.display = 'none';
        m1.classList.remove('active');
        m1.style.visibility = 'hidden';
    }
    const m2 = document.getElementById('modal-admin-points');
    if (m2) {
        m2.style.display = 'none';
        m2.classList.remove('active');
        m2.style.visibility = 'hidden';
    }
};
const closeAdminPointsModal = window.closeAdminPointsModal;

function createRewardCardHtml(r = {}) {
    const nameVal = r.name !== undefined && r.name !== null ? String(r.name).replace(/"/g, '&quot;') : '';
    const pointsVal = (r.cost !== undefined && r.cost !== null && r.cost !== '') ? r.cost : (r.points !== undefined && r.points !== null ? r.points : '');
    const imgVal = r.img ? String(r.img).replace(/"/g, '&quot;') : 'logo-pys.png';
    const previewSrc = safeImg(imgVal);

    return `
    <div class="admin-reward-item" style="display:flex; flex-direction:column; gap:10px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:14px; padding:14px; margin-bottom:12px; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:border-color 0.2s;">
        <div style="display:flex; align-items:center; gap:12px;">
            <div style="position:relative; width:56px; height:56px; flex:0 0 56px;">
                <img class="reward-preview-img" src="${previewSrc}" alt="Foto premio" onerror="this.onerror=null; this.src='logo-pys.png';" style="width:56px; height:56px; object-fit:cover; border-radius:10px; border:1px solid #cbd5e1; background:#fff; display:block;">
            </div>
            <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:6px;">
                <div>
                    <label style="font-size:11px; font-weight:700; color:#475569; display:block; margin-bottom:2px;">Nombre de la Recompensa</label>
                    <input type="text" class="reward-name-input admin-reward-name-input" value="${nameVal}" placeholder="Nombre de la recompensa (ej: Combo Café + Pan)" style="width:100%; padding:8px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; font-weight:600; color:#1e293b; background:#fff; outline:none; box-sizing:border-box;" onfocus="this.style.borderColor='#e91e63'" onblur="this.style.borderColor='#cbd5e1'">
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <label style="font-size:11px; font-weight:700; color:#e11d48; white-space:nowrap;">🎟️ Puntos:</label>
                    <input type="number" min="1" step="50" class="reward-points-input admin-reward-cost-input" value="${pointsVal}" placeholder="Puntos necesarios" style="width:130px; padding:6px 10px; border:1px solid #fecdd3; border-radius:8px; font-size:13px; font-weight:700; color:#e11d48; background:#fff1f2; outline:none; box-sizing:border-box;" onfocus="this.style.borderColor='#e11d48'" onblur="this.style.borderColor='#fecdd3'">
                </div>
            </div>
            <button type="button" onclick="this.closest('.admin-reward-item').remove()" title="Eliminar Recompensa" style="background:#fee2e2; color:#ef4444; border:1px solid #fecaca; border-radius:10px; padding:10px 12px; cursor:pointer; font-weight:700; font-size:13px; flex:0 0 auto; display:flex; align-items:center; gap:4px; transition:all 0.2s;" onmouseover="this.style.background='#fca5a5'" onmouseout="this.style.background='#fee2e2'">
                🗑️ <span style="font-size:11px;">Eliminar</span>
            </button>
        </div>
        <div style="display:flex; align-items:center; gap:8px; background:#fff; padding:6px 10px; border-radius:8px; border:1px solid #e2e8f0;">
            <span style="font-size:11px; font-weight:600; color:#64748b; white-space:nowrap;">🖼️ Foto / URL:</span>
            <input type="text" class="reward-img-input admin-reward-img-input" value="${imgVal}" placeholder="URL o sube foto" oninput="const p = this.closest('.admin-reward-item').querySelector('.reward-preview-img'); if(p) p.src = safeImg(this.value);" style="flex:1; padding:6px 8px; border:1px solid #cbd5e1; border-radius:6px; font-size:11px; color:#475569; background:#fff; outline:none; box-sizing:border-box;">
            <label style="background:linear-gradient(135deg, #3b82f6, #2563eb); color:#fff; border:none; padding:6px 12px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; flex:0 0 auto; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 4px rgba(37,99,235,0.2);" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                📁 Subir Foto
                <input type="file" accept="image/*" style="display:none;" onchange="window.handleRewardFileUpload(this)">
            </label>
        </div>
    </div>`;
}

window.handleRewardFileUpload = function(fileInput) {
    if (!fileInput.files || !fileInput.files[0]) return;
    const file = fileInput.files[0];
    const reader = new FileReader();
    const itemCard = fileInput.closest('.admin-reward-item');
    reader.onload = function(e) {
        const base64Data = e.target.result;
        if (itemCard) {
            const preview = itemCard.querySelector('.reward-preview-img');
            if (preview) preview.src = base64Data;
            const textInp = itemCard.querySelector('.reward-img-input, .admin-reward-img-input');
            if (textInp) textInp.value = file.name;
            itemCard.setAttribute('data-uploaded-img', base64Data);
        }
    };
    reader.readAsDataURL(file);
};

function renderAdminPointsModalContent() {
    const modal = getAdminPointsModal();
    if (!modal) return;

    const rewards = (window.tempAdminRewards && Array.isArray(window.tempAdminRewards)) 
        ? window.tempAdminRewards 
        : (window.pointRewards || pointRewards || defaultPointRewards);

    const rewardsRows = rewards.length === 0 
        ? `<div class="empty-rewards-msg" style="text-align:center; padding:28px 16px; color:#64748b; font-size:0.95rem; background:#f8fafc; border-radius:14px; border:2px dashed #cbd5e1;">No hay recompensas configuradas aún. Pulsa el botón verde abajo para agregar la primera.</div>`
        : rewards.map((r, idx) => createRewardCardHtml(r)).join('');

    modal.innerHTML = `
        <div class="auth-content" style="max-width:560px; width:94%; max-height:88vh; display:flex; flex-direction:column; padding:24px; background:#fff; border-radius:20px; position:relative; box-shadow:0 20px 40px rgba(0,0,0,0.25); overflow:hidden;">
            <button type="button" class="auth-close-btn" onclick="window.closeAdminPointsModal()" style="position:absolute; top:14px; right:14px; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:50%; width:34px; height:34px; font-size:1.1rem; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; z-index:10; transition:all 0.2s;" onmouseover="this.style.background='#fee2e2'; this.style.color='#ef4444';" onmouseout="this.style.background='#f1f5f9'; this.style.color='#64748b';">✕</button>

            <div style="text-align:center; margin-bottom:14px; flex:0 0 auto;">
                <h3 style="margin:0; font-size:20px; font-weight:800; background:linear-gradient(135deg, #e91e63, #ff5722); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">⭐ Configurar Puntos & Club VIP</h3>
                <p style="margin:4px 0 0 0; color:#64748b; font-size:12px;">Edita, agrega o elimina las recompensas que los clientes canjean con sus puntos acumulados.</p>
            </div>

            <div style="background:#fff1f2; border:1px solid #ffe4e6; border-radius:10px; padding:10px 12px; margin-bottom:14px; font-size:12px; color:#9f1239; flex:0 0 auto; display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px;">💡</span>
                <span>Los cambios guardados aquí se reflejarán de inmediato en la sección pública del Club Puntos.</span>
            </div>

            <div id="admin-rewards-list-container" style="flex:1; overflow-y:auto; padding-right:4px; margin-bottom:14px;">
                ${rewardsRows}
            </div>

            <div style="display:flex; flex-direction:column; gap:10px; flex:0 0 auto; border-top:1px solid #f1f5f9; padding-top:14px;">
                <button type="button" onclick="window.addAdminRewardItem()" style="width:100%; padding:11px; background:#f0fdf4; color:#16a34a; border:1.5px dashed #86efac; border-radius:10px; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s;" onmouseover="this.style.background='#dcfce7'" onmouseout="this.style.background='#f0fdf4'">
                    ➕ Agregar Nueva Recompensa
                </button>
                <div style="display:flex; gap:10px;">
                    <button type="button" onclick="window.closeAdminPointsModal()" style="flex:1; padding:11px; background:#f1f5f9; color:#475569; border:none; border-radius:10px; font-weight:600; font-size:13px; cursor:pointer;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">Cancelar</button>
                    <button type="button" onclick="window.saveAdminPointsConfig()" style="flex:2; padding:11px; background:linear-gradient(135deg, #e91e63, #ff5722); color:#fff; border:none; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; box-shadow:0 4px 12px rgba(233,30,99,0.3); transition:all 0.2s;" onmouseover="this.style.opacity='0.95'" onmouseout="this.style.opacity='1'">💾 Guardar Cambios</button>
                </div>
            </div>
        </div>
    `;
}
window.renderAdminPointsModalContent = renderAdminPointsModalContent;
window.renderAdminRewardsTable = renderAdminPointsModalContent;
window.renderAdminPointsRewards = renderAdminPointsModalContent;

window.addAdminRewardItem = function() {
    const container = document.getElementById('admin-rewards-list-container');
    if (!container) return;

    const emptyMsg = container.querySelector('.empty-rewards-msg');
    if (emptyMsg) emptyMsg.remove();

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = createRewardCardHtml({
        name: '',
        cost: '',
        img: 'logo-pys.png'
    });

    const newCard = tempDiv.firstElementChild;
    container.appendChild(newCard);
    container.scrollTop = container.scrollHeight;

    const nameInput = newCard.querySelector('.reward-name-input');
    if (nameInput) nameInput.focus();
};
const addAdminRewardItem = window.addAdminRewardItem;

window.removeAdminRewardItem = function(buttonOrIdx) {
    if (typeof buttonOrIdx === 'number') {
        const container = document.getElementById('admin-rewards-list-container');
        if (container) {
            const items = container.querySelectorAll('.admin-reward-item');
            if (items[buttonOrIdx]) items[buttonOrIdx].remove();
        }
    } else if (buttonOrIdx && buttonOrIdx.closest) {
        buttonOrIdx.closest('.admin-reward-item')?.remove();
    }
};
const removeAdminRewardItem = window.removeAdminRewardItem;

window.syncAdminRewardsFromDOM = function() {
    const container = document.getElementById('admin-rewards-list-container');
    if (!container) return [];
    const cards = container.querySelectorAll('.admin-reward-item');
    const list = [];
    cards.forEach((card, idx) => {
        const nameInp = card.querySelector('.reward-name-input, .admin-reward-name-input');
        const costInp = card.querySelector('.reward-points-input, .admin-reward-cost-input');
        const imgInp = card.querySelector('.reward-img-input, .admin-reward-img-input');
        const uploadedImg = card.getAttribute('data-uploaded-img');

        const name = (nameInp ? nameInp.value : '').trim();
        const costVal = costInp ? costInp.value.trim() : '';
        let img = (imgInp ? imgInp.value.trim() : '');
        if (uploadedImg) img = uploadedImg;
        else if (!img) img = 'logo-pys.png';

        list.push({
            id: 'r_' + (idx + 1) + '_' + Date.now(),
            name: name,
            cost: costVal === '' ? '' : parseInt(costVal, 10),
            img: img
        });
    });
    window.tempAdminRewards = list;
    return list;
};

window.saveAdminPointsConfig = function() {
    const container = document.getElementById('admin-rewards-list-container');
    if (!container) return;

    const cards = container.querySelectorAll('.admin-reward-item');
    const rewards = [];
    let hasError = false;
    let errorMsg = '';

    cards.forEach(card => {
        const nameInp = card.querySelector('.reward-name-input, .admin-reward-name-input');
        const costInp = card.querySelector('.reward-points-input, .admin-reward-cost-input');
        const imgInp = card.querySelector('.reward-img-input, .admin-reward-img-input');
        const uploadedImg = card.getAttribute('data-uploaded-img');

        const name = (nameInp ? nameInp.value : '').trim();
        const costStr = costInp ? costInp.value.trim() : '';
        const cost = parseInt(costStr, 10);
        let img = (imgInp ? imgInp.value.trim() : '');
        if (uploadedImg) img = uploadedImg;
        else if (!img) img = 'logo-pys.png';

        // Validar si campos están vacíos
        if (!name) {
            hasError = true;
            errorMsg = 'Debes ingresar el nombre de cada recompensa.';
            if (nameInp) nameInp.style.borderColor = '#ef4444';
            return;
        }

        if (costStr === '' || isNaN(cost) || cost <= 0) {
            hasError = true;
            errorMsg = 'Debes ingresar una cantidad de puntos válida (mayor a 0) en cada recompensa.';
            if (costInp) costInp.style.borderColor = '#ef4444';
            return;
        }

        rewards.push({
            id: 'r_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
            name: name,
            cost: cost,
            img: img
        });
    });

    if (hasError) {
        if (typeof showToast === 'function') showToast(errorMsg, '⚠️');
        else alert(errorMsg);
        return;
    }

    if (rewards.length === 0 && cards.length > 0) {
        alert('No se encontraron recompensas para guardar.');
        return;
    }

    const finalList = rewards.length > 0 ? rewards : defaultPointRewards;
    pointRewards = finalList;
    window.pointRewards = finalList;
    localStorage.setItem('dt_point_rewards', JSON.stringify(finalList));

    if (typeof db !== 'undefined') {
        db.collection('config').doc('point_rewards').set({
            rewards: finalList,
            updatedAt: new Date().toISOString()
        }, { merge: true }).then(() => {
            console.log("Recompensas sincronizadas en Firestore");
        }).catch(e => console.error("Error guardando point_rewards:", e));
    }

    if (typeof renderRewards === 'function') renderRewards();

    window.closeAdminPointsModal();

    if (typeof showToast === 'function') showToast("¡Recompensas actualizadas y guardadas con éxito!", "🎉");
};
window.saveAdminPointsRewards = window.saveAdminPointsConfig;
const saveAdminPointsConfig = window.saveAdminPointsConfig;

function markOrderState(id, state) {
    const p = pedidosHistorial.find(x => x.id === id);
    if (p) {
        p.status = state; savePedidosHistorial(); renderLiveOrders(); renderAdminDashboard();
        showToast(`Pedido marcado como ${state}`, state === 'Entregado' ? '✅' : 'ℹ️');
    }
}

let currentRoleFilter = 'Todos';
function setRoleFilter(role, el) {
    currentRoleFilter = role;
    document.querySelectorAll('.user-filters-tabs .cat-chip').forEach(btn => btn.classList.remove('active'));
    if (el) el.classList.add('active');
    renderAdminUsers();
}

function renderAdminUsers() {
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

function filterAdminUsers() {
    renderAdminUsers();
}

function confirmRoleChange(email) {
    const targetEmail = (email || '').toLowerCase().trim();
    if (SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }

    const selectEl = document.getElementById(`roleSel_${(email || '').replace(/[@.]/g, '_')}`);
    if (!selectEl) return;
    const newRole = selectEl.value;

    if (ADMIN_EMAILS.includes(email) && newRole !== 'admin') {
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

    // Apply new role
    if (newRole === 'admin') {
        adminEmails.push(email);
        u.role = 'admin';
        u.isAdmin = true;
    } else if (newRole === 'trabajador') {
        workerEmails.push(email);
        u.role = 'trabajador';
    } else if (newRole === 'vip') {
        let baseTime = Date.now();
        if (u.vip && u.vipExpiresAt && new Date(u.vipExpiresAt) > new Date()) {
            baseTime = new Date(u.vipExpiresAt).getTime();
        }
        u.vipExpiresAt = new Date(baseTime + (30 * 24 * 60 * 60 * 1000)).toISOString();
        u.vip = true;
        u.role = 'cliente'; // As requested by user, reset role to 'cliente' (base behavior for VIPs typically)
    }

    saveAdminEmails();
    saveUsersDB();
    renderAdminUsers();
    if (currentUser && currentUser.email === email) { syncUserUI(); }

    if (newRole === 'vip') {
        alert(`Membresía VIP actualizada para ${email}. Vigente hasta el ${new Date(u.vipExpiresAt).toLocaleDateString('es-CO')}.`);
    } else {
        showToast('Rol actualizado a: ' + newRole, '✅');
    }
}

function adminToggleAdmin(email) {
    const targetEmail = (email || '').toLowerCase().trim();
    if (SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }
    const isAdm = adminEmails.includes(email);
    if (isAdm) {
        adminEmails = adminEmails.filter(e => e !== email);
        showToast('Rol de Administrador retirado', 'ℹ️');
    } else {
        adminEmails.push(email);
        showToast('Nuevo Administrador asignado', '👑');
    }
    saveAdminEmails();
    renderAdminUsers();
    if (currentUser && currentUser.email === email) { syncUserUI(); }
}
function adminToggleWorker(email) {
    const targetEmail = (email || '').toLowerCase().trim();
    if (SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar ni remover a un Dueño/Super Administrador.");
        return;
    }
    const isWork = workerEmails.includes(email);
    if (isWork) {
        workerEmails = workerEmails.filter(e => e !== email);
        showToast('Rol de Trabajador retirado', 'ℹ️');
    } else {
        workerEmails.push(email);
        showToast('Nuevo Trabajador asignado', '👨‍🍳');
    }
    saveAdminEmails();
    renderAdminUsers();
    if (currentUser && currentUser.email === email) { syncUserUI(); }
}

let userToChangePassword = null;
function adminChangePassword(email) {
    const user = db_users.find(u => u.email === email);
    if (!user) return;
    userToChangePassword = user;
    document.getElementById('adminPasswordModalUser').innerText = `Usuario: ${user.name} (${email})`;
    document.getElementById('adminNewPasswordInput').value = '';
    document.getElementById('adminPasswordModal').style.display = 'flex';
}

function adminRegisterUser() {
    const name = document.getElementById('adminNewName')?.value.trim();
    const email = document.getElementById('adminNewEmail')?.value.trim().toLowerCase();
    const pass = document.getElementById('adminNewPassword')?.value.trim();
    const role = document.getElementById('adminNewRole')?.value;

    if (!name || !email || !pass) {
        return showToast('Por favor completa nombre, correo y contraseña.', '❌');
    }

    const existing = db_users.find(u => u.email === email);
    if (existing) {
        return showToast('El correo ya está registrado.', '❌');
    }

    const isVip = (role === 'vip');
    const newUser = {
        name: name,
        nombre: name,
        email: email,
        password: pass,
        phone: '',
        address: '',
        role: role || 'cliente',
        rol: role || 'cliente',
        isAdmin: (role === 'admin'),
        isVip: isVip,
        vip: isVip,
        vipStatus: isVip ? 'activo' : 'inactivo',
        points: 15,
        history: [],
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d81b60&color=fff&bold=true`,
        blocked: false
    };

    db_users.push(newUser);
    saveUsersDB();

    try {
        let regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
        if (!Array.isArray(regUsers)) regUsers = [];
        const rIdx = regUsers.findIndex(u => u && u.email && u.email.toLowerCase().trim() === email);
        if (rIdx !== -1) regUsers[rIdx] = { ...regUsers[rIdx], ...newUser };
        else regUsers.push({ ...newUser });
        localStorage.setItem('dt_registered_users', JSON.stringify(regUsers));
    } catch(e) {}

    if (typeof db !== 'undefined' && db && typeof db.collection === 'function') {
        db.collection('usuarios').doc(email).set({
            nombre: name,
            name: name,
            email: email,
            password: pass,
            rol: role || 'cliente',
            role: role || 'cliente',
            estado: 'activo',
            blocked: false,
            points: 15,
            puntos: 15
        }, { merge: true }).catch(() => {});
    }

    if (role === 'trabajador' && !workerEmails.includes(email)) {
        workerEmails.push(email);
        saveAdminEmails();
    } else if (role === 'admin' && !adminEmails.includes(email)) {
        adminEmails.push(email);
        saveAdminEmails();
    }

    renderAdminUsers();
    showToast(`Usuario ${name} registrado como ${role}`, '✅');

    if (document.getElementById('adminNewName')) document.getElementById('adminNewName').value = '';
    if (document.getElementById('adminNewEmail')) document.getElementById('adminNewEmail').value = '';
    if (document.getElementById('adminNewPassword')) document.getElementById('adminNewPassword').value = '';
    if (document.getElementById('adminNewRole')) document.getElementById('adminNewRole').value = 'cliente';
}

// ===== FUNCIONES PARA EDITAR NOMBRE Y CORREO DESDE EL PANEL =====
window.abrirModalEditarUsuarioAdmin = function(email) {
    const targetEmail = (email || '').toLowerCase().trim();
    if (typeof window.SUPER_ADMINS !== 'undefined' && window.SUPER_ADMINS.includes(targetEmail)) {
        alert("Acción denegada: No se puede modificar a un Dueño / Super Administrador.");
        return;
    }

    let user = null;
    if (typeof db_users !== 'undefined' && Array.isArray(db_users)) {
        user = db_users.find(u => u && u.email && u.email.toLowerCase().trim() === targetEmail);
    }
    if (!user) {
        try {
            const regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
            user = regUsers.find(u => u && u.email && u.email.toLowerCase().trim() === targetEmail);
        } catch(e) {}
    }

    if (!user) {
        if (typeof showToast === 'function') showToast("No se encontró el usuario.", '❌');
        else alert("No se encontró el usuario.");
        return;
    }

    const origInput = document.getElementById('adminEditUserOriginalEmail');
    const nameInput = document.getElementById('adminEditUserName');
    const emailInput = document.getElementById('adminEditUserEmail');

    if (origInput) origInput.value = targetEmail;
    if (nameInput) nameInput.value = user.name || user.nombre || '';
    if (emailInput) emailInput.value = user.email || targetEmail;

    const modal = document.getElementById('adminEditUserModal');
    if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
    }
};

window.cerrarModalEdicionUsuarioAdmin = function() {
    const modal = document.getElementById('adminEditUserModal');
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
    }
};

window.guardarEdicionUsuarioAdmin = function() {
    const origEmail = (document.getElementById('adminEditUserOriginalEmail')?.value || '').toLowerCase().trim();
    const newName = (document.getElementById('adminEditUserName')?.value || '').trim();
    const newEmail = (document.getElementById('adminEditUserEmail')?.value || '').toLowerCase().trim();

    if (!newName) {
        if (typeof showToast === 'function') showToast("El nombre no puede estar vacío.", '❌');
        else alert("El nombre no puede estar vacío.");
        return;
    }

    if (!newEmail || !newEmail.includes('@') || !newEmail.includes('.')) {
        if (typeof showToast === 'function') showToast("Por favor ingresa un correo electrónico válido.", '❌');
        else alert("Por favor ingresa un correo electrónico válido.");
        return;
    }

    if (typeof window.SUPER_ADMINS !== 'undefined' && window.SUPER_ADMINS.includes(origEmail)) {
        alert("Acción denegada: No se puede modificar el correo del Dueño/Super Administrador.");
        return;
    }

    // Validar si el nuevo correo ya pertenece a otro usuario
    if (newEmail !== origEmail) {
        let occupied = false;
        if (typeof db_users !== 'undefined' && Array.isArray(db_users)) {
            occupied = db_users.some(u => u && u.email && u.email.toLowerCase().trim() === newEmail && u.email.toLowerCase().trim() !== origEmail);
        }
        if (!occupied) {
            try {
                const regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
                occupied = regUsers.some(u => u && u.email && u.email.toLowerCase().trim() === newEmail && u.email.toLowerCase().trim() !== origEmail);
            } catch(e) {}
        }
        if (occupied) {
            if (typeof showToast === 'function') showToast("El nuevo correo ya está registrado por otro usuario.", '❌');
            else alert("El nuevo correo ya está registrado por otro usuario.");
            return;
        }
    }

    // 1. Actualizar db_users y dt_users_db
    if (typeof db_users !== 'undefined' && Array.isArray(db_users)) {
        const uidx = db_users.findIndex(u => u && u.email && u.email.toLowerCase().trim() === origEmail);
        if (uidx !== -1) {
            db_users[uidx].name = newName;
            db_users[uidx].nombre = newName;
            db_users[uidx].email = newEmail;
        }
        if (typeof saveUsersDB === 'function') saveUsersDB();
    }

    // 2. Actualizar dt_registered_users
    try {
        let regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
        if (Array.isArray(regUsers)) {
            const rIdx = regUsers.findIndex(u => u && u.email && u.email.toLowerCase().trim() === origEmail);
            if (rIdx !== -1) {
                regUsers[rIdx].name = newName;
                regUsers[rIdx].nombre = newName;
                regUsers[rIdx].email = newEmail;
            } else if (typeof db_users !== 'undefined' && Array.isArray(db_users)) {
                const matched = db_users.find(u => u && u.email && u.email.toLowerCase().trim() === newEmail);
                if (matched) regUsers.push({ ...matched });
            }
            localStorage.setItem('dt_registered_users', JSON.stringify(regUsers));
        }
    } catch(e) {}

    // 3. Actualizar listas de roles si el correo cambió
    if (newEmail !== origEmail) {
        if (typeof adminEmails !== 'undefined' && Array.isArray(adminEmails)) {
            const aIdx = adminEmails.findIndex(e => (e || '').toLowerCase().trim() === origEmail);
            if (aIdx !== -1) adminEmails[aIdx] = newEmail;
            if (typeof saveAdminEmails === 'function') saveAdminEmails();
        }
        if (typeof workerEmails !== 'undefined' && Array.isArray(workerEmails)) {
            const wIdx = workerEmails.findIndex(e => (e || '').toLowerCase().trim() === origEmail);
            if (wIdx !== -1) {
                workerEmails[wIdx] = newEmail;
                try { localStorage.setItem('dt_worker_emails', JSON.stringify(workerEmails)); } catch(e){}
            }
        }
    }

    // 4. Si el usuario editado es la sesión activa
    if (typeof currentUser !== 'undefined' && currentUser && (currentUser.email || '').toLowerCase().trim() === origEmail) {
        currentUser.name = newName;
        currentUser.nombre = newName;
        currentUser.email = newEmail;
        if (typeof saveUser === 'function') saveUser();
        try { localStorage.setItem('dt_logged_user', JSON.stringify(currentUser)); } catch(e){}
        if (typeof syncUserUI === 'function') syncUserUI();
    }

    // 5. Sincronizar en Firestore
    if (typeof db !== 'undefined' && db && typeof db.collection === 'function') {
        db.collection('usuarios').doc(newEmail).set({
            nombre: newName,
            name: newName,
            email: newEmail
        }, { merge: true }).catch(err => console.warn("Aviso Firestore al guardar edición:", err));

        if (newEmail !== origEmail) {
            db.collection('usuarios').doc(origEmail).delete().catch(() => {});
        }
    }

    // 6. Cerrar modal y renderizar vistas
    window.cerrarModalEdicionUsuarioAdmin();
    if (typeof renderAdminUsers === 'function') renderAdminUsers();
    if (typeof renderKitchenUsers === 'function') renderKitchenUsers();
    if (typeof showToast === 'function') showToast(`Datos de ${newName} actualizados exitosamente`, '✅');
};

function confirmAdminPasswordChange() {
    if (!userToChangePassword) return;
    const newPassword = document.getElementById('adminNewPasswordInput').value.trim();

    if (!newPassword) {
        return showToast('Por favor escribe una contraseña válida', '❌');
    }

    userToChangePassword.password = newPassword;
    localStorage.setItem('dt_users_db', JSON.stringify(db_users));

    document.getElementById('adminPasswordModal').style.display = 'none';
    alert("✅ Contraseña actualizada exitosamente. El usuario ya puede iniciar sesión con su nueva clave.");
    userToChangePassword = null;
}

function logoutUser(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
        localStorage.removeItem('dt_user');
        localStorage.removeItem('dt_logged_user');
    } catch(err) {}
    currentUser = null; 
    saveUser(); 

    // Ocultar inmediatamente el panel administrativo y todas las secciones administrativas
    const adminDash = document.getElementById('admin-dashboard');
    if (adminDash) { 
        adminDash.style.display = 'none'; 
        adminDash.classList.remove('active'); 
    }
    const kitchenModal = document.getElementById('kitchenModal');
    if (kitchenModal) kitchenModal.style.display = 'none';
    const adminNotifDropdown = document.getElementById('adminNotifDropdown');
    if (adminNotifDropdown) adminNotifDropdown.style.display = 'none';
    const deskBtn = document.getElementById('desk-admin-btn');
    const mobBtn = document.getElementById('mob-admin-btn');
    if (deskBtn) deskBtn.style.display = 'none';
    // Ocultar explícitamente el badge / botón VIP
    const vipBadge = document.getElementById('navVipBadge') || document.getElementById('vip-header-badge') || document.querySelector('.btn-vip-badge');
    if (vipBadge) vipBadge.style.display = 'none';

    // Redirigir a la vista de catálogo/inicio (#inicio o #productos)
    if (typeof showSection === 'function') {
        showSection('inicio', document.querySelector('.nav-link'));
    }

    // Cerrar menús de perfil
    document.getElementById('user-dropdown-menu')?.classList.remove('active');
    document.getElementById('mobileProfileModal')?.style.setProperty('display', 'none');

    syncUserUI();
    showToast("Sesión cerrada.", 'ℹ️');
}

function syncUserUI() {
    // 1. Sincronización automática de sesión con dt_registered_users y dt_users_db
    const storedUserRaw = localStorage.getItem('dt_user');
    if (storedUserRaw) {
        try {
            const parsedUser = JSON.parse(storedUserRaw);
            if (parsedUser && parsedUser.email) {
                const uEmail = (parsedUser.email || '').toLowerCase().trim();
                const isSuper = (typeof window.SUPER_ADMINS !== 'undefined')
                    ? window.SUPER_ADMINS.includes(uEmail)
                    : (uEmail === 'pablojose182017@gmail.com' || uEmail === 'dulcestentaciones2004@gmail.com');

                const regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
                const dbUsers = (typeof db_users !== 'undefined' && Array.isArray(db_users)) ? db_users : JSON.parse(localStorage.getItem('dt_users_db') || '[]');
                const registeredUser = regUsers.find(u => u && u.email && u.email.toLowerCase().trim() === uEmail) ||
                                       dbUsers.find(u => u && u.email && u.email.toLowerCase().trim() === uEmail);

                if (isSuper) {
                    parsedUser.role = 'admin';
                    parsedUser.rol = 'admin';
                    parsedUser.isAdmin = true;
                    parsedUser.blocked = false;
                    parsedUser.vip = true;
                    parsedUser.isVip = true;
                    parsedUser.vipStatus = 'activo';
                } else if (registeredUser) {
                    parsedUser.role = registeredUser.role || registeredUser.rol || parsedUser.role || 'cliente';
                    parsedUser.rol = parsedUser.role;
                    parsedUser.isAdmin = (parsedUser.role === 'admin');
                    parsedUser.isVip = !!(registeredUser.isVip || registeredUser.vip || (parsedUser.role === 'vip'));
                    parsedUser.vip = parsedUser.isVip;
                    parsedUser.vipStatus = registeredUser.vipStatus || (parsedUser.isVip ? 'activo' : (parsedUser.vipStatus || 'inactivo'));
                    parsedUser.points = (registeredUser.points !== undefined && registeredUser.points !== null) ? registeredUser.points : (parsedUser.points || 0);
                    if (registeredUser.blocked !== undefined) parsedUser.blocked = !!registeredUser.blocked;
                }

                currentUser = parsedUser;
                localStorage.setItem('dt_user', JSON.stringify(currentUser));

                if (typeof adminEmails !== 'undefined' && Array.isArray(adminEmails)) {
                    if (parsedUser.role === 'admin' && !adminEmails.includes(parsedUser.email)) adminEmails.push(parsedUser.email);
                    else if (parsedUser.role !== 'admin' && !isSuper) adminEmails = adminEmails.filter(e => (e || '').toLowerCase().trim() !== uEmail);
                }
                if (typeof workerEmails !== 'undefined' && Array.isArray(workerEmails)) {
                    if (parsedUser.role === 'trabajador' && !workerEmails.includes(parsedUser.email)) workerEmails.push(parsedUser.email);
                    else if (parsedUser.role !== 'trabajador') workerEmails = workerEmails.filter(e => (e || '').toLowerCase().trim() !== uEmail);
                }
            }
        } catch (e) {
            console.warn("Error sincronizando sesión activa:", e);
        }
    }

    const loginBtn = document.getElementById('btn-google-login');
    const pill = document.getElementById('user-pill-container');
    const mobileGoogleBtn = document.getElementById('mobile-google-btn');
    const mobilePill = document.getElementById('mobile-user-pill');
    const hIncentive = document.getElementById('hero-login-incentive');
    const cIncentive = document.getElementById('cartLoginIncentive');

    if (currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';

        const isVip = !!(currentUser.vip || currentUser.isVip || currentUser.role === 'vip' || currentUser.vipStatus === 'activo');
        const vipLabel = isVip ? ' (VIP)' : '';
        const vipColor = isVip ? '#d97706' : '';

        // Control de visibilidad y acción del botón / badge VIP en la barra
        const vipBadge = document.getElementById('navVipBadge') || document.getElementById('vip-header-badge') || document.querySelector('.btn-vip-badge');
        if (vipBadge) {
            if (isVip) {
                vipBadge.style.display = 'inline-flex';
                vipBadge.onclick = (e) => {
                    if (e && e.preventDefault) e.preventDefault();
                    if (typeof window.openVipModal === 'function') window.openVipModal(e);
                    else if (typeof window.openVipTermsModal === 'function') window.openVipTermsModal(e);
                    else if (typeof window.openPointsModal === 'function') window.openPointsModal();
                    else if (typeof showSection === 'function') showSection('vip');
                };
            } else {
                vipBadge.style.display = 'none';
            }
        }

        if (pill) {
            pill.style.display = 'flex';
            document.getElementById('user-avatar').src = currentUser.picture;
            const deskWrap = document.getElementById('header-avatar-wrap');
            const deskCrown = document.getElementById('desk-vip-crown');
            if (deskWrap && deskCrown) {
                if (isVip) {
                    deskWrap.classList.add('avatar-vip-container');
                    deskCrown.style.display = 'inline-block';
                } else {
                    deskWrap.classList.remove('avatar-vip-container');
                    deskCrown.style.display = 'none';
                }
            }

            const firstName = (currentUser.name || 'Usuario').split(' ')[0];
            const uName = document.getElementById('user-name');
            uName.innerText = `Hola, ${firstName}`;
            uName.style.color = vipColor;
            uName.style.fontWeight = isVip ? '700' : '';

            document.getElementById('dropdown-avatar').src = currentUser.picture;
            const dName = document.getElementById('dropdown-name');
            dName.innerText = currentUser.name;
            dName.style.color = vipColor;
            document.getElementById('dropdown-email').innerText = currentUser.email || currentUser.phone || '';
            if (document.getElementById('dropdown-points-val')) document.getElementById('dropdown-points-val').innerText = currentUser.points || 0;

            const deskTicketVal = document.getElementById('desk-ticket-val');
            const deskTicketBadge = document.getElementById('desk-ticket-badge');
            if (deskTicketVal && deskTicketBadge) {
                deskTicketVal.innerText = currentUser.points || 0;
                deskTicketBadge.style.display = 'flex';
            }
        }
        if (mobileGoogleBtn) mobileGoogleBtn.style.display = 'none';
        if (mobilePill) {
            mobilePill.style.display = 'flex';
            document.getElementById('mobile-user-avatar').src = currentUser.picture;
            const mobWrap = document.getElementById('mobile-avatar-wrap');
            const mobCrown = document.getElementById('mob-vip-crown');
            if (mobWrap && mobCrown) {
                if (isVip) {
                    mobWrap.classList.add('avatar-vip-container');
                    mobCrown.style.display = 'inline-block';
                } else {
                    mobWrap.classList.remove('avatar-vip-container');
                    mobCrown.style.display = 'none';
                }
            }

            const mpAv = document.getElementById('mp-avatar'); if (mpAv) mpAv.src = currentUser.picture;
            const mpNm = document.getElementById('mp-name');
            if (mpNm) {
                mpNm.innerText = currentUser.name;
                mpNm.style.color = vipColor;
            }

            const mpEm = document.getElementById('mp-email'); if (mpEm) mpEm.innerText = currentUser.email || currentUser.phone || '';
            const mpPt = document.getElementById('mp-points-val'); if (mpPt) mpPt.innerText = currentUser.points || 0;

            const mobTicketVal = document.getElementById('mob-ticket-val');
            const mobTicketBadge = document.getElementById('mob-ticket-badge');
            if (mobTicketVal && mobTicketBadge) {
                mobTicketVal.innerText = currentUser.points || 0;
                mobTicketBadge.style.display = 'flex';
            }
        }

        const vipHtml = isVip
            ? `<div class="vip-card-golden"><strong>👑 Membresía VIP Mensual Activa</strong> • 5% Dcto Preferencial</div>`
            : `<button class="vip-upgrade-btn" onclick="window.openVipTermsModal && window.openVipTermsModal(event)">✨ Pasar a VIP Oro</button>`;

        const dArea = document.getElementById('vip-dropdown-area-desk');
        if (dArea) dArea.innerHTML = vipHtml;
        const mArea = document.getElementById('vip-dropdown-area-mob');
        if (mArea) mArea.innerHTML = vipHtml;
        const on = document.getElementById('orderName'); if (on && !on.value) on.value = currentUser.name;
        if (hIncentive) hIncentive.style.display = 'none';
        if (cIncentive) cIncentive.style.display = 'none';

        const normEmail = (currentUser.email || '').toLowerCase().trim();
        const isSuper = (typeof window.SUPER_ADMINS !== 'undefined') 
            ? window.SUPER_ADMINS.includes(normEmail) 
            : (normEmail === 'pablojose182017@gmail.com' || normEmail === 'dulcestentaciones2004@gmail.com');
        const isAdmin = isSuper || (currentUser.role === 'admin') || (currentUser.rol === 'admin') || (currentUser.isAdmin === true) || ((typeof adminEmails !== 'undefined') && adminEmails.includes(currentUser.email));
        const isWorker = !isSuper && !isAdmin && ((currentUser.role === 'trabajador') || (currentUser.rol === 'trabajador') || ((typeof workerEmails !== 'undefined') && workerEmails.includes(currentUser.email)));
        const deskBtn = document.getElementById('desk-admin-btn');
        const mobBtn = document.getElementById('mob-admin-btn');

        if (deskBtn) {
            deskBtn.style.display = (isAdmin || isWorker) ? 'flex' : 'none';
            deskBtn.innerText = isAdmin ? '⚙️ Panel Administrador' : '⚙️ Panel Operativo';
            deskBtn.setAttribute('onclick', "showSection('admin-dashboard'); renderAdminUsers(); renderAdminDashboard(); renderLiveOrders(); renderStockAdmin();");
        }
        if (mobBtn) {
            mobBtn.style.display = (isAdmin || isWorker) ? 'flex' : 'none';
            mobBtn.innerText = isAdmin ? '⚙️ Panel Administrador' : '⚙️ Panel Operativo';
            mobBtn.setAttribute('onclick', "closeMobileProfile(); showSection('admin-dashboard'); renderAdminUsers(); renderAdminDashboard(); renderLiveOrders(); renderStockAdmin();");
        }

        const adminDash = document.getElementById('admin-dashboard');
        if (!isAdmin && !isWorker) {
            if (adminDash) {
                adminDash.style.display = 'none';
                adminDash.classList.remove('active');
            }
            if (deskBtn) deskBtn.style.display = 'none';
            if (mobBtn) mobBtn.style.display = 'none';
            if (adminDash && adminDash.classList.contains('active')) {
                if (typeof showSection === 'function') showSection('inicio');
            }
        }

        const adminOnlyDiv = document.getElementById('admin-only-sections');
        const adminTitle = document.getElementById('admin-title-panel');
        if (adminOnlyDiv) adminOnlyDiv.style.display = isAdmin ? 'block' : 'none';
        if (adminTitle) adminTitle.innerText = isAdmin ? '📊 Panel Administrativo & Financiero' : '👨‍🍳 Panel Operativo Diario';

        const pts = currentUser.points || 0;
        const goal = 500;
        const pct = Math.min((pts / goal) * 100, 100);
        const faltan = goal - pts;
        let msg = `Te faltan ${faltan} pts para un premio`;
        if (faltan <= 0) msg = `¡Felicidades! Tienes puntos para un premio 🎁`;

        const dBar = document.querySelector('#user-dropdown-menu .points-bar');
        const dMsg = document.querySelector('#user-dropdown-menu .dropdown-points-box small');
        if (dBar) dBar.style.width = `${pct}%`;
        if (dMsg) dMsg.innerText = msg;

        const mBar = document.querySelector('#mobileProfileModal .points-bar');
        const mMsg = document.querySelector('#mobileProfileModal .dropdown-points-box small');
        if (mBar) mBar.style.width = `${pct}%`;
        if (mMsg) mMsg.innerText = msg;
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (pill) pill.style.display = 'none';
        if (mobileGoogleBtn) mobileGoogleBtn.style.display = 'flex';
        if (mobilePill) mobilePill.style.display = 'none';
        if (hIncentive) hIncentive.style.display = 'flex';
        if (cIncentive) cIncentive.style.display = 'flex';

        const deskBtn = document.getElementById('desk-admin-btn');
        const mobBtn = document.getElementById('mob-admin-btn');
        if (deskBtn) deskBtn.style.display = 'none';
        if (mobBtn) mobBtn.style.display = 'none';

        const adminDash = document.getElementById('admin-dashboard');
        if (adminDash) {
            adminDash.style.display = 'none';
            adminDash.classList.remove('active');
        }
        const kitchenModal = document.getElementById('kitchenModal');
        if (kitchenModal) kitchenModal.style.display = 'none';
        const adminNotifDropdown = document.getElementById('adminNotifDropdown');
        if (adminNotifDropdown) adminNotifDropdown.style.display = 'none';

        // Ocultar explícitamente el badge / botón VIP si no hay sesión
        const vipBadge = document.getElementById('navVipBadge') || document.getElementById('vip-header-badge') || document.querySelector('.btn-vip-badge');
        if (vipBadge) vipBadge.style.display = 'none';
    }
    if (typeof renderRewards === 'function') renderRewards();
    if (window.renderAdminNotifList) window.renderAdminNotifList();
}

window.checkRemoteUserSession = function() {
    if (!currentUser || !currentUser.email) return;
    const uEmail = currentUser.email.toLowerCase().trim();
    if (window.db && typeof window.db.collection === 'function') {
        window.db.collection('usuarios').doc(currentUser.email).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data) {
                    let changed = false;
                    const newRole = data.role || data.rol || currentUser.role || 'cliente';
                    const newVip = !!(data.isVip || data.vip || (newRole === 'vip'));
                    const newVipStatus = data.vipStatus || (newVip ? 'activo' : 'inactivo');
                    const newPoints = (data.points !== undefined && data.points !== null) ? data.points : currentUser.points;

                    if (currentUser.role !== newRole || currentUser.isVip !== newVip || currentUser.points !== newPoints || currentUser.vipStatus !== newVipStatus) {
                        currentUser.role = newRole;
                        currentUser.rol = newRole;
                        currentUser.isAdmin = (newRole === 'admin');
                        currentUser.isVip = newVip;
                        currentUser.vip = newVip;
                        currentUser.vipStatus = newVipStatus;
                        currentUser.points = newPoints;
                        localStorage.setItem('dt_user', JSON.stringify(currentUser));
                        changed = true;
                    }

                    // Sincronizar también dt_registered_users
                    let regUsers = JSON.parse(localStorage.getItem('dt_registered_users') || '[]');
                    if (!Array.isArray(regUsers)) regUsers = [];
                    let rIdx = regUsers.findIndex(u => u && u.email && u.email.toLowerCase().trim() === uEmail);
                    if (rIdx !== -1) {
                        regUsers[rIdx] = { ...regUsers[rIdx], ...data, role: newRole, isVip: newVip, vip: newVip, vipStatus: newVipStatus, points: newPoints };
                    } else {
                        regUsers.push({ email: currentUser.email, ...data, role: newRole, isVip: newVip, vip: newVip, vipStatus: newVipStatus, points: newPoints });
                    }
                    localStorage.setItem('dt_registered_users', JSON.stringify(regUsers));

                    if (changed && typeof syncUserUI === 'function') {
                        syncUserUI();
                    }
                }
            }
        }).catch(err => console.warn('Error consultando usuario remoto en Firestore:', err));
    }
};


function toggleUserDropdown(e) {
    e.stopPropagation();
    const pill = document.getElementById('user-pill-container');
    const menu = document.getElementById('user-dropdown-menu');
    pill.classList.toggle('open'); menu.classList.toggle('active');
}
document.addEventListener('click', (e) => {
    document.getElementById('user-pill-container')?.classList.remove('open');
    document.getElementById('user-dropdown-menu')?.classList.remove('active');

    if (e.target.classList.contains('auth-modal') || e.target.classList.contains('cart-modal')) {
        e.target.style.display = 'none';
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.auth-modal, .cart-modal, #cartModal, #mobileProfileModal');
        modals.forEach(m => {
            if (m.style.display === 'flex' || m.style.display === 'block') {
                m.style.display = 'none';
            }
        });
    }
});
function openCartFromDropdown(e) { e.stopPropagation(); document.getElementById('user-dropdown-menu')?.classList.remove('active'); toggleCart(); }

// ===== PRODUCTS =====


window.updateProductPrice = function (productId, param) {
    let fillingKey = '';
    if (param && param.value) {
        fillingKey = param.value;
    } else if (typeof param === 'string') {
        fillingKey = param;
    } else {
        const sel = document.getElementById(`filling-sel-${productId}`);
        fillingKey = sel ? sel.value : 'queso';
    }

    const precios = {
        'queso': 2000,
        'bocadillo_queso': 2000,
        'pollo': 3000,
        'jamon_queso': 3000,
        'especial': 3500
    };

    const unidadesMap = { 101: 25, 102: 50, 103: 100 };
    const unidades = unidadesMap[productId] || (productId == 101 ? 25 : (productId == 102 ? 50 : 100));
    const unitPrice = precios[fillingKey] || 2000;
    const total = unidades * unitPrice;
    const isPromo = (fillingKey === 'especial');

    const priceEl = document.getElementById(`price-${productId}`) ||
        document.querySelector(`#price-box-${productId}`) ||
        document.querySelector(`[data-product-id="${productId}"] .product-price`);

    if (!priceEl) return;

    if (isPromo) {
        const tachado = unidades * 3700;
        priceEl.innerHTML = `
                    <div style="display:flex; align-items:center;">
                        <span style="text-decoration:line-through; color:#999; font-size:0.8rem; margin-right:5px;">$${tachado.toLocaleString('es-CO')}</span>
                        <span class="badge-promo-filling">🔥 5% DTO</span>
                    </div>
                    <span class="current-price" style="color:#e11d48;">$${total.toLocaleString('es-CO')}</span>
                `;
    } else {
        priceEl.innerHTML = `<span class="current-price">$${total.toLocaleString('es-CO')}</span>`;
    }
};

function createCardHTML(p) {
    const isOut = stockConfig[p.id] === true;
    const opac = isOut ? '0.5' : '1';
    const filt = isOut ? 'grayscale(100%)' : 'none';
    const btnText = isOut ? '🚫 Agotado por hoy' : '🛒 Agregar al Carrito';
    const btnClass = isOut ? 'btn-add disabled' : `btn-add badd-${p.id}`;
    const btnAction = isOut ? '' : `onclick="addToCart(${p.id},event)"`;
    const outBadge = isOut ? `<span class="badge-status" style="background:#fee2e2; color:#b91c1c; padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold;">🚫 Agotado</span>` : '';
    const tagBadge = (p.tag && p.tag.trim() !== '') ? `<span class="badge-status" style="background:#dbeafe; color:#1e40af; padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold;">${p.tag}</span>` : '';

    let discountBadge = '';
    if (p.oldPrice && p.oldPrice > p.price) {
        const pct = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
        discountBadge = `<span class="badge-discount" style="background:#881337; color:#fff; padding:3px 8px; border-radius:6px; font-size:0.75rem; font-weight:bold;">📉 -${pct}%</span>`;
    }

    const badgesHTML = `
                <div class="product-badges-row">
                    <div style="display:flex; flex-direction:row; gap:6px; align-items:flex-start;">
                        ${outBadge}
                        ${tagBadge}
                    </div>
                    ${discountBadge}
                </div>
            `;

    let fillingSelectHTML = '';
    let priceHTML = `
                <div class="price-row" style="opacity:${opac};">
                    <span class="price">$${p.price.toLocaleString()}</span>
                    <span class="price-label">COP c/u</span>
                </div>
            `;
    if (p.oldPrice && p.oldPrice > p.price) {
        priceHTML = `
                <div class="price-row" style="opacity:${opac}; flex-direction:column; align-items:flex-start; gap:0;">
                    <span style="text-decoration:line-through; color:#999; font-size:0.8rem;">$${p.oldPrice.toLocaleString()}</span>
                    <div>
                        <span class="price" style="color:#e11d48;">$${p.price.toLocaleString()}</span>
                        <span class="price-label">COP c/u</span>
                    </div>
                </div>`;
    }

    if (p.permiteRelleno === true) {
        const units = p.unidades || 1;
        fillingSelectHTML = `
                    <div class="product-filling-wrapper">
                        <label class="filling-label">Elige tu sabor/relleno:</label>
                        <div class="custom-select-box">
                            <select id="filling-sel-${p.id}" class="filling-select" style="outline: none !important;" onchange="window.updateProductPrice(${p.id}, this.value)">
                                ${Object.entries(OPCIONES_RELLENO).map(([id, r]) => `<option value="${id}" data-unit-price="${r.precioUnitario}" data-promo="${r.promo}">${r.nombre}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                `;
        const baseR = OPCIONES_RELLENO['queso'];
        priceHTML = `
                    <div id="price-${p.id}" class="price-row" style="opacity:${opac}; flex-direction:column; align-items:flex-start; margin-top:8px;">
                        <span class="current-price">$${(units * baseR.precioUnitario).toLocaleString('es-CO')}</span>
                    </div>
                `;
    }

    return `<div class="card" id="card-${p.id}" onclick="if(!event.target.closest('button') && !event.target.closest('input') && !event.target.closest('select')){ ${btnAction} }" style="position:relative;">
            ${badgesHTML}
            <div class="card-img-wrap" style="opacity:${opac}; filter:${filt};">
                <img src="${safeImg(p.img || p.image)}" alt="${p.name}" class="pimg-${p.id}" loading="lazy" onerror="this.onerror=null; this.src='logo-pys.png';">
            </div>
            <div class="card-body">
                <div style="opacity:${opac};">
                    <h3>${p.name}</h3>
                    <p class="card-desc">${p.desc}</p>
                    ${fillingSelectHTML}
                </div>
                <div>
                    ${priceHTML}
                    <div class="quantity-control" style="opacity:${opac}; pointer-events:${isOut ? 'none' : 'auto'};">
                        <button class="qty-btn" onclick="changeQty(${p.id},-1)">−</button>
                        <input type="number" class="qty-input qinp-${p.id}" id="qty-${p.id}" value="1" min="1" max="999" onblur="validateQty(this)" oninput="if(parseInt(this.value)>999) this.value=999; if(this.value.length>3) this.value=this.value.slice(0,3);">
                        <button class="qty-btn" onclick="changeQty(${p.id},1)">+</button>
                    </div>
                    <button class="${btnClass}" ${btnAction} style="${isOut ? 'background:#cbd5e1; color:#475569; pointer-events:none;' : ''}">
                        <span>${btnText}</span>
                    </button>
                </div>
            </div>
        </div>`;
}

function renderProducts(items = products) {
    const g = document.getElementById('productGrid');
    if (!g) return;
    g.innerHTML = items.length === 0
        ? "<p style='grid-column:1/-1;text-align:center;color:var(--text-soft);padding:40px 0;font-size:1rem;'>No encontramos productos con esa búsqueda.</p>"
        : items.map(createCardHTML).join('');
}
function renderFeatured(cat = 'todos') {
    const g = document.getElementById('featuredGrid');
    if (!g) return;
    const isTodos = !cat || cat === 'todos' || cat === 'all' || cat === '';
    let list = isTodos
        ? products
        : products.filter(p => p.cat === cat || (cat === 'ofertas' && p.enOferta) || (cat === 'combos' && p.enOferta));
    g.innerHTML = list.map(createCardHTML).join('');
}
function filterCategory(cat, el) {
    document.querySelectorAll('.cat-chip').forEach(c => {
        c.classList.toggle('active', c.getAttribute('onclick')?.includes(`'${cat}'`));
    });
    renderProducts(cat === 'todos' ? products : products.filter(p => p.cat === cat));
    renderFeatured(cat);
}
function filterProductsBySearch(inputId) {
    const q = document.getElementById(inputId)?.value.trim().toLowerCase() || '';
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q)
    );
    renderProducts(filtered);
    showSection('productos', document.querySelectorAll('.nav-link')[1]);
}

// ===== QTY =====
function changeQty(id, d) {
    document.querySelectorAll(`.qinp-${id}`).forEach(inp => {
        let v = parseInt(inp.value, 10) || 1;
        v += d;
        if (v < 1) v = 1;
        else if (v > 999) v = 999;
        inp.value = v;
    });
}
function validateQty(inp) {
    let v = parseInt(inp.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    else if (v > 999) v = 999;
    inp.value = v;
}

// ===== ADD TO CART =====
function flyAnimation(id) {
    const img = document.querySelector(`.pimg-${id}`);
    const cart = document.getElementById('headerCartBtn') || document.querySelector('.cart-nav-btn');
    if (!img || !cart) return;
    const ir = img.getBoundingClientRect(), cr = cart.getBoundingClientRect();
    const fi = document.createElement('img');
    fi.src = img.src; fi.className = 'flying-img';
    fi.style.cssText = `top:${ir.top}px;left:${ir.left}px;width:${ir.width}px;height:${ir.height}px;`;
    document.body.appendChild(fi);
    requestAnimationFrame(() => {
        fi.style.top = `${cr.top + 6}px`; fi.style.left = `${cr.left + 10}px`;
        fi.style.width = '24px'; fi.style.height = '24px'; fi.style.opacity = '0.3';
    });
    setTimeout(() => { fi.remove(); document.getElementById('headerCartBtn')?.classList.add('bounce'); setTimeout(() => document.getElementById('headerCartBtn')?.classList.remove('bounce'), 450); }, 750);
}

function addToCart(id, e) {
    if (e) e.stopPropagation();
    const p = products.find(x => x.id === id); if (!p) return;
    if (stockConfig[id]) return showToast("Este producto está agotado por hoy.", "🚫");

    let finalPrice = p.price;
    let finalName = p.name;
    let selectedFilling = null;

    const fillingSelect = document.getElementById(`filling-sel-${id}`);
    if (fillingSelect) {
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

    const inp = document.querySelector(`.qinp-${id}`) || document.getElementById(`qty-${id}`);
    let qty = parseInt(inp?.value) || 1; if (qty < 1) qty = 1;

    const cartId = selectedFilling ? (id + '_' + selectedFilling.id) : id;
    const existing = cart.find(x => (x.cartId || x.id) === cartId || (x.id === id && x.name === finalName));
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ ...p, quantity: qty, name: finalName, price: finalPrice, cartId, filling: selectedFilling });
    }
    flyAnimation(id);
    document.querySelectorAll(`.badd-${id}`).forEach(b => {
        b.classList.add('added'); b.innerHTML = '<span>✓ ¡Agregado!</span>';
        setTimeout(() => { b.classList.remove('added'); b.innerHTML = '<span>➕ Agregar al Carrito</span>'; }, 1100);
    });
    if (inp) inp.value = 1;
    updateCart(); saveCart();
    if (typeof window.showAddToCartToast === 'function') {
        window.showAddToCartToast(finalName || p.name, qty);
    } else {
        showToast(`¡${qty}x ${finalName || p.name} al carrito!`, '🥐');
    }
}

function updateQty(cartId, delta) {
    const item = cart.find(x => (x.cartId || x.id) == cartId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(x => (x.cartId || x.id) != cartId);
    } else if (item.quantity > 999) {
        item.quantity = 999;
    }
    updateCart();
    saveCart();
}
function setItemQty(cartId, val) {
    const item = cart.find(x => (x.cartId || x.id) == cartId);
    if (!item) return;
    let nv = parseInt(val, 10);
    if (isNaN(nv) || nv < 1) {
        nv = 1;
    } else if (nv > 999) {
        nv = 999;
    }
    item.quantity = nv;
    updateCart();
    saveCart();
}
function removeCartItem(cartId) {
    cart = cart.filter(x => (x.cartId || x.id) != cartId);
    updateCart();
    saveCart();
    showToast("Producto eliminado.", "🗑️");
}

// ===== ENTREGA: DOMICILIO VS RECOGER EN TIENDA =====
var deliveryType = 'delivery';
window.deliveryType = 'delivery';

function setDeliveryType(type) {
    deliveryType = type || 'delivery';
    window.deliveryType = deliveryType;

    const btnHome = document.getElementById('btn-delivery-home');
    const btnPickup = document.getElementById('btn-delivery-pickup');
    const addrContainer = document.getElementById('deliveryAddressContainer');
    const pickupContainer = document.getElementById('pickupStoreContainer');
    const addrInput = document.getElementById('orderAddress');

    if (btnHome) btnHome.classList.toggle('active', deliveryType === 'delivery');
    if (btnPickup) btnPickup.classList.toggle('active', deliveryType === 'pickup');

    if (deliveryType === 'delivery') {
        if (addrContainer) addrContainer.style.display = 'flex';
        if (pickupContainer) pickupContainer.style.display = 'none';
        if (addrInput) addrInput.setAttribute('required', 'required');
    } else {
        if (addrContainer) addrContainer.style.display = 'none';
        if (pickupContainer) pickupContainer.style.display = 'flex';
        if (addrInput) addrInput.removeAttribute('required');

        // Garantizar que el botón y la dirección del punto físico sean siempre exactos
        const mapsBtn = document.getElementById('btnStoreMapsLink');
        if (mapsBtn) {
            mapsBtn.href = 'https://maps.app.goo.gl/6pG6PHpUaV9F8NyZ6';
            mapsBtn.setAttribute('href', 'https://maps.app.goo.gl/6pG6PHpUaV9F8NyZ6');
            mapsBtn.onclick = function(e) {
                if (e && e.preventDefault) e.preventDefault();
                window.open('https://maps.app.goo.gl/6pG6PHpUaV9F8NyZ6', '_blank');
                return false;
            };
        }
        const pickupAddr = document.querySelector('#cartPickupDetails .pickup-address') || document.querySelector('#cartPickupDetails .pickup-store-address');
        if (pickupAddr) {
            pickupAddr.innerText = '📍 Calle 10 con Avenida 7 # 10 - 30, Barrio Doña Nidia, Cúcuta';
        }
    }

    updateCart();
}
window.setDeliveryType = setDeliveryType;

function openStoreMaps(e) {
    if (e && e.preventDefault) e.preventDefault();
    window.open('https://maps.app.goo.gl/6pG6PHpUaV9F8NyZ6', '_blank');
    return false;
}
window.openStoreMaps = openStoreMaps;

function updateCart() {
    const totalQty = cart.reduce((a, i) => a + i.quantity, 0);
    let totalPrice = cart.reduce((a, i) => a + (i.price * i.quantity), 0);

    let discount = 0;
    const dRow = document.getElementById('discountRow');
    const pRow = document.getElementById('cart-vip-priority');
    const cartContent = document.querySelector('#cartModal .cart-content');
    if (currentUser && totalPrice > 0 && adminConfig.vipEnabled && totalPrice >= adminConfig.minPurchase) {
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
            discount = Math.floor(totalPrice * (currentUser.vip ? 0.08 : 0.04));
        } else {
            discount = currentUser.vip ? Math.floor(totalPrice * 0.05) : 0;
        }

        if (cartContent) {
            if (currentUser.vip) cartContent.classList.add('cart-vip-mode');
            else cartContent.classList.remove('cart-vip-mode');
        }

        if (discount > adminConfig.maxDiscount) discount = adminConfig.maxDiscount;

        if (currentUser.vip) {
            if (dRow) { dRow.style.display = 'flex'; document.getElementById('discountLabel').innerText = 'Descuento VIP Oro:'; document.getElementById('sumDiscount').innerText = `- $${discount.toLocaleString('es-CO')} COP`; }
            if (pRow) pRow.style.display = 'block';
        } else {
            if (dRow) { dRow.style.display = 'flex'; document.getElementById('discountLabel').innerText = 'Descuento Base:'; document.getElementById('sumDiscount').innerText = `- $${discount.toLocaleString('es-CO')} COP`; }
            if (pRow) pRow.style.display = 'none';
        }
    } else {
        if (cartContent) cartContent.classList.remove('cart-vip-mode');
        if (dRow) dRow.style.display = 'none';
        if (pRow) pRow.style.display = 'none';
    }

    const curDelivery = (typeof window.deliveryType !== 'undefined') ? window.deliveryType : 'delivery';
    const threshold = 10000;
    const baseProductos = Math.max(0, totalPrice - discount);

    let costoDomicilio = 0;
    if (curDelivery === 'delivery') {
        costoDomicilio = (baseProductos >= threshold || totalPrice === 0) ? 0 : 5000;
    } else {
        costoDomicilio = 0;
    }

    const finalTotal = totalPrice > 0 ? Math.max(0, (totalPrice - discount) + costoDomicilio) : 0;

    // Actualizar barra de progreso interactiva de domicilio gratis
    const fsBanner = document.getElementById('freeShippingBanner');
    const fsText = document.getElementById('shippingProgressText');
    const fsFill = document.getElementById('shippingProgressFill');
    if (fsBanner && fsText && fsFill) {
        if (cart.length === 0 || totalPrice === 0) {
            fsBanner.style.display = 'none';
        } else {
            fsBanner.style.display = 'block';
            if (baseProductos < threshold) {
                const faltante = threshold - baseProductos;
                const porcentaje = Math.min(100, Math.max(0, Math.round((baseProductos / threshold) * 100)));
                fsText.innerHTML = `🛵 Te faltan <strong>$${faltante.toLocaleString('es-CO')} COP</strong> en productos para Domicilio GRATIS`;
                fsFill.style.width = `${porcentaje}%`;
                fsFill.classList.remove('completed');
                fsBanner.classList.remove('completed');
            } else {
                fsText.innerHTML = `🎉 ¡Genial! Tu pedido califica para <strong>Domicilio GRATIS</strong>`;
                fsFill.style.width = '100%';
                fsFill.classList.add('completed');
                fsBanner.classList.add('completed');
            }
        }
    }

    // Actualizar subtotal y costo de entrega en Cart Summary
    const sumSubtotalEl = document.getElementById('sumSubtotal');
    if (sumSubtotalEl) sumSubtotalEl.innerText = `$${totalPrice.toLocaleString('es-CO')} COP`;

    const sumDeliveryEl = document.getElementById('sumDelivery');
    if (sumDeliveryEl) {
        if (costoDomicilio === 0) {
            if (curDelivery === 'pickup') {
                sumDeliveryEl.innerHTML = '<span style="color:#059669; font-weight:800;">¡GRATIS!</span> <small style="display:block; font-size:0.72rem; color:#64748b; font-weight:normal; margin-top:2px;">(Recoger en tienda)</small>';
            } else {
                sumDeliveryEl.innerHTML = '<span style="color:#059669; font-weight:800;">¡GRATIS!</span>';
            }
        } else {
            sumDeliveryEl.innerHTML = '<span style="color:#e11d48; font-weight:800;">$5.000 COP</span> <small style="display:block; font-size:0.72rem; color:#64748b; font-weight:normal; margin-top:2px;">(Gratis a partir de $10.000 en productos)</small>';
        }
    }

    // Badge dinámico de tarifa en Paso 2
    const feeBadge = document.getElementById('deliveryFeeBadge');
    if (feeBadge) {
        if (baseProductos >= threshold) {
            feeBadge.className = 'delivery-fee-badge free';
            feeBadge.innerHTML = '🎉 <strong>¡Domicilio GRATIS!</strong> Aplica por compras mayores a $10.000 COP.';
        } else {
            const falta = Math.max(0, threshold - baseProductos);
            feeBadge.className = 'delivery-fee-badge paid';
            feeBadge.innerHTML = `🛵 Costo de domicilio: <strong>$5.000 COP</strong> <br><small>(¡Agrega <strong>$${falta.toLocaleString('es-CO')} COP</strong> más para envío gratis!)</small>`;
        }
    }

    // Actualizar Quick Summary en Paso 2
    const cqsSub = document.getElementById('cqsSubtotal');
    if (cqsSub) cqsSub.innerText = `$${totalPrice.toLocaleString('es-CO')} COP`;

    const cqsDiscRow = document.getElementById('cqsDiscountRow');
    const cqsDisc = document.getElementById('cqsDiscount');
    if (cqsDiscRow && cqsDisc) {
        if (discount > 0) {
            cqsDiscRow.style.display = 'flex';
            cqsDisc.innerText = `- $${discount.toLocaleString('es-CO')} COP`;
        } else {
            cqsDiscRow.style.display = 'none';
        }
    }

    const cqsDel = document.getElementById('cqsDelivery');
    if (cqsDel) {
        if (costoDomicilio === 0) {
            cqsDel.innerText = '¡GRATIS!';
            cqsDel.style.color = '#059669';
        } else {
            cqsDel.innerText = '$5.000 COP';
            cqsDel.style.color = '#e11d48';
        }
    }

    const cqsTot = document.getElementById('cqsTotal');
    if (cqsTot) cqsTot.innerText = `$${finalTotal.toLocaleString('es-CO')} COP`;

    const cartVipPriority = document.getElementById('cart-vip-priority');
    if (cartVipPriority) {
        if (currentUser && currentUser.vip) {
            cartVipPriority.style.display = 'flex';
        } else {
            cartVipPriority.style.display = 'none';
        }
    }

    const depositRow = document.getElementById('eventDepositRow');
    const balanceRow = document.getElementById('eventBalanceRow');
    if (typeof orderType !== 'undefined' && orderType === 'evento' && finalTotal > 0) {
        const deposit = Math.ceil(finalTotal / 2);
        const balance = finalTotal - deposit;
        if (depositRow) {
            depositRow.style.display = 'flex';
            document.getElementById('sumDeposit').innerText = `$${deposit.toLocaleString('es-CO')} COP`;
        }
        if (balanceRow) {
            balanceRow.style.display = 'flex';
            document.getElementById('sumBalance').innerText = `$${balance.toLocaleString('es-CO')} COP`;
        }
    } else {
        if (depositRow) depositRow.style.display = 'none';
        if (balanceRow) balanceRow.style.display = 'none';
    }

    const simMsg = document.getElementById('sim-points-msg');
    const mpSimMsg = document.getElementById('mp-sim-points-msg');
    if (simMsg || mpSimMsg) {
        let t = "Agrega productos para ver cuántos puntos ganas.";
        if (totalPrice >= 100000) {
            t = "¡Ganarás +30 puntos con este pedido! 🎉";
        } else if (totalPrice >= 50000) {
            t = `¡Ganarás +20 puntos! Agrega $${(100000 - totalPrice).toLocaleString('es-CO')} más para ganar 30 pts.`;
        } else if (totalPrice >= 10000) {
            t = `¡Ganarás +10 puntos! Agrega $${(50000 - totalPrice).toLocaleString('es-CO')} más para ganar 20 pts.`;
        } else if (totalPrice > 0) {
            t = `Agrega $${(10000 - totalPrice).toLocaleString('es-CO')} más para empezar a ganar puntos.`;
        }
        if (simMsg) simMsg.innerText = t;
        if (mpSimMsg) mpSimMsg.innerText = t;
    }

    const greetingDiv = document.getElementById('cart-user-greeting');
    if (greetingDiv) {
        if (typeof currentUser !== 'undefined' && currentUser) {
            const name = currentUser.name.split(' ')[0];
            if (currentUser.vip) {
                greetingDiv.innerHTML = `¡Hola, ${name}! 👑 Cliente VIP (Despacho Preferencial)`;
                greetingDiv.style.background = '#fef3c7';
                greetingDiv.style.color = '#d97706';
                greetingDiv.style.border = '1px solid #fde68a';
            } else {
                greetingDiv.innerText = `¡Hola, ${name}! Este es tu pedido de hoy:`;
                greetingDiv.style.background = '#f8fafc';
                greetingDiv.style.color = '#475569';
                greetingDiv.style.border = 'none';
            }
            greetingDiv.style.display = 'flex';
            greetingDiv.style.alignItems = 'center';
            greetingDiv.style.justifyContent = 'center';
            greetingDiv.style.height = '36px';
            greetingDiv.style.borderRadius = '8px';
            greetingDiv.style.fontSize = '0.85rem';
            greetingDiv.style.fontWeight = '700';
            greetingDiv.style.margin = '0 0 10px 0';
        } else {
            greetingDiv.style.display = 'none';
        }
    }

    document.getElementById('cartCount').innerText = totalQty;
    document.getElementById('cartCountMobile').innerText = totalQty;
    document.querySelectorAll('.dropdown-cart-qty').forEach(e => e.innerText = totalQty);
    document.getElementById('sumQty').innerText = totalQty;
    document.getElementById('sumTotal').innerText = finalTotal.toLocaleString('es-CO');
    const ci = document.getElementById('cartItems');
    const cs = document.getElementById('cartSummary');
    const cc = document.getElementById('checkoutCard');
    const bw = document.querySelector('.btn-whatsapp');
    if (cart.length === 0) {
        const fsBanner = document.getElementById('freeShippingBanner');
        if (fsBanner) fsBanner.style.display = 'none';
        ci.innerHTML = `<div class="empty-cart-view" style="display:flex; flex-direction:column; gap:12px; align-items:center; text-align:center; padding: 20px 10px;"><span>🥖</span><strong style="display:block;color:var(--text-dark);margin-bottom:5px;">Tu carrito está vacío</strong><p style="font-size:0.85rem; color:#64748b; margin-bottom:12px;">¡Agrega panes, hojaldres o tortas para hacer tu pedido!</p><button type="button" onclick="toggleCart(); goToCatalog();" style="background:#f3f4f6; color:#4b5563; border:none; padding:10px 20px; border-radius:var(--r-full); font-weight:bold; cursor:pointer; width:100%; transition:all 0.2s;">Ver Catálogo</button></div>`;
        cs.style.display = 'none'; if (cc) cc.style.display = 'none'; bw.style.display = 'none';
    } else {
        cs.style.display = 'block'; cs.style.opacity = '1'; if (cc) cc.style.display = 'flex'; bw.style.display = 'flex'; bw.style.opacity = '1'; bw.style.pointerEvents = 'auto';
        ci.innerHTML = cart.map(item => {
            const cid = item.cartId || item.id;
            return `
                <div class="cart-item-row">
                    <img src="${safeImg(item.img)}" class="cart-item-img" alt="${item.name}" onerror="this.onerror=null; this.src='logo-pys.png';">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toLocaleString('es-CO')} c/u • <strong>$${(item.price * item.quantity).toLocaleString('es-CO')} COP</strong></div>
                    </div>
                    <div class="cart-item-actions">
                        <button type="button" onclick="updateQty('${cid}', -1)">−</button>
                        <input type="number" class="cart-qty-input" value="${item.quantity}" min="1" max="999" onchange="setItemQty('${cid}', this.value)" oninput="if(parseInt(this.value)>999) this.value=999; if(this.value.length>3) this.value=this.value.slice(0,3);">
                        <button type="button" onclick="updateQty('${cid}', 1)">+</button>
                        <button type="button" class="btn-delete-item" onclick="removeCartItem('${cid}')" title="Eliminar producto"><svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg></button>
                    </div>
                </div>`;
        }).join('');
    }
}

function closeCartModal() {
    const m = document.getElementById('cartModal');
    if (m) {
        m.style.display = 'none';
        document.body.style.overflow = '';
    }
}
window.closeCartModal = closeCartModal;

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

function toggleCart() {
    const m = document.getElementById('cartModal');
    if (!m) return;
    if (m.style.display === 'flex') {
        closeCartModal();
    } else {
        m.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        goToCartStep1(); // Reset to step 1
        const addrInput = document.getElementById('orderAddress');
        if (addrInput && !addrInput.value && typeof currentUser !== 'undefined' && currentUser && currentUser.address) {
            addrInput.value = currentUser.address;
        }
        setDeliveryType(window.deliveryType || 'delivery');
    }
}

function goToCartStep1() {
    const step1 = document.getElementById('cart-step-1');
    const step2 = document.getElementById('cart-step-2');
    if (step1 && step2) {
        step1.style.display = 'flex';
        step2.style.display = 'none';
    }
}

function goToCartStep2() {
    if (cart.length === 0) return showToast("Tu carrito está vacío", "⚠️");
    const step1 = document.getElementById('cart-step-1');
    const step2 = document.getElementById('cart-step-2');
    if (step1 && step2) {
        step1.style.display = 'none';
        step2.style.display = 'flex';
    }
    updateCart();
}
function handleCartBdrop(e) { if (e.target === document.getElementById('cartModal')) closeCartModal(); }

function selectPay(el, method) {
    document.querySelectorAll('.payment-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active'); selectedPay = method;
}

function toggleOrderType(type) {
    orderType = type;
    const btnImm = document.getElementById('btn-order-immediate');
    const btnEvt = document.getElementById('btn-order-event');
    if (btnImm) btnImm.classList.toggle('active', type === 'inmediato');
    if (btnEvt) btnEvt.classList.toggle('active', type === 'evento');
    const fields = document.getElementById('scheduledFields');
    if (fields) fields.style.display = type === 'evento' ? 'flex' : 'none';
    updateCart();
}

function sendOrder() {
    if (cart.length === 0) return alert("¡Tu carrito está vacío!");

    const nameElement = document.getElementById('orderName');
    const addrElement = document.getElementById('orderAddress');
    const notesElement = document.getElementById('orderNotes');

    const name = nameElement ? nameElement.value.trim() : (currentUser ? currentUser.name : '');
    const addr = addrElement ? addrElement.value.trim() : '';
    const notes = notesElement ? notesElement.value.trim() : '';

    const curDelivery = (typeof window.deliveryType !== 'undefined') ? window.deliveryType : 'delivery';

    if (!name) return alert("Por favor, llena tu nombre.");
    if (curDelivery === 'delivery' && !addr) {
        return alert("Por favor, ingresa tu barrio y dirección para el domicilio en Cúcuta.");
    }
    if (!selectedPay) return alert("Por favor, selecciona un método de pago.");

    if (cart.some(i => i.type === 'evento' || i.id.toString().startsWith('custom'))) {
        orderType = 'evento';
    }

    if (typeof orderType !== 'undefined' && orderType === 'evento') {
        // Validación opcional si hay campos de evento globales
    }

    if (currentUser) {
        const u = db_users.find(x => x.email === currentUser.email);
        if (u && u.blocked) {
            return alert("Tu cuenta ha sido bloqueada. No puedes realizar pedidos.");
        }
    }

    const tq = cart.reduce((a, i) => a + i.quantity, 0);
    const tp = cart.reduce((a, i) => a + (i.price * i.quantity), 0);

    let discount = 0;
    let costoDomicilio = 0;

    if (currentUser && typeof adminConfig !== 'undefined' && adminConfig.vipEnabled && tp >= adminConfig.minPurchase) {
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

        let ptsEarned = Math.floor(tp / 1000);

        if (ptsEarned > 0) {
            currentUser.points = (currentUser.points || 0) + ptsEarned;
            const uidx = db_users.findIndex(u => u.email === currentUser.email);
            if (uidx !== -1) { db_users[uidx].points = currentUser.points; saveUsersDB(); }
            saveUser();
            syncUserUI();
        }
    }

    const baseProductos = Math.max(0, tp - discount);
    if (curDelivery === 'delivery') {
        costoDomicilio = (baseProductos >= 10000) ? 0 : 5000;
    }

    const finalTotal = (tp - discount) + costoDomicilio;

    // Generar Orden y Guardar en Historial
    const orderId = 'DT-' + Date.now().toString().slice(-4);
    const dateStr = new Date().toLocaleString('es-CO');
    const newOrder = {
        id: orderId,
        date: dateStr,
        customer: name,
        customerName: name,
        totalFormatted: finalTotal.toLocaleString('es-CO'),
        email: currentUser?.email || 'N/A',
        phone: currentUser?.phone || 'N/A',
        address: (curDelivery === 'delivery' ? addr : '🏪 Calle 10 con Avenida 7 # 10 - 30, Barrio Doña Nidia, Cúcuta'),
        deliveryType: curDelivery,
        deliveryCost: costoDomicilio,
        products: cart.map(i => `${i.quantity}x ${i.name}`).join(', '),
        subtotal: tp,
        discount: discount,
        total: finalTotal,
        status: 'Pendiente',
        payStatus: 'Pendiente - ' + selectedPay,
        type: (typeof orderType !== 'undefined' ? orderType : 'inmediato'),
        timestamp: Date.now()
    };

    if (typeof pedidosHistorial !== 'undefined') {
        pedidosHistorial.push(newOrder);
        lastOrderCount = pedidosHistorial.length;
        if (typeof savePedidosHistorial === 'function') savePedidosHistorial();

        if (typeof window.recordNewOrderNotification === 'function') {
            window.recordNewOrderNotification(newOrder, { playSound: true });
        }
    }

    if (currentUser) {
        if (!currentUser.history) currentUser.history = [];
        currentUser.history.push(newOrder);
        const uidx = db_users.findIndex(u => u.email === currentUser.email);
        if (uidx !== -1) { db_users[uidx].history = currentUser.history; saveUsersDB(); }
        saveUser();
    }

    let msg = '¡Hola P&S Punto Dulce! Quiero agendar este pedido para mi celebración:\n\n';
    if (currentUser && currentUser.vip) {
        msg += `⭐ *PEDIDO PRIORITARIO VIP* ⭐\n\n`;
    }
    msg += `📲 *NUEVO PEDIDO ${orderId}*\n`;
    if (typeof orderType !== 'undefined' && orderType === 'evento') {
        msg = '¡Hola P&S Punto Dulce! Quiero agendar este pedido para mi celebración:\n\n';
        if (currentUser && currentUser.vip) {
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
    if (currentUser && discount > 0) {
        if (currentUser.vip) {
            msg += `👑 *[CLIENTE VIP ORO - APLICANDO DESCUENTO Y PRIORIDAD]*\n`;
        } else {
            msg += `🎁 *[CLIENTE CLUB DULCE - APLICANDO DESCUENTO Y PUNTOS]*\n`;
        }
    }
    msg += `—————————————————————\n`;
    msg += `👤 *Cliente:* ${name}\n`;
    msg += `📦 *Modalidad:* ${curDelivery === 'delivery' ? '🛵 Domicilio en Cúcuta' : '🏪 Recoger en Punto Físico'}\n`;
    if (curDelivery === 'delivery') {
        msg += `📍 *Dirección:* ${addr}\n`;
    } else {
        msg += `📍 *Punto de Entrega:* Calle 10 con Avenida 7 # 10 - 30, Barrio Doña Nidia\n`;
        msg += `🗺️ *Ubicación Maps:* https://maps.app.goo.gl/6pG6PHpUaV9F8NyZ6\n`;
    }
    msg += `💳 *Pago:* ${selectedPay}\n`;
    if (notes) msg += `📝 *Notas:* ${notes}\n`;
    msg += `—————————————————————\n`;
    msg += `*PRODUCTOS PEDIDOS:*\n`;
    cart.forEach(i => {
        if (i.id.toString().startsWith('custom')) {
            msg += `  • 🎂 ${i.name}\n`;
            msg += `    *Precio:* $${(i.price * i.quantity).toLocaleString('es-CO')} COP\n`;
            if (i.customData) {
                msg += `    *Detalles:* Sabor: ${i.customData.sabor} | Tamaño: ${i.customData.tamano} | Diseño: ${i.customData.diseno}\n`;
                if (i.customData.message) msg += `    *Mensaje:* "${i.customData.message}"\n`;
                msg += `    🎁 *Kit de Fiesta GRATIS Incluido*\n`;
            }
        } else {
            msg += `  • ${i.quantity}x ${i.name} → $${(i.price * i.quantity).toLocaleString('es-CO')} COP\n`;
        }
    });
    msg += `—————————————————————\n`;
    msg += `*Total unidades:* ${tq}\n`;
    msg += `💰 *Subtotal:* $${tp.toLocaleString('es-CO')} COP\n`;
    if (discount > 0) {
        msg += `🎁 *Descuento ${currentUser?.vip ? 'VIP Oro' : 'Base'}:* -$${discount.toLocaleString('es-CO')} COP\n`;
    }
    msg += `🛵 *Domicilio:* ${costoDomicilio === 0 ? '¡GRATIS! ($0)' : '$5.000 COP'}\n`;
    msg += `*TOTAL A PAGAR:* $${finalTotal.toLocaleString('es-CO')} COP\n`;
    if (typeof orderType !== 'undefined' && orderType === 'evento') {
        const dep = Math.ceil(finalTotal / 2);
        msg += `\n⚠️ *Pedido de Evento (Anticipo requerido)*\n`;
        msg += `*Abonar 50% para reservar:* $${dep.toLocaleString('es-CO')} COP\n`;
        msg += `*Saldo pendiente contra entrega:* $${(finalTotal - dep).toLocaleString('es-CO')} COP\n`;
    }
    msg += `—————————————————————\n`;
    msg += `¿Me confirman el tiempo estimado de entrega? ¡Muchas gracias! 🙏`;

    // Vaciar carrito
    cart = [];
    if (typeof saveCart === 'function') saveCart();
    if (typeof updateCart === 'function') updateCart();
    if (typeof showToast === 'function') showToast("Procesando pedido...", "⏳", 1500);

    setTimeout(() => {
        window.open(`https://wa.me/${typeof PHONE !== 'undefined' ? PHONE : '573123456789'}?text=${encodeURIComponent(msg)}`, '_blank');
    }, 1000);
}

function openWhatsAppChat() {
    const g = "¡Hola! Vengo desde la página web de Dulce Tentación P y S 🥖. Quiero consultar los productos disponibles hoy en Cúcuta. ¡Gracias!";
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(g)}`, '_blank');
}

let cartToastTimer = null;
let cartBumpTimer = null;

window.showAddToCartToast = function(productName, qty = 1) {
    let toast = document.getElementById('cartToastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cartToastNotification';
        toast.className = 'cart-toast-notification';
        document.body.appendChild(toast);
    }

    // Contenido explícito, elegante y claro
    toast.innerHTML = `<span>✨ ¡Agregado! <strong>${productName}</strong> x${qty}</span>`;

    // Activar visibilidad con animación suave
    toast.classList.add('toast-show');
    toast.classList.add('show');

    // Ocultar automáticamente tras 2.2 segundos
    if (cartToastTimer) clearTimeout(cartToastTimer);
    cartToastTimer = setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.remove('show');
    }, 2200);

    // Microanimación de rebote (cart-bump) para los botones del carrito
    const cartBtns = document.querySelectorAll('#headerCartBtn, #cartBtn, #btnCart, .cart-btn, .cart-nav-btn, .nav-cart');
    cartBtns.forEach(btn => {
        btn.classList.remove('cart-bump');
        void btn.offsetWidth; // Forzar reflow para reiniciar la animación
        btn.classList.add('cart-bump');
    });
    if (cartBumpTimer) clearTimeout(cartBumpTimer);
    cartBumpTimer = setTimeout(() => {
        cartBtns.forEach(btn => btn.classList.remove('cart-bump'));
    }, 400);
};

let globalToastTimer = null;
function showToast(msg, icon = '🥐', duration = 2600) {
    const t = document.getElementById('toast');
    if (!t) return;
    const msgEl = document.getElementById('toastMsg');
    const iconEl = document.getElementById('toastIcon');
    if (msgEl) msgEl.innerText = msg;
    if (iconEl) iconEl.innerText = icon;
    if (!msgEl && !iconEl) t.innerText = msg;
    t.classList.add('show');
    t.classList.add('toast-show');
    if (globalToastTimer) clearTimeout(globalToastTimer);
    globalToastTimer = setTimeout(() => {
        t.classList.remove('show');
        t.classList.remove('toast-show');
    }, duration);
}

// ===== VIP FUNCTIONS =====
function toggleVIP() {
    if (!currentUser) return alert('Debes iniciar sesión primero.');
    currentUser.vip = !currentUser.vip;
    const uidx = db_users.findIndex(u => u.email === currentUser.email);
    if (uidx !== -1) { db_users[uidx].vip = currentUser.vip; saveUsersDB(); }
    saveUser();
    syncUserUI();
    updateCart();
    showToast(currentUser.vip ? '¡Membresía VIP Oro activada!' : 'Membresía VIP desactivada.', '👑', 3000);
}

// ===== MODAL DE TÉRMINOS Y BENEFICIOS VIP =====
window.openVipTermsModal = function(e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : JSON.parse(localStorage.getItem('dt_user') || 'null');
    if (!user) {
        alert("Por favor inicia sesión o regístrate para conocer y solicitar tu membresía VIP.");
        if (typeof openAuthModal === 'function') openAuthModal();
        else if (typeof window.openLoginModal === 'function') window.openLoginModal();
        return;
    }
    const m = document.getElementById('modalVipTerms');
    if (m) {
        m.style.display = 'flex';
        m.classList.add('active');
        m.style.zIndex = '999999';
        m.style.visibility = 'visible';
        m.style.opacity = '1';
    }
    const dMenu = document.getElementById('user-dropdown-menu');
    if (dMenu) dMenu.classList.remove('active');
    if (typeof closeMobileProfile === 'function') closeMobileProfile();
};

window.closeVipTermsModal = function() {
    const m = document.getElementById('modalVipTerms');
    if (m) {
        m.style.display = 'none';
        m.classList.remove('active');
        m.style.visibility = 'hidden';
    }
};

window.confirmVipMembership = function() {
    const check = document.getElementById('checkAcceptVipTerms');
    if (!check || !check.checked) {
        alert("Debes marcar la casilla para aceptar los Términos y Condiciones.");
        return;
    }

    const user = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : JSON.parse(localStorage.getItem('dt_user') || '{}');
    user.isVip = true;
    user.vipStatus = 'solicitado';
    user.vip = true;
    localStorage.setItem('dt_user', JSON.stringify(user));
    if (typeof currentUser !== 'undefined' && currentUser) {
        currentUser.isVip = true;
        currentUser.vipStatus = 'solicitado';
        currentUser.vip = true;
        if (typeof syncUserUI === 'function') syncUserUI();
    }

    // Notificación para panel de administración y trabajador (dt_notifications, dt_live_alerts y Firestore)
    const vipNotif = {
        id: 'notif_vip_' + Date.now(),
        type: 'solicitud_vip',
        title: '👑 Nueva Solicitud VIP',
        message: `${user.name || 'Cliente'} (${user.email || 'N/A'})`,
        time: 'Hace un momento',
        read: false,
        timestamp: Date.now()
    };
    try {
        let notifs = JSON.parse(localStorage.getItem('dt_notifications') || '[]');
        notifs.unshift(vipNotif);
        if (notifs.length > 50) notifs = notifs.slice(0, 50);
        localStorage.setItem('dt_notifications', JSON.stringify(notifs));
    } catch(e) {}
    try {
        let alerts = JSON.parse(localStorage.getItem('dt_live_alerts') || '[]');
        alerts.unshift({
            type: 'solicitud_vip',
            title: '👑 Nueva Solicitud VIP',
            user: user.name || 'Cliente',
            email: user.email || '',
            date: new Date().toLocaleString('es-CO')
        });
        localStorage.setItem('dt_live_alerts', JSON.stringify(alerts));
    } catch(e) {}
    if (window.renderAdminNotifList) window.renderAdminNotifList();

    if (window.db && typeof window.db.collection === 'function') {
        window.db.collection('solicitudes_vip').add(vipNotif).catch(err => console.warn(err));
    }

    window.closeVipTermsModal();
    alert("¡Excelente! Solicitud registrada. Te contactaremos por WhatsApp para confirmar tu activación.");

    // Redirección a WhatsApp del negocio
    const phoneAdmin = "573227349286";
    const text = `¡Hola P&S Punto Dulce! 👋 Acabo de aceptar los Términos y Condiciones del Club VIP y deseo activar mi Membresía VIP Oro 👑✨%0A%0A👤 *Nombre:* ${encodeURIComponent(user.name || 'Cliente')}%0A📧 *Correo:* ${encodeURIComponent(user.email || 'N/A')}`;
    window.open(`https://wa.me/${phoneAdmin}?text=${text}`, '_blank');
};

// ===== CENTRO DE NOTIFICACIONES (ADMIN / TRABAJADOR) =====
window.toggleAdminNotifDropdown = function() {
    const dd = document.getElementById('adminNotifDropdown');
    if (!dd) return;
    const isOpen = dd.style.display === 'block';
    if (isOpen) {
        dd.style.display = 'none';
    } else {
        dd.style.display = 'block';
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
        } catch (e) {}
        if (window.renderAdminNotifList) window.renderAdminNotifList();
    }
};

window.renderAdminNotifList = function() {
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
        } catch (e) {}
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

        return `
            <div style="background: ${isUnread ? '#fff5f7' : '#fafafa'}; border-left: 3px solid ${isUnread ? '#e91e63' : '#cbd5e1'}; border-radius: 8px; padding: 8px 10px; font-size: 0.82rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.2s ease;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
                    <div style="font-weight: 700; color: #1e293b;">${item.title || '🔔 Notificación'}</div>
                    <span style="font-size: 0.68rem; color: #94a3b8; white-space: nowrap;">${timeDisplay}</span>
                </div>
                <div style="color: #475569; font-size: 0.78rem; margin-top: 3px; word-break: break-word;">${item.message || ''}</div>
            </div>
        `;
    }).join('');
};

window.clearAdminNotifs = function() {
    localStorage.setItem('dt_notifications', '[]');
    localStorage.setItem('dt_live_alerts', '[]');
    if (window.renderAdminNotifList) window.renderAdminNotifList();
};

document.addEventListener('click', function(e) {
    const wrapper = document.querySelector('.admin-notif-wrapper');
    const dd = document.getElementById('adminNotifDropdown');
    if (dd && dd.style.display === 'block' && wrapper && !wrapper.contains(e.target)) {
        dd.style.display = 'none';
    }
});

function openVipModal(e) {
    if (window.openVipTermsModal) {
        window.openVipTermsModal(e);
    } else {
        const m = document.getElementById('vipPromoModal');
        if (m) m.style.display = 'flex';
        const dMenu = document.getElementById('user-dropdown-menu');
        if (dMenu) dMenu.classList.remove('active');
        if (typeof closeMobileProfile === 'function') closeMobileProfile();
    }
}

function closeVipModal() {
    const m = document.getElementById('vipPromoModal');
    if (m) m.style.display = 'none';
    if (window.closeVipTermsModal) window.closeVipTermsModal();
}

function requestVipWhatsApp() {
    const msg = "¡Hola! Quiero activar mi Membresía VIP Oro en Dulce Tentación para acceder al 5% de descuento y los beneficios exclusivos. 👑";
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ===== ASISTENTE DE TORTAS PERSONALIZADAS (WIZARD POR PASOS) =====
let currentWizardStep = 1;
let wizardData = {
    sabor: 'Clásica Tres Leches',
    tamano: '1/4 (10 porciones)',
    precio: 45000,
    diseno: 'Diseño Tradicional',
    disenoImg: '',
    mensaje: '',
    date: '',
    time: '',
    extras: {}
};

function openWizard() {
    const modal = document.getElementById('modal-evento-personalizado');
    if (modal) modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Inicializar datos por defecto
    wizardData = {
        sabor: 'Clásica Tres Leches',
        tamano: '1/4 (10 porciones)',
        precio: 45000,
        diseno: 'Diseño Tradicional',
        disenoImg: '',
        mensaje: '',
        date: '',
        time: '',
        extras: {}
    };

    // Calcular precios según sabor predeterminado
    const prices = getCakePrices(wizardData.sabor);
    updateSizePrices(prices);
    wizardData.precio = prices[wizardData.tamano] || 45000;

    // Seleccionar visualmente primera tarjeta de sabor
    document.querySelectorAll('.wizard-flavor-grid .flavor-card').forEach(el => {
        if (el.getAttribute('data-flavor') === wizardData.sabor) el.classList.add('selected');
        else el.classList.remove('selected');
    });

    // Seleccionar visualmente primera tarjeta de tamaño
    document.querySelectorAll('.wizard-size-grid .size-card').forEach(el => {
        if (el.getAttribute('data-size') === wizardData.tamano) el.classList.add('selected');
        else el.classList.remove('selected');
    });

    // Reiniciar bloque de subir foto propia
    const uploadCard = document.getElementById('cardUploadCustomDesign');
    if (uploadCard) uploadCard.classList.remove('selected');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    if (uploadPlaceholder) uploadPlaceholder.style.display = 'flex';
    const uploadPreview = document.getElementById('upload-preview-block');
    if (uploadPreview) uploadPreview.style.display = 'none';
    const photoInput = document.getElementById('wizard-photo-input');
    if (photoInput) photoInput.value = '';

    // Si existen diseños en el catálogo, seleccionar el primero
    const firstDesign = document.querySelector('#cake-design-grid .design-thumb');
    if (firstDesign) {
        document.querySelectorAll('#cake-design-grid .design-thumb').forEach(d => d.classList.remove('selected'));
        firstDesign.classList.add('selected');
        const img = firstDesign.querySelector('img');
        const name = firstDesign.querySelector('div')?.innerText.trim() || 'Diseño de Catálogo';
        wizardData.diseno = name;
        if (img) wizardData.disenoImg = img.src;
    }

    // Reiniciar campos del paso 4
    const msgInput = document.getElementById('w-message');
    if (msgInput) msgInput.value = '';
    const dateInput = document.getElementById('w-date');
    if (dateInput) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        dateInput.min = `${yyyy}-${mm}-${dd}`;
        dateInput.value = '';
    }
    const timeInput = document.getElementById('w-time');
    if (timeInput) timeInput.value = '';
    const topperBox = document.getElementById('extra-topper');
    if (topperBox) topperBox.checked = false;
    const velaBox = document.getElementById('extra-vela');
    if (velaBox) velaBox.checked = false;
    const errDiv = document.getElementById('w-error');
    if (errDiv) errDiv.style.display = 'none';

    goToWizardStep(1);
    updateWizardSummary();

    if (typeof window.renderConfigTortasPublica === 'function') {
        window.renderConfigTortasPublica();
    }
}

function closeWizard() {
    const modal = document.getElementById('modal-evento-personalizado');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

function getCakePrices(sabor) {
    let prices = { '1/4 (10 porciones)': 45000, '1/2 (20 porciones)': 75000, '1 Libra (30 porciones)': 130000 };

    if (window.dt_tortas_config && window.dt_tortas_config.preciosPorSabor) {
        const config = window.dt_tortas_config.preciosPorSabor;
        let s = 'tresleches';
        if (sabor && sabor.includes('Ponqué')) s = 'ponque';
        if (sabor && sabor.includes('Chocoarequipe')) s = 'chocoarequipe';

        if (config[s]) {
            prices['1/4 (10 porciones)'] = config[s].q;
            prices['1/2 (20 porciones)'] = config[s].m;
            prices['1 Libra (30 porciones)'] = config[s].l;
        }
    } else if (window.dt_tortas_config && window.dt_tortas_config.precios) {
        prices['1/4 (10 porciones)'] = window.dt_tortas_config.precios['1/4'];
        prices['1/2 (20 porciones)'] = window.dt_tortas_config.precios['1/2'];
        prices['1 Libra (30 porciones)'] = window.dt_tortas_config.precios['1'];
    }
    return prices;
}

function updateSizePrices(prices) {
    const p14 = document.getElementById('torta-precio-1-4');
    if (p14 && prices['1/4 (10 porciones)']) p14.innerText = `$${prices['1/4 (10 porciones)'].toLocaleString('es-CO')} COP`;

    const p12 = document.getElementById('torta-precio-1-2');
    if (p12 && prices['1/2 (20 porciones)']) p12.innerText = `$${prices['1/2 (20 porciones)'].toLocaleString('es-CO')} COP`;

    const p11 = document.getElementById('torta-precio-1-1');
    if (p11 && prices['1 Libra (30 porciones)']) p11.innerText = `$${prices['1 Libra (30 porciones)'].toLocaleString('es-CO')} COP`;
}

function selectSaborCard(sabor, element) {
    wizardData.sabor = sabor;
    document.querySelectorAll('.wizard-flavor-grid .flavor-card').forEach(el => el.classList.remove('selected'));
    if (element) element.classList.add('selected');

    const prices = getCakePrices(sabor);
    updateSizePrices(prices);

    if (wizardData.tamano && prices[wizardData.tamano]) {
        wizardData.precio = prices[wizardData.tamano];
    } else {
        wizardData.precio = prices['1/4 (10 porciones)'] || 45000;
    }

    updateWizardSummary();
}

// Alias para compatibilidad con control-roles.js
function selectSabor(sabor, element) {
    selectSaborCard(sabor, element);
}

function selectTamanoCard(tamano, element) {
    wizardData.tamano = tamano;
    document.querySelectorAll('.wizard-size-grid .size-card').forEach(el => el.classList.remove('selected'));
    if (element) element.classList.add('selected');

    const prices = getCakePrices(wizardData.sabor);
    if (prices[tamano]) {
        wizardData.precio = prices[tamano];
    }

    updateWizardSummary();
}

// Alias para compatibilidad
function selectTamano(element) {
    const tamano = element.getAttribute('data-size');
    selectTamanoCard(tamano, element);
}

function selectDisenoCard(diseno, imgUrl, element) {
    wizardData.diseno = diseno;
    wizardData.disenoImg = imgUrl || '';

    // Quitar selección de foto personalizada si la hubiera
    const uploadCard = document.getElementById('cardUploadCustomDesign');
    if (uploadCard) uploadCard.classList.remove('selected');

    // Seleccionar miniatura
    document.querySelectorAll('.wizard-design-grid .design-thumb').forEach(el => el.classList.remove('selected'));
    if (element) element.classList.add('selected');

    updateWizardSummary();
}

// Alias para compatibilidad con control-roles.js
function selectDiseno(diseno, element) {
    const imgEl = element ? element.querySelector('img') : null;
    const imgUrl = imgEl ? imgEl.src : '';
    selectDisenoCard(diseno, imgUrl, element);
}

function handleWizardCustomPhoto(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            wizardData.diseno = 'Diseño Propio (Foto Cliente)';
            wizardData.disenoImg = e.target.result;

            const uploadCard = document.getElementById('cardUploadCustomDesign');
            if (uploadCard) uploadCard.classList.add('selected');

            const placeholder = document.getElementById('upload-placeholder');
            if (placeholder) placeholder.style.display = 'none';

            const preview = document.getElementById('upload-preview-block');
            if (preview) preview.style.display = 'flex';

            const previewImg = document.getElementById('upload-preview-img');
            if (previewImg) previewImg.src = e.target.result;

            const nameEl = document.getElementById('upload-file-name');
            if (nameEl) nameEl.innerText = file.name;

            // Desmarcar miniaturas del catálogo
            document.querySelectorAll('.wizard-design-grid .design-thumb').forEach(el => el.classList.remove('selected'));

            if (typeof showToast === 'function') showToast("Foto de diseño cargada correctamente", "📸");
            updateWizardSummary();
        };
        reader.readAsDataURL(file);
    }
}

function toggleWizardExtra(name, price, checked) {
    if (!wizardData.extras) wizardData.extras = {};
    if (checked) {
        wizardData.extras[name] = price;
    } else {
        delete wizardData.extras[name];
    }
    updateWizardSummary();
}

function saveWizardField(field, value) {
    wizardData[field] = value;
    updateWizardSummary();
}

function updateWizardSummary() {
    const summaryBadge = document.getElementById('wizard-summary-badge');
    const summaryTotal = document.getElementById('wizard-summary-total');

    let extrasTotal = 0;
    if (wizardData.extras) {
        Object.values(wizardData.extras).forEach(p => extrasTotal += (Number(p) || 0));
    }

    const basePrice = Number(wizardData.precio) || 45000;
    const grandTotal = basePrice + extrasTotal;

    if (summaryBadge) {
        const tShort = (wizardData.tamano || '1/4').split(' ')[0];
        const sShort = (wizardData.sabor || 'Tres Leches').replace('Clásica ', '');
        summaryBadge.innerText = `${tShort} • ${sShort}`;
    }

    if (summaryTotal) {
        summaryTotal.innerText = `$${grandTotal.toLocaleString('es-CO')} COP`;
    }
}

function goToWizardStep(step) {
    if (step < 1) step = 1;
    if (step > 4) step = 4;

    // Validar pasos previos al avanzar
    if (step > 1 && !wizardData.sabor) {
        if (typeof showToast === 'function') showToast("Por favor selecciona un sabor primero.", "⚠️");
        return;
    }
    if (step > 2 && !wizardData.tamano) {
        if (typeof showToast === 'function') showToast("Por favor selecciona un tamaño.", "⚠️");
        return;
    }
    if (step > 3 && !wizardData.diseno && !wizardData.disenoImg) {
        if (typeof showToast === 'function') showToast("Por favor selecciona un diseño o sube una foto.", "⚠️");
        return;
    }

    currentWizardStep = step;

    for (let i = 1; i <= 4; i++) {
        const panel = document.getElementById(`wizard-panel-${i}`);
        if (panel) {
            if (i === step) {
                panel.style.display = 'block';
                panel.classList.add('active');
            } else {
                panel.style.display = 'none';
                panel.classList.remove('active');
            }
        }

        const nav = document.getElementById(`step-nav-${i}`);
        if (nav) {
            nav.classList.remove('active', 'completed');
            if (i === step) nav.classList.add('active');
            else if (i < step) nav.classList.add('completed');
        }

        if (i < 4) {
            const conn = document.getElementById(`step-conn-${i}`);
            if (conn) {
                if (i < step) conn.classList.add('completed');
                else conn.classList.remove('completed');
            }
        }
    }

    const body = document.querySelector('.wizard-body');
    if (body) body.scrollTo({ top: 0, behavior: 'smooth' });

    const btnPrev = document.getElementById('btnWizardPrev');
    const btnNext = document.getElementById('btnWizardNext');
    const btnSubmit = document.getElementById('btnWizardSubmit');

    if (btnPrev) btnPrev.style.display = (step === 1) ? 'none' : 'inline-flex';
    if (btnNext) btnNext.style.display = (step === 4) ? 'none' : 'inline-flex';
    if (btnSubmit) btnSubmit.style.display = (step === 4) ? 'inline-flex' : 'none';

    updateWizardSummary();
}

function navWizardStep(delta) {
    goToWizardStep(currentWizardStep + delta);
}

function validateWizardDateNew(val) {
    if (!val) {
        wizardData.date = '';
        return;
    }
    const selected = new Date(val + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = selected.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
        if (typeof showToast === 'function') {
            showToast("Por favor selecciona una fecha con al menos 24 horas de anticipación.", "⏱️");
        } else {
            alert("Por favor selecciona una fecha con al menos 24 horas de anticipación.");
        }
        document.getElementById('w-date').value = '';
        wizardData.date = '';
    } else {
        wizardData.date = val;
    }
}

function addCustomCakeToCartNew() {
    const errDiv = document.getElementById('w-error');
    if (errDiv) errDiv.style.display = 'none';

    if (!wizardData.sabor) return showToast("Por favor selecciona un sabor.", "⚠️");
    if (!wizardData.tamano) return showToast("Por favor selecciona un tamaño.", "⚠️");
    if (!wizardData.diseno) return showToast("Por favor selecciona un diseño o sube una foto.", "⚠️");

    if (!wizardData.date || !wizardData.time) {
        if (errDiv) {
            errDiv.innerText = "⚠️ Por favor completa la fecha de entrega y el horario preferido.";
            errDiv.style.display = 'block';
        }
        const dateInput = document.getElementById('w-date');
        if (dateInput && !wizardData.date) {
            dateInput.style.border = '2px solid #ef4444';
            setTimeout(() => dateInput.style.border = '1px solid #cbd5e1', 3000);
            dateInput.focus();
        }
        const timeInput = document.getElementById('w-time');
        if (timeInput && !wizardData.time) {
            timeInput.style.border = '2px solid #ef4444';
            setTimeout(() => timeInput.style.border = '1px solid #cbd5e1', 3000);
        }
        return;
    }

    let extrasTotal = 0;
    const extrasList = [];
    if (wizardData.extras) {
        for (const [k, v] of Object.entries(wizardData.extras)) {
            if (v > 0) {
                extrasTotal += v;
                extrasList.push(k === 'topper' ? 'Topper Acrílico (+$8.000)' : (k === 'vela' ? 'Vela Especial (+$3.000)' : `${k} (+$${v.toLocaleString()})`));
            }
        }
    }

    const basePrice = Number(wizardData.precio) || 45000;
    const finalPrice = basePrice + extrasTotal;

    const extrasDesc = extrasList.length > 0 ? extrasList.join(', ') : 'Ninguno';
    const descText = `${wizardData.tamano} • Sabor: ${wizardData.sabor} • Diseño: ${wizardData.diseno}${wizardData.mensaje ? ' • Dedicatoria: "' + wizardData.mensaje + '"' : ''}${extrasList.length > 0 ? ' • Extras: ' + extrasDesc : ''} • Entrega: ${wizardData.date} (${wizardData.time})`;

    const customProduct = {
        id: 'custom-' + Date.now(),
        name: `Torta: ${wizardData.sabor} (${wizardData.tamano.split(' ')[0]})`,
        desc: descText,
        price: finalPrice,
        img: wizardData.disenoImg || 'logo-pys.png',
        type: 'evento',
        customData: {
            sabor: wizardData.sabor,
            tamano: wizardData.tamano,
            diseno: wizardData.diseno,
            disenoImg: wizardData.disenoImg || '',
            message: wizardData.mensaje,
            mensaje: wizardData.mensaje,
            extras: { ...wizardData.extras },
            extrasDesc: extrasDesc,
            date: wizardData.date,
            time: wizardData.time,
            basePrice: basePrice,
            totalPrice: finalPrice
        }
    };

    customProduct.quantity = 1;
    cart.push(customProduct);

    saveCart();
    updateCart();
    closeWizard();
    if (typeof window.showAddToCartToast === 'function') {
        window.showAddToCartToast("Torta Personalizada", 1);
    } else if (typeof showToast === 'function') {
        showToast("¡Torta de celebración agregada a tu carrito!", "🎂");
    }

    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.style.transition = 'transform 0.3s ease';
        cartBtn.style.transform = 'scale(1.3)';
        setTimeout(() => cartBtn.style.transform = 'scale(1)', 300);
    }
    const mobCartBadge = document.getElementById('bnCarrito');
    if (mobCartBadge) {
        mobCartBadge.style.transition = 'transform 0.3s ease';
        mobCartBadge.style.transform = 'scale(1.3)';
        setTimeout(() => mobCartBadge.style.transform = 'scale(1)', 300);
    }

    const cartModal = document.getElementById('cartModal');
    if (cartModal && cartModal.style.display !== 'flex' && typeof toggleCart === 'function') {
        toggleCart();
    }
}

// Exponer funciones en window para acceso global directo
window.openWizard = openWizard;
window.closeWizard = closeWizard;
window.goToWizardStep = goToWizardStep;
window.navWizardStep = navWizardStep;
window.selectSaborCard = selectSaborCard;
window.selectSabor = selectSabor;
window.selectTamanoCard = selectTamanoCard;
window.selectTamano = selectTamano;
window.selectDisenoCard = selectDisenoCard;
window.selectDiseno = selectDiseno;
window.handleWizardCustomPhoto = handleWizardCustomPhoto;
window.toggleWizardExtra = toggleWizardExtra;
window.saveWizardField = saveWizardField;
window.validateWizardDateNew = validateWizardDateNew;
window.addCustomCakeToCartNew = addCustomCakeToCartNew;

// ===== LISTENER CLUB PUNTOS & VIP (SALTO INMEDIATO) =====
window.addEventListener('DOMContentLoaded', () => {
    if (typeof renderRewards === 'function') renderRewards();
    if (typeof window.initGoogleSignIn === 'function') window.initGoogleSignIn();
    const navClubBtn = document.getElementById('nav-club-puntos');
    if (navClubBtn) {
        navClubBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openPointsModal();
        });
    }
});