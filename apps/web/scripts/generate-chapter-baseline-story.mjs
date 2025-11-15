#!/usr/bin/env node

/**
 * Generate Chapter Baseline Story
 *
 * Generates a minimal test story for chapter evaluation baseline testing.
 * Uses v1.3 prompts (3-4 virtues in moral framework).
 *
 * Configuration:
 * - 1 part
 * - 1 chapter
 * - 3 scenes (minimum for complete story)
 *
 * Usage:
 *   node scripts/generate-chapter-baseline-story.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load API key from .auth/user.json
const authPath = path.join(__dirname, '../.auth/user.json');
const authData = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
const API_KEY = authData.develop.profiles.writer.apiKey;

const API_BASE = 'http://localhost:3000';

console.log('');
console.log('='.repeat(80));
console.log('CHAPTER BASELINE STORY GENERATION');
console.log('='.repeat(80));
console.log('Configuration: 1 part, 1 chapter, 3 scenes (v1.3 prompts)');
console.log('='.repeat(80));
console.log('');

/**
 * Generate story using studio API
 */
async function generateStory() {
    const userPrompt = 'A gardener discovers hope can bloom in the harshest conditions';

    console.log(`📝 User Prompt: "${userPrompt}"`);
    console.log('');
    console.log('Starting generation...');
    console.log('');

    const response = await fetch(`${API_BASE}/api/studio/story`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
        },
        body: JSON.stringify({
            userPrompt,
            language: 'English',
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Generation failed: ${response.status} - ${error}`);
    }

    // Parse synchronous JSON response
    const result = await response.json();

    if (!result.success) {
        throw new Error('Story generation failed: ' + (result.error || 'Unknown error'));
    }

    console.log('');
    console.log('✓ Story generated successfully!');
    console.log(`  Title: ${result.story.title}`);
    console.log(`  ID: ${result.story.id}`);

    // Extract first chapter ID from the story structure
    // The story object should contain the full hierarchy
    let firstChapterId = null;

    // Try to get chapter ID from firstChapterId field
    if (result.story.firstChapterId) {
        firstChapterId = result.story.firstChapterId;
        console.log(`  First Chapter ID: ${firstChapterId}`);
    }

    return {
        storyId: result.story.id,
        chapterId: firstChapterId,
        title: result.story.title,
        generationTime: result.metadata?.generationTime || 'N/A',
    };
}

/**
 * Main execution
 */
async function main() {
    try {
        const startTime = Date.now();

        const result = await generateStory();

        const duration = Math.round((Date.now() - startTime) / 1000);

        console.log('');
        console.log('='.repeat(80));
        console.log('GENERATION COMPLETE');
        console.log('='.repeat(80));
        console.log(`Story Title:  ${result.title}`);
        console.log(`Story ID:     ${result.storyId}`);
        console.log(`Chapter ID:   ${result.chapterId || 'Not available - check database'}`);
        console.log(`Gen Time:     ${result.generationTime}`);
        console.log(`Duration:     ${duration}s`);
        console.log('='.repeat(80));
        console.log('');

        if (result.chapterId) {
            console.log('Next step: Run chapter evaluation');
            console.log(`  curl -X POST http://localhost:3000/api/evaluation/chapter \\`);
            console.log(`    -H "Content-Type: application/json" \\`);
            console.log(`    -d '{"chapterId": "${result.chapterId}", "evaluationMode": "standard"}' | jq`);
        } else {
            console.log('⚠️  Chapter ID not available in response.');
            console.log('To get chapter ID, query the database:');
            console.log(`  SELECT id FROM chapters WHERE story_id = '${result.storyId}' LIMIT 1;`);
        }
        console.log('');

    } catch (error) {
        console.error('');
        console.error('❌ Generation failed:');
        console.error(error.message);
        console.error('');
        process.exit(1);
    }
}

main();
