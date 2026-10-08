#!/usr/bin/env node
/**
 * DEBUG: Understand the actual mojibake pattern
 */

const fs = require('fs');

// Read the admin file
const adminBuffer = fs.readFileSync('admin-dashboard-fragment.html');

// Find the first instance of mojibake (ðŸ"Š which is C3 B0 C5 B8 ...)
// Let's look at actual byte patterns

console.log('Looking for common mojibake patterns...\n');

// Search for ðŸ pattern (C3 B0 - this is UTF-8 for á when misinterpreted)
// But ðŸ is actually emoji mojibake: F0 9F (UTF-8 for emoji) read as Latin-1 and re-encoded as UTF-8

let matches = 0;
for (let i = 0; i < adminBuffer.length - 5; i++) {
  const byte1 = adminBuffer[i];
  const byte2 = adminBuffer[i + 1];
  
  // Look for C3 B0 pattern (ð)
  if (byte1 === 0xC3 && byte2 === 0xB0) {
    // This is UTF-8 for "ð" (U+00F0), but it's MOJIBAKE
    // Original bytes: F0 9F (start of emoji in UTF-8)
    // Misinterpreted as Latin-1: F0 → ð, 9F → (undefined), then re-encoded
    
    // Actually, let's check: is this legitimate ð or is it mojibake?
    // Real ð = U+00F0, UTF-8 = C3 B0
    // Mojibake ð = original UTF-8 F0 9F misread as Latin-1 F0 9F → ð (U+00F0)
    
    // They're the same bytes! So we need context.
    
    console.log(`\n[${i}] Found C3 B0 (ð)`);
    
    // Look at surroundings
    const context = adminBuffer.slice(Math.max(0, i - 5), Math.min(adminBuffer.length, i + 20));
    console.log(`  Context bytes: ${context.toString('hex')}`);
    console.log(`  Context string: "${context.toString('utf8')}"`);
    
    matches++;
    if (matches >= 5) break;
  }
}

console.log('\n---\n');

// Try to find the actual emoji patterns
// Emojis in UTF-8 start with F0 9F
// When misread as Latin-1 and re-encoded:
// F0 → 0xF0 (ð in Latin-1) → UTF-8: C3 B0
// 9F → 0x9F (control char in Latin-1) → UTF-8: C2 9F

// But in the file we see: ðŸ"Š which is C3 B0 C5 B8 ...
// So let's check C5 B8

console.log('Analyzing C3 B0 C5 B8 pattern (ðŸ):');
const pattern = Buffer.from([0xC3, 0xB0, 0xC5, 0xB8]);
console.log(`Pattern: ${pattern.toString('hex')}`);
console.log(`As UTF-8 string: "${pattern.toString('utf8')}"`);

// What does this represent?
// C3 B0 = ð (U+00F0)
// C5 B8 = Ÿ (U+0178) - but wait, C5 B8 is UTF-8 for U+0178

// Let's reverse-engineer: if we interpret C3 B0 C5 B8 as bytes that were misread from Latin-1...
// C3 → 0xC3 (Ã in Latin-1)
// B0 → 0xB0 (° in Latin-1)
// C5 → 0xC5 (Å in Latin-1)
// B8 → 0xB8 (¸ in Latin-1)

// Then if we re-encode as UTF-8:
// Ã (U+00C3) → C3 83
// ° (U+00B0) → C2 B0
// Å (U+00C5) → C3 85
// ¸ (U+00B8) → C2 B8

console.log('\nReverse engineering C3 B0 C5 B8:');
console.log('If misread from Latin-1: C3 B0 C5 B8');
console.log('  C3 → U+00C3 (Ã)');
console.log('  B0 → U+00B0 (°)');
console.log('  C5 → U+00C5 (Å)');
console.log('  B8 → U+00B8 (¸)');

// WAIT. Let me reconsider the algorithm.
// 
// Step 1: File has UTF-8 bytes representing EMOJI
// Original emoji bytes in UTF-8: F0 9F 93 8A (for 📊)
//
// But they got corrupted. Let's trace through what MIGHT have happened:
// 
// Theory 1: UTF-8 bytes read as Latin-1, then re-encoded as UTF-8
// F0 (byte) → interpreted as Latin-1 char U+00F0 (ð) → UTF-8: C3 B0 ✗ NO! C3 B0 is U+00F0
// 
// Wait, I'm confusing myself. Let's be very careful:
// 
// U+00F0 = ð (LATIN SMALL LETTER ETH)
// UTF-8 encoding of U+00F0 = C3 B0
// 
// So C3 B0 is the CORRECT UTF-8 for ð.
// 
// But ðŸ (C3 B0 C5 B8) doesn't make sense. Let me check what the actual emoji should be.

console.log('\n---\n');
console.log('Let me check what SHOULD be in the file by looking at the pattern:');
console.log('File shows: ðŸ"Š');
console.log('That\'s: C3 B0 (ð) + C5 B8 (Ÿ) + ?');

// Actually, I think the mojibake is:
// Original: 📊 (U+1F4CA, emoji)
// UTF-8: F0 9F 93 8A
// 
// These bytes F0 9F 93 8A got interpreted as if they were encoded in one encoding,
// but actually they're in UTF-8. Let me see what happens if I decode F0 9F 93 8A
// as if it were ISO-8859-1:

const emojiBytes = Buffer.from([0xF0, 0x9F, 0x93, 0x8A]);
console.log('\nEmoji 📊 bytes in UTF-8: F0 9F 93 8A');
console.log('If interpreted as Latin-1:');
for (let i = 0; i < emojiBytes.length; i++) {
  const byte = emojiBytes[i];
  const char = String.fromCharCode(byte);
  console.log(`  ${byte.toString(16).toUpperCase().padStart(2, '0')} → U+${byte.toString(16).toUpperCase().padStart(4, '0')} (${char})`);
}

const misinterpreted = emojiBytes.toString('latin1');
console.log(`\nMisinterpreted string: "${misinterpreted}"`);

// Now if we re-encode this back to UTF-8:
const reencoded = Buffer.from(misinterpreted, 'utf8');
console.log(`Re-encoded bytes: ${reencoded.toString('hex').toUpperCase()}`);
console.log(`Re-encoded string: "${reencoded.toString('utf8')}"`);

// So the mojibake pattern should be:
// Original UTF-8 emoji bytes (F0 9F 93 8A)
// → Misinterpreted as Latin-1 ("ðŸ"Š")
// → Re-encoded to UTF-8 as C3 B0 C5 B8 C2 93 C2 8A

console.log('\n---\n');
console.log('Expected mojibake for 📊: C3 B0 C5 B8 C2 93 C2 8A');

// Let's verify:
const mojibakeBytes = Buffer.from([0xC3, 0xB0, 0xC5, 0xB8, 0xC2, 0x93, 0xC2, 0x8A]);
console.log(`Mojibake bytes: ${mojibakeBytes.toString('hex').toUpperCase()}`);
console.log(`Mojibake string: "${mojibakeBytes.toString('utf8')}"`);

// To recover, we need to:
// 1. Take current bytes: C3 B0 C5 B8 C2 93 C2 8A
// 2. Decode as UTF-8: ðŸ"Š
// 3. Interpret each char as if it were Latin-1: ð=0xF0, Ÿ=0x9F, "=0x93, Š=0x8A
// 4. Get original bytes: F0 9F 93 8A
// 5. Decode as UTF-8: 📊

console.log('\n---\nRecovery process:');
const currentMojibake = Buffer.from([0xC3, 0xB0, 0xC5, 0xB8, 0xC2, 0x93, 0xC2, 0x8A]);
const currentString = currentMojibake.toString('utf8');
console.log(`1. Current mojibake bytes: ${currentMojibake.toString('hex').toUpperCase()}`);
console.log(`2. Decode as UTF-8: "${currentString}"`);

// Now interpret each character as Latin-1 code point and get the byte
const recoveredBytes = [];
for (const char of currentString) {
  const code = char.charCodeAt(0);
  recoveredBytes.push(code & 0xFF);
}
console.log(`3. Char codes: ${recoveredBytes.map(b => '0x' + b.toString(16).toUpperCase()).join(', ')}`);

const recovered = Buffer.from(recoveredBytes);
console.log(`4. Recovered bytes: ${recovered.toString('hex').toUpperCase()}`);
console.log(`5. Recovered as UTF-8: "${recovered.toString('utf8')}"`);
