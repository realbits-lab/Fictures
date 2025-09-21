import { test, expect } from '@playwright/test';

test.describe('Story Generation', () => {
  test('should generate a story without errors', async ({ page }) => {
    // Use stored authentication state
    await page.goto('http://localhost:3000/stories');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click on "Generate Story with AI" button
    await page.click('text=Generate Story with AI');

    // Wait for the form to appear
    await page.waitForSelector('textarea#prompt', { state: 'visible' });

    // Fill in the story prompt
    await page.fill('textarea#prompt', 'A young scientist discovers a portal to parallel universes in her laboratory basement');

    // Submit the form
    await page.click('button[type="submit"]:has-text("Generate Story")');

    // Wait for the generation to start
    await page.waitForSelector('text=Story Generation Progress', { timeout: 5000 });

    // Monitor for errors during generation
    let errorOccurred = false;
    let errorMessage = '';

    // Set up listener for error states
    page.on('response', response => {
      if (response.url().includes('/api/stories/generate-hns') && response.status() >= 400) {
        errorOccurred = true;
        errorMessage = `HTTP Error: ${response.status()} ${response.statusText()}`;
      }
    });

    // Wait for generation to complete or error (max 2 minutes)
    const maxWaitTime = 120000; // 2 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      // Check if generation completed successfully
      const completedElement = await page.$('text=Story generation completed successfully');
      if (completedElement) {
        console.log('✅ Story generation completed successfully');
        break;
      }

      // Check for error states in the UI
      const errorElement = await page.$('.text-red-600');
      if (errorElement) {
        const errorText = await errorElement.textContent();
        if (errorText && errorText.length > 0) {
          errorOccurred = true;
          errorMessage = errorText;
          console.log('❌ Error detected:', errorMessage);
          break;
        }
      }

      // Check progress steps for errors
      const errorSteps = await page.$$('text=error');
      if (errorSteps.length > 0) {
        errorOccurred = true;
        errorMessage = 'Generation step failed';
        console.log('❌ Error step detected');
        break;
      }

      await page.waitForTimeout(1000); // Wait 1 second before checking again
    }

    // Assert no errors occurred
    expect(errorOccurred).toBe(false);
    if (errorOccurred) {
      throw new Error(`Story generation failed: ${errorMessage}`);
    }

    // Verify all phases completed successfully
    const phases = [
      'Story Foundation',
      'Three-Act Structure',
      'Characters',
      'Settings',
      'Chapters & Scenes',
      'Visual Generation'
    ];

    for (const phase of phases) {
      const phaseElement = await page.$(`text=${phase}`);
      expect(phaseElement).not.toBeNull();
    }

    console.log('✅ All generation phases verified');
  });
});