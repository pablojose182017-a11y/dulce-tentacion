# AI_CORE_PHASE4B_RELATIONSHIP_IMPLEMENTATION.md

## 1. Auditoría previa
Se verificó el diseño de persistencia actual de `KnowledgeManager` y su esquema extendido de FASE 4A, comprobando que las nuevas entidades (`ConceptRegistry` y `RelationshipRegistry`) podían interactuar de forma no destructiva empleando la misma capa base `LocalStorageKnowledgeStore`, asignando colecciones separadas para no interferir con los documentos legacy.

## 2. Modelo implementado
Se construyeron dos nuevas capas arquitectónicas:
- **`ConceptRegistry`** (respaldado por `ConceptSchema`)
- **`RelationshipRegistry`** (respaldado por `RelationshipSchema`)

## 3. Conceptos
Cada concepto garantiza una identidad estable (evita colisiones por ID determinista `conceptId`), y se documenta con campos clave:
- `canonicalName`
- `aliases`
- `domain` (para agrupar transversalmente)
- `languageVariants`
- `sourceReferences`

## 4. Relaciones
La estructura fundamental es `sourceConceptId` → `relationType` → `targetConceptId`.
Se aseguran validaciones estrictas, impidiendo relaciones donde el origen o destino no estén previamente registrados en la red de conceptos.

## 5. Tipos soportados
Lista controlada:
`IS_A`, `PART_OF`, `HAS_PART`, `RELATED_TO`, `DEPENDS_ON`, `REQUIRES`, `DERIVED_FROM`, `EXAMPLE_OF`, `EQUIVALENT_TO`, `CONTRADICTS`, `SUPPORTS`, `SUPERSEDES`, `USED_IN`.

## 6. Identidad
- **Conceptos**: Su ID debe ser proporcionado por quien ingesta (ej: `python`).
- **Relaciones**: Generan automáticamente un ID si no se proporciona explícitamente, tolerando relaciones múltiples o contradictorias idénticas en tipo pero con distinta procedencia.

## 7. Provenance
El esquema de relación exige de manera obligatoria la declaración del campo `provenance` para responder siempre "¿de dónde salió esta relación?".

## 8. Confidence
Se respeta como un valor `0.0 - 1.0` y no asume que significa verdad absoluta, persistiendo independientemente de la confianza del concepto.

## 9. Evidence
Las relaciones incluyen el arreglo opcional `evidenceReferences` para enlazar documentos u observaciones sin duplicarlos.

## 10. Multilingüismo
Conceptos únicos admiten `languageVariants` nativamente. La prueba controlada demuestra que un concepto con ID `function` puede alojar las variantes de representación de traducción (`función`) sin bifurcar la identidad central.

## 11. Cross-domain
La prueba controlada vinculó de forma satisfactoria un concepto matemático (`percentage`) hacia uno contable (`gross_margin`) a través del enlace `USED_IN`, rompiendo silos.

## 12. Conflictos
Se resolvieron permitiendo convivir diferentes afirmaciones en la misma capa lógica. Por ejemplo, coexisten sin error una relación `IS_A` conflictiva (marcada con estado `CONFLICTED`) y otra `CONTRADICTS`, preservando procedencias.

## 13. Versionado
Apoyado a través del campo `status` que permite etiquetar relaciones con `ACTIVE`, `SUPERSEDED`, o `RETIRED`.

## 14. Persistencia
Cada sub-registry instancia su propia partición de almacenamiento. Sobreviven a reinicios en memoria, cargando limpiamente desde disco.

## 15. Consultas
Se incorporaron las consultas exigidas en `RelationshipRegistry`:
- `getRelations(conceptId)`
- `getIncomingRelations(conceptId)`
- `getOutgoingRelations(conceptId)`
- `getByType(relationType)`

## 16. Integración
No se rediseñó prematuramente la extracción semántica desde raw input (`KnowledgeIngestionEngine` y `_callAIParser`), reservándolo para fases futuras con LLM.
La búsqueda legacy (`KnowledgeManager.search()`) se certificó intacta frente a las nuevas adiciones.

## 17. Tests
Tests implementados y validados (R61 - R80) en el script `test_phase4b.js`.
- Comprobada integridad de referencias de Concept.
- Identidad, validación Enum, y Cross-Domain operacionales.

## 18. Regresión
- RESULTADO FASE 4B: 19 PASS | 0 FAIL
- No se rompió ni eliminó ningún test de la capa Document / Search legacy.

## 19. Limitaciones
La limitación actual se enfoca en la capacidad del `LocalStorageKnowledgeStore` de manejar redes de relaciones inmensas (por la restricción de 5MB por dominio en los navegadores estándar), sugiriendo IndexedDB o backend remoto cuando el volumen escale.

## 20. Riesgos
El riesgo principal está en la generación de ID conceptual. Sin control por LLM, la misma entidad descrita ambiguamente podría generar dos conceptos (ej. `python` vs `python_lang`). Para prevenir esto, se implementará más adelante deduplicación (`EQUIVALENT_TO`).

## 21. Siguiente fase
**FASE 4C — CONSOLIDACIÓN**

---

### ESTADO OBLIGATORIO
- RELATIONSHIP IMPLEMENTATION: PASS
- RELATION PERSISTENCE: PASS
- CROSS-DOMAIN TEST: PASS
- MULTILINGUAL RELATION TEST: PASS
- REGRESSION STATUS: PASS
- EVOLUTION ENGINE READINESS: NOT READY
- REAL EXECUTION READINESS: NOT READY
