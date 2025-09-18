import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = '.auth/user.json';
const EMAIL = 'test.user@example.com';

async function setupGoogleAuth() {
  console.log('🔐 Setting up Google authentication for Playwright...');

  // Launch browser in non-headless mode for manual login
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to Fictures login page...');
    await page.goto('http://localhost:3000/login');

    console.log('🔍 Looking for Google Sign In button...');
    await page.waitForSelector('button:has-text("Sign in with Google")', { timeout: 10000 });

    console.log('👆 Click on "Sign in with Google" button to authenticate...');
    console.log('📧 Use email: test.user@example.com');
    console.log('⏳ Waiting for you to complete the authentication process...');

    // Click the Google Sign In button
    await page.click('button:has-text("Sign in with Google")');

    // Wait for authentication to complete and redirect back to app
    console.log('⏳ Waiting for authentication to complete...');
    console.log('   - Complete the Google authentication in the browser');
    console.log('   - Grant permissions to Fictures');
    console.log('   - Wait to be redirected back to Fictures');

    // Wait for successful authentication (redirect to stories page or home)
    await page.waitForURL(url =>
      url.includes('/stories') ||
      url.includes('/') && !url.includes('/login'),
      { timeout: 120000 }
    );

    console.log('✅ Authentication successful!');

    // Save the authentication state
    console.log('💾 Saving authentication state...');
    await context.storageState({ path: AUTH_FILE });

    console.log('✅ Authentication data saved to:', AUTH_FILE);

    // Verify the saved authentication
    const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    console.log('📊 Saved authentication data contains:');
    console.log(`   - ${authData.cookies?.length || 0} cookies`);
    console.log(`   - ${Object.keys(authData.origins || {}).length} origins with localStorage data`);

    console.log('🎉 Setup complete! You can now use automatic authentication in Playwright tests.');

  } catch (error) {
    console.error('❌ Authentication setup failed:', error.message);
    console.log('💡 Please ensure:');
    console.log('   - The development server is running on localhost:3000');
    console.log('   - You have access to test.user@example.com account');
    console.log('   - You complete the authentication process within 2 minutes');
  } finally {
    await browser.close();
  }
}

// Check if development server is running
async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🚀 Playwright Google Authentication Setup');
  console.log('========================================');

  // Check if dev server is running
  console.log('🔍 Checking if development server is running...');
  const serverRunning = await checkDevServer();

  if (!serverRunning) {
    console.log('❌ Development server is not running on localhost:3000');
    console.log('💡 Please start the dev server first: pnpm dev');
    process.exit(1);
  }

  console.log('✅ Development server is running');

  // Create auth directory if it doesn't exist
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log('📁 Created auth directory:', authDir);
  }

  await setupGoogleAuth();
}

main().catch(console.error);