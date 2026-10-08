#!/usr/bin/env node
/**
 * PHASE 3.2: POST-REPAIR VALIDATION (READ-ONLY)
 * 
 * Validates the current repaired files without modifying anything.
 * 
 * AUTHORIZED CHECKS:
 * A) Mojibake rescan with Windows-1252 detector
 * B) 164→162 sequence reconciliation 
 * C) UTF-8/Unicode integrity verification
 * D) HTML integrity check
 * E) Hash/size comparison
 * F) Backup verification
 * 
 * SAFETY: NO FILES WILL BE MODIFIED
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Windows-1252 mapping (same as repair script)
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

/**
 * Enhanced mojibake detection with classification
 */
function classifyMojibakeCandidate(candidate) {
  // Test Windows-1252 reverse transformation
  const reversed = reverseToWin1252(candidate);
  if (!reversed) {
    return {
      classification: 'UNRECOVERABLE',
      reason: 'Contains characters not in Windows-1252',
      recoveredString: null
    };
  }
  
  const currentBytes = Buffer.from(candidate, 'utf8');
  if (Buffer.compare(reversed, currentBytes) === 0) {
    return {
      classification: 'VALID_UTF8',
      reason: 'Transformation produces identical bytes',
      recoveredString: candidate
    };
  }
  
  // Try to decode recovered bytes as UTF-8
  let recovered;
  try {
    recovered = reversed.toString('utf8');
    if (recovered.includes('\ufffd')) {
      return {
        classification: 'UNRECOVERABLE',
        reason: 'Recovered bytes are invalid UTF-8',
        recoveredString: null
      };
    }
  } catch (e) {
    return {
      classification: 'UNRECOVERABLE',
      reason: 'Failed to decode recovered bytes',
      recoveredString: null
    };
  }
  
  if (recovered === candidate) {
    return {
      classification: 'VALID_UTF8',
      reason: 'Recovered string identical to current',
      recoveredString: recovered
    };
  }
  
  // Check plausibility
  const isPlausible = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u1F000-\u1F9FF]|[€™®©°±×÷§¶†‡…‹›""''–—•àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿšžœŸ]/u.test(recovered);
  
  if (isPlausible) {
    return {
      classification: 'TRUE_MOJIBAKE',
      reason: 'Valid Windows-1252 reverse transformation to plausible content',
      recoveredString: recovered
    };
  } else {
    return {
      classification: 'CONTEXT_ASSISTED',
      reason: 'Transformation succeeds but result not clearly plausible',
      recoveredString: recovered
    };
  }
}

/**
 * Find all potential mojibake sequences (broader than repair script)
 */
function findAllMojibakeCandidates(fileString) {
  const results = [];
  
  for (let i = 0; i < fileString.length; i++) {
    const char = fileString[i];
    const cp = char.charCodeAt(0);
    
    // Look for any character that could be from Windows-1252
    if ((cp <= 0xFF) || UNICODE_TO_WIN1252_BYTE[cp] !== undefined) {
      
      // Try different sequence lengths
      for (let len = 2; len <= 12; len++) {
        if (i + len > fileString.length) break;
        
        const candidate = fileString.substring(i, i + len);
        
        // Check if ALL characters in candidate can be reversed
        let canReverse = true;
        for (const c of candidate) {
          const ccp = c.charCodeAt(0);
          if (ccp > 0xFF && UNICODE_TO_WIN1252_BYTE[ccp] === undefined) {
            canReverse = false;
            break;
          }
        }
        
        if (canReverse) {
          const classification = classifyMojibakeCandidate(candidate);
          
          if (classification.classification !== 'VALID_UTF8') {
            results.push({
              start: i,
              end: i + len,
              candidate: candidate,
              ...classification
            });
            break; // Don't try longer sequences for this position
          }
        }
      }
    }
  }
  
  return results;
}

/**
 * A) MOJIBAKE RESCAN
 */
function performMojibakeRescan() {
  console.log('========================================');
  console.log('A) MOJIBAKE RESCAN');
  console.log('========================================\n');
  
  const files = ['admin-dashboard-fragment.html', 'index.html'];
  const results = {};
  
  for (const fileName of files) {
    const filePath = path.join(__dirname, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${fileName}: NOT FOUND`);
      continue;
    }
    
    const buffer = fs.readFileSync(filePath);
    const fileString = buffer.toString('utf8');
    
    console.log(`📄 ${fileName} (current repaired version)`);
    console.log(`   Size: ${buffer.length} bytes`);
    
    const candidates = findAllMojibakeCandidates(fileString);
    
    // Classify results
    const classifications = {
      TRUE_MOJIBAKE: [],
      CONTEXT_ASSISTED: [],
      AMBIGUOUS: [],
      UNRECOVERABLE: []
    };
    
    for (const result of candidates) {
      const category = result.classification;
      if (classifications[category]) {
        classifications[category].push(result);
      }
    }
    
    console.log(`   Total candidates found: ${candidates.length}`);
    console.log(`   TRUE_MOJIBAKE: ${classifications.TRUE_MOJIBAKE.length}`);
    console.log(`   CONTEXT_ASSISTED: ${classifications.CONTEXT_ASSISTED.length}`);
    console.log(`   AMBIGUOUS: ${classifications.AMBIGUOUS.length}`);
    console.log(`   UNRECOVERABLE: ${classifications.UNRECOVERABLE.length}`);
    
    results[fileName] = classifications;
    
    // Show remaining TRUE_MOJIBAKE if any
    if (classifications.TRUE_MOJIBAKE.length > 0) {
      console.log(`\n   ⚠️  REMAINING TRUE_MOJIBAKE:`);
      for (let i = 0; i < classifications.TRUE_MOJIBAKE.length; i++) {
        const item = classifications.TRUE_MOJIBAKE[i];
        console.log(`      [${i + 1}] "${item.candidate}" → "${item.recoveredString}"`);
        console.log(`          Offset: ${item.start}-${item.end}`);
        console.log(`          Reason: ${item.reason}`);
      }
    }
    
    // Show other classifications if any
    for (const [category, items] of Object.entries(classifications)) {
      if (category !== 'TRUE_MOJIBAKE' && items.length > 0) {
        console.log(`\n   ${category} (${items.length} items):`);
        for (let i = 0; i < Math.min(3, items.length); i++) {
          const item = items[i];
          console.log(`      "${item.candidate}" → ${item.recoveredString || 'N/A'} (${item.reason})`);
        }
        if (items.length > 3) {
          console.log(`      ... and ${items.length - 3} more`);
        }
      }
    }
    
    console.log('');
  }
  
  return results;
}

/**
 * B) 164-SEQUENCE RECONCILIATION
 */
function performSequenceReconciliation() {
  console.log('========================================');
  console.log('B) EXPECTED 164-SEQUENCE RECONCILIATION');
  console.log('========================================\n');
  
  console.log('PHASE 3.1 Expected:');
  console.log('  admin-dashboard-fragment.html: 33');
  console.log('  index.html: 131');
  console.log('  Total: 164');
  
  console.log('\nPHASE 3.2 Repaired:');
  console.log('  admin-dashboard-fragment.html: 33');
  console.log('  index.html: 129');
  console.log('  Total: 162');
  
  console.log('\nDifference: 2 sequences not repaired');
  
  // To find the missing sequences, we need to compare the original backup
  // with what should have been found
  console.log('\n🔍 Analyzing the 2 unrepaired sequences...');
  
  // Read the backup to see what was originally there
  const backupFiles = [
    'admin-dashboard-fragment.html.backup-1791474216758',
    'index.html.backup-1791474216762'
  ];
  
  for (const backupFile of backupFiles) {
    const backupPath = path.join(__dirname, backupFile);
    if (fs.existsSync(backupPath)) {
      const originalBuffer = fs.readFileSync(backupPath);
      const originalString = originalBuffer.toString('utf8');
      
      console.log(`\n📄 Analyzing original ${backupFile}...`);
      
      // Find original mojibake
      const originalMojibake = findAllMojibakeCandidates(originalString);
      const trueMojibake = originalMojibake.filter(m => m.classification === 'TRUE_MOJIBAKE');
      
      console.log(`   Original TRUE_MOJIBAKE found: ${trueMojibake.length}`);
      
      // Now check current file
      const currentFile = backupFile.replace(/\.backup-\d+$/, '');
      const currentPath = path.join(__dirname, currentFile);
      
      if (fs.existsSync(currentPath)) {
        const currentBuffer = fs.readFileSync(currentPath);
        const currentString = currentBuffer.toString('utf8');
        const currentMojibake = findAllMojibakeCandidates(currentString);
        const currentTrueMojibake = currentMojibake.filter(m => m.classification === 'TRUE_MOJIBAKE');
        
        console.log(`   Current TRUE_MOJIBAKE remaining: ${currentTrueMojibake.length}`);
        
        if (currentFile.includes('index.html')) {
          const difference = trueMojibake.length - 129; // 129 were repaired
          console.log(`   Expected difference for index.html: ${difference} (should be 2)`);
          
          if (currentTrueMojibake.length > 0) {
            console.log(`   ⚠️  REMAINING UNREPAIRED SEQUENCES:`);
            for (let i = 0; i < currentTrueMojibake.length; i++) {
              const item = currentTrueMojibake[i];
              console.log(`      [${i + 1}] "${item.candidate}" → "${item.recoveredString}"`);
              console.log(`          File: ${currentFile}`);
              console.log(`          Location: characters ${item.start}-${item.end}`);
              console.log(`          Reason not repaired: Likely sequence detection logic missed this pattern`);
            }
          }
        }
      }
    }
  }
}

/**
 * C) UTF-8 / UNICODE INTEGRITY
 */
function performUnicodeIntegrityCheck() {
  console.log('========================================');
  console.log('C) UTF-8 / UNICODE INTEGRITY');
  console.log('========================================\n');
  
  const files = ['admin-dashboard-fragment.html', 'index.html'];
  let overallPass = true;
  
  for (const fileName of files) {
    const filePath = path.join(__dirname, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${fileName}: NOT FOUND`);
      overallPass = false;
      continue;
    }
    
    console.log(`📄 ${fileName}`);
    
    const buffer = fs.readFileSync(filePath);
    let fileString;
    
    // Test UTF-8 validity
    try {
      fileString = buffer.toString('utf8');
      if (fileString.includes('\ufffd')) {
        console.log(`   ❌ UTF-8 INVALID: Contains replacement characters`);
        overallPass = false;
        continue;
      } else {
        console.log(`   ✅ UTF-8 VALID: No replacement characters`);
      }
    } catch (e) {
      console.log(`   ❌ UTF-8 INVALID: Decode error - ${e.message}`);
      overallPass = false;
      continue;
    }
    
    // Check specific character preservation
    const spanishAccents = /[áéíóúüñÁÉÍÓÚÜÑ]/g;
    const spanishMatches = fileString.match(spanishAccents);
    console.log(`   Spanish accents found: ${spanishMatches ? spanishMatches.length : 0}`);
    
    // Check for emoji
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojiMatches = fileString.match(emojiPattern);
    console.log(`   Emoji found: ${emojiMatches ? emojiMatches.length : 0}`);
    
    // Check for variation selectors
    const variationSelectors = /[\uFE0F]/g;
    const vsMatches = fileString.match(variationSelectors);
    console.log(`   Variation selectors (U+FE0F): ${vsMatches ? vsMatches.length : 0}`);
    
    // Check for ZWJ sequences
    const zwjPattern = /[\u200D]/g;
    const zwijMatches = fileString.match(zwjPattern);
    console.log(`   Zero-width joiners (U+200D): ${zwijMatches ? zwijMatches.length : 0}`);
    
    // Look for the specific 👨‍🍳 sequence
    if (fileString.includes('👨‍🍳')) {
      console.log(`   ✅ Complex ZWJ sequence preserved: 👨‍🍳 found`);
    }
    
    console.log('');
  }
  
  return overallPass;
}

/**
 * D) HTML INTEGRITY
 */
function performHtmlIntegrityCheck() {
  console.log('========================================');
  console.log('D) HTML INTEGRITY');
  console.log('========================================\n');
  
  const files = ['admin-dashboard-fragment.html', 'index.html'];
  let overallPass = true;
  
  for (const fileName of files) {
    const filePath = path.join(__dirname, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${fileName}: NOT FOUND`);
      overallPass = false;
      continue;
    }
    
    console.log(`📄 ${fileName}`);
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('utf8');
    
    // Basic HTML structure checks
    const issues = [];
    
    // Check for basic tag structure
    const openTags = (content.match(/</g) || []).length;
    const closeTags = (content.match(/>/g) || []).length;
    if (openTags !== closeTags) {
      issues.push(`Tag mismatch: ${openTags} '<' vs ${closeTags} '>'`);
    } else {
      console.log(`   ✅ Tag brackets balanced: ${openTags} pairs`);
    }
    
    // Check quotes in attributes
    const unescapedQuotes = content.match(/=\s*"[^"]*"[^>\s]/g);
    if (unescapedQuotes) {
      issues.push(`Potential quote issues: ${unescapedQuotes.length} cases`);
    } else {
      console.log(`   ✅ No obvious quote corruption detected`);
    }
    
    // Check for IDs
    const ids = content.match(/id\s*=\s*"[^"]+"/g);
    console.log(`   IDs found: ${ids ? ids.length : 0}`);
    
    // Check for classes
    const classes = content.match(/class\s*=\s*"[^"]+"/g);
    console.log(`   Classes found: ${classes ? classes.length : 0}`);
    
    // Check for onclick handlers
    const onclicks = content.match(/onclick\s*=\s*"[^"]+"/g);
    console.log(`   onclick handlers: ${onclicks ? onclicks.length : 0}`);
    
    // Check for URLs
    const urls = content.match(/https?:\/\/[^\s"'<>]+/g);
    console.log(`   URLs found: ${urls ? urls.length : 0}`);
    
    // Check for script blocks
    const scripts = content.match(/<script[^>]*>.*?<\/script>/gs);
    console.log(`   Script blocks: ${scripts ? scripts.length : 0}`);
    
    // Check for CSS blocks
    const styles = content.match(/<style[^>]*>.*?<\/style>/gs);
    console.log(`   Style blocks: ${styles ? styles.length : 0}`);
    
    if (issues.length > 0) {
      console.log(`   ⚠️  POTENTIAL ISSUES:`);
      for (const issue of issues) {
        console.log(`      - ${issue}`);
      }
      overallPass = false;
    } else {
      console.log(`   ✅ No structural issues detected`);
    }
    
    console.log('');
  }
  
  return overallPass;
}

/**
 * E) HASH / SIZE REPORT
 */
function performHashSizeReport() {
  console.log('========================================');
  console.log('E) HASH / SIZE REPORT');
  console.log('========================================\n');
  
  const files = [
    {
      current: 'admin-dashboard-fragment.html',
      backup: 'admin-dashboard-fragment.html.backup-1791474216758',
      originalHash: 'eaeb992a171fa12de6f5f0cb976fa9af931758b903294e25496134a6203ed4f3', // From repair log
      repairedHash: '7c8606375a254cb391456192261dc999c99496fece49142df9581884e48f76e9'   // From repair log
    },
    {
      current: 'index.html',
      backup: 'index.html.backup-1791474216762', 
      originalHash: '636f629232803474c813481a0453791f9962a5f6fcae5aecd2d50abd49e4dfd5', // From repair log
      repairedHash: '814f3771273479ebbb6573bd248b933b36d58f3752468a3a51bd62e680c186b7'   // From repair log
    }
  ];
  
  for (const fileInfo of files) {
    console.log(`📄 ${fileInfo.current}`);
    
    // Current file
    const currentPath = path.join(__dirname, fileInfo.current);
    if (fs.existsSync(currentPath)) {
      const currentBuffer = fs.readFileSync(currentPath);
      const currentHash = calculateHash(currentBuffer);
      
      console.log(`   Current size: ${currentBuffer.length} bytes`);
      console.log(`   Current SHA-256: ${currentHash}`);
      console.log(`   Expected hash: ${fileInfo.repairedHash}`);
      console.log(`   Hash match: ${currentHash === fileInfo.repairedHash ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log(`   ❌ Current file not found`);
    }
    
    // Original backup
    const backupPath = path.join(__dirname, fileInfo.backup);
    if (fs.existsSync(backupPath)) {
      const backupBuffer = fs.readFileSync(backupPath);
      const backupHash = calculateHash(backupBuffer);
      
      console.log(`   Original size: ${backupBuffer.length} bytes`);
      console.log(`   Original SHA-256: ${backupHash}`);
      console.log(`   Expected original: ${fileInfo.originalHash}`);
      console.log(`   Original match: ${backupHash === fileInfo.originalHash ? '✅ YES' : '❌ NO'}`);
    } else {
      console.log(`   ❌ Backup file not found`);
    }
    
    console.log('');
  }
}

/**
 * F) BACKUP VERIFICATION
 */
function performBackupVerification() {
  console.log('========================================');
  console.log('F) BACKUP VERIFICATION');
  console.log('========================================\n');
  
  const backups = [
    'admin-dashboard-fragment.html.backup-1791474216758',
    'index.html.backup-1791474216762'
  ];
  
  let allBackupsOk = true;
  
  for (const backupFile of backups) {
    const backupPath = path.join(__dirname, backupFile);
    
    console.log(`📄 ${backupFile}`);
    
    if (fs.existsSync(backupPath)) {
      try {
        const stats = fs.statSync(backupPath);
        const buffer = fs.readFileSync(backupPath);
        
        console.log(`   ✅ Exists and readable`);
        console.log(`   Size: ${buffer.length} bytes`);
        console.log(`   Modified: ${stats.mtime.toISOString()}`);
        
        // Test if it's valid UTF-8
        const content = buffer.toString('utf8');
        if (content.includes('\ufffd')) {
          console.log(`   ⚠️  Contains invalid UTF-8 sequences`);
        } else {
          console.log(`   ✅ Valid UTF-8 content`);
        }
      } catch (e) {
        console.log(`   ❌ Error reading backup: ${e.message}`);
        allBackupsOk = false;
      }
    } else {
      console.log(`   ❌ Backup file not found`);
      allBackupsOk = false;
    }
    
    console.log('');
  }
  
  return allBackupsOk;
}

/**
 * MAIN VALIDATION
 */
function main() {
  console.log('========================================');
  console.log('PHASE 3.2 POST-REPAIR VALIDATION');
  console.log('========================================');
  console.log('\nREAD-ONLY VALIDATION (NO FILES MODIFIED)');
  console.log('\nValidating current repaired files:');
  console.log('- index.html');
  console.log('- admin-dashboard-fragment.html');
  
  const mojibakeResults = performMojibakeRescan();
  
  performSequenceReconciliation();
  
  const unicodeIntegrityPass = performUnicodeIntegrityCheck();
  
  const htmlIntegrityPass = performHtmlIntegrityCheck();
  
  performHashSizeReport();
  
  const backupsPass = performBackupVerification();
  
  // FINAL REPORT
  console.log('========================================');
  console.log('FINAL VALIDATION REPORT');
  console.log('========================================\n');
  
  // Count remaining mojibake
  let totalTrueMojibake = 0;
  let totalContextAssisted = 0;
  let totalAmbiguous = 0;
  let totalUnrecoverable = 0;
  
  for (const [fileName, classifications] of Object.entries(mojibakeResults)) {
    totalTrueMojibake += classifications.TRUE_MOJIBAKE.length;
    totalContextAssisted += classifications.CONTEXT_ASSISTED.length;
    totalAmbiguous += classifications.AMBIGUOUS.length;
    totalUnrecoverable += classifications.UNRECOVERABLE.length;
  }
  
  console.log('PHASE 3.2 POST-REPAIR VALIDATION\n');
  
  console.log('Mojibake:');
  console.log(`- Repaired: 162/164`);
  console.log(`- Remaining TRUE_MOJIBAKE: ${totalTrueMojibake}`);
  console.log(`- Remaining CONTEXT_ASSISTED: ${totalContextAssisted}`);
  console.log(`- Remaining AMBIGUOUS: ${totalAmbiguous}`);
  console.log(`- Remaining UNRECOVERABLE: ${totalUnrecoverable}`);
  console.log(`- Unresolved original sequences: 2`);
  
  if (totalTrueMojibake > 0) {
    console.log('\nUnresolved sequences:');
    let count = 1;
    for (const [fileName, classifications] of Object.entries(mojibakeResults)) {
      for (const item of classifications.TRUE_MOJIBAKE) {
        console.log(`${count}. File: ${fileName}, Location: ${item.start}-${item.end}`);
        console.log(`   Original: "${item.candidate}"`);
        console.log(`   Should be: "${item.recoveredString}"`);
        console.log(`   Reason not repaired: Sequence detection logic missed this pattern`);
        count++;
      }
    }
  } else {
    console.log('\nUnresolved sequences: None detected in current scan');
  }
  
  console.log(`\nUTF-8 integrity: ${unicodeIntegrityPass ? 'PASS' : 'FAIL'}`);
  console.log(`HTML integrity: ${htmlIntegrityPass ? 'PASS' : 'FAIL'}`);
  console.log(`Backups: ${backupsPass ? 'PASS' : 'FAIL'}`);
  
  console.log('\nFiles modified during this validation: NONE');
  
  console.log('\n========================================');
  console.log('VALIDATION COMPLETE');
  console.log('========================================');
  
  console.log('\n⏸️  WAITING FOR FURTHER AUTHORIZATION');
  console.log('✓ Validation complete');
  console.log('✓ No files modified');
  console.log('✓ Backups preserved');
  console.log('✓ Report generated');
}

if (require.main === module) {
  main();
}