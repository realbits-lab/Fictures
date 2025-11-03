/**
 * Cache Load Testing Script
 *
 * Simulates high concurrent load to test cache performance under stress.
 * Measures cache hit rates, response times, and system stability.
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/cache-load-test.mjs
 *   dotenv --file .env.local run node scripts/cache-load-test.mjs --users 50 --duration 300
 *
 * Options:
 *   --users      Number of concurrent users (default: 20)
 *   --duration   Test duration in seconds (default: 60)
 *   --endpoint   API endpoint to test (default: /studio/api/stories)
 *   --report     Generate detailed report (default: true)
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  users: parseInt(args.find((arg) => arg.startsWith('--users='))?.split('=')[1] || '20'),
  duration: parseInt(args.find((arg) => arg.startsWith('--duration='))?.split('=')[1] || '60'),
  endpoint: args.find((arg) => arg.startsWith('--endpoint='))?.split('=')[1] || '/studio/api/stories',
  report: args.find((arg) => arg === '--no-report') ? false : true,
};

console.log('=== Cache Load Testing ===');
console.log(`Concurrent Users: ${config.users}`);
console.log(`Test Duration: ${config.duration}s`);
console.log(`Target Endpoint: ${config.endpoint}`);
console.log('==========================\n');

/**
 * Metrics collector
 */
class MetricsCollector {
  constructor() {
    this.requests = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = 0;
    this.startTime = Date.now();
  }

  recordRequest(duration, status, cacheHit) {
    this.requests.push({
      duration,
      status,
      cacheHit,
      timestamp: Date.now(),
    });

    if (cacheHit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    if (status >= 400) {
      this.errors++;
    }
  }

  getStats() {
    const totalRequests = this.requests.length;
    const durations = this.requests.map((r) => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / totalRequests;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    // Calculate percentiles
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p50 = sortedDurations[Math.floor(totalRequests * 0.5)];
    const p95 = sortedDurations[Math.floor(totalRequests * 0.95)];
    const p99 = sortedDurations[Math.floor(totalRequests * 0.99)];

    const hitRate = totalRequests > 0 ? this.cacheHits / (this.cacheHits + this.cacheMisses) : 0;
    const errorRate = totalRequests > 0 ? this.errors / totalRequests : 0;

    const elapsedTime = (Date.now() - this.startTime) / 1000; // seconds
    const requestsPerSecond = totalRequests / elapsedTime;

    return {
      totalRequests,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRate,
      errors: this.errors,
      errorRate,
      avgDuration,
      minDuration,
      maxDuration,
      p50,
      p95,
      p99,
      requestsPerSecond,
      elapsedTime,
    };
  }

  generateReport() {
    const stats = this.getStats();

    const report = `
=== Load Test Report ===
Generated: ${new Date().toISOString()}

Configuration:
- Concurrent Users: ${config.users}
- Test Duration: ${config.duration}s
- Target Endpoint: ${config.endpoint}

Results:
- Total Requests: ${stats.totalRequests}
- Requests/Second: ${stats.requestsPerSecond.toFixed(2)}
- Elapsed Time: ${stats.elapsedTime.toFixed(2)}s

Cache Performance:
- Cache Hits: ${stats.cacheHits} (${(stats.hitRate * 100).toFixed(2)}%)
- Cache Misses: ${stats.cacheMisses}
- Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%

Response Times:
- Average: ${stats.avgDuration.toFixed(2)}ms
- Minimum: ${stats.minDuration.toFixed(2)}ms
- Maximum: ${stats.maxDuration.toFixed(2)}ms
- P50 (Median): ${stats.p50.toFixed(2)}ms
- P95: ${stats.p95.toFixed(2)}ms
- P99: ${stats.p99.toFixed(2)}ms

Errors:
- Total Errors: ${stats.errors}
- Error Rate: ${(stats.errorRate * 100).toFixed(2)}%

Recommendations:
${stats.hitRate < 0.7 ? '⚠️  Cache hit rate below 70% - consider warming cache or adjusting TTL' : '✅ Cache hit rate is healthy'}
${stats.p95 > 1000 ? '⚠️  P95 response time above 1s - optimize slow queries' : '✅ P95 response time is acceptable'}
${stats.errorRate > 0.01 ? '⚠️  Error rate above 1% - investigate failures' : '✅ Error rate is low'}
${stats.requestsPerSecond < 10 ? '⚠️  Low throughput - consider scaling resources' : '✅ Throughput is good'}

========================
`;

    return report;
  }

  saveReport(filename) {
    const report = this.generateReport();
    const stats = this.getStats();

    // Save text report
    fs.writeFileSync(filename, report);

    // Save JSON data
    const jsonFilename = filename.replace('.txt', '.json');
    fs.writeFileSync(
      jsonFilename,
      JSON.stringify(
        {
          config,
          stats,
          requests: this.requests,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log(`\n📊 Report saved to: ${filename}`);
    console.log(`📊 Raw data saved to: ${jsonFilename}`);
  }
}

/**
 * Simulate a single user session
 */
async function simulateUser(userId, metrics, stopTime) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: '.auth/user.json', // Use authenticated state
  });
  const page = await context.newPage();

  console.log(`[User ${userId}] Started session`);

  let requestCount = 0;

  try {
    while (Date.now() < stopTime) {
      const startTime = Date.now();

      // Navigate to target endpoint
      const response = await page.goto(`http://localhost:3000${config.endpoint}`, {
        waitUntil: 'networkidle',
        timeout: 10000,
      });

      const duration = Date.now() - startTime;
      const status = response.status();

      // Check if response came from cache
      const cacheHeader = response.headers()['x-cache-status'];
      const cacheHit = cacheHeader === 'HIT' || duration < 100; // Consider fast responses as cache hits

      metrics.recordRequest(duration, status, cacheHit);
      requestCount++;

      // Random delay between requests (0.5s - 2s)
      const delay = 500 + Math.random() * 1500;
      await page.waitForTimeout(delay);
    }
  } catch (error) {
    console.error(`[User ${userId}] Error:`, error.message);
    metrics.errors++;
  } finally {
    console.log(`[User ${userId}] Completed ${requestCount} requests`);
    await browser.close();
  }
}

/**
 * Main load test execution
 */
async function runLoadTest() {
  const metrics = new MetricsCollector();
  const stopTime = Date.now() + config.duration * 1000;

  console.log('Starting load test...\n');

  // Launch concurrent user sessions
  const userPromises = [];
  for (let i = 1; i <= config.users; i++) {
    userPromises.push(simulateUser(i, metrics, stopTime));

    // Stagger user start times (100ms apart)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Wait for all users to complete
  await Promise.all(userPromises);

  console.log('\n✅ Load test completed!\n');

  // Print summary
  console.log(metrics.generateReport());

  // Save detailed report if enabled
  if (config.report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = 'logs';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFilename = path.join(reportDir, `cache-load-test-${timestamp}.txt`);
    metrics.saveReport(reportFilename);
  }

  return metrics.getStats();
}

// Run the load test
runLoadTest()
  .then((stats) => {
    console.log('\n🎉 Load test finished successfully!');

    // Exit with error code if performance is poor
    if (stats.hitRate < 0.5 || stats.errorRate > 0.05 || stats.p95 > 2000) {
      console.error('\n❌ Performance below acceptable thresholds');
      process.exit(1);
    }

    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Load test failed:', error);
    process.exit(1);
  });
