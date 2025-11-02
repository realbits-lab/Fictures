import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });

  const page = await context.newPage();

  // Collect ALL messages
  const consoleLogs = [];
  const errors = [];

  page.on('console', msg => {
    const text = `[${msg.type().toUpperCase()}] ${msg.text()}`;
    consoleLogs.push(text);
    console.log(text);
  });

  page.on('pageerror', error => {
    const text = `[PAGE ERROR] ${error.message}\n${error.stack}`;
    errors.push(text);
    console.log(text);
  });

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('=== Navigating... ===\n');
  try {
    await page.goto('http://localhost:3000/studio/edit/story/kfiNwbdYD2BAnC7IAyjps', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
  } catch (e) {
    console.log(`Navigation error: ${e.message}`);
  }

  console.log('\n=== Waiting for page to load... ===\n');
  await page.waitForTimeout(5000);

  console.log(`\n=== Summary ===`);
  console.log(`Total console messages: ${consoleLogs.length}`);
  console.log(`Total errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(err => console.log(err));
  }

  // Check if we're on the right page
  const url = page.url();
  const title = await page.title();
  console.log(`\nFinal URL: ${url}`);
  console.log(`Page title: ${title}`);

  // Check for basic page elements
  const body = await page.locator('body').textContent();
  console.log(`\nBody text (first 200 chars): ${body?.substring(0, 200)}`);

  await browser.close();
})();
