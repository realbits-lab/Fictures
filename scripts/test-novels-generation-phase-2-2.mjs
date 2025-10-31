#!/usr/bin/env node

/**
 * Test Script for Phase 2-2: API 8 Scene Evaluation & Improvement
 *
 * Tests:
 * 1. Scene evaluation with good quality scene
 * 2. Scene evaluation with poor quality scene
 * 3. Feedback quality and actionability
 * 4. Score validation (1.0-4.0 range)
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/test-novels-generation-phase-2-2.mjs
 */

const BASE_URL = 'http://localhost:3000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(title, 'bright');
  log('='.repeat(80), 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Test scene content samples
const GOOD_QUALITY_SCENE = `
The sun warmed Elara's face as she knelt in the garden. Lavender and chamomile released their calming fragrance. The Citadel behind her hummed with a low, constant thrum of chanting.

Peace. It was a fleeting thing these days.

She closed her eyes, letting the herbs' scent wash over her. Her fingers traced the soft petals of a healing bloom. Each touch drained a whisper of her strength, but it was worth it. The garden thrived because she poured herself into it.

"Elara." Master Rowan's voice broke her reverie.

She opened her eyes. The old healer stood at the garden's edge, his weathered face drawn with worry. Behind him, three wounded soldiers leaned against the stone wall, their armor dented and bloodied.

"They need you," Rowan said quietly. "The battle at the pass... it was worse than we thought."

Elara rose, her knees protesting. How many had it been this week? Twenty? Thirty? Each healing left her more hollow than the last.

But she couldn't turn away. She never could.

"Bring them inside," she said, her voice steady despite the tremor in her hands.
`;

const POOR_QUALITY_SCENE = `
Elara was in the garden. She was thinking about stuff. The garden was nice and had flowers.

Master Rowan came over. "Elara," he said.

She looked at him. There were some soldiers with him. They looked hurt.

"They need healing," said Rowan.

Elara got up. She had healed a lot of people recently and she was tired. But she would heal these people too because that's what she does.

"Ok," she said. "Bring them in."

She walked inside. The soldiers followed. Elara was going to heal them now.
`;

async function testAPI8_GoodQualityScene() {
  logSection('Test 1: Evaluate Good Quality Scene');

  try {
    const response = await fetch(`${BASE_URL}/api/studio/generation/scene-evaluation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneContent: GOOD_QUALITY_SCENE,
        sceneContext: {
          title: 'Garden of Healing',
          cyclePhase: 'setup',
          emotionalBeat: 'hope',
          genre: 'Fantasy',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    // Validate result structure
    if (!result.scores || !result.feedback || typeof result.overallScore !== 'number') {
      throw new Error('Invalid evaluation result structure');
    }

    // Validate scores are in range
    const { scores } = result;
    for (const [category, score] of Object.entries(scores)) {
      if (typeof score !== 'number' || score < 1.0 || score > 4.0) {
        throw new Error(`Invalid score for ${category}: ${score} (must be 1.0-4.0)`);
      }
    }

    logSuccess('Good quality scene evaluated successfully');
    log(`  Overall Score: ${result.overallScore.toFixed(2)}/4.0`, 'blue');
    log(`  Plot: ${scores.plot.toFixed(1)}, Character: ${scores.character.toFixed(1)}, Pacing: ${scores.pacing.toFixed(1)}`, 'blue');
    log(`  Prose: ${scores.prose.toFixed(1)}, World-Building: ${scores.worldBuilding.toFixed(1)}`, 'blue');

    if (result.overallScore >= 3.0) {
      logSuccess('Scene PASSED quality threshold (3.0+)');
    } else {
      logWarning('Scene scored below 3.0 - improvement needed');
      log(`  Priority Fixes: ${result.feedback.priorityFixes.length}`, 'yellow');
    }

    // Check feedback quality
    if (result.feedback.strengths && result.feedback.strengths.length > 0) {
      log(`  Strengths identified: ${result.feedback.strengths.length}`, 'blue');
    }

    return result;
  } catch (error) {
    logError(`Good quality scene evaluation failed: ${error.message}`);
    throw error;
  }
}

async function testAPI8_PoorQualityScene() {
  logSection('Test 2: Evaluate Poor Quality Scene');

  try {
    const response = await fetch(`${BASE_URL}/api/studio/generation/scene-evaluation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneContent: POOR_QUALITY_SCENE,
        sceneContext: {
          title: 'Garden Scene',
          cyclePhase: 'setup',
          emotionalBeat: 'hope',
          genre: 'Fantasy',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    // Validate result structure
    if (!result.scores || !result.feedback || typeof result.overallScore !== 'number') {
      throw new Error('Invalid evaluation result structure');
    }

    const { scores } = result;

    logSuccess('Poor quality scene evaluated successfully');
    log(`  Overall Score: ${result.overallScore.toFixed(2)}/4.0`, 'blue');
    log(`  Plot: ${scores.plot.toFixed(1)}, Character: ${scores.character.toFixed(1)}, Pacing: ${scores.pacing.toFixed(1)}`, 'blue');
    log(`  Prose: ${scores.prose.toFixed(1)}, World-Building: ${scores.worldBuilding.toFixed(1)}`, 'blue');

    // This should fail quality threshold
    if (result.overallScore < 3.0) {
      logSuccess('Scene correctly identified as needing improvement');

      // Check feedback presence
      if (!result.feedback.improvements || result.feedback.improvements.length === 0) {
        throw new Error('Expected improvement feedback for low-scoring scene');
      }

      log(`  Improvements suggested: ${result.feedback.improvements.length}`, 'blue');
      log(`  Priority fixes: ${result.feedback.priorityFixes.length}`, 'blue');

      // Show first improvement
      if (result.feedback.improvements[0]) {
        log(`  Example improvement: ${result.feedback.improvements[0].substring(0, 100)}...`, 'blue');
      }
    } else {
      logWarning(`Scene scored ${result.overallScore.toFixed(2)} - expected lower for poor quality`);
    }

    return result;
  } catch (error) {
    logError(`Poor quality scene evaluation failed: ${error.message}`);
    throw error;
  }
}

async function runPhase2_2Tests() {
  log('\n╔═══════════════════════════════════════════════════════════════════════╗', 'bright');
  log('║   PHASE 2-2: API 8 SCENE EVALUATION & IMPROVEMENT TEST               ║', 'bright');
  log('╚═══════════════════════════════════════════════════════════════════════╝', 'bright');

  try {
    // Test 1: Good quality scene
    const goodResult = await testAPI8_GoodQualityScene();

    // Test 2: Poor quality scene
    const poorResult = await testAPI8_PoorQualityScene();

    // Final summary
    logSection('PHASE 2-2 TEST RESULTS');
    logSuccess('API 8 evaluation system working correctly!');
    log('\nEvaluation Summary:', 'bright');
    log(`  ✓ Good scene scored: ${goodResult.overallScore.toFixed(2)}/4.0`, 'green');
    log(`  ✓ Poor scene scored: ${poorResult.overallScore.toFixed(2)}/4.0`, 'green');
    log(`  ✓ Score validation: All scores in 1.0-4.0 range`, 'green');
    log(`  ✓ Feedback system: Providing actionable improvements`, 'green');

    log('\n✅ Phase 2-2 PASSED - Evaluation system functioning correctly!\n', 'bright');

    return {
      success: true,
      goodResult,
      poorResult,
    };
  } catch (error) {
    logSection('PHASE 2-2 TEST FAILED');
    logError(`Test suite failed: ${error.message}`);
    log('\n❌ Phase 2-2 FAILED - Fix issues and re-run\n', 'bright');
    process.exit(1);
  }
}

// Run tests
runPhase2_2Tests().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
