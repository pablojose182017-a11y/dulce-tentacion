# AI_CORE_PHASE4C_KNOWLEDGE_CONSOLIDATION_DESIGN_V1.md

## 1. Auditoría Real de la Arquitectura Actual
Se revisó la implementación de `ai-knowledge.js`, `ai-store.js`, `ai-ingestion.js`, `ai-context.js`, `ai-reasoning.js`, así como `ConceptRegistry` y `RelationshipRegistry` introducidos en FASE 4A y 4B.
- **Capacidades Reales Actuales**:
  - `evidenceReferences` y `provenance` existen como campos de almacenamiento, pero no existe lógica que cruce referencias para detectar orígenes duplicados o copias directas.
  - `confidence` es actualmente un número inyectado en `ai-ingestion.js` (e.g. `1.0`), careciendo de evaluación matemática o bayesiana basada en la suma de evidencias.
  - `conflicts` se representa por el estado `CONFLICTED` en relaciones, y el motor de ingestión detecta colisiones básicas de ID léxicos, pero no resuelve semántica ni mantiene historiales de resolución de conflictos (`ConflictRecord` no existe).
  - `versioning` existe (`version++`), pero no liga las cadenas históricas a las decisiones cognitivas (por qué se actualizó).
  - `Concept identity` y `Relationship validation` están activos (los IDs no cambian y son estables).

## 2. Estados de Consolidación (Máquina de Estados Conceptual)
Se proponen los siguientes estados cognitivos para cada unidad de conocimiento (Claim, Concept, Relationship):
- **`RAW`**: Conocimiento bruto, recién parseado. No estructurado semánticamente.
- **`STRUCTURED`**: Se mapeó a entidades/relaciones pero sin contrastar contra la base existente.
- **`SUPPORTED`**: Posee al menos una evidencia primaria o secundaria válida trazable (no es una alucinación desconectada).
- **`CONSOLIDATED`**: Posee múltiples fuentes independientes que lo corroboran (corroboración cruzada) o ha sido ratificado explícitamente por el usuario creador (alta autoridad). **No significa "verdad absoluta", sino "ampliamente consensuado por la evidencia disponible"**.
- **`CONFLICTED`**: Evidencia mutuamente excluyente o inconsistente sobre un mismo Claim.
- **`UNCERTAIN`**: Evidencia débil, fuente dudosa, o una inferencia arriesgada no corroborada.
- **`SUPERSEDED`**: Reemplazado por una versión posterior mejor soportada o más moderna.

## 3. Evidencia
La evidencia debe tipificarse:
- `DIRECT_SOURCE`: Dato directo (ej. log del servidor, documento de la API oficial).
- `SECONDARY_SOURCE`: Artículo que cita a un tercero.
- `USER_PROVIDED`: Afirmado explícitamente por el creador.
- `DERIVED`/`INFERRED`: Deducción del propio modelo (menor autoridad por defecto).

## 4. Claims
Un "Claim" (afirmación) es el puente entre el documento y la relación o el concepto. Es la unidad mínima sujeta a evaluación de verdad. Múltiples fuentes pueden aportar al mismo Claim.

## 5. Múltiples Fuentes
**Regla Anti-Copia**: Tres documentos distintos con texto cuasi-idéntico se considerarán **una sola fuente primaria** con referencias redundantes, no tres corroboraciones independientes. Se evaluará el linaje de la procedencia (`provenance.sourceId`).

## 6. Conflictos
Diseño de la entidad **`ConflictRecord`**:
- `conflictId`: UUID.
- `claimA_Id`, `claimB_Id`: Referencias a los Claims.
- `provenanceA`, `provenanceB`: Origen de cada parte.
- `status`: `UNRESOLVED` | `RESOLVED`.
- Mantiene vivas ambas ramificaciones sin sobrescribir ninguna.

## 7. Resolución de Conflictos
Cuando aparece nueva evidencia (`Fuente C`) que apoya a `B`, el estado del conflicto cambia a `RESOLVED` a favor de `B`.
- `A` pasa a `SUPERSEDED` o se mantiene en el historial.
- El `ConflictRecord` se guarda indicando la resolución. Nunca se destruye el historial del debate cognitivo.

## 8. Confidence (Confianza)
`confidence ≠ truth`. La confianza no será un número mágico (`0.99`), sino un vector o matriz que responda a:
- Confianza en la **extracción** (¿entendió bien el modelo?).
- Confianza en la **fuente** (¿es confiable el origen?).
- Confianza en la **corroboración** (¿cuántas fuentes independientes?).

## 9. Inferencias
- **FACT**: "X es Y según el documento Z."
- **INFERENCE**: "Dado X y dado Z, probablemente W."
La inferencia se marca permanentemente como tipo `INFERENCE`. Incluso si se consolida matemáticamente, jamás muta a `FACT` a menos que se introduzca un documento externo que lo declare como `FACT`.

## 10. Relaciones
Las relaciones (`Python -> IS_A -> Programming Language`) inician en estado `PROPOSED`. Si el parser detectó evidencia directa, avanza a `SUPPORTED`. Si se cruza con otra fuente o el usuario lo confirma, pasa a `CONSOLIDATED`.

## 11. Knowledge Gaps
Diseño de **`KnowledgeGap`**:
Registro explícito de ausencias cognitivas necesarias para completar un dominio.
- `conceptId`: Concepto base.
- `missingLink`: Qué se busca (ej. "Relación con Base de Datos").
- `reason`: Por qué es necesario (ej. "Prerrequisito detectado en Documento Y").

## 12. Coverage (Cobertura)
Medición no numérica (evitando porcentajes mágicos). Se define como la relación entre los `Claims` consolidados de un dominio y los `KnowledgeGaps` pendientes.

## 13. Versionado
Si un conocimiento se actualiza sustancialmente, se clona el registro, se promueve la nueva versión y el registro anterior asume el estado `SUPERSEDED`. Ambos mantienen su UUID base o enlaces relacionales `replaces / replacedBy`.

## 14. User-Provided Knowledge
Categoría de alta prioridad.
**Significado Estricto**: "El creador afirma X dentro del contexto de este proyecto".
No se extrapola a verdad universal externa, sino a máxima autoridad de contexto local.

## 15. Persistencia
Nuevos repositorios propuestos:
- `ConsolidationRegistry`: Almacena el estado evaluado.
- `ConflictRegistry`: Almacena `ConflictRecords`.
- `GapRegistry`: Almacena `KnowledgeGaps`.
Todo apoyado en el `KnowledgeStore` base.

## 16. Audit Trail Cognitivo
Historial Inmutable de cambios de estado cognitivo (`RAW -> SUPPORTED -> CONSOLIDATED`). Distinto y separado del log de ejecución del sistema (`ExecutionGateway`). Solo traza el razonamiento.

## 17. Integración con ReasoningEngine
El Reasoning Engine lee el estado de consolidación para adaptar su discurso:
- **CONSOLIDATED**: Se presenta como certeza fundamentada.
- **UNCERTAIN**: Se inyectan disclaimers ("Basado en una inferencia sin soporte claro...").
- **CONFLICTED**: El modelo presenta obligatoriamente ambas posturas ("La fuente A dice X, pero la fuente B dice Y").

## 18. Relación Futura con EvolutionEngine
Evolution Engine actuará como el agente activo que buscará evidencias para resolver `KnowledgeGaps` o resolver `ConflictRecords` a través de web hooks, investigaciones, o preguntas al usuario.

## 19. Regla de "No Volver a Preguntar"
Antes de que el Evolution Engine (o el Bot) formule una pregunta al creador, debe consultar el `KnowledgeManager`. Si el dato existe, no tiene conflictos, está disponible y su `confidence/estado` es suficiente para la tarea, **está estrictamente prohibido preguntar**. Se solicitará solo si falta contexto, está corrompido, obsoleto o hay lagunas (`Gaps`).

## 20. Seguridad
La Consolidación es puramente DATA (Memoria Semántica). Nunca tendrá capacidad de alterar directivas de sistema (`SecurityEngine`, roles, herramientas). Su única salida es el refinamiento del estado cognitivo.

## 21. Tests Futuros Propuestos (No Implementados Aún)
- C1: Transición `RAW -> STRUCTURED`.
- C2: Transición `STRUCTURED -> SUPPORTED` vía adición de evidencia.
- C3: `SUPPORTED -> CONSOLIDATED` (Multi-source independent corroboration).
- C4: Generación de `CONFLICTED` por contradicción documentada.
- C5: Resolución de conflicto preservando el historial completo.
- C6: `INFERENCE` no muta a `FACT`.
- C7: `Relationship` consolidada.
- C8: `Provenance` trazable.
- C9/C10: Detección de fuentes clonadas vs independientes.
- C11: Inserción y consulta de `KnowledgeGap`.
- C12: Recuperación de data `SUPERSEDED` para histórico.
- C13: Alcance del conocimiento `USER_PROVIDED`.
- C14: Prevención de preguntas repetitivas.
- C15: Adaptación de prompt en base al nivel de consolidación.
- C16: Persistencia de registros de consolidación.
- C17: `Audit Trail Cognitivo`.
- C18: Barrera de Autoridad (Seguridad).

## 22. Arquitectura Propuesta
Módulo **`KnowledgeConsolidationEngine`**:
- Actúa como servicio intermedio y cron job de fondo.
- Suscribe a eventos de ingestión.
- Re-evalúa el grafo cuando entra evidencia nueva.
- Genera `ConflictRecords` y `KnowledgeGaps` pasivamente.

## 23. Migración
Los datos de la FASE 4A/4B, al no tener `ConsolidationRecord`, se mapearán dinámicamente como `STRUCTURED` o `SUPPORTED` basados en su campo `provenance` existente. Ningún registro será eliminado.

## 24. Riesgos
- **Echo Chamber**: Falsa consolidación porque 10 documentos de internet copiaron el mismo artículo original equivocado.
- **Falsa Certeza**: Asignar "Verdad Absoluta" a estados "CONSOLIDATED" cuando solo refleja volumen de información.
- **Bloat de Historial**: Saturación del Store guardando cada pequeño cambio de consolidación.
- **Sobreconfianza de Inferencia**: El motor de razonamiento (futuro Gemini) tratando las inferencias antiguas como hechos establecidos.
- **Puntuaciones Mágicas**: Caer en cálculos heurísticos de `confidence` sin rigor matemático.

## 25. Siguiente Fase
**FASE 5 — EVOLUTION ENGINE** (Una vez que se apruebe e implemente esta FASE 4C de Consolidación).

---

### ESTADO OBLIGATORIO
KNOWLEDGE CONSOLIDATION DESIGN: READY
EVOLUTION ENGINE READINESS: NOT READY
REAL EXECUTION READINESS: NOT READY
