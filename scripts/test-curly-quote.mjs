#!/usr/bin/env node
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function test() {
  const scenes = await sql`
    SELECT content
    FROM scenes
    WHERE id = 's25ARzn_TttzuO9r5lvX3'
  `;

  const content = scenes[0].content;
  const paragraphs = content.split(/\n\s*\n/);

  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].includes('Detective Ishikawa')) {
      const para = paragraphs[i].trim();
      const lines = para.split('\n').map(l => l.trim()).filter(l => l);

      console.log('Testing line with curly quote regex...');
      console.log('Line ending:', lines[0].substring(lines[0].length - 50));
      console.log('');

      // Test with updated regex - using Unicode escape sequences
      const quoteMatch = lines[0].match(/([.!?]\s+)(["'\u201C\u201D\u2018\u2019«])/);
      console.log('Regex match:', quoteMatch ? 'FOUND' : 'NOT FOUND');

      if (quoteMatch) {
        console.log('Match details:', quoteMatch);
        console.log('Split index:', quoteMatch.index + quoteMatch[1].length);

        const splitIndex = quoteMatch.index + quoteMatch[1].length;
        const description = lines[0].substring(0, splitIndex).trim();
        const dialogue = lines[0].substring(splitIndex).trim();

        console.log('');
        console.log('Description:', description.substring(description.length - 50));
        console.log('Dialogue:', dialogue.substring(0, 50));
      } else {
        // Show exact characters
        const idx = lines[0].indexOf('\u201C'); // Left curly quote
        if (idx > -1) {
          const before = lines[0].substring(idx - 10, idx + 5);
          console.log('Context around left curly quote:');
          console.log(JSON.stringify(before));

          for (let j = 0; j < before.length; j++) {
            console.log(`  [${j}]: ${JSON.stringify(before[j])} code: ${before.charCodeAt(j)}`);
          }
        }
      }

      break;
    }
  }

  await sql.end();
}

test();
