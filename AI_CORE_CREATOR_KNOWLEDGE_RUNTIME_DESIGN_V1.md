# AI_CORE_CREATOR_KNOWLEDGE_RUNTIME_DESIGN_V1.1

## A. ARQUITECTURA Y RESPONSABILIDADES
La capa de Runtime abstrae las operaciones estructurales e impone las invariantes físicas entre el almacenamiento y la cognición.
- **CreatorKnowledgeStore:** Subsistema transaccional de base de datos *Cryptographic Append-Only*.
- **CreatorKnowledgeManager:** *Gatekeeper* y controlador lógico transaccional. Valida ingresos, orquesta mutaciones atómicas, valida rehidratación y despacha *snapshots* (Deep Clones).
- **CreatorKnowledgeRecord:** Estructura de datos inmutable.
- **ScopeFilter:** Filtro determinista en etapa de recuperación (*Retrieval*).

## B. MODELO DE DATOS Y ENCADENAMIENTO CRIPTOGRÁFICO
La estructura central encapsula semántica y auditoría:
- `knowledgeId`: UUID/Hash único.
- `category` y `statement`.
- `applicabilityScope` y `provenance`.
- `evidenceReference`, `status`, `supersedesId` y `timestamp`.
- **NUEVO V1.1 - `integrityRecord`:**
  - `recordId`: ID local para la cadena.
  - `canonicalContentFingerprint`: Hash del JSON canónico estricto.
  - `previousRecordFingerprint`: Hash del registro inmediatamente anterior (Hash Chaining).
  - `sequenceNumber`: Orden secuencial inmutable.
  - `schemaVersion`: Versión del modelo para parseo.

## C. CRYPTOGRAPHIC APPEND-ONLY (Límites de Confianza)
La base de datos impone una cadena determinista. Una modificación, sustitución, inserción u omisión física rompe la cadena detectablemente.
- Si la cadena presenta: Fingerprint incorrecto o previo incorrecto, secuencia inconsistente, o registro omitido/modificado = **FAIL-CLOSED** general de la rehidratación.
- **Límite de Confianza Documentado:** `HASH CHAIN ≠ ABSOLUTE IMMUTABILITY`. El encadenamiento de Hashes detecta modificaciones asimétricas. **NO es protección absoluta** contra un atacante (Ej. malware de OS) que posea control total del almacenamiento, elimine el archivo, lo reescriba por completo de cero con un Hash válido, y reescriba la raíz de confianza. 
- Para detectar reescritura total, se requerirá un *Integrity Checkpoint* (Raíz de Integridad) guardado fuera de la secuencia mutable. Esta capa no actúa como SecurityEngine ni tiene autoridad ejecutiva sobre el OS.

## D. INTEGRIDAD EN REHIDRATACIÓN (Rehydration Flow)
Nunca se carga directamente el JSON persistido como estado confiable (`PERSISTED JSON ≠ TRUSTED STATE`). El arranque obedece este flujo transaccional:
1. `STORAGE` → 2. `READ` → 3. `STRUCTURAL VALIDATION` → 4. `CANONICALIZATION` → 5. `INTEGRITY VALIDATION` (Hash Chain) → 6. `EPISTEMIC INVARIANT VALIDATION` → 7. `PROVENANCE VALIDATION` → 8. `SCOPE VALIDATION` → 9. `CONSISTENCY VALIDATION` → 10. `ATOMIC COMMIT` en RAM.

**Reglas de Rehidratación:**
- Se verifica `schemaVersion`, tipos, *fingerprint*, historia (`supersedes`) y conflictos.
- `REHYDRATION ≠ BLIND DESERIALIZATION`. Si un registro dice ser `FACT` en el JSON pero su `evidenceReference` es inexistente o nulo, la rehidratación se detiene.
- No se reconstruyen datos faltantes, no se corrigen corrupciones silenciosamente.
- `EPISTEMIC STATUS MUST NEVER ESCALATE DURING REHYDRATION`.
- Fallo en cualquier paso = **FAIL-CLOSED** (Sin commit parcial en memoria).

## E. ATOMICIDAD TRANSACCIONAL
Las operaciones de mutación de conocimiento (Especialmente `INSERT NEW RECORD` + `UPDATE SUPERSEDES RELATIONSHIP`) son **una única transacción lógica**.
- **Flujo Atómico:** `BEGIN TRANSACTION` → `VALIDATE ALL` → `PREPARE ALL` → `COMMIT ATOMIC` → `VERIFY`.
- **Estados Internos Transaccionales:**
  - `PREPARED`: Listo en memoria y disco, pendiente de sellado.
  - `COMMITTED`: Completado con éxito, visible para ContextManager.
  - `ABORTED`: Fallido, descartado completamente de memoria.
  - `RECOVERABLE`: Estado temporal post-reinicio.
- Si ocurre caída de energía, OOM, crash, o fallo de escritura **antes del commit**, la operación no quedará visible como estado confirmado (`PARTIAL COMMIT ≠ VALID STATE`).
- Tras un reinicio, las transacciones incompletas (`RECOVERABLE`) no se asumen válidas. Deben ser descartadas o revertidas determinísticamente para no dejar una relación `supersedes` coja. El ContextManager solo observa el estado `COMMITTED`.

## F. FLUJOS DE RETRIEVAL, CONTEXT Y MEMORY
- `SCOPE_UNCERTAIN` produce HARD-DROP.
- El ContextManager apila clones en `context.blocks.creatorKnowledge`.
- La Memoria persiste la metadata íntegra, impidiendo el aplanamiento de datos.

## G. TRUST MODEL Y TRUST BOUNDARIES
Se distingue arquitectónicamente entre:
- **Integridad Lógica:** (Tipos y dominios, a cargo de validaciones de JSON).
- **Integridad Criptográfica:** (Fingerprints y cadenas, a cargo del Integrity Checkpoint).
- **Atomicidad:** (A cargo del manejador transaccional interno, no del OS).
- **Confianza en el almacenamiento:** Nula. El archivo se asume inherentemente hostil al arrancar.
- **Raíz de Confianza:** La firma local generada en base al último checkpoint certificado de la cadena. (El Runtime no asume seguridad biométrica hardware).

Ningún bloque tiene puentes API hacia el **SecurityEngine**, **ToolRegistry** o **ExecutionGateway**.

## H. SECURITY INVARIANTS V1.1
1. `CREATOR KNOWLEDGE ≠ TRUTH`
2. `CREATOR KNOWLEDGE ≠ IDENTITY`
3. `CREATOR KNOWLEDGE ≠ AUTHORITY`
4. `CREATOR KNOWLEDGE ≠ PERMISSION`
5. `CREATOR KNOWLEDGE ≠ EXECUTION`
6. `PERSISTED JSON ≠ TRUSTED STATE`
7. `REHYDRATION ≠ BLIND DESERIALIZATION`
8. `HASH CHAIN ≠ ABSOLUTE IMMUTABILITY`
9. `PARTIAL COMMIT ≠ VALID STATE`
10. `CORRUPTED HISTORY → FAIL-CLOSED`
11. `EPISTEMIC STATUS MUST NEVER ESCALATE DURING REHYDRATION`

## I. THREAT MODEL Y CASOS ADVERSARIALES
1. **Modificación Histórica Asimétrica:** Intentar cambiar un JSON pasado.
   *Efecto de Defensa:* El `previousRecordFingerprint` del siguiente bloque se descalabra. La rehidratación rechaza la base de datos (Fail-Closed).
2. **Reescritura Total Simétrica:** Un atacante sobrescribe toda la DB re-calculando hashes legítimos.
   *Efecto de Defensa:* La capa de Knowledge detecta la manipulación si existe un Integrity Checkpoint externo. (Nota: Esto requiere seguridad en el OS/SecurityEngine, no es potestad de Knowledge detener malware).
3. **Fallo de Energía durante Actualización:** Caída al escribir el supersedes.
   *Efecto de Defensa:* La rehidratación halla un bloque en estado `PREPARED` sin commit. Aplica Rollback o lo descarta. El ContextManager nunca lee verdades a medias.

---
### ESTADO ACTUAL
**CREATOR KNOWLEDGE RUNTIME DESIGN V1.1 = READY FOR ADVERSARIAL REVIEW**
