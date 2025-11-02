import { test, expect } from '@playwright/test';
import { getAuthData } from './helpers/auth-helper';

test.describe('Writer Story Access Test', () => {
  test('writer can access story edit page qMH4sJmFTlB6KmdR0C6Uu', async ({ page }) => {
    const authData = getAuthData('writer');
    console.log(`Testing with writer account: ${authData.email}`);
    console.log(`Writer userId: ${authData.userId}`);

    // Navigate to the specific story edit page
    await page.goto('http://localhost:3000/studio/edit/story/qMH4sJmFTlB6KmdR0C6Uu');
    await page.waitForLoadState('networkidle');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'logs/writer-story-access.png', fullPage: true });

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Verify we're not redirected to login
    await expect(page).not.toHaveURL(/.*login.*/);

    // Check if we're on the story edit page
    const isOnStoryEditPage = currentUrl.includes('/studio/edit/story/qMH4sJmFTlB6KmdR0C6Uu');
    console.log(`On story edit page: ${isOnStoryEditPage}`);

    if (isOnStoryEditPage) {
      console.log('✅ Writer has access to the story edit page');

      // Check page title
      const title = await page.title();
      console.log(`Page title: ${title}`);

      // Check if there's any error message
      const errorMessage = await page.locator('[data-testid="error-message"]').count();
      if (errorMessage > 0) {
        const errorText = await page.locator('[data-testid="error-message"]').textContent();
        console.log(`❌ Error message found: ${errorText}`);
      }

      // Check if story content is loaded
      const storyContent = await page.locator('[data-testid="story-editor"]').count();
      console.log(`Story editor found: ${storyContent > 0}`);

    } else {
      console.log(`❌ Redirected to: ${currentUrl}`);

      // Check if there's an error message on the page
      const bodyText = await page.textContent('body');
      console.log(`Page content preview: ${bodyText?.substring(0, 200)}...`);
    }

    // Final assertion
    expect(isOnStoryEditPage).toBeTruthy();
  });

  test('check writer permissions and story ownership', async ({ page }) => {
    const authData = getAuthData('writer');

    // First, navigate to studio to see all stories
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'logs/writer-studio-page.png', fullPage: true });

    // Check if the specific story is visible in the list
    const storyCards = await page.locator('[data-testid="story-card"]').count();
    console.log(`Writer can see ${storyCards} stories in studio`);

    // Look for the specific story ID
    const specificStory = await page.locator(`[data-story-id="qMH4sJmFTlB6KmdR0C6Uu"]`).count();
    console.log(`Story qMH4sJmFTlB6KmdR0C6Uu visible in list: ${specificStory > 0}`);

    // Check story titles
    const storyTitles = await page.locator('[data-testid="story-title"]').allTextContents();
    console.log(`Story titles: ${storyTitles.join(', ')}`);
  });
});
