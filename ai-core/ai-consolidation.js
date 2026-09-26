// ai-consolidation.js

class ConsolidationSchema {
    static validateRecord(record) {
        if (!record || !record.targetId) throw new Error("Consolidation record must have a targetId");
        const validStates = ['RAW', 'STRUCTURED', 'SUPPORTED', 'CONSOLIDATED', 'CONFLICTED', 'UNCERTAIN', 'SUPERSEDED'];
        if (!validStates.includes(record.state)) throw new Error(`Invalid state: ${record.state}`);
        
        return {
            id: record.id || `cons_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            targetId: record.targetId,
            targetType: record.targetType || 'UNKNOWN',
            state: record.state,
            primarySources: Array.isArray(record.primarySources) ? [...record.primarySources] : [],
            evidenceCount: record.evidenceCount || 0,
            createdAt: record.createdAt || new Date().toISOString(),
            updatedAt: record.updatedAt || new Date().toISOString()
        };
    }

    static validateConflict(conflict) {
        if (!conflict || !conflict.claimAId || !conflict.claimBId) throw new Error("Conflict record must have claimAId and claimBId");
        
        return {
            conflictId: conflict.conflictId || `conf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            claimAId: conflict.claimAId,
            claimBId: conflict.claimBId,
            provenanceA: conflict.provenanceA || null,
            provenanceB: conflict.provenanceB || null,
            status: conflict.status || 'UNRESOLVED', // UNRESOLVED, RESOLVED
            resolution: conflict.resolution || null,
            timestamp: conflict.timestamp || new Date().toISOString()
        };
    }

    static validateGap(gap) {
        if (!gap || !gap.conceptId || !gap.missingInfo) throw new Error("Gap must have conceptId and missingInfo");
        return {
            gapId: gap.gapId || `gap_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            conceptId: gap.conceptId,
            missingInfo: gap.missingInfo,
            reason: gap.reason || 'Not specified',
            status: gap.status || 'OPEN',
            createdAt: gap.createdAt || new Date().toISOString()
        };
    }

    static validateHistoryEvent(event) {
        return {
            id: event.id || `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            targetId: event.targetId,
            action: event.action,
            oldState: event.oldState,
            newState: event.newState,
            reason: event.reason,
            timestamp: event.timestamp || new Date().toISOString()
        };
    }
}

class KnowledgeConsolidationEngine {
    constructor(knowledgeManager, conceptRegistry, relationshipRegistry, store) {
        if (!store) throw new Error("KnowledgeConsolidationEngine requires a store");
        this.km = knowledgeManager;
        this.cr = conceptRegistry;
        this.rr = relationshipRegistry;
        this.store = store;
        
        this.colRecords = 'consolidation_records';
        this.colConflicts = 'consolidation_conflicts';
        this.colGaps = 'consolidation_gaps';
        this.colHistory = 'consolidation_history';
    }

    async _loadCol(col) {
        return (await this.store.load(col)) || [];
    }
    
    async _saveCol(col, data) {
        await this.store.save(col, data);
    }

    async _recordHistory(targetId, action, oldState, newState, reason) {
        const hist = await this._loadCol(this.colHistory);
        const event = ConsolidationSchema.validateHistoryEvent({ targetId, action, oldState, newState, reason });
        hist.push(event);
        await this._saveCol(this.colHistory, hist);
    }

    // Identifies whether sources are truly independent
    _areSourcesIndependent(sources) {
        // Anti-copy rule: if multiple sources share the exact same origin or are derived from each other, they are not independent.
        // For simplicity in this mock, we assume sources with the exact same prefix before '_' are the same family,
        // or just unique string matching. Real implementation would check provenance graph.
        const unique = new Set(sources.map(s => s.split('_')[0]));
        return unique.size;
    }

    async evaluateConcept(conceptId) {
        const concept = await this.cr.get(conceptId);
        if (!concept) throw new Error("Concept not found");

        const rels = await this.rr.getRelations(conceptId);
        
        // Find evidence
        let sources = [];
        let hasUserProvided = false;
        
        for (let r of rels) {
            if (r.provenance && r.provenance.sourceId) {
                sources.push(r.provenance.sourceId);
                if (r.provenance.sourceType === 'USER_PROVIDED') hasUserProvided = true;
            }
        }

        const indepCount = this._areSourcesIndependent(sources);

        let newState = 'STRUCTURED';
        if (hasUserProvided) {
            newState = 'CONSOLIDATED';
        } else if (indepCount > 1) {
            newState = 'CONSOLIDATED';
        } else if (indepCount === 1) {
            newState = 'SUPPORTED';
        } else if (rels.length === 0) {
            newState = 'RAW';
        }

        // Check for conflicts
        const conflicts = await this._loadCol(this.colConflicts);
        const isConflicted = conflicts.some(c => c.status === 'UNRESOLVED' && (c.claimAId === conceptId || c.claimBId === conceptId));
        if (isConflicted) newState = 'CONFLICTED';

        if (concept.status === 'SUPERSEDED') newState = 'SUPERSEDED';

        return await this._updateState(conceptId, 'CONCEPT', newState, indepCount, sources);
    }

    async evaluateRelationship(relId) {
        const rels = await this._loadCol(this.rr.collectionName);
        const rel = rels.find(r => r.id === relId);
        if (!rel) throw new Error("Relationship not found");

        if (rel.provenance && rel.provenance.knowledgeType === 'INFERENCE') {
            // An inference cannot become a FACT automatically.
            // It remains UNCERTAIN or SUPPORTED at best.
            return await this._updateState(relId, 'RELATIONSHIP', 'UNCERTAIN', 1, [rel.provenance.sourceId]);
        }

        let newState = 'STRUCTURED';
        if (rel.provenance && rel.provenance.sourceType === 'USER_PROVIDED') {
            newState = 'CONSOLIDATED';
        } else if (rel.provenance) {
            // Assuming 1 relation = 1 source. To consolidate, we need identical relations from different sources.
            const identicalRels = rels.filter(r => r.sourceConceptId === rel.sourceConceptId && r.targetConceptId === rel.targetConceptId && r.relationType === rel.relationType);
            const sources = identicalRels.map(r => r.provenance.sourceId);
            const indep = this._areSourcesIndependent(sources);
            if (indep > 1) newState = 'CONSOLIDATED';
            else if (indep === 1) newState = 'SUPPORTED';
        }

        if (rel.status === 'SUPERSEDED') newState = 'SUPERSEDED';
        else if (rel.status === 'CONFLICTED') newState = 'CONFLICTED';

        return await this._updateState(relId, 'RELATIONSHIP', newState, 1, [rel.provenance.sourceId]);
    }

    async _updateState(targetId, targetType, newState, evidenceCount, primarySources) {
        const records = await this._loadCol(this.colRecords);
        const existingIdx = records.findIndex(r => r.targetId === targetId);
        
        let oldState = 'NONE';
        let rec;
        if (existingIdx >= 0) {
            oldState = records[existingIdx].state;
            rec = records[existingIdx];
            rec.state = newState;
            rec.evidenceCount = evidenceCount;
            rec.primarySources = primarySources;
            rec.updatedAt = new Date().toISOString();
        } else {
            rec = ConsolidationSchema.validateRecord({
                targetId, targetType, state: newState, evidenceCount, primarySources
            });
            records.push(rec);
        }

        if (oldState !== newState) {
            await this._recordHistory(targetId, 'STATE_CHANGE', oldState, newState, 'Automatic evaluation');
        }

        await this._saveCol(this.colRecords, records);
        return rec;
    }

    async registerConflict(claimAId, claimBId, provenanceA, provenanceB) {
        const conflicts = await this._loadCol(this.colConflicts);
        const conf = ConsolidationSchema.validateConflict({ claimAId, claimBId, provenanceA, provenanceB });
        conflicts.push(conf);
        await this._saveCol(this.colConflicts, conflicts);
        await this._recordHistory(conf.conflictId, 'CONFLICT_REGISTERED', 'NONE', 'UNRESOLVED', 'Conflicting claims detected');
        
        // Re-evaluate affected items
        await this.evaluateConcept(claimAId).catch(()=>{});
        await this.evaluateConcept(claimBId).catch(()=>{});
        
        return conf;
    }

    async resolveConflict(conflictId, resolutionText, winningClaimId) {
        const conflicts = await this._loadCol(this.colConflicts);
        const conf = conflicts.find(c => c.conflictId === conflictId);
        if (!conf) throw new Error("Conflict not found");

        conf.status = 'RESOLVED';
        conf.resolution = resolutionText;
        conf.timestamp = new Date().toISOString();

        await this._saveCol(this.colConflicts, conflicts);
        await this._recordHistory(conflictId, 'CONFLICT_RESOLVED', 'UNRESOLVED', 'RESOLVED', resolutionText);

        // Does not delete the losing claim, it might be set to SUPERSEDED manually or via relation status.
        return conf;
    }

    async registerGap(conceptId, missingInfo, reason) {
        const gaps = await this._loadCol(this.colGaps);
        const gap = ConsolidationSchema.validateGap({ conceptId, missingInfo, reason });
        gaps.push(gap);
        await this._saveCol(this.colGaps, gaps);
        await this._recordHistory(gap.gapId, 'GAP_REGISTERED', 'NONE', 'OPEN', reason);
        return gap;
    }

    async getState(targetId) {
        const records = await this._loadCol(this.colRecords);
        return records.find(r => r.targetId === targetId) || null;
    }
    
    async getHistory(targetId) {
        const hist = await this._loadCol(this.colHistory);
        return hist.filter(h => h.targetId === targetId);
    }
}

if (typeof window !== 'undefined') {
    if (!window.AI_CORE) window.AI_CORE = {};
    window.AI_CORE.ConsolidationSchema = ConsolidationSchema;
    window.AI_CORE.KnowledgeConsolidationEngine = KnowledgeConsolidationEngine;
}
if (typeof module !== 'undefined') {
    module.exports = { ConsolidationSchema, KnowledgeConsolidationEngine };
}
