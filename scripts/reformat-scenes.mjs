#!/usr/bin/env node
/**
 * Reformat Scene Content Migration Script
 *
 * Applies scene-formatter to all existing scenes to fix dialogue separation issues.
 * This script:
 * 1. Reads all scenes from the database
 * 2. Applies formatSceneContent from scene-formatter.ts
 * 3. Updates scenes with properly formatted content
 * 4. Shows before/after statistics
 *
 * Usage:
 *   node scripts/reformat-scenes.mjs [storyId]
 *
 * Examples:
 *   node scripts/reformat-scenes.mjs                    # Reformat all scenes
 *   node scripts/reformat-scenes.mjs 3JpLdcXb5hQK7zy5g3QIj  # Reformat specific story
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql } from 'drizzle-orm';
import { scenes as scenesTable, chapters as chaptersTable, stories as storiesTable } from '../src/lib/db/schema.js';

// Scene formatter implementation (copied from scene-formatter.ts to avoid TypeScript issues)
const DIALOGUE_PATTERNS = [
  /^["']/,  // Starts with quote
  /["']$/,  // Ends with quote
  /\b(said|asked|replied|shouted|whispered|muttered|answered|exclaimed|cried|yelled|screamed|murmured|added|continued|interrupted|stammered|growled|hissed|sighed|laughed|chuckled|snorted|gasped|breathed|wondered|thought|mused)\b/i,
];

const ABBREVIATIONS = [
  'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr',
  'vs', 'etc', 'Inc', 'Ltd', 'Co', 'Corp',
  'St', 'Ave', 'Blvd', 'Rd',
];

function isDialogueParagraph(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return DIALOGUE_PATTERNS.some(pattern => pattern.test(trimmed));
}

function extractSentences(text) {
  let protectedText = text;
  ABBREVIATIONS.forEach(abbr => {
    const regex = new RegExp(`\\b${abbr}\\.`, 'g');
    protectedText = protectedText.replace(regex, `${abbr}<!PERIOD!>`);
  });

  const sentences = protectedText
    .split(/([.!?]+)(?:\s+|$)/)
    .reduce((acc, part, i, arr) => {
      if (i % 2 === 0 && part.trim()) {
        const terminator = arr[i + 1] || '';
        acc.push((part + terminator).trim());
      }
      return acc;
    }, [])
    .filter(s => s.length > 0);

  return sentences.map(s => s.replace(/<!PERIOD!>/g, '.'));
}

function countSentences(text) {
  return extractSentences(text).length;
}

function splitLongParagraph(text, maxSentences) {
  const sentences = extractSentences(text);

  if (sentences.length <= maxSentences) {
    return [text];
  }

  const result = [];
  let current = [];

  for (const sentence of sentences) {
    current.push(sentence);

    if (current.length === maxSentences) {
      result.push(current.join(' '));
      current = [];
    }
  }

  if (current.length > 0) {
    result.push(current.join(' '));
  }

  return result;
}

function parseBlocks(content) {
  const paragraphs = content.split(/\n\s*\n/);
  const blocks = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (!para) continue;

    const lines = para.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length === 1) {
      blocks.push({
        type: isDialogueParagraph(para) ? 'dialogue' : 'description',
        content: para,
        originalIndex: i,
      });
    } else {
      const lineTypes = lines.map(line => isDialogueParagraph(line));
      const hasDialogue = lineTypes.some(t => t);
      const hasDescription = lineTypes.some(t => !t);

      if (hasDialogue && hasDescription) {
        // MIXED paragraph - split by line type
        let currentType = null;
        let currentLines = [];

        for (let j = 0; j < lines.length; j++) {
          const line = lines[j];
          const lineType = isDialogueParagraph(line) ? 'dialogue' : 'description';

          if (currentType === null) {
            currentType = lineType;
            currentLines = [line];
          } else if (currentType === lineType) {
            currentLines.push(line);
          } else {
            blocks.push({
              type: currentType,
              content: currentLines.join('\n'),
              originalIndex: i,
            });
            currentType = lineType;
            currentLines = [line];
          }
        }

        if (currentLines.length > 0 && currentType !== null) {
          blocks.push({
            type: currentType,
            content: currentLines.join('\n'),
            originalIndex: i,
          });
        }
      } else {
        blocks.push({
          type: hasDialogue ? 'dialogue' : 'description',
          content: para,
          originalIndex: i,
        });
      }
    }
  }

  return blocks;
}

function formatSceneContent(content, maxSentencesPerParagraph = 3) {
  const changes = [];
  const stats = {
    originalParagraphs: 0,
    formattedParagraphs: 0,
    sentencesSplit: 0,
    spacingFixed: 0,
  };

  const blocks = parseBlocks(content);
  stats.originalParagraphs = blocks.length;

  const formattedBlocks = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (block.type === 'description') {
      const sentenceCount = countSentences(block.content);

      if (sentenceCount > maxSentencesPerParagraph) {
        const split = splitLongParagraph(block.content, maxSentencesPerParagraph);

        changes.push({
          type: 'paragraph_split',
          location: `Paragraph ${i + 1}`,
          description: `Split description paragraph with ${sentenceCount} sentences into ${split.length} paragraphs`,
        });

        stats.sentencesSplit += split.length - 1;

        split.forEach(splitContent => {
          formattedBlocks.push({
            type: 'description',
            content: splitContent,
            originalIndex: block.originalIndex,
          });
        });
      } else {
        formattedBlocks.push(block);
      }
    } else {
      formattedBlocks.push(block);
    }
  }

  stats.formattedParagraphs = formattedBlocks.length;

  const finalParagraphs = [];

  for (let i = 0; i < formattedBlocks.length; i++) {
    const current = formattedBlocks[i];
    const previous = i > 0 ? formattedBlocks[i - 1] : null;

    finalParagraphs.push(current.content);

    if (previous && previous.type !== current.type) {
      stats.spacingFixed++;

      changes.push({
        type: 'spacing_added',
        location: `Between paragraphs ${i} and ${i + 1}`,
        description: `Ensured blank line between ${previous.type} and ${current.type}`,
      });
    }
  }

  const formatted = finalParagraphs.join('\n\n');

  return {
    formatted,
    changes,
    stats,
  };
}

// Main script
const storyId = process.argv[2];

console.log('='.repeat(80));
console.log('SCENE CONTENT REFORMATTING MIGRATION');
console.log('='.repeat(80));
console.log('');
console.log('This script applies scene-formatter to fix dialogue separation issues.');
console.log('');

if (storyId) {
  console.log(`Target: Story ID ${storyId}`);
} else {
  console.log('Target: ALL stories');
}
console.log('');

// Connect to database
const connectionString = process.env.POSTGRES_URL;
if (!connectionString) {
  console.error('❌ Error: POSTGRES_URL environment variable not set');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function reformatScenes() {
  try {
    // Get scenes to reformat
    let scenesQuery;
    if (storyId) {
      // Get scenes for specific story
      const storyScenes = await db
        .select({
          sceneId: scenesTable.id,
          sceneTitle: scenesTable.title,
          sceneContent: scenesTable.content,
          chapterId: scenesTable.chapterId,
          chapterTitle: chaptersTable.title,
          storyId: chaptersTable.storyId,
          storyTitle: storiesTable.title,
        })
        .from(scenesTable)
        .innerJoin(chaptersTable, eq(scenesTable.chapterId, chaptersTable.id))
        .innerJoin(storiesTable, eq(chaptersTable.storyId, storiesTable.id))
        .where(eq(chaptersTable.storyId, storyId))
        .orderBy(scenesTable.orderIndex);

      scenesQuery = storyScenes;
    } else {
      // Get all scenes
      const allScenes = await db
        .select({
          sceneId: scenesTable.id,
          sceneTitle: scenesTable.title,
          sceneContent: scenesTable.content,
          chapterId: scenesTable.chapterId,
          chapterTitle: chaptersTable.title,
          storyId: chaptersTable.storyId,
          storyTitle: storiesTable.title,
        })
        .from(scenesTable)
        .innerJoin(chaptersTable, eq(scenesTable.chapterId, chaptersTable.id))
        .innerJoin(storiesTable, eq(chaptersTable.storyId, storiesTable.id))
        .orderBy(storiesTable.title, chaptersTable.orderIndex, scenesTable.orderIndex);

      scenesQuery = allScenes;
    }

    console.log(`Found ${scenesQuery.length} scenes to reformat`);
    console.log('');

    if (scenesQuery.length === 0) {
      console.log('No scenes found. Exiting.');
      await client.end();
      process.exit(0);
    }

    // Track statistics
    let totalScenes = 0;
    let scenesModified = 0;
    let totalChanges = 0;
    let totalParagraphsSplit = 0;
    let totalSpacingFixed = 0;

    // Process each scene
    for (const scene of scenesQuery) {
      totalScenes++;

      if (!scene.sceneContent) {
        console.log(`⏭️  Scene ${totalScenes}/${scenesQuery.length}: "${scene.sceneTitle}" - SKIPPED (no content)`);
        continue;
      }

      console.log(`📝 Scene ${totalScenes}/${scenesQuery.length}: "${scene.sceneTitle}"`);
      console.log(`   Story: ${scene.storyTitle}`);
      console.log(`   Chapter: ${scene.chapterTitle}`);

      // Apply formatter
      const result = formatSceneContent(scene.sceneContent);

      if (result.changes.length > 0) {
        scenesModified++;
        totalChanges += result.changes.length;
        totalParagraphsSplit += result.stats.sentencesSplit;
        totalSpacingFixed += result.stats.spacingFixed;

        console.log(`   ✅ REFORMATTED:`);
        console.log(`      Changes: ${result.changes.length}`);
        console.log(`      Paragraphs split: ${result.stats.sentencesSplit}`);
        console.log(`      Spacing fixed: ${result.stats.spacingFixed}`);

        // Update database
        await db.update(scenesTable)
          .set({
            content: result.formatted,
            updatedAt: new Date(),
          })
          .where(eq(scenesTable.id, scene.sceneId));

        console.log(`      Database updated ✓`);
      } else {
        console.log(`   ℹ️  No changes needed (already properly formatted)`);
      }

      console.log('');
    }

    // Summary
    console.log('='.repeat(80));
    console.log('REFORMATTING COMPLETE');
    console.log('='.repeat(80));
    console.log('');
    console.log(`Total scenes processed: ${totalScenes}`);
    console.log(`Scenes modified: ${scenesModified}`);
    console.log(`Scenes unchanged: ${totalScenes - scenesModified}`);
    console.log('');
    console.log('Changes applied:');
    console.log(`  Total formatting changes: ${totalChanges}`);
    console.log(`  Paragraphs split: ${totalParagraphsSplit}`);
    console.log(`  Spacing fixes: ${totalSpacingFixed}`);
    console.log('');
    console.log('✅ All scenes have been reformatted with proper dialogue separation!');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during reformatting:', error);
    await client.end();
    process.exit(1);
  }
}

reformatScenes();
