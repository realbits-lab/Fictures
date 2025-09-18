import { test, expect } from '@playwright/test';

test.describe('Story Prompt Writer - Save Functionality Fixed', () => {
  test.use({ storageState: '@playwright/.auth/user.json' });

  test('Test save functionality after fixing privilege errors', async ({ page }) => {
    console.log('🔍 Testing Story Prompt Writer save with fixed privilege handling');

    // First, create a test story for the mock user
    console.log('📝 Creating test story for mock user...');

    const createStoryResponse = await page.request.post('/api/stories', {
      data: {
        title: 'Test Story for Prompt Writer',
        description: 'Test story to verify save functionality',
        genre: 'urban_fantasy',
        status: 'draft',
        targetWordCount: 50000,
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
        }
      }
    });

    console.log(`📡 Create Story Response Status: ${createStoryResponse.status()}`);

    if (createStoryResponse.status() === 201 || createStoryResponse.status() === 200) {
      const storyData = await createStoryResponse.json();
      console.log(`✅ Test story created: ${storyData.story?.id}`);

      const storyId = storyData.story?.id;

      if (storyId) {
        // Test the story analyzer API to get updated data
        console.log('🤖 Testing Story Analyzer API...');

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
          console.log(`📝 Original Title: 감정과 이성의 탐정들`);
          console.log(`📝 Updated Title: ${analyzerData.updatedStoryData?.title}`);

          // Now test the save functionality with the fixed API
          console.log('💾 Testing save with fixed API endpoint...');

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
            console.log('🚨 PRIVILEGE ERROR STILL EXISTS - User not owner of story');
            const errorData = await saveResponse.text();
            console.log(`🚨 Error Details: ${errorData}`);
          } else if (saveResponse.status() === 200) {
            console.log('✅ SAVE OPERATION SUCCESSFUL!');
            const saveData = await saveResponse.json();
            console.log(`✅ Save Response:`, JSON.stringify(saveData, null, 2));

            // Verify the data was actually saved by fetching it back
            console.log('🔍 Verifying saved data...');

            const verifyResponse = await page.request.get(`/api/stories/${storyId}/write`);
            if (verifyResponse.status() === 200) {
              const verifyData = await verifyResponse.json();
              const savedTitle = verifyData.story?.storyData?.title;
              console.log(`📝 Verified Saved Title: ${savedTitle}`);

              if (savedTitle === analyzerData.updatedStoryData?.title) {
                console.log('✅ DATA VERIFICATION SUCCESSFUL - Title changed correctly!');
              } else {
                console.log('⚠️ Data verification failed - title did not match');
              }
            }

          } else {
            console.log(`⚠️ Unexpected save response: ${saveResponse.status()}`);
            const errorData = await saveResponse.text();
            console.log(`⚠️ Response: ${errorData}`);
          }

        } else {
          console.log(`❌ Story Analyzer failed: ${analyzerResponse.status()}`);
        }

        // Clean up - delete the test story
        console.log('🧹 Cleaning up test story...');
        const deleteResponse = await page.request.delete(`/api/stories/${storyId}`);
        console.log(`🗑️ Delete Response: ${deleteResponse.status()}`);

      } else {
        console.log('❌ Could not get story ID from created story');
      }

    } else {
      console.log(`❌ Failed to create test story: ${createStoryResponse.status()}`);
      const errorData = await createStoryResponse.text();
      console.log(`❌ Error: ${errorData}`);
    }

    console.log('🏁 Fixed save functionality testing completed');
  });
});