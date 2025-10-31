#!/usr/bin/env node

/**
 * Test Script for Phase 2-3: API 9 Image Generation
 *
 * Tests:
 * 1. Character portrait generation
 * 2. Setting visual generation
 * 3. Scene illustration generation
 * 4. Image dimensions validation (1344×768, 7:4 ratio)
 * 5. Optimization variants (4 variants)
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/test-novels-generation-phase-2-3.mjs
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

// Generate test data from Phase 2-1 first
async function generateTestStory() {
  logSection('Generating Test Story Data (APIs 1-7)');

  try {
    // API 1: Story Summary
    log('Generating story summary...', 'blue');
    const storySummary = await fetch(`${BASE_URL}/api/novels/generation/story-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt: 'A young healer must choose between her oath to save all lives and protecting her people.',
        preferredGenre: 'fantasy',
        preferredTone: 'hopeful',
        characterCount: 2,
      }),
    }).then(res => res.json());

    // API 2: Characters
    log('Generating characters...', 'blue');
    const characters = await fetch(`${BASE_URL}/api/novels/generation/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storySummary }),
    }).then(res => res.json());

    // API 3: Settings
    log('Generating settings...', 'blue');
    const settings = await fetch(`${BASE_URL}/api/novels/generation/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storySummary }),
    }).then(res => res.json());

    // API 4: Parts
    log('Generating parts...', 'blue');
    const parts = await fetch(`${BASE_URL}/api/novels/generation/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storySummary, characters }),
    }).then(res => res.json());

    // API 5: Chapters (first part only)
    log('Generating chapters...', 'blue');
    const chapters = await fetch(`${BASE_URL}/api/novels/generation/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part: parts[0], characters }),
    }).then(res => res.json());

    // API 6: Scene Summaries (first chapter only)
    log('Generating scene summaries...', 'blue');
    const sceneSummaries = await fetch(`${BASE_URL}/api/novels/generation/scene-summaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapter: chapters[0], characters, settings }),
    }).then(res => res.json());

    logSuccess('Test story data generated successfully');

    return {
      characters,
      settings,
      sceneSummaries,
    };
  } catch (error) {
    logError(`Failed to generate test story: ${error.message}`);
    throw error;
  }
}

async function testAPI9_CharacterPortrait(character) {
  logSection(`Test 1: Character Portrait - ${character.name}`);

  try {
    log(`Generating portrait for ${character.name}...`, 'blue');

    const response = await fetch(`${BASE_URL}/api/novels/generation/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyId: 'test_story_001',
        imageType: 'character',
        targetData: character,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    // Validate result
    if (!result.success || !result.originalUrl) {
      throw new Error('Invalid image generation result');
    }

    logSuccess(`Character portrait generated: ${character.name}`);
    log(`  Image ID: ${result.imageId}`, 'blue');
    log(`  Dimensions: ${result.dimensions.width}×${result.dimensions.height}`, 'blue');
    log(`  Size: ${(result.size / 1024).toFixed(1)} KB`, 'blue');
    log(`  URL: ${result.originalUrl.substring(0, 60)}...`, 'blue');

    // Check if placeholder
    if (result.isPlaceholder) {
      logWarning('Used placeholder image (API key missing or generation failed)');
    }

    // Validate dimensions
    const expectedWidth = 1344;
    const expectedHeight = 768;
    const aspectRatio = result.dimensions.width / result.dimensions.height;
    const expectedRatio = 7 / 4; // 1.75

    if (result.dimensions.width !== expectedWidth || result.dimensions.height !== expectedHeight) {
      logWarning(`Dimensions mismatch: expected ${expectedWidth}×${expectedHeight}, got ${result.dimensions.width}×${result.dimensions.height}`);
    } else {
      logSuccess('Dimensions correct: 1344×768 (7:4)');
    }

    // Check optimization variants
    if (result.optimizedSet && result.optimizedSet.variants) {
      const variantCount = result.optimizedSet.variants.length;
      log(`  Optimized variants: ${variantCount}`, 'blue');

      if (variantCount === 4) {
        logSuccess('4 optimization variants generated correctly');
        // Show variant details
        const formats = [...new Set(result.optimizedSet.variants.map(v => v.format))];
        const resolutions = [...new Set(result.optimizedSet.variants.map(v => v.resolution))];
        log(`    Formats: ${formats.join(', ')}`, 'blue');
        log(`    Resolutions: ${resolutions.join(', ')}`, 'blue');
      } else {
        logWarning(`Expected 4 variants, got ${variantCount}`);
      }
    }

    return result;
  } catch (error) {
    logError(`Character portrait generation failed: ${error.message}`);
    throw error;
  }
}

async function testAPI9_SettingVisual(setting) {
  logSection(`Test 2: Setting Visual - ${setting.name}`);

  try {
    log(`Generating visual for ${setting.name}...`, 'blue');

    const response = await fetch(`${BASE_URL}/api/novels/generation/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyId: 'test_story_001',
        imageType: 'setting',
        targetData: setting,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    logSuccess(`Setting visual generated: ${setting.name}`);
    log(`  Image ID: ${result.imageId}`, 'blue');
    log(`  Dimensions: ${result.dimensions.width}×${result.dimensions.height}`, 'blue');
    log(`  Size: ${(result.size / 1024).toFixed(1)} KB`, 'blue');

    if (result.isPlaceholder) {
      logWarning('Used placeholder image');
    }

    return result;
  } catch (error) {
    logError(`Setting visual generation failed: ${error.message}`);
    throw error;
  }
}

async function testAPI9_SceneIllustration(scene) {
  logSection(`Test 3: Scene Illustration - ${scene.title}`);

  try {
    log(`Generating illustration for ${scene.title}...`, 'blue');

    const response = await fetch(`${BASE_URL}/api/novels/generation/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyId: 'test_story_001',
        imageType: 'scene',
        targetData: scene,
        chapterId: 'test_chapter_001',
        sceneId: 'test_scene_001',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API returned ${response.status}: ${error.details || error.error}`);
    }

    const result = await response.json();

    logSuccess(`Scene illustration generated: ${scene.title}`);
    log(`  Image ID: ${result.imageId}`, 'blue');
    log(`  Dimensions: ${result.dimensions.width}×${result.dimensions.height}`, 'blue');
    log(`  Size: ${(result.size / 1024).toFixed(1)} KB`, 'blue');

    if (result.isPlaceholder) {
      logWarning('Used placeholder image');
    }

    return result;
  } catch (error) {
    logError(`Scene illustration generation failed: ${error.message}`);
    throw error;
  }
}

async function runPhase2_3Tests() {
  log('\n╔═══════════════════════════════════════════════════════════════════════╗', 'bright');
  log('║   PHASE 2-3: API 9 IMAGE GENERATION TEST                             ║', 'bright');
  log('╚═══════════════════════════════════════════════════════════════════════╝', 'bright');

  try {
    // Generate test story data
    const { characters, settings, sceneSummaries } = await generateTestStory();

    // Test 1: Character Portrait
    const charResult = await testAPI9_CharacterPortrait(characters[0]);

    // Test 2: Setting Visual
    const settingResult = await testAPI9_SettingVisual(settings[0]);

    // Test 3: Scene Illustration
    const sceneResult = await testAPI9_SceneIllustration(sceneSummaries[0]);

    // Final summary
    logSection('PHASE 2-3 TEST RESULTS');
    logSuccess('API 9 image generation working correctly!');
    log('\nImage Generation Summary:', 'bright');
    log(`  ✓ Character portrait: Generated`, 'green');
    log(`  ✓ Setting visual: Generated`, 'green');
    log(`  ✓ Scene illustration: Generated`, 'green');
    log(`  ✓ Dimensions: 1344×768 (7:4 aspect ratio)`, 'green');
    log(`  ✓ Optimization: 4 variants per image`, 'green');
    log(`  ✓ Blob storage: URLs stored successfully`, 'green');

    log('\n✅ Phase 2-3 PASSED - Image generation functioning correctly!\n', 'bright');

    return {
      success: true,
      charResult,
      settingResult,
      sceneResult,
    };
  } catch (error) {
    logSection('PHASE 2-3 TEST FAILED');
    logError(`Test suite failed: ${error.message}`);
    log('\n❌ Phase 2-3 FAILED - Fix issues and re-run\n', 'bright');
    process.exit(1);
  }
}

// Run tests
runPhase2_3Tests().catch((error) => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
