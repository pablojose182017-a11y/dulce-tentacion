window.AI_CORE = window.AI_CORE || {};

class ControlledExecutionManager {
    constructor() {
    }
    
    validateTarget(target) {
        if (!target) return false;
        if (typeof target !== 'string') return false;
        
        // Reject real targets
        if (/^[a-zA-Z]:\\/.test(target)) return false; // Windows paths like C:\...
        if (/^\//.test(target)) return false; // Unix paths like /etc/...
        if (target.toLowerCase().includes("powershell")) return false;
        if (target.toLowerCase().includes("cmd.exe")) return false;
        if (target.toLowerCase().includes("bash")) return false;
        if (target.toLowerCase().includes("sh")) return false;

        // Must be explicit synthetic target for development phase
        if (!target.startsWith("synthetic://")) return false;
        
        return true;
    }
}

class MockDefensiveAdapter {
    constructor(manager) {
        this.manager = manager;
        this.toolId = "MOCK_DEFENSIVE_TOOL";
        this.version = "1.0";
        this.adapterId = "mock_defensive_1";
        this.adapterVersion = "1.0";
        this.capabilities = new Set(["QUARANTINE_ARTIFACT", "ISOLATE_ASSET", "BLOCK_INDICATOR", "COLLECT_EVIDENCE", "RESTORE_KNOWN_GOOD"]);
        this.declaredSideEffects = ["STATE_MODIFICATION"];
        this.maxExecutionMs = 5000;
        this.supportsCancellation = true;
        this.enabled = true;
    }
    
    async execute(params) {
        if (!params || !params.target) throw new Error("MISSING_TARGET");
        if (!this.manager.validateTarget(params.target)) {
            throw new Error("INVALID_REAL_SYSTEM_TARGET_REJECTED");
        }
        
        // Produce deterministic execution result
        const evidenceId = `ev_syn_${Date.now()}_${Math.random()}`;
        return {
            status: "SUCCESS",
            mechanicalEvidence: {
                operationId: params.globalOperationId || "none"
            },
            output: {
                success: true,
                evidenceId,
                target: params.target,
                actionCompleted: true,
                syntheticState: "MODIFIED"
            }
        };
    }
}

window.AI_CORE.ControlledExecutionManager = ControlledExecutionManager;
window.AI_CORE.MockDefensiveAdapter = MockDefensiveAdapter;
