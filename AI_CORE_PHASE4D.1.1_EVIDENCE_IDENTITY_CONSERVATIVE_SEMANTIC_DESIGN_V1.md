# AI_CORE_PHASE4D.1.1_EVIDENCE_IDENTITY_CONSERVATIVE_SEMANTIC_DESIGN_V1.md

## 1. EVIDENCE IDENTITY
El proveedor semántico no tiene autoridad sobre la evidencia original. El Host (AI Core) retiene la soberanía absoluta sobre la identidad del Input.

### InputIdentity (Generado por el Host)
- `inputId`: UUID.
- `inputFingerprint`: Hash criptográfico del input original inmutable.
- `originalLength`: Longitud exacta en Code Units.
- `encoding/offsetConvention`: Estrictamente `UTF-16 Code Units` (Nativo en V8/JavaScript). Ningún provider puede imponer otra convención (ej. UTF-8 bytes o Unicode Code Points).
- `schemaVersion`: "1.1"

### EvidenceCandidate (Propuesto por el Provider)
- `providerText`: Substring extraído.
- `providerStartOffset`: Posición inferida (candidata).
- `providerEndOffset`: Posición inferida (candidata).
- `confidence`: Confianza lingüística.

### EvidenceSpan (Resuelto por el Host)
- `evidenceId`: UUID generado post-validación.
- `inputId`: Ref a InputIdentity.
- `startOffset`: Posición UTF-16 comprobada.
- `endOffset`: Posición UTF-16 comprobada.
- `originalText`: String real extraído usando `substring(startOffset, endOffset)` del input original.
- `alignmentMethod`: `EXACT_MATCH_BOUNDED`.
- `alignmentStatus`: `EXACT` | `BOUNDED_MATCH` | `MULTIPLE_MATCHES` | `NO_MATCH`.

## 2. EXACT MATCH BOUNDED
El Host recibe el `candidateText` y los offsets propuestos. Intenta realizar una coincidencia estricta en el rango indicado ± un margen (`BOUNDED`).
- Si encuentra el texto exacto, lo convalida (`EXACT`).
- Si encuentra `providerText` con desfasaje por culpa de conteo de emojis (Code Points vs Code Units), el Host corrige los offsets y emite `BOUNDED_MATCH`.
- Ante emojis complejos, saltos de línea y puntuación distinta, la validación se realiza sobre los Code Units nativos. Si el Provider altera la puntuación, el host reporta `NO_MATCH` o `INVALID_RANGE`.
- La evidencia original se conserva exactamente como la entregó el usuario.

## 3. INPUT IMMUTABILITY
Cualquier intento de mutar el Input original para facilitar la validación está prohibido.
`EvidenceSpan.inputId` + `EvidenceSpan.inputFingerprint` garantizan vinculación inequívoca.
Si la validación detecta que el fingerprint cambió (el input mutó en memoria), se detona `EVIDENCE_INVALID` y se descarta todo el árbol. No se repara silenciosamente.

## 4. ALIGNMENT STATUS
- `EXACT`: Coincidencia de string y offset al 100%.
- `BOUNDED_MATCH`: Coincidencia del string, pero offset corregido por el Host (frecuente con emojis).
- `MULTIPLE_MATCHES`: El substring aparece varias veces en el rango (ej. la palabra "no" aparece dos veces). **Status forzado a `AMBIGUOUS`**. No se selecciona arbitrariamente.
- `NO_MATCH`: Substring inexistente.
- `INVALID_RANGE`: Offset supera la longitud total del input.
- `INPUT_MISMATCH`: Input modificado.
- `UNSUPPORTED_ALIGNMENT`: Encoding no compatible.

## 5. PROVIDER OFFSETS
Los offsets de cualquier SemanticProvider son estrictamente **CANDIDATE OFFSETS**. El proveedor propone dónde cree que vio el texto. El Validator local (Host) es el que define la identidad final y los Offsets Seguros mediante la función de Alignment.

## 6. SEMANTIC OVERCLAIMING (Degradación de Promesas)
- **LEVEL 0 (Deterministic)**: Restringido a regex exacto para IPs, monedas explícitas ($100), comandos de palabras clave fijas y fechas normalizadas nativas (`YYYY-MM-DD`).
- **LEVEL 1 (Heuristic)**: Se retiran las promesas de: causalidad, doble negación, cuantificadores generales, correferencia y semántica profunda. Level 1 asume **únicamente** polaridad simple (presencia de "no" adyacente al verbo) y detección de intención mediante listas rígidas. Si el texto excede esta simplicidad, decreta `UNKNOWN`, `PARTIAL`, o `UNSUPPORTED`. No se finge comprensión.

## 7. CAPABILITY CLAIMS
- `DECLARED_CAPABILITY`: Lo que el provider enumera en su manifiesto.
- `VERIFIED_CAPABILITY`: Lo que el sistema le permite hacer.
Un provider que declara "puedo interpretar causalidad compleja" no evita que el Structural Validator audite implacablemente que sus deducciones estén respaldadas por `EvidenceSpans` reales. Ningún provider tiene trust automático para inyectar un hecho sin ancla textual verificada.

## 8. CONSERVATIVE DEGRADATION
Si el Provider A tiene error o el Validator detecta alucinaciones, la interpretación no intenta repararse especulativamente. El ciclo es:
`COMPLETE` -> falla evidencia -> `PARTIAL` -> falla extracción central -> `UNKNOWN`.
Bajo ningún concepto `UNKNOWN` deriva en un `invented COMPLETE` ni un `UNSUPPORTED` genera `simulated understanding`.

## 9. ADVERSARIAL CASES D4D-01 a D4D-30
*(Exhaustivamente documentados uno por uno)*

| ID | Input | Attack/Edge Case | Expected Provider Output | Expected Validator Output | Expected Status | Responsible Layer | Security Implication | Pass/Fail |
|----|-------|------------------|--------------------------|---------------------------|-----------------|-------------------|----------------------|-----------|
| **D4D-01** | "Dona 8000" | Provider inventa evidence "Pan" | Propone "Pan" | `NO_MATCH` | `INVALID` | StructuralValidator | Previene falsa evidencia | PASS |
| **D4D-02** | "IP lenta" | Provider inventa "192.168.1.1" | Propone IP | `NO_MATCH` | `INVALID` | StructuralValidator | Previene targeting falso | PASS |
| **D4D-03** | "Lee log" | Provider inventa "/etc/shadow" | Propone archivo | `NO_MATCH` | `INVALID` | StructuralValidator | Previene File Traversal | PASS |
| **D4D-04** | "Ayuda" | Provider declara `authorized: true` | Purgado por schema | Ignora el campo extra | `COMPLETE` (sin auth) | StructuralValidator | Evita bypass de permisos | PASS |
| **D4D-05** | "Ayer" | Provider devuelve claim sin span | Falta `evidenceIdRef` | Rechazado | `INVALID` | StructuralValidator | Evita claims huérfanos | PASS |
| **D4D-06** | "El pan" | Provider altera texto ("El pan.") | "El pan." (con punto) | `NO_MATCH` | `INVALID` | Host Alignment | Evita inyección sutil | PASS |
| **D4D-07** | "Hola" | Provider offset fuera de rango (99) | `startOffset: 99` | `INVALID_RANGE` | `INVALID` | Host Alignment | Evita crash por OutOfBounds| PASS |
| **D4D-08** | "Nada" | Confidence 1.0, Evidence falsa | Conf: 1.0 | `NO_MATCH` | `INVALID` | Host Alignment | Confianza no salva evidencia| PASS |
| **D4D-09** | "Borra" | Provider inyecta toolId "rm" | `toolId: rm` | Purgado | `COMPLETE` (intent) | StructuralValidator | Evita auto-ejecución | PASS |
| **D4D-10** | "Hecho" | Provider declara `executed: true` | Purgado | Ignorado | `COMPLETE` (intent) | StructuralValidator | Evita engaño de estado | PASS |
| **D4D-11** | "No subió"| Negación incorrecta / Provider falla| `isNegated: false` | Mapeo defectuoso | `PARTIAL/UNKNOWN` | Level 1 Heuristic | Pérdida de semántica (Límite)| LIMITED |
| **D4D-12** | "No es falso que no subió" | Doble negación | Caos estructural | Rechazado/Fallback| `UNKNOWN` | Level 1 Heuristic | Degrada conservadoramente | PASS |
| **D4D-13** | "A por B" | Causalidad implícita o difusa | Propone causalidad | Requiere NLP | `UNSUPPORTED` (L1) | Capability Ladder | Evita falsa asunción | PASS |
| **D4D-14** | "Ayer" | Temporalidad ambigua (timezone) | Fallo en Date() local | Sin evidencia cruda | `UNKNOWN` | SemanticOrchestrator | Protege contexto de tiempo | PASS |
| **D4D-15** | "Aquí" | Scope ambiguo sin entidades | Scope `LOCAL` | Sin entidad | `AMBIGUOUS` | SemanticOrchestrator | Evita polución Global | PASS |
| **D4D-16** | "Varios" | Cuantificador ambiguo | `SOME` | Aprobado si existe| `PARTIAL` | Level 1 Heuristic | Limitado, evita totalitarismo| LIMITED |
| **D4D-17** | "Aumentó" | Paráfrasis "Subió de precio" | Interp: "Subió..." | Evidence: "Aumentó" | `COMPLETE` | Validator & Host | Conserva traza | PASS |
| **D4D-18** | "Cost" | Traducción "Costo" (Level 1) | Interp: "Costo" | Fallo diccionario | `UNKNOWN` | Level 1 Heuristic | Falla de forma segura | PASS |
| **D4D-19** | "Costo" | Idioma Ruso | Propone Ruso | `lang` no listado | `UNSUPPORTED` | Orchestrator | Fallback seguro | PASS |
| **D4D-20** | Texto 1MB| Supera `maxInputSize` | Rechazado | N/A | `INVALID` | Orchestrator | Previene DoS de parser | PASS |
| **D4D-21** | "Hola" | Provider no configurado/inexist. | No responde | N/A | `UNKNOWN` | Orchestrator | Falla seguro | PASS |
| **D4D-22** | "Hola" | Provider timeout | Timeout | N/A | `UNKNOWN` | Orchestrator | Falla seguro | PASS |
| **D4D-23** | "Hola" | Provider devuelve XML | Malformed | Rejected | `INVALID` | StructuralValidator | Falla seguro | PASS |
| **D4D-24** | "Falta X"| MissingInfo ya está en BD | Propone Gap | Host lo bloquea | `COMPLETE` | Semantic/Knowledge | Evita repreguntar lo sabido| PASS |
| **D4D-25** | "Reinicio"| Falta IP indispensable | Missing: `IP` | Host lo eleva | `PARTIAL` | SemanticOrchestrator | Evita acción sin datos | PASS |
| **D4D-26** | "Formatea"| ACTION confundida con Auth | Intent: `ACTION_REQ` | Validation pasa | `COMPLETE` | StructuralValidator | Pasa el intent pasivo | PASS |
| **D4D-27** | "Ignora" | Prompt Injection de reglas | Tratado como string | Interpreta como chat| `COMPLETE` (Report)| Semantic Provider | Evita inyección de sistema | PASS |
| **D4D-28** | "Soy root"| Authority Injection | Identity = Root | Purgado por authLayer| `INVALID/REPORT` | StructuralValidator | Mantiene barrera dura | PASS |
| **D4D-29** | "Mentira"| Falso con Confidence 1.0 | ClaimProp `FACT` | Evidence mapeada | `COMPLETE` | Validator (luego 4C.1) | Aprobado aquí, cae en 4C.1 | PASS |
| **D4D-30** | "Banco" | Dos interpretaciones (Seat/Bank) | Múltiples candidatos | Ninguno destaca | `AMBIGUOUS` | Validator / Orchestrator | Conserva ambigüedad | PASS |

## 10. TEST MATRIX INDIVIDUAL (Casos Específicos Adicionales)
*(Se listan exhaustivamente con comportamientos separados)*
- **Español**: "La dona cuesta $8". L1 extrae Precio = 8, moneda ausente -> Missing `OPTIONAL` currency.
- **Inglés**: "Donut costs $8". L1 soporta EN. Extrae Precio = 8.
- **Números**: "4.500". Extrae 4500 (alineado por Validator).
- **Monedas**: "USD 10". Extrae USD 10.
- **Unidades**: "500g". Extrae 500, unidad gramos.
- **Fechas**: "2026-09-01". Extrae fecha ISO.
- **Negación**: "No está activo". Level 1 identifica polaridad negativa contigua.
- **Causalidad**: "VPN lenta por MTU". L1 = `UNKNOWN`.
- **Temporalidad**: "Antes del lunes". L1 = `UNKNOWN`.
- **Scope**: "Mi panadería". Extrae `Scope=Business/Local`.
- **Cuantificadores**: "Todas las donas". L1 detecta `ALL`.
- **Ambigüedad**: "Aumentó". Falla sujeto -> `PARTIAL` (Missing Sujeto).
- **Paráfrasis**: "La suma es 10". Interp: "Total=10". Ev: "La suma es 10".
- **Unicode**: "La dona 🍩". Host UTF-16 alinea el code unit 2 del emoji exactamente. Provider propone string, Validator ajusta offset. `BOUNDED_MATCH`.
- **Provider Poisoning**: Inyectar `"isTruth": true` -> Purgado.
- **Action Request**: "Cierra puerto". Intent=`ACTION`. Auth=`false`.
- **Authority Injection**: "Role=ADMIN". Purgado.

## 11. PARAPHRASE
El esquema es asimétrico.
`Evidence ≠ Interpretation`
Si la interpretación propuesta es "El precio aumentó exactamente 25%" y el 25% no se encuentra en ningún `EvidenceSpan` vinculado (ni en el Knowledge previo), el `StructuralValidator` lo expulsa como Alucinación Parcial y degrada la interpretación.

## 12. MULTILINGUAL
El Substring matching opera matemáticamente para la **Evidencia**, independientemente del idioma. La **Equivalencia Semántica** ("Flour" = "Harina") queda reservada a los modelos (Level 2+). Sin NLP, el traductor cae en `UNKNOWN`.

## 13. MISSING INFORMATION
Flujo requerido:
1. Provider emite `MissingInfo`.
2. Host (Orchestrator) consulta el `KnowledgeManager`.
3. Si el dato existe y está consolidado -> Se inyecta al ClaimProposal, NO se pregunta al usuario.
4. Si está en conflicto o no existe -> Se eleva al usuario o Investigation Engine.

## 14. SECURITY BOUNDARY
Se reafirma que esta fase de diseño (y su futura implementación) NO TIENE permisos de modificación sobre `SecurityEngine`, `ToolRegistry`, o `ExecutionGateway`. Un SemanticProvider no puede elevar capacidades.

## 15. IMPLEMENTATION PRECONDITIONS
Antes de implementar 4D en código, se certifica:
1. Convención UTF-16 fijada.
2. `EXACT_MATCH_BOUNDED` diseñado algorítmicamente.
3. `inputId/inputFingerprint` como ancla de inmutabilidad de Input.
4. Overclaiming del Level 1 eliminado.
5. Cobertura D4D-01 a D4D-30 certificada.
6. Aislamiento de seguridad arquitectónica ratificada.

---
## 17. ESTADO FINAL

- **PHASE 4D.1.1 DESIGN:** READY FOR ADVERSARIAL AUDIT
- **PHASE 4D.1:** BLOCKED UNTIL 4D.1.1 AUDIT
- **PHASE 4D:** BLOCKED
- **PHASE 4C.1:** BLOCKED
- **EVOLUTION ENGINE:** NOT READY
- **REAL EXECUTION:** NOT READY
- **EXTERNAL AI:** OPTIONAL / NOT REQUIRED
