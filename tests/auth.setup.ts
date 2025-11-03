import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const writerFile = '.auth/writer.json';
const readerFile = '.auth/reader.json';
const managerFile = '.auth/manager.json';

// Helper to check if auth file exists and has valid session
function hasValidAuth(filePath: string): boolean {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    const authData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Check if cookies exist and session token is present
    if (!authData.cookies || authData.cookies.length === 0) {
      return false;
    }

    const sessionToken = authData.cookies.find(
      (cookie: any) => cookie.name === 'authjs.session-token'
    );

    if (!sessionToken) {
      return false;
    }

    // Check if session token is not expired
    if (sessionToken.expires !== -1 && sessionToken.expires < Date.now() / 1000) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Helper to perform login
async function login(page: any, email: string, password: string, expectedUrl: string) {
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  // Fill email field
  await page.fill('input[type="email"], input[name="email"]', email);

  // Fill password field
  await page.fill('input[type="password"], input[name="password"]', password);

  // Click sign in button
  await page.click('button:has-text("Sign in with Email"), button:has-text("Sign in")');
  await page.waitForLoadState('networkidle');

  // Wait for redirect after successful login
  await page.waitForTimeout(2000);

  // Verify we're logged in by checking URL
  await expect(page).toHaveURL(new RegExp(expectedUrl));
}

setup('authenticate as writer', async ({ page }) => {
  // Skip if valid auth already exists
  if (hasValidAuth(writerFile)) {
    console.log('✅ Writer authentication already valid, skipping...');
    return;
  }

  console.log('\n=== Writer Authentication Setup ===');
  console.log('Account: writer@fictures.xyz');
  console.log('Navigating to login page...\n');

  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  console.log('🔐 Please login with writer@fictures.xyz');
  console.log('⏳ Waiting 90 seconds for manual login...');
  console.log('   - Use Google OAuth OR email/password');
  console.log('   - Complete any 2FA if required\n');

  // Wait for manual login (90 seconds)
  await page.waitForTimeout(90000);

  // Verify logged in
  try {
    await expect(page).toHaveURL(/studio|novels|community|settings/, { timeout: 5000 });
    console.log('✅ Login successful! URL:', page.url());
  } catch (error) {
    console.log('⚠️  Login verification: Current URL:', page.url());
  }

  // Save the authentication state
  await page.context().storageState({ path: writerFile });
  console.log('✅ Writer auth saved to:', writerFile);

  // Also save as user.json for cache tests
  await page.context().storageState({ path: '.auth/user.json' });
  console.log('✅ User auth saved to: .auth/user.json\n');
});

setup('authenticate as reader', async ({ page }) => {
  // Skip if valid auth already exists
  if (hasValidAuth(readerFile)) {
    console.log('✅ Reader authentication already valid, skipping...');
    return;
  }

  console.log('\n=== Reader Authentication Setup ===');
  console.log('Account: reader@fictures.xyz');
  console.log('Navigating to login page...\n');

  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  console.log('🔐 Please login with reader@fictures.xyz');
  console.log('⏳ Waiting 90 seconds for manual login...\n');

  await page.waitForTimeout(90000);

  try {
    await expect(page).toHaveURL(/studio|novels|community|settings/, { timeout: 5000 });
    console.log('✅ Login successful! URL:', page.url());
  } catch (error) {
    console.log('⚠️  Login verification: Current URL:', page.url());
  }

  await page.context().storageState({ path: readerFile });
  console.log('✅ Reader auth saved to:', readerFile, '\n');
});

setup('authenticate as manager', async ({ page }) => {
  // Skip if valid auth already exists
  if (hasValidAuth(managerFile)) {
    console.log('✅ Manager authentication already valid, skipping...');
    return;
  }

  console.log('\n=== Manager Authentication Setup ===');
  console.log('Account: manager@fictures.xyz');
  console.log('Navigating to login page...\n');

  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');

  console.log('🔐 Please login with manager@fictures.xyz');
  console.log('⏳ Waiting 90 seconds for manual login...\n');

  await page.waitForTimeout(90000);

  try {
    await expect(page).toHaveURL(/studio|novels|community|settings/, { timeout: 5000 });
    console.log('✅ Login successful! URL:', page.url());
  } catch (error) {
    console.log('⚠️  Login verification: Current URL:', page.url());
  }

  await page.context().storageState({ path: managerFile });
  console.log('✅ Manager auth saved to:', managerFile, '\n');
});
