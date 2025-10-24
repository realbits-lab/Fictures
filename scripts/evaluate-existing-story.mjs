#!/usr/bin/env node

/**
 * Evaluate Existing Story Script
 *
 * This script fetches an existing story and evaluates one of its scenes
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '.env.local') });

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Story ID will be determined from available stories
let STORY_ID = null;

async function getApiKey() {
  const authFile = path.join(__dirname, '..', '.auth', 'user.json');
  const authData = JSON.parse(await fs.readFile(authFile, 'utf-8'));
  return authData.apiKey;
}

async function apiRequest(endpoint, method = 'GET', body = null, apiKey) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
  };

  if (body) options.body = JSON.stringify(body);

  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`API Error (${response.status}): ${JSON.stringify(error, null, 2)}`);
  }

  return response.json();
}

async function main() {
  console.log('\n' + '█'.repeat(80));
  console.log('🎯 EVALUATE EXISTING STORY SCENE');
  console.log('█'.repeat(80));

  const apiKey = await getApiKey();
  console.log('\n✅ Authenticated');

  // List available stories first
  console.log('\n📚 Fetching available stories...\n');
  const storiesResponse = await apiRequest('/api/stories', 'GET', null, apiKey);
  const stories = storiesResponse.stories || [];

  if (stories.length === 0) {
    throw new Error('No stories available. Please create a story first.');
  }

  console.log(`Found ${stories.length} stories:`);
  stories.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.title} (${s.id})`);
  });

  // Try to find a story with scenes
  let story = null;
  let chapter = null;
  let scene = null;

  for (const s of stories) {
    console.log(`\n📖 Trying story: "${s.title}"...`);
    const storyData = await apiRequest(`/api/stories/${s.id}/structure`, 'GET', null, apiKey);

    // Check for chapters with scenes
    const allChapters = [
      ...(storyData.chapters || []),
      ...(storyData.parts?.flatMap(p => p.chapters || []) || [])
    ];

    const chapterWithScenes = allChapters.find(ch => ch.scenes && ch.scenes.length > 0);

    if (chapterWithScenes) {
      const sceneWithContent = chapterWithScenes.scenes.find(sc => sc.content && sc.content.length > 100);

      if (sceneWithContent) {
        story = storyData;
        chapter = chapterWithScenes;
        scene = sceneWithContent;
        console.log(`   ✅ Found scene with content!`);
        break;
      }
    }

    console.log(`   ⏭️  No scenes with content, trying next...`);
  }

  if (!story || !chapter || !scene) {
    throw new Error('No stories with scenes containing content found. Please write some content first.');
  }

  console.log(`\n✅ Story: "${story.title}"`);
  console.log(`   Genre: ${story.genre}`);
  console.log(`   Total Chapters: ${(story.chapters?.length || 0) + (story.parts?.reduce((sum, p) => sum + (p.chapters?.length || 0), 0) || 0)}`);
  console.log(`\n📖 Scene: "${scene.title || 'Untitled'}"`);
  console.log(`   Chapter: "${chapter.title}"`);
  console.log(`   Length: ${scene.content.length} chars`);
  console.log(`\n   Preview:\n   ${scene.content.substring(0, 200)}...\n`);

  // Evaluate scene
  console.log('⏳ Evaluating scene...\n');

  const request = {
    sceneId: scene.id,
    content: scene.content,
    context: {
      storyGenre: story.genre || 'Science Fiction',
      arcPosition: 'beginning',
      chapterNumber: chapter.orderIndex + 1,
    }
  };

  const start = Date.now();
  const result = await apiRequest('/api/evaluate/scene', 'POST', request, apiKey);
  const time = Date.now() - start;

  console.log('✅ Evaluation completed!');
  console.log(`   Time: ${(time / 1000).toFixed(1)}s`);
  console.log(`   Tokens: ${result.metadata?.tokenUsage || 'N/A'}`);

  const { evaluation: evalData } = result;

  // Display results
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTS');
  console.log('='.repeat(80));

  console.log(`\n🎯 Overall Score: ${evalData.overallScore.toFixed(2)}/4.00`);

  console.log('\n📊 Category Scores:');
  Object.entries(evalData.categoryScores).forEach(([cat, score]) => {
    const bar = '█'.repeat(Math.round(score * 5)) + '░'.repeat(20 - Math.round(score * 5));
    console.log(`   ${cat.padEnd(15)}: ${bar} ${score.toFixed(2)}/4.00`);
  });

  console.log('\n✨ Strengths:');
  evalData.summary.keyStrengths.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

  console.log('\n🔧 Improvements:');
  evalData.summary.keyImprovements.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));

  console.log('\n💡 Actionable Feedback:');
  evalData.actionableFeedback.forEach((f, i) => {
    console.log(`\n   ${i + 1}. [${f.priority.toUpperCase()}] ${f.category}`);
    console.log(`      Diagnosis: ${f.diagnosis.substring(0, 100)}...`);
    console.log(`      Suggestion: ${f.suggestion.substring(0, 100)}...`);
  });

  // Save report
  const outputDir = path.join(__dirname, '..', 'logs');
  await fs.mkdir(outputDir, { recursive: true });
  const filepath = path.join(outputDir, `evaluation-${Date.now()}.json`);
  await fs.writeFile(filepath, JSON.stringify(result, null, 2));

  console.log(`\n\n📄 Full report saved: ${filepath}`);
  console.log('\n' + '█'.repeat(80));
  console.log('✅ COMPLETED SUCCESSFULLY');
  console.log('█'.repeat(80) + '\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
