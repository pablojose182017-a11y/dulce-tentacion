#!/usr/bin/env node

const fs = require('fs');

const UNICODE_TO_WIN1252_BYTE = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F
};

function canReverseToWin1252(codePoint) {
  return (codePoint <= 0xFF) || (UNICODE_TO_WIN1252_BYTE[codePoint] !== undefined);
}

// Debug the sequence detection in admin file
const admin = fs.readFileSync('admin-dashboard-fragment.html');
const adminString = admin.toString('utf8');

console.log('Admin file size:', admin.length, 'bytes');
console.log('String length:', adminString.length, 'chars');

// Find the offset where "ðŸ"Š" appears
const targetPattern = 'ðŸ"Š';
const patternIdx = adminString.indexOf(targetPattern);

console.log(`\nPattern "${targetPattern}" found at string index:`, patternIdx);

if (patternIdx >= 0) {
  // Show context around it
  const start = Math.max(0, patternIdx - 20);
  const end = Math.min(adminString.length, patternIdx + 30);
  const context = adminString.substring(start, end);
  
  console.log('Context:', JSON.stringify(context));
  
  // Now run the sequence detection starting around this area
  console.log('\nTesting sequence detection around this position...');
  
  let i = Math.max(0, patternIdx - 5);
  const endPos = Math.min(adminString.length, patternIdx + 10);
  
  while (i < endPos) {
    const char = adminString[i];
    const cp = char.charCodeAt(0);
    
    console.log(`[${i}] "${char}" (U+${cp.toString(16).toUpperCase()}) - can reverse: ${canReverseToWin1252(cp)}`);
    
    if (canReverseToWin1252(cp)) {
      // Start collecting sequence
      let j = i;
      while (j < adminString.length && canReverseToWin1252(adminString.charCodeAt(j))) {
        j++;
      }
      
      if (j > i) {
        const candidate = adminString.substring(i, j);
        console.log(`    → Candidate sequence (${i} to ${j}): "${candidate}"`);
        
        // Test this candidate  
        console.log(`    → Length: ${candidate.length} chars`);
        
        // This should be our mojibake sequence!
        if (candidate.includes('ðŸ"Š')) {
          console.log('    → ✓ CONTAINS TARGET PATTERN!');
          
          // Test reverse transformation
          const testBytes = [];
          for (const c of candidate) {
            const ccp = c.charCodeAt(0);
            const byte = (ccp <= 0xFF) ? ccp : UNICODE_TO_WIN1252_BYTE[ccp];
            if (byte !== undefined) testBytes.push(byte);
          }
          
          const reversed = Buffer.from(testBytes);
          console.log(`    → Reversed bytes: ${reversed.toString('hex').toUpperCase()}`);
          
          try {
            const recovered = reversed.toString('utf8');
            console.log(`    → Recovered: "${recovered}"`);
            console.log(`    → Valid UTF-8: ${!recovered.includes('\\ufffd')}`);
          } catch (e) {
            console.log(`    → Failed to decode: ${e.message}`);
          }
        }
        
        i = j;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
}