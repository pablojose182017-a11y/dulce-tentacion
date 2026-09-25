window.AI_CORE = window.AI_CORE || {};

/**
 * Adaptador READ-ONLY para traducir window.costosState (RAG Legacy) 
 * al formato estricto de KnowledgeSchema sin mutar el objeto original
 * ni duplicar datos en el disco local permanentemente.
 */
class LegacyRAGAdapter {
    constructor(costosStateRef) {
        this.costosState = costosStateRef;
    }

    /**
     * Genera un identificador estable y único.
     * Si no tiene ID original, utiliza una firma canónica determinista basada en campos estables 
     * reales del elemento, evitando colisiones entre elementos con mismo nombre.
     */
    _generateId(type, item) {
        if (item.id) {
            return `legacy_${type}_${item.id}`;
        }
        
        if (item.nombre) {
            const cleanName = item.nombre.toLowerCase().replace(/[^a-z0-9]/g, '_');
            let stableSignature = cleanName;
            
            // Si es receta, diferenciamos por rendimiento y precioSugerido
            if (type === 'receta') {
                const r = item.rendimiento || 1;
                const p = item.precioSugerido || 0;
                stableSignature += `_r${r}_p${p}`;
            } 
            // Si es insumo, diferenciamos por unidad
            else if (type === 'insumo') {
                const u = (item.unidad || 'NA').toLowerCase().replace(/[^a-z0-9]/g, '_');
                stableSignature += `_u${u}`;
            }
            
            return `legacy_${type}_no_id_${stableSignature}`;
        }

        throw new Error(`Elemento de tipo ${type} no tiene ID ni nombre. No se puede generar identidad estable.`);
    }

    /**
     * Devuelve el timestamp original si existe, o null si la fuente 
     * no proporciona información temporal, evitando falsear fechas de creación.
     */
    _getStableTimestamp(item, field) {
        if (item[field]) {
            return new Date(item[field]).toISOString(); // Usa el del negocio si existe
        }
        return null; // El Schema ahora acepta explícitamente la ausencia (null)
    }

    /**
     * Convierte el arreglo de recetas al formato KnowledgeSchema.
     */
    adaptRecipes() {
        if (!this.costosState || !Array.isArray(this.costosState.recetas)) return [];
        
        const adapted = [];
        for (const r of this.costosState.recetas) {
            try {
                const id = this._generateId('receta', r);
                const nombre = r.nombre || 'Sin nombre';
                const rendimiento = r.rendimiento || 1;
                const precio = r.precioSugerido || 0;
                const margen = r.margenDeseado || 0;
                
                const content = `Receta: ${nombre}. Rendimiento: ${rendimiento} unidades. Precio sugerido: $${precio}. Margen deseado: ${margen}%. Ingredientes requeridos: ${JSON.stringify(r.ingredientes || [])}`;
                
                adapted.push({
                    id: id,
                    title: `Receta: ${nombre}`,
                    content: content,
                    category: "Receta",
                    tags: ["receta", "negocio", nombre.toLowerCase()],
                    source: "legacy-costosState",
                    // confidence: 1.0 documenta alta confianza de procedencia (autoridad de la fuente de negocio)
                    confidence: 1.0, 
                    version: 1,
                    createdAt: this._getStableTimestamp(r, 'createdAt'),
                    updatedAt: this._getStableTimestamp(r, 'updatedAt')
                });
            } catch (err) {
                console.warn(`[LegacyRAGAdapter] Omitiendo receta: ${err.message}`);
            }
        }
        return adapted;
    }

    /**
     * Convierte el arreglo de insumos al formato KnowledgeSchema.
     */
    adaptIngredients() {
        if (!this.costosState || !Array.isArray(this.costosState.insumos)) return [];
        
        const adapted = [];
        for (const i of this.costosState.insumos) {
            try {
                const id = this._generateId('insumo', i);
                const nombre = i.nombre || 'Sin nombre';
                const unidad = i.unidad || 'N/A';
                const costo = i.costoUnitario || 0;
                const merma = i.porcentajeMerma || 0;

                const content = `Insumo: ${nombre}. Unidad de medida: ${unidad}. Costo unitario: $${costo}. Porcentaje de merma estimado: ${merma}%.`;

                adapted.push({
                    id: id,
                    title: `Insumo: ${nombre}`,
                    content: content,
                    category: "Insumo",
                    tags: ["insumo", "inventario", nombre.toLowerCase()],
                    source: "legacy-costosState",
                    confidence: 1.0, 
                    version: 1,
                    createdAt: this._getStableTimestamp(i, 'createdAt'),
                    updatedAt: this._getStableTimestamp(i, 'updatedAt')
                });
            } catch (err) {
                console.warn(`[LegacyRAGAdapter] Omitiendo insumo: ${err.message}`);
            }
        }
        return adapted;
    }

    /**
     * Convierte el catálogo completo de negocio a KnowledgeSchema.
     */
    adaptAll() {
        return [...this.adaptRecipes(), ...this.adaptIngredients()];
    }
}

window.AI_CORE.LegacyRAGAdapter = LegacyRAGAdapter;

// ==========================================
// PRUEBAS AISLADAS PARA EL ADAPTADOR
// ==========================================
window.runLegacyAdapterTests = async function() {
    console.log("=== INICIANDO PRUEBAS AISLADAS: LegacyRAGAdapter ===");
    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    };

    try {
        const mockCostosState = {
            recetas: [
                { id: "r100", nombre: "Pan de Queso", rendimiento: 10, precioSugerido: 2000, margenDeseado: 30, ingredientes: [{insumoId: "i1", cantidad: 2}] },
                { nombre: "Torta de chocolate", rendimiento: 1, precioSugerido: 50000, margenDeseado: 40 }, // Receta A sin ID
                { nombre: "Torta de chocolate", rendimiento: 2, precioSugerido: 80000, margenDeseado: 50 }, // Receta B sin ID (colisión de nombre)
                { id: "r_fecha", nombre: "Torta de Fecha", createdAt: "2023-01-01T12:00:00Z" } // Receta con fecha válida
            ],
            insumos: [
                { id: "i1", nombre: "Harina", unidad: "kg", costoUnitario: 3000, porcentajeMerma: 5 }
            ]
        };

        const originalJSON = JSON.stringify(mockCostosState);
        const adapter1 = new window.AI_CORE.LegacyRAGAdapter(mockCostosState);
        const docsCall1 = adapter1.adaptAll();
        
        // Simular un poco de tiempo para verificar estabilidad (sin Dates aleatorios)
        await new Promise(r => setTimeout(r, 50));
        const adapter2 = new window.AI_CORE.LegacyRAGAdapter(mockCostosState);
        const docsCall2 = adapter2.adaptAll();

        // A. Resolución de colisiones
        const tortaA = docsCall1.find(d => d.title.includes("Torta de chocolate") && d.content.includes("$50000"));
        const tortaB = docsCall1.find(d => d.title.includes("Torta de chocolate") && d.content.includes("$80000"));
        assert(tortaA.id !== tortaB.id, "Dos elementos con nombres iguales pero datos diferentes producen IDs diferentes.");
        
        // B. Estabilidad Consecutiva
        const tortaA2 = docsCall2.find(d => d.title.includes("Torta de chocolate") && d.content.includes("$50000"));
        assert(tortaA.id === tortaA2.id && tortaA.id === "legacy_receta_no_id_torta_de_chocolate_r1_p50000", "El mismo elemento produce exactamente el mismo ID compuesto en llamadas consecutivas.");

        // C. Cambiar campo clave produce identidad nueva determinista
        const mockCostosCambiado = JSON.parse(JSON.stringify(mockCostosState));
        mockCostosCambiado.recetas[1].precioSugerido = 60000;
        const adapter3 = new window.AI_CORE.LegacyRAGAdapter(mockCostosCambiado);
        const tortaA_cambiada = adapter3.adaptAll().find(d => d.title.includes("Torta de chocolate") && d.content.includes("$60000"));
        assert(tortaA_cambiada.id === "legacy_receta_no_id_torta_de_chocolate_r1_p60000" && tortaA_cambiada.id !== tortaA.id, "Cambiar un campo utilizado para identidad produce una nueva identidad determinista.");

        // D. Timestamps nulos
        assert(tortaA.createdAt === null && tortaA.updatedAt === null, "Cuando la fuente no tiene fecha, createdAt y updatedAt son estrictamente null (sin falsificar fechas).");
        
        const tortaFecha = docsCall1.find(d => d.id === "legacy_receta_r_fecha");
        assert(tortaFecha.createdAt === "2023-01-01T12:00:00.000Z", "Cuando la fuente sí tiene fecha, el adaptador la conserva correctamente.");

        // E. Inmutabilidad / Read Only
        assert(JSON.stringify(mockCostosState) === originalJSON, "El adaptador no modifica el objeto original window.costosState.");

        // F. Schema Validation
        let schemaPassed = true;
        for (let doc of docsCall1) {
            try {
                window.AI_CORE.KnowledgeSchema.validate(doc);
            } catch (e) {
                console.error("Schema error en documento:", doc.id, e.message);
                schemaPassed = false;
            }
        }
        assert(schemaPassed, "Todos los documentos, incluso con timestamp null, cumplen con el KnowledgeSchema modificado.");

    } catch (e) {
        console.error("Error en pruebas aisladas:", e);
        failed++;
    }

    console.log(`RESULTADO ADAPTER: ${passed} PASS | ${failed} FAIL\n`);
    return { passed, failed };
};
