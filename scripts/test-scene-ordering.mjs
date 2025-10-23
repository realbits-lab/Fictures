import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  console.log('Navigating to reading page...');
  await page.goto('http://localhost:3000/reading/PoAQD-N76wSTiCxwQQCuQ', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Get all chapters from sidebar
  console.log('\n=== CHAPTER ORDER IN SIDEBAR ===');
  const chapterButtons = await page.locator('button').all();
  const chapters = [];

  for (let i = 0; i < chapterButtons.length; i++) {
    const button = chapterButtons[i];
    const text = await button.textContent();
    if (text && (text.includes('🚀') || text.includes('Chapter') || text.includes('Tremors') || text.includes('Stardust') || text.includes('Maw'))) {
      chapters.push({ index: i, text: text.trim() });
      console.log(`${chapters.length}. ${text.trim()}`);
    }
  }

  // Test each chapter's scenes
  for (const chapter of chapters.slice(0, 3)) {
    console.log(`\n=== Testing: ${chapter.text} ===`);

    // Click the chapter
    const button = chapterButtons[chapter.index];
    await button.click();
    await page.waitForTimeout(2000);

    // Get scene list if available
    const sceneButtons = await page.locator('button').all();
    const scenes = [];

    for (const sceneBtn of sceneButtons) {
      const text = await sceneBtn.textContent();
      if (text && text.includes('🎬')) {
        scenes.push(text.trim());
      }
    }

    if (scenes.length > 0) {
      console.log('Scenes in this chapter:');
      scenes.forEach((scene, idx) => {
        console.log(`  ${idx + 1}. ${scene}`);
      });
    }

    // Check the scene counter at bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const sceneCounter = await page.locator('span:has-text("Scene")').textContent().catch(() => 'Not found');
    console.log(`Scene counter: ${sceneCounter}`);
  }

  console.log('\n=== Taking screenshots ===');
  await page.screenshot({ path: 'logs/chapter-ordering.png', fullPage: true });

  await page.waitForTimeout(2000);
  await browser.close();
})();
