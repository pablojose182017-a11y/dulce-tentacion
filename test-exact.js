#!/usr/bin/env node

const fs = require('fs');

// Extract exact mojibake sequence from file
const admin = fs.readFileSync('admin-dashboard-fragment.html');
const idx = admin.indexOf(Buffer.from([0xC3, 0xB0, 0xC5, 0xB8]));

if (idx >= 0) {
  // Get exactly 4 characters: ðŸ"Š (needs 10 bytes)
  const bytes = admin.slice(idx, idx + 10); // C3B0 C5B8 E2809C C5A0
  const exactString = bytes.toString('utf8');
  
  console.log('Exact bytes:', bytes.toString('hex').toUpperCase());
  console.log('Exact string:', JSON.stringify(exactString));
  console.log('Characters:');
  
  for (let i = 0; i < exactString.length; i++) {
    const char = exactString[i];
    const cp = char.charCodeAt(0);
    console.log(`  [${i}] "${char}" = U+${cp.toString(16).toUpperCase().padStart(4, '0')}`);
  }
  
  // Test Windows-1252 reverse mapping
  const UNICODE_TO_WIN1252_BYTE = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
    0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
    0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
    0x017E: 0x9E, 0x0178: 0x9F
  };
  
  console.log('\\nReverse mapping:');
  const recoveredBytes = [];
  
  for (let i = 0; i < exactString.length; i++) {
    const char = exactString[i];
    const cp = char.charCodeAt(0);
    
    let byte;
    if (cp <= 0xFF) {
      byte = cp; // Latin-1 direct
    } else if (UNICODE_TO_WIN1252_BYTE[cp] !== undefined) {
      byte = UNICODE_TO_WIN1252_BYTE[cp]; // Windows-1252 special
    } else {
      byte = null;
    }
    
    console.log(`  U+${cp.toString(16).toUpperCase().padStart(4, '0')} → ${byte ? '0x' + byte.toString(16).toUpperCase() : 'NULL'}`);
    if (byte !== null) recoveredBytes.push(byte);
  }
  
  if (recoveredBytes.length === exactString.length) {
    const recovered = Buffer.from(recoveredBytes);
    console.log('\\nRecovered bytes:', recovered.toString('hex').toUpperCase());
    
    try {
      const recoveredString = recovered.toString('utf8');
      console.log('Recovered UTF-8:', JSON.stringify(recoveredString));
      console.log('Is valid UTF-8:', !recoveredString.includes('\\ufffd'));
    } catch (e) {
      console.log('Failed to decode as UTF-8:', e.message);
    }
  }
}