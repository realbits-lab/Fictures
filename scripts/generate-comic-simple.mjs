#!/usr/bin/env node

/**
 * Simple Comic Panel Generation Script
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sceneId = process.argv[2];
if (!sceneId) {
  console.error('❌ Usage: node scripts/generate-comic-simple.mjs SCENE_ID');
  process.exit(1);
}

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

async function generatePanels(sceneId, sessionToken) {
  const url = `http://localhost:3000/api/scenes/${sceneId}/comic/generate`;

  console.log(`📡 Calling API: ${url}`);
  console.log('⏳ This may take 2-5 minutes...\n');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Cookie': `authjs.session-token=${sessionToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      regenerate: true
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function main() {
  try {
    console.log('🔐 Loading authentication...');
    const sessionToken = await loadAuth();

    console.log(`🎨 Generating comic panels for scene: ${sceneId}\n`);
    const result = await generatePanels(sceneId, sessionToken);

    console.log('\n✅ Comic panels generated successfully!');
    console.log(`📊 Panels: ${result.panels?.length || 0}`);

    if (result.panels && result.panels.length > 0) {
      console.log('\n📋 Panel Details:');
      result.panels.forEach((panel, i) => {
        console.log(`\n  Panel ${i + 1}:`);
        console.log(`    - Dialogue: ${panel.dialogue || 'None'}`);
        console.log(`    - SFX: ${panel.sfx || 'None'}`);
        console.log(`    - Image: ${panel.imageUrl ? '✓' : '✗'}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
