import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });
  const page = await context.newPage();

  // Capture all console messages with the chapter structure
  const debugMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Navigation Debug')) {
      debugMessages.push(text);
      console.log('\n' + text + '\n');
    }
  });

  console.log('Navigating to reading page...');
  await page.goto('http://localhost:3000/reading/PoAQD-N76wSTiCxwQQCuQ', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Click on "The Maw's Embrace" chapter
  const chapterButtons = await page.locator('button').all();
  for (const button of chapterButtons) {
    const text = await button.textContent();
    if (text && text.includes("The Maw's Embrace")) {
      console.log('Clicking on "The Maw\'s Embrace"...');
      await button.click();
      await page.waitForTimeout(2000);
      break;
    }
  }

  await page.waitForTimeout(2000);

  console.log('\n=== CAPTURED DEBUG MESSAGES ===\n');
  debugMessages.forEach(msg => console.log(msg));

  await browser.close();
})();
