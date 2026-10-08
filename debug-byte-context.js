#!/usr/bin/env node

const fs = require('fs');

// I know from previous analysis that C3B0C5B8 appears at byte offset 279
const admin = fs.readFileSync('admin-dashboard-fragment.html');

console.log('File size:', admin.length, 'bytes');

// Find all occurrences of C3B0C5B8
const pattern = Buffer.from([0xC3, 0xB0, 0xC5, 0xB8]);
let offset = 0;
const occurrences = [];

while ((offset = admin.indexOf(pattern, offset)) !== -1) {
  occurrences.push(offset);
  offset += pattern.length;
}

console.log('Found C3B0C5B8 at byte offsets:', occurrences);

if (occurrences.length > 0) {
  const firstOffset = occurrences[0];
  
  // Get larger context around first occurrence
  const contextStart = Math.max(0, firstOffset - 30);
  const contextEnd = Math.min(admin.length, firstOffset + 50);
  const contextBytes = admin.slice(contextStart, contextEnd);
  
  console.log(`\nContext around offset ${firstOffset}:`);
  console.log('Hex:', contextBytes.toString('hex').toUpperCase());
  console.log('UTF-8:', JSON.stringify(contextBytes.toString('utf8')));
  
  // Convert to string and check string index
  const adminString = admin.toString('utf8');
  
  // Calculate approximate string index for byte offset
  const beforeBytes = admin.slice(0, firstOffset);
  const beforeString = beforeBytes.toString('utf8');
  const stringIndex = beforeString.length;
  
  console.log(`\nByte offset ${firstOffset} ≈ string index ${stringIndex}`);
  
  // Get context in string
  const strStart = Math.max(0, stringIndex - 10);
  const strEnd = Math.min(adminString.length, stringIndex + 20);
  const strContext = adminString.substring(strStart, strEnd);
  
  console.log('String context:', JSON.stringify(strContext));
  
  // Check the exact 4 characters starting at this position
  if (stringIndex + 4 <= adminString.length) {
    const fourChars = adminString.substring(stringIndex, stringIndex + 4);
    console.log('4 chars at position:', JSON.stringify(fourChars));
    
    for (let i = 0; i < fourChars.length; i++) {
      const char = fourChars[i];
      const cp = char.charCodeAt(0);
      console.log(`  [${i}] "${char}" = U+${cp.toString(16).toUpperCase().padStart(4, '0')}`);
    }
  }
}