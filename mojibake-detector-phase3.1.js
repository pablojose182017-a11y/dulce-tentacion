#!/usr/bin/env node
/**
 * PHASE 3.1: TRUE MOJIBAKE DETECTOR WITH REVERSIBLE TRANSFORMATION TEST
 * 
 * Purpose: Identify and classify character encoding corruption in HTML files
 * WITHOUT modifying files. Uses reversible transformation tests on both
 * ISO-8859-1 and Windows-1252 encoding models.
 * 
 * Algorithm:
 * 1. For each byte sequence, test if it could be mojibake
 * 2. Apply reversible transformation: UTF-8 decode → Latin-1/Win1252 encode → UTF-8 decode
 * 3. Check if transformation succeeds and result is plausible
 * 4. Classify as: VALID_UTF8 / TRUE_MOJIBAKE / CONTEXT_ASSISTED / AMBIGUOUS / UNRECOVERABLE
 * 5. Build forensic table with exact byte mappings and confidence scores
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CORE REVERSIBLE TRANSFORMATION LOGIC
// ============================================================================

/**
 * Test if a string is valid UTF-8 encoded in current form
 * Returns: { isValid: bool, reason: string }
 */
function testCurrentUTF8(utf8Bytes) {
  try {
    const str = Buffer.from(utf8Bytes).toString('utf8');
    // Check for U+FFFD (replacement character) which indicates decode failure
    return {
      isValid: !str.includes('\ufffd'),
      reason: 'valid UTF-8 decode'
    };
  } catch (e) {
    return {
      isValid: false,
      reason: `decode error: ${e.message}`
    };
  }
}

/**
 * Test ISO-8859-1 reversible transformation
 * 
 * Process:
 * 1. Interpret current UTF-8 bytes as ISO-8859-1 characters
 * 2. Re-encode those characters as UTF-8
 * 3. Check if result is valid UTF-8 and differs
 * 
 * Returns: {
 *   canTransform: bool,
 *   recoveredBytes: Buffer,
 *   recoveredString: string,
 *   isPlausible: bool,
 *   reason: string
 * }
 */
function testISO88591Transform(utf8Bytes) {
  try {
    // Step 1: Interpret current UTF-8 bytes as ISO-8859-1
    const utf8Str = Buffer.from(utf8Bytes).toString('utf8');
    
    // Check if all characters are U+0000-U+00FF (single-byte encodable)
    let allSingleByte = true;
    for (const char of utf8Str) {
      if (char.charCodeAt(0) > 0xFF) {
        allSingleByte = false;
        break;
      }
    }
    
    if (!allSingleByte) {
      return {
        canTransform: false,
        recoveredBytes: null,
        recoveredString: '',
        isPlausible: false,
        reason: 'contains chars outside ISO-8859-1 range (>U+00FF)'
      };
    }
    
    // Step 2: Get bytes as if string was ISO-8859-1
    const isoBytes = Buffer.alloc(utf8Str.length);
    for (let i = 0; i < utf8Str.length; i++) {
      isoBytes[i] = utf8Str.charCodeAt(i) & 0xFF;
    }
    
    // Step 3: Try to decode recovered bytes as UTF-8
    const recoveredStr = Buffer.from(isoBytes).toString('utf8');
    
    // Check if recovery succeeded (no replacement characters)
    if (recoveredStr.includes('\ufffd')) {
      return {
        canTransform: true,
        recoveredBytes: isoBytes,
        recoveredString: recoveredStr,
        isPlausible: false,
        reason: 'ISO-8859-1 recovery contains U+FFFD (invalid UTF-8)'
      };
    }
    
    // Step 4: Check if result differs from original
    if (Buffer.compare(isoBytes, utf8Bytes) === 0) {
      return {
        canTransform: true,
        recoveredBytes: isoBytes,
        recoveredString: recoveredStr,
        isPlausible: false,
        reason: 'ISO-8859-1 recovery identical to original (not mojibake)'
      };
    }
    
    return {
      canTransform: true,
      recoveredBytes: isoBytes,
      recoveredString: recoveredStr,
      isPlausible: isPlausibleString(recoveredStr),
      reason: 'ISO-8859-1 recovery successful'
    };
  } catch (e) {
    return {
      canTransform: false,
      recoveredBytes: null,
      recoveredString: '',
      isPlausible: false,
      reason: `ISO-8859-1 transform error: ${e.message}`
    };
  }
}

/**
 * Test Windows-1252 reversible transformation
 * Similar to ISO-8859-1 but with different mappings for bytes 0x80-0x9F
 */
function testWindows1252Transform(utf8Bytes) {
  try {
    const utf8Str = Buffer.from(utf8Bytes).toString('utf8');
    
    // Check if all characters can be encoded in Windows-1252
    let allSingleByte = true;
    for (const char of utf8Str) {
      const code = char.charCodeAt(0);
      // Windows-1252: 0x00-0x7F, 0xA0-0xFF, plus special 0x80-0x9F mappings
      if (code > 0xFF && !isWindows1252Special(code)) {
        allSingleByte = false;
        break;
      }
    }
    
    if (!allSingleByte) {
      return {
        canTransform: false,
        recoveredBytes: null,
        recoveredString: '',
        isPlausible: false,
        reason: 'contains chars outside Windows-1252 range'
      };
    }
    
    // Get bytes as if string was Windows-1252
    const win1252Bytes = encodeWindows1252(utf8Str);
    if (win1252Bytes === null) {
      return {
        canTransform: false,
        recoveredBytes: null,
        recoveredString: '',
        isPlausible: false,
        reason: 'cannot encode string as Windows-1252'
      };
    }
    
    // Try to decode recovered bytes as UTF-8
    const recoveredStr = Buffer.from(win1252Bytes).toString('utf8');
    
    if (recoveredStr.includes('\ufffd')) {
      return {
        canTransform: true,
        recoveredBytes: win1252Bytes,
        recoveredString: recoveredStr,
        isPlausible: false,
        reason: 'Windows-1252 recovery contains U+FFFD (invalid UTF-8)'
      };
    }
    
    if (Buffer.compare(win1252Bytes, utf8Bytes) === 0) {
      return {
        canTransform: true,
        recoveredBytes: win1252Bytes,
        recoveredString: recoveredStr,
        isPlausible: false,
        reason: 'Windows-1252 recovery identical to original'
      };
    }
    
    return {
      canTransform: true,
      recoveredBytes: win1252Bytes,
      recoveredString: recoveredStr,
      isPlausible: isPlausibleString(recoveredStr),
      reason: 'Windows-1252 recovery successful'
    };
  } catch (e) {
    return {
      canTransform: false,
      recoveredBytes: null,
      recoveredString: '',
      isPlausible: false,
      reason: `Windows-1252 transform error: ${e.message}`
    };
  }
}

/**
 * Windows-1252 special characters (bytes 0x80-0x9F)
 * Map to Unicode characters
 */
const WINDOWS_1252_MAP = {
  0x80: 0x20AC, // €
  0x81: 0x0081, // (undefined)
  0x82: 0x201A, // ‚
  0x83: 0x0192, // ƒ
  0x84: 0x201E, // „
  0x85: 0x2026, // …
  0x86: 0x2020, // †
  0x87: 0x2021, // ‡
  0x88: 0x02C6, // ˆ
  0x89: 0x2030, // ‰
  0x8A: 0x0160, // Š
  0x8B: 0x2039, // ‹
  0x8C: 0x0152, // Œ
  0x8D: 0x008D, // (undefined)
  0x8E: 0x017D, // Ž
  0x8F: 0x008F, // (undefined)
  0x90: 0x0090, // (undefined)
  0x91: 0x2018, // '
  0x92: 0x2019, // '
  0x93: 0x201C, // "
  0x94: 0x201D, // "
  0x95: 0x2022, // •
  0x96: 0x2013, // –
  0x97: 0x2014, // —
  0x98: 0x02DC, // ˜
  0x99: 0x2122, // ™
  0x9A: 0x0161, // š
  0x9B: 0x203A, // ›
  0x9C: 0x0153, // œ
  0x9D: 0x009D, // (undefined)
  0x9E: 0x017E, // ž
  0x9F: 0x0178  // Ÿ
};

function isWindows1252Special(codePoint) {
  return WINDOWS_1252_MAP[codePoint] !== undefined;
}

function encodeWindows1252(str) {
  const bytes = [];
  for (const char of str) {
    const code = char.charCodeAt(0);
    if (code < 0x80 || (code >= 0xA0 && code <= 0xFF)) {
      bytes.push(code & 0xFF);
    } else if (WINDOWS_1252_MAP[code]) {
      // Find byte that maps to this code point
      for (let b = 0x80; b <= 0x9F; b++) {
        if (WINDOWS_1252_MAP[b] === code) {
          bytes.push(b);
          break;
        }
      }
    } else {
      return null; // Cannot encode
    }
  }
  return Buffer.from(bytes);
}

/**
 * Check if recovered string is plausible
 * Looks for: emoji, Spanish text, punctuation, common words
 */
function isPlausibleString(str) {
  if (!str || str.length === 0) return false;
  
  // Check for emoji (U+1F300 and above)
  if (/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u1F300-\u1F9FF]/.test(str)) {
    return true;
  }
  
  // Check for Spanish text (accented letters, ñ)
  if (/[áéíóúüñàèìòùÁÉÍÓÚÜÑ]/.test(str)) {
    return true;
  }
  
  // Check for common smart punctuation
  if (/[""''–—…]/.test(str)) {
    return true;
  }
  
  // Check for common Spanish words
  if (/\b(para|por|con|del|los|las|una|unos|unas|de|el|la|este|ese|que|y|o|pero)\b/i.test(str)) {
    return true;
  }
  
  // Check for numbers and basic ASCII letters
  if (/[a-zA-Z0-9]/.test(str)) {
    return true;
  }
  
  return false;
}

// ============================================================================
// CLASSIFICATION LOGIC
// ============================================================================

/**
 * Classify a byte sequence as mojibake or not
 */
function classifySequence(utf8Bytes, context = {}) {
  const classification = {
    bytes: utf8Bytes,
    bytesHex: utf8Bytes.toString('hex').toUpperCase(),
    currentString: '',
    iso88591: null,
    windows1252: null,
    classification: 'UNKNOWN',
    confidence: 0,
    reason: []
  };
  
  try {
    classification.currentString = Buffer.from(utf8Bytes).toString('utf8');
  } catch (e) {
    classification.currentString = '[DECODE ERROR]';
  }
  
  // Test current UTF-8 validity
  const currentUTF8 = testCurrentUTF8(utf8Bytes);
  
  // Test reversible transformations
  const iso88591 = testISO88591Transform(utf8Bytes);
  const windows1252 = testWindows1252Transform(utf8Bytes);
  
  classification.iso88591 = iso88591;
  classification.windows1252 = windows1252;
  
  // Classification logic
  
  // 1. If current UTF-8 is invalid, cannot determine
  if (!currentUTF8.isValid) {
    classification.classification = 'UNRECOVERABLE';
    classification.confidence = 0.0;
    classification.reason.push('Current string contains invalid UTF-8');
    return classification;
  }
  
  // 2. If both transforms fail or result is identical, not mojibake
  if (!iso88591.canTransform && !windows1252.canTransform) {
    classification.classification = 'VALID_UTF8';
    classification.confidence = 1.0;
    classification.reason.push('No reversible transformation possible');
    return classification;
  }
  
  // 3. TRUE_MOJIBAKE: Both transforms succeed, recovered string is plausible
  const iso88591Success = iso88591.canTransform && iso88591.isPlausible;
  const windows1252Success = windows1252.canTransform && windows1252.isPlausible;
  
  if (iso88591Success || windows1252Success) {
    classification.classification = 'TRUE_MOJIBAKE';
    classification.confidence = Math.max(
      iso88591Success ? 0.95 : 0,
      windows1252Success ? 0.95 : 0
    );
    
    if (iso88591Success) {
      classification.reason.push(`ISO-8859-1: "${iso88591.recoveredString}"`);
    }
    if (windows1252Success) {
      classification.reason.push(`Windows-1252: "${windows1252.recoveredString}"`);
    }
    
    return classification;
  }
  
  // 4. CONTEXT_ASSISTED: Transform succeeds but requires context to verify
  if (iso88591.canTransform || windows1252.canTransform) {
    classification.classification = 'CONTEXT_ASSISTED';
    classification.confidence = 0.5;
    
    if (iso88591.canTransform) {
      classification.reason.push(`ISO-8859-1 possible: "${iso88591.recoveredString}"`);
    }
    if (windows1252.canTransform) {
      classification.reason.push(`Windows-1252 possible: "${windows1252.recoveredString}"`);
    }
    
    return classification;
  }
  
  // 5. AMBIGUOUS: Cannot determine definitively
  classification.classification = 'AMBIGUOUS';
  classification.confidence = 0.2;
  classification.reason.push('Transformation succeeded but result not plausible');
  
  return classification;
}

// ============================================================================
// FILE SCANNING LOGIC
// ============================================================================

/**
 * Scan file for potential mojibake sequences
 * Looks for common mojibake patterns: C3 B0 (ð), C2 A0 (space), etc.
 */
function scanFileForMojibake(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const results = [];
  
  // Common mojibake byte patterns to scan for
  // These are the typical results of UTF-8 bytes misinterpreted as Latin-1
  const patterns = [
    { pattern: /[\xC0-\xC3][\x80-\xBF]/g, desc: 'C0-C3 range (UTF-8 multi-byte)' },
    { pattern: /[\xE0-\xEF][\x80-\xBF][\x80-\xBF]/g, desc: 'E0-EF range (3-byte UTF-8)' },
    { pattern: /[\xF0-\xF4][\x80-\xBF][\x80-\xBF][\x80-\xBF]/g, desc: 'F0-F4 range (4-byte UTF-8)' }
  ];
  
  // Scan for patterns
  for (let i = 0; i < fileBuffer.length; i++) {
    const byte = fileBuffer[i];
    
    // Check if this byte starts a multi-byte sequence
    if ((byte >= 0xC0 && byte <= 0xDF) || (byte >= 0xE0 && byte <= 0xF4)) {
      let seqLen = 1;
      
      // Determine sequence length
      if (byte >= 0xC0 && byte <= 0xDF) seqLen = 2;
      else if (byte >= 0xE0 && byte <= 0xEF) seqLen = 3;
      else if (byte >= 0xF0 && byte <= 0xF4) seqLen = 4;
      
      if (i + seqLen <= fileBuffer.length) {
        const sequence = fileBuffer.slice(i, i + seqLen);
        
        // Try to classify this sequence
        const classification = classifySequence(sequence);
        
        if (classification.classification !== 'VALID_UTF8') {
          results.push({
            offset: i,
            length: seqLen,
            ...classification
          });
        }
      }
    }
  }
  
  return results;
}

/**
 * Deduplicate results (same sequence in different locations)
 */
function deduplicateResults(results) {
  const byHex = {};
  const unique = [];
  
  for (const result of results) {
    const hex = result.bytesHex;
    if (!byHex[hex]) {
      byHex[hex] = [];
    }
    byHex[hex].push(result);
  }
  
  for (const hex in byHex) {
    const instances = byHex[hex];
    unique.push({
      bytesHex: hex,
      currentString: instances[0].currentString,
      classification: instances[0].classification,
      confidence: instances[0].confidence,
      reason: instances[0].reason,
      iso88591: instances[0].iso88591,
      windows1252: instances[0].windows1252,
      offsets: instances.map(r => r.offset),
      count: instances.length
    });
  }
  
  return unique;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('========================================');
  console.log('PHASE 3.1: MOJIBAKE DETECTOR');
  console.log('========================================\n');
  
  const files = [
    'index.html',
    'admin-dashboard-fragment.html'
  ];
  
  const allResults = {};
  const statistics = {
    VALID_UTF8: 0,
    TRUE_MOJIBAKE: 0,
    CONTEXT_ASSISTED: 0,
    AMBIGUOUS: 0,
    UNRECOVERABLE: 0
  };
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      continue;
    }
    
    console.log(`\n📄 Scanning: ${file}`);
    const fileSize = fs.statSync(filePath).size;
    console.log(`   Size: ${fileSize} bytes`);
    
    const results = scanFileForMojibake(filePath);
    console.log(`   Found: ${results.length} potential mojibake sequences`);
    
    const unique = deduplicateResults(results);
    console.log(`   Unique patterns: ${unique.length}\n`);
    
    allResults[file] = {
      unique: unique,
      instances: results,
      totalInstances: results.length
    };
    
    // Count classifications
    for (const pattern of unique) {
      statistics[pattern.classification]++;
    }
  }
  
  // Print summary statistics
  console.log('\n========================================');
  console.log('CLASSIFICATION SUMMARY');
  console.log('========================================\n');
  
  console.log(`VALID_UTF8:        ${statistics.VALID_UTF8}`);
  console.log(`TRUE_MOJIBAKE:     ${statistics.TRUE_MOJIBAKE}`);
  console.log(`CONTEXT_ASSISTED:  ${statistics.CONTEXT_ASSISTED}`);
  console.log(`AMBIGUOUS:         ${statistics.AMBIGUOUS}`);
  console.log(`UNRECOVERABLE:     ${statistics.UNRECOVERABLE}`);
  console.log(`TOTAL:             ${Object.values(statistics).reduce((a, b) => a + b, 0)}`);
  
  // Print detailed forensic table
  console.log('\n========================================');
  console.log('FORENSIC TABLE - UNIQUE PATTERNS');
  console.log('========================================\n');
  
  for (const file in allResults) {
    console.log(`\n📄 FILE: ${file}`);
    console.log('---');
    
    const unique = allResults[file].unique;
    
    for (let i = 0; i < unique.length; i++) {
      const item = unique[i];
      console.log(`\n[${i + 1}] Bytes: ${item.bytesHex}`);
      console.log(`    Current: "${item.currentString}"`);
      console.log(`    Class:   ${item.classification} (confidence: ${(item.confidence * 100).toFixed(0)}%)`);
      console.log(`    Count:   ${item.count} instances`);
      console.log(`    Offsets: ${item.offsets.slice(0, 5).join(', ')}${item.offsets.length > 5 ? '...' : ''}`);
      
      if (item.iso88591 && item.iso88591.canTransform) {
        console.log(`    ISO-8859-1: "${item.iso88591.recoveredString}" (plausible: ${item.iso88591.isPlausible})`);
      }
      if (item.windows1252 && item.windows1252.canTransform) {
        console.log(`    Windows-1252: "${item.windows1252.recoveredString}" (plausible: ${item.windows1252.isPlausible})`);
      }
      
      for (const reason of item.reason) {
        console.log(`    → ${reason}`);
      }
    }
  }
  
  console.log('\n========================================');
  console.log('ANALYSIS COMPLETE');
  console.log('========================================\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  classifySequence,
  testISO88591Transform,
  testWindows1252Transform,
  scanFileForMojibake,
  deduplicateResults
};
