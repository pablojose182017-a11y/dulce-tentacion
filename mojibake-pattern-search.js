#!/usr/bin/env node
/**
 * Search for mojibake patterns more intelligently
 * Look for sequences of multi-byte UTF-8 that contain characters that,
 * when decoded and re-encoded as Windows-1252, yield emoji
 */

const fs = require('fs');

console.log('=== PATTERN-BASED MOJIBAKE SEARCH ===\n');

const admin = fs.readFileSync('admin-dashboard-fragment.html');
const index = fs.readFileSync('index.html');

// Known mojibake indicators:
// - ð (U+00F0) often starts emoji mojibake (from 0xF0)
// - Ÿ (U+0178) from 0x9F (Windows-1252)
// - î (U+00EE) from 0xEE
// - ï (U+00EF) from 0xEF
// - ¹² Followed by unusual patterns

const MOJIBAKE_START_CHARS = new Set([
  0xF0, // ð - starts 4-byte UTF-8 emoji
  0xEE, // î - could be emoji  
  0xEF, // ï - could be emoji
]);

const MOJIBAKE_INDICATOR_CHARS = new Set([
  String.fromCharCode(0xF0), // ð
  String.fromCharCode(0xEE), // î
  String.fromCharCode(0xEF), // ï
  String.fromCharCode(0x178), // Ÿ (Windows-1252 0x9F)
]);

function searchPatterns(buffer, fileName) {
  console.log(`\n📄 ${fileName}\n`);
  
  const fileStr = buffer.toString('utf8');
  let found = 0;
  
  // Look for ðŸ patterns (common emoji mojibake)
  const dyePattern = /ðŸ/g;
  let match;
  while ((match = dyePattern.exec(fileStr)) !== null) {
    const pos = match.index;
    
    // Get surrounding context
    let start = pos - 20;
    let end = pos + 30;
    start = Math.max(0, start);
    end = Math.min(fileStr.length, end);
    
    const context = fileStr.substring(start, end);
    const bytes = buffer.slice(start, end);
    
    console.log(`[${found + 1}] Found "ðŸ" at offset ${pos + start}:`);
    console.log(`  Context: "${context}"`);
    console.log(`  Bytes: ${bytes.toString('hex')}`);
    console.log('');
    
    found++;
    if (found >= 10) break;
  }
  
  if (found === 0) {
    console.log('No "ðŸ" patterns found\n');
  }
  
  // Look for other mojibake patterns
  found = 0;
  const multiBytePattern = /[\xC0-\xDF][\x80-\xBF][\xC0-\xDF][\x80-\xBF]/g;
  // Actually need to search in bytes, not string
  
  console.log('Scanning for sequences of multi-byte UTF-8...');
  
  for (let i = 0; i < buffer.length - 10; i++) {
    // Look for start of 2-byte UTF-8 followed by another 2-byte UTF-8
    const byte1 = buffer[i];
    const byte2 = buffer[i + 1];
    const byte3 = buffer[i + 2];
    const byte4 = buffer[i + 3];
    
    // Check if byte1-2 is valid 2-byte UTF-8 and byte3-4 is also 2-byte UTF-8
    if ((byte1 >= 0xC0 && byte1 <= 0xDF && byte2 >= 0x80 && byte2 <= 0xBF) &&
        (byte3 >= 0xC0 && byte3 <= 0xDF && byte4 >= 0x80 && byte4 <= 0xBF)) {
      
      // Decode to characters
      const str = buffer.slice(i, i + 4).toString('utf8');
      const ch1 = str.charCodeAt(0);
      const ch2 = str.charCodeAt(1);
      
      // Check if chars look like mojibake
      // ð (U+00F0) followed by high Unicode indicates mojibake
      if (ch1 === 0xF0 && ch2 > 0xFF) {
        let context = buffer.slice(Math.max(0, i - 10), Math.min(buffer.length, i + 20));
        console.log(`\n[PATTERN] Potential mojibake at ${i}:`);
        console.log(`  Bytes: ${buffer.slice(i, i + 4).toString('hex')}`);
        console.log(`  Chars: U+${ch1.toString(16).toUpperCase()} + U+${ch2.toString(16).toUpperCase()}`);
        console.log(`  Context: "${context.toString('utf8')}"`);
        
        found++;
        if (found >= 5) break;
      }
    }
  }
}

searchPatterns(admin, 'admin-dashboard-fragment.html');
searchPatterns(index, 'index.html');
