#!/usr/bin/env node

import fetch from 'node-fetch';

// Test data
const testStoryData = {
  story: {
    id: "story_1",
    title: "The Last Lighthouse Keeper",
    description: "A mysterious tale of isolation and redemption",
    genre: "Mystery/Drama",
    premise: "An aging lighthouse keeper discovers messages from the future washing ashore",
    dramaticQuestion: "Will he be able to prevent the catastrophe the messages warn about?",
    theme: "The power of individual action against fate",
    targetWordCount: 50000,
    currentWordCount: 0
  },
  parts: [
    {
      id: "part_1",
      title: "The Discovery",
      description: "Strange messages begin appearing",
      storyId: "story_1",
      orderIndex: 0,
      structuralRole: "Setup",
      summary: "Introduction to the lighthouse keeper and the first mysterious messages"
    },
    {
      id: "part_2",
      title: "The Investigation",
      storyId: "story_1",
      orderIndex: 1,
      // Missing description and structural role to test warnings
    }
  ],
  chapters: [
    {
      id: "chapter_1",
      title: "Solitary Dawn",
      summary: "The keeper begins his routine day, unaware of what's to come",
      storyId: "story_1",
      partId: "part_1",
      orderIndex: 0,
      purpose: "Establish character and setting",
      hook: "The lighthouse beam catches something unusual in the water",
      characterFocus: "Thomas (the keeper)",
      pacingGoal: "slow",
      actionDialogueRatio: "70/30"
    }
  ],
  scenes: [
    {
      id: "scene_1",
      title: "Morning Ritual",
      chapterId: "chapter_1",
      orderIndex: 0,
      goal: "Establish Thomas's isolation and routine",
      conflict: "Internal struggle with loneliness",
      outcome: "Discovery of the first message",
      summary: "Thomas performs his morning duties and finds a bottle"
    }
  ],
  characters: [
    {
      id: "char_1",
      name: "Thomas Whitmore",
      storyId: "story_1",
      isMain: true,
      role: "protagonist",
      archetype: "The Guardian",
      summary: "A 65-year-old lighthouse keeper, dedicated but lonely",
      motivations: {
        primary: "To maintain the lighthouse and protect ships",
        secondary: "To find meaning in his isolation",
        fear: "That his life's work has been meaningless"
      }
    },
    {
      id: "char_2",
      name: "Sarah",
      storyId: "story_1",
      // Missing role and motivations to test validation
    }
  ],
  settings: [
    {
      id: "setting_1",
      name: "Beacon Point Lighthouse",
      storyId: "story_1",
      description: "A weathered lighthouse on a rocky outcrop",
      mood: "Isolated, melancholic, mysterious",
      sensory: {
        sounds: ["crashing waves", "crying gulls", "creaking wood"],
        smells: ["salt air", "lamp oil", "aged wood"],
        sights: ["endless ocean", "rocky cliffs", "spiraling stairs"]
      }
    }
  ]
};

const API_BASE = 'http://localhost:3000/api';

async function testValidationAPI() {
  console.log('\n=== Testing Validation API ===\n');

  // Test single component validation
  console.log('1. Testing single story validation:');
  try {
    const response = await fetch(`${API_BASE}/validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-token' // You'll need a real session token
      },
      body: JSON.stringify({
        type: 'story',
        data: testStoryData.story,
        includeWarnings: true
      })
    });

    const result = await response.json();
    console.log('Story validation result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Story validation error:', error);
  }

  // Test full structure validation
  console.log('\n2. Testing full structure validation:');
  try {
    const response = await fetch(`${API_BASE}/validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-token'
      },
      body: JSON.stringify({
        type: 'full',
        data: testStoryData,
        includeWarnings: true
      })
    });

    const result = await response.json();
    console.log('Full validation result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Full validation error:', error);
  }
}

async function testEvaluationAPI() {
  console.log('\n=== Testing Evaluation API ===\n');

  // Test quick evaluation
  console.log('1. Testing quick scene evaluation:');
  try {
    const response = await fetch(`${API_BASE}/evaluation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-token'
      },
      body: JSON.stringify({
        mode: 'quick',
        type: 'scene',
        data: testStoryData.scenes[0]
      })
    });

    const result = await response.json();
    console.log('Quick evaluation result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Quick evaluation error:', error);
  }

  // Test full evaluation
  console.log('\n2. Testing full content evaluation:');
  try {
    const response = await fetch(`${API_BASE}/evaluation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-token'
      },
      body: JSON.stringify({
        mode: 'full',
        data: testStoryData,
        includeAIFeedback: true,
        detailLevel: 'detailed'
      })
    });

    const result = await response.json();
    console.log('Full evaluation result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Full evaluation error:', error);
  }
}

async function testStoryAnalysisAPI() {
  console.log('\n=== Testing Combined Story Analysis API ===\n');

  console.log('Testing comprehensive analysis with report:');
  try {
    const response = await fetch(`${API_BASE}/story-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-token'
      },
      body: JSON.stringify({
        analysisType: 'both',
        data: testStoryData,
        options: {
          includeWarnings: true,
          includeAIFeedback: true,
          detailLevel: 'detailed',
          generateReport: true
        }
      })
    });

    const result = await response.json();
    console.log('Story analysis result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Story analysis error:', error);
  }
}

async function runTests() {
  console.log('Starting API Tests...');
  console.log('Note: Make sure the development server is running on port 3000');
  console.log('Note: You need to update the session token for authentication\n');

  await testValidationAPI();
  await testEvaluationAPI();
  await testStoryAnalysisAPI();

  console.log('\n=== Tests Complete ===');
}

// Run the tests
runTests().catch(console.error);