#!/usr/bin/env node
/**
 * PHASE 3.1: PRAGMATIC MOJIBAKE DETECTOR
 * 
 * Based on forensic analysis, detects KNOWN mojibake patterns:
 * 1. Pure mojibake: C3B0C2A5 sequences
 * 2. Known emoji markers: C3B0C5B8 (ðŸ)
 * 3. Character corruption patterns
 */

const fs = require('fs');
const path = require('path');

// KNOWN MOJIBAKE PATTERNS from forensic analysis
const KNOWN_PATTERNS = [
  // Emoji starters
  { pattern: Buffer.from([0xC3, 0xB0]), char: 'ð', from: '0xF0', note: 'Emoji start' },
  
  // Windows-1252 special through UTF-8
  { pattern: Buffer.from([0xC5, 0xB8]), char: 'Ÿ', from: '0x9F', note: 'Win1252 0x9F' },
  { pattern: Buffer.from([0xC2, 0x93]), char: '"', from: '0x93', note: 'Win1252 0x93 (smart quote)' },
  { pattern: Buffer.from([0xC2, 0x8A]), char: 'Š', from: '0x8A', note: 'Win1252 0x8A' },
];

// Sequences that indicate mojibake
const MOJIBAKE_INDICATORS = [
  'ðŸ',  // Most common: F0 9F (emoji) misread as Windows-1252
  'ðŸ"', // With smart quote
];

/**
 * Find all instances of known mojibake patterns
 */
function scanForKnownMojibake(buffer) {
  const results = [];
  
  // Search for "ðŸ" pattern (C3 B0 C5 B8)
  let idx = 0;
  while ((idx = buffer.indexOf(Buffer.from([0xC3, 0xB0, 0xC5, 0xB8]), idx)) !== -1) {
    // Get context
    const start = Math.max(0, idx - 20);
    const end = Math.min(buffer.length, idx + 100);
    const context = buffer.slice(start, end);
    
    results.push({
      type: 'ðŸ pattern (emoji start corruption)',
      offset: idx,
      pattern: 'C3B0C5B8',
      contextBytes: context.toString('hex'),
      contextText: context.toString('utf8'),
      likely_original: 'F09F??',
      likely_emoji: 'Unknown (starts with F09F)',
      confidence: 0.95
    });
    
    idx += 4;
  }
  
  // Search for other known corruption patterns
  const otherPatterns = [
    { hex: [0xC3, 0xA2, 0xC2, 0xA4], text: 'â¤', emoji: 'heart' },
    { hex: [0xC3, 0xA2, 0xC2, 0x98], text: 'â˜', emoji: 'coffee' },
  ];
  
  for (const pat of otherPatterns) {
    idx = 0;
    const buf = Buffer.from(pat.hex);
    while ((idx = buffer.indexOf(buf, idx)) !== -1) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(buffer.length, idx + 100);
      const context = buffer.slice(start, end);
      
      results.push({
        type: 'Known corruption: ' + pat.text,
        offset: idx,
        pattern: buf.toString('hex').toUpperCase(),
        contextBytes: context.toString('hex'),
        contextText: context.toString('utf8'),
        likely_emoji: pat.emoji,
        confidence: 0.8
      });
      
      idx += buf.length;
    }
  }
  
  return results;
}

/**
 * Generate forensic report
 */
function generateReport(file, results) {
  if (results.length === 0) {
    return `NO MOJIBAKE FOUND`;
  }
  
  // Group by pattern
  const byPattern = {};
  for (const r of results) {
    if (!byPattern[r.pattern]) {
      byPattern[r.pattern] = [];
    }
    byPattern[r.pattern].push(r);
  }
  
  let report = '';
  let patternNum = 1;
  
  for (const pattern in byPattern) {
    const instances = byPattern[pattern];
    report += `[${patternNum}] Pattern: ${pattern}\n`;
    report += `    Decoded as: "${instances[0].contextText.substring(0, 30).replace(/[\r\n]/g, ' ')}..."\n`;
    report += `    Found: ${instances.length} times\n`;
    report += `    Offsets: ${instances.slice(0, 3).map(i => i.offset).join(', ')}${instances.length > 3 ? '...' : ''}\n`;
    report += `    Likely original: ${instances[0].likely_emoji || 'emoji'}\n`;
    report += '\n';
    patternNum++;
  }
  
  return report;
}

/**
 * Calculate recovery plan
 */
function calculateRecovery(buffer) {
  const bytesCounted = new Map();
  
  // Count bytes that would change
  let idx = 0;
  while ((idx = buffer.indexOf(Buffer.from([0xC3, 0xB0, 0xC5, 0xB8]), idx)) !== -1) {
    bytesCounted.set(idx, { from: [0xC3, 0xB0, 0xC5, 0xB8], to: 'F09F....' });
    idx += 4;
  }
  
  return bytesCounted;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('========================================');
  console.log('PHASE 3.1: PRAGMATIC MOJIBAKE ANALYSIS');
  console.log('========================================\n');
  
  const files = ['index.html', 'admin-dashboard-fragment.html'];
  const statistics = {};
  let totalProblems = 0;
  
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${file}: NOT FOUND\n`);
      continue;
    }
    
    console.log(`📄 Analyzing ${file}...`);
    const buffer = fs.readFileSync(filePath);
    const fileSize = buffer.length;
    
    const results = scanForKnownMojibake(buffer);
    console.log(`   Size: ${fileSize} bytes`);
    console.log(`   Problems found: ${results.length}\n`);
    
    statistics[file] = results;
    totalProblems += results.length;
  }
  
  console.log('========================================');
  console.log('FORENSIC SUMMARY');
  console.log('========================================\n');
  console.log(`Total problematic sequences: ${totalProblems}\n`);
  
  // Detailed breakdown
  console.log('========================================');
  console.log('DETAILED ANALYSIS');
  console.log('========================================\n');
  
  for (const file in statistics) {
    const results = statistics[file];
    console.log(`📄 ${file}`);
    console.log('-' + '='.repeat(40));
    
    const report = generateReport(file, results);
    console.log(report);
  }
  
  // Recovery Statistics
  console.log('========================================');
  console.log('RECOVERY STATISTICS');
  console.log('========================================\n');
  
  for (const file in statistics) {
    const results = statistics[file];
    const buffer = fs.readFileSync(path.join(__dirname, file));
    
    // Count bytes affected
    let bytesAffected = 0;
    let sequencesAffected = 0;
    
    for (const r of results) {
      bytesAffected += 4; // Each "ðŸ" is 4 bytes (C3 B0 C5 B8)
      sequencesAffected++;
    }
    
    console.log(`${file}:`);
    console.log(`  File size: ${buffer.length} bytes`);
    console.log(`  Problematic bytes: ${bytesAffected} (${(bytesAffected / buffer.length * 100).toFixed(2)}%)`);
    console.log(`  Sequences: ${sequencesAffected}`);
    console.log('');
  }
  
  // DRY-RUN PREDICTION
  console.log('========================================');
  console.log('DRY-RUN: PREDICTED CHANGES');
  console.log('========================================\n');
  console.log('If recovery is applied (WITHOUT actual file modification):\n');
  
  for (const file in statistics) {
    const results = statistics[file];
    if (results.length === 0) continue;
    
    console.log(`${file}:`);
    for (let i = 0; i < Math.min(3, results.length); i++) {
      const r = results[i];
      const preview = r.contextText.substring(0, 50).replace(/[\r\n]/g, ' ');
      console.log(`  [${i + 1}] At offset ${r.offset}:`);
      console.log(`      Before: "${preview}..."`);
      // For display, we'd show what it should look like after
      console.log(`      Status: READY TO RECOVER (contains ${r.pattern})`);
    }
    console.log('');
  }
  
  console.log('========================================');
  console.log('ANALYSIS COMPLETE - NO FILES MODIFIED');
  console.log('========================================\n');
  
  console.log('NEXT STEPS:');
  console.log('1. Review this analysis');
  console.log('2. Confirm recovery is safe');
  console.log('3. Proceed to PHASE 3 implementation');
}

main();
