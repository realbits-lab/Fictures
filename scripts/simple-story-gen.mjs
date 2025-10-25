#!/usr/bin/env node

import { readFileSync } from 'fs';

// Load writer API key
const userData = JSON.parse(readFileSync('.auth/user.json', 'utf8'));
const API_KEY = userData.profiles.writer.apiKey;

console.log('🧪 Simple Story Generation Test\n');
console.log('API Key:', API_KEY.substring(0, 20) + '...');
console.log('');

const response = await fetch('http://localhost:3000/api/stories/generate-hns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },
  body: JSON.stringify({
    prompt: 'A very short test story about a robot',
    language: 'English',
  }),
});

console.log('Response status:', response.status);
console.log('Response type:', response.headers.get('content-type'));
console.log('');

if (!response.ok) {
  const error = await response.text();
  console.error('❌ Error:', error);
  process.exit(1);
}

const reader = response.body.getReader();
const decoder = new TextDecoder();

console.log('📡 Reading stream...\n');

let chunkCount = 0;
while (true) {
  const { done, value } = await reader.read();
  if (done) {
    console.log('\n✅ Stream complete');
    break;
  }

  const chunk = decoder.decode(value);
  chunkCount++;

  console.log(`\n--- Chunk ${chunkCount} ---`);
  console.log(chunk.substring(0, 500)); // Show first 500 chars

  if (chunkCount > 20) {
    console.log('\n⏭️  Stopping after 20 chunks for testing');
    break;
  }
}
