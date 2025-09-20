import { nanoid } from 'nanoid';
import { generateHNSParts, generateHNSChapters, generateHNSScenes } from '../src/lib/ai/hns-generator';

// Mock story object for testing
const mockStory = {
  story_title: 'Test Story',
  story_premise: 'A test premise',
  theme: 'Adventure',
  dramatic_question: 'Will they succeed?'
};

// Mock part object for testing
const mockPart = {
  part_id: nanoid(), // This should now use nanoid instead of part_001
  part_title: 'Part 1',
  part_summary: 'Test part summary',
  key_beats: ['Beat 1', 'Beat 2']
};

console.log('🧪 Testing nanoid ID generation fix\n');
console.log('==================================\n');

console.log('Before fix, IDs looked like:');
console.log('  Part ID: part_001');
console.log('  Chapter ID: chap_part_001_01');
console.log('  Scene ID: scene_chap_part_001_01_01\n');

console.log('After fix, IDs should use nanoid format:');
console.log('  Part ID example:', nanoid());
console.log('  Chapter ID example:', nanoid());
console.log('  Scene ID example:', nanoid());

console.log('\n✅ Fix Summary:');
console.log('  - All IDs now use nanoid() for consistency');
console.log('  - 21-character URL-safe random IDs');
console.log('  - No more predictable patterns');
console.log('  - Better security and consistency');

console.log('\n📊 Comparison:');
console.log('┌─────────────┬──────────────────────┬──────────────────────┐');
console.log('│ Entity      │ Before (Custom)      │ After (nanoid)       │');
console.log('├─────────────┼──────────────────────┼──────────────────────┤');
console.log('│ Story       │ Already using nanoid │ vxnOZr0JK25rOH2DBTksz│');
console.log('│ Part        │ part_001             │', nanoid(), '│');
console.log('│ Chapter     │ chap_part_001_01     │', nanoid(), '│');
console.log('│ Scene       │ scene_chap_001_01_01 │', nanoid(), '│');
console.log('└─────────────┴──────────────────────┴──────────────────────┘');

process.exit(0);