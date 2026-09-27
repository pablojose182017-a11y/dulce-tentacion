const assert = require('assert');

global.window = {};
window.AI_CORE = {};
global.localStorage = { data: {}, setItem(k,v){this.data[k]=v;}, getItem(k){return this.data[k]||null;}, removeItem(k){delete this.data[k];} };

require('./ai-core/ai-store.js');
require('./ai-core/ai-knowledge.js');
require('./ai-core/ai-identity.js');
require('./ai-core/ai-context.js');
require('./ai-core/ai-memory.js');
require('./ai-core/ai-security.js');
require('./ai-core/ai-execution.js');

async function runRemediationTests() {
    console.log("=== INICIANDO TESTS REMEDIATION V1.1 ===");
    let passed = 0; let total = 0;
    const test = (name, cond, msg) => {
        total++;
        if (cond) { console.log(`[PASS] ${name}: ${msg}`); passed++; } 
        else { console.error(`[FAIL] ${name}: ${msg}`); }
    };

    const sec = new window.AI_CORE.SecurityEngine(new window.AI_CORE.ToolRegistry(), new window.AI_CORE.PermissionManager());
    const adapters = new window.AI_CORE.AdapterRegistry();
    const slots = new window.AI_CORE.ExecutionSlotManager();
    const audit = new window.AI_CORE.AuditTrail();
    const history = new window.AI_CORE.RealExecutionHistory();

    // REM-01: InventoryAuthority Fail-Closed on null
    try {
        new window.AI_CORE.ExecutionGateway(sec, adapters, slots, new window.AI_CORE.VerificationLayer(), history, audit, null);
        test("REM-01", false, "Debió fallar sin InventoryAuthority");
    } catch(e) { test("REM-01", e.message === "INVENTORY_AUTHORITY_REQUIRED", "Gateway rechaza null authority"); }

    const invAuth = {
        verifyIdentity: (id) => {
            if (id === "valid") return { type: "db", canonicalId: "valid", fingerprint: null };
            return null;
        }
    };
    
    const gateway = new window.AI_CORE.ExecutionGateway(sec, adapters, slots, new window.AI_CORE.VerificationLayer(), history, audit, invAuth);
    
    // Setup valid tool and adapter
    const admin = { email: "admin@test.com", roles: ["admin"] };
    const ctx = { environment: "PROD" };
    sec.registry.register({
        toolId: "test_tool", version: "1.0", enabled: true,
        targetDescriptor: { parameter: "target", type: "db" },
        inputSchema: { type: "object", properties: { target: { type: "string" }, action: { type: "string" } }, required: ["target"] }
    });
    
    let currentExecuteFunc = async (params) => { return { status: "SUCCESS", output: { success: true } }; };
    adapters.register({
        toolId: "test_tool", version: "1.0", adapterId: "test_adapter", adapterVersion: "1.0", enabled: true,
        maxConcurrentExecutions: 1, supportsCancellation: true, maxExecutionMs: 50,
        execute: async (params) => currentExecuteFunc(params)
    });
    
    // Target validity checks
    // REM-02: Target válido
    let req = sec.createApprovalRequest("test_tool", "1.0", { target: "valid" }, "test", ctx);
    let app = await sec.approveRequest(req, admin);
    let res = await gateway.executeHumanApproval(app.approvalId, { target: "valid" }, admin, ctx);
    test("REM-02", res.status === "SUCCESS", "Ejecución con target válido");
    
    // REM-03: Target inválido
    req = sec.createApprovalRequest("test_tool", "1.0", { target: "invalid" }, "test", ctx);
    app = await sec.approveRequest(req, admin);
    try {
        await gateway.executeHumanApproval(app.approvalId, { target: "invalid" }, admin, ctx);
        test("REM-03", false, "Debió fallar con target inválido");
    } catch(e) { test("REM-03", e.message === "TARGET_IDENTITY_UNVERIFIED", "Falla con target inválido"); }

    // REM-04: AuditTrail estructural completo y PII
    let auditLog = audit.entries.find(e => e.action === "EXECUTION_COMPLETED");
    test("REM-04", 
        auditLog && auditLog.globalOperationId && auditLog.parameterFingerprint && !auditLog.parameters &&
        auditLog.targetType === "db" && auditLog.targetCanonicalId === "valid", 
        "AuditTrail completo y estructurado");

    // RUNAWAY y SlotManager
    // REM-05: Timeout Cancelable -> Release
    currentExecuteFunc = async (params) => new Promise(resolve => setTimeout(resolve, 5000));
    req = sec.createApprovalRequest("test_tool", "1.0", { target: "valid" }, "test", ctx);
    app = await sec.approveRequest(req, admin);
    try {
        await gateway.executeHumanApproval(app.approvalId, { target: "valid" }, admin, ctx);
    } catch(e) { test("REM-05", e.message === "EXECUTION_TERMINATED", "Cancelado físicamente"); }
    test("REM-05-Slot", slots.slots.get("HUMAN_APPROVAL_GLOBAL_POOL").count === 0, "Slot liberado");

    // REM-06: Timeout No Cancelable -> RUNAWAY -> Quarantine if no evidence
    adapters.adapters.get("test_tool@1.0").supportsCancellation = false;
    let lateResolveCallback;
    currentExecuteFunc = async (params) => new Promise(resolve => { lateResolveCallback = resolve; });
    req = sec.createApprovalRequest("test_tool", "1.0", { target: "valid" }, "test", ctx);
    app = await sec.approveRequest(req, admin);
    try {
        await gateway.executeHumanApproval(app.approvalId, { target: "valid" }, admin, ctx);
    } catch(e) { test("REM-06", e.message === "TIMEOUT_REQUESTED", "Expiró y entró en RUNAWAY"); }
    
    let currentSlotInfo = slots.slots.get("HUMAN_APPROVAL_GLOBAL_POOL");
    test("REM-06-Slot", currentSlotInfo.count === 1 && currentSlotInfo.slots[currentSlotInfo.slots.length-1].state === "RUNAWAY", "Slot entra en RUNAWAY y retiene ocupación");
    
    // Resolve late WITHOUT mechanical evidence (quarantine)
    lateResolveCallback({ status: "SUCCESS", output: { success: true } });
    await new Promise(r => setTimeout(r, 10)); // wait for promise microtasks
    test("REM-06-Quarantine", currentSlotInfo.slots[currentSlotInfo.slots.length-1].state === "QUARANTINED" && currentSlotInfo.count === 1, "Slot pasa a QUARANTINED por falta de evidencia");

    // REM-07: Late resolution with evidence -> Release
    adapters.adapters.get("test_tool@1.0").maxConcurrentExecutions = 2; // Increase to allow another run since 1 is quarantined
    currentExecuteFunc = async (params) => new Promise(resolve => { lateResolveCallback = resolve; });
    req = sec.createApprovalRequest("test_tool", "1.0", { target: "valid" }, "test", ctx);
    app = await sec.approveRequest(req, admin);
    
    // We capture the globalOperationId from the audit trail to simulate the adapter returning it
    let capturedOpId;
    let originalAuditAppend = audit.append.bind(audit);
    audit.append = (e) => { if(e.action === "EXECUTION_STARTED") capturedOpId = e.globalOperationId; originalAuditAppend(e); };
    
    try {
        await gateway.executeHumanApproval(app.approvalId, { target: "valid" }, admin, ctx);
    } catch(e) { test("REM-07-Timeout", e.message === "TIMEOUT_REQUESTED", "Expiró y entró en RUNAWAY"); }
    
    // Resolve late WITH mechanical evidence
    lateResolveCallback({ status: "SUCCESS", output: { success: true }, mechanicalEvidence: { operationId: capturedOpId } });
    await new Promise(r => setTimeout(r, 10)); // wait for microtasks
    
    test("REM-07", currentSlotInfo.slots[currentSlotInfo.slots.length-1].state === "RELEASED" && currentSlotInfo.count === 1 /* from the quarantined one */, "Slot liberado mediante evidencia mecánica");

    console.log(`\nRESUMEN REMEDIATION: ${passed} / ${total} TESTS EVALUADOS.`);
    process.exit(total === passed ? 0 : 1);
}

runRemediationTests();
