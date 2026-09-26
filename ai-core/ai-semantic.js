const crypto = require('crypto');

// 1. INPUT IDENTITY
class InputIdentity {
    constructor(originalText) {
        this.inputId = crypto.randomUUID();
        this.originalText = originalText;
        this.originalLength = originalText.length; // UTF-16 code units
        this.inputFingerprint = crypto.createHash('sha256').update(originalText).digest('hex');
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
        this.evidenceId = crypto.randomUUID();
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
class SemanticOrchestrator {
    constructor(registry) {
        this.registry = registry;
        this.validator = new SemanticStructuralValidator();
        this.strategy = 'WATERFALL_WITH_CONSENSUS'; 
        // Strategy: L0 is deterministic (first valid wins). L>0 requires consensus if multiple providers exist at the same level.
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
                    interpretationId: crypto.randomUUID(),
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

                // Deterministic check
                if (provider.level === 0) {
                    candidateResult.fallbackHistory = fallbackHistory;
                    return this._deepFreeze(candidateResult);
                }

                candidates.push(candidateResult);

                // For L1 and above, we gather candidates to avoid silent disagreement.
                // If this is the last provider, or the next provider is a different level, we can stop and evaluate.
                // Note: to keep it simple, we collect all capable heuristic/probabilistic providers.
                
            } catch (e) {
                lastError = this._buildResult(inputIdentity, provider, 'INVALID');
                fallbackHistory.push({ from: provider.id, to: 'NEXT', reason: 'EXCEPTION' });
            }
        }
        
        if (candidates.length === 1) {
            candidates[0].fallbackHistory = fallbackHistory;
            return this._deepFreeze(candidates[0]);
        } else if (candidates.length > 1) {
            // Disagreement check
            let firstIntent = candidates[0].detectedIntent;
            let conflict = candidates.some(c => c.detectedIntent !== firstIntent);
            
            if (conflict) {
                let res = {
                    interpretationStatus: 'CONFLICTING_INTERPRETATIONS',
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
            interpretationId: crypto.randomUUID(),
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

module.exports = {
    InputIdentity,
    EvidenceCandidate,
    EvidenceSpan,
    SemanticStructuralValidator,
    SemanticProviderRegistry,
    SemanticOrchestrator,
    Level0Provider,
    Level1Provider
};
