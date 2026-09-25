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
    addTurn(role, text) {
        this.shortTermMemory.push({ role, text, timestamp: new Date().toISOString() });
    }
    
    getShortTermMemory() {
        return this.shortTermMemory;
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
