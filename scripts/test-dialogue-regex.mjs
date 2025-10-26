#!/usr/bin/env node

const line = `"Worse. Echo-7. Owner claims 'emotional instability.'" He gestured to a sleek, humanoid bot slumped in a corner, its optical sensors a dim, troubled amber. "Non-standard behavior. Refuses direct commands. Exhibits 'fear' when approached."`;

console.log('Test line:');
console.log(line);
console.log('');

// Test the regex
const dialoguePattern = /([""\u201C])((?:(?!\1).)*)([""\u201D])/g;
let match;
const dialogues = [];

while ((match = dialoguePattern.exec(line)) !== null) {
  console.log('Found dialogue:');
  console.log('  Full match:', match[0]);
  console.log('  Position:', match.index, 'to', match.index + match[0].length);
  dialogues.push({
    content: match[0],
    start: match.index,
    end: match.index + match[0].length
  });
}

console.log('');
console.log('Total dialogues found:', dialogues.length);

if (dialogues.length >= 2) {
  // Extract parts
  const dialogue1 = dialogues[0].content;
  const description = line.substring(dialogues[0].end, dialogues[1].start).trim();
  const dialogue2 = dialogues[1].content;

  console.log('');
  console.log('Split result:');
  console.log('1. Dialogue:', dialogue1);
  console.log('2. Description:', description);
  console.log('3. Dialogue:', dialogue2);
}
