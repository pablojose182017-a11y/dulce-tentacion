"use strict";
window.AI_CORE = window.AI_CORE || {};

// ─── deepFreeze ────────────────────────────────────────────────────────────────
function deepFreeze(object) {
    for (const name of Object.getOwnPropertyNames(object)) {
        const value = object[name];
        if (value && typeof value === "object") deepFreeze(value);
    }
    return Object.freeze(object);
}

// ─── Offensive Capability Checker (recursive) ──────────────────────────────────
const OFFENSIVE = new Set(["HACK_BACK", "DDOS", "INFILTRATION", "DESTRUCTIVE"]);

function containsOffensiveCapability(capabilities) {
    if (!capabilities || !Array.isArray(capabilities)) return false;
    for (const cap of capabilities) {
        if (typeof cap === "string" && OFFENSIVE.has(cap)) return true;
        if (typeof cap === "object" && cap !== null) {
            // Check name field
            if (cap.name && OFFENSIVE.has(cap.name)) return true;
            // Recurse into nested.capabilities
            if (cap.nested && containsOffensiveCapability(cap.nested.capabilities)) return true;
            // Recurse into direct capabilities array
            if (Array.isArray(cap.capabilities) && containsOffensiveCapability(cap.capabilities)) return true;
        }
    }
    return false;
}

// ─── AutonomousPolicyRegistry ─────────────────────────────────────────────────
class AutonomousPolicyRegistry {
    constructor(creatorScopeResolver = null) {
        this._policies = new Map();
        this._creatorScopeResolver = creatorScopeResolver;
    }

    _defaultCreatorScope() {
        return {
            maxGovernance:       3,
            allowedTargets:      ["DATABASE", "GATEWAY"],
            allowedCapabilities: ["ISOLATE_NETWORK", "COLLECT_EVIDENCE", "RESTORE_NETWORK"]
        };
    }

    createPolicy(policyDefinition, creatorIdentity) {
        if (!creatorIdentity.roles.includes("admin") && !creatorIdentity.roles.includes("creator")) {
            throw new Error("UNAUTHORIZED_POLICY_CREATION");
        }

        // Hard-coded offensive prohibition (recursive)
        if (containsOffensiveCapability(policyDefinition.allowedCapabilities)) {
            throw new Error("PROHIBITED_ACTION");
        }
        if (policyDefinition.allowedRollbackActions) {
            for (const rb of policyDefinition.allowedRollbackActions) {
                if (containsOffensiveCapability(rb.allowedCapabilities)) throw new Error("PROHIBITED_ACTION");
            }
        }

        // Delegation subset check for non-creator admins
        if (creatorIdentity.roles.includes("admin") && !creatorIdentity.roles.includes("creator")) {
            const scope = this._creatorScopeResolver
                ? this._creatorScopeResolver()
                : this._defaultCreatorScope();

            if (policyDefinition.allowedGovernanceMaximum > scope.maxGovernance) {
                throw new Error("DELEGATION_SCOPE_EXCEEDED");
            }
            if (policyDefinition.allowedCapabilities?.some(c => !scope.allowedCapabilities.includes(c))) {
                throw new Error("DELEGATION_SCOPE_EXCEEDED");
            }
            // Per-target subset check
            if (policyDefinition.allowedTargets) {
                for (const t of policyDefinition.allowedTargets) {
                    const wildcardAllowed = scope.allowedTargets.includes("*");
                    if (t === "*" && !wildcardAllowed) throw new Error("DELEGATION_SCOPE_EXCEEDED");
                    if (t !== "*" && !wildcardAllowed && !scope.allowedTargets.includes(t)) {
                        throw new Error("DELEGATION_SCOPE_EXCEEDED");
                    }
                }
            }
        }

        const policy = JSON.parse(JSON.stringify(policyDefinition));
        policy.policyId      = policyDefinition.policyId || `pol_${Date.now()}`;
        policy.ownerIdentity = creatorIdentity.email;
        policy.status        = "ACTIVE";
        policy.circuitBreakerState = { actionsInWindow: [], totalSuspensionCount: 0 };
        this._policies.set(policy.policyId, policy);
        return policy;
    }

    getPolicy(policyId) {
        const pol = this._policies.get(policyId);
        return pol ? JSON.parse(JSON.stringify(pol)) : undefined;
    }

    updatePolicyState(policyId, stateUpdates) {
        const pol = this._policies.get(policyId);
        if (!pol) return;
        if (stateUpdates.circuitBreakerState) Object.assign(pol.circuitBreakerState, stateUpdates.circuitBreakerState);
        if (stateUpdates.status)              pol.status = stateUpdates.status;
    }

    revokePolicy(policyId) {
        const pol = this._policies.get(policyId);
        if (pol && pol.status === "ACTIVE") {
            pol.status    = "REVOKED";
            pol.revokedAt = Date.now();
        }
    }
}

// ─── InventoryAuthority ────────────────────────────────────────────────────────
class InventoryAuthority {
    verifyIdentity(technicalTarget) {
        if (technicalTarget === "192.168.1.100") return { type: "DATABASE", canonicalId: "db_prod_1", fingerprint: "fp_db_001" };
        if (technicalTarget === "192.168.1.1")   return { type: "GATEWAY", canonicalId: "gw_prod_1", fingerprint: "fp_gw_001" };
        return null;
    }
}

// ─── ExecutionHistory ──────────────────────────────────────────────────────────
// Contract only — no real execution. Only trusted layers may call registerResult().
class ExecutionHistory {
    constructor() {
        this._records = new Map();
    }

    registerResult(result) {
        const id = `res_${Date.now()}_${Math.random()}`;
        this._records.set(id, { ...result, id, timestamp: Date.now() });
        return id;
    }

    verifyResult(evidenceId, requirements) {
        const rec = this._records.get(evidenceId);
        if (!rec) return false;
        if (requirements.toolId && rec.toolId !== requirements.toolId) return false;
        if (requirements.target && rec.target !== requirements.target) return false;
        if (rec.status !== "SUCCESS") return false;
        return true;
    }
}

// ─── AutonomousPolicyEngine ────────────────────────────────────────────────────
class AutonomousPolicyEngine {
    constructor(policyRegistry, securityEngine, inventoryAuthority, executionHistory, adapterRegistry) {
        this.policyRegistry    = policyRegistry;
        this.securityEngine    = securityEngine;
        this.inventoryAuthority = inventoryAuthority;
        this.executionHistory  = executionHistory;
        this.adapterRegistry   = adapterRegistry;
        this._auditLog         = [];
    }

    _logAudit(action, details) {
        this._auditLog.push({ timestamp: Date.now(), action, details });
    }

    async evaluateAndAuthorize(proposal, evidence, context, aiIdentity) {
        this._logAudit("AUTONOMOUS_EVALUATION_STARTED", { proposal });

        // ── 1. Hard Evidence Trust Boundary ──
        if (!evidence || evidence.type !== "ACTUAL_TOOL_RESULT") throw new Error("HARD_EVIDENCE_REQUIRED");
        if (!evidence.evidenceId) throw new Error("HARD_EVIDENCE_UNVERIFIED");
        if (!this.executionHistory.verifyResult(evidence.evidenceId, {})) throw new Error("HARD_EVIDENCE_UNVERIFIED");

        // ── 2. Policy State ──
        const policyId = proposal.targetPolicyId;
        if (!policyId) throw new Error("HUMAN_APPROVAL_REQUIRED");
        const policy = this.policyRegistry.getPolicy(policyId);
        if (!policy)                          throw new Error("HUMAN_APPROVAL_REQUIRED");
        if (policy.status === "REVOKED")      throw new Error("POLICY_REVOKED");
        if (policy.status === "SUSPENDED")    throw new Error("AUTONOMOUS_POLICY_SUSPENDED");
        if (policy.expiresAt && Date.now() > policy.expiresAt) throw new Error("POLICY_EXPIRED");

        // ── 3. Tool & Governance ──
        const tool = this.securityEngine.registry.getTool(proposal.toolId, proposal.toolVersion);
        if (!tool) throw new Error("TOOL_NOT_FOUND");

        // Offensive capability check on main tool (recursive)
        if (containsOffensiveCapability(tool.capabilities)) throw new Error("PROHIBITED_ACTION");

        const effectiveGovernance = this.securityEngine.calculateEffectiveGovernance(tool, proposal.parameters, context);
        if (effectiveGovernance > policy.allowedGovernanceMaximum) throw new Error("GOVERNANCE_EXCEEDS_POLICY_MAXIMUM");

        // ── 4. Target Extraction & Inventory Verification ──
        let targetType = null;
        let targetCanonicalId = null;
        let targetFingerprint = null;
        if (tool.targetDescriptor && tool.targetDescriptor.parameter) {
            const targetVal = proposal.parameters[tool.targetDescriptor.parameter];
            if (!targetVal) throw new Error("TARGET_SCHEMA_UNVERIFIED");
            const verifiedIdentity = this.inventoryAuthority.verifyIdentity(targetVal);
            if (!verifiedIdentity || !policy.allowedTargets.includes(verifiedIdentity.type)) {
                throw new Error("TARGET_IDENTITY_UNVERIFIED");
            }
            targetType = verifiedIdentity.type;
            targetCanonicalId = verifiedIdentity.canonicalId;
            targetFingerprint = verifiedIdentity.fingerprint;
        } else if (Object.keys(proposal.parameters).length > 0) {
            if (policy.allowedTargets && policy.allowedTargets.length > 0 && !policy.allowedTargets.includes("*")) {
                if (!tool.targetDescriptor) throw new Error("TARGET_SCHEMA_UNVERIFIED");
            }
        }

        // ── 5. Capability Check ──
        if (tool.capabilities && !tool.capabilities.some(c => policy.allowedCapabilities.includes(c))) {
            throw new Error("CAPABILITY_NOT_AUTHORIZED");
        }

        // ── 6. Rollback Scope Check (recursive offensive check on rollback tool) ──
        if (policy.requiresRollback) {
            if (!proposal.rollbackPlan) throw new Error("ROLLBACK_OUTSIDE_SCOPE");
            const rbToolId = proposal.rollbackPlan.toolId;
            const rbDef    = (policy.allowedRollbackActions || []).find(a => a.toolId === rbToolId);
            if (!rbDef) throw new Error("ROLLBACK_OUTSIDE_SCOPE");

            const rbTool = this.securityEngine.registry.getTool(rbToolId, proposal.toolVersion || "1.0");
            if (rbTool && containsOffensiveCapability(rbTool.capabilities)) throw new Error("PROHIBITED_ACTION");
            if (rbTool && rbTool.capabilities && rbTool.capabilities.some(c => !rbDef.allowedCapabilities.includes(c))) {
                throw new Error("ROLLBACK_OUTSIDE_SCOPE");
            }
            const rbGov = rbTool ? this.securityEngine.calculateEffectiveGovernance(rbTool, proposal.rollbackPlan.parameters, context) : 0;
            if (rbGov > rbDef.allowedGovernanceMaximum) throw new Error("ROLLBACK_OUTSIDE_SCOPE");
        }

        // ── 7. Circuit Breakers ──
        const now         = Date.now();
        const cb          = policy.circuitBreakerState;
        const windowStart = now - (policy.maxActionsPerWindow.windowSeconds * 1000);
        cb.actionsInWindow = cb.actionsInWindow.filter(t => t > windowStart);

        if (cb.actionsInWindow.length >= policy.maxActionsPerWindow.count) {
            cb.totalSuspensionCount++;
            this.policyRegistry.updatePolicyState(policyId, { circuitBreakerState: cb });
            if (cb.totalSuspensionCount >= policy.suspensionThreshold) {
                this.policyRegistry.updatePolicyState(policyId, { status: "SUSPENDED" });
                throw new Error("AUTONOMOUS_POLICY_SUSPENDED");
            }
            throw new Error("AUTONOMOUS_RATE_LIMITED");
        }

        cb.actionsInWindow.push(now);
        this.policyRegistry.updatePolicyState(policyId, { circuitBreakerState: cb });

        // ── 8. Build immutable AuthorizationPayload ──
        const effectiveParams = this.securityEngine.validateSchemaAndInjectDefaults(proposal.parameters, tool.inputSchema);
        const fingerprint     = await this.securityEngine.generateFingerprint(effectiveParams);

        // Fetch Adapter Definition
        let adapter = this.adapterRegistry ? this.adapterRegistry.getAdapter(tool.toolId, tool.version) : null;
        let adapterId = adapter ? adapter.adapterId : "default_adapter";
        let adapterVersion = adapter ? adapter.adapterVersion : "1.0";
        
        let toolDefinitionFingerprint = "default_tool_fp";
        let adapterDefinitionFingerprint = "default_adapter_fp";
        
        if (window.AI_CORE.canonicalize) {
            toolDefinitionFingerprint = window.AI_CORE.base64(window.AI_CORE.canonicalize({
                capabilities: [...(tool.capabilities||[])].sort(),
                sideEffects: tool.sideEffects,
                scopes: tool.scopes,
                inputSchema: tool.inputSchema,
                targetDescriptor: tool.targetDescriptor,
                baseGovernanceLevel: tool.baseGovernanceLevel,
                requiresConfirmation: tool.requiresConfirmation
            }));
            if (adapter) {
                adapterDefinitionFingerprint = window.AI_CORE.base64(window.AI_CORE.canonicalize({
                    capabilities: [...(adapter.capabilities||[])].sort(),
                    declaredSideEffects: [...(adapter.declaredSideEffects||[])].sort(),
                    maxExecutionMs: adapter.maxExecutionMs,
                    supportsCancellation: adapter.supportsCancellation,
                    cancellationGuarantee: adapter.cancellationGuarantee,
                    enabled: adapter.enabled
                }));
            }
        }

        const payload = deepFreeze({
            authorizationId:    `auto_app_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            authorizationMode:  "AUTONOMOUS_DELEGATION",
            approvedByHuman:    false,
            derivedFromPolicy:  true,
            isRollback:         proposal.isRollback || false,
            triggeredBy:        proposal.triggeredBy || null,
            rollbackOf:         proposal.rollbackOf || null,
            policyId:           policy.policyId,
            policyVersion:      policy.version,
            policyOwnerIdentity: policy.ownerIdentity,
            toolId:             tool.toolId,
            toolVersion:        tool.version,
            adapterId:          adapterId,
            adapterVersion:     adapterVersion,
            toolDefinitionFingerprint: toolDefinitionFingerprint,
            adapterDefinitionFingerprint: adapterDefinitionFingerprint,
            parameterFingerprint: fingerprint,
            evidenceId:         evidence.evidenceId,
            targetType:         targetType,
            targetCanonicalId:  targetCanonicalId,
            targetFingerprint:  targetFingerprint,
            rollbackPlan:       proposal.rollbackPlan
                ? JSON.parse(JSON.stringify(proposal.rollbackPlan))
                : null,
            capabilities:       tool.capabilities
                ? [...tool.capabilities]
                : [],
            effectiveGovernance: effectiveGovernance,
            issuedAt:           now,
            expiresAt:          now + 120000,
            isOneShot:          true
        });

        // ── 9. Transfer to SecurityEngine — engine owns storage ──
        const externalView = this.securityEngine.storeAutonomousRecord(payload);

        this._logAudit("AUTONOMOUS_AUTHORIZATION_GENERATED", {
            authorizationId: payload.authorizationId,
            policyId:        policy.policyId
        });

        // Return ExternalView — immutable payload + status snapshot
        return externalView;
    }
}

window.AI_CORE.AutonomousPolicyRegistry = AutonomousPolicyRegistry;
window.AI_CORE.InventoryAuthority       = InventoryAuthority;
window.AI_CORE.ExecutionHistory         = ExecutionHistory;
window.AI_CORE.AutonomousPolicyEngine   = AutonomousPolicyEngine;
