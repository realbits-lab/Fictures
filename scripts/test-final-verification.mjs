import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });
  const page = await context.newPage();

  console.log('=== FINAL VERIFICATION TEST ===\n');

  await page.goto('http://localhost:3000/reading/PoAQD-N76wSTiCxwQQCuQ', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  console.log('✓ Page loaded\n');

  // Test 1: Verify chapter order in sidebar
  console.log('TEST 1: Chapter Order in Sidebar');
  const chapterTitles = [];
  const buttons = await page.locator('button').all();

  for (const button of buttons) {
    const text = await button.textContent();
    if (text && text.includes('🚀')) {
      const title = text.replace('🚀', '').trim();
      chapterTitles.push(title);
    }
  }

  console.log('Chapters in order:');
  chapterTitles.forEach((title, idx) => {
    console.log(`  ${idx + 1}. ${title}`);
  });

  const expectedOrder = ['The Stardust Falls', 'The First Tremors', "The Maw's Embrace"];
  const orderCorrect = chapterTitles.length === 3 &&
    chapterTitles[0] === expectedOrder[0] &&
    chapterTitles[1] === expectedOrder[1] &&
    chapterTitles[2] === expectedOrder[2];

  console.log(orderCorrect ? '✅ Chapter order is CORRECT\n' : '❌ Chapter order is WRONG\n');

  // Test 2: Navigate through all chapters using Next button
  console.log('TEST 2: Sequential Navigation');

  // Start at first chapter
  console.log('  Starting at: The Stardust Falls');
  const firstButton = await page.locator('button:has-text("🚀The Stardust Falls")').first();
  await firstButton.click();
  await page.waitForTimeout(2000);

  // Scroll to bottom and click Next Chapter
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  let nextButton = await page.locator('button:has-text("Next Chapter")').first();
  if (await nextButton.count() > 0) {
    const buttonText = await nextButton.textContent();
    console.log(`  Clicking: ${buttonText.trim()}`);
    await nextButton.click();
    await page.waitForTimeout(2000);

    const currentTitle = await page.locator('h2').first().textContent();
    console.log(`  Now at: ${currentTitle}`);
  }

  // Click Next Chapter again
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  nextButton = await page.locator('button:has-text("Next Chapter")').first();
  if (await nextButton.count() > 0) {
    const buttonText = await nextButton.textContent();
    console.log(`  Clicking: ${buttonText.trim()}`);
    await nextButton.click();
    await page.waitForTimeout(2000);

    const currentTitle = await page.locator('h2').first().textContent();
    console.log(`  Now at: ${currentTitle}`);
  }

  // Check no Next Chapter button on last chapter
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  const finalNextButton = await page.locator('button:has-text("Next Chapter")').count();
  console.log(`  Next Chapter button count on last chapter: ${finalNextButton}`);
  console.log(finalNextButton === 0 ? '✅ Navigation is CORRECT\n' : '❌ Navigation has issues\n');

  console.log('=== ALL TESTS COMPLETE ===');

  await page.screenshot({ path: 'logs/final-verification.png', fullPage: true });
  await page.waitForTimeout(2000);
  await browser.close();
})();
