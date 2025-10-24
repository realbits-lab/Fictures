#!/usr/bin/env node

/**
 * Generate, Download, and Evaluate Story Script
 *
 * This script:
 * 1. Generates a new story using the story generation API
 * 2. Downloads the generated story content
 * 3. Extracts a scene from the story
 * 4. Evaluates the scene using the evaluation API
 * 5. Displays comprehensive results
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const API_KEY = process.env.TEST_API_KEY; // We'll need to create this

// Story generation parameters
const STORY_PROMPT = {
  title: "The Last Memory Keeper",
  genre: "Science Fiction / Mystery",
  premise: "In a future where memories can be stored and traded, a rogue memory keeper discovers a forbidden memory that could unravel the entire system.",
  targetWordCount: 5000,
  numberOfChapters: 3,
};

// Helper function to make authenticated API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  // Add API key if available
  if (API_KEY) {
    options.headers['Authorization'] = `Bearer ${API_KEY}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`API Error (${response.status}): ${JSON.stringify(error)}`);
  }

  return response.json();
}

// Step 1: Generate a story
async function generateStory() {
  console.log('\n📝 Step 1: Generating Story');
  console.log('='.repeat(80));
  console.log(`Title: ${STORY_PROMPT.title}`);
  console.log(`Genre: ${STORY_PROMPT.genre}`);
  console.log(`Premise: ${STORY_PROMPT.premise}`);
  console.log(`Target: ${STORY_PROMPT.numberOfChapters} chapters, ~${STORY_PROMPT.targetWordCount} words`);
  console.log('\n⏳ Initiating story generation...\n');

  try {
    const result = await apiRequest('/api/stories/generate', 'POST', STORY_PROMPT);

    console.log('✅ Story generation initiated!');
    console.log(`Story ID: ${result.storyId}`);
    console.log(`Job ID: ${result.jobId || 'N/A'}`);

    return result.storyId;
  } catch (error) {
    console.error('❌ Story generation failed:', error.message);
    throw error;
  }
}

// Step 2: Wait for story generation to complete and fetch story
async function fetchStory(storyId) {
  console.log('\n📚 Step 2: Fetching Generated Story');
  console.log('='.repeat(80));
  console.log(`Story ID: ${storyId}\n`);

  let attempts = 0;
  const maxAttempts = 30; // 30 attempts with 2 second delay = 1 minute max

  while (attempts < maxAttempts) {
    try {
      const story = await apiRequest(`/api/stories/${storyId}`);

      // Check if story has chapters with content
      if (story.chapters && story.chapters.length > 0) {
        const hasContent = story.chapters.some(ch => ch.scenes && ch.scenes.length > 0);

        if (hasContent) {
          console.log('✅ Story generation completed!');
          console.log(`Title: ${story.title}`);
          console.log(`Chapters: ${story.chapters.length}`);
          console.log(`Total Scenes: ${story.chapters.reduce((sum, ch) => sum + (ch.scenes?.length || 0), 0)}`);
          return story;
        }
      }

      attempts++;
      if (attempts < maxAttempts) {
        process.stdout.write(`⏳ Waiting for generation to complete... (${attempts}/${maxAttempts})\r`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error('\n❌ Error fetching story:', error.message);
      throw error;
    }
  }

  throw new Error('Story generation timed out');
}

// Step 3: Extract a scene for evaluation
function extractScene(story) {
  console.log('\n📖 Step 3: Extracting Scene for Evaluation');
  console.log('='.repeat(80));

  // Find first chapter with scenes
  const chapterWithScenes = story.chapters.find(ch => ch.scenes && ch.scenes.length > 0);

  if (!chapterWithScenes || !chapterWithScenes.scenes[0]) {
    throw new Error('No scenes found in generated story');
  }

  const scene = chapterWithScenes.scenes[0];

  console.log(`Chapter: ${chapterWithScenes.title}`);
  console.log(`Scene: ${scene.title}`);
  console.log(`Word Count: ${scene.wordCount || 'N/A'}`);
  console.log(`\nScene Content Preview:`);
  console.log('-'.repeat(80));
  const preview = scene.content.substring(0, 300);
  console.log(preview + (scene.content.length > 300 ? '...' : ''));
  console.log('-'.repeat(80));

  return {
    scene,
    chapter: chapterWithScenes,
    story
  };
}

// Step 4: Evaluate the scene
async function evaluateScene(sceneData) {
  console.log('\n🎯 Step 4: Evaluating Scene');
  console.log('='.repeat(80));
  console.log('⏳ Sending to evaluation API...\n');

  const { scene, chapter, story } = sceneData;

  const evaluationRequest = {
    sceneId: scene.id,
    content: scene.content,
    context: {
      storyGenre: story.genre || STORY_PROMPT.genre,
      arcPosition: chapter.orderIndex === 0 ? 'beginning' :
                   chapter.orderIndex === story.chapters.length - 1 ? 'end' : 'middle',
      chapterNumber: chapter.orderIndex + 1,
      characterContext: story.characters?.map(c => `${c.name} - ${c.role}`) || [],
    },
    options: {
      detailedFeedback: true,
      includeExamples: true
    }
  };

  try {
    const startTime = Date.now();
    const result = await apiRequest('/api/evaluate/scene', 'POST', evaluationRequest);
    const evalTime = Date.now() - startTime;

    console.log('✅ Evaluation completed!');
    console.log(`⏱️  Time: ${evalTime}ms`);
    console.log(`🤖 Model: ${result.metadata?.modelVersion || 'N/A'}`);
    console.log(`📊 Tokens: ${result.metadata?.tokenUsage || 'N/A'}`);

    return result;
  } catch (error) {
    console.error('❌ Evaluation failed:', error.message);
    throw error;
  }
}

// Step 5: Display evaluation results
function displayResults(evaluation, sceneData) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 EVALUATION RESULTS');
  console.log('='.repeat(80));

  const { evaluation: evalData } = evaluation;

  // Summary
  console.log('\n📝 SUMMARY');
  console.log('-'.repeat(80));
  console.log(`\nPlot Events:\n  ${evalData.summary.plotEvents}`);
  console.log(`\nCharacter Moments:\n  ${evalData.summary.characterMoments}`);

  console.log('\n✨ Key Strengths:');
  evalData.summary.keyStrengths.forEach((strength, i) => {
    console.log(`  ${i + 1}. ${strength}`);
  });

  console.log('\n🔧 Key Improvements:');
  evalData.summary.keyImprovements.forEach((improvement, i) => {
    console.log(`  ${i + 1}. ${improvement}`);
  });

  // Scores
  console.log('\n' + '='.repeat(80));
  console.log('📈 SCORES');
  console.log('='.repeat(80));

  console.log(`\n🎯 Overall Score: ${evalData.overallScore.toFixed(2)}/4.00`);

  const getScoreBar = (score) => {
    const percentage = (score / 4) * 100;
    const filled = Math.round(percentage / 5);
    return '█'.repeat(filled) + '░'.repeat(20 - filled);
  };

  const getScoreEmoji = (score) => {
    if (score >= 3.5) return '🌟';
    if (score >= 2.5) return '✅';
    if (score >= 1.5) return '⚠️';
    return '❌';
  };

  console.log('\n📊 Category Scores:');
  Object.entries(evalData.categoryScores).forEach(([category, score]) => {
    const emoji = getScoreEmoji(score);
    const bar = getScoreBar(score);
    console.log(`  ${emoji} ${category.padEnd(15)}: ${bar} ${score.toFixed(2)}/4.00`);
  });

  // Detailed metrics for each category
  console.log('\n' + '='.repeat(80));
  console.log('📊 DETAILED METRICS');
  console.log('='.repeat(80));

  const categories = ['plot', 'character', 'pacing', 'prose', 'worldBuilding'];
  const categoryNames = {
    plot: '🎬 Plot & Progression',
    character: '👥 Character & Connection',
    pacing: '⚡ Pacing & Momentum',
    prose: '✍️  Prose & Voice',
    worldBuilding: '🌍 World-Building'
  };

  categories.forEach(category => {
    console.log(`\n${categoryNames[category]}`);
    console.log('-'.repeat(80));

    const metrics = evalData.metrics[category];
    Object.entries(metrics).forEach(([metric, data]) => {
      const emoji = getScoreEmoji(data.score);
      console.log(`  ${emoji} ${metric.padEnd(25)}: ${data.score}/4 (${data.level})`);
    });

    // Show analysis
    const analysis = evalData.analysis[category];
    if (analysis.strengths.length > 0) {
      console.log(`\n  ✨ Strength: ${analysis.strengths[0].point}`);
      console.log(`     Evidence: "${analysis.strengths[0].evidence.substring(0, 100)}..."`);
    }
    if (analysis.improvements.length > 0) {
      console.log(`\n  🔧 Improvement: ${analysis.improvements[0].point}`);
      console.log(`     Evidence: "${analysis.improvements[0].evidence.substring(0, 100)}..."`);
    }
  });

  // Actionable feedback
  console.log('\n' + '='.repeat(80));
  console.log('💡 ACTIONABLE FEEDBACK');
  console.log('='.repeat(80));

  evalData.actionableFeedback.forEach((feedback, i) => {
    const priorityEmoji = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    };

    console.log(`\n${i + 1}. ${priorityEmoji[feedback.priority]} [${feedback.priority.toUpperCase()}] ${feedback.category.toUpperCase()}`);
    console.log(`\n   🔍 Diagnosis:`);
    console.log(`   ${feedback.diagnosis}`);
    console.log(`\n   💡 Suggestion:`);
    console.log(`   ${feedback.suggestion}`);
  });

  console.log('\n' + '='.repeat(80));
}

// Save results to file
async function saveResults(story, evaluation, sceneData) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(__dirname, '..', 'logs');

  // Ensure logs directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Save full story
  const storyPath = path.join(outputDir, `story-${timestamp}.json`);
  await fs.writeFile(storyPath, JSON.stringify(story, null, 2));

  // Save evaluation
  const evalPath = path.join(outputDir, `evaluation-${timestamp}.json`);
  await fs.writeFile(evalPath, JSON.stringify(evaluation, null, 2));

  // Save combined report
  const report = {
    timestamp: new Date().toISOString(),
    story: {
      id: story.id,
      title: story.title,
      genre: story.genre,
      chapters: story.chapters.length,
      wordCount: story.currentWordCount
    },
    scene: {
      id: sceneData.scene.id,
      title: sceneData.scene.title,
      chapterTitle: sceneData.chapter.title,
      wordCount: sceneData.scene.wordCount,
      content: sceneData.scene.content
    },
    evaluation: evaluation.evaluation,
    metadata: evaluation.metadata
  };

  const reportPath = path.join(outputDir, `story-evaluation-report-${timestamp}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log('\n📄 Files Saved:');
  console.log(`  - Story: ${storyPath}`);
  console.log(`  - Evaluation: ${evalPath}`);
  console.log(`  - Report: ${reportPath}`);
}

// Main execution
async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 GENERATE, DOWNLOAD, AND EVALUATE STORY');
  console.log('='.repeat(80));

  try {
    // Step 1: Generate story
    const storyId = await generateStory();

    // Step 2: Fetch generated story
    const story = await fetchStory(storyId);

    // Step 3: Extract scene
    const sceneData = extractScene(story);

    // Step 4: Evaluate scene
    const evaluation = await evaluateScene(sceneData);

    // Step 5: Display results
    displayResults(evaluation, sceneData);

    // Save results
    await saveResults(story, evaluation, sceneData);

    console.log('\n' + '='.repeat(80));
    console.log('✅ PROCESS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ PROCESS FAILED');
    console.error('='.repeat(80));
    console.error(`\nError: ${error.message}`);
    console.error('\nStack trace:', error.stack);
    console.error('\n' + '='.repeat(80) + '\n');
    process.exit(1);
  }
}

// Run the script
main();
