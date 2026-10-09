# Auditoría e integración local de Evolution V1–V5

**Fecha:** 2026-10-09  
**Alcance:** diseños/auditorías V1–V5, `ai-evolution-v5.js`, integración de ChatBridge y disposition de módulos 4C/4D. Trabajo solo local: sin cambios a permisos, Firebase, autenticación, ejecución, commit, push o despliegue.

## Qué aportan los diseños

- **V1:** ciclo de observación, análisis, investigación, conclusión, decisión, verificación, registro y aprendizaje; autonomía no amplía autoridad.
- **V2:** separa conocimiento de autoridad y propone presupuestos, circuit breaker y trazabilidad.
- **V3:** añade linaje de objetivos, riesgo acumulado y autorización justo antes de ejecutar. Son requisitos de diseño, no controles demostrados por los informes.
- **V4:** refuerza el modo local, la procedencia y la revisión de evidencia. La auditoría final marca controles como parciales y enumera ataques adicionales.
- **V5:** propone gobernador de recursos, oráculo de progreso y separación entre cognición, verificación, seguridad y ejecución. La auditoría V5 concluye `DESIGN NOT VERIFIED`.

## Hallazgos y correcciones de V5

La primera ejecución de `node test_evolution_v5.js` dio **6 aprobadas y 2 fallidas**. La prueba de inmutabilidad era un falso positivo: capturaba el `assert(false)` tras una escritura silenciosa; además, `auditLog` exponía un arreglo modificable. El oráculo podía aceptar como verificables campos de confianza suministrados por el solicitante y el gobernador no rechazaba reservas negativas o repetidas.

Se endureció `ai-evolution-v5.js`:

- Reservas validan IDs, enteros, límites, duplicados y vencimiento; liberar una reserva es idempotente.
- El oráculo es `INCONCLUSIVE` por defecto y solo devuelve `VERIFIED` si un verificador independiente inyectado lo confirma. Guardián no configura uno y ese resultado no afecta permisos.
- Estado, reservas, bitácora y propuestas usan estado privado y vistas congeladas. Al llenarse la bitácora, Evolution se detiene.
- La máquina genera propuestas versionadas y permite aceptar una para implementación manual o descartarla. Revisar no modifica código ni ejecuta acciones.
- `ai-evolution-v5.js` y `ai-evolution-advisor.js` están incluidos en el bundle y conectados a ChatBridge en modo propuesta solamente.

La suite corregida pasa **15/15**. Evolution observa solo categorías de respuesta, no almacena mensajes y limita sus contadores. Una propuesta aparece tras señales repetidas, queda como `INCONCLUSIVE` y requiere revisión humana.

### Límites aún vigentes

El estado, propuestas y auditoría son en memoria y se pierden al recargar. El gobernador limita reservas lógicas, pero no es un sandbox de CPU del sistema operativo. No hay verificador independiente conectado, persistencia autenticada, ciclo autónomo de investigación ni ejecución de acciones. Los problemas de parser entre runtimes, reloj/persistencia, aislamiento físico, grafo causal y recuperación segura siguen pendientes antes de cualquier autonomía ejecutora.

## Disposición de los otros componentes

| Componente | Estado | Por qué no se activa todavía / siguiente trabajo |
| --- | --- | --- |
| `ai-evolution-v5.js` + `ai-evolution-advisor.js` | Integrados en ChatBridge/bundle como propuestas sin autoridad | Persistencia revisable e interfaz de revisión quedan pendientes |
| `ai-creator-knowledge.js` | Aislado, inventariado, no cargado | Depende de `require('crypto')`, carece de storage persistente de navegador y necesita pruebas de rehidratación/integridad en runtime |
| `ai-consolidation.js` | Aislado, inventariado, no cargado | Su heurística agrupa fuentes por prefijo y trata aportes de usuario como consolidados; puede dar certeza indebida. Requiere Provenance real y tests |
| `ai-integrated-consolidation.js` | Aislado, inventariado, no cargado | Depende de `require('crypto')` y de invariantes del grafo; debe pasar pruebas runtime y de límites antes de conectarse |
| Diseños/informes 4C–4D y scripts de test/fix/debug | Conservados como documentación/herramientas, no módulos de runtime | Hay estados históricos divergentes; se deben reconciliar contra código antes de habilitar aprendizaje persistente |

Los componentes desconectados ya tienen disposición, motivo y siguiente paso; no se incorporan al bundle solo para que parezcan activos. Creator Knowledge y consolidación no deben convertirse en hechos ni autoridad sin sus controles.

## Acceso local y siguientes hitos

Las propuestas se consultan con `ChatBridge.getEvolutionProposals()` y pueden marcarse para implementación manual o descartarse mediante `reviewProposal(id, revision, decision)`. No hay interfaz del panel para revisarlas aún. El siguiente hito es persistir propuestas con procedencia y revisión/corrección controlada; después se puede integrar un primer módulo 4C/Creator Knowledge aislado y pasar sus pruebas en navegador antes de incorporarlo.

## Pruebas ejecutadas

- `node test_evolution_v5.js`: **15/15**; recursos, expiración, duplicados, evidencia, errores del verificador, bitácora, propuesta sin autoridad y saturación.
- `node tests/guardian-evolution-advisor.test.mjs`: pasó; observación acotada, revisión humana, sin autoridad ni ejecución.
- `node ai-chat-bridge-tests.js`: **21/21**.
- Finanzas locales: **12**; cargador: **5**; permisos: **5**; investigación: **3** — pasaron.
- `node build-bundle.js --check`: verifica sincronización del bundle con las fuentes declaradas.
