#!/usr/bin/env node

/**
 * Test GPT-5 Story Specification Integration
 * Tests the updated story-analyzer API with GPT-5 and comprehensive story specification
 */

const testStoryYAML = `
story:
  title: "Test Story"
  genre: "fantasy"
  words: 0
  question: ""
  goal: ""
  conflict: ""
  outcome: ""
  chars: {}
  themes: []
  structure:
    type: ""
    parts: []
    dist: []
  setting:
    primary: []
    secondary: []
  parts: []
  serial:
    schedule: ""
    duration: ""
    chapter_words: 0
    breaks: []
    buffer: ""
  hooks:
    overarching: []
    mysteries: []
    part_endings: []
`;

async function testGPT5StoryCompletion() {
  console.log('🧪 Testing GPT-5 Story Specification Integration...\n');

  const testCases = [
    {
      name: 'Complete Story Data Request',
      userRequest: 'complete story data',
      description: 'Tests GPT-5 ability to fill ALL missing story elements using story specification'
    },
    {
      name: 'Creative Story Development',
      userRequest: 'create a compelling urban fantasy story about a photographer who discovers magic',
      description: 'Tests GPT-5 creative reasoning for comprehensive story creation'
    },
    {
      name: 'Serial Fiction Planning',
      userRequest: 'design this as a weekly web serial with strong reader engagement hooks',
      description: 'Tests GPT-5 understanding of serial publication strategy'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log(`💬 Request: "${testCase.userRequest}"`);
    console.log(`⏱️  Testing...`);

    try {
      const response = await fetch('http://localhost:3000/api/story-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyYaml: testStoryYAML,
          userRequest: testCase.userRequest
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      console.log(`✅ Success: ${result.success}`);
      console.log(`🔧 Tools Used: ${result.toolsUsed?.join(', ') || 'none'}`);
      console.log(`📊 Response Type: ${result.responseType || 'unknown'}`);

      if (result.updatedStoryData) {
        const story = result.updatedStoryData;
        console.log(`\n📈 Story Analysis Results:`);
        console.log(`   • Title: ${story.title || 'missing'}`);
        console.log(`   • Genre: ${story.genre || 'missing'}`);
        console.log(`   • Word Count: ${story.words || 0}`);
        console.log(`   • Characters: ${story.chars ? Object.keys(story.chars).length : 0}`);
        console.log(`   • Themes: ${story.themes ? story.themes.length : 0}`);
        console.log(`   • Parts: ${story.parts ? story.parts.length : 0}`);
        console.log(`   • Primary Settings: ${story.setting?.primary ? story.setting.primary.length : 0}`);
        console.log(`   • Serial Schedule: ${story.serial?.schedule || 'missing'}`);
        console.log(`   • Hooks: ${story.hooks?.overarching ? story.hooks.overarching.length : 0} overarching`);

        // Check completion level for "complete story data" request
        if (testCase.userRequest === 'complete story data') {
          const completionScore = calculateCompletionScore(story);
          console.log(`   • Completion Score: ${completionScore}% (${completionScore >= 90 ? '✅ Excellent' : completionScore >= 70 ? '⚠️ Good' : '❌ Needs Work'})`);
        }
      }

      if (result.error) {
        console.log(`❌ Error: ${result.error}`);
      }

      console.log(`─────────────────────────────────────────────────`);

    } catch (error) {
      console.error(`❌ Test Failed: ${error.message}`);
      console.log(`─────────────────────────────────────────────────`);
    }
  }
}

function calculateCompletionScore(story) {
  const checks = [
    { field: 'title', check: () => story.title && story.title.length > 0 },
    { field: 'genre', check: () => story.genre && story.genre.length > 0 },
    { field: 'words', check: () => story.words && story.words > 0 },
    { field: 'question', check: () => story.question && story.question.length > 0 },
    { field: 'goal', check: () => story.goal && story.goal.length > 0 },
    { field: 'conflict', check: () => story.conflict && story.conflict.length > 0 },
    { field: 'outcome', check: () => story.outcome && story.outcome.length > 0 },
    { field: 'chars', check: () => story.chars && Object.keys(story.chars).length > 0 },
    { field: 'themes', check: () => story.themes && story.themes.length > 0 },
    { field: 'structure.type', check: () => story.structure?.type && story.structure.type.length > 0 },
    { field: 'parts', check: () => story.parts && story.parts.length > 0 },
    { field: 'setting.primary', check: () => story.setting?.primary && story.setting.primary.length > 0 },
    { field: 'serial.schedule', check: () => story.serial?.schedule && story.serial.schedule.length > 0 },
    { field: 'hooks.overarching', check: () => story.hooks?.overarching && story.hooks.overarching.length > 0 },
    { field: 'hooks.mysteries', check: () => story.hooks?.mysteries && story.hooks.mysteries.length > 0 }
  ];

  const completed = checks.filter(check => check.check()).length;
  return Math.round((completed / checks.length) * 100);
}

// Wait for server to start
console.log('⏳ Waiting for server to start...');
setTimeout(testGPT5StoryCompletion, 5000);