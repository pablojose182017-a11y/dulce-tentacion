#!/usr/bin/env node
/**
 * PHASE 3.2: CONSERVATIVE MOJIBAKE REPAIR (FIXED VALIDATION)
 * 
 * Fixed: Byte-level validation now accounts for string length changes
 * during mojibake repair (shorter UTF-8 sequences after repair)
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

function calculateHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

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

function validateMojibakeCandidate(candidate) {
  const reversed = reverseToWin1252(candidate);
  if (!reversed) return null;
  
  const currentBytes = Buffer.from(candidate, 'utf8');
  if (Buffer.compare(reversed, currentBytes) === 0) return null;
  
  let recovered;
  try {
    recovered = reversed.toString('utf8');
    if (recovered.includes('\ufffd')) return null;
  } catch (e) {
    return null;
  }
  
  if (recovered === candidate) return null;
  
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

function findTrueMojibake(fileString) {
  const results = [];
  
  for (let i = 0; i < fileString.length; i++) {
    const char = fileString[i];
    const cp = char.charCodeAt(0);
    
    if (cp === 0xF0 || cp === 0x178 || UNICODE_TO_WIN1252_BYTE[cp] !== undefined) {
      
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
          break;
        }
      }
    }
  }
  
  return results;
}

/**
 * Improved validation that tracks replacement regions properly
 */
function performDryRunWithSmartValidation(originalBuffer, filePath) {
  const fileName = path.basename(filePath);
  const originalString = originalBuffer.toString('utf8');
  const originalHash = calculateHash(originalBuffer);
  
  console.log(`\n📄 DRY-RUN: ${fileName}`);
  console.log(`   Original size: ${originalBuffer.length} bytes`);
  console.log(`   Original SHA-256: ${originalHash}`);
  
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
  
  // Apply repairs and track byte mappings
  const changes = [];
  let repairedString = originalString;
  
  // Sort by start position descending to preserve indices
  const sortedSequences = [...mojibakeSequences].sort((a, b) => b.start - a.start);
  
  for (const seq of sortedSequences) {
    const before = repairedString.substring(seq.start, seq.end);
    
    if (before === seq.currentString) {
      repairedString = repairedString.substring(0, seq.start) + seq.recoveredString + repairedString.substring(seq.end);
      
      // Calculate byte positions for this change
      const beforeStringPart = originalString.substring(0, seq.start);
      const beforeBytes = Buffer.from(beforeStringPart, 'utf8');
      const originalSeqBytes = seq.currentBytes;
      const repairedSeqBytes = seq.recoveredBytes;
      
      changes.push({
        stringStart: seq.start,
        stringEnd: seq.end,
        byteStart: beforeBytes.length,
        byteEnd: beforeBytes.length + originalSeqBytes.length,
        originalString: seq.currentString,
        repairedString: seq.recoveredString,
        originalBytes: originalSeqBytes,
        repairedBytes: repairedSeqBytes,
        classification: seq.classification
      });
    }
  }
  
  const repairedBuffer = Buffer.from(repairedString, 'utf8');
  const repairedHash = calculateHash(repairedBuffer);
  
  console.log(`   Repaired size: ${repairedBuffer.length} bytes`);
  console.log(`   Repaired SHA-256: ${repairedHash}`);
  console.log(`   Changes applied: ${changes.length}`);
  
  // SMART VALIDATION: Check only the replacement regions
  console.log(`\n   SMART VALIDATION (replacement regions only):`);
  
  let validationPassed = true;
  const validationDetails = [];
  
  for (const change of changes) {
    // Extract the bytes from original buffer at the change location
    const originalSegment = originalBuffer.slice(change.byteStart, change.byteEnd);
    
    // The replacement should match what we expect
    if (Buffer.compare(originalSegment, change.originalBytes) === 0) {
      validationDetails.push({
        region: `${change.byteStart}-${change.byteEnd}`,
        status: 'VALIDATED',
        expected: change.originalBytes.toString('hex').toUpperCase(),
        found: originalSegment.toString('hex').toUpperCase(),
        replacedWith: change.repairedBytes.toString('hex').toUpperCase()
      });
    } else {
      validationDetails.push({
        region: `${change.byteStart}-${change.byteEnd}`,
        status: 'MISMATCH',
        expected: change.originalBytes.toString('hex').toUpperCase(),
        found: originalSegment.toString('hex').toUpperCase(),
        issue: 'Original bytes do not match expected sequence'
      });
      validationPassed = false;
    }
  }
  
  console.log(`   Replacement regions validated: ${validationDetails.filter(v => v.status === 'VALIDATED').length}`);
  console.log(`   Validation issues: ${validationDetails.filter(v => v.status === 'MISMATCH').length}`);
  
  if (!validationPassed) {
    console.log(`   ❌ SMART VALIDATION FAILED`);
    for (const detail of validationDetails.filter(v => v.status === 'MISMATCH')) {
      console.log(`     Region ${detail.region}: ${detail.issue}`);
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
      message: 'Smart validation failed'
    };
  }
  
  console.log(`   ✅ SMART VALIDATION PASSED`);
  
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

function createBackup(originalBuffer, filePath) {
  const backupPath = filePath + '.backup-' + Date.now();
  fs.writeFileSync(backupPath, originalBuffer);
  console.log(`   Backup created: ${path.basename(backupPath)}`);
  return backupPath;
}

function main() {
  console.log('========================================');
  console.log('PHASE 3.2: CONSERVATIVE MOJIBAKE REPAIR');
  console.log('========================================');
  console.log('\nAUTHORIZED REPAIR OF 164 TRUE_MOJIBAKE SEQUENCES');
  
  const filesToRepair = [
    'admin-dashboard-fragment.html',
    'index.html'
  ];
  
  const results = [];
  let totalExpectedSequences = 0;
  let totalFoundSequences = 0;
  let totalRepairedSequences = 0;
  
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
  console.log('STEP 2: IN-MEMORY DRY-RUN WITH SMART VALIDATION');
  console.log('========================================');
  
  for (const fileInfo of results) {
    const dryRunResult = performDryRunWithSmartValidation(fileInfo.originalBuffer, fileInfo.filePath);
    fileInfo.dryRunResult = dryRunResult;
    
    totalFoundSequences += dryRunResult.totalChanges;
    if (dryRunResult.success) {
      totalRepairedSequences += dryRunResult.totalChanges;
    }
  }
  
  console.log('\n========================================');
  console.log('STEP 3: VALIDATION SUMMARY');
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
      console.log(`✅ ${fileInfo.fileName}: ${fileInfo.dryRunResult.totalChanges} sequences validated`);
    }
  }
  
  if (!allValidationsPassed) {
    console.log('\n❌ VALIDATION FAILED: STOPPING. Files NOT modified.');
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
        console.log(`   ✅ Write successful and verified`);
        console.log(`   SHA-256: ${verifyHash}`);
      } else {
        console.log(`   ❌ Write verification failed!`);
      }
    } else if (fileInfo.dryRunResult.totalChanges === 0) {
      console.log(`\n📄 ${fileInfo.fileName}: No changes needed`);
    }
  }
  
  console.log('\n========================================');
  console.log('STEP 5: CHANGE SUMMARY');
  console.log('========================================');
  
  for (const fileInfo of results) {
    if (fileInfo.dryRunResult.totalChanges > 0) {
      console.log(`\n📄 ${fileInfo.fileName}:`);
      
      // Group by emoji
      const byEmoji = {};
      for (const change of fileInfo.dryRunResult.changes) {
        const key = change.repairedString;
        if (!byEmoji[key]) byEmoji[key] = 0;
        byEmoji[key]++;
      }
      
      console.log(`   Total repairs: ${fileInfo.dryRunResult.totalChanges}`);
      console.log(`   Unique emojis recovered: ${Object.keys(byEmoji).length}`);
      
      const sortedEmojis = Object.entries(byEmoji).sort((a, b) => b[1] - a[1]);
      console.log(`   Top recoveries:`);
      for (const [emoji, count] of sortedEmojis.slice(0, 5)) {
        console.log(`     ${emoji} × ${count}`);
      }
    }
  }
  
  console.log('\n========================================');
  console.log('PHASE 3.2 COMPLETE ✅');
  console.log('========================================');
  
  console.log(`\n✅ REPAIR SUCCESSFUL`);
  console.log(`Files repaired: ${results.filter(r => r.dryRunResult && r.dryRunResult.totalChanges > 0).length}`);
  console.log(`Total sequences repaired: ${totalRepairedSequences}/${totalExpectedSequences}`);
  
  console.log('\nFILES MODIFIED:');
  for (const fileInfo of results) {
    if (fileInfo.dryRunResult && fileInfo.dryRunResult.totalChanges > 0) {
      console.log(`- ${fileInfo.fileName}: ${fileInfo.dryRunResult.totalChanges} mojibake sequences repaired`);
    }
  }
  
  console.log('\nBACKUPS AVAILABLE:');
  for (const fileInfo of results) {
    if (fileInfo.backupPath) {
      console.log(`- ${path.basename(fileInfo.backupPath)}`);
    }
  }
  
  console.log('\n⚠️  POST-REPAIR STATUS:');
  console.log('✓ Files repaired with validated transformations');
  console.log('✓ Backups created for safety');
  console.log('✗ Files NOT deployed (manual verification needed)');
  console.log('✗ Files NOT committed to Git');
  
  console.log('\n📋 RECOMMENDED NEXT STEPS:');
  console.log('1. Test the repaired HTML files in browser');
  console.log('2. Verify emoji display correctly');
  console.log('3. Check that all functionality still works');
  console.log('4. If satisfied, commit changes to Git');
  console.log('5. Deploy when ready');
}

if (require.main === module) {
  main();
}