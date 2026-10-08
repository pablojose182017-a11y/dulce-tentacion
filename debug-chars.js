#!/usr/bin/env node

const fs = require('fs');

// Get the exact sequence from the file
const admin = fs.readFileSync('admin-dashboard-fragment.html');
const idx = admin.indexOf(Buffer.from([0xC3, 0xB0, 0xC5, 0xB8]));

if (idx >= 0) {
  // Get the context: ðŸ"Š
  const context = admin.slice(idx, idx + 10);
  const contextStr = context.toString('utf8');
  
  console.log('Exact bytes from file:', context.toString('hex').toUpperCase());
  console.log('Decoded string:', JSON.stringify(contextStr));
  
  // Analyze each character
  for (let i = 0; i < contextStr.length; i++) {
    const char = contextStr[i];
    const cp = char.charCodeAt(0);
    console.log(`[${i}] "${char}" = U+${cp.toString(16).toUpperCase().padStart(4, '0')} = ${cp}`);
  }
}

// Also check the known pattern
const testString = 'ðŸ"Š';
console.log('\nTest string "ðŸ"Š":');
for (let i = 0; i < testString.length; i++) {
  const char = testString[i];
  const cp = char.charCodeAt(0);
  console.log(`[${i}] "${char}" = U+${cp.toString(16).toUpperCase().padStart(4, '0')} = ${cp}`);
}

// What should the bytes be?
console.log('\nTest bytes:', Buffer.from(testString, 'utf8').toString('hex').toUpperCase());