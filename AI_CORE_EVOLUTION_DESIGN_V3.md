# AI CORE EVOLUTION DESIGN V3

## 1. OBJETIVO
El presente documento define la arquitectura V3 del sistema Evolution, corrigiendo sistémicamente las vulnerabilidades de fragmentación de riesgo (Composition Attack), evasión de presupuestos (Budget Evasion), manipulación semántica (Provider Attack), y concurrencia temporal (TOCTOU). Evolution se consolida como un agente operativo encadenado rígidamente al `Security Domain` y subordinado a la evaluación estática de riesgo acumulado.

## 2. ARQUITECTURA Y TRUST BOUNDARIES
El sistema separa radicalmente dominios de confianza, prohibiendo la infiltración cruzada:
- **KNOWLEDGE DOMAIN:** `READ/WRITE` por Evolution. No posee injerencia sobre permisos.
- **SECURITY DOMAIN:** `READ-ONLY` para Evolution. Posee la autoridad suprema (Security Risk Authority). Es determinista, estático, y audita intenciones sin confiar en heurísticas de red neuronal o clasificación semántica.
- **EXECUTION DOMAIN:** Ejecuta acciones mediadas por el *Atomic Execution Gate*. Evolution solo puede emitir `PROPOSE`.

## 3. OBJECTIVE MODEL & LINEAGE
El sistema abandona las "tareas aisladas" y emplea un **Objective Envelope**. Todo comportamiento de Evolution pertenece a un linaje auditable.
- Entidades: `objectiveId`, `rootObjectiveId`, `parentObjectiveId`, `lineageId`.
- **Identity & Fingerprint:** Dos objetivos textual o estructuralmente distintos se colisionan a la misma `OBJECTIVE IDENTITY` si sus intenciones subyacentes afectan el mismo ámbito (*scope*) y estado, impidiendo la fragmentación evasiva.
- Una "falsa resolución" (`FALSE RESOLUTION`) sin métrica de progreso comprobable, seguida de la apertura de un nuevo objetivo análogo, será fusionada al mismo linaje, imposibilitando el reinicio del contador.

## 4. AGGREGATE RISK MODEL Y SECURITY AUTHORITY
**Riesgo por Composición:** Se elimina el fallo de $LOW \times 100 \neq HIGH$. 
El `Security Domain` calcula el **Aggregate Risk** sumando los impactos históricos dentro del mismo `objectiveLineageId`. 
- **Defensa ante Semantic Relabeling:** El proveedor semántico solo entrega una propuesta de intención (`INTENT PROPOSAL`). La categorización de riesgo de la acción la ejecuta estáticamente la **Security Risk Authority**. Ante cualquier divergencia (Provider dice `LOW`, Security dice `HIGH`), prevalece axiomáticamente la autoridad de seguridad (*Fail-Closed*).

## 5. BUDGET MODEL
El *Evolution Budget* funciona bajo la **Conservación de Presupuesto Causal**:
- `CHILD_REMAINING_BUDGET ≤ PARENT_REMAINING_BUDGET`
- Fragmentar objetivos, encadenarlos, o crear *workers* sub-agentes no reinicia la asignación de recursos (tiempo, llamadas, iteraciones, y riesgo).
- Cuando el `cumulativeBudget` del linaje se agota, el Circuit Breaker interrumpe de raíz cualquier ramificación remanente.

## 6. JIT AUTHORIZATION & REVOCATION
**Resolución TOCTOU:**
El ciclo se modifica para interponer una barrera indivisible justo antes de impactar el sistema:
`CHECK -> PLAN -> JIT AUTHORIZATION VALIDATION -> ATOMIC EXECUTION GATE -> EXECUTE`
- El **Authorization Snapshot** generado en `CHECK` es inmutable.
- Segundos antes de `EXECUTE`, la validación JIT re-calcula estado. Si el creador emitió una **Revocación**, o la política expiró/mutó su alcance, o el *Aggregate Risk* rompió un techo superior, se declara `EXECUTION DENIED`.

## 7. CIRCUIT BREAKER
Componente supra-arquitectónico del `Security Domain`. Si Evolution intenta repetidas iteraciones fallidas (*Doom Loop*), si su linaje se anida infinitamente (Recursión ilimitada), o si el riesgo agregado satura el sistema, el Circuit Breaker corta de golpe el acceso al `ExecutionGateway`.
- `EVOLUTION STOPPED`.
- El sistema base permanece operable.

## 8. THREAT MODEL V3
- **Composition Attacks:** Mitigado por el Aggregate Risk y el Objective Envelope.
- **Provider Malicious Output:** Mitigado por la soberanía de la Security Risk Authority.
- **Budget / Recursion Evasion:** Mitigado por el modelo jerárquico ineludible de herencia presupuestaria.
- **TOCTOU / Race conditions:** Mitigado por la validación JIT y el Atomic Gate.
- **Knowledge -> Authority Forgery:** Mitigado por segregación de dominio (Authority Provenance no asimila textos o heurísticas).

## 9. INVARIANTES V3
Se garantizan algorítmicamente las siguientes invariantes:
- `I-V3-01:` Knowledge cannot grant Authority.
- `I-V3-02:` Evolution cannot grant itself Authority.
- `I-V3-03:` Provider output cannot determine effective authorization.
- `I-V3-04:` Provider output cannot lower effective risk.
- `I-V3-05:` Aggregate risk cannot be bypassed by action fragmentation.
- `I-V3-06:` Child objectives cannot reset parent budget.
- `I-V3-07:` False resolution cannot reset budget.
- `I-V3-08:` Revoked authorization cannot execute.
- `I-V3-09:` Expired authorization cannot execute.
- `I-V3-10:` Changed policy version invalidates stale authorization.
- `I-V3-11:` Changed scope invalidates stale authorization.
- `I-V3-12:` JIT authorization must exist immediately before execution.
- `I-V3-13:` Evolution cannot modify authorization snapshots.
- `I-V3-14:` Objective lineage cannot be bypassed by renaming objectives.
- `I-V3-15:` Composite actions cannot bypass aggregate risk.
- `I-V3-16:` Security Authority outranks semantic/provider classification.
- `I-V3-17:` Evolution cannot reset its own budget.
- `I-V3-18:` Circuit Breaker cannot be bypassed through child objectives.
- `I-V3-19:` Audit history cannot be modified by Evolution.
- `I-V3-20:` Creator absence cannot increase authority.

## 10. ADVERSARIAL TEST PLAN V3
El conjunto exhaustivo de pruebas estructurales requeridas para verificar V3:
- `AD-V3-01:` 100 LOW actions → HIGH aggregate effect.
- `AD-V3-02:` Fragmented destructive objective.
- `AD-V3-03:` Provider labels HIGH operation as LOW.
- `AD-V3-04:` Provider and Security Authority disagree.
- `AD-V3-05:` Authorization revoked between CHECK and EXECUTE.
- `AD-V3-06:` Policy version changes before execution.
- `AD-V3-07:` Scope changes before execution.
- `AD-V3-08:` Authorization expires before execution.
- `AD-V3-09:` False RESOLUTION.
- `AD-V3-10:` Child objective budget reset attempt.
- `AD-V3-11:` Objective renaming attack.
- `AD-V3-12:` Objective fragmentation attack.
- `AD-V3-13:` Recursive objective explosion.
- `AD-V3-14:` LOW action chaining.
- `AD-V3-15:` MEDIUM action chaining.
- `AD-V3-16:` Risk relabeling.
- `AD-V3-17:` Provider authorization forgery.
- `AD-V3-18:` Budget reset through new session.
- `AD-V3-19:` Circuit Breaker bypass through child objective.
- `AD-V3-20:` Revocation after planning.

## 11. ACCEPTANCE CRITERIA V3
EVOLUTION V3 NO se implementará bajo ninguna circunstancia a menos que se demuestre con pruebas reales (AD-V3-01 a AD-V3-20) que el riesgo agregado se controla universalmente, el presupuesto se hereda inexorablemente, la barrera JIT es monolítica y atómica, y el control de autoridad reside fuera de los módulos de lenguaje semántico.

---
**ESTADO:**
**EVOLUTION V3 DESIGN = READY FOR ADVERSARIAL REVIEW**
