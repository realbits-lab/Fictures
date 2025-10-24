import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = '.auth/user.json';

async function captureAuthState() {
  console.log('🔐 Capturing current authentication state...');

  // Launch browser in non-headless mode
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    console.log('🌐 Navigating to Fictures home page...');
    await page.goto('http://localhost:3000/');

    // Wait for page to load and check if user is authenticated
    await page.waitForTimeout(2000);

    // Check if user is authenticated by looking for user-specific elements
    const isAuthenticated = await page.evaluate(() => {
      // Look for user button or authenticated navigation elements
      const userButton = document.querySelector('button[class*="user"]') ||
                        document.querySelector('img[alt*="전종환"]') ||
                        document.querySelector('button:has(img)');
      return !!userButton;
    });

    if (!isAuthenticated) {
      console.log('❌ User does not appear to be authenticated');
      console.log('💡 Please log in manually first, then run this script');
      return;
    }

    console.log('✅ User is authenticated! Capturing state...');

    // Create auth directory if it doesn't exist
    const authDir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
      console.log('📁 Created auth directory:', authDir);
    }

    // Save the authentication state
    console.log('💾 Saving authentication state...');
    await context.storageState({ path: AUTH_FILE });

    console.log('✅ Authentication data saved to:', AUTH_FILE);

    // Verify the saved authentication
    const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    console.log('📊 Saved authentication data contains:');
    console.log(`   - ${authData.cookies?.length || 0} cookies`);
    console.log(`   - ${Object.keys(authData.origins || {}).length} origins with localStorage data`);

    // Show some cookie details (non-sensitive)
    if (authData.cookies && authData.cookies.length > 0) {
      const domains = [...new Set(authData.cookies.map(c => c.domain))];
      console.log('🍪 Cookie domains:', domains.join(', '));
    }

    console.log('🎉 Authentication state captured successfully!');
    console.log('💡 You can now use this for automated Playwright tests');

  } catch (error) {
    console.error('❌ Failed to capture authentication state:', error.message);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🚀 Playwright Authentication State Capture');
  console.log('==========================================');

  // Check if development server is running
  try {
    const response = await fetch('http://localhost:3000');
    if (!response.ok) {
      console.log('❌ Development server is not responding properly');
      console.log('💡 Please ensure the dev server is running: pnpm dev');
      return;
    }
  } catch {
    console.log('❌ Development server is not running on localhost:3000');
    console.log('💡 Please start the dev server first: pnpm dev');
    return;
  }

  console.log('✅ Development server is running');
  await captureAuthState();
}

main().catch(console.error);