const crypto = require('crypto');
const { SemanticComparator } = require('./ai-semantic.js');

class SourceProvenance {
    constructor(data) {
        this.sourceId = data.sourceId || crypto.randomUUID();
        this.sourceType = data.sourceType || 'UNKNOWN';
        this.origin = data.origin || 'UNKNOWN';
        this.author = data.author || 'UNKNOWN';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.observedAt = data.observedAt || new Date().toISOString();
        
        // Canonical Content Fingerprint Fix
        let computed = data.content ? crypto.createHash('sha256').update(data.content).digest('hex') : null;
        this.declaredContentFingerprint = data.contentFingerprint || null;
        this.fingerprintMismatch = (computed && this.declaredContentFingerprint && computed !== this.declaredContentFingerprint) || false;
        
        // computed ALWAYS wins if available
        this.contentFingerprint = computed || this.declaredContentFingerprint;
        
        this.sourceFingerprint = crypto.createHash('sha256').update(this.sourceId + (this.contentFingerprint || '')).digest('hex');
        
        this.parentSourceId = data.parentSourceId || null;
        this.derivedFrom = data.derivedFrom || null;
        this.copiedFrom = data.copiedFrom || null;
        this.transformedFrom = data.transformedFrom || null;
        this.transformationType = data.transformationType || 'UNKNOWN';
        
        this.scope = data.scope || 'GLOBAL';
        this.language = data.language || 'UNKNOWN';
        this.confidence = data.confidence !== undefined ? data.confidence : 1.0;
        
        this.independenceStatus = data.independenceStatus || this._calculateIndependence(data);
        this.provenanceVersion = '1.0';
        
        this._deepFreeze(this);
    }
    
    _calculateIndependence(data) {
        if (data.copiedFrom) return 'COPIED';
        if (data.derivedFrom || data.transformedFrom) return 'DERIVED';
        return 'INDEPENDENT'; 
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

class ClaimIdentity {
    static generate(claimProposal) {
        let clean = {
            subject: claimProposal.subject || '',
            predicate: claimProposal.predicate || '',
            objectValue: claimProposal.objectValue || '',
            unit: claimProposal.unit || '',
            scope: claimProposal.scope || '',
            temporalContext: claimProposal.temporalContext || '',
            isNegated: claimProposal.isNegated || false,
            knowledgeType: claimProposal.knowledgeType || ''
        };
        let str = JSON.stringify(clean, Object.keys(clean).sort());
        return crypto.createHash('sha256').update(str).digest('hex');
    }
}

class ProvenanceGraph {
    constructor() {
        this.sources = new Map();
        this.claims = new Map(); 
        this.conflicts = new Map();
        this.knowledgeGaps = new Map();
        this.contentHashes = new Map(); 
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

    _checkDeepCycle(newSourceId, parentId) {
        if (!parentId) return;
        if (newSourceId === parentId) throw new Error("Cyclic provenance detected");
        
        let visited = new Set();
        let currentId = parentId;
        
        while (currentId) {
            if (currentId === newSourceId) throw new Error("Cyclic provenance detected");
            if (visited.has(currentId)) break; 
            visited.add(currentId);
            
            let parent = this.sources.get(currentId);
            if (!parent) break;
            currentId = parent.copiedFrom || parent.derivedFrom || parent.transformedFrom || parent.parentSourceId;
        }
    }

    registerSource(data) {
        let cleanData = { ...data };
        delete cleanData.authorized;
        delete cleanData.executionGateway;
        
        if (cleanData.copiedFrom && cleanData.independenceStatus === 'INDEPENDENT') {
            cleanData.independenceStatus = 'COPIED'; 
        }

        // Deep Cycle Check
        if (cleanData.copiedFrom) this._checkDeepCycle(cleanData.sourceId || data.sourceId, cleanData.copiedFrom);
        if (cleanData.derivedFrom) this._checkDeepCycle(cleanData.sourceId || data.sourceId, cleanData.derivedFrom);
        if (cleanData.transformedFrom) this._checkDeepCycle(cleanData.sourceId || data.sourceId, cleanData.transformedFrom);
        if (cleanData.parentSourceId) this._checkDeepCycle(cleanData.sourceId || data.sourceId, cleanData.parentSourceId);
        
        let src = new SourceProvenance(cleanData);
        
        if (this.sources.has(src.sourceId)) {
            return this.sources.get(src.sourceId);
        }

        if (src.contentFingerprint) {
            if (this.contentHashes.has(src.contentFingerprint)) {
                let existingId = this.contentHashes.get(src.contentFingerprint);
                src = new SourceProvenance({ ...cleanData, independenceStatus: 'DUPLICATE', copiedFrom: existingId });
            } else {
                this.contentHashes.set(src.contentFingerprint, src.sourceId);
            }
        }

        this.sources.set(src.sourceId, src);
        return src;
    }

    _safeSnapshot(obj) {
        if (!obj) return null;
        let clone = JSON.parse(JSON.stringify(obj));
        return this._deepFreeze(clone);
    }

    registerClaim(claimProposal, sourceProvenance, evidence) {
        let cleanProp = { ...claimProposal };
        delete cleanProp.authorized;
        delete cleanProp.executionGateway;

        let claimId = ClaimIdentity.generate(cleanProp);
        
        let record = this.claims.get(claimId);
        if (!record) {
            record = {
                claimId,
                claimProposal: cleanProp,
                supports: []
            };
            this.claims.set(claimId, record);
        }

        let existingSupport = record.supports.find(s => s.source.sourceId === sourceProvenance.sourceId);
        if (!existingSupport) {
            record.supports.push({ source: sourceProvenance, evidence });
        }

        this._evaluateConflicts(record);
        return this._safeSnapshot(record);
    }

    _evaluateConflicts(newClaimRecord) {
        for (let [existingClaimId, existingRecord] of this.claims.entries()) {
            if (existingClaimId === newClaimRecord.claimId) continue;
            
            let rel = SemanticComparator.compare(
                { detectedIntent: newClaimRecord.claimProposal.intent || 'UNKNOWN', claimProposal: newClaimRecord.claimProposal },
                { detectedIntent: existingRecord.claimProposal.intent || 'UNKNOWN', claimProposal: existingRecord.claimProposal }
            );

            if (rel === 'SEMANTICALLY_INCOMPATIBLE') {
                this._registerConflict(newClaimRecord, existingRecord, this._classifyConflictType(newClaimRecord, existingRecord));
            }
        }
    }

    _classifyConflictType(c1, c2) {
        let p1 = c1.claimProposal;
        let p2 = c2.claimProposal;
        if (p1.isNegated !== p2.isNegated) return 'LOGICAL_CONTRADICTION';
        if (p1.objectValue !== p2.objectValue && !isNaN(Number(p1.objectValue))) return 'NUMERIC_CONFLICT';
        return 'VALUE_CONFLICT';
    }

    _registerConflict(claimA, claimB, conflictType) {
        let ids = [claimA.claimId, claimB.claimId].sort();
        let conflictId = crypto.createHash('sha256').update(ids[0] + ids[1]).digest('hex');
        if (this.conflicts.has(conflictId)) return this.conflicts.get(conflictId);
        
        // Clone claims to prevent freezing the shared objects in this.claims map
        let cloneA = JSON.parse(JSON.stringify(claimA));
        let cloneB = JSON.parse(JSON.stringify(claimB));

        let conflict = {
            conflictId,
            conflictType,
            status: 'OPEN',
            claimA: cloneA,
            claimB: cloneB,
            detectedAt: new Date().toISOString(),
            resolutionHistory: []
        };
        
        this._deepFreeze(conflict);
        this.conflicts.set(conflictId, conflict);
        return conflict;
    }
    
    getConflict(conflictId) {
        return this.conflicts.get(conflictId) || null;
    }

    resolveConflict(conflictId, resolutionMsg) {
        let existing = this.conflicts.get(conflictId);
        if (!existing) return null;
        let nextConflict = JSON.parse(JSON.stringify(existing)); // deep clone
        nextConflict.status = 'RESOLVED';
        nextConflict.resolutionHistory.push(resolutionMsg);
        this._deepFreeze(nextConflict);
        this.conflicts.set(conflictId, nextConflict);
        return nextConflict;
    }

    getIndependentCorroboration(claimId) {
        let record = this.claims.get(claimId);
        if (!record) return 0;
        
        let roots = new Set();
        for (let support of record.supports) {
            let root = this._findRootSource(support.source);
            roots.add(root.sourceId);
        }
        return roots.size;
    }

    _findRootSource(source) {
        let current = source;
        let visited = new Set();
        while ((current.copiedFrom || current.derivedFrom || current.transformedFrom || current.parentSourceId) && !visited.has(current.sourceId)) {
            visited.add(current.sourceId);
            let parentId = current.copiedFrom || current.derivedFrom || current.transformedFrom || current.parentSourceId;
            let parent = this.sources.get(parentId);
            if (parent) {
                current = parent;
            } else {
                break;
            }
        }
        return current;
    }

    createKnowledgeGap(description, relatedClaims, priority = 'USEFUL') {
        let gapId = crypto.createHash('sha256').update(description).digest('hex');
        
        let newRelatedClaims = [...relatedClaims];
        if (this.knowledgeGaps.has(gapId)) {
            let existingGap = this.knowledgeGaps.get(gapId);
            let combinedClaims = new Set([...existingGap.relatedClaims, ...relatedClaims]);
            newRelatedClaims = Array.from(combinedClaims);
            if (newRelatedClaims.length === existingGap.relatedClaims.length) {
                return existingGap;
            }
        }
        
        let gap = {
            gapId,
            description,
            relatedClaims: newRelatedClaims,
            priority,
            status: 'OPEN',
            createdAt: new Date().toISOString()
        };
        this._deepFreeze(gap);
        this.knowledgeGaps.set(gapId, gap);
        return gap;
    }

    getKnowledgeGap(gapId) {
        return this.knowledgeGaps.get(gapId) || null;
    }

    resolveKnowledgeGap(gapId, resolutionMsg) {
        let existing = this.knowledgeGaps.get(gapId);
        if (!existing) return null;
        let nextGap = JSON.parse(JSON.stringify(existing));
        nextGap.status = 'RESOLVED';
        nextGap.resolutionHistory = nextGap.resolutionHistory || [];
        nextGap.resolutionHistory.push(resolutionMsg);
        this._deepFreeze(nextGap);
        this.knowledgeGaps.set(gapId, nextGap);
        return nextGap;
    }

    serialize() {
        return JSON.stringify({
            sources: Array.from(this.sources.entries()),
            claims: Array.from(this.claims.entries()),
            conflicts: Array.from(this.conflicts.entries()),
            knowledgeGaps: Array.from(this.knowledgeGaps.entries())
        });
    }

    deserialize(dataStr) {
        let data;
        try {
            data = JSON.parse(dataStr);
        } catch (e) {
            throw new Error("Invalid JSON");
        }

        if (!Array.isArray(data.sources) || !Array.isArray(data.claims) || !Array.isArray(data.conflicts) || !Array.isArray(data.knowledgeGaps)) {
            throw new Error("Invalid serialized state structure");
        }

        let tempSources = new Map();
        let tempClaims = new Map();
        let tempConflicts = new Map();
        let tempGaps = new Map();
        let tempContentHashes = new Map();

        // 1. Rehydrate Sources
        for (let [id, srcData] of data.sources) {
            if (srcData.authorized !== undefined || srcData.executionGateway) throw new Error("Poison detected in serialized source");
            
            let cleanSrcData = { ...srcData };
            if (cleanSrcData.copiedFrom && cleanSrcData.independenceStatus === 'INDEPENDENT') {
                cleanSrcData.independenceStatus = 'COPIED';
            }
            
            let src = new SourceProvenance(cleanSrcData);
            tempSources.set(id, src);
            if (src.contentFingerprint && src.independenceStatus !== 'DUPLICATE') {
                tempContentHashes.set(src.contentFingerprint, src.sourceId);
            }
        }

        // Cycle check
        for (let src of tempSources.values()) {
            let parentId = src.copiedFrom || src.derivedFrom || src.transformedFrom || src.parentSourceId;
            if (parentId) {
                let visited = new Set();
                let currentId = parentId;
                while (currentId) {
                    if (currentId === src.sourceId) throw new Error("Cyclic provenance detected in serialized data");
                    if (visited.has(currentId)) break;
                    visited.add(currentId);
                    let parent = tempSources.get(currentId);
                    if (!parent) break;
                    currentId = parent.copiedFrom || parent.derivedFrom || parent.transformedFrom || parent.parentSourceId;
                }
            }
        }

        // 2. Rehydrate Claims
        for (let [id, claimData] of data.claims) {
            if (claimData.claimProposal && (claimData.claimProposal.authorized !== undefined || claimData.claimProposal.executionGateway)) {
                throw new Error("Poison detected in serialized claim");
            }
            
            let record = {
                claimId: id,
                claimProposal: { ...claimData.claimProposal },
                supports: []
            };
            
            if (Array.isArray(claimData.supports)) {
                for (let s of claimData.supports) {
                    if (!s.source || !tempSources.has(s.source.sourceId)) throw new Error("Claim references missing source");
                    record.supports.push({
                        source: tempSources.get(s.source.sourceId),
                        evidence: s.evidence
                    });
                }
            }
            tempClaims.set(id, record);
        }

        // 3. Rehydrate Conflicts
        for (let [id, confData] of data.conflicts) {
            if (!tempClaims.has(confData.claimA.claimId) || !tempClaims.has(confData.claimB.claimId)) {
                throw new Error("Conflict references missing claim");
            }
            let conflict = {
                conflictId: id,
                conflictType: confData.conflictType,
                status: confData.status,
                claimA: JSON.parse(JSON.stringify(confData.claimA)),
                claimB: JSON.parse(JSON.stringify(confData.claimB)),
                detectedAt: confData.detectedAt,
                resolutionHistory: [...(confData.resolutionHistory || [])]
            };
            this._deepFreeze(conflict);
            tempConflicts.set(id, conflict);
        }

        // 4. Rehydrate Gaps
        for (let [id, gapData] of data.knowledgeGaps) {
            let gap = {
                gapId: id,
                description: gapData.description,
                relatedClaims: [...(gapData.relatedClaims || [])],
                priority: gapData.priority,
                status: gapData.status,
                createdAt: gapData.createdAt,
                resolutionHistory: [...(gapData.resolutionHistory || [])]
            };
            this._deepFreeze(gap);
            tempGaps.set(id, gap);
        }

        // Atomic commit
        this.sources = tempSources;
        this.claims = tempClaims;
        this.conflicts = tempConflicts;
        this.knowledgeGaps = tempGaps;
        this.contentHashes = tempContentHashes;
    }
}

module.exports = {
    SourceProvenance,
    ClaimIdentity,
    ProvenanceGraph
};
