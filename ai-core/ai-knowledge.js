window.AI_CORE = window.AI_CORE || {};

// ==========================================
// KNOWLEDGE SCHEMA
// ==========================================

class KnowledgeSchema {
    /**
     * Valida que un documento cumpla con la estructura obligatoria.
     * @param {Object} doc - El documento a validar.
     * @returns {Object} - El documento normalizado y validado.
     * @throws {Error} - Si falta un campo requerido o tiene un tipo incorrecto.
     */
    static validate(doc) {
        if (!doc) throw new Error("Knowledge document cannot be null or undefined");
        
        const requiredFields = ['id', 'title', 'content', 'category', 'tags', 'source', 'confidence', 'version', 'createdAt', 'updatedAt'];
        
        for (const field of requiredFields) {
            if (!(field in doc)) {
                throw new Error(`Missing required field: '${field}' in knowledge document.`);
            }
        }
        
        if (typeof doc.id !== 'string' || doc.id.trim() === '') throw new Error("Field 'id' must be a non-empty string");
        if (typeof doc.title !== 'string' || doc.title.trim() === '') throw new Error("Field 'title' must be a non-empty string");
        if (typeof doc.content !== 'string' || doc.content.trim() === '') throw new Error("Field 'content' must be a non-empty string");
        if (typeof doc.category !== 'string') throw new Error("Field 'category' must be a string");
        if (!Array.isArray(doc.tags)) throw new Error("Field 'tags' must be an array");
        if (typeof doc.source !== 'string') throw new Error("Field 'source' must be a string");
        if (typeof doc.confidence !== 'number' || doc.confidence < 0 || doc.confidence > 1) throw new Error("Field 'confidence' must be a number between 0 and 1");
        if (typeof doc.version !== 'number' || doc.version < 1) throw new Error("Field 'version' must be a number >= 1");
        if (doc.createdAt !== null && typeof doc.createdAt !== 'string' && typeof doc.createdAt !== 'number') {
            throw new Error("Field 'createdAt' must be null, a valid date string, or a timestamp");
        }
        if (doc.updatedAt !== null && typeof doc.updatedAt !== 'string' && typeof doc.updatedAt !== 'number') {
            throw new Error("Field 'updatedAt' must be null, a valid date string, or a timestamp");
        }

        // FASE 4A - Nuevos campos opcionales
        const validKnowledgeTypes = ['FACT', 'INFERENCE', 'HYPOTHESIS', 'RULE', 'PROCEDURE', 'DEFINITION', 'EXAMPLE', 'DOCUMENT', 'UNSPECIFIED'];
        if (doc.knowledgeType !== undefined) {
            if (typeof doc.knowledgeType !== 'string' || !validKnowledgeTypes.includes(doc.knowledgeType)) {
                throw new Error(`Field 'knowledgeType' must be one of: ${validKnowledgeTypes.join(', ')}`);
            }
        }

        if (doc.language !== undefined) {
            if (typeof doc.language !== 'string' || doc.language.trim() === '') {
                throw new Error("Field 'language' must be a non-empty string");
            }
        }

        if (doc.provenance !== undefined) {
            if (typeof doc.provenance !== 'object' || doc.provenance === null) {
                throw new Error("Field 'provenance' must be an object");
            }
        }

        const validStatuses = ['NONE', 'UNRESOLVED', 'UNDER_REVIEW', 'RESOLVED', 'SUPERSEDED', 'ACTIVE', 'DEPRECATED'];
        if (doc.status !== undefined) {
            if (typeof doc.status !== 'string' || !validStatuses.includes(doc.status)) {
                throw new Error(`Field 'status' must be one of: ${validStatuses.join(', ')}`);
            }
        }

        if (doc.evidenceReferences !== undefined) {
            if (!Array.isArray(doc.evidenceReferences)) {
                throw new Error("Field 'evidenceReferences' must be an array");
            }
        }

        if (doc.learnedAt !== undefined) {
            if (doc.learnedAt !== null && typeof doc.learnedAt !== 'string' && typeof doc.learnedAt !== 'number') {
                throw new Error("Field 'learnedAt' must be a valid date string or timestamp");
            }
        }

        const normalizedDoc = {
            id: doc.id.trim(),
            title: doc.title.trim(),
            content: doc.content.trim(),
            category: doc.category.trim(),
            tags: [...doc.tags],
            source: doc.source.trim(),
            confidence: doc.confidence,
            version: doc.version,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        };

        if (doc.knowledgeType !== undefined) normalizedDoc.knowledgeType = doc.knowledgeType;
        if (doc.language !== undefined) normalizedDoc.language = doc.language.trim();
        if (doc.provenance !== undefined) normalizedDoc.provenance = { ...doc.provenance };
        if (doc.status !== undefined) normalizedDoc.status = doc.status;
        if (doc.evidenceReferences !== undefined) normalizedDoc.evidenceReferences = [...doc.evidenceReferences];
        if (doc.learnedAt !== undefined) normalizedDoc.learnedAt = doc.learnedAt;

        return normalizedDoc;
    }
}

// ==========================================
// KNOWLEDGE MANAGER
// ==========================================

class KnowledgeManager {
    constructor(store, collectionName = 'knowledge_base') {
        if (!store || typeof store.save !== 'function') {
            throw new Error("KnowledgeManager requires a valid KnowledgeStore instance");
        }
        this.store = store;
        this.collectionName = collectionName;
        this._cache = null; // Local memory cache
    }

    async _ensureLoaded() {
        if (this._cache === null) {
            this._cache = await this.store.load(this.collectionName);
        }
    }

    /**
     * Añade un nuevo documento a la base de conocimiento.
     */
    async add(doc) {
        const validDoc = KnowledgeSchema.validate(doc);
        await this._ensureLoaded();
        
        const existingIndex = this._cache.findIndex(d => d.id === validDoc.id);
        if (existingIndex >= 0) {
            throw new Error(`Document with id '${validDoc.id}' already exists. Use update() instead.`);
        }
        
        this._cache.push(validDoc);
        await this.store.save(this.collectionName, this._cache);
        return validDoc;
    }

    /**
     * Obtiene un documento por su ID.
     */
    async get(id) {
        await this._ensureLoaded();
        return this._cache.find(doc => doc.id === id) || null;
    }

    /**
     * Actualiza un documento existente.
     */
    async update(id, updates) {
        await this._ensureLoaded();
        const index = this._cache.findIndex(doc => doc.id === id);
        
        if (index === -1) {
            throw new Error(`Document with id '${id}' not found.`);
        }
        
        const currentDoc = this._cache[index];
        const updatedDoc = {
            ...currentDoc,
            ...updates,
            id: currentDoc.id, // ID cannot be changed
            version: currentDoc.version + 1,
            updatedAt: new Date().toISOString()
        };
        
        const validDoc = KnowledgeSchema.validate(updatedDoc);
        this._cache[index] = validDoc;
        await this.store.save(this.collectionName, this._cache);
        return validDoc;
    }

    /**
     * Elimina un documento por su ID.
     */
    async delete(id) {
        await this._ensureLoaded();
        const initialLength = this._cache.length;
        this._cache = this._cache.filter(doc => doc.id !== id);
        
        if (this._cache.length !== initialLength) {
            await this.store.save(this.collectionName, this._cache);
            return true;
        }
        return false;
    }

    /**
     * Pipeline local de tokenización y extracción de keywords.
     */
    _tokenizeAndExtract(text) {
        if (!text || typeof text !== 'string') return [];
        const normalized = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const tokens = normalized.replace(/[¿?¡!.,;:"'()\[\]{}—_\-]/g, ' ').split(/\s+/);
        
        const stopwords = new Set([
            'el','la','los','las','un','una','unos','unas',
            'de','del','en','a','por','para','con','sin','sobre',
            'y','o','e','u','ni','pero','sino','porque','aunque',
            'que','como','quien','cual','cuales','cuanto','cuanta','cuantos','cuantas','donde','cuando',
            'este','esta','estos','estas','ese','esa','esos','esas','aquel','aquella','aquellos','aquellas',
            'mi','mis','tu','tus','su','sus','nuestro','nuestra','nuestros','nuestras',
            'es','son','fui','fue','fueron','ser','estar','soy','eres','somos','sois',
            'me','te','se','nos','os','le','les','lo','los','la','las',
            'explicame','dime','funciona','sistema','quiero','saber'
        ]);

        return tokens.filter(t => t.length > 1 && !stopwords.has(t));
    }

    /**
     * Búsqueda léxica mejorada con NLP básico.
     * @returns {Array<{document: Object, score: Number, matchedTerms: Array<String>, matchedFields: Array<String>, matchRatio: Number}>}
     */
    async search(query) {
        await this._ensureLoaded();
        if (!query || typeof query !== 'string') return [];
        
        const keywords = this._tokenizeAndExtract(query);
        if (keywords.length === 0) return [];

        const results = [];

        for (const doc of this._cache) {
            let score = 0;
            const matchedTerms = new Set();
            const matchedFields = new Set();
            
            const titleNorm = this._tokenizeAndExtract(doc.title);
            const contentNorm = this._tokenizeAndExtract(doc.content);
            const catNorm = this._tokenizeAndExtract(doc.category);
            const tagsNorm = doc.tags.map(t => this._tokenizeAndExtract(t)).flat();

            for (const kw of keywords) {
                let termMatched = false;
                
                if (tagsNorm.includes(kw)) {
                    score += 5;
                    matchedFields.add('tags');
                    termMatched = true;
                }
                
                if (titleNorm.includes(kw)) {
                    score += 4;
                    matchedFields.add('title');
                    termMatched = true;
                }
                
                if (catNorm.includes(kw)) {
                    score += 3;
                    matchedFields.add('category');
                    termMatched = true;
                }
                
                if (contentNorm.includes(kw)) {
                    score += 1;
                    matchedFields.add('content');
                    termMatched = true;
                }

                if (termMatched) {
                    matchedTerms.add(kw);
                }
            }

            if (score > 0) {
                results.push({
                    document: doc,
                    score: score,
                    matchedTerms: Array.from(matchedTerms),
                    matchedFields: Array.from(matchedFields),
                    matchRatio: matchedTerms.size / keywords.length
                });
            }
        }

        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Encuentra documentos por categoría.
     */
    async findByCategory(category) {
        await this._ensureLoaded();
        return this._cache.filter(doc => doc.category === category);
    }

    /**
     * Encuentra documentos que contengan TODOS los tags especificados.
     */
    async findByTags(tagsArray) {
        await this._ensureLoaded();
        if (!Array.isArray(tagsArray) || tagsArray.length === 0) return [];
        
        return this._cache.filter(doc => 
            tagsArray.every(tag => doc.tags.includes(tag))
        );
    }
}

// ==========================================
// CONCEPT SCHEMA
// ==========================================

class ConceptSchema {
    static validate(concept) {
        if (!concept) throw new Error("Concept cannot be null or undefined");
        if (typeof concept.conceptId !== 'string' || concept.conceptId.trim() === '') throw new Error("Field 'conceptId' is required and must be a string");
        if (typeof concept.canonicalName !== 'string' || concept.canonicalName.trim() === '') throw new Error("Field 'canonicalName' is required and must be a string");
        
        const validStatuses = ['DRAFT', 'ACTIVE', 'DEPRECATED', 'SUPERSEDED'];
        if (concept.status && !validStatuses.includes(concept.status)) {
            throw new Error(`Field 'status' must be one of: ${validStatuses.join(', ')}`);
        }

        return {
            conceptId: concept.conceptId.trim(),
            canonicalName: concept.canonicalName.trim(),
            aliases: Array.isArray(concept.aliases) ? [...concept.aliases] : [],
            domain: concept.domain || 'General',
            languageVariants: Array.isArray(concept.languageVariants) ? [...concept.languageVariants] : [],
            sourceReferences: Array.isArray(concept.sourceReferences) ? [...concept.sourceReferences] : [],
            status: concept.status || 'ACTIVE',
            createdAt: concept.createdAt || new Date().toISOString(),
            updatedAt: concept.updatedAt || new Date().toISOString()
        };
    }
}

// ==========================================
// CONCEPT REGISTRY
// ==========================================

class ConceptRegistry {
    constructor(store, collectionName = 'concept_registry') {
        if (!store || typeof store.save !== 'function') {
            throw new Error("ConceptRegistry requires a valid KnowledgeStore instance");
        }
        this.store = store;
        this.collectionName = collectionName;
        this._cache = null;
    }

    async _ensureLoaded() {
        if (this._cache === null) {
            this._cache = await this.store.load(this.collectionName) || [];
        }
    }

    async add(concept) {
        const valid = ConceptSchema.validate(concept);
        await this._ensureLoaded();
        if (this._cache.find(c => c.conceptId === valid.conceptId)) {
            throw new Error(`Concept with id '${valid.conceptId}' already exists.`);
        }
        this._cache.push(valid);
        await this.store.save(this.collectionName, this._cache);
        return valid;
    }

    async get(conceptId) {
        await this._ensureLoaded();
        return this._cache.find(c => c.conceptId === conceptId) || null;
    }
}

// ==========================================
// RELATIONSHIP SCHEMA
// ==========================================

class RelationshipSchema {
    static validate(rel) {
        if (!rel) throw new Error("Relationship cannot be null or undefined");
        if (typeof rel.sourceConceptId !== 'string' || rel.sourceConceptId.trim() === '') throw new Error("Field 'sourceConceptId' is required");
        if (typeof rel.targetConceptId !== 'string' || rel.targetConceptId.trim() === '') throw new Error("Field 'targetConceptId' is required");
        
        const validTypes = ['IS_A', 'PART_OF', 'HAS_PART', 'RELATED_TO', 'DEPENDS_ON', 'REQUIRES', 'DERIVED_FROM', 'EXAMPLE_OF', 'EQUIVALENT_TO', 'CONTRADICTS', 'SUPPORTS', 'SUPERSEDES', 'USED_IN'];
        if (typeof rel.relationType !== 'string' || !validTypes.includes(rel.relationType)) {
            throw new Error(`Field 'relationType' must be one of: ${validTypes.join(', ')}`);
        }

        if (typeof rel.confidence !== 'number' || rel.confidence < 0 || rel.confidence > 1) {
            throw new Error("Field 'confidence' must be a number between 0 and 1");
        }

        if (typeof rel.provenance !== 'object' || rel.provenance === null) {
            throw new Error("Field 'provenance' must be an object");
        }

        const validStatuses = ['ACTIVE', 'SUPERSEDED', 'CONFLICTED', 'RETIRED'];
        if (rel.status && !validStatuses.includes(rel.status)) {
            throw new Error(`Field 'status' must be one of: ${validStatuses.join(', ')}`);
        }

        return {
            id: rel.id || `rel_${Date.now()}_${Math.floor(Math.random()*10000)}`,
            sourceConceptId: rel.sourceConceptId.trim(),
            targetConceptId: rel.targetConceptId.trim(),
            relationType: rel.relationType,
            confidence: rel.confidence,
            provenance: { ...rel.provenance },
            evidenceReferences: Array.isArray(rel.evidenceReferences) ? [...rel.evidenceReferences] : [],
            status: rel.status || 'ACTIVE',
            createdAt: rel.createdAt || new Date().toISOString(),
            updatedAt: rel.updatedAt || new Date().toISOString()
        };
    }
}

// ==========================================
// RELATIONSHIP REGISTRY
// ==========================================

class RelationshipRegistry {
    constructor(store, collectionName = 'relationship_registry') {
        if (!store || typeof store.save !== 'function') {
            throw new Error("RelationshipRegistry requires a valid KnowledgeStore instance");
        }
        this.store = store;
        this.collectionName = collectionName;
        this._cache = null;
    }

    async _ensureLoaded() {
        if (this._cache === null) {
            this._cache = await this.store.load(this.collectionName) || [];
        }
    }

    async add(rel, conceptRegistry = null) {
        const valid = RelationshipSchema.validate(rel);
        
        if (conceptRegistry) {
            const source = await conceptRegistry.get(valid.sourceConceptId);
            const target = await conceptRegistry.get(valid.targetConceptId);
            if (!source) throw new Error(`Source concept '${valid.sourceConceptId}' does not exist.`);
            if (!target) throw new Error(`Target concept '${valid.targetConceptId}' does not exist.`);
        }

        await this._ensureLoaded();
        this._cache.push(valid);
        await this.store.save(this.collectionName, this._cache);
        return valid;
    }

    async getRelations(conceptId) {
        await this._ensureLoaded();
        return this._cache.filter(r => r.sourceConceptId === conceptId || r.targetConceptId === conceptId);
    }

    async getOutgoingRelations(conceptId) {
        await this._ensureLoaded();
        return this._cache.filter(r => r.sourceConceptId === conceptId);
    }

    async getIncomingRelations(conceptId) {
        await this._ensureLoaded();
        return this._cache.filter(r => r.targetConceptId === conceptId);
    }

    async getByType(relationType) {
        await this._ensureLoaded();
        return this._cache.filter(r => r.relationType === relationType);
    }
}

window.AI_CORE.KnowledgeSchema = KnowledgeSchema;
window.AI_CORE.KnowledgeManager = KnowledgeManager;
window.AI_CORE.ConceptSchema = ConceptSchema;
window.AI_CORE.ConceptRegistry = ConceptRegistry;
window.AI_CORE.RelationshipSchema = RelationshipSchema;
window.AI_CORE.RelationshipRegistry = RelationshipRegistry;
