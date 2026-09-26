# AI CORE PHASE 4C.2.4.2 - ARCHITECTURAL REVIEW V1

## 1. EL PROBLEMA ACTUAL
La arquitectura de la Fase 4C.2.4.1 introdujo vulnerabilidades críticas en el proceso de consolidación de conocimiento:
- **Falsa Corroboración:** La métrica `roots.size` se incrementaba por cada raíz descubierta. Una única fuente maliciosa reportando múltiples padres artificiales inflaba artificialmente la cuenta de corroboración, alcanzando niveles de consolidación (`CONSOLIDATED`) sin corroboración real independiente.
- **Inmutabilidad Rota:** El uso de `Object.freeze()` sobre un objeto `Map` en `rehydrate()` no previene el uso del método `.set()`, rompiendo el aislamiento de lectura-escritura.
- **Falsos Positivos en Tests:** La imposibilidad de ejecutar pruebas locales (Node.js no disponible) enmascaró aserciones erróneas sobre la inmutabilidad de JavaScript, permitiendo que código defectuoso pasara como seguro.

## 2. MODELO CONCEPTUAL ACTUAL VS REQUERIDO
- **Actual:** `independentCount` = Número total de raíces únicas encontradas a lo largo de todos los supports válidos.
- **Defecto:** Confunde la complejidad del linaje de una fuente con el acuerdo independiente entre múltiples fuentes.
- **Requerido:** `independentCount` = Número máximo de *fuentes válidas* que no comparten **ninguna** raíz causal en sus respectivos linajes.

## 3. NUEVA DEFINICIÓN DE CORROBORACIÓN E INDEPENDENCIA
- **Unidad de Corroboración:** Un `support` válido (una combinación validada de `Source` y `Evidence` referenciando un `Claim`). Múltiples piezas de evidencia de la misma fuente no multiplican la corroboración.
- **Independencia Causal Estricta:** Dos fuentes (A y B) se consideran **causalmente independientes** si y solo si sus conjuntos de raíces (terminales causales) son completamente disjuntos: `Roots(A) ∩ Roots(B) = ∅`.
- **Cálculo de `independentCount`:** El sistema debe agrupar los supports válidos por `sourceId` y encontrar el subconjunto máximo de fuentes donde todos los pares son mutuamente independientes (cálculo de *Maximum Independent Set* sobre el grafo de solapamiento de raíces). 

## 4. TRATAMIENTO DE ESCENARIOS DE LINAJE
- **Copias, Derivadas y Transformadas:** `A`, `copy(A)`, `derived(A)` y `transformed(A)` todas comparten la raíz `A` en su linaje extendido. Sus conjuntos de raíces se solaparán (`{A} ∩ {A} ≠ ∅`). Por tanto, nunca podrán sumar más de **1 unidad de corroboración**.
- **Compartición Parcial de Linaje:** Si la fuente A tiene raíces `{X, Y}` y la fuente B tiene `{Y, Z}`, comparten la raíz `Y`. Epistemológicamente, la influencia de `Y` contamina ambas perspectivas. Por tanto, no son completamente independientes. La corroboración máxima aportada por ambas en conjunto será **1 unidad**.
- **Multi-Parent (Múltiples padres por fuente):** Si la fuente C es inferida a partir de A y B (padres), entonces `Roots(C) = {A, B}`. Esto simplemente define el linaje de C. No otorga "2 corroboraciones" a C. C sigue siendo **1 fuente**.

## 5. DISEÑO DE SNAPSHOT INMUTABLE PARA REHYDRATE
El patrón `Object.freeze(new Map())` será descartado.
- **Nueva Estrategia:** `rehydrate()` construirá un Plain Old Javascript Object (POJO) como diccionario clave-valor: `const derivedStates = {};`. Al finalizar, se devolverá `Object.freeze(derivedStates)`.
- **Justificación:** Un POJO congelado cuyos valores son primitivos (strings como `'CONSOLIDATED'`) es profunda y absolutamente inmutable en JavaScript. Cualquier intento de consumidor de mutarlo (ej. `result['NEW_ID'] = 'RAW'`) fallará silenciosamente o lanzará un `TypeError` en strict mode, protegiendo completamente el motor subyacente.

## 6. TEST EXECUTION INTEGRITY
El entorno local actual falló al ejecutar `test_phase4c24.js` por falta de binarios ejecutables (`node`).
- **Política Estricta:** A partir de ahora, una prueba fallida en ejecución se clasificará como **TESTS NOT EXECUTED**. Bajo ninguna circunstancia un error del framework de ejecución será tratado como un "PASS".
- El script de validación incluirá verificaciones de runtime robustas para confirmar aserciones observables de forma explícita.

## 7. CASOS ADVERSARIALES A IMPLEMENTAR EN TESTS (V2)
- **CASE A (1 source, 2 parents):** Debe producir `independentCount === 1`.
- **CASE B (2 sources, disjoint roots):** Debe producir `independentCount === 2`.
- **CASE C (2 sources, shared root):** Debe producir `independentCount === 1`.
- **CASE D (1 source, 10 roots):** Debe producir `independentCount === 1`.
- **CASE E (1 source, 10 evidence items):** Debe producir `independentCount === 1`.
- **CASE F (Mutation Attack):** Intentar reasignar, borrar o agregar claves al POJO resultante de `rehydrate()`. Comprobar que el valor original no muta y que el grafo subyacente se mantiene idéntico.

## 8. MIGRACIÓN Y RIESGOS RESTANTES
- **Migración:** El nuevo cálculo requerirá operaciones de intersección de conjuntos (Sets) en cada evaluación. Para grafos pequeños/medianos, la sobrecarga es insignificante (O(N^2) sobre el número de supports por claim).
- **Riesgo:** Si un grafo de `supports` se vuelve extremadamente denso con linajes complejos, el cálculo de Máximo Conjunto Independiente podría volverse computacionalmente costoso. Se limitará el cálculo a un subconjunto viable o se aplicará un algoritmo *greedy* que asegure subestimación de corroboración por seguridad. 

---
**ESTADO:**
**4C.2.4.2 = DESIGN REVIEW / PENDING IMPLEMENTATION**
**4C.2.4.1 = BLOCKED / NOT VERIFIED**
**Evolution = NOT READY**
**Execution = NOT READY**
