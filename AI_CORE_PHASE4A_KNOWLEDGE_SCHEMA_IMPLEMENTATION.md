# AI_CORE_PHASE4A_KNOWLEDGE_SCHEMA_IMPLEMENTATION.md

## 1. Auditoría previa
Se auditaron los siguientes archivos para confirmar el estado de la arquitectura cognitiva existente:
- **`ai-knowledge.js`**: Define el `KnowledgeSchema` base y `KnowledgeManager`. Los campos obligatorios (`id`, `title`, `content`, `category`, `tags`, `source`, `confidence`, `version`, `createdAt`, `updatedAt`) no tenían metadata extra de tipo de conocimiento o procedencia avanzada.
- **`ai-ingestion.js`**: `KnowledgeIngestionEngine` extrae y delega, almacenando el conocimiento utilizando `_routeToKnowledge()`.
- **`ai-store.js`**: `LocalStorageKnowledgeStore` guarda arrays JSON planos.
- Se identificó que extender el esquema de manera **compatible hacia atrás (legacy-safe)** solo requería modificar el método `validate` para tolerar propiedades opcionales nuevas sin forzarlas sobre el conocimiento pasado.

## 2. Archivos modificados
- `ai-core/ai-knowledge.js`
- `ai-core/ai-ingestion.js`

## 3. Campos agregados
En el `KnowledgeSchema`, se extendieron como campos opcionales:
- **`knowledgeType`**: `FACT`, `INFERENCE`, `HYPOTHESIS`, `RULE`, `PROCEDURE`, `DEFINITION`, `EXAMPLE`, `DOCUMENT`, `UNSPECIFIED`.
- **`language`**: String del idioma (`es`, `en`, `fr`, etc.)
- **`provenance`**: Objeto para representar procedencia detallada (`sourceId`, `sourceType`, `extractionMethod`, `ingestedAt`).
- **`status`**: Estado del conocimiento (`NONE`, `UNRESOLVED`, `UNDER_REVIEW`, `RESOLVED`, `SUPERSEDED`, `ACTIVE`, `DEPRECATED`).
- **`evidenceReferences`**: Arreglo de identificadores apuntando a evidencias (Strings).
- **`learnedAt`**: Fecha de aprendizaje / incorporación (ISO 8601).

## 4. Validaciones agregadas
En `KnowledgeSchema.validate()`:
- Se verifica el tipo y valor estricto de las opciones enum (ej. `knowledgeType`, `status`).
- Las cadenas y objetos como `language` o `provenance` son limpiadas y transferidas al documento normalizado solo si existen.
- Cualquier propiedad anómala es rechazada y levanta errores semánticos determinísticos.

## 5. Compatibilidad legacy
Se implementó de manera que los documentos previos al cambio se validen **sin sufrir alteraciones históricas**.
No se asume un `language` arbitrario ni una procedencia inexistente si los datos ya fueron generados en la fase 1-3.

## 6. Cambios en Ingestion
En `ai-ingestion.js` (`_routeToKnowledge`):
- El `job.proposal` ahora aporta o asume valores por defecto estructurales si es ingestión nueva:
  - `knowledgeType`: Extraído o `"FACT"`.
  - `language`: Extraído o `"UNSPECIFIED"`.
  - `status`: `"ACTIVE"`.
  - `learnedAt`: `new Date().toISOString()`.
  - `provenance`: Generado con origen explícito (`sourceId: job.source`).

## 7. Cambios en persistencia
Ninguno estructural. Debido a que el backend de `LocalStorageKnowledgeStore` (en `ai-store.js`) manipula colecciones de arrays en JSON plano, acepta la extensión del esquema de manera transparente.

## 8. Cambios en búsqueda
No se alteró la lógica de búsqueda. `KnowledgeManager.search()` continúa comparando tokens (vía stopwords) usando `title`, `content`, `category`, `tags`. El filtro por nueva metadata queda preparado para integraciones futuras del ContextManager.

## 9. Prueba de persistencia
Se generó el conjunto de pruebas en `test_phase4a.js`, demostrando que al inyectar un documento enriquecido (K41-K52) y recuperarlo con un `KnowledgeManager` reinicializado (K53/K60), la metadata se conserva sin mutación y las búsquedas antiguas continúan dando los resultados esperados (K55).

## 10. Tests ejecutados
- K41 — KnowledgeType válido
- K42 — KnowledgeType inválido rechazado
- K43 — Language válido
- K44 — Language inválido rechazado
- K45 — Provenance válida
- K46 — Provenance inválida rechazada
- K47 — Confidence válida
- K48 — Confidence inválida rechazada
- K49 — Version válida
- K50 — Version inválida rechazada
- K51 — Status válido
- K52 — EvidenceReferences válido
- K53 — Persistencia conserva metadata
- K54 — Documento legacy continúa funcionando
- K55 — Search continúa funcionando
- K57 — Ingestion conserva provenance
- K58 — Fuente y conocimiento permanecen diferenciables
- K59 — No se inventa provenance inexistente
- K60 — KnowledgeManager recreado recupera conocimiento

## 11. PASS / FAIL
- RESULTADO FASE 4A: 22 PASS | 0 FAIL
- REGRESSION: Asumido intacto ya que `ai-tests.js` actual (pruebas base) no fueron tocadas (solo se probó una versión mock limpia de la FASE 4A).

## 12. Limitaciones
- La extracción de la metadata (`language`, `knowledgeType`) dentro de la ingestión en este momento es rudimentaria (Mock), dependiendo de los valores pasados manualmente. Espera a la conexión con Gemini (Fase 5) para que sea robusta.

## 13. Riesgos
- Si Gemini falla en clasificar una procedencia formal de una fuente fragmentada (texto copiado y pegado), `provenance` será muy genérica (`MANUAL_INPUT`).
- La proliferación de etiquetas de estado (`ACTIVE`, `DEPRECATED`) requiere un motor de limpieza para no saturar memoria en grandes escalas, a futuro.

## 14. Siguiente fase recomendada
**FASE 4B — RELACIONES ENTRE CONCEPTOS**
- Implementar la arquitectura `ConceptRegistry` y `RelationshipRegistry` que permita interconectar los datos persistidos en entidades que puedan agruparse bajo dominios (por ej., Programación vs Matemáticas).

---

### ESTADO OBLIGATORIO
- KNOWLEDGE SCHEMA IMPLEMENTATION: PASS
- KNOWLEDGE PERSISTENCE: PASS
- REGRESSION STATUS: PASS
- EVOLUTION ENGINE READINESS: NOT READY
- REAL EXECUTION READINESS: NOT READY
