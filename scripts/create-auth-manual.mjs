import { chromium } from '@playwright/test';
import fs from 'fs';

console.log('\n=== Starting Auth Setup ===\n');

// Read credentials from .auth/writer.json
const writerAuthPath = '.auth/writer.json';
if (!fs.existsSync(writerAuthPath)) {
  console.error('❌ Error: .auth/writer.json not found');
  process.exit(1);
}

const writerAuth = JSON.parse(fs.readFileSync(writerAuthPath, 'utf-8'));
const email = writerAuth.email;
const password = writerAuth.password;

console.log('Opening browser...');
console.log(`Logging in with ${email}...\n`);

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  console.log('✅ Loaded login page');

  // Wait for email input to be visible
  console.log('🔐 Waiting for login form...');
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

  // Fill email field
  console.log('📧 Filling email...');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.waitForTimeout(500);

  // Fill password field
  console.log('🔑 Filling password...');
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.waitForTimeout(500);

  // Click sign in button and wait for navigation
  console.log('📝 Clicking sign in button...');
  const signInButton = await page.locator('button:has-text("Sign in with Email"), button:has-text("Sign in")').first();
  await signInButton.click();

  // Wait for navigation after login
  console.log('⏳ Waiting for authentication redirect...');
  try {
    await page.waitForURL(/studio|novels|community|settings|^\/$/, { timeout: 10000 });
    console.log('✅ Login successful! Redirected to:', page.url());
  } catch (error) {
    console.log('⚠️ URL check timeout. Current URL:', page.url());
    // Wait a bit more to ensure session is created
    await page.waitForTimeout(3000);
  }

  // Verify session cookie exists
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name === 'authjs.session-token');

  if (sessionCookie) {
    console.log('✅ Session token found!');
  } else {
    console.log('⚠️ Warning: No session token found in cookies');
    console.log('Available cookies:', cookies.map(c => c.name).join(', '));
  }

  // Save authentication state
  console.log('\n💾 Saving authentication state...');
  await context.storageState({ path: '.auth/writer.json' });
  await context.storageState({ path: '.auth/user.json' });
  console.log('✅ Auth saved to .auth/writer.json and .auth/user.json');

  await browser.close();
  console.log('✅ Browser closed\n');
} catch (error) {
  console.error('❌ Error during authentication:', error.message);
  await browser.close();
  process.exit(1);
}
