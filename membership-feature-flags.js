/**
 * FASE 2: FEATURE FLAGS DE MEMBRESÍA
 * 
 * Este módulo encapsula las banderas de control para aislar y gestionar
 * la visualización de la membresía VIP antigua vs el nuevo sistema de Club de Puntos.
 * 
 * La lógica actual:
 * - Club de Puntos: Visible para TODOS (incentivo por cada compra, sin costo)
 * - Membresía VIP Antigua: Controlada por feature flag (solo visible si está habilitada)
 * - Adaptador Pasivo: Permite que nuevos planes Plus/Pro/Ultra se conecten sin modificar script.js
 */

window.PDFeatureFlags = {
  // ==============================================================================
  // FEATURE FLAG: Control de visibilidad de membresía VIP antigua
  // ==============================================================================
  
  /**
   * Controla si la interfaz de promoción de "Membresía VIP Oro antigua" es visible
   * al cliente. 
   * 
   * FALSE (deshabilitado por defecto en Fase 2):
   *   - El botón "Activar Membresía VIP" NO se muestra en la sección club-puntos
   *   - El modal "Membresía Club VIP Oro" NO es accesible para nuevos clientes
   *   - Los usuarios ACTUALES con vip=true en Firebase mantienen su descuento activo
   *   - Los datos históricos se conservan intactos
   * 
   * TRUE (habilitado):
   *   - Se mostrarían las promesas de membresía VIP antigua (para transición)
   *   - Se permite compra de membresía VIP por $20.000 COP/mes
   */
  SHOW_LEGACY_VIP_PROMOTION: false,

  /**
   * Controla si los datos de VIP leído del usuario pueden aplicar descuento.
   * En Fase 4/Limpieza final, el VIP antiguo está erradicado por completo.
   */
  APPLY_LEGACY_VIP_DISCOUNT: false,

  /**
   * Controla si se muestra el "Adaptador de Membresía" (PDMembershipAdapter).
   * SIEMPRE TRUE en Fase 2 para que repositorio independiente pueda conectarse.
   */
  ENABLE_MEMBERSHIP_ADAPTER: true,

  // ==============================================================================
  // MÉTODOS DE UTILIDAD
  // ==============================================================================

  /**
   * Devuelve si la promoción de VIP antigua debe mostrarse en UI.
   * Respeta que usuarios existentes con vip=true pueden ver su estado.
   */
  shouldShowLegacyVipPromotion: function() {
    return this.SHOW_LEGACY_VIP_PROMOTION === true;
  },

  /**
   * Devuelve si se debe aplicar descuento basado en vip=true histórico.
   * Esto es lectura segura (nunca modifica datos).
   */
  shouldApplyLegacyVipDiscount: function() {
    return this.APPLY_LEGACY_VIP_DISCOUNT === true;
  },

  /**
   * Devuelve si el adaptador de membresía está disponible para módulos externos.
   */
  isAdapterEnabled: function() {
    return this.ENABLE_MEMBERSHIP_ADAPTER === true;
  },

  /**
   * Retorna un objeto resumen de estado para logging/auditoría.
   */
  getStatus: function() {
    return {
      legacyVipPromotionEnabled: this.SHOW_LEGACY_VIP_PROMOTION,
      legacyVipDiscountEnabled: this.APPLY_LEGACY_VIP_DISCOUNT,
      adapterEnabled: this.ENABLE_MEMBERSHIP_ADAPTER,
      timestamp: new Date().toISOString(),
      phase: 'PHASE_2_ISOLATION'
    };
  }
};

console.log('✓ Feature Flags de Membresía cargados:', window.PDFeatureFlags.getStatus());
