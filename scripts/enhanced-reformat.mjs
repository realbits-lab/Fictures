#!/usr/bin/env node
/**
 * Enhanced scene reformatter that splits mixed description+dialogue lines
 */

import postgres from 'postgres';

// Enhanced formatter that can split description+dialogue within a single line
function splitMixedLine(line) {
  // Find dialogue start: opening quote (straight OR curly) preceded by space or punctuation
  // \u201C = " (left curly double), \u201D = " (right curly double)
  // \u2018 = ' (left curly single), \u2019 = ' (right curly single)
  const quoteMatch = line.match(/([.!?]\s+)(["'\u201C\u201D\u2018\u2019«])/);

  if (quoteMatch) {
    const splitIndex = quoteMatch.index + quoteMatch[1].length;
    const description = line.substring(0, splitIndex).trim();
    const dialogue = line.substring(splitIndex).trim();

    if (description && dialogue && dialogue.match(/^["'\u201C\u201D\u2018\u2019«]/)) {
      return [description, dialogue];
    }
  }

  return [line];
}

function isDialogueLine(text) {
  const trimmed = text.trim();
  // More precise: starts with quote AND contains closing quote (straight or curly)
  return /^["'\u201C\u201D\u2018\u2019«]/.test(trimmed) && /["'\u201C\u201D\u2018\u2019»]/.test(trimmed.substring(1));
}

function formatSceneContent(content) {
  const paragraphs = content.split(/\n\s*\n/);
  const newParagraphs = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Check if this is a single-line paragraph with mixed content
    const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length === 1) {
      const parts = splitMixedLine(lines[0]);

      if (parts.length > 1) {
        // Split into description and dialogue
        newParagraphs.push(parts[0]);
        newParagraphs.push(parts[1]);
      } else {
        newParagraphs.push(trimmed);
      }
    } else {
      // Multi-line paragraph - keep as is
      newParagraphs.push(trimmed);
    }
  }

  return newParagraphs.join('\n\n');
}

const sql = postgres(process.env.DATABASE_URL);

async function reformat() {
  try {
    const scenes = await sql`
      SELECT s.id, s.title, s.content
      FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.story_id = '3JpLdcXb5hQK7zy5g3QIj'
      ORDER BY c.order_index, s.order_index
    `;

    console.log('================================================================================');
    console.log('ENHANCED SCENE REFORMATTING');
    console.log('================================================================================\n');

    let updated = 0;

    for (const scene of scenes) {
      console.log(`Processing: ${scene.title}`);

      const formatted = formatSceneContent(scene.content);
      const changed = formatted !== scene.content;

      if (changed) {
        // Show the specific change for Detective Ishikawa
        if (scene.content.includes('Detective Ishikawa')) {
          const beforeIdx = scene.content.indexOf('Detective Ishikawa');
          const before = scene.content.substring(Math.max(0, beforeIdx - 60), beforeIdx);

          const afterIdx = formatted.indexOf('Detective Ishikawa');
          const after = formatted.substring(Math.max(0, afterIdx - 60), afterIdx);

          console.log('  BEFORE:', JSON.stringify(before));
          console.log('  AFTER: ', JSON.stringify(after));
        }

        console.log('  Updating database...');
        await sql`
          UPDATE scenes
          SET content = ${formatted}, updated_at = NOW()
          WHERE id = ${scene.id}
        `;

        // Verify
        const verify = await sql`
          SELECT content FROM scenes WHERE id = ${scene.id}
        `;

        const saved = verify[0].content === formatted;
        console.log(`  ✓ ${saved ? 'SUCCESS' : 'FAILED'}`);

        if (saved) updated++;
      } else {
        console.log('  No changes needed');
      }

      console.log('');
    }

    console.log('================================================================================');
    console.log(`COMPLETE: ${updated}/${scenes.length} scenes updated`);
    console.log('================================================================================');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

reformat();
