import { test, expect } from '@playwright/test';

test.describe('Story Save Privilege Fix - Testing', () => {
  test.use({ storageState: '@playwright/.auth/user.json' });

  test('Test correct API endpoint for saving story data', async ({ page }) => {
    console.log('🔍 Testing correct story save API with jong95@gmail.com');

    // Navigate to working chapter ID
    await page.goto('/write/lq0F1cgRH23Hi5Ef0oq66');
    await page.waitForLoadState('networkidle');

    console.log('🔧 Testing with correct /api/stories/[id]/write endpoint');

    // First, let's check what story ID we should be using
    const chapterResponse = await page.request.get('/api/chapters/lq0F1cgRH23Hi5Ef0oq66');
    console.log(`📡 Chapter API Response Status: ${chapterResponse.status()}`);

    if (chapterResponse.status() === 200) {
      const chapterData = await chapterResponse.json();
      console.log(`📝 Chapter Data:`, JSON.stringify(chapterData, null, 2));

      const storyId = chapterData.chapter?.storyId;
      if (storyId) {
        console.log(`📚 Found Story ID: ${storyId}`);

        // Test the story analyzer API first to get updated data
        const analyzerResponse = await page.request.post('/api/story-analyzer', {
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

        console.log(`📡 Story Analyzer Response Status: ${analyzerResponse.status()}`);

        if (analyzerResponse.status() === 200) {
          const analyzerData = await analyzerResponse.json();
          console.log(`📝 Updated Title: ${analyzerData.updatedStoryData?.title}`);

          // Now test the correct save endpoint
          console.log('💾 Testing save with correct API endpoint...');

          const saveResponse = await page.request.patch(`/api/stories/${storyId}/write`, {
            data: {
              storyData: analyzerData.updatedStoryData
            }
          });

          console.log(`💾 Save Response Status: ${saveResponse.status()}`);

          if (saveResponse.status() === 401) {
            console.log('🚨 AUTHENTICATION ERROR - User not authenticated');
            const errorData = await saveResponse.text();
            console.log(`🚨 Error Details: ${errorData}`);
          } else if (saveResponse.status() === 403) {
            console.log('🚨 PRIVILEGE ERROR DETECTED - User not owner of story');
            const errorData = await saveResponse.text();
            console.log(`🚨 Error Details: ${errorData}`);

            // Check who owns this story
            const storyResponse = await page.request.get(`/api/stories/${storyId}`);
            if (storyResponse.status() === 200) {
              const storyData = await storyResponse.json();
              console.log(`👤 Story Owner ID: ${storyData.story?.userId}`);
              console.log(`👤 Current User: ${storyData.story?.user?.email || 'Unknown'}`);
            }
          } else if (saveResponse.status() === 200) {
            console.log('✅ Save operation successful');
            const saveData = await saveResponse.json();
            console.log(`✅ Save Response:`, JSON.stringify(saveData, null, 2));
          } else {
            console.log(`⚠️ Unexpected save response: ${saveResponse.status()}`);
            const errorData = await saveResponse.text();
            console.log(`⚠️ Response: ${errorData}`);
          }
        }
      } else {
        console.log('❌ Could not find story ID from chapter data');
      }
    } else {
      console.log(`❌ Failed to get chapter data: ${chapterResponse.status()}`);
    }

    console.log('🏁 Privilege error investigation completed');
  });
});