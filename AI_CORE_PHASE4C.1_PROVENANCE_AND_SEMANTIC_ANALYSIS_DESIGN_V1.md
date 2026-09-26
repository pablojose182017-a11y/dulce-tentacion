# AI_CORE_PHASE4C.1_PROVENANCE_AND_SEMANTIC_ANALYSIS_DESIGN_V1.md

## 1. Objetivo
Diseñar una evolución para la capa cognitiva local-first (FASE 4C.1) que corrija las deficiencias detectadas en la auditoría adversarial de la FASE 4C, específicamente:
- La incapacidad de determinar verdadera independencia de fuentes (Falsa Corroboración / Echo Chamber).
- La nula detección autónoma de conflictos semánticos.
Todo esto preservando la seguridad, operando 100% localmente sin depender de un LLM externo, e integrándose de manera determinista con el KnowledgeConsolidationEngine.

## 2. Problemas Actuales (Base Auditada FASE 4C)
1. **Source Independence Vulnerable**: El algoritmo cuenta strings (`id.split('_')[0]`). Documentos clonados con distintos IDs fingen ser corroboración independiente, engañando a la consolidación (`SUPPORTED` → `CONSOLIDATED`).
2. **Ceguera Semántica**: El motor requiere que un orquestador externo declare el conflicto. Si "Dona cuesta $10" y "Dona cuesta $15" ingresan al sistema, coexistirán sin que la consolidación perciba el choque.

## 3. Arquitectura Propuesta
Inyectar dos nuevos submódulos puros (solo datos, cero autoridad):
- **ProvenanceAnalyzer**: Analiza huellas de contenido, metadatos y grafos de citación para determinar si dos fuentes son realmente independientes.
- **SemanticConflictAnalyzer**: Evalúa Claims normalizados en busca de colisiones lógicas, numéricas o estructurales, devolviendo diagnósticos de conflicto o equivalencia sin dictar la "verdad".

*Importante: LOCAL COGNITIVE CORE ≠ EXTERNAL AI PROVIDER. La inteligencia local debe resolver lo determinista; el LLM futuro resolverá lo ambiguo.*

## 4. Source Provenance Model
Un esquema enriquecido de procedencia para evaluar linaje, no solo origen:
- `sourceId`: UUID interno.
- `sourceType`: `DIRECT`, `SECONDARY`, `USER_PROVIDED`, `INFERRED`.
- `origin`: URL, Archivo, Usuario.
- `author`: Productor original (si existe).
- `creationTimestamp`: Cuándo se redactó (si existe).
- `ingestionTimestamp`: Cuándo entró al cerebro.
- `contentFingerprint`: Hash SHA-256 del contenido crudo.
- `normalizedFingerprint`: Hash del contenido sin espacios, acentos, ni puntuación.
- `language`: ISO lang.
- `parentSource`: Referencia al contenedor (ej. un libro para un capítulo).
- `derivedFrom`: Fuente en la que se basó.
- `copiedFrom`: Fuente idéntica clonada.
- `transformation`: `TRANSLATED`, `SUMMARIZED`, `NONE`.
- `scope`: Contexto espacial/organizacional.
- `independenceConfidence`: 0.0 - 1.0.

**Estados de Procedencia:** `INDEPENDENT`, `DERIVED`, `COPIED`, `DUPLICATE`, `UNKNOWN`.

## 5. Provenance Graph
Grafo epistemológico dirigido y acíclico (DAG) que traza cómo fluye la información.
- **Nodos**: Fuentes (`SOURCE`), Afirmaciones (`CLAIM`), Consolidaciones (`CONSOLIDATION`).
- **Relaciones**: `DERIVED_FROM`, `COPIED_FROM`, `TRANSLATED_FROM`, `SUPPORTS_CLAIM`.
- **Ciclos**: Estrictamente prohibidos o colapsados (A no puede derivar de B si B derivó de A).

## 6. Source Independence Algorithm
Algoritmo local para evitar la falsa corroboración:
1. **Verificación de Identidad**: Si `contentFingerprint` o `normalizedFingerprint` coinciden, es `DUPLICATE` o `COPIED`. Aporta soporte = 0 a la corroboración independiente.
2. **Verificación de Linaje**: Trazar el Grafo de Procedencia. Si `Source B` tiene relación `DERIVED_FROM -> Source A`, ambas se colapsan a un único árbol de evidencia original (`Source A`).
3. **Fallback Conservador**: Si no se puede demostrar independencia ni dependencia por falta de metadatos, el estado es `UNKNOWN`. Un `UNKNOWN` NO suma al contador de independencia para alcanzar `CONSOLIDATED`.

## 7. Claim Normalization
Representación estandarizada que el motor local puede comparar sin requerir LLM:
- `SUBJECT`: "dona_chocolate"
- `PREDICATE`: "HAS_PRICE"
- `OBJECT/VALUE`: 8000
- `UNIT`: "COP"
- `CONTEXT`: "Venta al público"
- `SCOPE`: "Dulce Tentación"
- `TIME`: { validFrom: "2026", validUntil: null }
- `KNOWLEDGE_TYPE`: "FACT"

## 8. Claim Equivalence
Dos claims se consideran `SAME_CLAIM` o `EQUIVALENT_CLAIM` si coinciden en su Subject, Predicate, Object normalizado, Scope y Time, sin importar las variaciones de lenguaje original. Las divergencias sutiles se clasifican como `RELATED_CLAIM`.

## 9. SemanticConflictAnalyzer
Este módulo opera estrictamente sobre claims normalizados y relaciones.
**Límite funcional local**: Solo dictamina conflicto si hay una contradicción algebraica, booleana o tipológica explícita. Para lenguaje natural ambiguo, el módulo dictamina `UNKNOWN`.

## 10. Conflict Taxonomy
- `VALUE_CONFLICT`: Mismo Subject, Predicate, Scope, Time; pero `Value 1 != Value 2` (Ej. Precios distintos).
- `NUMERIC_CONFLICT`: Choques de rango (Ej. X > 10 vs X = 5).
- `RELATION_CONFLICT`: Dependencias cíclicas prohibidas (A IS_A B y B IS_A A).
- `LOGICAL_CONTRADICTION`: Propiedad booleana inversa.
- `TEMPORAL_CONFLICT`: (Tratado en el Modelo Temporal, generalmente *no* es conflicto).
- `SCOPE_CONFLICT`: Mismo sujeto, misma afirmación generalizada ("Todas las donas"), refutada por un scope local ("Mi dona no").
- `DEFINITION_CONFLICT`: Fórmulas o desgloses estructurales distintos.
- `DUPLICATE_NOT_CONFLICT`: Coincidencia exacta (corroboración).
- `UNKNOWN`: Incapaz de procesar semánticamente.

## 11. Temporal Model
`validFrom` y `validUntil` y `observedAt`.
- Si Precio(2025) = 5000 y Precio(2026) = 7000: **NO ES CONFLICTO**. Es una actualización temporal (`TEMPORAL UPDATE`). El dato antiguo pasará a `SUPERSEDED` por el ConsolidationEngine.

## 12. Scope Model
- Scopes soportados: `global`, `business` (ej. "Dulce Tentación"), `project`, `user_provided_context`.
- Un claim contextualizado a `business` nunca choca con un claim contextualizado a otro `business`.
- La regla general no aplasta a la excepción local (El scope específico gana sin crear conflicto letal, se modela como herencia sobreescrita).

## 13. Integration con Consolidation
1. `ProvenanceAnalyzer` limpia la lista de evidencias (colapsa copias).
2. `SemanticConflictAnalyzer` compara el nuevo claim estructurado contra el registro actual.
3. Si hay `VALUE_CONFLICT`, notifica a `KnowledgeConsolidationEngine`.
4. El ConsolidationEngine dispara `registerConflict()` y marca el concepto/relación como `CONFLICTED`.

## 14. Integration con KnowledgeGap
Si el `SemanticConflictAnalyzer` detecta un `VALUE_CONFLICT` pero observa que uno de los Claims carece de `Scope` o `Time` (ej. no sabe de cuándo es el precio), emite un `KnowledgeGap` indicando: "Para resolver el conflicto de precios, necesito saber el año de la Fuente A".

## 15. Integration con Registros (Concept/Relationship)
- `ConceptRegistry` y `RelationshipRegistry` siguen siendo la fuente de la verdad para identidades estructurales y relaciones.
- `Claim structures` se almacenarán como metadatos anexos o derivaciones (sin duplicar el grafo principal). El `ProvenanceGraph` referencia a los IDs del Registry.

## 16. Security Isolation
`ProvenanceAnalyzer` y `SemanticConflictAnalyzer` operan en entorno sandbox in-memory (data in, data out).
- Tienen `undefined` inyectado en lugar del `ExecutionGateway` o `ToolRegistry`.
- El Conocimiento `CONSOLIDATED` no provee permisos. Epistemología no es Autoridad.

## 17. Evolution Compatibility
Preparado para FASE 5: El Evolution Engine utilizará los `KnowledgeGaps` estructurales producidos aquí ("Me falta el scope de la Fuente B") para formular búsquedas web precisas o preguntas guiadas al creador.

## 18. Test Plan P1-P30
- P1: Tres copias idénticas -> Independence = 1 (`SUPPORTED`).
- P2: Tres fuentes independientes -> Independence = 3 (`CONSOLIDATED`).
- P3: Fuente derivada -> Se colapsa en su nodo padre.
- P4: Transformación mínima -> Normalización lo detecta como clon.
- P5: Traducción -> Semantic Equivalence = DUPLICATE.
- P6: UNKNOWN provenance -> Independence = 1 (precaución).
- P7: Conflicto numérico detectado localmente.
- P8: Actualización temporal (No conflicto, es `SUPERSEDED`).
- P9: Conflicto de relación estructural (ej. mutua exclusión).
- P10: Relación cíclica permitida (ej. "RELATED_TO").
- P11: Contradicción lógica booleana explícita.
- P12: Diferencia de definición detectada.
- P13: Diferencia de scope (No conflicto).
- P14: Claims equivalentes (corroboración).
- P15: Claims relacionados pero no conflictivos.
- P16: Evitar False Positive (ej. "precio 8000" vs "precio fue 8000").
- P17: Evitar False Negative (Lenguaje ambiguo -> UNKNOWN).
- P18: Contexto User-Provided domina su scope.
- P19: Generación de `KnowledgeGap` por falta de unidad/tiempo para resolver conflicto.
- P20: Integración con Consolidation exitosa.
- P21-P22: Persistencia e Idempotencia garantizada.
- P23: Aislamiento de seguridad total.
- P24: Fallo seguro al intentar convertir knowledge en auth.
- P25-P26: Regresiones FASE 4A/4B (Pass).
- P27: Reinicio de Storage.
- P28: Conflicto sobreviene a un estado `CONSOLIDATED` (Lo devuelve a `CONFLICTED`).
- P29-P30: Construcción y protección contra ciclos del Provenance Graph.

## 19. Threat Model (Amenazas Epistemológicas)
- **Echo Chamber**: Mitigado por `normalizedFingerprint` y grafos de citación.
- **Source Duplication**: Mitigado por colapso de procedencia.
- **False Conflict**: Mitigado por `Time` y `Scope` variables obligatorias en la normalización.
- **Confidence Inflation**: Mitigado al obligar que solo nodos `INDEPENDENT` sumen al conteo.
- **Consolidation Poisoning**: Inyectar miles de claims falsos fallará si no provienen de dominios o usuarios distintos y rastreables (se atascarán en `SUPPORTED` sin cruzar el umbral de independencia).

## 20. Limitaciones Conocidas (Semantic Limits)
Sin un LLM, el sistema **NO SOPORTA**:
- Comprensión de lenguaje natural abstracto ("Está un poco caro").
- Ironía o lenguaje figurado.
- Equivalencias semánticas complejas ("Beneficio bruto" vs "Margen de operaciones antes de impuestos") a menos que estén mapeadas explícitamente en el ConceptRegistry.
Ante esto, el sistema devolverá `UNKNOWN`, evitando falsas asunciones.

## 21. Riesgos
- **Riesgo Estructural**: La necesidad de estructurar el claim normalizado (`SUBJECT`, `PREDICATE`, `OBJECT`) requiere que el parser de ingestión sea sumamente preciso (que será trabajo del futuro LLM). Si el parser es torpe, la normalización falla y el analyzer se vuelve inútil.

## 22. Migración desde FASE 4C actual
El esquema actual de procedencia simplemente se enriquecerá (`sourceId` se acompaña de los nuevos campos de hash). Relaciones y conceptos antiguos asumen un `normalizedFingerprint` vacío y `independenceConfidence` conservador hasta ser reevaluados.

## 23. Criterios de Aceptación
1. `_areSourcesIndependent` jamás debe contar copias exactas como fuentes múltiples.
2. `SemanticConflictAnalyzer` debe abortar limpiamente (retornar `UNKNOWN`) ante ambigüedades, y detonar `VALUE_CONFLICT` ante discrepancias numéricas claras dentro del mismo Scope y Time.
3. Superar exitosamente P1-P30 sin comprometer la velocidad ni violar el Security Sandbox.

---
## 24. Estado Final Obligatorio
- **PHASE 4C.1 DESIGN: READY FOR AUDIT**
- **EVOLUTION ENGINE: NOT READY**
- **REAL EXECUTION: NOT READY**
