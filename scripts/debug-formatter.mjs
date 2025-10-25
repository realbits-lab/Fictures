#!/usr/bin/env node

/**
 * Debug Scene Formatter
 */

import { formatSceneContent } from '../src/lib/services/scene-formatter.ts';

const testInput = `Sarah walked into the room. The walls were painted a dull gray.
"What are you doing here?" Marcus asked.`;

console.log('Input:');
console.log(testInput);
console.log('\n---\n');

const result = formatSceneContent(testInput);

console.log('Output:');
console.log(result.formatted);
console.log('\n---\n');

console.log('Changes:', result.changes);
console.log('Stats:', result.stats);
