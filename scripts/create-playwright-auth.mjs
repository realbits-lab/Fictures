/**
 * Create Playwright-compatible authentication file from .auth/user.json
 * Extracts writer@fictures.xyz profile data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const authFilePath = path.join(__dirname, '../.auth/user.json');
const outputPath = path.join(__dirname, '../.auth/writer-playwright.json');

console.log('📖 Reading .auth/user.json...');
const authData = JSON.parse(fs.readFileSync(authFilePath, 'utf-8'));

console.log('🔍 Extracting writer profile...');
const writerProfile = authData.profiles.writer;

if (!writerProfile) {
  console.error('❌ Writer profile not found in .auth/user.json');
  process.exit(1);
}

console.log('✅ Writer profile found:', writerProfile.email);
console.log('   User ID:', writerProfile.userId);
console.log('   Role:', writerProfile.role);

// Create Playwright-compatible storage state
const playwrightAuth = {
  cookies: writerProfile.cookies || [],
  origins: writerProfile.origins || []
};

console.log('💾 Writing Playwright auth file...');
fs.writeFileSync(outputPath, JSON.stringify(playwrightAuth, null, 2), 'utf-8');

console.log('✅ Created:', outputPath);
console.log('📊 Cookies:', playwrightAuth.cookies.length);
console.log('📊 Origins:', playwrightAuth.origins.length);

// Verify cookies
if (playwrightAuth.cookies.length === 0) {
  console.warn('⚠️  No cookies found - authentication may not work');
} else {
  console.log('🍪 Cookie names:', playwrightAuth.cookies.map(c => c.name).join(', '));
}

console.log('\n✨ Done! You can now run Playwright tests with writer authentication.');
