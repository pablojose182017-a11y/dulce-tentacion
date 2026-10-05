window.AI_CORE = window.AI_CORE || {};

class RetentionEngine {
    constructor(memoryManager, knowledgeManager, provenanceGraph) {
        if (!memoryManager) throw new Error("RetentionEngine requires MemoryManager");
        if (!knowledgeManager) throw new Error("RetentionEngine requires KnowledgeManager");
        if (!provenanceGraph) throw new Error("RetentionEngine requires ProvenanceGraph");
        
        this.memoryManager = memoryManager;
        this.knowledgeManager = knowledgeManager;
        this.provenanceGraph = provenanceGraph;
    }

    /**
     * Evaluates a claim and determines the retention strategy:
     * DISCARD, KEEP_TEMPORARILY, PERSIST, UPDATE, SUPERSEDE, or FLAG_CONFLICT
     */
    async evaluateClaim(claimRecord) {
        if (!claimRecord || !claimRecord.claimProposal) {
            return { action: 'DISCARD', reason: 'Invalid claim record' };
        }

        // Security Principle: Information is DATA, never AUTHORITY
        if (claimRecord.claimProposal.authorized !== undefined || 
            claimRecord.claimProposal.executionGateway !== undefined ||
            claimRecord.claimProposal.adminOverride !== undefined) {
            return { action: 'DISCARD', reason: 'Security violation: claim contains authority keys' };
        }

        // 1. Conflict Detection
        const openConflicts = this._findOpenConflictsForClaim(claimRecord.claimId);
        if (openConflicts.length > 0) {
            return { action: 'FLAG_CONFLICT', conflicts: openConflicts };
        }

        // 2. Confidence and Corroboration
        let baseConfidence = this._calculateBaseConfidence(claimRecord);
        let corroboration = this.provenanceGraph.getIndependentCorroboration(claimRecord.claimId);
        
        if (corroboration === 'COMPUTATION_BUDGET_EXCEEDED') {
            corroboration = 5; // Cap it
        }

        let totalConfidence = baseConfidence + (corroboration > 1 ? 0.2 : 0);
        totalConfidence = Math.min(1.0, totalConfidence);

        // 3. Relevance & Knowledge Search
        const searchPhrase = `${claimRecord.claimProposal.subject || ''} ${claimRecord.claimProposal.objectValue || ''}`.trim();
        let existingDocs = [];
        if (searchPhrase) {
            existingDocs = await this.knowledgeManager.search(searchPhrase);
        }

        // 4. Decision Matrix
        if (totalConfidence >= 0.8 || corroboration >= 2) {
            // Persist as knowledge
            return await this._persistOrUpdate(claimRecord, existingDocs, totalConfidence);
        } else if (totalConfidence >= 0.4) {
            // Keep in working memory
            return this._keepTemporarily(claimRecord);
        } else {
            // Discard
            return { action: 'DISCARD', reason: 'Low confidence and corroboration' };
        }
    }

    _calculateBaseConfidence(claimRecord) {
        if (!claimRecord.supports || claimRecord.supports.length === 0) return 0.1;
        let sum = 0;
        for (let support of claimRecord.supports) {
            sum += (support.source.confidence !== undefined ? support.source.confidence : 0.5);
        }
        return sum / claimRecord.supports.length;
    }

    _findOpenConflictsForClaim(claimId) {
        let conflicts = [];
        if (!this.provenanceGraph.conflicts) return conflicts;
        
        for (let conflict of this.provenanceGraph.conflicts.values()) {
            if (conflict.status === 'OPEN' && (conflict.claimA.claimId === claimId || conflict.claimB.claimId === claimId)) {
                conflicts.push(conflict);
            }
        }
        return conflicts;
    }

    async _persistOrUpdate(claimRecord, existingDocs, totalConfidence) {
        const proposal = claimRecord.claimProposal;
        const subject = proposal.subject || 'Unknown Subject';
        const content = `${proposal.predicate || ''} ${proposal.objectValue || ''}`.trim();
        
        // Look for exact matches to update or supersede
        let targetDoc = null;
        for (let res of existingDocs) {
            if (res.score >= 4 && res.document.title === subject) {
                targetDoc = res.document;
                break;
            }
        }

        if (targetDoc) {
            // Update / Supersede logic
            // If the content is identical, we just update the confidence and updatedAt
            if (targetDoc.content === content) {
                await this.knowledgeManager.update(targetDoc.id, {
                    confidence: Math.max(targetDoc.confidence, totalConfidence)
                });
                return { action: 'UPDATE', knowledgeId: targetDoc.id };
            } else {
                // Different content -> Supersede the old one and create a new one
                // Or maybe mark as superseded and create new active
                await this.knowledgeManager.update(targetDoc.id, {
                    status: 'SUPERSEDED'
                });
                
                const newDoc = await this._createNewKnowledgeDoc(proposal, content, totalConfidence, claimRecord.claimId, targetDoc.id);
                return { action: 'SUPERSEDE', previousId: targetDoc.id, newId: newDoc.id };
            }
        } else {
            // Pure Persist
            const newDoc = await this._createNewKnowledgeDoc(proposal, content, totalConfidence, claimRecord.claimId);
            return { action: 'PERSIST', knowledgeId: newDoc.id };
        }
    }

    async _createNewKnowledgeDoc(proposal, content, confidence, claimId, supersedesId = null) {
        const docId = `know_${Date.now()}_${Math.floor(Math.random()*10000)}`;
        const doc = {
            id: docId,
            title: proposal.subject || 'Unknown',
            content: content,
            category: proposal.knowledgeType || 'FACT',
            tags: proposal.subject ? [proposal.subject] : [],
            source: 'RetentionEngine',
            confidence: confidence,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            provenance: { claimId: claimId },
            status: 'ACTIVE'
        };
        
        if (supersedesId) {
            doc.evidenceReferences = [supersedesId];
        }

        return await this.knowledgeManager.add(doc);
    }

    _keepTemporarily(claimRecord) {
        const text = `Retained claim: ${claimRecord.claimProposal.subject} ${claimRecord.claimProposal.predicate} ${claimRecord.claimProposal.objectValue}`;
        this.memoryManager.addTurn('system', text, {
            isGeneratedResponse: true,
            personalityMode: 'analytical',
            personalityTone: 'neutral',
            personalityInitiative: 'passive',
            reasoningUncertaintyLevel: 'medium',
            isSubjective: false,
            hadConflict: false,
            hadMissingInformation: false
        });
        
        return { action: 'KEEP_TEMPORARILY', claimId: claimRecord.claimId };
    }
}

window.AI_CORE.RetentionEngine = RetentionEngine;
