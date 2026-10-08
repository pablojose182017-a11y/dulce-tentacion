#!/usr/bin/env node
/**
 * PHASE 3.1: FINAL CORRECT MOJIBAKE DETECTOR
 * 
 * Verified with actual file content: ðŸ"Š → 📊
 */

const fs = require('fs');
const path = require('path');

// Complete Windows-1252 mapping
const UNICODE_TO_WIN1252_BYTE = {
  0x20AC: 0x80, // €
  0x201A: 0x82, // ‚
  0x0192: 0x83, // ƒ
  0x201E: 0x84, // „
  0x2026: 0x85, // …
  0x2020: 0x86, // †
  0x2021: 0x87, // ‡
  0x02C6: 0x88, // ˆ
  0x2030: 0x89, // ‰
  0x0160: 0x8A, // Š
  0x2039: 0x8B, // ‹
  0x0152: 0x8C, // Œ
  0x017D: 0x8E, // Ž
  0x2018: 0x91, // '
  0x2019: 0x92, // '
  0x201C: 0x93, // "
  0x201D: 0x94, // "
  0x2022: 0x95, // •
  0x2013: 0x96, // –
  0x2014: 0x97, // —
  0x02DC: 0x98, // ˜
  0x2122: 0x99, // ™
  0x0161: 0x9A, // š
  0x203A: 0x9B, // ›
  0x0153: 0x9C, // œ
  0x017E: 0x9E, // ž
  0x0178: 0x9F  // Ÿ
};

function canReverseToWin1252(codePoint) {
  return (codePoint <= 0xFF) || (UNICODE_TO_WIN1252_BYTE[codePoint] !== undefined);
}

function getWin1252Byte(codePoint) {
  if (codePoint <= 0xFF) return codePoint;
  return UNICODE_TO_WIN1252_BYTE[codePoint] || null;
}

function reverseStringToWin1252(str) {
  const bytes = [];
  for (const char of str) {
    const byte = getWin1252Byte(char.charCodeAt(0));
    if (byte === null) return null;
    bytes.push(byte);
  }
  return Buffer.from(bytes);
}

function isPlausible(str) {
  // Emoji
  if (/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u1F000-\u1F9FF]/u.test(str)) return true;
  
  // Accented letters
  if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿšžœŸ]/i.test(str)) return true;
  
  // Special punctuation
  if (/[€™®©°±×÷§¶†‡…‹›""''–—•]/u.test(str)) return true;
  
  return false;
}

function findMojibakeSequences(fileString) {
  const results = [];
  let i = 0;
  
  while (i < fileString.length) {
    const char = fileString[i];
    const cp = char.charCodeAt(0);
    
    // Look for potential Windows-1252 sequences
    if (canReverseToWin1252(cp)) {
      // Collect run of reversible characters
      let j = i;
      while (j < fileString.length && canReverseToWin1252(fileString.charCodeAt(j))) {
        j++;
      }
      
      if (j > i) {
        const candidate = fileString.substring(i, j);
        
        // Test if this is mojibake
        const reversed = reverseStringToWin1252(candidate);
        if (reversed) {
          const currentBytes = Buffer.from(candidate, 'utf8');
          
          // Must be different when reversed
          if (Buffer.compare(reversed, currentBytes) !== 0) {
            try {
              const recoveredString = reversed.toString('utf8');
              if (!recoveredString.includes('\ufffd') && recoveredString !== candidate) {
                if (isPlausible(recoveredString)) {
                  results.push({
                    start: i,
                    end: j,
                    currentString: candidate,
                    currentBytes: currentBytes,
                    recoveredBytes: reversed,
                    recoveredString: recoveredString
                  });
                }
              }
            } catch (e) {
              // Invalid UTF-8, skip
            }
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
  
  return results;
}

function analyzeFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const fileString = buffer.toString('utf8');
  const fileName = path.basename(filePath);
  
  console.log(`\n📄 ${fileName}`);
  console.log(`   Size: ${buffer.length} bytes`);
  
  const results = findMojibakeSequences(fileString);
  console.log(`   Mojibake detected: ${results.length}`);
  
  return {
    fileName,
    fileSize: buffer.length,
    results
  };
}

function main() {
  console.log('========================================');
  console.log('PHASE 3.1: FINAL MOJIBAKE DETECTOR');
  console.log('========================================');
  
  // Test with exact file content first
  console.log('\n--- TESTING EXACT SEQUENCE FROM FILE ---');
  const admin = fs.readFileSync('admin-dashboard-fragment.html');
  const idx = admin.indexOf(Buffer.from([0xC3, 0xB0, 0xC5, 0xB8]));
  
  if (idx >= 0) {
    // Get the 4-character sequence: ðŸ"Š (without trailing space)
    const bytes = admin.slice(idx, idx + 10);
    const testString = bytes.toString('utf8').substring(0, 4); // Just the 4 mojibake chars
    
    console.log(`Test string: "${testString}"`);
    console.log(`Test bytes: ${Buffer.from(testString, 'utf8').toString('hex').toUpperCase()}`);
    
    const reversed = reverseStringToWin1252(testString);
    if (reversed) {
      console.log(`Reversed: ${reversed.toString('hex').toUpperCase()}`);
      const recovered = reversed.toString('utf8');
      console.log(`Recovered: "${recovered}"`);
      console.log(`Is emoji: ${/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u1F000-\u1F9FF]/u.test(recovered)}`);
    }
  }
  
  // Analyze files
  console.log('\n--- FILE ANALYSIS ---');
  
  const files = ['index.html', 'admin-dashboard-fragment.html'];
  const allResults = [];
  let totalMojibake = 0;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const analysis = analyzeFile(filePath);
      allResults.push(analysis);
      totalMojibake += analysis.results.length;
    }
  }
  
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total mojibake sequences: ${totalMojibake}\n`);
  
  if (totalMojibake > 0) {
    console.log('========================================');
    console.log('FORENSIC REPORT');
    console.log('========================================\n');
    
    for (const fileAnalysis of allResults) {
      if (fileAnalysis.results.length === 0) continue;
      
      console.log(`📄 ${fileAnalysis.fileName}`);
      
      // Group by pattern
      const byPattern = {};
      for (const r of fileAnalysis.results) {
        const key = r.currentBytes.toString('hex').toUpperCase();
        if (!byPattern[key]) byPattern[key] = [];
        byPattern[key].push(r);
      }
      
      let num = 1;
      for (const [pattern, instances] of Object.entries(byPattern)) {
        const first = instances[0];
        console.log(`  [${num}] Pattern: ${pattern}`);
        console.log(`      Current: "${first.currentString}"`);
        console.log(`      Recovered: "${first.recoveredString}"`);
        console.log(`      Count: ${instances.length}`);
        console.log(`      Offsets: ${instances.slice(0, 3).map(i => i.start).join(', ')}${instances.length > 3 ? '...' : ''}`);
        console.log('');
        num++;
      }
    }
  }
  
  console.log('========================================');
  console.log('ANALYSIS COMPLETE - NO FILES MODIFIED');
  console.log('========================================');
}

main();