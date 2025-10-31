#!/usr/bin/env node

/**
 * Test Script for Phase 2-1: APIs 1-7 Text Generation Flow
 *
 * Tests the complete text generation pipeline:
 * 1. Story Summary Generation (API 1)
 * 2. Character Generation (API 2)
 * 3. Settings Generation (API 3)
 * 4. Part Summaries Generation (API 4)
 * 5. Chapter Summaries Generation (API 5)
 * 6. Scene Summaries Generation (API 6)
 * 7. Scene Content Generation (API 7)
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/test-novels-generation-phase-2-1.mjs
 */

const BASE_URL = 'http://localhost:3000';

// Test prompt
const TEST_PROMPT = `
A young healer in a war-torn fantasy kingdom must choose between her oath to save all lives
and her desire to protect her people from an invading army. She possesses a rare gift -
the ability to heal any wound - but each healing takes a piece of her own life force.
`.trim();

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

async function testAPI1_StorySummary() {
  logSection('API 1: Story Summary Generation');

  try {
    const response = await fetch(`${BASE_URL}/api/novels/generation/story-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt: TEST_PROMPT,
        preferredGenre: 'fantasy',
        preferredTone: 'hopeful',
        characterCount: 3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    // Validate result structure
    if (!result.summary || !result.genre || !result.moralFramework) {
      throw new Error('Missing required fields in story summary');
    }

    if (!result.characters || result.characters.length < 2) {
      throw new Error('Insufficient characters generated');
    }

    logSuccess('Story summary generated successfully');
    log(`  Genre: ${result.genre}`, 'blue');
    log(`  Tone: ${result.tone}`, 'blue');
    log(`  Characters: ${result.characters.length}`, 'blue');
    log(`  Summary: ${result.summary.substring(0, 100)}...`, 'blue');

    return result;
  } catch (error) {
    logError(`Story Summary Generation failed: ${error.message}`);
    throw error;
  }
}

async function testAPI2_Characters(storySummary) {
  logSection('API 2: Character Generation');

  try {
    const response = await fetch(`${BASE_URL}/api/novels/generation/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storySummary }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    // Validate result
    if (!Array.isArray(result) || result.length !== storySummary.characters.length) {
      throw new Error('Character count mismatch');
    }

    for (const char of result) {
      if (!char.id || !char.name || !char.backstory || !char.relationships) {
        throw new Error(`Invalid character data for ${char.name}`);
      }
    }

    logSuccess(`${result.length} characters expanded successfully`);
    for (const char of result) {
      log(`  ${char.name} (${char.isMain ? 'MAIN' : 'Supporting'})`, 'blue');
      log(`    Flaw: ${char.internalFlaw}`, 'blue');
      log(`    Relationships: ${Object.keys(char.relationships).length}`, 'blue');
    }

    return result;
  } catch (error) {
    logError(`Character Generation failed: ${error.message}`);
    throw error;
  }
}

async function testAPI3_Settings(storySummary) {
  logSection('API 3: Settings Generation');

  try {
    const response = await fetch(`${BASE_URL}/api/novels/generation/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storySummary }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    // Validate result
    if (!Array.isArray(result) || result.length < 2 || result.length > 3) {
      throw new Error('Settings count should be 2-3');
    }

    for (const setting of result) {
      if (!setting.id || !setting.name || !setting.adversityElements || !setting.cycleAmplification) {
        throw new Error(`Invalid setting data for ${setting.name}`);
      }
    }

    logSuccess(`${result.length} settings generated successfully`);
    for (const setting of result) {
      log(`  ${setting.name}`, 'blue');
      log(`    Mood: ${setting.mood}`, 'blue');
      log(`    Physical Obstacles: ${setting.adversityElements.physicalObstacles.length}`, 'blue');
    }

    return result;
  } catch (error) {
    logError(`Settings Generation failed: ${error.message}`);
    throw error;
  }
}

async function testAPI4_Parts(storySummary, characters) {
  logSection('API 4: Part Summaries Generation');

  try {
    const response = await fetch(`${BASE_URL}/api/novels/generation/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storySummary, characters }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    // Validate result
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('No parts generated');
    }

    logSuccess(`${result.length} parts (acts) generated successfully`);
    for (const part of result) {
      log(`  Act ${part.actNumber}: ${part.title}`, 'blue');
      log(`    Character Arcs: ${part.characterArcs.length}`, 'blue');
    }

    return result;
  } catch (error) {
    logError(`Part Summaries Generation failed: ${error.message}`);
    throw error;
  }
}

async function testAPI5_Chapters(parts, characters) {
  logSection('API 5: Chapter Summaries Generation');

  try {
    // Test with first part only to keep test time reasonable
    const firstPart = parts[0];

    const response = await fetch(`${BASE_URL}/api/novels/generation/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part: firstPart, characters }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    // Validate result
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error('No chapters generated');
    }

    for (const chapter of result) {
      if (!chapter.title || !chapter.summary || !chapter.virtueType) {
        throw new Error(`Invalid chapter data for ${chapter.title}`);
      }
    }

    logSuccess(`${result.length} chapters generated for ${firstPart.title}`);
    for (const chapter of result) {
      log(`  ${chapter.title}`, 'blue');
      log(`    Virtue: ${chapter.virtueType}, Arc: ${chapter.arcPosition}`, 'blue');
      log(`    Seeds: ${chapter.seedsPlanted.length} planted, ${chapter.seedsResolved.length} resolved`, 'blue');
    }

    return result;
  } catch (error) {
    logError(`Chapter Summaries Generation failed: ${error.message}`);
    throw error;
  }
}

async function testAPI6_SceneSummaries(chapter, characters, settings) {
  logSection('API 6: Scene Summaries Generation');

  try {
    // Test with first chapter
    const response = await fetch(`${BASE_URL}/api/novels/generation/scene-summaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter, characters, settings }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    // Validate result
    if (!Array.isArray(result) || result.length < 5 || result.length > 8) {
      throw new Error('Scene count should be 5-8');
    }

    // Check for virtue scene
    const virtueScene = result.find(s => s.cyclePhase === 'virtue');
    if (!virtueScene) {
      throw new Error('No virtue scene found');
    }

    if (virtueScene.suggestedLength !== 'long') {
      logWarning('Virtue scene should be marked as "long"');
    }

    logSuccess(`${result.length} scene summaries generated for ${chapter.title}`);
    for (const scene of result) {
      log(`  ${scene.title} [${scene.cyclePhase}]`, 'blue');
      log(`    Beat: ${scene.emotionalBeat}, Length: ${scene.suggestedLength}`, 'blue');
    }

    return result;
  } catch (error) {
    logError(`Scene Summaries Generation failed: ${error.message}`);
    throw error;
  }
}

async function testAPI7_SceneContent(sceneSummary, characters, settings, chapter, storySummary) {
  logSection('API 7: Scene Content Generation');

  try {
    // Test with first scene (setup)
    const response = await fetch(`${BASE_URL}/api/novels/generation/scene-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sceneSummary,
        characters,
        settings,
        chapterContext: {
          title: chapter.title,
          summary: chapter.summary,
          virtueType: chapter.virtueType,
        },
        storyContext: {
          genre: storySummary.genre,
          tone: storySummary.tone,
          moralFramework: storySummary.moralFramework,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    // Validate result
    if (!result.content || !result.wordCount) {
      throw new Error('Invalid scene content result');
    }

    // Check word count matches suggested length
    const expectedWordCount = {
      short: [400, 600],
      medium: [600, 800],
      long: [800, 1000],
    };

    const [minWords, maxWords] = expectedWordCount[sceneSummary.suggestedLength];
    if (result.wordCount < minWords * 0.8) {
      logWarning(`Scene is shorter than expected: ${result.wordCount} words (expected ${minWords}-${maxWords})`);
    }

    logSuccess(`Scene content generated: ${result.wordCount} words`);
    log(`  Title: ${sceneSummary.title}`, 'blue');
    log(`  Emotional Tone: ${result.emotionalTone}`, 'blue');
    log(`  First 200 chars: ${result.content.substring(0, 200)}...`, 'blue');

    return result;
  } catch (error) {
    logError(`Scene Content Generation failed: ${error.message}`);
    throw error;
  }
}

async function runPhase2_1Tests() {
  log('\n╔═══════════════════════════════════════════════════════════════════════╗', 'bright');
  log('║   PHASE 2-1: APIs 1-7 TEXT GENERATION FLOW TEST                      ║', 'bright');
  log('╚═══════════════════════════════════════════════════════════════════════╝', 'bright');

  try {
    // Test API 1: Story Summary
    const storySummary = await testAPI1_StorySummary();

    // Test API 2: Characters
    const characters = await testAPI2_Characters(storySummary);

    // Test API 3: Settings
    const settings = await testAPI3_Settings(storySummary);

    // Test API 4: Parts
    const parts = await testAPI4_Parts(storySummary, characters);

    // Test API 5: Chapters
    const chapters = await testAPI5_Chapters(parts, characters);

    // Test API 6: Scene Summaries
    const sceneSummaries = await testAPI6_SceneSummaries(chapters[0], characters, settings);

    // Test API 7: Scene Content
    await testAPI7_SceneContent(sceneSummaries[0], characters, settings, chapters[0], storySummary);

    // Final summary
    logSection('PHASE 2-1 TEST RESULTS');
    logSuccess('All APIs (1-7) tested successfully!');
    log('\nGeneration Pipeline Summary:', 'bright');
    log(`  ✓ Story Summary: 1 generated`, 'green');
    log(`  ✓ Characters: ${characters.length} generated`, 'green');
    log(`  ✓ Settings: ${settings.length} generated`, 'green');
    log(`  ✓ Parts: ${parts.length} generated`, 'green');
    log(`  ✓ Chapters: ${chapters.length} generated (first part)`, 'green');
    log(`  ✓ Scene Summaries: ${sceneSummaries.length} generated (first chapter)`, 'green');
    log(`  ✓ Scene Content: 1 generated (first scene)`, 'green');

    log('\n✅ Phase 2-1 PASSED - Text generation pipeline working correctly!\n', 'bright');

    return {
      success: true,
      storySummary,
      characters,
      settings,
      parts,
      chapters,
      sceneSummaries,
    };
  } catch (error) {
    logSection('PHASE 2-1 TEST FAILED');
    logError(`Test suite failed: ${error.message}`);
    log('\n❌ Phase 2-1 FAILED - Fix issues and re-run\n', 'bright');
    process.exit(1);
  }
}

// Run tests
runPhase2_1Tests().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
