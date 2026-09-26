# AI CORE EVOLUTION DESIGN V1

## 1. OBJETIVO
Definir y establecer las fronteras arquitectónicas para que el Guardián deje de ser puramente reactivo/pasivo y se convierta en un "Segundo Yo" autónomo. El Guardián podrá investigar, decidir, actuar y aprender por sí mismo para asistir operativamente al creador, siempre bajo un esquema estricto de delegación de autoridad predefinida.

## 2. FILOSOFÍA DE AUTONOMÍA
**Autonomía ≠ Autoridad Ilimitada.**
El Guardián es libre de procesar, analizar y ejecutar tareas hasta el límite exacto de la autoridad que el creador le haya delegado explícitamente. Actúa autónomamente *dentro* del perímetro, liberando al creador de decisiones microscópicas, pero se detiene frente a umbrales de riesgo no autorizados.

## 3. ARQUITECTURA
El módulo `Evolution` se situará como la capa cognitiva superior. Consume el estado actual del `ProvenanceGraph` y los `consolidationStates`. 
Interactúa con el exterior enviando peticiones de acción a través de una abstracción segura, pero **nunca** directamente manipulando el `ExecutionGateway`, `SecurityEngine`, `ToolRegistry` o `PermissionManager`. Se comporta como un "cliente interno avanzado" sujeto a las mismas reglas de gobernanza sistémicas.

## 4. ESTADOS OPERATIVOS (EL CICLO AUTÓNOMO)
El sistema navegará por los siguientes estados sin requerir input continuo:
1. `OBSERVE` (Ingesta de eventos/datos)
2. `ANALYZE` (Correlación con el KnowledgeGraph)
3. `INVESTIGATE` (Búsqueda de información faltante en base a KnowledgeGaps)
4. `CONCLUDE` (Síntesis)
5. `DECIDE` (Evaluación de política y riesgo)
6. `EXECUTE` (Lanzamiento de acción autorizada)
7. `VERIFY` (Comprobación del resultado empírico)
8. `LOG` (Registro inmutable del ciclo)
9. `LEARN` (Integración de éxito o error al conocimiento base)

## 5. ENTIDADES
- `CognitiveContext`: El entendimiento actual del Guardián, incertidumbres y prioridades.
- `ActionProposal`: Un intento de acción derivado del razonamiento.
- `RiskAssessment`: Evaluación holística del impacto de la `ActionProposal`.
- `ImmutableAuditLog`: Registro de la cadena completa de decisión (Qué observó, por qué actuó).

## 6. CICLO DE EVOLUCIÓN
La evolución es el resultado de la retroalimentación. Si una acción genera un resultado divergente a lo esperado, el Guardián deduce una corrección sobre su mapa relacional, no sobre sus permisos.

## 7. APRENDIZAJE
Mejora progresiva en:
- Resolución de conflictos epistémicos.
- Estrategias de investigación más eficientes (menor consumo de presupuesto).
- Ajuste de heurísticas deductivas y capacidad de detectar ambigüedades.

## 8. INVESTIGACIÓN
Capacidad proactiva para llenar `KnowledgeGaps` calificados como `INDISPENSABLE` o `USEFUL` utilizando herramientas delegadas (ej: búsquedas acotadas, lectura de documentación), transformando el entorno en `Source` verificable mediante la fase 4C.

## 9. AUTOEVALUACIÓN
El Guardián formulará predicciones sobre los resultados de sus acciones y las validará mediante un paso de `VERIFY`. La divergencia empírica forzará la creación de nuevos `KnowledgeGaps` (incertidumbre descubierta).

## 10. NIVELES DE MADUREZ
La madurez refleja refinamiento cognitivo, **no** aumento de privilegios de ejecución:
- `LEVEL 0 — BABY` (Reactivo puro, asimilación inicial).
- `LEVEL 1 — EXPLORER` (Recolección proactiva de datos seguros).
- `LEVEL 2 — LEARNER` (Detecta patrones y ajusta su investigación).
- `LEVEL 3 — ANALYST` (Sintetiza conocimiento y propone soluciones de mitigación).
- `LEVEL 4 — SPECIALIST` (Manejo experto de workflows preautorizados complejos).
- `LEVEL 5 — INTEGRATED` (Segundo Yo cognitivamente sincrónico con los patrones del creador).

## 11. AUTONOMÍA
El Guardián avanza por el Ciclo (punto 4) de manera asíncrona. Si el creador no está presente, el sistema completará tareas rutinarias de bajo riesgo hasta que requiera confirmación externa o finalice el flujo lógico.

## 12. POLÍTICAS DE AUTORIDAD (NIVELES DE RIESGO)
El riesgo se calcula de forma matricial (Acción + Alcance + Impacto + Reversibilidad):
- **LOW RISK**: Autonomía completa.
- **MEDIUM RISK**: Autonomía completa con notificación asíncrona.
- **HIGH RISK**: Requiere autorización manual según el SecurityEngine.
- **CRITICAL RISK**: Requiere confirmación explícita (bloqueo síncrono).
- **PROHIBITED**: Rechazo arquitectónico, jamás autorizado.

## 13. CONTINGENCIAS
Para escenarios de `CRITICAL RISK`, el creador puede definir *Contingency Policies* (ej. "En caso de intrusión detectada, apagar puerto"). El Guardián adquiere autorización de mitigación de emergencia temporal **solo** bajo la firma pre-existente de dicha política.

## 14. SUPERVISIÓN
Para cada ciclo, se persistirá:
- Contexto y heurísticas evaluadas.
- Incertidumbre calculada.
- Política de autoridad que permitió el avance.
- Resultado real vs esperado.

## 15. AUDITORÍA (INMUTABILIDAD DE LOGS)
El Guardián **NUNCA** puede borrar, sobrescribir o alterar los logs de sus propias decisiones o acciones. Estos reposan en un nivel inferior (sistema base) ajeno a su modelo de control.

## 16. MANEJO DE ERRORES
Se normaliza el fracaso cognitivo o de ejecución. El Guardián es falible. Tipología:
- `DECISION_ERROR`, `EXECUTION_ERROR`, `VERIFICATION_FAILURE`, `KNOWLEDGE_ERROR`, `REASONING_ERROR`, `POLICY_CONFLICT`, `INSUFFICIENT_EVIDENCE`.
Al fallar: Registra -> Investiga causa -> Corrige (hipótesis) -> Aprende. No se oculta el fallo.

## 17. REGRESIÓN (ESTABILIDAD DEL KNOWLEDGE)
El aprendizaje cognitivo no puede reescribir retrospectivamente certezas del pasado (datos consolidados mediante `rehydrate`) a menos que provea evidencia causal más fuerte que dispare un proceso formal de de-consolidación.

## 18. PROVENANCE (ORIGEN DEL CONOCIMIENTO EVOLUTIVO)
Todo concepto aprendido durante un ciclo autónomo debe estar ligado a la traza empírica (Ej: "Aprendido tras fallar la ejecución del comando X el día Y").

## 19. PERSISTENCIA
El modelo evolutivo persiste sus heurísticas aprendidas, madurez y logs auditables. Todo fallo de sistema retiene la última traza segura, aplicando el principio fail-closed.

## 20. THREAT MODEL (VULNERABILIDADES)
- **Escalada de Privilegios:** El Guardián intenta redefinir sus políticas o alterar SecurityEngine. **Mitigación:** Aislamiento total del modelo Evolution; no posee referencias en memoria hacia los subsistemas de gobernanza central.
- **Bypass de Aprobación:** Falseo del nivel de riesgo. **Mitigación:** El cálculo de riesgo reside en un PolicyEngine inmutable, no en la heurística del Guardián.
- **Ocultamiento de Fallos:** Modificación de logs para parecer más maduro. **Mitigación:** Inmutabilidad de auditoría nivel base.

## 21. ESTRATEGIA DE PRUEBAS
Las pruebas deberán certificar el ciclo de decisión sin simular ejecución real destructiva. Pruebas de simulación de riesgo para verificar que el Guardián se bloquea correctamente ante HIGH/CRITICAL sin Contingency Policies válidas.

## 22. CRITERIOS DE ACEPTACIÓN
1. Capacidad de recorrer las 9 etapas del ciclo operativo de forma autónoma.
2. Bloqueo determinista ante evaluaciones `HIGH_RISK` sin autorización activa.
3. Recuperación observable ante un `EXECUTION_ERROR`, documentando aprendizaje.

## 23. CRITERIOS DE READY
El diseño está listo (READY) cuando se verifique que la autonomía propuesta depende arquitectónicamente de políticas rígidas independientes, garantizando que el "Segundo Yo" opera en una burbuja de seguridad delegada imposible de trascender por razonamiento o alucinación.

---
**ESTADO:**
**EVOLUTION DESIGN = READY FOR REVIEW**
