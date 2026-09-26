# AI CORE - CREATOR & VOICE IDENTITY DESIGN V1.2

## 1. CREATOR IDENTITY MODEL
Se establece una identidad local y persistente denominada `CREATOR_IDENTITY`. Esta entidad representa la máxima autoridad operacional (humana) con la que el Guardián interactúa.
- **Separación de roles:** `CREATOR_IDENTITY` es estrictamente diferente de la Personalidad, Memoria, Conocimiento, Autoridad y Motor de Voz.
- **Rol en Autorización:** Ser reconocido como Creador legitima a la identidad como *fuente válida* para emitir comandos operacionales. **Identidad ≠ Autorización Automática**. Un comando del Creador debe someterse a las políticas de seguridad.

## 2. ACTIVE VOICE CHALLENGE & DEEPFAKE RESISTANCE
La identificación vocal depende de un **Active Voice Challenge**, reconociendo explícitamente las limitaciones de la detección acústica local frente a *Deepfakes*.
- **Limitación declarada:** Responder correctamente y a tiempo demuestra conocimiento de la respuesta y correlación temporal, pero **no** demuestra inherentemente identidad biométrica absoluta (debido a modelos generativos de baja latencia).
- **Enfoque Multi-señal:** El sistema combinará heurísticas acústicas independientes. Si hay insuficiencia de señales (ej. solo texto correcto sin validación espectral confiable), el sistema aplicará **FAIL-CLOSED**.
- **Estados de Identidad Local:**
  - `LIVE`: Único estado que aporta evidencia biométrica válida. No autoriza directamente, solo actúa como input de identidad para `Security Authority`.
  - `REPLAY_SUSPECTED`: Atributos acústicos o criptográficos sugieren reutilización.
  - `SPOOF_SUSPECTED`: Anomalías generativas o sintéticas.
  - `INCONCLUSIVE`: Falta de certeza.
  - `IDENTITY_UNCERTAIN`: Estado de caída global por error o inconsistencia.
  *Cualquier estado distinto a `LIVE` prohíbe el paso de identidad al motor de seguridad.*

## 3. NONCE & ATOMIC CHALLENGE CONSUMPTION (Replay & Race Condition)
El Challenge está sellado contra reutilización y ataques de concurrencia:
- **Estructura Criptográfica Inmutable:** Desde su creación, el Challenge vincula de solo lectura: `challengeId`, `nonce`, `authorizationRequestId`, `canonicalParameterFingerprint`, `securityEpoch` (expiración), y `consumedState`. El receptor no puede alterar estos valores durante la validación.
- **Consumo Atómico:** La validación exige una transición atómica e indivisible (`VALIDATE -> CONSUME`) usando *Compare-And-Swap (CAS)*. Dos hilos concurrentes que procesen la misma respuesta jamás podrán validar el mismo token simultáneamente; el primero muta el estado, el segundo es rechazado.

## 4. DETERMINISTIC PARAMETER CANONICALIZATION
Para evitar que manipulaciones en el formato generen falsas colisiones o evasión de *fingerprints*:
- Todos los parámetros pasan por una serialización estricta antes del hash:
  `Raw Parameters` → `Strict Deterministic Canonicalization` → `Canonical Representation` → `Cryptographic Hash` → `Parameter Fingerprint`.
- **Autoridad:** El `SecurityEngine` impone esta canonicalización para asegurar el orden estricto de claves, eliminación de espacios, unificación Unicode, tipos de datos estrictos y resolución de nulos.
- **Cross-Context Replay Block:** Una voz que supera el challenge en el contexto A, inyectada en el contexto B, fallará matemáticamente al diferir el *fingerprint* canónico de la nueva acción.

## 5. MONOTONIC SECURITY TIME (Desync Protection)
La validez temporal no confía en el reloj civil (OS Wall-Clock):
- **Wall-Clock Time:** Reservado estrictamente para registro visual y auditoría informativa.
- **Monotonic Security Time:** El `SecurityEngine` mantiene un reloj lógico (Epoch) inalterable para validar expiraciones de *Challenges*. 
- **Inmutabilidad:** Un usuario o atacante alterando el reloj del OS, o un reinicio del sistema, no logrará revivir *Challenges* expirados, alterar su secuencia, prolongar su vigencia ni engañar las ventanas de tiempo del *Liveness*.

## 6. FALLBACK & FAIL-CLOSED
Ante cualquier ambigüedad en el proceso:
- Fallo de hardware (micrófono), timeout de seguridad (Epoch), concurrencia fallida, *Liveness* inconcluso, o discrepancia canónica de parámetros.
**Resultado Absoluto:** `IDENTITY_UNCERTAIN`.

## 7. LOCAL-FIRST
Toda la computación biométrica, canónica y criptográfica operará de forma **100% local (Offline)** sin depender de *cloud voice*, APIs externas, LLMs externos ni Internet.

## 8. SEPARACIÓN FUNDAMENTAL
La arquitectura impone una cadena hermética inalterable:
`VOICE` (Evidencia biométrica) ≠ `IDENTITY` (Sujeto Operacional) ≠ `AUTHORIZATION` (Permiso) ≠ `EXECUTION` (Impacto Físico).

## 9. FLUJO DE AUTORIZACIONES SENSIBLES
1. `VOICE INPUT` capturado tras generación del `authorizationRequestId`.
2. `Active Voice Challenge` exigido por riesgo `HIGH`.
3. Usuario responde (verificación de semántica y acústica).
4. El token se consume atómicamente (`VALIDATE -> CONSUME`).
5. `Security Authority` recibe `CREATOR` + `LIVE`, valida canónicamente los parámetros y aplica `Policy Check`.
6. `ExecutionGateway` recibe el Token criptográfico final.
7. `EXECUTION`.

## 10. CREATOR AUTHORITY LIMITS
- El Creador no puede ordenar la eliminación o mutación retroactiva de *Audit Logs*.
- No puede saltarse restricciones absolutas incrustadas en el hardware/software del `SecurityEngine`.
- Sus afirmaciones fácticas no se convierten mágicamente en Autoridad o Conocimiento Inmutable (`Knowledge ≠ Authority`).

---
**CREATOR IDENTITY V1.2**
**STATUS = READY FOR ADVERSARIAL REVIEW**
