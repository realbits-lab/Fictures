import { chromium } from '@playwright/test';

console.log('\n=== Starting Manual Auth Setup ===\n');
console.log('This script will open a browser for you to login manually.');
console.log('Please login using Google OAuth or email/password\n');

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto('http://localhost:3000/login');
  console.log('✅ Opened login page');
  console.log('\n🔐 Please login in the browser window...');
  console.log('⏳ Waiting 60 seconds for you to complete login...\n');

  // Wait 60 seconds for manual login
  await page.waitForTimeout(60000);

  // Check if logged in
  const currentUrl = page.url();
  console.log('📍 Current URL:', currentUrl);

  if (currentUrl.includes('/login')) {
    console.log('⚠️  Still on login page - extending wait time...');
    console.log('⏳ Waiting another 30 seconds...\n');
    await page.waitForTimeout(30000);
  }

  // Check cookies
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name === 'authjs.session-token');

  if (sessionCookie) {
    console.log('✅ Session token found!');
    console.log('   Expires:', new Date(sessionCookie.expires * 1000).toLocaleString());
  } else {
    console.log('⚠️  No session token found - you may need to login again');
  }

  // Save authentication state
  console.log('\n💾 Saving authentication state...');
  await context.storageState({ path: '.auth/writer.json' });
  await context.storageState({ path: '.auth/user.json' });
  console.log('✅ Auth saved to .auth/writer.json and .auth/user.json\n');

  await browser.close();
  console.log('✅ Browser closed\n');

  if (!sessionCookie) {
    console.error('❌ Warning: No session token was saved. Login may have failed.');
    process.exit(1);
  }

  console.log('✅ Auth setup complete!\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  await browser.close();
  process.exit(1);
}
