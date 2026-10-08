#!/usr/bin/env node
/**
 * Reverse engineer actual mojibake: What were the ORIGINAL bytes?
 */

const fs = require('fs');

console.log('=== REVERSE ENGINEERING ACTUAL MOJIBAKE ===\n');

const admin = fs.readFileSync('admin-dashboard-fragment.html');

// Get the exact pattern from the file: ">ðŸ"Š Panel"
// Bytes: 3e c3b0 c5b8 e2809c c5a0 20 50...

console.log('Pattern in file: ">ðŸ"Š Panel"');
console.log('As bytes:');
let idx = admin.indexOf(Buffer.from('Panel'));
if (idx >= 0) {
  let before = admin.slice(idx - 20, idx);
  console.log('  ' + before.toString('hex'));
  
  for (let i = 0; i < before.length; i++) {
    const b = before[i];
    if (b >= 32 && b <= 126) {
      process.stdout.write(`${String.fromCharCode(b)}`);
    }
  }
  console.log('');
}

console.log('\nWhat should be there: ">📋 Panel"');
const should = Buffer.from('>📋 Panel', 'utf8');
console.log('  Bytes: ' + should.toString('hex'));

const emoji = '📋';
const emojiBytes = Buffer.from(emoji, 'utf8');
console.log('\nEmoji 📋 UTF-8: ' + emojiBytes.toString('hex'));

// Now the question: how did F0 9F 93 8B become C3 B0 C5 B8?

// Hypothesis 1: Some OTHER encoding system
// What if the bytes went through: UTF-8 → UTF-16 → Latin-1?
// Or: Emoji bytes → decoded to Unicode → different encoding → back to UTF-8?

console.log('\n--- HYPOTHESIS: UTF-8 emoji → Decoded → Re-encoded with different codec ---\n');

// F0 9F 93 8B is UTF-8 for 📋 (U+1F4CB)
const codepoint = 0x1F4CB;
console.log('U+' + codepoint.toString(16).toUpperCase());

// If somehow this was converted to something else...
// Let's check HTML entities
console.log('\nHTML entities:');
console.log('  Decimal: &#' + codepoint + ';');
console.log('  Hex: &#x' + codepoint.toString(16) + ';');

// What if someone decoded as UTF-8, got the emoji character,
// then re-encoded with a DIFFERENT UTF-8 variant or codec?

console.log('\n--- HYPOTHESIS: Multiple round-trips ---\n');

// Maybe it's: UTF-8 emoji → displayed/decoded → back to UTF-8 of displayed chars →...

// Let me just try to figure out what bytes transformed to what:
console.log('Working backwards:');
console.log('1. We have in file: C3 B0 (ð in UTF-8)');
console.log('2. This is NOT standard mojibake from F0 9F...');

// Wait, maybe I have this wrong. Let me check:
// What if the ORIGINAL file had different emoji?

console.log('\n--- CHECKING ALL EMOJI AT OFFSET ---\n');

// Try different emojis
const tryEmojis = ['📋', '📊', '📈', '🎯', '💾', '🥐', '🍰', '🎂'];
for (const em of tryEmojis) {
  const utf8 = Buffer.from(em, 'utf8');
  console.log(`${em}: ${utf8.toString('hex')}`);
  
  // Would this look like ðŸ when corrupted?
  // If bytes B0 or similar...
  if (utf8[0] === 0xF0 && utf8[1] === 0x9F) {
    console.log(`  → Could become C3B0C29F...`);
  }
}

console.log('\n--- CHECK: Is C5 B8 a clue? ---\n');

// C5 B8 = U+0178 (Ÿ)
// Where does 0178 come from?

// Wait! What if... the bytes were: F0 9F (emoji start)
// Then later: XX B8 (some other byte with B8)
// And B8 was interpreted as... something?

// Let me check: F0 9F B8?
console.log('If original was F0 9F B8 XX:');
console.log('  Misread as Latin-1: ðŸ¸...');
console.log('  Re-encoded as UTF-8: C3B0 C29F C2B8...');
console.log('  But file has: C3B0 C5B8...');
console.log('  So that\'s not it either.');

console.log('\n--- ANOTHER THOUGHT: Character replacement ---\n');

// What if the mojibake ISN\'T from the bytes but from character substitution?
// Like: Some tool saw ðŸ and replaced 9F with something else?

// C5 B8 = Ÿ (U+0178)
// If we need Ÿ to appear... where does it come from?
// 
// OH! What if:
// 1. Original has emoji F0 9F 93 8B (📋)
// 2. Got corrupted to: ðŸ"‹ (mojibake)
// 3. But then someone's editor/browser tried to "fix" it by charset detection
// 4. And replaced some bytes thinking it's different encoding?

// "ð Ÿ" = C3 B0 + (space) + C5 B8
// But we have: C3 B0 + C5 B8 (no space!)

// Wait, C5 B8 is Ÿ, but Ÿ should not appear from F0 9F 93 8B normally.
// Unless...

console.log('What if emoji codes were reinterpreted as Windows-1252?');
console.log('F0 → in Windows-1252 is... 0xF0 not mapped, treated as Latin-1 ð');
console.log('9F → in Windows-1252 is... 0x9F = ');

// Checking Windows-1252 mapping table
const win1252 = {
  0x80: 'EUR', 0x82: 'sbquo', 0x83: 'fnof', 0x84: 'bdquo', 0x85: 'ellip',
  0x86: 'dagger', 0x87: 'ddagger', 0x88: 'circ', 0x89: 'permil',
  0x8A: 'Scaron', 0x8B: 'lsaquo', 0x8C: 'OElig',
  0x8E: 'Zcaron', 0x91: 'lsquo', 0x92: 'rsquo', 0x93: 'ldquo', 0x94: 'rdquo', 0x95: 'bull',
  0x96: 'ndash', 0x97: 'mdash', 0x98: 'tilde', 0x99: 'trade', 0x9A: 'scaron', 0x9B: 'rsaquo',
  0x9C: 'oelig', 0x9E: 'zcaron', 0x9F: 'Yuml'  // 0x9F = Ÿ
};

console.log('\nWindows-1252 special chars:');
console.log('0x9F → Ÿ (YES!)');

// SO: If bytes F0 9F were interpreted as Windows-1252:
// F0 → ð (U+00F0)
// 9F → Ÿ (U+0178) - NO WAIT, in Windows-1252 it maps to U+0178 which is...

// Actually, U+0178 is the result! And it's Ÿ!

console.log('\nWINDOWS-1252 THEORY:');
console.log('1. Original emoji bytes: F0 9F 93 8B (📋)');
console.log('2. Misinterpreted as Windows-1252 chars:');
console.log('   F0 → U+00F0 (ð) - normal Latin-1');
console.log('   9F → U+0178 (Ÿ) - Windows-1252 special!');
console.log('3. ð (U+00F0) → UTF-8: C3 B0');
console.log('4. Ÿ (U+0178) → UTF-8: C5 B8');

console.log('\nSo we have: C3 B0 C5 B8 ...');
console.log('But file has the same! So hypothesis confirmed!');
console.log('This suggests WINDOWS-1252 encoding was used,not ISO-8859-1!');

console.log('\n--- RECOVERY PROCESS ---\n');

console.log('To recover:');
console.log('1. Current corrupted: C3 B0 C5 B8 E2 80 9C C5 A0 (ðŸ"Š)');
console.log('2. Decode as UTF-8 → ðŸ"Š');
console.log('3. Extract char codes → [0xF0, 0x178, 0x93, 0xA0]');
console.log('4. For 0x178, need to find Windows-1252 equivalent:');
console.log('   U+0178 in Windows-1252 = byte 0x9F');
console.log('5. Recovered bytes: [0xF0, 0x9F, 0x93, ...]');

// But wait, how do we know to use Windows-1252?
// The issue is: both ð and Ÿ are in Latin-1 too!
// ð = U+00F0 in Latin-1
// But Ÿ = U+0178 which is NOT in Latin-1!

console.log('\n KEY INSIGHT:');
console.log('Ÿ (U+0178) is NOT in ISO-8859-1 range (>U+00FF)');
console.log('But it IS in Windows-1252');
console.log('So if we see U+0178, it MUST have come from Windows-1252!');
