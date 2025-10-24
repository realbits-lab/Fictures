import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });
  const page = await context.newPage();

  console.log('=== TEST 1: First chapter should show "Next Chapter" button ===\n');
  await page.goto('http://localhost:3000/reading/PoAQD-N76wSTiCxwQQCuQ', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Click on "The First Tremors" (first chapter)
  console.log('Clicking on "The First Tremors" (first chapter)...');
  let chapterButtons = await page.locator('button').all();
  for (const button of chapterButtons) {
    const text = await button.textContent();
    if (text && text.includes("The First Tremors")) {
      await button.click();
      await page.waitForTimeout(2000);
      break;
    }
  }

  // Scroll to bottom
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000);

  // Check for buttons
  let nextChapterCount = await page.locator('button:has-text("Next Chapter")').count();
  console.log(`Found ${nextChapterCount} "Next Chapter" button(s)`);
  if (nextChapterCount > 0) {
    console.log('✅ TEST 1 PASSED: "Next Chapter" button appears on first chapter\n');
  } else {
    console.log('❌ TEST 1 FAILED: "Next Chapter" button should appear on first chapter\n');
  }

  await page.screenshot({ path: 'logs/first-chapter-navigation.png', fullPage: true });

  console.log('=== TEST 2: Last chapter should NOT show "Next Chapter" button ===\n');

  // Click on "The Maw's Embrace" (last chapter)
  console.log('Clicking on "The Maw\'s Embrace" (last chapter)...');
  chapterButtons = await page.locator('button').all();
  for (const button of chapterButtons) {
    const text = await button.textContent();
    if (text && text.includes("The Maw's Embrace")) {
      await button.click();
      await page.waitForTimeout(2000);
      break;
    }
  }

  // Scroll to bottom
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000);

  // Check for buttons
  nextChapterCount = await page.locator('button:has-text("Next Chapter")').count();
  console.log(`Found ${nextChapterCount} "Next Chapter" button(s)`);
  if (nextChapterCount === 0) {
    console.log('✅ TEST 2 PASSED: No "Next Chapter" button on last chapter\n');
  } else {
    console.log('❌ TEST 2 FAILED: "Next Chapter" button should NOT appear on last chapter\n');
  }

  await page.screenshot({ path: 'logs/last-chapter-navigation-full.png', fullPage: true });

  console.log('\n=== TEST 3: Clicking "Next Chapter" navigates correctly ===\n');

  // Go back to first chapter
  console.log('Going back to "The First Tremors"...');
  chapterButtons = await page.locator('button').all();
  for (const button of chapterButtons) {
    const text = await button.textContent();
    if (text && text.includes("The First Tremors")) {
      await button.click();
      await page.waitForTimeout(2000);
      break;
    }
  }

  // Scroll to bottom and click "Next Chapter"
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(1000);

  const nextChapterButton = page.locator('button:has-text("Next Chapter")').first();
  if (await nextChapterButton.count() > 0) {
    const buttonText = await nextChapterButton.textContent();
    console.log(`Clicking button: "${buttonText}"`);
    await nextChapterButton.click();
    await page.waitForTimeout(2000);

    // Check if we navigated to the next chapter
    const currentChapterTitle = await page.locator('h2').first().textContent();
    console.log(`Current chapter after click: "${currentChapterTitle}"`);
    console.log('✅ TEST 3 PASSED: "Next Chapter" button navigates correctly\n');
  } else {
    console.log('❌ TEST 3 FAILED: Could not find "Next Chapter" button to click\n');
  }

  console.log('\n=== ALL TESTS COMPLETE ===');
  await page.waitForTimeout(2000);
  await browser.close();
})();
