"use strict";
window.AI_CORE = window.AI_CORE || {};

class ToolRegistry {
    constructor() {
        this._tools = new Map();
    }

    register(toolDefinition) {
        const key = `${toolDefinition.toolId}@${toolDefinition.version}`;
        this._tools.set(key, JSON.parse(JSON.stringify(toolDefinition)));
    }

    getTool(toolId, version) {
        const tool = this._tools.get(`${toolId}@${version}`);
        if (!tool) return undefined;
        return JSON.parse(JSON.stringify(tool));
    }
}

class SecurityEngine {
    constructor(registry, permissionManager, policyRegistry = null) {
        this.registry = registry;
        this.permissionManager = permissionManager;
        this.policyRegistry = policyRegistry;
        // V5: two separate Maps — payload is frozen, state is mutable (internal only)
        this._payloads = new Map();
        this._transactionalStates = new Map();
        // Human approvals remain in a separate map (not mixed with autonomous records)
        this._humanApprovals = new Map();
        this.auditLog = [];
        this.LIMITS = {
            MAX_DEPTH: 5,
            MAX_KEYS: 50,
            MAX_STRING_LENGTH: 2048,
            MAX_ARRAY_LENGTH: 100
        };
    }

    setPolicyRegistry(pr) { this.policyRegistry = pr; }

    _logAudit(action, details) {
        this.auditLog.push({ timestamp: Date.now(), action, details });
    }

    // ─── Payload Limits ────────────────────────────────────────────────────────

    _enforcePayloadLimits(obj, currentDepth = 0, totalKeys = { count: 0 }) {
        if (currentDepth > this.LIMITS.MAX_DEPTH) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
        if (obj === null || obj === undefined) return;
        if (typeof obj === 'string' && obj.length > this.LIMITS.MAX_STRING_LENGTH) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
        if (typeof obj === 'object') {
            if (Array.isArray(obj)) {
                if (obj.length > this.LIMITS.MAX_ARRAY_LENGTH) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
                for (const item of obj) this._enforcePayloadLimits(item, currentDepth + 1, totalKeys);
            } else {
                const keys = Object.keys(obj);
                totalKeys.count += keys.length;
                if (totalKeys.count > this.LIMITS.MAX_KEYS) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
                for (const k of keys) this._enforcePayloadLimits(obj[k], currentDepth + 1, totalKeys);
            }
        }
    }

    // ─── Schema Validation ─────────────────────────────────────────────────────

    validateSchemaAndInjectDefaults(params, schema) {
        this._enforcePayloadLimits(params);
        if (!schema || schema.type !== 'object') return params || {};
        const p = params || {};
        const result = {};
        const props = schema.properties || {};

        if (schema.required) {
            for (const req of schema.required) {
                if (p[req] === undefined && (!props[req] || props[req].default === undefined)) {
                    throw new Error("SCHEMA_REQUIRED_PARAMETER_MISSING");
                }
            }
        }
        for (const key in p) {
            if (!props[key]) throw new Error("SCHEMA_ADDITIONAL_PROPERTIES_NOT_ALLOWED");
        }
        for (const key in props) {
            let val = p[key];
            if (val === undefined && props[key].default !== undefined) val = props[key].default;
            if (val !== undefined) {
                if (props[key].type === 'string'  && typeof val !== 'string')  throw new Error("SCHEMA_INVALID_TYPE");
                if (props[key].type === 'number'  && typeof val !== 'number')  throw new Error("SCHEMA_INVALID_TYPE");
                if (props[key].type === 'boolean' && typeof val !== 'boolean') throw new Error("SCHEMA_INVALID_TYPE");
                if (props[key].type === 'array'   && !Array.isArray(val))      throw new Error("SCHEMA_INVALID_TYPE");
                if (props[key].type === 'object'  && (typeof val !== 'object' || Array.isArray(val) || val === null)) throw new Error("SCHEMA_INVALID_TYPE");
                result[key] = val;
            }
        }
        return result;
    }

    // ─── Canonicalization & Fingerprint ────────────────────────────────────────

    _canonicalize(params) {
        if (params === null || params === undefined) return "null";
        if (typeof params === "number")  return isNaN(params) ? "null" : String(params);
        if (typeof params === "boolean") return String(params);
        if (typeof params === "string")  return '"' + encodeURIComponent(params) + '"';
        if (Array.isArray(params))       return "[" + params.map(p => this._canonicalize(p)).join(",") + "]";
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
        if (typeof btoa !== 'undefined')   return btoa(unescape(encodeURIComponent(canonical)));
        return canonical;
    }

    // ─── Governance ────────────────────────────────────────────────────────────

    calculateEffectiveGovernance(tool, params, context) {
        let maxLevel = tool.baseGovernanceLevel || 1;
        if (context && context.environment === "PROD" && tool.sideEffects !== "READ_ONLY") maxLevel = Math.max(maxLevel, 3);
        if (tool.sideEffects === "DESTRUCTIVE" || tool.sideEffects === "IRREVERSIBLE")     maxLevel = Math.max(maxLevel, 5);
        if (tool.requiresConfirmation) maxLevel = Math.max(maxLevel, 5);
        return maxLevel;
    }

    // ─── Path / Scope Checks ───────────────────────────────────────────────────

    _checkPath(allowedPaths, targetPath) {
        if (targetPath.includes("../") || targetPath.includes("..\\")) return false;
        try {
            const decoded = decodeURIComponent(targetPath);
            if (decoded !== targetPath && (decoded.includes("../") || decoded.includes("..\\"))) return false;
        } catch(e) {}
        const norm = targetPath.replace(/\\/g, '/');
        for (const p of allowedPaths) {
            const na = p.replace(/\\/g, '/');
            if (norm === na) return true;
            if (na.endsWith('/') ? norm.startsWith(na) : norm.startsWith(na + '/')) return true;
        }
        return false;
    }

    checkScopes(tool, params) {
        if (tool.scopes?.network && (params.host || params.protocol || params.port)) {
            const net = tool.scopes.network;
            if (params.host && net.allowedHosts &&
                !net.allowedHosts.some(h => params.host.match(
                    new RegExp('^' + h.split('.').join('\\.').split('*').join('.*') + '$')
                ))) return false;
            if (params.protocol && net.allowedProtocols && !net.allowedProtocols.includes(params.protocol)) return false;
            if (params.port    && net.allowedPorts     && !net.allowedPorts.includes(params.port))          return false;
        }
        if (tool.scopes?.file && params.path && !this._checkPath(tool.scopes.file.allowedPaths || [], params.path)) return false;
        if (tool.scopes?.process && params.executable) {
            const proc = tool.scopes.process;
            if (proc.allowedExecutables && !proc.allowedExecutables.includes(params.executable)) return false;
            if (params.args && proc.allowedArguments) {
                for (const arg of params.args) {
                    if (!proc.allowedArguments.includes(arg)) return false;
                }
            }
        }
        return true;
    }

    _checkPermission(executorIdentity, tool) {
        if (!this.permissionManager || !tool.capabilities) return true;
        for (const cap of tool.capabilities) {
            if (!this.permissionManager.hasCapability(executorIdentity, cap)) return false;
        }
        return true;
    }

    // ─── Human Approval (unchanged) ────────────────────────────────────────────

    createApprovalRequest(toolId, version, params, purpose, context) {
        const tool = this.registry.getTool(toolId, version);
        if (!tool) throw new Error("TOOL_NOT_FOUND");
        if (!tool.enabled) throw new Error("TOOL_DISABLED");
        const effectiveParams = this.validateSchemaAndInjectDefaults(params, tool.inputSchema);
        if (!this.checkScopes(tool, effectiveParams)) throw new Error("SCOPE_VIOLATION");
        this._logAudit("APPROVAL_REQUEST_CREATED", { toolId, version });
        return {
            requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            proposedTool: toolId, proposedVersion: version,
            proposedParameters: effectiveParams,
            purpose,
            effectiveGovernanceCalculated: this.calculateEffectiveGovernance(tool, effectiveParams, context),
            status: "PENDING_APPROVAL"
        };
    }

    async approveRequest(request, approverIdentity) {
        const tool = this.registry.getTool(request.proposedTool, request.proposedVersion);
        if (!tool) throw new Error("TOOL_NOT_FOUND");
        const fingerprint = await this.generateFingerprint(request.proposedParameters);
        const record = {
            approvalId: `app_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            approverIdentity: approverIdentity.email,
            toolId: tool.toolId, toolVersion: tool.version,
            parameterFingerprint: fingerprint, purpose: request.purpose,
            issuedAt: Date.now(), expiresAt: Date.now() + 15 * 60 * 1000,
            isOneShot: true, status: "ACTIVE", lock: false
        };
        this._humanApprovals.set(record.approvalId, record);
        this._logAudit("APPROVAL_RECORD_CREATED", { approvalId: record.approvalId, approver: approverIdentity.email });
        return JSON.parse(JSON.stringify(record));
    }

    // ─── V5: Autonomous Record Storage ─────────────────────────────────────────

    /**
     * Called by AutonomousPolicyEngine to store a frozen AuthorizationPayload.
     * SecurityEngine creates its own TransactionalState — callers never get a
     * reference to it.
     */
    storeAutonomousRecord(frozenPayload) {
        const id = frozenPayload.authorizationId;
        if (this._payloads.has(id)) throw new Error("AUTHORIZATION_ID_COLLISION");

        this._payloads.set(id, frozenPayload); // payload is already deepFrozen

        // TransactionalState is internal — never exposed directly
        this._transactionalStates.set(id, {
            authorizationId: id,
            status: "ACTIVE",
            lock: false,
            consumedAt: null,
            consumerId: null,
            replayCount: 0,
            lastAccessedAt: Date.now()
        });

        this._logAudit("AUTONOMOUS_RECORD_STORED", { authorizationId: id, policyId: frozenPayload.policyId });
        return this._buildExternalView(id);
    }

    /**
     * Returns an ExternalView — a safe read-only snapshot.
     * Mutations on the returned object do NOT affect internal state.
     */
    getAuthorization(id) {
        if (!this._payloads.has(id)) return undefined;
        return this._buildExternalView(id);
    }

    _buildExternalView(id) {
        const payload  = this._payloads.get(id);
        const state    = this._transactionalStates.get(id);
        if (!payload) return undefined;
        // Return payload (already frozen) + safe snapshot (shallow copy of allowed fields)
        return {
            payload,   // deepFrozen — caller cannot mutate
            snapshot: {
                status:    state ? state.status    : "UNKNOWN",
                expiresAt: payload.expiresAt
                // lock, consumerId, replayCount intentionally withheld
            }
        };
    }

    // ─── V5: validateForExecution (Autonomous) ─────────────────────────────────

    async validateForExecution(authorizationId, executionParams, context, executorIdentity) {
        const payload = this._payloads.get(authorizationId);
        const state   = this._transactionalStates.get(authorizationId);

        if (!payload || !state) throw new Error("APPROVAL_NOT_FOUND");

        // ── ATOMIC ONE-SHOT GATE (synchronous — JS single-threaded) ──
        if (state.status !== "ACTIVE") throw new Error("REPLAY_REJECTED");
        if (state.lock)                throw new Error("REPLAY_REJECTED");
        state.lock = true;
        state.lastAccessedAt = Date.now();
        // ── END ATOMIC GATE ──

        try {
            // 1. Expiration (read from immutable payload)
            if (Date.now() > payload.expiresAt) throw new Error("APPROVAL_EXPIRED");

            // 2. TOCTOU: policy revalidation
            if (payload.derivedFromPolicy === true) {
                if (!this.policyRegistry) throw new Error("POLICY_REGISTRY_UNAVAILABLE");
                const policy = this.policyRegistry.getPolicy(payload.policyId);
                if (!policy)                           throw new Error("AUTONOMOUS_POLICY_REVOKED");
                if (policy.version !== payload.policyVersion) throw new Error("AUTONOMOUS_POLICY_REVOKED");
                if (policy.status === "REVOKED")       throw new Error("AUTONOMOUS_POLICY_REVOKED");
                if (policy.status === "SUSPENDED")     throw new Error("AUTONOMOUS_POLICY_SUSPENDED");
                if (policy.expiresAt && Date.now() > policy.expiresAt) throw new Error("AUTONOMOUS_POLICY_EXPIRED");
            }

            // 3. Tool revalidation
            const tool = this.registry.getTool(payload.toolId, payload.toolVersion);
            if (!tool)         throw new Error("TOOL_NOT_FOUND");
            if (!tool.enabled) throw new Error("TOOL_DISABLED");

            // 4. Parameter fingerprint
            const effectiveParams      = this.validateSchemaAndInjectDefaults(executionParams, tool.inputSchema);
            const executionFingerprint = await this.generateFingerprint(effectiveParams);
            if (executionFingerprint !== payload.parameterFingerprint) throw new Error("PARAMETER_MISMATCH");

            // 5. Scopes & permissions
            if (!this.checkScopes(tool, effectiveParams))               throw new Error("SCOPE_VIOLATION");
            if (!this._checkPermission(executorIdentity, tool))         throw new Error("PERMISSION_DENIED");

            // 6. Governance re-check
            const currentGov = this.calculateEffectiveGovernance(tool, effectiveParams, context);
            if (currentGov >= 4 &&
                !executorIdentity.roles?.includes("admin") &&
                !executorIdentity.roles?.includes("creator")) {
                throw new Error("INSUFFICIENT_PRIVILEGES_FOR_GOVERNANCE");
            }

            // ── CONSUME (only TransactionalState changes) ──
            state.status     = "CONSUMED";
            state.consumedAt = Date.now();
            state.consumerId = executorIdentity.email || "unknown";
            state.lock       = false;

            this._logAudit("EXECUTION_VALIDATED", {
                authorizationId,
                toolId: payload.toolId,
                executor: executorIdentity.email
            });
            return { validationStatus: "PASS", effectiveGovernance: currentGov };

        } catch (e) {
            state.lock = false; // always release lock on failure
            throw e;
        }
    }

    // ─── Legacy human approval validation (kept for backwards compatibility) ───

    async validateHumanApprovalForExecution(approvalId, executionParams, context, executorIdentity) {
        const record = this._humanApprovals.get(approvalId);
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
            const tool = this.registry.getTool(record.toolId, record.toolVersion);
            if (!tool) throw new Error("TOOL_NOT_FOUND");
            if (!tool.enabled) throw new Error("TOOL_DISABLED");
            const effectiveParams      = this.validateSchemaAndInjectDefaults(executionParams, tool.inputSchema);
            const executionFingerprint = await this.generateFingerprint(effectiveParams);
            if (executionFingerprint !== record.parameterFingerprint) throw new Error("PARAMETER_MISMATCH");
            if (!this.checkScopes(tool, effectiveParams))              throw new Error("SCOPE_VIOLATION");
            if (!this._checkPermission(executorIdentity, tool))        throw new Error("PERMISSION_DENIED");
            const currentGov = this.calculateEffectiveGovernance(tool, effectiveParams, context);
            if (currentGov >= 4 && !executorIdentity.roles?.includes("admin") && !executorIdentity.roles?.includes("creator")) {
                throw new Error("INSUFFICIENT_PRIVILEGES_FOR_GOVERNANCE");
            }
            if (record.isOneShot) { record.status = "CONSUMED"; record.consumedAt = Date.now(); }
            this._logAudit("HUMAN_APPROVAL_VALIDATED", { approvalId, toolId: tool.toolId });
            return { validationStatus: "PASS", effectiveGovernance: currentGov };
        } catch (e) {
            if (record.isOneShot && record.status === "ACTIVE") record.lock = false;
            throw e;
        }
    }

    revokeApproval(approvalId) {
        const record = this._humanApprovals.get(approvalId);
        if (record && record.status === "ACTIVE") {
            record.status = "REVOKED";
            this._logAudit("APPROVAL_REVOKED", { approvalId });
            return true;
        }
        return false;
    }

    // ─── Expose approvals Map for legacy security tests ────────────────────────
    // Legacy tests reference security.approvals.set(...) for human approvals.
    // Provide a shim so existing tests continue to work.
    get approvals() { return this._humanApprovals; }
}

window.AI_CORE.ToolRegistry  = ToolRegistry;
window.AI_CORE.SecurityEngine = SecurityEngine;
