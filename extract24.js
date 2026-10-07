const fs = require('fs');

let adminCore = fs.readFileSync('admin-core.js', 'utf8');
let controlRoles = fs.readFileSync('control-roles.js', 'utf8');

// 1. Remove proxy from control-roles.js
const toggleBlockProxyRegex = /\/\/ Extender el bloqueo para actualizar en Firestore[\s\S]*?if \(originalAdminToggleBlockFS\) originalAdminToggleBlockFS\(emailTarget\);\r?\n\};\r?\n/;
controlRoles = controlRoles.replace(toggleBlockProxyRegex, '');

// 2. Remove dangling adminDeleteUser proxy
const deleteUserProxyRegex = /\/\/ Extender eliminación de usuario para proteger a los Super Admins\r?\nconst originalAdminDeleteUser = window\.adminDeleteUser;\r?\n/;
controlRoles = controlRoles.replace(deleteUserProxyRegex, '');

// 3. Extract Promo Regalo functions
const promoFunctionsRegex = /(window\.eliminarPromoRegalo = function \(\) \{[\s\S]*?)(?=\r?\nwindow\.abrirModalPromoRegalo)/;
const promoFunctionsRegex2 = /(window\.abrirModalPromoRegalo = function \(\) \{[\s\S]*?)(?=\r?\nwindow\.guardarPromoRegalo)/;
const promoFunctionsRegex3 = /(window\.guardarPromoRegalo = function \(\) \{[\s\S]*?\r?\n\});?/;

let p1 = controlRoles.match(promoFunctionsRegex);
let p2 = controlRoles.match(promoFunctionsRegex2);
let p3 = controlRoles.match(promoFunctionsRegex3);

if (p1 && p2 && p3) {
    adminCore += '\n\n// Extracted from control-roles.js (Offers/Promo Regalo)\n';
    adminCore += p1[1] + '\n';
    adminCore += p2[1] + '\n';
    adminCore += p3[1] + '\n';
    
    controlRoles = controlRoles.replace(promoFunctionsRegex, '');
    controlRoles = controlRoles.replace(promoFunctionsRegex2, '');
    controlRoles = controlRoles.replace(promoFunctionsRegex3, '');
} else {
    console.error("Could not find promo functions");
}

// 4. Inject Firestore sync into admin-core.js's adminToggleBlock
// We want to insert it right after `u.blocked = !u.blocked;`
const firestoreLogic = `
    // Firestore sync added from control-roles.js extraction
    if (typeof db !== 'undefined') {
        const nuevoEstado = u.blocked ? 'bloqueado' : 'activo';
        db.collection('usuarios').doc(targetEmail).update({ estado: nuevoEstado, blocked: u.blocked })
            .catch(err => console.warn('No se pudo guardar el estado en Firestore:', err));
    }
`;

adminCore = adminCore.replace(/(u\.blocked = !u\.blocked;)/, `$1${firestoreLogic}`);

fs.writeFileSync('admin-core.js', adminCore, 'utf8');
fs.writeFileSync('control-roles.js', controlRoles, 'utf8');
console.log("Extraction complete.");
