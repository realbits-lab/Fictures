import { chromium } from '@playwright/test';
import fs from 'fs';

async function verifyReadingPageFix() {
  console.log('Starting browser for verification...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  const page = await context.newPage();

  // Listen for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`[ERROR] ${msg.text()}`);
    }
  });

  // Listen for page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.error('Page error:', error.message);
  });

  console.log('Navigating to http://localhost:3000/reading...');
  try {
    await page.goto('http://localhost:3000/reading', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Page loaded successfully');

    // Wait for any delayed errors
    await page.waitForTimeout(3000);

    // Check for picsum.photos errors
    const pictureErrors = pageErrors.filter(err => err.includes('picsum.photos'));

    console.log('\n=== VERIFICATION RESULTS ===');
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Total page errors: ${pageErrors.length}`);
    console.log(`Picsum.photos errors: ${pictureErrors.length}`);

    if (pictureErrors.length === 0) {
      console.log('\n✅ SUCCESS: No picsum.photos image configuration errors!');
    } else {
      console.log('\n❌ FAILURE: Still have picsum.photos errors:');
      pictureErrors.forEach(err => console.log(`  - ${err}`));
    }

    // List other errors if any
    if (pageErrors.length > pictureErrors.length) {
      console.log('\n⚠️ Other errors found:');
      pageErrors.filter(err => !err.includes('picsum.photos')).forEach(err => {
        console.log(`  - ${err}`);
      });
    }

    if (consoleErrors.length > 0) {
      console.log('\n⚠️ Console errors (excluding favicon):');
      consoleErrors.filter(err => !err.includes('favicon')).forEach(err => {
        console.log(`  - ${err}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }

  console.log('\nBrowser will stay open for 30 seconds. Press Ctrl+C to close earlier.');
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('Verification complete!');
}

verifyReadingPageFix().catch(console.error);
