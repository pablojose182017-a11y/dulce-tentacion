window.AI_CORE = window.AI_CORE || {};

/**
 * TextProcessor
 * Habilidad nativa de corrección ortográfica, puntuación, mejora de redacción
 * y adaptación comercial estratégica para P&S Punto Dulce (Cúcuta).
 * 0 llaves requeridas. Soporta capa online gratuita (LanguageTool) y capa local offline ultra-robusta.
 */
class TextProcessor {
    constructor() {
        this.languageToolEndpoint = 'https://api.languagetool.org/v2/check';
    }

    /**
     * Aplica reglas ortográficas, tipográficas y gramaticales sin conexión.
     */
    correctLocal(text) {
        if (!text || typeof text !== 'string') return '';

        let processed = text;

        // 1. Normalizar saltos de línea y espacios redundantes
        processed = processed.replace(/\r\n/g, '\n');
        processed = processed.replace(/[ \t]+/g, ' ');
        processed = processed.replace(/\n{3,}/g, '\n\n');

        // 2. Diccionario de tildes y errores ortográficos comunes en español
        const wordReplacements = [
            // Verbos comunes y tiempos verbales
            [/\bmas\b(?!\s+[a-z]+mente\b)/gi, (m) => m[0] === 'M' ? 'Más' : 'más'],
            [/\btambien\b/gi, (m) => m[0] === 'T' ? 'También' : 'también'],
            [/\bademas\b/gi, (m) => m[0] === 'A' ? 'Además' : 'además'],
            [/\bdespues\b/gi, (m) => m[0] === 'D' ? 'Después' : 'después'],
            [/\besta\b(?=\s+(?:aqui|alli|alla|muy|bien|mal|hecho|listo|lista|bueno|buena|hornead[oa]))/gi, 'está'],
            [/\bestan\b/gi, 'están'],
            [/\bhabia\b/gi, (m) => m[0] === 'H' ? 'Había' : 'había'],
            [/\bhabian\b/gi, (m) => m[0] === 'H' ? 'Habían' : 'habían'],
            [/\bsera\b/gi, (m) => m[0] === 'S' ? 'Será' : 'será'],
            [/\bseran\b/gi, (m) => m[0] === 'S' ? 'Serán' : 'serán'],
            [/\bharia\b/gi, (m) => m[0] === 'H' ? 'Haría' : 'haría'],
            [/\btenia\b/gi, (m) => m[0] === 'T' ? 'Tenía' : 'tenía'],
            [/\btenian\b/gi, (m) => m[0] === 'T' ? 'Tenían' : 'tenían'],
            [/\bqueria\b/gi, (m) => m[0] === 'Q' ? 'Quería' : 'quería'],
            [/\bestara\b/gi, (m) => m[0] === 'E' ? 'Estará' : 'estará'],
            // Sustantivos y términos de negocio / cocina / panadería
            [/\bpanaderia\b/gi, (m) => m[0] === 'P' ? 'Panadería' : 'panadería'],
            [/\breposteria\b/gi, (m) => m[0] === 'R' ? 'Repostería' : 'repostería'],
            [/\bpromocion\b/gi, (m) => m[0] === 'P' ? 'Promoción' : 'promoción'],
            [/\bpromociones\b/gi, (m) => m[0] === 'P' ? 'Promociones' : 'promociones'],
            [/\bproduccion\b/gi, (m) => m[0] === 'P' ? 'Producción' : 'producción'],
            [/\bporcion\b/gi, (m) => m[0] === 'P' ? 'Porción' : 'porción'],
            [/\bporciones\b/gi, (m) => m[0] === 'P' ? 'Porciones' : 'porciones'],
            [/\batencion\b/gi, (m) => m[0] === 'A' ? 'Atención' : 'atención'],
            [/\bubicacion\b/gi, (m) => m[0] === 'U' ? 'Ubicación' : 'ubicación'],
            [/\binformacion\b/gi, (m) => m[0] === 'I' ? 'Información' : 'información'],
            [/\bcorrecion\b/gi, (m) => m[0] === 'C' ? 'Corrección' : 'corrección'],
            [/\bcorreccion\b/gi, (m) => m[0] === 'C' ? 'Corrección' : 'corrección'],
            [/\bortografia\b/gi, (m) => m[0] === 'O' ? 'Ortografía' : 'ortografía'],
            [/\bortografico\b/gi, (m) => m[0] === 'O' ? 'Ortográfico' : 'ortográfico'],
            [/\bortograficos\b/gi, (m) => m[0] === 'O' ? 'Ortográficos' : 'ortográficos'],
            [/\bortografica\b/gi, (m) => m[0] === 'O' ? 'Ortográfica' : 'ortográfica'],
            [/\bortograficas\b/gi, (m) => m[0] === 'O' ? 'Ortográficas' : 'ortográficas'],
            [/\bnumero\b/gi, (m) => m[0] === 'N' ? 'Número' : 'número'],
            [/\bnumeros\b/gi, (m) => m[0] === 'N' ? 'Números' : 'números'],
            [/\bexito\b/gi, (m) => m[0] === 'E' ? 'Éxito' : 'éxito'],
            [/\bmenu\b/gi, (m) => m[0] === 'M' ? 'Menú' : 'menú'],
            [/\bcafe\b/gi, (m) => m[0] === 'C' ? 'Café' : 'café'],
            [/\blinea\b/gi, (m) => m[0] === 'L' ? 'Línea' : 'línea'],
            [/\bdia\b/gi, (m) => m[0] === 'D' ? 'Día' : 'día'],
            [/\bdias\b/gi, (m) => m[0] === 'D' ? 'Días' : 'días'],
            [/\bmanana\b/gi, (m) => m[0] === 'M' ? 'Mañana' : 'mañana'],
            [/\bano\b/gi, (m) => m[0] === 'A' ? 'Año' : 'año'],
            [/\banos\b/gi, (m) => m[0] === 'A' ? 'Años' : 'años'],
            [/\bcucuta\b/gi, 'Cúcuta'],
            // Correcciones exactas solicitadas
            [/\bproxima\b/gi, (m) => m[0] === 'P' ? 'Próxima' : 'próxima'],
            [/\bproximas\b/gi, (m) => m[0] === 'P' ? 'Próximas' : 'próximas'],
            [/\bproximo\b/gi, (m) => m[0] === 'P' ? 'Próximo' : 'próximo'],
            [/\bproximos\b/gi, (m) => m[0] === 'P' ? 'Próximos' : 'próximos'],
            [/\bconosimiento\b/gi, (m) => m[0] === 'C' ? 'Conocimiento' : 'conocimiento'],
            [/\bconosimientos\b/gi, (m) => m[0] === 'C' ? 'Conocimientos' : 'conocimientos'],
            [/\boprotunidad\b/gi, (m) => m[0] === 'O' ? 'Oportunidad' : 'oportunidad'],
            [/\boprotunidades\b/gi, (m) => m[0] === 'O' ? 'Oportunidades' : 'oportunidades'],
            [/\boportunidad\b/gi, (m) => m[0] === 'O' ? 'Oportunidad' : 'oportunidad'],
            [/\boportunidades\b/gi, (m) => m[0] === 'O' ? 'Oportunidades' : 'oportunidades'],
            // Salvaguarda: deshacer cualquier deformación errónea 'un aproxima' -> 'una próxima'
            [/\bun\s+aproxima\b/gi, 'una próxima'],
            // Preguntas y pronombres
            [/\bque\b(?=\s+(?:quieres|hacer|recomiendas|opinas|tal|paso|pasó|es|son|lleva|contiene|cuesta|vale)\b)/gi, (m) => m[0] === 'Q' ? 'Qué' : 'qué'],
            [/\bcomo\b(?=\s+(?:estas|vamos|hacer|te|funciona|haces|lograr|preparar)\b)/gi, (m) => m[0] === 'C' ? 'Cómo' : 'cómo'],
            [/\bdonde\b(?=\s+(?:estas|queda|comprar|conseguir|venden)\b)/gi, (m) => m[0] === 'D' ? 'Dónde' : 'dónde'],
            [/\bcuando\b(?=\s+(?:sale|llega|abren|cerramos)\b)/gi, (m) => m[0] === 'C' ? 'Cuándo' : 'cuándo']
        ];

        for (const [regex, replacement] of wordReplacements) {
            processed = processed.replace(regex, replacement);
        }

        // 3. Puntuación y espaciado: sin espacios antes de punto/coma/dos puntos, un espacio después
        processed = processed.replace(/\s+([,.:;?!])/g, '$1');
        processed = processed.replace(/([,.:;?!])(?=[^\s\d\n)\]"'»”])/g, '$1 ');

        // 4. Mayúscula al inicio del texto
        processed = processed.replace(/^\s*([a-záéíóúñ])/i, (m, letter) => letter.toUpperCase());

        // 5. Mayúscula después de punto (o punto y aparte), signos de interrogación o exclamación
        processed = processed.replace(/([.!?]\s+)([a-záéíóúñ])/g, (m, punc, letter) => punc + letter.toUpperCase());

        // 6. Formatear listas sueltas o viñetas
        processed = processed.replace(/^[-*•]\s*(.+)$/gm, (line, content) => {
            const trimmed = content.trim();
            const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
            return `• **${capitalized}**`;
        });

        // 7. Formatear listas numeradas: "1. item" -> "1. **Item**"
        processed = processed.replace(/^(\d+)[.)]\s*([^*].+)$/gm, (line, num, content) => {
            const trimmed = content.trim();
            const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
            return `${num}. **${capitalized}**`;
        });

        return processed.trim();
    }

    /**
     * Capa Online Gratuita con LanguageTool (POST https://api.languagetool.org/v2/check).
     * Aplica los reemplazos sugeridos de mayor confianza. Si falla o no hay red, recurre limpiamente a correctLocal.
     */
    async correctWithLanguageTool(text) {
        if (!text || typeof text !== 'string') return '';
        if (text.length > 5000) {
            // Textos excesivamente largos los protegemos ejecutando local
            return this.correctLocal(text);
        }

        try {
            const fetchFn = (typeof fetch !== 'undefined') ? fetch : (typeof global !== 'undefined' && global.fetch ? global.fetch : null);
            if (!fetchFn) {
                return this.correctLocal(text);
            }

            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

            const params = new URLSearchParams();
            params.append('text', text);
            params.append('language', 'es');

            const response = await fetchFn(this.languageToolEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: params.toString(),
                signal: controller ? controller.signal : undefined
            });

            if (timeoutId) clearTimeout(timeoutId);

            if (!response.ok) {
                return this.correctLocal(text);
            }

            const data = await response.json();
            if (!data || !Array.isArray(data.matches) || data.matches.length === 0) {
                return this.correctLocal(text);
            }

            // Aplicar correcciones desde el final hacia el principio para mantener offsets
            const matches = data.matches.slice().sort((a, b) => b.offset - a.offset);
            let textArray = Array.from(text);

            for (const match of matches) {
                if (match.replacements && match.replacements.length > 0) {
                    let best = match.replacements[0].value;
                    const originalSnippet = text.substring(match.offset, match.offset + match.length);

                    // Si el original contenía "una proxima" y la primera opción es "un aproxima",
                    // seleccionar preferentemente "una próxima"
                    if (/\buna\s+proxima\b/i.test(originalSnippet) || /\buna\s+proxima\b/i.test(match.context.text || '')) {
                        const goodOpt = match.replacements.find(r => /\buna\s+próxima\b/i.test(r.value));
                        if (goodOpt) best = goodOpt.value;
                    }

                    const offset = match.offset;
                    const length = match.length;
                    textArray.splice(offset, length, best);
                }
            }

            const languageToolResult = textArray.join('');
            // Pulir además con normalizaciones locales (mayúsculas, listas)
            return this.correctLocal(languageToolResult);
        } catch (e) {
            // Fallback transparente sin conexión
            return this.correctLocal(text);
        }
    }

    /**
     * Evalúa si el texto trata sobre panadería, ventas, marketing o alimentos.
     */
    isBakeryOrMarketingContent(text) {
        if (!text) return false;
        const norm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const bakeryKeywords = [
            'panaderia', 'reposteria', 'pan', 'panes', 'torta', 'tortas', 'pastel', 'pasteleria',
            'postre', 'postres', 'queso', 'harina', 'horno', 'amasar', 'cascarita', 'croissant',
            'mercadeo', 'marketing', 'ventas', 'clientes', 'promocion', 'negocio', 'local',
            'desayuno', 'combo', 'combos', 'estrategia', 'marca', 'comercial', 'oferta', 'fidelizacion'
        ];
        return bakeryKeywords.some(kw => norm.includes(kw));
    }

    /**
     * Genera la sección de Bono de Socio Estratégico adaptando las ideas a Punto Dulce en Cúcuta.
     */
    generatePuntoDulceAdaptation(text) {
        const textLower = text.toLowerCase();
        let items = [];

        // 1. Pan Cascarita y Pan de Queso (Pilar de la mañana y tarde)
        items.push("🥐 **Impulso de Desayunos y Tardes con Pan Cascarita y Pan de Queso:** Combina nuestro auténtico *Pan Cascarita* recién salido del horno con chocolate o café caliente, y ofrece el *Pan de Queso* costeño en promociones 'Lleva 4 y el 5to con 50% de descuento' en horas pico (6:30 AM a 8:30 AM y 4:30 PM a 6:30 PM).");

        // 2. Roliqueso y Pasabocas
        items.push("🧀 **Combo Estrella de Media Tarde (Roliqueso + Bebida):** Posiciona el *Roliqueso* como el snack insignia de media tarde para estudiantes y trabajadores de la zona, asegurando una rotación rápida con margen superior al 35%.");

        // 3. Tortas bajo pedido y Personalizadas
        items.push("🎂 **Línea de Tortas Personalizadas y Postres Bajo Pedido:** Utiliza WhatsApp Business con catálogo visual interactivo de nuestras tortas temáticas (fresas, chocolate y personalizadas para cumpleaños), manejando anticipo del 50% para proteger el flujo de caja.");

        // 4. Fidelización con Club Puntos VIP
        items.push("⭐ **Club Puntos VIP de Punto Dulce:** Implementa la tarjeta o registro digital donde cada compra acumula puntos canjeables por galletas artesanales, bolitas de maíz/leche o descuentos en fechas especiales.");

        // 5. Contexto Cúcuta y Venta Local
        items.push("📍 **Estrategia Local para Cúcuta:** Aprovecha el clima y la calidez de nuestra gente cucuteña para comunicar frescura horneada día a día, con entregas ágiles y servicio cercano de barrio que ninguna gran cadena puede igualar.");

        return `\n\n---\n💡 **Adaptación Directa para P&S Punto Dulce en Cúcuta:**\n` + items.join('\n\n');
    }

    /**
     * Flujo maestro: procesa el texto integrando corrección + adaptación.
     */
    async processText(text) {
        if (!text || typeof text !== 'string') return '';
        
        let corrected = await this.correctWithLanguageTool(text);
        if (!corrected || corrected.trim().length === 0) {
            corrected = this.correctLocal(text);
        }

        let result = `📝 **Texto Corregido y Optimizado:**\n\n${corrected}`;

        if (this.isBakeryOrMarketingContent(text)) {
            const adaptation = this.generatePuntoDulceAdaptation(text);
            result += adaptation;
        }

        return result;
    }
}

window.AI_CORE.TextProcessor = TextProcessor;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextProcessor };
}
