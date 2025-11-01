/**
 * Comprehensive Novel Generation Test
 *
 * Tests the complete novel generation pipeline with detailed verification:
 * - Database field population
 * - Scene evaluation results
 * - Vercel Blob image generation
 * - Image optimization (4 variants per image)
 * - Directory structure validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { list as listBlobs } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load authentication from .auth/user.json
const authPath = path.join(__dirname, '../.auth/user.json');
const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
const writerProfile = authData.profiles.writer;

const BASE_URL = 'http://localhost:3000';
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Helper to convert cookies array to cookie string
function cookiesToString(cookies) {
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

// Test configuration
const TEST_CONFIG = {
  userPrompt: 'A short story about courage and friendship',
  preferredGenre: 'fantasy',
  preferredTone: 'hopeful',
  characterCount: 2,
  settingCount: 1,
  partsCount: 1,
  chaptersPerPart: 1,
  scenesPerChapter: 3,
  language: 'English',
};

async function runNovelGeneration(cookieString) {
  console.log('📡 Starting novel generation...\n');

  const response = await fetch(`${BASE_URL}/studio/api/novels/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieString,
    },
    body: JSON.stringify(TEST_CONFIG),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Generation failed: ${response.status} ${error}`);
  }

  // Parse SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let storyId = null;
  let lastPhase = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));

        if (data.phase !== lastPhase) {
          console.log(`📍 ${data.phase}`);
          lastPhase = data.phase;
        }

        if (data.phase === 'complete' && data.data?.storyId) {
          storyId = data.data.storyId;
        }

        if (data.phase === 'error') {
          throw new Error(`Generation error: ${data.message}`);
        }
      }
    }
  }

  if (!storyId) {
    throw new Error('No story ID received from generation');
  }

  return storyId;
}

async function verifyDatabaseFields(storyId) {
  console.log('\n🔍 VERIFYING DATABASE FIELDS\n');
  console.log('='.repeat(80));

  const results = {
    stories: {},
    parts: {},
    chapters: {},
    scenes: {},
    characters: {},
    settings: {},
  };

  try {
    // Fetch story data
    const storyRes = await fetch(`${BASE_URL}/api/stories/${storyId}`);
    const story = await storyRes.json();

    // Check Stories table fields
    console.log('\n📊 STORIES TABLE:');
    results.stories = {
      id: story.id ? '✓' : '✗',
      title: story.title ? '✓' : '✗',
      summary: story.summary ? '✓' : '✗',
      tone: story.tone ? '✓' : '✗',
      moralFramework: story.moralFramework ? '✓' : '✗',
      imageUrl: story.imageUrl ? '✓' : '✗',
      imageVariants: story.imageVariants ? '✓' : '✗',
      // Check deprecated fields are NOT used
      description: story.description === '' || !story.description ? '✓ (empty)' : '✗ (should be empty)',
      content: story.content === '' || !story.content ? '✓ (empty)' : '✗ (should be empty)',
      premise: !story.premise ? '✓ (null)' : '✗ (should be null)',
      dramaticQuestion: !story.dramaticQuestion ? '✓ (null)' : '✗ (should be null)',
      theme: !story.theme ? '✓ (null)' : '✗ (should be null)',
    };

    Object.entries(results.stories).forEach(([field, status]) => {
      console.log(`  ${field.padEnd(20)} ${status}`);
    });

    // Fetch and check Parts
    const partsRes = await fetch(`${BASE_URL}/api/stories/${storyId}/parts`);
    const parts = await partsRes.json();

    console.log('\n📊 PARTS TABLE:');
    if (parts.length > 0) {
      const part = parts[0];
      results.parts = {
        id: part.id ? '✓' : '✗',
        title: part.title ? '✓' : '✗',
        summary: part.summary ? '✓' : '✗',
        actNumber: part.actNumber !== undefined ? '✓' : '✗',
        characterArcs: part.characterArcs ? '✓' : '✗',
      };
      Object.entries(results.parts).forEach(([field, status]) => {
        console.log(`  ${field.padEnd(20)} ${status}`);
      });
    }

    // Fetch and check Chapters
    const chaptersRes = await fetch(`${BASE_URL}/api/stories/${storyId}/chapters`);
    const chapters = await chaptersRes.json();

    console.log('\n📊 CHAPTERS TABLE:');
    if (chapters.length > 0) {
      const chapter = chapters[0];
      results.chapters = {
        id: chapter.id ? '✓' : '✗',
        title: chapter.title ? '✓' : '✗',
        summary: chapter.summary ? '✓' : '✗',
        characterId: chapter.characterId ? '✓' : '✗',
        arcPosition: chapter.arcPosition ? '✓' : '✗',
        adversityType: chapter.adversityType ? '✓' : '✗',
        virtueType: chapter.virtueType ? '✓' : '✗',
        seedsPlanted: chapter.seedsPlanted ? '✓' : '✗',
        connectsToPreviousChapter: chapter.connectsToPreviousChapter !== undefined ? '✓' : '✗',
        createsNextAdversity: chapter.createsNextAdversity !== undefined ? '✓' : '✗',
      };
      Object.entries(results.chapters).forEach(([field, status]) => {
        console.log(`  ${field.padEnd(30)} ${status}`);
      });
    }

    // Fetch and check Scenes
    const scenesRes = await fetch(`${BASE_URL}/api/stories/${storyId}/scenes`);
    const scenes = await scenesRes.json();

    console.log('\n📊 SCENES TABLE:');
    if (scenes.length > 0) {
      const scene = scenes[0];
      results.scenes = {
        id: scene.id ? '✓' : '✗',
        title: scene.title ? '✓' : '✗',
        summary: scene.summary ? '✓' : '✗',
        content: scene.content ? '✓' : '✗',
        cyclePhase: scene.cyclePhase ? '✓' : '✗',
        emotionalBeat: scene.emotionalBeat ? '✓' : '✗',
        imageUrl: scene.imageUrl ? '✓' : '✗',
        imageVariants: scene.imageVariants ? '✓' : '✗',
        wordCount: scene.wordCount > 0 ? '✓' : '✗',
      };
      Object.entries(results.scenes).forEach(([field, status]) => {
        console.log(`  ${field.padEnd(20)} ${status}`);
      });
    }

    // Fetch and check Characters
    const charsRes = await fetch(`${BASE_URL}/api/stories/${storyId}/characters`);
    const characters = await charsRes.json();

    console.log('\n📊 CHARACTERS TABLE:');
    if (characters.length > 0) {
      const char = characters[0];
      results.characters = {
        id: char.id ? '✓' : '✗',
        name: char.name ? '✓' : '✗',
        isMain: char.isMain !== undefined ? '✓' : '✗',
        summary: char.summary ? '✓' : '✗',
        coreTrait: char.coreTrait ? '✓' : '✗',
        internalFlaw: char.internalFlaw ? '✓' : '✗',
        externalGoal: char.externalGoal ? '✓' : '✗',
        personality: char.personality ? '✓' : '✗',
        backstory: char.backstory ? '✓' : '✗',
        voiceStyle: char.voiceStyle ? '✓' : '✗',
        physicalDescription: char.physicalDescription ? '✓' : '✗',
        imageUrl: char.imageUrl ? '✓' : '✗',
        imageVariants: char.imageVariants ? '✓' : '✗',
      };
      Object.entries(results.characters).forEach(([field, status]) => {
        console.log(`  ${field.padEnd(25)} ${status}`);
      });
    }

    // Fetch and check Settings
    const settingsRes = await fetch(`${BASE_URL}/api/stories/${storyId}/settings`);
    const settings = await settingsRes.json();

    console.log('\n📊 SETTINGS TABLE:');
    if (settings.length > 0) {
      const setting = settings[0];
      results.settings = {
        id: setting.id ? '✓' : '✗',
        name: setting.name ? '✓' : '✗',
        description: setting.description ? '✓' : '✗',
        mood: setting.mood ? '✓' : '✗',
        adversityElements: setting.adversityElements ? '✓' : '✗',
        symbolicMeaning: setting.symbolicMeaning ? '✓' : '✗',
        cycleAmplification: setting.cycleAmplification ? '✓' : '✗',
        sensory: setting.sensory ? '✓' : '✗',
        imageUrl: setting.imageUrl ? '✓' : '✗',
        imageVariants: setting.imageVariants ? '✓' : '✗',
      };
      Object.entries(results.settings).forEach(([field, status]) => {
        console.log(`  ${field.padEnd(25)} ${status}`);
      });
    }

    return { success: true, results, story, scenes, characters, settings };

  } catch (error) {
    console.error(`\n❌ Database verification failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function verifySceneEvaluation(scenes) {
  console.log('\n\n🎯 SCENE EVALUATION RESULTS\n');
  console.log('='.repeat(80));

  if (!scenes || scenes.length === 0) {
    console.log('❌ No scenes found');
    return { success: false };
  }

  const evaluationResults = [];

  scenes.forEach((scene, index) => {
    console.log(`\n📝 Scene ${index + 1}: ${scene.title}`);
    console.log(`   Word Count: ${scene.wordCount || 0}`);
    console.log(`   Cycle Phase: ${scene.cyclePhase || 'N/A'}`);
    console.log(`   Emotional Beat: ${scene.emotionalBeat || 'N/A'}`);

    // Check content formatting
    if (scene.content) {
      const paragraphs = scene.content.split('\n\n');
      const hasParagraphs = paragraphs.length > 1;
      const avgWordsPerParagraph = scene.wordCount / paragraphs.length;

      console.log(`   Paragraphs: ${paragraphs.length}`);
      console.log(`   Avg words/paragraph: ${Math.round(avgWordsPerParagraph)}`);
      console.log(`   Formatting: ${hasParagraphs ? '✓ Multiple paragraphs' : '⚠️  Single paragraph'}`);

      evaluationResults.push({
        sceneId: scene.id,
        title: scene.title,
        wordCount: scene.wordCount,
        paragraphCount: paragraphs.length,
        avgWordsPerParagraph: Math.round(avgWordsPerParagraph),
        formatted: hasParagraphs,
      });
    } else {
      console.log(`   ❌ No content`);
      evaluationResults.push({
        sceneId: scene.id,
        title: scene.title,
        hasContent: false,
      });
    }
  });

  return { success: true, results: evaluationResults };
}

async function verifyVercelBlobImages(storyId, story, characters, settings, scenes) {
  console.log('\n\n🖼️  VERCEL BLOB IMAGE VERIFICATION\n');
  console.log('='.repeat(80));

  if (!BLOB_READ_WRITE_TOKEN) {
    console.log('❌ BLOB_READ_WRITE_TOKEN not set');
    return { success: false, error: 'Missing token' };
  }

  try {
    // List all blobs for this story
    const prefix = `stories/${storyId}/`;
    console.log(`\n📂 Listing blobs with prefix: ${prefix}\n`);

    const { blobs } = await listBlobs({
      prefix,
      token: BLOB_READ_WRITE_TOKEN,
    });

    console.log(`Found ${blobs.length} total blob files\n`);

    // Categorize blobs
    const blobsByType = {
      cover: [],
      characters: [],
      settings: [],
      scenes: [],
      optimized: [],
    };

    blobs.forEach(blob => {
      const path = blob.pathname;
      if (path.includes('/cover/')) blobsByType.cover.push(blob);
      else if (path.includes('/characters/')) blobsByType.characters.push(blob);
      else if (path.includes('/settings/')) blobsByType.settings.push(blob);
      else if (path.includes('/scenes/')) blobsByType.scenes.push(blob);
      if (path.includes('/optimized/')) blobsByType.optimized.push(blob);
    });

    // Report by category
    console.log('📊 Images by Category:');
    console.log(`  Cover:       ${blobsByType.cover.length}`);
    console.log(`  Characters:  ${blobsByType.characters.length}`);
    console.log(`  Settings:    ${blobsByType.settings.length}`);
    console.log(`  Scenes:      ${blobsByType.scenes.length}`);
    console.log(`  Optimized:   ${blobsByType.optimized.length}`);

    // Verify story cover
    console.log('\n📷 Story Cover:');
    if (story.imageUrl) {
      console.log(`  ✓ Original: ${story.imageUrl}`);
      if (story.imageVariants?.variants) {
        console.log(`  ✓ Variants: ${story.imageVariants.variants.length}`);
      } else {
        console.log(`  ⚠️  No variants found`);
      }
    } else {
      console.log(`  ❌ No cover image`);
    }

    // Verify character images
    console.log('\n👥 Character Images:');
    characters.forEach(char => {
      console.log(`  ${char.name}:`);
      console.log(`    Original: ${char.imageUrl ? '✓' : '❌'}`);
      console.log(`    Variants: ${char.imageVariants?.variants?.length || 0}`);
    });

    // Verify setting images
    console.log('\n🌍 Setting Images:');
    settings.forEach(setting => {
      console.log(`  ${setting.name}:`);
      console.log(`    Original: ${setting.imageUrl ? '✓' : '❌'}`);
      console.log(`    Variants: ${setting.imageVariants?.variants?.length || 0}`);
    });

    // Verify scene images
    console.log('\n🎬 Scene Images:');
    scenes.forEach(scene => {
      console.log(`  ${scene.title}:`);
      console.log(`    Original: ${scene.imageUrl ? '✓' : '❌'}`);
      console.log(`    Variants: ${scene.imageVariants?.variants?.length || 0}`);
    });

    // Verify optimization structure
    console.log('\n🔧 Image Optimization Verification:');
    const expectedVariantsPerImage = 4; // AVIF, JPEG × mobile 1x/2x
    const totalOriginalImages = 1 + characters.length + settings.length + scenes.length; // cover + chars + settings + scenes
    const expectedTotalVariants = totalOriginalImages * expectedVariantsPerImage;

    console.log(`  Expected images: ${totalOriginalImages} (1 cover + ${characters.length} chars + ${settings.length} settings + ${scenes.length} scenes)`);
    console.log(`  Expected variants per image: ${expectedVariantsPerImage}`);
    console.log(`  Expected total variants: ${expectedTotalVariants}`);
    console.log(`  Found optimized blobs: ${blobsByType.optimized.length}`);

    const optimizationStatus = blobsByType.optimized.length >= expectedTotalVariants ? '✓' : '⚠️';
    console.log(`  Status: ${optimizationStatus}`);

    return {
      success: true,
      totalBlobs: blobs.length,
      blobsByType,
      expectedVariants: expectedTotalVariants,
      foundVariants: blobsByType.optimized.length,
    };

  } catch (error) {
    console.error(`\n❌ Blob verification failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function generateComprehensiveReport(storyId, dbResults, evalResults, blobResults) {
  console.log('\n\n📋 COMPREHENSIVE TEST REPORT\n');
  console.log('='.repeat(80));

  const report = {
    storyId,
    timestamp: new Date().toISOString(),
    database: {},
    sceneEvaluation: {},
    images: {},
    summary: {
      passed: [],
      warnings: [],
      failed: [],
    },
  };

  // Database checks
  console.log('\n✅ DATABASE FIELD POPULATION:');
  if (dbResults.success) {
    Object.entries(dbResults.results).forEach(([table, fields]) => {
      const passedFields = Object.values(fields).filter(v => v.includes('✓')).length;
      const totalFields = Object.keys(fields).length;
      const status = passedFields === totalFields ? '✓' : '⚠️';
      console.log(`  ${table.padEnd(15)} ${passedFields}/${totalFields} fields ${status}`);

      if (passedFields === totalFields) {
        report.summary.passed.push(`${table} table fully populated`);
      } else {
        report.summary.warnings.push(`${table} table partially populated (${passedFields}/${totalFields})`);
      }
    });
    report.database = dbResults.results;
  } else {
    console.log(`  ❌ Database verification failed`);
    report.summary.failed.push('Database verification failed');
  }

  // Scene evaluation
  console.log('\n✅ SCENE EVALUATION:');
  if (evalResults.success && evalResults.results) {
    const totalScenes = evalResults.results.length;
    const formattedScenes = evalResults.results.filter(s => s.formatted).length;
    const avgWordCount = Math.round(
      evalResults.results.reduce((sum, s) => sum + (s.wordCount || 0), 0) / totalScenes
    );

    console.log(`  Total scenes: ${totalScenes}`);
    console.log(`  Formatted scenes: ${formattedScenes}/${totalScenes} ✓`);
    console.log(`  Avg word count: ${avgWordCount}`);

    report.sceneEvaluation = {
      totalScenes,
      formattedScenes,
      avgWordCount,
      scenes: evalResults.results,
    };

    if (formattedScenes === totalScenes) {
      report.summary.passed.push('All scenes properly formatted');
    } else {
      report.summary.warnings.push(`${totalScenes - formattedScenes} scenes need formatting`);
    }
  }

  // Image verification
  console.log('\n✅ IMAGE GENERATION:');
  if (blobResults.success) {
    console.log(`  Total blob files: ${blobResults.totalBlobs}`);
    console.log(`  Expected variants: ${blobResults.expectedVariants}`);
    console.log(`  Found variants: ${blobResults.foundVariants}`);

    const variantStatus = blobResults.foundVariants >= blobResults.expectedVariants ? '✓' : '⚠️';
    console.log(`  Optimization status: ${variantStatus}`);

    report.images = {
      totalBlobs: blobResults.totalBlobs,
      expectedVariants: blobResults.expectedVariants,
      foundVariants: blobResults.foundVariants,
      blobsByType: Object.fromEntries(
        Object.entries(blobResults.blobsByType).map(([k, v]) => [k, v.length])
      ),
    };

    if (blobResults.foundVariants >= blobResults.expectedVariants) {
      report.summary.passed.push('All images optimized');
    } else {
      report.summary.warnings.push(`Missing ${blobResults.expectedVariants - blobResults.foundVariants} optimized variants`);
    }
  } else {
    console.log(`  ❌ Image verification failed`);
    report.summary.failed.push('Image verification failed');
  }

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log(`  ✅ Passed: ${report.summary.passed.length}`);
  console.log(`  ⚠️  Warnings: ${report.summary.warnings.length}`);
  console.log(`  ❌ Failed: ${report.summary.failed.length}`);

  if (report.summary.passed.length > 0) {
    console.log('\n  Passed checks:');
    report.summary.passed.forEach(item => console.log(`    ✓ ${item}`));
  }

  if (report.summary.warnings.length > 0) {
    console.log('\n  Warnings:');
    report.summary.warnings.forEach(item => console.log(`    ⚠️  ${item}`));
  }

  if (report.summary.failed.length > 0) {
    console.log('\n  Failed checks:');
    report.summary.failed.forEach(item => console.log(`    ❌ ${item}`));
  }

  // Save report to file
  const reportPath = path.join(__dirname, '../logs/novel-generation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to: ${reportPath}`);

  return report;
}

async function main() {
  console.log('🧪 COMPREHENSIVE NOVEL GENERATION TEST\n');
  console.log('='.repeat(80));
  console.log('\nConfiguration:');
  Object.entries(TEST_CONFIG).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  console.log('');

  const cookieString = cookiesToString(writerProfile.cookies);

  try {
    // Step 1: Generate novel
    const storyId = await runNovelGeneration(cookieString);
    console.log(`\n✅ Story generated: ${storyId}\n`);

    // Step 2: Verify database fields
    const dbResults = await verifyDatabaseFields(storyId);

    // Step 3: Verify scene evaluation
    const evalResults = await verifySceneEvaluation(dbResults.scenes);

    // Step 4: Verify Vercel Blob images
    const blobResults = await verifyVercelBlobImages(
      storyId,
      dbResults.story,
      dbResults.characters,
      dbResults.settings,
      dbResults.scenes
    );

    // Step 5: Generate comprehensive report
    const report = await generateComprehensiveReport(storyId, dbResults, evalResults, blobResults);

    // Final status
    const allPassed = report.summary.failed.length === 0 && report.summary.warnings.length === 0;
    console.log('\n' + '='.repeat(80));
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED!');
      process.exit(0);
    } else if (report.summary.failed.length === 0) {
      console.log('⚠️  TESTS PASSED WITH WARNINGS');
      process.exit(0);
    } else {
      console.log('❌ SOME TESTS FAILED');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
