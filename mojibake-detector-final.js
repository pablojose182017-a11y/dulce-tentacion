#!/usr/bin/env node
/**
 * PHASE 3.1: FINAL MOJIBAKE DETECTOR
 * 
 * Correctly handles BOTH ISO-8859-1 and Windows-1252 double-encoding.
 * 
 * Key insight: Characters > U+00FF (like Ÿ = U+0178) indicate Windows-1252
 * encoding was used for the corruption, not ISO-8859-1.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// WINDOWS-1252 CODEC
// ============================================================================

// Map from code point to Windows-1252 byte for special chars 0x80-0x9F
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
  0x0178: 0x9F  // Ÿ ← THIS IS KEY!
};

// Map from Windows-1252 byte to code point
const WIN1252_TO_CODEPOINT = {};
for (const [cp, b] of Object.entries(CODEPOINT_TO_WIN1252)) {
  WIN1252_TO_CODEPOINT[b] = parseInt(cp);
}

// ============================================================================
// REVERSIBLE TRANSFORMATION: FINAL CORRECT VERSION
// ============================================================================

/**
 * Recover original bytes from mojibake
 * Uses both ISO-8859-1 and Windows-1252 mappings
 * 
 * Returns: {
 *   isMojibake: bool,
 *   recovered: Buffer | null,
 *   recoveredString: string,
 *   encodingUsed: 'ISO-8859-1' | 'Windows-1252',
 *   reason: string
 * }
 */
function recoverMojibake(currentBytes) {
  const result = {
    isMojibake: false,
    recovered: null,
    recoveredString: '',
    encodingUsed: null,
    reason: ''
  };
  
  // Step 1: Decode current bytes as UTF-8
  let currentString;
  try {
    currentString = currentBytes.toString('utf8');
    if (currentString.includes('\ufffd')) {
      result.reason = 'Current bytes are invalid UTF-8';
      return result;
    }
  } catch (e) {
    result.reason = 'Failed to decode current bytes';
    return result;
  }
  
  // Step 2: Try to recover bytes from chars
  // For each char, determine if it needs Windows-1252 or ISO-8859-1 mapping
  const recoveredBytes = [];
  let usesWin1252 = false;
  
  for (const char of currentString) {
    const cp = char.charCodeAt(0);
    
    // If in Latin-1 range (0-0xFF), use as-is
    if (cp <= 0xFF) {
      recoveredBytes.push(cp);
    }
    // If it's a known Windows-1252 special char, use the mapping
    else if (CODEPOINT_TO_WIN1252[cp] !== undefined) {
      recoveredBytes.push(CODEPOINT_TO_WIN1252[cp]);
      usesWin1252 = true;
    }
    // Otherwise, cannot recover
    else {
      result.reason = 'Char U+' + cp.toString(16).toUpperCase() + ' not in recoverable range';
      return result;
    }
  }
  
  const recovered = Buffer.from(recoveredBytes);
  
  // Step 3: Decode recovered bytes as UTF-8
  let recoveredString;
  try {
    recoveredString = recovered.toString('utf8');
    if (recoveredString.includes('\ufffd')) {
      result.reason = 'Recovered bytes are invalid UTF-8';
      return result;
    }
  } catch (e) {
    result.reason = 'Failed to decode recovered bytes';
    return result;
  }
  
  // Step 4: Check if recovered differs from current
  if (Buffer.compare(recovered, currentBytes) === 0) {
    result.reason = 'Recovered bytes identical to current (not mojibake)';
    return result;
  }
  
  // Step 5: Check if recovered is plausible
  if (!isPlausibleRecovery(recoveredString)) {
    result.reason = 'Recovered not plausible: "' + (recoveredString.length > 20 ? recoveredString.substring(0, 20) + '...' : recoveredString) + '"';
    return result;
  }
  
  // SUCCESS!
  result.isMojibake = true;
  result.recovered = recovered;
  result.recoveredString = recoveredString;
  result.encodingUsed = usesWin1252 ? 'Windows-1252' : 'ISO-8859-1';
  result.reason = 'Valid mojibake recovery (' + result.encodingUsed + ')';
  
  return result;
}

/**
 * Check if recovered string is plausible
 */
function isPlausibleRecovery(str) {
  if (!str || str.length === 0) return false;
  
  // Emoji (U+1F000 and above)
  if (/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u1F000-\u1F9FF]/u.test(str)) {
    return true;
  }
  
  // Accented letters in any language
  if (/[àáâãäåèéêëìíîïòóôõöùúûüýāēīōūăĕĭŏŭçđłńŕśśţźžśćñó]/i.test(str)) {
    return true;
  }
  
  // Common 3+ letter words
  if (/[a-záéíóúüñçàèìòù]{3,}/i.test(str)) {
    return true;
  }
  
  // Smart quotes
  if (/[""''–—…€™]/g.test(str)) {
    return true;
  }
  
  return false;
}

// ============================================================================
// FILE SCANNING
// ============================================================================

function scanFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  const results = [];
  
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    let seqLen = 0;
    
    if (byte >= 0xC0 && byte <= 0xDF) seqLen = 2;
    else if (byte >= 0xE0 && byte <= 0xEF) seqLen = 3;
    else if (byte >= 0xF0 && byte <= 0xF4) seqLen = 4;
    
    if (seqLen > 0 && i + seqLen <= buffer.length) {
      const sequence = buffer.slice(i, i + seqLen);
      const test = recoverMojibake(sequence);
      
      if (test.isMojibake) {
        results.push({
          offset: i,
          currentBytes: sequence,
          currentHex: sequence.toString('hex').toUpperCase(),
          currentString: sequence.toString('utf8'),
          recovered: test.recovered,
          recoveredHex: test.recovered.toString('hex').toUpperCase(),
          recoveredString: test.recoveredString,
          encoding: test.encodingUsed
        });
      }
    }
  }
  
  return results;
}

function dedup(results) {
  const byHex = {};
  const unique = [];
  
  for (const r of results) {
    if (!byHex[r.currentHex]) {
      byHex[r.currentHex] = {
        ...r,
        offsets: [],
        count: 0
      };
      unique.push(byHex[r.currentHex]);
    }
    byHex[r.currentHex].offsets.push(r.offset);
    byHex[r.currentHex].count++;
  }
  
  return unique;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('========================================');
  console.log('PHASE 3.1: MOJIBAKE DETECTOR (FINAL)');
  console.log('Windows-1252 + ISO-8859-1 Support');
  console.log('========================================\n');
  
  const files = ['index.html', 'admin-dashboard-fragment.html'];
  
  const allResults = {};
  let totalMojibake = 0;
  let iso88591Count = 0;
  let win1252Count = 0;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${file}: NOT FOUND\n`);
      continue;
    }
    
    console.log(`📄 ${file}`);
    const fileSize = fs.statSync(filePath).size;
    console.log(`   Size: ${fileSize} bytes`);
    
    const candidates = scanFile(filePath);
    console.log(`   Found: ${candidates.length} mojibake sequences\n`);
    
    if (candidates.length > 0) {
      const unique = dedup(candidates);
      allResults[file] = unique;
      totalMojibake += candidates.length;
      
      for (const u of unique) {
        if (u.encoding === 'Windows-1252') win1252Count += u.count;
        else iso88591Count += u.count;
      }
    } else {
      allResults[file] = [];
    }
  }
  
  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================\n');
  console.log(`Total sequences found: ${totalMojibake}`);
  console.log(`ISO-8859-1: ${iso88591Count}`);
  console.log(`Windows-1252: ${win1252Count}`);
  
  // Detailed results
  console.log('\n========================================');
  console.log('FORENSIC TABLE');
  console.log('========================================\n');
  
  for (const file in allResults) {
    const results = allResults[file];
    if (results.length === 0) {
      console.log(`📄 ${file}: NO MOJIBAKE FOUND\n`);
      continue;
    }
    
    console.log(`📄 ${file}\n`);
    
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      console.log(`  [${i + 1}] Current:   ${r.currentHex} = "${r.currentString}"`);
      console.log(`      Encoding:  ${r.encoding}`);
      console.log(`      Recovered: ${r.recoveredHex} = "${r.recoveredString}"`);
      console.log(`      Count:     ${r.count} occurrences`);
      console.log(`      Offsets:   ${r.offsets.slice(0, 3).join(', ')}${r.offsets.length > 3 ? ' ...' : ''}`);
      console.log('');
    }
  }
  
  console.log('========================================');
  console.log('ANALYSIS COMPLETE');
  console.log('========================================\n');
}

main();
