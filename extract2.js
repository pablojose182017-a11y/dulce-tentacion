const fs = require('fs');
function extractFunction(file, funcNames) {
    let content = fs.readFileSync(file, 'utf8');
    let extracted = '';
    
    for (let name of funcNames) {
        let regexes = [
            new RegExp('^(?:window\\.)?'+name+'\\s*=\\s*(?:async\\s*)?function\\s*\\([^{]*\\)\\s*\\{', 'm'),
            new RegExp('^(?:async\\s*)?function\\s+'+name+'\\s*\\([^{]*\\)\\s*\\{', 'm')
        ];
        
        let match = null;
        for (let r of regexes) {
            match = content.match(r);
            if (match) break;
        }
        
        if (!match) {
            console.log('Not found: ' + name + ' in ' + file);
            continue;
        }
        
        let startIdx = match.index;
        let openBraces = 0;
        let inString = false;
        let stringChar = '';
        let endIdx = -1;
        
        for (let i = startIdx; i < content.length; i++) {
            let c = content[i];
            
            if (inString) {
                if (c === stringChar && content[i-1] !== '\\\\') inString = false;
            } else {
                if (c === '"' || c === "'" || c === "`") {
                    inString = true;
                    stringChar = c;
                } else if (c === '{') {
                    openBraces++;
                } else if (c === '}') {
                    openBraces--;
                    if (openBraces === 0) {
                        endIdx = i + 1;
                        break;
                    }
                }
            }
        }
        
        if (endIdx !== -1) {
            let funcCode = content.substring(startIdx, endIdx);
            if (content[endIdx] === ';') {
                funcCode += ';';
                endIdx++;
            }
            
            if (funcCode.startsWith('function ')) {
                let sig = funcCode.substring(0, funcCode.indexOf('{'));
                let rest = funcCode.substring(funcCode.indexOf('{'));
                sig = sig.replace('function ' + name, 'window.' + name + ' = function');
                funcCode = sig + rest;
            } else if (!funcCode.startsWith('window.')) {
                 funcCode = 'window.' + funcCode;
            }
            
            extracted += '\n// Extracted from ' + file + '\n' + funcCode + '\n';
            content = content.substring(0, startIdx) + content.substring(endIdx);
            console.log('Successfully extracted: ' + name);
        } else {
            console.log('Failed to parse braces for: ' + name);
        }
    }
    
    fs.writeFileSync(file, content, 'utf8');
    return extracted;
}

let toExtract = ['renderAdminDashboard'];
let res = extractFunction('script.js', toExtract);

if (res) {
    fs.appendFileSync('admin-core.js', '\n' + res, 'utf8');
    console.log('Extraction complete');
}
