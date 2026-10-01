/**
 * ai-web-fetcher-tests.js -- Guardian Step 2
 * Pruebas para WebFetcher y HtmlSanitizer.
 * Ejecutar con: node ai-core/ai-web-fetcher-tests.js
 */
"use strict";

const fs = require('fs');

global.window = { AI_CORE: {} };

const code = fs.readFileSync('./ai-core/ai-web-fetcher.js', 'utf8');
eval('(function(window){ ' + code + ' })(global.window)');

const { HtmlSanitizer, StubWebFetcher, DdgWebFetcher } = global.window.AI_CORE;

let passed = 0; let failed = 0;

function assert(condition, message) {
    if (!condition) throw new Error('ASSERT FAILED: ' + message);
}

async function test(name, fn) {
    try {
        await fn();
        passed++;
        console.log('  [PASS] ' + name);
    } catch (err) {
        failed++;
        console.log('  [FAIL] ' + name);
        console.log('         ' + err.message);
    }
}

async function runAll() {
    console.log('\n=== Guardian Step 2: ai-web-fetcher Tests ===\n');

    await test('T1: HtmlSanitizer - Limpieza de scripts y estilos', async () => {
        const dirty = '<html><head><script>alert("bad")</script><style>body { color: red; }</style></head><body><h1>Titulo</h1><p>Texto de prueba con <a href="#">enlace</a>.</p><!-- comentario secreto --></body></html>';
        const res = HtmlSanitizer.strip(dirty);
        assert(!res.text.includes('alert'), 'Script no fue eliminado');
        assert(!res.text.includes('body {'), 'Style no fue eliminado');
        assert(!res.text.includes('secreto'), 'Comentario no fue eliminado');
        assert(!res.text.includes('<'), 'Quedaron etiquetas HTML');
        assert(res.text.includes('Titulo'), 'Falta el titulo');
        assert(res.text.includes('Texto de prueba con enlace'), 'Falta el texto visible');
        assert(!res.truncated, 'No debio truncarse');
    });

    await test('T2: HtmlSanitizer - Truncado', async () => {
        const text = '<p>' + 'A'.repeat(5000) + '</p>';
        const res = HtmlSanitizer.strip(text, 1000);
        assert(res.truncated === true, 'Debio truncarse');
        assert(res.text.length <= 1015, 'Longitud excede el limite'); 
        assert(res.text.endsWith('[TRUNCADO]'), 'Falta el sufijo de truncado');
    });

    await test('T3: StubWebFetcher - Busqueda y Fetch exitoso', async () => {
        const fetcher = new StubWebFetcher({
            search: { 'test': [{ url: 'http://example.com', title: 'Ejemplo', snippet: 'Snippet de ejemplo' }] },
            pages: { 'http://example.com': { title: 'Pagina Ejemplo', html: '<p>Contenido <b>importante</b></p>' } }
        });
        const sRes = await fetcher.search('test');
        assert(sRes.length === 1, 'Debio retornar 1 resultado');
        assert(sRes[0].trustLevel === 'WEB_UNVERIFIED', 'Debe marcarse como WEB_UNVERIFIED');
        const pRes = await fetcher.fetchPage('http://example.com');
        assert(pRes.error === null, 'No debe haber error');
        assert(pRes.title === 'Pagina Ejemplo', 'Titulo incorrecto');
        assert(pRes.text === 'Contenido importante', 'HTML no fue sanitizado');
        assert(pRes.trustLevel === 'WEB_UNVERIFIED', 'Debe marcarse como WEB_UNVERIFIED');
    });

    await test('T4: StubWebFetcher - Timeout simulado', async () => {
        const fetcher = new StubWebFetcher({ simulateTimeout: true });
        const pRes = await fetcher.fetchPage('http://timeout.com');
        assert(pRes.error !== null, 'Debio retornar un error');
        assert(pRes.error.includes('TIMEOUT'), 'Error debio ser TIMEOUT');
        assert(pRes.text === '', 'Texto debio estar vacio en error');
    });

    await test('T5: DdgWebFetcher - Manejo de esquemas invalidos', async () => {
        const fetcher = new DdgWebFetcher();
        const pRes = await fetcher.fetchPage('ftp://example.com');
        assert(pRes.error !== null, 'Debe fallar para ftp://');
        assert(pRes.error.includes('INVALID_SCHEME'), 'Debe dar error de esquema');
    });

    await test('T6: DdgWebFetcher - Error de red manejado', async () => {
         const fetcher = new DdgWebFetcher({ timeoutMs: 2000 });
         const pRes = await fetcher.fetchPage('http://this-domain-surely-does-not-exist-12345.com');
         assert(pRes.error !== null, 'Debe devolver un error para dominios inexistentes');
         assert(pRes.error.includes('NETWORK_ERROR') || pRes.error.includes('CORS_BLOCKED'), 'Debe clasificar el error correctamente');
    });

    console.log('\n--- Resultados ---');
    console.log('PASS: ' + passed + '   FAIL: ' + failed);
    if (failed > 0) { process.exit(1); } else { console.log('Todas las pruebas pasaron.\n'); }
}

runAll().catch(err => { console.error('ERROR FATAL:', err.message); process.exit(1); });