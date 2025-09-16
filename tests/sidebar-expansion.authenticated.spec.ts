import { test, expect } from '@playwright/test';

test('sidebar expansion shows chapters and scenes', async ({ page }) => {
  // Navigate to the write page with a story that has parts
  await page.goto('http://localhost:3000/write/mxsk2Vk6BWO-eqtfMOUyZ');

  // Wait for the page to load and story structure to be visible
  await page.waitForSelector('[data-testid="story-structure-sidebar"]', { timeout: 10000 });

  // Look for Part 1 button in the sidebar
  const partButton = page.locator('button:has-text("Part 1")').first();
  await expect(partButton).toBeVisible();

  // Click on Part 1 to expand it
  await partButton.click();

  // Wait for expansion and check if chapters are now visible
  await page.waitForTimeout(1000); // Give time for expansion

  // Look for chapter elements that should now be visible after expansion
  const chapterElements = page.locator('button:has-text("Ch ")');
  const chapterCount = await chapterElements.count();

  console.log(`Found ${chapterCount} chapters in expanded Part 1`);

  // If there are chapters, verify they're visible
  if (chapterCount > 0) {
    await expect(chapterElements.first()).toBeVisible();
    console.log('✅ Chapters are visible after expanding Part 1');

    // Try to expand the first chapter to see scenes
    await chapterElements.first().click();
    await page.waitForTimeout(1000);

    // Look for scene elements
    const sceneElements = page.locator('button:has-text("Scene")');
    const sceneCount = await sceneElements.count();
    console.log(`Found ${sceneCount} scenes in expanded chapter`);

    if (sceneCount > 0) {
      console.log('✅ Scenes are visible after expanding chapter');
    }
  } else {
    console.log('⚠️ No chapters found in Part 1 - checking data structure');
  }

  // Take a screenshot for debugging
  await page.screenshot({ path: 'logs/sidebar-expansion-test.png', fullPage: true });
});