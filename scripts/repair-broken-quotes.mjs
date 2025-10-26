#!/usr/bin/env node
/**
 * Repair broken quotes that have line breaks inside them
 */

import postgres from 'postgres';

function repairBrokenQuotes(content) {
  // Pattern: quote followed by newline(s) followed by text, followed by closing quote later
  // We need to join lines that are inside quotes

  // First, find all quote-pair regions and join any newlines within them
  const lines = content.split('\n');
  const repairedLines = [];
  let inQuote = false;
  let currentLine = '';
  let quoteChar = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inQuote) {
      // Check if line starts or contains an opening quote
      const openMatch = line.match(/([""\u201C])/);

      if (openMatch) {
        // Check if the quote is closed on the same line
        const quotePos = line.indexOf(openMatch[1]);
        const afterQuote = line.substring(quotePos + 1);

        // Look for closing quote (matching pair)
        const closePattern = openMatch[1] === '"' || openMatch[1] === '\u201C'
          ? /[""\u201D]/
          : /[''\u2019]/;

        const closeMatch = afterQuote.match(closePattern);

        if (closeMatch) {
          // Quote opens and closes on same line - this is fine
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
      // We're inside a quote, accumulating lines
      // Check if this line has the closing quote
      const closePattern = quoteChar === '"' || quoteChar === '\u201C'
        ? /[""\u201D]/
        : /[''\u2019]/;

      const closeMatch = line.match(closePattern);

      if (closeMatch) {
        // Found closing quote - join with space and emit
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

const sql = postgres(process.env.POSTGRES_URL);

async function repair() {
  try {
    const scenes = await sql`
      SELECT s.id, s.title, s.content
      FROM scenes s
      JOIN chapters c ON s.chapter_id = c.id
      WHERE c.story_id = '3JpLdcXb5hQK7zy5g3QIj'
      ORDER BY c.order_index, s.order_index
    `;

    console.log('================================================================================');
    console.log('REPAIRING BROKEN QUOTES');
    console.log('Fixes line breaks that were incorrectly added inside quotes');
    console.log('================================================================================\n');

    let repaired = 0;

    for (const scene of scenes) {
      console.log(`Processing: ${scene.title}`);

      const fixed = repairBrokenQuotes(scene.content);
      const changed = fixed !== scene.content;

      if (changed) {
        // Show changes for problematic section
        if (scene.content.includes('emotional instability')) {
          const origIdx = scene.content.indexOf('Worse.');
          const fixedIdx = fixed.indexOf('Worse.');

          if (origIdx > -1 && fixedIdx > -1) {
            console.log('  BROKEN:');
            console.log('  ', JSON.stringify(scene.content.substring(origIdx, origIdx + 200)));
            console.log('');
            console.log('  FIXED:');
            console.log('  ', JSON.stringify(fixed.substring(fixedIdx, fixedIdx + 200)));
          }
        }

        console.log('  Updating database...');
        await sql`
          UPDATE scenes
          SET content = ${fixed}, updated_at = NOW()
          WHERE id = ${scene.id}
        `;

        const verify = await sql`
          SELECT content FROM scenes WHERE id = ${scene.id}
        `;

        const saved = verify[0].content === fixed;
        console.log(`  ${saved ? '✅ REPAIRED' : '❌ FAILED'}`);

        if (saved) repaired++;
      } else {
        console.log('  No broken quotes found');
      }

      console.log('');
    }

    console.log('================================================================================');
    console.log(`COMPLETE: ${repaired}/${scenes.length} scenes repaired`);
    console.log('================================================================================');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

repair();
