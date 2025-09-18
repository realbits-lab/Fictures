import { test, expect } from '@playwright/test';

test.describe('Story Prompt Writer - Save Error Testing', () => {
  test.use({ storageState: '@playwright/.auth/user.json' });

  test('Test privilege error when saving Story Prompt Writer changes', async ({ page }) => {
    console.log('🔍 Testing Story Prompt Writer save functionality with test.user@example.com');

    // Navigate to working chapter ID
    await page.goto('/write/lq0F1cgRH23Hi5Ef0oq66');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot for debugging
    await page.screenshot({ path: 'logs/save-error-initial.png', fullPage: true });

    // Check if we can find the writing interface
    const mainContent = page.locator('main, .main-content, [role="main"]');
    const hasMainContent = await mainContent.count() > 0;

    if (!hasMainContent) {
      console.log('⚠️ No main content found - authentication issue detected');
      console.log('🔧 Testing save functionality via API calls');

      // Test API with actual save request
      const response = await page.request.post('/api/story-analyzer', {
        data: {
          storyData: {
            title: '감정과 이성의 탐정들',
            genre: 'urban_fantasy',
            words: 80000,
            question: 'What drives the detective partners?',
            goal: 'Solve the supernatural mystery',
            conflict: 'Emotion vs logic approach',
            outcome: 'Balance achieved through cooperation',
            chars: {
              protagonist: { role: 'protag', arc: 'denial→acceptance' },
              deuteragonist: { role: 'support', arc: 'logic→emotion' }
            },
            themes: ['partnership', 'balance'],
            structure: { type: '3_part', parts: ['setup', 'investigation', 'resolution'], dist: [25, 50, 25] },
            parts: []
          },
          userRequest: 'change title'
        }
      });

      console.log(`📡 API Response Status: ${response.status()}`);

      if (response.status() === 200) {
        const data = await response.json();
        console.log('✅ Story Analyzer API Working');
        console.log(`📝 Original Title: 감정과 이성의 탐정들`);
        console.log(`📝 Updated Title: ${data.updatedStoryData?.title}`);

        // Now test the save functionality - this might reveal privilege issues
        console.log('💾 Testing save functionality...');

        // Test if we can make a PUT request to update the chapter/story
        const saveResponse = await page.request.put('/api/chapters/lq0F1cgRH23Hi5Ef0oq66', {
          data: {
            storyData: data.updatedStoryData
          }
        });

        console.log(`💾 Save Response Status: ${saveResponse.status()}`);

        if (saveResponse.status() === 401 || saveResponse.status() === 403) {
          console.log('🚨 PRIVILEGE ERROR DETECTED!');
          const errorData = await saveResponse.text();
          console.log(`🚨 Error Details: ${errorData}`);
        } else if (saveResponse.status() === 200) {
          console.log('✅ Save operation successful');
        } else {
          console.log(`⚠️ Unexpected save response: ${saveResponse.status()}`);
          const errorData = await saveResponse.text();
          console.log(`⚠️ Response: ${errorData}`);
        }
      }

      return; // Exit early due to auth issues
    }

    // If we reach here, the page loaded successfully
    console.log('✅ Page loaded successfully - testing UI save functionality');

    // Look for Story Prompt Writer component
    const storyPromptWriter = page.locator('[data-testid="story-prompt-writer"]');
    const promptWriterExists = await storyPromptWriter.count() > 0;

    if (promptWriterExists) {
      console.log('✅ Story Prompt Writer component found');

      // Test input and submit functionality
      const promptInput = page.locator('[data-testid="prompt-input"]');
      const submitButton = page.locator('[data-testid="apply-changes-button"]');

      await expect(promptInput).toBeVisible();
      await expect(submitButton).toBeVisible();
      console.log('✅ UI components visible');

      // Enter test prompt
      const testPrompt = 'change title';
      await promptInput.fill(testPrompt);
      console.log('✅ Prompt "change title" entered');

      // Take screenshot before submission
      await page.screenshot({ path: 'logs/save-error-before-submit.png', fullPage: true });

      // Submit prompt
      await submitButton.click();
      console.log('✅ Prompt submitted');

      // Wait for AI processing
      await page.waitForTimeout(5000);

      // Take screenshot after AI processing
      await page.screenshot({ path: 'logs/save-error-after-ai.png', fullPage: true });

      // Now look for save button and test save functionality
      const saveButton = page.locator('button:has-text("Save"), button[data-testid="save-button"], button:has-text("💾")');
      const saveButtonExists = await saveButton.count() > 0;

      if (saveButtonExists) {
        console.log('💾 Save button found - testing save functionality');

        // Listen for network requests to catch save errors
        page.on('response', response => {
          if (response.url().includes('/api/') && response.status() >= 400) {
            console.log(`🚨 API Error detected: ${response.status()} - ${response.url()}`);
          }
        });

        // Try to save
        await saveButton.click();
        console.log('💾 Save button clicked');

        // Wait for save operation
        await page.waitForTimeout(3000);

        // Take screenshot after save attempt
        await page.screenshot({ path: 'logs/save-error-after-save.png', fullPage: true });

        // Check for error messages
        const errorMessages = page.locator('.error, .alert-error, [role="alert"], .text-red-500, .bg-red-100');
        const errorCount = await errorMessages.count();

        if (errorCount > 0) {
          console.log(`🚨 ${errorCount} error message(s) found on page`);
          for (let i = 0; i < errorCount; i++) {
            const errorText = await errorMessages.nth(i).textContent();
            console.log(`🚨 Error ${i + 1}: ${errorText}`);
          }
        } else {
          console.log('✅ No visible error messages found');
        }

      } else {
        console.log('⚠️ Save button not found');

        // Look for other save-related elements
        const allButtons = page.locator('button');
        const buttonCount = await allButtons.count();
        console.log(`🔍 Found ${buttonCount} buttons on page`);

        for (let i = 0; i < Math.min(buttonCount, 10); i++) {
          const buttonText = await allButtons.nth(i).textContent();
          console.log(`🔍 Button ${i + 1}: "${buttonText}"`);
        }
      }

    } else {
      console.log('⚠️ Story Prompt Writer component not found');
    }

    // Final screenshot
    await page.screenshot({ path: 'logs/save-error-final.png', fullPage: true });
    console.log('🏁 Save error testing completed');
  });
});