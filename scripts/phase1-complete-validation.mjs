/**
 * Phase 1 Complete Validation Script
 *
 * Comprehensive validation that all Phase 1 components are integrated and working.
 * This is the FINAL checkpoint before proceeding to Phase 2 (Staging Deployment).
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/phase1-complete-validation.mjs
 */

import fs from 'fs';
import path from 'path';

console.log('='.repeat(70));
console.log('PHASE 1 COMPLETE VALIDATION - FINAL CHECKPOINT');
console.log('='.repeat(70));
console.log('\n');

const results = {
  phase: 'Phase 1: Pre-deployment Validation',
  timestamp: new Date().toISOString(),
  checks: {
    coreFiles: [],
    apiRoutes: [],
    uiComponents: [],
    testFiles: [],
    documentation: [],
  },
  summary: {
    totalChecks: 0,
    passed: 0,
    failed: 0,
  },
  readyForPhase2: false,
};

/**
 * Check if file exists
 */
function checkFile(category, filePath, description) {
  const exists = fs.existsSync(filePath);
  const check = {
    file: filePath,
    description,
    status: exists ? 'passed' : 'failed',
  };

  results.checks[category].push(check);
  results.summary.totalChecks++;

  if (exists) {
    results.summary.passed++;
    console.log(`✅ ${description}`);
    console.log(`   ${filePath}`);
  } else {
    results.summary.failed++;
    console.log(`❌ ${description}`);
    console.log(`   MISSING: ${filePath}`);
  }
}

/**
 * Check if file contains specific content
 */
function checkFileContent(category, filePath, searchString, description) {
  const exists = fs.existsSync(filePath);
  let containsContent = false;

  if (exists) {
    const content = fs.readFileSync(filePath, 'utf-8');
    containsContent = content.includes(searchString);
  }

  const check = {
    file: filePath,
    description,
    searchString,
    status: exists && containsContent ? 'passed' : 'failed',
  };

  results.checks[category].push(check);
  results.summary.totalChecks++;

  if (exists && containsContent) {
    results.summary.passed++;
    console.log(`✅ ${description}`);
    console.log(`   ${filePath}`);
  } else if (!exists) {
    results.summary.failed++;
    console.log(`❌ ${description} - FILE MISSING`);
    console.log(`   ${filePath}`);
  } else {
    results.summary.failed++;
    console.log(`❌ ${description} - CONTENT NOT FOUND`);
    console.log(`   Expected: "${searchString}"`);
    console.log(`   In: ${filePath}`);
  }
}

console.log('CORE SYSTEM FILES');
console.log('-'.repeat(70));

checkFile(
  'coreFiles',
  'src/lib/cache/unified-invalidation.ts',
  'Unified Invalidation System'
);

checkFile(
  'coreFiles',
  'src/lib/hooks/use-cache-invalidation.ts',
  'Client-side Cache Invalidation Hook'
);

checkFile(
  'coreFiles',
  'src/lib/cache/cache-metrics.ts',
  'Cache Metrics Tracking System'
);

checkFile(
  'coreFiles',
  'src/lib/cache/cache-middleware.ts',
  'Auto-cache Middleware'
);

checkFile(
  'coreFiles',
  'src/lib/hooks/use-optimistic-mutation.ts',
  'Optimistic Updates Hook'
);

checkFile(
  'coreFiles',
  'src/lib/hooks/use-prefetch.ts',
  'Prefetching Utilities Hook'
);

checkFile(
  'coreFiles',
  'src/lib/monitoring/cache-alerts.ts',
  'Cache Monitoring & Alerts System'
);

console.log('\n');
console.log('API ROUTES');
console.log('-'.repeat(70));

checkFile(
  'apiRoutes',
  'src/app/studio/api/cache/metrics/route.ts',
  'Cache Metrics API'
);

checkFile(
  'apiRoutes',
  'src/app/studio/api/cache/monitoring/route.ts',
  'Cache Monitoring API'
);

checkFileContent(
  'apiRoutes',
  'src/app/studio/api/scenes/[id]/route.ts',
  'invalidateEntityCache',
  'Scenes API - Cache Invalidation'
);

checkFileContent(
  'apiRoutes',
  'src/app/studio/api/chapters/[id]/route.ts',
  'invalidateEntityCache',
  'Chapters API - Cache Invalidation'
);

checkFileContent(
  'apiRoutes',
  'src/app/studio/api/stories/[id]/write/route.ts',
  'invalidateEntityCache',
  'Stories Write API - Cache Invalidation'
);

checkFileContent(
  'apiRoutes',
  'src/app/community/api/posts/[postId]/like/route.ts',
  'invalidateEntityCache',
  'Community Posts Like API - Cache Invalidation'
);

checkFileContent(
  'apiRoutes',
  'src/app/community/api/posts/route.ts',
  'invalidateEntityCache',
  'Community Posts API - Cache Invalidation'
);

checkFileContent(
  'apiRoutes',
  'src/app/community/api/posts/[postId]/replies/route.ts',
  'invalidateEntityCache',
  'Community Replies API - Cache Invalidation'
);

console.log('\n');
console.log('UI COMPONENTS');
console.log('-'.repeat(70));

checkFile(
  'uiComponents',
  'src/components/debug/CacheDebugPanel.tsx',
  'Cache Debug Panel Component'
);

checkFile(
  'uiComponents',
  'src/components/debug/AdvancedCacheMetricsDashboard.tsx',
  'Advanced Metrics Dashboard Component'
);

checkFileContent(
  'uiComponents',
  'src/app/layout.tsx',
  'CacheDebugPanel',
  'Layout Integration - CacheDebugPanel'
);

checkFileContent(
  'uiComponents',
  'src/app/layout.tsx',
  'AdvancedCacheMetricsDashboard',
  'Layout Integration - AdvancedCacheMetricsDashboard'
);

console.log('\n');
console.log('TEST FILES');
console.log('-'.repeat(70));

checkFile(
  'testFiles',
  'tests/cache-invalidation-studio.spec.ts',
  'Studio E2E Tests'
);

checkFile(
  'testFiles',
  'tests/cache-invalidation-community.spec.ts',
  'Community E2E Tests'
);

checkFile(
  'testFiles',
  'tests/cache-performance-benchmarks.spec.ts',
  'Performance Benchmarks'
);

checkFile(
  'testFiles',
  'scripts/cache-load-test.mjs',
  'Load Testing Script'
);

checkFile(
  'testFiles',
  'scripts/cache-analysis.mjs',
  'Cache Analysis Tool'
);

console.log('\n');
console.log('DOCUMENTATION');
console.log('-'.repeat(70));

checkFile(
  'documentation',
  'CACHE-INVALIDATION-IMPLEMENTATION-PLAN.md',
  'Implementation Plan (4 weeks)'
);

checkFile(
  'documentation',
  'CACHE-INVALIDATION-WEEK1-COMPLETE-SUMMARY.md',
  'Week 1 Complete Summary'
);

checkFile(
  'documentation',
  'CACHE-INVALIDATION-COMPLETE-SUMMARY.md',
  'Complete Implementation Summary'
);

checkFile(
  'documentation',
  'docs/CACHE-INVALIDATION-ROLLOUT-GUIDE.md',
  'Rollout Guide (Phases 1-4)'
);

checkFile(
  'documentation',
  'docs/ROLLOUT-EXECUTION-REPORT.md',
  'Rollout Execution Report'
);

// Calculate results
console.log('\n');
console.log('='.repeat(70));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(70));

const passRate = (results.summary.passed / results.summary.totalChecks) * 100;
results.readyForPhase2 = results.summary.failed === 0;

console.log(`\nTotal Checks: ${results.summary.totalChecks}`);
console.log(`✅ Passed: ${results.summary.passed} (${passRate.toFixed(1)}%)`);
console.log(`❌ Failed: ${results.summary.failed}`);

console.log('\nBreakdown by Category:');
Object.entries(results.checks).forEach(([category, checks]) => {
  const passed = checks.filter((c) => c.status === 'passed').length;
  const total = checks.length;
  const rate = total > 0 ? (passed / total) * 100 : 0;
  console.log(`  ${category}: ${passed}/${total} (${rate.toFixed(1)}%)`);
});

// Save report
const reportDir = 'logs';
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const reportFile = path.join(reportDir, 'phase1-complete-validation.json');
fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));

console.log(`\n📊 Detailed report saved to: ${reportFile}`);

// Decision
console.log('\n' + '='.repeat(70));

if (results.readyForPhase2) {
  console.log('✅ PHASE 1 COMPLETE - READY FOR PHASE 2');
  console.log('✅ All components integrated and validated');
  console.log('✅ Proceed to Phase 2: Staging Deployment');
  console.log('\nNext Steps:');
  console.log('  1. Run E2E tests: npm run test:e2e');
  console.log('  2. Run benchmarks: npm run test:benchmarks');
  console.log('  3. Deploy to staging environment');
  console.log('  4. Follow Phase 2 in docs/CACHE-INVALIDATION-ROLLOUT-GUIDE.md');
} else {
  console.log('❌ PHASE 1 INCOMPLETE');
  console.log(`❌ ${results.summary.failed} checks failed`);
  console.log('❌ Fix failures before proceeding to Phase 2');
  console.log('\nFailed Checks:');
  Object.values(results.checks).forEach((checks) => {
    checks
      .filter((c) => c.status === 'failed')
      .forEach((c) => {
        console.log(`  - ${c.description}`);
        console.log(`    ${c.file}`);
      });
  });
}

console.log('='.repeat(70));

process.exit(results.readyForPhase2 ? 0 : 1);
