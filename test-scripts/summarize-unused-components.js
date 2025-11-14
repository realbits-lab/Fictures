#!/usr/bin/env node

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./logs/components-analysis-deep.json', 'utf-8'));

console.log('='.repeat(80));
console.log('POTENTIALLY UNUSED COMPONENTS - DETAILED BREAKDOWN');
console.log('='.repeat(80));

const byCategory = {};
data.potentiallyUnused.forEach(c => {
  if (!byCategory[c.category]) byCategory[c.category] = [];
  byCategory[c.category].push(c);
});

Object.keys(byCategory).sort().forEach(cat => {
  console.log(`\n${cat} (${byCategory[cat].length}):`);
  byCategory[cat].forEach(comp => {
    const fileName = comp.path.split('/').pop();
    const names = comp.names.length > 0 ? ` [${comp.names.join(', ')}]` : ' [no exports found]';
    const reexport = comp.isReexported ? ' 🔄 RE-EXPORTED' : '';
    console.log(`  - ${fileName}${names}${reexport}`);
    console.log(`    Path: ${comp.path}`);
  });
});

console.log('\n' + '='.repeat(80));
console.log('SUMMARY BY CATEGORY');
console.log('='.repeat(80));
Object.keys(byCategory).sort().forEach(cat => {
  console.log(`${cat.padEnd(30)} ${byCategory[cat].length} components`);
});

console.log('\n' + '='.repeat(80));
console.log('RECOMMENDATION ANALYSIS');
console.log('='.repeat(80));

// Categorize by safety of deletion
const safeToDelete = [];
const needsReview = [];
const keepForNow = [];

data.potentiallyUnused.forEach(c => {
  const fileName = c.path.split('/').pop();

  // Index files that are re-exported - might be unused
  if (fileName === 'index.ts' && c.isReexported) {
    needsReview.push({ ...c, reason: 'Index file - check if still needed' });
  }
  // Files that are re-exported through index but not used
  else if (c.isReexported) {
    needsReview.push({ ...c, reason: 'Re-exported but not directly imported - may be part of public API' });
  }
  // Files with no component names found
  else if (c.names.length === 0) {
    needsReview.push({ ...c, reason: 'No exports detected - may be type/utility file' });
  }
  // Regular component files not used anywhere
  else {
    safeToDelete.push({ ...c, reason: 'Component not imported or used in JSX' });
  }
});

console.log(`\n🟢 POTENTIALLY SAFE TO DELETE (${safeToDelete.length}):`);
safeToDelete.slice(0, 15).forEach(c => {
  console.log(`  - ${c.path.split('/').pop().padEnd(40)} ${c.names.join(', ')}`);
});
if (safeToDelete.length > 15) {
  console.log(`  ... and ${safeToDelete.length - 15} more`);
}

console.log(`\n🟡 NEEDS REVIEW (${needsReview.length}):`);
needsReview.slice(0, 15).forEach(c => {
  console.log(`  - ${c.path.split('/').pop().padEnd(40)} ${c.reason}`);
});
if (needsReview.length > 15) {
  console.log(`  ... and ${needsReview.length - 15} more`);
}

console.log('\n' + '='.repeat(80));
console.log('USED COMPONENTS SAMPLE (First 20)');
console.log('='.repeat(80));
data.used.slice(0, 20).forEach(c => {
  const fileName = c.path.split('/').pop();
  const usageCount = c.usage.reduce((sum, u) => sum + u.files.length, 0);
  console.log(`✅ ${fileName.padEnd(45)} (${usageCount} usages)`);
});

console.log('\n');
