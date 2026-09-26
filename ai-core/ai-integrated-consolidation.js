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
        let record = this.provenance.claims.get(claimId); 
        if (!record) return null;

        let proposal = record.claimProposal;
        
        let independentCount = this._areSourcesIndependent(record.supports);
        let hasUserProvided = record.supports.some(s => s.source.sourceType === 'USER_PROVIDED');

        let isConflicted = false;
        let conflictList = Array.from(this.provenance.conflicts.values());
        for (let c of conflictList) {
            if (c.status === 'OPEN' && (c.claimA.claimId === claimId || c.claimB.claimId === claimId)) {
                isConflicted = true;
                
                let gapExists = Array.from(this.provenance.knowledgeGaps.values()).some(g => g.status === 'OPEN' && g.relatedClaims.includes(claimId));
                if (!gapExists) {
                    this.provenance.createKnowledgeGap(`Resolution required for conflict ${c.conflictId}`, [claimId], 'INDISPENSABLE');
                }
            }
        }

        let newState = 'STRUCTURED';
        let type = proposal.knowledgeType || 'UNKNOWN';
        let epistemicallyRestricted = ['INFERENCE', 'OPINION', 'HYPOTHESIS', 'UNKNOWN', 'QUESTION', 'INSTRUCTION'];

        if (isConflicted) {
            newState = 'CONFLICTED';
        } else if (epistemicallyRestricted.includes(type)) {
            newState = independentCount > 1 ? 'SUPPORTED' : 'UNCERTAIN';
        } else if (hasUserProvided) {
            newState = 'CONSOLIDATED';
        } else if (independentCount > 1) {
            newState = 'CONSOLIDATED';
        } else if (independentCount === 1) {
            newState = 'SUPPORTED';
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

    serialize() {
        return JSON.stringify({
            states: Array.from(this.consolidationStates.entries()),
            history: this.history
        });
    }

    deserialize(dataStr) {
        let data;
        try {
            data = JSON.parse(dataStr);
        } catch(e) {
            throw new Error("Invalid JSON");
        }

        if (!data || !Array.isArray(data.states) || !Array.isArray(data.history)) {
            throw new Error("Invalid schema");
        }

        let tempStates = new Map();
        for (let [id, state] of data.states) {
            if (typeof id !== 'string' || typeof state !== 'string') throw new Error("Invalid state entry");
            const validStates = ['RAW', 'STRUCTURED', 'SUPPORTED', 'CONSOLIDATED', 'CONFLICTED', 'UNCERTAIN', 'SUPERSEDED', 'NO_ACTION_AUTHORIZED'];
            if (!validStates.includes(state)) throw new Error("Invalid consolidation state");
            tempStates.set(id, state);
        }

        let tempHistory = [];
        for (let event of data.history) {
            if (!event || typeof event.type !== 'string' || typeof event.timestamp !== 'string') throw new Error("Invalid history event");
            tempHistory.push({ type: event.type, claimId: event.claimId, state: event.state, timestamp: event.timestamp, details: event.details });
        }

        this.consolidationStates = tempStates;
        this.history = tempHistory;
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
