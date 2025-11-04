#!/usr/bin/env tsx

/**
 * Comic Panel Generation Script
 *
 * Generates comic panels for a specific scene using the Toonplay system.
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts <sceneId>
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts <sceneId> --dry-run
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts <sceneId> --force
 *
 * Options:
 *   --dry-run    Preview what would be generated without actually creating panels
 *   --force      Regenerate panels even if they already exist
 *   --verbose    Show detailed generation logs
 *
 * Features:
 *   - Validates scene existence and retrieves scene data
 *   - Uses Toonplay 9-step generation pipeline
 *   - Generates 7-12 panels per scene with optimized images
 *   - Automatic quality evaluation and improvement (up to 2 cycles)
 *   - Creates 4 optimized image variants per panel (AVIF + JPEG × 2 sizes)
 *   - Stores panels in database with full metadata
 *
 * Requirements:
 *   - Valid scene ID from scenes table
 *   - Writer authentication (uses writer@fictures.xyz from .auth/user.json)
 *   - Environment variables in .env.local
 */

import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const sceneId = args.find(arg => !arg.startsWith('--'));
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const isVerbose = args.includes('--verbose');

// Validate arguments
if (!sceneId) {
  console.error('❌ Error: Scene ID is required');
  console.log('\nUsage:');
  console.log('  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts <sceneId>');
  console.log('  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts <sceneId> --dry-run');
  console.log('  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts <sceneId> --force');
  console.log('\nOptions:');
  console.log('  --dry-run    Preview without generating');
  console.log('  --force      Regenerate even if panels exist');
  console.log('  --verbose    Show detailed logs');
  process.exit(1);
}

// Load authentication
const authPath = path.join(__dirname, '..', '.auth', 'user.json');
let writerAuth;
try {
  const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
  writerAuth = authData.profiles.writer;
  if (!writerAuth?.apiKey) {
    throw new Error('Writer API key not found in .auth/user.json');
  }
} catch (error) {
  console.error('❌ Error loading authentication:', error.message);
  console.log('\nMake sure .auth/user.json exists with writer profile and API key');
  process.exit(1);
}

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_KEY = writerAuth.apiKey;

/**
 * Fetch scene data from the database
 */
async function fetchScene(sceneId) {
  if (isVerbose) {
    console.log(`\n🔍 Fetching scene data for: ${sceneId}`);
  }

  try {
    const response = await fetch(`${API_BASE}/studio/api/scenes/${sceneId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`API error: ${response.status} - ${error.message}`);
    }

    const scene = await response.json();

    if (isVerbose) {
      console.log('✅ Scene data retrieved:');
      console.log(`   Title: ${scene.title}`);
      console.log(`   Chapter: ${scene.chapterId}`);
      console.log(`   Content: ${scene.content?.substring(0, 100)}...`);
      console.log(`   Image: ${scene.imageUrl ? 'Yes' : 'No'}`);
      console.log(`   Comic Status: ${scene.comicStatus || 'none'}`);
    }

    return scene;
  } catch (error) {
    throw new Error(`Failed to fetch scene: ${error.message}`);
  }
}

/**
 * Check if panels already exist for this scene
 */
async function checkExistingPanels(sceneId) {
  if (isVerbose) {
    console.log(`\n🔍 Checking for existing panels...`);
  }

  try {
    const response = await fetch(`${API_BASE}/studio/api/scenes/${sceneId}/panels`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        if (isVerbose) {
          console.log('   No existing panels found');
        }
        return [];
      }
      throw new Error(`API error: ${response.status}`);
    }

    const panels = await response.json();

    if (isVerbose && panels.length > 0) {
      console.log(`   Found ${panels.length} existing panels`);
    }

    return panels;
  } catch (error) {
    if (isVerbose) {
      console.log(`   Error checking panels: ${error.message}`);
    }
    return [];
  }
}

/**
 * Generate comic panels using Toonplay system
 */
async function generatePanels(sceneId, scene) {
  console.log(`\n🎨 Generating comic panels for scene: ${scene.title}`);
  console.log('   Using Toonplay 9-step pipeline with quality evaluation\n');

  const startTime = Date.now();

  try {
    // Call the Toonplay generation API (Server-Sent Events)
    const response = await fetch(`${API_BASE}/studio/api/generation/toonplay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sceneId: sceneId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`API error: ${response.status} - ${error.message}`);
    }

    // Process SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let lastEvent = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            continue;
          }

          try {
            const event = JSON.parse(data);
            lastEvent = event;

            // Display progress
            if (event.type === 'progress') {
              console.log(`   [${event.step}/${event.totalSteps}] ${event.message}`);
            } else if (event.type === 'panel') {
              console.log(`   ✓ Panel ${event.panelNumber}: ${event.shotType} - ${event.content?.substring(0, 50)}...`);
            } else if (event.type === 'evaluation') {
              console.log(`   📊 Quality Score: ${event.score.toFixed(2)}/5.0`);
              if (event.score < 3.0) {
                console.log(`   ⚠️  Below threshold, starting improvement cycle...`);
              }
            } else if (event.type === 'improvement') {
              console.log(`   🔄 Improvement cycle ${event.iteration}/2 completed`);
            } else if (event.type === 'complete') {
              console.log(`\n✅ Generation complete!`);
              console.log(`   Total panels: ${event.totalPanels}`);
              console.log(`   Final quality score: ${event.finalScore.toFixed(2)}/5.0`);
              console.log(`   Improvement iterations: ${event.improvementIterations}`);
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (parseError) {
            if (isVerbose) {
              console.log(`   Warning: Could not parse event: ${data}`);
            }
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n⏱️  Generation time: ${duration}s`);

    return lastEvent;
  } catch (error) {
    throw new Error(`Panel generation failed: ${error.message}`);
  }
}

/**
 * Display dry run preview
 */
function displayDryRunPreview(scene, existingPanels) {
  console.log('\n🔍 DRY RUN - Preview of what would be generated:\n');
  console.log('Scene Information:');
  console.log(`  ID: ${scene.id}`);
  console.log(`  Title: ${scene.title}`);
  console.log(`  Chapter: ${scene.chapterId}`);
  console.log(`  Content length: ${scene.content?.length || 0} characters`);
  console.log(`  Comic status: ${scene.comicStatus || 'none'}`);

  if (existingPanels.length > 0) {
    console.log(`\n⚠️  Warning: ${existingPanels.length} panels already exist`);
    if (!isForce) {
      console.log('   Use --force to regenerate them');
    } else {
      console.log('   --force flag detected: will regenerate all panels');
    }
  }

  console.log('\nGeneration Pipeline:');
  console.log('  1. Analyze scene content and structure');
  console.log('  2. Generate panel summaries (7-12 panels)');
  console.log('  3. Create panel content (dialogue, SFX, narrative)');
  console.log('  4. Generate panel images (1344×768px, 7:4 ratio)');
  console.log('  5. Optimize images (4 variants: AVIF + JPEG × 2 sizes)');
  console.log('  6. Evaluate quality (5-category rubric)');
  console.log('  7. Improve if needed (up to 2 cycles)');
  console.log('  8. Store panels in database');
  console.log('  9. Update scene comic status');

  console.log('\nExpected Output:');
  console.log('  - 7-12 comic panels with images');
  console.log('  - 4 optimized variants per image');
  console.log('  - Quality score: 3.0+/5.0');
  console.log('  - Total generation time: 5-15 minutes');

  console.log('\nDatabase Updates:');
  console.log('  - Insert into comic_panels table');
  console.log('  - Update scenes.comic_status to "draft"');
  console.log('  - Store image URLs and variants');

  console.log('\n💡 Remove --dry-run flag to execute generation');
}

/**
 * Main execution
 */
async function main() {
  console.log('🎬 Comic Panel Generation Script');
  console.log('================================\n');
  console.log(`Scene ID: ${sceneId}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'EXECUTE'}`);
  if (isForce) console.log('Force: Enabled (will regenerate existing panels)');
  if (isVerbose) console.log('Verbose: Enabled');

  try {
    // 1. Fetch scene data
    const scene = await fetchScene(sceneId);

    if (!scene) {
      throw new Error('Scene not found');
    }

    // 2. Check existing panels
    const existingPanels = await checkExistingPanels(sceneId);

    if (existingPanels.length > 0 && !isForce && !isDryRun) {
      console.log('\n⚠️  Warning: Panels already exist for this scene');
      console.log(`   Found ${existingPanels.length} existing panels`);
      console.log('\nOptions:');
      console.log('  - Use --force to regenerate panels');
      console.log('  - Use --dry-run to preview generation');
      process.exit(0);
    }

    // 3. Dry run preview
    if (isDryRun) {
      displayDryRunPreview(scene, existingPanels);
      process.exit(0);
    }

    // 4. Generate panels
    const result = await generatePanels(sceneId, scene);

    // 5. Verify generation
    const newPanels = await checkExistingPanels(sceneId);

    console.log('\n📊 Generation Summary:');
    console.log(`   Scene: ${scene.title}`);
    console.log(`   Panels created: ${newPanels.length}`);
    console.log(`   Quality score: ${result?.finalScore?.toFixed(2) || 'N/A'}/5.0`);
    console.log(`   Improvement iterations: ${result?.improvementIterations || 0}`);

    console.log('\n✨ Comic panels generated successfully!');
    console.log(`\nView comic at: ${API_BASE}/comics/${scene.storyId}?scene=${sceneId}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (isVerbose) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Execute
main();
