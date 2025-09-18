import { test, expect } from '@playwright/test';

test.describe('Story Prompt Writer Debug', () => {
  test.use({ storageState: '@playwright/.auth/user.json' });

  test('Debug Story Prompt Writer visibility and functionality', async ({ page }) => {
    // Navigate to the write page
    await page.goto('/write/lq0F1cgRH23Hi5Ef0oq66');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'logs/debug-page-load.png', fullPage: true });

    // Check if we can see the current selection level
    const levelBadge = page.locator('[role="status"], .badge');
    const levelCount = await levelBadge.count();
    console.log(`Found ${levelCount} level badges`);

    if (levelCount > 0) {
      const levelText = await levelBadge.first().textContent();
      console.log(`Current level: ${levelText}`);
    }

    // Check if Story Prompt Writer exists
    const storyPromptWriter = page.locator('[data-testid="story-prompt-writer"]');
    const exists = await storyPromptWriter.count();
    console.log(`Story Prompt Writer exists: ${exists > 0}`);

    if (exists === 0) {
      // Look for any story-related buttons or controls
      const storyElements = page.locator('text="story", text="Story"');
      const storyCount = await storyElements.count();
      console.log(`Found ${storyCount} story-related elements`);

      // Try to find and click a story navigation button
      const sidebar = page.locator('.sidebar, [data-testid="sidebar"]');
      if (await sidebar.count() > 0) {
        console.log('Sidebar found, looking for story button');
        const storyButton = sidebar.locator('button:has-text("story"), button:has-text("Story")');
        if (await storyButton.count() > 0) {
          await storyButton.first().click();
          await page.waitForTimeout(2000);
          console.log('Clicked story button in sidebar');
        }
      }

      // Check again after potential navigation
      const nowExists = await storyPromptWriter.count();
      console.log(`Story Prompt Writer exists after navigation: ${nowExists > 0}`);
    }

    // Take another screenshot
    await page.screenshot({ path: 'logs/debug-after-navigation.png', fullPage: true });

    // If we found the component, test basic functionality
    if (await storyPromptWriter.count() > 0) {
      console.log('✅ Story Prompt Writer is visible');

      const promptInput = page.locator('[data-testid="prompt-input"]');
      const submitButton = page.locator('[data-testid="apply-changes-button"]');

      await expect(promptInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      console.log('✅ Input field and submit button are visible');

      // Test the API directly
      const response = await page.request.post('/api/story-analyzer', {
        data: {
          storyData: {
            title: '감정과 이성의 탐정들',
            genre: 'urban_fantasy',
            words: 80000,
            question: 'test question',
            goal: 'test goal',
            conflict: 'test conflict',
            outcome: 'test outcome',
            chars: { protagonist: { role: 'protag', arc: 'test arc' } },
            themes: ['test theme'],
            structure: { type: '3_part', parts: ['setup', 'middle', 'end'], dist: [25, 50, 25] },
            parts: []
          },
          userRequest: 'change title using a little bit more shorter expression'
        }
      });

      console.log(`API response status: ${response.status()}`);

      if (response.status() === 200) {
        const data = await response.json();
        console.log('✅ API is working');
        console.log(`Updated title: ${data.updatedStoryData?.title}`);
      }

    } else {
      console.log('❌ Story Prompt Writer is not visible');

      // Check what elements are actually on the page
      const allTestIds = page.locator('[data-testid]');
      const testIdCount = await allTestIds.count();
      console.log(`Found ${testIdCount} elements with data-testid`);

      for (let i = 0; i < Math.min(testIdCount, 10); i++) {
        const testId = await allTestIds.nth(i).getAttribute('data-testid');
        console.log(`  - ${testId}`);
      }
    }
  });
});