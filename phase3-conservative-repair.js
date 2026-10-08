#!/usr/bin/env node
/**
 * PHASE 3.2: CONSERVATIVE MOJIBAKE REPAIR
 * 
 * Authorized repair of 164 TRUE_MOJIBAKE sequences using mathematically
 * validated Windows-1252 reverse transformation.
 * 
 * SAFETY RULES ENFORCED:
 * - Only modify index.html and admin-dashboard-fragment.html
 * - Create byte-for-byte backups
 * - Record SHA-256 hashes
 * - In-memory dry-run with complete validation
 * - Byte-level diff verification
 * - Preserve all legitimate content
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Windows-1252 mapping (EXACT as validated in Phase 3.1)
const UNICODE_TO_WIN1252_BYTE = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F
};

/**
 * Calculate SHA-256 hash of buffer
 */
function calculateHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Reverse string to Windows-1252 bytes
 */
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

/**
 * Validate mojibake candidate using EXACT Phase 3.1 logic
 */
function validateMojibakeCandidate(candidate) {
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
  
  // Must contain emoji or special chars (plausibility check)
  if (!/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u1F000-\u1F9FF]|[€™®©°±×÷§¶†‡…‹›""''–—•àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿšžœŸ]/u.test(recovered)) {
    return null;
  }
  
  return {
    currentString: candidate,
    currentBytes: currentBytes,
    recoveredBytes: reversed,
    recoveredString: recovered,
    classification: 'TRUE_MOJIBAKE'
  };
}

/**
 * Find all TRUE_MOJIBAKE sequences in file string (EXACT Phase 3.1 logic)
 */
function findTrueMojibake(fileString) {
  const results = [];
  
  for (let i = 0; i < fileString.length; i++) {
    const char = fileString[i];
    const cp = char.charCodeAt(0);
    
    // Look for potential mojibake start characters
    if (cp === 0xF0 || cp === 0x178 || UNICODE_TO_WIN1252_BYTE[cp] !== undefined) {
      
      // Try different length sequences starting here
      for (let len = 2; len <= 10; len++) {
        if (i + len > fileString.length) break;
        
        const candidate = fileString.substring(i, i + len);
        const result = validateMojibakeCandidate(candidate);
        
        if (result) {
          results.push({
            start: i,
            end: i + len,
            ...result
          });
          break; // Found valid sequence, don't try longer ones
        }
      }
    }
  }
  
  return results;
}

/**
 * Perform in-memory dry-run repair
 */
function performDryRun(originalBuffer, filePath) {
  const fileName = path.basename(filePath);
  const originalString = originalBuffer.toString('utf8');
  const originalHash = calculateHash(originalBuffer);
  
  console.log(`\n📄 DRY-RUN: ${fileName}`);
  console.log(`   Original size: ${originalBuffer.length} bytes`);
  console.log(`   Original SHA-256: ${originalHash}`);
  
  // Find all TRUE_MOJIBAKE sequences
  const mojibakeSequences = findTrueMojibake(originalString);
  console.log(`   TRUE_MOJIBAKE sequences found: ${mojibakeSequences.length}`);
  
  if (mojibakeSequences.length === 0) {
    return {
      fileName,
      originalBuffer,
      originalHash,
      repairedBuffer: originalBuffer,
      repairedHash: originalHash,
      changes: [],
      totalChanges: 0,
      success: true,
      message: 'No TRUE_MOJIBAKE sequences found'
    };
  }
  
  // Apply repairs in reverse order (so indices remain valid)
  let repairedString = originalString;
  const changes = [];
  
  // Sort by start position descending
  const sortedSequences = [...mojibakeSequences].sort((a, b) => b.start - a.start);
  
  for (const seq of sortedSequences) {
    const before = repairedString.substring(seq.start, seq.end);
    const after = seq.recoveredString;
    
    // Verify this is still the expected sequence
    if (before === seq.currentString) {
      repairedString = repairedString.substring(0, seq.start) + after + repairedString.substring(seq.end);
      
      changes.push({
        offset: seq.start,
        originalBytes: seq.currentBytes.toString('hex').toUpperCase(),
        repairedBytes: seq.recoveredBytes.toString('hex').toUpperCase(),
        originalString: seq.currentString,
        repairedString: seq.recoveredString,
        classification: seq.classification
      });
    }
  }
  
  const repairedBuffer = Buffer.from(repairedString, 'utf8');
  const repairedHash = calculateHash(repairedBuffer);
  
  console.log(`   Repaired size: ${repairedBuffer.length} bytes`);
  console.log(`   Repaired SHA-256: ${repairedHash}`);
  console.log(`   Changes applied: ${changes.length}`);
  
  // Byte-level validation
  console.log(`\n   BYTE-LEVEL VALIDATION:`);
  
  let byteDiffs = 0;
  let approvedByteDiffs = 0;
  const unexpectedChanges = [];
  
  // Track which byte ranges should have changed
  const approvedRanges = [];
  for (const change of changes) {
    // Calculate byte offset for this string change
    const beforeStr = originalString.substring(0, change.offset);
    const beforeBytes = Buffer.from(beforeStr, 'utf8');
    const originalSeqBytes = Buffer.from(change.originalString, 'utf8');
    const repairedSeqBytes = Buffer.from(change.repairedString, 'utf8');
    
    approvedRanges.push({
      start: beforeBytes.length,
      end: beforeBytes.length + originalSeqBytes.length,
      newEnd: beforeBytes.length + repairedSeqBytes.length,
      originalBytes: originalSeqBytes,
      repairedBytes: repairedSeqBytes
    });
  }
  
  // Check every byte
  const maxLen = Math.max(originalBuffer.length, repairedBuffer.length);
  for (let i = 0; i < maxLen; i++) {
    const origByte = i < originalBuffer.length ? originalBuffer[i] : null;
    const repByte = i < repairedBuffer.length ? repairedBuffer[i] : null;
    
    if (origByte !== repByte) {
      byteDiffs++;
      
      // Check if this byte change is in an approved range
      let inApprovedRange = false;
      for (const range of approvedRanges) {
        if (i >= range.start && i < range.end) {
          inApprovedRange = true;
          approvedByteDiffs++;
          break;
        }
      }
      
      if (!inApprovedRange) {
        unexpectedChanges.push({
          offset: i,
          original: origByte ? origByte.toString(16).toUpperCase().padStart(2, '0') : 'NULL',
          repaired: repByte ? repByte.toString(16).toUpperCase().padStart(2, '0') : 'NULL'
        });
      }
    }
  }
  
  console.log(`   Total byte differences: ${byteDiffs}`);
  console.log(`   Approved byte differences: ${approvedByteDiffs}`);
  console.log(`   Unexpected byte changes: ${unexpectedChanges.length}`);
  
  if (unexpectedChanges.length > 0) {
    console.log(`   ❌ VALIDATION FAILED: Unexpected byte changes detected`);
    console.log(`   First few unexpected changes:`);
    for (const change of unexpectedChanges.slice(0, 5)) {
      console.log(`     Offset ${change.offset}: ${change.original} → ${change.repaired}`);
    }
    
    return {
      fileName,
      originalBuffer,
      originalHash,
      repairedBuffer: null,
      repairedHash: null,
      changes,
      totalChanges: changes.length,
      success: false,
      message: `Validation failed: ${unexpectedChanges.length} unexpected byte changes`
    };
  }
  
  console.log(`   ✅ VALIDATION PASSED: All byte changes are approved`);
  
  return {
    fileName,
    originalBuffer,
    originalHash,
    repairedBuffer,
    repairedHash,
    changes,
    totalChanges: changes.length,
    success: true,
    message: 'Dry-run successful'
  };
}

/**
 * Create backup file
 */
function createBackup(originalBuffer, filePath) {
  const backupPath = filePath + '.backup-' + Date.now();
  fs.writeFileSync(backupPath, originalBuffer);
  console.log(`   Backup created: ${path.basename(backupPath)}`);
  return backupPath;
}

/**
 * Main repair function
 */
function main() {
  console.log('========================================');
  console.log('PHASE 3.2: CONSERVATIVE MOJIBAKE REPAIR');
  console.log('========================================');
  console.log('\nAUTHORIZED REPAIR OF 164 TRUE_MOJIBAKE SEQUENCES');
  console.log('\nSAFETY RULES ACTIVE:');
  console.log('- Only modify index.html and admin-dashboard-fragment.html');
  console.log('- Create byte-for-byte backups');
  console.log('- In-memory dry-run with validation');
  console.log('- Byte-level diff verification');
  console.log('- Preserve all legitimate content');
  
  const filesToRepair = [
    'admin-dashboard-fragment.html',
    'index.html'
  ];
  
  const results = [];
  let totalExpectedSequences = 0;
  let totalFoundSequences = 0;
  let totalRepairedSequences = 0;
  
  // Expected counts from Phase 3.1
  const expectedCounts = {
    'admin-dashboard-fragment.html': 33,
    'index.html': 131
  };
  
  console.log('\n========================================');
  console.log('STEP 1: LOAD FILES AND CREATE BACKUPS');
  console.log('========================================');
  
  for (const fileName of filesToRepair) {
    const filePath = path.join(__dirname, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${fileName}: NOT FOUND`);
      continue;
    }
    
    console.log(`\n📄 Loading ${fileName}...`);
    const originalBuffer = fs.readFileSync(filePath);
    const backupPath = createBackup(originalBuffer, filePath);
    
    results.push({
      fileName,
      filePath,
      backupPath,
      originalBuffer,
      expectedSequences: expectedCounts[fileName] || 0
    });
    
    totalExpectedSequences += expectedCounts[fileName] || 0;
  }
  
  console.log('\n========================================');
  console.log('STEP 2: IN-MEMORY DRY-RUN');
  console.log('========================================');
  
  for (const fileInfo of results) {
    const dryRunResult = performDryRun(fileInfo.originalBuffer, fileInfo.filePath);
    fileInfo.dryRunResult = dryRunResult;
    
    totalFoundSequences += dryRunResult.totalChanges;
    if (dryRunResult.success) {
      totalRepairedSequences += dryRunResult.totalChanges;
    }
  }
  
  console.log('\n========================================');
  console.log('STEP 3: DRY-RUN SUMMARY');
  console.log('========================================');
  
  console.log(`\nExpected sequences (from Phase 3.1): ${totalExpectedSequences}`);
  console.log(`Found sequences: ${totalFoundSequences}`);
  console.log(`Successfully validated: ${totalRepairedSequences}`);
  
  let allValidationsPassed = true;
  for (const fileInfo of results) {
    if (!fileInfo.dryRunResult.success) {
      allValidationsPassed = false;
      console.log(`❌ ${fileInfo.fileName}: ${fileInfo.dryRunResult.message}`);
    } else {
      console.log(`✅ ${fileInfo.fileName}: ${fileInfo.dryRunResult.totalChanges} sequences ready to repair`);
    }
  }
  
  if (!allValidationsPassed) {
    console.log('\n❌ DRY-RUN FAILED: Some validations failed. STOPPING.');
    console.log('Files NOT modified. Backups can be removed.');
    return;
  }
  
  console.log('\n========================================');
  console.log('STEP 4: WRITE REPAIRED FILES');
  console.log('========================================');
  
  for (const fileInfo of results) {
    if (fileInfo.dryRunResult.success && fileInfo.dryRunResult.totalChanges > 0) {
      console.log(`\n📝 Writing repaired ${fileInfo.fileName}...`);
      
      fs.writeFileSync(fileInfo.filePath, fileInfo.dryRunResult.repairedBuffer);
      
      // Verify write
      const verifyBuffer = fs.readFileSync(fileInfo.filePath);
      const verifyHash = calculateHash(verifyBuffer);
      
      if (verifyHash === fileInfo.dryRunResult.repairedHash) {
        console.log(`   ✅ Write successful`);
        console.log(`   Verified SHA-256: ${verifyHash}`);
        console.log(`   Changes applied: ${fileInfo.dryRunResult.totalChanges}`);
      } else {
        console.log(`   ❌ Write verification failed!`);
      }
    } else if (fileInfo.dryRunResult.totalChanges === 0) {
      console.log(`\n📄 ${fileInfo.fileName}: No changes needed`);
    }
  }
  
  console.log('\n========================================');
  console.log('STEP 5: DETAILED CHANGE REPORT');
  console.log('========================================');
  
  for (const fileInfo of results) {
    if (fileInfo.dryRunResult.totalChanges > 0) {
      console.log(`\n📄 ${fileInfo.fileName} - CHANGES APPLIED:\n`);
      
      // Group changes by pattern
      const byPattern = {};
      for (const change of fileInfo.dryRunResult.changes) {
        const key = change.repairedString;
        if (!byPattern[key]) byPattern[key] = [];
        byPattern[key].push(change);
      }
      
      let changeNum = 1;
      for (const [emoji, instances] of Object.entries(byPattern)) {
        const first = instances[0];
        console.log(`   [${changeNum}] "${first.originalString}" → "${first.repairedString}"`);
        console.log(`       Count: ${instances.length}`);
        console.log(`       Pattern: ${first.originalBytes} → ${first.repairedBytes}`);
        console.log(`       Classification: ${first.classification}`);
        console.log('');
        changeNum++;
      }
    }
  }
  
  console.log('\n========================================');
  console.log('PHASE 3.2 COMPLETE');
  console.log('========================================');
  
  console.log(`\n✅ REPAIR SUCCESSFUL`);
  console.log(`Files modified: ${results.filter(r => r.dryRunResult.totalChanges > 0).length}`);
  console.log(`Total sequences repaired: ${totalRepairedSequences}`);
  console.log(`Expected sequences: ${totalExpectedSequences}`);
  console.log(`Match: ${totalRepairedSequences === totalExpectedSequences ? '✅ PERFECT' : '⚠️ DIFFERENCE'}`);
  
  console.log('\nFILES MODIFIED:');
  for (const fileInfo of results) {
    if (fileInfo.dryRunResult.totalChanges > 0) {
      console.log(`- ${fileInfo.fileName}: ${fileInfo.dryRunResult.totalChanges} repairs`);
      console.log(`  Original: ${fileInfo.dryRunResult.originalHash}`);
      console.log(`  Repaired: ${fileInfo.dryRunResult.repairedHash}`);
    }
  }
  
  console.log('\nBACKUPS CREATED:');
  for (const fileInfo of results) {
    console.log(`- ${path.basename(fileInfo.backupPath)}`);
  }
  
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('- Files have been repaired but NOT deployed');
  console.log('- Files have been repaired but NOT committed to Git');
  console.log('- Test the repaired files before deploying');
  console.log('- Backups are available if rollback is needed');
  
  console.log('\n========================================');
  console.log('PHASE 3.2: CONSERVATIVE REPAIR COMPLETE');
  console.log('========================================');
}

if (require.main === module) {
  main();
}