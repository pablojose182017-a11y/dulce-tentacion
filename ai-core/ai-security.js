window.AI_CORE = window.AI_CORE || {};

/**
 * Tool Registry
 * Fuente inmutable de herramientas registradas.
 */
class ToolRegistry {
    constructor() {
        this.tools = new Map();
    }
    
    register(toolDefinition) {
        const key = `${toolDefinition.toolId}@${toolDefinition.version}`;
        this.tools.set(key, JSON.parse(JSON.stringify(toolDefinition)));
    }
    
    getTool(toolId, version) {
        const tool = this.tools.get(`${toolId}@${version}`);
        if (!tool) return undefined;
        return JSON.parse(JSON.stringify(tool));
    }
}

/**
 * Security Engine
 */
class SecurityEngine {
    constructor(registry, permissionManager) {
        this.registry = registry;
        this.permissionManager = permissionManager; 
        this.approvals = new Map();
        this.auditLog = [];

        // Payload Limits
        this.LIMITS = {
            MAX_DEPTH: 5,
            MAX_KEYS: 50,
            MAX_STRING_LENGTH: 2048,
            MAX_ARRAY_LENGTH: 100
        };
    }

    _logAudit(action, details) {
        this.auditLog.push({ timestamp: Date.now(), action, details });
    }

    /**
     * Valida limites deterministas del payload para evitar DoS en canonicalización.
     */
    _enforcePayloadLimits(obj, currentDepth = 0, totalKeys = { count: 0 }) {
        if (currentDepth > this.LIMITS.MAX_DEPTH) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
        if (obj === null || obj === undefined) return;
        if (typeof obj === 'string' && obj.length > this.LIMITS.MAX_STRING_LENGTH) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
        if (typeof obj === 'object') {
            if (Array.isArray(obj)) {
                if (obj.length > this.LIMITS.MAX_ARRAY_LENGTH) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
                for (let item of obj) {
                    this._enforcePayloadLimits(item, currentDepth + 1, totalKeys);
                }
            } else {
                const keys = Object.keys(obj);
                totalKeys.count += keys.length;
                if (totalKeys.count > this.LIMITS.MAX_KEYS) throw new Error("PAYLOAD_LIMIT_EXCEEDED");
                for (let k of keys) {
                    this._enforcePayloadLimits(obj[k], currentDepth + 1, totalKeys);
                }
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
            if (val === undefined && props[key].default !== undefined) {
                val = props[key].default;
            }
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
        if (context.environment === "PROD" && tool.sideEffects !== "READ_ONLY") maxLevel = Math.max(maxLevel, 3);
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
            if (params.host && net.allowedHosts && !net.allowedHosts.some(h => params.host.match(new RegExp('^' + h.replace(/\./g, "\\.").replace(/\*/g, '.*') + '$')))) return false;
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
            requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2)}`,
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
            approvalId: `app_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            approverIdentity: approverIdentity.email, toolId: tool.toolId, toolVersion: tool.version,
            parameterFingerprint: fingerprint, purpose: request.purpose,
            issuedAt: Date.now(), expiresAt: Date.now() + 15 * 60 * 1000,
            isOneShot: true, status: "ACTIVE",
            lock: false // Atomic lock property
        };
        this.approvals.set(record.approvalId, record);
        this._logAudit("APPROVAL_RECORD_CREATED", { approvalId: record.approvalId, approver: approverIdentity.email });
        return record;
    }

    async validateForExecution(approvalId, executionParams, context, executorIdentity) {
        const record = this.approvals.get(approvalId);
        if (!record) throw new Error("APPROVAL_NOT_FOUND");

        // Concurrency protection: Atomic Read-Modify-Write attempt (Lock)
        if (record.isOneShot) {
            if (record.status !== "ACTIVE") throw new Error("APPROVAL_ALREADY_CONSUMED");
            if (record.lock) throw new Error("APPROVAL_ALREADY_CONSUMED"); 
            record.lock = true; // Acquire lock immediately
        } else {
            if (record.status !== "ACTIVE") throw new Error(record.status === "REVOKED" ? "APPROVAL_REVOKED" : "APPROVAL_ALREADY_CONSUMED");
        }

        try {
            if (Date.now() > record.expiresAt) throw new Error("APPROVAL_EXPIRED");

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
                // Lock is released conceptually as it's now consumed forever
            }

            this._logAudit("EXECUTION_VALIDATED", { approvalId, toolId: tool.toolId, executor: executorIdentity.email });
            return { validationStatus: "PASS", effectiveGovernance: currentGov };

        } catch(e) {
            // Rollback lock if validation fails for a reason other than concurrent consumption
            if (record.isOneShot && record.status === "ACTIVE") {
                record.lock = false; 
            }
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
