#!/usr/bin/env node
/**
 * Reformat Scene Content Migration Script (SQL version)
 *
 * Applies scene-formatter to all existing scenes to fix dialogue separation issues.
 * Uses raw SQL queries to avoid TypeScript import complications.
 *
 * Usage:
 *   node scripts/reformat-scenes-sql.mjs [storyId]
 */

import postgres from 'postgres';

// Scene formatter implementation
const DIALOGUE_PATTERNS = [
  /^["']/,
  /["']$/,
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
  if (sentences.length <= maxSentences) return [text];

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
          description: `Split ${sentenceCount} sentences into ${split.length} paragraphs`,
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
        description: `Added blank line between ${previous.type} and ${current.type}`,
      });
    }
  }

  const formatted = finalParagraphs.join('\n\n');

  return { formatted, changes, stats };
}

// Main script
const storyId = process.argv[2];

console.log('='.repeat(80));
console.log('SCENE CONTENT REFORMATTING MIGRATION');
console.log('='.repeat(80));
console.log('');

if (storyId) {
  console.log(`Target: Story ID ${storyId}`);
} else {
  console.log('Target: ALL stories');
}
console.log('');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ Error: DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(connectionString);

async function reformatScenes() {
  try {
    // Get scenes with raw SQL
    let scenes;
    if (storyId) {
      scenes = await sql`
        SELECT
          s.id as scene_id,
          s.title as scene_title,
          s.content as scene_content,
          c.title as chapter_title,
          st.title as story_title
        FROM scenes s
        JOIN chapters c ON s.chapter_id = c.id
        JOIN stories st ON c.story_id = st.id
        WHERE c.story_id = ${storyId}
        ORDER BY c.order_index, s.order_index
      `;
    } else {
      scenes = await sql`
        SELECT
          s.id as scene_id,
          s.title as scene_title,
          s.content as scene_content,
          c.title as chapter_title,
          st.title as story_title
        FROM scenes s
        JOIN chapters c ON s.chapter_id = c.id
        JOIN stories st ON c.story_id = st.id
        ORDER BY st.title, c.order_index, s.order_index
      `;
    }

    console.log(`Found ${scenes.length} scenes to process`);
    console.log('');

    if (scenes.length === 0) {
      console.log('No scenes found.');
      await sql.end();
      process.exit(0);
    }

    let totalScenes = 0;
    let scenesModified = 0;
    let totalChanges = 0;
    let totalParagraphsSplit = 0;
    let totalSpacingFixed = 0;

    for (const scene of scenes) {
      totalScenes++;

      if (!scene.scene_content) {
        console.log(`⏭️  ${totalScenes}/${scenes.length}: "${scene.scene_title}" - SKIPPED (no content)`);
        continue;
      }

      console.log(`📝 ${totalScenes}/${scenes.length}: "${scene.scene_title}"`);
      console.log(`   Story: ${scene.story_title}`);
      console.log(`   Chapter: ${scene.chapter_title}`);

      const result = formatSceneContent(scene.scene_content);

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
        await sql`
          UPDATE scenes
          SET
            content = ${result.formatted},
            updated_at = NOW()
          WHERE id = ${scene.scene_id}
        `;

        console.log(`      Database updated ✓`);
      } else {
        console.log(`   ℹ️  No changes needed`);
      }

      console.log('');
    }

    console.log('='.repeat(80));
    console.log('REFORMATTING COMPLETE');
    console.log('='.repeat(80));
    console.log('');
    console.log(`Total scenes: ${totalScenes}`);
    console.log(`Modified: ${scenesModified}`);
    console.log(`Unchanged: ${totalScenes - scenesModified}`);
    console.log('');
    console.log(`Total changes: ${totalChanges}`);
    console.log(`Paragraphs split: ${totalParagraphsSplit}`);
    console.log(`Spacing fixes: ${totalSpacingFixed}`);
    console.log('');
    console.log('✅ Reformatting complete!');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

reformatScenes();
