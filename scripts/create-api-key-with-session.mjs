#!/usr/bin/env node

/**
 * Create an API key using session cookies from .auth/user.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');

async function createApiKey() {
  console.log('🚀 Creating API key using session authentication...\n');

  // Load auth file
  if (!fs.existsSync(AUTH_FILE)) {
    throw new Error(`Authentication file not found: ${AUTH_FILE}\nPlease run: dotenv --file .env.local run node scripts/capture-auth-manual.mjs`);
  }

  const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));

  // Extract cookies
  if (!authData.cookies || authData.cookies.length === 0) {
    throw new Error('No cookies found in auth file');
  }

  // Build cookie header
  const cookieHeader = authData.cookies
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  console.log('🔑 Using session cookies from .auth/user.json\n');

  // Create API key via API
  const response = await fetch(`${BASE_URL}/api/settings/api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieHeader,
    },
    body: JSON.stringify({
      name: 'Development API Key',
      scopes: ['stories:read', 'stories:write'],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create API key: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const data = await response.json();

  console.log('✅ API Key Created Successfully!\n');
  console.log('='.repeat(80));
  console.log(`🔑 API Key: ${data.apiKey.key}\n`);
  console.log('📝 Details:');
  console.log(`   Name: ${data.apiKey.name}`);
  console.log(`   Scopes: ${data.apiKey.scopes.join(', ')}`);
  console.log(`   Created: ${data.apiKey.createdAt}`);
  console.log('='.repeat(80));

  // Save to .auth/user.json
  console.log('\n💾 Saving API key to .auth/user.json...');
  authData.apiKey = data.apiKey.key;
  authData.apiKeyId = data.apiKey.id;
  authData.apiKeyCreatedAt = data.apiKey.createdAt;
  authData.apiKeyScopes = data.apiKey.scopes;

  fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2));
  console.log('✅ Saved to .auth/user.json');

  // Save to .env.local
  console.log('\n💾 Adding to .env.local...');
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Remove existing TEST_API_KEY if present
  envContent = envContent.split('\n').filter(line => !line.startsWith('TEST_API_KEY=')).join('\n');

  // Add new key
  if (envContent && !envContent.endsWith('\n')) {
    envContent += '\n';
  }
  envContent += `\n# API Key for testing (generated ${new Date().toISOString()})\n`;
  envContent += `TEST_API_KEY=${data.apiKey.key}\n`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Added to .env.local as TEST_API_KEY\n');

  console.log('⚠️  ' + data.warning);
  console.log('\n🎯 You can now use this key for API calls:');
  console.log(`   dotenv --file .env.local run node scripts/generate-story-with-sse.mjs\n`);

  return data.apiKey.key;
}

async function main() {
  try {
    await createApiKey();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
