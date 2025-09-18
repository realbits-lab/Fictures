import { test, expect } from '@playwright/test';

test.describe('Story Generation with Character and Place Images', () => {
  test.use({
    storageState: '@playwright/.auth/user.json'
  });

  test('should generate story with character and place images displayed in YAML panel', async ({ page }) => {
    // Navigate to the story creation page
    await page.goto('http://localhost:3001/stories/new');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Verify we're on the correct page
    await expect(page.locator('h1')).toContainText('Create New Story');

    // Fill in the story prompt with a science fiction story
    const storyPrompt = "A marine biologist discovers an underwater civilization that communicates through bioluminescent patterns.";

    // Look for the prompt input field
    const promptInput = page.locator('input[placeholder*="story"], textarea[placeholder*="story"], input[name*="prompt"], textarea[name*="prompt"]').first();
    await expect(promptInput).toBeVisible();
    await promptInput.fill(storyPrompt);

    console.log('✓ Filled story prompt:', storyPrompt);

    // Find and click the generate button
    const generateButton = page.locator('button').filter({ hasText: /generate|create/i }).first();
    await expect(generateButton).toBeVisible();

    console.log('✓ Found generate button');

    // Click generate and start monitoring the process
    await generateButton.click();

    console.log('✓ Clicked generate button, starting story generation...');

    // Wait for YAML panel to appear - look for common YAML indicators
    const yamlPanel = page.locator('[class*="yaml"], [data-testid*="yaml"], pre, code').first();
    await expect(yamlPanel).toBeVisible({ timeout: 60000 });

    console.log('✓ YAML panel appeared');

    // Monitor the generation process and look for character images
    let characterImagesFound = false;
    let placeImagesFound = false;
    let yamlContent = '';

    // Poll the YAML content to check for image URLs
    for (let i = 0; i < 30; i++) { // Check for up to 30 seconds
      try {
        yamlContent = await yamlPanel.textContent() || '';

        // Check for character image URLs
        if (yamlContent.includes('character') && (yamlContent.includes('.jpg') || yamlContent.includes('.png') || yamlContent.includes('blob'))) {
          characterImagesFound = true;
          console.log('✓ Character images detected in YAML');
        }

        // Check for place image URLs
        if (yamlContent.includes('place') && (yamlContent.includes('.jpg') || yamlContent.includes('.png') || yamlContent.includes('blob'))) {
          placeImagesFound = true;
          console.log('✓ Place images detected in YAML');
        }

        // If both are found, break early
        if (characterImagesFound && placeImagesFound) {
          break;
        }

        await page.waitForTimeout(2000); // Wait 2 seconds before next check
      } catch (error) {
        console.log(`Attempt ${i + 1}: Still generating...`);
      }
    }

    console.log('Final YAML content preview:', yamlContent.substring(0, 500) + '...');

    // Verify character images are present
    expect(characterImagesFound).toBe(true);
    console.log('✓ Character images successfully displayed in YAML panel');

    // Verify place images are present
    expect(placeImagesFound).toBe(true);
    console.log('✓ Place images successfully displayed in YAML panel');

    // Additional verification: Check for specific YAML structure
    expect(yamlContent).toContain('characters:');
    expect(yamlContent).toContain('places:');

    console.log('✓ YAML structure verification completed');

    // Take a screenshot for documentation
    await page.screenshot({
      path: 'logs/story-generation-with-images.png',
      fullPage: true
    });

    console.log('✓ Test completed successfully - screenshot saved to logs/story-generation-with-images.png');
  });
});