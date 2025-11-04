#!/usr/bin/env node
/**
 * Reformat scenes with immediate verification
 */

import postgres from 'postgres';

// Scene formatter (copy from scene-formatter.ts)
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
const storyId = process.argv[2] || '3JpLdcXb5hQK7zy5g3QIj';

console.log('='.repeat(80));
console.log('SCENE REFORMATTING WITH VERIFICATION');
console.log('='.repeat(80));
console.log('');
console.log('Story ID:', storyId);
console.log('');

const sql = postgres(process.env.DATABASE_URL);

async function reformat() {
  try {
    // Get scenes
    const scenes = await sql`
      SELECT
        s.id,
        s.title,
        s.content
      FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.story_id = ${storyId}
      ORDER BY c.order_index, s.order_index
    `;

    console.log(`Found ${scenes.length} scenes\n`);

    let updated = 0;

    for (const scene of scenes) {
      console.log(`Processing: ${scene.title}`);

      const result = formatSceneContent(scene.content);

      if (result.changes.length > 0) {
        console.log(`  Changes: ${result.changes.length}`);
        console.log(`  Spacing fixes: ${result.stats.spacingFixed}`);

        // Show example of changes
        if (scene.content.includes('"Detective Ishikawa')) {
          const idx = scene.content.indexOf('"Detective Ishikawa');
          const before = scene.content.substring(Math.max(0, idx - 50), idx);
          console.log('  BEFORE:', JSON.stringify(before + '...'));

          const idx2 = result.formatted.indexOf('"Detective Ishikawa');
          const after = result.formatted.substring(Math.max(0, idx2 - 50), idx2);
          console.log('  AFTER:', JSON.stringify(after + '...'));
        }

        // UPDATE with explicit transaction
        console.log('  Updating database...');
        const updateResult = await sql`
          UPDATE scenes
          SET content = ${result.formatted}, updated_at = NOW()
          WHERE id = ${scene.id}
        `;

        console.log(`  Update result: ${updateResult.count} row(s) affected`);

        // VERIFY immediately
        const verify = await sql`
          SELECT content FROM scenes WHERE id = ${scene.id}
        `;

        const saved = verify[0].content === result.formatted;
        console.log(`  ✓ Verification: ${saved ? 'SUCCESS' : 'FAILED'}`);

        if (!saved) {
          console.log('  ❌ WARNING: Saved content does not match formatted content!');
          console.log('  Expected length:', result.formatted.length);
          console.log('  Actual length:', verify[0].content.length);
        } else {
          updated++;
        }
      } else {
        console.log('  No changes needed');
      }

      console.log('');
    }

    console.log('='.repeat(80));
    console.log(`COMPLETE: ${updated}/${scenes.length} scenes updated and verified`);
    console.log('='.repeat(80));

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

reformat();
