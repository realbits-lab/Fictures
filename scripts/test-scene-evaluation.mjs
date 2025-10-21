#!/usr/bin/env node

/**
 * Test script for scene evaluation API
 *
 * This script tests the /api/evaluate/scene endpoint with a sample scene
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
config({ path: path.join(__dirname, '..', '.env.local') });

// Sample scene for testing
const SAMPLE_SCENE = `
The morning sun filtered through the dusty windows of the old library, casting long shadows across the worn wooden floors. Sarah's fingers traced the spine of the leather-bound journal she'd discovered tucked behind a row of forgotten encyclopedias.

"You shouldn't be here," a voice said from the shadows.

She spun around, her heart hammering against her ribs. An elderly man emerged from between the towering bookshelves, his eyes sharp despite his age.

"I—I'm just looking for information about the town's history," Sarah managed, clutching the journal tighter.

The old man's gaze dropped to the book in her hands. His face went pale. "Where did you find that?"

"Behind the encyclopedias. Why? What is it?"

He stepped closer, his hand trembling as he reached for the journal. "That book has been missing for fifty years. It belonged to my sister. She disappeared the night she wrote the last entry."

Sarah's curiosity overpowered her fear. She opened the journal to the final page. The handwriting was frantic, desperate:

"They're coming. I know too much. If anyone finds this, look for the red door. The truth is—"

The entry ended mid-sentence.

"What red door?" Sarah asked, her voice barely a whisper.

The old man's eyes met hers, filled with decades of buried secrets. "The one you should never open."
`;

async function testEvaluation() {
  try {
    console.log('🧪 Testing Scene Evaluation API\n');
    console.log('='.repeat(80));

    // Get the base URL from environment or use localhost
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Create a sample evaluation request
    const evaluationRequest = {
      sceneId: 'test-scene-id', // In real usage, this would be a valid scene ID
      content: SAMPLE_SCENE,
      context: {
        storyGenre: 'Mystery/Thriller',
        arcPosition: 'beginning',
        chapterNumber: 1,
        characterContext: ['Sarah - protagonist investigator', 'Old man - mysterious librarian']
      },
      options: {
        detailedFeedback: true,
        includeExamples: true
      }
    };

    console.log('\n📝 Sample Scene:');
    console.log('-'.repeat(80));
    console.log(SAMPLE_SCENE.trim());
    console.log('-'.repeat(80));

    console.log('\n🔍 Context:');
    console.log(`  Genre: ${evaluationRequest.context.storyGenre}`);
    console.log(`  Arc Position: ${evaluationRequest.context.arcPosition}`);
    console.log(`  Chapter: ${evaluationRequest.context.chapterNumber}`);
    console.log(`  Characters: ${evaluationRequest.context.characterContext.join(', ')}`);

    console.log('\n⏳ Sending evaluation request...\n');

    const startTime = Date.now();

    // Make the API request
    const response = await fetch(`${baseUrl}/api/evaluate/scene`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you would need to include authentication headers
        // For this test, we'll assume the API is accessible
      },
      body: JSON.stringify(evaluationRequest)
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      console.error(`Status: ${response.status}`);
      return;
    }

    const result = await response.json();

    console.log('✅ Evaluation completed successfully!');
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log(`📊 Token usage: ${result.metadata?.tokenUsage || 'N/A'}`);
    console.log(`🤖 Model: ${result.metadata?.modelVersion || 'N/A'}`);

    // Display summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 EVALUATION SUMMARY');
    console.log('='.repeat(80));

    console.log('\n📖 Plot Events:');
    console.log(`  ${result.evaluation.summary.plotEvents}`);

    console.log('\n👤 Character Moments:');
    console.log(`  ${result.evaluation.summary.characterMoments}`);

    console.log('\n✨ Key Strengths:');
    result.evaluation.summary.keyStrengths.forEach((strength, i) => {
      console.log(`  ${i + 1}. ${strength}`);
    });

    console.log('\n🔧 Key Improvements:');
    result.evaluation.summary.keyImprovements.forEach((improvement, i) => {
      console.log(`  ${i + 1}. ${improvement}`);
    });

    // Display scores
    console.log('\n' + '='.repeat(80));
    console.log('📈 SCORES');
    console.log('='.repeat(80));

    console.log(`\n🎯 Overall Score: ${result.evaluation.overallScore.toFixed(2)}/4.00`);

    console.log('\nCategory Scores:');
    const categories = Object.entries(result.evaluation.categoryScores);
    categories.forEach(([category, score]) => {
      const barLength = Math.round(score * 5); // 20 chars max
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
      console.log(`  ${category.padEnd(15)}: ${bar} ${score.toFixed(2)}/4.00`);
    });

    // Display detailed metrics for one category (Plot)
    console.log('\n' + '='.repeat(80));
    console.log('🎬 PLOT METRICS (Detailed)');
    console.log('='.repeat(80));

    const plotMetrics = result.evaluation.metrics.plot;
    Object.entries(plotMetrics).forEach(([metric, data]) => {
      console.log(`\n  ${metric}:`);
      console.log(`    Score: ${data.score}/4 (${data.level})`);
    });

    // Display actionable feedback
    console.log('\n' + '='.repeat(80));
    console.log('💡 ACTIONABLE FEEDBACK');
    console.log('='.repeat(80));

    result.evaluation.actionableFeedback.forEach((feedback, i) => {
      console.log(`\n${i + 1}. [${feedback.priority.toUpperCase()}] ${feedback.category.toUpperCase()}`);
      console.log(`\n   🔍 Diagnosis:`);
      console.log(`   ${feedback.diagnosis}`);
      console.log(`\n   💡 Suggestion:`);
      console.log(`   ${feedback.suggestion}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(80) + '\n');

    // Save full result to file for inspection
    const fs = await import('fs');
    const outputPath = path.join(__dirname, '..', 'logs', 'evaluation-test-result.json');
    await fs.promises.writeFile(outputPath, JSON.stringify(result, null, 2));
    console.log(`📄 Full evaluation saved to: ${outputPath}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEvaluation();
