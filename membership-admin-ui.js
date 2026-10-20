/**
 * FASE 4 - REFACTOR UI: MEMBERSHIP ADMIN UI (Vista Completa)
 * 
 * Nueva interfaz integrada como pestaña principal del panel admin
 * - Reemplaza el modal flotante pequeño
 * - Vista completa espaciosa estilo boutique Cacao & Oro
 * - Integrada directamente en admin-dashboard-fragment.html
 * - SANDBOX MODE: Solo para pruebas internas
 */

window.MembershipAdminUI = {
  // ============================================================================
  // VERIFICACIÓN DE SEGURIDAD
  // ============================================================================

  /**
   * Valida que el usuario sea admin
   */
  isAdminAuthorized: function() {
    if (typeof window.currentUser === 'undefined' || !window.currentUser) {
      return false;
    }
    
    const isAdmin = window.currentUser.isAdmin || 
                   window.currentUser.role === 'admin' || 
                   window.currentUser.rol === 'admin';
    
    return isAdmin;
  },

  // ============================================================================
  // INICIALIZACIÓN Y RENDERIZADO
  // ============================================================================

  /**
   * Inicializa la UI de membresías cuando se muestra la pestaña
   */
  init: function() {
    if (!this.isAdminAuthorized()) {
      console.error('❌ Acceso denegado: Solo admin puede ver membresías');
      return;
    }

    if (!window.MembershipPlansEngine) {
      console.error('❌ MembershipPlansEngine no cargado');
      return;
    }

    this.renderPlansEditor();
    console.log('✅ MembershipAdminUI inicializado en vista completa');
  },

  // ============================================================================
  // TAB SWITCHING (Editor / Simulador)
  // ============================================================================

  switchInternalTab: function(tab) {
    const editorContent = document.getElementById('membership-editor-content');
    const simulatorContent = document.getElementById('membership-simulator-content');
    const editorBtn = document.getElementById('membership-internal-tab-editor');
    const simulatorBtn = document.getElementById('membership-internal-tab-simulator');

    if (!editorContent || !simulatorContent || !editorBtn || !simulatorBtn) {
      console.error('❌ No se encontraron elementos de tabs internos');
      return;
    }

    if (tab === 'editor') {
      editorContent.style.display = 'block';
      simulatorContent.style.display = 'none';
      
      editorBtn.style.background = 'linear-gradient(135deg, #FF6B9D, #db2777)';
      editorBtn.style.color = 'white';
      editorBtn.style.boxShadow = '0 -2px 8px rgba(219,39,119,0.2)';
      editorBtn.classList.add('active');
      
      simulatorBtn.style.background = '#e5e7eb';
      simulatorBtn.style.color = '#6b7280';
      simulatorBtn.style.boxShadow = 'none';
      simulatorBtn.classList.remove('active');
    } else if (tab === 'simulator') {
      editorContent.style.display = 'none';
      simulatorContent.style.display = 'block';
      
      editorBtn.style.background = '#e5e7eb';
      editorBtn.style.color = '#6b7280';
      editorBtn.style.boxShadow = 'none';
      editorBtn.classList.remove('active');
      
      simulatorBtn.style.background = 'linear-gradient(135deg, #FF6B9D, #db2777)';
      simulatorBtn.style.color = 'white';
      simulatorBtn.style.boxShadow = '0 -2px 8px rgba(219,39,119,0.2)';
      simulatorBtn.classList.add('active');
    }
  },

  // ============================================================================
  // EDITOR DE PLANES (Tarjetas Grandes y Espaciosas)
  // ============================================================================

  renderPlansEditor: function() {
    if (!window.MembershipPlansEngine) {
      console.error('❌ MembershipPlansEngine no cargado');
      return;
    }

    const container = document.getElementById('membership-plans-cards-container');
    if (!container) {
      console.error('❌ Contenedor membership-plans-cards-container no encontrado');
      return;
    }

    const plans = window.MembershipPlansEngine.getAllPlans();
    let html = '';

    for (const [tier, plan] of Object.entries(plans)) {
      const cardBgColor = plan.color_ui || '#FF6B9D';
      const tierUpper = tier.toUpperCase();
      
      html += `
        <div style="background:linear-gradient(135deg, ${cardBgColor}15, ${cardBgColor}05); border:3px solid ${cardBgColor}; border-radius:16px; padding:28px; box-shadow:0 8px 24px rgba(0,0,0,0.1); transition:all 0.3s; position:relative; overflow:hidden;">
          
          <!-- Decoración de fondo -->
          <div style="position:absolute; top:-20px; right:-20px; width:120px; height:120px; background:${cardBgColor}; opacity:0.08; border-radius:50%;"></div>
          
          <!-- Header del Plan -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; position:relative; z-index:1;">
            <h3 style="margin:0; color:${cardBgColor}; font-size:1.5rem; font-weight:800; display:flex; align-items:center; gap:10px;">
              <span style="font-size:1.8rem;">👑</span> ${plan.name}
            </h3>
            <span style="background:${cardBgColor}; color:white; padding:8px 16px; border-radius:24px; font-size:0.9rem; font-weight:bold; box-shadow:0 2px 8px rgba(0,0,0,0.15);">
              ${tierUpper}
            </span>
          </div>

          <!-- Grid de Campos -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:20px; position:relative; z-index:1;">
            
            <div>
              <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:8px; color:#374151;">💰 Precio Mensual (COP)</label>
              <input type="number" id="plan_price_${tier}" value="${plan.price_cop}" 
                     style="width:100%; padding:12px 16px; border:2px solid #e5e7eb; border-radius:10px; font-size:1.05rem; font-weight:600; background:white; transition:all 0.2s;"
                     onfocus="this.style.borderColor='${cardBgColor}'; this.style.boxShadow='0 0 0 3px ${cardBgColor}20'"
                     onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
            </div>

            <div>
              <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:8px; color:#374151;">📅 Duración (días exactos)</label>
              <input type="number" id="plan_duration_${tier}" value="${plan.duration_days}" 
                     style="width:100%; padding:12px 16px; border:2px solid #e5e7eb; border-radius:10px; font-size:1.05rem; font-weight:600; background:white; transition:all 0.2s;"
                     onfocus="this.style.borderColor='${cardBgColor}'; this.style.boxShadow='0 0 0 3px ${cardBgColor}20'"
                     onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
            </div>

            <div>
              <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:8px; color:#374151;">🏷️ Descuento (%)</label>
              <input type="number" id="plan_discount_${tier}" value="${plan.discount_percent}" min="0" max="50"
                     style="width:100%; padding:12px 16px; border:2px solid #e5e7eb; border-radius:10px; font-size:1.05rem; font-weight:600; background:white; transition:all 0.2s;"
                     onfocus="this.style.borderColor='${cardBgColor}'; this.style.boxShadow='0 0 0 3px ${cardBgColor}20'"
                     onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
            </div>

            <div>
              <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:8px; color:#374151;">⭐ Multiplicador de Puntos</label>
              <input type="number" id="plan_multiplier_${tier}" value="${plan.points_multiplier}" step="0.05" min="1"
                     style="width:100%; padding:12px 16px; border:2px solid #e5e7eb; border-radius:10px; font-size:1.05rem; font-weight:600; background:white; transition:all 0.2s;"
                     onfocus="this.style.borderColor='${cardBgColor}'; this.style.boxShadow='0 0 0 3px ${cardBgColor}20'"
                     onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
            </div>

            <div style="grid-column:1/-1;">
              <label style="display:block; font-weight:bold; font-size:0.95rem; margin-bottom:8px; color:#374151;">🛵 Domicilio Gratis desde (COP)</label>
              <input type="number" id="plan_delivery_${tier}" value="${plan.free_delivery_min_subtotal}" min="0"
                     style="width:100%; padding:12px 16px; border:2px solid #e5e7eb; border-radius:10px; font-size:1.05rem; font-weight:600; background:white; transition:all 0.2s;"
                     onfocus="this.style.borderColor='${cardBgColor}'; this.style.boxShadow='0 0 0 3px ${cardBgColor}20'"
                     onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
            </div>

          </div>

          <!-- Botón de Guardar Individual -->
          <button onclick="window.MembershipAdminUI.updatePlan('${tier}')" 
                  style="width:100%; padding:14px; background:${cardBgColor}; color:white; border:none; border-radius:10px; cursor:pointer; font-weight:bold; font-size:1.05rem; box-shadow:0 4px 12px ${cardBgColor}40; transition:all 0.2s; position:relative; z-index:1; display:flex; align-items:center; justify-content:center; gap:8px;"
                  onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px ${cardBgColor}60'"
                  onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px ${cardBgColor}40'">
            <span style="font-size:1.2rem;">💾</span> Guardar Cambios (${tierUpper})
          </button>

        </div>
      `;
    }

    container.innerHTML = html;
    console.log('✅ Editor de planes renderizado con diseño espacioso');
  },

  updatePlan: function(tier) {
    const updates = {
      price_cop: parseInt(document.getElementById(`plan_price_${tier}`).value) || 15000,
      duration_days: parseInt(document.getElementById(`plan_duration_${tier}`).value) || 30,
      discount_percent: parseInt(document.getElementById(`plan_discount_${tier}`).value) || 8,
      points_multiplier: parseFloat(document.getElementById(`plan_multiplier_${tier}`).value) || 1.0,
      free_delivery_min_subtotal: parseInt(document.getElementById(`plan_delivery_${tier}`).value) || 30000
    };

    const result = window.MembershipPlansEngine.updatePlanSandbox(tier, updates);
    if (result.success) {
      console.log(`✅ Plan ${tier} actualizado en SANDBOX`);
      alert(`✅ Plan ${tier.toUpperCase()} actualizado en SANDBOX\n\nCambios guardados para pruebas internas.`);
      this.renderPlansEditor();
    } else {
      alert(`❌ Error al actualizar plan: ${result.error}`);
    }
  },

  saveAllPlans: function() {
    console.log('💾 Guardando todos los planes en SANDBOX...');
    console.log(window.MembershipPlansEngine.getAllPlans());
    alert('✅ Todos los cambios guardados en SANDBOX\n\nEstos cambios son solo para pruebas internas y NO afectan producción.');
  },

  resetPlans: function() {
    if (confirm('⚠️ ¿Resetear TODOS los planes a valores base?\n\nEsta acción restaurará los valores predeterminados de fábrica.')) {
      const result = window.MembershipPlansEngine.resetToDefaults();
      if (result) {
        this.renderPlansEditor();
        alert('✅ Planes reseteados a valores base\n\nTodos los planes han sido restaurados a su configuración original.');
      }
    }
  },

  // ============================================================================
  // SIMULADOR DE CARRITO EN VIVO
  // ============================================================================

  runSimulation: function() {
    const subtotal = parseInt(document.getElementById('membership-sim-subtotal').value) || 50000;
    const tier = document.getElementById('membership-sim-tier').value || null;
    const offerPercent = parseInt(document.getElementById('membership-sim-offer').value) || 0;
    const redeemValue = parseInt(document.getElementById('membership-sim-redeem').value) || 0;

    if (subtotal < 0) {
      alert('❌ El subtotal no puede ser negativo');
      return;
    }

    const cartItems = [
      { price: subtotal, quantity: 1 }
    ];

    const simulation = window.MembershipPlansEngine.simulateCheckout(cartItems, tier, {
      productOfferPercent: offerPercent,
      redeemValue: redeemValue
    });

    this.displaySimulationResult(simulation);
    console.log('🧪 Simulación ejecutada:', simulation);
  },

  displaySimulationResult: function(sim) {
    const resultDiv = document.getElementById('membership-simulation-result');
    if (!resultDiv) {
      console.error('❌ Contenedor membership-simulation-result no encontrado');
      return;
    }

    const warningBg = sim.margen_warning ? 'background:#FFE5E5; border-color:#FF6B6B;' : '';
    const tierDisplay = sim.user_tier ? `<strong style="color:#FF6B9D;">${sim.user_tier.toUpperCase()}</strong>` : '<strong>Normal</strong>';

    const html = `
      <div>
        <h4 style="margin-top:0; margin-bottom:20px; color:#b71c1c; font-size:1.3rem; text-align:center; display:flex; align-items:center; justify-content:center; gap:10px;">
          <span style="font-size:1.5rem;">📊</span> Resultado de Simulación
        </h4>
        
        <div style="background:#f8f9fa; border-radius:10px; padding:15px; margin-bottom:15px;">
          <p style="margin:0; font-size:0.95rem; color:#6b7280;">
            <strong>Cliente:</strong> ${tierDisplay} | 
            <strong>Simulado:</strong> ${new Date(sim.timestamp).toLocaleString('es-CO')}
          </p>
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:1rem;">
          <tr style="border-bottom:2px solid #e5e7eb;">
            <td style="padding:12px 8px; font-weight:600; color:#374151;">💰 Subtotal Bruto:</td>
            <td style="padding:12px 8px; text-align:right; font-weight:700; color:#059669; font-size:1.05rem;">
              $${sim.subtotal_bruto.toLocaleString('es-CO')} COP
            </td>
          </tr>
          <tr style="border-bottom:2px solid #e5e7eb;">
            <td style="padding:12px 8px; font-weight:600; color:#374151;">
              🏷️ Descuento Aplicado:
              <br><span style="font-size:0.85rem; color:#6b7280; font-weight:normal;">${sim.descuento_razon}</span>
            </td>
            <td style="padding:12px 8px; text-align:right; font-weight:700; color:#FF6B9D; font-size:1.05rem;">
              -$${sim.descuento_aplicado.toLocaleString('es-CO')} COP
            </td>
          </tr>
          <tr style="border-bottom:2px solid #e5e7eb;">
            <td style="padding:12px 8px; font-weight:600; color:#374151;">📉 Subtotal Post-Descuento:</td>
            <td style="padding:12px 8px; text-align:right; font-weight:700; font-size:1.05rem;">
              $${sim.subtotal_post_descuento.toLocaleString('es-CO')} COP
            </td>
          </tr>
          ${sim.canje_puntos > 0 ? `
          <tr style="border-bottom:2px solid #e5e7eb;">
            <td style="padding:12px 8px; font-weight:600; color:#374151;">🎟️ Canje de Puntos:</td>
            <td style="padding:12px 8px; text-align:right; font-weight:700; color:#FF6B9D; font-size:1.05rem;">
              -$${sim.canje_puntos.toLocaleString('es-CO')} COP
            </td>
          </tr>
          <tr style="border-bottom:2px solid #e5e7eb;">
            <td style="padding:12px 8px; font-weight:600; color:#374151;">📉 Subtotal Post-Canje:</td>
            <td style="padding:12px 8px; text-align:right; font-weight:700; font-size:1.05rem;">
              $${sim.subtotal_post_canje.toLocaleString('es-CO')} COP
            </td>
          </tr>
          ` : ''}
          <tr style="border-bottom:2px solid #e5e7eb;">
            <td style="padding:12px 8px; font-weight:600; color:#374151;">
              🛵 Domicilio:
              <br><span style="font-size:0.85rem; color:#6b7280; font-weight:normal;">${sim.domicilio_razon}</span>
            </td>
            <td style="padding:12px 8px; text-align:right; font-weight:700; color:#059669; font-size:1.05rem;">
              $${sim.domicilio.toLocaleString('es-CO')} COP
            </td>
          </tr>
          <tr style="border-bottom:3px solid #FFD700; background:linear-gradient(135deg, #FFF9E6, #FFFBF0);">
            <td style="padding:16px 8px; font-weight:800; font-size:1.2rem; color:#b71c1c;">💳 TOTAL A PAGAR:</td>
            <td style="padding:16px 8px; text-align:right; font-weight:800; font-size:1.3rem; color:#b71c1c;">
              $${sim.total_a_pagar.toLocaleString('es-CO')} COP
            </td>
          </tr>
          <tr style="border-bottom:2px solid #e5e7eb; background:#f0fdf4;">
            <td style="padding:12px 8px; font-weight:600; color:#374151;">⭐ Puntos Ganados:</td>
            <td style="padding:12px 8px; text-align:right; font-weight:700; color:#059669; font-size:1.1rem;">
              🎟️ ${sim.puntos_ganados} puntos
            </td>
          </tr>
          ${sim.puntos_bonus_cumpleaños > 0 ? `
          <tr style="border-bottom:2px solid #e5e7eb; background:#fef3c7;">
            <td style="padding:12px 8px; font-weight:600; color:#374151;">🎂 Bonus Cumpleaños:</td>
            <td style="padding:12px 8px; text-align:right; font-weight:700; color:#f59e0b; font-size:1.1rem;">
              +${sim.puntos_bonus_cumpleaños} puntos
            </td>
          </tr>
          ` : ''}
          <tr style="${warningBg} border-bottom:2px solid ${sim.margen_warning ? '#FF6B6B' : '#22c55e'};">
            <td style="padding:12px 8px; font-weight:600; color:#374151;">📊 Margen de Ganancia:</td>
            <td style="padding:12px 8px; text-align:right; font-weight:700; color:${sim.margen_warning ? '#FF6B6B' : '#059669'}; font-size:1.1rem;">
              ${sim.margen_percent}% ${sim.margen_warning ? '⚠️ BAJO (<20%)' : '✅ SEGURO'}
            </td>
          </tr>
        </table>

        ${sim.margen_warning ? `
        <div style="background:#FFE5E5; border:2px solid #FF6B6B; border-radius:10px; padding:15px; margin-top:15px;">
          <p style="margin:0; color:#b91c1c; font-weight:600; display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.3rem;">⚠️</span>
            <strong>ADVERTENCIA:</strong> El margen de ganancia es inferior al 20%. Considera ajustar los descuentos o promociones.
          </p>
        </div>
        ` : ''}

      </div>
    `;

    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    
    // Scroll suave hacia resultados
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

// ============================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================================================

// Escuchar cuando se cambia a la pestaña de membresías
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ MembershipAdminUI cargado y listo');
});

console.log('✓ membership-admin-ui.js cargado: window.MembershipAdminUI disponible');
