#!/usr/bin/env node

/**
 * Generate Comic Panels via API
 *
 * Uses the writer@fictures.xyz API key from .auth/user.json
 * to generate comic panels for a specific scene.
 *
 * Features:
 * - Authenticates with API key
 * - Regenerates existing panels (cleans up old ones)
 * - Monitors progress
 * - Verifies results
 *
 * Usage:
 *   node scripts/generate-comic-panels-api.mjs <scene-id> [options]
 *
 * Options:
 *   --panels <n>    Target number of panels (1-3, default: auto)
 *   --no-regen      Don't regenerate if panels exist
 *   --port <n>      API port (default: 3000)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const sceneId = args[0];
const targetPanelCount = args.includes('--panels') ?
  parseInt(args[args.indexOf('--panels') + 1]) : undefined;
const regenerate = !args.includes('--no-regen');
const port = args.includes('--port') ?
  parseInt(args[args.indexOf('--port') + 1]) : 3000;

if (!sceneId) {
  console.error('❌ Usage: node scripts/generate-comic-panels-api.mjs <scene-id> [options]');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/generate-comic-panels-api.mjs ag6v4reqZNsL7nS_xvoGh');
  console.error('');
  console.error('Options:');
  console.error('  --panels <n>    Target number of panels (1-3)');
  console.error('  --no-regen      Don\'t regenerate if panels exist');
  console.error('  --port <n>      API port (default: 3000)');
  process.exit(1);
}

async function loadAuth() {
  try {
    const authPath = path.join(__dirname, '../.auth/user.json');
    const authData = JSON.parse(await fs.readFile(authPath, 'utf-8'));

    // Extract cookies as header string
    if (!authData.cookies || authData.cookies.length === 0) {
      throw new Error('No cookies found in .auth/user.json');
    }

    const cookieHeader = authData.cookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    return {
      email: authData.email || 'unknown',
      name: authData.name || 'User',
      userId: authData.userId || 'unknown',
      role: authData.role || 'unknown',
      apiKey: authData.apiKey,
      cookies: authData.cookies,
      cookieHeader: cookieHeader,
    };
  } catch (error) {
    console.error('❌ Failed to load authentication data:', error.message);
    process.exit(1);
  }
}

async function generateComicPanels(sceneId, auth, options = {}) {
  const baseUrl = `http://localhost:${port}`;
  const url = `${baseUrl}/api/scenes/${sceneId}/comic/generate`;

  console.log('🎨 Generating Comic Panels\n');
  console.log('━'.repeat(60));
  console.log(`Scene ID: ${sceneId}`);
  console.log(`API Endpoint: ${url}`);
  console.log(`Regenerate: ${options.regenerate ? 'Yes' : 'No'}`);
  if (options.targetPanelCount) {
    console.log(`Target Panels: ${options.targetPanelCount}`);
  }
  console.log('');

  const body = {
    regenerate: options.regenerate,
  };

  if (options.targetPanelCount) {
    body.targetPanelCount = options.targetPanelCount;
  }

  console.log('📡 Sending request...\n');
  const startTime = Date.now();

  try {
    // Comic generation can take 3-5 minutes, set timeout to 10 minutes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000); // 10 minutes

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': auth.cookieHeader,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      console.error(`❌ API Error (${response.status}):`, error.error || error.message);
      return null;
    }

    const result = await response.json();
    console.log(`✓ Generation completed in ${generationTime}s\n`);

    return result;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause.message);
    }
    return null;
  }
}

async function displayResults(result) {
  if (!result || !result.success) {
    console.log('❌ Generation failed or no result');
    return;
  }

  console.log('━'.repeat(60));
  console.log('\n✅ Comic Generation Successful!\n');

  // Scene info
  if (result.scene) {
    console.log('📄 Scene Information:');
    console.log(`   ID: ${result.scene.id}`);
    console.log(`   Title: "${result.scene.title}"`);
    console.log(`   Status: ${result.scene.comicStatus}`);
    console.log(`   Panel Count: ${result.scene.comicPanelCount}`);
    console.log(`   Version: ${result.scene.comicVersion}`);
    console.log(`   Generated: ${new Date(result.scene.comicGeneratedAt).toLocaleString()}`);
    console.log('');
  }

  // Screenplay
  if (result.result?.screenplay) {
    console.log('📜 Screenplay:');
    if (typeof result.result.screenplay === 'string') {
      console.log(`   Length: ${result.result.screenplay.length} characters`);
      const lines = result.result.screenplay.split('\n').slice(0, 3);
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`   ${line.substring(0, 70)}${line.length > 70 ? '...' : ''}`);
        }
      });
    } else if (result.result.screenplay.total_panels) {
      // Screenplay is an object with panel data
      console.log(`   Scene: ${result.result.screenplay.scene_title || 'Unknown'}`);
      console.log(`   Total Panels: ${result.result.screenplay.total_panels}`);
      console.log(`   Narrative Arc: ${result.result.screenplay.narrative_arc || 'N/A'}`);
    }
    console.log('');
  }

  // Panels
  if (result.result?.panels) {
    console.log('🎬 Generated Panels:');
    console.log('');

    result.result.panels.forEach((panel, i) => {
      console.log(`   Panel ${i + 1}/${result.result.panels.length}:`);
      console.log(`     ID: ${panel.id}`);
      console.log(`     Shot Type: ${panel.shot_type}`);
      console.log(`     Image: ${panel.image_url ? '✓ Generated' : '✗ Missing'}`);

      if (panel.dialogue) {
        const dialogueLines = panel.dialogue.slice(0, 2);
        console.log(`     Dialogue: ${dialogueLines.length} line(s)`);
        dialogueLines.forEach(d => {
          const text = d.text.substring(0, 50);
          console.log(`       - ${d.speaker}: "${text}${d.text.length > 50 ? '...' : ''}"`);
        });
      }

      if (panel.sfx && panel.sfx.length > 0) {
        console.log(`     SFX: ${panel.sfx.map(s => s.text).join(', ')}`);
      }

      console.log('');
    });
  }

  // Metadata
  if (result.result?.metadata) {
    console.log('📊 Metadata:');
    const meta = result.result.metadata;
    console.log(`   Model: ${meta.model || 'Unknown'}`);
    console.log(`   Generation Time: ${meta.generationTime || 'Unknown'}`);
    console.log(`   Token Usage: ${meta.tokenUsage || 'Unknown'}`);
    console.log('');
  }

  console.log('━'.repeat(60));
  console.log('');
  console.log('✅ All done! Comic panels saved to database.');
  console.log('');
}

async function main() {
  // Load authentication
  console.log('🔑 Loading authentication...\n');
  const auth = await loadAuth();
  console.log(`✓ Authenticated as: ${auth.name} (${auth.email})`);
  console.log(`✓ User ID: ${auth.userId}`);
  console.log(`✓ Role: ${auth.role}`);
  console.log(`✓ Cookies: ${auth.cookies.length} cookies loaded`);
  console.log('');

  // Generate panels
  const result = await generateComicPanels(sceneId, auth, {
    regenerate,
    targetPanelCount,
  });

  if (!result) {
    console.error('\n❌ Failed to generate comic panels');
    process.exit(1);
  }

  // Display results
  await displayResults(result);

  process.exit(0);
}

main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  console.error(error.stack);
  process.exit(1);
});
