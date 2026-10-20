/**
 * FASE 4: MEMBERSHIP PLANS ENGINE
 * 
 * Motor de cálculos para Plus, Pro y Ultra
 * - Completamente modular e independiente
 * - Se conecta a PDMembershipAdapter (Fase 2)
 * - CERO modificación de lógica existente en script.js
 * - SANDBOX MODE: Todas las pruebas aisladas en memoria
 */

window.MembershipPlansEngine = {
  // ============================================================================
  // CONFIGURACIÓN BASE (Editable desde Admin Panel)
  // ============================================================================
  
  // Descuento de bienvenida para nuevos usuarios (primera compra)
  firstPurchaseDiscountPercent: 3,  // 3% en la primera compra al registrarse
  
  defaultPlans: {
    plus: {
      tier: 'plus',
      name: 'Plan Plus',
      price_cop: 15000,
      duration_days: 30,
      discount_percent: 8,
      points_multiplier: 1.15,
      free_delivery_min_subtotal: 35000,
      max_free_deliveries_per_month: null,
      priority_level: 1,
      birthday_bonus_points: 0,
      benefits: ['8% descuento', '15% más puntos', 'Domicilio gratis >$35k', 'Prioridad en cocina'],
      color_ui: '#FF6B9D',
      renewable: true
    },
    pro: {
      tier: 'pro',
      name: 'Plan Pro',
      price_cop: 25000,
      duration_days: 30,
      discount_percent: 12,
      points_multiplier: 1.25,
      free_delivery_min_subtotal: 28000,
      max_free_deliveries_per_month: null,
      priority_level: 2,
      birthday_bonus_points: 50,
      benefits: ['12% descuento', '25% más puntos', 'Domicilio gratis >$28k', '+50 pts cumpleaños'],
      color_ui: '#D81B60',
      renewable: true
    },
    ultra: {
      tier: 'ultra',
      name: 'Plan Ultra',
      price_cop: 38000,
      duration_days: 30,
      discount_percent: 15,
      points_multiplier: 1.5,
      free_delivery_min_subtotal: 20000,
      max_free_deliveries_per_month: null,
      priority_level: 3,
      birthday_bonus_points: 100,
      benefits: ['15% descuento', '50% más puntos', 'Domicilio gratis >$20k', '+100 pts cumpleaños'],
      color_ui: '#FFD700',
      renewable: true
    }
  },

  // Estado actual (en sandbox, no persiste en Firebase)
  currentPlans: {},
  sandboxMode: true,
  productionBlocked: true,

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  initialize: function() {
    console.log('🔧 MembershipPlansEngine: Inicializando...');
    
    // Copiar configuración base
    this.currentPlans = JSON.parse(JSON.stringify(this.defaultPlans));
    
    // Inicializar estado de sandbox
    this.sandboxState = {
      mode: 'sandbox',
      lastModified: new Date().toISOString(),
      testSimulations: []
    };
    
    console.log('✓ Motor de membresías cargado en SANDBOX mode (no modificará producción)');
  },

  // ============================================================================
  // LECTURA DE PLANES
  // ============================================================================

  /**
   * Obtiene un plan específico
   */
  getPlan: function(tier) {
    if (!tier || !this.currentPlans[tier]) {
      console.warn(`Plan "${tier}" no encontrado`);
      return null;
    }
    return JSON.parse(JSON.stringify(this.currentPlans[tier]));
  },

  /**
   * Obtiene TODOS los planes
   */
  getAllPlans: function() {
    return JSON.parse(JSON.stringify(this.currentPlans));
  },

  /**
   * Valida que un plan tenga todos los campos requeridos
   */
  validatePlanStructure: function(plan) {
    const required = [
      'tier', 'name', 'price_cop', 'duration_days', 'discount_percent',
      'points_multiplier', 'free_delivery_min_subtotal', 'priority_level', 'benefits'
    ];
    
    for (const field of required) {
      if (!(field in plan)) {
        return { valid: false, error: `Campo requerido faltante: ${field}` };
      }
    }
    
    // Validar rangos
    if (plan.discount_percent < 0 || plan.discount_percent > 50) {
      return { valid: false, error: 'Descuento debe estar entre 0% y 50%' };
    }
    if (plan.price_cop < 5000) {
      return { valid: false, error: 'Precio debe ser >= $5.000 COP' };
    }
    if (plan.free_delivery_min_subtotal < 0) {
      return { valid: false, error: 'Mínimo de domicilio gratis no puede ser negativo' };
    }
    
    return { valid: true };
  },

  // ============================================================================
  // EDICIÓN DE PLANES (Solo en Sandbox)
  // ============================================================================

  /**
   * Modifica un plan en SANDBOX (no toca Firebase)
   */
  updatePlanSandbox: function(tier, updates) {
    if (!this.sandboxMode) {
      console.error('❌ No se puede editar en modo PRODUCCIÓN');
      return { success: false, error: 'Modo producción bloqueado' };
    }

    if (!this.currentPlans[tier]) {
      return { success: false, error: `Plan "${tier}" no existe` };
    }

    // Validar la actualización
    const updated = Object.assign({}, this.currentPlans[tier], updates);
    const validation = this.validatePlanStructure(updated);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Guardar cambios en sandbox
    this.currentPlans[tier] = updated;
    this.sandboxState.lastModified = new Date().toISOString();

    console.log(`✓ Plan ${tier} actualizado en SANDBOX:`, updated);
    return { success: true, plan: updated };
  },

  /**
   * Resetea todos los planes a valores base
   */
  resetToDefaults: function() {
    if (!this.sandboxMode) {
      console.error('❌ No se puede resetear en modo PRODUCCIÓN');
      return false;
    }
    
    this.currentPlans = JSON.parse(JSON.stringify(this.defaultPlans));
    console.log('✓ Todos los planes reseteados a valores base');
    return true;
  },

  // ============================================================================
  // CÁLCULOS DE CHECKOUT (Core)
  // ============================================================================

  /**
   * Calcula el descuento exacto en carrito
   * Incluye descuento de primera compra (3%)
   * REGLA: Prevalece descuento mayor entre: oferta, tier%, o primera compra
   * Respeta MAX(oferta, tier%, primeraCompra%) para proteger margen
   */
  calculateDiscount: function(subtotal, userTier, productOfferPercent = 0, isFirstPurchase = false) {
    // Si no tiene tier, verificar si es primera compra
    if (!userTier || !this.currentPlans[userTier]) {
      if (isFirstPurchase) {
        const firstPurchaseDiscount = Math.floor(subtotal * (this.firstPurchaseDiscountPercent / 100));
        return { 
          discount: firstPurchaseDiscount, 
          appliedBy: 'firstPurchase', 
          reason: `Descuento de bienvenida ${this.firstPurchaseDiscountPercent}%`,
          maxDiscount: this.firstPurchaseDiscountPercent
        };
      }
      return { discount: 0, appliedBy: 'none', reason: 'Cliente normal' };
    }

    const plan = this.currentPlans[userTier];
    const tierDiscount = plan.discount_percent;
    
    // Aplicar MAX: descuento mayor entre oferta, tier y primera compra
    let maxDiscount = Math.max(productOfferPercent, tierDiscount);
    if (isFirstPurchase) {
      maxDiscount = Math.max(maxDiscount, this.firstPurchaseDiscountPercent);
    }
    
    const discount = Math.floor(subtotal * (maxDiscount / 100));

    return {
      discount: discount,
      appliedBy: userTier,
      reason: `Descuento ${maxDiscount}% (${userTier})`,
      maxDiscount: maxDiscount
    };
  },

  /**
   * Calcula domicilio según tier y monto
   * Protege contra domicilios gratis infinitos
   */
  calculateDelivery: function(subtotal, userTier, monthlyFreeDeliveryCount = 0) {
    const DEFAULT_DELIVERY = 5000;

    if (!userTier || !this.currentPlans[userTier]) {
      return { delivery: DEFAULT_DELIVERY, reason: 'Cliente normal' };
    }

    const plan = this.currentPlans[userTier];
    const minimum = plan.free_delivery_min_subtotal;
    const maxFree = plan.max_free_deliveries_per_month;

    // Validación 1: ¿Cumple monto mínimo?
    if (subtotal < minimum) {
      return { delivery: DEFAULT_DELIVERY, reason: `Compra ${subtotal} < ${minimum} (se cobra)` };
    }

    // Validación 2: ¿Ha alcanzado límite mensual?
    if (maxFree !== null && monthlyFreeDeliveryCount >= maxFree) {
      return { delivery: DEFAULT_DELIVERY, reason: `Límite mensual (${maxFree}) alcanzado` };
    }

    // Cumple todo: domicilio GRATIS
    return { delivery: 0, reason: `Domicilio GRATIS (${plan.name})` };
  },

  /**
   * Calcula multiplicador de puntos
   */
  calculatePointsMultiplier: function(userTier) {
    if (!userTier || !this.currentPlans[userTier]) {
      return { multiplier: 1.0, reason: 'Cliente normal' };
    }

    const plan = this.currentPlans[userTier];
    return { multiplier: plan.points_multiplier, reason: `${plan.name}: ${plan.points_multiplier}x` };
  },

  // ============================================================================
  // SIMULADOR DE CARRITO (Sandbox)
  // ============================================================================

  /**
   * Simula un pedido completo con todos los cálculos
   * NO modifica datos reales, solo retorna resultado
   */
  simulateCheckout: function(cartItems, userTier, options = {}) {
    const {
      productOfferPercent = 0,
      monthlyFreeDeliveryCount = 0,
      redeemValue = 0,
      userBirthdayBonus = false
    } = options;

    // Paso 1: Calcular subtotal bruto
    let subtotalBruto = 0;
    cartItems.forEach(item => {
      subtotalBruto += (item.price * item.quantity);
    });

    // Paso 2: Aplicar descuento MAX(oferta, tier)
    const discountCalc = this.calculateDiscount(subtotalBruto, userTier, productOfferPercent);
    const subtotalConDescuento = subtotalBruto - discountCalc.discount;

    // Paso 3: Aplicar canje de puntos (si existe)
    const subtotalPostCanje = subtotalConDescuento - redeemValue;

    // Paso 4: Calcular domicilio
    const deliveryCalc = this.calculateDelivery(subtotalPostCanje, userTier, monthlyFreeDeliveryCount);

    // Paso 5: Total final
    const totalFinal = subtotalPostCanje + deliveryCalc.delivery;

    // Paso 6: Calcular puntos ganados
    const pointsMultiplier = this.calculatePointsMultiplier(userTier);
    let pointsEarned = Math.floor((totalFinal / 1000) * pointsMultiplier.multiplier);
    
    // Bonus cumpleaños
    if (userBirthdayBonus && userTier && this.currentPlans[userTier]) {
      pointsEarned += this.currentPlans[userTier].birthday_bonus_points;
    }

    // Paso 7: Validar margen mínimo
    const MIN_MARGIN_PERCENT = 20;
    const costEstimate = subtotalBruto * 0.5;  // Estimación: costo ~ 50% del precio
    const marginPercent = ((totalFinal - costEstimate) / totalFinal) * 100;
    const marginWarning = marginPercent < MIN_MARGIN_PERCENT;

    // Resultado completo
    const simulation = {
      subtotal_bruto: subtotalBruto,
      descuento_aplicado: discountCalc.discount,
      descuento_razon: discountCalc.reason,
      subtotal_post_descuento: subtotalConDescuento,
      canje_puntos: redeemValue,
      subtotal_post_canje: subtotalPostCanje,
      domicilio: deliveryCalc.delivery,
      domicilio_razon: deliveryCalc.reason,
      total_a_pagar: totalFinal,
      puntos_ganados: pointsEarned,
      puntos_bonus_cumpleaños: (userBirthdayBonus && userTier && this.currentPlans[userTier]) ? this.currentPlans[userTier].birthday_bonus_points : 0,
      margen_percent: marginPercent.toFixed(1),
      margen_warning: marginWarning,
      timestamp: new Date().toISOString(),
      user_tier: userTier || 'normal'
    };

    // Guardar en histórico
    this.sandboxState.testSimulations.push(simulation);

    return simulation;
  },

  /**
   * Retorna todas las simulaciones ejecutadas en sandbox
   */
  getSandboxSimulations: function() {
    return this.sandboxState.testSimulations;
  },

  /**
   * Limpia el histórico de simulaciones
   */
  clearSandboxHistory: function() {
    this.sandboxState.testSimulations = [];
    console.log('✓ Histórico de simulaciones limpiado');
  },

  // ============================================================================
  // DIAGNÓSTICO Y AUDITORÍA
  // ============================================================================

  /**
   * Retorna estado completo del motor
   */
  getDiagnostics: function() {
    return {
      timestamp: new Date().toISOString(),
      mode: this.sandboxMode ? 'SANDBOX' : 'PRODUCTION',
      productionBlocked: this.productionBlocked,
      plans: this.getAllPlans(),
      simulationsCount: this.sandboxState.testSimulations.length,
      sandboxState: this.sandboxState,
      connection: {
        adapterAvailable: typeof window.PDMembershipAdapter !== 'undefined',
        featureFlagsAvailable: typeof window.PDFeatureFlags !== 'undefined'
      }
    };
  },

  /**
   * Valida coherencia de todos los planes
   */
  validateAllPlans: function() {
    const errors = [];
    
    for (const [tier, plan] of Object.entries(this.currentPlans)) {
      const validation = this.validatePlanStructure(plan);
      if (!validation.valid) {
        errors.push(`${tier}: ${validation.error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      count: Object.keys(this.currentPlans).length
    };
  }
};

// Inicializar automáticamente
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.MembershipPlansEngine.initialize();
  });
} else {
  window.MembershipPlansEngine.initialize();
}

console.log('✓ MembershipPlansEngine cargado: window.MembershipPlansEngine disponible');
