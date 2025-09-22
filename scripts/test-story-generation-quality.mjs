#!/usr/bin/env node

import EventSource from 'eventsource';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load API key from auth file
const authFile = path.join(__dirname, '..', '.auth', 'user.json');
const authData = JSON.parse(fs.readFileSync(authFile, 'utf8'));

// Configuration
const API_BASE = 'http://localhost:3000';
const API_KEY = process.env.API_KEY || authData.managerCredentials.apiKey;

// Test story prompt - intentionally simple to trigger improvements
const testPrompt = "A detective story about finding truth in a world of lies";

// Analysis results storage
let beforeAnalysis = null;
let afterAnalysis = null;
let improvementSummary = null;

// Helper to parse SSE data
function parseSSEData(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

// Generate story with quality analysis
async function generateStoryWithAnalysis() {
  return new Promise((resolve, reject) => {
    console.log('\n🚀 Starting Story Generation with Quality Analysis\n');
    console.log('Prompt:', testPrompt);
    console.log('=' .repeat(60));

    const url = `${API_BASE}/api/stories/generate-hns`;

    // Use EventSource for SSE
    const eventSource = new EventSource(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY // Use API key authentication
      }
    });

    // Initiate the POST request separately
    const requestBody = JSON.stringify({
      prompt: testPrompt,
      language: "English"
    });

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: requestBody
    }).then(response => {
      if (!response.ok && response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Response is SSE stream, handled by EventSource
    }).catch(error => {
      console.error('Fetch error:', error);
      eventSource.close();
      reject(error);
    });

    eventSource.onmessage = function(event) {
      const data = parseSSEData(event.data);
      if (data) {
        handleSSEEvent(data);

        // Check for completion
        if (data.phase === 'complete' || data.phase === 'error') {
          eventSource.close();
          resolve({
            beforeAnalysis,
            afterAnalysis,
            improvementSummary
          });
        }
      }
    };

    eventSource.onerror = function(error) {
      console.error('EventSource error:', error);
      eventSource.close();
      reject(error);
    };
  });
}

// Handle SSE events and extract analysis data
function handleSSEEvent(data) {
  const { phase, data: eventData } = data;

  switch (phase) {
    case 'progress':
      console.log(`\n📍 ${eventData.step}: ${eventData.message}`);
      break;

    case 'analysis_complete':
      console.log('\n📊 BEFORE IMPROVEMENT - Analysis Results:');
      console.log('─'.repeat(40));
      console.log('Validation:');
      console.log(`  - Overall Valid: ${eventData.validation.overallValid}`);
      console.log(`  - Total Errors: ${eventData.validation.totalErrors}`);
      console.log(`  - Total Warnings: ${eventData.validation.totalWarnings}`);
      console.log('Evaluation:');
      console.log(`  - Overall Score: ${eventData.evaluation.overallScore}/100`);

      beforeAnalysis = {
        validation: eventData.validation,
        evaluation: eventData.evaluation
      };
      break;

    case 'improvement_progress':
      console.log('\n🔧 Improvements Generated:');
      console.log(`  - Total Changes: ${eventData.totalChanges}`);
      console.log(`  - Major Improvements: ${eventData.majorImprovements?.join(', ') || 'None'}`);
      break;

    case 'improvement_complete':
      console.log('\n✨ Improvements Applied Successfully');
      improvementSummary = eventData.summary;
      break;

    case 're_analysis_complete':
      console.log('\n📊 AFTER IMPROVEMENT - Analysis Results:');
      console.log('─'.repeat(40));
      console.log('BEFORE vs AFTER Comparison:');
      console.log('\nValidation:');
      console.log(`  - Overall Valid: ${eventData.before.validation.overallValid} → ${eventData.after.validation.overallValid}`);
      console.log(`  - Total Errors: ${eventData.before.validation.totalErrors} → ${eventData.after.validation.totalErrors} (${eventData.improvement.errorsFixed} fixed)`);
      console.log(`  - Total Warnings: ${eventData.before.validation.totalWarnings} → ${eventData.after.validation.totalWarnings} (${eventData.improvement.warningsReduced} reduced)`);
      console.log('\nEvaluation:');
      console.log(`  - Overall Score: ${eventData.before.evaluation.overallScore}/100 → ${eventData.after.evaluation.overallScore}/100 (+${eventData.improvement.scoreImproved} points)`);

      afterAnalysis = {
        validation: eventData.after.validation,
        evaluation: eventData.after.evaluation,
        improvement: eventData.improvement
      };
      break;

    case 'improvement_skipped':
      console.log('\n✅ Story Quality Already High - No Improvements Needed');
      console.log('Analysis Results:');
      console.log(`  - Overall Valid: ${eventData.analysis.validation.overallValid}`);
      console.log(`  - Total Errors: ${eventData.analysis.validation.totalErrors}`);
      console.log(`  - Total Warnings: ${eventData.analysis.validation.totalWarnings}`);
      console.log(`  - Overall Score: ${eventData.analysis.evaluation.overallScore}/100`);
      break;

    case 'complete':
      console.log('\n🎉 Story Generation Complete!');
      console.log(`  - Story ID: ${eventData.storyId}`);
      console.log(`  - Title: ${eventData.story?.title}`);
      console.log(`  - Characters: ${eventData.characters?.length || 0}`);
      console.log(`  - Settings: ${eventData.settings?.length || 0}`);
      break;

    case 'error':
      console.error('\n❌ Error:', eventData.error);
      break;

    default:
      // Log other phases briefly
      if (eventData.message) {
        console.log(`  ${eventData.message}`);
      }
  }
}

// Generate detailed report
function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📈 QUALITY IMPROVEMENT REPORT');
  console.log('='.repeat(60));

  if (!results.beforeAnalysis || !results.afterAnalysis) {
    console.log('\n⚠️  No improvements were needed - story quality was already high!');
    return;
  }

  console.log('\n📊 VALIDATION IMPROVEMENTS:');
  console.log('─'.repeat(40));
  console.log(`Errors Fixed:     ${results.afterAnalysis.improvement.errorsFixed}`);
  console.log(`Warnings Reduced: ${results.afterAnalysis.improvement.warningsReduced}`);
  console.log(`Valid Status:     ${results.beforeAnalysis.validation.overallValid ? '✅' : '❌'} → ${results.afterAnalysis.validation.overallValid ? '✅' : '❌'}`);

  console.log('\n📊 QUALITY SCORE IMPROVEMENTS:');
  console.log('─'.repeat(40));
  const scoreBefore = results.beforeAnalysis.evaluation.overallScore;
  const scoreAfter = results.afterAnalysis.evaluation.overallScore;
  const improvement = results.afterAnalysis.improvement.scoreImproved;

  console.log(`Before:     ${scoreBefore}/100 ${getScoreEmoji(scoreBefore)}`);
  console.log(`After:      ${scoreAfter}/100 ${getScoreEmoji(scoreAfter)}`);
  console.log(`Improved:   +${improvement} points ${improvement > 0 ? '📈' : '➖'}`);

  // Quality grade
  console.log('\n📊 QUALITY GRADE:');
  console.log('─'.repeat(40));
  console.log(`Before: ${getQualityGrade(scoreBefore)}`);
  console.log(`After:  ${getQualityGrade(scoreAfter)}`);

  if (results.improvementSummary) {
    console.log('\n📝 IMPROVEMENT SUMMARY:');
    console.log('─'.repeat(40));
    console.log(`Total Changes: ${results.improvementSummary.totalChanges}`);

    if (results.improvementSummary.majorImprovements?.length > 0) {
      console.log('\nMajor Improvements:');
      results.improvementSummary.majorImprovements.forEach(imp => {
        console.log(`  • ${imp}`);
      });
    }

    if (results.improvementSummary.minorAdjustments?.length > 0) {
      console.log('\nMinor Adjustments:');
      results.improvementSummary.minorAdjustments.forEach(adj => {
        console.log(`  • ${adj}`);
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Story generation with quality improvements completed!');
  console.log('='.repeat(60));
}

// Helper functions
function getScoreEmoji(score) {
  if (score >= 90) return '🌟';
  if (score >= 80) return '⭐';
  if (score >= 70) return '👍';
  if (score >= 60) return '📝';
  return '⚠️';
}

function getQualityGrade(score) {
  if (score >= 90) return 'A+ - Exceptional';
  if (score >= 85) return 'A - Excellent';
  if (score >= 80) return 'B+ - Very Good';
  if (score >= 75) return 'B - Good';
  if (score >= 70) return 'C+ - Above Average';
  if (score >= 65) return 'C - Average';
  if (score >= 60) return 'D - Below Average';
  return 'F - Needs Major Improvement';
}

// Main execution
async function main() {
  console.log('🎭 Story Generation Quality Test');
  console.log('=' .repeat(60));
  console.log('This test will:');
  console.log('1. Generate a new story');
  console.log('2. Analyze its quality (validation + evaluation)');
  console.log('3. Apply AI-powered improvements');
  console.log('4. Re-analyze to show quality improvements');
  console.log('5. Generate a before/after comparison report');
  console.log('=' .repeat(60));

  if (!API_KEY) {
    console.log('\n⚠️  Warning: No API key provided. Set API_KEY environment variable.');
    console.log('Example: API_KEY=your-api-key node scripts/test-story-generation-quality.mjs\n');
  } else {
    console.log('\n🔑 Using API Key authentication');
    console.log(`   Key: ${API_KEY.substring(0, 20)}...${API_KEY.substring(API_KEY.length - 4)}\n`);
  }

  try {
    const results = await generateStoryWithAnalysis();
    generateReport(results);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);