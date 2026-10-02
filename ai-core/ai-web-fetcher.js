window.AI_CORE = window.AI_CORE || {};

/**
 * ai-web-fetcher.js -- Guardian Step 2
 * ============================================================
 * Recuperador web aislado y reemplazable.
 *
 * Clases exportadas:
 *   HtmlSanitizer   -- Limpieza determinista de HTML (sin red, sin eval)
 *   WebFetcher      -- Clase base abstracta (interfaz reemplazable)
 *   StubWebFetcher  -- Sin red, para pruebas deterministas
 *   DdgWebFetcher   -- Proveedor real (DDG Instant Answer API)
 *
 * Garantias de seguridad:
 *   - Todo contenido recuperado se marca trustLevel: 'WEB_UNVERIFIED'
 *   - HTML sanitizado antes de pasar a cualquier modulo de razonamiento
 *   - Nunca se evalua el contenido como instruccion de sistema
 *   - Timeouts y limites de tamano aplicados en todas las rutas
 *
 * Limitaciones de CORS (navegador):
 *   search()    -> DDG Instant Answer API incluye CORS headers: OK en navegador
 *                  LIMITACION: Solo Instant Answers (Wikipedia, definiciones).
 *                  No es un motor de busqueda web general.
 *   fetchPage() -> fetch() a URLs arbitrarias FALLA en el navegador si el
 *                  servidor no incluye CORS headers (mayoria no los incluye).
 *                  En Node.js funciona sin restricciones.
 *                  No se implementa proxy sin autorizacion explicita.
 */

// ============================================================
// HtmlSanitizer -- Funcion pura, sin estado, sin red, sin eval
// ============================================================
class HtmlSanitizer {
    /**
     * Convierte HTML a texto plano sanitizado con limite de tamano.
     * @param {string} html
     * @param {number} maxBytes - Limite en bytes (default 10240)
     * @returns {{ text: string, truncated: boolean, originalBytes: number }}
     */
    static strip(html, maxBytes) {
        if (maxBytes === undefined) maxBytes = 10240;
        if (!html || typeof html !== 'string') {
            return { text: '', truncated: false, originalBytes: 0 };
        }
        const originalBytes = (typeof Buffer !== 'undefined')
            ? Buffer.byteLength(html, 'utf8')
            : html.length;

        let t = html;
        t = t.replace(/<script[\s\S]*?<\/script>/gi, ' ');
        t = t.replace(/<style[\s\S]*?<\/style>/gi,   ' ');
        t = t.replace(/<!--[\s\S]*?-->/g,              ' ');
        t = t.replace(/<\/?(p|div|br|h[1-6]|li|tr|td|th|section|article|header|footer|nav|main)[^>]*>/gi, '\n');
        t = t.replace(/<[^>]{0,1000}>/g, ' ');
        t = HtmlSanitizer.decodeEntities(t);
        t = t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

        let truncated = false;
        if (t.length > maxBytes) {
            t = t.slice(0, maxBytes);
            const lastSpace = t.lastIndexOf(' ');
            if (lastSpace > maxBytes * 0.8) t = t.slice(0, lastSpace);
            t = t + ' [TRUNCADO]';
            truncated = true;
        }
        return { text: t, truncated, originalBytes };
    }

    /** Decodifica entidades HTML comunes sin usar el DOM ni eval. */
    static decodeEntities(str) {
        if (!str) return '';
        return str
            .replace(/&amp;/g,    '&')
            .replace(/&lt;/g,     '<')
            .replace(/&gt;/g,     '>')
            .replace(/&quot;/g,   '"')
            .replace(/&#39;/g,    "'")
            .replace(/&apos;/g,   "'")
            .replace(/&nbsp;/g,   ' ')
            .replace(/&mdash;/g,  '--')
            .replace(/&ndash;/g,  '-')
            .replace(/&hellip;/g, '...')
            .replace(/&#(\d+);/g, (m, code) => {
                const n = parseInt(code, 10);
                if (n >= 32  && n < 127) return String.fromCharCode(n);
                if (n >= 160 && n < 256) return String.fromCharCode(n);
                return ' ';
            });
    }
}

// ============================================================
// WebFetcher -- Clase base abstracta (interfaz reemplazable)
// ============================================================
class WebFetcher {
    async search(query, maxResults) {
        throw new Error('WebFetcher.search() debe ser implementado por la subclase.');
    }
    async fetchPage(url, options) {
        throw new Error('WebFetcher.fetchPage() debe ser implementado por la subclase.');
    }
    _errorResult(url, errorMessage) {
        return {
            url:          url || '',
            title:        '',
            text:         '',
            retrievedAt:  new Date().toISOString(),
            bytesFetched: 0,
            truncated:    false,
            trustLevel:   'WEB_UNVERIFIED',
            error:        errorMessage
        };
    }
}

// ============================================================
// StubWebFetcher -- Sin red, para pruebas deterministas
// ============================================================
class StubWebFetcher extends WebFetcher {
    /**
     * @param {Object} fixtures
     * @param {Object} fixtures.search  - Mapa query -> [{ url, title, snippet }]
     * @param {Object} fixtures.pages   - Mapa url -> { html, title }
     * @param {boolean} fixtures.simulateTimeout      - fetchPage devuelve error de timeout
     * @param {boolean} fixtures.simulateNetworkError - search lanza error de red
     */
    constructor(fixtures) {
        super();
        fixtures = fixtures || {};
        this._searchFixtures       = fixtures.search || {};
        this._pageFixtures         = fixtures.pages  || {};
        this._simulateTimeout      = !!fixtures.simulateTimeout;
        this._simulateNetworkError = !!fixtures.simulateNetworkError;
        this._defaultMaxBytes      = 10240;
    }

    async search(query, maxResults) {
        if (maxResults === undefined) maxResults = 5;
        if (this._simulateNetworkError) {
            throw new Error('NETWORK_ERROR: No se pudo conectar al proveedor de busqueda.');
        }
        const key = (query || '').toLowerCase().trim();
        let results = this._searchFixtures[key] || null;
        if (!results) {
            for (const k of Object.keys(this._searchFixtures)) {
                if (key.includes(k) || k.includes(key)) { results = this._searchFixtures[k]; break; }
            }
        }
        results = results || [];
        return results.slice(0, maxResults).map(r => Object.assign({}, r, {
            retrievedAt: new Date().toISOString(),
            trustLevel:  'WEB_UNVERIFIED'
        }));
    }

    async fetchPage(url, options) {
        options = options || {};
        const maxBytes = options.maxBytes || this._defaultMaxBytes;
        if (this._simulateTimeout) {
            return this._errorResult(url, 'TIMEOUT: La solicitud supero el tiempo limite.');
        }
        const fixture = this._pageFixtures[url] || null;
        if (!fixture) {
            return this._errorResult(url, 'STUB_NOT_FOUND: URL no registrada en fixtures.');
        }
        const sanitized = HtmlSanitizer.strip(fixture.html || '', maxBytes);
        return {
            url,
            title:        fixture.title || '',
            text:         sanitized.text,
            retrievedAt:  new Date().toISOString(),
            bytesFetched: sanitized.originalBytes,
            truncated:    sanitized.truncated,
            trustLevel:   'WEB_UNVERIFIED',
            error:        null
        };
    }
}

// ============================================================
// DdgWebFetcher -- DuckDuckGo Instant Answer API
// ============================================================
class DdgWebFetcher extends WebFetcher {
    constructor(options) {
        super();
        options = options || {};
        this._timeoutMs = (typeof options.timeoutMs === 'number' && options.timeoutMs > 0)
            ? options.timeoutMs : 8000;
        this._maxBytes  = (typeof options.maxBytes === 'number' && options.maxBytes > 0)
            ? options.maxBytes : 10240;
        this._DDG_API   = 'https://api.duckduckgo.com/';
    }

    _buildSearchUrl(query) {
        const params = new URLSearchParams({
            q: query, format: 'json', no_html: '1',
            skip_disambig: '1', no_redirect: '1', kl: 'wt-wt'
        });
        return this._DDG_API + '?' + params.toString();
    }

    async _fetchWithTimeout(url, timeoutMs) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        } finally {
            clearTimeout(timer);
        }
    }

    async search(query, maxResults) {
        if (maxResults === undefined) maxResults = 5;
        if (!query || !query.trim()) return [];
        const results = [];
        const at = new Date().toISOString();

        // FASE 14 - BUSINESS DISCOVERY FIX
        const isBusinessQuery = /panader[ií]as?|negocios?|restaurantes?|empresas?|tiendas?/i.test(query);
        if (isBusinessQuery) {
            try {
                const stopwords = new Set(['busca', 'internet', 'sobre', 'para', 'como', 'cual', 'que', 'quien', 'las', 'los', 'del', 'en']);
                const queryTokens = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(t => !stopwords.has(t));
                const nomQuery = queryTokens.join(' ');
                
                const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nomQuery)}&format=json&addressdetails=1&extratags=1`;
                // Add a small delay/timeout specifically for Nominatim to prevent rate limiting, though our wrapper handles timeouts
                const nomRes = await this._fetchWithTimeout(nomUrl, this._timeoutMs);
                if (nomRes.ok) {
                    const nomData = await nomRes.json();
                    for (const item of nomData) {
                        if (results.length >= maxResults) break;
                        let snippet = `Negocio: ${item.name || 'Desconocido'}. `;
                        if (item.address) {
                            const addr = [];
                            if (item.address.road) addr.push(item.address.road);
                            if (item.address.neighbourhood) addr.push(item.address.neighbourhood);
                            if (item.address.city || item.address.county) addr.push(item.address.city || item.address.county);
                            snippet += `Ubicación: ${addr.join(', ')}.`;
                        }
                        // Solo incluimos si el snippet provee algo más que "Desconocido"
                        if (item.name) {
                            results.push({
                                url: `https://www.openstreetmap.org/${item.osm_type}/${item.osm_id}`,
                                title: item.name || item.display_name.split(',')[0],
                                snippet: snippet,
                                retrievedAt: at,
                                trustLevel: 'WEB_UNVERIFIED'
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn("Nominatim fallback failed:", e.message);
            }
            if (results.length > 0) return results; // Return early if we got business results
        }

        const url = this._buildSearchUrl(query.trim());
        let response;
        try {
            response = await this._fetchWithTimeout(url, this._timeoutMs);
        } catch (err) {
            const msg = err.name === 'AbortError'
                ? 'TIMEOUT: La busqueda DDG supero ' + this._timeoutMs + 'ms.'
                : 'NETWORK_ERROR: ' + err.message;
            throw new Error(msg);
        }
        if (!response.ok) throw new Error('DDG_HTTP_ERROR: ' + response.status);
        let data;
        try { data = await response.json(); }
        catch (err) { throw new Error('DDG_PARSE_ERROR: JSON invalido.'); }

        if (data.Abstract && data.AbstractURL) {
            results.push({
                url: data.AbstractURL, title: data.Heading || query,
                snippet: HtmlSanitizer.decodeEntities(data.Abstract || ''), retrievedAt: at, trustLevel: 'WEB_UNVERIFIED'
            });
        }
        for (const topic of (data.RelatedTopics || [])) {
            if (results.length >= maxResults) break;
            if (topic && topic.FirstURL && topic.Text) {
                results.push({
                    url: topic.FirstURL, title: topic.Text.split(' - ')[0],
                    snippet: HtmlSanitizer.decodeEntities(topic.Text), retrievedAt: at, trustLevel: 'WEB_UNVERIFIED'
                });
            }
            for (const sub of (topic.Topics || [])) {
                if (results.length >= maxResults) break;
                if (sub && sub.FirstURL && sub.Text) {
                    results.push({
                        url: sub.FirstURL, title: sub.Text.split(' - ')[0],
                        snippet: HtmlSanitizer.decodeEntities(sub.Text), retrievedAt: at, trustLevel: 'WEB_UNVERIFIED'
                    });
                }
            }
        }

        // FASE 14 - BROWSER RETRIEVAL FIX:
        // DDG Instant Answer fails for complex queries. Wikipedia API is a free, CORS-enabled fallback.
        if (results.length === 0) {
            try {
                const wikiUrl = `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query.trim())}&utf8=&format=json&origin=*`;
                const wikiRes = await this._fetchWithTimeout(wikiUrl, this._timeoutMs);
                if (wikiRes.ok) {
                    const wikiData = await wikiRes.json();
                    if (wikiData.query && wikiData.query.search) {
                        for (const item of wikiData.query.search) {
                            if (results.length >= maxResults) break;
                            const plainSnippet = HtmlSanitizer.strip(item.snippet, 1024).text;
                            results.push({
                                url: `https://es.wikipedia.org/?curid=${item.pageid}`,
                                title: item.title,
                                snippet: plainSnippet,
                                retrievedAt: at,
                                trustLevel: 'WEB_UNVERIFIED'
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn("Wikipedia fallback failed:", e.message);
            }
        }

        return results.slice(0, maxResults);
    }

    async fetchPage(url, options) {
        options = options || {};
        const timeoutMs = options.timeoutMs || this._timeoutMs;
        const maxBytes  = options.maxBytes  || this._maxBytes;
        if (!url || typeof url !== 'string') return this._errorResult('', 'URL invalida.');
        if (!/^https?:\/\//i.test(url)) return this._errorResult(url, 'INVALID_SCHEME: Solo http/https.');
        let response;
        try {
            response = await this._fetchWithTimeout(url, timeoutMs);
        } catch (err) {
            if (err.name === 'AbortError') return this._errorResult(url, 'TIMEOUT: fetchPage supero ' + timeoutMs + 'ms.');
            const msg = err.message || '';
            const isCors = /cors|failed to fetch|network/i.test(msg);
            return this._errorResult(url, isCors
                ? 'CORS_BLOCKED: El servidor no permite acceso desde el navegador. Funciona en Node.js.'
                : 'NETWORK_ERROR: ' + msg);
        }
        if (!response.ok) return this._errorResult(url, 'HTTP_ERROR: ' + response.status);
        const ct = response.headers.get('content-type') || '';
        if (!ct.includes('html') && !ct.includes('text')) return this._errorResult(url, 'UNSUPPORTED_CONTENT_TYPE: ' + ct);
        let rawHtml;
        try { rawHtml = await response.text(); }
        catch (err) { return this._errorResult(url, 'READ_ERROR: ' + err.message); }
        const sanitized = HtmlSanitizer.strip(rawHtml, maxBytes);
        const titleMatch = rawHtml.match(/<title[^>]*>([^<]{0,200})<\/title>/i);
        const title = titleMatch ? HtmlSanitizer.decodeEntities(titleMatch[1].trim()) : url;
        return {
            url, title, text: sanitized.text,
            retrievedAt: new Date().toISOString(),
            bytesFetched: sanitized.originalBytes,
            truncated: sanitized.truncated,
            trustLevel: 'WEB_UNVERIFIED', error: null
        };
    }
}

window.AI_CORE.HtmlSanitizer = HtmlSanitizer;
window.AI_CORE.WebFetcher     = WebFetcher;
window.AI_CORE.StubWebFetcher = StubWebFetcher;
window.AI_CORE.DdgWebFetcher  = DdgWebFetcher;
