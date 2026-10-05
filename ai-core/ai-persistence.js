window.AI_CORE = window.AI_CORE || {};

/**
 * PersistenceManager extends KnowledgeStore to act as a seamless orchestrator 
 * between a primary local store and an optional remote backend (e.g. Home Server), 
 * ensuring local-first guarantees and failure isolation.
 */
class PersistenceManager extends window.AI_CORE.KnowledgeStore {
    constructor(localStore, remoteStore = null) {
        super();
        if (!localStore) throw new Error("PersistenceManager requires a local store");
        this.localStore = localStore;
        this.remoteStore = remoteStore; // Injectable future home server adapter
    }

    setRemoteStore(remoteStore) {
        this.remoteStore = remoteStore;
    }

    async save(collection, data) {
        // Local-first guarantee: Always save to local store first and synchronously
        let localSuccess = false;
        try {
            localSuccess = await this.localStore.save(collection, data);
        } catch (e) {
            console.error("[PersistenceManager] Local store save failed", e);
            throw e; // If local fails, propagate the error (mandatory)
        }

        // Fire-and-forget or attempt remote sync safely
        if (this.remoteStore) {
            try {
                // Ensure failure on remote does not interrupt local success
                await this.remoteStore.save(collection, data);
            } catch (e) {
                console.warn(`[PersistenceManager] Remote store failed to save collection '${collection}'. Operating in local-only mode.`);
                // Swallow error to preserve failure isolation.
            }
        }
        return localSuccess;
    }

    async load(collection) {
        // Local-first guarantee: Load from local store
        try {
            return await this.localStore.load(collection);
        } catch (e) {
            console.error("[PersistenceManager] Local store load failed", e);
            throw e;
        }
        // Note: No remote fetching is done here to avoid automatic network activity (Requirement 5).
    }

    async delete(collection, id) {
        let localSuccess = false;
        try {
            localSuccess = await this.localStore.delete(collection, id);
        } catch (e) {
            console.error("[PersistenceManager] Local store delete failed", e);
            throw e;
        }

        if (this.remoteStore) {
            try {
                await this.remoteStore.delete(collection, id);
            } catch (e) {
                console.warn(`[PersistenceManager] Remote store failed to delete item '${id}' from '${collection}'.`);
            }
        }
        return localSuccess;
    }

    async clear(collection) {
        let localSuccess = false;
        try {
            localSuccess = await this.localStore.clear(collection);
        } catch (e) {
            console.error("[PersistenceManager] Local store clear failed", e);
            throw e;
        }

        if (this.remoteStore) {
            try {
                await this.remoteStore.clear(collection);
            } catch (e) {
                console.warn(`[PersistenceManager] Remote store failed to clear collection '${collection}'.`);
            }
        }
        return localSuccess;
    }
}

/**
 * Abstraction for future Home Server backend.
 * Implementing KnowledgeStore contract to be injected into PersistenceManager.
 */
class HomeServerKnowledgeStore extends window.AI_CORE.KnowledgeStore {
    constructor(transportAdapter = null) {
        super();
        this.transportAdapter = transportAdapter; // Dependency injection for network transport
    }

    async save(collection, data) {
        if (!this.transportAdapter) return false;
        return await this.transportAdapter.post(`/api/v1/store/${collection}`, data);
    }

    async load(collection) {
        if (!this.transportAdapter) return [];
        return await this.transportAdapter.get(`/api/v1/store/${collection}`);
    }

    async delete(collection, id) {
        if (!this.transportAdapter) return false;
        return await this.transportAdapter.delete(`/api/v1/store/${collection}/${id}`);
    }

    async clear(collection) {
        if (!this.transportAdapter) return false;
        return await this.transportAdapter.post(`/api/v1/store/${collection}/clear`, {});
    }
}

window.AI_CORE.PersistenceManager = PersistenceManager;
window.AI_CORE.HomeServerKnowledgeStore = HomeServerKnowledgeStore;
