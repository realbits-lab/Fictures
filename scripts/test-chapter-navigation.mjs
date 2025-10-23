import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });
  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    if (msg.text().includes('📊 Navigation Debug')) {
      console.log('\n' + msg.text() + '\n');
    }
  });

  console.log('Navigating to reading page...');
  await page.goto('http://localhost:3000/reading/PoAQD-N76wSTiCxwQQCuQ', { waitUntil: 'networkidle' });

  console.log('\nWaiting for page to load...');
  await page.waitForTimeout(3000);

  // Click on "The Maw's Embrace" chapter in sidebar
  console.log('\nLooking for "The Maw\'s Embrace" in sidebar...');
  const chapterButtons = await page.locator('button').all();

  for (const button of chapterButtons) {
    const text = await button.textContent();
    if (text && text.includes("The Maw's Embrace")) {
      console.log('Found chapter button:', text);
      await button.click();
      await page.waitForTimeout(2000);
      break;
    }
  }

  console.log('\nWaiting for console debug output...');
  await page.waitForTimeout(3000);

  console.log('\nTaking screenshot...');
  await page.screenshot({ path: 'logs/chapter-debug.png', fullPage: true });

  console.log('\nTest complete. Browser will stay open for 10 seconds...');
  await page.waitForTimeout(10000);

  await browser.close();
})();
