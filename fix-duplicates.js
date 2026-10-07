const fs = require('fs');
let c = fs.readFileSync('admin-core.js', 'utf8');

// 1. Remove adminDeleteUser (Version 2 from control-roles.js)
let m = c.match(/\/\/ Extracted from control-roles\.js\nwindow\.adminDeleteUser = function \(emailTarget\) \{[\s\S]*?\}\;/);
if (m) {
    c = c.replace(m[0], '');
    console.log("Removed adminDeleteUser V2");
}

// 2. Remove adminToggleBlock (Version 1 from script.js)
m = c.match(/\/\/ Extracted from script\.js\nwindow\.adminToggleBlock = function\(email\) \{[\s\S]*?\}\n/);
if (m) {
    c = c.replace(m[0], '');
    console.log("Removed adminToggleBlock V1");
}

// 3. Remove updateUserRole (Version 1 from script.js)
m = c.match(/\/\/ Extracted from script\.js\nwindow\.updateUserRole = async function\(email, role\) \{[\s\S]*?\}\n/);
if (m) {
    c = c.replace(m[0], '');
    console.log("Removed updateUserRole V1");
}

fs.writeFileSync('admin-core.js', c);
console.log('Done');
