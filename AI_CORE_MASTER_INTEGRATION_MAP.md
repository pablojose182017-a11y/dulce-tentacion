# Mapa maestro de integración de AI Core / Guardián

**Propósito:** conservar las fases existentes y distinguir diseño, código fuente, pruebas y funciones que realmente llegan al Guardián.

**Alcance revisado:** carpeta local `dulce-tentacion`, fuentes de `ai-core`, `guardian-financiero.js`, cargador de Pages, bundle, informes de Fase 2 y Fases 4A–4D, diseños Evolution V1–V5 y sus pruebas visibles.

## Reglas de trabajo

- Este mapa no reemplaza ni borra los informes originales. Los informes se conservan como historial de decisiones y auditorías.
- El estado de una capacidad se determina por el código cargado y pruebas reproducibles, no por el nombre o el estado escrito en un informe antiguo.
- No se conecta Gemini, otra API de IA ni se agregan credenciales al navegador.
- El núcleo local puede proponer y razonar; los cálculos financieros se mantienen deterministas y verificables.
- Las acciones sensibles siguen separadas y sujetas a la matriz de permisos y aprobación.

## Fuente única del bundle de producción

`build-bundle.js` contiene el manifiesto ordenado de fuentes que forman `ai-guardian-bundle.js`. El cargador autorizado descarga ese archivo mediante `firebase-sync.js`. El manifiesto excluye suites de prueba, archivos `fix*`, `apply*`, `debug*` y prototipos.

El bundle minificado histórico se conserva, pero el cargador local usa el bundle `.js` mientras no haya un minificador local disponible. El constructor no descarga herramientas ni modifica el cargador. `node build-bundle.js --check` verifica que el artefacto corresponde a las fuentes sin escribir archivos.

## Estado de integración observado

| Área | Código existente | Estado en Guardián | Condición para avanzar |
| --- | --- | --- | --- |
| Interfaz y chat | `guardian-financiero.js`, `ai-chat-bridge.js` | Conectados | Probar recorridos completos, no solo clases aisladas |
| Comprensión local | `ai-understanding.js` | Reglas e intención básica; no comprensión abierta | Ampliar con corpus de consultas y pruebas contra falsos permisos |
| Finanzas | `costos-recetas.js`, `guardian-financiero.js` | Cálculos locales; ranking de rentabilidad y gasto ya entra por ChatBridge | Validar con registros reales y tratar cualquier dato incompleto como insuficiente |
| Memoria | `ai-memory.js`, `ai-context.js`, persistencia | Memoria corta y persistente disponibles | Demostrar qué recuerdo recupera una respuesta concreta y cómo se elimina/corrige |
| Conocimiento general | `ai-knowledge.js`, `ai-store.js` | Búsqueda local léxica y recuperación contextual | Medir precisión, procedencia, vigencia y documentos irrelevantes |
| Conocimiento del creador | `ai-creator-knowledge.js` y diseños | El puente tiene integración condicional, pero el módulo no está en el manifiesto actual | Revisar dependencias y auditorías; añadir solo con pruebas de rehidratación, alcance y procedencia |
| Investigación | `ai-research-engine.js`, `ai-web-fetcher.js`, `ai-offline-resolver.js` | Código conectado; red real no demostrada por los stubs | Aceptar modo sin red y denegación de permisos; comprobar evidencia/fuentes en modo conectado |
| Proveniencia / semántica | `ai-provenance.js`, `ai-semantic.js` | Fuentes incluidas; integración cognitiva completa no demostrada | Ejecutar pruebas de contrato y verificar el flujo desde el mensaje hasta evidencia validada |
| Consolidación | `ai-consolidation.js`, `ai-integrated-consolidation.js` | No están en el manifiesto de producción | Resolver auditorías pendientes y validar referencias, conflictos, ciclos y límites de cómputo |
| Seguridad / ejecución | `ai-security.js`, `ai-execution.js`, `ai-controlled-execution.js`, `ai-autonomous.js` | Componentes cargados, pero la ejecución real se declara no lista en informes | Mantener acciones apagadas hasta completar pruebas de autorización, aprobación, rollback y auditoría |
| Evolution V5 | `ai-evolution-v5.js` y diseños V1–V5 | No incluido en runtime; experimental y con limitaciones críticas documentadas | No activar. Primero corregir limitaciones críticas y separar propuestas de cualquier escritura/ejecución |

## Informes que requieren reconciliación

- `AI_CORE_PHASE2_BRAIN_CONNECTION_REPORT.md` documenta que se usa `provider.generate()`, pero el código actual de `ReasoningEngine` llama a `_mockAIProvider()` y la respuesta normal de `ChatBridge` se compone localmente. El informe es historial, no prueba del flujo actual.
- Los informes 4C.1/4C.2 contienen estados sucesivos de `BLOCKED`, `PENDING AUDIT`, `VERIFIED` y `NOT VERIFIED`; el estado final debe resolverse con las últimas pruebas ejecutadas sobre el código actual.
- Fase 4D describe un parser local Level 0/1 y niveles superiores pendientes. No equivale a comprensión libre del lenguaje.
- `AI_CORE_EVOLUTION_V5_IMPLEMENTATION_LIMITATIONS.md` marca V5 experimental/no segura para producción y enumera riesgos críticos. Es una barrera explícita para su activación.
- La auditoría cognitiva describe límites del motor local y puede preceder cambios posteriores; cada hallazgo debe contrastarse con la fuente actual antes de marcarlo vigente o cerrado.

## Orden de integración propuesto

### Hito A — Flujo local comprobable

- Clasificar la consulta sin confundir frases normales con autorización.
- Resolver costo, margen y rankings con datos verificados del negocio.
- Preguntar cuando falten datos; no convertir referencias de insumo ausentes en costo cero.
- Tener pruebas desde `ChatBridge`, más verificación del manifiesto y del bundle.

### Hito B — Conocimiento y memoria útiles

- Precisar qué campos de memoria y conocimiento entran en contexto y con qué procedencia.
- Añadir pruebas de recuperación relevante, dato obsoleto, contradicción, corrección y olvido.
- Integrar Creator Knowledge solo después de validar sus dependencias y el aislamiento entre preferencia, hecho, identidad y autoridad.

### Hito C — Razonamiento local verificable

- Sustituir casos de prueba hardcodeados por estrategias deterministas pequeñas y explícitas: descomposición, selección de herramientas locales, evaluación de evidencia y preguntas por información faltante.
- La salida debe diferenciar hecho almacenado, cálculo, inferencia e hipótesis, con referencias que permitan verificarla.
- Si no hay evidencia o estrategia aplicable, responder `UNKNOWN` y proponer qué dato local permitiría continuar.

### Hito D — Procedencia, conflictos y consolidación

- Cerrar auditorías y pruebas pendientes de 4C/4D sobre las versiones actuales.
- Integrar una capacidad por vez en el camino de `ChatBridge`, con límites de tiempo, tamaño y recursión.
- No elevar automáticamente la confianza del conocimiento al rehidratar o consolidar.

### Hito E — Evolution controlada

- Evolution puede evaluar resultados y proponer mejoras versionadas.
- Toda modificación pasa por pruebas aisladas, comparación contra regresiones y revisión humana.
- No puede cambiar permisos, reglas de seguridad ni código activo por decisión propia.

## Criterios de aceptación permanentes

1. El sistema responde sin conexión externa para los escenarios cubiertos localmente.
2. Los cálculos concuerdan con datos de prueba calculados independientemente.
3. Una consulta no cubierta se declara como desconocida o solicita información; nunca simula una búsqueda o comprensión que no hizo.
4. Cada dato factual devuelto puede rastrearse a memoria, documento local, cálculo o resultado de herramienta.
5. Cambiar el texto del usuario no puede conceder permisos ni aprobar acciones sensibles.
6. El bundle se puede reconstruir y validar sin descargas, sin incluir pruebas y sin sobrescribir la configuración del cargador.

## Progreso de esta unificación

- Creado este mapa para conservar y relacionar los informes existentes.
- Incorporado un manifiesto explícito y verificación de bundle en `build-bundle.js`.
- Separada la descarga opcional de Chart.js de la carga del Guardián.
- Conectados y probados rankings locales de rentabilidad y gasto de insumos a través de `ChatBridge`.
- Añadida una prueba de regresión para evitar que “Dime el pan menos rentable” se interprete como una autorización.
- El `ChatBridge` activo ya no instancia el `LocalMockProvider`; la ruta legacy se conserva por compatibilidad y no delega en servicios externos.
- Las autorizaciones en lenguaje natural se reconocen como respuestas breves explícitas; frases de trabajo más largas no deben aprobar herramientas por coincidencia aproximada.
- Los hitos B–E permanecen pendientes; no se anuncian como capacidades ya completadas.
