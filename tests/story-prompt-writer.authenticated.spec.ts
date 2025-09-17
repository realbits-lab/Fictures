import { test, expect } from '@playwright/test';

test.describe('Story Prompt Writer Integration', () => {
  test.use({ storageState: '@playwright/.auth/user.json' });

  test('Story Prompt Writer updates client-side data and shows highlighting', async ({ page }) => {
    // Navigate to a specific chapter's write page
    await page.goto('/write/lq0F1cgRH23Hi5Ef0oq66');

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Make sure we're on story level by checking the badge or clicking story button
    const storyLevelBadge = page.locator('text="story"');
    if (await storyLevelBadge.count() === 0) {
      // Try to click a story-level navigation button
      const storyButton = page.locator('button:has-text("Story"), [role="button"]:has-text("Story")');
      if (await storyButton.count() > 0) {
        await storyButton.first().click();
        await page.waitForTimeout(1000);
      }
    }

    console.log('✓ Attempting to navigate to story level');

    // Look for Story Prompt Writer component with data-testid
    const storyPromptWriter = page.locator('[data-testid="story-prompt-writer"]');

    await expect(storyPromptWriter).toBeVisible({ timeout: 10000 });
    console.log('✓ Story Prompt Writer component found');

    // Capture the original YAML data before making changes
    const yamlDisplay = page.locator('[data-testid="yaml-display"], .yaml-display, [title*="Story YAML"]');
    let originalYamlText = '';

    if (await yamlDisplay.count() > 0) {
      originalYamlText = await yamlDisplay.first().textContent() || '';
      console.log('✓ Original YAML data captured');
    }

    // Find the title field in the YAML display to verify original value
    const titleCard = page.locator('.yaml-key-card, [data-key="title"]').filter({ hasText: 'title' });
    let originalTitle = '';

    if (await titleCard.count() > 0) {
      originalTitle = await titleCard.first().textContent() || '';
      console.log(`✓ Original title found: ${originalTitle}`);
    }

    // Find the prompt input field using data-testid
    const promptInput = page.locator('[data-testid="prompt-input"]');

    await expect(promptInput).toBeVisible();
    console.log('✓ Prompt input field found');

    // Enter the test prompt
    const testPrompt = 'change title using a little bit more shorter expression';
    await promptInput.fill(testPrompt);
    console.log('✓ Test prompt entered');

    // Find and click the submit/generate button using data-testid
    const submitButton = page.locator('[data-testid="apply-changes-button"]');

    await expect(submitButton).toBeVisible();
    await submitButton.click();
    console.log('✓ Prompt submitted');

    // Wait for API response and processing
    await page.waitForTimeout(5000);

    // Wait for any loading states to complete
    const loadingSelector = '.loading, .spinner, [data-testid="loading"]';
    await page.waitForSelector(loadingSelector, { state: 'hidden', timeout: 30000 }).catch(() => {
      console.log('ℹ️ No loading state detected or already completed');
    });

    // Check if the YAML data has been updated
    await page.waitForTimeout(2000); // Give time for UI updates

    // Look for highlighted/changed elements
    const highlightedElements = page.locator(
      '.border-blue-400, .bg-blue-50, .animate-pulse, [data-changed="true"], ' +
      '.highlight, .changed, .updated'
    );

    const highlightCount = await highlightedElements.count();
    console.log(`Found ${highlightCount} potentially highlighted elements`);

    // Check if title has changed
    let newTitle = '';
    if (await titleCard.count() > 0) {
      newTitle = await titleCard.first().textContent() || '';
      console.log(`Current title: ${newTitle}`);

      if (newTitle !== originalTitle && newTitle.length > 0) {
        console.log('✅ Title has been updated successfully');

        // Check if the title card is highlighted
        const titleIsHighlighted = await titleCard.first().locator('.border-blue-400, .bg-blue-50').count() > 0;
        if (titleIsHighlighted) {
          console.log('✅ Title card is highlighted correctly');
        } else {
          console.log('❌ Title card is not highlighted');
        }
      } else {
        console.log('❌ Title has not been updated');
      }
    }

    // Check the complete YAML display for changes
    let newYamlText = '';
    if (await yamlDisplay.count() > 0) {
      newYamlText = await yamlDisplay.first().textContent() || '';

      if (newYamlText !== originalYamlText) {
        console.log('✅ YAML data has been updated');
      } else {
        console.log('❌ YAML data appears unchanged');
      }
    }

    // Check for any error messages
    const errorMessages = page.locator('.error, .alert-error, [role="alert"]');
    const errorCount = await errorMessages.count();

    if (errorCount > 0) {
      const errorText = await errorMessages.first().textContent();
      console.log(`⚠️ Error detected: ${errorText}`);
    }

    // Verify that highlighting is working
    if (highlightCount > 0) {
      console.log('✅ Highlighting system is active');

      // Take a screenshot for visual verification
      await page.screenshot({
        path: 'logs/story-prompt-writer-test.png',
        fullPage: true
      });
      console.log('✓ Screenshot saved for visual verification');
    } else {
      console.log('❌ No highlighting detected');

      // Take a screenshot to debug the issue
      await page.screenshot({
        path: 'logs/story-prompt-writer-debug.png',
        fullPage: true
      });
      console.log('✓ Debug screenshot saved');
    }

    // Final assertions
    expect(highlightCount).toBeGreaterThan(0); // Should have highlighted elements
    expect(newTitle).not.toBe(originalTitle); // Title should have changed
  });

  test('Story Prompt Writer API endpoint functionality', async ({ page }) => {
    // Test the story analyzer API directly
    const response = await page.request.post('/api/story-analyzer', {
      data: {
        prompt: 'change title using a little bit more shorter expression',
        storyData: {
          title: '감정과 이성의 탐정들',
          genre: 'urban_fantasy',
          words: 80000
        }
      }
    });

    const status = response.status();
    console.log(`Story Analyzer API response status: ${status}`);

    if (status === 200) {
      const responseData = await response.json();
      console.log('✅ Story Analyzer API returned successful response');

      if (responseData.title && responseData.title !== '감정과 이성의 탐정들') {
        console.log(`✅ API successfully changed title to: ${responseData.title}`);
      } else {
        console.log('❌ API did not change the title');
      }
    } else {
      console.log(`❌ Story Analyzer API failed with status: ${status}`);
    }
  });
});