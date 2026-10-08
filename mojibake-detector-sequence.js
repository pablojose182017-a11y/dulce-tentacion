#!/usr/bin/env node
/**
 * PHASE 3.1: MOJIBAKE DETECTOR - SEQUENCE-BASED
 * 
 * Handles non-contiguous mojibake by scanning for sequences of
 * multi-byte UTF-8 characters and testing them for recovery via
 * Windows-1252 mappings.
 */

const fs = require('fs');
const path = require('path');

// Windows-1252 special mappings (bytes 0x80-0x9F)
const CODEPOINT_TO_WIN1252 = {
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
  0x0178: 0x9F  // Ÿ ← KEY!
};

/**
 * Scan for contiguous sequences of multi-byte UTF-8 characters
 * Yield each sequence as a blob to test
 */
function* findMultibyteSequences(buffer) {
  let i = 0;
  while (i < buffer.length) {
    const byte = buffer[i];
    
    // Check if this starts a multi-byte UTF-8
    let seqLen = 0;
    if (byte >= 0xC0 && byte <= 0xDF) seqLen = 2;
    else if (byte >= 0xE0 && byte <= 0xEF) seqLen = 3;
    else if (byte >= 0xF0 && byte <= 0xF4) seqLen = 4;
    
    if (seqLen === 0) {
      // Single byte, skip
      i++;
      continue;
    }
    
    // Collect sequence of multi-byte UTF-8s
    const start = i;
    while (i < buffer.length) {
      const b = buffer[i];
      let bLen = 0;
      
      if (b >= 0xC0 && b <= 0xDF) bLen = 2;
      else if (b >= 0xE0 && b <= 0xEF) bLen = 3;
      else if (b >= 0xF0 && b <= 0xF4) bLen = 4;
      
      if (bLen === 0) break; // Not multi-byte, end of sequence
      if (i + bLen > buffer.length) break; // Incomplete sequence
      
      i += bLen;
    }
    
    // Yield the collected sequence
    if (i > start) {
      yield {
        start,
        end: i,
        bytes: buffer.slice(start, i)
      };
    }
  }
}

/**
 * Test if a multi-byte sequence could be mojibake
 */
function testSequence(seqBytes) {
  // Step 1: Decode as UTF-8
  let str;
  try {
    str = seqBytes.toString('utf8');
    if (str.includes('\ufffd')) {
      return {
        isMojibake: false,
        reason: 'Contains invalid UTF-8'
      };
    }
  } catch (e) {
    return {
      isMojibake: false,
      reason: 'Failed to decode'
    };
  }
  
  // Step 2: Try to recover using Windows-1252
  const recoveredBytes = [];
  let usesWin1252 = false;
  
  for (const char of str) {
    const cp = char.charCodeAt(0);
    
    if (cp <= 0xFF) {
      // Latin-1 range, use as-is
      recoveredBytes.push(cp);
    } else if (CODEPOINT_TO_WIN1252[cp]) {
      // Windows-1252 special char
      recoveredBytes.push(CODEPOINT_TO_WIN1252[cp]);
      usesWin1252 = true;
    } else {
      // Cannot recover
      return {
        isMojibake: false,
        reason: 'Character U+' + cp.toString(16).toUpperCase() + ' not recoverable'
      };
    }
  }
  
  // If nothing used Windows-1252 and all chars are standard Latin-1,
  // this might not be mojibake
  if (!usesWin1252) {
    const recovered = Buffer.from(recoveredBytes);
    if (Buffer.compare(recovered, seqBytes) === 0) {
      return {
        isMojibake: false,
        reason: 'Appears to be valid UTF-8 (no Win1252 chars)'
      };
    }
    // If recovered differs but no Win1252, could still be mojibake
    // Continue to validation
  }
  
  // Step 3: Decode recovered as UTF-8
  const recovered = Buffer.from(recoveredBytes);
  let recoveredStr;
  try {
    recoveredStr = recovered.toString('utf8');
    if (recoveredStr.includes('\ufffd')) {
      return {
        isMojibake: false,
        reason: 'Recovered bytes are invalid UTF-8'
      };
    }
  } catch (e) {
    return {
      isMojibake: false,
      reason: 'Failed to decode recovered'
    };
  }
  
  // Step 4: Check if recovered differs
  if (Buffer.compare(recovered, seqBytes) === 0) {
    return {
      isMojibake: false,
      reason: 'Recovered bytes identical to current'
    };
  }
  
  // Step 5: Validate plausibility
  if (!isPlausible(recoveredStr)) {
    return {
      isMojibake: false,
      reason: 'Recovered not plausible: "' + recoveredStr.substring(0, 20) + '"'
    };
  }
  
  // SUCCESS!
  return {
    isMojibake: true,
    recovered: recovered,
    recoveredString: recoveredStr,
    reason: 'Valid mojibake recovery'
  };
}

/**
 * Check if string is plausible
 */
function isPlausible(str) {
  // Emoji
  if (/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u1F000-\u1F9FF]/u.test(str)) {
    return true;
  }
  
  // Latin text with numbers
  if (/[a-z0-9]{2,}/i.test(str)) {
    return true;
  }
  
  return false;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('========================================');
  console.log('PHASE 3.1: MOJIBAKE DETECTOR (SEQUENCE)');
  console.log('========================================\n');
  
  const files = ['index.html', 'admin-dashboard-fragment.html'];
  const allResults = {};
  let totalMojibake = 0;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${file}: NOT FOUND\n`);
      continue;
    }
    
    console.log(`📄 Scanning ${file}...`);
    const buffer = fs.readFileSync(filePath);
    const fileSize = buffer.length;
    console.log(`   Size: ${fileSize} bytes`);
    
    const results = [];
    let seqCount = 0;
    let mojibakeCount = 0;
    
    for (const seq of findMultibyteSequences(buffer)) {
      seqCount++;
      const test = testSequence(seq.bytes);
      
      if (test.isMojibake) {
        mojibakeCount++;
        results.push({
          offset: seq.start,
          end: seq.end,
          length: seq.end - seq.start,
          currentBytes: seq.bytes,
          currentHex: seq.bytes.toString('hex').toUpperCase(),
          currentString: seq.bytes.toString('utf8'),
          recoveredBytes: test.recovered,
          recoveredHex: test.recovered.toString('hex').toUpperCase(),
          recoveredString: test.recoveredString
        });
      }
    }
    
    console.log(`   Multi-byte sequences found: ${seqCount}`);
    console.log(`   Mojibake detected: ${mojibakeCount}`);
    console.log('');
    
    allResults[file] = results;
    totalMojibake += mojibakeCount;
  }
  
  // Summary
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================\n');
  console.log(`Total mojibake sequences: ${totalMojibake}\n`);
  
  // Detailed results
  if (totalMojibake > 0) {
    console.log('========================================');
    console.log('FORENSIC TABLE');
    console.log('========================================\n');
    
    for (const file in allResults) {
      const results = allResults[file];
      if (results.length === 0) continue;
      
      console.log(`📄 ${file}\n`);
      
      // Deduplicate by hex pattern
      const byHex = {};
      for (const r of results) {
        if (!byHex[r.currentHex]) {
          byHex[r.currentHex] = {
            ...r,
            offsets: [],
            count: 0
          };
        }
        byHex[r.currentHex].offsets.push(r.offset);
        byHex[r.currentHex].count++;
      }
      
      const unique = Object.values(byHex);
      
      for (let i = 0; i < unique.length; i++) {
        const u = unique[i];
        console.log(`  [${i + 1}] Bytes:    ${u.currentHex}`);
        console.log(`      Current:  "${u.currentString}"`);
        console.log(`      Recovered: "${u.recoveredString}"`);
        console.log(`      Count:    ${u.count} occurrences`);
        console.log(`      Offsets:  ${u.offsets.slice(0, 3).join(', ')}${u.offsets.length > 3 ? ' ...' : ''}`);
        console.log('');
      }
    }
  }
  
  console.log('========================================');
  console.log('END OF ANALYSIS');
  console.log('========================================\n');
}

main();
