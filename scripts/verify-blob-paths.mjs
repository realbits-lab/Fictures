/**
 * Verify that all blob upload paths use the consistent pattern:
 * stories/{storyId}/{imageType}/{id}.png
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying Vercel Blob storage paths...\n');

function getAllTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const files = getAllTsFiles('src');
const issues = [];
const validPatterns = [];

for (const file of files) {
  const content = readFileSync(file, 'utf-8');

  // Skip if file doesn't use blob storage
  if (!content.includes('@vercel/blob')) {
    continue;
  }

  // Check for old patterns
  if (content.match(/story-images\//)) {
    issues.push({
      file,
      issue: 'Uses old "story-images/" pattern',
      pattern: 'story-images/'
    });
  }

  if (content.match(/\${type}s\//)) {
    issues.push({
      file,
      issue: 'Uses plural pattern "${type}s/"',
      pattern: '${type}s/'
    });
  }

  // Check for correct pattern
  const correctPattern = /stories\/\${storyId}\/\${[^}]+}\/[^`]+\.png/;
  if (content.match(correctPattern)) {
    validPatterns.push({
      file,
      pattern: 'stories/${storyId}/${imageType}/${id}.png'
    });
  }
}

if (issues.length > 0) {
  console.log('❌ Found issues:\n');
  issues.forEach(({ file, issue, pattern }) => {
    console.log(`  ${file}`);
    console.log(`    Issue: ${issue}`);
    console.log(`    Pattern: ${pattern}\n`);
  });
} else {
  console.log('✅ No old patterns found!\n');
}

if (validPatterns.length > 0) {
  console.log('✅ Files using correct pattern:\n');
  validPatterns.forEach(({ file, pattern }) => {
    console.log(`  ✓ ${file}`);
  });
  console.log('');
}

console.log('📊 Summary:');
console.log(`  Valid files: ${validPatterns.length}`);
console.log(`  Issues found: ${issues.length}`);

if (issues.length === 0 && validPatterns.length > 0) {
  console.log('\n🎉 All blob storage paths are consistent!');
  process.exit(0);
} else if (issues.length > 0) {
  console.log('\n⚠️  Please fix the issues above.');
  process.exit(1);
} else {
  console.log('\n✅ No blob storage usage found.');
  process.exit(0);
}
