#!/usr/bin/env node
import postgres from 'postgres';

// Copy formatter functions
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

const sql = postgres(process.env.DATABASE_URL);

async function test() {
  try {
    // Get the actual scene content
    const scenes = await sql`
      SELECT id, title, content
      FROM scenes
      WHERE id = 's25ARzn_TttzuO9r5lvX3'
    `;

    const scene = scenes[0];

    // Remove TEST UPDATE prefix if it exists
    let content = scene.content;
    if (content.startsWith('TEST UPDATE: ')) {
      content = content.substring('TEST UPDATE: '.length);
    }

    console.log('Testing scene:', scene.title);
    console.log('');
    console.log('Original content (first 300 chars):');
    console.log(content.substring(0, 300));
    console.log('...');
    console.log('');

    // Find the "Detective Ishikawa" part
    const detectiveIndex = content.indexOf('"Detective Ishikawa');
    if (detectiveIndex > -1) {
      const before = content.substring(Math.max(0, detectiveIndex - 100), detectiveIndex);
      const after = content.substring(detectiveIndex, detectiveIndex + 50);

      console.log('Context around "Detective Ishikawa":');
      console.log('BEFORE (100 chars):', JSON.stringify(before));
      console.log('DIALOGUE:', JSON.stringify(after));
      console.log('');

      // Check if there's a blank line before
      const hasBlankLine = before.endsWith('.\n\n') || before.endsWith('.\r\n\r\n');
      console.log('Has blank line before dialogue?', hasBlankLine);

      // Test isDialogueParagraph on the paragraph containing dialogue
      const paragraphStart = content.lastIndexOf('\n\n', detectiveIndex);
      const paragraphEnd = content.indexOf('\n\n', detectiveIndex);
      const paragraph = content.substring(
        paragraphStart === -1 ? 0 : paragraphStart + 2,
        paragraphEnd === -1 ? content.length : paragraphEnd
      );

      console.log('');
      console.log('Full paragraph containing dialogue:');
      console.log(JSON.stringify(paragraph));
      console.log('');
      console.log('isDialogueParagraph test:', isDialogueParagraph(paragraph));
    }

    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
  }
}

test();
