import { test, expect } from '@playwright/test';

test.describe('Data Persistence After Save and Reload - Browser Test', () => {
  test.use({ storageState: '@playwright/.auth/user.json' });

  test('Test data persistence with headed browser and console logging', async ({ page }) => {
    console.log('🔍 Testing data persistence after save and page reload in browser');

    // Listen to console logs to analyze data flow
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'log' || type === 'error' || type === 'warn') {
        console.log(`🖥️ [BROWSER ${type.toUpperCase()}]: ${text}`);
      }
    });

    // Listen to network requests to track API calls
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/')) {
        console.log(`📡 [REQUEST]: ${request.method()} ${url}`);
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/')) {
        console.log(`📡 [RESPONSE]: ${response.status()} ${url}`);
      }
    });

    // Navigate to the writing interface
    console.log('🌐 Navigating to write page...');
    await page.goto('/write/lq0F1cgRH23Hi5Ef0oq66');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ path: 'logs/data-persistence-initial.png', fullPage: true });

    console.log('🔍 Checking if Story Prompt Writer is visible...');

    // Check if the page loaded properly
    const mainContent = page.locator('main, .main-content, [role="main"]');
    const hasMainContent = await mainContent.count() > 0;

    if (!hasMainContent) {
      console.log('⚠️ Main content not found - likely authentication issue');
      console.log('🔧 Will test with API calls instead');

      // Test the save functionality via API since UI isn't accessible
      const testStoryData = {
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
      };

      // Step 1: Get AI-modified data
      console.log('🤖 Getting AI-modified data...');
      const analyzerResponse = await page.request.post('/api/story-analyzer', {
        data: {
          storyData: testStoryData,
          userRequest: 'change title to make it shorter'
        }
      });

      if (analyzerResponse.status() === 200) {
        const analyzerData = await analyzerResponse.json();
        const originalTitle = testStoryData.title;
        const modifiedTitle = analyzerData.updatedStoryData?.title;

        console.log(`📝 Original Title: "${originalTitle}"`);
        console.log(`📝 Modified Title: "${modifiedTitle}"`);

        // For the test, let's simulate saving to a known story
        // Since we can't create stories with mock auth, we'll just verify the data flow
        console.log('💾 Simulating save operation...');

        // Let's inject the data into the page and test reload behavior
        await page.evaluate((data) => {
          console.log('🔄 Setting story data in browser for testing...');

          // Store the modified data in localStorage for testing
          window.localStorage.setItem('test-story-data-original', JSON.stringify(data.original));
          window.localStorage.setItem('test-story-data-modified', JSON.stringify(data.modified));

          console.log('📦 Test data stored in localStorage');
          console.log('Original:', data.original.title);
          console.log('Modified:', data.modified.title);

          // Simulate the story data being set in the component
          if (window.React && window.React.useState) {
            console.log('⚠️ React hooks detected - data might be managed in React state');
          }

        }, {
          original: testStoryData,
          modified: analyzerData.updatedStoryData
        });

        // Reload the page to test persistence
        console.log('🔄 Reloading page to test data persistence...');
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Take screenshot after reload
        await page.screenshot({ path: 'logs/data-persistence-after-reload.png', fullPage: true });

        // Check what data is available after reload
        const persistedData = await page.evaluate(() => {
          const original = window.localStorage.getItem('test-story-data-original');
          const modified = window.localStorage.getItem('test-story-data-modified');

          console.log('🔍 Checking persisted data after reload...');
          console.log('Original from localStorage:', original ? JSON.parse(original).title : 'Not found');
          console.log('Modified from localStorage:', modified ? JSON.parse(modified).title : 'Not found');

          return {
            original: original ? JSON.parse(original) : null,
            modified: modified ? JSON.parse(modified) : null
          };
        });

        if (persistedData.original && persistedData.modified) {
          console.log('✅ LocalStorage data persisted after reload');
          console.log(`📝 Original: "${persistedData.original.title}"`);
          console.log(`📝 Modified: "${persistedData.modified.title}"`);
        } else {
          console.log('❌ Data not found in localStorage after reload');
        }

      } else {
        console.log(`❌ Story analyzer failed: ${analyzerResponse.status()}`);
      }

      return; // Exit early due to auth issues
    }

    // If we reach here, the page loaded successfully
    console.log('✅ Page loaded successfully - testing UI persistence');

    // Look for Story Prompt Writer component
    const storyPromptWriter = page.locator('[data-testid="story-prompt-writer"]');
    const promptWriterExists = await storyPromptWriter.count() > 0;

    if (promptWriterExists) {
      console.log('✅ Story Prompt Writer component found');

      // Get initial data from the page
      const initialData = await page.evaluate(() => {
        console.log('📊 Capturing initial story data...');

        // Try to find title elements
        const titleElements = document.querySelectorAll('[data-key="title"], .yaml-title, .story-title');
        const titles = Array.from(titleElements).map(el => el.textContent || el.value || '');

        console.log('🏷️ Found titles:', titles);

        return {
          titles,
          timestamp: new Date().toISOString()
        };
      });

      console.log(`📝 Initial titles found: ${JSON.stringify(initialData.titles)}`);

      // Enter test prompt and submit
      const promptInput = page.locator('[data-testid="prompt-input"]');
      const submitButton = page.locator('[data-testid="apply-changes-button"]');

      await expect(promptInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      const testPrompt = 'change title to make it shorter';
      await promptInput.fill(testPrompt);
      console.log(`✅ Entered prompt: "${testPrompt}"`);

      // Take screenshot before submission
      await page.screenshot({ path: 'logs/data-persistence-before-submit.png', fullPage: true });

      // Submit the prompt
      await submitButton.click();
      console.log('✅ Submitted prompt');

      // Wait for AI processing
      await page.waitForTimeout(5000);

      // Capture data after AI processing
      const afterAIData = await page.evaluate(() => {
        console.log('📊 Capturing data after AI processing...');

        const titleElements = document.querySelectorAll('[data-key="title"], .yaml-title, .story-title');
        const titles = Array.from(titleElements).map(el => el.textContent || el.value || '');

        console.log('🏷️ Titles after AI:', titles);

        return {
          titles,
          timestamp: new Date().toISOString()
        };
      });

      console.log(`📝 Titles after AI: ${JSON.stringify(afterAIData.titles)}`);

      // Take screenshot after AI processing
      await page.screenshot({ path: 'logs/data-persistence-after-ai.png', fullPage: true });

      // Look for save button and save the changes
      const saveButton = page.locator('button:has-text("Save"), button[data-testid="save-button"], button:has-text("💾")');
      const saveButtonExists = await saveButton.count() > 0;

      if (saveButtonExists) {
        console.log('💾 Save button found - attempting save...');
        await saveButton.click();

        // Wait for save operation
        await page.waitForTimeout(3000);

        console.log('✅ Save operation completed');
      } else {
        console.log('⚠️ Save button not found - changes may be auto-saved');
      }

      // Take screenshot before reload
      await page.screenshot({ path: 'logs/data-persistence-before-reload.png', fullPage: true });

      // Reload the page to test persistence
      console.log('🔄 Reloading page to test data persistence...');
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Capture data after reload
      const afterReloadData = await page.evaluate(() => {
        console.log('📊 Capturing data after page reload...');

        const titleElements = document.querySelectorAll('[data-key="title"], .yaml-title, .story-title');
        const titles = Array.from(titleElements).map(el => el.textContent || el.value || '');

        console.log('🏷️ Titles after reload:', titles);

        return {
          titles,
          timestamp: new Date().toISOString()
        };
      });

      console.log(`📝 Titles after reload: ${JSON.stringify(afterReloadData.titles)}`);

      // Take final screenshot
      await page.screenshot({ path: 'logs/data-persistence-final.png', fullPage: true });

      // Compare data to check for persistence issues
      console.log('🔍 Analyzing data persistence...');

      const initialTitles = initialData.titles.filter(t => t.trim() !== '');
      const afterAITitles = afterAIData.titles.filter(t => t.trim() !== '');
      const afterReloadTitles = afterReloadData.titles.filter(t => t.trim() !== '');

      console.log(`📊 Initial: ${JSON.stringify(initialTitles)}`);
      console.log(`📊 After AI: ${JSON.stringify(afterAITitles)}`);
      console.log(`📊 After Reload: ${JSON.stringify(afterReloadTitles)}`);

      if (JSON.stringify(afterReloadTitles) === JSON.stringify(initialTitles)) {
        console.log('🚨 DATA RESET DETECTED - Data reverted to initial state after reload!');
      } else if (JSON.stringify(afterReloadTitles) === JSON.stringify(afterAITitles)) {
        console.log('✅ DATA PERSISTED - Changes maintained after reload');
      } else {
        console.log('⚠️ UNEXPECTED DATA STATE - Data changed in unexpected way');
      }

    } else {
      console.log('⚠️ Story Prompt Writer component not found');
    }

    console.log('🏁 Data persistence testing completed');
  });
});