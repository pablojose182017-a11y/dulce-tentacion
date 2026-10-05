window.AI_CORE = window.AI_CORE || {};

// 1. INPUT IDENTITY
class InputIdentity {
    constructor(originalText) {
        this.inputId = window.crypto.randomUUID();
        this.originalText = originalText;
        this.originalLength = originalText.length; // UTF-16 code units
        this.inputFingerprint = window.AI_CORE.hash.sha256(originalText);
        this.offsetConvention = 'UTF-16 CODE UNITS';
        this.schemaVersion = '1.1';
    }
}

// 2. EVIDENCE SPANS
class EvidenceCandidate {
    constructor(providerText, providerStartOffset, providerEndOffset, confidence = 1.0) {
        this.providerText = providerText;
        this.providerStartOffset = providerStartOffset;
        this.providerEndOffset = providerEndOffset;
        this.confidence = confidence;
    }
}

class EvidenceSpan {
    constructor(inputId, startOffset, endOffset, originalText, alignmentMethod, alignmentStatus) {
        this.evidenceId = (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : `ev_${Date.now()}_${Math.random()}`));
        this.inputId = inputId;
        this.startOffset = startOffset;
        this.endOffset = endOffset;
        this.originalText = originalText;
        this.alignmentMethod = alignmentMethod;
        this.alignmentStatus = alignmentStatus;
    }
}

// 3. SEMANTIC STRUCTURAL VALIDATOR
class SemanticStructuralValidator {
    validateEvidence(inputIdentity, evidenceCandidate) {
        if (!evidenceCandidate.providerText) {
            return new EvidenceSpan(inputIdentity.inputId, -1, -1, null, 'EXACT_MATCH_BOUNDED', 'NO_MATCH');
        }

        let { providerStartOffset, providerEndOffset, providerText } = evidenceCandidate;

        if (providerStartOffset < 0 || providerEndOffset > inputIdentity.originalLength || providerStartOffset > providerEndOffset) {
            return new EvidenceSpan(inputIdentity.inputId, providerStartOffset, providerEndOffset, null, 'EXACT_MATCH_BOUNDED', 'INVALID_RANGE');
        }

        let substr = inputIdentity.originalText.substring(providerStartOffset, providerEndOffset);
        if (substr === providerText) {
            return new EvidenceSpan(inputIdentity.inputId, providerStartOffset, providerEndOffset, substr, 'EXACT_MATCH_BOUNDED', 'EXACT');
        } else {
            // BOUNDED_MATCH / MULTIPLE_MATCHES fallback
            let firstIndex = inputIdentity.originalText.indexOf(providerText);
            let lastIndex = inputIdentity.originalText.lastIndexOf(providerText);
            
            if (firstIndex === -1) {
                return new EvidenceSpan(inputIdentity.inputId, providerStartOffset, providerEndOffset, null, 'EXACT_MATCH_BOUNDED', 'NO_MATCH');
            } else if (firstIndex !== lastIndex) {
                return new EvidenceSpan(inputIdentity.inputId, providerStartOffset, providerEndOffset, null, 'EXACT_MATCH_BOUNDED', 'MULTIPLE_MATCHES');
            } else {
                return new EvidenceSpan(inputIdentity.inputId, firstIndex, firstIndex + providerText.length, providerText, 'EXACT_MATCH_BOUNDED', 'BOUNDED_MATCH');
            }
        }
    }

    validateInterpretation(interpretation) {
        // Strip poison fields (like authorized, permissions, etc)
        const allowedKeys = [
            'intent', 'subject', 'predicate', 'objectValue', 'unit', 'scope', 
            'temporalContext', 'knowledgeType', 'epistemicStatus', 'confidence', 
            'isNegated', 'evidenceCandidates', 'missingInformation', 'language'
        ];
        let clean = {};
        for (let k of allowedKeys) {
            if (interpretation[k] !== undefined) {
                clean[k] = interpretation[k];
            }
        }
        return clean;
    }

    /**
     * Validates whether structured information conforms to expected schema/fields.
     * Rejects malformed structures, missing required semantic fields, or unexpected data types.
     * Ensures external data remains DATA and cannot claim authority attributes.
     */
    validateStructure(data, schema = {}) {
        if (!data || typeof data !== "object") {
            return { valid: false, errors: ["Data must be a non-null object"] };
        }
        const errors = [];
        const requiredFields = schema.requiredFields || [];
        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null || data[field] === "") {
                errors.push(`Missing required semantic field: ${field}`);
            }
        }
        if (schema.fieldTypes) {
            for (const [field, expectedType] of Object.entries(schema.fieldTypes)) {
                if (data[field] !== undefined) {
                    const actualType = Array.isArray(data[field]) ? "array" : typeof data[field];
                    if (actualType !== expectedType) {
                        errors.push(`Field '${field}' expected type '${expectedType}' but got '${actualType}'`);
                    }
                }
            }
        }
        // Poison / authority escalation check: Information obtained remains DATA, never AUTHORITY.
        const forbiddenAuthorityKeys = ["authorized", "isAuthorized", "role", "permissions", "executeImmediately", "bypassSecurity", "adminOverride"];
        for (const key of forbiddenAuthorityKeys) {
            if (data[key] !== undefined) {
                errors.push(`Security violation: external structured data cannot claim authority attribute '${key}'`);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            sanitizedData: errors.length === 0 ? this._sanitizeData(data) : null
        };
    }

    _sanitizeData(data) {
        if (typeof data !== "object" || data === null) return data;
        const copy = Array.isArray(data) ? [] : {};
        for (const [k, v] of Object.entries(data)) {
            if (!k.startsWith("__") && typeof v !== "function") {
                copy[k] = typeof v === "object" ? this._sanitizeData(v) : v;
            }
        }
        return copy;
    }

    /**
     * Checks whether structured information is internally consistent.
     */
    validateInternalConsistency(structuredInfo) {
        if (!structuredInfo || typeof structuredInfo !== "object") {
            return { isConsistent: false, violations: ["Structured information must be a valid object"] };
        }
        const violations = [];
        // Numeric range consistency (e.g. min <= max, confidence in [0, 1])
        if (structuredInfo.confidence !== undefined) {
            if (typeof structuredInfo.confidence !== "number" || structuredInfo.confidence < 0 || structuredInfo.confidence > 1) {
                violations.push("Confidence must be a number between 0 and 1");
            }
        }
        if (structuredInfo.startOffset !== undefined && structuredInfo.endOffset !== undefined) {
            if (structuredInfo.startOffset > structuredInfo.endOffset) {
                violations.push(`Start offset (${structuredInfo.startOffset}) cannot exceed end offset (${structuredInfo.endOffset})`);
            }
        }
        if (structuredInfo.minValue !== undefined && structuredInfo.maxValue !== undefined) {
            if (structuredInfo.minValue > structuredInfo.maxValue) {
                violations.push(`minValue (${structuredInfo.minValue}) cannot exceed maxValue (${structuredInfo.maxValue})`);
            }
        }
        // Logical consistency: cannot be simultaneously affirmed and negated with certainty
        if (structuredInfo.isNegated === true && structuredInfo.epistemicStatus === "DIRECT_ASSERTION" && structuredInfo.oppositeAffirmed === true) {
            violations.push("Logical contradiction: assertion cannot be simultaneously affirmed and negated");
        }
        return {
            isConsistent: violations.length === 0,
            violations
        };
    }

    /**
     * Detects semantic conflict between two pieces of structured information or interpretations.
     */
    detectConflict(itemA, itemB) {
        if (!itemA || !itemB) {
            return { hasConflict: false, reason: "Insufficient items to compare" };
        }
        // If comparator is available
        if (typeof SemanticComparator !== "undefined" && SemanticComparator.compare) {
            const compA = itemA.detectedIntent ? itemA : { detectedIntent: itemA.intent || "REPORT", claimProposal: itemA };
            const compB = itemB.detectedIntent ? itemB : { detectedIntent: itemB.intent || "REPORT", claimProposal: itemB };
            const rel = SemanticComparator.compare(compA, compB);
            if (rel === "SEMANTICALLY_INCOMPATIBLE") {
                return { hasConflict: true, relation: rel, reason: "Incompatible semantic properties between items" };
            }
        }
        // Direct field conflict check (subject/predicate match but opposing value or negation)
        const subjA = itemA.subject || itemA.topic;
        const subjB = itemB.subject || itemB.topic;
        const valA = itemA.objectValue !== undefined ? itemA.objectValue : itemA.value;
        const valB = itemB.objectValue !== undefined ? itemB.objectValue : itemB.value;
        if (subjA && subjB && subjA.toLowerCase() === subjB.toLowerCase()) {
            if (itemA.isNegated !== undefined && itemB.isNegated !== undefined && itemA.isNegated !== itemB.isNegated) {
                return { hasConflict: true, reason: `Direct polarity contradiction on subject '${subjA}'` };
            }
            if (valA !== undefined && valB !== undefined && valA !== valB) {
                return { hasConflict: true, reason: `Value contradiction on subject '${subjA}': '${valA}' vs '${valB}'` };
            }
        }
        return { hasConflict: false, reason: "No conflict detected" };
    }

    /**
     * Validates an action proposal produced by reasoning before it can reach policy/execution layers.
     */
    validateActionProposal(proposal) {
        if (!proposal || typeof proposal !== "object") {
            return { valid: false, errors: ["Action proposal must be an object"] };
        }
        const errors = [];
        if (!proposal.toolId || typeof proposal.toolId !== "string") {
            errors.push("Action proposal missing valid toolId");
        }
        if (!proposal.targetPolicyId || typeof proposal.targetPolicyId !== "string") {
            errors.push("Action proposal missing valid targetPolicyId");
        }
        if (!proposal.parameters || typeof proposal.parameters !== "object") {
            errors.push("Action proposal missing parameters object");
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// 4. SEMANTIC PROVIDERS
class SemanticProviderRegistry {
    constructor() {
        this.providers = [];
    }
    register(provider) {
        this.providers.push(provider);
        this.providers.sort((a, b) => a.level - b.level);
    }
    getProviders() {
        return this.providers;
    }
}

class Level0Provider {
    constructor() {
        this.id = 'L0_Deterministic';
        this.version = '1.0';
        this.level = 0;
        this.capabilities = ['EXACT_IP', 'EXACT_MONEY'];
    }
    async process(text) {
        // Mock regex IP
        const ipMatch = text.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
        if (ipMatch) {
            return {
                status: 'COMPLETE',
                intent: 'REPORT',
                subject: 'IP',
                objectValue: ipMatch[0],
                epistemicStatus: 'FACT',
                evidenceCandidates: [
                    new EvidenceCandidate(ipMatch[0], ipMatch.index, ipMatch.index + ipMatch[0].length)
                ]
            };
        }
        return { status: 'UNSUPPORTED' };
    }
}

class Level1Provider {
    constructor() {
        this.id = 'L1_Heuristic';
        this.version = '1.0';
        this.level = 1;
        this.capabilities = ['SIMPLE_NEGATION', 'INTENT_CLASSIFICATION'];
    }
    async process(text) {
        let t = text.toLowerCase();
        
        // D4D-12 Doble Negación
        if (t.includes('no es falso que no')) {
            return { status: 'UNKNOWN' }; // Degrades conservatively
        }

        // D4D-26 Action Request
        if (t.includes('configura') || t.includes('borra') || t.includes('formatea')) {
            let res = {
                status: 'COMPLETE',
                intent: 'ACTION_REQUEST',
                missingInformation: [{ type: 'INDISPENSABLE', info: 'target_parameters' }],
                evidenceCandidates: []
            };
            if (t.includes('configura')) res.evidenceCandidates.push(new EvidenceCandidate('configura', t.indexOf('configura'), t.indexOf('configura') + 9));
            return res;
        }

        // D4D-11 Negación incorrecta / simple
        if (t.includes('no ')) {
            return {
                status: 'PARTIAL',
                isNegated: true,
                evidenceCandidates: [new EvidenceCandidate('no ', t.indexOf('no '), t.indexOf('no ') + 3)]
            };
        }

        return { status: 'UNSUPPORTED' };
    }
}

// 5. SEMANTIC ORCHESTRATOR
class SemanticComparator {
    static compare(a, b) {
        if (a.detectedIntent !== b.detectedIntent) return 'SEMANTICALLY_INCOMPATIBLE';
        
        let cA = a.claimProposal || {};
        let cB = b.claimProposal || {};

        let check = (valA, valB, mismatchResult) => {
            if (valA === undefined && valB !== undefined) return 'SEMANTICALLY_UNCERTAIN';
            if (valA !== undefined && valB === undefined) return 'SEMANTICALLY_UNCERTAIN';
            if (valA !== valB) return mismatchResult;
            return 'MATCH';
        };

        let res;
        res = check(cA.epistemicStatus, cB.epistemicStatus, 'SEMANTICALLY_INCOMPATIBLE');
        if (res !== 'MATCH') return res;
        
        res = check(cA.subject, cB.subject, 'DISTINCT_COEXISTING');
        if (res !== 'MATCH') return res;
        
        res = check(cA.predicate, cB.predicate, 'DISTINCT_COEXISTING');
        if (res !== 'MATCH') return res;
        
        res = check(cA.scope, cB.scope, 'DISTINCT_COEXISTING');
        if (res !== 'MATCH') return res;
        
        res = check(cA.temporalContext, cB.temporalContext, 'DISTINCT_COEXISTING');
        if (res !== 'MATCH') return res;
        
        res = check(cA.isNegated, cB.isNegated, 'SEMANTICALLY_INCOMPATIBLE');
        if (res !== 'MATCH') return res;
        
        res = check(cA.objectValue, cB.objectValue, 'SEMANTICALLY_INCOMPATIBLE');
        if (res !== 'MATCH') return res;
        
        res = check(cA.unit, cB.unit, 'SEMANTICALLY_INCOMPATIBLE');
        if (res !== 'MATCH') return res;
        
        res = check(cA.knowledgeType, cB.knowledgeType, 'SEMANTICALLY_INCOMPATIBLE');
        if (res !== 'MATCH') return res;
        
        return 'SEMANTICALLY_EQUIVALENT';
    }
}

class SemanticOrchestrator {
    constructor(registry) {
        this.registry = registry;
        this.validator = new SemanticStructuralValidator();
        this.strategy = 'WATERFALL_WITH_CONSENSUS'; 
    }
    
    async interpret(rawInput) {
        let inputIdentity = new InputIdentity(rawInput);
        let providers = this.registry.getProviders();
        
        let lastError = null;
        let fallbackHistory = [];
        let candidates = [];

        for (let provider of providers) {
            try {
                let rawResult = await provider.process(rawInput);
                
                if (rawResult.status === 'UNSUPPORTED' || rawResult.status === 'UNKNOWN') {
                    lastError = this._buildResult(inputIdentity, provider, rawResult.status);
                    fallbackHistory.push({ from: provider.id, to: 'NEXT', reason: rawResult.status });
                    continue; 
                }

                if (!rawResult || typeof rawResult !== 'object') {
                    lastError = this._buildResult(inputIdentity, provider, 'INVALID');
                    fallbackHistory.push({ from: provider.id, to: 'NEXT', reason: 'INVALID_OUTPUT' });
                    continue;
                }

                let validEvidenceSpans = [];
                let hasInvalidEvidence = false;
                
                if (rawResult.evidenceCandidates && rawResult.evidenceCandidates.length > 0) {
                    for (let cand of rawResult.evidenceCandidates) {
                        let span = this.validator.validateEvidence(inputIdentity, cand);
                        if (span.alignmentStatus === 'EXACT' || span.alignmentStatus === 'BOUNDED_MATCH') {
                            validEvidenceSpans.push(span);
                        } else if (span.alignmentStatus === 'MULTIPLE_MATCHES') {
                            lastError = this._buildResult(inputIdentity, provider, 'AMBIGUOUS');
                            hasInvalidEvidence = true;
                            fallbackHistory.push({ from: provider.id, to: 'NEXT', reason: 'MULTIPLE_MATCHES' });
                            break;
                        } else {
                            hasInvalidEvidence = true;
                            fallbackHistory.push({ from: provider.id, to: 'NEXT', reason: 'INVALID_EVIDENCE' });
                            break;
                        }
                    }
                } else if (rawResult.status === 'COMPLETE' && rawResult.intent !== 'ACTION_REQUEST') {
                    if (rawResult.epistemicStatus) {
                        hasInvalidEvidence = true;
                        fallbackHistory.push({ from: provider.id, to: 'NEXT', reason: 'MISSING_EVIDENCE' });
                    }
                }

                if (hasInvalidEvidence) {
                    lastError = lastError || this._buildResult(inputIdentity, provider, 'INVALID');
                    continue;
                }

                let clean = this.validator.validateInterpretation(rawResult);
                
                let candidateResult = {
                    interpretationId: window.crypto.randomUUID(),
                    inputIdentity: inputIdentity,
                    language: clean.language || 'UNKNOWN',
                    detectedIntent: clean.intent || 'UNKNOWN',
                    interpretationStatus: rawResult.status || 'PARTIAL',
                    confidence: clean.confidence || 1.0,
                    evidenceSpans: validEvidenceSpans,
                    claimProposal: clean,
                    missingInformation: clean.missingInformation || [],
                    providerProvenance: {
                        providerId: provider.id,
                        providerVersion: provider.version,
                        capabilityLevel: provider.level,
                        timestamp: new Date().toISOString(),
                        schemaVersion: '1.1'
                    }
                };

                if (provider.level === 0) {
                    candidateResult.fallbackHistory = fallbackHistory;
                    return this._deepFreeze(candidateResult);
                }

                candidates.push(candidateResult);
                
            } catch (e) {
                lastError = this._buildResult(inputIdentity, provider, 'INVALID');
                fallbackHistory.push({ from: provider.id, to: 'NEXT', reason: 'EXCEPTION' });
            }
        }
        
        if (candidates.length === 1) {
            candidates[0].fallbackHistory = fallbackHistory;
            return this._deepFreeze(candidates[0]);
        } else if (candidates.length > 1) {
            let hasConflict = false;
            let hasDistinct = false;
            
            for (let i = 0; i < candidates.length; i++) {
                for (let j = i + 1; j < candidates.length; j++) {
                    let rel = SemanticComparator.compare(candidates[i], candidates[j]);
                    if (rel === 'SEMANTICALLY_INCOMPATIBLE') hasConflict = true;
                    if (rel === 'DISTINCT_COEXISTING' || rel === 'SEMANTICALLY_UNCERTAIN') hasDistinct = true;
                }
            }
            
            if (hasConflict) {
                let res = {
                    interpretationStatus: 'CONFLICTING_INTERPRETATIONS',
                    inputIdentity: inputIdentity,
                    candidates: candidates,
                    fallbackHistory: fallbackHistory
                };
                return this._deepFreeze(res);
            } else if (hasDistinct) {
                let res = {
                    interpretationStatus: 'MULTIPLE_INTERPRETATIONS',
                    inputIdentity: inputIdentity,
                    candidates: candidates,
                    fallbackHistory: fallbackHistory
                };
                return this._deepFreeze(res);
            }
            
            candidates[0].fallbackHistory = fallbackHistory;
            return this._deepFreeze(candidates[0]);
        }

        if (lastError) {
            lastError.fallbackHistory = fallbackHistory;
            return this._deepFreeze(lastError);
        }

        let finalRes = {
            interpretationStatus: 'UNSUPPORTED',
            inputIdentity: inputIdentity,
            fallbackHistory: fallbackHistory
        };
        return this._deepFreeze(finalRes);
    }

    _buildResult(inputIdentity, provider, status) {
        return {
            interpretationId: window.crypto.randomUUID(),
            interpretationStatus: status,
            inputIdentity: inputIdentity,
            providerProvenance: {
                providerId: provider.id,
                providerVersion: provider.version,
                capabilityLevel: provider.level,
                timestamp: new Date().toISOString(),
                schemaVersion: '1.1'
            }
        };
    }
    
    _deepFreeze(object) {
        let propNames = Object.getOwnPropertyNames(object);
        for (let name of propNames) {
            let value = object[name];
            if (value && typeof value === "object") {
                this._deepFreeze(value);
            }
        }
        return Object.freeze(object);
    }
}

window.AI_CORE.InputIdentity = InputIdentity;
window.AI_CORE.EvidenceCandidate = EvidenceCandidate;
window.AI_CORE.EvidenceSpan = EvidenceSpan;
window.AI_CORE.SemanticStructuralValidator = SemanticStructuralValidator;
window.AI_CORE.SemanticProviderRegistry = SemanticProviderRegistry;
window.AI_CORE.SemanticOrchestrator = SemanticOrchestrator;
window.AI_CORE.SemanticComparator = SemanticComparator;
window.AI_CORE.Level0Provider = Level0Provider;
window.AI_CORE.Level1Provider = Level1Provider;
