import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = '.auth/user.json';

async function waitForManualAuth() {
  console.log('🔐 Manual Authentication Capture Tool');
  console.log('====================================');

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
    console.log('🌐 Navigating to Fictures home page...');
    await page.goto('http://localhost:3000/');

    console.log('👋 Please log in manually in the browser window that opened');
    console.log('📧 Use email: test.user@example.com');
    console.log('⏳ I will wait for you to complete the authentication...');
    console.log('💡 Once you see your name in the navigation bar, the capture will begin');

    // Wait for authentication to complete by checking for authenticated state
    let isAuthenticated = false;
    let attempts = 0;
    const maxAttempts = 60; // Wait up to 5 minutes

    while (!isAuthenticated && attempts < maxAttempts) {
      await page.waitForTimeout(5000); // Wait 5 seconds between checks
      attempts++;

      try {
        // Check if user is authenticated by looking for user-specific elements
        isAuthenticated = await page.evaluate(() => {
          // Look for user button with name or authenticated navigation elements
          const userButton = document.querySelector('button:has(img)') ||
                            document.querySelector('[alt*="전종환"]') ||
                            document.querySelector('button[class*="user"]');

          // Also check for navigation elements that appear when authenticated
          const navElements = document.querySelectorAll('a[href="/stories"], a[href="/community"]');

          return !!userButton || navElements.length > 0;
        });

        if (isAuthenticated) {
          console.log('✅ Authentication detected!');
        } else {
          console.log(`⏳ Waiting for authentication... (${attempts}/${maxAttempts})`);
        }
      } catch (error) {
        console.log(`⚠️  Check failed: ${error.message}`);
      }
    }

    if (!isAuthenticated) {
      console.log('❌ Timeout waiting for authentication');
      console.log('💡 Please ensure you completed the login process');
      return;
    }

    // Wait a bit more to ensure all cookies are set
    console.log('⏳ Waiting for authentication to fully complete...');
    await page.waitForTimeout(3000);

    // Create auth directory if it doesn't exist
    const authDir = path.dirname(AUTH_FILE);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
      console.log('📁 Created auth directory:', authDir);
    }

    // Save the authentication state
    console.log('💾 Capturing authentication state...');
    await context.storageState({ path: AUTH_FILE });

    console.log('✅ Authentication data saved to:', AUTH_FILE);

    // Verify the saved authentication
    const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    console.log('📊 Captured authentication data contains:');
    console.log(`   - ${authData.cookies?.length || 0} cookies`);
    console.log(`   - ${Object.keys(authData.origins || {}).length} origins with localStorage data`);

    // Show some cookie details (non-sensitive)
    if (authData.cookies && authData.cookies.length > 0) {
      const domains = [...new Set(authData.cookies.map(c => c.domain))];
      console.log('🍪 Cookie domains:', domains.join(', '));

      // Show auth-related cookies (without values)
      const authCookies = authData.cookies.filter(c =>
        c.name.includes('auth') ||
        c.name.includes('session') ||
        c.name.includes('token') ||
        c.name.startsWith('__Secure-') ||
        c.name.startsWith('__Host-')
      );

      if (authCookies.length > 0) {
        console.log('🔐 Authentication cookies found:');
        authCookies.forEach(cookie => {
          console.log(`   - ${cookie.name} (${cookie.domain})`);
        });
      }
    }

    console.log('🎉 Authentication capture completed successfully!');
    console.log('💡 You can now use this for automated Playwright tests');

  } catch (error) {
    console.error('❌ Failed to capture authentication state:', error.message);
  } finally {
    console.log('👋 Closing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

async function main() {
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
  await waitForManualAuth();
}

main().catch(console.error);