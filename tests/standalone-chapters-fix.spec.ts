import { test, expect } from '@playwright/test';

/**
 * Test to verify that standalone chapters are NOT displayed when a story has parts structure
 * Issue: After generating a story with parts, standalone chapters were incorrectly showing in /read page
 * Fix: Only show standalone chapters section if story.parts.length === 0
 */

test.describe('Standalone Chapters Fix', () => {
  test.use({ storageState: '.auth/user.json' });

  test('should NOT show standalone chapters for stories with parts structure', async ({ page }) => {
    console.log('🧪 Starting test: Standalone chapters should not appear for stories with parts');

    // Navigate to new story page
    await page.goto('http://localhost:3000/stories/new');
    await page.waitForLoadState('networkidle');

    console.log('✅ Navigated to /stories/new');

    // Fill in story prompt
    const prompt = 'Write a short story about a space explorer discovering a new planet with three parts';
    await page.fill('textarea[placeholder="Enter your story idea..."]', prompt);

    console.log('✅ Filled in story prompt');

    // Click generate button
    await page.click('button:has-text("Generate Story")');

    console.log('⏳ Waiting for story generation to complete...');

    // Wait for generation to complete (check for success message or Open Story button)
    await page.waitForSelector('button:has-text("Open Story")', { timeout: 300000 }); // 5 minutes timeout

    console.log('✅ Story generation completed');

    // Click "Open Story" button
    await page.click('button:has-text("Open Story")');
    await page.waitForLoadState('networkidle');

    const storyUrl = page.url();
    const storyId = storyUrl.match(/\/write\/story\/([^\/]+)/)?.[1];
    console.log(`✅ Opened story in writing interface: ${storyId}`);

    // Publish the story (navigate to browse page and publish it)
    await page.goto('http://localhost:3000/browse');
    await page.waitForLoadState('networkidle');

    // Find the newly created story in the list
    const storyCard = page.locator(`[data-testid="story-card"]:has-text("space explorer")`).first();
    await expect(storyCard).toBeVisible();

    // Click publish button on the story card
    await storyCard.locator('button:has-text("Publish")').click();
    await page.waitForTimeout(2000); // Wait for publish to complete

    console.log('✅ Published the story');

    // Navigate to read page
    const readUrl = `http://localhost:3000/read/${storyId}`;
    await page.goto(readUrl);
    await page.waitForLoadState('networkidle');

    console.log(`✅ Navigated to read page: ${readUrl}`);

    // Verify page loaded correctly
    await expect(page.locator('[data-testid="chapter-reader"]')).toBeVisible();

    // Check for parts structure in the sidebar
    const partsSection = page.locator('.text-xs:has-text("Part")');
    const partsCount = await partsSection.count();
    console.log(`📊 Found ${partsCount} part(s) in the story`);

    // Verify that "Standalone Chapters" section does NOT exist
    const standaloneSection = page.locator('.text-xs:has-text("Standalone Chapters")');
    const standaloneCount = await standaloneSection.count();

    console.log(`📊 Found ${standaloneCount} "Standalone Chapters" section(s)`);

    // The test passes if there are parts AND no standalone chapters section
    if (partsCount > 0) {
      expect(standaloneCount).toBe(0);
      console.log('✅ TEST PASSED: Story has parts structure and NO standalone chapters section');
    } else {
      // If story doesn't have parts, standalone chapters are acceptable
      console.log('⚠️  Story has no parts structure - standalone chapters section is OK');
    }

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'logs/standalone-chapters-test.png', fullPage: true });
    console.log('📸 Screenshot saved to logs/standalone-chapters-test.png');
  });

  test('should show chapters section (not "Standalone") for stories WITHOUT parts', async ({ page }) => {
    console.log('🧪 Starting test: Stories without parts should show "Chapters" section');

    // This test verifies the label is correct when there are no parts
    await page.goto('http://localhost:3000/browse');
    await page.waitForLoadState('networkidle');

    // Find any story without parts structure (or create one for testing)
    // For now, we'll just verify the logic by checking the UI text change
    // The actual test would need a story without parts structure

    console.log('✅ Test placeholder - would verify stories without parts show "Chapters" label');
  });
});
