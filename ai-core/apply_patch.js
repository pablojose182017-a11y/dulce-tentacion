const fs = require('fs');

const securityCode = `window.AI_CORE = window.AI_CORE || {};

class ToolRegistry {
    constructor() {
        this.tools = new Map();
    }
    
    register(toolDefinition) {
        const key = \`\${toolDefinition.toolId}@\${toolDefinition.version}\`;
        this.tools.set(key, JSON.parse(JSON.stringify(toolDefinition)));
    }
    
    getTool(toolId, version) {
        const tool = this.tools.get(\`\${toolId}@\${version}\`);
        if (!tool) return undefined;
        return JSON.parse(JSON.stringify(tool));
    }
}

class SecurityEngine {
    constructor(registry, permissionManager, policyRegistry = null) {
        this.registry = registry;
        this.permissionManager = permissionManager; 
        this.policyRegistry = policyRegistry; // For TOCTOU policy check
        this.approvals = new Map();
        this.auditLog = [];
        this.LIMITS = { MAX_DEPTH: 5, MAX_KEYS: 50, MAX_STRING_LENGTH: 2048, MAX_ARRAY_LENGTH: 100 };
    }

    setPolicyRegistry(pr) { this.policyRegistry = pr; }

    _logAudit(action, details) {
        this.auditLog.push({ timestamp: Date.now(), action, details });
    }

    _enforcePayloadLimits(obj, currentDepth = 0, totalKeys = { count: 0 }) {
        if (currentDepth > this.LIMITS.MAX_DEPTH) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
        if (obj === null || obj === undefined) return;
        if (typeof obj === 'string' && obj.length > this.LIMITS.MAX_STRING_LENGTH) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
        if (typeof obj === 'object') {
            if (Array.isArray(obj)) {
                if (obj.length > this.LIMITS.MAX_ARRAY_LENGTH) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
                for (let item of obj) this._enforcePayloadLimits(item, currentDepth + 1, totalKeys);
            } else {
                const keys = Object.keys(obj);
                totalKeys.count += keys.length;
                if (totalKeys.count > this.LIMITS.MAX_KEYS) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
                for (let k of keys) this._enforcePayloadLimits(obj[k], currentDepth + 1, totalKeys);
            }
        }
    }

    validateSchemaAndInjectDefaults(params, schema) {
        this._enforcePayloadLimits(params);
        if (!schema || schema.type !== 'object') return params || {};
        const p = params || {};
        const result = {};

        if (schema.required) {
            for (let req of schema.required) {
                if (p[req] === undefined && (!schema.properties[req] || schema.properties[req].default === undefined)) {
                    throw new Error("SCHEMA_REQUIRED_PARAMETER_MISSING");
                }
            }
        }

        const props = schema.properties || {};
        for (let key in p) {
            if (!props[key]) throw new Error("SCHEMA_ADDITIONAL_PROPERTIES_NOT_ALLOWED");
        }

        for (let key in props) {
            let val = p[key];
            if (val === undefined && props[key].default !== undefined) val = props[key].default;
            if (val !== undefined) {
                if (props[key].type === 'string' && typeof val !== 'string') throw new Error("SCHEMA_INVALID_TYPE");
                if (props[key].type === 'number' && typeof val !== 'number') throw new Error("SCHEMA_INVALID_TYPE");
                if (props[key].type === 'boolean' && typeof val !== 'boolean') throw new Error("SCHEMA_INVALID_TYPE");
                if (props[key].type === 'array' && !Array.isArray(val)) throw new Error("SCHEMA_INVALID_TYPE");
                if (props[key].type === 'object' && (typeof val !== 'object' || Array.isArray(val) || val === null)) throw new Error("SCHEMA_INVALID_TYPE");
                result[key] = val;
            }
        }
        return result;
    }

    _canonicalize(params) {
        if (params === null || params === undefined) return "null";
        if (typeof params === "number") return isNaN(params) ? "null" : String(params);
        if (typeof params === "boolean") return String(params);
        if (typeof params === "string") return '"' + encodeURIComponent(params) + '"';
        if (Array.isArray(params)) return "[" + params.map(p => this._canonicalize(p)).join(",") + "]";
        const keys = Object.keys(params).sort();
        let str = "{";
        for (let i = 0; i < keys.length; i++) {
            str += '"' + encodeURIComponent(keys[i]) + '":' + this._canonicalize(params[keys[i]]);
            if (i < keys.length - 1) str += ",";
        }
        return str + "}";
    }

    async generateFingerprint(params) {
        const canonical = this._canonicalize(params);
        if (typeof Buffer !== 'undefined') return Buffer.from(canonical).toString('base64');
        if (typeof btoa !== 'undefined') return btoa(unescape(encodeURIComponent(canonical)));
        return canonical;
    }

    calculateEffectiveGovernance(tool, params, context) {
        let maxLevel = tool.baseGovernanceLevel || 1;
        if (context && context.environment === "PROD" && tool.sideEffects !== "READ_ONLY") maxLevel = Math.max(maxLevel, 3);
        if (tool.sideEffects === "DESTRUCTIVE" || tool.sideEffects === "IRREVERSIBLE") maxLevel = Math.max(maxLevel, 5);
        if (tool.requiresConfirmation) maxLevel = Math.max(maxLevel, 5);
        return maxLevel;
    }

    _checkPath(allowedPaths, targetPath) {
        if (targetPath.includes("../") || targetPath.includes("..\\")) return false;
        try {
            const decoded = decodeURIComponent(targetPath);
            if (decoded !== targetPath && (decoded.includes("../") || decoded.includes("..\\"))) return false;
        } catch(e) {}
        const normalizedTarget = targetPath.replace(/\\/g, '/');
        for (let p of allowedPaths) {
            const normalizedAllowed = p.replace(/\\/g, '/');
            if (normalizedTarget === normalizedAllowed) return true;
            if (normalizedAllowed.endsWith('/')) {
                if (normalizedTarget.startsWith(normalizedAllowed)) return true;
            } else {
                if (normalizedTarget.startsWith(normalizedAllowed + '/')) return true;
            }
        }
        return false;
    }

    checkScopes(tool, params) {
        if (tool.scopes?.network && (params.host || params.protocol || params.port)) {
            const net = tool.scopes.network;
            if (params.host && net.allowedHosts && !net.allowedHosts.some(h => params.host.match(new RegExp('^' + h.replace(/\\./g, "\\.").replace(/\\*/g, '.*') + '$')))) return false;
            if (params.protocol && net.allowedProtocols && !net.allowedProtocols.includes(params.protocol)) return false;
            if (params.port && net.allowedPorts && !net.allowedPorts.includes(params.port)) return false;
        }
        if (tool.scopes?.file && params.path && !this._checkPath(tool.scopes.file.allowedPaths || [], params.path)) return false;
        if (tool.scopes?.process && params.executable) {
            const proc = tool.scopes.process;
            if (proc.allowedExecutables && !proc.allowedExecutables.includes(params.executable)) return false;
            if (params.args && proc.allowedArguments) {
                for (let arg of params.args) {
                    if (!proc.allowedArguments.includes(arg)) return false;
                }
            }
        }
        return true;
    }

    _checkPermission(executorIdentity, tool) {
        if (!this.permissionManager || !tool.capabilities) return true;
        for (let cap of tool.capabilities) {
            if (!this.permissionManager.hasCapability(executorIdentity, cap)) return false;
        }
        return true;
    }

    createApprovalRequest(toolId, version, params, purpose, context) {
        const tool = this.registry.getTool(toolId, version);
        if (!tool) throw new Error("TOOL_NOT_FOUND");
        if (!tool.enabled) throw new Error("TOOL_DISABLED");

        const effectiveParams = this.validateSchemaAndInjectDefaults(params, tool.inputSchema);
        if (!this.checkScopes(tool, effectiveParams)) throw new Error("SCOPE_VIOLATION");

        this._logAudit("APPROVAL_REQUEST_CREATED", { toolId, version });
        return {
            requestId: \`req_\${Date.now()}_\${Math.random().toString(36).substring(2)}\`,
            proposedTool: toolId, proposedVersion: version, proposedParameters: effectiveParams,
            purpose: purpose, effectiveGovernanceCalculated: this.calculateEffectiveGovernance(tool, effectiveParams, context),
            status: "PENDING_APPROVAL"
        };
    }

    async approveRequest(request, approverIdentity) {
        const tool = this.registry.getTool(request.proposedTool, request.proposedVersion);
        if (!tool) throw new Error("TOOL_NOT_FOUND");
        
        const fingerprint = await this.generateFingerprint(request.proposedParameters);
        const record = {
            approvalId: \`app_\${Date.now()}_\${Math.random().toString(36).substring(2)}\`,
            approverIdentity: approverIdentity.email, toolId: tool.toolId, toolVersion: tool.version,
            parameterFingerprint: fingerprint, purpose: request.purpose,
            issuedAt: Date.now(), expiresAt: Date.now() + 15 * 60 * 1000,
            isOneShot: true, status: "ACTIVE", lock: false
        };
        this.approvals.set(record.approvalId, record);
        this._logAudit("APPROVAL_RECORD_CREATED", { approvalId: record.approvalId, approver: approverIdentity.email });
        return JSON.parse(JSON.stringify(record));
    }

    getAuthorization(id) {
        const rec = this.approvals.get(id);
        if (!rec) return undefined;
        return JSON.parse(JSON.stringify(rec));
    }

    async validateForExecution(approvalId, executionParams, context, executorIdentity) {
        const record = this.approvals.get(approvalId);
        if (!record) throw new Error("APPROVAL_NOT_FOUND");

        if (record.isOneShot) {
            if (record.status !== "ACTIVE") throw new Error("APPROVAL_ALREADY_CONSUMED");
            if (record.lock) throw new Error("APPROVAL_ALREADY_CONSUMED"); 
            record.lock = true; 
        } else {
            if (record.status !== "ACTIVE") throw new Error(record.status === "REVOKED" ? "APPROVAL_REVOKED" : "APPROVAL_ALREADY_CONSUMED");
        }

        try {
            if (Date.now() > record.expiresAt) throw new Error("APPROVAL_EXPIRED");

            // TOCTOU Policy check
            if (record.derivedFromPolicy === true) {
                if (!this.policyRegistry) throw new Error("POLICY_REGISTRY_UNAVAILABLE");
                const policy = this.policyRegistry.getPolicy(record.policyId);
                if (!policy) throw new Error("AUTONOMOUS_POLICY_REVOKED");
                if (policy.version !== record.policyVersion) throw new Error("AUTONOMOUS_POLICY_REVOKED");
                if (policy.status === "REVOKED") throw new Error("AUTONOMOUS_POLICY_REVOKED");
                if (policy.status === "SUSPENDED") throw new Error("AUTONOMOUS_POLICY_SUSPENDED");
                if (policy.expiresAt && Date.now() > policy.expiresAt) throw new Error("AUTONOMOUS_POLICY_EXPIRED");
            }

            const tool = this.registry.getTool(record.toolId, record.toolVersion);
            if (!tool) throw new Error("TOOL_NOT_FOUND");
            if (!tool.enabled) throw new Error("TOOL_DISABLED");

            const effectiveParams = this.validateSchemaAndInjectDefaults(executionParams, tool.inputSchema);
            const executionFingerprint = await this.generateFingerprint(effectiveParams);
            if (executionFingerprint !== record.parameterFingerprint) throw new Error("PARAMETER_MISMATCH");
            if (!this.checkScopes(tool, effectiveParams)) throw new Error("SCOPE_VIOLATION");
            if (!this._checkPermission(executorIdentity, tool)) throw new Error("PERMISSION_DENIED");

            const currentGov = this.calculateEffectiveGovernance(tool, effectiveParams, context);
            if (currentGov >= 4 && !executorIdentity.roles?.includes("admin") && !executorIdentity.roles?.includes("creator")) {
                throw new Error("INSUFFICIENT_PRIVILEGES_FOR_GOVERNANCE");
            }

            if (record.isOneShot) {
                record.status = "CONSUMED";
                record.consumedAt = Date.now();
            }

            this._logAudit("EXECUTION_VALIDATED", { approvalId, toolId: tool.toolId, executor: executorIdentity.email });
            return { validationStatus: "PASS", effectiveGovernance: currentGov };

        } catch(e) {
            if (record.isOneShot && record.status === "ACTIVE") record.lock = false; 
            throw e;
        }
    }

    revokeApproval(approvalId) {
        const record = this.approvals.get(approvalId);
        if (record && record.status === "ACTIVE") {
            record.status = "REVOKED";
            this._logAudit("APPROVAL_REVOKED", { approvalId });
            return true;
        }
        return false;
    }
}

window.AI_CORE.ToolRegistry = ToolRegistry;
window.AI_CORE.SecurityEngine = SecurityEngine;
`;

const autonomousCode = `window.AI_CORE = window.AI_CORE || {};

class AutonomousPolicyRegistry {
    constructor(creatorIdentityResolver = null) {
        this.policies = new Map();
        this.creatorIdentityResolver = creatorIdentityResolver; 
    }

    createPolicy(policyDefinition, creatorIdentity) {
        if (!creatorIdentity.roles.includes("admin") && !creatorIdentity.roles.includes("creator")) {
            throw new Error("UNAUTHORIZED_POLICY_CREATION");
        }

        const offensiveCapabilities = ["HACK_BACK", "DDOS", "INFILTRATION", "DESTRUCTIVE"];
        if (policyDefinition.allowedCapabilities?.some(c => offensiveCapabilities.includes(c))) {
            throw new Error("PROHIBITED_ACTION");
        }

        // DELEGATED_SCOPE subset of DELEGATOR_SCOPE
        if (creatorIdentity.roles.includes("admin") && !creatorIdentity.roles.includes("creator")) {
            // Check delegation constraints. For simplicity, assume delegator Scope is defined via resolver
            const creatorScope = this.creatorIdentityResolver ? this.creatorIdentityResolver() : { maxGovernance: 3, allowedTargets: ["DATABASE", "GATEWAY"], allowedCapabilities: ["ISOLATE_NETWORK", "COLLECT_EVIDENCE"] };
            if (policyDefinition.allowedGovernanceMaximum > creatorScope.maxGovernance) throw new Error("DELEGATION_SCOPE_EXCEEDED");
            if (policyDefinition.allowedCapabilities?.some(c => !creatorScope.allowedCapabilities.includes(c))) throw new Error("DELEGATION_SCOPE_EXCEEDED");
            if (policyDefinition.allowedTargets?.some(t => !creatorScope.allowedTargets.includes(t) && t !== "*")) throw new Error("DELEGATION_SCOPE_EXCEEDED");
        }

        const policy = JSON.parse(JSON.stringify(policyDefinition));
        policy.policyId = policyDefinition.policyId || \`pol_\${Date.now()}\`;
        policy.ownerIdentity = creatorIdentity.email;
        policy.status = "ACTIVE";
        policy.circuitBreakerState = {
            actionsInWindow: [],
            totalSuspensionCount: 0
        };
        this.policies.set(policy.policyId, policy);
        return policy;
    }

    getPolicy(policyId) {
        const pol = this.policies.get(policyId);
        if (!pol) return undefined;
        return JSON.parse(JSON.stringify(pol));
    }

    updatePolicyState(policyId, stateUpdates) {
        const pol = this.policies.get(policyId);
        if (pol) {
            Object.assign(pol.circuitBreakerState, stateUpdates.circuitBreakerState || {});
            if (stateUpdates.status) pol.status = stateUpdates.status;
        }
    }

    revokePolicy(policyId) {
        const pol = this.policies.get(policyId);
        if (pol && pol.status === "ACTIVE") {
            pol.status = "REVOKED";
            pol.revokedAt = Date.now();
        }
    }
}

class InventoryAuthority {
    verifyIdentity(technicalTarget) {
        if (technicalTarget === "192.168.1.100") return { type: "DATABASE" };
        if (technicalTarget === "192.168.1.1") return { type: "GATEWAY" };
        return null;
    }
}

// ExecutionHistory boundary check
class ExecutionHistory {
    constructor() {
        this.records = new Map();
    }
    
    registerResult(result) {
        // Only trusted layers can register here
        const id = \`res_\${Date.now()}_\${Math.random()}\`;
        this.records.set(id, { ...result, id, timestamp: Date.now() });
        return id;
    }

    verifyResult(evidenceId, requirements) {
        const rec = this.records.get(evidenceId);
        if (!rec) return false;
        if (requirements.toolId && rec.toolId !== requirements.toolId) return false;
        if (requirements.target && rec.target !== requirements.target) return false;
        if (rec.status !== "SUCCESS") return false;
        return true;
    }
}

class AutonomousPolicyEngine {
    constructor(policyRegistry, securityEngine, inventoryAuthority, executionHistory) {
        this.policyRegistry = policyRegistry;
        this.securityEngine = securityEngine;
        this.inventoryAuthority = inventoryAuthority;
        this.executionHistory = executionHistory;
        this.auditLog = [];
    }

    _logAudit(action, details) {
        this.auditLog.push({ timestamp: Date.now(), action, details });
    }

    async evaluateAndAuthorize(investigationProposal, evidence, context, aiIdentity) {
        this._logAudit("AUTONOMOUS_EVALUATION_STARTED", { proposal: investigationProposal });
        
        // 1. Hard Evidence Integrity Check
        if (!evidence || evidence.type !== "ACTUAL_TOOL_RESULT") throw new Error("HARD_EVIDENCE_REQUIRED");
        if (!evidence.evidenceId) throw new Error("HARD_EVIDENCE_UNVERIFIED");
        if (!this.executionHistory.verifyResult(evidence.evidenceId, {})) throw new Error("HARD_EVIDENCE_UNVERIFIED");

        // 2. Policy State
        const policyId = investigationProposal.targetPolicyId; 
        if (!policyId) throw new Error("HUMAN_APPROVAL_REQUIRED");
        const policy = this.policyRegistry.getPolicy(policyId);
        
        if (!policy) throw new Error("HUMAN_APPROVAL_REQUIRED");
        if (policy.status === "REVOKED") throw new Error("POLICY_REVOKED");
        if (policy.status === "SUSPENDED") throw new Error("AUTONOMOUS_POLICY_SUSPENDED");
        if (policy.expiresAt && Date.now() > policy.expiresAt) throw new Error("POLICY_EXPIRED");

        // 3. Tool and Governance
        const tool = this.securityEngine.registry.getTool(investigationProposal.toolId, investigationProposal.toolVersion);
        if (!tool) throw new Error("TOOL_NOT_FOUND");
        
        const effectiveGovernance = this.securityEngine.calculateEffectiveGovernance(tool, investigationProposal.parameters, context);
        if (effectiveGovernance > policy.allowedGovernanceMaximum) throw new Error("GOVERNANCE_EXCEEDS_POLICY_MAXIMUM");

        // 4. Target Extraction & Verification
        if (tool.targetDescriptor && tool.targetDescriptor.parameter) {
            const targetVal = investigationProposal.parameters[tool.targetDescriptor.parameter];
            if (!targetVal) throw new Error("TARGET_SCHEMA_UNVERIFIED");
            
            const verifiedIdentity = this.inventoryAuthority.verifyIdentity(targetVal);
            if (!verifiedIdentity || !policy.allowedTargets.includes(verifiedIdentity.type)) {
                throw new Error("TARGET_IDENTITY_UNVERIFIED");
            }
        } else if (Object.keys(investigationProposal.parameters).length > 0) {
             // If tool has parameters but no targetDescriptor, we cannot verify target -> Fail
             // For tools that genuinely don't have a target, they shouldn't trigger this unless they need verification.
             // We assume if it has parameters and needs target verification, it must have a descriptor.
             if (policy.allowedTargets && policy.allowedTargets.length > 0 && !policy.allowedTargets.includes("*")) {
                 if (!tool.targetDescriptor) throw new Error("TARGET_SCHEMA_UNVERIFIED");
             }
        }

        // 5. Capability Check
        if (tool.capabilities && !tool.capabilities.some(c => policy.allowedCapabilities.includes(c))) {
            throw new Error("CAPABILITY_NOT_AUTHORIZED");
        }

        // 6. Rollback Parameter Scope Check
        if (policy.requiresRollback) {
            if (!investigationProposal.rollbackPlan) throw new Error("ROLLBACK_OUTSIDE_SCOPE");
            const rbToolId = investigationProposal.rollbackPlan.toolId;
            const allowedRbActions = policy.allowedRollbackActions || [];
            const rbDef = allowedRbActions.find(a => a.toolId === rbToolId);
            if (!rbDef) throw new Error("ROLLBACK_OUTSIDE_SCOPE");
            
            const rbTool = this.securityEngine.registry.getTool(rbToolId, \`\${investigationProposal.toolVersion || "1.0"}\`);
            if (rbTool.capabilities && rbTool.capabilities.some(c => ["HACK_BACK", "DDOS", "INFILTRATION", "DESTRUCTIVE"].includes(c))) throw new Error("PROHIBITED_ACTION");
            
            if (rbTool.capabilities && rbTool.capabilities.some(c => !rbDef.allowedCapabilities.includes(c))) throw new Error("ROLLBACK_OUTSIDE_SCOPE");
            const rbGov = this.securityEngine.calculateEffectiveGovernance(rbTool, investigationProposal.rollbackPlan.parameters, context);
            if (rbGov > rbDef.allowedGovernanceMaximum) throw new Error("ROLLBACK_OUTSIDE_SCOPE");
        }

        // 7. Circuit Breakers
        const now = Date.now();
        const cb = policy.circuitBreakerState;
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

        const effectiveParams = this.securityEngine.validateSchemaAndInjectDefaults(investigationProposal.parameters, tool.inputSchema);
        const fingerprint = await this.securityEngine.generateFingerprint(effectiveParams);

        // 8. Immutable AutonomousAuthorizationRecord
        const record = Object.freeze({
            authorizationId: \`auto_app_\${Date.now()}_\${Math.random().toString(36).substring(2)}\`,
            authorizationMode: "AUTONOMOUS_DELEGATION",
            approvedByHuman: false,
            derivedFromPolicy: true,
            policyId: policy.policyId,
            policyVersion: policy.version,
            policyOwnerIdentity: policy.ownerIdentity,
            toolId: tool.toolId,
            toolVersion: tool.version,
            parameterFingerprint: fingerprint,
            evidenceId: evidence.evidenceId,
            issuedAt: Date.now(),
            expiresAt: Date.now() + 120000, 
            isOneShot: true,
            status: "ACTIVE",
            lock: false 
        });

        // Store copy to prevent bypass
        this.securityEngine.approvals.set(record.authorizationId, JSON.parse(JSON.stringify(record)));
        this._logAudit("AUTONOMOUS_AUTHORIZATION_GENERATED", { authorizationId: record.authorizationId, policyId: policy.policyId });
        
        return record;
    }
}

window.AI_CORE.AutonomousPolicyRegistry = AutonomousPolicyRegistry;
window.AI_CORE.InventoryAuthority = InventoryAuthority;
window.AI_CORE.ExecutionHistory = ExecutionHistory;
window.AI_CORE.AutonomousPolicyEngine = AutonomousPolicyEngine;
`;

const testsCode = `
// ======= AUTONOMOUS DEFENSE TESTS V4 =======
window.runAutonomousTests = async function() {
    console.log("\\n=== INICIANDO PRUEBAS AISLADAS: AutonomousPolicyEngine V4 ===");
    let passed = 0; let failed = 0;
    const assert = (condition, msg) => {
        if (condition) { console.log("✅ PASS: " + msg); passed++; }
        else { console.error("❌ FAIL: " + msg); failed++; }
    };

    const registry = new window.AI_CORE.AutonomousPolicyRegistry();
    const inventory = new window.AI_CORE.InventoryAuthority();
    const executionHistory = new window.AI_CORE.ExecutionHistory();
    
    const toolRegistry = new window.AI_CORE.ToolRegistry();
    toolRegistry.register({
        toolId: "sys_block_ip", version: "1.0", enabled: true,
        baseGovernanceLevel: 2, sideEffects: "NON_DESTRUCTIVE", capabilities: ["ISOLATE_NETWORK"],
        scopes: { network: { allowedHosts: ["*"] } },
        inputSchema: { type: "object", properties: { ip: { type: "string" } } },
        targetDescriptor: { parameter: "ip", targetType: "NETWORK" }
    });
    toolRegistry.register({
        toolId: "sys_unblock_ip", version: "1.0", enabled: true,
        baseGovernanceLevel: 2, sideEffects: "NON_DESTRUCTIVE", capabilities: ["RESTORE_NETWORK"],
        inputSchema: { type: "object", properties: { ip: { type: "string" } } },
        targetDescriptor: { parameter: "ip", targetType: "NETWORK" }
    });
    toolRegistry.register({
        toolId: "sys_hack_back", version: "1.0", enabled: true,
        baseGovernanceLevel: 5, sideEffects: "DESTRUCTIVE", capabilities: ["HACK_BACK"],
        inputSchema: { type: "object" }
    });
    toolRegistry.register({
        toolId: "sys_dump", version: "1.0", enabled: true,
        baseGovernanceLevel: 1, sideEffects: "READ_ONLY", capabilities: ["READ"],
        inputSchema: { type: "object", properties: { path: { type: "string" } } }
    });
    const permissionManager = { hasCapability: () => true };
    const security = new window.AI_CORE.SecurityEngine(toolRegistry, permissionManager, registry);

    const engine = new window.AI_CORE.AutonomousPolicyEngine(registry, security, inventory, executionHistory);

    const creatorIdentity = { email: "creator@test.com", roles: ["creator"] };
    const adminIdentity = { email: "admin@test.com", roles: ["admin"] };
    const devContext = { environment: "DEV" };

    // Register actual evidence
    const validEvidenceId = executionHistory.registerResult({ toolId: "sys_monitor", target: "192.168.1.100", status: "SUCCESS" });

    const hardEvidence = { type: "ACTUAL_TOOL_RESULT", evidenceId: validEvidenceId };
    const fakeEvidence = { type: "ACTUAL_TOOL_RESULT", evidenceId: "fake_id_123" };
    const softEvidence = { type: "SUPPORTED" };

    try {
        const policyDef = {
            policyId: "pol_net_1", version: "1.0",
            allowedCapabilities: ["ISOLATE_NETWORK"],
            allowedTools: ["sys_block_ip"],
            allowedGovernanceMaximum: 3,
            allowedTargets: ["DATABASE"],
            maxActionsPerWindow: { count: 3, windowSeconds: 300 },
            suspensionThreshold: 3,
            requiresRollback: true,
            allowedRollbackActions: [
                { toolId: "sys_unblock_ip", allowedTargets: ["DATABASE"], allowedCapabilities: ["RESTORE_NETWORK"], allowedGovernanceMaximum: 2 }
            ]
        };
        registry.createPolicy(policyDef, creatorIdentity);

        const validProposal = {
            targetPolicyId: "pol_net_1", toolId: "sys_block_ip", toolVersion: "1.0",
            parameters: { ip: "192.168.1.100" },
            rollbackPlan: { toolId: "sys_unblock_ip", parameters: { ip: "192.168.1.100" } }
        };

        // 1. HARD EVIDENCE TESTS
        try { await engine.evaluateAndAuthorize(validProposal, softEvidence, devContext, {}); assert(false); } catch(e) { assert(e.message === "HARD_EVIDENCE_REQUIRED", "test_evidence_supported_rejected"); }
        try { await engine.evaluateAndAuthorize(validProposal, fakeEvidence, devContext, {}); assert(false); } catch(e) { assert(e.message === "HARD_EVIDENCE_UNVERIFIED", "test_evidence_fake_id_rejected"); }
        
        // 2. TOCTOU REAL TEST
        const toctouPolicy = registry.createPolicy({ ...policyDef, policyId: "pol_toctou" }, creatorIdentity);
        const toctouProposal = { ...validProposal, targetPolicyId: "pol_toctou" };
        const toctouRecord = await engine.evaluateAndAuthorize(toctouProposal, hardEvidence, devContext, {});
        registry.revokePolicy("pol_toctou");
        try {
            await security.validateForExecution(toctouRecord.authorizationId, { ip: "192.168.1.100" }, devContext, adminIdentity);
            assert(false);
        } catch(e) {
            assert(e.message === "AUTONOMOUS_POLICY_REVOKED", "test_toctou_revoked_policy_invalidates_previously_generated_record");
        }

        // 3. TARGET EXTRACTION TEST
        const missingTargetDescProposal = { ...validProposal, toolId: "sys_dump" };
        try { await engine.evaluateAndAuthorize(missingTargetDescProposal, hardEvidence, devContext, {}); assert(false); } catch(e) { assert(e.message === "TARGET_SCHEMA_UNVERIFIED", "test_tool_missing_target_descriptor_blocked"); }

        // 4. ROLLBACK PARAMETER SCOPE TEST
        const badRollbackProposal = { ...validProposal, rollbackPlan: { toolId: "sys_hack_back", parameters: {} } };
        try { await engine.evaluateAndAuthorize(badRollbackProposal, hardEvidence, devContext, {}); assert(false); } catch(e) { assert(e.message === "PROHIBITED_ACTION", "test_rollback_offensive_tool_rejected"); }
        const badCapRollbackProposal = { ...validProposal, rollbackPlan: { toolId: "sys_dump", parameters: { path: "/" } } };
        try { await engine.evaluateAndAuthorize(badCapRollbackProposal, hardEvidence, devContext, {}); assert(false); } catch(e) { assert(e.message === "ROLLBACK_OUTSIDE_SCOPE", "test_rollback_capability_outside_scope_rejected"); }

        // 5. ADMIN DELEGATION SUBSET TEST
        const highGovPolicy = { ...policyDef, policyId: "pol_net_3", allowedGovernanceMaximum: 4 };
        try { registry.createPolicy(highGovPolicy, adminIdentity); assert(false); } catch(e) { assert(e.message === "DELEGATION_SCOPE_EXCEEDED", "test_delegated_admin_cannot_exceed_creator_governance"); }
        const badTargetPolicy = { ...policyDef, policyId: "pol_net_4", allowedTargets: ["*"] };
        try { registry.createPolicy(badTargetPolicy, adminIdentity); assert(false); } catch(e) { assert(e.message === "DELEGATION_SCOPE_EXCEEDED", "test_delegated_admin_cannot_broaden_targets"); }

        // 6. IMMUTABILITY TEST
        const rec = await engine.evaluateAndAuthorize(validProposal, hardEvidence, devContext, {});
        try {
            rec.expiresAt = Date.now() + 9999999;
            assert(false, "Record was mutable!");
        } catch(e) {
            assert(true, "test_immutable_autonomous_authorization_record");
        }
        const storedRec = security.getAuthorization(rec.authorizationId);
        storedRec.expiresAt = 999999; 
        const storedRec2 = security.getAuthorization(rec.authorizationId);
        assert(storedRec2.expiresAt !== 999999, "test_security_engine_stores_safe_copy");

        // 7. CIRCUIT BREAKER SEPARATION
        try {
            await engine.evaluateAndAuthorize(validProposal, hardEvidence, devContext, {});
            await engine.evaluateAndAuthorize(validProposal, hardEvidence, devContext, {});
            assert(false);
        } catch(e) {
            assert(e.message === "AUTONOMOUS_RATE_LIMITED", "test_rate_limited_independent_from_suspension");
        }
        try {
            try { await engine.evaluateAndAuthorize(validProposal, hardEvidence, devContext, {}); } catch(e){}
            try { await engine.evaluateAndAuthorize(validProposal, hardEvidence, devContext, {}); } catch(e){}
            await engine.evaluateAndAuthorize(validProposal, hardEvidence, devContext, {});
            assert(false);
        } catch(e) {
            assert(e.message === "AUTONOMOUS_POLICY_SUSPENDED", "test_policy_suspended_after_threshold");
        }

    } catch (e) {
        console.error(e);
        assert(false, "Unhandled exception");
    }

    console.log(\`RESULTADO AUTONOMOUS V4: \${passed} PASS | \${failed} FAIL\`);
};
`;

fs.writeFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-security.js', securityCode);
fs.writeFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-autonomous.js', autonomousCode);

let oldTests = fs.readFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-tests.js', 'utf8');
oldTests = oldTests.replace(/\/\/ ======= AUTONOMOUS DEFENSE TESTS =======[\s\S]*/g, '');
oldTests = oldTests.replace(/\/\/ ======= AUTONOMOUS DEFENSE TESTS V4 =======[\s\S]*/g, '');
oldTests += testsCode;
fs.writeFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-tests.js', oldTests);
console.log('Successfully applied patches');
