#!/usr/bin/env node
/**
 * Complete fix for multi-dialogue formatting issues
 * 1. First repairs broken quotes (joins lines inside quotes)
 * 2. Then splits dialogue-description-dialogue into 3 paragraphs
 */

import postgres from 'postgres';

/**
 * Step 1: Repair any broken quotes by joining lines inside quote pairs
 */
function repairBrokenQuotes(content) {
  const lines = content.split('\n');
  const repairedLines = [];
  let inQuote = false;
  let currentLine = '';
  let quoteChar = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inQuote) {
      // Check if line has an opening quote without closing
      const openMatch = line.match(/([""\u201C])/);

      if (openMatch) {
        const quotePos = line.indexOf(openMatch[1]);
        const afterQuote = line.substring(quotePos + 1);

        // Look for closing quote
        const closePattern = openMatch[1] === '"' || openMatch[1] === '\u201C'
          ? /([""\u201D])/
          : /([''˜\u2019])/;

        const closeMatch = afterQuote.match(closePattern);

        if (closeMatch) {
          // Quote opens and closes on same line - OK
          repairedLines.push(line);
        } else {
          // Quote opens but doesn't close - start accumulating
          inQuote = true;
          quoteChar = openMatch[1];
          currentLine = line;
        }
      } else {
        // No quote on this line
        repairedLines.push(line);
      }
    } else {
      // Inside a quote - accumulating lines
      const closePattern = quoteChar === '"' || quoteChar === '\u201C'
        ? /([""\u201D])/
        : /([''˜\u2019])/;

      const closeMatch = line.match(closePattern);

      if (closeMatch) {
        // Found closing quote - join with space
        currentLine += ' ' + line.trim();
        repairedLines.push(currentLine);
        inQuote = false;
        currentLine = '';
        quoteChar = null;
      } else {
        // Still inside quote
        currentLine += ' ' + line.trim();
      }
    }
  }

  // If we ended while still in a quote, emit what we have
  if (currentLine) {
    repairedLines.push(currentLine);
  }

  return repairedLines.join('\n');
}

/**
 * Step 2: Split lines with pattern: "dialogue" description "dialogue"
 * into 3 separate paragraphs
 */
function splitMultiDialogue(content) {
  const paragraphs = content.split(/\n\s*\n/);
  const newParagraphs = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Check if this is a single-line paragraph
    const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length === 1) {
      const line = lines[0];

      // Find all complete dialogue sections
      const dialoguePattern = /([""\u201C])(((?!\1).)*?)([""\u201D])/g;
      const dialogues = [];
      let match;

      while ((match = dialoguePattern.exec(line)) !== null) {
        dialogues.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[0]
        });
      }

      // If we have 2+ dialogues with text between them, split
      if (dialogues.length >= 2) {
        const segments = [];
        let lastEnd = 0;

        for (let i = 0; i < dialogues.length; i++) {
          const dialogue = dialogues[i];

          // Add description before this dialogue (if any)
          if (dialogue.start > lastEnd) {
            const description = line.substring(lastEnd, dialogue.start).trim();
            if (description) {
              segments.push(description);
            }
          }

          // Add dialogue
          segments.push(dialogue.content);
          lastEnd = dialogue.end;
        }

        // Add any remaining description after last dialogue
        if (lastEnd < line.length) {
          const remaining = line.substring(lastEnd).trim();
          if (remaining) {
            segments.push(remaining);
          }
        }

        // Add all segments as separate paragraphs
        segments.forEach(seg => {
          if (seg && seg.trim()) {
            newParagraphs.push(seg.trim());
          }
        });
      } else {
        // Single or no dialogue - keep as is
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

async function fix() {
  try {
    const scenes = await sql`
      SELECT s.id, s.title, s.content
      FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.story_id = '3JpLdcXb5hQK7zy5g3QIj'
      ORDER BY c.order_index, s.order_index
    `;

    console.log('================================================================================');
    console.log('COMPLETE MULTI-DIALOGUE FIX');
    console.log('Step 1: Repair broken quotes');
    console.log('Step 2: Split dialogue-description-dialogue patterns');
    console.log('================================================================================\n');

    let fixed = 0;

    for (const scene of scenes) {
      console.log(`Processing: ${scene.title}`);

      // Step 1: Repair broken quotes
      const repaired = repairBrokenQuotes(scene.content);

      // Step 2: Split multi-dialogue
      const formatted = splitMultiDialogue(repaired);

      const changed = formatted !== scene.content;

      if (changed) {
        // Show changes for the problematic section
        if (scene.content.includes('emotional instability')) {
          const origIdx = scene.content.indexOf('Worse.');
          const fixedIdx = formatted.indexOf('Worse.');

          if (origIdx > -1 && fixedIdx > -1) {
            console.log('  BEFORE:');
            console.log('  ', JSON.stringify(scene.content.substring(origIdx, origIdx + 300)));
            console.log('');
            console.log('  AFTER:');
            console.log('  ', JSON.stringify(formatted.substring(fixedIdx, fixedIdx + 300)));
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
        console.log(`  ${saved ? '✅ FIXED' : '❌ FAILED'}`);

        if (saved) fixed++;
      } else {
        console.log('  No changes needed');
      }

      console.log('');
    }

    console.log('================================================================================');
    console.log(`COMPLETE: ${fixed}/${scenes.length} scenes fixed`);
    console.log('================================================================================');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fix();
