        const PHONE = "573133040870";

        const products = [
            { id: 1, name: "Pan Cascarita Tradicional", price: 500, cat: "panaderia", featured: true, tag: "🔥 Más Pedido", desc: "Crocante por fuera y miga suave por dentro. El rey de las mañanas cucuteñas.", img: "pan cascarita 500 pesos.jpeg" },
            { id: 2, name: "Bolita de Leche Azucarada", price: 500, cat: "antojos", featured: true, tag: "⭐ Favorito", desc: "Masa dulce y esponjosa horneada con leche fresca y toque azucarado.", img: "bolitas de leche 500 pesos.jpeg" },
            { id: 3, name: "Bolitas de Maíz", price: 500, cat: "antojos", featured: false, tag: "✨ Tradición", desc: "Pan de maíz dulce y suave, con azúcar espolvoreada encima.", img: "bolitas de maiz 500 pesos.jpeg" },
            { id: 4, name: "Bolita con Bocadillo", price: 500, cat: "antojos", featured: false, tag: "🍯 Dulce", desc: "Pan dulce relleno de delicioso bocadillo colombiano.", img: "bolita de bocadillo.jpeg" },
            { id: 5, name: "Cema Integral", price: 500, cat: "panaderia", featured: false, tag: "🌾 Saludable", desc: "Pan integral rico en fibra, ideal para desayunos nutritivos.", img: "cema integral a.jpeg" },
            { id: 6, name: "Paledonias", price: 500, cat: "antojos", featured: false, tag: "🥮 Clásico", desc: "Galleta tradicional tipo paledonia, perfecta para el café.", img: "paleedonias a 500.jpeg" },
            { id: 7, name: "Galletas Corazón (Con Mermelada)", price: 500, cat: "antojos", featured: true, tag: "💖 Amor", desc: "Galletas dulces en forma de corazón con un toque de mermelada y chispas.", img: "galletas a 500.jpeg" },
            { id: 8, name: "Pan de Maíz y de Leche", price: 1000, cat: "panaderia", featured: false, tag: "🍞 Suave", desc: "Pan grande con una combinación deliciosa de maíz y leche.", img: "pain de maiz y de leche.jpeg" },
            { id: 9, name: "Roliqueso", price: 3000, cat: "antojos", featured: true, tag: "🧀 Quesudo", desc: "Rollito suave lleno de sabor a queso.", img: "roliqueso 3000.jpeg" },
            { id: 10, name: "Pan Tajado Familiar", price: 4000, cat: "panaderia", featured: true, tag: "🥪 Desayunos", desc: "Paquete de pan tajado 100% fresco, ideal para sándwiches.", img: "pan tajado a 4000.jpeg" },
            { id: 11, name: "Croissant Jamón & Queso", price: 2500, cat: "antojos", featured: false, tag: "🥐 Hojaldrado", desc: "Hojaldre artesanal en capas crujientes, jamón tierno y queso fundido.", img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80" },
            { id: 12, name: "Porción Torta Chocolate Húmeda", price: 4000, cat: "pasteleria", featured: true, tag: "🍫 Delicia", desc: "Bizcocho súper húmedo de chocolate con ganache artesanal.", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80" },
            { id: 13, name: "Combo Desayuno Tentación", price: 5500, cat: "combos", featured: true, tag: "🎁 Ahorro 15%", desc: "1 Croissant + 2 Pan Cascarita + Café caliente. El combo perfecto.", img: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=500&q=80" },
            { id: 14, name: "Café con Leche / Capuchino 9oz", price: 2000, cat: "antojos", featured: false, tag: "☕ Caliente", desc: "Café colombiano de origen con leche espumosa preparado al instante.", img: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=500&q=80" },
            { id: 15, name: "👑 Caja VIP 'Dulce Despertar'", price: 25000, cat: "combos", featured: true, tag: "💝 Regalo Especial", desc: "2 Croissants, 2 Porciones Torta, 5 Pan Cascarita, 5 Bolitas Queso y empaque premium.", img: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=500&q=80" },
            { id: 16, name: "Bandeja x50 Bolitas de Queso", price: 25000, cat: "eventos", featured: true, tag: "🎉 Fiestas", desc: "50 bolitas de queso calienticas listas para repartir.", img: "https://images.unsplash.com/photo-1626200419189-322197e887e0?auto=format&fit=crop&w=500&q=80" },
            { id: 17, name: "Bandeja x30 Mini Hojaldres", price: 45000, cat: "eventos", featured: true, tag: "🎉 Gourmet", desc: "Mini croissants y palitos de queso ideales para pasabocas.", img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=500&q=80" },
            { id: 18, name: "Combo Cumpleaños Familiar", price: 75000, cat: "eventos", featured: false, tag: "🎂 Cumple", desc: "Torta grande, 20 pasabocas de sal y 10 mini postres.", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80" }
        ];

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
            
            lastOrderCount = pedidosHistorial.length;
            const soundTog = document.getElementById('soundToggle');
            if (soundTog) soundTog.checked = orderSoundEnabled;
            setInterval(checkNewOrders, 3000);

            renderFeatured();
            renderProducts(products);
            updateCart();
            syncUserUI();
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

            if (!name || !phone || !email || !pass) {
                return showAuthMessage('Por favor, completa todos los campos para registrarte.', 'error');
            }

            if (db_users.find(u => u.email === email)) {
                return showAuthMessage('Este correo ya está registrado. Por favor inicia sesión.', 'error');
            }

            const newUser = {
                name,
                email,
                phone,
                password: pass,
                picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=d81b60&color=fff&bold=true`,
                points: 150
            };
            db_users.push(newUser);
            saveUsersDB();
            loginUserObj(newUser);
        }

        function decodeJwtResponse(token) {
            let base64Url = token.split('.')[1];
            let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            let jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
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
                user = { name, email, picture, points: 150 };
                db_users.push(user);
            } else {
                user.name = name;
                user.picture = picture;
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
        let adminEmails = ['dulcestentaciones2004@gmail.com'];
        let workerEmails = [];
        let stockConfig = {};
        window.addEventListener('DOMContentLoaded', () => {
            try { const db = localStorage.getItem('dt_users_db'); if (db) db_users = JSON.parse(db); } catch (e) { }
            try { const adms = localStorage.getItem('dt_admin_emails'); if (adms) adminEmails = JSON.parse(adms); } catch (e) { }
            try { const wks = localStorage.getItem('dt_worker_emails'); if (wks) workerEmails = JSON.parse(wks); } catch (e) { }
            try { const stk = localStorage.getItem('dt_stock_config'); if (stk) stockConfig = JSON.parse(stk); } catch (e) { }
        });
        function saveAdminEmails() {
            if (!adminEmails.includes('dulcestentaciones2004@gmail.com')) adminEmails.push('dulcestentaciones2004@gmail.com');
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
                points: 0
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
            renderProducts();
            renderFeatured();
            showToast(stockConfig[id] ? 'Producto marcado como Agotado' : 'Producto disponible nuevamente', 'ℹ️');
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

                let levelHtml = isUserAdmin ? '<span style="color:#1d4ed8;font-weight:bold;">Administrador</span>' 
                              : (isUserWorker ? '<span style="color:#8b5cf6;font-weight:bold;">Trabajador</span>'
                              : (u.vip ? '<span style="color:#d97706;font-weight:bold;">VIP Oro</span>' : '<span style="color:#64748b;font-weight:bold;">Normal</span>'));
                
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
                        <div style="display:flex; gap:4px; width:100%; justify-content:center;">
                            <button onclick="adminToggleAdmin('${u.email}')" style="background:${isUserAdmin ? '#1e40af' : '#dbeafe'}; color:${isUserAdmin ? '#fff' : '#1e40af'}; border:1px solid #bfdbfe; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.7rem; flex:1;">Admin</button>
                            <button onclick="adminToggleWorker('${u.email}')" style="background:${isUserWorker ? '#7c3aed' : '#ede9fe'}; color:${isUserWorker ? '#fff' : '#6d28d9'}; border:1px solid #ddd6fe; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.7rem; flex:1;">Trabajador</button>
                        </div>
                        ${(u.password !== undefined) ? `<button onclick="adminChangePassword('${u.email}')" style="background:#f3f4f6; color:#4b5563; border:1px solid #d1d5db; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; width:100%;">🔑 Cambiar Clave</button>` : ''}
                        <button onclick="adminToggleVIP('${u.email}')" style="background:#fef3c7; color:#d97706; border:1px solid #fde68a; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:0.75rem; width:100%;">${u.vip ? 'Quitar VIP' : 'Hacer VIP'}</button>
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
                points: 0,
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

                const vipCrown = currentUser.vip ? '👑 ' : '';
                const vipLabel = currentUser.vip ? ' (VIP)' : '';
                const vipColor = currentUser.vip ? '#d97706' : '';

                if (pill) {
                    pill.style.display = 'flex';
                    document.getElementById('user-avatar').src = currentUser.picture;
                    const firstName = currentUser.name.split(' ')[0];
                    const uName = document.getElementById('user-name');
                    uName.innerText = `${vipCrown}Hola, ${firstName}${vipLabel}`;
                    uName.style.color = vipColor;
                    uName.style.fontWeight = currentUser.vip ? '700' : '';

                    document.getElementById('dropdown-avatar').src = currentUser.picture;
                    const dName = document.getElementById('dropdown-name');
                    dName.innerText = `${vipCrown}${currentUser.name}${vipLabel}`;
                    dName.style.color = vipColor;
                    document.getElementById('dropdown-email').innerText = currentUser.email || currentUser.phone || '';
                    if (document.getElementById('dropdown-points-val')) document.getElementById('dropdown-points-val').innerText = currentUser.points || 0;
                }
                if (mobileGoogleBtn) mobileGoogleBtn.style.display = 'none';
                if (mobilePill) {
                    mobilePill.style.display = 'flex';
                    document.getElementById('mobile-user-avatar').src = currentUser.picture;

                    const mpAv = document.getElementById('mp-avatar'); if (mpAv) mpAv.src = currentUser.picture;
                    const mpNm = document.getElementById('mp-name');
                    if (mpNm) {
                        mpNm.innerText = `${vipCrown}${currentUser.name}${vipLabel}`;
                        mpNm.style.color = vipColor;
                    }
                    const mpEm = document.getElementById('mp-email'); if (mpEm) mpEm.innerText = currentUser.email;
                    const mpPt = document.getElementById('mp-points-val'); if (mpPt) mpPt.innerText = currentUser.points || 0;
                }

                const vipHtml = currentUser.vip
                    ? `<div class="vip-card-golden"><strong>Membresía Oro VIP Activa</strong>Válida de por vida • 10% Dcto</div>`
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
                    // We change the onclick behavior in HTML to call renderLiveOrders and renderStockAdmin, so let's update that dynamically or leave it to HTML
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
        document.addEventListener('click', () => {
            document.getElementById('user-pill-container')?.classList.remove('open');
            document.getElementById('user-dropdown-menu')?.classList.remove('active');
        });
        function openCartFromDropdown(e) { e.stopPropagation(); document.getElementById('user-dropdown-menu')?.classList.remove('active'); toggleCart(); }

        // ===== PRODUCTS =====
        function createCardHTML(p) {
            const isOut = stockConfig[p.id] === true;
            const opac = isOut ? '0.5' : '1';
            const filt = isOut ? 'grayscale(100%)' : 'none';
            const btnText = isOut ? '🚫 Agotado por hoy' : '➕ Agregar al Carrito';
            const btnClass = isOut ? 'btn-add disabled' : `btn-add badd-${p.id}`;
            const btnAction = isOut ? '' : `onclick="addToCart(${p.id},event)"`;

            return `<div class="card" id="card-${p.id}">
            <span class="card-tag" style="opacity:${opac};">${p.tag}</span>
            <div class="card-img-wrap" style="opacity:${opac}; filter:${filt};">
                <img src="${p.img}" alt="${p.name}" class="pimg-${p.id}" loading="lazy">
            </div>
            <div class="card-body">
                <div style="opacity:${opac};">
                    <h3>${p.name}</h3>
                    <p class="card-desc">${p.desc}</p>
                </div>
                <div>
                    <div class="price-row" style="opacity:${opac};">
                        <span class="price">$${p.price.toLocaleString()}</span>
                        <span class="price-label">COP c/u</span>
                    </div>
                    <div class="quantity-control" style="opacity:${opac}; pointer-events:${isOut ? 'none' : 'auto'};">
                        <button class="qty-btn" onclick="changeQty(${p.id},-1)">−</button>
                        <input type="number" class="qty-input qinp-${p.id}" value="1" min="1" onblur="validateQty(this)">
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
            let list = cat === 'todos' ? products.filter(p => p.featured) : products.filter(p => p.cat === cat);
            if (list.length === 0) list = products.filter(p => p.cat === cat);
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
            const p = products.find(x => x.id === id); if (!p) return;
            if (stockConfig[id]) return showToast("Este producto está agotado por hoy.", "🚫");
            const inp = document.querySelector(`.qinp-${id}`);
            let qty = parseInt(inp?.value) || 1; if (qty < 1) qty = 1;
            const existing = cart.find(i => i.id === id);
            if (existing) existing.quantity += qty; else cart.push({ ...p, quantity: qty });
            flyAnimation(id);
            document.querySelectorAll(`.badd-${id}`).forEach(b => {
                b.classList.add('added'); b.innerHTML = '<span>✓ ¡Agregado!</span>';
                setTimeout(() => { b.classList.remove('added'); b.innerHTML = '<span>➕ Agregar al Carrito</span>'; }, 1100);
            });
            if (inp) inp.value = 1;
            updateCart(); saveCart();
            showToast(`¡${qty}x ${p.name} al carrito!`, '🥐');
        }

        function updCartQty(id, d) {
            const i = cart.find(x => x.id === id); if (!i) return;
            i.quantity += d; if (i.quantity <= 0) cart = cart.filter(x => x.id !== id);
            updateCart(); saveCart();
        }
        function setCartQty(id, v) {
            const i = cart.find(x => x.id === id); if (!i) return;
            const nv = parseInt(v); i.quantity = isNaN(nv) || nv < 1 ? 1 : nv;
            updateCart(); saveCart();
        }
        function removeFromCart(id) {
            cart = cart.filter(i => i.id !== id); updateCart(); saveCart();
            showToast("Producto eliminado.", "🗑️");
        }

        function updateCart() {
            const totalQty = cart.reduce((a, i) => a + i.quantity, 0);
            let totalPrice = cart.reduce((a, i) => a + (i.price * i.quantity), 0);

            let discount = 0;
            const dRow = document.getElementById('discountRow');
            const pRow = document.getElementById('cart-vip-priority');
            if (currentUser && totalPrice > 0 && adminConfig.vipEnabled && totalPrice >= adminConfig.minPurchase) {
                if (currentUser.vip) {
                    discount = Math.floor(totalPrice * 0.10);
                } else {
                    discount = Math.floor(totalPrice * 0.06);
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
                if (dRow) dRow.style.display = 'none';
                if (pRow) pRow.style.display = 'none';
            }
            const finalTotal = totalPrice - discount;
            
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
                ci.innerHTML = `<div class="empty-cart-view"><span>🥖</span><strong style="display:block;color:var(--text-dark);margin-bottom:5px;">Tu carrito está vacío</strong><p style="font-size:0.85rem;">¡Agrega panes, hojaldres o tortas para hacer tu pedido!</p></div>`;
                cs.style.opacity = '0.5'; if (cc) cc.style.display = 'none'; bw.style.opacity = '0.5'; bw.style.pointerEvents = 'none';
            } else {
                cs.style.opacity = '1'; if (cc) cc.style.display = 'flex'; bw.style.opacity = '1'; bw.style.pointerEvents = 'auto';
                ci.innerHTML = cart.map(item => `
                <div class="cart-item-row">
                    <img src="${item.img}" class="cart-item-img" alt="${item.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toLocaleString()} c/u • <strong>$${(item.price * item.quantity).toLocaleString()} COP</strong></div>
                    </div>
                    <div class="cart-item-actions">
                        <button onclick="updCartQty(${item.id},-1)">−</button>
                        <input type="number" value="${item.quantity}" min="1" onchange="setCartQty(${item.id},this.value)">
                        <button onclick="updCartQty(${item.id},1)">+</button>
                        <button class="btn-delete-item" onclick="removeFromCart(${item.id})"><svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg></button>
                    </div>
                </div>`).join('');
            }
        }

        function toggleCart() {
            const m = document.getElementById('cartModal');
            m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
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

            if (typeof orderType !== 'undefined' && orderType === 'evento') {
                const eDate = document.getElementById('eventDate')?.value;
                const eTime = document.getElementById('eventTime')?.value;
                if (!eDate || !eTime) return alert("Por favor, selecciona la fecha y hora de tu evento.");
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
                if (currentUser.vip) {
                    discount = Math.floor(tp * 0.10);
                } else {
                    discount = Math.floor(tp * 0.06);
                }

                if (discount > adminConfig.maxDiscount) discount = adminConfig.maxDiscount;
                finalTotal = tp - discount;

                let ptsEarned = 0;
                if (tp >= 100000) ptsEarned = 30;
                else if (tp >= 50000) ptsEarned = 20;
                else if (tp >= 10000) ptsEarned = 10;

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

            let msg = `🥖 *NUEVO PEDIDO ${orderId} – Dulce Tentación P y S*\n`;
            if (typeof orderType !== 'undefined' && orderType === 'evento') {
                msg = `🎉 *NUEVO EVENTO ${orderId} – Dulce Tentación P y S*\n`;
                msg += `📅 *Fecha:* ${document.getElementById('eventDate')?.value}\n`;
                msg += `⏰ *Hora:* ${document.getElementById('eventTime')?.value}\n`;
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
            cart.forEach(i => { msg += `  • ${i.quantity}x ${i.name} → $${(i.price * i.quantity).toLocaleString()} COP\n`; });
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
            const msg = "¡Hola! Quiero activar mi Membresía VIP Oro en Dulce Tentación para acceder al 10% de descuento y los beneficios exclusivos. 👑";
            window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
        }
