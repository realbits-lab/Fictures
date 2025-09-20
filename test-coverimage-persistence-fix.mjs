import { chromium } from 'playwright';

console.log('🧪 Testing coverImage persistence fix with browser session...');

async function testCoverImagePersistenceFix() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });
  const page = await context.newPage();

  try {
    // Navigate to story
    console.log('📖 Navigating to story...');
    await page.goto('http://localhost:3000/write/_ji5WFr8lQe8b7eTfrck-');
    await page.waitForTimeout(3000);

    // Check initial properties count
    const initialPropertiesText = await page.textContent('text=Story YAML Data');
    const initialMatch = initialPropertiesText?.match(/(\d+) properties/);
    const initialCount = initialMatch ? parseInt(initialMatch[1]) : 0;
    console.log('📊 Initial properties count:', initialCount);

    // Input test prompt for image generation
    console.log('🎨 Requesting image generation for implicit character...');
    await page.fill('[data-testid="prompt-input"]', 'Generate character image for the mysterious AI assistant');
    await page.click('[data-testid="apply-changes-button"]');

    // Wait for completion
    await page.waitForTimeout(8000);

    // Check if Save Image button appears
    const saveImageButton = await page.locator('button:has-text("Save Image")').isVisible();
    console.log('💾 Save Image button visible:', saveImageButton);

    if (saveImageButton) {
      // Click Save Image
      console.log('💾 Clicking Save Image button...');
      await page.click('button:has-text("Save Image")');
      await page.waitForTimeout(2000);

      // Click Save Changes
      const saveChangesButton = await page.locator('button:has-text("💾 Save Changes")').isVisible();
      console.log('💾 Save Changes button visible:', saveChangesButton);

      if (saveChangesButton) {
        console.log('💾 Clicking Save Changes button...');
        await page.click('button:has-text("💾 Save Changes")');
        await page.waitForTimeout(3000);
        console.log('✅ Save operation completed');

        // Check properties count after save
        const afterSavePropertiesText = await page.textContent('text=Story YAML Data');
        const afterSaveMatch = afterSavePropertiesText?.match(/(\d+) properties/);
        const afterSaveCount = afterSaveMatch ? parseInt(afterSaveMatch[1]) : 0;
        console.log('📊 Properties after save:', afterSaveCount);

        // Navigate away and back to test persistence
        console.log('🔄 Testing persistence by navigating away and back...');
        await page.goto('http://localhost:3000/stories');
        await page.waitForTimeout(2000);

        await page.click('button:has-text("📝 Write")');
        await page.waitForTimeout(3000);

        // Check properties count after reload
        const afterReloadPropertiesText = await page.textContent('text=Story YAML Data');
        const afterReloadMatch = afterReloadPropertiesText?.match(/(\d+) properties/);
        const afterReloadCount = afterReloadMatch ? parseInt(afterReloadMatch[1]) : 0;
        console.log('📊 Properties after reload:', afterReloadCount);

        // Check if coverImage persisted
        if (afterReloadCount === afterSaveCount && afterReloadCount > initialCount) {
          console.log('✅ SUCCESS: CoverImage data persisted correctly!');
          console.log(`   Initial: ${initialCount} → After save: ${afterSaveCount} → After reload: ${afterReloadCount}`);
        } else {
          console.log('❌ FAILURE: CoverImage data did not persist');
          console.log(`   Initial: ${initialCount} → After save: ${afterSaveCount} → After reload: ${afterReloadCount}`);
        }

        // Take a screenshot for verification
        await page.screenshot({ path: '.playwright-mcp/story-page-after-fix.png', fullPage: true });
        console.log('📸 Screenshot saved: .playwright-mcp/story-page-after-fix.png');

      } else {
        console.log('❌ Save Changes button not found');
      }
    } else {
      console.log('❌ Save Image button not found');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testCoverImagePersistenceFix();