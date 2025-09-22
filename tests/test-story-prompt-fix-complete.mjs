/**
 * Test script to verify that "complete story data" now fills all missing fields
 * including setting, serial, and hooks that were previously missing.
 */

console.log('🧪 Testing Story Prompt Writer - Complete Data Fix...\n');

// Sample incomplete story data (similar to what would be in the UI)
const incompleteStoryData = {
  title: "Test Story",
  genre: "fantasy",
  words: 50000,
  question: "",
  goal: "",
  conflict: "",
  outcome: "",
  chars: {},
  themes: [],
  structure: {
    type: "3_part",
    parts: ["setup", "confrontation", "resolution"],
    dist: [25, 50, 25]
  },
  parts: []
  // Missing: setting, serial, hooks (these were the problem!)
};

async function testStoryPromptWriter() {
  try {
    console.log('📝 Test 1: Testing "complete story data" request');

    const response = await fetch('http://localhost:3000/api/story-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyYaml: `story:
  title: "${incompleteStoryData.title}"
  genre: "${incompleteStoryData.genre}"
  words: ${incompleteStoryData.words}
  question: "${incompleteStoryData.question}"
  goal: "${incompleteStoryData.goal}"
  conflict: "${incompleteStoryData.conflict}"
  outcome: "${incompleteStoryData.outcome}"
  chars: {}
  themes: []
  structure:
    type: "${incompleteStoryData.structure.type}"
    parts: [${incompleteStoryData.structure.parts.map(p => `"${p}"`).join(', ')}]
    dist: [${incompleteStoryData.structure.dist.join(', ')}]
  setting:
    primary: []
    secondary: []
  parts: []
  serial:
    schedule: "weekly"
    duration: "6 months"
    chapter_words: 3000
    breaks: []
    buffer: "2 weeks"
  hooks:
    overarching: []
    mysteries: []
    part_endings: []`,
        userRequest: 'complete story data'
      })
    });

    if (!response.ok) {
      console.error('❌ Response Status:', response.status);
      const errorText = await response.text();
      console.error('❌ Error:', errorText);
      return;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ API Error:', result.error);
      return;
    }

    console.log('✅ Response Status: SUCCESS');
    console.log('✅ Request Type:', result.requestType);
    console.log('✅ Response Type:', result.responseType);

    if (result.updatedStoryData) {
      const story = result.updatedStoryData;

      console.log('\n📊 **FIELD COMPLETION CHECK:**');

      // Check the fields that were previously missing
      console.log('🔍 Setting:', story.setting ? '✅ PRESENT' : '❌ MISSING');
      if (story.setting) {
        console.log('   - Primary locations:', Array.isArray(story.setting.primary) ? story.setting.primary.length : 0);
        console.log('   - Secondary locations:', Array.isArray(story.setting.secondary) ? story.setting.secondary.length : 0);
      }

      console.log('🔍 Serial:', story.serial ? '✅ PRESENT' : '❌ MISSING');
      if (story.serial) {
        console.log('   - Schedule:', story.serial.schedule || 'not set');
        console.log('   - Duration:', story.serial.duration || 'not set');
        console.log('   - Chapter words:', story.serial.chapter_words || 'not set');
      }

      console.log('🔍 Hooks:', story.hooks ? '✅ PRESENT' : '❌ MISSING');
      if (story.hooks) {
        console.log('   - Overarching:', Array.isArray(story.hooks.overarching) ? story.hooks.overarching.length : 0);
        console.log('   - Mysteries:', Array.isArray(story.hooks.mysteries) ? story.hooks.mysteries.length : 0);
        console.log('   - Part endings:', Array.isArray(story.hooks.part_endings) ? story.hooks.part_endings.length : 0);
      }

      console.log('🔍 Parts:', Array.isArray(story.parts) ? `✅ ${story.parts.length} parts` : '❌ MISSING');
      console.log('🔍 Characters:', story.chars ? `✅ ${Object.keys(story.chars).length} characters` : '❌ MISSING');
      console.log('🔍 Themes:', Array.isArray(story.themes) ? `✅ ${story.themes.length} themes` : '❌ MISSING');

      // Check basic fields completion
      const basicFields = ['question', 'goal', 'conflict', 'outcome'];
      console.log('\n📋 **BASIC FIELDS COMPLETION:**');
      basicFields.forEach(field => {
        const value = story[field];
        console.log(`🔍 ${field}:`, value && value.trim() ? '✅ COMPLETED' : '❌ EMPTY');
      });

      console.log('\n🎉 **SUMMARY:**');
      const hasAllSections = story.setting && story.serial && story.hooks;
      console.log('All required sections present:', hasAllSections ? '✅ YES' : '❌ NO');

      if (hasAllSections) {
        console.log('🎊 **SUCCESS! All previously missing fields are now included.**');
      } else {
        console.log('⚠️ **Still missing some fields. Fix needs more work.**');
      }

    } else {
      console.log('❌ No updated story data returned');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testStoryPromptWriter().then(() => {
  console.log('\n🏁 **TEST COMPLETED!**');
}).catch(error => {
  console.error('💥 Test crashed:', error);
});