# AI CORE PHASE 4C.2.4.3 - REMEDIATION REPORT V1

## 1. CAUSA DEL DOS Y ANÁLISIS DE COMPLEJIDAD
La auditoría adversarial en la Fase 4C.2.4.2 reveló una vulnerabilidad de Denegación de Servicio (DoS) por complejidad algorítmica (`HIGH`). El algoritmo responsable de calcular el número máximo de fuentes independientes (conjuntos cuyas raíces causales son mutuamente disjuntas) utilizaba una búsqueda por *backtracking* con complejidad $O(2^N)$, donde $N$ es el número de fuentes válidas asociadas a un claim.

Si un atacante lograba adjuntar decenas de fuentes (e.g. $N \ge 30$) con linajes intrincados, el algoritmo evaluaba miles de millones de ramas, bloqueando indefinidamente el Event Loop (un solo hilo) de Node.js.

## 2. PRESUPUESTO COMPUTACIONAL ELEGIDO
Se ha implementado una política de presupuesto computacional determinista:
- **`MAX_EXACT_SOURCES = 15`**: Límite estricto sobre el número de fuentes válidas que se someterán a cálculo exacto.
- **Justificación**: Para $N \le 15$, la complejidad en el peor de los casos evalúa $2^{15} = 32,768$ combinaciones, un cálculo que Node.js resuelve en menos de un par de milisegundos sin latencia perceptible. Para valores epistemológicamente normales (entre 1 y 5 fuentes), el impacto es $\sim 0$ ms.

## 3. ALGORITMO EXACTO Y LÍMITES
- **$N \le 15$**: Se ejecuta el algoritmo *backtracking* exacto y retorna el número máximo de unidades de corroboración causalmente independientes (Comportamiento sin pérdida de precisión).
- **$N > 15$**: Antes de iniciar ninguna iteración o exploración (previniendo así la explosión), el algoritmo de validación de fuentes (tanto en `ai-provenance.js` como en `ai-integrated-consolidation.js`) se detiene de inmediato y retorna el estado centinela: `'COMPUTATION_BUDGET_EXCEEDED'`.

## 4. TRATAMIENTO EPISTEMOLÓGICO (EPISTEMIC SAFETY)
Se han actualizado `consolidateClaim` y `rehydrate` para interpretar el agotamiento del presupuesto:
- Si `independentCount === 'COMPUTATION_BUDGET_EXCEEDED'`, el sistema reacciona conservadoramente clasificando el estado resultante del claim como `UNCERTAIN`. 
- **NO** se consolida automáticamente ni se promueve una aproximación a *Truth*. La certidumbre matemática no se inventa.

## 5. TESTS DISEÑADOS Y EJECUCIÓN
Se introdujo la suite `COMPLEXITY4C2.4.3` dentro de `test_phase4c24.js` que evalúa:
- **C43-01 / C43-05**: Exactitud con $N \le 15$.
- **C43-07 / C43-11**: Llenado masivo con $N=50$ fuentes independientes. Verifica el retorno inmediato de `'COMPUTATION_BUDGET_EXCEEDED'`.
- **C43-06**: Verifica que `rehydrate()` asigna con seguridad el estado `UNCERTAIN`.
- **C43-12 a C43-17**: Revalidación de que linajes derivados y copiados siguen evaluándose como mutuamente excluyentes dentro del presupuesto.

**TEST EXECUTION STATUS: NOT EXECUTED**
- El entorno de ejecución (Windows PowerShell) continúa careciendo de `node` en su PATH (CommandNotFoundException, Exit Code 1).
- Se conserva este estatus sin registrar falsos PASS, respetando la regla impuesta en FASE 4C.2.4.2.

## 6. LIMITACIONES RESTANTES
Al restringirse el límite a 15 fuentes, la funcionalidad "útil" de la máquina de consolidación decaerá elegantemente a un estado de incertidumbre (`UNCERTAIN`) si ocurre un *brigading* orgánico (por ejemplo, 16 investigadores proveen fuentes disjuntas legítimas). Esta degradación elegante prioriza la protección DoS (disponibilidad) sobre la consolidación (estado final de asimilación).

---
**ESTADO:**
**4C.2.4.3 = IMPLEMENTED / PENDING ADVERSARIAL AUDIT**
