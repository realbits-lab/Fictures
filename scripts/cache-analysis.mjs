/**
 * Cache Analysis Tool
 *
 * Analyzes cache effectiveness, identifies patterns, and provides optimization recommendations.
 * Reads cache metrics from the metrics API and generates comprehensive analysis.
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/cache-analysis.mjs
 *   dotenv --file .env.local run node scripts/cache-analysis.mjs --timeRange 7d
 *
 * Options:
 *   --timeRange  Time range to analyze (1h, 6h, 24h, 7d, 30d, all) [default: 24h]
 *   --export     Export analysis to file [default: true]
 */

import fs from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const config = {
  timeRange: args.find((arg) => arg.startsWith('--timeRange='))?.split('=')[1] || '24h',
  export: args.find((arg) => arg === '--no-export') ? false : true,
  apiUrl: 'http://localhost:3000/studio/api/cache/metrics',
};

console.log('=== Cache Analysis Tool ===');
console.log(`Time Range: ${config.timeRange}`);
console.log(`API URL: ${config.apiUrl}`);
console.log('===========================\n');

/**
 * Fetch cache metrics from API
 */
async function fetchMetrics(timeRange) {
  const url = `${config.apiUrl}?timeRange=${timeRange}&groupBy=cacheType`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching metrics:', error.message);
    throw error;
  }
}

/**
 * Analyze cache effectiveness
 */
function analyzeCacheEffectiveness(metrics) {
  const { summary, byType } = metrics;

  const analysis = {
    overallHealth: 'unknown',
    hitRateGrade: 'F',
    performanceGrade: 'F',
    issues: [],
    recommendations: [],
    strengths: [],
  };

  // Grade hit rate
  const hitRate = summary.hitRate;
  if (hitRate >= 0.9) {
    analysis.hitRateGrade = 'A';
    analysis.strengths.push(`Excellent cache hit rate: ${(hitRate * 100).toFixed(1)}%`);
  } else if (hitRate >= 0.8) {
    analysis.hitRateGrade = 'B';
    analysis.strengths.push(`Good cache hit rate: ${(hitRate * 100).toFixed(1)}%`);
  } else if (hitRate >= 0.7) {
    analysis.hitRateGrade = 'C';
    analysis.recommendations.push(`Improve cache hit rate from ${(hitRate * 100).toFixed(1)}% to above 80%`);
  } else if (hitRate >= 0.5) {
    analysis.hitRateGrade = 'D';
    analysis.issues.push(`Low cache hit rate: ${(hitRate * 100).toFixed(1)}%`);
    analysis.recommendations.push('Implement cache warming strategies');
  } else {
    analysis.hitRateGrade = 'F';
    analysis.issues.push(`Very low cache hit rate: ${(hitRate * 100).toFixed(1)}%`);
    analysis.recommendations.push('Critical: Review cache strategy and TTL settings');
  }

  // Grade performance
  const avgDuration = summary.averageDuration;
  if (avgDuration < 50) {
    analysis.performanceGrade = 'A';
    analysis.strengths.push(`Excellent average response time: ${avgDuration.toFixed(1)}ms`);
  } else if (avgDuration < 100) {
    analysis.performanceGrade = 'B';
    analysis.strengths.push(`Good average response time: ${avgDuration.toFixed(1)}ms`);
  } else if (avgDuration < 200) {
    analysis.performanceGrade = 'C';
    analysis.recommendations.push(`Optimize response time from ${avgDuration.toFixed(1)}ms to below 100ms`);
  } else if (avgDuration < 500) {
    analysis.performanceGrade = 'D';
    analysis.issues.push(`Slow average response time: ${avgDuration.toFixed(1)}ms`);
    analysis.recommendations.push('Investigate slow queries and database indexes');
  } else {
    analysis.performanceGrade = 'F';
    analysis.issues.push(`Very slow average response time: ${avgDuration.toFixed(1)}ms`);
    analysis.recommendations.push('Critical: Optimize database queries and add indexes');
  }

  // Analyze by cache type
  Object.entries(byType).forEach(([type, stats]) => {
    if (stats.hitRate < 0.6) {
      analysis.issues.push(`${type} cache has low hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
      analysis.recommendations.push(`Increase ${type} cache TTL or implement prefetching`);
    }

    if (stats.invalidations > stats.hits * 0.5) {
      analysis.issues.push(`${type} cache has high invalidation rate`);
      analysis.recommendations.push(`Review ${type} cache invalidation strategy - may be too aggressive`);
    }

    if (stats.hitRate >= 0.8) {
      analysis.strengths.push(`${type} cache is performing well (${(stats.hitRate * 100).toFixed(1)}% hit rate)`);
    }
  });

  // Determine overall health
  const grades = [analysis.hitRateGrade, analysis.performanceGrade];
  const avgGrade =
    grades.reduce((sum, grade) => {
      const gradeValues = { A: 4, B: 3, C: 2, D: 1, F: 0 };
      return sum + gradeValues[grade];
    }, 0) / grades.length;

  if (avgGrade >= 3.5) {
    analysis.overallHealth = 'Excellent';
  } else if (avgGrade >= 2.5) {
    analysis.overallHealth = 'Good';
  } else if (avgGrade >= 1.5) {
    analysis.overallHealth = 'Fair';
  } else {
    analysis.overallHealth = 'Poor';
  }

  return analysis;
}

/**
 * Identify cache patterns
 */
function identifyPatterns(metrics) {
  const { recentOperations } = metrics;

  const patterns = {
    mostAccessedKeys: [],
    coldCacheKeys: [],
    frequentInvalidations: [],
    cacheTypeDistribution: {},
  };

  // Count key frequencies
  const keyFrequency = {};
  const invalidationFrequency = {};

  recentOperations.forEach((op) => {
    // Count access frequency
    if (op.operation === 'hit' || op.operation === 'miss') {
      keyFrequency[op.key] = (keyFrequency[op.key] || 0) + 1;
    }

    // Count invalidation frequency
    if (op.operation === 'invalidate') {
      invalidationFrequency[op.key] = (invalidationFrequency[op.key] || 0) + 1;
    }

    // Track cache type distribution
    patterns.cacheTypeDistribution[op.cacheType] =
      (patterns.cacheTypeDistribution[op.cacheType] || 0) + 1;
  });

  // Find most accessed keys
  patterns.mostAccessedKeys = Object.entries(keyFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, accessCount: count }));

  // Find cold cache keys (only misses, no hits)
  const missOnlyKeys = recentOperations
    .filter((op) => op.operation === 'miss')
    .map((op) => op.key)
    .filter((key) => !recentOperations.some((op) => op.operation === 'hit' && op.key === key));

  patterns.coldCacheKeys = [...new Set(missOnlyKeys)].slice(0, 10);

  // Find frequently invalidated keys
  patterns.frequentInvalidations = Object.entries(invalidationFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({ key, invalidationCount: count }));

  return patterns;
}

/**
 * Generate comprehensive analysis report
 */
function generateAnalysisReport(metrics, analysis, patterns) {
  const { summary, byType } = metrics;

  const report = `
=== Cache Analysis Report ===
Generated: ${new Date().toISOString()}
Time Range: ${config.timeRange}

OVERALL HEALTH: ${analysis.overallHealth}
Hit Rate Grade: ${analysis.hitRateGrade}
Performance Grade: ${analysis.performanceGrade}

SUMMARY STATISTICS
------------------
Total Requests: ${summary.totalMetrics}
Cache Hits: ${summary.totalHits} (${(summary.hitRate * 100).toFixed(2)}%)
Cache Misses: ${summary.totalMisses}
Average Response Time: ${summary.averageDuration.toFixed(2)}ms

CACHE TYPE BREAKDOWN
--------------------
${Object.entries(byType)
  .map(
    ([type, stats]) => `
${type.toUpperCase()}:
  - Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%
  - Hits: ${stats.hits}
  - Misses: ${stats.misses}
  - Invalidations: ${stats.invalidations}
`
  )
  .join('')}

PATTERNS IDENTIFIED
-------------------
Cache Type Distribution:
${Object.entries(patterns.cacheTypeDistribution)
  .map(([type, count]) => `  - ${type}: ${count} operations`)
  .join('\n')}

Top 10 Most Accessed Keys:
${patterns.mostAccessedKeys.length > 0 ? patterns.mostAccessedKeys.map((item, i) => `  ${i + 1}. ${item.key} (${item.accessCount} accesses)`).join('\n') : '  No data available'}

Cold Cache Keys (Never Hit):
${patterns.coldCacheKeys.length > 0 ? patterns.coldCacheKeys.map((key, i) => `  ${i + 1}. ${key}`).join('\n') : '  No cold keys detected'}

Frequently Invalidated Keys:
${patterns.frequentInvalidations.length > 0 ? patterns.frequentInvalidations.map((item, i) => `  ${i + 1}. ${item.key} (${item.invalidationCount} invalidations)`).join('\n') : '  No data available'}

STRENGTHS
---------
${analysis.strengths.length > 0 ? analysis.strengths.map((s) => `✅ ${s}`).join('\n') : '  None identified'}

ISSUES
------
${analysis.issues.length > 0 ? analysis.issues.map((i) => `⚠️  ${i}`).join('\n') : '  None identified'}

RECOMMENDATIONS
---------------
${analysis.recommendations.length > 0 ? analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n') : '  No specific recommendations'}

OPTIMIZATION OPPORTUNITIES
--------------------------
${patterns.coldCacheKeys.length > 0 ? `• Implement prefetching for ${patterns.coldCacheKeys.length} cold cache keys` : ''}
${patterns.frequentInvalidations.length > 5 ? `• Review invalidation strategy for frequently invalidated keys` : ''}
${analysis.hitRateGrade === 'C' || analysis.hitRateGrade === 'D' || analysis.hitRateGrade === 'F' ? '• Implement cache warming on application startup' : ''}
${summary.averageDuration > 100 ? '• Optimize slow database queries' : ''}
${summary.totalMisses > summary.totalHits ? '• Increase cache TTL duration' : ''}

=============================
`;

  return report;
}

/**
 * Main analysis execution
 */
async function runAnalysis() {
  console.log('Fetching cache metrics...\n');

  const metrics = await fetchMetrics(config.timeRange);

  console.log('Analyzing cache effectiveness...\n');
  const analysis = analyzeCacheEffectiveness(metrics);

  console.log('Identifying cache patterns...\n');
  const patterns = identifyPatterns(metrics);

  const report = generateAnalysisReport(metrics, analysis, patterns);

  console.log(report);

  // Export report if enabled
  if (config.export) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = 'logs';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportFilename = path.join(reportDir, `cache-analysis-${config.timeRange}-${timestamp}.txt`);
    fs.writeFileSync(reportFilename, report);

    // Also save JSON
    const jsonFilename = reportFilename.replace('.txt', '.json');
    fs.writeFileSync(
      jsonFilename,
      JSON.stringify(
        {
          metrics,
          analysis,
          patterns,
          timestamp: new Date().toISOString(),
          timeRange: config.timeRange,
        },
        null,
        2
      )
    );

    console.log(`\n📊 Report saved to: ${reportFilename}`);
    console.log(`📊 Raw data saved to: ${jsonFilename}`);
  }

  return { metrics, analysis, patterns };
}

// Run the analysis
runAnalysis()
  .then(({ analysis }) => {
    console.log('\n🎉 Analysis completed successfully!');

    // Exit with error code if health is poor
    if (analysis.overallHealth === 'Poor') {
      console.error('\n❌ Cache health is poor - requires immediate attention');
      process.exit(1);
    }

    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
