import { formatSceneContent, validateDialogueFormatting } from '../src/lib/services/dialogue-formatter';

const demoText = `The ancient map spread across the table. Maya traced her finger along the lines. "This can't be right," she muttered. Kael leaned closer. "Wait. Look at this symbol." "What about it?" Maya squinted. "I've seen it before," Kael said grimly. Thunder rolled outside.`;

console.log('🎬 DIALOGUE FORMATTING DEMO\n');
console.log('=' .repeat(60));

console.log('\n📝 ORIGINAL TEXT:\n');
console.log(demoText);

// Validate original
const beforeValidation = validateDialogueFormatting(demoText);
console.log('\n❌ ISSUES FOUND:');
beforeValidation.issues.forEach(issue => console.log(`  • ${issue}`));

// Format the text
const formattedText = formatSceneContent(demoText);

console.log('\n✨ FORMATTED TEXT:\n');
console.log(formattedText);

// Validate formatted text
const afterValidation = validateDialogueFormatting(formattedText);
console.log('\n✅ VALIDATION RESULT:');
console.log(`  Status: ${afterValidation.isValid ? 'VALID' : 'INVALID'}`);
console.log(`  Issues: ${afterValidation.issues.length === 0 ? 'None' : afterValidation.issues.join(', ')}`);

console.log('\n' + '=' .repeat(60));
console.log('📊 SUMMARY:');
console.log(`  • Original length: ${demoText.length} characters`);
console.log(`  • Formatted length: ${formattedText.length} characters`);
console.log(`  • Lines added for dialogue isolation: ${formattedText.split('\n').length - demoText.split('\n').length}`);
console.log(`  • All dialogue properly isolated: ${afterValidation.isValid ? '✅' : '❌'}`);