#!/usr/bin/env node
/**
 * Trace through the mojibake transformation step-by-step
 */

const fs = require('fs');

console.log('=== MOJIBAKE TRACE ===\n');

// SCENARIO: Original emoji 📊 got corrupted to ðŸ"Š
// 
// Step-by-step what SHOULD have happened:
//
// 1. Source file: HTML with emoji 📊 (U+1F4CA)
// 2. UTF-8 bytes for 📊: F0 9F 93 8A
// 3. Correct UTF-8 storage: F0 9F 93 8A
//
// But the file has C3 B0 C5 B8 C2 93 C2 8A instead.
// Why?
//
// Hypothesis: UTF-8 bytes were treated as Latin-1 text, then re-encoded.
//
// Step 1: Original emoji in UTF-8: F0 9F 93 8A
// Step 2: These bytes are MISTAKENLY interpreted as UTF-8... but wait, 
//         they ARE UTF-8! So this doesn't make sense unless...
//
// Alternative hypothesis: The bytes were read correctly as UTF-8,
// producing the string "ðŸ"Š". But this should be proper UTF-8.
//
// Let me check: is C3 B0 C5 B8 valid UTF-8?

console.log('Bytes in file: C3 B0 C5 B8');
const fileBytes = Buffer.from([0xC3, 0xB0, 0xC5, 0xB8]);
console.log('Interpreted as UTF-8: "' + fileBytes.toString('utf8') + '"');
console.log('Char codes: ' + Array.from(fileBytes.toString('utf8')).map((c, i) => 
  `'${c}' = U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`
).join(', '));

// So yes, C3 B0 = U+00F0 (ð) and C5 B8 = U+0178 (Ÿ)
// These are VALID UTF-8 sequences, but they're not the emoji.

console.log('\n--- Reverse engineering ---\n');

// To get the ORIGINAL bytes, I need to go backwards.
// If C3 B0 C5 B8 came from misinterpreting UTF-8 as Latin-1:
//
// Step 1: C3 B0 decoded as UTF-8 → U+00F0 (ð)
// Step 2: If ð = 0xF0 in Latin-1, then the original might have been... 0xF0
// Step 3: 0xF0 in UTF-8 is invalid! But 0xF0 is the start of 4-byte UTF-8.
//         If we have F0 9F 93 8A, that's emoji.
// Step 4: If F0 9F 93 8A were MISREAD as Latin-1: ðŸ"Š (approx)
// Step 5: Then stored as UTF-8 of each: ð→C3B0, Ÿ→C5B8, etc.

console.log('Recovery logic:');
console.log('1. Current corrupted bytes: C3 B0 C5 B8');
console.log('2. Decode as UTF-8: "ðŸ" (U+00F0, U+0178)');
console.log('3. Each char is < U+0100, so valid Latin-1 byte:');
console.log('   - ð (U+00F0) → Latin-1 byte 0xF0');
console.log('   - Ÿ (U+0178) → NOT IN LATIN-1! U+0178 is > 0xFF');

console.log('\nWait, U+0178 is NOT in Latin-1 range...');
console.log('U+0178 (Ÿ) is in Latin Extended-A, not Latin-1.');
console.log('Latin-1 only goes from U+0000 to U+00FF.');

// But the file clearly has C5 B8 which decodes to U+0178.
// Let me check: is there a Windows-1252 or other encoding involved?

console.log('\n--- Windows-1252 check ---\n');

const WINDOWS1252_CHARS = {
  0x80: 0x20AC, // €
  0x81: 0x0081, // (control)
  0x82: 0x201A, // ‚
  0x83: 0x0192, // ƒ
  0x84: 0x201E, // „
  0x85: 0x2026, // …
  0x86: 0x2020, // †
  0x87: 0x2021, // ‡
  0x88: 0x02C6, // ˆ
  0x89: 0x2030, // ‰
  0x8A: 0x0160, // Š ← THIS ONE!
  0x8B: 0x2039, // ‹
  0x8C: 0x0152, // Œ
  // ... and more
};

console.log('In Windows-1252:');
console.log('  0x8A → U+0160 (Š) - YES!');
console.log('\nBut file has C5 A0, not C2 8A');
console.log('Let\'s check: C5 A0 as UTF-8...');
const testBytes = Buffer.from([0xC5, 0xA0]);
console.log('  C5 A0 → U+' + testBytes.toString('utf8').charCodeAt(0).toString(16).toUpperCase());
console.log('  That\'s Š');

// So C5 A0 = U+0160 = Š. This could come from:
// - If we had Windows-1252 byte 0x8A (Š), and misread as UTF-8... no, 0x8A isn't valid UTF-8 start
// - If we had the emoji that contains 0x8A in its UTF-8, like F0 9F 93 8A (📊)

console.log('\n--- Emoji recovery hypothesis ---\n');

console.log('Emoji 📊 in UTF-8: F0 9F 93 8A');
console.log('Misread as Latin-1 (interpreting each byte as Latin-1 char):');
console.log('  F0 → ð (U+00F0)');
console.log('  9F → (control/undefined in Latin-1, but in Windows-1252: Ÿ? No, that\'s 0x9F=undefined)');

// Actually let me check Windows-1252 for 0x9F
console.log('\n  In Windows-1252: 0x9F → undefined (but some systems use Ÿ)');

// The issue is that 0x9F is ambiguous.
// Let me look at what SHOULD recover:

console.log('\n--- What actually exists in file ---\n');

// Let me re-read the context
const admin = fs.readFileSync('admin-dashboard-fragment.html');
const start = 275; // Near first mojibake
const context = admin.slice(start, start + 25);
console.log('Bytes around offset 279:');
console.log('  ' + context.toString('hex'));
console.log('  As UTF-8: "' + context.toString('utf8') + '"');

// Actually, let me try a DIFFERENT approach.
// What if the mojibake is:
// Original emoji bytes: F0 9F 93 8A
// Read as ISO-8859-1 String: "ðŸ"Š"
// But there's an issue: 0xF0 is NOT valid in Latin-1 as a START.
// 
// OH WAIT! I think I've been thinking about this wrong.
//
// What if:
// 1. File HAD emoji bytes F0 9F 93 8A (valid UTF-8)
// 2. Someone decoded it as UTF-8 correctly → "📊"
// 3. Then ACCIDENTALLY treated the UTF-8 bytes themselves as if they were Latin-1 text
// 4. So F0 9F 93 8A → read as if it were string of bytes [240, 159, 147, 138]
// 5. Then encoded each as UTF-8:
//    - 240 (0xF0) = U+00F0 = ð = UTF-8: C3 B0
//    - 159 (0x9F) = U+009F = ? = UTF-8: C2 9F
//    - 147 (0x93) = U+0093 = ? = UTF-8: C2 93
//    - 138 (0x8A) = U+008A = ? = UTF-8: C2 8A
// 6. Result: C3 B0 C2 9F C2 93 C2 8A

console.log('\n--- Alternative recovery logic ---\n');

console.log('If original emoji is F0 9F 93 8A and we see C3 B0 C2 9F C2 93 C2 8A:');
console.log('Then EACH BYTE was promoted to a full character and re-encoded!');
console.log('  F0 (byte 240) → U+00F0 → UTF-8: C3 B0');
console.log('  9F (byte 159) → U+009F → UTF-8: C2 9F');
console.log('  93 (byte 147) → U+0093 → UTF-8: C2 93');
console.log('  8A (byte 138) → U+008A → UTF-8: C2 8A');

console.log('\nBUT file has: C3 B0 C5 B8 E2 80 9C C5 A0');
console.log('NOT: C3 B0 C2 9F C2 93 C2 8A');

console.log('\nSo either:');
console.log('A) Different corruption mechanism');
console.log('B) My understanding of the file content is wrong');

console.log('\nLet me check what the file SHOULD contain...');

// Search for English/Spanish context
let context1 = admin.slice(270, 310);
console.log('\nContext 270-310:');
console.log('Bytes: ' + context1.toString('hex'));
console.log('UTF-8: "' + context1.toString('utf8') + '"');

// Extract "Panel Administrativo" and see what should be there
let idx = admin.indexOf(Buffer.from('Panel'));
if (idx >= 0) {
  console.log('\n"Panel" found at offset ' + idx);
  let before = admin.slice(Math.max(0, idx - 30), idx);
  console.log('20 bytes before "Panel":');
  console.log('  ' + before.toString('hex'));
  console.log('  ' + before.toString('utf8'));
}
