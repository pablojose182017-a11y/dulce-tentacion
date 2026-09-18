const PHONE = "573229512693";

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
            { id: 12, name: "Porción Torta Chocolate Húmeda", price: 4000, cat: "pasteleria", img: "img/torta-chocolate.jpg", desc: "Rellena de chocolate húmedo especial" },
            { id: 13, name: "Combo Desayuno Tentación", price: 5500, cat: "combos", img: "img/combo-desayuno.jpg", desc: "Café con leche + 2 panes cascarita + galleta" },
            { id: 15, name: "👑 Caja VIP 'Dulce Despertar'", price: 25000, cat: "combos", img: "img/caja-vip.jpg", desc: "Surtido especial en caja de regalo artesanal" },
          
            // --- EVENTOS Y FIESTAS (PRECIO BASE) ---
            { id: 101, name: "Combo Compartir Familiar (25 und)", price: 50000, cat: "eventos", img: "img/combo-25.jpg", desc: "Pasabocas surtidos con relleno a elección", unidades: 25, permiteRelleno: true },
            { id: 102, name: "Combo Oficina & Fiesta (50 und)", price: 100000, cat: "eventos", img: "img/combo-50.jpg", desc: "Ideal para reuniones y eventos corporativos", unidades: 50, permiteRelleno: true },
            { id: 103, name: "Combo Gran Gala & Evento (100 und)", price: 200000, cat: "eventos", img: "img/combo-100.jpg", desc: "Bandeja para grandes celebraciones", unidades: 100, permiteRelleno: true },
            { id: 106, name: "Rosca Navideña Trenzada", price: 48000, cat: "eventos", img: "img/rosca-navidena.jpg", desc: "Tradicional trenza navideña con frutas y glaseado", unidades: 1, permiteRelleno: false }
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
        let orderSoundEnabled = false;
        let lastOrderCount = 0;

        // ===== INIT =====
        window.addEventListener('DOMContentLoaded', () => {
            try { const c = localStorage.getItem('dt_cart'); if (c) cart = JSON.parse(c); } catch (e) { }
            try { const u = localStorage.getItem('dt_user'); if (u) currentUser = JSON.parse(u); } catch (e) { }
            try { const a = localStorage.getItem('dt_admin_config'); if (a) adminConfig = JSON.parse(a); } catch (e) { }
            try { const p = localStorage.getItem('dt_pedidos_historial'); if (p) pedidosHistorial = JSON.parse(p); } catch (e) { }
            try { const s = localStorage.getItem('dt_sound_enabled'); if (s) orderSoundEnabled = (s === 'true'); } catch (e) { }
            
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
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.bottom-nav-btn').forEach(b => b.classList.remove('active'));

            const el = document.getElementById(id);
            if (el) el.classList.add('active');
            if (element && element.classList && element.classList.contains('nav-link')) element.classList.add('active');

            // Sync bottom nav
            const bnMap = { inicio: 'bnInicio', productos: 'bnProductos', nosotros: 'bnNosotros', ubicacion: 'bnUbicacion' };
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
        function openAuthModal() { document.getElementById('authModal').style.display = 'flex'; }
        function closeAuthModal() {
            document.getElementById('authModal').style.display = 'none';
            const msgEl = document.getElementById('authMsg');
            if (msgEl) {
                msgEl.style.display = 'none';
                msgEl.className = 'auth-msg';
            }
            document.querySelectorAll('.custom-form input').forEach(inp => inp.value = '');
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
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const pass = document.getElementById('loginPassword').value.trim();

            if (!email || !pass) {
                return showAuthMessage('Por favor, completa todos los campos.', 'error');
            }

            const localUsers = JSON.parse(localStorage.getItem('dt_users_db')) || db_users;
            const user = localUsers.find(u => (u.email.trim().toLowerCase() === email || (u.username && u.username.trim().toLowerCase() === email)) && u.password === pass);
            if (!user) {
                return showAuthMessage('Usuario o contraseña incorrectos.', 'error');
            }
            if (user.blocked) {
                return showAuthMessage('⛔ Tu cuenta ha sido suspendida por incumplimiento de políticas.', 'error');
            }

            loginUserObj(user);
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

            if (db_users.find(u => u.email === email)) {
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

        const pointRewards = [
            { id: 'r1', name: 'Hojaldre de Bocadillo y Queso', cost: 1000, img: 'logo-pys.png' },
            { id: 'r2', name: 'Hojaldre de Pollo', cost: 2000, img: 'logo-pys.png' },
            { id: 'r3', name: 'Hojaldre de Pollo, Jamón y Queso', cost: 3000, img: 'logo-pys.png' }
        ];

        function openPointsModal() {
            if (!currentUser) {
                openAuthModal();
                return;
            }
            const modal = document.getElementById('modal-puntos');
            if (modal) {
                modal.style.display = 'flex';
                document.getElementById('modal-ticket-val').innerText = currentUser.points || 0;
                
                const container = document.getElementById('rewards-container');
                container.innerHTML = pointRewards.map(r => {
                    const canRedeem = (currentUser.points || 0) >= r.cost;
                    return `
                    <div class="ticket-card">
                        <img src="${r.img}" alt="${r.name}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #f59e0b;">
                        <div class="ticket-card-info" style="flex: 1;">
                            <h4>${r.name}</h4>
                            <p>🎟️ ${r.cost} Pts</p>
                        </div>
                        <button class="btn-redeem" ${canRedeem ? `onclick="redeemReward('${r.id}')"` : 'disabled'}>
                            ${canRedeem ? 'Canjear premio' : `Te faltan ${r.cost - (currentUser.points || 0)} pts`}
                        </button>
                    </div>
                    `;
                }).join('');
            }
        }

        function redeemReward(rewardId) {
            const reward = pointRewards.find(x => x.id === rewardId);
            if (!reward || !currentUser || (currentUser.points || 0) < reward.cost) return;
            
            currentUser.points -= reward.cost;
            const uidx = db_users.findIndex(u => u.email === currentUser.email);
            if (uidx !== -1) { db_users[uidx].points = currentUser.points; saveUsersDB(); }
            saveUser();
            syncUserUI();
            
            cart.push({
                id: Date.now(),
                name: '🎁 Cortesía: ' + reward.name,
                price: 0,
                quantity: 1,
                cat: 'cortesia',
                tag: '¡Canjeado!',
                img: reward.img
            });
            saveCart();
            updateCart();
            
            document.getElementById('modal-puntos').style.display = 'none';
            showToast("¡Premio canjeado! Revisa tu carrito 🎉", "🎊");
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
                            <strong>Pedido #${pedido.id || Math.floor(Math.random()*9000 + 1000)}</strong>
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
                        <img src="${p.img}" alt="${p.name}" style="width:40px; height:40px; border-radius:6px; object-fit:cover; ${isOut ? 'filter:grayscale(100%); opacity:0.5;' : ''}">
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
                        <option value="regular" ${currentRoleVal==='regular'?'selected':''}>Cliente Regular</option>
                        <option value="vip" ${currentRoleVal==='vip'?'selected':''}>⭐ Cliente VIP</option>
                        <option value="cocina" ${currentRoleVal==='cocina'?'selected':''}>👨‍🍳 Equipo de Cocina</option>
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
        }

        function updateUserRole(email, role) {
            const u = db_users.find(x => x.email === email);
            if(!u) return;

            u.vip = false;
            workerEmails = workerEmails.filter(e => e !== email);
            adminEmails = adminEmails.filter(e => e !== email);

            if (role === 'vip') u.vip = true;
            if (role === 'cocina') workerEmails.push(email);
            if (role === 'admin') adminEmails.push(email);

            saveUsersDB();
            saveAdminEmails(); // Guarda workerEmails y adminEmails
            
            if (currentUser && currentUser.email === email) {
                currentUser.vip = u.vip;
                saveUser();
                updateUserUI();
            }

            renderKitchenUsers();
            showToast(`Rol de ${u.name} actualizado a ${role}`, "✅");
        }

        function updateUserPoints(email, change) {
            const u = db_users.find(x => x.email === email);
            if(!u) return;

            if(!u.points) u.points = 0;
            u.points += change;
            if(u.points < 0) u.points = 0;

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
            const email = payload.email;
            const name = payload.name;
            const picture = payload.picture;

            let user = db_users.find(u => u.email === email);
            if (user && user.blocked) {
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
                    vip: false
                };
                db_users.push(user);
            } else {
                user.name = name;
                user.picture = picture;
                // No sobreescribe puntos ni rol
            }
            saveUsersDB();
            loginUserObj(user);
        }

        function handleMobilePillClick() {
            if (currentUser) document.getElementById('mobileProfileModal').style.display = 'flex';
            else openAuthModal();
        }
        function closeMobileProfile() { document.getElementById('mobileProfileModal').style.display = 'none'; }
        function handleMobileProfileBdrop(e) { if (e.target === document.getElementById('mobileProfileModal')) closeMobileProfile(); }

        let db_users = [];
        const ADMIN_EMAILS = [
            'pablojose182017@gmail.com',
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
            
            // 2. Función de migración / sincronización automática
            if (currentUser && currentUser.email) {
                const normEmail = currentUser.email.toLowerCase().trim();
                let existingUser = db_users.find(u => u.email === normEmail);
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
                
                // Forzar rol de admin si está en la whitelist
                if (ADMIN_EMAILS.includes(normEmail)) {
                    existingUser.role = 'admin';
                    existingUser.isAdmin = true;
                    if (!adminEmails.includes(normEmail)) adminEmails.push(normEmail);
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
            currentUser = userObj;
            saveUser(); syncUserUI(); closeAuthModal();
            const orderName = document.getElementById('orderName');
            if (orderName && !orderName.value) orderName.value = currentUser.name;
            const firstName = currentUser.name.split(' ')[0];
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
            if (!confirm(`¿Estás seguro de que deseas eliminar el correo ${email}?`)) return;
            db_users = db_users.filter(u => u.email !== email);
            saveUsersDB();
            renderAdminUsers();
            showToast('Cliente eliminado', '🗑️');
        }

        function adminToggleVIP(email) {
            const u = db_users.find(x => x.email === email);
            if (!u) return;
            u.vip = !u.vip;
            saveUsersDB(); renderAdminUsers();
            if (currentUser && currentUser.email === email) { currentUser.vip = u.vip; saveUser(); syncUserUI(); updateCart(); }
            showToast(u.vip ? 'Membresía VIP activada' : 'Membresía VIP retirada', '👑');
        }

        function adminToggleBlock(email) {
            const u = db_users.find(x => x.email === email);
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

        // ===== PEDIDOS: ALERTAS Y FECHA =====
        function toggleOrderSound() {
            orderSoundEnabled = document.getElementById('soundToggle').checked;
            try { localStorage.setItem('dt_sound_enabled', orderSoundEnabled.toString()); } catch(e) {}
            if (orderSoundEnabled) playChime();
        }

        function playChime() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const o1 = ctx.createOscillator();
                const o2 = ctx.createOscillator();
                const g = ctx.createGain();
                
                o1.type = 'sine'; o2.type = 'sine';
                o1.frequency.setValueAtTime(523.25, ctx.currentTime);
                o2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
                
                g.gain.setValueAtTime(0, ctx.currentTime);
                g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
                
                o1.connect(g); o2.connect(g); g.connect(ctx.destination);
                o1.start(ctx.currentTime); o1.stop(ctx.currentTime + 1.5);
                o2.start(ctx.currentTime + 0.15); o2.stop(ctx.currentTime + 1.65);
            } catch(e) { console.log('Audio API no soportada', e); }
        }

        function checkNewOrders() {
            try {
                const p = localStorage.getItem('dt_pedidos_historial');
                if (p) {
                    const parsed = JSON.parse(p);
                    if (parsed.length > lastOrderCount) {
                        const newOrders = parsed.slice(lastOrderCount);
                        pedidosHistorial = parsed;
                        lastOrderCount = parsed.length;
                        
                        if (orderSoundEnabled) playChime();
                        const lastO = newOrders[newOrders.length - 1];
                        showOrderToast(lastO.customer || 'Cliente');
                        
                        const adminSect = document.getElementById('admin-dashboard');
                        if (adminSect && adminSect.classList.contains('active')) {
                            renderLiveOrders();
                            renderAdminDashboard();
                        }
                    } else if (parsed.length !== pedidosHistorial.length) {
                        // Resincronizar en caso de borrado desde otro tab
                        pedidosHistorial = parsed;
                        lastOrderCount = parsed.length;
                    }
                }
            } catch (e) {}
        }

        function showOrderToast(name) {
            const t = document.getElementById('orderToast');
            if(!t) return;
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
                if(el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 100;
                    window.scrollTo({top: y, behavior: 'smooth'});
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
                        📞 <a href="https://wa.me/57${p.phone.replace(/[^0-9]/g,'')}" target="_blank" style="color:#25D366; text-decoration:none;">${p.phone}</a><br>
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
            if(el) el.classList.add('active');
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
                return `
                <div style="flex: 1 1 calc(33% - 10px); min-width: 140px; background:#fff; border:1px solid ${isOut ? '#fecdd3' : '#bbf7d0'}; border-radius:10px; padding:10px; display:flex; flex-direction:column; align-items:center; text-align:center; gap:8px;">
                    <img src="${p.img}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; opacity:${isOut ? '0.5' : '1'}; filter:${isOut ? 'grayscale(100%)' : 'none'};">
                    <strong style="font-size:0.85rem; line-height:1.2;">${p.name}</strong>
                    <button onclick="toggleStock(${p.id})" style="width:100%; padding:8px; border-radius:6px; font-weight:bold; font-size:0.8rem; cursor:pointer; border:none; color:#fff; background:${isOut ? '#e11d48' : '#10b981'}; transition:all 0.2s;">
                        ${isOut ? '❌ Agotado' : '✅ Disponible'}
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
            if(el) el.classList.add('active');
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
                if(!matchSearch) return false;

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
                const isUserAdmin = adminEmails.includes(u.email);
                const isUserWorker = workerEmails.includes(u.email);

                let levelHtml = '';
                if (isUserAdmin) {
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
                                <option value="normal" ${!isUserAdmin && !isUserWorker && !u.vip ? 'selected' : ''}>Normal</option>
                                <option value="vip" ${u.vip && !isUserAdmin && !isUserWorker ? 'selected' : ''}>VIP</option>
                                <option value="trabajador" ${isUserWorker ? 'selected' : ''}>Trabajador</option>
                                <option value="admin" ${isUserAdmin ? 'selected' : ''}>Admin</option>
                            </select>
                            <button onclick="confirmRoleChange('${u.email}')" style="background:var(--brand-pink); color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;">Guardar</button>
                        </div>
                        ${(u.password !== undefined) ? `<button onclick="adminChangePassword('${u.email}')" style="background:#f3f4f6; color:#4b5563; border:1px solid #d1d5db; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; width:100%;">🔑 Cambiar Clave</button>` : ''}
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
            const selectEl = document.getElementById(`roleSel_${email.replace(/[@.]/g, '_')}`);
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
            if (email === 'dulcestentaciones2004@gmail.com') return;
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
            if (email === 'dulcestentaciones2004@gmail.com') return;
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

            const newUser = {
                name: name,
                email: email,
                password: pass,
                phone: '',
                address: '',
                points: 15,
                history: [],
                picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d81b60&color=fff&bold=true`,
                vip: false,
                blocked: false
            };

            db_users.push(newUser);
            saveUsersDB();

            if (role === 'trabajador' && !workerEmails.includes(email)) {
                workerEmails.push(email);
                saveAdminEmails();
            } else if (role === 'admin' && !adminEmails.includes(email)) {
                adminEmails.push(email);
                saveAdminEmails();
            }

            renderAdminUsers();
            showToast(`Usuario ${name} registrado como ${role}`, '✅');

            if(document.getElementById('adminNewName')) document.getElementById('adminNewName').value = '';
            if(document.getElementById('adminNewEmail')) document.getElementById('adminNewEmail').value = '';
            if(document.getElementById('adminNewPassword')) document.getElementById('adminNewPassword').value = '';
            if(document.getElementById('adminNewRole')) document.getElementById('adminNewRole').value = 'cliente';
        }

        function confirmAdminPasswordChange() {
            if(!userToChangePassword) return;
            const newPassword = document.getElementById('adminNewPasswordInput').value.trim();
            
            if(!newPassword) {
                return showToast('Por favor escribe una contraseña válida', '❌');
            }
            
            userToChangePassword.password = newPassword;
            localStorage.setItem('dt_users_db', JSON.stringify(db_users));
            
            document.getElementById('adminPasswordModal').style.display = 'none';
            alert("✅ Contraseña actualizada exitosamente. El usuario ya puede iniciar sesión con su nueva clave.");
            userToChangePassword = null;
        }

        function logoutUser(e) {
            e.stopPropagation();
            currentUser = null; saveUser(); syncUserUI();
            document.getElementById('user-dropdown-menu')?.classList.remove('active');
            showToast("Sesión cerrada.", 'ℹ️');
        }

        function syncUserUI() {
            const loginBtn = document.getElementById('btn-google-login');
            const pill = document.getElementById('user-pill-container');
            const mobileGoogleBtn = document.getElementById('mobile-google-btn');
            const mobilePill = document.getElementById('mobile-user-pill');
            const hIncentive = document.getElementById('hero-login-incentive');
            const cIncentive = document.getElementById('cartLoginIncentive');

            if (currentUser) {
                if (loginBtn) loginBtn.style.display = 'none';

                const isVip = currentUser.vip;
                const vipLabel = isVip ? ' (VIP)' : '';
                const vipColor = isVip ? '#d97706' : '';

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

                    const firstName = currentUser.name.split(' ')[0];
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
                    
                    const vipHeaderBadge = document.getElementById('vip-header-badge');
                    if (vipHeaderBadge) {
                        vipHeaderBadge.style.display = isVip ? 'inline-flex' : 'none';
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

                const vipHtml = currentUser.vip
                    ? `<div class="vip-card-golden"><strong>👑 Membresía VIP Mensual Activa</strong> • 5% Dcto Preferencial</div>`
                    : `<button class="vip-upgrade-btn" onclick="openVipModal()">✨ Pasar a VIP Oro</button>`;

                const dArea = document.getElementById('vip-dropdown-area-desk');
                if (dArea) dArea.innerHTML = vipHtml;
                const mArea = document.getElementById('vip-dropdown-area-mob');
                if (mArea) mArea.innerHTML = vipHtml;
                const on = document.getElementById('orderName'); if (on && !on.value) on.value = currentUser.name;
                if (hIncentive) hIncentive.style.display = 'none';
                if (cIncentive) cIncentive.style.display = 'none';

                const isAdmin = adminEmails.includes(currentUser.email);
                const isWorker = workerEmails.includes(currentUser.email);
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
            }
        }

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


        window.updateProductPrice = function(productId, param) {
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
                <img src="${p.img}" alt="${p.name}" class="pimg-${p.id}" loading="lazy" onerror="console.error('Error al cargar imagen:', this.src); this.onerror=null; this.src='logo-pys.png';">
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
                        <input type="number" class="qty-input qinp-${p.id}" id="qty-${p.id}" value="1" min="1" onblur="validateQty(this)">
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
                let v = parseInt(inp.value) || 1; v += d; if (v < 1) v = 1; inp.value = v;
            });
        }
        function validateQty(inp) { if (isNaN(parseInt(inp.value)) || parseInt(inp.value) < 1) inp.value = 1; }

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
            showToast(`¡${qty}x ${p.name} al carrito!`, '🥐');
        }

        function updateQty(cartId, delta) {
            const item = cart.find(x => (x.cartId || x.id) == cartId);
            if (!item) return;
            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(x => (x.cartId || x.id) != cartId);
            }
            updateCart();
            saveCart();
        }
        function setItemQty(cartId, val) {
            const item = cart.find(x => (x.cartId || x.id) == cartId);
            if (!item) return;
            const nv = parseInt(val);
            item.quantity = isNaN(nv) || nv < 1 ? 1 : nv;
            updateCart();
            saveCart();
        }
        function removeCartItem(cartId) {
            cart = cart.filter(x => (x.cartId || x.id) != cartId);
            updateCart();
            saveCart();
            showToast("Producto eliminado.", "🗑️");
        }

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

                if(cartContent) {
                    if (currentUser.vip) cartContent.classList.add('cart-vip-mode');
                    else cartContent.classList.remove('cart-vip-mode');
                }

                if (discount > adminConfig.maxDiscount) discount = adminConfig.maxDiscount;

                if (currentUser.vip) {
                    if (dRow) { dRow.style.display = 'flex'; document.getElementById('discountLabel').innerText = 'Descuento VIP Oro:'; document.getElementById('sumDiscount').innerText = `- $${discount.toLocaleString()} COP`; }
                    if (pRow) pRow.style.display = 'block';
                } else {
                    if (dRow) { dRow.style.display = 'flex'; document.getElementById('discountLabel').innerText = 'Descuento Base:'; document.getElementById('sumDiscount').innerText = `- $${discount.toLocaleString()} COP`; }
                    if (pRow) pRow.style.display = 'none';
                }
            } else {
                if(cartContent) cartContent.classList.remove('cart-vip-mode');
                if (dRow) dRow.style.display = 'none';
                if (pRow) pRow.style.display = 'none';
            }
            const finalTotal = totalPrice - discount;
            
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
                    document.getElementById('sumDeposit').innerText = `$${deposit.toLocaleString()} COP`;
                }
                if (balanceRow) {
                    balanceRow.style.display = 'flex';
                    document.getElementById('sumBalance').innerText = `$${balance.toLocaleString()} COP`;
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
                    t = `¡Ganarás +20 puntos! Agrega $${(100000 - totalPrice).toLocaleString()} más para ganar 30 pts.`;
                } else if (totalPrice >= 10000) {
                    t = `¡Ganarás +10 puntos! Agrega $${(50000 - totalPrice).toLocaleString()} más para ganar 20 pts.`;
                } else if (totalPrice > 0) {
                    t = `Agrega $${(10000 - totalPrice).toLocaleString()} más para empezar a ganar puntos.`;
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
            document.getElementById('sumTotal').innerText = finalTotal.toLocaleString();
            const ci = document.getElementById('cartItems');
            const cs = document.getElementById('cartSummary');
            const cc = document.getElementById('checkoutCard');
            const bw = document.querySelector('.btn-whatsapp');
            if (cart.length === 0) {
                ci.innerHTML = `<div class="empty-cart-view" style="display:flex; flex-direction:column; gap:12px; align-items:center; text-align:center; padding: 20px 10px;"><span>🥖</span><strong style="display:block;color:var(--text-dark);margin-bottom:5px;">Tu carrito está vacío</strong><p style="font-size:0.85rem; color:#64748b; margin-bottom:12px;">¡Agrega panes, hojaldres o tortas para hacer tu pedido!</p><button type="button" onclick="toggleCart(); goToCatalog();" style="background:#f3f4f6; color:#4b5563; border:none; padding:10px 20px; border-radius:var(--r-full); font-weight:bold; cursor:pointer; width:100%; transition:all 0.2s;">Ver Catálogo</button></div>`;
                cs.style.display = 'none'; if (cc) cc.style.display = 'none'; bw.style.display = 'none';
            } else {
                cs.style.display = 'block'; cs.style.opacity = '1'; if (cc) cc.style.display = 'flex'; bw.style.display = 'flex'; bw.style.opacity = '1'; bw.style.pointerEvents = 'auto';
                ci.innerHTML = cart.map(item => {
                    const cid = item.cartId || item.id;
                    return `
                <div class="cart-item-row">
                    <img src="${item.img}" class="cart-item-img" alt="${item.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toLocaleString()} c/u • <strong>$${(item.price * item.quantity).toLocaleString()} COP</strong></div>
                    </div>
                    <div class="cart-item-actions">
                        <button onclick="updateQty('${cid}', -1)">−</button>
                        <input type="number" value="${item.quantity}" min="1" onchange="setItemQty('${cid}', this.value)">
                        <button onclick="updateQty('${cid}', 1)">+</button>
                        <button class="btn-delete-item" onclick="removeCartItem('${cid}')"><svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg></button>
                    </div>
                </div>`;
                }).join('');
            }
        }

        function toggleCart() {
            const m = document.getElementById('cartModal');
            if (m.style.display === 'flex') {
                m.style.display = 'none';
                document.body.style.overflow = '';
            } else {
                m.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                goToCartStep1(); // Reset to step 1
                const addrInput = document.getElementById('orderAddress');
                if (addrInput && !addrInput.value && typeof currentUser !== 'undefined' && currentUser && currentUser.address) {
                    addrInput.value = currentUser.address;
                }
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
        }
        function handleCartBdrop(e) { if (e.target === document.getElementById('cartModal')) toggleCart(); }

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

            if (!name || !addr) return alert("Por favor, llena tu nombre y dirección.");
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
            let finalTotal = tp;

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
                finalTotal = tp - discount;

                let ptsEarned = Math.floor(tp / 1000);

                if (ptsEarned > 0) {
                    currentUser.points = (currentUser.points || 0) + ptsEarned;
                    const uidx = db_users.findIndex(u => u.email === currentUser.email);
                    if (uidx !== -1) { db_users[uidx].points = currentUser.points; saveUsersDB(); }
                    saveUser();
                    syncUserUI();
                }
            }

            // Generar Orden y Guardar en Historial
            const orderId = 'DT-' + Date.now().toString().slice(-4);
            const dateStr = new Date().toLocaleString('es-CO');
            const newOrder = {
                id: orderId,
                date: dateStr,
                customer: name,
                email: currentUser?.email || 'N/A',
                phone: currentUser?.phone || 'N/A',
                address: addr,
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
            msg += `🛵 *Dirección / Barrio:* ${addr}\n`;
            msg += `💳 *Pago:* ${selectedPay}\n`;
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
                msg += `*Subtotal:* $${tp.toLocaleString()} COP\n`;
                msg += `*Descuento ${currentUser?.vip ? 'VIP Oro' : 'Base'}:* -$${discount.toLocaleString()} COP\n`;
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

        function showToast(msg, icon = '🥐', duration = 2600) {
            const t = document.getElementById('toast');
            document.getElementById('toastMsg').innerText = msg;
            document.getElementById('toastIcon').innerText = icon;
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), duration);
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

        function openVipModal() {
            document.getElementById('vipPromoModal').style.display = 'flex';
            const m = document.getElementById('user-dropdown-menu');
            if (m) m.classList.remove('active');
            closeMobileProfile();
        }

        function closeVipModal() {
            document.getElementById('vipPromoModal').style.display = 'none';
        }

        function requestVipWhatsApp() {
            const msg = "¡Hola! Quiero activar mi Membresía VIP Oro en Dulce Tentación para acceder al 5% de descuento y los beneficios exclusivos. 👑";
            window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
        }

        // ===== ASISTENTE DE TORTAS PERSONALIZADAS =====
        let wizardData = {
            sabor: '', tamano: '', precio: 0, diseno: '',
            mensaje: '', date: '', time: ''
        };

        function openWizard() {
            document.getElementById('modal-evento-personalizado').style.display = 'flex';
            wizardData = { sabor: '', tamano: '', precio: 0, diseno: '', mensaje: '', date: '', time: '' };
            document.querySelectorAll('.step-option-card, .design-thumb').forEach(el => el.classList.remove('selected'));
            document.getElementById('w-message').value = '';
            document.getElementById('w-date').value = '';
            document.getElementById('w-time').value = '';
        }

        function closeWizard() {
            document.getElementById('modal-evento-personalizado').style.display = 'none';
        }

        const cakePrices = {
            'Ponqué Clásico': { '1/4 (10 porciones)': 35000, '1/2 (20 porciones)': 60000, '1 Libra (30 porciones)': 115000 },
            'default': { '1/4 (10 porciones)': 45000, '1/2 (20 porciones)': 75000, '1 Libra (30 porciones)': 130000 }
        };

        function selectSabor(sabor, element) {
            wizardData.sabor = sabor;
            element.parentElement.querySelectorAll('.step-option-card').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
            
            const prices = cakePrices[sabor] || cakePrices['default'];
            const sizeCards = document.querySelectorAll('#cake-size-grid .step-option-card');
            sizeCards.forEach(card => {
                const size = card.getAttribute('data-size');
                const price = prices[size];
                card.querySelector('.size-price').innerText = `$${price.toLocaleString()} COP`;
                if (wizardData.tamano === size) {
                    wizardData.precio = price;
                }
            });
        }

        function selectTamano(element) {
            const tamano = element.getAttribute('data-size');
            const prices = cakePrices[wizardData.sabor] || cakePrices['default'];
            
            wizardData.tamano = tamano;
            wizardData.precio = prices[tamano];
            
            element.parentElement.querySelectorAll('.step-option-card').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
        }

        function selectDiseno(diseno, element) {
            wizardData.diseno = diseno;
            element.parentElement.querySelectorAll('.design-thumb').forEach(el => el.classList.remove('selected'));
            element.classList.add('selected');
        }

        function saveWizardField(field, value) {
            wizardData[field] = value;
        }

        function validateWizardDateNew(val) {
            const selected = new Date(val);
            const now = new Date();
            const diffTime = selected - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 1) {
                alert("Por favor selecciona una fecha con al menos 24 horas de anticipación para poder hornear tu pedido.");
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
            if (!wizardData.diseno) return showToast("Por favor selecciona un diseño.", "⚠️");
            
            if (!wizardData.date || !wizardData.time) {
                if (errDiv) {
                    errDiv.innerText = "⚠️ Por favor selecciona la fecha de entrega y hora.";
                    errDiv.style.display = 'block';
                }
                const dateInput = document.getElementById('w-date');
                if(dateInput) { dateInput.style.border = '2px solid #ef4444'; setTimeout(()=> dateInput.style.border = '1px solid #cbd5e1', 3000); }
                const timeInput = document.getElementById('w-time');
                if(timeInput) { timeInput.style.border = '2px solid #ef4444'; setTimeout(()=> timeInput.style.border = '1px solid #cbd5e1', 3000); }
                return;
            }

            const customProduct = {
                id: 'custom-' + Date.now(),
                name: 'Torta Personalizada',
                desc: `${wizardData.tamano} | Sabor: ${wizardData.sabor} | Diseño: ${wizardData.diseno}`,
                price: wizardData.precio,
                img: 'logo_dulce_tentacion.jpg',
                type: 'evento',
                customData: { ...wizardData }
            };

            const existingIndex = cart.findIndex(i => i.id === customProduct.id);
            if (existingIndex > -1) {
                cart[existingIndex].quantity += 1;
            } else {
                customProduct.quantity = 1;
                cart.push(customProduct);
            }

            saveCart();
            updateCart();
            closeWizard();
            showToast("¡Torta de celebración agregada a tu carrito!", "🎂");
            
            const cartBtn = document.querySelector('.cart-btn');
            if(cartBtn) {
                cartBtn.style.transition = 'transform 0.3s ease';
                cartBtn.style.transform = 'scale(1.3)';
                setTimeout(() => cartBtn.style.transform = 'scale(1)', 300);
            }
            const mobCartBadge = document.getElementById('bnCarrito');
            if(mobCartBadge) {
                mobCartBadge.style.transition = 'transform 0.3s ease';
                mobCartBadge.style.transform = 'scale(1.3)';
                setTimeout(() => mobCartBadge.style.transform = 'scale(1)', 300);
            }
            
            if(document.getElementById('cartModal').style.display !== 'flex') {
                toggleCart();
            }
        }
