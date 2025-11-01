#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

console.log('🔐 Capturing Authentication for writer@fictures.xyz');
console.log('================================================\n');

const authFilePath = path.join(process.cwd(), '.auth', 'user.json');
const writerEmail = 'writer@fictures.xyz';
const writerPassword = 'A<>4y=jC$^*Q2!kxzQG?';

// Ensure .auth directory exists
const authDir = path.dirname(authFilePath);
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

const browser = await chromium.launch({
  headless: false,
  devtools: false
});

const context = await browser.newContext();
const page = await context.newPage();

try {
  console.log('🌐 Navigating to login page...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

  console.log('📧 Filling in email...');
  await page.fill('input[type="email"]', writerEmail);

  console.log('🔑 Filling in password...');
  await page.fill('input[type="password"]', writerPassword);

  console.log('🖱️  Clicking sign in button...');
  await page.click('button[type="submit"]');

  console.log('⏳ Waiting for navigation...');
  // Wait for any successful navigation away from /login
  await page.waitForFunction(() => {
    return !window.location.pathname.includes('/login');
  }, { timeout: 10000 });

  console.log('✅ Successfully logged in!');
  console.log('Current URL:', page.url());

  // Get the storage state
  const storageState = await context.storageState();

  // Read existing auth file
  let authData = { profiles: {}, defaultProfile: 'manager' };
  if (fs.existsSync(authFilePath)) {
    authData = JSON.parse(fs.readFileSync(authFilePath, 'utf-8'));
  }

  // Update writer profile
  authData.profiles.writer = {
    userId: authData.profiles.writer?.userId || 'usr_b440290b0aac4f899c6cfe79',
    email: writerEmail,
    password: writerPassword,
    name: 'Writer User',
    username: 'writer',
    role: 'writer',
    apiKey: authData.profiles.writer?.apiKey || '',
    apiKeyId: authData.profiles.writer?.apiKeyId || '',
    apiKeyCreatedAt: authData.profiles.writer?.apiKeyCreatedAt || new Date().toISOString(),
    apiKeyScopes: [
      'stories:read',
      'stories:write',
      'chapters:read',
      'chapters:write',
      'analytics:read',
      'ai:use',
      'community:read',
      'community:write',
      'settings:read'
    ],
    cookies: storageState.cookies,
    origins: storageState.origins
  };

  // Save updated auth data
  fs.writeFileSync(authFilePath, JSON.stringify(authData, null, 2));

  console.log('\n💾 Authentication data saved to .auth/user.json');
  console.log('📊 Captured data:');
  console.log(`   - Cookies: ${storageState.cookies.length} items`);
  console.log(`   - Origins: ${storageState.origins.length} items`);
  console.log(`   - Email: ${writerEmail}`);

  // Test navigation to studio edit page
  console.log('\n🧪 Testing navigation to /studio...');
  await page.goto('http://localhost:3000/studio', { waitUntil: 'networkidle' });

  const currentUrl = page.url();
  if (currentUrl.includes('/studio')) {
    console.log('✅ Successfully accessed studio page!');
  } else {
    console.log('❌ Failed to access studio page - redirected to:', currentUrl);
  }

  console.log('\n🎉 Authentication capture complete!');
  console.log('\nClosing browser in 3 seconds...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
  
  console.log('✅ Done!');
  process.exit(0);

} catch (error) {
  console.error('\n❌ Error:', error.message);
  await page.screenshot({ path: 'logs/auth-capture-error.png', fullPage: true });
  console.log('📸 Error screenshot saved to logs/auth-capture-error.png');
  await browser.close();
  process.exit(1);
}
