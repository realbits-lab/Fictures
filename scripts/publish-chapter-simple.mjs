#!/usr/bin/env node

/**
 * Simple Publish Chapter Script
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load authentication
async function loadAuth() {
  const authPath = path.join(__dirname, '../.auth/user.json');
  const authData = await fs.readFile(authPath, 'utf-8');
  const auth = JSON.parse(authData);

  const sessionCookie = auth.cookies?.find(c =>
    c.name === 'authjs.session-token' || c.name === '__Secure-authjs.session-token'
  );

  if (!sessionCookie) {
    throw new Error('No session cookie found');
  }

  return sessionCookie.value;
}

// Publish chapter
async function publishChapter(chapterId, sessionToken) {
  const url = `http://localhost:3000/studio/api/chapters/${chapterId}/publish`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Cookie': `authjs.session-token=${sessionToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to publish chapter: ${error}`);
  }

  return await response.json();
}

// Main
async function main() {
  const chapterId = process.argv[2];

  if (!chapterId) {
    console.error('❌ Usage: node scripts/publish-chapter-simple.mjs CHAPTER_ID');
    process.exit(1);
  }

  try {
    console.log('🔐 Loading authentication...');
    const sessionToken = await loadAuth();

    console.log(`📤 Publishing chapter: ${chapterId}...`);
    const result = await publishChapter(chapterId, sessionToken);

    console.log('✅ Chapter published successfully!');
    if (result.chapter) {
      console.log(`📖 Chapter: ${result.chapter.title || 'Untitled'}`);
      console.log(`📊 Status: ${result.chapter.status}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
