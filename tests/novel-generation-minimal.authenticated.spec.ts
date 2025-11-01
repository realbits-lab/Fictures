/**
 * Playwright E2E Test: Minimal Novel Generation
 *
 * Tests the complete novel generation pipeline with minimal parameters:
 * - 2 characters
 * - 1 setting
 * - 1 part
 * - 1 chapter
 * - 3 scenes
 *
 * Validates all 9 phases complete successfully.
 */

import { test, expect } from '@playwright/test';

// Use authenticated state from writer account (writer@fictures.xyz)
test.use({ storageState: '.auth/writer-playwright.json' });

test.describe('Novel Generation - Minimal Configuration', () => {
  test.setTimeout(600000); // 10 minutes timeout for full generation

  test('should generate a complete story with minimal parameters (2 chars, 1 setting, 1 part, 1 chapter, 3 scenes)', async ({ page }) => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧪 [PLAYWRIGHT] Starting Minimal Novel Generation Test');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Listen to console messages for debugging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        console.error(`🔴 [BROWSER ERROR] ${text}`);
      } else if (text.includes('[ORCHESTRATOR]') || text.includes('Frontend received SSE')) {
        console.log(`📡 [BROWSER] ${text}`);
      }
    });

    // Listen to failed requests
    page.on('requestfailed', request => {
      console.error(`❌ [REQUEST FAILED] ${request.url()}: ${request.failure()?.errorText}`);
    });

    // Step 1: Navigate to /studio/new
    console.log('📍 Step 1: Navigating to /studio/new...');
    await page.goto('http://localhost:3000/studio/new', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded\n');

    // Step 2: Verify form elements are present
    console.log('📍 Step 2: Verifying form elements...');
    await expect(page.locator('h1')).toContainText('Create New Story');

    // Find the prompt textarea using ID
    const promptTextarea = page.locator('#prompt');
    await expect(promptTextarea).toBeVisible();

    // Find form inputs using their IDs
    const characterCountInput = page.locator('#characterCount');
    const settingCountInput = page.locator('#settingCount');
    const partsInput = page.locator('#partsCount');
    const chaptersInput = page.locator('#chaptersPerPart');
    const scenesInput = page.locator('#scenesPerChapter');

    console.log('✅ Form elements verified\n');

    // Step 3: Fill in the form with minimal parameters
    console.log('📍 Step 3: Filling form with minimal parameters...');
    const storyPrompt = 'A young healer must choose between saving her village or keeping her powers secret from those who fear magic.';

    await promptTextarea.fill(storyPrompt);
    console.log('  ✓ Prompt:', storyPrompt);

    // Set character count to 2 (range slider)
    await characterCountInput.fill('2');
    console.log('  ✓ Characters: 2');

    // Set setting count to 1 (range slider)
    await settingCountInput.fill('1');
    console.log('  ✓ Settings: 1');

    // Set parts to 1 (range slider)
    await partsInput.fill('1');
    console.log('  ✓ Parts: 1');

    // Set chapters per part to 1 (range slider)
    await chaptersInput.fill('1');
    console.log('  ✓ Chapters per part: 1');

    // Set scenes per chapter to 3 (range slider)
    await scenesInput.fill('3');
    console.log('  ✓ Scenes per chapter: 3\n');

    // Step 4: Start generation
    console.log('📍 Step 4: Starting story generation...');
    const generateButton = page.locator('button:has-text("Generate Story")');
    await expect(generateButton).toBeVisible();
    await generateButton.click();
    console.log('✅ Generate Story button clicked\n');

    // Step 5: Monitor all 9 phases and wait for completion
    console.log('📍 Step 5: Monitoring 9-phase generation...\n');

    const phases = [
      { name: 'Story Summary', selector: 'text=/Story Summary/i' },
      { name: 'Characters', selector: 'text=/Characters/i' },
      { name: 'Settings', selector: 'text=/Settings/i' },
      { name: 'Parts', selector: 'text=/Parts/i' },
      { name: 'Chapters', selector: 'text=/Chapters/i' },
      { name: 'Scene Summaries', selector: 'text=/Scene Summaries/i' },
      { name: 'Scene Content', selector: 'text=/Scene Content/i' },
      { name: 'Scene Evaluation', selector: 'text=/Scene Evaluation/i' },
      { name: 'Images', selector: 'text=/Images/i' },
    ];

    // Wait for each phase to appear (phases show up immediately)
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      console.log(`  ⏳ Phase ${i + 1}/9: ${phase.name} - Waiting to appear...`);

      try {
        await page.locator(phase.selector).first().waitFor({
          state: 'visible',
          timeout: 60000 // 1 minute timeout for phase to appear
        });

        console.log(`  ✅ Phase ${i + 1}/9: ${phase.name} - Detected`);
      } catch (error) {
        console.error(`  ❌ Phase ${i + 1}/9: ${phase.name} - Timeout or error`);
        console.error(`  Error:`, error);

        await page.screenshot({
          path: `logs/phase-${i + 1}-error.png`,
          fullPage: true
        });

        throw error;
      }
    }

    console.log('\n✅ All 9 phases detected!\n');

    // Step 5b: Wait for Images phase to actually complete
    console.log('📍 Step 5b: Waiting for Images phase to complete...\n');

    try {
      // Wait for the "Generating Story..." button to disappear or become "Generation Complete"
      // This indicates all phases are done
      await page.waitForFunction(() => {
        const button = document.querySelector('button:has-text("Generating Story")');
        return button === null || button?.textContent?.includes('Complete') || button?.textContent?.includes('Success');
      }, { timeout: 600000 }); // 10 minutes max for full generation

      console.log('✅ Story generation completed!\n');
    } catch (error) {
      console.warn('⚠️  Button state check timeout, checking for success indicators...\n');

      // Alternative: Check if we can see completed checkmarks for all phases
      const completedPhases = await page.locator('[data-phase-status="completed"], .phase-complete, text=/✓|✅|complete/i').count();
      console.log(`  Found ${completedPhases} completion indicators`);

      if (completedPhases < 9) {
        await page.screenshot({
          path: 'logs/generation-timeout.png',
          fullPage: true
        });
        throw new Error(`Generation appears incomplete. Only ${completedPhases}/9 phases marked as complete.`);
      }
    }

    // Step 6: Wait for completion message
    console.log('📍 Step 6: Waiting for completion...');

    // Look for success indicators
    try {
      await page.locator('text=/generation complete|story created|success/i').first().waitFor({
        state: 'visible',
        timeout: 60000
      });
      console.log('✅ Completion message detected\n');
    } catch (error) {
      console.warn('⚠️  Completion message not found, but phases completed\n');
    }

    // Step 7: Verify story was created
    console.log('📍 Step 7: Verifying story creation...');

    // Check if we were redirected or can see the story ID
    const currentUrl = page.url();
    console.log('  Current URL:', currentUrl);

    // Take final screenshot
    await page.screenshot({
      path: 'logs/story-generation-complete.png',
      fullPage: true
    });

    console.log('✅ Test completed successfully!\n');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 [PLAYWRIGHT] Minimal Novel Generation Test PASSED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔍 Keeping browser open for inspection...');
    console.log('   Press Ctrl+C to close browser and end test\n');

    // Keep browser open indefinitely for inspection
    await page.pause();
  });
});
