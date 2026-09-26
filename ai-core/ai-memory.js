window.AI_CORE = window.AI_CORE || {};

class MemoryManager {
    constructor(store, collectionName = 'persistent_memory') {
        this.store = store; // Debe ser instancia de KnowledgeStore
        this.collectionName = collectionName;
        this.shortTermMemory = []; // Conversación activa
        this._cache = null;
    }

    // ==========================================
    // MEMORIA A CORTO PLAZO (Sesión/Conversación)
    // ==========================================
    
    _deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (Array.isArray(obj)) return obj.map(item => this._deepClone(item));
        const copy = {};
        for (let key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                copy[key] = this._deepClone(obj[key]);
            }
        }
        return copy;
    }

    _deepFreeze(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        Object.freeze(obj);
        for (let key of Object.keys(obj)) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Object.isFrozen(obj[key])) {
                this._deepFreeze(obj[key]);
            }
        }
        return obj;
    }

    addTurn(role, text, metadata = null) {
        const turn = { role, text, timestamp: new Date().toISOString() };
        
        if (metadata) {
            if (metadata.isCreatorKnowledge === true) {
                // FAIL-CLOSED VALIDATIONS
                if (!metadata.knowledgeId) throw new Error("FAIL-CLOSED: Missing knowledgeId");
                if (!metadata.category) throw new Error("FAIL-CLOSED: Missing category");
                if (!metadata.provenance) throw new Error("FAIL-CLOSED: Missing provenance");
                if (!metadata.applicabilityScope) throw new Error("FAIL-CLOSED: Missing applicabilityScope");
                
                if (metadata.category === "CREATOR_FACT" && !metadata.evidenceReference) {
                    throw new Error("FAIL-CLOSED: CREATOR_FACT requires evidenceReference");
                }

                turn.metadata = {
                    isCreatorKnowledge: true,
                    knowledgeId: metadata.knowledgeId,
                    category: metadata.category,
                    provenance: this._deepClone(metadata.provenance),
                    applicabilityScope: this._deepClone(metadata.applicabilityScope),
                    evidenceReference: metadata.evidenceReference ? this._deepClone(metadata.evidenceReference) : undefined,
                    supersedesId: metadata.supersedesId
                };
            } else if (metadata.isGeneratedResponse === true) {
                if (metadata.isCreatorKnowledge || metadata.knowledgeId || metadata.category || metadata.provenance || metadata.evidenceReference || metadata.applicabilityScope) {
                    throw new Error("FAIL-CLOSED: Cannot mix Generated Response with Creator Knowledge fields");
                }
                turn.metadata = {
                    isGeneratedResponse: true,
                    personalityMode: metadata.personalityMode,
                    personalityTone: metadata.personalityTone,
                    personalityInitiative: metadata.personalityInitiative,
                    reasoningUncertaintyLevel: metadata.reasoningUncertaintyLevel,
                    isSubjective: !!metadata.isSubjective,
                    hadConflict: !!metadata.hadConflict,
                    hadMissingInformation: !!metadata.hadMissingInformation
                };
            } else {
                turn.metadata = this._deepClone(metadata);
            }
        }
        
        this.shortTermMemory.push(this._deepFreeze(turn));
    }
    
    getShortTermMemory() {
        return [...this.shortTermMemory];
    }
    
    clearShortTermMemory() {
        this.shortTermMemory = [];
    }

    // ==========================================
    // MEMORIA PERSISTENTE (Preferencia, Decisiones)
    // ==========================================
    async _ensureLoaded() {
        if (this._cache === null) {
            let data = await this.store.load(this.collectionName);
            // Si la colección retorna un array (por defecto en store), lo convertimos a mapa
            if (Array.isArray(data)) {
                this._cache = data.reduce((acc, item) => {
                    acc[item.id] = item;
                    return acc;
                }, {});
            } else {
                this._cache = data || {};
            }
        }
    }

    async savePersistent(key, value) {
        await this._ensureLoaded();
        this._cache[key] = { id: key, value, updatedAt: new Date().toISOString() };
        // Guardamos como array de objetos para compatibilidad con el Store genérico
        await this.store.save(this.collectionName, Object.values(this._cache));
        return true;
    }

    async getPersistent(key) {
        await this._ensureLoaded();
        return this._cache[key] ? this._cache[key].value : null;
    }
    
    async getAllPersistent() {
        await this._ensureLoaded();
        return Object.values(this._cache);
    }
}

window.AI_CORE.MemoryManager = MemoryManager;
