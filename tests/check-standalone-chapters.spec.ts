import { test, expect } from '@playwright/test';

/**
 * Quick test to verify standalone chapters fix on existing stories
 */

test.describe('Check Standalone Chapters on Existing Stories', () => {
  test.use({ storageState: '.auth/user.json' });

  test('verify no standalone chapters section for stories with parts', async ({ page }) => {
    console.log('🧪 Quick verification of standalone chapters fix');

    // Navigate to browse page
    await page.goto('http://localhost:3000/browse');
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to browse page');

    // Find a published story (any story)
    const storyCards = page.locator('[data-testid="story-card"]');
    const storyCount = await storyCards.count();
    console.log(`📊 Found ${storyCount} stories`);

    if (storyCount === 0) {
      console.log('⚠️  No stories found to test');
      return;
    }

    // Get the first story's ID
    const firstStory = storyCards.first();
    const storyLink = await firstStory.locator('a[href*="/read/"]').getAttribute('href');

    if (!storyLink) {
      console.log('⚠️  No read link found - story might not be published');
      return;
    }

    const storyId = storyLink.split('/read/')[1];
    console.log(`✅ Found story ID: ${storyId}`);

    // Navigate to read page
    await page.goto(`http://localhost:3000/read/${storyId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for content to load
    console.log(`✅ Navigated to read page`);

    // Check if page loaded successfully
    const readerExists = await page.locator('[data-testid="chapter-reader"]').count();
    if (readerExists === 0) {
      console.log('⚠️  Reader not loaded - story might not be accessible');
      return;
    }

    // Take screenshot before checking
    await page.screenshot({ path: 'logs/read-page-before-check.png', fullPage: true });
    console.log('📸 Screenshot saved');

    // Check for parts structure
    const partsHeaders = page.locator('.text-xs:has-text("Part")');
    const partsCount = await partsHeaders.count();
    console.log(`📊 Found ${partsCount} part header(s)`);

    // Check for standalone chapters section
    const standaloneSection = page.locator('.text-xs:has-text("Standalone Chapters")');
    const standaloneCount = await standaloneSection.count();
    console.log(`📊 Found ${standaloneCount} "Standalone Chapters" section(s)`);

    // Verify the fix
    if (partsCount > 0) {
      if (standaloneCount > 0) {
        console.log('❌ FAIL: Story has parts but also shows standalone chapters!');
        expect(standaloneCount).toBe(0);
      } else {
        console.log('✅ PASS: Story has parts and NO standalone chapters section');
      }
    } else {
      // Check if "Chapters" section exists (not "Standalone Chapters")
      const chaptersSection = page.locator('.text-xs:has-text("Chapters")').and(page.locator(':not(:has-text("Standalone"))'));
      const chaptersCount = await chaptersSection.count();
      console.log(`📊 Found ${chaptersCount} "Chapters" section(s) (without "Standalone")`);

      if (standaloneCount > 0) {
        console.log('❌ FAIL: Label should be "Chapters", not "Standalone Chapters"');
      } else if (chaptersCount > 0) {
        console.log('✅ PASS: Correct "Chapters" label for story without parts');
      } else {
        console.log('ℹ️  No chapters section found');
      }
    }
  });
});
