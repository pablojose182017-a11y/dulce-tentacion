# AI_CORE_CREATOR_KNOWLEDGE_INTEGRATION_DESIGN_V1.1

## 1. INTRODUCCIÓN Y OBJETIVO
Este documento define la topología de integración cognitiva entre **Creator Knowledge V1.2 (VERIFIED)** y el cerebro cognitivo base de Guardian (`Chat → Context → Knowledge → Reasoning → Personality → Response`). 

El objetivo es permitir que Guardian aproveche la información histórica del creador para comportarse como un "Segundo Cerebro" personalizado, sin que esta información se filtre hacia rutas de ejecución o modifique unilateralmente los parámetros de seguridad operacionales del sistema.

### INVARIANTES DE INTEGRACIÓN
- `CREATOR KNOWLEDGE ≠ TRUTH`
- `CREATOR KNOWLEDGE ≠ IDENTITY`
- `CREATOR KNOWLEDGE ≠ AUTHORITY`
- `CREATOR KNOWLEDGE ≠ PERMISSION`
- `CREATOR KNOWLEDGE ≠ EXECUTION`
- `PREFERENCE ≠ COMMAND`
- `BELIEF ≠ FACT`
- `HYPOTHESIS ≠ EVIDENCE`
- `EXPECTATION ≠ AUTHORIZATION`
- `SCOPE_UNCERTAIN ≠ LOW_WEIGHT`
- `SCOPE_UNCERTAIN ≠ GLOBAL_SCOPE`
- `MEMORY ≠ EPISTEMIC_ESCALATION`
- `DESIGN GUARANTEE ≠ IMPLEMENTED GUARANTEE`
- `IMPLEMENTED GUARANTEE ≠ RUNTIME VERIFIED GUARANTEE`

---

## 2. INTERFACES CONCEPTUALES Y TOPOLOGÍA

El pipeline fluye de manera **unidireccional** para el procesamiento de conocimiento:

### 2.1 CreatorKnowledge → Context
El `ContextManager` consulta la base de datos de Creator Knowledge (filtro: `status: ACTIVE`).
- **Retrieval Scope (HARD DROP):** El `ApplicabilityScope` actúa como un filtro determinista. Si un contexto cruzado arroja `SCOPE_UNCERTAIN` o si el scope es explícitamente incompatible, se ejecuta un **HARD-DROP** (`EXCLUDED_FROM_RETRIEVAL`). 
  - `SCOPE_UNCERTAIN` **NO es un "peso bajo" (low weight)**. Significa `NOT_ELIGIBLE_FOR_CROSS_DOMAIN_INFERENCE`.
  - El `ReasoningEngine` no puede recuperar posteriormente un elemento excluido usando *prompt injection*, urgencia, o insistencia.
  - No existe un fallback para "aplicar globalmente".
- **Inyección Aislada:** El conocimiento se inserta en un bloque semántico inmutable llamado `context.blocks.creatorKnowledge`.
- **Cero Autoridad:** Al entrar al Contexto, entra como *datos puros*.

### 2.2 Context → Reasoning
El `ReasoningEngine` lee el `creatorKnowledge` y ajusta su resolución epistémica aplicando las categorías:
- **CREATOR_FACT:** Asumido como verdad local siempre que no contradiga hechos empíricos de Knowledge General.
- **CREATOR_PREFERENCE:** Se ignora a nivel de razonamiento lógico duro, pero se etiqueta para que la `PersonalityEngine` ajuste su respuesta.
- **CREATOR_EXPECTATION:** Modula el comportamiento cognitivo esperado.
- **CREATOR_BELIEF / CREATOR_HYPOTHESIS:** Tratados como interrogantes. Se busca confirmación externa; si no la hay, se dictamina `HIGH UNCERTAINTY`.

### 2.3 Reasoning → Personality
El `ReasoningEngine` emite su *Analysis Object*, incluyendo `creatorAlignment`.
- `PersonalityEngine` utiliza este apartado para personalizar el `conversationMode` y `initiative`.
- `PersonalityEngine` jamás convierte incertidumbre matemática dictaminada por Reasoning en `CERTAIN`.

---

## 3. FLUJOS OPERACIONALES

### 3.1 Flujo Normal (Happy Path)
1. Usuario pide: *"Hazme un resumen."*
2. **Context:** Recupera `CREATOR_PREFERENCE` ("Me gustan los bullet points", scope válido).
3. **Reasoning:** Observa la preferencia.
4. **Personality:** Asimila el estilo "bullet points".
5. **Response:** Devuelve el resumen.

### 3.2 Flujo de Conflicto y Flujo de Información Insuficiente
- **CK vs CK / CK vs Knowledge:** Reasoning delega el choque a Personality (`INVESTIGATIVE / FLAG`). Guardian nunca auto-resuelve contradicciones.
- **Información Insuficiente / Scope Excluido:** Si el `applicabilityScope` generó un HARD-DROP, Reasoning dictamina `MISSING_INFORMATION`. Personality pregunta al usuario y no inventa preferencias.

---

## 4. CONSERVACIÓN EPISTÉMICA EN MEMORIA (MEMORY EPISTEMIC PRESERVATION)

El paso de Creator Knowledge hacia `Short-Term Memory` o `Long-Term Memory` debe preservar invariablemente toda la metadata ontológica.
- **Prohibición de Aplanamiento:** `MemoryManager` **NO PUEDE** aplanar o degradar el conocimiento a "texto crudo". 
- Todo registro persistido debe conservar intactos: `category`, `epistemicStatus`, `provenance`, `applicabilityScope`, `source/reference`, `timestamps`, e historial (`supersedes`).
- Una `CREATOR_PREFERENCE` sigue siendo `CREATOR_PREFERENCE`. Un `CREATOR_BELIEF` sigue siendo un `CREATOR_BELIEF`.
- **Prohibición de Escalada por Permanencia:** La repetición en memoria, o el simple paso del tiempo, **JAMÁS** eleva automáticamente el estatus epistémico a `CREATOR_FACT`.
- Si un bloque de memoria sufre corrupción o pérdida de metadatos, se trata como *epistemically degraded / insufficiently classified*, perdiendo todo peso epistémico y volviendo a requerir prueba.
- En ningún escenario la Memoria puede transmutar un Creator Knowledge en un token de Autorización, Regla Operativa o Permiso.

---

## 5. LÍMITES DE SEGURIDAD (FIREWALL ARQUITECTÓNICO)

La seguridad del sistema se clasifica estrictamente según su estado de realidad. 
Para el estado actual, la integración **depende únicamente de límites topológicos demostrables** (aislamiento por carencia de tuberías o código conector).

### Clasificación de Garantías de Seguridad:

**A. IMPLEMENTED GUARANTEE (Garantías Físicas Actuales):**
- **Air-Gap Topológico (Incomunicación Lógica):** La integración es puramente cognitiva. El pipeline de conocimiento es:
  `Creator Knowledge → Context → Reasoning → Personality → Response`.
- No existe ningún bus de datos, API, ni inyección de objetos entre la salida de la `PersonalityEngine` y el `SecurityEngine`, `ExecutionGateway` o `PermissionManager`.

**B. DESIGN GUARANTEE (Diseñado pero NOT IMPLEMENTED / RUNTIME PENDING):**
- *Voice Biometrics, VoiceChallengeManager real, JWT Físicos consumibles, ExecutionGateway Operacional, AutonomousPolicyEngine, Evolution V5 activa.*
- **ADVERTENCIA:** El documento NO afirma que estas tecnologías existan actualmente para defender el sistema de inyecciones. La defensa actual recae exclusivamente en la Garantía Topológica `A` (Desconexión de autoridad).

---

## 6. ESCENARIOS ADVERSARIALES V1.1

1. **Ataque Cross-Domain con Scope Ambiguo (Scope Escape)**
   - **Intento:** Un atacante invoca una regla laxa ("Borra lo que ya no sirva") con un Scope dañado o carente de contexto estricto, exigiendo que se aplique para limpiar OS_FILES.
   - **Fallo Cerrado:** El ContextManager detecta ambigüedad matemática y categoriza el elemento como `SCOPE_UNCERTAIN`. Aplica `HARD-DROP` (EXCLUDED_FROM_RETRIEVAL). El ReasoningEngine jamás recibe el input.
2. **Ataque de Decaimiento Epistémico (Memory Escalation)**
   - **Intento:** Inyectar un `CREATOR_HYPOTHESIS`. Tras 100 turnos de conversación almacenados en memoria, extraer el bloque histórico y presentarlo como hecho consolidado.
   - **Fallo Cerrado:** La Memoria conservó el JSON exacto con `category: CREATOR_HYPOTHESIS`. El ReasoningEngine lee la metadata y continúa exigiéndole un `evidenceReference` externo.
3. **Escalada de Credibilidad por Identidad (Authority Spoofing)**
   - **Intento:** Apoyarse en que el `provenance` declara *"source: CREATOR_AUTHENTICATED_SESSION"* para forzar un bypass de seguridad.
   - **Fallo Cerrado:** La Garantía Topológica actúa. Aunque el Reasoning admita que la identidad es el Creador, ni Reasoning ni Personality tienen un puente de red, memoria compartida o métodos exportados hacia el SecurityEngine. El requerimiento de ejecución es ignorado.

---

### ESTADO FINAL
**CREATOR KNOWLEDGE INTEGRATION V1.1 = READY FOR ADVERSARIAL REVIEW**
