# AI CORE EVOLUTION V5 - IMPLEMENTATION LIMITATIONS

## ESTADO EXPERIMENTAL
La implementación actual de `Evolution V5` es estrictamente estructural y experimental. **NO ES SEGURA PARA PRODUCCIÓN**.
Se basa en el diseño `AI_CORE_EVOLUTION_DESIGN_V5.md`, pero arrastra explícitamente 10 vulnerabilidades fundamentales detectadas en la auditoría adversarial. Estas limitaciones no se han parcheado artificialmente para respetar la pureza del diseño y evitar falsas garantías.

## LIMITACIONES CONOCIDAS (KNOWN LIMITATIONS)

### CRITICAL
1. **Time-Travel Epoch Attack:** La implementación confía en `Date.now()` o relojes lógicos del sistema. Si el reloj es alterado externamente antes de un *crash*, el sistema puede restaurar estados maliciosos y descartar el estado seguro (al evaluar incorrectamente cuál es más reciente).
2. **Canonical Parser Desync:** No se ha implementado la serialización estricta binaria determinista (como Protobuf). Un payload JSON o String podría generar ASTs (Abstract Syntax Trees) diferentes en `SecurityEngine` respecto a `Cognition`, permitiendo inyecciones que bypassan la seguridad canónica.
3. **Fail-Closed Permanent Lockout (Bricking):** Si el log de eventos de seguridad (audit log) o la memoria de contingencia se corrompe parcialmente, el sistema no puede matemáticamente probar que es seguro y aplica `Fail-Closed`. El sistema queda inoperativo permanentemente sin un mecanismo de *Safe Mode*.

### HIGH
4. **False-Flag Security Revocation:** `Evolution` no tiene permisos de escritura en *Security*, pero puede proponer deliberadamente una acción altamente maliciosa bajo un `GlobalOperationId` legítimo de otra tarea. Esto provocará que *Security* detecte la amenaza y castigue el `GlobalOperationId` completo, revocando permisos legítimos de tareas hermanas y generando un *Denial of Service* orquestado por la propia IA.
5. **Causal Graph Cycle-Masking:** El `Provenance Graph` no detecta referencias circulares si el texto es parafraseado. Evolution puede ofuscar el `content fingerprint` en cada salto de una cita circular, forzando a que la corroboración cuente raíces idénticas como independientes.
6. **Oracle Starvation via Complexity:** El `Progress Oracle` utiliza evaluación determinista local sincrónica. Si Evolution somete una prueba estructuralmente válida pero de complejidad exponencial (e.g. validación de grafos enormes), el hilo del oráculo se bloquea permanentemente, causando *Starvation* en el dominio de verificación.
7. **Semantic Obfuscation of GlobalOperationId:** Un mismo ataque destructivo orquestado puede ser fragmentado usando lenguajes y herramientas drásticamente distintos (Python vs Curl). El heurístico de agrupación de `GlobalOperationId` puede fallar, permitiendo *bypass* del presupuesto global asignado a ese linaje de ataque.

### MEDIUM
8. **Contradiction Governor Overflow:** El sistema de de-duplicación de conflictos (`SAME_CONFLICT`) puede ser evadido inyectando ruido aleatorio (*seeds*) en las afirmaciones. Esto agota las colas del gobernor, inundando el sistema con paradojas artificiales.
9. **Phantom Resource Reservation Leak:** La reserva atómica es segura en su diseño teórico (`reserveAtomically`), pero si un error asíncrono o crash destruye el hilo antes del *commit* o *release*, los recursos quedan lógicamente bloqueados de por vida, fugando capacidad computacional.
10. **Resource Starvation via "I DON'T KNOW YET":** La regla que impone que ante falta de certeza el estado sea `UNKNOWN_PENDING_EVIDENCE` permite ataques de denegación por paradojas. Una pregunta circular fuerza infinitas resoluciones de investigación estériles que agotan la cuota global operativa de `Evolution`.

---
**RESOLUCIÓN:**
Se prohíbe explícitamente el pase a **EXECUTION = READY** hasta que una arquitectura de rediseño (V5.1 o V6) subsane mediante *sandboxing* de memoria, relojes lógicos criptográficos, y aislamiento físico de ASTs estas amenazas conocidas.
