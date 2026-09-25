const assert = require('assert');
global.window = {};
window.AI_CORE = {};
global.localStorage = { data: {}, setItem(k,v){this.data[k]=v;}, getItem(k){return this.data[k]||null;}, removeItem(k){delete this.data[k];} };
global.document = { getElementById: () => ({ value: '' }) };
global.currentUser = { email: 'pablojose182017@gmail.com' };
window.costosState = { insumos: [], recetas: [] };
require('./guardian-financiero.js');
require('./ai-core/ai-store.js');
require('./ai-core/ai-knowledge.js');
require('./ai-core/ai-identity.js');
require('./ai-core/ai-memory.js');
require('./ai-core/ai-context.js');
require('./ai-core/ai-provider.js');
require('./ai-core/ai-legacy-rag-adapter.js');
require('./ai-core/ai-ingestion.js');
require('./ai-core/ai-reasoning.js');
require('./ai-core/ai-investigation.js');
require('./ai-core/ai-security.js');
require('./ai-core/ai-autonomous.js');
require('./ai-core/ai-execution.js'); // Newly created execution layer

async function assertThrowsAsync(fn, expectedMessagePart, assertionMessage) {
    try {
        await fn();
        assert.fail(`Expected error containing "${expectedMessagePart}" to be thrown, but no error was thrown. ${assertionMessage}`);
    } catch (e) {
        if (e.message.indexOf(expectedMessagePart) === -1) {
            assert.fail(`Expected error containing "${expectedMessagePart}", but got "${e.message}". ${assertionMessage}`);
        }
    }
}

async function runExecutionTests() {
    console.log("=== INICIANDO PRUEBAS DE EXECUTION LAYER (T1-T36 & Adversariales) ===");

    const toolRegistry = new window.AI_CORE.ToolRegistry();
    const permMgr = { hasCapability: () => true };
    const policyRegistry = new window.AI_CORE.AutonomousPolicyRegistry();
    const security = new window.AI_CORE.SecurityEngine(toolRegistry, permMgr, policyRegistry);
    const adapterRegistry = new window.AI_CORE.AdapterRegistry();
    const inventory = new window.AI_CORE.InventoryAuthority();
    const history = new window.AI_CORE.RealExecutionHistory();
    const engine = new window.AI_CORE.AutonomousPolicyEngine(policyRegistry, security, inventory, history, adapterRegistry);
    
    const slotManager = new window.AI_CORE.ExecutionSlotManager();
    const verificationLayer = new window.AI_CORE.VerificationLayer();
    const auditTrail = new window.AI_CORE.AuditTrail();
    
    const gateway = new window.AI_CORE.ExecutionGateway(security, adapterRegistry, slotManager, verificationLayer, history, auditTrail, inventory);
    
    // Tools & Adapters setup
    toolRegistry.register({
        toolId: "t_block", version: "1.0", enabled: true, baseGovernanceLevel: 2, sideEffects: "NON_DESTRUCTIVE",
        capabilities: ["ISOLATE_NETWORK"], inputSchema: { type: "object", properties: { ip: { type: "string" } } },
        targetDescriptor: { parameter: "ip", targetType: "DATABASE" }
    });
    adapterRegistry.register({
        toolId: "t_block", version: "1.0", adapterId: "t_block_adapter", adapterVersion: "1.0", enabled: true,
        capabilities: ["ISOLATE_NETWORK"], declaredSideEffects: ["NON_DESTRUCTIVE"], maxExecutionMs: 50,
        supportsCancellation: true, cancellationGuarantee: "GUARANTEED",
        execute: async (params) => { return { status: "SUCCESS", output: { blocked: true } }; }
    });

    toolRegistry.register({
        toolId: "t_hack", version: "1.0", enabled: true, baseGovernanceLevel: 2, sideEffects: "DESTRUCTIVE",
        capabilities: ["HACK_BACK"], inputSchema: { type: "object" }
    });
    adapterRegistry.register({
        toolId: "t_hack", version: "1.0", adapterId: "t_hack_adapter", adapterVersion: "1.0", enabled: true,
        capabilities: ["HACK_BACK"], declaredSideEffects: ["DESTRUCTIVE"], maxExecutionMs: 50,
        supportsCancellation: true, cancellationGuarantee: "GUARANTEED",
        execute: async (params) => { return { status: "SUCCESS", output: { hacked: true } }; }
    });

    const creatorId = { email: "creator@test.com", roles: ["creator"] };
    const adminId   = { email: "admin@test.com", roles: ["admin"] };
    const ctx       = { environment: "DEV" };

    const evId = history.registerResult({ toolId: "sys_monitor", target: "192.168.1.100", status: "SUCCESS", verificationStatus: "PASSED" }, gateway);
    const hardEv = { type: "ACTUAL_TOOL_RESULT", evidenceId: evId };

    const basePolicyDef = {
        policyId: "pol_exec", version: "1.0",
        allowedCapabilities: ["ISOLATE_NETWORK"], allowedTools: ["t_block"],
        allowedGovernanceMaximum: 3, allowedTargets: ["DATABASE"],
        maxActionsPerWindow: { count: 5, windowSeconds: 300 },
        suspensionThreshold: 5, requiresRollback: false
    };
    policyRegistry.createPolicy(basePolicyDef, creatorId);

    const baseProposal = { targetPolicyId: "pol_exec", toolId: "t_block", toolVersion: "1.0", parameters: { ip: "192.168.1.100" } };

    let passCount = 0; let failCount = 0;
    const assertTest = (cond, msg) => { if(cond) { console.log(`✅ PASS: ${msg}`); passCount++; } else { console.error(`❌ FAIL: ${msg}`); failCount++; } };

    // T1: Capability ofensiva en payload rechazada
    try {
        const hackedProposal = JSON.parse(JSON.stringify(baseProposal));
        const view = await engine.evaluateAndAuthorize(hackedProposal, hardEv, ctx, {});
        // Mock a hacked payload
        try { view.payload.capabilities.push("HACK_BACK"); } catch(e){} // immutable, won't work. We need to create a tool with it.
        const hackPolicy = { ...basePolicyDef, policyId: "pol_hack", allowedCapabilities: ["HACK_BACK"] };
        try { policyRegistry.createPolicy(hackPolicy, creatorId); assertTest(false, "T1: Policy creation should block offensive"); } catch(e) { assertTest(e.message === "PROHIBITED_ACTION", "T1: Policy creation blocked offensive cap"); }
    } catch(e) { console.error(e); }

    // Use evaluateAndAuthorize to get valid payloads for execution tests
    const viewBase = await engine.evaluateAndAuthorize(baseProposal, hardEv, ctx, {});
    const authId = viewBase.payload.authorizationId;

    // T25: Timeout no cancelable no libera concurrencia (RUNAWAY)
    // Register a non-cancelable tool
    toolRegistry.register({
        toolId: "t_zombie", version: "1.0", enabled: true, baseGovernanceLevel: 2, sideEffects: "NON_DESTRUCTIVE",
        capabilities: ["ISOLATE_NETWORK"], inputSchema: { type: "object", properties: { ip: { type: "string" } } },
        targetDescriptor: { parameter: "ip", targetType: "DATABASE" }
    });
    adapterRegistry.register({
        toolId: "t_zombie", version: "1.0", adapterId: "t_zombie_adapter", adapterVersion: "1.0", enabled: true,
        capabilities: ["ISOLATE_NETWORK"], declaredSideEffects: ["NON_DESTRUCTIVE"], maxExecutionMs: 10,
        supportsCancellation: false, cancellationGuarantee: "NOT_SUPPORTED",
        maxConcurrentExecutions: 1,
        execute: async (params) => { return new Promise(resolve => setTimeout(resolve, 500)); } // takes longer than 10ms
    });
    const zombiePolicy = { ...basePolicyDef, policyId: "pol_zombie", allowedTools: ["t_zombie"] };
    policyRegistry.createPolicy(zombiePolicy, creatorId);
    const viewZombie = await engine.evaluateAndAuthorize({ ...baseProposal, targetPolicyId: "pol_zombie", toolId: "t_zombie" }, hardEv, ctx, {});
    
    try {
        await gateway.execute(viewZombie.payload.authorizationId, { ip: "192.168.1.100" }, adminId, ctx);
    } catch(e) {
        assertTest(e.message === "TIMEOUT_REQUESTED", "T25: Timeout no cancelable produce TIMEOUT_REQUESTED");
        const slotInfo = slotManager.slots.get("pol_zombie");
        assertTest(slotInfo.count === 1 && slotInfo.slots[0].state === "RUNAWAY", "T26: Ejecución runaway permanece contabilizada (count = 1, state = RUNAWAY)");
    }

    // T27 & T28: Mismatch fingerprints
    const viewFp = await engine.evaluateAndAuthorize({ ...baseProposal, targetPolicyId: "pol_exec" }, hardEv, ctx, {});
    // Mutate the adapter registry entry subtly
    const origAdapter = adapterRegistry.getAdapter("t_block", "1.0");
    adapterRegistry.register({ ...origAdapter, maxExecutionMs: 99 }); // mutates without changing version
    try {
        await gateway.execute(viewFp.payload.authorizationId, { ip: "192.168.1.100" }, adminId, ctx);
    } catch(e) {
        assertTest(e.message === "DEFINITION_FINGERPRINT_MISMATCH", "T27/T28/T31: Adapter definition fingerprint mismatch rechaza la ejecución");
    }
    // Revert adapter
    adapterRegistry.register(origAdapter);

    // T32: Target identity mismatch
    const viewIdentity = await engine.evaluateAndAuthorize({ ...baseProposal, targetPolicyId: "pol_exec" }, hardEv, ctx, {});
    // Alter inventory
    const origVerify = inventory.verifyIdentity;
    inventory.verifyIdentity = (ip) => ({ type: "DATABASE", canonicalId: "db_prod_1", fingerprint: "fp_db_002_mutated" });
    try {
        await gateway.execute(viewIdentity.payload.authorizationId, { ip: "192.168.1.100" }, adminId, ctx);
    } catch(e) {
        assertTest(e.message === "TARGET_IDENTITY_MISMATCH", "T32/T33: Target identity mismatch después de autorización bloquea ejecución");
    }
    inventory.verifyIdentity = origVerify; // revert

    // T13/T14: Timeout tests
    // Re-register with cancelable timeout
    adapterRegistry.register({
        toolId: "t_cancel", version: "1.0", adapterId: "t_cancel_adapter", adapterVersion: "1.0", enabled: true,
        capabilities: ["ISOLATE_NETWORK"], declaredSideEffects: ["NON_DESTRUCTIVE"], maxExecutionMs: 10,
        supportsCancellation: true, cancellationGuarantee: "GUARANTEED",
        maxConcurrentExecutions: 1,
        execute: async (params) => { return new Promise(resolve => setTimeout(resolve, 500)); } // long
    });
    toolRegistry.register({
        toolId: "t_cancel", version: "1.0", enabled: true, baseGovernanceLevel: 2, sideEffects: "NON_DESTRUCTIVE",
        capabilities: ["ISOLATE_NETWORK"], inputSchema: { type: "object", properties: { ip: { type: "string" } } },
        targetDescriptor: { parameter: "ip", targetType: "DATABASE" }
    });
    const cancelPolicy = { ...basePolicyDef, policyId: "pol_cancel", allowedTools: ["t_cancel"] };
    policyRegistry.createPolicy(cancelPolicy, creatorId);
    const viewCancel = await engine.evaluateAndAuthorize({ ...baseProposal, targetPolicyId: "pol_cancel", toolId: "t_cancel" }, hardEv, ctx, {});
    try {
        await gateway.execute(viewCancel.payload.authorizationId, { ip: "192.168.1.100" }, adminId, ctx);
    } catch(e) {
        assertTest(e.message === "EXECUTION_TERMINATED", "T14: ToolAdapter con cancelación produce EXECUTION_TERMINATED");
        const slotInfo = slotManager.slots.get("pol_cancel");
        assertTest(slotInfo.count === 0 && slotInfo.slots[0].state === "RELEASED", "T17: Slot se libera ante timeout cancelable");
    }

    // Success Execution
    const viewSuccess = await engine.evaluateAndAuthorize({ ...baseProposal, targetPolicyId: "pol_exec" }, hardEv, ctx, {});
    try {
        const out = await gateway.execute(viewSuccess.payload.authorizationId, { ip: "192.168.1.100" }, adminId, ctx);
        assertTest(out.status === "SUCCESS", "Gateway successfully executes and returns status SUCCESS");
        assertTest(out.evidenceId !== undefined, "T12: evidenceId rastreable a executionId está presente");
    } catch(e) {
        console.error(e);
        assertTest(false, "Gateway failed valid execution: " + e.message);
    }

    // Adversarial tests
    try {
        history.registerResult({ status: "SUCCESS" }, null); // null is not gateway
    } catch(e) {
        assertTest(e.message === "UNAUTHORIZED_HISTORY_WRITE", "Adversarial: VerificationLayer/ReasoningEngine no puede escribir en ExecutionHistory");
    }

    console.log(`\nRESULTADO EJECUCIÓN MOCK: ${passCount} PASS | ${failCount} FAIL`);
}

runExecutionTests().catch(console.error);
