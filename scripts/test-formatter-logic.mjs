#!/usr/bin/env node
/**
 * Test the formatter logic with the actual problematic content
 */

import postgres from 'postgres';

// Formatter functions
const DIALOGUE_PATTERNS = [
  /^["']/,
  /["']$/,
  /\b(said|asked|replied|shouted|whispered|muttered|answered|exclaimed|cried|yelled|screamed|murmured|added|continued|interrupted|stammered|growled|hissed|sighed|laughed|chuckled|snorted|gasped|breathed|wondered|thought|mused)\b/i,
];

function isDialogueParagraph(text) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return DIALOGUE_PATTERNS.some(pattern => pattern.test(trimmed));
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

const sql = postgres(process.env.POSTGRES_URL);

async function test() {
  try {
    const scenes = await sql`
      SELECT content
      FROM scenes
      WHERE id = 's25ARzn_TttzuO9r5lvX3'
    `;

    const content = scenes[0].content;

    // Find the paragraph containing "Detective Ishikawa"
    const idx = content.indexOf('Detective Ishikawa');
    console.log('Found "Detective Ishikawa" at position:', idx);

    // Get the paragraph containing this dialogue
    const paragraphs = content.split(/\n\s*\n/);
    console.log('');
    console.log('Total paragraphs after split by \\n\\n:', paragraphs.length);
    console.log('');

    let foundPara = null;
    let paraIndex = -1;

    for (let i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].includes('Detective Ishikawa')) {
        foundPara = paragraphs[i];
        paraIndex = i;
        break;
      }
    }

    if (foundPara) {
      console.log('Paragraph containing dialogue (index', paraIndex + '):');
      console.log('---');
      console.log(foundPara);
      console.log('---');
      console.log('');

      console.log('Paragraph length:', foundPara.length);
      console.log('');

      // Check lines
      const lines = foundPara.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      console.log('Lines in paragraph:', lines.length);
      lines.forEach((line, i) => {
        const isDialogue = isDialogueParagraph(line);
        console.log(`Line ${i + 1} (${isDialogue ? 'DIALOGUE' : 'DESCRIPTION'}):`, JSON.stringify(line.substring(0, 80)));
      });
      console.log('');

      // Parse blocks
      const blocks = parseBlocks(content);
      console.log('Total blocks parsed:', blocks.length);

      // Find blocks around the dialogue
      for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].content.includes('Detective Ishikawa')) {
          console.log('');
          console.log('Block containing dialogue (block', i + '):');
          console.log('Type:', blocks[i].type);
          console.log('Content:', JSON.stringify(blocks[i].content.substring(0, 200)));

          if (i > 0) {
            console.log('');
            console.log('Previous block (block', i - 1 + '):');
            console.log('Type:', blocks[i - 1].type);
            console.log('Content:', JSON.stringify(blocks[i - 1].content.substring(0, 200)));
          }

          if (i < blocks.length - 1) {
            console.log('');
            console.log('Next block (block', i + 1 + '):');
            console.log('Type:', blocks[i + 1].type);
            console.log('Content:', JSON.stringify(blocks[i + 1].content.substring(0, 200)));
          }
        }
      }
    }

    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
  }
}

test();
