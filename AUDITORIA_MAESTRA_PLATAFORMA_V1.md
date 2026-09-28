# AUDITORÍA MAESTRA DE LA PLATAFORMA - DULCE TENTACIÓN
**Fecha:** 28 de Septiembre, 2026
**Estado:** PRUEBAS (Pre-Lanzamiento)
**Tipo:** Auditoría Estática de Código y Arquitectura Client-Side

---

## 1. RESUMEN EJECUTIVO
La plataforma "Dulce Tentación" es una Single Page Application (SPA) monolítica desarrollada en Vanilla JavaScript, HTML y CSS. Utiliza Firebase (Auth y Firestore) como Base de Datos como Servicio (BaaS) en el plan Spark (Gratuito). La plataforma combina en el mismo front-end tanto la interfaz de cliente (catálogo, carrito, club de puntos) como el panel administrativo, basando la separación de privilegios en el estado del cliente y reglas de base de datos.
Al no poseer un backend tradicional ni Cloud Functions, toda la lógica de negocio (precios, puntos, descuentos VIP) se ejecuta y compila en el navegador del usuario.

## 2. ARQUITECTURA ACTUAL
**Paradigma:** Client-Serverless (Thick Client).
- **Front-End:** Renderizado dinámico vía inyección de `innerHTML` gestionado por `script.js`.
- **Back-End:** Firebase Firestore (Base de datos NoSQL reactiva).
- **Estado Local:** Fuerte dependencia de `localStorage` para caché, persistencia offline y persistencia de sesión híbrida.
- **Sincronización:** Interceptor/Wrapper pattern. `firebase-sync.js` envuelve funciones locales de `script.js` para añadir la capa cloud sin reescribir el core original.

## 3. MAPA COMPLETO DE ARCHIVOS
- `index.html`: Esqueleto principal, carga de librerías de Firebase y UI inicial.
- `script.js` (~6.500 líneas): Core de UI, catálogo, carrito, cálculo de totales, lógica VIP, y Panel Administrativo legacy.
- `firebase-sync.js` (~1.500 líneas): Motor de sincronización Cloud, listeners de Firestore, Autenticación (Google/Anonymous), transacciones de Puntos y sistema Toast.
- `style.css` / CSS embebido: Estilos de la aplicación.
- `costos-recetas.js`: Módulo administrativo para costeo de productos.
- Librerías externas: Firebase SDK v8 (compat), Google Identity Services (GSI), FontAwesome, Google Fonts.

## 4. MAPA DE PANTALLAS
- **Inicio/Catálogo:** Muestra productos filtrados (Todos, Combos, Ofertas).
- **Carrito (Modal/Offcanvas):** Gestiona items, cantidades y calcula subtotal.
- **Checkout (Modal):** Recopila datos de envío, aplica descuentos VIP, calcula total y lanza pedido a WhatsApp/Firestore.
- **Mis Pedidos:** Escucha y renderiza el historial del usuario.
- **Club Dulce Tentación / Puntos:** Interfaz de recompensas y saldo.
- **Perfil / Auth (Modales):** Login, Registro, Google Sign-In.
- **Panel Administrativo (Oculto):** Accesible si `role === 'admin'`. Muestra gestión de pedidos, usuarios, roles, catálogo y variables globales (`adminConfig`).

## 5. INVENTARIO DE BOTONES Y ACCIONES CORE
- `sendOrder()`: [Checkout] 🟡 Riesgo Medio. Manda a WA y Firestore. Inyectado por Wrapper 1 y 2.
- `loginUserObj()`: [Auth] 🟡 Depende de sincronización paralela entre Auth y LocalStorage.
- `registrarMovimientoPuntos()`: [Club] 🟢 Transacción segura, pero los parámetros vienen del cliente.
- `cambiarEstadoPedido()`: [Admin] 🟢 Protegido por Rules, actualiza Firestore y dispara listeners.
- `marcarEntregado()`: [Admin] 🟢 Actualiza pedido a completado.

## 6. FLUJOS DE USUARIO
- **Invitado:** Navega -> Agrega al carrito -> Checkout -> Se genera Anonymous Auth silente -> Asigna `ownerId` y `claimSecret` -> Guarda en Firestore -> Abre WA. (0 Puntos).
- **Registrado:** Navega -> Checkout -> Calcula Puntos (`calcularPuntosPedido`) -> Guarda Pedido -> Ejecuta Transaction de Puntos -> Abre WA.
- **Vinculación (Guest -> User):** Login de Google -> Detecta `dt_claim_secrets` -> Lee pedido anónimo -> Actualiza `ownerId` al nuevo UID -> Borra Secret.

## 7. RESPONSIVE
*NO DETERMINABLE EXHAUSTIVAMENTE SIN RENDERIZADO VISUAL*, pero el código base manipula extensamente clases CSS y tiene variables como `isMobile` (basado en `navigator.userAgent`) para adaptar el texto de WhatsApp (emojis) y ciertos modales. Existen riesgos de overflow en el Panel Administrativo (tablas anchas) en móviles de 320px.

## 8. AUTENTICACIÓN
- **Sistemas:** Google Identity Services + Firebase Custom Auth + Anonymous Auth.
- **Flujo Híbrido:** Para no romper el plan Spark (que limita ciertas APIs), se usa GSI para obtener el token, y se inyecta en Firebase Auth vía credencial.
- **Múltiples cuentas:** Hay mitigaciones para `credential-already-in-use` (linkWithCredential fallback a signInWithCredential).

## 9. PEDIDOS
- **Creación:** `script.js` calcula total -> `firebase-sync.js` inyecta metadata (ownerId, ISO date) -> `.set()` asíncrono -> Redirección WA.
- **Escucha:** El Admin tiene un listener global (`onSnapshot`). El Cliente tiene un listener limitado a su `ownerId`.
- **Riesgo:** Si falla el `.set()` por red, Firebase lo encola. Si falla por Rules, no hay fallback en UI porque WA ya se abrió.

## 10. NOTIFICACIONES
- **Toast Global:** Un listener de Firestore vigila cambios en los pedidos del usuario. Si un estado cambia (ej. "En preparación") y el usuario NO está viendo "Mis Pedidos", dispara un Toast no intrusivo en la esquina inferior.
- **Robustez:** 🟢 Funciona, se evita polling mediante WebSockets (onSnapshot).

## 11. PUNTOS DULCE
- **Matemática:** `Math.floor((Bruto - Descuento) / 1000)`. Domicilio excluido. Requerido superar `adminConfig.minPurchase`.
- **Motor:** `db.runTransaction()`.
- **Seguridad (Idempotencia):** El ID del pedido se inyecta en un array `puntosReclamadosIDs`. Si hay doble ejecución o recarga, la transacción rebota silenciada (`already_claimed`).
- **Fraude:** 🔴 La cantidad viaja desde el navegador. Un atacante puede alterar el payload antes de ejecutar la transacción.

## 12. VIP
- **Determinación:** Condición redundante: `!!(user.vip || user.isVip || user.role === 'vip' || user.vipStatus === 'activo')`.
- **Beneficio:** 5% descuento (8% en cumpleaños). Evaluado estrictamente en cliente.
- **Puntos:** Gana puntos con la misma fórmula que un usuario normal, sobre el precio neto.

## 13. PANEL ADMINISTRATIVO
- **Acceso:** Basado en `currentUser.role === 'admin'`. 
- **Seguridad Real:** Las Firestore Rules son el único escudo real. Si la Rule falla, aunque un atacante manipule su localStorage para ver el panel, sus operaciones de escritura y lectura serán rechazadas por Firebase ("Missing permissions").
- **Funcionalidad:** Plena. Gestión de pedidos en tiempo real (sin necesidad de F5).

## 14. FIREBASE (OPERACIONES Y COSTOS)
- **Costo:** 🟢 Muy optimizado.
- **Lecturas:** `onSnapshot` cobra 1 read por documento inicial y 1 por cada cambio.
- **Escrituras:** 1 Write al crear pedido. 1 Write en la transacción de puntos.
- **Transacciones:** Limitadas y protegidas contra loops infinitos.
- Todo encaja holgadamente en la cuota gratuita de Spark (50k Reads / 20k Writes diarios).

## 15. FIRESTORE SECURITY RULES (AUDITORÍA)
- **Usuarios:** `match /usuarios/{email}` -> Protegido. Un usuario solo puede leer/escribir su propio documento (basado en auth.token.email).
- **Pedidos:** Protegido parcialmente. El usuario puede crear, pero las actualizaciones deben restringir qué campos pueden cambiar (evitar que el cliente cambie el precio de su pedido). *Requiere despliegue de las Rules diseñadas en Fase 2A*.

## 16. LOCALSTORAGE
- `dt_user`: Sesión del cliente activo. 🔴 Contiene su rol (manipulable).
- `dt_registered_users`: Caché legacy del array de todos los usuarios registrados. 🟡 Deuda técnica.
- `dt_admin_config`: Caché de configuraciones.
- `dt_claim_secrets`: Temporal para Guest. 🟢 Seguro (se borra al reclamar).
- **Riesgo:** Si el usuario edita `dt_user` y cambia su `role` a 'admin', verá los botones de administrador, pero Firestore abortará las peticiones si las Rules están bien.

## 17. SEGURIDAD GENERAL (MATRIZ EXCLUSIVA)
- 🔴 **Manipulación de Precios:** El carrito se calcula localmente. Un atacante puede enviar un pedido con total $1 a Firestore. 
- 🔴 **Manipulación de Puntos:** El cliente invoca la transacción con la `cantidad`. Puede asignarse 5.000 puntos arbitrariamente.
- 🟡 **Inyección HTML (XSS):** Uso extensivo de `innerHTML` (`msg += ...`). Si los nombres de usuario o direcciones no se escapan, hay riesgo de scripts maliciosos.

## 18. RENDIMIENTO
- 🟡 **Medio:** `script.js` es excesivamente grande, lo que retrasa el *Time to Interactive* inicial. 
- 🟢 **Operaciones Reactivas:** Excelente uso de listeners de Firestore en lugar de `setInterval`, reduciendo consumo de CPU y red.

## 19. COSTOS (PROYECCIÓN)
Cero dólares ($0.00). El uso de Autenticación anónima, Base de datos NoSQL sin índices pesados y ausencia de Cloud Functions garantiza no requerir método de pago (Blaze).

## 20. COMPATIBILIDAD
El código usa ES6 (`const`, `let`, Arrow Functions, `Promise`, desestructuración). Compatible con cualquier navegador moderno posterior a 2017. Podría fallar en navegadores muy antiguos (IE11) o WebView legacy de Android.

## 21. DATOS HISTÓRICOS
Pedidos antiguos en la base de datos (previos a Fase 1) no tienen `ownerId` ni `claimSecret`. El código actual los ignora correctamente en los listeners del cliente (ya que no hacen match con su UID). El Admin los ve y los procesa sin problemas.

## 22. CÓDIGO DUPLICADO / DEUDA TÉCNICA
- **Identidad Duplicada:** Convivencia forzada entre `window.currentUser` (lógica original) y `auth.currentUser` (Firebase Auth).
- **Rol Redundante:** `isVip`, `vip`, `vipStatus`, `role: 'vip'`.
- **Wrappers:** `script.js` llama a X, `firebase-sync.js` envuelve X. A largo plazo, dificulta el debuggeo (Call stack spaghetti).

## 23. MATRIZ DE RIESGOS
| Riesgo | Nivel | Descripción | Impacto a Lanzamiento |
| :--- | :---: | :--- | :--- |
| **Trust-Client** | CRÍTICO | El cliente calcula precios y puntos. | 🔴 Bloqueador. Requiere Rules estrictas para bloquear montos falsos. |
| **XSS en Panel** | ALTO | Pedidos con nombres inyectados (`<script>`) | 🟡 Importante. Puede comprometer la cuenta del Admin. |
| **Spaghetti Code** | MEDIO | 6.500 líneas en `script.js`. | 🟢 No bloquea, pero ralentiza desarrollo futuro. |
| **Pérdida de Auth** | MEDIO | Caché localStorage vs Firebase Auth. | 🟡 Importante. Si se desincronizan, el UI se rompe temporalmente. |

## 24. MAPA DE DEPENDENCIAS (CONCEPTUAL)
```mermaid
graph TD;
    UI[DOM / Botones] --> ScriptJS[script.js (Lógica / Carrito / Totales)];
    ScriptJS --> Wrappers[firebase-sync.js Wrappers];
    Wrappers --> FirebaseAuth[Firebase Auth];
    Wrappers --> Firestore[Firestore Database];
    Firestore --> AdminUI[Listeners Panel Admin];
    Firestore --> ClientUI[Listeners Cliente / Toast];
```

## 25. CHECKLIST DE PREPARACIÓN PARA LANZAMIENTO
**Antes de abrir a clientes reales:**
- [ ] 🔴 **DESPLEGAR FIRESTORE RULES:** Las reglas de la Fase 2A/2B deben ser puestas en producción. Actualmente la BD podría estar abierta o tener permisos vulnerables.
- [ ] 🔴 **VALIDACIÓN DE MONTOS:** Encontrar una estrategia (incluso client-side) para evitar inyección de precios $0 o negativos en Firebase.
- [ ] 🟠 **Sanitización de Inputs:** Aplicar `textContent` o escaneo básico a los campos de texto (dirección, notas, nombre) antes de inyectarlos vía `innerHTML`.
- [ ] 🟡 **Pruebas de Estrés Puntos:** Confirmar que un usuario no pueda usar el mismo `claimSecret` dos veces de alguna manera ingeniosa.

## 26. RECOMENDACIONES PRIORIZADAS
1. **Despliegue Inmediato:** Oficializar las Firestore Rules de Fase 2A/2B para cerrar brechas de escritura.
2. **Refactorización de Identidad (Fase 3):** Migrar de `usuarios/{email}` a `usuarios/{uid}` para limpiar la duplicidad y asegurar inmutabilidad total.
3. **Escapar HTML:** Crear una función global `escapeHTML(str)` y aplicarla en el renderizado de tablas y tarjetas.

## 27. ARCHIVOS INTACTOS (NO TOCAR SIN AUDITORÍA)
- `script.js`: Extremadamente interdependiente. Cualquier cambio en las variables globales (ej. `products`, `cart`, `currentUser`) puede derribar toda la aplicación.
- `index.html`: La estructura de contenedores (`#productGrid`, `#adminPanel`) está atada a referencias físicas absolutas en el JS. No modificar IDs.

---
**FIN DE LA AUDITORÍA MAESTRA.**
El sistema se encuentra estable, la lógica de negocio unificada y funcional. El obstáculo final antes del lanzamiento público recae exclusivamente en la **Capa de Autorización** (Firestore Rules).
