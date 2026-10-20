# FASE 3: REGLAS COMERCIALES OFICIALES
## Documento de Especificación Lógica y Financiera

**Fecha:** Octubre 7, 2026  
**Proyecto:** P&S Punto Dulce (Panadería Artesanal - Cúcuta)  
**Fase:** 3 de 7 (Definición de Reglas Comerciales)  
**Estado:** 📋 ESPECIFICACIÓN OFICIAL (100% documentación, CERO cambios en Firebase)

---

## 📌 PREFACIO IMPORTANTE

Este documento define **EXACTAMENTE** qué recibe cada cliente, sin ambigüedades financieras. 

**LO QUE NO HACEMOS EN FASE 3:**
- ❌ NO modificamos `firestore.rules`
- ❌ NO modificamos colecciones de producción
- ❌ NO escribimos código en repositorio
- ❌ NO ejecutamos transacciones

**LO QUE SÍ HACEMOS:**
- ✅ Definir clasificación de estados de usuario con precisión
- ✅ Crear matriz parametrizable de planes (Plus, Pro, Ultra)
- ✅ Documentar reglas de combinación de descuentos (protección de margen)
- ✅ Documentar reglas exactas de acumulación y canje de puntos
- ✅ Establecer fórmulas que se usarán en Fase 4 (Panel Administrativo)

---

## 🎯 PARTE A: CLASIFICACIÓN DE ESTADOS DE USUARIO

### Definición de los 4 Estados Posibles

Todo usuario en P&S Punto Dulce entra en EXACTAMENTE UNO de estos 4 estados:

#### **ESTADO 1: Cliente Normal**

**Definición:**
- Usuario autenticado en Firebase
- NO tiene campo `tier` en documento `usuarios/{email}` O `tier = null`
- NO tiene field `vip = true` O `vip = false` (sin membresía paga activa)
- Field `tier_expires_at` no existe o es null

**Beneficios:**
- ✅ Acceso 100% al Club de Puntos (acumula 1.0x puntos por cada compra)
- ✅ Canjea recompensas del Club de Puntos sin restricción
- ✅ Sin descuento automático en carrito (0%)
- ✅ Sin multiplicador de puntos (1.0x)
- ✅ Datos: `points` / `puntos` acumulado sin límite

**Transición:**
- Compra plan Plus/Pro/Ultra → Cambia a estado MIEMBRO ACTIVO
- Nunca degrada (excepto si es MIEMBRO VENCIDO que expira)

---

#### **ESTADO 2: Miembro VIP Heredado**

Este estado tiene DOS subcondiciones:

##### **SUBSTATE 2A: VIP Heredado ACTIVO (Vigente)**

**Definición:**
- Usuario tiene `vip = true` en documento `usuarios/{email}`
- Field `vipExpiresAt` existe y es fecha FUTURA (todavía no vencido)
- NO tiene field `tier` (es sistema antiguo, FASE 1)

**Beneficios:**
- ✅ Descuento automático: **6%** en TODAS las compras
- ✅ Acceso 100% al Club de Puntos (1.0x puntos)
- ✅ Multiplicador de puntos: 1.0x (sin bonificación extra)
- ✅ Sin domicilio gratis (sistema heredado)
- ✅ Costo: **$20.000 COP / mes** (30 días continuos)

**Vigencia:**
- Compra el 7 de octubre → Vigente hasta 6 de noviembre 23:59:59
- Al día siguiente (7 noviembre): AUTOMÁTICAMENTE VENCIDO (ver SUBSTATE 2B)

**Transición:**
- Expira en `vipExpiresAt` → Cambia a MIEMBRO VIP HEREDADO VENCIDO (SUBSTATE 2B)
- Puede comprar plan Plus/Pro/Ultra → Cambia a MIEMBRO ACTIVO (Plus/Pro/Ultra)

##### **SUBSTATE 2B: VIP Heredado VENCIDO (Expirado)**

**Definición:**
- Usuario tiene `vip = true` en documento `usuarios/{email}`
- Field `vipExpiresAt` existe pero es fecha PASADA
- Timestamp actual > vipExpiresAt

**Beneficios:**
- ❌ Sin descuento automático (0%)
- ✅ Acceso 100% al Club de Puntos (1.0x puntos)
- ✅ Sin multiplicador extra
- ✅ Cero beneficios de membresía

**Acción Recomendada (Manual en Admin, Automática en Fase 4):**
- Cambiar a `vip = false` para limpiar estado
- Pasar a estado CLIENTE NORMAL
- Notificar al usuario por WhatsApp: "Tu membresía VIP expiró. ¡Activa Plus para mantener tus beneficios!"

**Transición:**
- Puede comprar plan Plus/Pro/Ultra → Cambia a MIEMBRO ACTIVO
- Si no compra → Permanece como CLIENTE NORMAL (sin beneficios)

---

#### **ESTADO 3: Miembro Activo (Plus, Pro, Ultra)**

**Definición:**
- Usuario tiene field `tier` con valor: `'plus'`, `'pro'` o `'ultra'` (exactamente)
- Field `tier_expires_at` existe y es fecha FUTURA (todavía vigente)
- Puede tener `vip = true` (sistema heredado, ignorar si tiene `tier`)

**Beneficios:**
- ✅ Descuento automático en carrito: según tier (ver matriz abajo)
- ✅ Acceso 100% al Club de Puntos con multiplicador según tier
- ✅ Domicilio gratis (si subtotal ≥ mínimo configurado)
- ✅ Prioridad en preparación
- ✅ Costo: según tier ($15k, $25k, $40k / mes o período)

**Vigencia:**
- Compra el 7 de octubre → Vigente hasta `tier_expires_at` (calculado automáticamente)
- Un día antes de expiración → Notificación al usuario
- Al momento de `tier_expires_at`: AUTOMÁTICAMENTE VENCIDO (ver ESTADO 4)

**Transición:**
- Upgrade: Plus → Pro, Plus → Ultra, Pro → Ultra
  - Calcula diferencia de precio (prorrateo)
  - Extiende nuevo `tier_expires_at`
- Downgrade: Pro → Plus, Ultra → Plus, Ultra → Pro
  - Reembolsa diferencia (si aplica)
  - Cambia `tier` y actualiza `tier_expires_at`
- Cancela antes de vencer → Reembolso según política
- Expira naturalmente → Cambia a ESTADO 4 (MIEMBRO VENCIDO)

---

#### **ESTADO 4: Miembro Vencido (Degradación Automática)**

**Definición:**
- Usuario tiene field `tier` con valor: `'plus'`, `'pro'` o `'ultra'`
- Field `tier_expires_at` existe pero es fecha PASADA
- Timestamp actual > tier_expires_at

**Beneficios:**
- ❌ Sin descuento automático (0%)
- ✅ Acceso 100% al Club de Puntos (sin multiplicador, 1.0x)
- ❌ Sin domicilio gratis
- ❌ Sin prioridad
- ✅ **PUNTOS NO SE PIERDEN** — Se preservan intactos en field `points`

**Acción Automática (Implementada en Fase 4):**
- Cambiar `tier = null` (o marcar como `'expired'`)
- Mantener histórico en array `tier_history` (auditoría)
- Notificar por WhatsApp: "Tu membresía Plus/Pro/Ultra expiró. ¡Renueva y sigue disfrutando beneficios!"

**Transición:**
- Puede renovar el mismo tier → Extiende `tier_expires_at`
- Puede cambiar a tier diferente → Actualiza `tier` y `tier_expires_at`
- Si no renueva → Permanece como CLIENTE NORMAL (sin beneficios)

---

### Tabla Resumen de Estados

| Estado | Descuento | Puntos x | Domicilio | Costo/mes | Vigencia |
|--------|-----------|----------|-----------|-----------|----------|
| **Cliente Normal** | 0% | 1.0x | $5.000 | $0 | ∞ |
| **VIP Heredado ACTIVO** | 6% | 1.0x | $5.000 | $20.000 | 30 días |
| **VIP Heredado VENCIDO** | 0% | 1.0x | $5.000 | $0 | ∞ |
| **Miembro Plus ACTIVO** | 12% | 1.1x | Gratis* | $15.000 | Configurable |
| **Miembro Pro ACTIVO** | 18% | 1.25x | Gratis* | $25.000 | Configurable |
| **Miembro Ultra ACTIVO** | 25% | 1.5x | Gratis* | $40.000 | Configurable |
| **Miembro VENCIDO** | 0% | 1.0x | $5.000 | $0 | ∞ |

*Gratis si subtotal ≥ mínimo configurado (propuesta: $30.000 COP)

---

## 📊 PARTE B: MATRIZ PARAMETRIZABLE DE PLANES

### Plan Base (VALORES RECOMENDADOS - Configurables)

Todos estos parámetros serán editables desde panel administrativo independiente en Fase 4.

#### **PLAN PLUS**

```
IDENTIFICADOR: 'plus'

Parámetros Básicos:
├─ Precio mensual: $15.000 COP (configurable)
├─ Duración base: 30 días calendario (configurable)
├─ Descripción: "Beneficios Dulces Accesibles"
└─ Color en UI: #FF6B9D (rosa mediano)

Beneficios Financieros:
├─ Descuento en carrito: 8% (configurable) [AJUSTADO: márgenes saludables]
├─ Multiplicador de puntos: 1.15x (15% extra) [AJUSTADO]
├─ Pedido mínimo para domicilio gratis: $35.000 COP (configurable)
├─ Máximo domicilios gratis/mes: sin límite (configurable) [PROTECCIÓN]
├─ Máx. descuento por pedido: sin límite (aplica 8% a subtotal)
└─ Válido en: Todas las categorías de productos

Beneficios Adicionales:
├─ Prioridad en preparación (turno +1 posición)
├─ Notificaciones de nuevas ofertas 2 horas antes
└─ Acceso a promociones exclusivas

Restricciones:
├─ No acumulable con otras membresías (Plus = Un Tier)
├─ No transferible entre usuarios
└─ Cancelación: reembolso proporcional al tiempo restante
```

**Matriz de Configuración Plus:**
```json
{
  "tier": "plus",
  "price_cop": 15000,
  "duration_days": 30,
  "discount_percent": 8,
  "points_multiplier": 1.15,
  "free_delivery_min_subtotal": 35000,
  "max_free_deliveries_per_month": null,
  "priority_level": 1,
  "benefits": [
    "8% descuento automático",
    "15% más puntos",
    "Domicilio gratis (>$35k)",
    "Prioridad en cocina"
  ],
  "renewal_policy": "auto_on_expiry",
  "auto_renewal_enabled": false,
  "cancellation_refund_percent": 85
}
```

---

#### **PLAN PRO**

```
IDENTIFICADOR: 'pro'

Parámetros Básicos:
├─ Precio mensual: $25.000 COP (configurable)
├─ Duración base: 30 días calendario (configurable)
├─ Descripción: "Beneficios Dulces Premium"
└─ Color en UI: #D81B60 (fucsia/magenta)

Beneficios Financieros:
├─ Descuento en carrito: 12% (configurable) [AJUSTADO: márgenes saludables]
├─ Multiplicador de puntos: 1.25x (25% extra)
├─ Pedido mínimo para domicilio gratis: $28.000 COP (configurable)
├─ Máximo domicilios gratis/mes: sin límite (configurable) [PROTECCIÓN]
├─ Máx. descuento por pedido: sin límite (aplica 12% a subtotal)
└─ Válido en: Todas las categorías de productos

Beneficios Adicionales:
├─ Prioridad en preparación (turno +2 posiciones)
├─ Notificaciones de nuevas ofertas 4 horas antes
├─ Acceso a promociones exclusivas PLUS
├─ Cumpleaños especial: +50 puntos extra bonus
└─ Sorpresa artesanal en renovación (cortesía casa)

Restricciones:
├─ No acumulable con otras membresías
├─ No transferible entre usuarios
└─ Cancelación: reembolso proporcional
```

**Matriz de Configuración Pro:**
```json
{
  "tier": "pro",
  "price_cop": 25000,
  "duration_days": 30,
  "discount_percent": 12,
  "points_multiplier": 1.25,
  "free_delivery_min_subtotal": 28000,
  "max_free_deliveries_per_month": null,
  "priority_level": 2,
  "birthday_bonus_points": 50,
  "benefits": [
    "12% descuento automático",
    "25% más puntos",
    "Domicilio gratis (>$28k)",
    "Prioridad máxima en cocina",
    "Bonus cumpleaños +50 pts"
  ],
  "renewal_policy": "auto_on_expiry",
  "auto_renewal_enabled": false,
  "cancellation_refund_percent": 85
}
```

---

#### **PLAN ULTRA**

```
IDENTIFICADOR: 'ultra'

Parámetros Básicos:
├─ Precio mensual: $38.000 COP (configurable) [AJUSTADO: rentabilidad real]
├─ Duración base: 30 días calendario (configurable)
├─ Descripción: "Beneficios Dulces Exclusivos"
└─ Color en UI: #FFD700 (dorado)

Beneficios Financieros:
├─ Descuento en carrito: 15% (configurable) [AJUSTADO: márgenes saludables]
├─ Multiplicador de puntos: 1.5x (50% extra)
├─ Pedido mínimo para domicilio gratis: $20.000 COP (configurable)
├─ Máximo domicilios gratis/mes: sin límite (configurable) [PROTECCIÓN]
├─ Máx. descuento por pedido: sin límite (aplica 15% a subtotal)
└─ Válido en: Todas las categorías de productos

Beneficios Adicionales:
├─ Prioridad absoluta en preparación (siempre primero)
├─ Notificaciones de nuevas ofertas 12 horas antes
├─ Acceso a TODAS las promociones (Plus, Pro, Ultra)
├─ Cumpleaños especial: +100 puntos extra bonus
├─ Sorpresa artesanal mensual en renovación
├─ Acceso a pedidos personalizados (consultar con chef)
├─ Reuniones trimestrales de feedback (grupo cerrado)
└─ Envío prioritario: máximo 45 minutos

Restricciones:
├─ No acumulable con otras membresías
├─ No transferible entre usuarios
└─ Cancelación: reembolso proporcional
```

**Matriz de Configuración Ultra:**
```json
{
  "tier": "ultra",
  "price_cop": 38000,
  "duration_days": 30,
  "discount_percent": 15,
  "points_multiplier": 1.5,
  "free_delivery_min_subtotal": 20000,
  "max_free_deliveries_per_month": null,
  "free_delivery_always": false,
  "priority_level": 3,
  "delivery_max_minutes": 45,
  "birthday_bonus_points": 100,
  "monthly_gift": "artesanal_sorpresa",
  "benefits": [
    "15% descuento automático",
    "50% más puntos",
    "Domicilio gratis (>$20k)",
    "Prioridad absoluta en cocina",
    "Máximo 45 min de entrega",
    "Bonus cumpleaños +100 pts",
    "Regalo mensual artesanal"
  ],
  "renewal_policy": "auto_on_expiry",
  "auto_renewal_enabled": false,
  "cancellation_refund_percent": 90
}
```

---

### Tabla Comparativa de Planes

| Parámetro | Plus | Pro | Ultra |
|-----------|------|-----|-------|
| **Precio/mes** | $15.000 | $25.000 | $38.000 |
| **Duración base** | 30 días | 30 días | 30 días |
| **Descuento** | 8% | 12% | 15% |
| **Puntos x** | 1.15x | 1.25x | 1.5x |
| **Domicilio gratis** | Si >$35k | Si >$28k | Si >$20k |
| **Prioridad cocina** | +1 pos | +2 pos | Primero |
| **Bonus cumpleaños** | — | +50 pts | +100 pts |
| **Regalo mes** | — | — | Sorpresa |
| **Reembolso cancel.** | 85% | 85% | 90% |

---

## 💰 PARTE C: REGLAS DE COMBINACIÓN DE DESCUENTOS Y PROTECCIÓN DE MARGEN

### Principio Fundamental

**REGLA DE ORO:** No sumar descuentos sobre descuentos en el MISMO ÍTEM. La panadería nunca vende a pérdida.

### Escenarios de Descuentos

#### **Escenario 1: Producto SIN oferta + Usuario CON membresía (Plus/Pro/Ultra)**

```
Ejemplo:
- Producto: Croissant artesanal, precio regular $8.000 COP
- Usuario: Miembro Pro (descuento 18%)
- Carrito: 1x Croissant

Cálculo:
├─ Subtotal del ítem: $8.000
├─ Descuento Pro (18%): $8.000 × 0.18 = $1.440
├─ PRECIO FINAL: $8.000 - $1.440 = $6.560
└─ Margen panadería: Conservado según matriz de márgenes

FÓRMULA EXACTA:
precio_final_item = precio_regular × (1 - tier_discount_percent / 100)
```

---

#### **Escenario 2: Producto EN oferta + Usuario CON membresía**

```
Ejemplo:
- Producto: Torta "Chocolate Deluxe"
  - Precio regular: $50.000 COP
  - OFERTA ACTIVA: -15% (precio descuento: $42.500)
  - Costo de producción: $28.000 (margen mín: 40%)
- Usuario: Miembro Plus (descuento 12%)
- Carrito: 1x Torta

PROBLEMA: ¿Qué descuento aplicar?
- Si aplicamos AMBOS: $50.000 × (1 - 0.15) × (1 - 0.12) = $37.300
  → Margen = ($37.300 - $28.000) / $37.300 = 24.9% (BAJO, risky)
  
SOLUCIÓN: APLICAR EL MAYOR
- Descuento de Oferta: 15%
- Descuento de Membresía: 12%
- DESCUENTO APLICADO: MAX(15%, 12%) = 15%
- Precio final: $50.000 × (1 - 0.15) = $42.500
- Margen = ($42.500 - $28.000) / $42.500 = 34.1% (SEGURO)

FÓRMULA EXACTA:
precio_final_item = precio_regular × (1 - MAX(oferta_descuento%, tier_descuento%) / 100)

PROTECCIÓN: Si el máximo descuento > umbral configurado (ej. 35%):
├─ Sistema ALERTA: "Margen bajo en este producto"
└─ Admin puede rechazar la combinación en Fase 4
```

---

#### **Escenario 3: Usuario CANJEA recompensa del Club de Puntos**

```
Ejemplo:
- Carrito: 1x Donas ($3.000), 1x Café ($2.500) = Subtotal $5.500
- Usuario: Miembro Pro, intenta canjear "Donas Gratis" (-$3.000)
- Estado de Puntos: 250 puntos (recompensa cuesta 200 puntos)

PROBLEMA: ¿Cómo se combina canje + descuento de membresía?

SOLUCIÓN: CANJE PRIMERO, descuento DESPUÉS
1. Aplicar canje: $5.500 - $3.000 = $2.500 (después de canje)
2. Aplicar descuento Pro (18%): $2.500 × 0.18 = $450
3. Descuento aplicado: $450
4. Total final: $2.500 - $450 = $2.050

FÓRMULA EXACTA (orden importa):
a) subtotal_after_redeem = subtotal - reward_value
b) discount_amount = subtotal_after_redeem × (tier_discount_percent / 100)
c) total_final = subtotal_after_redeem - discount_amount

PROTECCIÓN:
├─ Si tier_discount_percent + reward_total_percent > 40%: ALERT
├─ No permitir si margen < 20%
└─ Admin revisa manualmente en casos límite
```

---

#### **Escenario 4: Domicilio (Variable según Tier)**

```
REGLA DE DOMICILIO:
├─ Cliente Normal: Siempre $5.000 (excepto si subtotal > $100.000 → GRATIS gerencial)
├─ VIP Heredado ACTIVO: Siempre $5.000
├─ Plus ACTIVO: GRATIS si subtotal ≥ $30.000, si no $5.000
├─ Pro ACTIVO: GRATIS si subtotal ≥ $25.000, si no $5.000
├─ Ultra ACTIVO: SIEMPRE GRATIS (sin condición)
└─ VENCIDO: Vuelve a $5.000

EJEMPLO:
- Usuario: Miembro Pro
- Carrito: 2x Torta ($45.000) = Subtotal DESPUÉS de descuentos
- Domicilio: ¿$5.000 o gratis?
  → Subtotal $45.000 ≥ $25.000 → GRATIS

CÁLCULO TOTAL EXACTO:
total = subtotal - descuento + domicilio
      = $45.000 - ($45.000 × 0.18) + $0
      = $45.000 - $8.100 + $0
      = $36.900

NOTA: El domicilio se calcula DESPUÉS de descuentos, usando subtotal bruto.
```

---

### Fórmula General de Carrito

```
═══════════════════════════════════════════════════════════════════════════
FÓRMULA EXACTA DE CÁLCULO DE TOTAL EN CARRITO (JavaScript)
═══════════════════════════════════════════════════════════════════════════

// Entrada:
const cartItems = [
  { price: 8000, quantity: 2, offerDiscount: 0 },    // 2x Croissant, sin oferta
  { price: 50000, quantity: 1, offerDiscount: 15 },  // 1x Torta, oferta 15%
  // ... más items
];
const userTier = 'pro';                             // 'plus' | 'pro' | 'ultra' | null
const userRedeemValue = 0;                          // Si canjeó puntos: valor $
const tierDiscounts = { plus: 12, pro: 18, ultra: 25 };

// Paso 1: Calcular subtotal respetando máximo descuento por ítem
let subtotal = 0;
cartItems.forEach(item => {
  const itemPrice = item.price * item.quantity;
  const maxDiscount = Math.max(item.offerDiscount || 0, tierDiscounts[userTier] || 0);
  const discountAmount = itemPrice * (maxDiscount / 100);
  const itemFinal = itemPrice - discountAmount;
  subtotal += itemFinal;
});

// Paso 2: Aplicar canje de recompensa (si existe)
const subtotalAfterRedeem = subtotal - userRedeemValue;

// Paso 3: Aplicar descuento de membresía (SOLO si no había oferta mayor)
// Nota: Ya aplicado en paso 1, así que acá solo sumamos si es adicional
const membershipDiscount = 0;  // Ya incluido en step 1

// Paso 4: Calcular domicilio según tier
let deliveryCost = 5000;  // Default
const freeDeliveryThresholds = { plus: 30000, pro: 25000, ultra: 0 };
if (userTier && freeDeliveryThresholds[userTier] !== undefined) {
  if (freeDeliveryThresholds[userTier] === 0 || subtotalAfterRedeem >= freeDeliveryThresholds[userTier]) {
    deliveryCost = 0;
  }
}

// Paso 5: Total final
const total = subtotalAfterRedeem + deliveryCost;

// Salida:
console.log({
  subtotal_bruto: cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
  descuentos_aplicados: cartItems.reduce((sum, i) => {
    const maxDisc = Math.max(i.offerDiscount || 0, tierDiscounts[userTier] || 0);
    return sum + (i.price * i.quantity * maxDisc / 100);
  }, 0),
  subtotal_con_descuentos: subtotal,
  canje_puntos: userRedeemValue,
  subtotal_post_canje: subtotalAfterRedeem,
  domicilio: deliveryCost,
  total_a_pagar: total
});

═══════════════════════════════════════════════════════════════════════════
```

### Validación de Margen Mínimo

```
FUNCIÓN DE VALIDACIÓN (Pre-Checkout):

function validateProfitMargin(cart, userTier) {
  const MIN_MARGIN_PERCENT = 20;  // Panadería nunca vende con margen < 20%
  const ITEM_COSTS = {
    // Costo de producción de cada producto
    'croissant': 2000,
    'donas': 800,
    'torta_chocolate': 28000,
    'pan_integral': 1500,
    // ... más items
  };

  for (const item of cart) {
    const itemProfit = item.priceFinal - ITEM_COSTS[item.productId];
    const marginPercent = (itemProfit / item.priceFinal) * 100;
    
    if (marginPercent < MIN_MARGIN_PERCENT) {
      return {
        valid: false,
        reason: `Margen insuficiente en ${item.name}: ${marginPercent.toFixed(1)}%`,
        item: item.productId,
        recommendedPrice: ITEM_COSTS[item.productId] / (1 - MIN_MARGIN_PERCENT / 100)
      };
    }
  }
  
  return { valid: true, reason: 'Margen validado para todos los items' };
}

// Uso:
const validation = validateProfitMargin(cart, 'pro');
if (!validation.valid) {
  console.warn('⚠️ ALERTA DE MARGEN:', validation.reason);
  // Admin puede RECHAZAR la venta o ajustar precio
}
```

---

## 🎯 PARTE D: REGLAS DE ACUMULACIÓN, CONSULTA Y CANJE DEL CLUB DE PUNTOS

### Principio Fundamental

**GARANTÍA CENTRAL:** Todo punto acumulado en Club de Puntos es PERMANENTE. Nunca se pierde, ni siquiera si membresía vence.

### Unificación de Lectura: `points` vs `puntos`

#### **Problema de Sincronización**

En el código actual existen DOS campos para puntos:
- `points` (inglés, usado en script.js)
- `puntos` (español, usado en admin-core.js)

**SOLUCIÓN DEFINITIVA (Fase 4 implementará):**

```
Definición Oficial: CAMPO CANÓNICO = 'points'

En Firestore, todos los documentos usuarios/{email} deben tener:
├─ Field PRIMARIO: "points" (número, >= 0)
├─ Field SECUNDARIO: "puntos" (espejo de "points", por compatibilidad)
└─ Sincronización: Siempre points === puntos (bidireccional)

Lectura en script.js:
const userPoints = user.points ?? user.puntos ?? 0;

Escritura en script.js:
await db.collection('usuarios').doc(email).update({
  points: newValue,
  puntos: newValue  // Espejo automático
});

Lectura en admin-core.js:
const userPoints = user.points ?? user.puntos ?? 0;

Validación en Firebase Rules (Fase 4):
rule: if set('points', 'puntos') then (points === puntos)
```

---

### Acumulación de Puntos: Fórmula Exacta

#### **Base de Acumulación**

```
FÓRMULA: puntos_ganados = (precioFinal / 1000) × multiplicador × bonusReferral

Donde:
├─ precioFinal = Precio del producto DESPUÉS de todos los descuentos
├─ multiplicador = Según tier (1.0x = normal, 1.1x = Plus, 1.25x = Pro, 1.5x = Ultra)
├─ bonusReferral = 1.0 por defecto, 1.25 si fue referido por cliente existente
└─ Resultado se REDONDEA hacia abajo (floor)

EJEMPLOS:

Ejemplo 1: Cliente Normal compra Croissant $8.000
├─ Precio final: $8.000
├─ Puntos base: ($8.000 / 1.000) × 1.0 = 8.0 puntos
├─ Multiplicador: 1.0x (cliente normal)
├─ Total acumulado: 8 puntos
└─ Se suma a points: points += 8

Ejemplo 2: Miembro Pro compra Torta $42.500 (con descuento)
├─ Precio final post-descuento: $42.500
├─ Puntos base: ($42.500 / 1.000) × 1.25 = 53.125 puntos
├─ Multiplicador: 1.25x (Pro)
├─ Total acumulado: 53 puntos (redondeado hacia abajo)
└─ Se suma a points: points += 53

Ejemplo 3: Miembro Ultra compra $100.000, referido por cliente
├─ Precio final: $100.000
├─ Puntos base: ($100.000 / 1.000) × 1.5 = 150 puntos
├─ Multiplicador: 1.5x (Ultra)
├─ Bonus referral: 1.25x (referido por existente)
├─ Total: floor(150 × 1.25) = 187 puntos
└─ Se suma a points: points += 187
```

#### **Momento de Acumulación**

```
EVENTO: En el momento EXACTO cuando pedido cambia a estado 'Entregado'

Trigger:
├─ Estado anterior: 'En Camino'
├─ Estado nuevo: 'Entregado'
└─ Acción: Sumar puntos a usuario

Código (Fase 4 implementará en Firestore):
on update pedidos/{pedidoId} {
  if (resource.data.estado == 'En Camino' && request.resource.data.estado == 'Entregado') {
    // Calcular y sumar puntos
    let usuario = get(/databases/$(database)/documents/usuarios/$(resource.data.email));
    let pointsGained = floor((resource.data.totalFinal / 1000) * usuario.data.get('pointsMultiplier', 1.0));
    
    let updateUser = {
      points: usuario.data.points + pointsGained,
      puntos: usuario.data.points + pointsGained,
      lastPointsEarned: now,
      pointsHistory: arrayUnion({
        timestamp: now,
        source: 'order_delivery',
        orderId: pedidoId,
        pointsGained: pointsGained
      })
    };
    
    update /databases/$(database)/documents/usuarios/$(resource.data.email), updateUser;
  }
}
```

---

### Prevención de Acreditaciones Duplicadas

#### **Garantía de Idempotencia**

```
PROBLEMA: ¿Qué pasa si servidor falla a mitad de actualizar?
- Usuario recibe puntos dos veces?
- Usuario no recibe puntos?

SOLUCIÓN: Campo de Reconciliación

En documento pedidos/{pedidoId}:
├─ points_credited: false (inicial)
├─ points_credited_at: null (inicial)
└─ points_credited_amount: 0 (inicial)

Proceso de Acreditación (TRANSACCIÓN ATÓMICA):
1. Leer pedido: if (points_credited === false)
2. Calcular puntos: pointsGained = ...
3. Actualizar usuario (transacción):
   a) usuarios/{email}.points += pointsGained
   b) usuarios/{email}.puntos += pointsGained
   c) usuarios/{email}.pointsHistory.push(...)
   d) pedidos/{pedidoId}.points_credited = true
   e) pedidos/{pedidoId}.points_credited_at = now
   f) pedidos/{pedidoId}.points_credited_amount = pointsGained
4. Si falla en 3d-3f: Rollback de 3a-3c (transacción atómica)
5. Si reintentar: Detecta points_credited=true, no acredita nuevamente

QUERY PARA AUDITORÍA (verificar duplicados):
SELECT email, COUNT(*) as duplicates
FROM usuarios
WHERE pointsHistory contains (orderId = 'XXX' AND source = 'order_delivery')
GROUP BY email
HAVING COUNT(*) > 1

Si hay duplicados: Admin puede hacer ajuste manual en Fase 4
```

---

### Canje de Recompensas (Sin Perder Puntos)

#### **Modelo de Canje**

```
IMPORTANTE: Canjear NO elimina puntos, solo "bloquea" temporalmente

FLUJO:

Estado 1: Usuario con 500 puntos
├─ Recompensa deseada: "Donas Gratis" (cuesta 200 puntos)
└─ Status: DISPONIBLE

Estado 2: Usuario hace clic en "Canjear"
├─ Sistema crea documento en solicitudes_puntos/{pedidoId}:
│  {
│    userEmail: user@email.com,
│    rewardId: 'donas_gratis',
│    pointsCost: 200,
│    estado: 'Pendiente',
│    timestamp: now,
│    appliedAtCheckout: false
│  }
├─ points en usuario: 500 (SIN CAMBIOS aún)
└─ Status: PENDIENTE APROBACIÓN

Estado 3: Usuario agrega items y llega a checkout
├─ Sistema BUSCA solicitud pendiente del usuario
├─ Aplica canje: subtotal -= $X (valor de recompensa)
├─ No resta de points aún
└─ Status: EN CARRITO

Estado 4: Pedido confirmado (estado 'Pendiente')
├─ Sistema valida que solicitud existe y está pendiente
├─ Si válida, actualiza SOLO cuando pedido se entrega
└─ Status: PEDIDO CREADO

Estado 5: Pedido entregado (estado 'Entregado')
├─ Sistema AHORA sí resta puntos:
│  usuarios/{email}.points -= 200
│  usuarios/{email}.puntos -= 200
├─ Actualiza solicitud:
│  solicitudes_puntos/{pedidoId}.estado = 'Canjeado'
│  solicitudes_puntos/{pedidoId}.appliedAtCheckout = true
└─ Status: CANJEADO (puntos restados permanentemente)

Estado 6: Futuro
├─ Si usuario quiere canjear nuevamente: puntos restantes = 300
└─ Puede acumular nuevamente: cada compra suma + multiplicador
```

#### **Protección: No Permitir Sobrecanjes**

```
VALIDACIÓN EN CHECKOUT:

function validateRedeem(user, rewardId) {
  // Buscar solicitud pendiente
  const solicitud = db.collection('solicitudes_puntos')
    .where('userEmail', '==', user.email)
    .where('estado', '==', 'Pendiente')
    .where('rewardId', '==', rewardId)
    .get();
  
  if (!solicitud.exists || solicitud.empty) {
    return { valid: false, reason: 'No hay canje pendiente válido' };
  }
  
  const pointsCost = solicitud.data().pointsCost;
  
  // Verificar que usuario aún tiene puntos suficientes
  // (En caso de que haya gastado puntos en otro canje)
  if (user.points < pointsCost) {
    return { 
      valid: false, 
      reason: `Puntos insuficientes. Tienes ${user.points}, necesitas ${pointsCost}` 
    };
  }
  
  return { valid: true, reason: 'Canje válido' };
}

// Uso en carrito:
const validation = validateRedeem(currentUser, rewardId);
if (!validation.valid) {
  showToast(`⚠️ ${validation.reason}`, 'error');
  return;  // No permitir checkout
}
```

---

### Cambios de Plan: Upgrade, Downgrade, Vencimiento

#### **Upgrade: Plus → Pro, Plus → Ultra, Pro → Ultra**

```
ESCENARIO: Usuario Miembro Plus ($15k/mes, vence 15 nov) → Pro ($25k/mes)

Acción: Compra upgrade el 7 de octubre

Cálculo:
├─ Días restantes Plus: 9 días (hasta 15 nov)
├─ Valor restante Plus: $15.000 × (9 / 30) = $4.500
├─ Valor nuevo Pro: $25.000 por 30 días
├─ Diferencia a pagar: $25.000 - $4.500 = $20.500
├─ Nueva fecha vencimiento: 6 de noviembre (30 días desde hoy)
└─ Actualización en Firebase:
   {
     tier: 'pro',
     tier_expires_at: '2026-11-06T23:59:59Z',
     tier_history: [..., {
       from: 'plus',
       to: 'pro',
       upgraded_at: now,
       amount_paid: 20500,
       new_expiry: '2026-11-06T23:59:59Z'
     }]
   }

PUNTOS: NO se pierden, se conservan intactos con nuevo multiplicador (1.25x)
```

#### **Downgrade: Pro → Plus, Ultra → Pro, Ultra → Plus**

```
ESCENARIO: Usuario Miembro Ultra ($40k/mes, vence 20 nov) → Plus ($15k/mes)

Acción: Downgradea el 10 de octubre

Cálculo:
├─ Días restantes Ultra: 41 días (hasta 20 nov)
├─ Valor restante Ultra: $40.000 × (41 / 30) = $54.666
├─ Valor nuevo Plus: $15.000 por 30 días
├─ DIFERENCIA A REEMBOLSAR: $54.666 - $15.000 = $39.666
├─ Nueva fecha vencimiento: 9 de noviembre (30 días desde hoy)
└─ Actualización en Firebase:
   {
     tier: 'plus',
     tier_expires_at: '2026-11-09T23:59:59Z',
     tier_history: [..., {
       from: 'ultra',
       to: 'plus',
       downgraded_at: now,
       refund_amount: 39666,
       refund_method: 'credito_billetera',  // O transferencia
       new_expiry: '2026-11-09T23:59:59Z'
     }]
   }

REEMBOLSO: Se acredita en "billetera virtual" del cliente en Firebase
           (campo: wallet_credit: 39666)
           Puede usarse en próxima compra o reembolso a cuenta

PUNTOS: Se conservan, pero multiplicador baja a 1.1x (Plus)
```

#### **Vencimiento Automático: Degradación Limpia**

```
ESCENARIO: Miembro Pro vence naturalmente el 15 de noviembre

Evento automático (Fase 4 implementará cron job):
├─ Trigger: tier_expires_at < now
├─ Acción:
   {
     tier: null,  // O 'expired' para auditoría
     tier_expires_at: null,
     discount_percent: 0,
     points_multiplier: 1.0,
     tier_history_append: {
       tier: 'pro',
       expired_at: now,
       reason: 'natural_expiration',
       final_points: user.points  // Congelados
     }
   }

PUNTOS: Quedan CONGELADOS en campo points. NO se pierden.
        Pueden seguir canjeándose como Cliente Normal.

NOTIFICACIÓN AL USUARIO:
├─ Email: "Tu membresía Pro expiró. ¡Renueva hoy y sigue disfrutando!"
├─ WhatsApp: "Hola ${nombre}, tu Pro vencerá mañana. Renueva antes de las 11pm"
└─ In-app: Banner rojo "Tu membresía expira en 1 día"

OPCIÓN DE RENOVACIÓN:
- Mismo tier (Pro 30 días más)
- Upgrade a Ultra
- Downgrade a Plus
- No renovar (pasa a Cliente Normal)
```

---

### Historial de Puntos: Auditoría Completa

```
ESTRUCTURA DE AUDITORÍA EN FIREBASE:

usuarios/{email}.pointsHistory = Array<{
  timestamp: ISO datetime,
  source: 'order_delivery' | 'referral_bonus' | 'campaign_bonus' | 'admin_adjustment' | 'reward_redeemed',
  orderId: string (si es order_delivery),
  rewardId: string (si es reward_redeemed),
  pointsGained: number (puede ser negativo si redeemed),
  newTotal: number (saldo después de esta operación),
  description: string (human readable),
  metadata: {
    tier: 'plus' | 'pro' | 'ultra' | null,
    multiplier: 1.0 | 1.1 | 1.25 | 1.5,
    operatedBy: 'system' | 'admin_email' (si admin lo hizo)
  }
}>

EJEMPLO:
pointsHistory: [
  {
    timestamp: '2026-09-15T14:30:00Z',
    source: 'order_delivery',
    orderId: 'ORD-001',
    pointsGained: 87,
    newTotal: 87,
    description: '87 puntos por pedido ORD-001 ($87k final)',
    metadata: {
      tier: 'pro',
      multiplier: 1.25,
      operatedBy: 'system'
    }
  },
  {
    timestamp: '2026-09-20T18:45:00Z',
    source: 'reward_redeemed',
    rewardId: 'DONNAS_GRATIS',
    pointsGained: -200,
    newTotal: -113,  // Saldo después de canje
    description: 'Canjeados 200 puntos por Donas Gratis',
    metadata: {
      tier: 'pro',
      multiplier: 1.25,
      operatedBy: 'system'
    }
  },
  // ... más eventos
]

VENTAJAS:
✅ Auditoría completa de movimientos
✅ Detectar duplicados o anomalías
✅ Reporte histórico para usuarios
✅ Reversal de transacciones (admin solo)
```

---

## ✅ VALIDACIONES DE COHERENCIA

### Matriz de Validación de Transiciones

```
┌─────────────────────┬──────────────┬──────────────┬──────────────┐
│ Estado Actual       │ Transición A │ Válida?      │ Notas        │
├─────────────────────┼──────────────┼──────────────┼──────────────┤
│ Normal              │ Plus         │ ✅ SÍ       │ Compra plan  │
│ Normal              │ VIP Heredado │ ✅ SÍ       │ Legacy       │
│ Normal              │ Normal       │ ✅ SÍ       │ Sin cambios  │
├─────────────────────┼──────────────┼──────────────┼──────────────┤
│ VIP Heredado ACTIVO │ Plus         │ ✅ SÍ       │ Upgrade      │
│ VIP Heredado ACTIVO │ Pro          │ ✅ SÍ       │ Upgrade      │
│ VIP Heredado ACTIVO │ Ultra        │ ✅ SÍ       │ Upgrade      │
│ VIP Heredado ACTIVO │ Normal       │ ❌ NO       │ Esperar cad. │
├─────────────────────┼──────────────┼──────────────┼──────────────┤
│ VIP Heredado VENCIDO│ Plus         │ ✅ SÍ       │ Renovar      │
│ VIP Heredado VENCIDO│ Pro          │ ✅ SÍ       │ Renovar      │
│ VIP Heredado VENCIDO│ Ultra        │ ✅ SÍ       │ Renovar      │
│ VIP Heredado VENCIDO│ Normal       │ ✅ SÍ       │ Sin renovar  │
├─────────────────────┼──────────────┼──────────────┼──────────────┤
│ Plus ACTIVO         │ Pro          │ ✅ SÍ       │ Upgrade      │
│ Plus ACTIVO         │ Ultra        │ ✅ SÍ       │ Upgrade      │
│ Plus ACTIVO         │ Plus         │ ✅ SÍ       │ Renovar (?)  │
│ Plus ACTIVO         │ Normal       │ ❌ NO       │ Esperar cad. │
├─────────────────────┼──────────────┼──────────────┼──────────────┤
│ Pro ACTIVO          │ Plus         │ ✅ SÍ       │ Downgrade    │
│ Pro ACTIVO          │ Ultra        │ ✅ SÍ       │ Upgrade      │
│ Pro ACTIVO          │ Pro          │ ✅ SÍ       │ Renovar (?)  │
│ Pro ACTIVO          │ Normal       │ ❌ NO       │ Esperar cad. │
├─────────────────────┼──────────────┼──────────────┼──────────────┤
│ Ultra ACTIVO        │ Plus         │ ✅ SÍ       │ Downgrade    │
│ Ultra ACTIVO        │ Pro          │ ✅ SÍ       │ Downgrade    │
│ Ultra ACTIVO        │ Ultra        │ ✅ SÍ       │ Renovar (?)  │
│ Ultra ACTIVO        │ Normal       │ ❌ NO       │ Esperar cad. │
├─────────────────────┼──────────────┼──────────────┼──────────────┤
│ Miembro VENCIDO     │ Cualquiera   │ ✅ SÍ       │ Renovación   │
│ Miembro VENCIDO     │ Normal       │ ✅ SÍ       │ Sin renovar  │
└─────────────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 🔐 PROTECCIONES IMPLEMENTADAS

### Protección 1: Margen Mínimo
- ✅ Validación antes de checkout
- ✅ Alerta si margen < 20%
- ✅ Admin puede rechazar venta

### Protección 2: Acreditación de Puntos
- ✅ Idempotencia por `pedidoId`
- ✅ Registro en `points_credited` field
- ✅ Auditoría completa en `pointsHistory`

### Protección 3: Sincronización de Campos
- ✅ `points === puntos` siempre (validación en Fase 4)
- ✅ Lectura defensiva: `points ?? puntos ?? 0`
- ✅ Escritura bidireccional

### Protección 4: Degradación Automática
- ✅ Cron job chequea vencimientos
- ✅ No pierde puntos al vencer
- ✅ Transición limpia a Cliente Normal

### Protección 5: Canje de Puntos
- ✅ No resta hasta que pedido se entrega
- ✅ Previene sobrecanjes con validación
- ✅ Auditoría de cada canje

---

## 📋 PRÓXIMOS PASOS (FASES 4-7)

### Fase 4: Panel Administrativo Independiente
- Implementar matriz de planes editable
- Crear gestión de cambios de estado
- Implementar validaciones de margen

### Fase 5: Integración de Checkout
- Aplicar fórmulas de descuento
- Validar margin en tiempo real
- Crear UI de confirmación

### Fase 6: Renovaciones y Canjes
- Cron jobs de vencimiento
- Notificaciones automáticas
- Dashboard de renovación

### Fase 7: Analytics y Reportes
- Reportes de ingresos por tier
- Análisis de churn
- Proyecciones de retención

---

## ✅ RESUMEN EJECUTIVO

**FASE 3 COMPLETADA: Especificación Oficial de Reglas Comerciales**

✅ Clasificación de 4 estados de usuario (Normal, VIP Heredado, Plus/Pro/Ultra, Vencido)  
✅ Matriz parametrizable de 3 planes (Plus $15k, Pro $25k, Ultra $40k)  
✅ Reglas exactas de combinación de descuentos (protección de margen 20% mín)  
✅ Fórmulas de acumulación y canje de puntos (con auditoría completa)  
✅ Transiciones de estado documentadas (upgrade, downgrade, vencimiento)  
✅ Validaciones de coherencia y protecciones implementables

**DOCUMENTO LISTO PARA FASE 4: Construcción del Panel Administrativo**

---

*Generado: 2026-10-07*  
*Fase: 3/7 — Especificación Oficial*  
*Estado: 100% Documentación, CERO cambios en Firebase*


---

## 🔒 APÉNDICE: PROTECCIONES DE DOMICILIO (AJUSTE COMERCIAL OBLIGATORIO FASE 4)

### Nueva Configuración para Panel Admin (Editable)

Cada plan DEBE tener en el panel administrativo estos parámetros configurables:

```json
{
  "free_delivery_config": {
    "pedidoMinimoDomicilioGratis": 35000,  // Plus: $35k, Pro: $28k, Ultra: $20k
    "maxDomiciliosGratisMes": null,         // null = sin límite, número = límite
    "maxDomiciliosGratisMesResetDay": 1     // Día del mes para resetear contador
  }
}
```

### Escenarios Protegidos

**Escenario 1: Usuario Plus compra bajo mínimo**
```
Compra: Pan $2.000
Subtotal: $2.000
Plan mínimo: $35.000
Domicilio: $5.000 (se cobra completo, no es gratis)
Total: $2.000 + $5.000 = $7.000 ✅ Margen protegido
```

**Escenario 2: Usuario Ultra con límite mensual**
```
Config: max 10 domicilios gratis/mes
Compras 1-10: Domicilio gratis (si compra > $20k)
Compra 11: Domicilio $5.000 (límite alcanzado)
Mes siguiente (1 oct): Contador se resetea, 10 gratis nuevos
```

**Escenario 3: Usuario Pro compra exactamente el mínimo**
```
Compra: Torta $28.000
Subtotal: $28.000
Plan mínimo: $28.000
Condición: ≥ $28.000 (cumple)
Domicilio: GRATIS ✅ (cumple exactamente el mínimo)
```

### Validación en Checkout (Fase 4)

```javascript
function calculateDeliveryFee(subtotal, userTier, monthlyFreeDeliveryCount, maxFree) {
  const tierConfig = {
    'plus': 35000,
    'pro': 28000,
    'ultra': 20000
  };
  
  const minimum = tierConfig[userTier];
  
  // Si no cumple mínimo: cobrar siempre
  if (subtotal < minimum) {
    return 5000;  // Se cobra delivery completo
  }
  
  // Si cumple mínimo: verificar límite mensual
  if (maxFree !== null && monthlyFreeDeliveryCount >= maxFree) {
    return 5000;  // Límite alcanzado, se cobra
  }
  
  // Si cumple y está dentro del límite: GRATIS
  return 0;
}
```

### Valores Base Finales (Editables desde Panel Admin)

```
Plus:
├─ Precio: $15.000/mes
├─ Descuento: 8%
├─ Puntos: 1.15x
├─ Domicilio gratis si: >$35.000 COP
└─ Máximo gratis/mes: sin límite (null)

Pro:
├─ Precio: $25.000/mes
├─ Descuento: 12%
├─ Puntos: 1.25x
├─ Domicilio gratis si: >$28.000 COP
└─ Máximo gratis/mes: sin límite (null)

Ultra:
├─ Precio: $38.000/mes
├─ Descuento: 15%
├─ Puntos: 1.5x
├─ Domicilio gratis si: >$20.000 COP
└─ Máximo gratis/mes: sin límite (null)
```

**Todos estos valores serán 100% editables desde el nuevo panel administrativo en FASE 4.**

