#!/usr/bin/env node

/**
 * End-to-End Script: Generate, Download, and Evaluate Story
 *
 * This script uses authenticated API calls to:
 * 1. Generate a story using the story generation API
 * 2. Fetch the complete story structure with scenes
 * 3. Extract and evaluate a scene
 * 4. Display comprehensive evaluation results
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

// Helper to get API key from auth file
async function getApiKey() {
  try {
    const authFile = path.join(__dirname, '..', '.auth', 'user.json');
    const authData = JSON.parse(await fs.readFile(authFile, 'utf-8'));

    if (!authData.apiKey) {
      throw new Error('No API key found in auth file');
    }

    return authData.apiKey;
  } catch (error) {
    console.error('❌ Error reading auth file:', error.message);
    console.error('\n💡 Tip: Run this first to capture authentication:');
    console.error('   dotenv --file .env.local run node scripts/capture-auth-manual.mjs\n');
    throw error;
  }
}

// Helper to make authenticated API requests using API key
async function apiRequest(endpoint, method = 'GET', body = null, apiKey) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const url = `${BASE_URL}${endpoint}`;
  console.log(`   📡 ${method} ${endpoint}`);

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`API Error (${response.status}): ${JSON.stringify(error, null, 2)}`);
  }

  return response.json();
}

// Step 1: Generate story
async function generateStory(apiKey) {
  console.log('\n' + '='.repeat(80));
  console.log('📝 STEP 1: Generate Story');
  console.log('='.repeat(80));

  const prompt = `
Create a mystery story about a detective investigating a series of impossible crimes.
The detective discovers that the criminal is using advanced technology to manipulate time.
The story should be engaging, with strong character development and a satisfying conclusion.
Include 2-3 chapters with multiple scenes per chapter.
  `.trim();

  console.log('\n📖 Story Prompt:');
  console.log(prompt);
  console.log('\n⏳ Generating story...\n');

  try {
    const result = await apiRequest('/api/stories/generate', 'POST', { prompt }, apiKey);

    console.log('✅ Story generated!');
    console.log(`   Story ID: ${result.story.id}`);
    console.log(`   Title: ${result.story.title}`);
    console.log(`   Genre: ${result.story.genre}`);
    console.log(`   Status: ${result.generationStatus}`);

    return result.story.id;
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    throw error;
  }
}

// Step 2: Fetch story with complete structure
async function fetchStoryStructure(storyId, apiKey) {
  console.log('\n' + '='.repeat(80));
  console.log('📚 STEP 2: Fetch Story Structure');
  console.log('='.repeat(80));
  console.log(`\nStory ID: ${storyId}\n`);

  // Wait a bit for generation to complete
  console.log('⏳ Waiting for story generation to complete...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    const result = await apiRequest(`/api/stories/${storyId}/structure`, 'GET', null, apiKey);

    console.log('✅ Story structure fetched!');
    console.log(`   Title: ${result.title}`);
    console.log(`   Parts: ${result.parts?.length || 0}`);
    console.log(`   Direct Chapters: ${result.chapters?.length || 0}`);

    // Count all scenes
    const allChapters = [
      ...(result.chapters || []),
      ...(result.parts?.flatMap(p => p.chapters || []) || [])
    ];
    const totalScenes = allChapters.reduce((sum, ch) => sum + (ch.scenes?.length || 0), 0);
    console.log(`   Total Chapters: ${allChapters.length}`);
    console.log(`   Total Scenes: ${totalScenes}`);

    return result;
  } catch (error) {
    console.error('❌ Fetch failed:', error.message);
    throw error;
  }
}

// Step 3: Extract scene for evaluation
function extractScene(story) {
  console.log('\n' + '='.repeat(80));
  console.log('🎬 STEP 3: Extract Scene');
  console.log('='.repeat(80));

  // Get all chapters
  const allChapters = [
    ...(story.chapters || []),
    ...(story.parts?.flatMap(p => p.chapters || []) || [])
  ];

  // Find first chapter with scenes that have content
  const chapterWithContent = allChapters.find(ch =>
    ch.scenes && ch.scenes.length > 0 && ch.scenes.some(s => s.content && s.content.length > 100)
  );

  if (!chapterWithContent || !chapterWithContent.scenes || chapterWithContent.scenes.length === 0) {
    throw new Error('No scenes with content found in story');
  }

  const scene = chapterWithContent.scenes.find(s => s.content && s.content.length > 100);

  if (!scene) {
    throw new Error('No scene with sufficient content found');
  }

  console.log(`\n✅ Scene extracted!`);
  console.log(`   Chapter: ${chapterWithContent.title}`);
  console.log(`   Scene: ${scene.title || 'Untitled'}`);
  console.log(`   Word Count: ${scene.wordCount || 'N/A'}`);
  console.log(`   Content Length: ${scene.content.length} characters`);

  console.log('\n📖 Scene Preview:');
  console.log('-'.repeat(80));
  const preview = scene.content.substring(0, 400);
  console.log(preview + (scene.content.length > 400 ? '...' : ''));
  console.log('-'.repeat(80));

  return {
    scene,
    chapter: chapterWithContent,
    story
  };
}

// Step 4: Evaluate scene
async function evaluateScene(sceneData, apiKey) {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 STEP 4: Evaluate Scene');
  console.log('='.repeat(80));
  console.log('\n⏳ Sending to evaluation API...\n');

  const { scene, chapter, story } = sceneData;

  // Build evaluation request
  const evaluationRequest = {
    sceneId: scene.id,
    content: scene.content,
    context: {
      storyGenre: story.genre || 'Mystery',
      arcPosition: chapter.orderIndex === 0 ? 'beginning' :
                   chapter.orderIndex >= (story.chapters?.length || 1) - 1 ? 'end' : 'middle',
      chapterNumber: chapter.orderIndex + 1,
      characterContext: story.characters?.slice(0, 3).map(c =>
        `${c.name || 'Character'} - ${c.role || 'role unknown'}`
      ) || [],
    },
    options: {
      detailedFeedback: true,
      includeExamples: true
    }
  };

  try {
    const startTime = Date.now();
    const result = await apiRequest('/api/evaluate/scene', 'POST', evaluationRequest, apiKey);
    const evalTime = Date.now() - startTime;

    console.log('✅ Evaluation completed!');
    console.log(`   Time: ${evalTime}ms (${(evalTime / 1000).toFixed(1)}s)`);
    console.log(`   Model: ${result.metadata?.modelVersion || 'N/A'}`);
    console.log(`   Tokens: ${result.metadata?.tokenUsage || 'N/A'}`);
    console.log(`   Evaluation ID: ${result.evaluationId}`);

    return result;
  } catch (error) {
    console.error('❌ Evaluation failed:', error.message);
    throw error;
  }
}

// Step 5: Display results
function displayResults(evaluation, sceneData) {
  const { evaluation: evalData } = evaluation;

  console.log('\n' + '='.repeat(80));
  console.log('📊 EVALUATION RESULTS');
  console.log('='.repeat(80));

  // Summary
  console.log('\n📝 Summary');
  console.log('-'.repeat(80));
  console.log(`\n📖 Plot Events:\n   ${evalData.summary.plotEvents}`);
  console.log(`\n👥 Character Moments:\n   ${evalData.summary.characterMoments}`);

  console.log('\n✨ Key Strengths:');
  evalData.summary.keyStrengths.forEach((strength, i) => {
    console.log(`   ${i + 1}. ${strength}`);
  });

  console.log('\n🔧 Areas for Improvement:');
  evalData.summary.keyImprovements.forEach((improvement, i) => {
    console.log(`   ${i + 1}. ${improvement}`);
  });

  // Scores
  console.log('\n' + '='.repeat(80));
  console.log('📈 SCORES');
  console.log('='.repeat(80));

  const getBar = (score) => {
    const filled = Math.round((score / 4) * 20);
    return '█'.repeat(filled) + '░'.repeat(20 - filled);
  };

  const getEmoji = (score) => {
    if (score >= 3.5) return '🌟';
    if (score >= 2.5) return '✅';
    if (score >= 1.5) return '⚠️';
    return '❌';
  };

  console.log(`\n🎯 Overall Score: ${getEmoji(evalData.overallScore)} ${evalData.overallScore.toFixed(2)}/4.00`);

  console.log('\n📊 Category Breakdown:');
  Object.entries(evalData.categoryScores).forEach(([category, score]) => {
    const emoji = getEmoji(score);
    const bar = getBar(score);
    const name = category.charAt(0).toUpperCase() + category.slice(1);
    console.log(`   ${emoji} ${name.padEnd(15)}: ${bar} ${score.toFixed(2)}/4.00`);
  });

  // Actionable Feedback
  console.log('\n' + '='.repeat(80));
  console.log('💡 ACTIONABLE FEEDBACK');
  console.log('='.repeat(80));

  evalData.actionableFeedback.forEach((feedback, i) => {
    const priorityIcon = { high: '🔴', medium: '🟡', low: '🟢' };
    console.log(`\n${i + 1}. ${priorityIcon[feedback.priority]} [${feedback.priority.toUpperCase()}] ${feedback.category.toUpperCase()}`);
    console.log(`\n   🔍 Diagnosis:`);
    console.log(`   ${feedback.diagnosis.split('\n').join('\n   ')}`);
    console.log(`\n   💡 Suggestion:`);
    console.log(`   ${feedback.suggestion.split('\n').join('\n   ')}`);
  });

  console.log('\n' + '='.repeat(80));
}

// Save results
async function saveResults(story, evaluation, sceneData) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const outputDir = path.join(__dirname, '..', 'logs');

  await fs.mkdir(outputDir, { recursive: true });

  const report = {
    timestamp: new Date().toISOString(),
    story: {
      id: story.id,
      title: story.title,
      genre: story.genre,
      totalChapters: (story.chapters?.length || 0) + (story.parts?.reduce((sum, p) => sum + (p.chapters?.length || 0), 0) || 0),
    },
    scene: {
      id: sceneData.scene.id,
      title: sceneData.scene.title,
      chapterTitle: sceneData.chapter.title,
      wordCount: sceneData.scene.wordCount,
      contentLength: sceneData.scene.content.length,
    },
    evaluation: evaluation.evaluation,
    metadata: evaluation.metadata
  };

  const filename = `evaluation-report-${timestamp}.json`;
  const filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, JSON.stringify(report, null, 2));

  console.log(`\n📄 Report saved: ${filepath}`);
}

// Main execution
async function main() {
  console.log('\n' + '█'.repeat(80));
  console.log('🚀 GENERATE, DOWNLOAD, AND EVALUATE STORY');
  console.log('█'.repeat(80));

  try {
    // Get authentication
    console.log('\n🔐 Authenticating...');
    const apiKey = await getApiKey();
    console.log('✅ API key loaded\n');

    // Step 1: Generate story
    const storyId = await generateStory(apiKey);

    // Step 2: Fetch story structure
    const story = await fetchStoryStructure(storyId, apiKey);

    // Step 3: Extract scene
    const sceneData = extractScene(story);

    // Step 4: Evaluate scene
    const evaluation = await evaluateScene(sceneData, apiKey);

    // Step 5: Display results
    displayResults(evaluation, sceneData);

    // Save results
    await saveResults(story, evaluation, sceneData);

    console.log('\n' + '█'.repeat(80));
    console.log('✅ PROCESS COMPLETED SUCCESSFULLY!');
    console.log('█'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n' + '█'.repeat(80));
    console.error('❌ PROCESS FAILED');
    console.error('█'.repeat(80));
    console.error(`\nError: ${error.message}`);
    if (process.env.DEBUG) {
      console.error('\nStack trace:', error.stack);
    }
    console.error('\n' + '█'.repeat(80) + '\n');
    process.exit(1);
  }
}

// Run
main();
