window.AI_CORE = window.AI_CORE || {};

// ==========================================
// CONTEXT MANAGER
// ==========================================

class ContextManager {
    constructor(identityManager = null, permissionManager = null, memoryManager = null) {
        this.identityManager = identityManager;
        this.permissionManager = permissionManager;
        this.memoryManager = memoryManager;

        this.contextData = {
            user: { available: false, data: null },
            identity: { available: false, data: null },
            memory: { available: false, data: [] },
            knowledge: { available: false, data: [] },
            creatorKnowledge: { available: false, data: [] },
            project: { available: false, data: null },
            permissions: { available: false, data: null },
            tools: { available: false, data: [] }
        };
    }

    async assembleContext(sessionUser) {
        // Identity & User
        if (this.identityManager) {
            const user = this.identityManager.getCurrentUser(sessionUser);
            this.contextData.user = { available: true, data: user, source: 'IdentityManager' };
            
            this.contextData.identity = {
                available: true,
                data: this.identityManager.getBotIdentity(),
                source: 'IdentityManager'
            };
            
            // Permissions
            if (this.permissionManager) {
                this.contextData.permissions = {
                    available: true,
                    data: this.permissionManager.getGovernanceRules(user),
                    source: 'PermissionManager'
                };
            }
        } else {
            this.contextData.user = { available: sessionUser != null, data: sessionUser, source: 'Manual' };
        }

        // Memory
        if (this.memoryManager) {
            this.contextData.memory = {
                available: true,
                data: {
                    shortTerm: this.memoryManager.getShortTermMemory(),
                    persistent: await this.memoryManager.getAllPersistent()
                },
                source: 'MemoryManager'
            };
        }
    }

    setKnowledge(knowledgeArray) {
        this.contextData.knowledge = {
            available: Array.isArray(knowledgeArray) && knowledgeArray.length > 0,
            data: knowledgeArray || [],
            source: 'KnowledgeManager'
        };
    }

    setCreatorKnowledge(knowledgeArray) {
        if (!Array.isArray(knowledgeArray) || knowledgeArray.length === 0) {
            this.contextData.creatorKnowledge = {
                available: false,
                data: [],
                source: 'CreatorKnowledgeManager'
            };
            return;
        }

        // Sanitizar eliminando integrityRecord para evitar alucinaciones de hashes en el LLM
        const sanitized = knowledgeArray.map(item => {
            if (item && typeof item === 'object') {
                const clone = Object.assign({}, item);
                delete clone.integrityRecord;
                // Si llegase a colarse un SCOPE_UNCERTAIN, se aplica HARD-DROP como defensa en profundidad
                if (clone.applicabilityScope === "SCOPE_UNCERTAIN") return null;
                return clone;
            }
            return item;
        }).filter(item => item !== null);

        this.contextData.creatorKnowledge = {
            available: sanitized.length > 0,
            data: sanitized,
            source: 'CreatorKnowledgeManager'
        };
    }

    buildContext() {
        const built = {
            metadata: { timestamp: new Date().toISOString(), status: 'COMPILED' },
            blocks: {}
        };

        for (const [key, section] of Object.entries(this.contextData)) {
            if (section.available) {
                built.blocks[key] = { status: 'AVAILABLE', source: section.source, content: section.data };
            } else {
                built.blocks[key] = { status: 'MISSING', message: `No ${key} information provided to context.` };
            }
        }

        return built;
    }
}

window.AI_CORE.ContextManager = ContextManager;
