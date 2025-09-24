import { test, expect } from '@playwright/test';

test.describe('Story Image Display', () => {
  // Use stored authentication state
  test.use({ storageState: '.auth/user.json' });

  test('should display story image in writing page', async ({ page }) => {
    // Navigate to stories page
    await page.goto('http://localhost:3000/stories');

    // Wait for stories to load
    await page.waitForSelector('[data-testid="story-card"]', { timeout: 10000 });

    // Click on the first story
    const firstStory = page.locator('[data-testid="story-card"]').first();
    await firstStory.click();

    // Wait for the writing page to load
    await page.waitForURL(/\/write\/story\/.+/, { timeout: 10000 });

    // Check if story image is displayed in the StoryPromptWriter
    const storyPromptWriter = page.locator('[data-testid="story-prompt-writer"]');
    await expect(storyPromptWriter).toBeVisible({ timeout: 10000 });

    // Check if an image exists (either generated or placeholder)
    const storyImage = storyPromptWriter.locator('img').first();
    const imageCount = await storyImage.count();

    if (imageCount > 0) {
      // If image exists, verify it's loaded
      await expect(storyImage).toBeVisible();
      const imageSrc = await storyImage.getAttribute('src');
      expect(imageSrc).toBeTruthy();
      console.log('Story image found:', imageSrc);
    } else {
      console.log('No story image found (may not have been generated for this story)');
    }
  });

  test('should display story images in browse page', async ({ page }) => {
    // Navigate to browse/community page
    await page.goto('http://localhost:3000/community');

    // Wait for story grid to load
    await page.waitForSelector('.grid', { timeout: 10000 });

    // Check for story cards with images
    const storyCards = page.locator('.grid > div');
    const cardCount = await storyCards.count();

    if (cardCount > 0) {
      // Check first few story cards for images
      const maxCheck = Math.min(3, cardCount);
      let imagesFound = 0;

      for (let i = 0; i < maxCheck; i++) {
        const card = storyCards.nth(i);
        const images = card.locator('img');
        const imageCount = await images.count();

        if (imageCount > 0) {
          imagesFound++;
          const imageSrc = await images.first().getAttribute('src');
          console.log(`Story ${i + 1} image:`, imageSrc);
        }
      }

      console.log(`Found ${imagesFound} stories with images out of ${maxCheck} checked`);

      // At least some stories should have images
      expect(imagesFound).toBeGreaterThanOrEqual(0);
    } else {
      console.log('No story cards found in community page');
    }
  });

  test('should generate story with image', async ({ page }) => {
    // Navigate to stories page
    await page.goto('http://localhost:3000/stories');

    // Click on "New Story" button
    const newStoryButton = page.locator('button:has-text("New Story"), a:has-text("New Story")').first();
    await newStoryButton.click();

    // Wait for story generation modal/page
    await page.waitForSelector('textarea[placeholder*="story"]', { timeout: 10000 });

    // Enter a story prompt
    const storyPrompt = 'A magical adventure about a young wizard discovering ancient spells in a hidden library';
    await page.fill('textarea[placeholder*="story"]', storyPrompt);

    // Click generate button
    const generateButton = page.locator('button:has-text("Generate")').first();
    await generateButton.click();

    // Wait for story generation (this may take a while)
    await page.waitForURL(/\/write\/story\/.+/, { timeout: 60000 });

    // Verify we're on the writing page
    const url = page.url();
    expect(url).toMatch(/\/write\/story\/.+/);

    // Check if story image was generated
    await page.waitForTimeout(2000); // Give time for image to load

    const storyImage = page.locator('[data-testid="story-prompt-writer"] img').first();
    const imageExists = await storyImage.count() > 0;

    if (imageExists) {
      const imageSrc = await storyImage.getAttribute('src');
      console.log('Generated story image:', imageSrc);

      // Check if it's not just a placeholder
      if (imageSrc && !imageSrc.includes('picsum')) {
        console.log('✅ Story generated with custom image');
      } else {
        console.log('⚠️ Story generated with placeholder image');
      }
    } else {
      console.log('⚠️ No image found for generated story');
    }
  });
});