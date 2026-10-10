const ADMIN_PATHS = [
    '/admin-dashboard-fragment.html',
    '/admin-core.js',
    '/contabilidad.js',
    '/costos-recetas.js',
    '/guardian-financiero.js',
    '/ai-guardian-bundle.js',
    '/ai-guardian-bundle.min.js'
];

const FIREBASE_API_KEY = 'AIzaSyAXsUDZeDStUV1oqfBfHre84u4u9TxYr1E';
const FIREBASE_PROJECT_ID = 'ps-punto-dulce';

function isBackupPath(pathname) {
    return /\.(?:bak|backup-[^/]+|before-[^/]+)$/i.test(pathname);
}

function minimumRole(pathname) {
    if (isBackupPath(pathname)) return 50;
    if (pathname.startsWith('/admin-dashboard-fragment.html') || pathname.startsWith('/admin-core.js')) return 20;
    return 50;
}

function errorResponse(status, message) {
    return new Response(message, {
        status,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'private, no-store, max-age=0'
        }
    });
}

function isProtectedPath(pathname) {
    return ADMIN_PATHS.some(path => pathname.startsWith(path)) || isBackupPath(pathname);
}

function firestoreIntegerValue(field) {
    if (!field) return 0;
    const value = field.integerValue ?? field.doubleValue ?? field.stringValue;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

/** Returns a denial Response or null when the request is authorized. */
export async function authorizeAdminAsset(request, env = {}, fetcher = fetch) {
    const pathname = new URL(request.url).pathname;
    if (!isProtectedPath(pathname)) return null;

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return errorResponse(405, 'Método no permitido.');
    }

    const authorization = request.headers.get('Authorization') || '';
    const tokenMatch = /^Bearer\s+([^\s]+)$/i.exec(authorization);
    if (!tokenMatch || tokenMatch[1].length > 8192) {
        return errorResponse(401, 'Se requiere una sesión autorizada.');
    }

    const idToken = tokenMatch[1];
    const apiKey = env.FIREBASE_API_KEY || FIREBASE_API_KEY;
    const projectId = env.FIREBASE_PROJECT_ID || FIREBASE_PROJECT_ID;
    const authBase = (env.FIREBASE_AUTH_BASE_URL || 'https://identitytoolkit.googleapis.com').replace(/\/$/, '');
    const firestoreBase = (env.FIREBASE_FIRESTORE_BASE_URL || 'https://firestore.googleapis.com').replace(/\/$/, '');

    try {
        // Identity Toolkit valida el token con Firebase Auth; no confiamos en
        // los roles ni en los datos de perfil enviados por el navegador.
        const authResponse = await fetcher(`${authBase}/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
        });
        if (!authResponse.ok) {
            return authResponse.status >= 500 || authResponse.status === 429
                ? errorResponse(503, 'No se pudo validar la sesión. Reintenta más tarde.')
                : errorResponse(401, 'La sesión no es válida o ha caducado.');
        }

        const authData = await authResponse.json();
        const account = Array.isArray(authData.users) ? authData.users[0] : null;
        if (!account || !account.localId || !account.email || account.disabled === true) {
            return errorResponse(401, 'La sesión no corresponde a una cuenta de personal activa.');
        }

        const roleUrl = `${firestoreBase}/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/roles/${encodeURIComponent(account.localId)}`;
        const roleResponse = await fetcher(roleUrl, {
            headers: { Authorization: `Bearer ${idToken}` }
        });

        let roleLevel = 0;
        if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            roleLevel = firestoreIntegerValue(roleData.fields && roleData.fields.nivel);
        } else if (roleResponse.status !== 404) {
            let errorCode = 'UNKNOWN';
            try {
                const errData = await roleResponse.json();
                if (errData && errData.error && errData.error.status) {
                    errorCode = errData.error.status;
                }
            } catch (e) {
                errorCode = 'PARSE_ERROR';
            }
            
            console.error(`[DIAGNOSTICO] Firestore HTTP ${roleResponse.status} - Status: ${errorCode}`);
            
            // Sin confirmación del rol se cierra el acceso. Respuesta pública genérica.
            return errorResponse(503, 'No fue posible verificar los permisos. Acceso cerrado.');
        }

        if (roleLevel < minimumRole(pathname)) {
            return errorResponse(403, 'Tu rol no tiene permiso para este recurso.');
        }
        return null;
    } catch (_error) {
        return errorResponse(503, 'Servicio de autorización no disponible. Acceso cerrado.');
    }
}

export async function handleAdminAssetRequest(context, fetcher = fetch) {
    const denial = await authorizeAdminAsset(context.request, context.env, fetcher);
    if (denial) return denial;

    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'private, no-store, max-age=0');
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

export async function onRequest(context) {
    return handleAdminAssetRequest(context);
}
