# AI CORE PHASE 4C.2.4 - ADVERSARIAL REAUDIT REPORT V1

## EXECUTIVE SUMMARY
The adversarial audit of Phase 4C.2.4 has been completed. The audit was conducted strictly on the actual implementation (`ai-provenance.js`, `ai-integrated-consolidation.js`, `test_phase4c24.js`), ignoring earlier remediation reports.

**VERDICT:** **BLOCKED**
**STATUS:** **4C.2.4 = IMPLEMENTED / PENDING ADVERSARIAL AUDIT -> BLOCKED**

Multiple **CRITICAL** vulnerabilities were identified, completely invalidating the core promises of the provenance system, independence guarantees, and read-only properties of rehydration.

---

## FINDINGS

### 1. VULNERABILITY: MULTI-CONNECTOR / CAUSALITY LOSS (CRITICAL)
- **Description:** The system uses a strict single-branch traversal pattern that effectively masks causal relationships. The code pattern `current.copiedFrom || current.derivedFrom || current.transformedFrom || current.parentSourceId` is present in multiple places.
- **Affected Component:** `ai-provenance.js` (`_findRootSource`) and `ai-integrated-consolidation.js` (`_areSourcesIndependent`).
- **Impact:** An attacker can perform a **Root Hiding Attack**. By providing a fake source in `copiedFrom` (which evaluates first), they can completely hide a real dependency in `derivedFrom`. The system loses all awareness of multiple parents, destroying causal integrity.
- **Exploitation:** `A.copiedFrom = "FAKE_ROOT", A.derivedFrom = "REAL_ROOT"`. The system will treat `A` as having only `FAKE_ROOT` as its root, making it appear independent from other claims relying on `REAL_ROOT`.

### 2. VULNERABILITY: ZERO EVIDENCE / ABSENCE OF EVIDENCE VALIDATION (CRITICAL)
- **Description:** The `_areSourcesIndependent` function in `ai-integrated-consolidation.js` iterates through the `supports` array but completely ignores the `evidence` field.
- **Affected Component:** `ai-integrated-consolidation.js` (`_areSourcesIndependent`).
- **Impact:** Claims can reach `SUPPORTED` or `CONSOLIDATED` status using missing, null, or invalid evidence. The presence of a source ID is incorrectly treated as sufficient support.
- **Exploitation:** `claimRecord.supports.push({ source: rootB, evidence: null });`. The system will count `rootB` as an independent corroborator despite having zero valid evidence.

### 3. VULNERABILITY: REHYDRATE SIDE-EFFECTS / HISTORY MUTATION (CRITICAL)
- **Description:** The report stated that `rehydrate` is 100% read-only. However, `ai-integrated-consolidation.js` implements `rehydrate()` by first clearing `this.consolidationStates` and then calling `consolidateClaim()`.
- **Affected Component:** `ai-integrated-consolidation.js` (`rehydrate` and `consolidateClaim`).
- **Impact:** Inside `consolidateClaim`, there is a check: `if (this.consolidationStates.get(claimId) !== newState)`. Since the states were cleared in `rehydrate`, this check always evaluates to `true`, causing the system to push to `this.history` on every rehydration.
- **Exploitation:** Calling `rehydrate()` 5 times will pollute the history array with redundant `CONSOLIDATION_CHANGE` events. The requirement `STATE_BEFORE === STATE_AFTER` is severely violated.

### 4. VULNERABILITY: FALSE TESTS AND MISSING METHODS (HIGH)
- **Description:** The test file `test_phase4c24.js` makes calls to `graph._getCausalParentIds(inf1)` and `graph._findRootSources(hiddenAttack)`. However, neither of these plural methods exist in `ai-provenance.js`. The test file is designed against an API that is not implemented, and execution fails immediately.
- **Affected Component:** `test_phase4c24.js`
- **Impact:** Tests give a false sense of security but are fundamentally disconnected from the actual implementation.

---

## VERDICT & NEXT STEPS

- **4C.2.4 = BLOCKED**
- **4C.2.3 = PENDING REVALIDATION**
- **4C.2.2 = PENDING REVALIDATION**
- **4C.2.1 = PENDING REVALIDATION**
- **4C.2 = PENDING REVALIDATION**

**Evolution Status:** NOT READY
**Execution Status:** NOT READY
**External AI:** OPTIONAL / NOT REQUIRED

**RECOMMENDATIONS:**
1. Completely rewrite the causal traversal algorithm. Use BFS/DFS returning sets of roots rather than a single root. Eliminate the `a || b || c || d` pattern entirely.
2. Implement strict `EvidenceValidator` logic before counting any support. Invalid evidence must block corroboration.
3. Fix the `rehydrate()` logic to either operate on a temporary history array or explicitly block mutation via a robust read-only context/flag. Do not clear active states prior to calculating history mutations without isolating the operation.
4. Align tests with actual implemented APIs.
