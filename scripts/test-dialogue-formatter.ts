import { formatSceneContent } from '../src/lib/services/dialogue-formatter';

// Test cases
const testCases = [
  {
    name: 'Simple dialogue formatting',
    input: `The room was dark. "Who's there?" Maya whispered. Chen stepped forward. "It's me." They both relaxed.`,
    expected: `The room was dark.

"Who's there?"

Maya whispered.
Chen stepped forward.

"It's me."

They both relaxed.`
  },
  {
    name: 'Complex scene with mixed content',
    input: `Maya traced her finger along the map. "This can't be right," she said.
Kael leaned closer. "Wait. Look at this."
"What about it?" Maya asked.
"I've seen it before." He pulled out his notebook.`,
    expected: `Maya traced her finger along the map.

"This can't be right,"

she said.
Kael leaned closer.

"Wait. Look at this."

"What about it?"

Maya asked.

"I've seen it before."

He pulled out his notebook.`
  }
];

console.log('Testing Dialogue Formatter\n');
console.log('=' .repeat(50));

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(50));

  console.log('Input:');
  console.log(testCase.input);

  const result = formatSceneContent(testCase.input);

  console.log('\nFormatted Output:');
  console.log(result);

  console.log('\nResult:', result.trim() === testCase.expected.trim() ? '✅ PASS' : '❌ FAIL');

  if (result.trim() !== testCase.expected.trim()) {
    console.log('\nExpected:');
    console.log(testCase.expected);
  }
});

console.log('\n' + '='.repeat(50));
console.log('Dialogue formatter testing complete!');