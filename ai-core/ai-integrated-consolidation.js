const crypto = require('crypto');

class IntegratedConsolidationEngine {
    constructor(provenanceGraph) {
        this.provenance = provenanceGraph;
        this.consolidationStates = new Map(); // targetId -> state
        this.history = [];
    }

    _areSourcesIndependent(supports) {
        if (!Array.isArray(supports)) return 0;
        let roots = new Set();
        for (let s of supports) {
            if (!s || !s.source) continue;
            let current = s.source;
            let visited = new Set();
            while (current) {
                if (visited.has(current.sourceId)) break;
                visited.add(current.sourceId);
                let parentId = current.copiedFrom || current.derivedFrom || current.transformedFrom || current.parentSourceId;
                if (!parentId) break;
                let next = this.provenance.sources.get(parentId);
                if (!next) break;
                current = next;
            }
            roots.add(current.sourceId);
        }
        return roots.size;
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
        } else if (independentCount === 0) {
            newState = 'UNCERTAIN';
        } else if (epistemicallyRestricted.includes(type)) {
            // Cap at SUPPORTED
            newState = independentCount > 1 ? 'SUPPORTED' : 'UNCERTAIN';
        } else if (type === 'FACT' || type === 'OBSERVATION') {
            // Can escalate to CONSOLIDATED if independent sources corroborate
            newState = independentCount > 1 ? 'CONSOLIDATED' : 'SUPPORTED';
        } else {
            newState = 'RAW';
        }

        if (this.consolidationStates.get(claimId) !== newState) {
            this.consolidationStates.set(claimId, newState);
            this.history.push({ type: 'CONSOLIDATION_CHANGE', claimId: claimId, state: newState, timestamp: new Date().toISOString() });
        }
        return newState;
    }

    getConsolidatedState(claimId) {
        return this.consolidationStates.get(claimId) || 'RAW';
    }

    // VULN-01 Remediation: Do not persist the cache. Rehydrate safely from the Immutable Provenance Graph.
    async rehydrate() {
        let oldStates = new Map(this.consolidationStates);
        this.consolidationStates.clear();
        
        try {
            for (let claimId of this.provenance.claims.keys()) {
                await this.consolidateClaim(claimId);
            }
        } catch(e) {
            this.consolidationStates = oldStates;
            throw new Error("Failed to rehydrate logical state. Rollback applied.");
        }
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
    SemanticConsolidationPipeline
};
