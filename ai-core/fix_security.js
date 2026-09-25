const fs = require('fs');

let index = fs.readFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/index.html', 'utf8');
if (!index.includes('ai-security.js')) {
    index = index.replace('<script src="ai-core/ai-investigation.js"></script>', '<script src="ai-core/ai-investigation.js"></script>\n    <script src="ai-core/ai-security.js"></script>');
    fs.writeFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/index.html', index);
    console.log('Added ai-security.js to index.html');
}

let tests = fs.readFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-tests.js', 'utf8');

tests = tests.replace(/\/\/ ======= SECURITY ENGINE TESTS =======[\s\S]*/g, '');

tests += `\n
// ======= SECURITY ENGINE TESTS =======
window.runSecurityTests = async function() {
    console.log("\\n=== INICIANDO PRUEBAS AISLADAS: SecurityEngine & ToolRegistry ===");
    let passed = 0; let failed = 0;
    const assert = (condition, msg) => {
        if (condition) { console.log("✅ PASS: " + msg); passed++; }
        else { console.error("❌ FAIL: " + msg); failed++; }
    };

    const registry = new window.AI_CORE.ToolRegistry();
    const security = new window.AI_CORE.SecurityEngine(registry, null);

    // Register test tools
    registry.register({
        toolId: "sys_ping", version: "1.0", enabled: true,
        baseGovernanceLevel: 1, sideEffects: "NON_DESTRUCTIVE",
        scopes: { network: { allowedHosts: ["192.168.1.*"] } }
    });

    registry.register({
        toolId: "sys_rm", version: "1.0", enabled: true,
        baseGovernanceLevel: 4, sideEffects: "DESTRUCTIVE",
        scopes: { file: { allowedPaths: ["/tmp/"] } }
    });

    registry.register({
        toolId: "sys_disabled", version: "1.0", enabled: false
    });

    const standardUser = { email: "user@test.com", roles: ["user"] };
    const adminUser = { email: "admin@test.com", roles: ["admin"] };
    const devContext = { environment: "DEV" };
    const prodContext = { environment: "PROD" };

    try {
        // 1 & 2. Fail closed on unregistered/disabled
        let errCount = 0;
        try { security.createApprovalRequest("sys_fake", "1.0", {}, "Test", devContext); } catch(e) { if(e.message === "TOOL_NOT_FOUND") errCount++; }
        try { security.createApprovalRequest("sys_disabled", "1.0", {}, "Test", devContext); } catch(e) { if(e.message === "TOOL_DISABLED") errCount++; }
        assert(errCount === 2, "test_fail_closed_on_unregistered_and_disabled_tool");

        // 3. Scope violation (Network) rejected at TOCTOU validation
        const reqPing = security.createApprovalRequest("sys_ping", "1.0", { host: "8.8.8.8" }, "Test ping", devContext);
        const appPing = await security.approveRequest(reqPing, adminUser);
        try {
            await security.validateForExecution(appPing.approvalId, { host: "8.8.8.8" }, devContext, adminUser);
            assert(false, "Network Scope Violation was permitted");
        } catch(e) {
            assert(e.message === "SCOPE_VIOLATION", "test_parameter_violating_network_scope_is_rejected_before_approval");
        }

        // 4. Parameter Canonicalization & Fingerprint ignores key order
        const p1 = { a: 1, b: 2 };
        const p2 = { b: 2, a: 1 };
        const hash1 = await security.generateFingerprint(p1);
        const hash2 = await security.generateFingerprint(p2);
        assert(hash1 === hash2, "test_parameter_canonicalization_ignores_key_order");

        // 5 & 6. Fingerprint mismatch & TOCTOU (Tampering)
        const reqValid = security.createApprovalRequest("sys_ping", "1.0", { host: "192.168.1.10" }, "Valid ping", devContext);
        const appValid = await security.approveRequest(reqValid, adminUser);
        
        try {
            await security.validateForExecution(appValid.approvalId, { host: "192.168.1.20" }, devContext, adminUser);
            assert(false, "Tampering allowed");
        } catch(e) {
            assert(e.message === "PARAMETER_MISMATCH", "test_fingerprint_mismatch_blocks_execution_toctou");
        }

        // 7. Replay Protection (One-Shot)
        const resValid = await security.validateForExecution(appValid.approvalId, { host: "192.168.1.10" }, devContext, adminUser);
        assert(resValid.validationStatus === "PASS", "Valid execution passed");
        try {
            await security.validateForExecution(appValid.approvalId, { host: "192.168.1.10" }, devContext, adminUser);
            assert(false, "Replay allowed");
        } catch(e) {
            assert(e.message === "APPROVAL_ALREADY_CONSUMED", "test_one_shot_approval_cannot_be_replayed");
        }

        // 8. Governance escalation
        const reqProd = security.createApprovalRequest("sys_rm", "1.0", { path: "/tmp/file" }, "Rm prod", prodContext);
        assert(reqProd.effectiveGovernanceCalculated === 5, "test_effective_governance_escalates_on_critical_parameters");

        // 9. Standard user denied execution of destructive
        const appProd = await security.approveRequest(reqProd, adminUser);
        try {
            await security.validateForExecution(appProd.approvalId, { path: "/tmp/file" }, prodContext, standardUser);
            assert(false, "Standard user executed destructive");
        } catch(e) {
            assert(e.message === "PERMISSION_DENIED" || e.message === "INSUFFICIENT_PRIVILEGES_FOR_GOVERNANCE", "test_standard_user_denied_execution_of_mutating_capability");
        }

        // 10. Approval revocation TOCTOU
        const reqRev = security.createApprovalRequest("sys_ping", "1.0", { host: "192.168.1.10" }, "Revoke test", devContext);
        const appRev = await security.approveRequest(reqRev, adminUser);
        security.revokeApproval(appRev.approvalId);
        try {
            await security.validateForExecution(appRev.approvalId, { host: "192.168.1.10" }, devContext, adminUser);
            assert(false, "Revoked executed");
        } catch(e) {
            assert(e.message === "APPROVAL_REVOKED", "test_approval_revocation_blocks_execution_toctou");
        }

        // 11. Approval request is not executable directly
        assert(reqValid.parameterFingerprint === undefined && reqValid.status === "PENDING_APPROVAL", "test_approval_request_is_not_executable");
        
    } catch (e) {
        console.error(e);
        assert(false, "Unhandled exception in security tests");
    }

    console.log(\`RESULTADO SECURITY: \${passed} PASS | \${failed} FAIL\`);
};
`;

fs.writeFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-tests.js', tests);
console.log("Successfully appended security tests.");
