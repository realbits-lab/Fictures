#!/usr/bin/env node
/**
 * Advanced scene reformatter that handles multiple dialogue/description splits
 * Handles cases like: dialogue → description → dialogue in a single line
 */

import postgres from 'postgres';

// Enhanced formatter that can split multiple dialogue/description sections
function splitMixedLine(line) {
  // Find all quote positions (both opening and closing)
  // \u201C = " (left curly double), \u201D = " (right curly double)
  const quotePattern = /["'\u201C\u201D\u2018\u2019]/g;
  const matches = [];
  let match;

  while ((match = quotePattern.exec(line)) !== null) {
    matches.push({ index: match.index, char: match[0] });
  }

  if (matches.length < 2) {
    return [line]; // No complete dialogue pairs
  }

  // Track dialogue boundaries
  const segments = [];
  let inDialogue = false;
  let dialogueStart = -1;
  let lastEnd = 0;

  for (let i = 0; i < matches.length; i++) {
    const curr = matches[i];

    // Check if this is an opening quote (left curly or straight at start)
    const isOpening = /["'\u201C\u2018]/.test(curr.char) && !inDialogue;
    // Check if this is a closing quote (right curly or straight at end)
    const isClosing = /["'\u201D\u2019]/.test(curr.char) && inDialogue;

    if (!inDialogue) {
      // Look for sentence end before opening quote (. ! ? followed by space/start)
      const beforeQuote = line.substring(0, curr.index);
      const sentenceEndMatch = beforeQuote.match(/([.!?])\s+$/);

      if (sentenceEndMatch) {
        // Found description before dialogue
        const splitPoint = sentenceEndMatch.index + 1; // After the punctuation
        const description = line.substring(lastEnd, splitPoint).trim();

        if (description && description.length > 0) {
          segments.push({ type: 'description', content: description });
        }

        lastEnd = splitPoint;
      }

      inDialogue = true;
      dialogueStart = curr.index;
    } else if (isClosing || i === matches.length - 1) {
      // End of dialogue
      inDialogue = false;
      const dialogueEnd = curr.index + 1;
      const dialogue = line.substring(lastEnd, dialogueEnd).trim();

      if (dialogue && dialogue.length > 0) {
        segments.push({ type: 'dialogue', content: dialogue });
      }

      lastEnd = dialogueEnd;
    }
  }

  // Capture any remaining description after last dialogue
  if (lastEnd < line.length) {
    const remaining = line.substring(lastEnd).trim();
    if (remaining && remaining.length > 0) {
      segments.push({ type: 'description', content: remaining });
    }
  }

  // If we found multiple segments, return them separately
  if (segments.length > 1) {
    return segments.map(s => s.content);
  }

  // Otherwise, try simpler split approach
  return splitSimple(line);
}

function splitSimple(line) {
  // Fallback: Find dialogue start: opening quote preceded by space or punctuation
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
        // Found multiple sections - add them as separate paragraphs
        parts.forEach(part => newParagraphs.push(part));
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
    console.log('ADVANCED SCENE REFORMATTING');
    console.log('Handles: dialogue → description → dialogue splits');
    console.log('================================================================================\n');

    let updated = 0;

    for (const scene of scenes) {
      console.log(`Processing: ${scene.title}`);

      const formatted = formatSceneContent(scene.content);
      const changed = formatted !== scene.content;

      if (changed) {
        // Show specific changes
        if (scene.content.includes('emotional instability')) {
          const origIdx = scene.content.indexOf('emotional instability');
          const origContext = scene.content.substring(origIdx - 50, origIdx + 200);

          const formIdx = formatted.indexOf('emotional instability');
          const formContext = formatted.substring(formIdx - 50, formIdx + 200);

          console.log('  BEFORE:', JSON.stringify(origContext));
          console.log('  AFTER: ', JSON.stringify(formContext));
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
