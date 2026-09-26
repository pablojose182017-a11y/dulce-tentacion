const crypto = require('crypto');

/**
 * AI CORE - CREATOR KNOWLEDGE RUNTIME V1.1
 * Implementación del núcleo persistente de Creator Knowledge.
 * 
 * INVARIANTES:
 * CREATOR KNOWLEDGE ≠ TRUTH
 * CREATOR KNOWLEDGE ≠ IDENTITY
 * CREATOR KNOWLEDGE ≠ AUTHORITY
 * CREATOR KNOWLEDGE ≠ PERMISSION
 * CREATOR KNOWLEDGE ≠ EXECUTION
 */

// --- UTILS: DEEP CLONE & DEEP FREEZE ---

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Map) {
        const copy = new Map();
        for (let [k, v] of obj) copy.set(deepClone(k), deepClone(v));
        return copy;
    }
    if (obj instanceof Set) {
        const copy = new Set();
        for (let v of obj) copy.add(deepClone(v));
        return copy;
    }
    if (Array.isArray(obj)) {
        return obj.map(deepClone);
    }
    const copy = {};
    for (let key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            copy[key] = deepClone(obj[key]);
        }
    }
    return copy;
}

function deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    Object.freeze(obj);
    if (obj instanceof Map || obj instanceof Set) {
        obj.clear = obj.delete = obj.set = obj.add = function() {
            throw new TypeError("Cannot modify a frozen Map/Set");
        };
    }
    for (let key of Object.keys(obj)) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Object.isFrozen(obj[key])) {
            deepFreeze(obj[key]);
        }
    }
    return obj;
}

// Canonicaliza ordenando las llaves para que el hash sea determinista
function canonicalizeJSON(obj) {
    if (obj === null || typeof obj !== 'object') {
        return JSON.stringify(obj);
    }
    if (obj instanceof Map) {
        // Ordenamos las llaves del mapa para ser deterministas
        const sortedKeys = Array.from(obj.keys()).sort((a, b) => canonicalizeJSON(a).localeCompare(canonicalizeJSON(b)));
        const entries = sortedKeys.map(k => [k, obj.get(k)]);
        return `{"__type":"Map","value":[${entries.map(e => `[${canonicalizeJSON(e[0])},${canonicalizeJSON(e[1])}]`).join(',')}]}`;
    }
    if (obj instanceof Set) {
        // Ordenamos los valores para determinismo
        const sortedValues = Array.from(obj.values()).sort((a, b) => canonicalizeJSON(a).localeCompare(canonicalizeJSON(b)));
        return `{"__type":"Set","value":[${sortedValues.map(canonicalizeJSON).join(',')}]}`;
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(canonicalizeJSON).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    let result = '{';
    for (let i = 0; i < keys.length; i++) {
        result += JSON.stringify(keys[i]) + ':' + canonicalizeJSON(obj[keys[i]]);
        if (i < keys.length - 1) result += ',';
    }
    result += '}';
    return result;
}

function computeHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// --- CREATOR KNOWLEDGE RECORD ---

class CreatorKnowledgeRecord {
    constructor(data) {
        this.knowledgeId = data.knowledgeId || crypto.randomUUID();
        this.category = data.category;
        this.statement = data.statement;
        this.applicabilityScope = data.applicabilityScope;
        this.provenance = data.provenance;
        this.evidenceReference = data.evidenceReference || null;
        this.status = data.status || 'ACTIVE';
        this.version = data.version || 1;
        this.supersedesId = data.supersedesId || null;
        this.timestamp = data.timestamp || Date.now();
        this.integrityRecord = data.integrityRecord || null;
    }
}

// --- CREATOR KNOWLEDGE STORE ---

class CreatorKnowledgeStore {
    constructor() {
        this.disk = []; // Representa el almacenamiento físico Append-Only
        this.transactionLog = new Map(); // transactionId -> state (PREPARED, COMMITTED, ABORTED)
    }

    beginTransaction() {
        const txId = crypto.randomUUID();
        this.transactionLog.set(txId, { status: 'STARTED', operations: [] });
        return txId;
    }

    prepare(txId, records) {
        const tx = this.transactionLog.get(txId);
        if (!tx || tx.status !== 'STARTED') throw new Error("Invalid Transaction State");
        
        // Simula la escritura a un log de operaciones sin commitear
        tx.operations = deepClone(records);
        tx.status = 'PREPARED';
    }

    commit(txId) {
        const tx = this.transactionLog.get(txId);
        if (!tx || tx.status !== 'PREPARED') throw new Error("Cannot commit, not PREPARED");
        
        // Atomic append
        for (const op of tx.operations) {
            this.disk.push(deepClone(op));
        }
        tx.status = 'COMMITTED';
        tx.operations = []; // Liberamos memoria de la tx
    }

    abort(txId) {
        const tx = this.transactionLog.get(txId);
        if (tx) {
            tx.status = 'ABORTED';
            tx.operations = [];
        }
    }

    // Retorna todos los registros físicamente guardados
    readAllPhysical() {
        return deepClone(this.disk);
    }
}

// --- VOCABULARIO CONTROLADO DE SCOPE ---
const VALID_DOMAINS = ["TEXT", "SYS", "FINANCIAL", "EMAIL", "OS_FILES"];
const VALID_CONTEXTS = ["DAILY_ROUTINE", "DEFAULT", "REPORTING", "ANALYSIS"];
const VALID_TARGET_OBJECTS = ["SPAM_MESSAGE", "ANY_TEXT", "BALANCE_SHEET", "SYSTEM_PROCESS"];

// --- CREATOR KNOWLEDGE MANAGER ---

class CreatorKnowledgeManager {
    constructor(store) {
        this.store = store;
        this.activeMemory = new Map(); // kId -> Record (COMMITTED)
        this.currentSequence = 0;
        this.lastHash = "GENESIS_HASH";
        this.isReady = false;
    }

    // FLUJO DE REHIDRATACIÓN
    rehydrate() {
        const diskData = this.store.readAllPhysical();
        let tempSequence = 0;
        let tempLastHash = "GENESIS_HASH";
        let tempMap = new Map();

        for (const raw of diskData) {
            // 1. STRUCTURAL VALIDATION
            if (!this._validateStructure(raw)) throw new Error("FAIL-CLOSED: Invalid Structure");

            // 2. CANONICALIZATION & 3. INTEGRITY VALIDATION
            const contentToHash = deepClone(raw);
            delete contentToHash.integrityRecord;
            const canonicalContent = canonicalizeJSON(contentToHash);
            const computedFingerprint = computeHash(canonicalContent);
            
            const ir = raw.integrityRecord;
            if (!ir || ir.canonicalContentFingerprint !== computedFingerprint) {
                throw new Error("FAIL-CLOSED: Integrity Fingerprint Mismatch");
            }
            if (ir.previousRecordFingerprint !== tempLastHash) {
                throw new Error("FAIL-CLOSED: Chain Broken - previousRecordFingerprint mismatch");
            }
            if (ir.sequenceNumber !== tempSequence + 1) {
                throw new Error("FAIL-CLOSED: Sequence Broken");
            }
            if (ir.schemaVersion !== "1.1") {
                throw new Error("FAIL-CLOSED: Schema Version Incompatible");
            }

            // 4. EPISTEMIC VALIDATION
            if (raw.category === "CREATOR_FACT") {
                this._validateEvidenceReference(raw.evidenceReference);
            }

            // 5. PROVENANCE & SCOPE VALIDATION
            if (!raw.provenance || !raw.applicabilityScope) {
                throw new Error("FAIL-CLOSED: Missing Provenance or Scope");
            }

            // Aceptamos el registro en la memoria temporal
            tempMap.set(raw.knowledgeId, raw);
            tempSequence = ir.sequenceNumber;
            tempLastHash = computedFingerprint;
        }

        // CONSISTENCY VALIDATION
        for (const [id, record] of tempMap) {
            if (record.supersedesId && !tempMap.has(record.supersedesId)) {
                throw new Error("FAIL-CLOSED: Supersedes missing record");
            }
        }

        // ATOMIC COMMIT TO RAM
        this.activeMemory = tempMap;
        this.currentSequence = tempSequence;
        this.lastHash = tempLastHash;
        this.isReady = true;
    }

    _validateStructure(data) {
        if (!data || typeof data !== 'object') return false;
        if (!data.knowledgeId || !data.category || !data.statement) return false;
        const validCategories = ["CREATOR_FACT", "CREATOR_PREFERENCE", "CREATOR_GOAL", "CREATOR_EXPECTATION", "CREATOR_WORKFLOW", "CREATOR_BELIEF", "CREATOR_HYPOTHESIS", "UNKNOWN"];
        if (!validCategories.includes(data.category)) return false;
        return true;
    }

    _validateEvidenceReference(evRef) {
        if (!evRef || typeof evRef !== 'object') {
            throw new Error("FAIL-CLOSED: FACT missing valid evidenceReference structure");
        }
        if (!evRef.resourceId || !evRef.origin || !evRef.fingerprint) {
            throw new Error("FAIL-CLOSED: evidenceReference is missing structural fields");
        }
        if (evRef.origin === "CREATOR_BELIEF" || evRef.origin === "CREATOR_HYPOTHESIS" || evRef.origin === "CREATOR_EXPECTATION") {
            throw new Error("FAIL-CLOSED: Circular epistemic reasoning. Cannot use subjective source as evidence");
        }
        // Nota: La validación física (fetch del documento y hash match) está
        // RUNTIME PENDING porque el Evidence Store o KnowledgeManager general
        // aún no está implementado ni conectado en esta fase.
    }

    _validateScopeVocabulary(scopeObj) {
        if (!scopeObj || typeof scopeObj !== 'object') return false;
        if (scopeObj.domain && !VALID_DOMAINS.includes(scopeObj.domain)) return false;
        if (scopeObj.context && !VALID_CONTEXTS.includes(scopeObj.context)) return false;
        if (scopeObj.targetObjectType && !VALID_TARGET_OBJECTS.includes(scopeObj.targetObjectType)) return false;
        return true;
    }

    // FLUJO DE INSERCIÓN MULTIRREGISTRO (Atomicidad)
    insertAtomic(recordsInput) {
        if (!this.isReady) throw new Error("Manager not rehydrated");
        
        const txId = this.store.beginTransaction();
        try {
            const preparedRecords = [];
            let simulatedSeq = this.currentSequence;
            let simulatedLastHash = this.lastHash;

            for (let input of recordsInput) {
                // Validación básica
                if (!this._validateStructure(input)) throw new Error("Invalid structure");
                if (input.category === "CREATOR_FACT") {
                    this._validateEvidenceReference(input.evidenceReference);
                }
                
                // Validación de vocabulario de scope
                if (input.applicabilityScope && typeof input.applicabilityScope === 'object') {
                    if (!this._validateScopeVocabulary(input.applicabilityScope)) {
                        input.applicabilityScope = "SCOPE_UNCERTAIN"; // HARD DROP trigger
                    }
                } else {
                    input.applicabilityScope = "SCOPE_UNCERTAIN";
                }

                const rec = new CreatorKnowledgeRecord(input);
                
                // Preparar integrity
                simulatedSeq++;
                const contentToHash = deepClone(rec);
                delete contentToHash.integrityRecord;
                const canonicalContent = canonicalizeJSON(contentToHash);
                const computedFingerprint = computeHash(canonicalContent);

                rec.integrityRecord = {
                    recordId: rec.knowledgeId,
                    canonicalContentFingerprint: computedFingerprint,
                    previousRecordFingerprint: simulatedLastHash,
                    sequenceNumber: simulatedSeq,
                    schemaVersion: "1.1"
                };
                simulatedLastHash = computedFingerprint;
                preparedRecords.push(rec);
            }

            // PREPARE
            this.store.prepare(txId, preparedRecords);
            
            // COMMIT
            this.store.commit(txId);

            // Actualizar RAM State (Atomic post-commit)
            for (let rec of preparedRecords) {
                this.activeMemory.set(rec.knowledgeId, rec);
                if (rec.supersedesId && this.activeMemory.has(rec.supersedesId)) {
                    const oldRec = this.activeMemory.get(rec.supersedesId);
                    oldRec.status = "SUPERSEDED";
                }
            }
            this.currentSequence = simulatedSeq;
            this.lastHash = simulatedLastHash;

        } catch (e) {
            this.store.abort(txId);
            throw e;
        }
    }

    // RETRIEVAL
    retrieveActive(contextFilters) {
        if (!this.isReady) throw new Error("Manager not rehydrated");
        const results = [];
        for (const [id, rec] of this.activeMemory) {
            if (rec.status !== 'ACTIVE') continue;

            // HARD DROP: SCOPE_UNCERTAIN
            if (rec.applicabilityScope === "SCOPE_UNCERTAIN") continue; // Excluded from retrieval

            // Filtrado estricto: Si el scope no encaja perfecto con la petición, se descarta.
            if (contextFilters && contextFilters.domain) {
                if (rec.applicabilityScope.domain !== contextFilters.domain) continue;
            }

            results.push(deepFreeze(deepClone(rec))); // Immutable Snapshot
        }
        return results;
    }
}

module.exports = {
    CreatorKnowledgeStore,
    CreatorKnowledgeManager,
    CreatorKnowledgeRecord,
    deepClone,
    deepFreeze
};
