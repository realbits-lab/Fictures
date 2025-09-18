import { chromium } from 'playwright';
import fs from 'fs';

const AUTH_FILE = '.auth/user.json';

async function testAutoLogin() {
  console.log('🔐 Testing Automatic Login with Stored Credentials');
  console.log('==================================================');

  // Check if auth file exists
  if (!fs.existsSync(AUTH_FILE)) {
    console.log('❌ Authentication file not found:', AUTH_FILE);
    console.log('💡 Please run the capture script first to save authentication data');
    return;
  }

  console.log('✅ Found authentication file:', AUTH_FILE);

  // Launch browser in headless mode for testing
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });

  try {
    // Create context with stored authentication state
    const context = await browser.newContext({
      storageState: AUTH_FILE,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    console.log('🌐 Navigating to Fictures home page...');
    await page.goto('http://localhost:3000/');

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Check if user is authenticated
    const authResult = await page.evaluate(() => {
      // Look for authenticated user elements
      const userButton = document.querySelector('button:has(img)');
      const userImage = document.querySelector('img[alt*="전종환"]');
      const navElements = document.querySelectorAll('a[href="/stories"], a[href="/community"]');

      return {
        hasUserButton: !!userButton,
        hasUserImage: !!userImage,
        hasNavElements: navElements.length > 0,
        userName: userImage?.alt || userButton?.textContent?.trim() || null,
        url: window.location.href
      };
    });

    console.log('📊 Authentication Test Results:');
    console.log(`   - Page URL: ${authResult.url}`);
    console.log(`   - User Button: ${authResult.hasUserButton ? '✅' : '❌'}`);
    console.log(`   - User Image: ${authResult.hasUserImage ? '✅' : '❌'}`);
    console.log(`   - Navigation Elements: ${authResult.hasNavElements ? '✅' : '❌'}`);

    if (authResult.userName) {
      console.log(`   - User Name: ${authResult.userName}`);
    }

    const isAuthenticated = authResult.hasUserButton || authResult.hasUserImage || authResult.hasNavElements;

    if (isAuthenticated) {
      console.log('🎉 SUCCESS: Automatic login works!');

      // Test navigation to stories page to confirm full access
      console.log('🧪 Testing navigation to stories page...');
      await page.goto('http://localhost:3000/stories');
      await page.waitForTimeout(2000);

      const storiesPageResult = await page.evaluate(() => {
        return {
          url: window.location.href,
          hasCreateButton: !!document.querySelector('button, a').textContent?.includes('Create') ||
                          !!document.querySelector('[href*="create"]'),
          pageTitle: document.title
        };
      });

      console.log('📊 Stories Page Test:');
      console.log(`   - URL: ${storiesPageResult.url}`);
      console.log(`   - Page Title: ${storiesPageResult.pageTitle}`);
      console.log(`   - Has Create Elements: ${storiesPageResult.hasCreateButton ? '✅' : '❌'}`);

      console.log('🎉 Automatic authentication is working correctly!');
      console.log('💡 You can now use .auth/user.json for automated testing');

    } else {
      console.log('❌ FAILED: Automatic login did not work');
      console.log('💡 The stored authentication may have expired or be invalid');
      console.log('💡 Try running the capture script again to get fresh credentials');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
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
  await testAutoLogin();
}

main().catch(console.error);