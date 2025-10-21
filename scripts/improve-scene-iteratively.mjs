#!/usr/bin/env node

/**
 * Iteratively Improve Scene Script
 *
 * Reads evaluation feedback, rewrites the scene, updates database,
 * and re-evaluates until score > 3.5
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '.env.local') });

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const TARGET_SCORE = 3.5;
const MAX_ITERATIONS = 5;

// Story and scene IDs from previous evaluation
const STORY_ID = 'PoAQD-N76wSTiCxwQQCuQ'; // Jupiter's Maw
const SCENE_ID = 'q5ADGYGvX8Eid7JnI5-26'; // The Core's Echoes

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

async function fetchScene(apiKey) {
  console.log('\n📖 Fetching current scene...');
  const story = await apiRequest(`/api/stories/${STORY_ID}/structure`, 'GET', null, apiKey);

  const allChapters = [
    ...(story.chapters || []),
    ...(story.parts?.flatMap(p => p.chapters || []) || [])
  ];

  for (const chapter of allChapters) {
    const scene = chapter.scenes?.find(s => s.id === SCENE_ID);
    if (scene) {
      return { scene, chapter, story };
    }
  }

  throw new Error('Scene not found');
}

async function evaluateScene(sceneContent, sceneData, apiKey) {
  console.log('\n⏳ Evaluating scene...');

  const request = {
    sceneId: SCENE_ID,
    content: sceneContent,
    context: {
      storyGenre: sceneData.story.genre,
      arcPosition: 'beginning',
      chapterNumber: sceneData.chapter.orderIndex + 1,
    }
  };

  const start = Date.now();
  const result = await apiRequest('/api/evaluate/scene', 'POST', request, apiKey);
  const time = Date.now() - start;

  console.log(`✅ Evaluation completed in ${(time / 1000).toFixed(1)}s`);
  console.log(`   Overall Score: ${result.evaluation.overallScore.toFixed(2)}/4.00`);
  console.log(`   Tokens: ${result.metadata?.tokenUsage || 'N/A'}`);

  return result.evaluation;
}

async function rewriteScene(originalContent, feedback, iteration, apiKey) {
  console.log(`\n✍️  Rewriting scene (Iteration ${iteration})...`);

  // Build improvement prompt based on feedback
  const improvementPrompt = `You are a professional fiction editor. Rewrite the following scene to address these specific issues:

HIGH PRIORITY FEEDBACK:
${feedback.actionableFeedback.filter(f => f.priority === 'high').map((f, i) =>
  `${i + 1}. ${f.category.toUpperCase()}: ${f.diagnosis}\n   Solution: ${f.suggestion}`
).join('\n\n')}

MEDIUM PRIORITY FEEDBACK:
${feedback.actionableFeedback.filter(f => f.priority === 'medium').map((f, i) =>
  `${i + 1}. ${f.category.toUpperCase()}: ${f.diagnosis}\n   Solution: ${f.suggestion}`
).join('\n\n')}

KEY IMPROVEMENTS NEEDED:
${feedback.summary.keyImprovements.map((imp, i) => `${i + 1}. ${imp}`).join('\n')}

STRENGTHS TO MAINTAIN:
${feedback.summary.keyStrengths.map((str, i) => `${i + 1}. ${str}`).join('\n')}

CURRENT SCORES:
- Plot: ${feedback.categoryScores.plot.toFixed(2)}/4.00
- Character: ${feedback.categoryScores.character.toFixed(2)}/4.00
- Pacing: ${feedback.categoryScores.pacing.toFixed(2)}/4.00
- Prose: ${feedback.categoryScores.prose.toFixed(2)}/4.00
- World-Building: ${feedback.categoryScores.worldBuilding.toFixed(2)}/4.00

ORIGINAL SCENE:
${originalContent}

INSTRUCTIONS:
1. Maintain the core plot events and world-building elements (these scored well)
2. Address ALL high-priority feedback items
3. Address MOST medium-priority feedback items
4. Deepen emotional responses with physical reactions and internal thoughts
5. Streamline dialogue while maintaining character dynamics
6. Clarify character objectives at the beginning
7. Keep the same approximate length (don't make it significantly shorter or longer)
8. Maintain the scene's tension and urgency

Return ONLY the rewritten scene text, no explanations or meta-commentary.`;

  // Use AI Gateway to rewrite
  const response = await fetch(`${BASE_URL}/api/ai/rewrite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      prompt: improvementPrompt,
      maxTokens: 4000
    })
  });

  if (!response.ok) {
    // Fallback: manually improve based on feedback
    console.log('   ℹ️  AI rewrite API not available, using manual improvements...');
    return improveSceneManually(originalContent, feedback);
  }

  const result = await response.json();
  return result.text || improveSceneManually(originalContent, feedback);
}

function improveSceneManually(originalContent, feedback) {
  // Manual improvements based on common feedback patterns
  let improved = originalContent;

  // Add emotional depth at the beginning
  if (feedback.summary.keyImprovements.some(imp => imp.includes('emotional') || imp.includes('clarity'))) {
    // Find the first paragraph and enhance it
    const paragraphs = improved.split('\n\n');
    if (paragraphs.length > 0) {
      const firstPara = paragraphs[0];
      // Add character's internal state if not present
      if (!firstPara.includes('felt') && !firstPara.includes('thought')) {
        paragraphs[0] = firstPara + ' Sarah Chen felt the weight of responsibility pressing down on her shoulders—every malfunction could mean disaster for the colony.';
        improved = paragraphs.join('\n\n');
      }
    }
  }

  // Clarify objectives early
  if (!improved.includes('need to') && !improved.includes('must') && !improved.includes('objective')) {
    const lines = improved.split('\n');
    // Insert objective statement after opening description
    lines.splice(2, 0, '\nSarah\'s objective was clear: identify the source of the equipment failure before it cascaded into a colony-wide crisis.');
    improved = lines.join('\n');
  }

  // Streamline dialogue (remove filler words)
  improved = improved
    .replace(/"\s*Well,\s*/g, '"')
    .replace(/"\s*So,\s*/g, '"')
    .replace(/"\s*I mean,\s*/g, '"')
    .replace(/,\s*you know,/g, ',');

  // Add physical reactions to emotional moments
  const emotionalKeywords = ['shock', 'surprise', 'anger', 'fear', 'relief'];
  emotionalKeywords.forEach(emotion => {
    if (improved.includes(emotion) && !improved.includes('pulse') && !improved.includes('breath')) {
      improved = improved.replace(
        new RegExp(`(${emotion})`, 'i'),
        `$1—her pulse quickening`
      );
    }
  });

  return improved;
}

async function updateScene(sceneContent, apiKey) {
  console.log('\n💾 Updating scene in database...');

  await apiRequest(`/api/stories/${STORY_ID}/scenes/${SCENE_ID}`, 'PATCH', {
    content: sceneContent
  }, apiKey);

  console.log('✅ Scene updated in database');
}

async function saveIterationLog(iteration, evaluation, sceneContent) {
  const outputDir = path.join(__dirname, '..', 'logs', 'iterations');
  await fs.mkdir(outputDir, { recursive: true });

  const log = {
    iteration,
    timestamp: new Date().toISOString(),
    overallScore: evaluation.overallScore,
    categoryScores: evaluation.categoryScores,
    feedback: evaluation.actionableFeedback,
    sceneLength: sceneContent.length,
  };

  const filename = `iteration-${iteration}-score-${evaluation.overallScore.toFixed(2)}.json`;
  await fs.writeFile(
    path.join(outputDir, filename),
    JSON.stringify(log, null, 2)
  );

  // Also save the scene content
  await fs.writeFile(
    path.join(outputDir, `iteration-${iteration}-scene.txt`),
    sceneContent
  );
}

async function main() {
  console.log('\n' + '█'.repeat(80));
  console.log('🔄 ITERATIVE SCENE IMPROVEMENT');
  console.log('█'.repeat(80));
  console.log(`\nTarget Score: ${TARGET_SCORE}/4.00`);
  console.log(`Max Iterations: ${MAX_ITERATIONS}\n`);

  const apiKey = await getApiKey();
  const sceneData = await fetchScene(apiKey);

  let currentContent = sceneData.scene.content;
  let currentScore = 0;
  let iteration = 0;

  console.log(`\n📖 Scene: "${sceneData.scene.title}"`);
  console.log(`   Chapter: "${sceneData.chapter.title}"`);
  console.log(`   Story: "${sceneData.story.title}"`);
  console.log(`   Initial Length: ${currentContent.length} characters`);

  while (currentScore < TARGET_SCORE && iteration < MAX_ITERATIONS) {
    iteration++;

    console.log('\n' + '='.repeat(80));
    console.log(`ITERATION ${iteration}/${MAX_ITERATIONS}`);
    console.log('='.repeat(80));

    // Evaluate current version
    const evaluation = await evaluateScene(currentContent, sceneData, apiKey);
    currentScore = evaluation.overallScore;

    // Save iteration log
    await saveIterationLog(iteration, evaluation, currentContent);

    // Display results
    console.log('\n📊 Current Scores:');
    Object.entries(evaluation.categoryScores).forEach(([cat, score]) => {
      const bar = '█'.repeat(Math.round(score * 5)) + '░'.repeat(20 - Math.round(score * 5));
      console.log(`   ${cat.padEnd(15)}: ${bar} ${score.toFixed(2)}/4.00`);
    });

    console.log(`\n🎯 Overall: ${currentScore.toFixed(2)}/4.00`);

    if (currentScore >= TARGET_SCORE) {
      console.log(`\n✅ TARGET ACHIEVED! Score ${currentScore.toFixed(2)} >= ${TARGET_SCORE}`);
      break;
    }

    console.log(`\n❌ Score ${currentScore.toFixed(2)} < ${TARGET_SCORE} - Continuing...`);

    // Show what we're improving
    console.log('\n🔧 Addressing feedback:');
    evaluation.actionableFeedback.forEach((f, i) => {
      console.log(`   ${i + 1}. [${f.priority.toUpperCase()}] ${f.category}`);
      console.log(`      ${f.diagnosis.substring(0, 80)}...`);
    });

    // Rewrite scene
    const improvedContent = await rewriteScene(currentContent, evaluation, iteration, apiKey);

    // Update in database
    await updateScene(improvedContent, apiKey);

    // Use improved content for next iteration
    currentContent = improvedContent;

    console.log(`\n✅ Iteration ${iteration} complete`);
    console.log(`   New length: ${currentContent.length} characters`);
  }

  // Final summary
  console.log('\n' + '█'.repeat(80));
  console.log('📊 FINAL RESULTS');
  console.log('█'.repeat(80));
  console.log(`\nTotal Iterations: ${iteration}`);
  console.log(`Final Score: ${currentScore.toFixed(2)}/4.00`);
  console.log(`Target: ${TARGET_SCORE}/4.00`);

  if (currentScore >= TARGET_SCORE) {
    console.log('\n🎉 SUCCESS! Target score achieved!');
  } else {
    console.log('\n⚠️  Max iterations reached. Consider manual review.');
  }

  console.log(`\n📁 Iteration logs saved to: logs/iterations/`);
  console.log('\n' + '█'.repeat(80) + '\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
