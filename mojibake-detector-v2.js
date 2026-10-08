#!/usr/bin/env node
/**
 * PHASE 3.1: CORRECTED MOJIBAKE DETECTOR
 * 
 * Proper reversible transformation:
 * For a byte sequence to be mojibake:
 * 1. Current bytes must decode as valid UTF-8
 * 2. Decoded string must consist ONLY of Latin-1 characters (U+0000-U+00FF)
 * 3. Re-encode those characters as UTF-8 to get "original" bytes
 * 4. "Original" bytes must decode as valid UTF-8 AND be different
 * 5. Result must be plausible (emoji, accented letters, etc.)
 * 
 * This correctly identifies DOUBLE-ENCODED UTF-8:
 * - Original: F0 9F 93 8B (emoji 📋 in UTF-8)
 * - Misread as Latin-1, each byte becomes char: ðŸ"‹
 * - Re-encode as UTF-8: ðŸ"‹ → C3 B0 C5 B8 C2 93 C2 8B
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// REVERSIBLE TRANSFORMATION: CORRECT VERSION
// ============================================================================

/**
 * Test if a byte sequence could be mojibake using reversible transformation
 * 
 * Returns: {
 *   isMojibake: bool,
 *   recovered: Buffer | null,
 *   recoveredString: string,
 *   reason: string,
 *   confidence: number (0-1)
 * }
 */
function testReversibleTransformation(currentBytes) {
  const result = {
    isMojibake: false,
    recovered: null,
    recoveredString: '',
    reason: '',
    confidence: 0
  };
  
  // Step 1: Decode current bytes as UTF-8
  let currentString;
  try {
    currentString = currentBytes.toString('utf8');
    // Check for replacement character
    if (currentString.includes('\ufffd')) {
      result.reason = 'Current bytes are invalid UTF-8';
      return result;
    }
  } catch (e) {
    result.reason = 'Failed to decode current bytes as UTF-8';
    return result;
  }
  
  // Step 2: Check if all characters are in Latin-1 range (U+0000-U+00FF)
  let allLatin1 = true;
  for (const char of currentString) {
    if (char.charCodeAt(0) > 0xFF) {
      allLatin1 = false;
      break;
    }
  }
  
  if (!allLatin1) {
    result.reason = 'String contains characters outside Latin-1 range';
    return result;
  }
  
  // Step 3: Treat each character as a Latin-1 byte and reconstruct
  const recoveredBytes = [];
  for (const char of currentString) {
    recoveredBytes.push(char.charCodeAt(0) & 0xFF);
  }
  const recovered = Buffer.from(recoveredBytes);
  
  // Step 4: Decode recovered bytes as UTF-8
  let recoveredString;
  try {
    recoveredString = recovered.toString('utf8');
    if (recoveredString.includes('\ufffd')) {
      result.reason = 'Recovered bytes are invalid UTF-8';
      return result;
    }
  } catch (e) {
    result.reason = 'Failed to decode recovered bytes as UTF-8';
    return result;
  }
  
  // Step 5: Check if recovered differs from current
  if (Buffer.compare(recovered, currentBytes) === 0) {
    result.reason = 'Recovered bytes identical to current (not mojibake)';
    return result;
  }
  
  // Step 6: Check if recovered is plausible
  if (!isPlausible(recoveredString)) {
    result.reason = 'Recovered string not plausible: "' + recoveredString + '"';
    return result;
  }
  
  // SUCCESS: This is mojibake!
  result.isMojibake = true;
  result.recovered = recovered;
  result.recoveredString = recoveredString;
  result.reason = 'Valid mojibake recovery';
  result.confidence = 0.95;
  
  return result;
}

/**
 * Check if a string is plausible after recovery
 * Emoji are key indicator, but also allow:
 * - Accented Latin letters
 * - Common punctuation
 * - Mixed text with numbers/ASCII
 */
function isPlausible(str) {
  if (!str || str.length === 0) return false;
  
  // Check for emoji (4-byte UTF-8 sequences)
  // U+1F300 and above
  if (/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u1F000-\u1F9FF\u{E0000}-\u{E007F}]/u.test(str)) {
    return true;
  }
  
  // Check for common accented letters in any language
  if (/[àáâãäåèéêëìíîïòóôõöùúûüýāēīōūăĕĭŏŭçđłńŕśśţźžńœæ]/i.test(str)) {
    return true;
  }
  
  // Check for smart quotes and dashes
  if (/[""''–—…]/.test(str)) {
    return true;
  }
  
  // Check for common word patterns (3+ letter sequences with letters/numbers)
  if (/[a-záéíóúüñçàèìòùâêîôûäëïöä]{3,}/i.test(str)) {
    return true;
  }
  
  return false;
}

// ============================================================================
// FILE SCANNING
// ============================================================================

/**
 * Scan file for multi-byte UTF-8 sequences that might be mojibake
 * Focus on C3-F4 prefix bytes which indicate multi-byte UTF-8
 */
function findMojibakeCandidates(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const candidates = [];
  
  for (let i = 0; i < fileBuffer.length; i++) {
    const byte = fileBuffer[i];
    let seqLen = 0;
    
    // Determine if this starts a multi-byte UTF-8 sequence
    if (byte >= 0xC0 && byte <= 0xDF) seqLen = 2;
    else if (byte >= 0xE0 && byte <= 0xEF) seqLen = 3;
    else if (byte >= 0xF0 && byte <= 0xF4) seqLen = 4;
    
    if (seqLen > 0 && i + seqLen <= fileBuffer.length) {
      const sequence = fileBuffer.slice(i, i + seqLen);
      
      // Test for mojibake
      const test = testReversibleTransformation(sequence);
      
      if (test.isMojibake) {
        candidates.push({
          offset: i,
          currentBytes: sequence,
          currentHex: sequence.toString('hex').toUpperCase(),
          currentString: sequence.toString('utf8'),
          recoveredBytes: test.recovered,
          recoveredHex: test.recovered.toString('hex').toUpperCase(),
          recoveredString: test.recoveredString,
          confidence: test.confidence
        });
      }
    }
  }
  
  return candidates;
}

/**
 * Deduplicate by hex pattern, keeping first occurrence
 */
function dedup(results) {
  const byHex = {};
  const unique = [];
  
  for (const r of results) {
    if (!byHex[r.currentHex]) {
      byHex[r.currentHex] = [];
      unique.push({
        ...r,
        offsets: [],
        count: 0
      });
    }
    byHex[r.currentHex][byHex[r.currentHex].length - 1].offsets.push(r.offset);
    byHex[r.currentHex][byHex[r.currentHex].length - 1].count++;
  }
  
  return unique;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('========================================');
  console.log('PHASE 3.1: MOJIBAKE DETECTOR v2');
  console.log('(Reversible Transformation Test)');
  console.log('========================================\n');
  
  const files = [
    'index.html',
    'admin-dashboard-fragment.html'
  ];
  
  const allFindings = {};
  let totalMojibake = 0;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${file}: NOT FOUND`);
      continue;
    }
    
    console.log(`\n📄 ${file}`);
    const fileSize = fs.statSync(filePath).size;
    console.log(`   Size: ${fileSize} bytes`);
    
    const candidates = findMojibakeCandidates(filePath);
    console.log(`   Found: ${candidates.length} mojibake sequences`);
    
    if (candidates.length === 0) {
      console.log('   → NO MOJIBAKE DETECTED');
      allFindings[file] = [];
      continue;
    }
    
    const unique = dedup(candidates);
    console.log(`   Unique patterns: ${unique.length}`);
    
    allFindings[file] = unique;
    totalMojibake += candidates.length;
  }
  
  // Print summary
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================\n');
  console.log(`Total mojibake sequences: ${totalMojibake}`);
  
  // Print detailed results
  console.log('\n========================================');
  console.log('DETAILED FORENSIC TABLE');
  console.log('========================================\n');
  
  for (const file in allFindings) {
    const findings = allFindings[file];
    
    if (findings.length === 0) {
      console.log(`📄 ${file}: NO MOJIBAKE\n`);
      continue;
    }
    
    console.log(`📄 ${file}\n`);
    
    for (let i = 0; i < findings.length; i++) {
      const f = findings[i];
      console.log(`  [${i + 1}] Current: ${f.currentHex}`);
      console.log(`      String:  "${f.currentString}"`);
      console.log(`      → Recovered: ${f.recoveredHex}`);
      console.log(`      → String:    "${f.recoveredString}"`);
      console.log(`      Occurrences: ${f.count}`);
      console.log(`      Offsets:     ${f.offsets.slice(0, 5).join(', ')}${f.offsets.length > 5 ? '...' : ''}`);
      console.log('');
    }
  }
  
  console.log('========================================');
  console.log('ANALYSIS COMPLETE');
  console.log('========================================\n');
}

main();
