#!/usr/bin/env node

// Test the new AI SDK tool-based story analyzer
async function testStoryAnalyzer() {
  console.log('🧪 Testing AI SDK Tool-Based Story Analyzer...\n');

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

  const testRequests = [
    "Add a romantic subplot with a mysterious character named Alex",
    "Make this story more action-packed with chase scenes",
    "Add a magical forest setting where important events happen",
    "Show me what Emily looks like as the main character"
  ];

  for (let i = 0; i < testRequests.length; i++) {
    const userRequest = testRequests[i];
    console.log(`📝 Test ${i + 1}: "${userRequest}"`);

    try {
      console.log('   ⏳ Sending request...');

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

        if (result.updatedStoryData) {
          const changes = [];
          if (result.updatedStoryData.title !== testStoryData.title) {
            changes.push(`Title: "${result.updatedStoryData.title}"`);
          }
          if (Object.keys(result.updatedStoryData.chars || {}).length > Object.keys(testStoryData.chars).length) {
            changes.push(`Added ${Object.keys(result.updatedStoryData.chars).length - Object.keys(testStoryData.chars).length} character(s)`);
          }
          if (result.updatedStoryData.places) {
            changes.push(`Added places: ${Object.keys(result.updatedStoryData.places).join(', ')}`);
          }

          if (changes.length > 0) {
            console.log(`   📊 Changes: ${changes.join(', ')}`);
          }
        }

        if (result.imageDescription) {
          console.log(`   🎨 Image requested: ${result.imageDescription}`);
        }

        if (result.reasoning) {
          console.log(`   💭 Reasoning: ${result.reasoning}`);
        }

        // Update testStoryData for next test
        if (result.updatedStoryData) {
          Object.assign(testStoryData, result.updatedStoryData);
        }

      } else {
        console.log('   ❌ Failed:', result.error);
      }

    } catch (error) {
      console.log('   💥 Error:', error.message);
    }

    console.log(); // Empty line for readability
  }

  console.log('🏁 Test completed!');
}

// Run the test
testStoryAnalyzer().catch(console.error);