/**
 * Phase 1: Pre-deployment Validation Script
 *
 * Runs all required checks before deployment:
 * 1. E2E test suite
 * 2. Performance benchmarks
 * 3. Cache analysis
 * 4. Validation report
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/phase1-validation.mjs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('='.repeat(60));
console.log('PHASE 1: PRE-DEPLOYMENT VALIDATION');
console.log('='.repeat(60));
console.log('\n');

const results = {
  startTime: new Date().toISOString(),
  checks: [],
  passed: 0,
  failed: 0,
  warnings: 0,
};

/**
 * Run a check and record results
 */
async function runCheck(name, command, validateFn) {
  console.log(`\n[${'▶'.padEnd(3)}] ${name}`);
  console.log('-'.repeat(60));

  const startTime = Date.now();
  const check = {
    name,
    command,
    status: 'pending',
    duration: 0,
    output: '',
    error: null,
  };

  try {
    const { stdout, stderr } = await execAsync(command);
    check.output = stdout || stderr;
    check.duration = Date.now() - startTime;

    // Validate output
    const validation = validateFn ? validateFn(stdout, stderr) : { passed: true };

    if (validation.passed) {
      check.status = 'passed';
      results.passed++;
      console.log(`[✅] PASSED (${check.duration}ms)`);
    } else if (validation.warning) {
      check.status = 'warning';
      results.warnings++;
      console.log(`[⚠️ ] WARNING: ${validation.message}`);
    } else {
      check.status = 'failed';
      results.failed++;
      console.log(`[❌] FAILED: ${validation.message}`);
    }

    if (validation.details) {
      console.log(`    ${validation.details}`);
    }
  } catch (error) {
    check.status = 'failed';
    check.error = error.message;
    check.duration = Date.now() - startTime;
    results.failed++;
    console.log(`[❌] FAILED: ${error.message}`);
  }

  results.checks.push(check);
  return check;
}

/**
 * Main validation execution
 */
async function runValidation() {
  // Check 1: Verify dev server is running
  await runCheck(
    'Development Server Running',
    'lsof -ti:3000',
    (stdout) => {
      if (!stdout.trim()) {
        return {
          passed: false,
          message: 'Dev server not running on port 3000',
        };
      }
      return {
        passed: true,
        details: `Server PID: ${stdout.trim()}`,
      };
    }
  );

  // Check 2: Run E2E tests for Studio routes
  console.log('\nRunning Studio cache invalidation tests...');
  await runCheck(
    'Studio Cache Invalidation E2E Tests',
    'dotenv --file .env.local run npx playwright test cache-invalidation-studio --reporter=line',
    (stdout, stderr) => {
      const output = stdout + stderr;
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);

      if (failedMatch && parseInt(failedMatch[1]) > 0) {
        return {
          passed: false,
          message: `${failedMatch[1]} tests failed`,
        };
      }

      if (passedMatch) {
        return {
          passed: true,
          details: `${passedMatch[1]} tests passed`,
        };
      }

      return { passed: true };
    }
  );

  // Check 3: Run E2E tests for Community routes
  console.log('\nRunning Community cache invalidation tests...');
  await runCheck(
    'Community Cache Invalidation E2E Tests',
    'dotenv --file .env.local run npx playwright test cache-invalidation-community --reporter=line',
    (stdout, stderr) => {
      const output = stdout + stderr;
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);

      if (failedMatch && parseInt(failedMatch[1]) > 0) {
        return {
          passed: false,
          message: `${failedMatch[1]} tests failed`,
        };
      }

      if (passedMatch) {
        return {
          passed: true,
          details: `${passedMatch[1]} tests passed`,
        };
      }

      return { passed: true };
    }
  );

  // Check 4: Run performance benchmarks
  console.log('\nRunning performance benchmarks...');
  await runCheck(
    'Performance Benchmarks',
    'dotenv --file .env.local run npx playwright test cache-performance-benchmarks --reporter=line',
    (stdout, stderr) => {
      const output = stdout + stderr;
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);

      if (failedMatch && parseInt(failedMatch[1]) > 0) {
        return {
          passed: false,
          message: `${failedMatch[1]} benchmarks failed thresholds`,
        };
      }

      if (passedMatch) {
        return {
          passed: true,
          details: `${passedMatch[1]} benchmarks passed`,
        };
      }

      return { passed: true };
    }
  );

  // Check 5: Verify cache metrics are working
  await runCheck(
    'Cache Metrics System',
    'curl -s http://localhost:3000/studio/api/cache/metrics?timeRange=1h',
    (stdout) => {
      try {
        const data = JSON.parse(stdout);
        if (data.summary) {
          return {
            passed: true,
            details: `Hit rate: ${(data.summary.hitRate * 100).toFixed(1)}%, Avg duration: ${data.summary.averageDuration.toFixed(1)}ms`,
          };
        }
        return { passed: false, message: 'Invalid metrics response' };
      } catch (error) {
        return { passed: false, message: 'Failed to parse metrics' };
      }
    }
  );

  // Check 6: Verify monitoring API is working
  await runCheck(
    'Cache Monitoring API',
    'curl -s http://localhost:3000/studio/api/cache/monitoring',
    (stdout) => {
      try {
        const data = JSON.parse(stdout);
        if (data.healthy !== undefined) {
          const alertCount = data.alerts?.total || 0;
          const criticalAlerts = data.alerts?.critical || 0;

          if (criticalAlerts > 0) {
            return {
              passed: false,
              message: `${criticalAlerts} critical alerts detected`,
            };
          }

          return {
            passed: true,
            details: `Health: ${data.healthy ? 'Good' : 'Issues'}, Alerts: ${alertCount}`,
          };
        }
        return { passed: false, message: 'Invalid monitoring response' };
      } catch (error) {
        return { passed: false, message: 'Failed to parse monitoring data' };
      }
    }
  );

  // Generate summary
  console.log('\n' + '='.repeat(60));
  console.log('VALIDATION SUMMARY');
  console.log('='.repeat(60));

  results.endTime = new Date().toISOString();
  results.totalDuration = results.checks.reduce((sum, check) => sum + check.duration, 0);

  console.log(`\nTotal Checks: ${results.checks.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`Total Time: ${(results.totalDuration / 1000).toFixed(2)}s`);

  // Detailed results
  console.log('\nDetailed Results:');
  results.checks.forEach((check, index) => {
    const icon = check.status === 'passed' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`${index + 1}. ${icon} ${check.name} (${check.duration}ms)`);
  });

  // Save report
  const reportDir = 'logs';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportFile = path.join(reportDir, 'phase1-validation-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));

  console.log(`\n📊 Validation report saved to: ${reportFile}`);

  // Decision
  console.log('\n' + '='.repeat(60));

  if (results.failed === 0 && results.warnings === 0) {
    console.log('✅ PHASE 1 VALIDATION PASSED');
    console.log('✅ System is ready for Phase 2: Staging Deployment');
    console.log('='.repeat(60));
    return 0;
  } else if (results.failed === 0 && results.warnings > 0) {
    console.log('⚠️  PHASE 1 VALIDATION PASSED WITH WARNINGS');
    console.log('⚠️  Review warnings before proceeding to Phase 2');
    console.log('='.repeat(60));
    return 0;
  } else {
    console.log('❌ PHASE 1 VALIDATION FAILED');
    console.log('❌ Fix failures before proceeding to Phase 2');
    console.log('='.repeat(60));
    return 1;
  }
}

// Run validation
runValidation()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('\n❌ Validation script failed:', error);
    process.exit(1);
  });
