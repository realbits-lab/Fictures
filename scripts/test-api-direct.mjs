#!/usr/bin/env node

import { EventSource } from 'eventsource';

const API_KEY = 'fic_Sh7a4nYARGmJ_Sh7a4nYARGmJ5N2NAHUvlQ7QnQsqFsYPr5VbWf6pVaU';
const API_URL = 'http://localhost:3000/api/stories/generate-hns';

console.log('🧪 Testing API endpoint directly...\n');

// Test 1: Simple POST to check if endpoint responds
console.log('Test 1: POST request to generate-hns');
try {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      prompt: 'A very short test story about a cat',
      language: 'English',
    }),
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let receivedData = false;
    const timeout = setTimeout(() => {
      if (!receivedData) {
        console.log('\n⚠️  No data received within 30 seconds');
        process.exit(1);
      }
    }, 30000);

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        clearTimeout(timeout);
        console.log('\n✅ Stream completed');
        break;
      }

      receivedData = true;
      const chunk = decoder.decode(value, { stream: true });
      console.log('Received chunk:', chunk);
    }
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
