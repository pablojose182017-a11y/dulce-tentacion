// Diagnóstico dirigido de permisos
const fs = require('fs');

console.log('=== DIAGNÓSTICO DIRIGIDO: PERMISOS Y BOTÓN ADMINISTRATIVO ===\n');

// 1. Simulación de usuario nuevo creado por registerCustomUser()
const newUser = {
    name: 'Cliente Nuevo',
    email: 'testcliente@gmail.com',
    phone: '3001234567',
    birthday: '1995-01-01',
    points: 15
    // NOTE: role y rol están undefined
};

// 2. Evaluaciones de script.js vs control-roles.js
let adminEmails = ['pablojose182017@gmail.com', 'dulcestentaciones2004@gmail.com'];
let workerEmails = [];

function checkPermissions(currentUser, adminEmails, workerEmails) {
    const normEmail = (currentUser.email || '').toLowerCase().trim();
    const isSuper = normEmail === 'pablojose182017@gmail.com' || normEmail === 'dulcestentaciones2004@gmail.com';
    const isAdmin = isSuper || (currentUser.role === 'admin') || (currentUser.rol === 'admin') || (currentUser.isAdmin === true) || ((typeof adminEmails !== 'undefined') && adminEmails.includes(currentUser.email));
    const isWorker = !isSuper && !isAdmin && ((currentUser.role === 'trabajador') || (currentUser.rol === 'trabajador') || ((typeof workerEmails !== 'undefined') && workerEmails.includes(currentUser.email)));
    return { isAdmin, isWorker };
}

console.log('1. Usuario nuevo con role undefined y workerEmails vacío:');
console.log(checkPermissions(newUser, adminEmails, workerEmails));

// 3. ¿Qué ocurre si workerEmails tenía almacenado el correo en localStorage (ej: pruebas previas de cocina/trabajador)?
console.log('\n2. Usuario nuevo cuyo email coincide con un workerEmail previo en localStorage:');
console.log(checkPermissions(newUser, adminEmails, ['testcliente@gmail.com']));

// 4. ¿Qué ocurre si workerEmails contiene entradas nulas o vacías o con espacios?
console.log('\n3. Usuario con email con mayúsculas/espacios (" testcliente@gmail.com "):');
const userWithSpaces = { ...newUser, email: ' TestCliente@gmail.com ' };
const workerList = ['testcliente@gmail.com'];
// Comparación actual: workerEmails.includes(currentUser.email)
const matchesCurrent = workerList.includes(userWithSpaces.email);
// Comparación normalizada:
const normU = (userWithSpaces.email || '').toLowerCase().trim();
const matchesNormalized = workerList.some(e => (e || '').toLowerCase().trim() === normU);
console.log('Match actual (sin normalizar):', matchesCurrent);
console.log('Match normalizado:', matchesNormalized);

// 5. Verificación de herencia de rol en script.js línea 1173 (registerCustomUser)
console.log('\n4. Herencia de rol desde dt_users_db si el email existía previamente como trabajador:');
const db_users_mock = [
    { email: 'testcliente@gmail.com', role: 'trabajador' }
];
const legacyUser = db_users_mock.find(u => u.email === newUser.email);
const inheritedRole = legacyUser ? legacyUser.role : undefined;
console.log('Rol heredado de legacy:', inheritedRole);

console.log('\n=== FIN DIAGNÓSTICO ===');
