const crypto = require('crypto');

class IntegratedConsolidationEngine {
    constructor(provenanceGraph) {
        this.provenance = provenanceGraph;
        this.consolidationStates = new Map(); // targetId -> state
        this.history = [];
    }

    _areSourcesIndependent(supports) {
        let roots = new Set();
        for (let s of supports) {
            // Find root
            let current = s.source;
            let visited = new Set();
            while (current && current.copiedFrom) {
                if (visited.has(current.sourceId)) break;
                visited.add(current.sourceId);
                current = this.provenance.sources.get(current.copiedFrom) || current; // Wait, sources are in graph!
            }
            roots.add(current.sourceId);
        }
        return roots.size;
    }

    async consolidateClaim(claimId) {
        let record = this.provenance.claims.get(claimId); // Direct internal access is allowed for the Engine if they are integrated. But wait, provenance graph should be accessed via safe APIs? ProvenanceGraph doesn't have a getClaim API. I will use a safe access or just read the map since it's the engine. Actually, let's just read it.
        if (!record) return null;

        let proposal = record.claimProposal;
        
        let independentCount = this._areSourcesIndependent(record.supports);
        let hasUserProvided = record.supports.some(s => s.source.sourceType === 'USER_PROVIDED');

        let isConflicted = false;
        let conflictList = Array.from(this.provenance.conflicts.values());
        for (let c of conflictList) {
            if (c.status === 'OPEN' && (c.claimA.claimId === claimId || c.claimB.claimId === claimId)) {
                isConflicted = true;
                
                // Generar KnowledgeGap si falta info y no existe ya
                let gapExists = Array.from(this.provenance.knowledgeGaps.values()).some(g => g.status === 'OPEN' && g.relatedClaims.includes(claimId));
                if (!gapExists) {
                    this.provenance.createKnowledgeGap(`Resolution required for conflict ${c.conflictId}`, [claimId], 'INDISPENSABLE');
                }
            }
        }

        let newState = 'STRUCTURED';

        if (isConflicted) {
            newState = 'CONFLICTED';
        } else if (proposal.knowledgeType === 'INFERENCE') {
            // INFERENCE cannot ascend to FACT automatically
            newState = independentCount > 1 ? 'SUPPORTED' : 'UNCERTAIN';
        } else if (hasUserProvided) {
            // User provided does not ascend to absolute FACT automatically outside its context, but it consolidates
            newState = 'CONSOLIDATED';
        } else if (independentCount > 1) {
            newState = 'CONSOLIDATED';
        } else if (independentCount === 1) {
            newState = 'SUPPORTED';
        } else {
            newState = 'RAW';
        }

        this.consolidationStates.set(claimId, newState);
        return newState;
    }

    getConsolidatedState(claimId) {
        return this.consolidationStates.get(claimId) || 'RAW';
    }

    serialize() {
        return JSON.stringify({
            states: Array.from(this.consolidationStates.entries()),
            history: this.history
        });
    }

    deserialize(dataStr) {
        let data = JSON.parse(dataStr);
        this.consolidationStates = new Map(data.states);
        this.history = data.history || [];
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

            let state = await this.engine.consolidateClaim(claimSnapshot.claimId);
            
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
