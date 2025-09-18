import { test, expect } from '@playwright/test';

test.describe('Image Generation End-to-End Flow', () => {
  test('should generate and preview images with Save/Cancel buttons', async ({ page }) => {
    // Navigate to the stories page
    await page.goto('/stories');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="stories-page"]', { timeout: 10000 });

    // Create or select a story for testing
    await page.click('text=Create New Story');
    await page.waitForSelector('[data-testid="story-prompt-writer"]');

    // Find the Story Prompt Writer component
    const promptWriter = page.locator('[data-testid="story-prompt-writer"]');
    await expect(promptWriter).toBeVisible();

    // Enter an image generation request
    const promptInput = promptWriter.locator('[data-testid="prompt-input"]');
    await promptInput.fill('Show me what the main character looks like');

    // Click the Apply Changes button
    const applyButton = promptWriter.locator('[data-testid="apply-changes-button"]');
    await applyButton.click();

    // Wait for the processing to complete and image to be generated
    await page.waitForFunction(() => {
      const results = document.querySelector('.whitespace-pre-wrap');
      return results && results.textContent!.includes('Image Generated Successfully');
    }, { timeout: 60000 });

    // Check that the image preview section appears
    const imagePreview = page.locator('text=🎨 Generated Image Preview');
    await expect(imagePreview).toBeVisible();

    // Verify the generated image is displayed
    const generatedImage = page.locator('[data-testid="story-prompt-writer"] img');
    await expect(generatedImage).toBeVisible();

    // Check that the image src is a data URL (base64)
    const imageSrc = await generatedImage.getAttribute('src');
    expect(imageSrc).toMatch(/^data:image\//);

    // Verify Save and Cancel buttons are present
    const saveButton = page.locator('button:has-text("Save Image")');
    const cancelButton = page.locator('button:has-text("Cancel")');

    await expect(saveButton).toBeVisible();
    await expect(cancelButton).toBeVisible();

    // Test Cancel functionality
    await cancelButton.click();

    // Verify image preview is hidden after cancel
    await expect(imagePreview).not.toBeVisible();
    await expect(generatedImage).not.toBeVisible();

    console.log('✅ Image generation and preview flow test completed successfully!');
  });

  test('should handle image generation errors gracefully', async ({ page }) => {
    // Navigate to the stories page
    await page.goto('/stories');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="stories-page"]', { timeout: 10000 });

    // Create or select a story for testing
    await page.click('text=Create New Story');
    await page.waitForSelector('[data-testid="story-prompt-writer"]');

    // Find the Story Prompt Writer component
    const promptWriter = page.locator('[data-testid="story-prompt-writer"]');
    await expect(promptWriter).toBeVisible();

    // Enter a request that might cause an error (very long prompt)
    const promptInput = promptWriter.locator('[data-testid="prompt-input"]');
    await promptInput.fill('A'.repeat(1000) + ' show me an image');

    // Click the Apply Changes button
    const applyButton = promptWriter.locator('[data-testid="apply-changes-button"]');
    await applyButton.click();

    // Wait for error handling (should either succeed or show graceful error)
    await page.waitForFunction(() => {
      const results = document.querySelector('.whitespace-pre-wrap');
      return results && (
        results.textContent!.includes('Image Generated Successfully') ||
        results.textContent!.includes('Image Generation Failed') ||
        results.textContent!.includes('Error Processing Request')
      );
    }, { timeout: 60000 });

    console.log('✅ Error handling test completed!');
  });
});