import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });
  const page = await context.newPage();

  console.log('Navigating to reading page...');
  await page.goto('http://localhost:3000/reading/PoAQD-N76wSTiCxwQQCuQ', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Click on "The Maw's Embrace" chapter
  console.log('\nClicking on "The Maw\'s Embrace"...');
  const chapterButtons = await page.locator('button').all();
  for (const button of chapterButtons) {
    const text = await button.textContent();
    if (text && text.includes("The Maw's Embrace")) {
      await button.click();
      await page.waitForTimeout(2000);
      break;
    }
  }

  // Scroll to bottom to see navigation buttons
  console.log('\nScrolling to bottom of content...');
  await page.evaluate(() => {
    const contentArea = document.querySelector('article') || document.querySelector('main');
    if (contentArea) {
      contentArea.scrollTop = contentArea.scrollHeight;
    }
  });
  await page.waitForTimeout(1000);

  // Check for "Next Chapter" button
  console.log('\nLooking for "Next Chapter" button...');
  const nextChapterButton = await page.locator('button:has-text("Next Chapter")').count();
  const nextSceneButton = await page.locator('button:has-text("Next Scene")').count();

  console.log(`\n✓ Found ${nextChapterButton} "Next Chapter" button(s)`);
  console.log(`✓ Found ${nextSceneButton} "Next Scene" button(s)`);

  if (nextChapterButton === 0) {
    console.log('\n✅ SUCCESS: No "Next Chapter" button on last chapter!');
  } else {
    console.log('\n❌ FAIL: "Next Chapter" button should NOT appear on last chapter');
  }

  // Take screenshot
  console.log('\nTaking screenshot...');
  await page.screenshot({ path: 'logs/last-chapter-navigation.png', fullPage: true });

  await page.waitForTimeout(3000);
  await browser.close();
})();
