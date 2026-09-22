/**
 * Módulo contabilidad.js
 * Aísla la lógica contable, reportes y métricas financieras
 * Opera interceptando funciones y DOM sin modificar script.js
 */

window.addEventListener('DOMContentLoaded', () => {
    // 1. INYECTAR MODALES DE CONTABILIDAD
    const modalsHTML = `
    <!-- Modal Detalle Contable -->
    <div id="modal-detalle-pedido" class="modal-overlay" style="display:none !important; align-items:center; justify-content:center; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999;">
        <div class="modal-content" style="max-width:500px; padding:20px; text-align:left; background:#fff; border-radius:12px; width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <h3 style="color:var(--brand-pink); margin-bottom:15px; font-size:1.4rem;">📊 Detalle Contable</h3>
            <div id="contabilidad-detalle-content" style="margin-bottom:20px; font-size:0.95rem; line-height:1.5;"></div>
            <div style="text-align:right;">
                <button class="btn-hero-secondary" onclick="document.getElementById('modal-detalle-pedido').style.setProperty('display', 'none', 'important')" style="padding:8px 16px; border:1px solid #ddd; background:#f1f5f9; border-radius:8px; cursor:pointer; font-weight:bold;">Cerrar</button>
            </div>
        </div>
    </div>

    <!-- Modal Ranking de Clientes -->
    <div id="rankingModal" class="modal-overlay" style="display:none !important; align-items:center; justify-content:center; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999;">
        <div class="modal-content" style="max-width:600px; padding:20px; text-align:left; background:#fff; border-radius:12px; width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.2); max-height:85vh; overflow-y:auto; display:flex; flex-direction:column;">
            <h3 style="color:var(--brand-pink); margin-bottom:15px; font-size:1.4rem;">🏆 Ranking de Clientes (Histórico)</h3>
            <div id="ranking-content" style="margin-bottom:20px; overflow-y:auto;"></div>
            <div style="text-align:right;">
                <button class="btn-hero-secondary" onclick="document.getElementById('rankingModal').style.setProperty('display', 'none', 'important')" style="padding:8px 16px; border:1px solid #ddd; background:#f1f5f9; border-radius:8px; cursor:pointer; font-weight:bold;">Cerrar</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalsHTML);

    // 1B. INYECTAR EL LIBRO CONTABLE DIRECTAMENTE EN LA PESTAÑA
    const contabilidadTab = document.getElementById('admin-tab-contabilidad');
    if (contabilidadTab) {
        const libroContableHTML = `
        <div id="seccion-libro-contable" style="background:#fff; border-radius:12px; padding:20px; box-shadow:var(--shadow-s); margin-bottom:25px; border:1px solid #f1e8e4;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:15px; gap:10px;">
                <h3 style="color:var(--brand-pink); margin:0; font-size:1.4rem;">📖 Libro Contable de Pedidos</h3>
                <button id="btn-export-excel" onclick="exportarPedidosCSV()" class="btn-export-excel" style="background:#10b981; color:#fff; font-weight:600; padding:10px 18px; border-radius:8px; border:none; cursor:pointer; box-shadow:0 4px 6px rgba(16,185,129,0.2);">
                    📥 Descargar Reporte en Excel
                </button>
            </div>
            
            <div class="contable-filtros-bar" style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap; align-items:center;">
                <input type="text" id="input-buscar-contable" oninput="filtrarLibroContable()" placeholder="🔍 Buscar por cliente, teléfono o #DT..." style="flex:1; min-width:200px; padding:8px; border-radius:6px; border:1px solid #ddd;">
                <input type="date" id="input-fecha-contable" onchange="filtrarLibroContable()" style="padding:8px; border-radius:6px; border:1px solid #ddd;">
                <button id="btn-limpiar-filtros" class="btn-secundario" onclick="limpiarFiltrosContable()" style="padding:8px 16px; border-radius:6px; background:#f1f5f9; border:1px solid #ddd; cursor:pointer;">Limpiar / Ver Todos</button>
                <span id="resumen-filtrado" style="font-weight: 600; color: #555; margin-left:10px;"></span>
            </div>

            <div id="libro-contable-content" style="max-height:500px; overflow-y:auto; border:1px solid #eee; border-radius:8px;"></div>
        </div>
        `;
        
        const dashboardCards = document.getElementById('admin-dashboard-cards');
        if (dashboardCards) {
            dashboardCards.insertAdjacentHTML('afterend', libroContableHTML);
        } else {
            contabilidadTab.insertAdjacentHTML('afterbegin', libroContableHTML);
        }
    }

    // 2. INTERCEPTAR RENDER ADMIN DASHBOARD PARA MÉTRICAS Y EXPORTACIÓN
    const originalRenderAdminDashboard = window.renderAdminDashboard;
    if (originalRenderAdminDashboard) {
        window.renderAdminDashboard = function() {
            // Llama la original que ya suma las ventas de hoy y totales
            originalRenderAdminDashboard();
            
            // Inyectar Botón de Exportar a CSV si no existe
            const dateFilterDiv = document.getElementById('orderDateFilter')?.parentElement;
            if (dateFilterDiv && !document.getElementById('btn-export-csv')) {
                const btnExport = document.createElement('button');
                btnExport.id = 'btn-export-csv';
                btnExport.innerHTML = '📥 Exportar a Excel (CSV)';
                btnExport.style.cssText = 'background:#10b981; color:#fff; border:none; padding:6px 12px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:0.85rem; margin-left:10px; transition:all 0.2s;';
                btnExport.onclick = exportarPedidosCSV;
                dateFilterDiv.appendChild(btnExport);
            }

            // Inyectar Botón de Ranking Completo en la sección Top 5
            const topClientsDiv = document.getElementById('admin-top-clients')?.parentElement;
            if (topClientsDiv && !document.getElementById('btn-open-ranking')) {
                const btnRanking = document.createElement('button');
                btnRanking.id = 'btn-open-ranking';
                btnRanking.innerHTML = '🌟 Ver Ranking Completo';
                btnRanking.style.cssText = 'width:100%; margin-top:15px; background:var(--brand-pink); color:#fff; border:none; padding:10px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:0.95rem; transition:transform 0.2s;';
                btnRanking.onclick = openRankingModal;
                topClientsDiv.appendChild(btnRanking);
            }

            // --- HACER TARJETAS INTERACTIVAS ---
            const cardsContainer = document.getElementById('admin-dashboard-cards');
            if (cardsContainer) {
                const cards = cardsContainer.children;
                for(let i=0; i<cards.length; i++) {
                    cards[i].classList.add('metric-card');
                }
                if (cards.length >= 6) {
                    // Tarjeta 3: Total Ahorrado (Dcto)
                    const discountCard = cards[3];
                    discountCard.onclick = () => {
                        let totalMes = 0;
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        if (typeof pedidosHistorial !== 'undefined') {
                            pedidosHistorial.forEach(p => {
                                const pDateObj = p.timestamp ? new Date(p.timestamp) : new Date();
                                if (p.status !== 'Cancelado' && pDateObj.getMonth() === currentMonth && pDateObj.getFullYear() === currentYear) {
                                    totalMes += p.discount || 0;
                                }
                            });
                        }
                        if(typeof showToast === 'function') {
                            showToast(`Descuentos otorgados este mes: $${totalMes.toLocaleString()}`, 'info');
                        }
                    };

                    // Tarjeta 4: Pedidos Recibidos
                    const ordersCard = cards[4];
                    ordersCard.onclick = () => {
                        if (typeof openLibroContableModal === 'function') openLibroContableModal();
                    };

                    // Tarjeta 5: Cliente Estrella
                    const starClientCard = cards[5];
                    starClientCard.onclick = () => {
                        if (typeof openRankingModal === 'function') openRankingModal();
                    };
                }
            }
        };
        // Forzar actualización si el dashboard ya está activo
        if (typeof currentUser !== 'undefined' && currentUser && typeof adminEmails !== 'undefined' && adminEmails.includes(currentUser.email)) {
            window.renderAdminDashboard();
        }
    }

    // 3. INTERCEPTAR RENDER LIVE ORDERS PARA AÑADIR BOTÓN CONTABLE
    const originalRenderLiveOrders = window.renderLiveOrders;
    if (originalRenderLiveOrders) {
        window.renderLiveOrders = function() {
            // Llama la original para que cree el grid de comandas
            originalRenderLiveOrders();
            
            const grid = document.getElementById('live-orders-grid');
            if (!grid) return;
            
            Array.from(grid.children).forEach(card => {
                // Buscamos el ID del pedido dentro del texto de la tarjeta
                const htmlStr = card.innerHTML;
                const idMatch = htmlStr.match(/ID:\s*([\w-]+)/);
                if (idMatch && idMatch[1]) {
                    const orderId = idMatch[1];
                    const actionBar = card.lastElementChild;
                    
                    if (actionBar && !card.querySelector('.btn-detalle-contable')) {
                        const accountingBtn = document.createElement('button');
                        accountingBtn.className = 'btn-detalle-contable';
                        accountingBtn.innerHTML = '📊 Detalle Contable';
                        accountingBtn.style.cssText = 'width:100%; margin-bottom:8px; padding:8px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:0.85rem; border:none; background:#8b5cf6; color:#fff; transition:opacity 0.2s;';
                        accountingBtn.onclick = () => viewAccountingOrderDetails(orderId);
                        
                        // Insertamos justo antes de los botones de cambio de estado
                        card.insertBefore(accountingBtn, actionBar);
                    }
                }
            });
        };
        if (typeof pedidosHistorial !== 'undefined') {
            window.renderLiveOrders();
        }
    }
});

// --- FUNCIONES CONTABLES Y FINANCIERAS ---

window.viewAccountingOrderDetails = function(orderId) {
    if (typeof pedidosHistorial === 'undefined') return;
    const p = pedidosHistorial.find(x => x.id === orderId);
    if (!p) return;
    
    const isEvent = p.type === 'evento';
    const subtotal = p.total + p.discount;
    const abono = isEvent ? Math.ceil(p.total / 2) : p.total;
    const saldo = p.total - abono;
    
    const dateStr = p.timestamp ? new Date(p.timestamp).toLocaleString('es-CO') : p.date;
    
    let html = `
        <table style="width:100%; border-collapse:collapse; margin-bottom:15px; font-size:0.9rem;">
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px 0; font-weight:bold; color:#475569;">ID Pedido:</td>
                <td style="padding:8px 0; text-align:right;">${p.id}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px 0; font-weight:bold; color:#475569;">Fecha:</td>
                <td style="padding:8px 0; text-align:right;">${dateStr}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px 0; font-weight:bold; color:#475569;">Cliente:</td>
                <td style="padding:8px 0; text-align:right;">${p.customer}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:8px 0; font-weight:bold; color:#475569;">Estado:</td>
                <td style="padding:8px 0; text-align:right; font-weight:bold; color:${p.status==='Cancelado'?'#e11d48':'#059669'};">${p.status}</td>
            </tr>
        </table>
        
        <div style="background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:15px; border:1px dashed #cbd5e1; font-size:0.85rem;">
            <strong style="color:#334155;">📝 Desglose de Productos:</strong><br>${p.products}
        </div>
        
        <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:6px 0;">Subtotal Bruto:</td>
                <td style="padding:6px 0; text-align:right;">$${subtotal.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:6px 0; color:#e11d48;">Descuentos Otorgados:</td>
                <td style="padding:6px 0; text-align:right; color:#e11d48;">-$${p.discount.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee; background:#f0fdf4;">
                <td style="padding:8px; font-weight:bold; color:#15803d; border-radius:8px 0 0 8px;">Total Neto (Valor Venta):</td>
                <td style="padding:8px; text-align:right; font-weight:bold; color:#15803d; border-radius:0 8px 8px 0;">$${p.total.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:6px 0; color:#059669; font-weight:bold;">Abono / Pagado:</td>
                <td style="padding:6px 0; text-align:right; color:#059669; font-weight:bold;">$${abono.toLocaleString()}</td>
            </tr>
            <tr>
                <td style="padding:10px 0; font-weight:bold; font-size:1.1rem; color:var(--brand-pink);">Saldo Pendiente:</td>
                <td style="padding:10px 0; text-align:right; font-weight:bold; font-size:1.1rem; color:var(--brand-pink);">$${saldo.toLocaleString()}</td>
            </tr>
        </table>
    `;
    
    document.getElementById('contabilidad-detalle-content').innerHTML = html;
    document.getElementById('modal-detalle-pedido').style.setProperty('display', 'flex', 'important');
};

window.openRankingModal = function() {
    if (typeof pedidosHistorial === 'undefined' || typeof db_users === 'undefined') return;
    
    let cTotals = {};
    pedidosHistorial.forEach(p => {
        if (p.status !== 'Cancelado' && p.email && p.email !== 'N/A') {
            if (!cTotals[p.email]) {
                cTotals[p.email] = { total: 0, count: 0, name: p.customer };
            }
            cTotals[p.email].total += p.total;
            cTotals[p.email].count += 1;
        }
    });
    
    let ranking = Object.keys(cTotals).map(k => ({
        email: k,
        name: cTotals[k].name,
        total: cTotals[k].total,
        count: cTotals[k].count
    })).sort((a, b) => b.total - a.total);
    
    let html = `
        <table style="width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden;">
            <thead style="background:var(--brand-pink-l); text-align:left; font-size:0.9rem;">
                <tr>
                    <th style="padding:10px;">Pos</th>
                    <th style="padding:10px;">Cliente</th>
                    <th style="padding:10px; text-align:center;">Nº Pedidos</th>
                    <th style="padding:10px; text-align:center;">Nivel</th>
                    <th style="padding:10px; text-align:right;">Total Gastado</th>
                </tr>
            </thead>
            <tbody style="font-size:0.9rem;">
    `;
    
    if (ranking.length === 0) {
        html += `<tr><td colspan="4" style="padding:15px;text-align:center;">No hay datos contables suficientes.</td></tr>`;
    } else {
        // Cargar usuarios para saber si es VIP
        let usersDB = [];
        try { usersDB = JSON.parse(localStorage.getItem('dt_users_db')) || []; } catch(e){}

        ranking.forEach((c, idx) => {
            let icon = '';
            let rowStyle = '';
            if (idx === 0) { icon = '👑 '; rowStyle = 'background:#fff1f2;'; } // Estrella
            else if (idx === 1) { icon = '🥈 '; rowStyle = 'background:#f8fafc;'; }
            else if (idx === 2) { icon = '🥉 '; rowStyle = 'background:#f8fafc;'; }
            
            // Determinar Nivel
            let isVip = usersDB.find(u => u.email === c.email || u.phone === c.email)?.vip;
            let nivel = isVip ? '<span style="color:#e6396b; font-weight:bold;">VIP 🌟</span>' : (c.count >= 3 ? '<span style="color:#10b981; font-weight:bold;">Frecuente 🥇</span>' : '<span style="color:#64748b; font-weight:bold;">Nuevo 🌱</span>');

            html += `
            <tr style="border-bottom:1px solid #eee; ${rowStyle}">
                <td style="padding:10px; font-weight:bold; color:#64748b;">#${idx+1}</td>
                <td style="padding:10px;">${icon}<strong>${c.name}</strong><br><span style="font-size:0.75rem; color:#94a3b8;">${c.email}</span></td>
                <td style="padding:10px; text-align:center; font-weight:bold;">${c.count}</td>
                <td style="padding:10px; text-align:center;">${nivel}</td>
                <td style="padding:10px; text-align:right; font-weight:bold; color:var(--brand-pink);">$${c.total.toLocaleString()}</td>
            </tr>`;
        });
    }
    
    html += `</tbody></table>`;
    document.getElementById('ranking-content').innerHTML = html;
    document.getElementById('rankingModal').style.setProperty('display', 'flex', 'important');
};

window.pedidosContableFiltrados = [];

window.exportarPedidosCSV = function() {
    const listaAExportar = (window.pedidosContableFiltrados && window.pedidosContableFiltrados.length > 0) ? window.pedidosContableFiltrados : (pedidosHistorial || []);
    
    if (listaAExportar.length === 0) {
        if(typeof showToast === 'function') showToast('No hay pedidos para exportar', 'error');
        return;
    }
    
    // Configurar UTF-8 BOM para que Excel reconozca tildes y caracteres especiales
    const bom = "\uFEFF"; 
    let csvContent = "Fecha,ID,Nombre Cliente,Teléfono,Dirección,Método Pago,Total COP,Abono COP,Saldo Pendiente COP,Detalle Productos\n";
    
    listaAExportar.forEach(p => {
        const pDate = p.timestamp ? new Date(p.timestamp).toLocaleString('es-CO') : p.date;
        const abono = (p.type === 'evento') ? Math.ceil(p.total / 2) : p.total;
        const saldo = p.total - abono;
        
        const customer = `"${(p.customer || '').replace(/"/g, '""')}"`;
        const phone = `"${(p.phone || '').replace(/"/g, '""')}"`;
        const address = `"${(p.address || '').replace(/"/g, '""')}"`;
        const method = `"${(p.paymentMethod || 'Efectivo').replace(/"/g, '""')}"`;
        const date = `"${pDate}"`;
        
        let details = '';
        if(p.items && Array.isArray(p.items)) {
            details = p.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
        }
        details = `"${details.replace(/"/g, '""')}"`;
        
        csvContent += `${date},${p.id},${customer},${phone},${address},${method},${p.total},${abono},${saldo},${details}\n`;
    });
    
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Reporte_Ventas_Punto_Dulce.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if(typeof showToast === 'function') showToast('Reporte CSV generado exitosamente', '✅');
};

window.limpiarFiltrosContable = function() {
    const inputBuscar = document.getElementById('input-buscar-contable');
    const inputFecha = document.getElementById('input-fecha-contable');
    if (inputBuscar) inputBuscar.value = '';
    if (inputFecha) inputFecha.value = '';
    filtrarLibroContable();
};

window.filtrarLibroContable = function() {
    if (typeof pedidosHistorial === 'undefined') return;
    
    const inputBuscar = document.getElementById('input-buscar-contable')?.value.toLowerCase() || '';
    const inputFecha = document.getElementById('input-fecha-contable')?.value || '';
    
    let filtrados = pedidosHistorial.filter(p => {
        let matchTexto = true;
        if (inputBuscar) {
            const customer = (p.customer || '').toLowerCase();
            const phone = (p.phone || '').toLowerCase();
            const id = (p.id || '').toLowerCase();
            matchTexto = customer.includes(inputBuscar) || phone.includes(inputBuscar) || id.includes(inputBuscar);
        }
        
        let matchFecha = true;
        if (inputFecha) {
            const pDate = p.timestamp ? new Date(p.timestamp).toISOString().slice(0,10) : '';
            matchFecha = pDate === inputFecha;
        }
        
        return matchTexto && matchFecha;
    });

    // Ordenar de más reciente a más antiguo
    filtrados.sort((a, b) => {
        const da = a.timestamp ? new Date(a.timestamp) : new Date(0);
        const db = b.timestamp ? new Date(b.timestamp) : new Date(0);
        return db - da;
    });

    window.pedidosContableFiltrados = filtrados;
    renderizarTablaContable(filtrados);
};

window.renderizarTablaContable = function(pedidos) {
    let totalCOP = 0;

    let html = `
        <table style="width:100%; border-collapse:collapse; background:#fff; border-radius:8px; overflow:hidden;">
            <thead style="background:var(--brand-pink-l); text-align:left; font-size:0.9rem;">
                <tr>
                    <th style="padding:10px;">Fecha y Hora</th>
                    <th style="padding:10px;">ID Pedido</th>
                    <th style="padding:10px;">Cliente</th>
                    <th style="padding:10px; text-align:center;">Artículos</th>
                    <th style="padding:10px; text-align:right;">Total Cobrado</th>
                    <th style="padding:10px; text-align:center;">Estado Pago</th>
                    <th style="padding:10px; text-align:center;">Acción</th>
                </tr>
            </thead>
            <tbody style="font-size:0.9rem;">
    `;

    if (pedidos.length === 0) {
        html += `<tr><td colspan="7" style="padding:15px;text-align:center;">No se encontraron pedidos.</td></tr>`;
    } else {
        pedidos.forEach(p => {
            totalCOP += (p.total || 0);
            
            const pDate = p.timestamp ? new Date(p.timestamp).toLocaleString('es-CO') : p.date;
            
            // Cantidad de artículos
            let totalItems = 0;
            let totalUnds = 0;
            if (p.items && Array.isArray(p.items)) {
                totalItems = p.items.length;
                totalUnds = p.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
            }
            const artText = `${totalItems} items &bull; ${totalUnds} und`;
            
            // Estado Pago
            const isEvent = p.type === 'evento';
            let pagoHtml = '';
            if (isEvent) {
                const abono = Math.ceil(p.total / 2);
                const saldo = p.total - abono;
                pagoHtml = `<span style="color:#10b981; font-weight:bold;">Abono: $${abono.toLocaleString()}</span><br><span style="color:#ef4444; font-size:0.8rem;">Saldo: $${saldo.toLocaleString()}</span>`;
            } else {
                pagoHtml = `<span style="color:#10b981; font-weight:bold;">Pagado completo</span>`;
            }

            html += `
            <tr style="border-bottom:1px solid #eee;">
                <td style="padding:10px; color:#64748b; font-size:0.85rem;">${pDate}</td>
                <td style="padding:10px; font-weight:bold;">#${p.id}</td>
                <td style="padding:10px;"><strong>${p.customer || 'N/A'}</strong><br><span style="font-size:0.75rem; color:#94a3b8;">${p.phone || 'N/A'}</span></td>
                <td style="padding:10px; text-align:center;">${artText}</td>
                <td style="padding:10px; text-align:right; font-weight:bold; color:var(--brand-pink);">$${(p.total || 0).toLocaleString()}</td>
                <td style="padding:10px; text-align:center;">${pagoHtml}</td>
                <td style="padding:10px; text-align:center;">
                    <button onclick="viewAccountingOrderDetails('${p.id}')" style="background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; padding:4px 8px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem; transition:background 0.2s;">Ver Detalle</button>
                </td>
            </tr>`;
        });
    }

    html += `</tbody></table>`;
    document.getElementById('libro-contable-content').innerHTML = html;
    
    // Actualizar resumen
    const resumen = document.getElementById('resumen-filtrado');
    if (resumen) {
        resumen.innerHTML = `Mostrando: ${pedidos.length} pedidos &bull; Total: $${totalCOP.toLocaleString()} COP`;
    }
};

window.openLibroContableModal = function() {
    limpiarFiltrosContable();
    const sec = document.getElementById('seccion-libro-contable');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
};
window.abrirLibroContable = window.openLibroContableModal;


// === CALCULADORA DE ABONOS Y SANEAMIENTO (SOBREESCRITURAS) ===
window.registrarAbono = function(orderId, monto) {
    if (typeof pedidosHistorial !== 'undefined') {
        const idx = pedidosHistorial.findIndex(o => o.id === orderId);
        if (idx !== -1) {
            const nuevoAbono = parseFloat(monto) || 0;
            pedidosHistorial[idx].abono = nuevoAbono;
            if (typeof savePedidosHistorial === 'function') savePedidosHistorial();
            localStorage.setItem('dt_pedidos_historial', JSON.stringify(pedidosHistorial));

            // Sincronizar en Firestore en tiempo real (multi-dispositivo)
            if (typeof window.updateOrderAbono === 'function') {
                window.updateOrderAbono(orderId, nuevoAbono);
            }

            if (typeof renderLiveOrders === 'function') renderLiveOrders();
        }
    }
};

const originalRenderLiveOrders = window.renderLiveOrders;
window.renderLiveOrders = function() {
    const grid = document.getElementById('live-orders-grid');
    if (!grid) return;
    
    let list = [...(typeof pedidosHistorial !== 'undefined' ? pedidosHistorial : [])];
    
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (!list.some(p => p.timestamp)) {
        list = list.slice().reverse();
    }

    if (typeof orderDateFilterValue !== 'undefined' && orderDateFilterValue) {
        const [y, m, d] = orderDateFilterValue.split('-');
        list = list.filter(p => {
            if (p.timestamp) {
                const pd = new Date(p.timestamp);
                return pd.getFullYear() == y && (pd.getMonth() + 1) == m && pd.getDate() == d;
            }
            return true; 
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
        const tagIcon = isEvent ? '\uD83C\uDF89 Evento Programado' : '\u26A1 Entrega Inmediata';

        // ---- COMANDA DE PRODUCCIÓN ----
        let detalleHtml = '';
        if (p.cartItems && Array.isArray(p.cartItems) && p.cartItems.length > 0) {
            const tortas = p.cartItems.filter(i => i.type === 'evento' && i.customData);
            const normales = p.cartItems.filter(i => !(i.type === 'evento' && i.customData));

            if (tortas.length > 0) {
                tortas.forEach(t => {
                    const cd = t.customData || {};
                    const extrasStr = (cd.extras && Object.keys(cd.extras).length > 0)
                        ? Object.keys(cd.extras).map(k => `\u2022 ${k}`).join('<br>')
                        : '(Ninguno)';
                    const dedicatoria = cd.message ? `\u201C${cd.message}\u201D` : '(Sin dedicatoria)';
                    const fechaEntrega = cd.date || '(No especificada)';
                    const horario = cd.time || '(No especificado)';

                    detalleHtml += `
                    <div style="background:#fff8f0; border:1.5px solid #f97316; border-radius:10px; padding:11px; margin-bottom:8px;">
                        <div style="font-weight:700; font-size:0.95rem; color:#c2410c; margin-bottom:8px;">
                            \uD83C\uDF82 ${t.name || 'Torta Personalizada'}
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px 12px; font-size:0.83rem; color:#334155;">
                            <div><span style="color:#64748b;">Sabor:</span> <strong>${cd.sabor || cd.flavor || '—'}</strong></div>
                            <div><span style="color:#64748b;">Tama\u00f1o:</span> <strong>${cd.tamano || cd.size || '—'}</strong></div>
                            <div><span style="color:#64748b;">Dise\u00f1o:</span> <strong>${cd.diseno || cd.design || '—'}</strong></div>
                            <div><span style="color:#64748b;">Porciones:</span> <strong>${t.quantity || 1}</strong></div>
                        </div>
                        <div style="margin-top:8px; font-size:0.83rem; color:#334155; border-top:1px dashed #fed7aa; padding-top:8px;">
                            <div>\uD83D\uDCC5 <strong>Entrega:</strong> ${fechaEntrega} &nbsp;&#x23F0; ${horario}</div>
                            <div style="margin-top:4px;">\u270D\uFE0F <strong>Dedicatoria:</strong> <em>${dedicatoria}</em></div>
                            <div style="margin-top:4px;">\u2728 <strong>Extras:</strong><br>${extrasStr}</div>
                        </div>
                    </div>`;
                });
            }

            if (normales.length > 0) {
                const listaNormal = normales.map(i =>
                    `\u2022 <strong>${i.quantity}x</strong> ${i.name} &mdash; $${((i.price||0)*(i.quantity||1)).toLocaleString('es-CO')} COP`
                ).join('<br>');
                detalleHtml += `
                    <div style="background:#f8fafc; padding:9px 12px; border-radius:8px; font-size:0.85rem; color:#334155; border:1px dashed #cbd5e1; margin-top:${tortas.length > 0 ? '0' : '0'}px;">
                        <strong>\uD83E\uDD50 Productos Adicionales:</strong><br>${listaNormal}
                    </div>`;
            }
        } else {
            // Retrocompatibilidad: pedido sin cartItems
            detalleHtml = `<div style="background:#f8fafc; padding:10px; border-radius:8px; font-size:0.85rem; color:#334155; border:1px dashed #cbd5e1;">
                <strong>\uD83D\uDCDD Detalle:</strong><br>${p.products || '—'}
            </div>`;
        }

        // ---- PANEL DE COBRO ----
        const abonoVal = p.abono || 0;
        const total = p.total || 0;
        const saldo = Math.max(0, total - abonoVal);
        const anticipoSugerido = Math.ceil(total / 2);
        const pagadoPct = total > 0 ? Math.round((abonoVal / total) * 100) : 0;

        let estadoPagoHtml;
        if (abonoVal <= 0) {
            estadoPagoHtml = `<span style="color:#c0392b; font-weight:700;">\uD83D\uDD34 Sin pago registrado</span>`;
        } else if (abonoVal >= total) {
            estadoPagoHtml = `<span style="color:#27ae60; font-weight:700;">\uD83D\uDFE2 \u00A1PAGADO AL 100%!</span>`;
        } else {
            estadoPagoHtml = `<span style="color:#d35400; font-weight:700;">\uD83D\uDFE1 ${pagadoPct}% pagado &mdash; <span style="color:#c0392b;">Pendiente: $${saldo.toLocaleString('es-CO')} COP</span></span>`;
        }

        const abonoHtml = `
        <div style="background:#fdf2f4; border:1px solid #f8c8d4; border-radius:10px; padding:12px; margin-top:6px;">
            <div style="font-size:0.82rem; font-weight:700; color:#be185d; margin-bottom:8px; letter-spacing:0.03em;">\uD83D\uDCB3 CONTROL DE PAGO</div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-bottom:10px; text-align:center;">
                <div style="background:#fff; border-radius:8px; padding:7px 4px; border:1px solid #f1e8e4;">
                    <div style="font-size:0.7rem; color:#64748b; margin-bottom:2px;">Total</div>
                    <div style="font-size:0.92rem; font-weight:700; color:#1e293b;">$${total.toLocaleString('es-CO')}</div>
                </div>
                <div style="background:#fff; border-radius:8px; padding:7px 4px; border:1px solid #bbf7d0;">
                    <div style="font-size:0.7rem; color:#64748b; margin-bottom:2px;">Abonado</div>
                    <div style="font-size:0.92rem; font-weight:700; color:#15803d;">$${abonoVal.toLocaleString('es-CO')}</div>
                </div>
                <div style="background:#fff; border-radius:8px; padding:7px 4px; border:1px solid ${saldo > 0 ? '#fecaca' : '#bbf7d0'};">
                    <div style="font-size:0.7rem; color:#64748b; margin-bottom:2px;">Por Cobrar</div>
                    <div style="font-size:0.92rem; font-weight:700; color:${saldo > 0 ? '#c0392b' : '#15803d'};">$${saldo.toLocaleString('es-CO')}</div>
                </div>
            </div>
            <div style="margin-bottom:8px; font-size:0.83rem;">${estadoPagoHtml}</div>
            <div style="font-size:0.8rem; color:#64748b; margin-bottom:6px;">\uD83D\uDCB0 Pago: <strong>${p.metodoPago || p.payStatus || 'No especificado'}</strong></div>
            <label style="display:block; font-size:0.82rem; font-weight:700; color:#be185d; margin-bottom:5px;">Registrar Abono / Pago:</label>
            <div style="display:flex; gap:6px; align-items:center;">
                <input type="number" id="input-abono-${p.id}"
                       placeholder="Monto..." value="${abonoVal || ''}"
                       style="flex:1; padding:7px 10px; border:1.5px solid #e6396b; border-radius:7px; font-size:0.95rem; font-weight:700; min-width:0;">
                <button type="button"
                        onclick="registrarAbono('${p.id}', ${anticipoSugerido})"
                        style="padding:7px 9px; font-size:0.75rem; background:#fff; border:1px solid #ccc; border-radius:7px; cursor:pointer; white-space:nowrap;">50%</button>
                <button type="button"
                        onclick="registrarAbono('${p.id}', ${total})"
                        style="padding:7px 9px; font-size:0.75rem; background:#fff; border:1px solid #ccc; border-radius:7px; cursor:pointer; white-space:nowrap;">100%</button>
                <button type="button"
                        onclick="registrarAbono('${p.id}', document.getElementById('input-abono-${p.id}').value)"
                        style="padding:7px 11px; font-size:0.8rem; font-weight:700; background:#e6396b; color:#fff; border:none; border-radius:7px; cursor:pointer; white-space:nowrap;">\uD83D\uDCBE Guardar</button>
            </div>
        </div>`;

        return `
        <div style="background:#fff; border-radius:14px; padding:16px; border:1px solid #eee; box-shadow:0 2px 10px rgba(0,0,0,0.06); display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <span style="background:${tagColor}; color:${tagTextColor}; padding:4px 10px; border-radius:6px; font-size:0.75rem; font-weight:700;">${tagIcon}</span>
                    <div style="margin-top:8px; font-size:0.8rem; color:#666;">ID: ${p.id} &bull; ${p.date}</div>
                </div>
                <div style="font-size:1.1rem; font-weight:700; color:var(--brand-pink);">$${p.total.toLocaleString()}</div>
            </div>

            <div style="font-size:0.95rem; line-height:1.5;">
                <strong>\uD83D\uDC64 ${p.customer}</strong><br>
                \uD83D\uDCDE <a href="https://wa.me/57${p.phone.replace(/[^0-9]/g,'')}" target="_blank" style="color:#25D366; text-decoration:none;">${p.phone}</a><br>
                \uD83D\uDCCD ${p.address}
            </div>

            ${detalleHtml}
            ${abonoHtml}

            <div style="display:flex; gap:8px; margin-top:auto; padding-top:10px; border-top:1px solid #eee;">
                <button onclick="markOrderState('${p.id}', 'Pendiente')" style="flex:1; padding:10px 5px; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.8rem; border:2px solid ${p.status === 'Pendiente' ? '#eab308' : '#fef08a'}; background:${p.status === 'Pendiente' ? '#fef08a' : '#fff'}; color:#a16207; transition:all 0.2s;">🟡 Pendiente</button>
                <button onclick="markOrderState('${p.id}', 'En preparación')" style="flex:1; padding:10px 5px; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.8rem; border:2px solid ${p.status === 'En preparación' ? '#3b82f6' : '#bfdbfe'}; background:${p.status === 'En preparación' ? '#bfdbfe' : '#fff'}; color:#1d4ed8; transition:all 0.2s;">🔵 Preparando</button>
                <button onclick="markOrderState('${p.id}', 'En Camino')" style="flex:1; padding:10px 5px; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.8rem; border:2px solid ${p.status === 'En Camino' ? '#7c3aed' : '#ddd6fe'}; background:${p.status === 'En Camino' ? '#ddd6fe' : '#fff'}; color:#5b21b6; transition:all 0.2s;">🛵 En Camino</button>
                <button onclick="markOrderState('${p.id}', 'Entregado')" style="flex:1; padding:10px 5px; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.8rem; border:2px solid ${p.status === 'Entregado' ? '#22c55e' : '#bbf7d0'}; background:${p.status === 'Entregado' ? '#bbf7d0' : '#fff'}; color:#15803d; transition:all 0.2s;">🟢 Entregado</button>
            </div>
        </div>`;
    }).join('');
};

const originalUpdateCart = window.updateCart;
if (originalUpdateCart) {
    window.updateCart = function() {
        if (typeof cart !== 'undefined' && Array.isArray(cart)) {
            cart.forEach(item => {
                item.quantity = parseInt(item.quantity) || 1;
                item.price = parseFloat(item.price) || 0;
            });
        }
        originalUpdateCart.apply(this, arguments);
    };
}


// === INTERACTIVIDAD TARJETAS MÉTRICAS Y RANKING ===
const originalRenderAdminDashboard = window.renderAdminDashboard;
window.renderAdminDashboard = function() {
    // Ejecutar el original
    if (typeof originalRenderAdminDashboard === 'function') {
        originalRenderAdminDashboard.apply(this, arguments);
    }
    
    // Inyectar interactividad
    const container = document.getElementById('admin-dashboard-cards');
    if (container && container.children.length > 0) {
        // Añadir clase a todas
        Array.from(container.children).forEach(card => {
            card.classList.add('metric-card');
        });

        // 6. Cliente Estrella (Última tarjeta, índice 5)
        const starCard = container.children[5];
        if (starCard) {
            starCard.onclick = () => window.abrirRankingClientesCompleto();
            starCard.title = "Clic para ver el Ranking Completo";
        }

        // 5. Pedidos Recibidos (índice 4)
        const ordersCard = container.children[4];
        if (ordersCard) {
            ordersCard.onclick = () => window.abrirLibroContable();
            ordersCard.title = "Clic para abrir Libro Contable de Pedidos";
        }

        // 4. Total Ahorrado (índice 3)
        const ahorradoCard = container.children[3];
        if (ahorradoCard) {
            ahorradoCard.onclick = () => {
                let realDisc = 0;
                if (typeof pedidosHistorial !== 'undefined') {
                    pedidosHistorial.forEach(p => {
                        if (p.status !== 'Cancelado') {
                            // Validar el descuento real calculado
                            
                            const pDateObj = p.timestamp ? new Date(p.timestamp) : new Date();
                            const now = new Date();
                            if (pDateObj.getMonth() === now.getMonth() && pDateObj.getFullYear() === now.getFullYear()) {
                                realDisc += (p.discount || 0);
                            }

                        }
                    });
                }
                if (typeof showToast === 'function') {
                    showToast("Total de descuentos en el mes: $" + realDisc.toLocaleString() + " COP", "🏷️", 4000);
                } else {
                    alert("Total de descuentos en el mes: $" + realDisc.toLocaleString() + " COP");
                }
            };
            ahorradoCard.title = "Clic para verificar suma de descuentos";
        }
    }
};

window.abrirRankingClientesCompleto = function() {
    let cTotals = {};
    let cCount = {};
    
    if (typeof pedidosHistorial !== 'undefined') {
        pedidosHistorial.forEach(p => {
            if (p.status !== 'Cancelado' && p.email && p.email !== 'N/A') {
                cTotals[p.email] = (cTotals[p.email] || 0) + p.total;
                cCount[p.email] = (cCount[p.email] || 0) + 1;
            }
        });
    }

    let topClients = Object.keys(cTotals).map(k => ({ 
        email: k, 
        total: cTotals[k], 
        count: cCount[k] 
    })).sort((a, b) => b.total - a.total);

    let html = `<h3 style="margin-bottom:15px; color:var(--brand-pink); border-bottom: 2px solid #f8c8d4; padding-bottom:5px;">🏆 Ranking de Clientes</h3>` +
    `<div style="max-height: 400px; overflow-y: auto;">
        <table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
                <tr style="border-bottom: 2px solid #eee; text-align: left;">
                    <th style="padding: 10px 5px;">Puesto</th>
                    <th style="padding: 10px 5px;">Cliente</th>
                    <th style="padding: 10px 5px; text-align:center;">Pedidos</th>
                    <th style="padding: 10px 5px;">Total Gastado</th>
                    <th style="padding: 10px 5px;">Nivel</th>
                </tr>
            </thead>
            <tbody>`;
            
    if (topClients.length === 0) {
        html += `<tr><td colspan="5" style="text-align:center; padding:20px;">No hay clientes registrados aún.</td></tr>`;
    } else {
        topClients.forEach((c, idx) => {
            const u = typeof db_users !== 'undefined' ? db_users.find(x => x.email === c.email) : null;
            const name = u ? u.name : c.email;
            const phone = (u && u.phone) ? u.phone : '';
            const isVip = (u && u.vip) ? '<span style="color:#e11d48; font-weight:bold;">👑 VIP</span>' : (c.count >= 5 ? '<span style="color:#d97706;">🌟 Frecuente</span>' : '<span style="color:#16a34a;">🌱 Nuevo</span>');
            html += `<tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 5px; font-weight: bold; color: #555;">#${idx + 1}</td>
                <td style="padding: 10px 5px;">${name}<br><small style="color:#888;">${phone}</small></td>
                <td style="padding: 10px 5px; text-align:center;">${c.count}</td>
                <td style="padding: 10px 5px; font-weight: bold; color: var(--brand-pink);">$${c.total.toLocaleString()}</td>
                <td style="padding: 10px 5px;">${isVip}</td>
            </tr>`;
        });
    }
    
    html += `</tbody></table></div>`;

    // Usar el modal genérico de detalles de pedido que ya existe en contabilidad
    const modalContent = document.getElementById('contabilidad-detalle-content');
    if(modalContent) {
        modalContent.innerHTML = html;
        const modal = document.getElementById('modal-detalle-pedido');
        if(modal) modal.style.display = 'flex';
    }
};

// Re-renderizar si ya había cargado
if (typeof renderAdminDashboard === 'function') {
    renderAdminDashboard();
}
