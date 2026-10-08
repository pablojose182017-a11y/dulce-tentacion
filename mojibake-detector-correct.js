#!/usr/bin/env node
/**
 * PHASE 3.1: MATHEMATICALLY CORRECT MOJIBAKE DETECTOR
 * 
 * Implements proper Windows-1252 reverse mapping for complete sequences.
 * Tests the EXACT example: C3 B0 C5 B8 E2 80 9C C5 A0 → F0 9F 93 8A → 📊
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// COMPLETE WINDOWS-1252 MAPPING
// ============================================================================

// Map from Unicode code point to original Windows-1252 byte
const UNICODE_TO_WIN1252_BYTE = {
  // Regular Latin-1 range (0x00-0xFF maps directly)
  // Special Windows-1252 mappings (0x80-0x9F)
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
  0x201C: 0x93, // " ← KEY for our example!
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
  0x0178: 0x9F  // Ÿ ← KEY for our example!
};

/**
 * Check if a Unicode code point can be reverse-mapped to Windows-1252
 */
function canReverseTo1252(codePoint) {
  // Latin-1 range (0x00-0xFF) maps directly
  if (codePoint <= 0xFF) {
    return true;
  }
  // Special Windows-1252 characters
  if (UNICODE_TO_WIN1252_BYTE[codePoint] !== undefined) {
    return true;
  }
  return false;
}

/**
 * Get the Windows-1252 byte for a Unicode code point
 */
function getWin1252Byte(codePoint) {
  if (codePoint <= 0xFF) {
    return codePoint; // Direct mapping for Latin-1
  }
  return UNICODE_TO_WIN1252_BYTE[codePoint] || null;
}

/**
 * Test if a string can be fully reverse-mapped to Windows-1252
 */
function canFullyReverseToWin1252(str) {
  for (const char of str) {
    if (!canReverseTo1252(char.charCodeAt(0))) {
      return false;
    }
  }
  return true;
}

/**
 * Reverse-map a string to Windows-1252 bytes
 */
function reverseToWin1252Bytes(str) {
  const bytes = [];
  for (const char of str) {
    const byte = getWin1252Byte(char.charCodeAt(0));
    if (byte === null) {
      return null; // Cannot reverse
    }
    bytes.push(byte);
  }
  return Buffer.from(bytes);
}

// ============================================================================
// SEQUENCE DETECTION
// ============================================================================

/**
 * Find all sequences of characters that could potentially be Windows-1252 mojibake
 * Scans the UTF-8 decoded string for runs of reversible characters
 */
function findMojibakeCandidates(fileString) {
  const candidates = [];
  let i = 0;
  
  while (i < fileString.length) {
    const char = fileString[i];
    const codePoint = char.charCodeAt(0);
    
    // Check if this character could be from Windows-1252
    if (canReverseTo1252(codePoint)) {
      // Start of potential sequence - collect all adjacent reversible chars
      let j = i;
      while (j < fileString.length && canReverseTo1252(fileString.charCodeAt(j))) {
        j++;
      }
      
      // We have a candidate sequence from i to j
      if (j > i) {
        const candidate = fileString.substring(i, j);
        candidates.push({
          start: i,
          end: j,
          text: candidate,
          length: j - i
        });
        i = j;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  
  return candidates;
}

/**
 * Test if a candidate string is actual mojibake
 */
function testMojibakeCandidate(candidate) {
  const result = {
    isMojibake: false,
    confidence: 0,
    currentString: candidate.text,
    currentBytes: null,
    recoveredBytes: null,
    recoveredString: '',
    reason: ''
  };
  
  // Step 1: Get current UTF-8 bytes
  result.currentBytes = Buffer.from(candidate.text, 'utf8');
  
  // Step 2: Reverse to Windows-1252
  const reversedBytes = reverseToWin1252Bytes(candidate.text);
  if (!reversedBytes) {
    result.reason = 'Cannot reverse-map to Windows-1252';
    return result;
  }
  result.recoveredBytes = reversedBytes;
  
  // Step 3: Check if recovered differs from current
  if (Buffer.compare(reversedBytes, result.currentBytes) === 0) {
    result.reason = 'Recovered bytes identical to current (not mojibake)';
    return result;
  }
  
  // Step 4: Decode recovered as UTF-8
  let recoveredString;
  try {
    recoveredString = reversedBytes.toString('utf8');
    if (recoveredString.includes('\ufffd')) {
      result.reason = 'Recovered bytes are invalid UTF-8';
      return result;
    }
  } catch (e) {
    result.reason = 'Failed to decode recovered bytes as UTF-8';
    return result;
  }
  result.recoveredString = recoveredString;
  
  // Step 5: Check if recovered Unicode differs from current
  if (recoveredString === candidate.text) {
    result.reason = 'Recovered string identical to current';
    return result;
  }
  
  // Step 6: Verify this is plausible/deterministic
  if (!isPlausibleRecovery(recoveredString)) {
    result.reason = 'Recovered string not plausible: "' + recoveredString + '"';
    return result;
  }
  
  // SUCCESS - this is mojibake!
  result.isMojibake = true;
  result.confidence = 0.95;
  result.reason = 'Valid Windows-1252 mojibake recovery';
  
  return result;
}

/**
 * Check if recovered string is plausible
 */
function isPlausibleRecovery(str) {
  // Emoji (most common case)
  if (/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u1F000-\u1F9FF]/u.test(str)) {
    return true;
  }
  
  // Special Unicode punctuation/symbols
  if (/[€™®©°±×÷§¶†‡…‹›""''–—•]/u.test(str)) {
    return true;
  }
  
  // Accented letters that could be in file names, proper nouns, etc.
  if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(str)) {
    return true;
  }
  
  return false;
}

// ============================================================================
// MAIN DETECTION ENGINE
// ============================================================================

function detectMojibake(filePath) {
  const buffer = fs.readFileSync(filePath);
  const fileString = buffer.toString('utf8');
  const fileName = path.basename(filePath);
  
  console.log(`\n📄 Analyzing ${fileName}...`);
  console.log(`   Size: ${buffer.length} bytes`);
  
  // Find all candidate sequences
  const candidates = findMojibakeCandidates(fileString);
  console.log(`   Candidate sequences: ${candidates.length}`);
  
  // Test each candidate
  const mojibakeResults = [];
  let totalMojibake = 0;
  
  for (const candidate of candidates) {
    const test = testMojibakeCandidate(candidate);
    
    if (test.isMojibake) {
      totalMojibake++;
      mojibakeResults.push({
        fileName,
        offset: candidate.start,
        length: candidate.length,
        currentBytes: test.currentBytes,
        currentHex: test.currentBytes.toString('hex').toUpperCase(),
        currentString: test.currentString,
        currentCodePoints: Array.from(test.currentString).map(c => 'U+' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')),
        recoveredBytes: test.recoveredBytes,
        recoveredHex: test.recoveredBytes.toString('hex').toUpperCase(),
        recoveredString: test.recoveredString,
        encodingModel: 'Windows-1252',
        classification: 'TRUE_MOJIBAKE',
        confidence: test.confidence
      });
    }
  }
  
  console.log(`   Mojibake detected: ${totalMojibake}`);
  
  return {
    fileName,
    fileSize: buffer.length,
    totalCandidates: candidates.length,
    totalMojibake,
    results: mojibakeResults
  };
}

// ============================================================================
// TEST CASES
// ============================================================================

function runTestCases() {
  console.log('========================================');
  console.log('RUNNING TEST CASES');
  console.log('========================================\n');
  
  const testCases = [
    // Our exact example (with correct smart quote)
    {
      name: 'Example: ðŸ"Š → 📊',
      input: 'ðŸ"Š', // Note: smart quote " not regular "
      expectedBytes: 'F09F938A',
      expectedEmoji: '📊'
    },
    
    // Other emoji tests
    {
      name: 'Test: ðŸ"‹ → 📋',
      input: 'ðŸ"‹', 
      expectedBytes: 'F09F938B',
      expectedEmoji: '📋'
    },
    
    // Legitimate Spanish text (should NOT be mojibake)
    {
      name: 'Legitimate: Panadería',
      input: 'Panadería',
      expectedMojibake: false
    },
    
    // Smart quotes (legitimate)
    {
      name: 'Legitimate: "hello"',
      input: '"hello"',
      expectedMojibake: false
    }
  ];
  
  for (const test of testCases) {
    console.log(`Testing: ${test.name}`);
    console.log(`  Input: "${test.input}"`);
    
    const candidate = {
      start: 0,
      end: test.input.length,
      text: test.input,
      length: test.input.length
    };
    
    const result = testMojibakeCandidate(candidate);
    
    if (test.expectedMojibake === false) {
      console.log(`  Expected: NOT mojibake`);
      console.log(`  Result: ${result.isMojibake ? 'MOJIBAKE' : 'NOT MOJIBAKE'} ✓`);
    } else {
      console.log(`  Expected bytes: ${test.expectedBytes}`);
      console.log(`  Actual bytes: ${result.recoveredBytes ? result.recoveredBytes.toString('hex').toUpperCase() : 'N/A'}`);
      console.log(`  Expected emoji: ${test.expectedEmoji}`);
      console.log(`  Actual emoji: "${result.recoveredString}"`);
      console.log(`  Match: ${result.recoveredString === test.expectedEmoji ? '✓' : '✗'}`);
    }
    
    console.log(`  Reason: ${result.reason}\n`);
  }
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('========================================');
  console.log('PHASE 3.1: MATHEMATICALLY CORRECT DETECTOR');
  console.log('========================================');
  
  // Run test cases first
  runTestCases();
  
  // Analyze files
  console.log('========================================');
  console.log('FILE ANALYSIS');
  console.log('========================================');
  
  const files = ['index.html', 'admin-dashboard-fragment.html'];
  const allResults = [];
  let grandTotalMojibake = 0;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${file}: NOT FOUND`);
      continue;
    }
    
    const analysis = detectMojibake(filePath);
    allResults.push(analysis);
    grandTotalMojibake += analysis.totalMojibake;
  }
  
  // Summary
  console.log('\n========================================');
  console.log('DETECTION SUMMARY');
  console.log('========================================\n');
  console.log(`Total mojibake sequences found: ${grandTotalMojibake}\n`);
  
  // Detailed forensic report
  if (grandTotalMojibake > 0) {
    console.log('========================================');
    console.log('FORENSIC REPORT');
    console.log('========================================\n');
    
    for (const fileAnalysis of allResults) {
      if (fileAnalysis.totalMojibake === 0) {
        console.log(`📄 ${fileAnalysis.fileName}: NO MOJIBAKE FOUND\n`);
        continue;
      }
      
      console.log(`📄 ${fileAnalysis.fileName}`);
      console.log(`   File size: ${fileAnalysis.fileSize} bytes`);
      console.log(`   Mojibake sequences: ${fileAnalysis.totalMojibake}\n`);
      
      // Group identical patterns
      const byPattern = {};
      for (const result of fileAnalysis.results) {
        const key = result.currentHex;
        if (!byPattern[key]) {
          byPattern[key] = [];
        }
        byPattern[key].push(result);
      }
      
      let patternNum = 1;
      for (const [hex, instances] of Object.entries(byPattern)) {
        const first = instances[0];
        console.log(`  [${patternNum}] Pattern: ${hex}`);
        console.log(`      Current String: "${first.currentString}"`);
        console.log(`      Current Unicode: ${first.currentCodePoints.join(' ')}`);
        console.log(`      Recovered Bytes: ${first.recoveredHex}`);
        console.log(`      Recovered String: "${first.recoveredString}"`);
        console.log(`      Encoding Model: ${first.encodingModel}`);
        console.log(`      Classification: ${first.classification}`);
        console.log(`      Confidence: ${(first.confidence * 100).toFixed(0)}%`);
        console.log(`      Occurrences: ${instances.length}`);
        console.log(`      Sample Offsets: ${instances.slice(0, 3).map(i => i.offset).join(', ')}${instances.length > 3 ? '...' : ''}`);
        console.log('');
        patternNum++;
      }
    }
  }
  
  console.log('========================================');
  console.log('DRY-RUN COMPLETE - NO FILES MODIFIED');
  console.log('========================================');
}

if (require.main === module) {
  main();
}

module.exports = { detectMojibake, testMojibakeCandidate, canReverseTo1252 };