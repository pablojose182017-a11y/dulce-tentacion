window.costosState = {
    insumos: JSON.parse(localStorage.getItem('pd_costos_insumos') || '[]'),
    recetas: JSON.parse(localStorage.getItem('pd_costos_recetas') || '[]'),
    factorServiciosPct: 10 // 10% estándar para gas y servicios
};

// Precarga de insumos si está vacío
if (window.costosState.insumos.length === 0) {
    window.costosState.insumos = [
        { id: 'ins_1', nombre: 'Harina de Trigo', unidadCompra: 'kg', cantidadCompra: 50, costoTotal: 160000, costoUnitario: 160000 / (50 * 1000), unidadBase: 'g' },
        { id: 'ins_2', nombre: 'Azúcar', unidadCompra: 'kg', cantidadCompra: 50, costoTotal: 190000, costoUnitario: 190000 / (50 * 1000), unidadBase: 'g' },
        { id: 'ins_3', nombre: 'Margarina', unidadCompra: 'kg', cantidadCompra: 5, costoTotal: 65000, costoUnitario: 65000 / (5 * 1000), unidadBase: 'g' },
        { id: 'ins_4', nombre: 'Sal', unidadCompra: 'kg', cantidadCompra: 1, costoTotal: 2000, costoUnitario: 2000 / (1 * 1000), unidadBase: 'g' },
        { id: 'ins_5', nombre: 'Levadura', unidadCompra: 'g', cantidadCompra: 500, costoTotal: 12000, costoUnitario: 12000 / 500, unidadBase: 'g' }
    ];
    localStorage.setItem('pd_costos_insumos', JSON.stringify(window.costosState.insumos));
}

window.cambiarSubtabCostos = function(tabName) {
    const tabs = ['insumos', 'recetas', 'informes', 'guardian'];
    
    // Ocultar todos los contenedores
    tabs.forEach(t => {
        const el = document.getElementById('costos-' + t);
        if (el) el.style.display = 'none';
    });

    // Desmarcar todos los botones
    const btns = document.querySelectorAll('.costos-subtabs .stock-filter-chip');
    btns.forEach(b => b.classList.remove('active'));

    // Mostrar el contenedor seleccionado
    const selectedEl = document.getElementById('costos-' + tabName);
    if (selectedEl) selectedEl.style.display = 'block';

    // Marcar el botón activo correspondiente
    const selectedBtn = Array.from(btns).find(b => b.getAttribute('onclick') && b.getAttribute('onclick').includes(`('${tabName}')`));
    if (selectedBtn) selectedBtn.classList.add('active');

    // Lógicas de renderizado específicas por pestaña
    if (tabName === 'insumos') {
        window.renderInsumosView();
    } else if (tabName === 'recetas') {
        window.renderRecetasView();
    } else if (tabName === 'informes') {
        if (typeof window.renderRentabilidadChart === 'function') {
            window.renderRentabilidadChart();
        }
    } else if (tabName === 'guardian') {
        if (typeof window.renderGuardianView === 'function') {
            window.renderGuardianView();
        }
    }
};

// ==========================================
// SUBMÓDULO 1: MATERIAS PRIMAS (INSUMOS)
// ==========================================

window.insumoEnEdicionId = null;

window.renderInsumosView = function() {
    const container = document.getElementById('costos-insumos');
    if (!container) return;

    let html = `
        <div style="background:#fff; border-radius:12px; padding:15px; box-shadow:0 2px 8px rgba(0,0,0,0.05); margin-bottom:20px; border:1px solid #f1e8e4;">
            <h4 id="insumos-form-title" style="margin-bottom:15px; color:#be185d; font-size:1.05rem;">➕ Agregar Nuevo Insumo</h4>
            <form id="form-insumos" onsubmit="window.guardarInsumo(event)" style="display:flex; flex-wrap:wrap; gap:10px; align-items:flex-end;">
                <div style="flex:1; min-width:200px;">
                    <label style="font-size:0.8rem; font-weight:700; color:#475569;">Nombre del Insumo</label>
                    <input type="text" id="ins-nombre" required placeholder="Ej: Harina de Trigo" class="checkout-input" style="margin-bottom:0;">
                </div>
                <div style="flex:1; min-width:140px;">
                    <label style="font-size:0.8rem; font-weight:700; color:#475569;">Unidad de Compra</label>
                    <select id="ins-unidad" required class="checkout-input" style="margin-bottom:0; padding:9px;">
                        <option value="kg">Kilos (kg)</option>
                        <option value="g">Gramos (g)</option>
                        <option value="L">Litros (L)</option>
                        <option value="ml">Mililitros (ml)</option>
                        <option value="und">Unidades (und)</option>
                    </select>
                </div>
                <div style="flex:1; min-width:100px;">
                    <label style="font-size:0.8rem; font-weight:700; color:#475569;">Cantidad</label>
                    <input type="number" id="ins-cantidad" required min="0.01" step="0.01" placeholder="Ej: 50" class="checkout-input" style="margin-bottom:0;">
                </div>
                <div style="flex:1; min-width:140px;">
                    <label style="font-size:0.8rem; font-weight:700; color:#475569;">Costo Pagado ($)</label>
                    <input type="number" id="ins-costo" required min="1" placeholder="Ej: 160000" class="checkout-input" style="margin-bottom:0;">
                </div>
                <div id="insumos-form-actions" style="display:flex; gap:10px;">
                    <button type="submit" id="insumos-submit-btn" class="btn-admin-action" style="background:#16a34a; color:#fff; border:none; padding:10px 15px; border-radius:8px; font-weight:bold; cursor:pointer;">
                        Guardar Insumo
                    </button>
                    <!-- El botón cancelar se inyectará aquí al editar -->
                </div>
            </form>
        </div>

        <div style="background:#fff; border-radius:12px; padding:15px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #f1e8e4;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
                <h4 style="margin:0; color:#334155; font-size:1.1rem;">📦 Inventario de Insumos</h4>
                <input type="text" id="ins-search" placeholder="🔍 Buscar insumo..." onkeyup="window.filtrarInsumos()" class="checkout-input" style="margin:0; max-width:250px; padding:6px 12px;">
            </div>
            
            <div class="admin-table-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; color:#475569;">
                            <th style="padding:10px;">Insumo</th>
                            <th style="padding:10px;">Presentación Compra</th>
                            <th style="padding:10px;">Costo Total</th>
                            <th style="padding:10px;">Costo Base</th>
                            <th style="padding:10px; text-align:center;">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="insumos-tbody">
                        <!-- Llenado dinámico -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    container.innerHTML = html;
    window.renderInsumosTable(window.costosState.insumos);
};

window.renderInsumosTable = function(insumosArray) {
    const tbody = document.getElementById('insumos-tbody');
    if (!tbody) return;

    if (insumosArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#94a3b8;">No hay insumos registrados.</td></tr>';
        return;
    }

    let rows = '';
    insumosArray.forEach(ins => {
        rows += `
            <tr style="border-bottom:1px solid #f1f5f9; transition:background 0.2s;" class="insumo-row">
                <td style="padding:10px; font-weight:600; color:#1e293b;" class="ins-nombre-col">${ins.nombre}</td>
                <td style="padding:10px;">${ins.cantidadCompra} ${ins.unidadCompra}</td>
                <td style="padding:10px; color:#0f766e; font-weight:700;">$${ins.costoTotal.toLocaleString('es-CO')}</td>
                <td style="padding:10px; background:#f0fdf4; font-weight:bold; color:#15803d;">
                    $${ins.costoUnitario.toLocaleString('es-CO', {minimumFractionDigits:2, maximumFractionDigits:2})} / ${ins.unidadBase}
                </td>
                <td style="padding:10px; text-align:center;">
                    <button onclick="window.editarInsumo('${ins.id}')" style="background:none; border:none; cursor:pointer; color:#0284c7; font-size:1.1rem; margin-right:5px;" title="Editar Insumo">✏️</button>
                    <button onclick="window.eliminarInsumo('${ins.id}')" style="background:none; border:none; cursor:pointer; color:#dc2626; font-size:1.1rem;" title="Eliminar Insumo">🗑️</button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = rows;
};

window.filtrarInsumos = function() {
    const input = document.getElementById('ins-search');
    if (!input) return;
    const q = input.value.toLowerCase().trim();
    const rows = document.querySelectorAll('.insumo-row');
    
    rows.forEach(row => {
        const nombre = row.querySelector('.ins-nombre-col').textContent.toLowerCase();
        if (nombre.includes(q)) row.style.display = '';
        else row.style.display = 'none';
    });
};

window.guardarInsumo = function(e) {
    e.preventDefault();
    const nombre = document.getElementById('ins-nombre').value.trim();
    const unidadCompra = document.getElementById('ins-unidad').value;
    const cantidadCompra = parseFloat(document.getElementById('ins-cantidad').value);
    const costoTotal = parseFloat(document.getElementById('ins-costo').value);

    if (!nombre || !unidadCompra || isNaN(cantidadCompra) || isNaN(costoTotal)) {
        if(typeof showToast === 'function') showToast('Llena todos los campos correctamente.', '⚠️');
        return;
    }

    let unidadBase = '';
    let cantidadEnBase = 0;

    switch (unidadCompra) {
        case 'kg':
            unidadBase = 'g';
            cantidadEnBase = cantidadCompra * 1000;
            break;
        case 'g':
            unidadBase = 'g';
            cantidadEnBase = cantidadCompra;
            break;
        case 'L':
            unidadBase = 'ml';
            cantidadEnBase = cantidadCompra * 1000;
            break;
        case 'ml':
            unidadBase = 'ml';
            cantidadEnBase = cantidadCompra;
            break;
        case 'und':
            unidadBase = 'und';
            cantidadEnBase = cantidadCompra;
            break;
    }

    const costoUnitario = costoTotal / cantidadEnBase;

    if (window.insumoEnEdicionId) {
        const idx = window.costosState.insumos.findIndex(i => i.id === window.insumoEnEdicionId);
        if (idx !== -1) {
            window.costosState.insumos[idx] = {
                ...window.costosState.insumos[idx],
                nombre,
                unidadCompra,
                cantidadCompra,
                costoTotal,
                unidadBase,
                costoUnitario
            };
        }
        if(typeof showToast === 'function') showToast('Insumo actualizado con éxito', '✅');
        window.cancelarEdicionInsumo();
    } else {
        const nuevoInsumo = {
            id: 'ins_' + Date.now().toString(),
            nombre,
            unidadCompra,
            cantidadCompra,
            costoTotal,
            unidadBase,
            costoUnitario
        };
        window.costosState.insumos.push(nuevoInsumo);
        document.getElementById('form-insumos').reset();
        if(typeof showToast === 'function') showToast('Insumo agregado con éxito', '✅');
    }

    localStorage.setItem('pd_costos_insumos', JSON.stringify(window.costosState.insumos));
    window.renderInsumosTable(window.costosState.insumos);
};

window.eliminarInsumo = function(id) {
    if (!confirm('¿Seguro que deseas eliminar este insumo? Las fichas técnicas que lo usen podrían verse afectadas.')) return;
    
    window.costosState.insumos = window.costosState.insumos.filter(ins => ins.id !== id);
    localStorage.setItem('pd_costos_insumos', JSON.stringify(window.costosState.insumos));
    
    window.renderInsumosTable(window.costosState.insumos);
    if(typeof showToast === 'function') showToast('Insumo eliminado', '🗑️');
};

window.editarInsumo = function(id) {
    const ins = window.costosState.insumos.find(i => i.id === id);
    if (!ins) return;

    window.insumoEnEdicionId = id;

    document.getElementById('ins-nombre').value = ins.nombre;
    document.getElementById('ins-unidad').value = ins.unidadCompra;
    document.getElementById('ins-cantidad').value = ins.cantidadCompra;
    document.getElementById('ins-costo').value = ins.costoTotal;

    document.getElementById('insumos-form-title').innerHTML = '✏️ Editar Insumo';
    document.getElementById('insumos-form-title').style.color = '#0284c7';
    
    document.getElementById('insumos-form-actions').innerHTML = `
        <button type="submit" id="insumos-submit-btn" class="btn-admin-action" style="background:#0284c7; color:#fff; border:none; padding:10px 15px; border-radius:8px; font-weight:bold; cursor:pointer;">
            Actualizar Insumo
        </button>
        <button type="button" onclick="window.cancelarEdicionInsumo()" class="btn-admin-action" style="background:#e2e8f0; color:#475569; border:none; padding:10px 15px; border-radius:8px; font-weight:bold; cursor:pointer;">
            Cancelar
        </button>
    `;

    // Hacer scroll suave hacia el formulario
    document.getElementById('form-insumos').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.cancelarEdicionInsumo = function() {
    window.insumoEnEdicionId = null;
    document.getElementById('form-insumos').reset();
    
    document.getElementById('insumos-form-title').innerHTML = '➕ Agregar Nuevo Insumo';
    document.getElementById('insumos-form-title').style.color = '#be185d';
    
    document.getElementById('insumos-form-actions').innerHTML = `
        <button type="submit" id="insumos-submit-btn" class="btn-admin-action" style="background:#16a34a; color:#fff; border:none; padding:10px 15px; border-radius:8px; font-weight:bold; cursor:pointer;">
            Guardar Insumo
        </button>
    `;
};

// ==========================================
// SUBMÓDULO 4: GUARDIÁN FINANCIERO IA
// ==========================================

window.renderGuardianView = function() {
    const container = document.getElementById('costos-guardian');
    if (!container) return;

    // Obtener métricas rápidas de recetas
    const stats = window.costosState.recetas.map(rec => {
        let costoInsumos = 0;
        rec.ingredientes.forEach(ing => {
            const ins = window.costosState.insumos.find(i => i.id === ing.insumoId);
            if (ins) costoInsumos += ins.costoUnitario * ing.cantidad;
        });
        const costoTotal = (costoInsumos + (costoInsumos * (rec.factorServiciosPct / 100))) / rec.rendimiento;
        const ganancia = rec.precioVenta - costoTotal;
        const margen = rec.precioVenta > 0 ? (ganancia / rec.precioVenta) * 100 : 0;
        return { ...rec, costoUnitario: costoTotal, margenPct: margen };
    });

    const criticas = stats.filter(s => s.margenPct < 30).length;
    let guardianMsg = criticas === 0 
        ? "✅ Todo en orden, jefe. Ninguna ficha técnica está reportando pérdidas o márgenes críticos hoy."
        : `⚠️ ¡Atención! He detectado ${criticas} receta(s) con un margen crítico o negativo. Revisa la pestaña de informes urgente.`;
    let guardianColor = criticas === 0 ? '#16a34a' : '#dc2626';

    let optionsRecetas = '<option value="">-- Selecciona un producto para simular --</option>';
    stats.forEach(s => {
        optionsRecetas += `<option value="${s.id}">${s.nombre} (Costo: $${s.costoUnitario.toLocaleString('es-CO', {maximumFractionDigits:0})})</option>`;
    });

    container.innerHTML = `
        <!-- Tarjeta Guardián -->
        <div style="background:#fff; border-radius:12px; padding:20px; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #fce7f3; margin-bottom:25px; display:flex; gap:20px; align-items:center;">
            <div style="font-size:3rem; background:#fff1f2; padding:15px; border-radius:50%; box-shadow:0 2px 10px rgba(190, 24, 93, 0.2);">🤖</div>
            <div>
                <h3 style="margin:0 0 5px 0; color:#be185d; font-size:1.3rem;">Guardián Financiero</h3>
                <p style="margin:0; color:#475569; font-weight:600; font-size:0.95rem;">${guardianMsg}</p>
                <button onclick="window.cambiarSubtabCostos('informes')" style="margin-top:10px; background:#f1f5f9; color:#0369a1; border:none; padding:6px 15px; border-radius:20px; font-weight:bold; cursor:pointer; font-size:0.85rem;">🔍 Escanear Rentabilidad Completa</button>
            </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:20px;">
            <!-- Simulador de Ofertas -->
            <div style="background:#fff; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #e2e8f0;">
                <h4 style="margin:0 0 15px 0; color:#334155;">🏷️ Simulador de Descuentos</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <select id="guardian-sim-receta" class="checkout-input" style="margin:0;" onchange="window.simularOfertaGuardian()">
                        ${optionsRecetas}
                    </select>
                    
                    <div style="display:flex; gap:10px;">
                        <select id="guardian-sim-tipo" class="checkout-input" style="margin:0; flex:1;" onchange="window.simularOfertaGuardian()">
                            <option value="pct">Descuento (%)</option>
                            <option value="fijo">Precio Fijo ($)</option>
                            <option value="2x1">Promo 2x1</option>
                        </select>
                        <input type="number" id="guardian-sim-valor" class="checkout-input" style="margin:0; flex:1;" placeholder="Valor..." oninput="window.simularOfertaGuardian()">
                    </div>
                    
                    <div id="guardian-sim-resultado" style="margin-top:10px; padding:15px; border-radius:8px; background:#f8fafc; border:1px dashed #cbd5e1; text-align:center; font-size:0.9rem; color:#64748b;">
                        Selecciona un producto y un valor para que te diga si la oferta te quiebra o te hace ganar dinero.
                    </div>
                </div>
            </div>

            <!-- Calculador VIP -->
            <div style="background:#fff; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #e2e8f0;">
                <h4 style="margin:0 0 15px 0; color:#334155;">⭐ Calculador de Puntos VIP</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <select id="guardian-vip-receta" class="checkout-input" style="margin:0;" onchange="window.calcularPuntosVIPGuardian()">
                        ${optionsRecetas}
                    </select>
                    
                    <div style="font-size:0.8rem; color:#64748b;">
                        Define cuánto dinero ($) de ganancia neta te debe dejar un cliente en compras previas para ganarse este producto gratis:
                    </div>
                    
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="range" id="guardian-vip-multiplicador" min="3" max="10" value="5" style="flex:1;" oninput="document.getElementById('vip-multi-label').innerText = this.value + 'x'; window.calcularPuntosVIPGuardian()">
                        <strong id="vip-multi-label" style="color:#0369a1;">5x</strong>
                    </div>

                    <div id="guardian-vip-resultado" style="margin-top:10px; padding:15px; border-radius:8px; background:#f0fdf4; border:1px solid #bbf7d0; text-align:center; font-size:0.95rem; color:#16a34a; font-weight:bold;">
                        -- Puntos Sugeridos --
                    </div>
                </div>
            </div>
        </div>
    `;

    const chatHtml = 
        '<div style="background:#fff; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #e2e8f0; margin-top:20px;">' +
            '<div style="display:flex; align-items:center; gap:10px; border-bottom:1px solid #f1f5f9; padding-bottom:10px; margin-bottom:15px;">' +
                '<div style="font-size:2rem;">🤖</div>' +
                '<div>' +
                    '<h4 style="margin:0; color:#be185d;">Chat con el Guardián Financiero</h4>' +
                    '<span style="font-size:0.8rem; color:#16a34a;">● En línea y vigilando el bolsillo</span>' +
                '</div>' +
            '</div>' +
            '<div id="guardian-chat-messages" style="height:250px; overflow-y:auto; display:flex; flex-direction:column; gap:10px; margin-bottom:15px; padding-right:10px;">' +
                '<div style="background:#f1f5f9; padding:10px 15px; border-radius:15px 15px 15px 0; align-self:flex-start; max-width:80%; font-size:0.9rem; color:#334155;">' +
                    '¡Hola Pablo! Pregúntame sobre tus recetas, insumos, márgenes o simula precios. Estoy aquí para cuidar tu dinero.' +
                '</div>' +
            '</div>' +
            '<div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:10px; margin-bottom:10px;">' +
                '<button onclick="window.enviarMensajeGuardian(\'¿Cuál es el pan más rentable?\')" class="stock-filter-chip" style="font-size:0.8rem; padding:4px 10px;">¿Pan más rentable?</button>' +
                '<button onclick="window.enviarMensajeGuardian(\'¿Qué insumo es más costoso?\')" class="stock-filter-chip" style="font-size:0.8rem; padding:4px 10px;">¿Insumo más costoso?</button>' +
                '<button onclick="window.enviarMensajeGuardian(\'Consejo para mejorar márgenes\')" class="stock-filter-chip" style="font-size:0.8rem; padding:4px 10px;">Consejo de márgenes</button>' +
            '</div>' +
            '<div style="display:flex; gap:10px;">' +
                '<input type="text" id="guardian-chat-input" class="checkout-input" style="margin:0; flex:1;" placeholder="Pregúntale al Guardián..." onkeypress="if(event.key === \'Enter\') window.enviarMensajeGuardian()">' +
                '<button onclick="window.enviarMensajeGuardian()" style="background:#be185d; color:#fff; border:none; padding:10px 15px; border-radius:8px; font-weight:bold; cursor:pointer;">Enviar 🚀</button>' +
            '</div>' +
        '</div>';

    container.innerHTML += chatHtml;
};

window.simularOfertaGuardian = function() {
    const recetaId = document.getElementById('guardian-sim-receta').value;
    const tipo = document.getElementById('guardian-sim-tipo').value;
    const valorInput = parseFloat(document.getElementById('guardian-sim-valor').value);
    const resultDiv = document.getElementById('guardian-sim-resultado');

    if (!recetaId) {
        resultDiv.innerHTML = "Selecciona un producto primero.";
        resultDiv.style = "margin-top:10px; padding:15px; border-radius:8px; background:#f8fafc; border:1px dashed #cbd5e1; text-align:center; font-size:0.9rem; color:#64748b;";
        return;
    }

    const rec = window.costosState.recetas.find(r => r.id === recetaId);
    if (!rec) return;

    let costoInsumos = 0;
    rec.ingredientes.forEach(ing => {
        const ins = window.costosState.insumos.find(i => i.id === ing.insumoId);
        if (ins) costoInsumos += ins.costoUnitario * ing.cantidad;
    });
    const costoUnitario = (costoInsumos + (costoInsumos * (rec.factorServiciosPct / 100))) / rec.rendimiento;

    let nuevoPrecioVenta = 0;
    
    if (tipo === 'pct' && valorInput > 0) {
        nuevoPrecioVenta = rec.precioVenta * (1 - (valorInput / 100));
    } else if (tipo === 'fijo' && valorInput > 0) {
        nuevoPrecioVenta = valorInput;
    } else if (tipo === '2x1') {
        nuevoPrecioVenta = rec.precioVenta / 2; // Efectivamente se cobra la mitad por unidad entregada
    } else {
        resultDiv.innerHTML = "Ingresa un valor válido para simular.";
        return;
    }

    const nuevaGanancia = nuevoPrecioVenta - costoUnitario;
    const nuevoMargen = nuevoPrecioVenta > 0 ? (nuevaGanancia / nuevoPrecioVenta) * 100 : 0;

    let mensaje = "";
    let colorBg = "";
    let colorText = "";
    let colorBorder = "";

    if (nuevoMargen >= 35) {
        mensaje = "✅ <strong>¡Oferta segura!</strong> Mantienes un margen del " + nuevoMargen.toFixed(1) + "%. Ganas $" + nuevaGanancia.toLocaleString('es-CO', {maximumFractionDigits:0}) + " por cada unidad que vendas en promo.";
        colorBg = "#dcfce7"; colorText = "#166534"; colorBorder = "#bbf7d0";
    } else if (nuevoMargen >= 15) {
        mensaje = "⚠️ <strong>¡Ojo, Pablo!</strong> Estás al límite. El margen cae al " + nuevoMargen.toFixed(1) + "%. Ganas apenas $" + nuevaGanancia.toLocaleString('es-CO', {maximumFractionDigits:0}) + " por unidad.";
        colorBg = "#fef9c3"; colorText = "#854d0e"; colorBorder = "#fde047";
    } else {
        mensaje = "🚨 <strong>¡ESTA OFERTA TE QUIEBRA!</strong> " + (nuevaGanancia < 0 ? 'Estás perdiendo' : 'Apenas ganas') + " $" + nuevaGanancia.toLocaleString('es-CO', {maximumFractionDigits:0}) + " por unidad (Margen: " + nuevoMargen.toFixed(1) + "%). Ni se te ocurra activarla así, no cubres los gastos.";
        colorBg = "#fee2e2"; colorText = "#991b1b"; colorBorder = "#fecaca";
    }

    resultDiv.innerHTML = mensaje;
    resultDiv.style.cssText = "margin-top:10px; padding:15px; border-radius:8px; font-size:0.95rem; background:" + colorBg + "; color:" + colorText + "; border:1px solid " + colorBorder + ";";
};

window.calcularPuntosVIPGuardian = function() {
    const recetaId = document.getElementById('guardian-vip-receta').value;
    const multiplicador = parseInt(document.getElementById('guardian-vip-multiplicador').value) || 5;
    const resultDiv = document.getElementById('guardian-vip-resultado');

    if (!recetaId) {
        resultDiv.innerHTML = "-- Puntos Sugeridos --";
        return;
    }

    const rec = window.costosState.recetas.find(r => r.id === recetaId);
    let costoInsumos = 0;
    rec.ingredientes.forEach(ing => {
        const ins = window.costosState.insumos.find(i => i.id === ing.insumoId);
        if (ins) costoInsumos += ins.costoUnitario * ing.cantidad;
    });
    const costoUnitario = (costoInsumos + (costoInsumos * (rec.factorServiciosPct / 100))) / rec.rendimiento;

    // Lógica: Para regalar este producto, el cliente debió habernos dejado en ganancia Neta 
    // el Costo Unitario multiplicado por X veces (multiplicador).
    const gananciaRequerida = costoUnitario * multiplicador;
    
    // Asumiendo que 1 Punto = $1000 pesos de venta (o ganancia, depende de la regla del VIP).
    // Digamos que cada punto que el cliente gana, nos costó darle 1 punto. 
    // Vamos a sugerir cobrarle "gananciaRequerida / 100" puntos (ejemplo simple).
    // Usaremos una conversión estándar: Puntos Sugeridos = (Costo * Multiplicador) / 100
    const puntosSugeridos = Math.ceil(gananciaRequerida / 100);

    resultDiv.innerHTML = "Exige <strong>" + puntosSugeridos + " Pts</strong><br><span style=\"font-size:0.8rem; font-weight:normal;\">(Cubre su costo $" + costoUnitario.toLocaleString('es-CO', {maximumFractionDigits:0}) + " y garantiza " + multiplicador + "x de retorno previo)</span>";
};

window.enviarMensajeGuardian = function(textoPredefinido = null) {
    const input = document.getElementById('guardian-chat-input');
    const msgTexto = textoPredefinido || input.value.trim();
    if (!msgTexto) return;
    
    if (!textoPredefinido) input.value = '';

    window.appendMensajeGuardian(msgTexto, 'user');

    // Simular pequeño retraso de pensamiento
    setTimeout(() => {
        const respuesta = window.procesarMensajeGuardian(msgTexto.toLowerCase());
        window.appendMensajeGuardian(respuesta, 'bot');
    }, 600);
};

window.appendMensajeGuardian = function(html, sender) {
    const chatContainer = document.getElementById('guardian-chat-messages');
    if (!chatContainer) return;
    
    const align = sender === 'user' ? 'align-self:flex-end; border-radius:15px 15px 0 15px; background:#e0f2fe; color:#0369a1;' : 'align-self:flex-start; border-radius:15px 15px 15px 0; background:#f1f5f9; color:#334155;';
    
    const div = document.createElement('div');
    div.style.cssText = 'padding:10px 15px; max-width:80%; font-size:0.9rem; ' + align;
    div.innerHTML = html;
    
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
};

window.procesarMensajeGuardian = function(q) {
    // Calcular stats rápidos
    const stats = window.costosState.recetas.map(rec => {
        let costoInsumos = 0;
        rec.ingredientes.forEach(ing => {
            const ins = window.costosState.insumos.find(i => i.id === ing.insumoId);
            if (ins) costoInsumos += ins.costoUnitario * ing.cantidad;
        });
        const costoTotal = (costoInsumos + (costoInsumos * (rec.factorServiciosPct / 100))) / rec.rendimiento;
        const ganancia = rec.precioVenta - costoTotal;
        const margen = rec.precioVenta > 0 ? (ganancia / rec.precioVenta) * 100 : 0;
        return { ...rec, costoUnitario: costoTotal, ganancia, margenPct: margen };
    });

    if (q.includes('más rentable') || q.includes('mas rentable') || q.includes('mejor margen')) {
        if (stats.length === 0) return 'Aún no tienes recetas registradas.';
        stats.sort((a,b) => b.margenPct - a.margenPct);
        const mejor = stats[0];
        return '🥇 El producto más rentable es <strong>' + mejor.nombre + '</strong> con un margen del ' + mejor.margenPct.toFixed(1) + '% y una ganancia de $' + mejor.ganancia.toLocaleString('es-CO', {maximumFractionDigits:0}) + ' por unidad.';
    }

    if (q.includes('menos rentable') || q.includes('peor margen') || q.includes('perdida') || q.includes('pérdida')) {
        if (stats.length === 0) return 'Aún no tienes recetas registradas.';
        stats.sort((a,b) => a.margenPct - b.margenPct);
        const peor = stats[0];
        return '⚠️ El producto menos rentable es <strong>' + peor.nombre + '</strong> con un margen del ' + peor.margenPct.toFixed(1) + '%. Ganancia: $' + peor.ganancia.toLocaleString('es-CO', {maximumFractionDigits:0}) + '.';
    }

    if (q.includes('más costoso') || q.includes('mas costoso') || q.includes('mas caro') || q.includes('más caro')) {
        if (window.costosState.insumos.length === 0) return 'No hay insumos registrados.';
        const insumos = [...window.costosState.insumos].sort((a,b) => b.costoTotal - a.costoTotal);
        const caro = insumos[0];
        return '💸 El insumo en el que más has gastado es <strong>' + caro.nombre + '</strong> ($' + caro.costoTotal.toLocaleString('es-CO') + ' por ' + caro.cantidadCompra + caro.unidadCompra + ').';
    }

    if (q.includes('consejo') || q.includes('mejorar')) {
        return '💡 <strong>Consejo del Guardián:</strong> Revisa siempre tus insumos más caros y trata de comprar al por mayor. Si tienes panes con margen menor al 30%, considera subirles el precio o reducir la porción ligeramente. ¡Los centavos suman!';
    }

    // Buscar si menciona una receta específica
    const recEncontrada = stats.find(s => q.includes(s.nombre.toLowerCase()));
    if (recEncontrada) {
        return '🍞 Para <strong>' + recEncontrada.nombre + '</strong>:<br>- Costo Unitario: $' + recEncontrada.costoUnitario.toLocaleString('es-CO', {maximumFractionDigits:0}) + '<br>- Precio Venta: $' + recEncontrada.precioVenta.toLocaleString('es-CO') + '<br>- Ganancia: $' + recEncontrada.ganancia.toLocaleString('es-CO', {maximumFractionDigits:0}) + ' (' + recEncontrada.margenPct.toFixed(1) + '% margen).';
    }

    // Buscar si menciona un insumo específico
    const insEncontrado = window.costosState.insumos.find(i => q.includes(i.nombre.toLowerCase()));
    if (insEncontrado) {
        return '📦 El insumo <strong>' + insEncontrado.nombre + '</strong> lo compraste a $' + insEncontrado.costoTotal.toLocaleString('es-CO') + '. Su costo base es de $' + insEncontrado.costoUnitario.toLocaleString('es-CO', {maximumFractionDigits:2}) + ' por ' + insEncontrado.unidadBase + '.';
    }

    if (q.includes('vender') || q.includes('precio') || q.includes('descuento') || q.includes('si vendo')) {
        return 'Para simular descuentos o cambios de precio te recomiendo usar la herramienta <strong>"Simulador de Descuentos"</strong> que está justo arriba. ¡Es mucho más precisa!';
    }

    return 'Hmm... Como tu Guardián Financiero, te sugiero ser más directo. Pregúntame sobre "cuál es más rentable", "el costo de algún insumo" o pídeme un "consejo". ¡Estoy para cuidar el negocio!';
};

// ==========================================
// INTERCEPTOR PARA EL FORMULARIO DE PRODUCTOS ORIGINAL
// ==========================================
if (typeof window.guardarEdicionProducto === 'function' && !window._guardianHooked) {
    window._guardianHooked = true;
    const originalGuardarEdicionProducto = window.guardarEdicionProducto;
    
    window.guardarEdicionProducto = function(pId) {
        const nuevoNombre = (document.getElementById('edit-prod-name')?.value || '').trim();
        const nuevoPrecioStr = document.getElementById('edit-prod-price')?.value || '0';
        const nuevoPrecio = parseInt(nuevoPrecioStr.replace(/\\D/g, ''));
        
        // Buscar si existe receta con ese nombre exacto o que lo contenga
        const rec = window.costosState.recetas.find(r => r.nombre.toLowerCase() === nuevoNombre.toLowerCase() || nuevoNombre.toLowerCase().includes(r.nombre.toLowerCase()));
        
        if (rec) {
            let costoInsumos = 0;
            rec.ingredientes.forEach(ing => {
                const ins = window.costosState.insumos.find(i => i.id === ing.insumoId);
                if (ins) costoInsumos += ins.costoUnitario * ing.cantidad;
            });
            const costoUnitario = (costoInsumos + (costoInsumos * (rec.factorServiciosPct / 100))) / rec.rendimiento;
            
            if (nuevoPrecio < costoUnitario) {
                if(typeof showToast === 'function') showToast("¡GUARDIÁN! Estás vendiendo por debajo del costo de producción ($" + costoUnitario.toFixed(0) + ").", '🚨');
                const confirmacion = confirm("⚠️ GUARDIÁN FINANCIERO:\nEl precio de venta $" + nuevoPrecio.toLocaleString('es-CO') + " es MENOR al costo de la ficha técnica ($" + costoUnitario.toLocaleString('es-CO', {maximumFractionDigits:0}) + ").\n\n¿Seguro que quieres guardar el producto y perder dinero?");
                if (!confirmacion) {
                    return; // Bloquea el guardado
                }
            }
        }
        
        originalGuardarEdicionProducto(pId);
    };
}

// ==========================================
// SUBMÓDULO 3: INFORMES DE RENTABILIDAD
// ==========================================

window.myRentabilidadChart = null;

window.renderRentabilidadChart = function() {
    const container = document.getElementById('costos-informes');
    if (!container) return;

    if (window.costosState.recetas.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#64748b; background:#fff; border-radius:12px; border:1px solid #e2e8f0;"><h3 style="color:#be185d;">Aún no hay recetas registradas.</h3><p>Agrega fichas técnicas en la pestaña "Fichas Técnicas" para generar el informe de rentabilidad.</p></div>';
        return;
    }

    // Cálculos y ordenamiento de todas las recetas
    const stats = window.costosState.recetas.map(rec => {
        let costoInsumos = 0;
        rec.ingredientes.forEach(ing => {
            const ins = window.costosState.insumos.find(i => i.id === ing.insumoId);
            if (ins) costoInsumos += ins.costoUnitario * ing.cantidad;
        });
        const costoServicios = costoInsumos * (rec.factorServiciosPct / 100);
        const costoTotalTanda = costoInsumos + costoServicios;
        const costoUnitario = costoTotalTanda / rec.rendimiento;
        const gananciaBruta = rec.precioVenta - costoUnitario;
        const margenPct = rec.precioVenta > 0 ? (gananciaBruta / rec.precioVenta) * 100 : 0;
        return {
            ...rec,
            costoUnitario,
            gananciaBruta,
            margenPct
        };
    }).sort((a, b) => b.margenPct - a.margenPct); // Orden descendente

    const mejor = stats[0];
    const peor = stats[stats.length - 1];
    const avgMargen = stats.reduce((acc, curr) => acc + curr.margenPct, 0) / stats.length;

    // Inyectar HTML
    const html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
            <h3 style="margin:0; color:#334155;">📈 Informe de Rentabilidad</h3>
            <button onclick="window.print()" style="background:#475569; color:#fff; border:none; padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer;">🖨️ Imprimir / Exportar Informe</button>
        </div>
        
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:15px; margin-bottom:25px;">
            <div style="background:#fff; padding:15px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #dcfce7; border-left:5px solid #16a34a;">
                <div style="color:#64748b; font-size:0.85rem; font-weight:bold; margin-bottom:5px;">🥇 Producto más rentable</div>
                <div style="color:#1e293b; font-size:1.1rem; font-weight:900;">${mejor.nombre}</div>
                <div style="color:#16a34a; font-weight:bold; font-size:1.05rem;">${mejor.margenPct.toFixed(1)}% Margen</div>
            </div>
            <div style="background:#fff; padding:15px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #fee2e2; border-left:5px solid #dc2626;">
                <div style="color:#64748b; font-size:0.85rem; font-weight:bold; margin-bottom:5px;">⚠️ Producto crítico / Menor margen</div>
                <div style="color:#1e293b; font-size:1.1rem; font-weight:900;">${peor.nombre}</div>
                <div style="color:#dc2626; font-weight:bold; font-size:1.05rem;">${peor.margenPct.toFixed(1)}% Margen</div>
            </div>
            <div style="background:#fff; padding:15px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #e0f2fe; border-left:5px solid #0284c7;">
                <div style="color:#64748b; font-size:0.85rem; font-weight:bold; margin-bottom:5px;">📊 Margen Promedio General</div>
                <div style="color:#1e293b; font-size:1.3rem; font-weight:900;">${avgMargen.toFixed(1)}%</div>
            </div>
        </div>

        <div style="background:#fff; padding:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.05); border:1px solid #e2e8f0; margin-bottom:25px;">
            <h4 style="margin-top:0; color:#334155; margin-bottom:15px;">Comparativa de Margen (%)</h4>
            <div style="position:relative; height:350px; width:100%;">
                <canvas id="rentabilidadChartCanvas"></canvas>
            </div>
        </div>

        <div style="background:#fff; padding:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.05); border:1px solid #e2e8f0;">
            <h4 style="margin-top:0; color:#334155; margin-bottom:15px;">📋 Informe Ejecutivo Detallado</h4>
            <div class="admin-table-scroll" style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
                <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
                    <thead>
                        <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0; color:#475569;">
                            <th style="padding:10px;">Producto</th>
                            <th style="padding:10px;">Costo Unitario</th>
                            <th style="padding:10px;">Precio Venta</th>
                            <th style="padding:10px;">Ganancia Neta</th>
                            <th style="padding:10px;">Margen Bruto</th>
                            <th style="padding:10px;">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.map(s => {
                            let badge = '';
                            if (s.margenPct >= 50) badge = '🟢 Bueno';
                            else if (s.margenPct >= 30) badge = '🟡 Aceptable';
                            else badge = '🔴 Crítico';
                            return `
                            <tr style="border-bottom:1px solid #f1f5f9;">
                                <td style="padding:10px; font-weight:600; color:#1e293b;">${s.nombre}</td>
                                <td style="padding:10px; color:#be185d;">$${s.costoUnitario.toLocaleString('es-CO', {maximumFractionDigits:0})}</td>
                                <td style="padding:10px; font-weight:bold;">$${s.precioVenta.toLocaleString('es-CO')}</td>
                                <td style="padding:10px; color:${s.gananciaBruta >= 0 ? '#16a34a' : '#dc2626'}; font-weight:bold;">$${s.gananciaBruta.toLocaleString('es-CO', {maximumFractionDigits:0})}</td>
                                <td style="padding:10px; font-weight:bold; color:#0f766e;">${s.margenPct.toFixed(1)}%</td>
                                <td style="padding:10px;">${badge}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Inicializar Chart.js
    const ctx = document.getElementById('rentabilidadChartCanvas');
    if (!ctx) return;

    if (window.myRentabilidadChart) {
        window.myRentabilidadChart.destroy();
    }

    const labels = stats.map(s => s.nombre);
    const data = stats.map(s => parseFloat(s.margenPct.toFixed(1)));
    const bgColors = stats.map(s => {
        if (s.margenPct >= 50) return 'rgba(22, 163, 74, 0.8)';  // verde
        if (s.margenPct >= 30) return 'rgba(202, 138, 4, 0.8)'; // amarillo
        return 'rgba(220, 38, 38, 0.8)';                        // rojo
    });

    window.myRentabilidadChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Margen de Utilidad (%)',
                data: data,
                backgroundColor: bgColors,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: bgColors.map(c => c.replace('0.8', '1'))
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: { size: 14, family: "'Inter', sans-serif" },
                    bodyFont: { size: 13, family: "'Inter', sans-serif" },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const s = stats[context.dataIndex];
                            return [
                                `Margen Bruto: ${s.margenPct.toFixed(1)}%`,
                                `Costo Unitario: $${s.costoUnitario.toLocaleString('es-CO', {maximumFractionDigits:0})}  |  Precio Venta: $${s.precioVenta.toLocaleString('es-CO')}`,
                                `Ganancia Neta: $${s.gananciaBruta.toLocaleString('es-CO', {maximumFractionDigits:0})}`
                            ];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Margen (%)', color: '#64748b', font: { weight: 'bold' } },
                    grid: { color: '#f1f5f9' },
                    ticks: { color: '#475569' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#475569', maxRotation: 45, minRotation: 0 }
                }
            }
        }
    });
};

// ==========================================
// SUBMÓDULO 2: FICHAS TÉCNICAS (RECETAS)
// ==========================================

window.recetaEditandoId = null;

window.renderRecetasView = function() {
    const container = document.getElementById('costos-recetas');
    if (!container) return;

    // Solo renderizamos la estructura base si no existe
    if (!document.getElementById('recetas-list-container')) {
        let html = `
            <div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; color:#334155;">🥣 Fichas Técnicas</h3>
                <button onclick="window.abrirFormReceta()" class="btn-admin-action" style="background:#db2777; color:#fff; border:none; padding:10px 18px; border-radius:20px; font-weight:bold; cursor:pointer; box-shadow:0 2px 5px rgba(219,39,119,0.3);">
                    ➕ Nueva Ficha Técnica
                </button>
            </div>

            <!-- Formulario Oculto -->
            <div id="receta-form-container" style="display:none; background:#fff; border-radius:12px; padding:20px; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #fce7f3; margin-bottom:25px;">
                <h4 id="receta-form-title" style="margin-top:0; color:#be185d; font-size:1.2rem; margin-bottom:15px;">Crear Receta</h4>
                
                <div style="display:flex; flex-wrap:wrap; gap:15px; margin-bottom:20px;">
                    <div style="flex:1; min-width:200px;">
                        <label style="font-size:0.8rem; font-weight:700; color:#475569;">Nombre del Producto</label>
                        <input type="text" id="rec-nombre" class="checkout-input" style="margin-bottom:0;" placeholder="Ej: Pan Cascarita">
                    </div>
                    <div style="flex:1; min-width:120px;">
                        <label style="font-size:0.8rem; font-weight:700; color:#475569;">Rendimiento (Unds/tanda)</label>
                        <input type="number" id="rec-rendimiento" class="checkout-input" style="margin-bottom:0;" min="1" placeholder="Ej: 60" oninput="window.calcularResumenRecetaEnVivo()">
                    </div>
                    <div style="flex:1; min-width:120px;">
                        <label style="font-size:0.8rem; font-weight:700; color:#475569;">Precio Venta Unitario ($)</label>
                        <input type="number" id="rec-precio" class="checkout-input" style="margin-bottom:0;" min="0" placeholder="Ej: 500" oninput="window.calcularResumenRecetaEnVivo()">
                    </div>
                    <div style="flex:1; min-width:120px;">
                        <label style="font-size:0.8rem; font-weight:700; color:#475569;">Factor Servicios (%)</label>
                        <input type="number" id="rec-servicios" class="checkout-input" style="margin-bottom:0;" min="0" max="100" value="${window.costosState.factorServiciosPct}" oninput="window.calcularResumenRecetaEnVivo()">
                    </div>
                </div>

                <div style="margin-bottom:15px; border-top:1px solid #f1f5f9; padding-top:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#334155;">Ingredientes</strong>
                        <button type="button" onclick="window.addIngredienteRow()" style="background:#f8fafc; border:1px solid #cbd5e1; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-weight:bold; color:#0369a1;">
                            ➕ Agregar Ingrediente
                        </button>
                    </div>
                    <div id="receta-ingredientes-list" style="display:flex; flex-direction:column; gap:10px;"></div>
                </div>

                <div id="receta-resumen-vivo" style="background:#f8fafc; padding:15px; border-radius:8px; border:1px dashed #cbd5e1; margin-bottom:15px; font-size:0.9rem; color:#475569;">
                    <!-- Resumen en vivo -->
                    <em>Agrega ingredientes para ver el resumen de costos.</em>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #f1f5f9; padding-top:15px;">
                    <button type="button" onclick="window.cerrarFormReceta()" style="background:#f1f5f9; color:#475569; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer;">Cancelar</button>
                    <button type="button" onclick="window.guardarReceta()" style="background:#16a34a; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-weight:bold; cursor:pointer;">💾 Guardar Ficha Técnica</button>
                </div>
            </div>

            <!-- Grid de Recetas -->
            <div id="recetas-list-container" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:15px;">
                <!-- Cards renderizados aquí -->
            </div>
        `;
        container.innerHTML = html;
    }
    
    window.cerrarFormReceta();
    window.renderRecetasGrid();
};

window.abrirFormReceta = function(id = null) {
    window.recetaEditandoId = id;
    const formContainer = document.getElementById('receta-form-container');
    const title = document.getElementById('receta-form-title');
    const ingList = document.getElementById('receta-ingredientes-list');
    
    if (id) {
        const rec = window.costosState.recetas.find(r => r.id === id);
        if (rec) {
            title.innerText = 'Editar Ficha Técnica';
            document.getElementById('rec-nombre').value = rec.nombre;
            document.getElementById('rec-rendimiento').value = rec.rendimiento;
            document.getElementById('rec-precio').value = rec.precioVenta;
            document.getElementById('rec-servicios').value = rec.factorServiciosPct;
            
            ingList.innerHTML = '';
            rec.ingredientes.forEach(ing => window.addIngredienteRow(ing.insumoId, ing.cantidad));
        }
    } else {
        title.innerText = 'Nueva Ficha Técnica';
        document.getElementById('rec-nombre').value = '';
        document.getElementById('rec-rendimiento').value = '';
        document.getElementById('rec-precio').value = '';
        document.getElementById('rec-servicios').value = window.costosState.factorServiciosPct;
        ingList.innerHTML = '';
        window.addIngredienteRow();
    }
    
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.cerrarFormReceta = function() {
    document.getElementById('receta-form-container').style.display = 'none';
    window.recetaEditandoId = null;
};

window.addIngredienteRow = function(insumoId = '', cantidadBase = '') {
    const list = document.getElementById('receta-ingredientes-list');
    
    let options = '<option value="">Selecciona insumo...</option>';
    let insumoEncontrado = null;
    window.costosState.insumos.forEach(ins => {
        if (insumoId === ins.id) insumoEncontrado = ins;
        options += `<option value="${ins.id}" ${insumoId === ins.id ? 'selected' : ''}>${ins.nombre} (${ins.unidadBase})</option>`;
    });

    const rowId = 'ing-' + Date.now() + '-' + Math.floor(Math.random()*1000);

    // Para la vista inicial si viene de edición (cantidadBase ya está en unidadBase)
    // Mostraremos la cantidad base y dejaremos la unidad como "g", "ml" o "und"
    let defaultUnit = insumoEncontrado ? insumoEncontrado.unidadBase : 'g';

    const html = `
        <div id="${rowId}" class="ingrediente-row" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <select class="ing-select checkout-input" style="flex:2; min-width:140px; margin-bottom:0;" onchange="window.calcularFilaIngrediente('${rowId}')">
                ${options}
            </select>
            <input type="number" class="ing-cantidad checkout-input" style="flex:1; min-width:80px; margin-bottom:0;" placeholder="Cant." value="${cantidadBase}" oninput="window.calcularFilaIngrediente('${rowId}')" min="0" step="0.01">
            <select class="ing-unidad checkout-input" style="flex:1; min-width:100px; margin-bottom:0;" onchange="window.calcularFilaIngrediente('${rowId}')">
                <option value="g" ${defaultUnit === 'g' ? 'selected' : ''}>Gramos (g)</option>
                <option value="kg">Kilos (kg)</option>
                <option value="lb">Libras (lb)</option>
                <option value="ml" ${defaultUnit === 'ml' ? 'selected' : ''}>Milis (ml)</option>
                <option value="L">Litros (L)</option>
                <option value="und" ${defaultUnit === 'und' ? 'selected' : ''}>Unds (und)</option>
            </select>
            <div class="ing-costo" style="flex:1; min-width:80px; font-weight:bold; color:#0f766e; text-align:right; font-size:0.9rem;" data-costo="0">$0</div>
            <button type="button" onclick="document.getElementById('${rowId}').remove(); window.calcularResumenRecetaEnVivo();" style="background:none; border:none; cursor:pointer; color:#dc2626; font-size:1.1rem;" title="Quitar">❌</button>
        </div>
    `;
    list.insertAdjacentHTML('beforeend', html);
    window.calcularFilaIngrediente(rowId);
};

window.calcularFilaIngrediente = function(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const select = row.querySelector('.ing-select');
    const input = row.querySelector('.ing-cantidad');
    const selectUnidad = row.querySelector('.ing-unidad');
    const costoDiv = row.querySelector('.ing-costo');
    
    const ins = window.costosState.insumos.find(i => i.id === select.value);
    const cantInput = parseFloat(input.value) || 0;
    
    if (ins && cantInput > 0) {
        let cantBase = cantInput;
        const u = selectUnidad.value;

        // Conversión a unidad base (g, ml, und)
        if (u === 'kg') cantBase = cantInput * 1000;
        else if (u === 'lb') cantBase = cantInput * 500;
        else if (u === 'L') cantBase = cantInput * 1000;

        row.dataset.cantBase = cantBase;

        const costo = ins.costoUnitario * cantBase;
        costoDiv.innerText = '$' + costo.toLocaleString('es-CO', {maximumFractionDigits:0});
        costoDiv.dataset.costo = costo;
    } else {
        costoDiv.innerText = '$0';
        costoDiv.dataset.costo = 0;
        row.dataset.cantBase = 0;
    }
    window.calcularResumenRecetaEnVivo();
};

window.calcularResumenRecetaEnVivo = function() {
    const resumenDiv = document.getElementById('receta-resumen-vivo');
    if (!resumenDiv) return;

    let costoInsumosTotal = 0;
    const rows = document.querySelectorAll('.ingrediente-row');
    rows.forEach(row => {
        const costoDiv = row.querySelector('.ing-costo');
        costoInsumosTotal += parseFloat(costoDiv.dataset.costo) || 0;
    });

    const rendimiento = parseInt(document.getElementById('rec-rendimiento').value) || 0;
    const precioVenta = parseFloat(document.getElementById('rec-precio').value) || 0;
    const factorServiciosPct = parseFloat(document.getElementById('rec-servicios').value) || 0;

    if (costoInsumosTotal === 0 && rendimiento === 0 && precioVenta === 0) {
        resumenDiv.innerHTML = '<em>Agrega ingredientes para ver el resumen de costos.</em>';
        return;
    }

    const costoServicios = costoInsumosTotal * (factorServiciosPct / 100);
    const costoTanda = costoInsumosTotal + costoServicios;
    
    let costoUnitario = 0;
    if (rendimiento > 0) costoUnitario = costoTanda / rendimiento;

    let ganancia = 0;
    let margen = 0;
    let margenColor = "#475569";
    if (precioVenta > 0 && costoUnitario > 0) {
        ganancia = precioVenta - costoUnitario;
        margen = (ganancia / precioVenta) * 100;
        if (margen >= 50) margenColor = "#16a34a"; // Verde
        else if (margen >= 30) margenColor = "#ca8a04"; // Amarillo
        else margenColor = "#dc2626"; // Rojo
    }

    resumenDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>Subtotal Ingredientes:</span> <strong>$${costoInsumosTotal.toLocaleString('es-CO', {maximumFractionDigits:0})}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:5px; color:#64748b;">
            <span>Factor Servicios/Gas (${factorServiciosPct}%):</span> <span>+ $${costoServicios.toLocaleString('es-CO', {maximumFractionDigits:0})}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-weight:bold; color:#1e293b; border-bottom:1px solid #cbd5e1; padding-bottom:5px;">
            <span>Costo Total de la Tanda:</span> <span>$${costoTanda.toLocaleString('es-CO', {maximumFractionDigits:0})}</span>
        </div>
        
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:10px; text-align:center;">
            <div style="background:#fff; padding:10px; border-radius:6px; border:1px solid #e2e8f0;">
                <div style="font-size:0.75rem; color:#64748b; margin-bottom:3px;">Costo Unitario</div>
                <strong style="color:#be185d;">$${costoUnitario.toLocaleString('es-CO', {maximumFractionDigits:0})}</strong>
            </div>
            <div style="background:#fff; padding:10px; border-radius:6px; border:1px solid #e2e8f0;">
                <div style="font-size:0.75rem; color:#64748b; margin-bottom:3px;">Ganancia/Pan</div>
                <strong style="color:${ganancia >= 0 ? '#16a34a' : '#dc2626'};">$${ganancia.toLocaleString('es-CO', {maximumFractionDigits:0})}</strong>
            </div>
            <div style="background:#fff; padding:10px; border-radius:6px; border:1px solid #e2e8f0;">
                <div style="font-size:0.75rem; color:#64748b; margin-bottom:3px;">Margen Bruto</div>
                <strong style="color:${margenColor};">${margen.toFixed(1)}%</strong>
            </div>
        </div>
    `;

    const chatHtml = 
        '<div style="background:#fff; border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #e2e8f0; margin-top:20px;">' +
            '<div style="display:flex; align-items:center; gap:10px; border-bottom:1px solid #f1f5f9; padding-bottom:10px; margin-bottom:15px;">' +
                '<div style="font-size:2rem;">🤖</div>' +
                '<div>' +
                    '<h4 style="margin:0; color:#be185d;">Chat con el Guardián Financiero</h4>' +
                    '<span style="font-size:0.8rem; color:#16a34a;">● En línea y vigilando el bolsillo</span>' +
                '</div>' +
            '</div>' +
            '<div id="guardian-chat-messages" style="height:250px; overflow-y:auto; display:flex; flex-direction:column; gap:10px; margin-bottom:15px; padding-right:10px;">' +
                '<div style="background:#f1f5f9; padding:10px 15px; border-radius:15px 15px 15px 0; align-self:flex-start; max-width:80%; font-size:0.9rem; color:#334155;">' +
                    '¡Hola Pablo! Pregúntame sobre tus recetas, insumos, márgenes o simula precios. Estoy aquí para cuidar tu dinero.' +
                '</div>' +
            '</div>' +
            '<div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:10px; margin-bottom:10px;">' +
                '<button onclick="window.enviarMensajeGuardian(\'¿Cuál es el pan más rentable?\')" class="stock-filter-chip" style="font-size:0.8rem; padding:4px 10px;">¿Pan más rentable?</button>' +
                '<button onclick="window.enviarMensajeGuardian(\'¿Qué insumo es más costoso?\')" class="stock-filter-chip" style="font-size:0.8rem; padding:4px 10px;">¿Insumo más costoso?</button>' +
                '<button onclick="window.enviarMensajeGuardian(\'Consejo para mejorar márgenes\')" class="stock-filter-chip" style="font-size:0.8rem; padding:4px 10px;">Consejo de márgenes</button>' +
            '</div>' +
            '<div style="display:flex; gap:10px;">' +
                '<input type="text" id="guardian-chat-input" class="checkout-input" style="margin:0; flex:1;" placeholder="Pregúntale al Guardián..." onkeypress="if(event.key === \'Enter\') window.enviarMensajeGuardian()">' +
                '<button onclick="window.enviarMensajeGuardian()" style="background:#be185d; color:#fff; border:none; padding:10px 15px; border-radius:8px; font-weight:bold; cursor:pointer;">Enviar 🚀</button>' +
            '</div>' +
        '</div>';

    container.innerHTML += chatHtml;
};

window.guardarReceta = function() {
    const nombre = document.getElementById('rec-nombre').value.trim();
    const rendimiento = parseInt(document.getElementById('rec-rendimiento').value);
    const precioVenta = parseFloat(document.getElementById('rec-precio').value);
    const factorServiciosPct = parseFloat(document.getElementById('rec-servicios').value) || 0;

    if (!nombre || isNaN(rendimiento) || isNaN(precioVenta) || rendimiento <= 0) {
        if(typeof showToast === 'function') showToast('Llena los campos generales correctamente.', '⚠️');
        return;
    }

    const rows = document.querySelectorAll('.ingrediente-row');
    const ingredientes = [];
    let costoInsumosTotal = 0;

    rows.forEach(row => {
        const select = row.querySelector('.ing-select');
        const insumoId = select.value;
        const cantidadBase = parseFloat(row.dataset.cantBase) || 0;
        
        if (insumoId && cantidadBase > 0) {
            ingredientes.push({ insumoId, cantidad: cantidadBase });
            const ins = window.costosState.insumos.find(i => i.id === insumoId);
            if (ins) costoInsumosTotal += ins.costoUnitario * cantidadBase;
        }
    });

    if (ingredientes.length === 0) {
        if(typeof showToast === 'function') showToast('Agrega al menos un ingrediente válido.', '⚠️');
        return;
    }

    const nuevaReceta = {
        id: window.recetaEditandoId || ('rec_' + Date.now().toString()),
        nombre,
        rendimiento,
        precioVenta,
        factorServiciosPct,
        ingredientes
    };

    if (window.recetaEditandoId) {
        const idx = window.costosState.recetas.findIndex(r => r.id === window.recetaEditandoId);
        if (idx !== -1) window.costosState.recetas[idx] = nuevaReceta;
    } else {
        window.costosState.recetas.push(nuevaReceta);
    }

    localStorage.setItem('pd_costos_recetas', JSON.stringify(window.costosState.recetas));
    window.cerrarFormReceta();
    window.renderRecetasGrid();
    if(typeof showToast === 'function') showToast('Ficha Técnica guardada', '✅');
};

window.eliminarReceta = function(id) {
    if (!confirm('¿Seguro que deseas eliminar esta ficha técnica?')) return;
    window.costosState.recetas = window.costosState.recetas.filter(r => r.id !== id);
    localStorage.setItem('pd_costos_recetas', JSON.stringify(window.costosState.recetas));
    window.renderRecetasGrid();
    if(typeof showToast === 'function') showToast('Receta eliminada', '🗑️');
};

window.renderRecetasGrid = function() {
    const grid = document.getElementById('recetas-list-container');
    if (!grid) return;

    if (window.costosState.recetas.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:30px; color:#94a3b8;">No hay fichas técnicas registradas.</div>';
        return;
    }

    let html = '';
    window.costosState.recetas.forEach(rec => {
        let costoInsumos = 0;
        rec.ingredientes.forEach(ing => {
            const ins = window.costosState.insumos.find(i => i.id === ing.insumoId);
            if (ins) costoInsumos += ins.costoUnitario * ing.cantidad;
        });

        const costoServicios = costoInsumos * (rec.factorServiciosPct / 100);
        const costoTotalTanda = costoInsumos + costoServicios;
        const costoUnitario = costoTotalTanda / rec.rendimiento;
        const gananciaBruta = rec.precioVenta - costoUnitario;
        const margenPct = rec.precioVenta > 0 ? (gananciaBruta / rec.precioVenta) * 100 : 0;

        let badgeHtml = '';
        if (margenPct >= 50) {
            badgeHtml = `<span style="background:#dcfce7; color:#16a34a; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold;">🟢 Bueno (${margenPct.toFixed(1)}%)</span>`;
        } else if (margenPct >= 30) {
            badgeHtml = `<span style="background:#fef9c3; color:#ca8a04; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold;">🟡 Aceptable (${margenPct.toFixed(1)}%)</span>`;
        } else {
            badgeHtml = `<span style="background:#fee2e2; color:#dc2626; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold;">🔴 Crítico (${margenPct.toFixed(1)}%)</span>`;
        }

        html += `
            <div style="background:#fff; border-radius:12px; padding:18px; box-shadow:0 2px 10px rgba(0,0,0,0.05); border:1px solid #f1e8e4; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                        <h4 style="margin:0; color:#1e293b; font-size:1.1rem;">${rec.nombre}</h4>
                        ${badgeHtml}
                    </div>
                    
                    <div style="font-size:0.85rem; color:#475569; margin-bottom:12px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <div><strong style="color:#64748b;">Rendimiento:</strong><br>${rec.rendimiento} unds</div>
                        <div><strong style="color:#64748b;">Costo Tanda:</strong><br>$${costoTotalTanda.toLocaleString('es-CO', {maximumFractionDigits:0})}</div>
                        <div><strong style="color:#64748b;">Servicios/Gas:</strong><br>${rec.factorServiciosPct}%</div>
                        <div><strong style="color:#64748b;">Costo x Und:</strong><br><span style="color:#be185d; font-weight:bold;">$${costoUnitario.toLocaleString('es-CO', {maximumFractionDigits:0})}</span></div>
                    </div>
                    
                    <div style="background:#f8fafc; padding:10px; border-radius:8px; margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.85rem;">
                            <span>Precio de Venta:</span>
                            <strong style="color:#1e293b;">$${rec.precioVenta.toLocaleString('es-CO')}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem;">
                            <span>Ganancia Neta/Und:</span>
                            <strong style="color:${gananciaBruta >= 0 ? '#16a34a' : '#dc2626'};">$${gananciaBruta.toLocaleString('es-CO', {maximumFractionDigits:0})}</strong>
                        </div>
                    </div>
                </div>
                
                <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px solid #f1f5f9; padding-top:12px;">
                    <button onclick="window.abrirFormReceta('${rec.id}')" style="background:#e0f2fe; color:#0284c7; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.8rem;">✏️ Editar</button>
                    <button onclick="window.eliminarReceta('${rec.id}')" style="background:#fee2e2; color:#dc2626; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.8rem;">🗑️ Eliminar</button>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
};
