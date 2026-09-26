const crypto = require('crypto');

/**
 * RELOJ MONOTÓNICO (Simulación Local)
 * LIMITATION: No existe persistencia segura todavía. El reloj se reinicia en cada ejecución.
 * Para prevenir que epoch=0 sea válido tras un reinicio, se ata a un bootId único.
 */
class MonotonicSecurityClock {
    constructor() {
        this.epoch = 0;
        this.baseWallClock = Date.now();
        this.systemBootId = crypto.randomBytes(8).toString('hex');
    }

    tick() {
        this.epoch++;
        return this.epoch;
    }

    getEpoch() {
        return this.epoch;
    }

    getBootId() {
        return this.systemBootId;
    }
}

const SecurityClock = new MonotonicSecurityClock();

/**
 * CANONICALIZATION E IDENTIDAD DENTRO DEL SECURITY BOUNDARY
 */
class SecurityBoundaryUtils {
    /**
     * Strict Deterministic Canonicalization
     * Preserva tipo, rechaza no soportados y normaliza Unicode.
     */
    static canonicalizeParameters(params) {
        if (params === null) return 'Z:null';
        if (params === undefined) return ''; // Omitimos undefined de los objetos
        
        const type = typeof params;
        
        if (type === 'string') {
            return 's:' + params.normalize('NFC');
        }
        
        if (type === 'number') {
            if (!Number.isFinite(params)) throw new Error("Unsupported value: Non-finite number");
            return 'n:' + params;
        }
        
        if (type === 'boolean') {
            return 'b:' + params;
        }
        
        if (type === 'object') {
            if (Array.isArray(params)) {
                return 'A:[' + params.map(SecurityBoundaryUtils.canonicalizeParameters).join(',') + ']';
            }
            
            const sortedKeys = Object.keys(params).sort();
            let canonicalStr = 'O:{';
            let first = true;
            for (let i = 0; i < sortedKeys.length; i++) {
                const k = sortedKeys[i];
                if (params[k] === undefined) continue;
                
                if (!first) canonicalStr += ',';
                // La clave siempre es string (NFC)
                canonicalStr += 's:' + k.normalize('NFC') + ':' + SecurityBoundaryUtils.canonicalizeParameters(params[k]);
                first = false;
            }
            canonicalStr += '}';
            return canonicalStr;
        }
        
        throw new Error(`Unsupported type: ${type}`);
    }

    static generateFingerprint(canonicalStr) {
        return crypto.createHash('sha256').update(canonicalStr).digest('hex');
    }
}

/**
 * Deep Freeze & Clone util
 */
function deepCloneAndFreeze(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        const arr = obj.map(deepCloneAndFreeze);
        return Object.freeze(arr);
    }
    const clonedObj = {};
    for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            clonedObj[key] = deepCloneAndFreeze(obj[key]);
        }
    }
    return Object.freeze(clonedObj);
}

/**
 * AUDITORÍA INMUTABLE
 */
class SecurityAuditLog {
    constructor() {
        this.logs = [];
    }
    
    append(event) {
        const entryBase = { 
            ...event, 
            wallClockTime: Date.now(), 
            securityEpoch: SecurityClock.getEpoch(),
            bootId: SecurityClock.getBootId()
        };
        const immutableEntry = deepCloneAndFreeze(entryBase);
        this.logs.push(immutableEntry);
    }
    
    getLogs() {
        return this.logs;
    }
}

const globalAuditLog = new SecurityAuditLog();

/**
 * ACTIVE VOICE CHALLENGE MANAGER
 */
class VoiceChallengeManager {
    constructor() {
        this.challenges = new Map();
    }

    createChallenge(authorizationRequestId, rawParams, creatorIdentityId) {
        let canonicalStr;
        try {
            canonicalStr = SecurityBoundaryUtils.canonicalizeParameters(rawParams);
        } catch (err) {
            globalAuditLog.append({ action: "CHALLENGE_CREATION_FAILED", reason: err.message });
            throw err;
        }
        
        const fingerprint = SecurityBoundaryUtils.generateFingerprint(canonicalStr);
        const challengeId = `ch_${crypto.randomBytes(8).toString('hex')}`;
        const nonce = crypto.randomBytes(16).toString('hex');
        
        const creationEpoch = SecurityClock.getEpoch();
        const expirationEpoch = creationEpoch + 5; 
        const bootId = SecurityClock.getBootId(); // Ata el challenge a la sesión de la máquina

        const challengeRecord = Object.freeze({
            challengeId,
            nonce,
            authorizationRequestId,
            canonicalParameterFingerprint: fingerprint,
            creationEpoch,
            expirationEpoch,
            bootId,
            creatorIdentityId,
            challengeText: "Repite: Código " + Math.floor(Math.random() * 10000)
        });

        this.challenges.set(challengeId, {
            record: challengeRecord,
            consumedState: false 
        });

        globalAuditLog.append({ action: "CHALLENGE_CREATED", challengeId, authorizationRequestId });
        return challengeRecord;
    }

    validateAndConsume(challengeId, providedNonce, providedRequestId, rawParams, voiceResultState) {
        const entry = this.challenges.get(challengeId);
        if (!entry) {
            globalAuditLog.append({ action: "CHALLENGE_REJECTED", challengeId, reason: "NOT_FOUND" });
            return { status: "IDENTITY_UNCERTAIN", reason: "NOT_FOUND" };
        }

        // 1. ATOMIC COMPARE AND SWAP (simulado en JS single-thread)
        if (entry.consumedState === true) {
            globalAuditLog.append({ action: "CHALLENGE_REJECTED", challengeId, reason: "REPLAY_REJECTED_CONSUMED" });
            return { status: "IDENTITY_UNCERTAIN", reason: "REPLAY_REJECTED_CONSUMED" };
        }
        entry.consumedState = true; 

        const record = entry.record;

        // 2. TIMEOUT / MONOTONIC CLOCK & BOOT ID
        if (record.bootId !== SecurityClock.getBootId()) {
            globalAuditLog.append({ action: "CHALLENGE_REJECTED", challengeId, reason: "BOOT_ID_MISMATCH" });
            return { status: "IDENTITY_UNCERTAIN", reason: "BOOT_ID_MISMATCH" };
        }
        
        if (SecurityClock.getEpoch() > record.expirationEpoch) {
            globalAuditLog.append({ action: "CHALLENGE_REJECTED", challengeId, reason: "EXPIRED_EPOCH" });
            return { status: "IDENTITY_UNCERTAIN", reason: "EXPIRED_EPOCH" };
        }

        // 3. NONCE MATCH
        if (record.nonce !== providedNonce) {
            globalAuditLog.append({ action: "CHALLENGE_REJECTED", challengeId, reason: "INVALID_NONCE" });
            return { status: "IDENTITY_UNCERTAIN", reason: "INVALID_NONCE" };
        }

        // 4. CROSS-CONTEXT BLOCK & CANONICALIZATION RE-CHECK
        if (record.authorizationRequestId !== providedRequestId) {
            globalAuditLog.append({ action: "CHALLENGE_REJECTED", challengeId, reason: "CROSS_CONTEXT_REQUEST_MISMATCH" });
            return { status: "IDENTITY_UNCERTAIN", reason: "CROSS_CONTEXT_REQUEST_MISMATCH" };
        }

        let reCanonicalStr;
        try {
            reCanonicalStr = SecurityBoundaryUtils.canonicalizeParameters(rawParams);
        } catch (e) {
            globalAuditLog.append({ action: "CHALLENGE_REJECTED", challengeId, reason: "CANONICALIZATION_ERROR" });
            return { status: "IDENTITY_UNCERTAIN", reason: "CANONICALIZATION_ERROR" };
        }

        const reFingerprint = SecurityBoundaryUtils.generateFingerprint(reCanonicalStr);
        if (record.canonicalParameterFingerprint !== reFingerprint) {
            globalAuditLog.append({ action: "CHALLENGE_REJECTED", challengeId, reason: "FINGERPRINT_MISMATCH" });
            return { status: "IDENTITY_UNCERTAIN", reason: "FINGERPRINT_MISMATCH" };
        }

        // 5. LIVENESS CHECK (FAIL CLOSED)
        const validStates = ["LIVE", "REPLAY_SUSPECTED", "SPOOF_SUSPECTED", "INCONCLUSIVE", "IDENTITY_UNCERTAIN"];
        if (!validStates.includes(voiceResultState)) voiceResultState = "IDENTITY_UNCERTAIN";

        if (voiceResultState !== "LIVE") {
            globalAuditLog.append({ action: "CHALLENGE_REJECTED", challengeId, reason: "LIVENESS_FAILED", voiceState: voiceResultState });
            return { status: "IDENTITY_UNCERTAIN", reason: "LIVENESS_FAILED", voiceState: voiceResultState };
        }

        globalAuditLog.append({ action: "CHALLENGE_CONSUMED", challengeId, result: "LIVE" });
        return { status: "LIVE", creatorIdentityId: record.creatorIdentityId };
    }
}

/**
 * CREATOR IDENTITY MANAGER
 */
class CreatorIdentityManager {
    constructor() {
        this.challengeManager = new VoiceChallengeManager();
    }

    issueChallenge(authorizationRequestId, rawParams, creatorIdentityId) {
        return this.challengeManager.createChallenge(authorizationRequestId, rawParams, creatorIdentityId);
    }

    submitVoiceEvidence(challengeId, providedNonce, providedRequestId, rawParams, voiceResultState) {
        return this.challengeManager.validateAndConsume(challengeId, providedNonce, providedRequestId, rawParams, voiceResultState);
    }
}

if (typeof module !== 'undefined') {
    module.exports = {
        SecurityClock,
        SecurityBoundaryUtils,
        VoiceChallengeManager,
        CreatorIdentityManager,
        globalAuditLog
    };
}
