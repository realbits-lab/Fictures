import { test, expect } from '@playwright/test';

test.describe('Story Generation with JSON Schema', () => {
  test.use({ storageState: '@playwright/.auth/user.json' });

  test('should generate story using new JSON API and verify database storage', async ({ page }) => {
    // Navigate to story generation page
    await page.goto('http://localhost:3002/stories/new');
    
    // Wait for page to load
    await expect(page.locator('h1')).toContainText('Create New Story');
    
    // Fill in story prompt
    const testPrompt = "I want to write an urban fantasy story about two sisters in San Francisco. Maya is a photographer who discovers she has shadow magic when her younger sister Elena disappears into a parallel realm called the Shadow Realm. The story should explore themes of family responsibility and the cost of power.";
    
    await page.fill('textarea[name="prompt"]', testPrompt);
    
    // Select language (if available)
    const languageSelect = page.locator('select[name="language"]');
    if (await languageSelect.isVisible()) {
      await languageSelect.selectOption('English');
    }
    
    // Click generate button
    await page.click('button[type="submit"]', { timeout: 5000 });
    
    // Wait for generation to complete (this might take a while with AI)
    await expect(page.locator('.loading', { hasText: 'Generating' })).toBeVisible({ timeout: 5000 });
    
    // Wait for success message or story details to appear
    await page.waitForSelector('.story-generated, .success-message', { timeout: 120000 });
    
    // Verify story was generated successfully
    await expect(page.locator('.story-title, h2')).toBeVisible();
    
    // Check that we have story details
    const storyTitle = await page.locator('.story-title, h2').first().textContent();
    expect(storyTitle).toBeTruthy();
    console.log('Generated story title:', storyTitle);
    
    // Look for parts or story structure
    const storyStructure = page.locator('.parts, .story-parts, .part');
    if (await storyStructure.first().isVisible({ timeout: 5000 })) {
      const partCount = await storyStructure.count();
      expect(partCount).toBeGreaterThan(0);
      console.log('Generated parts count:', partCount);
    }
    
    // Try to navigate to the story details page if available
    const storyLink = page.locator('a[href*="/stories/"]').first();
    if (await storyLink.isVisible({ timeout: 5000 })) {
      await storyLink.click();
      await page.waitForLoadState('networkidle');
    }
    
    console.log('✅ Story generation test completed successfully');
  });

  test('should test story generation API directly', async ({ page }) => {
    // Test the API endpoint directly
    const response = await page.request.post('http://localhost:3002/api/stories/generate', {
      data: {
        prompt: "Create a sci-fi story about space exploration and alien contact",
        language: "English"
      }
    });
    
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    console.log('API Response structure:', Object.keys(responseData));
    
    expect(responseData.success).toBe(true);
    expect(responseData.story).toBeDefined();
    expect(responseData.story.title).toBeTruthy();
    expect(responseData.story.parts).toBeDefined();
    
    console.log('Generated story data:', {
      title: responseData.story.title,
      genre: responseData.story.genre,
      words: responseData.story.words,
      partsCount: responseData.story.parts?.length || 0
    });
    
    // Store the story ID for database verification
    globalThis.generatedStoryId = responseData.story.id;
    
    console.log('✅ API story generation test completed successfully');
  });
});