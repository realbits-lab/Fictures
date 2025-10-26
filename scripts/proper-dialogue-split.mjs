#!/usr/bin/env node
/**
 * Proper dialogue formatter that correctly splits dialogue and description
 * WITHOUT breaking content inside quotes
 */

import postgres from 'postgres';

/**
 * Find complete dialogue sections (opening → closing quote pairs)
 * Returns array of {type, content, start, end}
 */
function parseDialogueAndDescription(line) {
  const segments = [];
  let pos = 0;

  // Regex to match complete quoted sections (handles both straight and curly quotes)
  // Matches: "text" or "text" (curly quotes)
  const dialoguePattern = /([""\u201C])((?:(?!\1).)*)([""\u201D])/g;

  let match;
  let lastEnd = 0;

  // Find all dialogue sections
  while ((match = dialoguePattern.exec(line)) !== null) {
    const dialogueStart = match.index;
    const dialogueEnd = match.index + match[0].length;
    const dialogue = match[0];

    // Add description before this dialogue (if any)
    if (dialogueStart > lastEnd) {
      const description = line.substring(lastEnd, dialogueStart).trim();
      if (description) {
        segments.push({ type: 'description', content: description });
      }
    }

    // Add dialogue
    segments.push({ type: 'dialogue', content: dialogue });
    lastEnd = dialogueEnd;
  }

  // Add remaining description after last dialogue (if any)
  if (lastEnd < line.length) {
    const description = line.substring(lastEnd).trim();
    if (description) {
      segments.push({ type: 'description', content: description });
    }
  }

  return segments;
}

function splitMixedLine(line) {
  const segments = parseDialogueAndDescription(line);

  // If we found multiple segments (dialogue + description + dialogue pattern), split them
  if (segments.length > 1) {
    return segments.map(s => s.content);
  }

  // Otherwise, check for simple dialogue at end pattern
  // Pattern: "Description. Opening-quote"
  const simplePattern = /([.!?]\s+)(["'\u201C\u201D\u2018\u2019])/;
  const match = line.match(simplePattern);

  if (match) {
    const splitIndex = match.index + match[1].length;
    const description = line.substring(0, splitIndex).trim();
    const dialogue = line.substring(splitIndex).trim();

    if (description && dialogue) {
      return [description, dialogue];
    }
  }

  return [line];
}

function formatSceneContent(content) {
  const paragraphs = content.split(/\n\s*\n/);
  const newParagraphs = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Check if this is a single-line paragraph
    const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length === 1) {
      const parts = splitMixedLine(lines[0]);

      if (parts.length > 1) {
        // Found multiple sections - add them as separate paragraphs
        parts.forEach(part => {
          if (part && part.trim()) {
            newParagraphs.push(part.trim());
          }
        });
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

const sql = postgres(process.env.POSTGRES_URL);

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
    console.log('PROPER DIALOGUE SPLITTING');
    console.log('Correctly handles: dialogue → description → dialogue');
    console.log('================================================================================\n');

    let updated = 0;

    for (const scene of scenes) {
      console.log(`Processing: ${scene.title}`);

      const formatted = formatSceneContent(scene.content);
      const changed = formatted !== scene.content;

      if (changed) {
        // Show specific changes for the problematic section
        if (scene.content.includes('emotional instability')) {
          const origIdx = scene.content.indexOf('Worse.');
          const formIdx = formatted.indexOf('Worse.');

          if (origIdx > -1 && formIdx > -1) {
            console.log('  BEFORE:');
            console.log('  ', JSON.stringify(scene.content.substring(origIdx, origIdx + 250)));
            console.log('');
            console.log('  AFTER:');
            console.log('  ', JSON.stringify(formatted.substring(formIdx, formIdx + 250)));
          }
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
        console.log(`  ${saved ? '✅ SUCCESS' : '❌ FAILED'}`);

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
