#!/usr/bin/env node

/**
 * Analyze all references to removed schema fields
 *
 * Searches for: partIds, chapterIds, sceneIds (and snake_case variants)
 * Categorizes by: docs, migrations, code, tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const SEARCH_PATTERNS = [
  'partIds',
  'chapterIds',
  'sceneIds',
  'part_ids',
  'chapter_ids',
  'scene_ids'
];

const CATEGORIES = {
  docs: /^docs\//,
  migrations: /^drizzle\/.*\.sql$/,
  schema: /src\/lib\/db\/schema\.ts$/,
  drizzleSchema: /^drizzle\/schema\.ts$/,
  queries: /src\/lib\/db\/.*queries\.ts$/,
  services: /src\/lib\/services\//,
  api: /src\/app\/(api|studio\/api)\//,
  cache: /src\/lib\/cache\//,
  components: /src\/components\//,
  scripts: /^scripts\//,
  other: /.*/
};

async function analyzeReferences() {
  console.log('🔍 Analyzing Schema References\n');
  console.log('Searching for: partIds, chapterIds, sceneIds\n');

  const results = {
    docs: [],
    migrations: [],
    schema: [],
    drizzleSchema: [],
    queries: [],
    services: [],
    api: [],
    cache: [],
    components: [],
    scripts: [],
    other: []
  };

  // Search for all patterns
  const pattern = SEARCH_PATTERNS.join('|');
  const grepCmd = `grep -rn -i "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" --include="*.md" --include="*.sql" . 2>/dev/null || true`;

  try {
    const { stdout } = await execAsync(grepCmd, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024
    });

    const lines = stdout.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const match = line.match(/^\.\/([^:]+):(\d+):(.*)/);
      if (!match) continue;

      const [, filePath, lineNum, content] = match;

      // Skip node_modules, .next, etc
      if (filePath.includes('node_modules') ||
          filePath.includes('.next') ||
          filePath.includes('dist') ||
          filePath.includes('.git')) {
        continue;
      }

      const item = { filePath, lineNum: parseInt(lineNum), content: content.trim() };

      // Categorize
      let categorized = false;
      for (const [category, regex] of Object.entries(CATEGORIES)) {
        if (category === 'other') continue;
        if (regex.test(filePath)) {
          results[category].push(item);
          categorized = true;
          break;
        }
      }
      if (!categorized) {
        results.other.push(item);
      }
    }
  } catch (error) {
    console.error('Error running grep:', error.message);
    process.exit(1);
  }

  // Print results
  console.log('═'.repeat(80));
  console.log('ANALYSIS RESULTS');
  console.log('═'.repeat(80));
  console.log();

  for (const [category, items] of Object.entries(results)) {
    if (items.length === 0) continue;

    const icon = {
      docs: '📚',
      migrations: '🔄',
      schema: '🗄️',
      drizzleSchema: '⚙️',
      queries: '🔍',
      services: '⚡',
      api: '🌐',
      cache: '💾',
      components: '🎨',
      scripts: '📜',
      other: '❓'
    }[category] || '•';

    console.log(`${icon} ${category.toUpperCase()} (${items.length} references)`);
    console.log('─'.repeat(80));

    // Group by file
    const byFile = {};
    for (const item of items) {
      if (!byFile[item.filePath]) byFile[item.filePath] = [];
      byFile[item.filePath].push(item);
    }

    for (const [file, refs] of Object.entries(byFile)) {
      console.log(`  📄 ${file}`);
      for (const ref of refs.slice(0, 3)) { // Show first 3 per file
        console.log(`     L${ref.lineNum}: ${ref.content.substring(0, 70)}...`);
      }
      if (refs.length > 3) {
        console.log(`     ... and ${refs.length - 3} more`);
      }
    }
    console.log();
  }

  // Summary
  const totalRefs = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  console.log('═'.repeat(80));
  console.log('SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total references found: ${totalRefs}`);
  console.log();

  // Action items
  console.log('🎯 ACTION ITEMS:');
  console.log();

  if (results.schema.length > 0) {
    console.log('❌ CRITICAL: src/lib/db/schema.ts still has references');
    console.log('   → These should have been removed in the migration');
  } else {
    console.log('✅ src/lib/db/schema.ts: Clean (no references)');
  }

  if (results.drizzleSchema.length > 0) {
    console.log('⚠️  WARNING: drizzle/schema.ts has references');
    console.log('   → Run: pnpm db:pull to regenerate from database');
  }

  if (results.queries.length > 0) {
    console.log('📋 REVIEW: Query files have references');
    console.log('   → Check if code is reading these fields (should be removed)');
  }

  if (results.api.length > 0) {
    console.log('📋 REVIEW: API routes have references');
    console.log('   → Check if endpoints expose these fields (should be removed)');
  }

  if (results.services.length > 0) {
    console.log('📋 REVIEW: Service files have references');
    console.log('   → Verify if services use these fields (update logic)');
  }

  if (results.cache.length > 0) {
    console.log('✅ EXPECTED: Cache files derive arrays from query results (OK)');
  }

  if (results.docs.length > 0) {
    console.log('📝 INFO: Documentation mentions these fields');
    console.log('   → Update docs to reflect schema changes');
  }

  if (results.migrations.length > 0) {
    console.log('✅ EXPECTED: Migration files reference these fields (historical)');
  }

  console.log();
  console.log('Run specific file checks:');
  console.log('  grep -n "partIds\\|chapterIds\\|sceneIds" <file>');
  console.log();
}

analyzeReferences().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
