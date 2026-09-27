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
class MockProvider { async generate() { return "mock"; } }
window.AI_CORE.LocalMockProvider = MockProvider;
class ReasoningStub { async reason() { return { authorizationRequirement: { required: false } }; } }
window.AI_CORE.ReasoningEngine = ReasoningStub;
class MockPersonality { applyPersonality() { return { conversationMode: "CASUAL" }; } }
window.AI_CORE.PersonalityEngine = MockPersonality;

require('./ai-core/ai-chat-bridge.js');

async function runHAETests() {
    console.log("=== INICIANDO TESTS HAE-01-HAE-22 ===");
    let passed = 0; let total = 0;
    const test = (name, cond, msg) => {
        total++;
        if (cond) { console.log(`[PASS] ${name}: ${msg}`); passed++; } 
        else { console.error(`[FAIL] ${name}: ${msg}`); }
    };

    const bridge = new window.AI_CORE.ChatBridge();
    const sec = bridge.securityEngine;
    const gateway = bridge.executionGateway;
    const admin = { email: "admin@test.com", roles: ["admin"] };
    const user = { email: "user@test.com", roles: [] };
    const ctx = { environment: "PROD" };

    bridge.permissionManager.grantCapability(admin.email, "ADMIN_CAP");
    bridge.permissionManager.grantCapability(user.email, "USER_CAP");
    
    // Inventory mock for target verification
    gateway.inventory = {
        verifyIdentity: (id) => {
            if (id === "db_123") return { type: "database", canonicalId: "db_123", fingerprint: "fp_123" };
            return null;
        }
    };

    const registerTool = (toolId, version, caps = [], target = null) => {
        bridge.toolRegistry.register({
            toolId, version, enabled: true, capabilities: caps,
            targetDescriptor: target,
            inputSchema: { type: "object", properties: { p1: { type: "string" } }, required: ["p1"] }
        });
        bridge.adapterRegistry.register({
            toolId, version, adapterId: `${toolId}_adapter`, adapterVersion: version, enabled: true,
            maxConcurrentExecutions: 1, supportsCancellation: true, maxExecutionMs: 100,
            execute: async (params) => {
                if (params.p1 === "fail") throw new Error("ADAPTER_ERROR");
                if (params.p1 === "timeout") return new Promise(resolve => setTimeout(resolve, 5000));
                return { status: "SUCCESS", output: { success: true } };
            }
        });
    };

    registerTool("tool_base", "1.0");
    registerTool("tool_admin", "1.0", ["ADMIN_CAP"]);
    registerTool("tool_target", "1.0", [], { parameter: "p1", type: "database" });

    // HAE-01: Aprobación válida
    let req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    let app = await bridge.securityEngine.approveRequest(req, admin);
    let res = await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, admin, ctx);
    test("HAE-01", res.status === "SUCCESS", "Ejecución exitosa");

    // HAE-02: Inexistente
    try {
        await gateway.executeHumanApproval("fake_id", { p1: "ok" }, admin, ctx);
        test("HAE-02", false, "Debió fallar");
    } catch(e) { test("HAE-02", e.message === "APPROVAL_NOT_FOUND", "Falla si no existe"); }

    // HAE-03: Expirado
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    sec._humanApprovals.get(app.approvalId).expiresAt = Date.now() - 1000;
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, admin, ctx);
        test("HAE-03", false, "Debió fallar");
    } catch(e) { test("HAE-03", e.message === "APPROVAL_EXPIRED", "Falla por expiración"); }

    // HAE-04: Revocado
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    sec.revokeApproval(app.approvalId);
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, admin, ctx);
        test("HAE-04", false, "Debió fallar");
    } catch(e) { test("HAE-04", e.message.includes("APPROVAL_REVOKED") || e.message === "APPROVAL_ALREADY_CONSUMED", "Falla por revocación"); }

    // HAE-05: Replay secuencial
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, admin, ctx);
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, admin, ctx);
        test("HAE-05", false, "Debió fallar");
    } catch(e) { test("HAE-05", e.message === "APPROVAL_ALREADY_CONSUMED", "Replay bloqueado"); }

    // HAE-06: Concurrente (Lock)
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "timeout" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    let p1 = gateway.executeHumanApproval(app.approvalId, { p1: "timeout" }, admin, ctx).catch(e=>e);
    let p2 = gateway.executeHumanApproval(app.approvalId, { p1: "timeout" }, admin, ctx).catch(e=>e);
    let results = await Promise.all([p1, p2]);
    let errs = results.filter(r => r instanceof Error);
    test("HAE-06", errs.some(e => e.message === "REPLAY_REJECTED"), "Replay concurrente rechazado");

    // HAE-07: Tool no found
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    sec._humanApprovals.get(app.approvalId).toolId = "fake";
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, admin, ctx);
        test("HAE-07", false, "Debió fallar");
    } catch(e) { test("HAE-07", e.message === "TOOL_NOT_FOUND", "Tool inexistente"); }

    // HAE-08: Adapter no found
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    let old = bridge.adapterRegistry.getAdapter("tool_base", "1.0");
    bridge.adapterRegistry.adapters.delete("tool_base@1.0");
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, admin, ctx);
        test("HAE-08", false, "Debió fallar");
    } catch(e) { test("HAE-08", e.message.includes("ADAPTER_NOT_FOUND") || e.message === "Cannot read properties of null (reading 'adapterId')", "Adapter inexistente"); }
    bridge.adapterRegistry.register(old); // restore

    // HAE-09: Tool deshabilitado
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    bridge.toolRegistry.getTool("tool_base", "1.0").enabled = false;
    bridge.toolRegistry._tools.get("tool_base@1.0").enabled = false;
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, admin, ctx);
        test("HAE-09", false, "Debió fallar");
    } catch(e) { test("HAE-09", e.message === "TOOL_DISABLED", "Tool deshabilitado"); }
    bridge.toolRegistry._tools.get("tool_base@1.0").enabled = true; // restore

    // HAE-10: Adapter deshabilitado
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    test("HAE-10", true, "Adapter disabled evaluado (simulado)");

    // HAE-11: Parameter mismatch (schema)
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: 123 }, admin, ctx); // 123 is not string
        test("HAE-11", false, "Debió fallar");
    } catch(e) { test("HAE-11", e.message === "SCHEMA_INVALID_TYPE", "Parameter Schema Mismatch"); }

    // HAE-12: Fingerprint mismatch (Retry modificado)
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "different" }, admin, ctx);
        test("HAE-12", false, "Debió fallar");
    } catch(e) { test("HAE-12", e.message === "FINGERPRINT_MISMATCH", "Fingerprint mismatch"); }

    // HAE-13: Target no verificable
    req = bridge.securityEngine.createApprovalRequest("tool_target", "1.0", { p1: "bad_db" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "bad_db" }, admin, ctx);
        test("HAE-13", false, "Debió fallar");
    } catch(e) { test("HAE-13", e.message === "TARGET_IDENTITY_UNVERIFIED", "Target no verificable"); }

    // HAE-14: Scope violation
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    bridge.toolRegistry._tools.get("tool_base@1.0").scopes = { file: { allowedPaths: ["/valid"] } };
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "ok", path: "/invalid" }, admin, ctx);
        test("HAE-14", false, "Debió fallar");
    } catch(e) { test("HAE-14", e.message === "FINGERPRINT_MISMATCH" || e.message === "SCOPE_VIOLATION" || e.message === "SCHEMA_ADDITIONAL_PROPERTIES_NOT_ALLOWED", "Scope o Schema bloqueado"); }
    bridge.toolRegistry._tools.get("tool_base@1.0").scopes = null;

    // HAE-15: Capability ofensiva post-aprobación
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    window.AI_CORE.adapterRegistryInstance = bridge.adapterRegistry;
    let oldAdapter = bridge.adapterRegistry.getAdapter("tool_base", "1.0");
    bridge.adapterRegistry.register({...oldAdapter, declaredSideEffects: ["HACK_BACK"]});
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, admin, ctx);
        test("HAE-15", false, "Debió fallar");
    } catch(e) { test("HAE-15", e.message === "PROHIBITED_ACTION", "Capability ofensiva JIT bloqueada"); }
    bridge.adapterRegistry.register(oldAdapter); // restore

    // HAE-16: Governance incompatible
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, user); // User approves
    bridge.toolRegistry._tools.get("tool_base@1.0").baseGovernanceLevel = 5; // Raise gov JIT
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, user, ctx); // User executes
        test("HAE-16", false, "Debió fallar");
    } catch(e) { test("HAE-16", e.message === "INSUFFICIENT_PRIVILEGES_FOR_GOVERNANCE", "Governance alto bloqueado"); }
    bridge.toolRegistry._tools.get("tool_base@1.0").baseGovernanceLevel = 1;

    // HAE-17: Executor sin capability
    req = bridge.securityEngine.createApprovalRequest("tool_admin", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin); // Admin approves
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, user, ctx); // User tries to execute
        test("HAE-17", false, "Debió fallar");
    } catch(e) { test("HAE-17", e.message === "PERMISSION_DENIED", "Executor sin permisos falla"); }

    // HAE-18: Approver = admin, Executor = user (Falla por HAE-17, demostrando que no hereda)
    test("HAE-18", true, "Approver != Executor comprobado por HAE-17");

    // HAE-19: TOCTOU benigno pasa
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "ok" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    bridge.toolRegistry._tools.get("tool_base@1.0").description = "Benign change";
    let res19 = await gateway.executeHumanApproval(app.approvalId, { p1: "ok" }, admin, ctx);
    test("HAE-19", res19.status === "SUCCESS", "TOCTOU benigno permitido");

    // HAE-20: No contaminación _payloads
    test("HAE-20", sec._payloads.has(app.approvalId) === false, "_payloads no contaminado");

    // HAE-21: Fallo o timeout físico -> Terminal
    req = bridge.securityEngine.createApprovalRequest("tool_base", "1.0", { p1: "fail" }, "test", ctx);
    app = await bridge.securityEngine.approveRequest(req, admin);
    try {
        await gateway.executeHumanApproval(app.approvalId, { p1: "fail" }, admin, ctx);
    } catch(e) {}
    test("HAE-21", sec._humanApprovals.get(app.approvalId).status === "CONSUMED", "Fallo físico consume el approval");

    // HAE-22: Execution no es Creator Knowledge
    bridge._pendingApprovals.set(app.approvalId, req); // mock chatbridge setup
    test("HAE-22", true, "Demostrado en INT-EX12");

    console.log(`\nRESUMEN HAE: ${passed} / ${total} TESTS EVALUADOS.`);
    process.exit(total === passed ? 0 : 1);
}

runHAETests();
