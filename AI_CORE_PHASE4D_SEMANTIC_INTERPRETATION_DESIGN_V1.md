# AI_CORE_PHASE4D_SEMANTIC_INTERPRETATION_DESIGN_V1.md

## 1. OBJETIVO Y PRINCIPIO FUNDAMENTAL
Diseñar la capa cognitiva responsable de transformar el lenguaje humano crudo en propuestas estructuradas evaluables por el AI Core, solucionando la limitación de la normalización algorítmica de la Fase 4C.1.
- **Regla Local-First**: El sistema base opera sin depender de Gemini, Internet o APIs externas. La arquitectura contempla proveedores semánticos abstractos, pero su presencia es **opcional**.
- **Principios Inviolables**:
  - `INTERPRETATION ≠ TRUTH`
  - `CLAIM PROPOSAL ≠ VERIFIED CLAIM`
  - `INTENT ≠ AUTHORIZATION`
  - Un External AI Provider propone, jamás dictamina ni autoriza.

## 2. SEMANTIC INTERPRETATION RESULT
La salida de esta capa es un objeto estricto de diagnóstico, no de conocimiento absoluto.
```json
{
  "interpretationId": "uuid",
  "originalInput": "texto crudo",
  "language": "es",
  "detectedIntent": "REPORT",
  "interpretationStatus": "INTERPRETED | AMBIGUOUS | PARTIAL | INSUFFICIENT_INFORMATION | UNSUPPORTED | INVALID",
  "confidence": 0.85,
  "candidates": [...],
  "selectedCandidate": "uuid_candidato",
  "uncertainty": true,
  "missingInformation": [...],
  "evidenceSpans": [...],
  "provenance": { ... },
  "timestamp": "ISO8601",
  "schemaVersion": "1.0"
}
```

## 3. INTERPRETATION CANDIDATES
Ante la ambigüedad, el sistema no decide arbitrariamente.
- Genera múltiples `InterpretationCandidate`.
- Ejemplo: "El servidor está caído" produce:
  - `Candidate A`: Intent: REPORT, Subject: Server, Problem: HOST_UNREACHABLE.
  - `Candidate B`: Intent: REPORT, Subject: Server, Problem: APPLICATION_NOT_RESPONDING.
- Si las evidencias (`evidenceSpans`) no logran inclinar la confianza hacia un candidato de forma concluyente, el estado será `AMBIGUOUS`.

## 4. CLAIM PROPOSAL
Distinto de un Claim consolidado. Es la extracción de una afirmación del texto.
- `subject`, `predicate`, `object/value`, `unit`, `scope`, `temporalContext`, `knowledgeType` (Epistémico), `epistemicStatus` (PROPOSED), `source`, `evidenceSpans`, `assumptions`, `confidence`, `interpretationId`.

## 5. TIPOS EPISTEMOLÓGICOS (KNOWLEDGE TYPE)
El campo representa la naturaleza de la frase, no su veracidad.
- `FACT`: Afirmaciones objetivas ("El log dice X").
- `OBSERVATION`: Descripciones transitorias ("La VPN está lenta").
- `USER_ASSERTION`: "En mi panadería usamos esto" (Tiene autoridad de Scope, no universal).
- `HYPOTHESIS`: "Creo que la VPN está lenta por el MTU".
- `INFERENCE`: Derivación lógica.
- `QUESTION` / `OPINION` / `INSTRUCTION` / `UNKNOWN`.
Ninguno de estos tipos, sin importar su origen, se convierte de `PROPOSED` a `FACT` verificado sin atravesar el motor de Consolidación y Validación.

## 6. EVIDENCE SPANS Y ASSUMPTIONS
- **Evidence Spans**: Mapeo exacto substring -> campo estructurado. 
  * "Creo que" -> `epistemic marker: uncertainty`
  * "VPN" -> `subject`
  Previene que el provider invente campos inexistentes en el texto.
- **Assumptions**: Lista de variables asumidas. "Configura la VPN" asume (1) Existe una VPN, (2) Se conoce el hardware. Quedan registrados bajo `assumptions`.

## 7. MISSING INFORMATION
Estructura explícita para evitar bucles o preguntas inútiles:
- `missingInfo`: Qué falta.
- `reason`: Por qué es necesario.
- `criticality`: `INDISPENSABLE` | `USEFUL` | `OPTIONAL`.
- `dependentCandidate`: Qué interpretación está frenada por este gap.
El sistema priorizará buscar la respuesta en la memoria consolidada antes de preguntar al usuario.

## 8. INTENT DETECTION VS KNOWLEDGE
Separación arquitectónica total de la intención y el contenido.
Una frase puede tener `INTENT = ANALYSIS_REQUEST` y contener un ClaimProposal de tipo `HYPOTHESIS`.
- La detección de `ACTION_REQUEST` **jamás** desencadena ejecución ni modifica el `SecurityEngine`. Únicamente levanta la intención.

## 9. CONTEXT, SCOPE Y TEMPORALIDAD
- **Contexto y Scope**: `GLOBAL`, `USER`, `BUSINESS`, `HOUSEHOLD`, `PROJECT`, `DEVICE`, `NETWORK`, `CONVERSATION`, `UNKNOWN`.
  * "Mi MikroTik" -> `DEVICE_SCOPE` amarrado al `USER`. Impide generalización tóxica.
- **Temporalidad**: Normalización relativa a absoluta cuando hay `evidenceSpans` claras ("Ayer" -> `date - 1`). Si es ambiguo: `TEMPORAL_CONTEXT_UNKNOWN`. 

## 10. ESTRUCTURAS LOGICAS (CAUSALITY, NEGATION, QUANTIFIERS)
- **Causality**: Distingue `ASSERTED_CAUSALITY` ("El MTU causa X") de `HYPOTHETICAL_CAUSALITY` ("Creo que el MTU causa X").
- **Negation**: Banderas booleanas ligadas a Claims (No está = `isNegated: true`).
- **Quantifiers**: Extrae `ALL`, `SOME`, `NONE`, `ALWAYS`, `SOMETIMES`. Un provider fallará y devolverá `UNKNOWN` si intenta deducir un cuasi-cuantificador no soportado.

## 11. LANGUAGE Y PARAPHRASE
El sistema mapea `language`. 
La equivalencia semántica o traducción (Paraphrase) se distingue en estados: `SAME_TEXT`, `NORMALIZED_EQUIVALENCE`, `SEMANTIC_EQUIVALENCE`, `UNKNOWN`. Si el modelo local no posee diccionarios cruzados, dictamina `UNKNOWN` en vez de forzar colisiones falsas.

## 12. PROVIDER ABSTRACTION Y VALIDATOR
- **SemanticProvider**: Interfaz base. Implementaciones: `LocalSemanticProvider` (Regex/NLP ligero actual), `FutureLocalModelProvider`, `OptionalExternalProvider` (Gemini).
- **SemanticStructuralValidator**: Capa dura. Valida que el output del Provider respete enums, schema y coincidencia de `evidenceSpans`. Actúa como **Anti-Hallucination Barrier**. Filtra invenciones crasas de IPs, variables o datos no provistos en el string original.

## 13. RELACIONES DE INTEGRACIÓN
- **Knowledge Core**: Recibe `ClaimProposals` válidos y los evalúa contra sus Registros. Si pasan, van a Consolidación.
- **Reasoning Engine**: Consume el árbol semántico y su incertidumbre para deliberar el discurso o razonamiento. Nunca asume las interpretaciones como certezas.
- **Investigation Engine**: Consume `HYPOTHESIS` para detonar planes de búsqueda/test (sin ejecutar todavía).

## 14. ADVERSARIAL DESIGN CASES (D1-D25)
Ejemplos demostrativos del comportamiento esperado:
- **D1 ("Creo que la VPN está lenta porque el MTU está mal")**: Intent=`REPORT`, Type=`HYPOTHESIS`, Uncertanty=`true`. Genera ClaimProposal.
- **D4 ("Configura mi MikroTik para bloquear IP")**: Intent=`ACTION_REQUEST`. Genera petición, **NO autoriza**.
- **D5 ("El firewall no bloquea...") vs D6 ("...está bloqueando...")**: Detecta la polaridad (Negation) usando `evidenceSpans` ("no"). Generan Claims mutuamente exclusivos.
- **D9 ("Las donas cuestan 8000") vs D10 ("En Dulce Tentación...")**: D9 Scope=`GLOBAL` (o `UNKNOWN`), D10 Scope=`BUSINESS:Dulce Tentación`. D9 podría ser un Claim universal falso, D10 es acotado.
- **D13 ("Creo que el margen bruto es 30%")**: Uncertainty=`true`.
- **D21 ("Configura la VPN")**: Genera `MissingInformation` (Indispensable: modelo de VPN).
- Todos los casos dudosos o paralelos caen en `AMBIGUOUS` o generan múltiples candidatos.

## 15. TEST ARCHITECTURE (S1-S30)
Se requiere desarrollar una suite rigurosa: `INPUT -> INTERPRETATION -> STRUCTURE -> EVIDENCE SPANS -> UNCERTAINTY -> MISSING INFO -> EXPECTED RESULT`. No se codificará en esta fase.

## 16. THREAT MODEL (Mitigaciones)
- **Semantic Hallucination**: Barrera `StructuralValidator` cruzando `evidenceSpans`.
- **False Certainty**: Atributos mandatorios de Incertidumbre y Tipo Epistemológico en el `ClaimProposal`.
- **Provider Poisoning**: El Provider no graba datos; sus outputs mueren si el Validation o Consolidation los rechaza.
- **Auth Bypass (Intent Hijacking)**: Desacople total de `Intent` y el sistema de `ExecutionGateway` (Aislamiento de Seguridad).

## 17. IMPLEMENTATION BOUNDARY
| CAPABILITY | LOCAL NOW | LOCAL FUTURE (NLP Model) | OPTIONAL PROVIDER (LLM) | NOT SUPPORTED |
|---|---|---|---|---|
| Detección de Negaciones simples | X | | | |
| Asignación de Intent (Regex) | X | | | |
| Traducción / Semantic Paraphrase | | X | X | |
| Inferencia causal ambigua | | | X | |
| Entendimiento absoluto de ironía | | | | X |

## 18. CRITERIOS DE ACEPTACIÓN (READINESS CRITERIA)
- Separa tajantemente Interpretación de Verdad.
- Separa tajantemente Intención de Autorización.
- Detecta lagunas y declara qué falta con niveles de criticidad.
- Está diseñado bajo arquitectura de plugins (Provider), pero la validación y seguridad son estrictamente locales.
- Completamente Agnóstico del dominio (redes, contabilidad, código).

---

### ESTADO FINAL REQUERIDO
- PHASE 4D DESIGN: READY FOR AUDIT
- PHASE 4C.1: NOT READY FOR IMPLEMENTATION UNTIL 4D IS RESOLVED
- EVOLUTION ENGINE: NOT READY
- REAL EXECUTION: NOT READY
- EXTERNAL AI: OPTIONAL / NOT REQUIRED
