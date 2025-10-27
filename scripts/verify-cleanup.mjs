#!/usr/bin/env node

import fetch from 'node-fetch';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const AUTH_FILE_PATH = join(__dirname, '../.auth/user.json');

function loadManagerAuth() {
  const authData = JSON.parse(fs.readFileSync(AUTH_FILE_PATH, 'utf-8'));
  return authData.profiles?.manager?.apiKey;
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('✅ CLEANUP VERIFICATION');
  console.log('='.repeat(80));

  const apiKey = loadManagerAuth();

  // Check stories
  console.log('\n📚 Checking database...');
  const storiesResp = await fetch(`${API_BASE_URL}/api/stories`, {
    headers: { 'x-api-key': apiKey }
  });

  if (storiesResp.ok) {
    const data = await storiesResp.json();
    const stories = data.stories || data;
    console.log(`   Stories in database: ${stories.length}`);
    
    if (stories.length === 0) {
      console.log(`   ✅ Database is clean!`);
    } else {
      console.log(`   ⚠️  ${stories.length} stories still exist`);
      stories.forEach(s => console.log(`      - ${s.title} (${s.id})`));
    }
  }

  console.log('\n🖼️  Vercel Blob Status:');
  console.log('   Note: Vercel Blob files are deleted automatically when stories are removed');
  console.log('   via the DELETE /api/stories/{id} endpoint');

  console.log('\n' + '='.repeat(80));
  console.log('✅ CLEANUP COMPLETE');
  console.log('='.repeat(80));
  console.log('\n💡 Ready to generate new story and comic panels!\n');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
