/**
 * FASE 2: ADAPTADOR PASIVO DE MEMBRESÍA (PDMembershipAdapter)
 * 
 * Este módulo define la interfaz neutra y segura que permite que un repositorio
 * independiente (futuro módulo Plus, Pro, Ultra) se conecte sin modificar
 * script.js, firebase-sync.js ni ninguna lógica de carrito/puntos.
 * 
 * ARQUITECTURA:
 * 1. El adaptador EXPONE métodos de lectura (queries de estado actual)
 * 2. El adaptador PERMITE que módulos externos se registren como "handlers"
 * 3. Los handlers pueden INTERCEPTAR cálculos (descuento, multiplier) sin modificar
 * 4. Los handlers NUNCA pueden escribir puntos, eliminar históricos ni modificar datos
 * 
 * FLUJO FUTURO:
 * - Fase 2: El adaptador existe pero devuelve comportamiento "por defecto" (Club de Puntos + VIP legacy)
 * - Fase 3: Se conecta repositorio independiente Plus/Pro/Ultra como "handler externo"
 * - Fase 3: Ese handler devuelve tiering modificado, descuentos nuevos, sin tocar código aquí
 */

window.PDMembershipAdapter = {
  // ============================================================================
  // ESTADO COMPARTIDO (LECTURA)
  // ============================================================================
  
  _externalHandlers: [],  // Registros de módulos externos conectados
  
  /**
   * Retorna el estado ACTUAL de membresía del usuario en sesión.
   * Esto es una lectura segura del objeto window.currentUser.
   * 
   * @returns {Object} Estado de membresía:
   *   {
   *     userEmail: string,
   *     hasMembership: boolean (true si vip=true en Firebase),
   *     membershipType: string ('legacy_vip' | 'plus' | 'pro' | 'ultra' | 'none'),
   *     monthlyPrice: number (COP),
   *     discountPercent: number (0-100),
   *     pointsMultiplier: number (1.0 = default),
   *     expiresAt: ISO string or null,
   *     source: string ('firebase' | 'external_handler' | 'adapter_default')
   *   }
   */
  getMembershipState: function() {
    const user = (typeof window.currentUser !== 'undefined') ? window.currentUser : null;
    
    let state = {
      userEmail: (user && user.email) ? user.email : 'anonymous',
      hasMembership: !!(user && user.vip),
      membershipType: (user && user.vip) ? 'legacy_vip' : 'none',
      monthlyPrice: (typeof window.vipConfig !== 'undefined' && window.vipConfig.precioMensual) 
        ? window.vipConfig.precioMensual 
        : 20000,
      discountPercent: (user && user.vip) ? 6 : 0,
      pointsMultiplier: (user && user.vip) ? 1.0 : 1.0,  // Placeholder para future tiers
      expiresAt: (user && user.vipExpiresAt) ? user.vipExpiresAt : null,
      source: 'adapter_default'
    };

    // Si hay handlers externos registrados, permitir que modifiquen el estado
    for (let handler of this._externalHandlers) {
      if (typeof handler.onGetMembershipState === 'function') {
        try {
          const modified = handler.onGetMembershipState(state);
          if (modified && typeof modified === 'object') {
            state = Object.assign({}, state, modified, { source: 'external_handler' });
          }
        } catch (e) {
          console.error('Error en handler externo onGetMembershipState:', e);
        }
      }
    }

    return state;
  },

  /**
   * Calcula el descuento a aplicar en el carrito basado en el estado de membresía.
   * Esta función es PURA (no modifica estado) y puede ser interceptada por handlers.
   * 
   * @param {number} subtotal - Monto en COP antes de descuento
   * @returns {Object} {
   *   discount: number (COP),
   *   reason: string (descripción del descuento),
   *   appliedBy: string ('legacy_vip' | 'external_tier' | 'none')
   * }
   */
  calculateDiscount: function(subtotal) {
    const membershipState = this.getMembershipState();
    let result = {
      discount: 0,
      reason: 'Sin membresía activa',
      appliedBy: 'none'
    };

    // Default: Aplicar descuento si usuario tiene vip=true
    if (membershipState.hasMembership && membershipState.discountPercent > 0) {
      result.discount = Math.floor(subtotal * (membershipState.discountPercent / 100));
      result.reason = `Descuento ${membershipState.discountPercent}% (${membershipState.membershipType})`;
      result.appliedBy = membershipState.membershipType;
    }

    // Permitir que handlers externos modifiquen el cálculo
    for (let handler of this._externalHandlers) {
      if (typeof handler.onCalculateDiscount === 'function') {
        try {
          const modified = handler.onCalculateDiscount(result, subtotal, membershipState);
          if (modified && typeof modified === 'object') {
            result = Object.assign({}, result, modified);
          }
        } catch (e) {
          console.error('Error en handler externo onCalculateDiscount:', e);
        }
      }
    }

    return result;
  },

  /**
   * Calcula el multiplicador de puntos a aplicar en la acumulación.
   * Esto permite que tiers de membresía multipliquen puntos sin tocar script.js.
   * 
   * @returns {Object} {
   *   multiplier: number (1.0 = normal, 1.5 = 50% más, etc.),
   *   reason: string,
   *   appliedBy: string
   * }
   */
  calculatePointsMultiplier: function() {
    const membershipState = this.getMembershipState();
    let result = {
      multiplier: 1.0,
      reason: 'Multiplicador estándar',
      appliedBy: 'none'
    };

    // Default: Legacy VIP podría multiplicar (aunque ahora es 1.0)
    if (membershipState.membershipType === 'legacy_vip') {
      result.multiplier = 1.0;  // Sin multiplicación en legacy
      result.reason = 'Multiplicador estándar (VIP legacy)';
      result.appliedBy = 'legacy_vip';
    }

    // Permitir que handlers externos apliquen multiplicadores de nuevos tiers
    for (let handler of this._externalHandlers) {
      if (typeof handler.onCalculatePointsMultiplier === 'function') {
        try {
          const modified = handler.onCalculatePointsMultiplier(result, membershipState);
          if (modified && typeof modified === 'object') {
            result = Object.assign({}, result, modified);
          }
        } catch (e) {
          console.error('Error en handler externo onCalculatePointsMultiplier:', e);
        }
      }
    }

    return result;
  },

  /**
   * Retorna información de beneficios de la membresía actual para mostrar en UI.
   * Es descriptivo solamente, NO modifica datos.
   * 
   * @returns {Array} Array de strings describiendo beneficios
   */
  getBenefits: function() {
    const membershipState = this.getMembershipState();
    let benefits = [];

    if (!membershipState.hasMembership) {
      benefits = [
        'Acumula puntos con cada compra',
        'Canjea por recompensas exclusivas',
        'Acceso a promociones especiales'
      ];
    } else if (membershipState.membershipType === 'legacy_vip') {
      benefits = [
        `${membershipState.discountPercent}% de descuento en todas tus compras`,
        'Acumula puntos con cada pedido',
        'Despacho prioritario en cocina',
        'Sorpresas en tu cumpleaños'
      ];
    }

    // Permitir que handlers externos agreguen beneficios de nuevos tiers
    for (let handler of this._externalHandlers) {
      if (typeof handler.onGetBenefits === 'function') {
        try {
          const external = handler.onGetBenefits(benefits, membershipState);
          if (Array.isArray(external)) {
            benefits = external;
          }
        } catch (e) {
          console.error('Error en handler externo onGetBenefits:', e);
        }
      }
    }

    return benefits;
  },

  // ============================================================================
  // REGISTRO DE HANDLERS EXTERNOS (Para futuro repositorio independiente)
  // ============================================================================

  /**
   * Permite que un módulo externo (repositorio Plus/Pro/Ultra) se registre
   * como "handler" para interceptar y modificar comportamientos de membresía.
   * 
   * @param {string} name - Nombre del handler (ej: 'plus_pro_ultra_module')
   * @param {Object} handler - Objeto con métodos opcionales:
   *   - onGetMembershipState(state): Modifica el estado de membresía
   *   - onCalculateDiscount(result, subtotal, membershipState): Modifica descuento
   *   - onCalculatePointsMultiplier(result, membershipState): Modifica multiplier
   *   - onGetBenefits(benefits, membershipState): Modifica lista de beneficios
   * 
   * @returns {boolean} true si se registró exitosamente
   */
  registerExternalHandler: function(name, handler) {
    if (!name || !handler || typeof handler !== 'object') {
      console.error('PDMembershipAdapter: Handler inválido', name);
      return false;
    }

    // Verificar que no esté duplicado
    if (this._externalHandlers.some(h => h._name === name)) {
      console.warn(`PDMembershipAdapter: Handler "${name}" ya estaba registrado, reemplazando...`);
      this.unregisterExternalHandler(name);
    }

    handler._name = name;
    this._externalHandlers.push(handler);
    console.log(`✓ PDMembershipAdapter: Handler externo registrado: ${name}`, handler);
    return true;
  },

  /**
   * Desregistra un handler externo.
   */
  unregisterExternalHandler: function(name) {
    this._externalHandlers = this._externalHandlers.filter(h => h._name !== name);
    console.log(`✓ PDMembershipAdapter: Handler "${name}" desregistrado`);
  },

  /**
   * Retorna lista de handlers externos activos (para auditoría).
   */
  getRegisteredHandlers: function() {
    return this._externalHandlers.map(h => h._name);
  },

  // ============================================================================
  // MÉTODOS DE UTILIDAD Y LOGGING
  // ============================================================================

  /**
   * Retorna un resumen de diagnóstico del adaptador.
   */
  getDiagnostics: function() {
    return {
      timestamp: new Date().toISOString(),
      membershipState: this.getMembershipState(),
      discountCalculation: this.calculateDiscount(100000),  // Test con $100k
      pointsMultiplier: this.calculatePointsMultiplier(),
      benefits: this.getBenefits(),
      externalHandlers: this.getRegisteredHandlers(),
      phase: 'PHASE_2_PASSIVE_BRIDGE'
    };
  },

  /**
   * Inicializa el adaptador y verifica que todas las dependencias estén listas.
   * Se llama automáticamente en DOMContentLoaded.
   */
  initialize: function() {
    console.log('🔌 PDMembershipAdapter: Inicializando...');
    
    // Verificar que feature flags estén cargados
    if (typeof window.PDFeatureFlags === 'undefined') {
      console.warn('⚠️ PDMembershipAdapter: PDFeatureFlags no detectado, cargando...');
    }

    // Verificar que currentUser sea accesible (se cargará asincronamente desde firebase-sync.js)
    if (typeof window.currentUser === 'undefined') {
      console.log('ℹ️ PDMembershipAdapter: currentUser aún no cargado (es normal, esperando Firebase)');
    }

    console.log('✓ PDMembershipAdapter: Listo para usar');
  },

  /**
   * Verifica si es la primera compra del usuario
   * @returns {boolean} true si el usuario nunca ha completado un pedido
   */
  isFirstPurchase: function() {
    const user = (typeof window.currentUser !== 'undefined') ? window.currentUser : null;
    if (!user) return false;
    
    // Verificar si tiene historial de pedidos
    const hasOrderHistory = user.orderHistory && Array.isArray(user.orderHistory) && user.orderHistory.length > 0;
    
    // Si no tiene historial, es primera compra
    return !hasOrderHistory;
  },

  /**
   * Obtiene el descuento de primera compra (3%)
   * @returns {number} Porcentaje de descuento de bienvenida
   */
  getFirstPurchaseDiscountPercent: function() {
    // Verificar si el motor de planes está disponible
    if (typeof window.MembershipPlansEngine !== 'undefined' && window.MembershipPlansEngine.firstPurchaseDiscountPercent) {
      return window.MembershipPlansEngine.firstPurchaseDiscountPercent;
    }
    // Fallback: 3% por defecto
    return 3;
  }
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.PDMembershipAdapter.initialize();
  });
} else {
  window.PDMembershipAdapter.initialize();
}

console.log('✓ Adaptador PDMembershipAdapter cargado y disponible en window.PDMembershipAdapter');
