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

        return {
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

window.AI_CORE.KnowledgeSchema = KnowledgeSchema;
window.AI_CORE.KnowledgeManager = KnowledgeManager;
