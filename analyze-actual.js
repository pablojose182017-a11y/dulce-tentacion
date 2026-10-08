#!/usr/bin/env node
/**
 * Analyze what mojibake SHOULD look like
 */

const fs = require('fs');

console.log('=== ANALYZING ACTUAL FILE CONTENT ===\n');

// Read admin file
const admin = fs.readFileSync('admin-dashboard-fragment.html');

// The context should be: ">📋 Panel Administrativo"
// Let's check what 📋 should be

const emoji = '📋'; // U+1F4CB
const emojiUtf8 = Buffer.from(emoji, 'utf8');
console.log('Emoji 📋 should be:');
console.log('  UTF-8 bytes: ' + emojiUtf8.toString('hex').toUpperCase());
console.log('  Byte array: ' + Array.from(emojiUtf8).map(b => '0x' + b.toString(16).toUpperCase()).join(', '));

console.log('\nWhat happens if those bytes are misread as Latin-1 and re-encoded:');

// Step 1: UTF-8 bytes as if they were Latin-1
const bytes = Array.from(emojiUtf8);
let misread = '';
for (const b of bytes) {
  misread += String.fromCharCode(b);
}
console.log('  Misread as Latin-1 string: "' + misread + '"');

// Step 2: Re-encode as UTF-8
const reencoded = Buffer.from(misread, 'utf8');
console.log('  Re-encoded as UTF-8: ' + reencoded.toString('hex').toUpperCase());
console.log('  Visual: "' + reencoded.toString('utf8') + '"');

console.log('\n---\n');

// What about other common emojis in the file?
console.log('Checking for emoji patterns in file...');

// Common emojis that might be used: 📋, 📊, 📈, 🥐, 🎂, 🎉, ☕, 📦, etc.
const emojis = ['📋', '📊', '📈', '🥐', '🎂', '🎉', '☕', '📦', '👥', '💰', '❤️', '👨‍🍳'];

for (const em of emojis) {
  const utf8 = Buffer.from(em, 'utf8');
  
  // Misread as Latin-1
  let chars = '';
  for (const b of utf8) {
    chars += String.fromCharCode(b);
  }
  
  // Re-encode
  const mojibake = Buffer.from(chars, 'utf8');
  
  console.log(`\n${em}: ${utf8.toString('hex').toUpperCase()}`);
  console.log(`  → "${chars}"`);
  console.log(`  → ${mojibake.toString('hex').toUpperCase()}`);
  console.log(`  → "${mojibake.toString('utf8')}"`);
}

console.log('\n---\n');

// Now search for these patterns in the file
console.log('Searching file for mojibake patterns...\n');

// Look for the "Administrativo" section
let idx = admin.indexOf(Buffer.from('Panel'));
if (idx >= 0) {
  console.log(`Found "Panel" at offset ${idx}`);
  
  // Show 20 bytes before
  let before = admin.slice(Math.max(0, idx - 30), idx);
  console.log(`Before: ${before.toString('hex')} "${before.toString('utf8')}"`);
  
  // Show "Panel" and 20 after
  let after = admin.slice(idx, Math.min(admin.length, idx + 30));
  console.log(`After: ${after.toString('hex')} "${after.toString('utf8')}"`);
}

console.log('\n---\n');

// The actual bytes found are: C3 B0 C5 B8 E2 80 9C C5 A0
// Which decode as: ðŸ"Š
//
// Let me check what the ORIGINAL should be:
// If we have: C3 B0 (ð)
// And we treat ð as a "mojibake" recovery...
// Then ð came from 0xF0 being encoded as UTF-8
// So the original 0xF0 should be... what?
// 0xF0 is start of 4-byte UTF-8 emoji!

console.log('Analyzing C3 B0 (ð):');
const test1 = Buffer.from([0xC3, 0xB0]);
console.log('  Bytes: ' + test1.toString('hex'));
console.log('  As UTF-8: "' + test1.toString('utf8') + '"');
console.log('  Char code: U+' + test1.toString('utf8').charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'));

// If ð (U+00F0 = 0xF0 in Latin-1) came from UTF-8 bytes [0xF0, ...]
// Then 0xF0 0x9F 0x93 0x8B is emoji 📋

// So C3 B0 came from encoding U+00F0, which came from misreading 0xF0
// So the ORIGINAL bytes should start with 0xF0 if we reverse it!

console.log('\nManual recovery of C3 B0:');
console.log('1. C3 B0 is UTF-8 for U+00F0');
const char1 = test1.toString('utf8').charCodeAt(0);
console.log('2. U+' + char1.toString(16).toUpperCase().padStart(4, '0') + ' = ð = Latin-1 byte 0x' + char1.toString(16).toUpperCase());
console.log('3. So original byte was 0x' + char1.toString(16).toUpperCase());
console.log('4. 0xF0 starts a 4-byte UTF-8 emoji sequence!');

console.log('\nFor sequence C3 B0 C5 B8 C2 93 C2 8A:');
const testSeq = Buffer.from([0xC3, 0xB0, 0xC5, 0xB8, 0xC2, 0x93, 0xC2, 0x8A]);
const seqStr = testSeq.toString('utf8');
console.log('1. UTF-8 bytes: ' + testSeq.toString('hex'));
console.log('2. Decoded: "' + seqStr + '"');
console.log('3. Recover bytes from chars:');
const recovered = [];
for (const ch of seqStr) {
  recovered.push(ch.charCodeAt(0));
}
console.log('   ' + recovered.map(b => '0x' + b.toString(16).toUpperCase()).join(', '));
const recoveredBuf = Buffer.from(recovered);
console.log('   Bytes: ' + recoveredBuf.toString('hex'));
console.log('4. Decode as UTF-8: "' + recoveredBuf.toString('utf8') + '"');
