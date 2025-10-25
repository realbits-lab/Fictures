#!/usr/bin/env node

/**
 * Complete Story Generation Script
 *
 * This script generates a complete story with full structure including:
 * - Story metadata (title, genre, premise, etc.)
 * - Parts (story sections)
 * - Chapters (within parts)
 * - Scenes (within chapters with full content)
 * - Characters (with generated images)
 * - Settings (with generated images)
 *
 * Usage:
 *   node scripts/generate-complete-story.mjs [story-prompt]
 *
 * Example:
 *   node scripts/generate-complete-story.mjs "A detective story about AI"
 *
 * Authentication:
 *   Uses writer@fictures.xyz credentials from .auth/user.json
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

// Load writer credentials from user.json
let API_KEY;
let WRITER_EMAIL;
try {
  const userData = JSON.parse(readFileSync(userJsonPath, 'utf8'));
  const writerProfile = userData.profiles?.writer;

  if (!writerProfile) {
    throw new Error('Writer profile not found in .auth/user.json');
  }

  API_KEY = writerProfile.apiKey;
  WRITER_EMAIL = writerProfile.email;

  if (!API_KEY) {
    throw new Error('Writer API key not found in .auth/user.json');
  }
} catch (error) {
  console.error('❌ Error loading writer credentials:', error.message);
  console.log('\n💡 Ensure .auth/user.json exists with writer profile');
  process.exit(1);
}

// Default story prompt if none provided
const DEFAULT_PROMPT = `Create an epic science fiction story about a colony ship traveling to a distant star system. The crew discovers an ancient alien artifact that begins affecting their minds and reality itself. Include themes of isolation, discovery, and the nature of consciousness. Create compelling characters with distinct personalities and vivid space settings.`;

/**
 * Generate a complete story using the HNS (Hook, Need, Setup) methodology
 * @param {string} storyPrompt - Description of the story to generate
 */
async function generateCompleteStory(storyPrompt) {
  const apiUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  console.log('\n' + '='.repeat(80));
  console.log('📚 COMPLETE STORY GENERATION');
  console.log('='.repeat(80));
  console.log(`\n👤 Writer: ${WRITER_EMAIL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`🌐 API URL: ${apiUrl}/api/stories/generate-hns`);
  console.log(`\n📝 Story Prompt:\n   ${storyPrompt}\n`);
  console.log('='.repeat(80));

  try {
    console.log('\n🚀 Starting story generation...\n');

    const response = await fetch(`${apiUrl}/api/stories/generate-hns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        prompt: storyPrompt,
        language: 'English'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    console.log('✅ Connection established, streaming progress...\n');

    let storyId = null;
    let finalResult = null;
    let hnsDocument = null;

    // Statistics tracking
    const stats = {
      partsCount: 0,
      chaptersCount: 0,
      scenesCount: 0,
      charactersCount: 0,
      charactersWithImages: 0,
      settingsCount: 0,
      settingsWithImages: 0,
      totalWords: 0
    };

    // Process the SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            switch (data.phase) {
              case 'progress':
                const step = data.data.step;
                const message = data.data.message;

                // Use different icons for different steps
                const icon = getStepIcon(step);
                console.log(`${icon} ${step}: ${message}`);

                // Track intermediate data if available
                if (data.data.parts) {
                  stats.partsCount = data.data.parts;
                }
                if (data.data.chapters) {
                  stats.chaptersCount = data.data.chapters;
                }
                if (data.data.scenes) {
                  stats.scenesCount = data.data.scenes;
                }
                break;

              case 'hns_complete':
                console.log('\n✅ HNS STRUCTURE GENERATED SUCCESSFULLY!');
                hnsDocument = data.data.hnsDocument;
                storyId = hnsDocument?.story?.story_id;

                if (storyId) {
                  console.log(`   📌 Story ID: ${storyId}`);
                }

                // Extract structure information
                if (hnsDocument) {
                  const story = hnsDocument.story;
                  const parts = hnsDocument.parts || [];
                  const chapters = hnsDocument.chapters || [];
                  const scenes = hnsDocument.scenes || [];
                  const characters = hnsDocument.characters || [];
                  const settings = hnsDocument.settings || [];

                  stats.partsCount = parts.length;
                  stats.chaptersCount = chapters.length;
                  stats.scenesCount = scenes.length;
                  stats.charactersCount = characters.length;
                  stats.settingsCount = settings.length;

                  console.log('\n📊 Story Structure:');
                  console.log(`   📖 Title: ${story.story_title}`);
                  console.log(`   🎭 Genre: ${Array.isArray(story.genre) ? story.genre.join(', ') : (story.genre || 'N/A')}`);
                  console.log(`   📚 Parts: ${stats.partsCount}`);
                  console.log(`   📝 Chapters: ${stats.chaptersCount}`);
                  console.log(`   🎬 Scenes: ${stats.scenesCount}`);
                  console.log(`   👥 Characters: ${stats.charactersCount}`);
                  console.log(`   🏞️  Settings: ${stats.settingsCount}`);
                }
                console.log('');
                break;

              case 'complete':
                console.log('\n🎉 STORY GENERATION COMPLETED!\n');
                finalResult = data.data;
                storyId = finalResult.storyId;

                // Update statistics with image generation results
                if (finalResult.characters) {
                  stats.charactersWithImages = finalResult.characters.filter(c => c.imageUrl).length;
                }
                if (finalResult.settings) {
                  stats.settingsWithImages = finalResult.settings.filter(s => s.imageUrl).length;
                }
                break;

              case 'error':
                console.error('\n❌ ERROR:', data.error);
                throw new Error(data.error);
            }
          } catch (parseError) {
            // Ignore parse errors for incomplete JSON chunks
          }
        }
      }
    }

    // Print final summary
    if (storyId && finalResult && hnsDocument) {
      printFinalSummary(storyId, finalResult, hnsDocument, stats, apiUrl, false);
      return { storyId, finalResult, hnsDocument, stats };
    } else {
      throw new Error('Story generation incomplete - missing data');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);

    // Provide helpful debugging info
    if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Make sure the development server is running:');
      console.log('   dotenv --file .env.local run pnpm dev');
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('\n💡 Tip: Check API key in .auth/user.json');
      console.log('   Writer profile should have a valid apiKey');
    }

    throw error;
  }
}

/**
 * Get appropriate icon for each generation step
 */
function getStepIcon(step) {
  const icons = {
    generating_hns: '🧠',
    generating_story: '📖',
    generating_parts: '📚',
    generating_chapters: '📝',
    generating_scenes: '🎬',
    generating_characters: '👥',
    generating_settings: '🏞️',
    generating_character_images: '🎨',
    generating_setting_images: '🖼️',
    saving_to_database: '💾',
    creating_story: '✨',
    creating_parts: '📦',
    creating_chapters: '📄',
    creating_scenes: '🎭',
    creating_characters: '👤',
    creating_settings: '🌍'
  };

  return icons[step] || '🔄';
}

/**
 * Publish the generated story
 */
async function publishStory(storyId, apiUrl) {
  try {
    console.log(`\n📤 Publishing story ${storyId}...`);

    const response = await fetch(`${apiUrl}/api/stories/${storyId}/visibility`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ isPublic: true })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to publish story: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Story published successfully! Status: ${result.story.status}`);
    return true;
  } catch (error) {
    console.error(`❌ Error publishing story: ${error.message}`);
    return false;
  }
}

/**
 * Print comprehensive final summary
 */
function printFinalSummary(storyId, finalResult, hnsDocument, stats, apiUrl, isPublished = false) {
  const story = hnsDocument.story;
  const parts = hnsDocument.parts || [];
  const chapters = hnsDocument.chapters || [];
  const characters = finalResult.characters || [];
  const settings = finalResult.settings || [];

  console.log('\n' + '='.repeat(80));
  console.log('✅ STORY GENERATION SUMMARY');
  console.log('='.repeat(80));

  // Story Information
  console.log('\n📖 STORY DETAILS:');
  console.log(`   ID: ${storyId}`);
  console.log(`   Title: ${story.story_title}`);
  console.log(`   Genre: ${Array.isArray(story.genre) ? story.genre.join(', ') : (story.genre || 'N/A')}`);
  console.log(`   Status: ${isPublished ? '📢 Published' : '✏️  Draft (Writing)'}`);
  console.log(`   Premise: ${story.premise}`);
  console.log(`   Dramatic Question: ${story.dramatic_question}`);
  console.log(`   Theme: ${story.theme}`);

  // Structure Statistics
  console.log('\n📊 STRUCTURE STATISTICS:');
  console.log(`   📚 Parts: ${stats.partsCount}`);
  console.log(`   📝 Chapters: ${stats.chaptersCount}`);
  console.log(`   🎬 Scenes: ${stats.scenesCount}`);
  console.log(`   👥 Characters: ${stats.charactersCount} (${stats.charactersWithImages} with images)`);
  console.log(`   🏞️  Settings: ${stats.settingsCount} (${stats.settingsWithImages} with images)`);

  // Parts Breakdown
  if (parts.length > 0) {
    console.log('\n📚 PARTS:');
    parts.forEach((part, index) => {
      const partChapters = chapters.filter(c => c.part_id === part.part_id);
      console.log(`   ${index + 1}. ${part.title}`);
      console.log(`      Role: ${part.structural_role}`);
      console.log(`      Chapters: ${partChapters.length}`);
    });
  }

  // Characters
  if (characters.length > 0) {
    console.log('\n👥 CHARACTERS:');
    characters.forEach((char, index) => {
      const imageStatus = char.imageUrl ? '✓ with image' : '✗ no image';
      console.log(`   ${index + 1}. ${char.name} (${imageStatus})`);
    });
  }

  // Settings
  if (settings.length > 0) {
    console.log('\n🏞️  SETTINGS:');
    settings.forEach((setting, index) => {
      const imageStatus = setting.imageUrl ? '✓ with image' : '✗ no image';
      console.log(`   ${index + 1}. ${setting.name} (${imageStatus})`);
    });
  }

  // Next Steps
  console.log('\n🔗 DIRECT LINKS:');
  console.log(`   📝 Edit story: ${apiUrl}/writing/${storyId}`);
  console.log(`   📖 Read story: ${apiUrl}/reading/${storyId}`);
  if (isPublished) {
    console.log(`   🌐 Community: ${apiUrl}/community/story/${storyId}`);
  }
  console.log(`   📋 All stories: ${apiUrl}/writing`);

  console.log('\n' + '='.repeat(80));
  console.log('✨ Story generation completed successfully!');
  console.log('='.repeat(80) + '\n');
}

// Main execution
const args = process.argv.slice(2);

// Check for --publish flag
const publishFlag = args.includes('--publish');
const filteredArgs = args.filter(arg => arg !== '--publish');
const storyPrompt = filteredArgs.length > 0 ? filteredArgs.join(' ') : DEFAULT_PROMPT;

generateCompleteStory(storyPrompt)
  .then(async ({ storyId, stats }) => {
    console.log(`\n✅ Success! Story ID: ${storyId}`);
    console.log(`📊 Generated ${stats.partsCount} parts, ${stats.chaptersCount} chapters, ${stats.scenesCount} scenes`);

    // Publish if --publish flag is present
    if (publishFlag) {
      const apiUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      const published = await publishStory(storyId, apiUrl);
      if (published) {
        console.log(`\n🎉 Story published and available to the community!\n`);
      }
    } else {
      console.log(`\n💡 Tip: Use --publish flag to auto-publish the story\n`);
    }

    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  });
