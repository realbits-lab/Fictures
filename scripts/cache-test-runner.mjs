#!/usr/bin/env node

/**
 * Cache Performance Test - Complete Test Runner
 *
 * Orchestrates the full cache performance test workflow:
 * 1. Setup: Create mockup database data
 * 2. Measure: Test API performance (Redis cache)
 * 3. E2E: Test browser performance (SWR + localStorage + Redis)
 * 4. Cleanup: Optional cleanup of test data
 *
 * Usage:
 *   node scripts/cache-test-runner.mjs [options]
 *
 * Options:
 *   --skip-setup    Skip database setup (use existing data)
 *   --skip-measure  Skip API measurement tests
 *   --skip-e2e      Skip Playwright E2E tests
 *   --cleanup       Cleanup test data after tests
 *   --dev-server    Start dev server automatically
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  skipSetup: args.includes('--skip-setup'),
  skipMeasure: args.includes('--skip-measure'),
  skipE2e: args.includes('--skip-e2e'),
  cleanup: args.includes('--cleanup'),
  devServer: args.includes('--dev-server'),
};

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  devServerPort: 3000,
  logDir: 'logs',
  resultsDir: 'test-results',
};

let devServerProcess = null;
let testResults = {
  setup: null,
  measure: null,
  e2e: null,
  cleanup: null,
};

/**
 * Print test banner
 */
function printBanner() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 CACHE PERFORMANCE TEST SUITE');
  console.log('='.repeat(70) + '\n');
  console.log('This test suite validates caching optimization across:');
  console.log('  1. Layer 1: SWR Memory Cache (client-side, 30 min)');
  console.log('  2. Layer 2: localStorage Cache (client-side, 1 hour)');
  console.log('  3. Layer 3: Redis Cache (server-side, 10 min)\n');
  console.log('Test Configuration:');
  console.log(`  Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`  Skip Setup: ${options.skipSetup ? 'YES' : 'NO'}`);
  console.log(`  Skip Measure: ${options.skipMeasure ? 'YES' : 'NO'}`);
  console.log(`  Skip E2E: ${options.skipE2e ? 'YES' : 'NO'}`);
  console.log(`  Cleanup After: ${options.cleanup ? 'YES' : 'NO'}`);
  console.log(`  Start Dev Server: ${options.devServer ? 'YES' : 'NO'}`);
  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Ensure directories exist
 */
async function ensureDirectories() {
  try {
    await fs.mkdir(TEST_CONFIG.logDir, { recursive: true });
    await fs.mkdir(TEST_CONFIG.resultsDir, { recursive: true });
    console.log('✅ Test directories ready\n');
  } catch (error) {
    console.error('❌ Failed to create directories:', error.message);
  }
}

/**
 * Check if dev server is running
 */
async function checkDevServer() {
  try {
    const response = await fetch(TEST_CONFIG.baseUrl);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Start development server
 */
async function startDevServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting development server...\n');

    const devProcess = spawn('dotenv', ['--file', '.env.local', 'run', 'pnpm', 'dev'], {
      stdio: 'pipe',
      detached: false,
    });

    let serverReady = false;

    devProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);

      if (output.includes('Ready in') || output.includes('Local:')) {
        serverReady = true;
        console.log('\n✅ Development server is ready!\n');
        resolve(devProcess);
      }
    });

    devProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    devProcess.on('error', (error) => {
      console.error('❌ Failed to start dev server:', error.message);
      reject(error);
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (!serverReady) {
        console.error('❌ Dev server did not start within 60 seconds');
        devProcess.kill();
        reject(new Error('Dev server timeout'));
      }
    }, 60000);
  });
}

/**
 * Stop development server
 */
async function stopDevServer() {
  if (devServerProcess) {
    console.log('\n🛑 Stopping development server...');
    devServerProcess.kill();
    devServerProcess = null;

    // Also kill any remaining processes on port 3000
    try {
      await execAsync(`lsof -ti:${TEST_CONFIG.devServerPort} | xargs kill -9`);
    } catch (error) {
      // Ignore errors (process might not exist)
    }

    console.log('✅ Development server stopped\n');
  }
}

/**
 * Run database setup
 */
async function runSetup() {
  console.log('\n' + '─'.repeat(70));
  console.log('📝 Step 1: Database Setup');
  console.log('─'.repeat(70) + '\n');

  try {
    const { stdout, stderr } = await execAsync(
      'dotenv --file .env.local run node scripts/cache-test-setup.mjs'
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    testResults.setup = { success: true, output: stdout };
    console.log('\n✅ Database setup complete!\n');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    testResults.setup = { success: false, error: error.message };
    throw error;
  }
}

/**
 * Run API measurement tests
 */
async function runMeasurement() {
  console.log('\n' + '─'.repeat(70));
  console.log('📊 Step 2: API Performance Measurement');
  console.log('─'.repeat(70) + '\n');

  try {
    const { stdout, stderr } = await execAsync(
      'dotenv --file .env.local run node scripts/cache-test-measure.mjs'
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    testResults.measure = { success: true, output: stdout };
    console.log('\n✅ API measurement complete!\n');
  } catch (error) {
    console.error('❌ API measurement failed:', error.message);
    testResults.measure = { success: false, error: error.message };
    throw error;
  }
}

/**
 * Run E2E tests
 */
async function runE2ETests() {
  console.log('\n' + '─'.repeat(70));
  console.log('🎭 Step 3: End-to-End Tests (Playwright)');
  console.log('─'.repeat(70) + '\n');

  try {
    const { stdout, stderr } = await execAsync(
      'dotenv --file .env.local run npx playwright test tests/cache-performance.spec.ts --reporter=list'
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    testResults.e2e = { success: true, output: stdout };
    console.log('\n✅ E2E tests complete!\n');
  } catch (error) {
    console.error('❌ E2E tests failed:', error.message);
    testResults.e2e = { success: false, error: error.message };
    throw error;
  }
}

/**
 * Cleanup test data
 */
async function runCleanup() {
  console.log('\n' + '─'.repeat(70));
  console.log('🗑️  Step 4: Cleanup Test Data');
  console.log('─'.repeat(70) + '\n');

  try {
    const { stdout, stderr } = await execAsync(
      'dotenv --file .env.local run node scripts/cache-test-setup.mjs --cleanup'
    );

    console.log(stdout);
    if (stderr) console.error(stderr);

    testResults.cleanup = { success: true, output: stdout };
    console.log('\n✅ Cleanup complete!\n');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    testResults.cleanup = { success: false, error: error.message };
  }
}

/**
 * Generate final report
 */
function generateReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL TEST REPORT');
  console.log('='.repeat(70) + '\n');

  console.log('Test Results Summary:\n');

  if (testResults.setup) {
    console.log(`  Database Setup: ${testResults.setup.success ? '✅ PASSED' : '❌ FAILED'}`);
  }

  if (testResults.measure) {
    console.log(`  API Measurement: ${testResults.measure.success ? '✅ PASSED' : '❌ FAILED'}`);
  }

  if (testResults.e2e) {
    console.log(`  E2E Tests: ${testResults.e2e.success ? '✅ PASSED' : '❌ FAILED'}`);
  }

  if (testResults.cleanup) {
    console.log(`  Cleanup: ${testResults.cleanup.success ? '✅ PASSED' : '❌ FAILED'}`);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Overall status
  const allPassed = Object.values(testResults).every((r) => !r || r.success);

  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('Cache optimization is working correctly across all layers.\n');
  } else {
    console.log('❌ SOME TESTS FAILED\n');
    console.log('Please review the errors above and fix the issues.\n');
  }

  console.log('Next Steps:');
  console.log('  - Review test results in logs/ directory');
  console.log('  - Check Playwright report: npx playwright show-report');
  console.log('  - Visit test page: http://localhost:3000/test/cache-performance\n');
}

/**
 * Main test runner
 */
async function main() {
  printBanner();

  try {
    // Ensure test directories exist
    await ensureDirectories();

    // Start dev server if requested
    if (options.devServer) {
      const serverRunning = await checkDevServer();

      if (!serverRunning) {
        devServerProcess = await startDevServer();
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for server to stabilize
      } else {
        console.log('✅ Development server already running\n');
      }
    } else {
      // Check if server is running
      const serverRunning = await checkDevServer();
      if (!serverRunning) {
        console.warn('⚠️  Warning: Development server is not running!');
        console.warn('   Start it manually or use --dev-server flag\n');
      }
    }

    // Run tests in sequence
    if (!options.skipSetup) {
      await runSetup();
    }

    if (!options.skipMeasure) {
      await runMeasurement();
    }

    if (!options.skipE2e) {
      await runE2ETests();
    }

    if (options.cleanup) {
      await runCleanup();
    }

    // Generate final report
    generateReport();

    // Stop dev server if we started it
    if (options.devServer && devServerProcess) {
      await stopDevServer();
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);

    // Stop dev server if we started it
    if (options.devServer && devServerProcess) {
      await stopDevServer();
    }

    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Test interrupted by user');
  if (devServerProcess) {
    await stopDevServer();
  }
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Test terminated');
  if (devServerProcess) {
    await stopDevServer();
  }
  process.exit(1);
});

main();
