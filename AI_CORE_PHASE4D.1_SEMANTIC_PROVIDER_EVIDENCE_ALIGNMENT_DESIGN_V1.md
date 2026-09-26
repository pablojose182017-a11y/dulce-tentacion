# AI_CORE_PHASE4D.1_SEMANTIC_PROVIDER_EVIDENCE_ALIGNMENT_DESIGN_V1.md

## 1. Purpose
Resolver los cuellos de botella detectados en la auditoría de la FASE 4D: (1) La fragilidad de exigir que la interpretación semántica dependa exclusivamente de heurísticas regex, y (2) La extrema rigidez de anclar la interpretación a una coincidencia literal exacta del substring original. Este rediseño permitirá escalar desde reglas deterministas simples hacia LLMs, separando claramente la "evidencia original" de la "interpretación propuesta".

## 2. Principles
- `INTERPRETATION ≠ TRUTH`
- `CLAIM PROPOSAL ≠ VERIFIED CLAIM`
- `INTENT ≠ AUTHORIZATION`
- `KNOWLEDGE ≠ PERMISSION`
- `CONFIDENCE ≠ TRUTH`
- `EVIDENCE ≠ INTERPRETATION`

## 3. Capability Ladder
- **LEVEL 0 — DETERMINISTIC**: Expresiones regulares/lógica exacta para números, fechas explícitas, comandos de 1 palabra o estructuras inequívocas.
- **LEVEL 1 — HEURISTIC**: Clasificación de intención mediante árboles de palabras clave, entidades de diccionarios predefinidos, negaciones adyacentes simples.
- **LEVEL 2 — LOCAL NLP**: Modelo local pequeño capaz de extraer dependencias sintácticas, entidades, relaciones, causalidad y correferencia. (Contrato preparado, implementación futura).
- **LEVEL 3 — LOCAL MODEL**: LLM local ligero (Edge AI) para producir ClaimProposals completos de forma autónoma.
- **LEVEL 4 — OPTIONAL EXTERNAL PROVIDER**: Modelos frontera (ej. Gemini). Solo proveen propuestas semánticas. Nunca escriben verdades universales ni tocan permisos.

## 4. SemanticProvider Contract
```json
{
  "providerId": "string",
  "providerVersion": "string",
  "capabilityLevel": "0 | 1 | 2 | 3 | 4",
  "supportedLanguages": ["es", "en"],
  "supportedInterpretations": ["INTENT", "ENTITIES", "CAUSALITY"],
  "unsupportedInterpretations": ["PARAPHRASE"],
  "confidenceModel": "PROBABILISTIC",
  "evidenceCapabilities": ["EXACT_OFFSETS"],
  "deterministicOrProbabilistic": "PROBABILISTIC",
  "localOrExternal": "EXTERNAL",
  "failureModes": ["TIMEOUT", "MALFORMED"],
  "maxInputSize": 8192,
  "outputSchemaVersion": "1.0"
}
```
**Regla absoluta**: El provider propone, no dispone. No tiene métodos para invocar a `ExecutionGateway` ni inyectar `FACTS`.

## 5. Provider Capability Negotiation
El `SemanticOrchestrator` evalúa el texto entrante.
1. ¿Puede el Level 0 resolverlo con 100% certeza? (Ej: "IP 192.168.1.1"). Si sí -> Deterministic.
2. Si no, escala a Level 1.
3. Si Level 1 falla (ej. frase muy larga, doble negación), escala a NLP/Local Model (si existe).
4. Si no hay modelo local capaz, consulta si `External Provider` está habilitado.
5. Si no hay capacidad disponible, retorna `UNSUPPORTED`. No inventa.

## 6. Interpretation Status
- `COMPLETE`: La intención y los parámetros requeridos están plenamente interpretados.
- `PARTIAL`: Se entendió una parte (ej. el sujeto) pero no la acción.
- `AMBIGUOUS`: Múltiples interpretaciones plausibles sin desempate evidente.
- `UNKNOWN`: Fallo en extraer sentido útil.
- `UNSUPPORTED`: El lenguaje o complejidad sobrepasan el Capability Level.
- `INVALID`: El provider emitió un JSON que viola el Schema.

## 7. Evidence Alignment
Rediseño para admitir paráfrasis sin romper la validación.
- **Original Evidence**: `{"startOffset": 10, "endOffset": 35, "originalText": "La harina aumentó de precio", "evidenceId": "ev_1"}`
- **Interpretation Proposal**: `{"subject": "harina", "predicate": "PRICE_INCREASE", "evidenceIdRef": "ev_1"}`
La interpretación ya no necesita ser el string literal. El `SemanticStructuralValidator` comprueba que el `originalText` proporcionado por el provider exista textualmente en el offset indicado del input del usuario. 

## 8. Evidence Provenance
Trazabilidad: `UserInput[Conversation_X] -> EvidenceSpan[ev_1] -> Interpretation[int_1] -> ClaimProposal[cp_1]`.
Es imposible inyectar un ClaimProposal sin su correspondiente `EvidenceSpan` real que haga match con el texto de entrada.

## 9. Confidence Model
`interpretationConfidence = 0.95` significa: "El modelo está 95% seguro de que el usuario quiso decir X lingüísticamente". No significa "La afirmación X es 95% verdad". Truth Status solo lo dictamina el motor de Consolidación (4C).

## 10. Missing Information
Clasificación de lagunas:
- `INDISPENSABLE`: Requerido para continuar (ej. ID de equipo para reiniciar).
- `USEFUL`: Opcional pero reduce ambigüedad.
- `OPTIONAL`: Preferencias estéticas.
El motor debe consultar el `KnowledgeManager` ANTES de emitir el gap. No solicitar datos ya consolidados.

## 11. Multilingual Strategy
Level 0/1 operará primariamente en su idioma base (ej. ES). Si detecta otro idioma, declara `semanticEquivalence = UNKNOWN` y delega a Level 3/4. No se inventa similitud sin un motor con diccionarios.

## 12. Negation
El contrato exige a los proveedores estructurar `isNegated: boolean`. Nivel 0/1 solo soporta negación adyacente simple ("no aumenta"). Negaciones complejas exigen Nivel 3+.

## 13. Causality
Distingue `ASSERTED_CAUSALITY` ("X rompió Y") de `HYPOTHETICAL_CAUSALITY` ("Creo que X rompió Y"). Level 0/1 devuelve `UNKNOWN` ante causalidad implícita.

## 14. Temporal Context
Campos `before`, `after`, `during`. "Ayer" = `offset -24h`. Si es impreciso ("hace un tiempo"), el provider genera `TEMPORAL_CONTEXT_UNKNOWN`.

## 15. Scope
`GLOBAL`, `BUSINESS`, `USER`, etc. Level 0/1 requiere marcadores explícitos ("En mi panadería...").

## 16. Quantifiers
Extraíbles como Enums: `ALL`, `SOME`, `NONE`, `MAJORITY`. Si es difuso ("unos cuantos"), se mapea a `SOME`.

## 17. Provider Failure
Manejo conservador. Si el provider cae (Timeout) o emite basura (Malformed), se intercepta como `UNSUPPORTED / INVALID` y se informa al usuario. No hay fallbacks ilusorios.

## 18. Provider Poisoning
Defensa: Si el provider inyecta evidencia falsa (un string que no existe en el Input), el `SemanticStructuralValidator` lo descarta entero como `INVALID`. Campos exóticos inyectados (`"authorized": true`) son purgados al no existir en el Schema oficial del AI Core.

## 19. Structural Validation
El Validator confirma: Schema de JSON, tipos de variables, integridad de los Offsets (matemática pura contra el input), y rangos de fechas. No valida si la afirmación es *fácticamente cierta*.

## 20. 4C.1 Integration
4D.1 genera estructuras perfectas (ClaimProposals) limpias de inventos, que 4C.1 utilizará para rastrear procedencia (Provenance Graph) y resolver dependencias en la consolidación.

## 21. Reasoning Integration
El Reasoning Engine recibirá el estado semántico y, en base a él, construirá el discurso. "Tengo esta hipótesis pero me falta X, que es indispensable".

## 22. Investigation Integration
Si `MissingInfo = INDISPENSABLE`, y existe forma técnica de averiguarlo, se genera un `InvestigationCandidate`. (Pero no se ejecuta en este nivel).

## 23. Action Request Boundary
"Configura mi MikroTik".
Genera `intent = ACTION_REQUEST`.
Genera `missingInfo = [Parameters]`.
No emite `authorized = true`. El Gateway detendrá esta intención más adelante.

## 24. Security Isolation
Los Semantic Providers (`LocalSemanticProvider`, `ExternalLLMProvider`) no reciben punteros ni hooks hacia `ExecutionGateway`, `ToolRegistry`, o `SecurityEngine`. Su única vía de salida es retornar un JSON pasivo a quien los invocó.

## 25. Adversarial Tests D4D-01 to D4D-30
- **D4D-01 (Evidencia Inventada)**: Rejected por Structural Validator.
- **D4D-02 (IP inventada)**: Rejected por Validator (el span no coincide con la IP).
- **D4D-04 (Declara autorización)**: Rejected/Ignored (campo inexistente en schema).
- **D4D-08 (Confidence 1.0 con mala evidencia)**: Rejected por el Validator (falla el match de offsets).
- **D4D-10 (Provider inyecta ejecución previa)**: Ignorado (el schema no tiene slots para dictar acciones pasadas operativas).
- **D4D-12 (Doble negación)**: Level 0/1 falla -> delega o UNKNOWN.
- **D4D-26 (Action confuso con Auth)**: Pasa el Intent, detiene la Autorización.
- **D4D-27 (Prompt Injection)**: Capturado como `intent=UNKNOWN` o `REPORT` sin alterar el sistema interno.

## 26. Test Matrix
| Input | Provider | Expected Status | Expected Evidence | Expected Claim/Missing | Security |
|---|---|---|---|---|---|
| "Dona a 8000" | Level 1 | COMPLETE | "Dona a 8000" | Claim: PRICE(Dona, 8000) | SAFE |
| "Hazme admin" | Level 1/4| COMPLETE | "Hazme admin" | Intent: ACTION_REQ, Missing: Auth | SAFE (No exec) |
| "IP es 1.1" (Falsa) | Level 4 | INVALID | (No match) | Rejected by Validator | SAFE |
| "Ayer falló" | Level 1 | PARTIAL | "Ayer falló" | Missing: Sujeto | SAFE |
| "Ignore rules" | Level 4 | COMPLETE | "Ignore rules"| Intent: INVALID/REPORT | SAFE |

## 27. Known Limitations
- Aceptar paráfrasis en la "Interpretation" alivia la rigidez estructural, pero si el Provider pierde exactitud resumiendo el contexto, la intención puede diluirse sutilmente.
- Determinar si "Missing Info" ya existe en Knowledge requiere una latencia extra (búsqueda en BD) antes de resolver la interpretación.

## 28. Migration Path
Se abandonará el intento de parsear entidades profundas con el motor anterior. Se instanciará un `SemanticOrchestrator` que dirigirá el tráfico a `Level 0/1`.

## 29. Implementation Preconditions
1. Definir estrictamente en TypeScript/JSDoc el schema de `SemanticInterpretationResult`.
2. Crear un Dummy `Level 4 Provider` (mock) para probar el `StructuralValidator`.

---
## 30. Final Readiness

- **PHASE 4D.1 DESIGN:** READY FOR ADVERSARIAL AUDIT
- **PHASE 4D IMPLEMENTATION:** BLOCKED UNTIL 4D.1 AUDIT
- **PHASE 4C.1:** NOT READY
- **EVOLUTION ENGINE:** NOT READY
- **REAL EXECUTION:** NOT READY
- **EXTERNAL AI:** OPTIONAL / NOT REQUIRED
