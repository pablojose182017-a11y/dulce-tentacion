# Plan de unificación de Evolution V1–V5 con Guardián

**Fecha:** 2026-10-09  
**Alcance:** informe de arquitectura e implementación local. No autoriza publicación ni despliegue.  
**Objetivo:** unificar los requisitos útiles de V1, V2, V3, V4 y V5 alrededor del Guardián actual, evitando duplicar módulos, tratar diseños como código funcional o habilitar capacidades que las auditorías dejaron sin demostrar.

## 1. Resumen ejecutivo

No conviene cargar cinco “versiones de IA” como cinco agentes separados. Las versiones son iteraciones de diseño: V1 define el ciclo de trabajo; V2 separa conocimiento de autoridad y añade presupuestos; V3 añade linaje, riesgo compuesto y autorización justo antes de ejecutar; V4 amplía el alcance global, revocación, investigación local y calidad de evidencia; V5 aporta un gobernador local acotado y propuestas revisables.

La integración propuesta es un solo flujo de Guardián:

1. Identidad y alcance de la petición.
2. Comprensión y plan de investigación.
3. Recuperación de memoria y conocimiento con procedencia.
4. Investigación local o consulta de fuentes públicas cuando corresponda.
5. Análisis, cálculos deterministas y consolidación epistemológica.
6. Respuesta que diferencia dato, cálculo, inferencia, hipótesis e incertidumbre.
7. Si hay acción: propuesta tipada, evaluación de seguridad y aprobación explícita.
8. Revalidación inmediatamente antes de ejecutar, ejecución en una herramienta permitida y verificación del resultado.
9. Registro y propuesta de mejora; nunca autoedición ni cambio de autoridad.

El estado de hoy cubre partes de los pasos 2–6 y una propuesta de V5. Durante este trabajo se cerró una ruta peligrosa de ChatBridge que fabricaba evidencia de éxito para intentar ejecutar automáticamente una propuesta del razonador. Ahora esa ruta solicita aprobación, comprueba localmente sesión de Firebase no anónima y el correo del creador configurado, y falla cerrada si no coincide. **Esa comprobación del navegador solo es una barrera de interfaz: no convierte al cliente en autoridad confiable ni demuestra autorización en servidor.**

Por eso la recomendación operativa es: investigación y consulta pública pueden funcionar según límites de conectividad; operaciones financieras que escriban datos, cambios de Firebase/Cloudflare y cualquier prueba activa de ciberseguridad permanecen bloqueados hasta contar con autorización confiable del lado del servidor y pruebas end-to-end. La política del creador no debe significar “obedecer cualquier texto”: una página web, archivo, conversación citada o documento nunca es una orden autenticada.

## 2. Qué significa “una sola IA” aquí

Unificar significa que Guardián coordina las capacidades existentes mediante contratos claros y estado/procedencia compartidos. No significa sumar archivos o contar suites como inteligencia. El razonamiento actual es local, determinista y limitado; no es un modelo general comparable a una IA conversacional amplia. V5 mejora control, revisión y recursos, pero no produce por sí sola aprendizaje general.

Separación obligatoria de dominios:

- **Cognición:** interpreta, descompone y propone.
- **Conocimiento:** memoria, archivos, registros y fuentes públicas con procedencia.
- **Verificación:** comprueba resultados de forma independiente del componente que propone.
- **Autoridad:** identidad autenticada, rol, alcance, caducidad y permisos originados fuera del texto del modelo.
- **Ejecución:** herramientas tipadas, con validación final de autorización, límites y auditoría.

Ningún dato de conocimiento ni salida del razonador puede crear autoridad. Los errores del oráculo o de autenticación producen `INCONCLUSIVE`/denegación, nunca aprobación por defecto.

## 3. Estado actual y brechas verificadas

| Área | Componentes actuales | Estado | Brecha a cerrar |
| --- | --- | --- | --- |
| Interfaz y coordinación | `guardian-financiero.js`, `ai-chat-bridge.js` | Conectados; suite ChatBridge 21/21 anterior a este cambio y repetida | Validación real en navegador y consistencia con todas las rutas de respuesta |
| Interpretación local | `ai-understanding.js`, `ai-reasoning.js` | Clasificación/reglas, razonamiento limitado y preguntas por datos faltantes | Evaluación sistemática de consultas reales y falsos positivos; no afirmar comprensión abierta |
| Finanzas | `costos-recetas.js`, `guardian-financiero.js` | Determinista y cubierto por 12 pruebas | Conciliar con registros reales y pedir aclaración si faltan costos/unidades |
| Memoria y contexto | `ai-memory.js`, `ai-context.js`, `ai-knowledge.js` | Contexto y memoria existentes | Evidenciar trazabilidad, retención, corrección/olvido, datos obsoletos y aislamiento por usuario |
| Investigación | `ai-research-engine.js`, `ai-offline-resolver.js`, `ai-web-fetcher.js` | Flujo conectado y probado con stubs locales | Verificar DNS/HTTPS, límites, fuentes primarias, timeout, contenido hostil y comportamiento sin red |
| Procedencia/consolidación | `ai-provenance.js`, `ai-semantic.js`, `ai-integrated-consolidation.js` | Bundle de 33 fuentes; consolidación observacional conectada a ResearchEngine; fixture offline pasa | Prueba 4C.2.4 falla al cargar porque el harness importa `ai-provenance.js` sin inicializar `window`; corregir harness o módulo con compatibilidad verificada. No considerar todo 4C.2.4 superado |
| Evolution V5 | `ai-evolution-v5.js`, `ai-evolution-advisor.js` | Observador acotado y propuestas en memoria, sin autoridad | No hay persistencia verificable, UI de revisión ni oráculo independiente conectado |
| Autorización del creador | `ai-owner-authority.js`, `ai-identity.js`, Firebase Auth | Módulo criptográfico existe, pero no está configurado en el AutonomousPolicyEngine activo; no hay enrolamiento de clave demostrable | Autenticación de servidor, firma/enrolamiento, scope de autorización, expiración, revocación, replay protection persistente y pruebas reales |
| Ejecución | `ai-security.js`, `ai-execution.js`, `ai-autonomous.js`, ChatBridge | Gateways y aprobaciones existen; ruta autónoma de ChatBridge fue eliminada en esta integración | Revisar cada ruta de ejecución y prohibir evidencia simulada en producción. JIT/revocación end-to-end no están demostrados |
| Ciberseguridad defensiva | `ai-cyber-defense.js`, `ai-controlled-execution.js` | Componentes cargados/documentados, adaptador sintético restringe targets sintéticos | No hay laboratorio aislado ni autorización de alcance completa; no activar escaneo ni acciones sobre activos reales |
| Creator Knowledge | `ai-creator-knowledge.js` y diseños | No incluido en bundle; suite Node reportada 12/12 en auditoría previa | Dependencia `crypto`/persistencia y runtime de navegador no validados; mantener fuera hasta adaptar y probar |
| Bundle | `build-bundle.js`, `ai-guardian-bundle.js` | Manifiesto de 33 fuentes; `--check` pasa | Cualquier cambio de fuente requiere regenerar bundle y repetir verificación; no publicar automáticamente |

## 4. Unificación de los diseños V1–V5

### V1 — ciclo de trabajo observable

**Integrar:** observar → analizar → investigar → concluir → decidir → verificar → registrar → aprender de forma controlada.  
**Reutilizar:** ChatBridge, ResearchEngine, ReasoningEngine, ProvenanceGraph, ConsolidationEngine, ExecutionGateway y EvolutionAdvisor.  
**Corregir/agregar:** representar cada petición como un objeto de trabajo inmutable con `requestId`, objetivo, usuario autenticado, datos requeridos, herramientas permitidas, estado, límites y referencias de evidencia. La máquina de estados debe impedir saltos como `ANALYZE → EXECUTE` y terminar en `NEEDS_INPUT`, `ANSWERED`, `PROPOSAL_PENDING`, `DENIED`, `VERIFIED` o `UNVERIFIED`.  
**Límite:** no ejecutar de manera autónoma hasta completar autorización JIT, cancelación y verificación independiente.

### V2 — frontera entre conocimiento y autoridad

**Integrar:** todo elemento de memoria/conocimiento usa un tipo epistemológico, procedencia, fecha/vigencia y alcance. Los permisos se obtienen solo del contexto autenticado y el motor de seguridad.  
**Corregir/agregar:** esquemas validados para `CreatorCommand`, `QuotedText`, `WebDocument`, `BusinessFact`, `Inference`, `Hypothesis` y `ActionProposal`; los cuatro primeros no son intercambiables y solo `CreatorCommand` autenticado puede iniciar una solicitud de autorización. Crear capability allowlist en ToolRegistry con riesgo fijo por herramienta.  
**Límite:** privilegio creator no es texto que diga “soy Pablo”; se resuelve desde identidad autenticada confiable y comprobación backend. Datos de documentos del creador no equivalen a autoridad.

### V3 — objetivos, presupuesto causal y revalidación

**Integrar:** objetivos y subtareas comparten `rootObjectiveId`, historial de intentos, presupuesto consumido y alcance de activos. Acciones compuestas acumulan riesgo aunque se troceen.  
**Corregir/agregar:** identificador de tarea basado en operación firmada, historial append-only de presupuesto y límite global por ventana; la similitud semántica nunca puede ser el único control para agrupar objetivos. Una herramienta fija riesgo/capacidades por definición y el razonador no puede rebajarlos. Revalidar política, sesión, target, scope, versión y expiración inmediatamente antes de cualquier acción.  
**Límite:** hoy V5 solo limita reservas lógicas locales y duplicados exactos; no implementa agregación global fiable ni JIT para cada acción. No declarar esta fase terminada hasta pruebas de fragmentación, concurrencia, reinicio y revocación.

### V4 — alcance global, revocación, conocimiento confiable y local-first

**Integrar:** presupuesto global independiente del número de tareas; cancelación propagada a tareas de fondo; modo offline siempre válido; diferenciación entre fuente, cita, evidencia y autoridad; correcciones históricas preservadas.  
**Corregir/agregar:** no permitir que un Circuit Breaker se restablezca porque se reinició una pestaña; definir mecanismo durable del lado de servidor cuando exista backend confiable. Para red, usar límites de hosts, esquemas HTTPS, tiempo, tamaño, redirecciones, tipos MIME y salida saneada. Buscar documentación primaria para verificar Firebase, pero no intentar leer recursos privados ni probar credenciales sin alcance autorizado. Detección de citas circulares debe reducir corroboración a incierta, no dar soporte adicional.  
**Límite:** parte de estas propiedades solo están en documentos de diseño, y la auditoría V4 ya las dejó parciales. El navegador no puede ofrecer aislamiento físico ni un log resistente a manipulación local.

### V5 — gobernador, oráculo y revisión de evolución

**Integrar:** conservar `GlobalResourceGovernor`, `ProgressOracle` y `EvolutionStateMachine` como controles cognitivos de recursos y propuestas; conectar propuestas con caso de origen, evidencia, versión de estrategia y revisión humana.  
**Corregir/agregar:** persistencia de propuestas solo después de diseñar integridad, migración, tamaño, borrado y privacidad; no guardar mensajes completos por defecto. El oráculo debe validar una condición verificable independiente (p. ej. prueba automatizada o lectura de estado confirmada), no confianza ni fuentes declaradas por el propio Guardián. Las propuestas aceptadas siguen siendo tareas de desarrollo manual y pasan suite de regresión/revisión.  
**Límite:** el gobernador JS no limita realmente memoria/CPU del SO. Evolution no se modifica a sí mismo ni se autoentrena.

## 5. Arquitectura objetivo unificada

```text
Entrada (chat/UI)
  → IdentityContext autenticado + request envelope
  → Understanding/Planner local
  → Context assembler (memoria, negocio, documentos con procedencia)
  → Resolver determinista de negocio / ResearchEngine local-first
  → ProvenanceGraph + EvidenceValidator + Consolidation
  → Respuesta tipada (hecho, cálculo, inferencia, hipótesis, desconocido)
  → [si requiere acción] ActionProposal
  → SecurityEngine: herramienta, riesgo fijo, target, scope, política, presupuesto
  → aprobación explícita autenticada cuando corresponde
  → JIT revalidación + ExecutionGateway + timeout/cancelación
  → evidencia de resultado independiente + auditoría
  → EvolutionAdvisor propone mejora para revisión humana
```

El flujo de respuestas no financieras no debe fingir investigación si el motor no cubre la consulta. En ausencia de evidencia, debe explicar qué dato necesita o marcar incertidumbre. La salida de investigación web se rotula como no verificada hasta evaluar fuente y corroboración.

## 6. Plan por hitos, archivos y pruebas de aceptación

### Hito 0 — saneamiento y fuente única

- Confirmar origen Git, respaldos, árbol de bundle y que ningún backup/prototipo/test entra al manifiesto.
- Corregir el harness 4C.2.4: inicializar `global.window.AI_CORE` y `crypto.webcrypto` antes de importar, o hacer el módulo UMD seguro para Node; después ejecutar la misma suite desde ubicación documentada. No marcarla aprobada por inspección.
- Reconciliar resultados de todas las suites: cada test debe dar código de salida no cero al fallar. El harness 4D legado imprime discrepancias aun con exit 0; retirarlo de la métrica de aceptación hasta corregir su aserción y reportes.
- Prueba: `node build-bundle.js --check`; manifiesto sin backups/tests; smoke test de carga ordenada.

### Hito 1 — contrato de petición y ciclo V1

- Archivos probables: `ai-understanding.js`, `ai-reasoning.js`, `ai-chat-bridge.js`; agregar un módulo pequeño `ai-core/ai-task-envelope.js` solo si se puede evitar duplicar estado en ChatBridge.
- Crear estados, transiciones permitidas, límites máximos de pasos y cancelación. Evitar `setInterval`/watchers autónomos.
- Pruebas: consulta financiera, pregunta pública, ambigüedad, falta de evidencia, excepción de módulo y presupuesto agotado; ningún caso entra en ejecución directa.

### Hito 2 — contratos de conocimiento/autoridad V2

- Archivos probables: `ai-identity.js`, `ai-context.js`, `ai-store.js`, `ai-provenance.js`, `ai-security.js`, `ai-execution.js`.
- Inventariar todas las capacidades y fijar clasificación/riesgo dentro de ToolRegistry; separar identidad autenticada, identidad de chat y texto citado.
- Pruebas adversariales: prompt injection desde web/adjunto/memoria, rol en texto, perfil alterado, tool desconocida, capability faltante, expiración, nonce repetido y fallo de auth. El servidor debe denegar.

### Hito 3 — presupuesto, linaje y JIT V3

- Añadir `ObjectiveEnvelope` y registro de presupuesto con padre/raíz/scope; relación causal firmada por el sistema, no inferida solo por similitud textual.
- Añadir evaluación de riesgo agregado en el SecurityEngine y cuotas globales compartidas. Al agotarse, detener y devolver estado revisable.
- Revalidar justo antes de ejecutar; las acciones de larga duración deben comprobar cancelación/revocación y tener hard timeout/cancelación del adaptador.
- Pruebas: 100 acciones pequeñas, objetivos renombrados, objetivos paralelos disjuntos, dos tareas concurrentes, reinicio, cambio de versión de política, expiración entre aprobación/ejecución y revocación durante una tarea.

### Hito 4 — fuentes, memoria y controles V4

- Añadir validación de red, límites y procedencia en `ai-web-fetcher.js`/`ai-research-engine.js`; distinguir extracción de texto hostil de instrucciones del sistema.
- Resolver ciclos de cita en `ai-provenance.js`; evitar que fuentes derivadas cuenten independientes; persistir correcciones con historia y mantener `UNCERTAIN` ante evidencia insuficiente.
- Pruebas sin red, host inválido, redirección, payload enorme, página de prompt injection, fuentes que se citan entre sí, contradicción, obsolescencia, corrección y olvido.

### Hito 5 — V5 como mejora controlada

- Crear una vista administrativa de propuestas solo si queda protegida como los recursos admin existentes; la primera versión puede exportar/revisar proposals sin autoaplicación.
- Cada propuesta: problema observado, conteo agregado, intervalo, referencias de test/log no sensible, impacto esperado, riesgos, rollback, estado y firma de quien revisa.
- Cualquier propuesta que toque seguridad, roles, Firebase, Cloudflare o ejecución requiere revisión humana reforzada, pruebas y aprobación separada.
- Pruebas: persistencia corrupta, repetición, borrado de PII, saturación, propuestas duplicadas, manipulación de contador, rollback y ninguna modificación automática.

### Hito 6 — autorización de creador y ciberdefensa

- **No desplegar autorización de navegador como control suficiente.** Decidir primero una autoridad confiable para acciones: token Firebase verificado por backend/Cloudflare Function o firma criptográfica con clave privada no expuesta al navegador. No guardar claves privadas en HTML/JS/localStorage.
- Definir allowlist de objetivos/activos propiedad del negocio, acciones permitidas, ventana temporal, límites de solicitudes, intensidad, responsable y método de parada. La autorización se liga a la acción concreta y al target; no sirve como permiso global permanente.
- Investigación pasiva de información pública puede operar sin permiso de ejecución, sujeta a términos del servicio y límites. Cualquier escaneo, autenticación contra terceros, explotación, evasión, enumeración no pública o cambio de estado queda denegado salvo alcance escrito y validación técnica; la app debe preferir laboratorio/simulador.
- Pruebas: sin token, token anónimo, usuario incorrecto, token expirado/revocado, target fuera de allowlist, acción fuera de scope, replay, cambio del payload tras aprobación, servicio de auth caído y timeout; todo debe fallar cerrado.

### Hito 7 — evaluación integral y activación gradual

- Matriz de regresión con tienda/chat/finanzas/investigación/seguridad/operaciones de trabajadores y administradores.
- Probar bundle limpio, navegador real, móvil/escritorio, emuladores y entorno de staging aislado antes de producción.
- Activar por feature flags para investigación local, web pasiva y propuestas. Mantener ejecución sensible desactivada hasta que Hitos 2, 3 y 6 pasen revisión independiente.
- Publicar solo después de revisión del dueño. Esta tarea no realizó deploy.

## 7. Criterios para decir “integrado”

Un módulo solo se marca integrado si cumple todos:

1. Está en el manifiesto de producción y carga en orden correcto.
2. ChatBridge invoca el módulo en una ruta real y el resultado llega a la respuesta esperada.
3. Tiene pruebas unitarias y al menos una prueba de flujo end-to-end sin mocks que oculten la decisión de seguridad. Si infraestructura real no está disponible, rotular la prueba como simulada.
4. Tiene manejo fail-closed de excepción, timeout, ausencia de auth, corruptela y presupuesto agotado.
5. No modifica roles, permisos, Firebase Rules ni autoridad desde conocimiento o resultados web.
6. Sus logs evitan secretos y minimizan texto personal.
7. Tiene rollback documentado y backup antes de editar.

Estado de un documento, número de pruebas impresas o presencia de un archivo no es evidencia de integración.

## 8. Cambios ya realizados en esta ronda y validación

Se modificó ChatBridge para retirar la evidencia de éxito fabricada y la llamada directa a ejecución autónoma desde una propuesta del razonador. La propuesta usa el flujo de aprobación humana, con una condición adicional de aprobación por cuenta creadora autenticada según Firebase Auth del cliente. El test de seguridad se amplió a 26 comprobaciones, incluyendo propuesta sin ejecución, sesión ausente, identidad no creadora y aprobación de prueba con la identidad configurada. Esa aprobación usa un adaptador simulado; no prueba acción real en Firebase ni autorización de servidor.

Validaciones ejecutadas en esta ronda:

- ChatBridge integración: 21/21.
- Seguridad de ejecución: 26/26.
- Permisos: 5/5; investigación: 3/3.
- Evolution V5: 15/15; advisor y consolidación runtime offline pasaron.
- Finanzas: 12; cargador: 5; autorización de assets admin: pasó; independencia de IA externa: 3/3.
- Fases 4A: 22/22; 4B: 19/19; 4C base: 14/14; 4C.1/1.1/1.2 y partes de 4C.2 pasaron antes/según harnesses locales.
- **Pendiente/fallo de ejecución:** `test_phase4c24.js` no pudo arrancar porque requiere `ai-provenance.js` antes de inicializar `window`; no se marca como superado. El harness 4D antiguo tiene discrepancias históricas y no se toma como limpio.
- Bundle: regenerado desde 33 fuentes y `node build-bundle.js --check` pasó.

El archivo fuente modificado fue respaldado como `ai-core/ai-chat-bridge.js.backup-before-v1-v4-safe-gating-20261009`; el bundle previo se conservó como `ai-guardian-bundle.js.backup-before-chatbridge-approval-integration-20261009`; el test de ejecución conserva `ai-core-execution-security-tests.js.backup-before-v1-v4-safe-gating-20261009`.

## 9. Riesgos y decisiones abiertas antes de nuevas acciones

- La identidad Firebase en el navegador puede falsificarse desde un cliente manipulado. Para acciones sensibles se necesita un verificador confiable de token y autorización del lado del servidor. La prueba actual demuestra solo la puerta local del UI.
- El correo fijo del creador está escrito en cliente/identidad del sistema y no debe confundirse con enrolamiento criptográfico. Definir cuenta creadora y recuperación segura antes de habilitar capacidades críticas.
- El `SecurityEngine` ejecutable y sus adaptadores requieren revisión archivo por archivo; cambiar propuestas a “aprobadas” no las convierte en seguras.
- No se ha probado producción, Cloudflare, Firebase Rules desplegadas, navegación real ni investigación web con red real en este hito.
- No hay solución de cero coste ilimitado ni promesa de “super IA” comparable a un modelo general. La meta realista es un copiloto local-first, extensible, verificable, con herramientas limitadas y decisiones transparentes.

## 10. Recomendación de orden inmediato

1. Mantener la ejecución autónoma desactivada y revisar si hay otras rutas de entrada a `ExecutionGateway` además de ChatBridge.
2. Corregir harness 4C.2.4 y clasificar resultados históricos 4D con salidas confiables.
3. Implementar `ObjectiveEnvelope`/presupuesto global y pruebas de fragmentación, sin conectar ejecución todavía.
4. Diseñar autoridad confiable del creador en servidor; no usar la sesión del navegador como única autorización.
5. Completar fuentes y memoria V4; integrar Creator Knowledge solo después de pruebas reales en navegador.
6. Montar revisión humana de propuestas V5 y regresión; después evaluar activación gradual en staging.

**Criterio de salida:** todas las fases deben tener pruebas reproducibles, revisión de seguridad y estado explícito. Ninguna brecha de autorización se deja para “corregir después” con acciones reales habilitadas.
