#!/usr/bin/env node
/**
 * PHASE 3.1: SIMPLE TARGETED MOJIBAKE DETECTOR
 * Focus on the exact known pattern
 */

const fs = require('fs');
const path = require('path');

const UNICODE_TO_WIN1252_BYTE = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F
};

function reverseToWin1252(str) {
  const bytes = [];
  for (const char of str) {
    const cp = char.charCodeAt(0);
    const byte = (cp <= 0xFF) ? cp : UNICODE_TO_WIN1252_BYTE[cp];
    if (byte === undefined) return null;
    bytes.push(byte);
  }
  return Buffer.from(bytes);
}

function isValidMojibake(candidate) {
  // Reverse to Win1252 bytes
  const reversed = reverseToWin1252(candidate);
  if (!reversed) return null;
  
  // Must be different from current UTF-8 bytes
  const currentBytes = Buffer.from(candidate, 'utf8');
  if (Buffer.compare(reversed, currentBytes) === 0) return null;
  
  // Decode as UTF-8
  let recovered;
  try {
    recovered = reversed.toString('utf8');
    if (recovered.includes('\ufffd')) return null;
  } catch (e) {
    return null;
  }
  
  // Must be different from current string
  if (recovered === candidate) return null;
  
  // Must contain emoji or special chars
  if (!/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u1F000-\u1F9FF]|[€™®©°±×÷§¶†‡…‹›""''–—•àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿšžœŸ]/u.test(recovered)) {
    return null;
  }
  
  return {
    currentString: candidate,
    currentBytes: currentBytes,
    recoveredBytes: reversed,
    recoveredString: recovered
  };
}

function scanForMojibake(fileString) {
  const results = [];
  
  // Strategy: scan for any sequence containing our known corrupted characters
  // Key corrupted chars: ð (U+F0), Ÿ (U+178)
  
  for (let i = 0; i < fileString.length; i++) {
    const char = fileString[i];
    const cp = char.charCodeAt(0);
    
    // If we find a potential mojibake start character
    if (cp === 0xF0 || cp === 0x178 || UNICODE_TO_WIN1252_BYTE[cp] !== undefined) {
      
      // Try different length sequences starting here
      for (let len = 2; len <= 10; len++) {
        if (i + len > fileString.length) break;
        
        const candidate = fileString.substring(i, i + len);
        const result = isValidMojibake(candidate);
        
        if (result) {
          results.push({
            start: i,
            end: i + len,
            ...result
          });
          break; // Found valid sequence, don't need to try longer ones
        }
      }
    }
  }
  
  return results;
}

function main() {
  console.log('========================================');
  console.log('PHASE 3.1: SIMPLE MOJIBAKE DETECTOR');
  console.log('========================================');
  
  const files = ['admin-dashboard-fragment.html', 'index.html'];
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) continue;
    
    const buffer = fs.readFileSync(filePath);
    const fileString = buffer.toString('utf8');
    
    console.log(`\n📄 ${file}`);
    console.log(`   Size: ${buffer.length} bytes`);
    
    const results = scanForMojibake(fileString);
    console.log(`   Mojibake found: ${results.length}`);
    
    if (results.length > 0) {
      // Group by pattern
      const patterns = {};
      for (const r of results) {
        const key = r.currentBytes.toString('hex').toUpperCase();
        if (!patterns[key]) patterns[key] = [];
        patterns[key].push(r);
      }
      
      console.log(`   Unique patterns: ${Object.keys(patterns).length}`);
      
      let num = 1;
      for (const [hex, instances] of Object.entries(patterns)) {
        const first = instances[0];
        console.log(`\n   [${num}] ${hex}`);
        console.log(`       Current:  "${first.currentString}"`);
        console.log(`       Recovered: "${first.recoveredString}"`);
        console.log(`       Count:     ${instances.length}`);
        console.log(`       Offsets:   ${instances.slice(0, 5).map(r => r.start).join(', ')}${instances.length > 5 ? '...' : ''}`);
        num++;
      }
    }
  }
  
  console.log('\n========================================');
  console.log('ANALYSIS COMPLETE');
  console.log('========================================');
}

main();