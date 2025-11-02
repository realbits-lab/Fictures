#!/usr/bin/env node

/**
 * Complete Novel Generation Script
 *
 * Generates a complete novel using the Adversity-Triumph Engine with:
 * - Story summary with moral framework
 * - Full character profiles with internal flaws and arcs
 * - Immersive settings with adversity elements
 * - 3-part structure with adversity-triumph cycles
 * - Chapters with virtue-based arcs
 * - Detailed scenes (5 phases per cycle)
 * - AI-generated images (characters, settings, scenes)
 * - Automatic quality evaluation and improvement
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/generate-novel.mjs [prompt]
 *
 * Example:
 *   dotenv --file .env.local run node scripts/generate-novel.mjs "A story about courage"
 *
 * Authentication:
 *   Uses manager@fictures.xyz credentials from .auth/user.json
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config({ path: '.env.local' });

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const userJsonPath = join(__dirname, '..', '.auth', 'user.json');

// Load manager credentials from user.json
let USER_COOKIES;
let USER_EMAIL;
try {
  const userData = JSON.parse(readFileSync(userJsonPath, 'utf8'));
  USER_COOKIES = userData.cookies;
  USER_EMAIL = userData.email;

  if (!USER_COOKIES || USER_COOKIES.length === 0) {
    throw new Error('No cookies found in .auth/user.json');
  }
} catch (error) {
  console.error('❌ Error loading user credentials:', error.message);
  console.log('\n💡 Ensure .auth/user.json exists with valid session cookies');
  console.log('   Run authentication capture script if needed');
  process.exit(1);
}

// Helper to convert cookies array to cookie string
function cookiesToString(cookies) {
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

// Default story prompt if none provided
const DEFAULT_PROMPT = `Create an emotionally resonant story about a young inventor who must overcome self-doubt to save their struggling community. Include themes of perseverance, innovation, and the power of believing in oneself. Create compelling characters with internal conflicts and vivid settings that reflect the moral journey.`;

/**
 * Generate a complete novel using the Adversity-Triumph Engine
 * @param {string} storyPrompt - Description of the story to generate
 * @param {object} options - Additional generation options
 */
async function generateNovel(storyPrompt, options = {}) {
  const apiUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  const cookieString = cookiesToString(USER_COOKIES);

  console.log('\n' + '='.repeat(80));
  console.log('📚 NOVEL GENERATION - ADVERSITY-TRIUMPH ENGINE');
  console.log('='.repeat(80));
  console.log(`\n👤 Account: ${USER_EMAIL}`);
  console.log(`🌐 API URL: ${apiUrl}/studio/api/novels/generate`);
  console.log(`\n📝 Story Prompt:\n   ${storyPrompt}\n`);

  if (options.preferredGenre) console.log(`🎭 Genre: ${options.preferredGenre}`);
  if (options.preferredTone) console.log(`🎨 Tone: ${options.preferredTone}`);
  if (options.characterCount) console.log(`👥 Characters: ${options.characterCount}`);
  if (options.settingCount) console.log(`🏞️  Settings: ${options.settingCount}`);
  if (options.partsCount) console.log(`📚 Parts: ${options.partsCount}`);
  if (options.chaptersPerPart) console.log(`📝 Chapters per Part: ${options.chaptersPerPart}`);
  if (options.scenesPerChapter) console.log(`🎬 Scenes per Chapter: ${options.scenesPerChapter}`);

  console.log('='.repeat(80));

  try {
    console.log('\n🚀 Starting novel generation...\n');

    const response = await fetch(`${apiUrl}/studio/api/novels/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString
      },
      body: JSON.stringify({
        userPrompt: storyPrompt,
        language: 'English',
        ...options
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    console.log('✅ Connection established, streaming progress...\n');

    let storyId = null;
    let storyTitle = null;
    let stats = {
      characters: 0,
      settings: 0,
      parts: 0,
      chapters: 0,
      scenes: 0,
      wordCount: 0,
      generationTime: 0
    };

    // Process the SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    let buffer = '';
    let lastPhase = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            // Show phase transitions
            if (data.phase && data.phase !== lastPhase) {
              const phaseIcon = getPhaseIcon(data.phase);
              console.log(`\n${phaseIcon} Phase: ${formatPhase(data.phase)}`);
              lastPhase = data.phase;
            }

            // Show progress messages
            if (data.message) {
              console.log(`   ${data.message}`);
            }

            // Track completion data
            if (data.phase === 'complete' && data.data) {
              storyId = data.data.storyId;
              storyTitle = data.data.title;
              Object.assign(stats, data.data.stats || {});

              console.log('\n' + '='.repeat(80));
              console.log('🎉 NOVEL GENERATION COMPLETED!');
              console.log('='.repeat(80));
              console.log(`\n📌 Story ID: ${storyId}`);
              console.log(`📖 Title: ${storyTitle}`);
            }

            // Handle errors
            if (data.phase === 'error') {
              throw new Error(data.message || 'Unknown error during generation');
            }

          } catch (parseError) {
            // Ignore parse errors for incomplete JSON chunks
          }
        }
      }
    }

    // Print final summary
    if (storyId) {
      printFinalSummary(storyId, storyTitle, stats, apiUrl);
      return { storyId, storyTitle, stats };
    } else {
      throw new Error('Novel generation incomplete - no story ID received');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    // Provide helpful debugging info
    if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Make sure the development server is running:');
      console.log('   dotenv --file .env.local run pnpm dev');
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('\n💡 Tip: Session may have expired. Re-run authentication capture:');
      console.log('   dotenv --file .env.local run node scripts/capture-manager-auth.mjs');
    }

    throw error;
  }
}

/**
 * Get appropriate icon for each generation phase
 */
function getPhaseIcon(phase) {
  const icons = {
    story_summary: '📖',
    story_summary_complete: '✅',
    characters: '👥',
    characters_complete: '✅',
    settings: '🏞️',
    settings_complete: '✅',
    parts: '📚',
    parts_complete: '✅',
    chapters: '📝',
    chapters_complete: '✅',
    scene_summaries: '🎬',
    scene_summaries_complete: '✅',
    scene_content: '✍️',
    scene_content_complete: '✅',
    scene_evaluation: '🔍',
    images: '🎨',
    images_complete: '✅',
    complete: '🎉',
    error: '❌'
  };

  return icons[phase] || '🔄';
}

/**
 * Format phase name for display
 */
function formatPhase(phase) {
  return phase
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Print comprehensive final summary
 */
function printFinalSummary(storyId, storyTitle, stats, apiUrl) {
  console.log('\n' + '='.repeat(80));
  console.log('✅ GENERATION SUMMARY');
  console.log('='.repeat(80));

  // Story Information
  console.log('\n📖 STORY DETAILS:');
  console.log(`   ID: ${storyId}`);
  console.log(`   Title: ${storyTitle || 'Untitled'}`);

  // Statistics
  console.log('\n📊 STRUCTURE:');
  console.log(`   👥 Characters: ${stats.characters || 0}`);
  console.log(`   🏞️  Settings: ${stats.settings || 0}`);
  console.log(`   📚 Parts: ${stats.parts || 0}`);
  console.log(`   📝 Chapters: ${stats.chapters || 0}`);
  console.log(`   🎬 Scenes: ${stats.scenes || 0}`);

  if (stats.wordCount) {
    console.log(`   📄 Words: ${stats.wordCount.toLocaleString()}`);
  }

  if (stats.generationTime) {
    const minutes = Math.floor(stats.generationTime / 60);
    const seconds = Math.floor(stats.generationTime % 60);
    console.log(`   ⏱️  Generation Time: ${minutes}m ${seconds}s`);
  }

  // Direct Links
  console.log('\n🔗 DIRECT LINKS:');
  console.log(`   🎨 Edit (Studio): ${apiUrl}/studio/edit/story/${storyId}`);
  console.log(`   📖 Read (Novel):  ${apiUrl}/novels/${storyId}`);
  console.log(`   🎨 Read (Comic):  ${apiUrl}/comics/${storyId}`);
  console.log(`   📋 All Stories:   ${apiUrl}/studio`);

  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Review story structure in Studio');
  console.log('   2. Test reading experience in Novel/Comic view');
  console.log('   3. Publish to Community when ready');

  console.log('\n' + '='.repeat(80));
  console.log('✨ Novel generation completed successfully!');
  console.log('='.repeat(80) + '\n');
}

// Main execution
const args = process.argv.slice(2);

// Parse arguments
const options = {};
const promptArgs = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--genre' && i + 1 < args.length) {
    options.preferredGenre = args[++i];
  } else if (arg === '--tone' && i + 1 < args.length) {
    options.preferredTone = args[++i];
  } else if (arg === '--characters' && i + 1 < args.length) {
    options.characterCount = parseInt(args[++i], 10);
  } else if (arg === '--settings' && i + 1 < args.length) {
    options.settingCount = parseInt(args[++i], 10);
  } else if (arg === '--parts' && i + 1 < args.length) {
    options.partsCount = parseInt(args[++i], 10);
  } else if (arg === '--chapters' && i + 1 < args.length) {
    options.chaptersPerPart = parseInt(args[++i], 10);
  } else if (arg === '--scenes' && i + 1 < args.length) {
    options.scenesPerChapter = parseInt(args[++i], 10);
  } else if (!arg.startsWith('--')) {
    promptArgs.push(arg);
  }
}

const storyPrompt = promptArgs.length > 0 ? promptArgs.join(' ') : DEFAULT_PROMPT;

generateNovel(storyPrompt, options)
  .then(({ storyId, storyTitle, stats }) => {
    console.log(`\n✅ Success! Story: ${storyTitle || storyId}`);
    console.log(`📊 Generated ${stats.parts} parts, ${stats.chapters} chapters, ${stats.scenes} scenes\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });
