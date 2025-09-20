#!/usr/bin/env node

// Test the new image generation feature with DALL-E 3
async function testImageGeneration() {
  console.log('🎨 Testing DALL-E 3 Image Generation Feature...\n');

  const testStoryData = {
    title: "The Enchanted Library",
    genre: "urban_fantasy",
    words: 80000,
    question: "Can Emily save the magical library before it's destroyed?",
    goal: "Find the lost grimoire",
    conflict: "Dark forces seek to destroy the library",
    outcome: "Emily must choose between power and friendship",
    chars: {
      "Emily": { role: "protagonist", arc: "hero's journey" },
      "Marcus": { role: "mentor", arc: "guide" }
    },
    themes: ["friendship", "sacrifice", "knowledge"],
    structure: { type: "3_part", parts: ["setup", "confrontation", "resolution"], dist: [25, 50, 25] },
    parts: [
      { part: 1, goal: "Discover the library", conflict: "Mysterious entrance", tension: "Growing curiosity" }
    ]
  };

  const imageRequests = [
    "Show me what Emily looks like as the main character",
    "Generate an image of the magical library entrance",
    "Create a picture of Marcus the wise mentor"
  ];

  for (let i = 0; i < imageRequests.length; i++) {
    const userRequest = imageRequests[i];
    console.log(`🎨 Image Test ${i + 1}: "${userRequest}"`);

    try {
      console.log('   ⏳ Generating image with DALL-E 3...');

      const response = await fetch('http://localhost:3000/api/story-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyData: testStoryData,
          userRequest: userRequest
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('   ✅ Success!');
        console.log(`   🤖 Tools used: ${result.toolsUsed?.join(', ') || 'none'}`);
        console.log(`   📝 Response type: ${result.responseType}`);

        if (result.generatedImageUrl) {
          console.log('   🎨 ✨ DALL-E 3 Image Generated Successfully!');
          console.log(`   🔗 Image URL: ${result.generatedImageUrl}`);
          console.log(`   🎯 Subject: ${result.subject}`);
          console.log(`   🎭 Type: ${result.imageType}`);
          console.log(`   🖌️ Style: ${result.style}`);
          console.log(`   📖 Description: ${result.imageDescription}`);
          console.log(`   💭 Is Preview: ${result.isImagePreview ? 'Yes (needs Save/Cancel)' : 'No'}`);
        } else if (result.imageError) {
          console.log('   ❌ Image Generation Failed');
          console.log(`   💥 Error: ${result.imageError}`);
        } else {
          console.log('   ℹ️ Text description only (no image generated)');
          console.log(`   📖 Description: ${result.imageDescription}`);
        }

      } else {
        console.log('   ❌ Request Failed:', result.error);
      }

    } catch (error) {
      console.log('   💥 Error:', error.message);
    }

    console.log(); // Empty line for readability

    // Add delay between requests to avoid rate limits
    if (i < imageRequests.length - 1) {
      console.log('   ⏱️ Waiting 3 seconds before next request...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('🏁 Image Generation Test Completed!');
  console.log('\n📋 Test Summary:');
  console.log('- Frontend should show image preview with Save/Cancel buttons');
  console.log('- Save button stores image permanently');
  console.log('- Cancel button discards the preview');
  console.log('- Same workflow as YAML data changes');
}

// Run the test
testImageGeneration().catch(console.error);