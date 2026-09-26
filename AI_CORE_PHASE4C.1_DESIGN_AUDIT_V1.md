# AI_CORE_PHASE4C.1_DESIGN_AUDIT_V1.md

## 1. VERIFICAR EL DOCUMENTO REAL
Evaluación de los 24 puntos contra el documento `AI_CORE_PHASE4C.1_PROVENANCE_AND_SEMANTIC_ANALYSIS_DESIGN_V1.md`:
1. Objetivo: **Definido**
2. Problemas actuales: **Definido**
3. Arquitectura propuesta: **Definido**
4. Source Provenance Model: **Definido**
5. Provenance Graph: **Definido**
6. Source Independence Algorithm: **Definido**
7. Claim Normalization: **Parcialmente definido** (estructuras claras, pero el mecanismo de extracción local es ambiguo).
8. Claim Equivalence: **Parcialmente definido** (asume que la normalización generará IDs idénticos sin LLM).
9. SemanticConflictAnalyzer: **Definido**
10. Conflict Taxonomy: **Definido**
11. Temporal Model: **Definido**
12. Scope Model: **Definido**
13. Integration con Consolidation: **Definido**
14. Integration con KnowledgeGap: **Definido**
15. Integration con Registry: **Definido**
16. Security Isolation: **Definido**
17. Evolution Compatibility: **Definido**
18. Test Plan P1-P30: **Parcialmente definido** (solo descripciones de 1 línea).
19. Threat Model: **Definido**
20. Limitaciones: **Definido**
21. Riesgos: **Definido** (Menciona explícitamente el riesgo de requerir un LLM).
22. Migración: **Definido**
23. Criterios de aceptación: **Definido**
24. Estado final: **Definido**

## 2. COMPATIBILIDAD CON LA ARQUITECTURA EXISTENTE
- **Dependencias correctas**: Se enlaza con `ConceptRegistry` y `KnowledgeConsolidationEngine`.
- **Cambios de schema necesarios**: Requiere crear un nuevo esquema o entidad `Claim` (actualmente solo existen Concept y Relationship). También exige expandir los metadatos de `KnowledgeSchema`.
- **Duplicación**: No detectada, las responsabilidades están separadas (Analyzer vs Consolidation).
- **Incompatibilidades**: El parser de ingestión actual (`KnowledgeIngestionEngine`) es un mock rígido. Implementar `Claim Normalization` requerirá una reescritura masiva de la ingestión o un LLM, lo cual viola temporalmente la regla de no depender de IA externa para la base.

## 3. SOURCE PROVENANCE
El diseño detalla `normalizedFingerprint` y un `ProvenanceGraph`.
- **A (Mismo contenido, diff IDs)**: Detectado por `normalizedFingerprint`.
- **B (Contenido casi idéntico)**: El `normalizedFingerprint` fallaría ante cambios mínimos. Se requiere similitud coseno, imposible localmente sin embeddings. **LIMITACIÓN**.
- **C (Copia de A)**: Detectado si hay metadato `copiedFrom`.
- **D (Derivado de B)**: Detectado por `derivedFrom`. El grafo colapsa el soporte.
- **E (Resumen derivado)**: Mismo tratamiento que D.
- **F (Traducción)**: Indetectable algorítmicamente de forma local sin un diccionario o LLM. **LIMITACIÓN**.
- **G (Ambas citan a original)**: El grafo las une en la raíz original. Soporte = 1.
- **H (Mismo autor, diff contenido)**: Son independientes epistemológicamente.
- **I (Origen desconocido)**: Estado `UNKNOWN`. No suma soporte.
- **J (Cadena A->B->C)**: El grafo acíclico restringe la independencia.

## 4. CONTENT IDENTITY VS SOURCE INDEPENDENCE
**Diferenciados correctamente.** El diseño distingue "mismo hash de contenido" (Content Identity) de la independencia real basada en el linaje (Provenance Graph). El mecanismo adicional es la traza obligatoria de dependencias en los metadatos.

## 5. PROVENANCE GRAPH
El documento prohíbe explícitamente ciclos. 
- **A -> B -> C**: Permitido.
- **A -> B -> A**: Detectado algorítmicamente y colapsado/rechazado.
Sin embargo, el diseño no define cómo se descubre físicamente la relación `derivedFrom` en internet libre sin intervención manual o de LLM.

## 6. CLAIM NORMALIZATION
**CRÍTICO - LIMITACIÓN SEVERA.** El diseño exige convertir texto crudo en estructuras complejas (Sujeto, Predicado, Objeto, Tiempo, Scope). Localmente, sin LLM y sin NLP pesado, esto es funcionalmente imposible salvo mediante regex rígidas. La normalización en un motor "Local-First puramente algorítmico" generará falsos positivos y ruido masivo.

## 7. PRUEBA CRÍTICA — HIPÓTESIS VS HECHO
"Creo que la VPN está lenta porque el MTU está mal."
El diseño define el campo `KNOWLEDGE_TYPE`, pero falla en explicar cómo el código JavaScript local deducirá que "Creo que" equivale a `HYPOTHESIS`. Sin análisis semántico real (LLM), el sistema muy probablemente lo catalogará como `FACT` asumiendo la afirmación de la oración, violando el objetivo epistemológico. **NOT READY**.

## 8. OTROS CASOS DE NORMALIZACIÓN
Distinguir "El problema está en el firewall" (`FACT`) de "El firewall podría estar" (`HYPOTHESIS`) o "Según el log" (`EVIDENCE`) excede las capacidades de un analizador de strings local. El diseño documentó esta ceguera en la sección 20 (Limitaciones), asumiendo fallback a `UNKNOWN`. 

## 9. SEMANTIC CONFLICT ANALYZER
- **VALUE_CONFLICT**: Mismos campos, distinto `VALUE`. Salida: Conflicto. Regla clara.
- **NUMERIC_CONFLICT**: Regla clara para números.
- **RELATION_CONFLICT**: Detección de ciclos prohibidos.
- **LOGICAL_CONTRADICTION**: Posible localmente solo si se definen booleanos estrictos (`isActive: true` vs `false`).
- **SCOPE/TEMPORAL**: Si no coinciden, arrojan `DUPLICATE_NOT_CONFLICT` o equivalente, bloqueando falsos positivos.

## 10. CONFLICTO NUMÉRICO
Diseño **correcto**. El uso del campo `Time` (validFrom, validUntil) impide que la diferencia de precios en distintas fechas detone un conflicto destructivo.

## 11. CONFLICTO DE ALCANCE
Diseño **correcto**. El uso del campo `Scope` aísla los contextos. "En Dulce Tentación" vs "Panadería X" no colisionan.

## 12. CONFLICTO DE DEFINICIÓN
Matemáticas. El diseño admite explícitamente en "Limitaciones" que no puede parsear equivalencia de fórmulas locales. Devolvería `UNKNOWN`. Esto es correcto y seguro.

## 13. RELATION CONFLICT
Diseño **correcto**. Distingue dependencias cíclicas inválidas (A DEPENDS_ON B y B DEPENDS_ON A) de ciclos permitidos según un diccionario de reglas por tipo de relación.

## 14. CLAIM EQUIVALENCE
"Una dona cuesta..." vs "El precio unitario...". El diseño asume que esto se igualará bajo el mismo *Subject* normalizado. Esto es ilusorio en un entorno sin IA. El motor local generará dos sujetos distintos (`dona` y `precio unitario`), resultando en **falsos negativos** de equivalencia. **LIMITACIÓN**.

## 15. UNKNOWN COMO FALLBACK
El diseño garantiza `UNKNOWN` explícitamente en la Sección 9 y 10 para evitar certezas falsas.

## 16. TEMPORALIDAD
Distingue `CONFLICT` (mismo tiempo, distinto valor) de `TEMPORAL_UPDATE` (tiempos distintos).

## 17. SCOPE
Estructuras jerárquicas definidas. Impide fugas de "business" hacia "global".

## 18. CONSOLIDATION INTEGRATION
Separación adecuada: Analyzer clasifica -> Consolidation decide y registra. El Analyzer no decreta verdades universales, solo provee flags semánticos.

## 19. KNOWLEDGE GAP
Diseño **superficial**. El diseño dice "genera un gap diciendo que falta el año", pero la estructura interna propuesta para `KnowledgeGap` carece de los enums o dependencias duras que relacionen un Gap con un conflicto de normalización específico. **READY WITH FINDINGS**.

## 20. SECURITY ISOLATION
**PASA**. Ausencia total de enlaces con `ExecutionGateway`. Sandbox epistemológico garantizado.

## 21. EVOLUTION COMPATIBILITY
**PASA**. Estructuras y metadatos listos para que un futuro agente LLM rastree orígenes, aunque no se ha diseñado el Evolution Engine per se.

## 22. TEST PLAN (Análisis Extendido)
El diseño listó P1-P30 sin estructura completa. 
- *P1 (Copias)*: Evalúa Hash. Límite: un cambio de coma engaña al hash.
- *P3 (Derivado)*: Evalúa metadatos. Límite: no hay forma de saber si es derivado si el usuario no lo taggea.
- *P5 (Traducción)*: Límite absoluto. El motor local fallará.
- *P11 (Lógica)*: Solo funcionará para booleanos directos en el Claim normalizado.
- *P19 (Gap irresoluble)*: No está definida la algoritmia para construir la frase "Falta el año".

## 23. AMENAZAS EPISTEMOLÓGICAS
El documento incluye mitigaciones, pero la amenaza de **False Conflict** y **Confidence Inflation** por *variaciones léxicas* (engañando a los detectores de hashes y strings exactos) persiste por la falta de embeddings/IA.

## 24. DECISIÓN DE IMPLEMENTABILIDAD
**NOT READY**. 
Aunque los registros de procedencia (`ProvenanceGraph`) y las rutinas numéricas (`SemanticConflictAnalyzer`) pueden codificarse de inmediato, el eslabón crítico es la **Claim Normalization**. Sin un parser NLP avanzado local o un LLM, es imposible transformar un documento de texto crudo en `[Subject, Predicate, Time, Scope]` de forma algorítmica y confiable. Cualquier implementación actual operaría sobre datos "mockeados" perfectos, lo cual no refleja un comportamiento sistémico real. Se requiere que FASE 5 (LLM Core) o un modelo pequeño local asuma la normalización antes o durante FASE 4C.1.

---
## 25. VEREDICTO FINAL

- PHASE 4C.1 DESIGN AUDIT: PASS WITH FINDINGS
- SOURCE PROVENANCE: PASS WITH FINDINGS (Identidad local muy rígida)
- SOURCE INDEPENDENCE: LIMITED (Vulnerable a parafraseo)
- CLAIM NORMALIZATION: FAIL (Irrealizable localmente sin NLP/LLM)
- SEMANTIC CONFLICT: LIMITED (Restringido a matemática y booleanos exactos)
- TEMPORAL MODEL: PASS
- SCOPE MODEL: PASS
- KNOWLEDGE GAP: LIMITED (Construcción algorítmica poco detallada)
- CONSOLIDATION INTEGRATION: PASS
- SECURITY ISOLATION: PASS
- EVOLUTION COMPATIBILITY: PASS
- TEST PLAN: LIMITED (No detallado algorítmicamente en el diseño)
- IMPLEMENTATION READINESS: NOT READY

- EVOLUTION ENGINE: NOT READY
- REAL EXECUTION: NOT READY
