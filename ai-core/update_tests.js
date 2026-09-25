const fs = require('fs');

let tests = fs.readFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-tests.js', 'utf8');

tests = tests.replace(/\/\/ ======= SECURITY ENGINE TESTS =======[\s\S]*/g, '');

tests += `
// ======= SECURITY ENGINE TESTS =======
window.runSecurityTests = async function() {
    console.log("\\n=== INICIANDO PRUEBAS AISLADAS: SecurityEngine V2 ===");
    let passed = 0; let failed = 0;
    const assert = (condition, msg) => {
        if (condition) { console.log("✅ PASS: " + msg); passed++; }
        else { console.error("❌ FAIL: " + msg); failed++; }
    };

    const registry = new window.AI_CORE.ToolRegistry();
    const permissionManager = {
        hasCapability: (identity, cap) => {
            if (identity.roles.includes("admin")) return true;
            if (identity.roles.includes("user") && cap === "READ_ONLY_CAP") return true;
            return false;
        }
    };
    const security = new window.AI_CORE.SecurityEngine(registry, permissionManager);

    registry.register({
        toolId: "sys_file", version: "1.0", enabled: true,
        baseGovernanceLevel: 1, sideEffects: "READ_ONLY", capabilities: ["READ_ONLY_CAP"],
        scopes: { file: { allowedPaths: ["/allowed/path/"] } },
        inputSchema: { type: "object", properties: { path: { type: "string" }, flag: { type: "boolean", default: false } }, required: ["path"] }
    });

    registry.register({
        toolId: "sys_net", version: "1.0", enabled: true,
        baseGovernanceLevel: 1, sideEffects: "NON_DESTRUCTIVE", capabilities: ["NETWORK_CAP"],
        scopes: { network: { allowedHosts: ["192.168.1.*"], allowedPorts: [80, 443], allowedProtocols: ["HTTP", "HTTPS"] } },
        inputSchema: { type: "object", properties: { host: { type: "string" }, port: { type: "number" }, protocol: { type: "string" } }, required: ["host"] }
    });
    
    registry.register({
        toolId: "sys_proc", version: "1.0", enabled: true,
        baseGovernanceLevel: 1, sideEffects: "NON_DESTRUCTIVE", capabilities: ["PROC_CAP"],
        scopes: { process: { allowedExecutables: ["ping"], allowedArguments: ["-c", "4"] } },
        inputSchema: { type: "object", properties: { executable: { type: "string" }, args: { type: "array" } } }
    });

    registry.register({
        toolId: "sys_dummy", version: "1.0", enabled: true,
        baseGovernanceLevel: 1, sideEffects: "READ_ONLY", capabilities: [],
        inputSchema: { type: "object", properties: { data: { type: "object" } } }
    });

    const standardUser = { email: "user@test.com", roles: ["user"] };
    const adminUser = { email: "admin@test.com", roles: ["admin"] };
    const devContext = { environment: "DEV" };

    try {
        const toolRef = registry.getTool("sys_file", "1.0");
        toolRef.enabled = false;
        const toolRef2 = registry.getTool("sys_file", "1.0");
        assert(toolRef2.enabled === true, "test_tool_definition_is_immutable_to_consumers");

        try { security.createApprovalRequest("sys_file", "1.0", { path: "/allowed/path/file", hack: true }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCHEMA_ADDITIONAL_PROPERTIES_NOT_ALLOWED", "test_input_schema_rejects_unknown_properties"); }
        try { security.createApprovalRequest("sys_file", "1.0", { path: 123 }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCHEMA_INVALID_TYPE", "test_input_schema_rejects_invalid_types"); }
        try { security.createApprovalRequest("sys_file", "1.0", {}, "", devContext); assert(false); } catch(e) { assert(e.message === "SCHEMA_REQUIRED_PARAMETER_MISSING", "test_required_parameter_missing_is_rejected"); }

        const reqWithDef = security.createApprovalRequest("sys_file", "1.0", { path: "/allowed/path/file" }, "", devContext);
        assert(reqWithDef.proposedParameters.flag === false, "test_defaults_are_bound_before_fingerprint");

        try { security.createApprovalRequest("sys_file", "1.0", { path: "/allowed/path/../../../etc/passwd" }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_directory_traversal_is_rejected"); }
        try { security.createApprovalRequest("sys_file", "1.0", { path: "/allowed/path/%2e%2e%2f%2e%2e%2fetc/passwd" }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_encoded_directory_traversal_is_rejected"); }
        try { security.createApprovalRequest("sys_file", "1.0", { path: "/allowed/path2/file" }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_path_prefix_collision_is_rejected"); }
        try { security.createApprovalRequest("sys_net", "1.0", { host: "192.168.1.10", protocol: "FTP" }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_network_protocol_scope_is_enforced"); }
        try { security.createApprovalRequest("sys_net", "1.0", { host: "192.168.1.10", port: 22 }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_network_port_scope_is_enforced"); }

        try { security.createApprovalRequest("sys_proc", "1.0", { executable: "rm" }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_process_executable_scope_is_enforced"); }
        try { security.createApprovalRequest("sys_proc", "1.0", { executable: "ping", args: ["-t"] }, "", devContext); assert(false); } catch(e) { assert(e.message === "SCOPE_VIOLATION", "test_process_arguments_scope_is_enforced"); }

        const reqNet = security.createApprovalRequest("sys_net", "1.0", { host: "192.168.1.10" }, "", devContext);
        const appNet = await security.approveRequest(reqNet, adminUser);
        try { await security.validateForExecution(appNet.approvalId, { host: "192.168.1.10" }, devContext, standardUser); assert(false); } catch(e) { assert(e.message === "PERMISSION_DENIED", "test_standard_user_capability_permission_is_checked"); }

        const hash1 = await security.generateFingerprint({ b: { a: "\\u0000" }, c: [1, 2] });
        const hash2 = await security.generateFingerprint({ c: [1, 2], b: { a: "\\u0000" } });
        assert(hash1 === hash2, "test_canonicalization_handles_nested_values");
        
        const hash3 = await security.generateFingerprint({ "a": "b", "c": "d" });
        const hash4 = await security.generateFingerprint({ "a\\":\\"b\\",\\"c": "d" });
        assert(hash3 !== hash4, "test_control_characters_cannot_create_canonicalization_collision");

        // --- NEW TESTS: Payload Limits ---
        let deepPayload = { a: 1 };
        for (let i = 0; i < 10; i++) deepPayload = { child: deepPayload };
        try { security.createApprovalRequest("sys_dummy", "1.0", { data: deepPayload }, "", devContext); assert(false); } catch(e) { assert(e.message === "PAYLOAD_LIMIT_EXCEEDED", "test_payload_depth_limit_exceeded_is_rejected"); }

        let longString = "A".repeat(3000);
        try { security.createApprovalRequest("sys_dummy", "1.0", { data: { text: longString } }, "", devContext); assert(false); } catch(e) { assert(e.message === "PAYLOAD_LIMIT_EXCEEDED", "test_payload_string_length_limit_exceeded_is_rejected"); }

        // --- NEW TESTS: Concurrency Protection ---
        const reqConc = security.createApprovalRequest("sys_dummy", "1.0", { data: {} }, "Concurrent Test", devContext);
        const appConc = await security.approveRequest(reqConc, adminUser);
        
        // Simulating simultaneous async calls without awaiting the first one
        const promise1 = security.validateForExecution(appConc.approvalId, { data: {} }, devContext, adminUser);
        const promise2 = security.validateForExecution(appConc.approvalId, { data: {} }, devContext, adminUser);
        
        try {
            const results = await Promise.allSettled([promise1, promise2]);
            let successes = 0;
            let failures = 0;
            for (let r of results) {
                if (r.status === "fulfilled") successes++;
                if (r.status === "rejected" && r.reason.message === "APPROVAL_ALREADY_CONSUMED") failures++;
            }
            assert(successes === 1 && failures === 1, "test_one_shot_approval_rejects_concurrent_consumption");
        } catch(e) {
            assert(false, "test_one_shot_approval_rejects_concurrent_consumption failed unexpectedly");
        }

    } catch (e) {
        console.error(e);
        assert(false, "Unhandled exception in security tests");
    }

    console.log(\`RESULTADO SECURITY V2: \${passed} PASS | \${failed} FAIL\`);
};
`;

fs.writeFileSync('c:/Users/pablo.carrascal/Documents/dulce-tentacion/ai-core/ai-tests.js', tests);
console.log('Successfully updated ai-tests.js with concurrency & payload tests.');
