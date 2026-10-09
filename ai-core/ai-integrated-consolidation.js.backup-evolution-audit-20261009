const crypto = require('crypto');

class EvidenceValidator {
    static isValid(support, provenanceGraph) {
        if (!support || !support.source || !support.evidence) return false;
        
        let sourceExists = provenanceGraph.sources.has(support.source.sourceId);
        if (!sourceExists) return false;
        
        let ev = support.evidence;
        if (typeof ev !== 'object' && typeof ev !== 'string') return false;
        if (Array.isArray(ev) && ev.length === 0) return false;
        
        // Check for broken reference
        if (ev.broken || ev.invalid) return false;
        
        return true;
    }
}

class IntegratedConsolidationEngine {
    constructor(provenanceGraph) {
        this.provenance = provenanceGraph;
        this.consolidationStates = new Map(); // targetId -> state
        this.history = [];
    }

    _areSourcesIndependent(supports) {
        if (!Array.isArray(supports)) return 0;
        
        let validSources = new Map();
        
        for (let s of supports) {
            if (!s || !s.source) continue;
            if (!this.provenance._isEvidenceValid(s.evidence)) continue;
            
            let srcId = s.source.sourceId;
            if (!validSources.has(srcId)) {
                let supportRoots = this.provenance._findRootSources(s.source);
                let rootIds = new Set();
                for (let r of supportRoots) {
                    rootIds.add(r.sourceId);
                }
                validSources.set(srcId, rootIds);
            }
        }
        
        let sourcesArray = Array.from(validSources.entries());
        if (sourcesArray.length === 0) return 0;
        
        const MAX_EXACT_SOURCES = 15;
        if (sourcesArray.length > MAX_EXACT_SOURCES) {
            return 'COMPUTATION_BUDGET_EXCEEDED';
        }
        
        sourcesArray.sort((a, b) => a[0].localeCompare(b[0]));
        
        let backtrack = (index, currentSetRootUnion) => {
            if (index >= sourcesArray.length) return 0;
            
            let [srcId, srcRoots] = sourcesArray[index];
            let canInclude = true;
            for (let r of srcRoots) {
                if (currentSetRootUnion.has(r)) {
                    canInclude = false;
                    break;
                }
            }
            
            let countWithout = backtrack(index + 1, currentSetRootUnion);
            let countWith = 0;
            if (canInclude) {
                let nextUnion = new Set(currentSetRootUnion);
                for (let r of srcRoots) nextUnion.add(r);
                countWith = 1 + backtrack(index + 1, nextUnion);
            }
            return Math.max(countWith, countWithout);
        };
        
        return backtrack(0, new Set());
    }

    async consolidateClaim(claimId) {
        let record = this.provenance.claims.get(claimId); 
        if (!record) return null;

        let proposal = record.claimProposal;
        
        let independentCount = this._areSourcesIndependent(record.supports);

        let isConflicted = false;
        let conflictList = Array.from(this.provenance.conflicts.values());
        for (let c of conflictList) {
            if (c.status === 'OPEN' && (c.claimA.claimId === claimId || c.claimB.claimId === claimId)) {
                isConflicted = true;
                break;
            }
        }

        let newState = 'STRUCTURED';
        let type = proposal.knowledgeType || 'UNKNOWN';
        let epistemicallyRestricted = ['INFERENCE', 'OPINION', 'HYPOTHESIS', 'UNKNOWN', 'QUESTION', 'INSTRUCTION', 'USER_ASSERTION'];

        if (isConflicted) {
            newState = 'CONFLICTED';
        } else if (independentCount === 'COMPUTATION_BUDGET_EXCEEDED') {
            newState = 'UNCERTAIN';
        } else if (independentCount === 0) {
            newState = 'UNCERTAIN';
        } else if (epistemicallyRestricted.includes(type)) {
            newState = independentCount > 1 ? 'SUPPORTED' : 'UNCERTAIN';
        } else if (type === 'FACT' || type === 'OBSERVATION') {
            newState = independentCount > 1 ? 'CONSOLIDATED' : 'SUPPORTED';
        } else {
            newState = 'RAW';
        }

        if (this.consolidationStates.get(claimId) !== newState) {
            this.consolidationStates.set(claimId, newState);
            if (!this._isRehydrating) {
                this.history.push({ type: 'CONSOLIDATION_CHANGE', claimId: claimId, state: newState, timestamp: new Date().toISOString() });
            }
        }
        return newState;
    }

    getConsolidatedState(claimId) {
        return this.consolidationStates.get(claimId) || 'RAW';
    }

    // VULN-01 Remediation: Rehydrate is READ-ONLY. Computes derived state locally.
    rehydrate() {
        let derivedStates = {}; // POJO
        
        for (let claimId of this.provenance.claims.keys()) {
            let record = this.provenance.claims.get(claimId); 
            if (!record) continue;

            let proposal = record.claimProposal;
            let independentCount = this._areSourcesIndependent(record.supports);

            let isConflicted = false;
            let conflictList = Array.from(this.provenance.conflicts.values());
            for (let c of conflictList) {
                if (c.status === 'OPEN' && (c.claimA.claimId === claimId || c.claimB.claimId === claimId)) {
                    isConflicted = true;
                    break;
                }
            }

            let newState = 'STRUCTURED';
            let type = proposal.knowledgeType || 'UNKNOWN';
            let epistemicallyRestricted = ['INFERENCE', 'OPINION', 'HYPOTHESIS', 'UNKNOWN', 'QUESTION', 'INSTRUCTION', 'USER_ASSERTION'];

            if (isConflicted) {
                newState = 'CONFLICTED';
            } else if (independentCount === 'COMPUTATION_BUDGET_EXCEEDED') {
                newState = 'UNCERTAIN';
            } else if (independentCount === 0) {
                newState = 'UNCERTAIN';
            } else if (epistemicallyRestricted.includes(type)) {
                newState = independentCount > 1 ? 'SUPPORTED' : 'UNCERTAIN';
            } else if (type === 'FACT' || type === 'OBSERVATION') {
                newState = independentCount > 1 ? 'CONSOLIDATED' : 'SUPPORTED';
            } else {
                newState = 'RAW';
            }
            
            derivedStates[claimId] = newState;
        }
        
        // Deep freeze POJO (keys and string values)
        return Object.freeze(derivedStates);
    }
}

class SemanticConsolidationPipeline {
    constructor(semanticOrchestrator, provenanceGraph, consolidationEngine) {
        this.semantic = semanticOrchestrator;
        this.provenance = provenanceGraph;
        this.engine = consolidationEngine;
    }

    async process(rawText, sourceData) {
        let semanticResult = await this.semantic.interpret(rawText);
        
        let claimsToProcess = [];
        if (semanticResult.candidates) {
            claimsToProcess = semanticResult.candidates;
        } else if (semanticResult.claimProposal) {
            claimsToProcess = [semanticResult];
        }

        let output = [];

        for (let candidate of claimsToProcess) {
            if (candidate.detectedIntent === 'ACTION_REQUEST') {
                output.push({ actionRequest: true, status: 'NO_ACTION_AUTHORIZED' });
                continue;
            }

            if (candidate.interpretationStatus === 'UNSUPPORTED' || candidate.interpretationStatus === 'INVALID') {
                output.push({ status: candidate.interpretationStatus });
                continue;
            }

            // Atomic stage integration
            let src = this.provenance.registerSource(sourceData);
            
            let claimSnapshot = this.provenance.registerClaim(candidate.claimProposal, src, candidate.evidenceSpans);

            if (Array.isArray(candidate.missingInformation)) {
                for (let missing of candidate.missingInformation) {
                    let desc = `Missing info: ${missing.info} (Priority: ${missing.type || 'USEFUL'})`;
                    let exists = Array.from(this.provenance.knowledgeGaps.values()).some(g => g.description === desc && g.relatedClaims.includes(claimSnapshot.claimId));
                    if (!exists) {
                        this.provenance.createKnowledgeGap(desc, [claimSnapshot.claimId], missing.type || 'USEFUL');
                    }
                }
            }

            let state = await this.engine.consolidateClaim(claimSnapshot.claimId);
            
            // SIDE-EFFECT SEPARATION: Create gaps for conflicts during ingestion only
            if (state === 'CONFLICTED') {
                let conflictList = Array.from(this.provenance.conflicts.values());
                for (let c of conflictList) {
                    if (c.status === 'OPEN' && (c.claimA.claimId === claimSnapshot.claimId || c.claimB.claimId === claimSnapshot.claimId)) {
                        let gapExists = Array.from(this.provenance.knowledgeGaps.values()).some(g => g.status === 'OPEN' && g.relatedClaims.includes(claimSnapshot.claimId));
                        if (!gapExists) {
                            this.provenance.createKnowledgeGap(`Resolution required for conflict ${c.conflictId}`, [claimSnapshot.claimId], 'INDISPENSABLE');
                        }
                    }
                }
            }

            output.push({
                claimId: claimSnapshot.claimId,
                consolidationState: state,
                claimProposal: claimSnapshot.claimProposal
            });
        }

        return output;
    }
}

module.exports = {
    IntegratedConsolidationEngine,
    EvidenceValidator,
    SemanticConsolidationPipeline
};
