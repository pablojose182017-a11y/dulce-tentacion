# AI_CORE_KNOWLEDGE_REPRESENTATION_DESIGN_V1.md
## FASE 3 — AUDITORIA Y DISENO DE REPRESENTACION DEL CONOCIMIENTO
**Proyecto:** Dulce Tentacion — AI Core
**Fecha:** 2026-09-26
**Autor:** Antigravity (solo lectura, sin modificaciones)
**Estado:** EXCLUSIVAMENTE AUDITORIA Y DISENO — SIN IMPLEMENTACION

---

## 1. AUDITORIA DEL MODELO ACTUAL

### 1.1 El KnowledgeDocument actual (evidencia del codigo)

Definicion en `KnowledgeSchema.validate()` — `ai-knowledge.js:17-51`

**CAMPOS OBLIGATORIOS ACTUALES:**

| Campo | Tipo | Significado real (del codigo) |
|-------|------|-------------------------------|
| `id` | string | ID unico. Formatos: `kdoc_*`, `legacy_*`, `phase2_*` |
| `title` | string | Titulo del documento. Score de busqueda: 4 |
| `content` | string | Texto completo. Score de busqueda: 1 |
| `category` | string | Dominio libre (string sin ontologia). Score: 3 |
| `tags` | string[] | Palabras clave. Score: 5 (maximo peso) |
| `source` | string | URI/cadena de procedencia |
| `confidence` | number 0-1 | Confianza en la PROCEDENCIA, no verdad factual. (ai-ingestion.js:136-138) |
| `version` | number >=1 | Incrementa con `update()`. Sin historial del estado anterior |
| `createdAt` | string\|null | ISO timestamp. Puede ser null (LegacyRAGAdapter) |
| `updatedAt` | string\|null | ISO timestamp. Actualizado automaticamente en `update()` |

**CAMPOS AUSENTES POR DISENO:**

- `lang` — Sin soporte de idioma
- `knowledgeType` — Sin distincion FACT/INFERENCE/HYPOTHESIS
- `relatedConcepts` — Sin relaciones entre documentos
- `derivedFrom` — Sin procedencia de conocimiento derivado
- `supersededBy` — Sin modelo de obsolescencia
- `conflictState` — Conflictos viven solo en el Job de ingesta (efimero)

### 1.2 Almacenamiento (`ai-store.js`)

`LocalStorageKnowledgeStore` guarda colecciones como arrays JSON planos.
Una coleccion = un key de `localStorage`. Sin indices. Sin particionado. Sin relaciones entre colecciones.
Limite del backend: ~5MB por origen.

### 1.3 Busqueda (`ai-knowledge.js:144-231`)

Algoritmo: tokenizacion lexica + scoring por campo.
Stopwords: SOLO en espanol (35+ palabras). Palabras inglesas entran sin filtrar como ruido.
Sin semantica. Sin embeddings. Sin ontologia.

**Limitaciones reales (verificadas en FASE 2):**
- `"python"` encuentra doc con `"Python"` — OK (keyword identica en ambos idiomas)
- `"funcion"` NO encuentra doc con `"function"` — tokens distintos
- `"lenguaje de programacion"` NO encuentra `"programming language"` — tokens distintos

### 1.4 Gestion de versiones (`ai-knowledge.js:103-124`)

`update(id, updates)` incrementa `version` y actualiza `updatedAt`.
Sin historial: el documento anterior se pierde con cada `update()`.
Sin campo `supersededBy`, sin snapshot historico.

### 1.5 Conflictos (`ai-ingestion.js:89-118`)

**Nivel 1** — Colision exacta de ID deterministico:
- Mismo contenido → `idempotent_ignore`
- Diferente contenido → `RESOLUTION_REQUIRED`

**Nivel 2** — Candidatos lexicos (`matchRatio >= 0.5`):
- Documentos similares → `RESOLUTION_REQUIRED`

El conflicto se registra en `job.conflicts[]` (efimero). Cuando el Job termina, la informacion de conflicto desaparece del sistema. No persiste en el `KnowledgeManager`.

### 1.6 KnowledgeIngestionEngine (`ai-ingestion.js`)

Maquina de estados: `RECEIVED → ANALYZING → STRUCTURAL_VALIDATION → CONFLICT_EVALUATION → ROUTING → STORED/DISCARDED/DELEGATED/RESOLUTION_REQUIRED`

`_callAIParser()` usa mock deterministico (sin LLM real).
Extrae: intent, domain, entities, coreKnowledge (texto crudo sin transformar), confidence=0.9 (hardcoded).

IMPORTANTE: No extrae conceptos individuales, no detecta relaciones, no distingue hechos de inferencias. El "knowledge" extraido es texto con metadata de clasificacion, no un grafo de conceptos.

### 1.7 ContextManager (`ai-context.js`)

Transporta el conocimiento como lista plana de documentos:
`blocks.knowledge.content = KnowledgeDocument[]`

Sin grafo. Sin relaciones. Sin jerarquias. Sin conceptos separados del texto.

### 1.8 ReasoningEngine (post FASE 2)

CASO 5 (nuevo, FASE 2): Itera documentos → crea una Evidence por documento → crea una Hypothesis por Evidence.
No razona SOBRE el contenido, lo expone.
Anti-hallucination check: verifica que `provenanceSourceId` exista en el set de IDs disponibles.

### 1.9 MemoryManager (`ai-memory.js`)

- Corto plazo: array de turns `{role, text, timestamp}` — volatil (sesion)
- Largo plazo: clave-valor en LocalStorage `{id, value, updatedAt}` — sin estructura semantica

Sin distincion entre memoria episodica y semantica. Sin conexion entre memoria y KnowledgeManager.

### 1.10 LegacyRAGAdapter (`ai-legacy-rag-adapter.js`)

Convierte `window.costosState` a texto plano:
`"Receta: Pan de Queso. Rendimiento: 10 unidades. Precio sugerido: $2000..."`
`"Insumo: Harina. Unidad: kg. Costo unitario: $3000. Merma: 5%."`

El contenido numerico queda encapsulado como texto, no como dato estructurado calculable. Sin relaciones entre insumos y recetas en el nivel de KnowledgeManager.

---

## 2. CAPACIDADES EXISTENTES

- **Almacenamiento estructurado**: Campos obligatorios validados, CRUD completo, IDs deterministicos
- **Busqueda lexica**: Tokenizacion + stopwords espanol + scoring por campo + matchRatio
- **Ingesta con conflictos**: Idempotencia, `RESOLUTION_REQUIRED`, trazabilidad de job
- **Versionado basico**: Incremento de version + updatedAt. Sin historial
- **Confianza en procedencia**: Campo confidence documenta la fuente, no la verdad
- **Flujo cognitivo conectado** (FASE 2): KM → CM → RE → Provider funcional (43/43 tests)
- **Seguridad y gobernanza**: 6 niveles, circuit breaker, lista negra, approval one-shot

---

## 3. LIMITACIONES

| ID | Severidad | Descripcion |
|----|-----------|-------------|
| L1 | CRITICA | Sin distincion DOCUMENTO vs CONCEPTO. El sistema almacena texto, no conceptos |
| L2 | CRITICA | Sin relaciones entre documentos/conceptos (IS_A, PART_OF, DEPENDS_ON) |
| L3 | CRITICA | Sin distincion FACT/INFERENCE/HYPOTHESIS/RULE/PROCEDURE |
| L4 | CRITICA | Sin soporte multilingue arquitectonico. Sin campo `lang` |
| L5 | MEDIA | Sin historial de versiones. `update()` sobrescribe el estado anterior |
| L6 | MEDIA | Conflictos no persisten en el documento. Viven solo en el Job efimero |
| L7 | MEDIA | Sin consolidacion. Cada documento es una isla independiente |
| L8 | BAJA | Backend LocalStorage (5MB). No escalable |
| L9 | BAJA | Contenido numerico del LegacyRAGAdapter no es calculable |
| L10 | BAJA | Sin metricas de cobertura de conocimiento |

---

## 4. MODELO CONCEPTUAL DE KnowledgeDocument

El KnowledgeDocument debe evolucionar separando el TEXTO del conocimiento de la METADATA que lo describe.

**PROPUESTA (sin implementar):**

```
KnowledgeDocument {
  // === IDENTIDAD (existente, sin cambios) ===
  id          : string         // ID deterministico — NO cambia nunca
  version     : number         // Entero >= 1, incrementa con update()
  createdAt   : string|null    // ISO timestamp de creacion original
  updatedAt   : string|null    // ISO timestamp de ultima modificacion

  // === CONTENIDO (existente, sin cambios) ===
  title       : string         // Titulo del documento
  content     : string         // Texto completo del conocimiento
  category    : string         // Dominio (ej: "Programming", "Contabilidad")
  tags        : string[]       // Palabras clave para busqueda

  // === PROCEDENCIA (existente, a refinar) ===
  source      : string         // URI o identificador de la fuente
  confidence  : number         // 0-1: confianza en la PROCEDENCIA (semantica ya correcta)

  // === CAMPOS NUEVOS PROPUESTOS ===
  lang          : string|null  // ISO 639-1: "es", "en", "fr". Null = desconocido
  knowledgeType : string       // "FACT" | "INFERENCE" | "HYPOTHESIS" | "RULE" | "PROCEDURE" | "DEFINITION"
  conflictState : string       // "NONE" | "UNRESOLVED" | "UNDER_REVIEW" | "RESOLVED" | "SUPERSEDED"
  conflictsWith : string[]     // IDs de documentos en conflicto con este
  derivedFrom   : string[]     // IDs de documentos de los que se deriva este
  supersededBy  : string|null  // ID del documento que reemplaza a este
  conceptRefs   : string[]     // IDs de conceptos que este documento ilustra/define (relacion futura)
}
```

**CAMPOS QUE NO SE AGREGAN (y por que):**
- `"factualTruth": Boolean` — El sistema no puede determinar verdad absoluta
- `"translationOf": string` — Se maneja en el nivel de Concept, no de Document
- `"embedding": number[]` — Requiere LLM externo. Fuera de scope sin Gemini

---

## 5. MODELO CONCEPTUAL DE Concept

Un Concept es una entidad semantica independiente del documento que la expresa.
`"Python"` es un concepto. `"Python is a language"` es un documento que describe ese concepto.

**PROPUESTA (sin implementar):**

```
Concept {
  // IDENTIDAD
  conceptId       : string       // "concept_python_programming_language"
  canonicalName   : string       // Nombre principal en idioma de referencia

  // CLASIFICACION
  domain          : string       // "Programming", "Mathematics", "Accounting"
  subDomain       : string|null

  // CONOCIMIENTO
  definitions     : { lang, text, sourceDocId, confidence }[]
  properties      : { key, value, sourceDocId }[]
  examples        : { text, lang, sourceDocId }[]
  procedures      : { title, steps: string[], sourceDocId }[]
  rules           : { title, expression, variables: {name,description}[], sourceDocId }[]
  prerequisites   : string[]     // conceptIds necesarios para entender este concepto

  // RELACIONES
  relatedConcepts : { conceptId, relationType, bidirectional, strength, sourceDocId }[]

  // MULTILINGÜISMO
  languageVariants : { lang, name, aliases: string[] }[]

  // PROCEDENCIA
  sourceReferences : string[]    // IDs de KnowledgeDocument que fundamentan este concepto
  confidence       : number      // Confianza promedio de las fuentes

  // ESTADO
  version         : number
  status          : "DRAFT" | "ACTIVE" | "DEPRECATED" | "SUPERSEDED"
  createdAt       : string
  updatedAt       : string

  // CONFLICTOS
  conflictState   : string       // "NONE" | "UNRESOLVED" | "UNDER_REVIEW" | "RESOLVED"
  conflictsWith   : string[]
}
```

**Evaluacion de campos:**
- `procedures` y `rules` son criticos para representar formulas y procedimientos
- `prerequisites` es fundamental para Knowledge Gaps (Evolution Engine)
- `languageVariants` es el mecanismo de multilingüismo sin depender de traduccion automatica
- `sourceReferences` cierra la cadena de provenance entre Concept y Document
- Todos los campos tienen justificacion funcional directa

---

## 6. MODELO CONCEPTUAL DE Relationship

Las relaciones se representan dentro de cada Concept en `relatedConcepts[]`.
Para navegacion bidireccional eficiente: un `RelationshipRegistry` separado.

**TIPOS DE RELACION PROPUESTOS:**

| Tipo | Ejemplo | Prioridad |
|------|---------|-----------|
| `IS_A` | Python IS_A programming_language | CRITICA |
| `PART_OF` | function PART_OF programming | CRITICA |
| `HAS_PART` | programming HAS_PART function | Inferida de PART_OF |
| `DEPENDS_ON` | machine_learning DEPENDS_ON linear_algebra | CRITICA para Knowledge Gaps |
| `RELATED_TO` | algorithm RELATED_TO mathematics | UTIL (fallback provisional) |
| `DERIVED_FROM` | profit_margin DERIVED_FROM revenue + cost | CRITICA para dominios matematicos |
| `EXAMPLE_OF` | quicksort EXAMPLE_OF sorting_algorithm | UTIL |
| `CONTRADICTS` | source_A CONTRADICTS source_B | IMPORTANTE para conflictos |
| `SUPPORTS` | evidence_X SUPPORTS hypothesis_Y | UTIL para ReasoningEngine |
| `SUPERSEDES` | Python_3 SUPERSEDES Python_2 | IMPORTANTE para versionado |
| `EQUIVALENT_TO` | percentage EQUIVALENT_TO porcentaje | CRITICA para deduplicacion |
| `TRANSLATION_OF` | function TRANSLATION_OF funcion | Especializa EQUIVALENT_TO |
| `USED_IN` | percentage USED_IN margin_calculation | UTIL para cross-domain |

**TIPOS QUE NO SE INCLUYEN:**
- `CAUSES/CAUSED_BY` — Complejidad causal. Requiere razonamiento probabilistico
- `PRECEDES/FOLLOWS` — Se maneja dentro de `Concept.procedures[]`
- `IS_NOT` — Negacion logica. Extremadamente dificil sin LLM

---

## 7. RELACIONES ENTRE DOMINIOS (CROSS-DOMAIN)

**SITUACION ACTUAL:** Las categorias son strings libres independientes.
`"Programming"`, `"Mathematics"`, `"Accounting"` son strings sin relacion entre si.

**PROPUESTA DE ONTOLOGIA DE DOMINIOS MINIMA (sin implementar):**

```
DomainRegistry {
  "Mathematics":   { parent: null,             children: ["Arithmetic","Algebra","Statistics","LinearAlgebra"] }
  "Programming":   { parent: null,             children: ["OOP","Algorithms","DataStructures"] }
  "Accounting":    { parent: "BusinessFinance", children: ["CostAccounting","FinancialAccounting"] }
  "Finance":       { parent: "BusinessFinance", children: ["CorporateFinance","PersonalFinance"] }
  "Marketing":     { parent: "BusinessFinance", children: [] }
  "BusinessFinance":{ parent: null,            children: ["Accounting","Finance","Marketing"] }
}
```

**Relaciones cross-domain via `Concept.relatedConcepts`:**

```
porcentaje (Mathematics)
  → USED_IN → margen_bruto (Accounting)
  → USED_IN → rentabilidad (Finance)

margen_bruto (Accounting)
  → DERIVED_FROM → revenue (Accounting)
  → DERIVED_FROM → costo_de_ventas (Accounting)
  → SUPPORTS → pricing_decision (Marketing)

linear_algebra (Mathematics)
  → DEPENDS_ON (inverso) → machine_learning (Programming)
```

**Lo que este modelo habilita:**
- Dado un concepto, navegar a conceptos relacionados en otros dominios
- Para "explicar rentabilidad" encontrar que necesita "porcentaje" (Mathematics)
- Evolution Engine puede detectar: "Para machine_learning falta linear_algebra (Mathematics)"

---

## 8. MODELO DE EVIDENCE

**Estado actual (ai-reasoning.js):**

```javascript
{
  id, type, provenanceSourceId, content,
  verificationStatus, reasoningConfidence
}
```

**Propuesta enriquecida (sin implementar):**

```
Evidence {
  id                  : string
  type                : "FACT" | "INFERENCE" | "OBSERVATION" | "RULE" | "PROCEDURE"
  provenanceSourceId  : string       // ID del KnowledgeDocument fuente
  conceptRefs         : string[]     // IDs de Concepts que esta evidencia ilustra
  content             : string       // Fragmento relevante (no el doc completo)
  verificationStatus  : "UNVERIFIED" | "LOCAL_STORE" | "MULTI_SOURCE_CONFIRMED" | "CONFLICTED"
  reasoningConfidence : number
  uncertaintyFactors  : string[]
  contradictedBy      : string[]     // IDs de otras Evidence que contradicen esta
}
```

**Cambio importante:** En el modelo actual `content` es el documento completo. En el modelo propuesto debe ser el FRAGMENTO especificamente relevante para la hipotesis. Esto requiere extraccion de fragmentos (requiere LLM para alta calidad).

---

## 9. MODELO DE PROVENANCE

**Estado actual:** `source` = string URI. `confidence` = confianza en la fuente. Sin cadena de derivacion.

**Modelo propuesto:**

```
ProvenanceChain {
  original: {
    source      : string    // URI de la fuente original
    sourceType  : "MANUAL_INPUT" | "LEGACY_COSTOSSTATE" | "FILE_IMPORT" | "WEB" | "LLM_EXTRACT"
    ingestedAt  : string    // ISO timestamp
    ingestJobId : string    // ID del job de ingesta
  }
  derivations: {
    derivedAt   : string
    derivedBy   : "CONSOLIDATION" | "MANUAL" | "EVOLUTION_ENGINE"
    fromDocIds  : string[]
    operation   : "MERGE" | "EXTRACT" | "SYNTHESIZE"
    confidence  : number
  }[]
}
```

**Principio:** "Consolidado" NO significa "verdad absoluta". La cadena de procedencia debe sobrevivir a cualquier operacion de consolidacion o derivacion.

---

## 10. FACT / INFERENCE / HYPOTHESIS / RULE / PROCEDURE

Esta es la separacion mas critica para la integridad cognitiva del sistema.

**FACT (HECHO)**
- "La fuente X afirma que A en el momento T."
- No es verdad absoluta. Es lo que una fuente especifica afirma.
- Puede coexistir con un FACT contradictorio de otra fuente → ese es un CONFLICT.
- Confidence: confianza en la fuente, no en la veracidad.

**INFERENCE (INFERENCIA)**
- "Si A y B son ciertos, probablemente C."
- Derivada de uno o mas FACTs mediante razonamiento.
- Confidence: SIEMPRE menor que el menor de sus premisas.
- NO puede convertirse automaticamente en FACT. Requiere confirmacion.

**HYPOTHESIS (HIPOTESIS)**
- "C podria explicar el comportamiento observado."
- Una posibilidad propuesta para investigacion.
- Estados: `GENERATED → SUPPORTED | UNSUPPORTED | CONTRADICTED | REJECTED`
- El ReasoningEngine ya implementa esta estructura. Requiere conectarse al modelo Concept.

**RULE (REGLA)**
- "Si condicion X, aplicar accion Y." / "Si A entonces B."
- No es descripcion, es prescripcion o relacion logica.
- Ejemplo: "Si margen < 20%, revisar costos."

**PROCEDURE (PROCEDIMIENTO)**
- "Para calcular X: paso 1, paso 2, paso 3."
- Secuencia ordenada con variables de entrada y salida.
- Ya existe en `Concept.procedures[]` en el modelo propuesto.

**DISTINCION EN EL SCHEMA:**
Campo `knowledgeType` en `KnowledgeDocument`:
`"FACT" | "INFERENCE" | "HYPOTHESIS" | "RULE" | "PROCEDURE" | "DEFINITION"`

**REGLA FUNDAMENTAL:**
- Una INFERENCE NUNCA se promueve automaticamente a FACT.
- Una HYPOTHESIS NUNCA se promueve automaticamente a INFERENCE.
- La promocion de tipo SIEMPRE requiere confirmacion humana o nueva evidencia documentada.

---

## 11. MODELO DE CONFLICTOS

**Estado actual:** Los conflictos viven en `job.conflicts[]` (efimero). Desaparecen cuando el Job termina.

**Modelo propuesto:**

```
ConflictRecord {
  conflictId    : string     // ID unico del conflicto
  status        : "UNRESOLVED" | "UNDER_REVIEW" | "RESOLVED" | "SUPERSEDED"
  detectedAt    : string
  detectedBy    : "INGESTION_ENGINE" | "REASONING_ENGINE" | "EVOLUTION_ENGINE" | "MANUAL"

  parties: [                 // Minimo 2
    { docId, claim, source, confidence, createdAt }
  ]

  nature        : "FACTUAL" | "TEMPORAL" | "SCOPE" | "LINGUISTIC"
                 // FACTUAL: dos fuentes afirman valores incompatibles
                 // TEMPORAL: misma fuente en momentos distintos
                 // SCOPE: ambas correctas en contextos diferentes
                 // LINGUISTIC: aparente conflicto por diferencia de idioma

  resolution    : {
    resolvedAt, resolvedBy, resolutionNote, survivingDocId
  } | null
}
```

**ESTADOS:**
- `UNRESOLVED`: Detectado. Ninguna fuente privilegiada automaticamente.
- `UNDER_REVIEW`: Un agente lo esta analizando.
- `RESOLVED`: Se determino cual fuente es mas confiable. Ambos documentos subsisten.
- `SUPERSEDED`: Nueva version reemplaza ambas fuentes en conflicto.

**PRINCIPIO FUNDAMENTAL:** Nunca se elige automaticamente una fuente sobre otra. Solo el Creador puede marcar un conflicto como RESOLVED.

---

## 12. MODELO DE VERSIONADO

**Estado actual:** `update()` sobrescribe el documento. No hay historial.

**Modelo propuesto:**

```
VersionHistory {
  documentId : string
  versions: [{
    version    : number
    snapshot   : KnowledgeDocument  // Copia completa del documento en esa version
    savedAt    : string
    changeNote : string|null
    changedBy  : "CREATOR" | "INGESTION_ENGINE" | "EVOLUTION_ENGINE"
  }]
}
```

**Campos adicionales en KnowledgeDocument:**

```
supersededBy : string|null   // ID del documento que reemplaza a este
supersedes   : string|null   // ID del documento al que este reemplaza
deprecated   : boolean       // true si fue marcado como obsoleto
validFrom    : string|null   // Fecha desde la que este conocimiento es valido
validUntil   : string|null   // Fecha hasta la que es valido (ej: Python 2 end-of-life)
```

**REGLA FUNDAMENTAL:**
- Nunca se borra un documento. Solo se marca `deprecated` o `superseded`.
- El historial de versiones es inmutable (append-only).
- Knowledge con `validUntil < today` puede filtrarse pero no eliminarse.

---

## 13. MODELO MULTILINGUE

**Estado actual:** Sin campo `lang`. Stopwords solo en espanol. Busqueda monolingue.

**PROPUESTA EN 4 NIVELES (sin implementar):**

**Nivel 1 — Campo `lang` en KnowledgeDocument**
`lang: "es" | "en" | "fr" | "de" | null`
Permite filtrar documentos por idioma. Prerequisito para todo lo demas.

**Nivel 2 — Stopwords multilingue en `_tokenizeAndExtract()`**
```javascript
const stopwords = {
  es: new Set(['el','la','de','en','y','o','a','un','una',...]),
  en: new Set(['the','is','a','an','of','in','and','or','to','for',...])
}
```
Sin LLM. Mejora inmediata. Bajo riesgo.

**Nivel 3 — `languageVariants` en Concept**
Un Concept tiene `canonicalName` y `languageVariants`:
```
{ lang: "en", name: "function", aliases: ["function definition"] }
{ lang: "es", name: "funcion", aliases: ["funcion matematica", "subrutina"] }
```
Permite encontrar el mismo concepto desde cualquier idioma sin traduccion automatica.

**Nivel 4 — Relaciones `TRANSLATION_OF` y `EQUIVALENT_TO`**
Vincula documentos que describen el mismo conocimiento en idiomas distintos.
Sin LLM: se establecen manualmente o mediante evidencia de la ingesta.

**SEPARACION CONCEPTUAL:**
```
IDIOMA DEL DOCUMENTO    → campo lang en KnowledgeDocument
IDIOMA DEL CONCEPTO     → languageVariants en Concept (el concepto es alingue)
IDIOMA DE INTERACCION   → instruccion al AIProvider real (requiere Gemini)
```

**LIMITACION DOCUMENTADA:** Sin Gemini, el sistema no puede GENERAR respuestas en espanol cuando el conocimiento esta en ingles. El modelo propuesto permite ORGANIZAR el conocimiento multilingue. La GENERACION en un idioma especifico requiere un LLM externo.

---

## 14. CONSOLIDACION DE CONOCIMIENTO

**Estado actual:** No existe ninguna capacidad de consolidacion.

**ETAPAS DEL PROCESO PROPUESTO:**

```
RAW KNOWLEDGE
  Texto plano en campo content. knowledgeType sin clasificar.
      ↓
EXTRACTED KNOWLEDGE
  Conceptos identificados en el documento. Entradas creadas en ConceptRegistry.
      ↓
STRUCTURED KNOWLEDGE
  Concepts con definitions[], properties[], relatedConcepts[] primarias.
      ↓
RELATED KNOWLEDGE
  Concepts conectados entre si y entre dominios. Relaciones cross-domain establecidas.
      ↓
VALIDATED KNOWLEDGE
  Confirmado por multiples fuentes independientes. Conflictos identificados y documentados.
      ↓
CONSOLIDATED KNOWLEDGE
  Sintetizado en Concept con confidence elevada, derivedFrom[], ProvenanceChain completa.
```

**CONDICIONES PARA "CONSOLIDADO":**
1. Al menos 2 fuentes independientes coinciden en la afirmacion principal
2. Sin conflictos sin resolver (`conflictState != "UNRESOLVED"`)
3. `confidence >= 0.8` (umbral propuesto, revisable por el Creador)
4. Tiene procedencia documentada (`derivedFrom[]` no vacio)

**"Consolidado" NO es "verdad absoluta".**
Es "bien fundamentado y sin contradicciones activas".
La procedencia y el historial siempre se conservan.

---

## 15. DEDUPLICACION

**Situacion:**
- Documento A: "Python es un lenguaje de programacion." (espanol)
- Documento B: "Python is a programming language." (ingles)
Ambos son el mismo concepto pero se tratan como islas independientes.

**ESTRATEGIAS PROPUESTAS (sin implementar, por orden de complejidad):**

| Nivel | Mecanismo | Riesgo | Sin LLM |
|-------|-----------|--------|---------|
| L1 | ID Deterministico (YA EXISTE) | Minimo | Si |
| L2 | Coincidencia category + >80% tags en comun | Medio (falsos positivos) | Si |
| L3 | Relacion `EQUIVALENT_TO` manual confirmada por Creador | Bajo | Si |
| L4 | Embedding similarity | Alto | No (requiere Gemini) |

**Propuesta practica sin LLM:** Implementar L2 (deteccion automatica de candidatos) + L3 (Creador confirma o rechaza). El sistema PROPONE equivalencias, el Creador DECIDE. No elimina documentos, los vincula.

---

## 16. KNOWLEDGE COVERAGE (COBERTURA)

La cobertura NO puede medirse con numeros arbitrarios. Debe basarse en evidencia real.

**METODOLOGIA PROPUESTA:**

**Paso 1:** El Creador (o Evolution Engine) define la lista de conceptos que el sistema "deberia" conocer para ser competente en cada dominio.
- "Programming": [variables, funciones, clases, modulos, algoritmos, ...]
- "Accounting": [margen_bruto, punto_de_equilibrio, flujo_de_caja, ...]

**Paso 2:** Contar conceptos con cobertura real.
Un concepto tiene cobertura si existe al menos un `KnowledgeDocument` con `confidence >= 0.8` que lo ilustra.

**Paso 3:** Calcular porcentaje.
`cobertura_dominio = conceptos_cubiertos / conceptos_esperados_para_dominio`

**Paso 4:** Distinguir niveles.
- `CUBIERTO`: Al menos un documento con `confidence >= 0.8`
- `PARCIALMENTE CUBIERTO`: Documentos disponibles pero `confidence < 0.8` o sin consolidar
- `NO CUBIERTO`: Concepto en la lista esperada pero sin ningun documento

**LIMITACION CRITICA:** Esta metodologia requiere que el Creador defina el espacio de conocimiento esperado. Sin esa definicion, no hay forma de calcular cobertura real. Los numeros inventados son mas daninos que la ausencia de numeros.

---

## 17. KNOWLEDGE GAPS (BRECHAS)

Un Knowledge Gap existe cuando un concepto tiene `prerequisites[]` que no estan cubiertos.

**Ejemplo:**
```
machine_learning.prerequisites = ["linear_algebra","probability","optimization","python"]

Cobertura actual:
  python        → CUBIERTO
  linear_algebra → NO CUBIERTO
  probability   → NO CUBIERTO
  optimization  → NO CUBIERTO

GAPS = ["linear_algebra","probability","optimization"]
```

**Output del Gap Detector:**
```
KnowledgeGapReport {
  targetConceptId : "machine_learning"
  gapConceptIds   : ["linear_algebra","probability","optimization"]
  gapLevel        : "BLOCKER"
  recommendation  : "Para razonar sobre machine_learning falta: algebra lineal, probabilidad, optimizacion"
}
```

**Integracion con ASK_CREATOR:**
- Si gap es `BLOCKER` → Generar pregunta especifica al Creador
- CRITICO: Verificar primero que la informacion no exista ya en KnowledgeManager (no preguntar lo que ya sabe)

---

## 18. INTEGRACION FUTURA CON REASONINGENGINE

**Estado actual del ReasoningEngine (post FASE 2):**
```
Input:  { problemStatement, assembledContext.blocks.knowledge.content: Document[] }
Proceso: Itera documentos → Evidence por documento → Hypothesis por Evidence
Razonamiento: Expone documentos relevantes (no razona sobre relaciones)
```

**Que deberia recibir en el futuro:**
```
ReasoningInput {
  problemStatement : string
  assembledContext : {
    knowledge      : KnowledgeDocument[]   // Ya existe (FASE 2)
    concepts       : Concept[]             // NUEVO: Conceptos extraidos
    relationships  : Relationship[]        // NUEVO: Relaciones entre conceptos relevantes
    knowledgeGaps  : string[]              // NUEVO: Conceptos necesarios pero ausentes
  }
}
```

**Lo que este enriquecimiento habilita:**
1. Navegar relaciones: `"margen"` → `DERIVED_FROM` → `[revenue, cogs]`
2. Hipotesis mas ricas: "este concepto soporta esta hipotesis mediante esta relacion"
3. Reportar gaps especificos: "Puedo razonar parcialmente sobre X, pero me falta Y (DEPENDS_ON de X)"
4. Anti-hallucination mejorado: verificar `conceptRefs` contra Concepts reales

---

## 19. INTEGRACION FUTURA CON EVOLUTION ENGINE

**EL CICLO COGNITIVO:**

```
STUDY    → Leer todos los KnowledgeDocuments
EXTRACT  → Extraer Concepts y Relationships de cada documento (requiere LLM para alta calidad)
UNDERSTAND → Estructurar: definitions, properties, examples. Distinguir FACT/RULE/PROCEDURE
RELATE   → Establecer relaciones. Prioridad: IS_A, PART_OF, DEPENDS_ON
PRACTICE → Generar preguntas internas para verificar comprension
EVALUATE → Verificar coherencia. Detectar conflictos. Medir cobertura
IDENTIFY_GAPS → Detectar brechas via prerequisites[]
ASK_CREATOR → Formular preguntas especificas. Verificar que la respuesta no exista ya
CONSOLIDATE → Sintetizar conocimiento de multiples fuentes con ProvenanceChain completa
```

**Capacidades resultantes:**
- "Ya se hacer X" → Concept con cobertura CUBIERTO, sin gaps bloqueantes
- "Entiendo X parcialmente" → Concept PARCIALMENTE CUBIERTO o con gaps MINOR
- "Para aprender X me falta Y" → `KnowledgeGapReport` con target=X, gap=[Y]
- "Encontre dos fuentes que discrepan" → `ConflictRecord` status=UNRESOLVED
- "Necesito que el Creador me ensenie Z" → Solicitud generada por ASK_CREATOR

---

## 20. SEGURIDAD Y LIMITES

**El modelo de representacion de conocimiento NO puede:**

```
PROHIBICIONES ABSOLUTAS (ya en STATIC_OFFENSIVE_DENY_LIST):
  ❌ Modificar SecurityEngine, PermissionManager, ToolRegistry, ExecutionGateway
  ❌ Modificar politicas de seguridad o reglas de autorizacion
  ❌ Modificar codigo fuente (WRITE_TO_CODEBASE)
  ❌ Otorgarse permisos adicionales
  ❌ Crear politicas autonomas sin aprobacion del Creador

PROHIBICIONES ESPECIFICAS PARA KNOWLEDGE REPRESENTATION:
  ❌ ConsolidationEngine NO puede marcar conflictos como RESOLVED automaticamente
  ❌ ConsolidationEngine NO puede promover tipos de conocimiento (INFERENCE → FACT) automaticamente
  ❌ ConsolidationEngine NO puede eliminar documentos (solo deprecar/marcar superseded)
  ❌ ConceptRegistry NO puede modificar la identidad del Creador ni del bot
  ❌ Knowledge Gaps NO pueden generarse sobre temas de seguridad o gobernanza
```

**PRINCIPIO ARQUITECTONICO FUNDAMENTAL:**
La evolucion del conocimiento aumenta capacidad cognitiva, NO autoridad operativa.
Saber mas no es poder hacer mas sin autorizacion.

---

## 21. ARQUITECTURA PROPUESTA

```
CAPA 1 — ALMACENAMIENTO (EXISTE)
  LocalStorageKnowledgeStore → KnowledgeDocument[]
  MIGRACION FUTURA: IndexedDB o Firebase

CAPA 2 — DOCUMENTOS (EXISTE, A ENRIQUECER)
  KnowledgeManager: add, get, update, delete, search, findByCategory, findByTags
  KnowledgeSchema.validate()
  ENRIQUECIMIENTO: Campos lang, knowledgeType, conflictState, derivedFrom, supersededBy

CAPA 3 — INGESTA (EXISTE, A CONECTAR AL CHAT)
  KnowledgeIngestionEngine
  LegacyRAGAdapter (read-only para costosState)

CAPA 4 — CONCEPTOS (NUEVA)
  ConceptRegistry: add, get, search, findByDomain, findRelated, addRelationship
  ConceptExtractor: extract(document) → Concept[] (heuristico sin LLM, LLM-powered en futuro)

CAPA 5 — RELACIONES Y ONTOLOGIA (NUEVA)
  RelationshipRegistry: indices para navegacion bidireccional
  DomainRegistry: jerarquia de dominios, findParent, findChildren

CAPA 6 — CONFLICTOS Y VERSIONADO (NUEVA)
  ConflictRegistry: ConflictRecord[] persistentes (separados del Job de ingesta)
  VersionHistoryStore: snapshots inmutables de versiones anteriores

CAPA 7 — CONSOLIDACION (NUEVA — FUTURE EVOLUTION ENGINE)
  ConsolidationEngine: ciclo STUDY→EXTRACT→UNDERSTAND→RELATE→PRACTICE→EVALUATE→GAPS→ASK→CONSOLIDATE
  Bajo estrictas restricciones de seguridad definidas en Seccion 20

CAPA 8 — CONTEXTO (EXISTE, A ENRIQUECER)
  ContextManager: setKnowledge(docs) ya existe
  AGREGAR: setConceptContext(concepts, relationships, gaps)

CAPA 9 — RAZONAMIENTO (EXISTE, A ENRIQUECER)
  ReasoningEngine con Evidence enriquecida y navegacion de relaciones
```

**FLUJO PROPUESTO COMPLETO:**
```
Pregunta usuario
  → KnowledgeManager.search(query)              [EXISTE]
  → ConceptRegistry.search(query)               [NUEVO]
  → RelationshipRegistry.findRelated(conceptIds) [NUEVO]
  → ContextManager.setKnowledge(docs)           [EXISTE]
  → ContextManager.setConceptContext(...)       [NUEVO]
  → ReasoningEngine.reason(context enriquecido) [ENRIQUECIDO]
  → AIProvider.generate(context)                [LLM FUTURO]
```

---

## 22. ESTRATEGIA DE MIGRACION

**PRINCIPIOS:**
- **Incremental**: cada paso es funcional por si mismo
- **Reversible**: ningun paso destruye el estado anterior
- **Compatible**: el conocimiento existente sigue siendo accesible
- **Sin romper FASE 2**: 43/43 tests continuan pasando durante la migracion

**PASOS:**

**Paso 1** — Bajo riesgo: Campos opcionales en KnowledgeDocument
Campos: `lang`, `knowledgeType`, `conflictState`, `derivedFrom`, `supersededBy`
`KnowledgeSchema.validate()` acepta documentos sin estos campos con defaults:
`lang=null, knowledgeType="FACT", conflictState="NONE", derivedFrom=[], supersededBy=null`
Documentos existentes no requieren migracion inmediata.

**Paso 2** — Bajo riesgo: Stopwords multilingue
Agregar stopwords en ingles a `_tokenizeAndExtract()`. Mejora inmediata sin romper nada.

**Paso 3** — Medio riesgo: ConflictRegistry
Nuevo modulo `ai-conflicts.js`. `KnowledgeIngestionEngine` escribe a ConflictRegistry ademas del Job.
No modifica el formato de KnowledgeDocument.

**Paso 4** — Medio riesgo: VersionHistoryStore
Nuevo modulo `ai-version-history.js`.
`KnowledgeManager.update()` escribe snapshot al historial antes de actualizar.
No modifica la interfaz publica de KnowledgeManager.

**Paso 5** — Alto riesgo: ConceptRegistry (heuristico basico)
Nuevo modulo `ai-concepts.js`. ConceptExtractor basico: title → canonicalName, tags → aliases.
Debe ser aditivo: si ConceptRegistry falla, el flujo FASE 2 continua sin cambios.

**Paso 6** — Alto riesgo: RelationshipRegistry y DomainRegistry
Poblar manualmente con relaciones iniciales entre dominios del negocio.

**Paso 7** — Maximo riesgo, requiere Gemini: ConsolidationEngine
Solo implementable cuando hay un AIProvider real conectado.
La extraccion de alta calidad de conceptos y relaciones requiere LLM.

---

## 23. PLAN DE PRUEBAS

NO EJECUTAR NI IMPLEMENTAR. Solo disenado para uso futuro.

| ID | Escenario | Dado | Cuando | Entonces |
|----|-----------|------|--------|----------|
| KR1 | Documento → concepto | Doc title="Python", content="Python es un lenguaje" | ConceptExtractor.extract(doc) | Concept con canonicalName="Python" y sourceReferences=[doc.id] |
| KR2 | Dos docs → mismo concepto | docA espanol + docB ingles, ambos sobre Python | extract() sobre ambos | UN solo Concept con sourceReferences=[docA.id, docB.id] |
| KR3 | Concepto → relacion | Concepts "Python" y "programming_language" | addRelationship("Python", IS_A, "programming_language") | findRelated("Python", IS_A) incluye "programming_language" |
| KR4 | Cross-domain | Concept "porcentaje" (Math) y "margen_bruto" (Accounting) | "porcentaje" USED_IN "margen_bruto" | DomainRegistry.getCrossLinks("Mathematics","Accounting") incluye la relacion |
| KR5 | Ingles-Espanol | Concept "function" con variant es="funcion" | search("funcion") en ConceptRegistry | Encuentra el Concept de "function" via variant espanol |
| KR6 | FACT ≠ INFERENCE | docA knowledgeType="FACT", docB knowledgeType="INFERENCE" | ReasoningEngine construye Evidence | Evidence de docA tipo FACT, Evidence de docB tipo INFERENCE, con confidence INFERENCE < FACT |
| KR7 | Conflicto detectado | docA "merma=5%" + docB "merma=8%" | IngestionEngine procesa docB | RESOLUTION_REQUIRED + ConflictRecord UNRESOLVED persiste en ConflictRegistry despues de que termina el Job |
| KR8 | Versionado | Doc version=1 | update(id, {content: nuevo}) | Doc version=2 + snapshot version=1 inmutable en VersionHistoryStore |
| KR9 | Superseded | docPython2 + docPython3 supersedes docPython2 | Registrar supersedes | docPython2.supersededBy=docPython3.id, docPython2.deprecated=true, busqueda prioriza docPython3 |
| KR10 | Knowledge gap | Concept "ml" con prerequisites=["linear_algebra","probability"] + sin cobertura de ambos | GapDetector.detect("ml") | Report con gaps=["linear_algebra","probability"], level=BLOCKER |
| KR11 | Provenance | Doc ingesta manual por Creador + Concept derivado | Query ProvenanceChain | original.source="manual://creador", original.ingestJobId=[jobId original] |
| KR12 | Consolidacion | docA y docB FACT sobre "Python is high-level", sources independientes | ConsolidationEngine.consolidate([docA,docB]) | Concept consolidado con confidence>=promedio, derivedFrom=[docA.id,docB.id], docA y docB intactos |
| KR13 | RE recibe conceptos | ConceptRegistry tiene conceptos relevantes | ChatBridge.receiveMessage(pregunta) | assembledContext.blocks.concepts.status=AVAILABLE |
| KR14 | RE recibe relaciones | "margen" DERIVED_FROM "revenue","cost" + pregunta "como se calcula el margen" | ReasoningEngine.reason() | Hipotesis incluye relacion DERIVED_FROM, respuesta menciona revenue y cost |
| KR15 | EE recibe gaps | Pregunta requiere "linear_algebra" que no existe | EvolutionEngine.study() | Pregunta especifica al Creador + verificacion previa que la info no exista ya |

---

## 24. RIESGOS

| ID | Nivel | Descripcion | Mitigacion |
|----|-------|-------------|------------|
| R1 | CRITICO | Complejidad vs beneficio real. Agregar 5 nuevos modulos puede hacer el sistema inmanejable | Implementar SOLO campos de KnowledgeDocument en el proximo paso. El resto espera Gemini |
| R2 | ALTO | Sin LLM, extraccion de conceptos es de baja calidad. Titulos como "Receta: Pan de Queso" generan conceptos incorrectos | Poblar ConceptRegistry MANUALMENTE para los dominios criticos hasta conectar Gemini |
| R3 | ALTO | LocalStorage no puede escalar para ConceptRegistry + RelationshipRegistry (limite 5MB) | Implementar ConceptRegistry en IndexedDB desde el inicio, no en LocalStorage |
| R4 | MEDIO | Documentos existentes sin campo lang | Hacer lang opcional con default null. Sin migracion retroactiva requerida |
| R5 | MEDIO | ConflictRegistry introduce nueva superficie de fallo | Implementar como extension de KnowledgeIngestionEngine, reutilizando LocalStorageKnowledgeStore |
| R6 | BAJO | Relaciones EQUIVALENT_TO mal establecidas sin LLM | Las relaciones son bidireccionales pero no transitivas automaticamente. El Creador confirma o rechaza |

---

## 25. SIGUIENTE FASE RECOMENDADA

**NOMBRE: FASE 4 — ENRIQUECIMIENTO DEL SCHEMA Y CONFLICTOS PERSISTENTES**

**JUSTIFICACION:**
El cambio de mayor valor con menor riesgo es enriquecer el `KnowledgeDocument` con los campos que habilitan todas las capacidades futuras. Sin estos campos, ninguna capacidad avanzada es posible.

**CAMBIOS PROPUESTOS (en orden de prioridad):**

1. Agregar campos al `KnowledgeSchema` (`ai-knowledge.js`)
   - `lang`: `string|null` (default null)
   - `knowledgeType`: `"FACT"|"INFERENCE"|"HYPOTHESIS"|"RULE"|"PROCEDURE"|"DEFINITION"` (default `"FACT"`)
   - `conflictState`: `"NONE"|"UNRESOLVED"|"UNDER_REVIEW"|"RESOLVED"|"SUPERSEDED"` (default `"NONE"`)
   - `conflictsWith`: `string[]` (default `[]`)
   - `derivedFrom`: `string[]` (default `[]`)
   - `supersededBy`: `string|null` (default `null`)
   - Todos retrocompatibles (no rompen documentos existentes)

2. Agregar stopwords en ingles a `_tokenizeAndExtract()` (`ai-knowledge.js`)
   Mejora inmediata de busqueda sin cambiar la interfaz publica.

3. Crear `ConflictRegistry` como extension de `KnowledgeIngestionEngine`
   Los conflictos persisten despues de que el Job termina.
   El Creador puede consultar conflictos pendientes.

4. NO implementar `ConceptRegistry` todavia
   Esperar hasta que Gemini este conectado para extraccion de alta calidad.

**LO QUE NO DEBE HACERSE EN FASE 4:**
- No implementar ConceptRegistry
- No implementar RelationshipRegistry
- No implementar Evolution Engine
- No conectar Gemini

**CRITERIO DE EXITO DE FASE 4:**
Un documento almacenado en ingles tiene `lang="en"`.
Una formula matematica tiene `knowledgeType="RULE"`.
Un conflicto detectado persiste y puede ser consultado despues del Job.
Todos los tests existentes (43/43) siguen pasando.

---

## ESTADO FINAL

**KNOWLEDGE REPRESENTATION DESIGN: READY**

**EVOLUTION ENGINE READINESS: NOT READY**

**REAL EXECUTION READINESS: NOT READY**

---
*Auditoria y diseno realizado por Antigravity — Solo lectura.*
*Ningun archivo del proyecto fue modificado.*
*Ningun codigo fue creado. Ninguna dependencia fue instalada.*
*Ningun proveedor de IA externo fue consultado.*
