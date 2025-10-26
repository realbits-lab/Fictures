#!/usr/bin/env node
/**
 * Split paragraphs where description and dialogue are on the same line
 * Pattern: "Description text. "Dialogue text"" → "Description text.\n\n"Dialogue text""
 */

import postgres from 'postgres';

function splitDescriptionDialogue(content) {
  const paragraphs = content.split(/\n\s*\n/);
  const newParagraphs = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Check if paragraph is a single line
    const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length === 1) {
      const line = lines[0];

      // Check if line starts without a quote but contains dialogue
      // Pattern: "Text before quote. "Dialogue""
      const startsWithQuote = /^[""\u201C]/.test(line);

      if (!startsWithQuote && /([""\u201C])/.test(line)) {
        // Line has dialogue but doesn't start with it
        // Find where dialogue starts: look for sentence end + space + quote
        const dialogueStart = line.match(/([.!?]\s+)([""\u201C])/);

        if (dialogueStart) {
          const splitIndex = dialogueStart.index + dialogueStart[1].length;
          const description = line.substring(0, splitIndex).trim();
          const dialogue = line.substring(splitIndex).trim();

          if (description && dialogue) {
            newParagraphs.push(description);
            newParagraphs.push(dialogue);
            continue;
          }
        }
      }
    }

    // No split needed or multi-line - keep as is
    newParagraphs.push(trimmed);
  }

  return newParagraphs.join('\n\n');
}

const sql = postgres(process.env.POSTGRES_URL);

async function split() {
  try {
    const scenes = await sql`
      SELECT s.id, s.title, s.content
      FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.story_id = '3JpLdcXb5hQK7zy5g3QIj'
      ORDER BY c.order_index, s.order_index
    `;

    console.log('================================================================================');
    console.log('SPLIT DESCRIPTION-DIALOGUE PATTERNS');
    console.log('Separates description and dialogue into different paragraphs');
    console.log('================================================================================\n');

    let split = 0;

    for (const scene of scenes) {
      console.log(`Processing: ${scene.title}`);

      const formatted = splitDescriptionDialogue(scene.content);
      const changed = formatted !== scene.content;

      if (changed) {
        // Show changes for the problematic section
        if (scene.content.includes('emotional instability')) {
          const origIdx = scene.content.indexOf('He gestured');
          const fixedIdx = formatted.indexOf('He gestured');

          if (origIdx > -1 && fixedIdx > -1) {
            console.log('  BEFORE:');
            console.log('  ', JSON.stringify(scene.content.substring(origIdx, origIdx + 200)));
            console.log('');
            console.log('  AFTER:');
            console.log('  ', JSON.stringify(formatted.substring(fixedIdx, fixedIdx + 220)));
          }
        }

        console.log('  Updating database...');
        await sql`
          UPDATE scenes
          SET content = ${formatted}, updated_at = NOW()
          WHERE id = ${scene.id}
        `;

        const verify = await sql`
          SELECT content FROM scenes WHERE id = ${scene.id}
        `;

        const saved = verify[0].content === formatted;
        console.log(`  ${saved ? '✅ SPLIT' : '❌ FAILED'}`);

        if (saved) split++;
      } else {
        console.log('  No changes needed');
      }

      console.log('');
    }

    console.log('================================================================================');
    console.log(`COMPLETE: ${split}/${scenes.length} scenes updated`);
    console.log('================================================================================');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

split();
