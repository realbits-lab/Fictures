import { test, expect } from '@playwright/test';

test.use({
  storageState: '@playwright/.auth/user.json'
});

test.describe('Browser UI Data Persistence Test', () => {
  test('Test actual UI data persistence with real browser interaction', async ({ page }) => {
    console.log('🌐 Testing data persistence with real browser UI interaction');

    // Set up console logging to capture browser logs
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`🖥️ [BROWSER ${type.toUpperCase()}]: ${text}`);
    });

    // Navigate to the write page and wait for full load
    console.log('🌐 Navigating to write page...');
    await page.goto('/write/lq0F1cgRH23Hi5Ef0oq66');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: 'logs/browser-ui-initial.png', fullPage: true });

    console.log('🔍 Looking for any story data on the page...');

    // Look for any story-related content or YAML data
    const storyElements = await page.locator('.story-title, .yaml-title, [data-key="title"], .title, h1, h2, h3').allTextContents();
    console.log(`📝 Found story elements: ${JSON.stringify(storyElements)}`);

    // Look for Story Prompt Writer or any input fields
    const promptInputs = page.locator('input[type="text"], textarea, [contenteditable], [data-testid*="input"], [data-testid*="prompt"]');
    const inputCount = await promptInputs.count();
    console.log(`📝 Found ${inputCount} input elements`);

    if (inputCount > 0) {
      console.log('✅ Found input elements - testing with UI interaction');

      // Try to find and interact with Story Prompt Writer
      const possiblePromptInputs = [
        '[data-testid="prompt-input"]',
        'input[placeholder*="prompt"]',
        'input[placeholder*="change"]',
        'textarea[placeholder*="prompt"]',
        'textarea[placeholder*="change"]',
        'input:visible',
        'textarea:visible'
      ];

      let promptInput = null;
      for (const selector of possiblePromptInputs) {
        const element = page.locator(selector).first();
        if (await element.count() > 0 && await element.isVisible()) {
          promptInput = element;
          console.log(`✅ Found prompt input with selector: ${selector}`);
          break;
        }
      }

      if (promptInput) {
        // Get initial page state
        const initialState = await page.evaluate(() => {
          const titleElements = document.querySelectorAll('.story-title, .yaml-title, [data-key="title"], .title, h1, h2, h3');
          const titles = Array.from(titleElements).map(el => (el.textContent || '').trim()).filter(t => t !== '');

          console.log('📊 Initial page state captured');
          console.log('Initial titles:', titles);

          return {
            titles,
            url: window.location.href,
            timestamp: new Date().toISOString()
          };
        });

        console.log(`📝 Initial titles: ${JSON.stringify(initialState.titles)}`);

        // Enter a prompt to change the title
        const testPrompt = 'change title to make it shorter';
        await promptInput.fill(testPrompt);
        console.log(`✅ Entered prompt: "${testPrompt}"`);

        // Take screenshot after entering prompt
        await page.screenshot({ path: 'logs/browser-ui-prompt-entered.png', fullPage: true });

        // Look for submit button
        const possibleSubmitButtons = [
          '[data-testid="apply-changes-button"]',
          'button:has-text("Submit")',
          'button:has-text("Apply")',
          'button:has-text("Send")',
          'button:has-text("Change")',
          'button[type="submit"]',
          'button:visible'
        ];

        let submitButton = null;
        for (const selector of possibleSubmitButtons) {
          const element = page.locator(selector).first();
          if (await element.count() > 0 && await element.isVisible()) {
            submitButton = element;
            console.log(`✅ Found submit button with selector: ${selector}`);
            break;
          }
        }

        if (submitButton) {
          // Submit the prompt
          await submitButton.click();
          console.log('✅ Clicked submit button');

          // Wait for AI processing
          console.log('⏳ Waiting for AI processing...');
          await page.waitForTimeout(8000);

          // Take screenshot after AI processing
          await page.screenshot({ path: 'logs/browser-ui-after-ai.png', fullPage: true });

          // Capture state after AI processing
          const afterAIState = await page.evaluate(() => {
            const titleElements = document.querySelectorAll('.story-title, .yaml-title, [data-key="title"], .title, h1, h2, h3');
            const titles = Array.from(titleElements).map(el => (el.textContent || '').trim()).filter(t => t !== '');

            console.log('📊 After AI state captured');
            console.log('After AI titles:', titles);

            return {
              titles,
              timestamp: new Date().toISOString()
            };
          });

          console.log(`📝 Titles after AI: ${JSON.stringify(afterAIState.titles)}`);

          // Look for save button
          const possibleSaveButtons = [
            'button:has-text("Save")',
            'button[data-testid="save-button"]',
            'button:has-text("💾")',
            'button:has-text("Save Changes")',
            'button:has-text("Apply Changes")'
          ];

          let saveButton = null;
          for (const selector of possibleSaveButtons) {
            const element = page.locator(selector).first();
            if (await element.count() > 0 && await element.isVisible()) {
              saveButton = element;
              console.log(`✅ Found save button with selector: ${selector}`);
              break;
            }
          }

          if (saveButton) {
            console.log('💾 Clicking save button...');
            await saveButton.click();

            // Wait for save operation
            await page.waitForTimeout(3000);
            console.log('✅ Save operation completed');

            // Take screenshot after save
            await page.screenshot({ path: 'logs/browser-ui-after-save.png', fullPage: true });
          } else {
            console.log('⚠️ No save button found - changes might be auto-saved');
          }

          // Capture state before reload
          const beforeReloadState = await page.evaluate(() => {
            const titleElements = document.querySelectorAll('.story-title, .yaml-title, [data-key="title"], .title, h1, h2, h3');
            const titles = Array.from(titleElements).map(el => (el.textContent || '').trim()).filter(t => t !== '');

            console.log('📊 Before reload state captured');
            console.log('Before reload titles:', titles);

            return {
              titles,
              timestamp: new Date().toISOString()
            };
          });

          console.log(`📝 Titles before reload: ${JSON.stringify(beforeReloadState.titles)}`);

          // Now reload the page to test persistence
          console.log('🔄 Reloading page to test data persistence...');
          await page.reload();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(5000);

          // Take screenshot after reload
          await page.screenshot({ path: 'logs/browser-ui-after-reload.png', fullPage: true });

          // Capture state after reload
          const afterReloadState = await page.evaluate(() => {
            const titleElements = document.querySelectorAll('.story-title, .yaml-title, [data-key="title"], .title, h1, h2, h3');
            const titles = Array.from(titleElements).map(el => (el.textContent || '').trim()).filter(t => t !== '');

            console.log('📊 After reload state captured');
            console.log('After reload titles:', titles);

            return {
              titles,
              timestamp: new Date().toISOString()
            };
          });

          console.log(`📝 Titles after reload: ${JSON.stringify(afterReloadState.titles)}`);

          // Analyze the data persistence
          console.log('\n🔍 ANALYZING DATA PERSISTENCE:');
          console.log(`Initial: ${JSON.stringify(initialState.titles)}`);
          console.log(`After AI: ${JSON.stringify(afterAIState.titles)}`);
          console.log(`Before Reload: ${JSON.stringify(beforeReloadState.titles)}`);
          console.log(`After Reload: ${JSON.stringify(afterReloadState.titles)}`);

          // Check if data was reset
          const initialJson = JSON.stringify(initialState.titles.sort());
          const afterReloadJson = JSON.stringify(afterReloadState.titles.sort());
          const beforeReloadJson = JSON.stringify(beforeReloadState.titles.sort());

          if (afterReloadJson === initialJson && beforeReloadJson !== initialJson) {
            console.log('🚨 DATA RESET CONFIRMED - Data reverted to initial state after reload!');
            console.log('🚨 The save operation did not persist the changes');
          } else if (afterReloadJson === beforeReloadJson) {
            console.log('✅ DATA PERSISTED - Changes maintained after reload');
          } else {
            console.log('⚠️ UNEXPECTED DATA STATE - Data changed in unexpected way');
          }

        } else {
          console.log('❌ No submit button found');
        }

      } else {
        console.log('❌ No prompt input found');
      }

    } else {
      console.log('⚠️ No input elements found on page');
    }

    // Final screenshot
    await page.screenshot({ path: 'logs/browser-ui-final.png', fullPage: true });

    console.log('🏁 Browser UI data persistence test completed');
  });
});