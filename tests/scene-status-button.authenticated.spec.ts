import { test, expect } from '@playwright/test';

test.use({
  storageState: '.auth/user.json'
});

test('Scene status button should not be displayed', async ({ page }) => {
  console.log('🧪 Testing scene status button display...');

  // Navigate to the story page
  await page.goto('http://localhost:3000/write/story/jHDY4hevsSqT5Nn4C4ANS');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Take a screenshot for debugging
  await page.screenshot({
    path: 'logs/scene-status-test-initial.png',
    fullPage: true
  });

  // Look for scenes in the story tree
  const scenes = page.locator('[data-testid*="scene"], .scene-item, [class*="scene"]');
  const sceneCount = await scenes.count();

  console.log(`Found ${sceneCount} scenes on the page`);

  if (sceneCount > 0) {
    // Click on the first scene
    const firstScene = scenes.first();
    await firstScene.click();

    // Wait a bit for any UI changes
    await page.waitForTimeout(1000);

    // Take another screenshot after clicking
    await page.screenshot({
      path: 'logs/scene-status-test-after-click.png',
      fullPage: true
    });

    // Check for "Completed" button or status indicators
    const completedButton = page.locator('text="Completed"');
    const statusButton = page.locator('button:has-text("Completed"), [data-testid*="status"], .status-button');

    const completedButtonExists = await completedButton.count() > 0;
    const statusButtonExists = await statusButton.count() > 0;

    console.log(`Completed button found: ${completedButtonExists}`);
    console.log(`Status button found: ${statusButtonExists}`);

    if (completedButtonExists || statusButtonExists) {
      console.log('❌ Scene status button is being displayed when it should not be');

      // Get the text content for debugging
      if (completedButtonExists) {
        const buttonText = await completedButton.textContent();
        console.log(`Completed button text: ${buttonText}`);
      }

      if (statusButtonExists) {
        const statusText = await statusButton.textContent();
        console.log(`Status button text: ${statusText}`);
      }

      expect(completedButtonExists).toBe(false);
      expect(statusButtonExists).toBe(false);
    } else {
      console.log('✅ No scene status button found - this is correct');
    }
  } else {
    console.log('⚠️ No scenes found on the page');
  }
});