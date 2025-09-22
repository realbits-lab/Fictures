import { chromium } from 'playwright';

console.log('🧪 Testing complete coverImage persistence fix...');

async function testCompleteFix() {
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
    const initialPropertiesLocator = page.locator('text=Story YAML Data').first();
    await initialPropertiesLocator.waitFor({ timeout: 10000 });
    const initialPropertiesText = await initialPropertiesLocator.textContent();
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

      // Check properties count after image save
      const afterImageSaveText = await page.locator('text=Story YAML Data').first().textContent();
      const afterImageSaveMatch = afterImageSaveText?.match(/(\d+) properties/);
      const afterImageSaveCount = afterImageSaveMatch ? parseInt(afterImageSaveMatch[1]) : 0;
      console.log('📊 Properties after image save:', afterImageSaveCount);

      // Click Save Changes
      const saveChangesButton = await page.locator('button:has-text("💾 Save Changes")').isVisible();
      console.log('💾 Save Changes button visible:', saveChangesButton);

      if (saveChangesButton) {
        console.log('💾 Clicking Save Changes button...');
        await page.click('button:has-text("💾 Save Changes")');
        await page.waitForTimeout(3000);
        console.log('✅ Save operation completed');

        // Check properties count after database save
        const afterSavePropertiesText = await page.locator('text=Story YAML Data').first().textContent();
        const afterSaveMatch = afterSavePropertiesText?.match(/(\d+) properties/);
        const afterSaveCount = afterSaveMatch ? parseInt(afterSaveMatch[1]) : 0;
        console.log('📊 Properties after database save:', afterSaveCount);

        // Navigate away and back to test persistence
        console.log('🔄 Testing persistence by navigating away and back...');
        await page.goto('http://localhost:3000/stories');
        await page.waitForTimeout(2000);

        await page.click('button:has-text("📝 Write")');
        await page.waitForTimeout(3000);

        // Check properties count after reload
        const afterReloadText = await page.locator('text=Story YAML Data').first().textContent();
        const afterReloadMatch = afterReloadText?.match(/(\d+) properties/);
        const afterReloadCount = afterReloadMatch ? parseInt(afterReloadMatch[1]) : 0;
        console.log('📊 Properties after reload:', afterReloadCount);

        // Final assessment
        console.log('\n🔍 PERSISTENCE TEST RESULTS:');
        console.log(`   Initial properties: ${initialCount}`);
        console.log(`   After image save: ${afterImageSaveCount}`);
        console.log(`   After database save: ${afterSaveCount}`);
        console.log(`   After page reload: ${afterReloadCount}`);

        if (afterReloadCount === afterSaveCount && afterReloadCount > initialCount) {
          console.log('\n✅ SUCCESS: CoverImage data persisted correctly!');
          console.log('   ✓ Image generation worked');
          console.log('   ✓ Database save worked');
          console.log('   ✓ Data persisted after reload');
        } else {
          console.log('\n❌ FAILURE: CoverImage data did not persist');
          if (afterSaveCount > initialCount) {
            console.log('   ✓ Image generation worked');
            console.log('   ✓ Temporary UI update worked');
            console.log('   ❌ Database persistence failed');
          } else {
            console.log('   ❌ Database save failed');
          }
        }

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

testCompleteFix();