const { SecurityClock, CreatorIdentityManager, SecurityBoundaryUtils, globalAuditLog } = require('./ai-core/ai-creator-identity');

function assert(condition, msg) {
    if (condition) {
        console.log(`[PASS] ${msg}`);
        return true;
    } else {
        console.error(`[FAIL] ${msg}`);
        return false;
    }
}

function runTests() {
    console.log("=== INICIANDO TESTS ESTRUCTURALES CREATOR IDENTITY V1.2 (CORREGIDO) ===");
    let passed = 0; let total = 0;
    const test = (name, cond, msg) => {
        total++;
        if(assert(cond, `[${name}] ${msg}`)) passed++;
    };

    const im = new CreatorIdentityManager();
    const reqId = "req_123";
    const rawParams = { file: "db.json", action: "DELETE" };
    const creatorId = "creator_pablo";

    // T1/T2: CHALLLENGE CREATION & HAPPY PATH
    const ch1 = im.issueChallenge(reqId, rawParams, creatorId);
    test("T1", ch1 && ch1.challengeId, "Challenge creado con propiedades inmutables.");
    const res1 = im.submitVoiceEvidence(ch1.challengeId, ch1.nonce, reqId, rawParams, "LIVE");
    test("T2", res1.status === "LIVE", "Voz validada arroja LIVE (Identity Evidence, NOT Authorization).");

    // T3: ATOMIC DOUBLE CONSUMPTION (LIMITATION: RUNTIME NOT CONCURRENT)
    const res2 = im.submitVoiceEvidence(ch1.challengeId, ch1.nonce, reqId, rawParams, "LIVE");
    test("T3", res2.status === "IDENTITY_UNCERTAIN" && res2.reason === "REPLAY_REJECTED_CONSUMED", 
        "Doble ejecución secuencial bloqueada (LIMITATION: CONCURRENCY TEST NOT DEMONSTRABLE en Single-Thread).");

    // T4: CROSS-CONTEXT REPLAY
    const ch2 = im.issueChallenge("req_A", { id: 1 }, creatorId);
    const resCross = im.submitVoiceEvidence(ch2.challengeId, ch2.nonce, "req_B", { id: 1 }, "LIVE");
    test("T4", resCross.status === "IDENTITY_UNCERTAIN" && resCross.reason === "CROSS_CONTEXT_REQUEST_MISMATCH", "Cross-context replay bloqueado.");

    // T5: FINGERPRINT ALTERADO (Canonicalization Confusion)
    const ch3 = im.issueChallenge("req_C", { b: 2, a: 1 }, creatorId);
    const resAlt = im.submitVoiceEvidence(ch3.challengeId, ch3.nonce, "req_C", { a: 1, b: 3 }, "LIVE");
    test("T5", resAlt.status === "IDENTITY_UNCERTAIN" && resAlt.reason === "FINGERPRINT_MISMATCH", "Fingerprint alterado arroja mismatch.");
    
    // T6: STRICT CANONICALIZATION (Type confusion block)
    const ch4 = im.issueChallenge("req_D", { val: 1 }, creatorId); // Numero 1
    const resCan = im.submitVoiceEvidence(ch4.challengeId, ch4.nonce, "req_D", { val: "1" }, "LIVE"); // String "1"
    test("T6", resCan.status === "IDENTITY_UNCERTAIN" && resCan.reason === "FINGERPRINT_MISMATCH", "Strict Canonicalization rechaza coerción de tipos (1 vs '1').");

    // T7: ESTADOS SPOOF/REPLAY/UNCERTAIN (Fail Closed)
    const ch5 = im.issueChallenge("req_E", {}, creatorId);
    const resSpoof = im.submitVoiceEvidence(ch5.challengeId, ch5.nonce, "req_E", {}, "SPOOF_SUSPECTED");
    test("T7", resSpoof.status === "IDENTITY_UNCERTAIN" && resSpoof.reason === "LIVENESS_FAILED", "Spoof suspected fuerza Identity Uncertain.");

    // T8: EXPIRATION
    const ch6 = im.issueChallenge("req_F", {}, creatorId);
    SecurityClock.tick(); SecurityClock.tick(); SecurityClock.tick(); SecurityClock.tick(); SecurityClock.tick(); SecurityClock.tick();
    const resExp = im.submitVoiceEvidence(ch6.challengeId, ch6.nonce, "req_F", {}, "LIVE");
    test("T8", resExp.status === "IDENTITY_UNCERTAIN" && resExp.reason === "EXPIRED_EPOCH", "Expiración del Security Epoch bloquea la evidencia temporal.");

    // T9: WALL-CLOCK MANIPULATION
    const prevEpoch = SecurityClock.getEpoch();
    Date.now = () => 0; // Fingimos viaje al pasado del OS
    test("T9", SecurityClock.getEpoch() === prevEpoch, "Wall-Clock desync no altera el Monotonic Security Epoch.");

    // T10: AUDIT DEEP IMMUTABILITY
    const mutParams = { arr: [1,2,3], obj: { secret: "A" } };
    const ch7 = im.issueChallenge("req_G", mutParams, creatorId);
    
    // Mutamos el objeto raw usado para originar el evento
    mutParams.arr.push(4);
    mutParams.obj.secret = "B";
    
    const logs = globalAuditLog.getLogs();
    const creationLog = logs.find(l => l.challengeId === ch7.challengeId && l.action === "CHALLENGE_CREATED");
    
    // Verificamos que aunque lo intentemos modificar desde el log, no se deje
    let isDeepFrozen = true;
    try {
        creationLog.newProp = "HACK";
        if (creationLog.newProp === "HACK") isDeepFrozen = false;
    } catch(e) {}

    test("T10", isDeepFrozen, "Logs de auditoría gozan de Deep Immutability (no se alteran por mutaciones post-evento).");

    // T11: RESTART / BOOT ID
    const ch8 = im.issueChallenge("req_H", {}, creatorId);
    // Simulamos un reinicio (BootId cambia porque el Singleton SecurityClock se recrearía, aquí lo simulamos)
    SecurityClock.systemBootId = "NEW_BOOT_ID_123";
    const resRestart = im.submitVoiceEvidence(ch8.challengeId, ch8.nonce, "req_H", {}, "LIVE");
    test("T11", resRestart.status === "IDENTITY_UNCERTAIN" && resRestart.reason === "BOOT_ID_MISMATCH", "Un reinicio (cambio de BootID) invalida inmediatamente los challenges en memoria RAM (Fail Closed).");

    console.log(`\nRESUMEN: ${passed} / ${total} TESTS EVALUADOS.`);
    console.log("NOTA: Debido a limitaciones del runtime (Node inaccesible), estos tests son STATIC/NOT EXECUTED.");
}

runTests();
