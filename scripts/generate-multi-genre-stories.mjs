#!/usr/bin/env node

/**
 * Multi-Genre Story Generation Orchestrator
 *
 * Generates multiple stories in parallel (one per genre), then:
 * 1. Publishes each story and chapter
 * 2. Generates comic panels for all scenes (parallel)
 *
 * Usage:
 *   node scripts/generate-multi-genre-stories.mjs
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Genres to generate
const GENRES = [
  { name: 'fantasy', prompt: 'A magical adventure about friendship and courage' },
  { name: 'scifi', prompt: 'A thrilling space story about discovery and innovation' },
  { name: 'mystery', prompt: 'An intriguing detective story about truth and justice' },
  { name: 'adventure', prompt: 'An exciting journey about perseverance and growth' }
];

const STORY_CONFIG = {
  parts: 1,
  chapters: 1,
  scenes: 3,
  characters: 2,
  settings: 1
};

class StoryOrchestrator {
  constructor() {
    this.stories = new Map();
    this.activeProcesses = new Set();
  }

  async run() {
    console.log('🚀 Multi-Genre Story Generation Started\n');
    console.log(`📚 Generating ${GENRES.length} stories in parallel:`);
    GENRES.forEach(g => console.log(`   - ${g.name}: ${g.prompt}`));
    console.log('\n' + '='.repeat(80) + '\n');

    // Phase 1: Generate all stories in parallel
    await this.generateAllStories();

    // Phase 2: Process each story (publish + comics)
    await this.processAllStories();

    // Summary
    await this.printSummary();
  }

  async generateAllStories() {
    const mode = process.env.GENERATION_MODE || 'sequential'; // 'parallel' or 'sequential'

    if (mode === 'sequential') {
      console.log('📖 Phase 1: Generating Stories (Sequential - Avoiding API Limits)\n');

      for (const genre of GENRES) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🎬 Starting: ${genre.name}`);
        console.log(`${'='.repeat(60)}\n`);

        await this.generateStory(genre);

        // Wait 30 seconds between stories to respect API rate limits
        if (GENRES.indexOf(genre) < GENRES.length - 1) {
          console.log('\n⏳ Waiting 30 seconds before next story (API rate limit)...\n');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }

      const succeeded = this.stories.size;
      const failed = GENRES.length - succeeded;

      console.log(`\n✅ Stories completed: ${succeeded}/${GENRES.length}`);
      if (failed > 0) {
        console.log(`⚠️  Stories failed: ${failed}`);
      }
    } else {
      console.log('📖 Phase 1: Generating Stories (Parallel)\n');

      const promises = GENRES.map(genre => this.generateStory(genre));
      const results = await Promise.allSettled(promises);

      // Check results
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`\n✅ Stories completed: ${succeeded}/${GENRES.length}`);
      if (failed > 0) {
        console.log(`⚠️  Stories failed: ${failed}`);
      }
    }
    console.log('');
  }

  async generateStory(genre) {
    return new Promise((resolve, reject) => {
      const logFile = path.join(__dirname, '../logs', `${genre.name}-story.log`);

      const args = [
        'scripts/generate-novel.mjs',
        '--genre', genre.name,
        '--parts', STORY_CONFIG.parts,
        '--chapters', STORY_CONFIG.chapters,
        '--scenes', STORY_CONFIG.scenes,
        '--characters', STORY_CONFIG.characters,
        '--settings', STORY_CONFIG.settings,
        genre.prompt
      ];

      console.log(`🎬 Starting: ${genre.name}`);

      const child = spawn('dotenv', ['--file', '.env.local', 'run', 'node', ...args], {
        cwd: path.join(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let storyId = null;
      let chapterId = null;

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;

        // Extract story ID
        const idMatch = text.match(/Story ID: ([a-zA-Z0-9_-]+)/);
        if (idMatch) storyId = idMatch[1];
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', async (code) => {
        await fs.writeFile(logFile, output);

        if (code === 0 && storyId) {
          // Get chapter ID
          chapterId = await this.getChapterId(storyId);

          this.stories.set(genre.name, { storyId, chapterId, genre });
          console.log(`✅ Completed: ${genre.name} (${storyId})`);
          resolve();
        } else {
          console.error(`❌ Failed: ${genre.name} (code: ${code}, storyId: ${storyId || 'none'})`);
          // Don't reject - just resolve without adding to stories map
          // This allows other stories to continue
          resolve();
        }
      });
    });
  }

  async getChapterId(storyId) {
    // Query database for chapter ID
    return new Promise((resolve) => {
      const child = spawn('dotenv', [
        '--file', '.env.local', 'run', 'psql', process.env.POSTGRES_URL, '-t', '-c',
        `SELECT id FROM chapters WHERE story_id = '${storyId}' LIMIT 1;`
      ]);

      let output = '';
      child.stdout.on('data', (data) => { output += data.toString(); });
      child.on('close', () => {
        const chapterId = output.trim();
        resolve(chapterId || null);
      });
    });
  }

  async processAllStories() {
    console.log('📤 Phase 2: Publishing Stories & Generating Comics\n');

    for (const [genreName, story] of this.stories) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Processing: ${genreName.toUpperCase()}`);
      console.log(`${'='.repeat(80)}\n`);

      // Publish story and chapter
      await this.publishStory(story);
      await this.publishChapter(story);

      // Get scene IDs
      const sceneIds = await this.getSceneIds(story.storyId);
      story.sceneIds = sceneIds;

      // Generate comics for all scenes in parallel
      await this.generateComicsParallel(story, sceneIds);
    }
  }

  async publishStory(story) {
    console.log(`📤 Publishing story: ${story.storyId}`);

    return new Promise((resolve) => {
      const child = spawn('dotenv', [
        '--file', '.env.local', 'run', 'node',
        'scripts/publish-story-simple.mjs', story.storyId
      ], { cwd: path.join(__dirname, '..') });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Story published`);
        } else {
          console.error(`⚠️  Story publish failed (continuing...)`);
        }
        resolve();
      });
    });
  }

  async publishChapter(story) {
    if (!story.chapterId) {
      console.log(`⚠️  No chapter ID found, skipping chapter publish`);
      return;
    }

    console.log(`📤 Publishing chapter: ${story.chapterId}`);

    return new Promise((resolve) => {
      const child = spawn('dotenv', [
        '--file', '.env.local', 'run', 'node',
        'scripts/publish-chapter-simple.mjs', story.chapterId
      ], { cwd: path.join(__dirname, '..') });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Chapter published`);
        } else {
          console.error(`⚠️  Chapter publish failed (continuing...)`);
        }
        resolve();
      });
    });
  }

  async getSceneIds(storyId) {
    return new Promise((resolve) => {
      const child = spawn('dotenv', [
        '--file', '.env.local', 'run', 'psql', process.env.POSTGRES_URL, '-t', '-c',
        `SELECT id FROM scenes WHERE chapter_id IN (SELECT id FROM chapters WHERE story_id = '${storyId}') ORDER BY created_at;`
      ]);

      let output = '';
      child.stdout.on('data', (data) => { output += data.toString(); });
      child.on('close', () => {
        const ids = output.trim().split('\n').map(id => id.trim()).filter(Boolean);
        resolve(ids);
      });
    });
  }

  async generateComicsParallel(story, sceneIds) {
    console.log(`🎨 Generating comics for ${sceneIds.length} scenes (parallel)...`);

    const promises = sceneIds.map((sceneId, index) =>
      this.generateComicForScene(story.genre.name, sceneId, index + 1)
    );

    await Promise.all(promises);
    console.log(`✅ All comics generated for ${story.genre.name}`);
  }

  async generateComicForScene(genreName, sceneId, sceneNumber) {
    const logFile = path.join(__dirname, '../logs', `${genreName}-scene${sceneNumber}-comic.log`);

    return new Promise((resolve) => {
      const child = spawn('dotenv', [
        '--file', '.env.local', 'run', 'node',
        'scripts/generate-comic-simple.mjs', sceneId
      ], {
        cwd: path.join(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      child.stdout.on('data', (data) => { output += data.toString(); });
      child.stderr.on('data', (data) => { output += data.toString(); });

      child.on('close', async (code) => {
        await fs.writeFile(logFile, output);
        console.log(`   ${code === 0 ? '✅' : '⚠️'} Scene ${sceneNumber} comics ${code === 0 ? 'complete' : 'failed'}`);
        resolve();
      });
    });
  }

  async printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('🎉 GENERATION COMPLETE - SUMMARY');
    console.log('='.repeat(80) + '\n');

    for (const [genreName, story] of this.stories) {
      console.log(`\n📚 ${genreName.toUpperCase()}`);
      console.log(`   Story ID: ${story.storyId}`);
      console.log(`   Chapter ID: ${story.chapterId || 'N/A'}`);
      console.log(`   Scenes: ${story.sceneIds?.length || 0}`);
      console.log(`   🔗 Novel: http://localhost:3000/novels/${story.storyId}`);
      console.log(`   🔗 Comic: http://localhost:3000/comics/${story.storyId}`);
      console.log(`   🔗 Community: http://localhost:3000/community/story/${story.storyId}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log(`✨ Generated ${this.stories.size} complete stories with comics!`);
    console.log('='.repeat(80) + '\n');
  }
}

// Run orchestrator
const orchestrator = new StoryOrchestrator();
orchestrator.run().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
