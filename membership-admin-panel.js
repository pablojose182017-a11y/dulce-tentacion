/**
 * FASE 4: MEMBERSHIP ADMIN PANEL
 * 
 * Panel administrativo independiente para gestionar Plus, Pro y Ultra
 * - Interfaz modular (100% desacoplada)
 * - SANDBOX MODE: Solo para pruebas internas
 * - NO modifica datos públicos ni Firebase
 * - Acceso solo para admin (verificación de rol)
 */

window.MembershipAdminPanel = {
  // ============================================================================
  // ESTADO DEL PANEL
  // ============================================================================
  
  isOpen: false,
  currentMode: 'sandbox',  // 'sandbox' o 'production' (production bloqueado)
  editingTier: null,
  simulatorMode: false,

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

  /**
   * Bloquea acceso si no es admin
   */
  requireAdmin: function() {
    if (!this.isAdminAuthorized()) {
      console.error('❌ Acceso denegado: Solo admin puede abrir panel de membresías');
      alert('❌ Acceso denegado: Solo administradores pueden acceder');
      return false;
    }
    return true;
  },

  // ============================================================================
  // INICIALIZACIÓN DEL PANEL
  // ============================================================================

  /**
   * Crea la UI del panel (modal con editor de planes)
   */
  createPanelUI: function() {
    if (!this.requireAdmin()) return;

    const html = `
      <div id="membershipAdminModal" class="membership-admin-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:10000; align-items:center; justify-content:center;">
        <div class="membership-admin-container" style="background:#fff; border-radius:20px; padding:30px; max-width:900px; width:95%; max-height:90vh; overflow-y:auto; box-shadow:0 20px 60px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px; border-bottom:2px solid #FFD700; padding-bottom:15px;">
            <h2 style="color:#b71c1c; font-size:1.5rem; margin:0; display:flex; align-items:center; gap:8px;">
              👑 Gestor de Planes Plus / Pro / Ultra
            </h2>
            <button onclick="window.MembershipAdminPanel.closePanel()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#888;">×</button>
          </div>

          <!-- Modo Sandbox vs Producción -->
          <div style="background:#FFF3CD; border:2px solid #FFD700; border-radius:12px; padding:15px; margin-bottom:20px; display:flex; align-items:center; gap:12px;">
            <span style="font-size:2rem;">🔒</span>
            <div>
              <strong style="color:#856404;">MODO: SANDBOX (Pruebas Internas)</strong>
              <p style="margin:5px 0 0 0; font-size:0.9rem; color:#856404;">Los cambios aquí NO afectan producción ni Firebase. Es un área segura de prueba.</p>
            </div>
          </div>

          <!-- Tabs: Editor / Simulador -->
          <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:2px solid #e0e0e0;">
            <button onclick="window.MembershipAdminPanel.switchTab('editor')" 
                    id="tab-editor-btn"
                    style="padding:12px 20px; background:#FF6B9D; color:white; border:none; border-radius:8px 8px 0 0; cursor:pointer; font-weight:bold; font-size:1rem;">
              ✏️ Editor de Planes
            </button>
            <button onclick="window.MembershipAdminPanel.switchTab('simulator')" 
                    id="tab-simulator-btn"
                    style="padding:12px 20px; background:#e0e0e0; color:#555; border:none; border-radius:8px 8px 0 0; cursor:pointer; font-weight:bold; font-size:1rem;">
              🧪 Simulador de Carrito
            </button>
          </div>

          <!-- Tab: Editor de Planes -->
          <div id="editor-tab" style="display:block;">
            <div id="plansEditorContainer" style="display:flex; flex-direction:column; gap:20px;">
              <!-- Tarjetas de planes se inyectan aquí -->
            </div>
            <div style="margin-top:20px; display:flex; gap:10px;">
              <button onclick="window.MembershipAdminPanel.saveAllPlans()" 
                      style="flex:1; padding:12px; background:#16a34a; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:1rem;">
                💾 Guardar Cambios (Sandbox)
              </button>
              <button onclick="window.MembershipAdminPanel.resetPlans()" 
                      style="flex:1; padding:12px; background:#64748b; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:1rem;">
                🔄 Resetear a Valores Base
              </button>
            </div>
          </div>

          <!-- Tab: Simulador -->
          <div id="simulator-tab" style="display:none;">
            <div style="background:#f8f9fa; border-radius:12px; padding:20px;">
              <h3 style="margin-top:0; color:#b71c1c;">Simular Pedido</h3>
              
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                <div>
                  <label style="display:block; font-weight:bold; margin-bottom:5px;">Subtotal ($)</label>
                  <input type="number" id="sim-subtotal" value="50000" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:1rem;">
                </div>
                <div>
                  <label style="display:block; font-weight:bold; margin-bottom:5px;">Tipo de Cliente</label>
                  <select id="sim-tier" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:1rem;">
                    <option value="">Cliente Normal</option>
                    <option value="plus">Plus</option>
                    <option value="pro">Pro</option>
                    <option value="ultra">Ultra</option>
                  </select>
                </div>
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                <div>
                  <label style="display:block; font-weight:bold; margin-bottom:5px;">Oferta Producto (%)</label>
                  <input type="number" id="sim-offer" value="0" min="0" max="50" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:1rem;">
                </div>
                <div>
                  <label style="display:block; font-weight:bold; margin-bottom:5px;">Canje Puntos ($)</label>
                  <input type="number" id="sim-redeem" value="0" min="0" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:1rem;">
                </div>
              </div>

              <button onclick="window.MembershipAdminPanel.runSimulation()" 
                      style="width:100%; padding:12px; background:#FF6B9D; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:1rem; margin-bottom:15px;">
                ▶️ Ejecutar Simulación
              </button>

              <div id="simulation-result" style="background:white; border:2px solid #FFD700; border-radius:8px; padding:15px; display:none;">
                <!-- Resultado de simulación -->
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    // Inyectar en el DOM si no existe
    if (!document.getElementById('membershipAdminModal')) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      document.body.appendChild(wrapper.firstElementChild);
    }
  },

  /**
   * Abre el panel (con verificación de admin)
   */
  openPanel: function() {
    if (!this.requireAdmin()) return;

    this.createPanelUI();
    const modal = document.getElementById('membershipAdminModal');
    if (modal) {
      modal.style.display = 'flex';
      this.isOpen = true;
      this.renderPlansEditor();
      console.log('✓ Panel de membresías abierto');
    }
  },

  /**
   * Cierra el panel
   */
  closePanel: function() {
    const modal = document.getElementById('membershipAdminModal');
    if (modal) {
      modal.style.display = 'none';
      this.isOpen = false;
      console.log('✓ Panel de membresías cerrado');
    }
  },

  // ============================================================================
  // TAB SWITCHING
  // ============================================================================

  switchTab: function(tab) {
    const editorTab = document.getElementById('editor-tab');
    const simulatorTab = document.getElementById('simulator-tab');
    const editorBtn = document.getElementById('tab-editor-btn');
    const simulatorBtn = document.getElementById('tab-simulator-btn');

    if (tab === 'editor') {
      editorTab.style.display = 'block';
      simulatorTab.style.display = 'none';
      editorBtn.style.background = '#FF6B9D';
      editorBtn.style.color = 'white';
      simulatorBtn.style.background = '#e0e0e0';
      simulatorBtn.style.color = '#555';
    } else {
      editorTab.style.display = 'none';
      simulatorTab.style.display = 'block';
      editorBtn.style.background = '#e0e0e0';
      editorBtn.style.color = '#555';
      simulatorBtn.style.background = '#FF6B9D';
      simulatorBtn.style.color = 'white';
    }
  },

  // ============================================================================
  // EDITOR DE PLANES (Tarjetas Editables)
  // ============================================================================

  renderPlansEditor: function() {
    if (!window.MembershipPlansEngine) {
      console.error('❌ MembershipPlansEngine no cargado');
      return;
    }

    const container = document.getElementById('plansEditorContainer');
    if (!container) return;

    const plans = window.MembershipPlansEngine.getAllPlans();
    let html = '';

    for (const [tier, plan] of Object.entries(plans)) {
      const cardBgColor = plan.color_ui || '#FF6B9D';
      html += `
        <div style="background:linear-gradient(135deg, ${cardBgColor}33, ${cardBgColor}11); border:2px solid ${cardBgColor}; border-radius:12px; padding:20px; position:relative;">
          
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0; color:${cardBgColor}; font-size:1.2rem; font-weight:bold;">
              ${plan.name}
            </h3>
            <span style="background:${cardBgColor}; color:white; padding:6px 12px; border-radius:20px; font-size:0.85rem; font-weight:bold;">
              ${tier.toUpperCase()}
            </span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
            
            <div>
              <label style="display:block; font-weight:bold; font-size:0.9rem; margin-bottom:4px;">Precio/mes (COP)</label>
              <input type="number" id="price_${tier}" value="${plan.price_cop}" 
                     style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:1rem;">
            </div>

            <div>
              <label style="display:block; font-weight:bold; font-size:0.9rem; margin-bottom:4px;">Duración (días)</label>
              <input type="number" id="duration_${tier}" value="${plan.duration_days}" 
                     style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:1rem;">
            </div>

            <div>
              <label style="display:block; font-weight:bold; font-size:0.9rem; margin-bottom:4px;">% Descuento</label>
              <input type="number" id="discount_${tier}" value="${plan.discount_percent}" min="0" max="50"
                     style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:1rem;">
            </div>

            <div>
              <label style="display:block; font-weight:bold; font-size:0.9rem; margin-bottom:4px;">Multiplicador Puntos</label>
              <input type="number" id="multiplier_${tier}" value="${plan.points_multiplier}" step="0.05" min="1"
                     style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:1rem;">
            </div>

            <div style="grid-column:1/-1;">
              <label style="display:block; font-weight:bold; font-size:0.9rem; margin-bottom:4px;">Domicilio Gratis (mín. $)</label>
              <input type="number" id="delivery_${tier}" value="${plan.free_delivery_min_subtotal}" min="0"
                     style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:1rem;">
            </div>

          </div>

          <button onclick="window.MembershipAdminPanel.updatePlan('${tier}')" 
                  style="width:100%; padding:10px; background:${cardBgColor}; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:0.95rem;">
            💾 Guardar Cambios (${tier})
          </button>

        </div>
      `;
    }

    container.innerHTML = html;
  },

  updatePlan: function(tier) {
    const updates = {
      price_cop: parseInt(document.getElementById(`price_${tier}`).value) || 15000,
      duration_days: parseInt(document.getElementById(`duration_${tier}`).value) || 30,
      discount_percent: parseInt(document.getElementById(`discount_${tier}`).value) || 8,
      points_multiplier: parseFloat(document.getElementById(`multiplier_${tier}`).value) || 1.0,
      free_delivery_min_subtotal: parseInt(document.getElementById(`delivery_${tier}`).value) || 30000
    };

    const result = window.MembershipPlansEngine.updatePlanSandbox(tier, updates);
    if (result.success) {
      console.log(`✓ Plan ${tier} actualizado`);
      alert(`✓ Plan ${tier.toUpperCase()} actualizado en SANDBOX`);
      this.renderPlansEditor();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  },

  saveAllPlans: function() {
    console.log('💾 Guardando todos los planes en SANDBOX...');
    console.log(window.MembershipPlansEngine.getAllPlans());
    alert('✓ Cambios guardados en SANDBOX (pruebas internas)');
  },

  resetPlans: function() {
    if (confirm('¿Resetear TODOS los planes a valores base?')) {
      const result = window.MembershipPlansEngine.resetToDefaults();
      if (result) {
        this.renderPlansEditor();
        alert('✓ Planes reseteados a valores base');
      }
    }
  },

  // ============================================================================
  // SIMULADOR DE CARRITO
  // ============================================================================

  runSimulation: function() {
    const subtotal = parseInt(document.getElementById('sim-subtotal').value) || 50000;
    const tier = document.getElementById('sim-tier').value || null;
    const offerPercent = parseInt(document.getElementById('sim-offer').value) || 0;
    const redeemValue = parseInt(document.getElementById('sim-redeem').value) || 0;

    const cartItems = [
      { price: subtotal, quantity: 1 }
    ];

    const simulation = window.MembershipPlansEngine.simulateCheckout(cartItems, tier, {
      productOfferPercent: offerPercent,
      redeemValue: redeemValue
    });

    this.displaySimulationResult(simulation);
  },

  displaySimulationResult: function(sim) {
    const resultDiv = document.getElementById('simulation-result');
    if (!resultDiv) return;

    let warningClass = sim.margen_warning ? 'style="background:#FFE5E5; border-color:#FF6B6B;"' : '';

    const html = `
      <div>
        <h4 style="margin-top:0; color:#b71c1c;">Resultado de Simulación</h4>
        
        <table style="width:100%; border-collapse:collapse; font-size:0.95rem;">
          <tr style="border-bottom:1px solid #ddd;">
            <td style="padding:8px; font-weight:bold;">Subtotal Bruto:</td>
            <td style="padding:8px; text-align:right; color:#059669;">$${sim.subtotal_bruto.toLocaleString('es-CO')} COP</td>
          </tr>
          <tr style="border-bottom:1px solid #ddd;">
            <td style="padding:8px; font-weight:bold;">Descuento:</td>
            <td style="padding:8px; text-align:right; color:#FF6B9D;">-$${sim.descuento_aplicado.toLocaleString('es-CO')} COP (${sim.descuento_razon})</td>
          </tr>
          <tr style="border-bottom:1px solid #ddd;">
            <td style="padding:8px; font-weight:bold;">Sub-post-descuento:</td>
            <td style="padding:8px; text-align:right;">$${sim.subtotal_post_descuento.toLocaleString('es-CO')} COP</td>
          </tr>
          ${sim.canje_puntos > 0 ? `
          <tr style="border-bottom:1px solid #ddd;">
            <td style="padding:8px; font-weight:bold;">Canje Puntos:</td>
            <td style="padding:8px; text-align:right; color:#FF6B9D;">-$${sim.canje_puntos.toLocaleString('es-CO')} COP</td>
          </tr>
          <tr style="border-bottom:1px solid #ddd;">
            <td style="padding:8px; font-weight:bold;">Sub-post-canje:</td>
            <td style="padding:8px; text-align:right;">$${sim.subtotal_post_canje.toLocaleString('es-CO')} COP</td>
          </tr>
          ` : ''}
          <tr style="border-bottom:1px solid #ddd;">
            <td style="padding:8px; font-weight:bold;">Domicilio:</td>
            <td style="padding:8px; text-align:right; color:#059669;">$${sim.domicilio.toLocaleString('es-CO')} COP (${sim.domicilio_razon})</td>
          </tr>
          <tr style="border-bottom:2px solid #FFD700; background:#FFF9E6;">
            <td style="padding:12px; font-weight:bold; font-size:1.1rem;">TOTAL A PAGAR:</td>
            <td style="padding:12px; text-align:right; font-weight:bold; font-size:1.1rem; color:#b71c1c;">$${sim.total_a_pagar.toLocaleString('es-CO')} COP</td>
          </tr>
          <tr style="border-bottom:1px solid #ddd;">
            <td style="padding:8px; font-weight:bold;">Puntos Ganados:</td>
            <td style="padding:8px; text-align:right; color:#059669;">🎟️ ${sim.puntos_ganados}</td>
          </tr>
          ${sim.puntos_bonus_cumpleaños > 0 ? `
          <tr style="border-bottom:1px solid #ddd;">
            <td style="padding:8px; font-weight:bold;">+ Bonus Cumpleaños:</td>
            <td style="padding:8px; text-align:right; color:#059669;">🎂 +${sim.puntos_bonus_cumpleaños}</td>
          </tr>
          ` : ''}
          <tr ${warningClass}>
            <td style="padding:8px; font-weight:bold;">Margen Ganancia:</td>
            <td style="padding:8px; text-align:right; color:${sim.margen_warning ? '#FF6B6B' : '#059669'}; font-weight:bold;">
              ${sim.margen_percent}% ${sim.margen_warning ? '⚠️ BAJO (<20%)' : '✅ SEGURO'}
            </td>
          </tr>
        </table>

        <p style="font-size:0.85rem; color:#666; margin-top:10px; margin-bottom:0;">
          Cliente: <strong>${sim.user_tier || 'Normal'}</strong> | Simulación: ${new Date(sim.timestamp).toLocaleTimeString('es-CO')}
        </p>
      </div>
    `;

    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
  }
};

console.log('✓ MembershipAdminPanel cargado: window.MembershipAdminPanel disponible');
