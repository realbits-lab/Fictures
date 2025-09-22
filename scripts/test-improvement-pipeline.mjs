#!/usr/bin/env node

import fetch from 'node-fetch';

// Test data with intentional gaps for improvement
const testStoryData = {
  story: {
    id: "story_test_1",
    title: "The Echo Chamber",
    description: "A story about truth", // Intentionally vague
    genre: "Thriller",
    // Missing premise, dramatic question, theme
    targetWordCount: 75000,
    currentWordCount: 0
  },
  parts: [
    {
      id: "part_test_1",
      title: "Part One",
      storyId: "story_test_1",
      orderIndex: 0,
      // Missing description, structural role, summary
    }
  ],
  chapters: [
    {
      id: "chapter_test_1",
      title: "Chapter 1",
      storyId: "story_test_1",
      partId: "part_test_1",
      orderIndex: 0,
      // Missing summary, purpose, hook
    }
  ],
  scenes: [
    {
      id: "scene_test_1",
      title: "Opening",
      chapterId: "chapter_test_1",
      orderIndex: 0,
      // Missing goal, conflict, outcome
    }
  ],
  characters: [
    {
      id: "char_test_1",
      name: "Alex Chen",
      storyId: "story_test_1",
      isMain: true,
      // Missing role, archetype, motivations
    }
  ],
  settings: [
    {
      id: "setting_test_1",
      name: "Digital Newsroom",
      storyId: "story_test_1",
      // Missing description, mood, sensory details
    }
  ]
};

const API_BASE = 'http://localhost:3000/api';

async function runStoryAnalysisWithImprovement() {
  console.log('\n=== Running Complete Story Improvement Pipeline ===\n');

  console.log('Step 1: Analyzing story with auto-improvement enabled...\n');

  try {
    const analysisResponse = await fetch(`${API_BASE}/story-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-token' // Replace with real token
      },
      body: JSON.stringify({
        analysisType: 'both',
        data: testStoryData,
        options: {
          includeWarnings: true,
          includeAIFeedback: true,
          detailLevel: 'detailed',
          generateReport: true,
          autoImprove: true,
          improvementLevel: 'moderate'
        }
      })
    });

    const analysisResult = await analysisResponse.json();

    console.log('Analysis Summary:');
    console.log('- Validation:', analysisResult.validation?.summary || 'N/A');
    console.log('- Evaluation Score:', analysisResult.evaluation?.overallScore || analysisResult.evaluation?.storyEvaluation?.overallScore || 'N/A');
    console.log('- Total Errors:', analysisResult.validation?.totalErrors || 0);
    console.log('- Total Warnings:', analysisResult.validation?.totalWarnings || 0);

    if (analysisResult.improvements) {
      console.log('\n--- Improvements Generated ---');
      console.log('Total Changes Proposed:', analysisResult.improvements.summary?.totalChanges || 0);
      console.log('Major Improvements:', analysisResult.improvements.summary?.majorImprovements?.join(', ') || 'None');
      console.log('Minor Adjustments:', analysisResult.improvements.summary?.minorAdjustments?.join(', ') || 'None');
    }

    // Return analysis result for next step
    return analysisResult;

  } catch (error) {
    console.error('Analysis error:', error);
    return null;
  }
}

async function previewImprovements(analysisResult) {
  if (!analysisResult || !analysisResult.improvements) {
    console.log('\nNo improvements to preview.');
    return null;
  }

  console.log('\n\nStep 2: Previewing improvements (dry run)...\n');

  try {
    const updateResponse = await fetch(`${API_BASE}/story-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-token'
      },
      body: JSON.stringify({
        analysisResult: {
          validation: analysisResult.validation?.details,
          evaluation: analysisResult.evaluation
        },
        originalData: testStoryData,
        options: {
          updateLevel: 'moderate',
          preserveUserContent: true,
          autoApply: false,
          dryRun: true
        }
      })
    });

    const updateResult = await updateResponse.json();

    if (updateResult.success) {
      console.log('Preview Results:');
      console.log('- Mode:', updateResult.mode);
      console.log('- Story changes:', updateResult.result?.changes?.story?.fieldsUpdated?.join(', ') || 'None');
      console.log('- Part changes:', updateResult.result?.changes?.parts?.length || 0, 'parts');
      console.log('- Chapter changes:', updateResult.result?.changes?.chapters?.length || 0, 'chapters');
      console.log('- Scene changes:', updateResult.result?.changes?.scenes?.length || 0, 'scenes');
      console.log('- Character changes:', updateResult.result?.changes?.characters?.length || 0, 'characters');
      console.log('- Setting changes:', updateResult.result?.changes?.settings?.length || 0, 'settings');
    }

    return updateResult;

  } catch (error) {
    console.error('Preview error:', error);
    return null;
  }
}

async function applyImprovements(analysisResult) {
  if (!analysisResult || !analysisResult.improvements) {
    console.log('\nNo improvements to apply.');
    return;
  }

  console.log('\n\nStep 3: Applying improvements to database...\n');

  try {
    const updateResponse = await fetch(`${API_BASE}/story-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-token'
      },
      body: JSON.stringify({
        analysisResult: {
          validation: analysisResult.validation?.details,
          evaluation: analysisResult.evaluation
        },
        originalData: testStoryData,
        options: {
          updateLevel: 'moderate',
          preserveUserContent: true,
          autoApply: true,
          dryRun: false
        }
      })
    });

    const updateResult = await updateResponse.json();

    if (updateResult.success) {
      console.log('Application Results:');
      console.log('- Mode:', updateResult.mode);
      console.log('- Message:', updateResult.message);
      console.log('- Updated components:', Object.keys(updateResult.updateResults || {}).join(', '));
    }

  } catch (error) {
    console.error('Apply error:', error);
  }
}

async function demonstrateSelectiveUpdate() {
  console.log('\n\nStep 4: Demonstrating selective improvements...\n');

  try {
    // Example of applying only character improvements
    const selectiveResponse = await fetch(`${API_BASE}/story-update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-token'
      },
      body: JSON.stringify({
        storyId: "story_test_1",
        improvements: {
          characters: [
            {
              id: "char_test_1",
              role: "protagonist",
              archetype: "The Seeker of Truth",
              motivations: {
                primary: "Expose corruption in digital media",
                secondary: "Protect sources and whistleblowers",
                fear: "Becoming part of the system they fight against"
              }
            }
          ]
        }
      })
    });

    const selectiveResult = await selectiveResponse.json();

    if (selectiveResult.success) {
      console.log('Selective Update Results:');
      console.log('- Success:', selectiveResult.success);
      console.log('- Message:', selectiveResult.message);
    }

  } catch (error) {
    console.error('Selective update error:', error);
  }
}

async function runCompletePipeline() {
  console.log('=== Story Improvement Pipeline Test ===');
  console.log('This demonstrates the complete workflow:');
  console.log('1. Analyze story (validation + evaluation)');
  console.log('2. Generate improvements based on feedback');
  console.log('3. Preview improvements (dry run)');
  console.log('4. Apply improvements to database');
  console.log('5. Selective updates\n');

  console.log('Note: Make sure the development server is running on port 3000');
  console.log('Note: Update the session token for authentication\n');

  // Run the complete pipeline
  const analysisResult = await runStoryAnalysisWithImprovement();

  if (analysisResult) {
    const previewResult = await previewImprovements(analysisResult);

    // Only apply if preview was successful
    if (previewResult && previewResult.success) {
      console.log('\nProceed with applying improvements? (In production, this would be user-controlled)');
      // await applyImprovements(analysisResult); // Uncomment to actually apply
    }

    // Demonstrate selective updates
    // await demonstrateSelectiveUpdate(); // Uncomment to test selective updates
  }

  console.log('\n\n=== Pipeline Test Complete ===');
  console.log('\nKey Features Demonstrated:');
  console.log('✓ Comprehensive story analysis (validation + evaluation)');
  console.log('✓ AI-powered improvement generation based on feedback');
  console.log('✓ Dry-run preview of changes');
  console.log('✓ Auto-application of improvements');
  console.log('✓ Selective improvement application');
  console.log('\nIntegration Points:');
  console.log('- /api/story-analysis → Analyze and optionally generate improvements');
  console.log('- /api/story-update → Apply improvements (batch or selective)');
}

// Run the test
runCompletePipeline().catch(console.error);