import os
import re

prov_path = r'c:\Users\PABLO\Documents\dulce-tentacion\ai-core\ai-provenance.js'
cons_path = r'c:\Users\PABLO\Documents\dulce-tentacion\ai-core\ai-integrated-consolidation.js'

with open(prov_path, 'r', encoding='utf-8') as f:
    prov = f.read()

# ai-provenance.js modifications

prov = prov.replace('''class SourceProvenance {
    constructor(data) {''', '''class SourceProvenance {
    _normalizeArray(val) {
        if (val === undefined || val === null) return [];
        if (Array.isArray(val)) return val;
        return [val];
    }
    
    constructor(data) {''')

prov = prov.replace('''        this.parentSourceId = data.parentSourceId || null;
        this.derivedFrom = data.derivedFrom || null;
        this.copiedFrom = data.copiedFrom || null;
        this.transformedFrom = data.transformedFrom || null;''', '''        this.parentSourceIds = this._normalizeArray(data.parentSourceIds || data.parentSourceId);
        this.derivedFromIds = this._normalizeArray(data.derivedFromIds || data.derivedFrom);
        this.copiedFromIds = this._normalizeArray(data.copiedFromIds || data.copiedFrom);
        this.transformedFromIds = this._normalizeArray(data.transformedFromIds || data.transformedFrom);
        
        this.parentSourceId = this.parentSourceIds[0] || null;
        this.derivedFrom = this.derivedFromIds[0] || null;
        this.copiedFrom = this.copiedFromIds[0] || null;
        this.transformedFrom = this.transformedFromIds[0] || null;''')

prov = prov.replace('''    _checkDeepCycle(newSourceId, parentId) {
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
    }''', '''    _getCausalParentIds(source) {
        if (!source) return [];
        let parents = new Set();
        if (source.parentSourceIds) source.parentSourceIds.forEach(id => parents.add(id));
        if (source.derivedFromIds) source.derivedFromIds.forEach(id => parents.add(id));
        if (source.copiedFromIds) source.copiedFromIds.forEach(id => parents.add(id));
        if (source.transformedFromIds) source.transformedFromIds.forEach(id => parents.add(id));
        
        if (source.parentSourceId) parents.add(source.parentSourceId);
        if (source.derivedFrom) parents.add(source.derivedFrom);
        if (source.copiedFrom) parents.add(source.copiedFrom);
        if (source.transformedFrom) parents.add(source.transformedFrom);
        
        return Array.from(parents);
    }

    _checkDeepCycle(newSourceId, parentIds) {
        if (!parentIds) return;
        let parents = Array.isArray(parentIds) ? parentIds : [parentIds];
        for (let pId of parents) {
            if (!pId) continue;
            if (newSourceId === pId) throw new Error("Cyclic provenance detected");
            let queue = [pId];
            let visited = new Set();
            while(queue.length > 0) {
                let currentId = queue.shift();
                if (currentId === newSourceId) throw new Error("Cyclic provenance detected");
                if (visited.has(currentId)) continue;
                visited.add(currentId);
                let parent = this.sources.get(currentId);
                if (parent) {
                    let nextParents = this._getCausalParentIds(parent);
                    queue.push(...nextParents);
                }
            }
        }
    }''')

prov = prov.replace('''        // Deep Cycle Check
        if (cleanData.copiedFrom) this._checkDeepCycle(cleanData.sourceId || data.sourceId, cleanData.copiedFrom);
        if (cleanData.derivedFrom) this._checkDeepCycle(cleanData.sourceId || data.sourceId, cleanData.derivedFrom);
        if (cleanData.transformedFrom) this._checkDeepCycle(cleanData.sourceId || data.sourceId, cleanData.transformedFrom);
        if (cleanData.parentSourceId) this._checkDeepCycle(cleanData.sourceId || data.sourceId, cleanData.parentSourceId);''', '''        // Deep Cycle Check
        let allParents = new Set();
        if (cleanData.copiedFromIds) cleanData.copiedFromIds.forEach(id => allParents.add(id));
        if (cleanData.derivedFromIds) cleanData.derivedFromIds.forEach(id => allParents.add(id));
        if (cleanData.transformedFromIds) cleanData.transformedFromIds.forEach(id => allParents.add(id));
        if (cleanData.parentSourceIds) cleanData.parentSourceIds.forEach(id => allParents.add(id));
        if (cleanData.copiedFrom) allParents.add(cleanData.copiedFrom);
        if (cleanData.derivedFrom) allParents.add(cleanData.derivedFrom);
        if (cleanData.transformedFrom) allParents.add(cleanData.transformedFrom);
        if (cleanData.parentSourceId) allParents.add(cleanData.parentSourceId);
        
        this._checkDeepCycle(cleanData.sourceId || data.sourceId, Array.from(allParents));''')

prov = prov.replace('''    _findRootSource(source) {
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
    }''', '''    _findRootSources(source) {
        if (!source) return new Set();
        let roots = new Set();
        let queue = [source.sourceId];
        let visited = new Set();
        
        while (queue.length > 0) {
            let currentId = queue.shift();
            if (visited.has(currentId)) continue;
            visited.add(currentId);
            
            let current = this.sources.get(currentId);
            if (!current) {
                if (currentId === source.sourceId) roots.add(source);
                continue;
            }
            
            let parents = this._getCausalParentIds(current);
            if (parents.length === 0) {
                roots.add(current);
            } else {
                queue.push(...parents);
            }
        }
        return roots;
    }
    
    getIndependentCorroboration(claimId) {
        let record = this.claims.get(claimId);
        if (!record) return 0;
        
        let roots = new Set();
        for (let support of record.supports) {
            let supportRoots = this._findRootSources(support.source);
            for (let root of supportRoots) {
                roots.add(root.sourceId);
            }
        }
        return roots.size;
    }''')


prov = prov.replace('''        // Cycle check
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
        }''', '''        // Cycle check
        for (let src of tempSources.values()) {
            let parentIds = new Set();
            if (src.parentSourceIds) src.parentSourceIds.forEach(id => parentIds.add(id));
            if (src.derivedFromIds) src.derivedFromIds.forEach(id => parentIds.add(id));
            if (src.copiedFromIds) src.copiedFromIds.forEach(id => parentIds.add(id));
            if (src.transformedFromIds) src.transformedFromIds.forEach(id => parentIds.add(id));
            if (src.parentSourceId) parentIds.add(src.parentSourceId);
            if (src.derivedFrom) parentIds.add(src.derivedFrom);
            if (src.copiedFrom) parentIds.add(src.copiedFrom);
            if (src.transformedFrom) parentIds.add(src.transformedFrom);
            
            if (parentIds.size > 0) {
                let queue = Array.from(parentIds);
                let visited = new Set();
                while(queue.length > 0) {
                    let currentId = queue.shift();
                    if (currentId === src.sourceId) throw new Error("Cyclic provenance detected in serialized data");
                    if (visited.has(currentId)) continue;
                    visited.add(currentId);
                    let parent = tempSources.get(currentId);
                    if (parent) {
                        let nextParents = new Set();
                        if (parent.parentSourceIds) parent.parentSourceIds.forEach(id => nextParents.add(id));
                        if (parent.derivedFromIds) parent.derivedFromIds.forEach(id => nextParents.add(id));
                        if (parent.copiedFromIds) parent.copiedFromIds.forEach(id => nextParents.add(id));
                        if (parent.transformedFromIds) parent.transformedFromIds.forEach(id => nextParents.add(id));
                        if (parent.parentSourceId) nextParents.add(parent.parentSourceId);
                        if (parent.derivedFrom) nextParents.add(parent.derivedFrom);
                        if (parent.copiedFrom) nextParents.add(parent.copiedFrom);
                        if (parent.transformedFrom) nextParents.add(parent.transformedFrom);
                        queue.push(...Array.from(nextParents));
                    }
                }
            }
        }''')


with open(prov_path, 'w', encoding='utf-8') as f:
    f.write(prov)


with open(cons_path, 'r', encoding='utf-8') as f:
    cons = f.read()

# Fix ai-integrated-consolidation.js

cons = cons.replace('''class IntegratedConsolidationEngine {''', '''class EvidenceValidator {
    static isValid(support, provenanceGraph) {
        if (!support || !support.source || !support.evidence) return false;
        
        let sourceExists = provenanceGraph.sources.has(support.source.sourceId);
        if (!sourceExists) return false;
        
        let ev = support.evidence;
        if (typeof ev !== 'object') return false;
        if (Array.isArray(ev) && ev.length === 0) return false;
        
        // Check for broken reference
        if (ev.broken || ev.invalid) return false;
        
        return true;
    }
}

class IntegratedConsolidationEngine {''')

cons = cons.replace('''    _areSourcesIndependent(supports) {
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
    }''', '''    _areSourcesIndependent(supports) {
        if (!Array.isArray(supports)) return 0;
        
        let validRootsSet = new Set();
        
        for (let s of supports) {
            if (!EvidenceValidator.isValid(s, this.provenance)) continue;
            
            // Re-use ProvenanceGraph's new _findRootSources logic
            let supportRoots = this.provenance._findRootSources(s.source);
            for (let root of supportRoots) {
                validRootsSet.add(root.sourceId);
            }
        }
        
        return validRootsSet.size;
    }''')

cons = cons.replace('''        if (this.consolidationStates.get(claimId) !== newState) {
            this.consolidationStates.set(claimId, newState);
            this.history.push({ type: 'CONSOLIDATION_CHANGE', claimId: claimId, state: newState, timestamp: new Date().toISOString() });
        }''', '''        if (this.consolidationStates.get(claimId) !== newState) {
            this.consolidationStates.set(claimId, newState);
            if (!this._isRehydrating) {
                this.history.push({ type: 'CONSOLIDATION_CHANGE', claimId: claimId, state: newState, timestamp: new Date().toISOString() });
            }
        }''')

cons = cons.replace('''    async rehydrate() {
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
    }''', '''    async rehydrate() {
        let oldStates = new Map(this.consolidationStates);
        this.consolidationStates.clear();
        this._isRehydrating = true;
        
        try {
            for (let claimId of this.provenance.claims.keys()) {
                await this.consolidateClaim(claimId);
            }
        } catch(e) {
            this.consolidationStates = oldStates;
            throw new Error("Failed to rehydrate logical state. Rollback applied.");
        } finally {
            this._isRehydrating = false;
        }
    }''')

with open(cons_path, 'w', encoding='utf-8') as f:
    f.write(cons)

print("Files modified.")
