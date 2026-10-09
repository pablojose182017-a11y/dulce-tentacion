# Reconciliación local de Evolution V5 y módulos relacionados

Fecha: 2026-10-09. Alcance local: no hubo commit, push, sincronización ni despliegue.

## Estado funcional

- Evolution V5 y su asesor están en el bundle y conectados a ChatBridge. Observan categorías acotadas, generan propuestas en memoria y requieren revisión humana. No ejecutan ni aplican cambios.
- El módulo `ai-integrated-consolidation.js` ahora está en el manifiesto del bundle y se conecta al `ResearchEngine` mediante el grafo de procedencia. La prueba de runtime offline recorre buscador simulado local, procedencia, afirmación y estado de consolidación. Este estado es una evaluación local de evidencia disponible, no garantía de verdad externa.
- `ai-consolidation.js` simple sigue fuera del runtime porque su heurística puede elevar indebidamente confianza.
- Creator Knowledge permanece fuera del bundle. Su suite de Node pasa, pero faltan pruebas del almacenamiento/integridad en el runtime real de navegador y su adaptación actual necesita trabajo para esas dependencias.
- Documentos de diseño, auditorías, prototipos y harnesses que no forman parte del manifiesto se conservan como material de referencia/herramientas; no se consideran capacidades activas ni repositorios de runtime.

## Inventario del manifiesto

La fuente de verdad del bundle es `build-bundle.js`; contiene 33 fuentes de producción y excluye pruebas y herramientas. `ai-guardian-bundle.js` se regeneró desde ese manifiesto y `node build-bundle.js --check` confirmó coincidencia exacta.

## Validación ejecutada

- Evolution V5: 15/15.
- Asesor e integración ChatBridge: pasó.
- ChatBridge: 21/21.
- Finanzas locales: 12/12; cargador: 5/5; permisos: 5/5; investigación: 3/3.
- Creator Knowledge: 12/12 en Node (no equivale a prueba de navegador).
- Fases locales: 4A 22/22, 4B 19/19, 4C base 14/14, 4C.1 45, 4C.1.1/1.2, 4C.2 20, 4C.2.2 14, 4C.2.3 3, 4C.2.4, 4D consenso 20 y remediación 30 pasaron en sus harnesses. El harness 4D legado conserva mensajes de discrepancia histórica y no se cuenta como prueba limpia.
- Consolidación integrada: prueba offline pasa y confirma `SUPPORTED` para el fixture de una fuente, sin red externa.
- Bundle: `node build-bundle.js --check` pasa con 33 fuentes.

## Límites pendientes

No hay modelo de lenguaje general local conectado. El razonamiento permanece determinista y acotado; no se afirma que sea equivalente a un asistente general. No hay aprendizaje autónomo, autoedición de código, memoria persistente de Evolution ni verificador independiente configurado. La investigación web y la verdad de sus fuentes no se demostraron con red real. Creator Knowledge necesita pruebas e integración de navegador antes de activarse.

## Matriz de integración V1–V4

| Diseño | Requisito | Reutilización/integración actual | Estado verificable |
| --- | --- | --- | --- |
| V1 | Observar errores y proponer aprendizaje | `EvolutionAdvisor` clasifica respuestas acotadas, agrega señales y crea propuestas sujetas a revisión | Parcial; no investiga ni aprende estrategias automáticamente |
| V1 | Investigar, actuar, verificar y aprender | Investigación local/web está separada en `ResearchEngine`; las acciones siguen por el gateway de permisos | No existe un ciclo Evolution autónomo que orqueste esas etapas |
| V2 | Conocimiento no concede autoridad | Propuestas Evolution declaran `authority: NONE`; aceptación significa implementación manual | Cubierto en las propuestas V5; no usar conocimiento web como autorización |
| V2/V3 | Solo una orden autenticada del creador puede autorizar acciones sensibles | `OwnerAuthority` existe, pero ChatBridge no configura esa dependencia en su `AutonomousPolicyEngine` | No está listo para autorizar acciones; los intentos que requieren esa firma deben fallar cerrados |
| V2 | Presupuesto y circuit breaker | `GlobalResourceGovernor` mantiene límites lógicos y `EvolutionStateMachine` se detiene si agota su bitácora | Parcial: solo memoria del proceso; no controla CPU/RAM del sistema operativo ni presupuesto entre procesos |
| V3 | Riesgo agregado, linaje y presupuesto heredado | V5 evita ID duplicado y limita recursos por reserva | No implementado: IDs de objetivo no prueban equivalencia semántica ni correlacionan linajes disjuntos |
| V3 | JIT y revocación antes/durante ejecución | La ejecución permanece fuera de Evolution; los módulos de seguridad/gateway son separados | No demostrado como una ruta integrada end-to-end; no habilitar ejecución autónoma |
| V4 | Oráculo independiente | El oráculo V5 devuelve `INCONCLUSIVE` si no se inyecta verificador independiente | Fail-closed por defecto; no hay verificador conectado |
| V4 | Persistencia/auditoría resistente y aislamiento | Propuestas y bitácora V5 viven en memoria; procedencia investigativa se registra en el grafo local | Pendiente; no hay almacenamiento autenticado, append-only externo ni sandbox de proceso |
| V4 | Investigación local-first y separar contenido web de autoridad | `ResearchEngine`, `ProvenanceGraph` y consolidación integrada registran hallazgos; el contenido no crea permisos | Integrado parcialmente; validar red real, citas circulares y calidad de fuentes sigue pendiente |

## Decisión de integración

V1–V4 quedan incorporadas como requisitos trazables de la implementación V5, no como versiones independientes ni como código documental cargado a la fuerza. Las partes seguras que ya existen se reutilizan. Los huecos de autorización de creador, linaje global, revocación asíncrona, persistencia segura y aislamiento físico requieren diseño y pruebas propias antes de habilitar acciones. El objetivo inmediato debe ser mantener el Guardián en investigación y propuestas; cualquier prueba activa de seguridad necesita autorización autenticada, alcance explícito, expiración y controles técnicos verificables.

## Cambio de seguridad aplicado al flujo de Guardián

Se retiró de `ai-chat-bridge.js` la ruta que fabricaba un resultado de herramienta exitoso y lo presentaba como evidencia para `AutonomousPolicyEngine`. Las propuestas del razonador ahora pasan a aprobación humana, con comprobación local de sesión Firebase no anónima y correo del creador configurado; las fallas se deniegan. Esto evita ejecución automática por esa ruta. La comprobación del navegador es una defensa de interfaz, no una frontera de seguridad frente a código manipulado: las reglas del servidor deben seguir imponiendo permisos para datos, y las herramientas externas necesitan un backend confiable antes de poder afirmar autorización de servidor.

La prueba de integración cubre la ausencia de ejecución automática, sesión ausente, identidad distinta y aprobación del creador configurado. La aprobación de prueba usa un adaptador simulado; no representa una acción real sobre Firebase, Cloudflare ni un sistema externo.
