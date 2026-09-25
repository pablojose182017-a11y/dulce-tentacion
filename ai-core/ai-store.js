window.AI_CORE = window.AI_CORE || {};

// ==========================================
// KNOWLEDGE STORE ABSTRACTION
// ==========================================

/**
 * Interfaz base para el almacenamiento de conocimiento.
 * Cualquier implementación (Local, IndexedDB, etc.) debe cumplir con esto.
 */
class KnowledgeStore {
    constructor() {
        if (new.target === KnowledgeStore) {
            throw new TypeError("Cannot construct KnowledgeStore abstract instances directly");
        }
    }
    
    async save(collection, data) { throw new Error("Method 'save()' must be implemented."); }
    async load(collection) { throw new Error("Method 'load()' must be implemented."); }
    async delete(collection, id) { throw new Error("Method 'delete()' must be implemented."); }
    async clear(collection) { throw new Error("Method 'clear()' must be implemented."); }
}

/**
 * Implementación inicial usando LocalStorage.
 */
class LocalStorageKnowledgeStore extends KnowledgeStore {
    constructor(prefix = "ai_core_") {
        super();
        this.prefix = prefix;
    }

    _getKey(collection) {
        return `${this.prefix}${collection}`;
    }

    async save(collection, data) {
        const key = this._getKey(collection);
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    }

    async load(collection) {
        const key = this._getKey(collection);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    async delete(collection, id) {
        let items = await this.load(collection);
        items = items.filter(item => item.id !== id);
        await this.save(collection, items);
        return true;
    }

    async clear(collection) {
        const key = this._getKey(collection);
        localStorage.removeItem(key);
        return true;
    }
}

window.AI_CORE.KnowledgeStore = KnowledgeStore;
window.AI_CORE.LocalStorageKnowledgeStore = LocalStorageKnowledgeStore;
