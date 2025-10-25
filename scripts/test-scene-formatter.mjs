#!/usr/bin/env node

/**
 * Test Scene Formatter
 *
 * Tests the rule-based scene formatting system with various test cases
 */

import { formatSceneContent, validateSceneFormatting, getFormattingStats } from '../src/lib/services/scene-formatter.ts';

// ============================================
// TEST CASES
// ============================================

const testCases = [
  {
    name: 'Long description paragraph (should split)',
    input: `Sarah walked into the room. The walls were painted a dull gray, and the furniture was sparse. She noticed a desk in the corner with papers scattered across it. The window overlooked a busy street, and she could hear the sounds of traffic below.

"What are you doing here?" Marcus asked.

She turned to face him.

"I had to see you. We need to talk about what happened last night."`,
    expectedChanges: ['paragraph_split'],
  },
  {
    name: 'Missing blank line between description and dialogue',
    input: `Sarah walked into the room. The walls were painted a dull gray.
"What are you doing here?" Marcus asked.

She turned to face him.

"I had to see you."`,
    expectedChanges: ['spacing_added'],
  },
  {
    name: 'Multiple issues combined',
    input: `Sarah walked into the room. The walls were painted a dull gray, and the furniture was sparse. She noticed a desk in the corner with papers scattered across it. The window overlooked a busy street.
"What are you doing here?" Marcus asked.
She turned to face him. Her hands were trembling. She couldn't meet his eyes.
"I had to see you. We need to talk."

Marcus crossed his arms. He leaned against the doorframe. His expression was unreadable.`,
    expectedChanges: ['paragraph_split', 'spacing_added'],
  },
  {
    name: 'Already correctly formatted',
    input: `Sarah walked into the room. The walls were painted a dull gray.

"What are you doing here?" Marcus asked.

She turned to face him.

"I had to see you."`,
    expectedChanges: [],
  },
  {
    name: 'Complex scene with multiple transitions',
    input: `The stranger leaned against the wall. His eyes were cold. Calculating.

"You cannot stop them, Detective.
Only observe.
And perhaps, if you are very lucky, survive."

Sarah's hands trembled. She tried to steady her breathing. The room felt smaller with each passing second.

"Who are you?" she managed to ask.

He smiled. It didn't reach his eyes. The expression sent chills down her spine.`,
    expectedChanges: ['paragraph_split'],
  },
];

// ============================================
// TEST RUNNER
// ============================================

console.log('\n🧪 ============= SCENE FORMATTER TEST SUITE =============\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (const testCase of testCases) {
  totalTests++;
  console.log(`\n--- Test ${totalTests}: ${testCase.name} ---`);

  try {
    // Format the content
    const result = formatSceneContent(testCase.input);

    console.log(`\n📝 Original Content (${testCase.input.split(/\s+/).length} words):`);
    console.log(testCase.input.substring(0, 150) + '...\n');

    console.log(`✅ Formatted Content (${result.formatted.split(/\s+/).length} words):`);
    console.log(result.formatted.substring(0, 150) + '...\n');

    console.log(`📊 Changes Applied:`);
    if (result.changes.length === 0) {
      console.log('   No changes needed');
    } else {
      result.changes.forEach(change => {
        console.log(`   - ${change.type}: ${change.description}`);
      });
    }

    console.log(`\n📈 Formatting Stats:`);
    console.log(`   Original paragraphs: ${result.stats.originalParagraphs}`);
    console.log(`   Formatted paragraphs: ${result.stats.formattedParagraphs}`);
    console.log(`   Sentences split: ${result.stats.sentencesSplit}`);
    console.log(`   Spacing fixed: ${result.stats.spacingFixed}`);

    // Validate the formatted content
    const validation = validateSceneFormatting(result.formatted);

    console.log(`\n✓ Validation:`);
    if (validation.isValid) {
      console.log('   ✅ All formatting rules passed');
    } else {
      console.log(`   ⚠️ Found ${validation.violations.length} violations:`);
      validation.violations.forEach(v => {
        console.log(`     - ${v.rule} at ${v.location}: ${v.description}`);
      });
    }

    // Get detailed stats
    const stats = getFormattingStats(result.formatted);
    console.log(`\n📊 Detailed Stats:`);
    console.log(`   Total paragraphs: ${stats.totalParagraphs}`);
    console.log(`   Description paragraphs: ${stats.descriptionParagraphs}`);
    console.log(`   Dialogue paragraphs: ${stats.dialogueParagraphs}`);
    console.log(`   Avg sentences/description: ${stats.averageSentencesPerDescription.toFixed(2)}`);
    console.log(`   Longest description: ${stats.longestDescriptionSentences} sentences`);
    console.log(`   Block transitions: ${stats.blockTransitions}`);

    // Check if expected changes match actual changes
    const changeTypes = result.changes.map(c => c.type);
    const expectedFound = testCase.expectedChanges.every(expected =>
      changeTypes.includes(expected)
    );

    if (expectedFound || (testCase.expectedChanges.length === 0 && changeTypes.length === 0)) {
      console.log(`\n✅ Test PASSED`);
      passedTests++;
    } else {
      console.log(`\n⚠️ Test FAILED: Expected changes ${testCase.expectedChanges.join(', ')} but got ${changeTypes.join(', ')}`);
      failedTests++;
    }

  } catch (error) {
    console.error(`\n❌ Test FAILED with error:`);
    console.error(error);
    failedTests++;
  }
}

// ============================================
// FINAL RESULTS
// ============================================

console.log(`\n\n🎯 ============= TEST SUITE COMPLETE =============`);
console.log(`   Total Tests: ${totalTests}`);
console.log(`   Passed: ${passedTests} ✅`);
console.log(`   Failed: ${failedTests} ❌`);
console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log(`\n✨ All tests passed! Scene formatter is working correctly.`);
  process.exit(0);
} else {
  console.log(`\n⚠️ Some tests failed. Please review the output above.`);
  process.exit(1);
}
