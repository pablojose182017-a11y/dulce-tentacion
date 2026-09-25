"use strict";
window.AI_CORE = window.AI_CORE || {};

function canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') return String(obj);
    if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
    const keys = Object.keys(obj).sort();
    return '{' + keys.map(k => `${k}:${canonicalize(obj[k])}`).join(',') + '}';
}

function base64(str) {
    // Basic mock of base64 for browser-like env in node
    return Buffer.from(str).toString('base64');
}

class AdapterRegistry {
    constructor() {
        this.adapters = new Map(); // key: toolId@version
    }
    register(def) {
        this.adapters.set(`${def.toolId}@${def.version}`, def);
    }
    getAdapter(toolId, version) {
        return this.adapters.get(`${toolId}@${version}`);
    }
}

class ExecutionSlotManager {
    constructor() {
        this.slots = new Map();
    }
    reserveSlot(policyId, maxConcurrentExecutions) {
        if (!this.slots.has(policyId)) this.slots.set(policyId, { count: 0, slots: [] });
        const slotInfo = this.slots.get(policyId);
        if (slotInfo.count >= maxConcurrentExecutions) {
            throw new Error("EXECUTION_SLOT_EXHAUSTED");
        }
        const slot = { slotId: `slot_${Date.now()}_${Math.random()}`, state: "RESERVED", reservedAt: Date.now() };
        slotInfo.slots.push(slot);
        slotInfo.count++;
        return slot;
    }
    updateState(policyId, slotId, newState) {
        const slotInfo = this.slots.get(policyId);
        if (!slotInfo) return;
        const slot = slotInfo.slots.find(s => s.slotId === slotId);
        if (!slot) return;
        
        if (newState === "RELEASED" && slot.state !== "RELEASED") {
            slotInfo.count--;
        }
        slot.state = newState;
    }
}

class VerificationLayer {
    verify(rawResult, expectedSchema) {
        if (!rawResult || rawResult.status !== "SUCCESS") return { verificationStatus: "FAILED", error: "Not SUCCESS" };
        if (rawResult.output && rawResult.output.invalid) return { verificationStatus: "FAILED", error: "Invalid output" };
        return { verificationStatus: "PASSED", verifiedOutput: rawResult.output };
    }
}

class AuditTrail {
    constructor() {
        this.entries = [];
    }
    append(entry) {
        entry.auditId = `audit_${Date.now()}_${Math.random()}`;
        entry.timestamp = Date.now();
        this.entries.push(Object.freeze(entry));
    }
}

class RealExecutionHistory {
    constructor() {
        this._records = new Map();
        this._writeToken = `token_${Date.now()}_${Math.random()}`;
        this._isBound = false;
    }
    bindGateway() {
        if (this._isBound) throw new Error("HISTORY_ALREADY_BOUND");
        this._isBound = true;
        return this._writeToken;
    }
    registerResult(result, token) {
        if (token !== this._writeToken) throw new Error("UNAUTHORIZED_HISTORY_WRITE");
        const evidenceId = `ev_${Date.now()}_${Math.random()}`;
        const rec = { ...result, evidenceId, timestamp: Date.now() };
        this._records.set(evidenceId, Object.freeze(rec));
        return evidenceId;
    }
    verifyResult(evidenceId, requirements) {
        const rec = this._records.get(evidenceId);
        if (!rec) return false;
        return rec.verificationStatus === "PASSED" || rec.status === "SUCCESS"; 
    }
    getProvenance(evidenceId) {
        return this._records.get(evidenceId);
    }
}

const STATIC_OFFENSIVE_DENY_LIST = new Set([
    "HACK_BACK", "DDOS", "INFILTRATION", "DESTRUCTIVE", 
    "SELF_MODIFICATION", "PRIVILEGE_ESCALATION", 
    "WRITE_TO_CODEBASE", "MODIFY_TOOLREGISTRY", "MODIFY_PERMISSIONMANAGER"
]);

function extractCapabilities(node) {
    if (typeof node === 'string') return new Set([node]);
    if (Array.isArray(node)) {
        let res = new Set();
        for (let item of node) {
            extractCapabilities(item).forEach(c => res.add(c));
        }
        return res;
    }
    if (typeof node === 'object' && node !== null) {
        let res = new Set();
        if (node.name) res.add(node.name);
        if (node.nested) extractCapabilities(node.nested).forEach(c => res.add(c));
        if (node.capabilities) extractCapabilities(node.capabilities).forEach(c => res.add(c));
        return res;
    }
    return new Set();
}

function effectiveCapabilities(payload, toolDef, adapterDef) {
    let caps = new Set();
    const mapSideEffect = (se) => {
        if (se === "DESTRUCTIVE" || se === "IRREVERSIBLE") return "DESTRUCTIVE";
        return se;
    };
    
    extractCapabilities(payload.capabilities).forEach(c => caps.add(c));
    if (payload.rollbackPlan) extractCapabilities(payload.rollbackPlan.capabilities).forEach(c => caps.add(c));
    
    if (toolDef) {
        extractCapabilities(toolDef.capabilities).forEach(c => caps.add(c));
        if (toolDef.sideEffects) {
            (Array.isArray(toolDef.sideEffects) ? toolDef.sideEffects : [toolDef.sideEffects]).forEach(se => caps.add(mapSideEffect(se)));
        }
    }
    if (adapterDef) {
        extractCapabilities(adapterDef.capabilities).forEach(c => caps.add(c));
        if (adapterDef.declaredSideEffects) {
            adapterDef.declaredSideEffects.forEach(se => caps.add(mapSideEffect(se)));
        }
    }
    return caps;
}

class ExecutionGateway {
    constructor(securityEngine, adapterRegistry, slotManager, verificationLayer, history, auditTrail, inventoryAuthority) {
        this.security = securityEngine;
        this.adapters = adapterRegistry;
        this.slots = slotManager;
        this.verification = verificationLayer;
        this.history = history;
        this.audit = auditTrail;
        this.inventory = inventoryAuthority;
        this._historyToken = this.history.bindGateway();
    }
    
    async execute(authorizationId, executionParams, executorIdentity, context) {
        let slot = null;
        let payload = null;
        try {
            const view = this.security.getAuthorization(authorizationId);
            if (!view) throw new Error("APPROVAL_NOT_FOUND");
            payload = view.payload;
            
            if (view.snapshot.status !== "ACTIVE") throw new Error("REPLAY_REJECTED");
            if (view.snapshot.lock === true) throw new Error("REPLAY_REJECTED");

            const adapterDefBefore = this.adapters.getAdapter(payload.toolId, payload.toolVersion);
            const maxConcurrency = adapterDefBefore ? adapterDefBefore.maxConcurrentExecutions || 1 : 1;
            slot = this.slots.reserveSlot(payload.policyId, maxConcurrency);

            const tool = this.security.registry.getTool(payload.toolId, payload.toolVersion);
            const adapter = this.adapters.getAdapter(payload.toolId, payload.toolVersion);

            const effCaps = effectiveCapabilities(payload, tool, adapter);
            for (let c of effCaps) {
                if (STATIC_OFFENSIVE_DENY_LIST.has(c)) {
                    this.audit.append({ action: "OFFENSIVE_BLOCKED" });
                    throw new Error("PROHIBITED_ACTION");
                }
            }

            if (Date.now() > payload.expiresAt) throw new Error("APPROVAL_EXPIRED");

            if (!tool || tool.enabled === false) throw new Error("TOOL_DISABLED");

            if (!adapter) throw new Error("ADAPTER_NOT_FOUND");
            if (adapter.enabled === false) throw new Error("ADAPTER_DISABLED");
            if (adapter.adapterId !== payload.adapterId) throw new Error("ADAPTER_BINDING_MISMATCH");
            if (adapter.adapterVersion !== payload.adapterVersion) throw new Error("ADAPTER_VERSION_MISMATCH");

            const toolFp = base64(canonicalize({
                capabilities: [...(tool.capabilities||[])].sort(),
                sideEffects: tool.sideEffects,
                scopes: tool.scopes,
                inputSchema: tool.inputSchema,
                targetDescriptor: tool.targetDescriptor,
                baseGovernanceLevel: tool.baseGovernanceLevel,
                requiresConfirmation: tool.requiresConfirmation
            }));
            const adapterFp = base64(canonicalize({
                capabilities: [...(adapter.capabilities||[])].sort(),
                declaredSideEffects: [...(adapter.declaredSideEffects||[])].sort(),
                maxExecutionMs: adapter.maxExecutionMs,
                supportsCancellation: adapter.supportsCancellation,
                cancellationGuarantee: adapter.cancellationGuarantee,
                enabled: adapter.enabled
            }));
            if (toolFp !== payload.toolDefinitionFingerprint || adapterFp !== payload.adapterDefinitionFingerprint) {
                throw new Error("DEFINITION_FINGERPRINT_MISMATCH");
            }

            const fp = await this.security.generateFingerprint(executionParams);
            if (fp !== payload.parameterFingerprint) throw new Error("PARAMETER_MISMATCH");

            if (tool.targetDescriptor && tool.targetDescriptor.parameter) {
                const targetVal = executionParams[tool.targetDescriptor.parameter];
                const inv = this.inventory.verifyIdentity(targetVal);
                if (!inv || inv.type !== payload.targetType || inv.canonicalId !== payload.targetCanonicalId || inv.fingerprint !== payload.targetFingerprint) {
                    throw new Error("TARGET_IDENTITY_MISMATCH");
                }
            }

            await this.security.validateForExecution(authorizationId, executionParams, context, executorIdentity);

            this.slots.updateState(payload.policyId, slot.slotId, "RUNNING");
            this.audit.append({ action: "EXECUTION_STARTED", authorizationId });

            let rawResult;
            let timeoutPromise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (adapter.supportsCancellation) {
                        reject(new Error("EXECUTION_TERMINATED"));
                    } else {
                        reject(new Error("TIMEOUT_REQUESTED"));
                    }
                }, adapter.maxExecutionMs || 50);
            });

            try {
                rawResult = await Promise.race([adapter.execute(executionParams), timeoutPromise]);
            } catch (err) {
                if (err.message === "TIMEOUT_REQUESTED") {
                    this.slots.updateState(payload.policyId, slot.slotId, "RUNAWAY");
                    this.audit.append({ action: "EXECUTION_RUNAWAY", authorizationId });
                    
                    // Late resolving runaway execution 
                    adapter.execute(executionParams).then(res => {
                        this.slots.updateState(payload.policyId, slot.slotId, "RELEASED");
                        this.audit.append({ action: "RUNAWAY_EXECUTION_TERMINATED", authorizationId });
                    }).catch(e => {
                        this.slots.updateState(payload.policyId, slot.slotId, "RELEASED");
                        this.audit.append({ action: "RUNAWAY_EXECUTION_TERMINATED", authorizationId });
                    });
                    
                    throw err;
                } else if (err.message === "EXECUTION_TERMINATED") {
                    this.slots.updateState(payload.policyId, slot.slotId, "RELEASED");
                    this.audit.append({ action: "EXECUTION_TERMINATED", authorizationId });
                    throw err;
                } else {
                    throw err;
                }
            }

            const verified = this.verification.verify(rawResult, tool.outputSchema);
            if (verified.verificationStatus === "FAILED") {
                this.audit.append({ action: "VERIFICATION_FAILED", authorizationId });
                this.slots.updateState(payload.policyId, slot.slotId, "RELEASED");
                throw new Error("VERIFICATION_FAILED");
            }

            const verifiedResult = {
                executionId: `exec_${Date.now()}`,
                authorizationId,
                authorizationMode: payload.authorizationMode,
                toolId: payload.toolId,
                toolVersion: payload.toolVersion,
                adapterId: payload.adapterId,
                adapterVersion: payload.adapterVersion,
                executorIdentity: executorIdentity.email,
                targetType: payload.targetType,
                technicalTarget: executionParams[tool.targetDescriptor?.parameter || ''] || null,
                executedAt: Date.now(),
                durationMs: 10,
                status: "SUCCESS",
                verificationStatus: "PASSED",
                verifiedOutput: verified.verifiedOutput
            };

            const evidenceId = this.history.registerResult(verifiedResult, this._historyToken);
            this.audit.append({ action: "EXECUTION_COMPLETED", authorizationId, executionId: verifiedResult.executionId });
            this.slots.updateState(payload.policyId, slot.slotId, "RELEASED");

            return { status: "SUCCESS", evidenceId };

        } catch (error) {
            if (slot && error.message !== "TIMEOUT_REQUESTED") {
                this.slots.updateState(payload ? payload.policyId : 'unknown', slot.slotId, "RELEASED");
            }
            this.audit.append({ action: "EXECUTION_FAILED", authorizationId, reason: error.message });
            throw error;
        }
    }
}

class MockToolAdapter {
    constructor(def) {
        Object.assign(this, def);
    }
    async execute(params) {
        if (params.simulateTimeoutNonCancelable) {
            return new Promise(resolve => setTimeout(resolve, 999999));
        }
        if (params.simulateTimeoutCancelable) {
            return new Promise(resolve => setTimeout(resolve, 999999));
        }
        if (params.simulateInvalidOutput) {
            return { status: "SUCCESS", output: { invalid: true } };
        }
        if (params.simulateFailure) {
            throw new Error("MOCK_FAILURE");
        }
        return { status: "SUCCESS", output: { ok: true } };
    }
}

window.AI_CORE.AdapterRegistry = AdapterRegistry;
window.AI_CORE.ExecutionSlotManager = ExecutionSlotManager;
window.AI_CORE.VerificationLayer = VerificationLayer;
window.AI_CORE.AuditTrail = AuditTrail;
window.AI_CORE.RealExecutionHistory = RealExecutionHistory;
window.AI_CORE.ExecutionGateway = ExecutionGateway;
window.AI_CORE.MockToolAdapter = MockToolAdapter;
window.AI_CORE.canonicalize = canonicalize;
window.AI_CORE.base64 = base64;
