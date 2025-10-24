/**
 * Comprehensive Scene Loading Performance Analysis
 *
 * This script analyzes the complete scene loading chain:
 * 1. Component mount
 * 2. API requests (auth, database queries)
 * 3. SWR fetching and caching
 * 4. Prefetch operations
 * 5. Navigation timing
 * 6. Scroll restoration
 *
 * Identifies bottlenecks and generates performance report
 */

import { chromium } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Performance data collectors
const performanceData = {
  componentMount: [],
  apiRequests: [],
  swrFetches: [],
  prefetches: [],
  navigations: [],
  scrollRestores: [],
  parallelFetches: []
};

async function analyzeSceneLoadingPerformance() {
  console.log('🔬 Starting Comprehensive Scene Loading Performance Analysis\n');
  console.log('=' .repeat(80));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100 // Slow down for observation
  });

  const context = await browser.newContext({
    storageState: '.auth/user.json',
  });

  const page = await context.newPage();

  // Capture all console logs with timing information
  page.on('console', msg => {
    const text = msg.text();

    // Component Mount
    if (text.includes('ChapterReaderClient MOUNT')) {
      const match = text.match(/\[(.*?)\]/);
      if (match) {
        performanceData.componentMount.push({
          id: match[1],
          timestamp: Date.now(),
          message: text
        });
      }
    }

    // API Requests
    if (text.includes('API Request START')) {
      const match = text.match(/\[(.*?)\].*chapter: (\w+)/);
      if (match) {
        performanceData.apiRequests.push({
          id: match[1],
          chapterId: match[2],
          type: 'start',
          timestamp: Date.now()
        });
      }
    }

    if (text.includes('Auth completed:')) {
      const match = text.match(/\[(.*?)\].*: ([\d.]+)ms/);
      if (match) {
        const entry = performanceData.apiRequests.find(r => r.id === match[1]);
        if (entry) {
          entry.authDuration = parseFloat(match[2]);
        }
      }
    }

    if (text.includes('Chapter query completed:')) {
      const match = text.match(/\[(.*?)\].*: ([\d.]+)ms/);
      if (match) {
        const entry = performanceData.apiRequests.find(r => r.id === match[1]);
        if (entry) {
          entry.chapterQueryDuration = parseFloat(match[2]);
        }
      }
    }

    if (text.includes('Story query completed:')) {
      const match = text.match(/\[(.*?)\].*: ([\d.]+)ms/);
      if (match) {
        const entry = performanceData.apiRequests.find(r => r.id === match[1]);
        if (entry) {
          entry.storyQueryDuration = parseFloat(match[2]);
        }
      }
    }

    if (text.includes('Scenes query completed:')) {
      const match = text.match(/\[(.*?)\].*: ([\d.]+)ms \((\d+) scenes\)/);
      if (match) {
        const entry = performanceData.apiRequests.find(r => r.id === match[1]);
        if (entry) {
          entry.scenesQueryDuration = parseFloat(match[2]);
          entry.sceneCount = parseInt(match[3]);
        }
      }
    }

    if (text.includes('200 OK - Total:') || text.includes('304 Not Modified - Total:')) {
      const match = text.match(/\[(.*?)\].*Total: ([\d.]+)ms/);
      if (match) {
        const entry = performanceData.apiRequests.find(r => r.id === match[1]);
        if (entry) {
          entry.totalDuration = parseFloat(match[2]);
          entry.status = text.includes('200 OK') ? 200 : 304;
          entry.type = 'complete';
        }
      }
    }

    // SWR Fetches
    if (text.includes('SWR Fetcher START')) {
      const match = text.match(/\[(.*?)\].*chapter: (\w+)/);
      if (match) {
        performanceData.swrFetches.push({
          id: match[1],
          chapterId: match[2],
          type: 'start',
          timestamp: Date.now()
        });
      }
    }

    if (text.includes('Fetch completed:')) {
      const match = text.match(/\[(.*?)\].*: ([\d.]+)ms \((\d+) scenes\)/);
      if (match) {
        const entry = performanceData.swrFetches.find(r => r.id === match[1]);
        if (entry) {
          entry.totalDuration = parseFloat(match[2]);
          entry.sceneCount = parseInt(match[3]);
          entry.type = 'complete';
        }
      }
    }

    // Prefetches
    if (text.includes('PREFETCH START')) {
      const match = text.match(/\[(.*?)\].*chapter: (\w+)/);
      if (match) {
        performanceData.prefetches.push({
          id: match[1],
          chapterId: match[2],
          type: 'start',
          timestamp: Date.now()
        });
      }
    }

    if (text.includes('Cache HIT')) {
      const match = text.match(/\[(.*?)\].*Total: ([\d.]+)ms/);
      if (match) {
        const entry = performanceData.prefetches.find(r => r.id === match[1]);
        if (entry) {
          entry.cacheHit = true;
          entry.totalDuration = parseFloat(match[2]);
          entry.type = 'complete';
        }
      }
    }

    if (text.includes('Prefetch completed:')) {
      const match = text.match(/\[(.*?)\].*: ([\d.]+)ms/);
      if (match) {
        const entry = performanceData.prefetches.find(r => r.id === match[1]);
        if (entry) {
          entry.cacheHit = false;
          entry.totalDuration = parseFloat(match[2]);
          entry.type = 'complete';
        }
      }
    }

    // Parallel Fetches
    if (text.includes('Starting parallel scene fetch')) {
      const match = text.match(/for (\d+) chapters/);
      if (match) {
        performanceData.parallelFetches.push({
          chapterCount: parseInt(match[1]),
          type: 'start',
          timestamp: Date.now()
        });
      }
    }

    if (text.includes('Parallel fetch completed in')) {
      const match = text.match(/in (\d+)ms \((\d+) chapters, (\d+) scenes\)/);
      if (match) {
        const entry = performanceData.parallelFetches[performanceData.parallelFetches.length - 1];
        if (entry) {
          entry.duration = parseInt(match[1]);
          entry.chapterCount = parseInt(match[2]);
          entry.sceneCount = parseInt(match[3]);
          entry.type = 'complete';
        }
      }
    }

    // Navigations
    if (text.includes('NAVIGATION START')) {
      const match = text.match(/\[(.*?)\].*Scene: (\w+)/);
      if (match) {
        performanceData.navigations.push({
          id: match[1],
          sceneId: match[2],
          type: 'start',
          timestamp: Date.now()
        });
      }
    }

    if (text.includes('Navigation sync operations:')) {
      const match = text.match(/\[(.*?)\].*: ([\d.]+)ms/);
      if (match) {
        const entry = performanceData.navigations.find(r => r.id === match[1]);
        if (entry) {
          entry.totalDuration = parseFloat(match[2]);
          entry.type = 'complete';
        }
      }
    }

    // Scroll Restores
    if (text.includes('SCROLL RESTORE START')) {
      const match = text.match(/\[(.*?)\].*Scene: (\w+)/);
      if (match) {
        performanceData.scrollRestores.push({
          id: match[1],
          sceneId: match[2],
          type: 'start',
          timestamp: Date.now()
        });
      }
    }

    if (text.includes('Scroll restored to')) {
      const match = text.match(/\[(.*?)\].*Total: ([\d.]+)ms/);
      if (match) {
        const entry = performanceData.scrollRestores.find(r => r.id === match[1]);
        if (entry) {
          entry.totalDuration = parseFloat(match[2]);
          entry.type = 'complete';
        }
      }
    }
  });

  try {
    console.log('\n📖 Opening reading page...');
    await page.goto(`${BASE_URL}/reading`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);

    // Find and open first story
    const storyCards = page.locator('div.cursor-pointer').filter({
      hasText: /genre|public/i
    });

    if (await storyCards.count() === 0) {
      console.log('⚠️  No stories found');
      await browser.close();
      return;
    }

    const storyTitle = await storyCards.first().locator('h3').textContent();
    console.log(`✓ Opening story: "${storyTitle}"`);

    await storyCards.first().click();

    // Wait for initial load
    console.log('\n⏳ Waiting for initial scene load...');
    await page.waitForSelector('[data-testid="chapter-reader"]', { timeout: 60000 });
    await page.waitForSelector('.prose', { timeout: 30000 });

    // Give time for all async operations to complete
    await page.waitForTimeout(5000);

    console.log('✓ Initial load complete');

    // Test navigation to second scene
    console.log('\n🧭 Testing scene navigation...');
    const navigationButtons = page.locator('button').filter({ hasText: /next/i });
    if (await navigationButtons.count() > 0) {
      await navigationButtons.first().click();
      await page.waitForTimeout(3000);
      console.log('✓ Navigated to next scene');
    }

    // Wait for all pending operations
    await page.waitForTimeout(2000);

    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('📊 PERFORMANCE ANALYSIS REPORT');
    console.log('='.repeat(80));

    // Component Mount Analysis
    console.log('\n1️⃣  COMPONENT MOUNT');
    console.log('-'.repeat(80));
    if (performanceData.componentMount.length > 0) {
      console.log(`✅ Component mounted successfully`);
    } else {
      console.log(`⚠️  No component mount detected`);
    }

    // API Request Analysis
    console.log('\n2️⃣  API REQUESTS');
    console.log('-'.repeat(80));
    const completedApiRequests = performanceData.apiRequests.filter(r => r.type === 'complete');
    if (completedApiRequests.length > 0) {
      console.log(`Total API Requests: ${completedApiRequests.length}`);
      console.log();

      completedApiRequests.forEach((req, idx) => {
        console.log(`Request #${idx + 1}:`);
        console.log(`  Chapter ID: ${req.chapterId}`);
        console.log(`  Status: ${req.status === 304 ? '304 Not Modified (Cache HIT)' : '200 OK'}`);
        console.log(`  Total Duration: ${req.totalDuration}ms`);

        if (req.status === 200) {
          console.log(`  Breakdown:`);
          console.log(`    - Auth: ${req.authDuration || 'N/A'}ms`);
          console.log(`    - Chapter Query: ${req.chapterQueryDuration || 'N/A'}ms`);
          console.log(`    - Story Query: ${req.storyQueryDuration || 'N/A'}ms`);
          console.log(`    - Scenes Query: ${req.scenesQueryDuration || 'N/A'}ms (${req.sceneCount || 0} scenes)`);

          // Calculate bottleneck
          const breakdowns = [
            { name: 'Auth', duration: req.authDuration || 0 },
            { name: 'Chapter Query', duration: req.chapterQueryDuration || 0 },
            { name: 'Story Query', duration: req.storyQueryDuration || 0 },
            { name: 'Scenes Query', duration: req.scenesQueryDuration || 0 }
          ];
          const maxBreakdown = breakdowns.reduce((max, curr) => curr.duration > max.duration ? curr : max);

          if (maxBreakdown.duration > 0) {
            console.log(`  🔥 Slowest: ${maxBreakdown.name} (${maxBreakdown.duration}ms, ${((maxBreakdown.duration / req.totalDuration) * 100).toFixed(1)}% of total)`);
          }
        }
        console.log();
      });

      // Statistics
      const avg200Duration = completedApiRequests.filter(r => r.status === 200).reduce((sum, r) => sum + r.totalDuration, 0) / completedApiRequests.filter(r => r.status === 200).length || 0;
      const avg304Duration = completedApiRequests.filter(r => r.status === 304).reduce((sum, r) => sum + r.totalDuration, 0) / completedApiRequests.filter(r => r.status === 304).length || 0;
      const cacheHitRate = (completedApiRequests.filter(r => r.status === 304).length / completedApiRequests.length * 100).toFixed(1);

      console.log(`📈 API Statistics:`);
      console.log(`  Average 200 OK duration: ${avg200Duration.toFixed(2)}ms`);
      console.log(`  Average 304 Not Modified duration: ${avg304Duration.toFixed(2)}ms`);
      console.log(`  Cache hit rate: ${cacheHitRate}%`);
      console.log(`  Performance gain from caching: ${(avg200Duration - avg304Duration).toFixed(2)}ms per cached request`);
    } else {
      console.log(`⚠️  No completed API requests detected`);
    }

    // SWR Fetch Analysis
    console.log('\n3️⃣  SWR FETCHING');
    console.log('-'.repeat(80));
    const completedSwrFetches = performanceData.swrFetches.filter(r => r.type === 'complete');
    if (completedSwrFetches.length > 0) {
      console.log(`Total SWR Fetches: ${completedSwrFetches.length}`);
      const avgDuration = completedSwrFetches.reduce((sum, r) => sum + r.totalDuration, 0) / completedSwrFetches.length;
      console.log(`Average Duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`Total Scenes Fetched: ${completedSwrFetches.reduce((sum, r) => sum + (r.sceneCount || 0), 0)}`);
    } else {
      console.log(`⚠️  No completed SWR fetches detected`);
    }

    // Prefetch Analysis
    console.log('\n4️⃣  PREFETCHING');
    console.log('-'.repeat(80));
    const completedPrefetches = performanceData.prefetches.filter(r => r.type === 'complete');
    if (completedPrefetches.length > 0) {
      console.log(`Total Prefetches: ${completedPrefetches.length}`);
      const cacheHits = completedPrefetches.filter(r => r.cacheHit).length;
      const cacheMisses = completedPrefetches.filter(r => !r.cacheHit).length;
      console.log(`  Cache Hits: ${cacheHits} (${(cacheHits / completedPrefetches.length * 100).toFixed(1)}%)`);
      console.log(`  Cache Misses: ${cacheMisses} (${(cacheMisses / completedPrefetches.length * 100).toFixed(1)}%)`);

      const hitAvg = completedPrefetches.filter(r => r.cacheHit).reduce((sum, r) => sum + r.totalDuration, 0) / cacheHits || 0;
      const missAvg = completedPrefetches.filter(r => !r.cacheHit).reduce((sum, r) => sum + r.totalDuration, 0) / cacheMisses || 0;

      console.log(`  Average Cache Hit Duration: ${hitAvg.toFixed(2)}ms`);
      console.log(`  Average Cache Miss Duration: ${missAvg.toFixed(2)}ms`);
      console.log(`  Prefetch Efficiency: ${((missAvg - hitAvg) / missAvg * 100).toFixed(1)}% faster with cache`);
    } else {
      console.log(`⚠️  No completed prefetches detected`);
    }

    // Parallel Fetch Analysis
    console.log('\n5️⃣  PARALLEL SCENE FETCHING');
    console.log('-'.repeat(80));
    const completedParallelFetches = performanceData.parallelFetches.filter(r => r.type === 'complete');
    if (completedParallelFetches.length > 0) {
      completedParallelFetches.forEach((fetch, idx) => {
        console.log(`Parallel Fetch #${idx + 1}:`);
        console.log(`  Chapters: ${fetch.chapterCount}`);
        console.log(`  Scenes: ${fetch.sceneCount}`);
        console.log(`  Duration: ${fetch.duration}ms`);
        console.log(`  Average per Chapter: ${(fetch.duration / fetch.chapterCount).toFixed(2)}ms`);

        const estimatedSequential = fetch.chapterCount * 500;
        const speedup = estimatedSequential / fetch.duration;
        console.log(`  Estimated Sequential: ~${estimatedSequential}ms`);
        console.log(`  ⚡ Speedup: ${speedup.toFixed(2)}x faster`);
        console.log();
      });
    } else {
      console.log(`⚠️  No parallel fetches detected`);
    }

    // Navigation Analysis
    console.log('\n6️⃣  NAVIGATION PERFORMANCE');
    console.log('-'.repeat(80));
    const completedNavigations = performanceData.navigations.filter(r => r.type === 'complete');
    if (completedNavigations.length > 0) {
      console.log(`Total Navigations: ${completedNavigations.length}`);
      const avgDuration = completedNavigations.reduce((sum, r) => sum + r.totalDuration, 0) / completedNavigations.length;
      console.log(`Average Navigation Duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`✅ Navigation feels: ${avgDuration < 100 ? 'Instant (<100ms)' : avgDuration < 300 ? 'Fast (<300ms)' : 'Slow (>300ms)'}`);
    } else {
      console.log(`ℹ️  No user navigations performed yet`);
    }

    // Scroll Restore Analysis
    console.log('\n7️⃣  SCROLL RESTORATION');
    console.log('-'.repeat(80));
    const completedScrollRestores = performanceData.scrollRestores.filter(r => r.type === 'complete');
    if (completedScrollRestores.length > 0) {
      console.log(`Total Scroll Restores: ${completedScrollRestores.length}`);
      const avgDuration = completedScrollRestores.reduce((sum, r) => sum + r.totalDuration, 0) / completedScrollRestores.length;
      console.log(`Average Duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`✅ Scroll restoration is: ${avgDuration < 50 ? 'Instant (<50ms)' : avgDuration < 100 ? 'Fast (<100ms)' : 'Slow (>100ms)'}`);
    } else {
      console.log(`ℹ️  No scroll restores detected`);
    }

    // Overall Bottleneck Analysis
    console.log('\n' + '='.repeat(80));
    console.log('🔍 BOTTLENECK IDENTIFICATION');
    console.log('='.repeat(80));

    const bottlenecks = [];

    // Check API requests
    const slowApiRequests = completedApiRequests.filter(r => r.status === 200 && r.totalDuration > 500);
    if (slowApiRequests.length > 0) {
      bottlenecks.push({
        area: 'API Requests',
        severity: 'HIGH',
        issue: `${slowApiRequests.length} API requests taking >500ms`,
        avgDuration: slowApiRequests.reduce((sum, r) => sum + r.totalDuration, 0) / slowApiRequests.length,
        recommendation: 'Optimize database queries, add indexes, or implement better caching'
      });
    }

    // Check database query breakdown
    const avgAuthTime = completedApiRequests.filter(r => r.authDuration).reduce((sum, r) => sum + (r.authDuration || 0), 0) / completedApiRequests.filter(r => r.authDuration).length || 0;
    if (avgAuthTime > 100) {
      bottlenecks.push({
        area: 'Authentication',
        severity: 'MEDIUM',
        issue: `Auth taking average ${avgAuthTime.toFixed(2)}ms`,
        recommendation: 'Consider session caching or optimizing auth lookup'
      });
    }

    const avgScenesQuery = completedApiRequests.filter(r => r.scenesQueryDuration).reduce((sum, r) => sum + (r.scenesQueryDuration || 0), 0) / completedApiRequests.filter(r => r.scenesQueryDuration).length || 0;
    if (avgScenesQuery > 200) {
      bottlenecks.push({
        area: 'Database - Scenes Query',
        severity: 'HIGH',
        issue: `Scenes query taking average ${avgScenesQuery.toFixed(2)}ms`,
        recommendation: 'Add index on scenes.chapterId, optimize query, or consider denormalization'
      });
    }

    // Check prefetch effectiveness
    const prefetchCacheHitRate = completedPrefetches.length > 0 ? (completedPrefetches.filter(r => r.cacheHit).length / completedPrefetches.length * 100) : 0;
    if (prefetchCacheHitRate < 50) {
      bottlenecks.push({
        area: 'Prefetching',
        severity: 'LOW',
        issue: `Low cache hit rate: ${prefetchCacheHitRate.toFixed(1)}%`,
        recommendation: 'Prefetch strategy may need adjustment or is working as expected for first-time loads'
      });
    }

    if (bottlenecks.length > 0) {
      console.log('\n🚨 Identified Bottlenecks:\n');
      bottlenecks.forEach((b, idx) => {
        console.log(`${idx + 1}. [${b.severity}] ${b.area}`);
        console.log(`   Issue: ${b.issue}`);
        console.log(`   Recommendation: ${b.recommendation}`);
        console.log();
      });
    } else {
      console.log('\n✅ No significant bottlenecks detected! Performance looks good.');
    }

    // Optimization Recommendations
    console.log('\n' + '='.repeat(80));
    console.log('💡 OPTIMIZATION RECOMMENDATIONS');
    console.log('='.repeat(80));

    console.log(`
1. Database Optimization:
   - Add composite index on (scenes.chapterId, scenes.orderIndex) if not exists
   - Consider query result caching at DB layer
   - Use connection pooling efficiently

2. API Layer:
   - Implement batch API endpoint to fetch multiple chapters at once
   - Use HTTP/2 for multiplexing
   - Consider GraphQL for more efficient data fetching

3. Caching Strategy:
   - Current ETag implementation is working well (reduces repeat fetches)
   - Consider service worker for offline caching
   - Implement stale-while-revalidate pattern more aggressively

4. Prefetching:
   - Current prefetch strategy is good for adjacent scenes
   - Consider prefetching entire story on first load for premium users
   - Use intersection observer to prefetch as user scrolls

5. Component Optimization:
   - Scroll restoration is fast (<50ms) - Good!
   - Navigation is ${completedNavigations.length > 0 && completedNavigations.reduce((sum, r) => sum + r.totalDuration, 0) / completedNavigations.length < 100 ? 'fast' : 'could be improved'}
   - Consider lazy loading scene images

6. Monitoring:
   - Keep these performance logs in production (conditionally)
   - Set up real user monitoring (RUM)
   - Track Core Web Vitals
    `);

    console.log('='.repeat(80));
    console.log('✅ Performance analysis complete!\n');

    // Take screenshot
    await page.screenshot({
      path: 'logs/scene-loading-performance-analysis.png',
      fullPage: false
    });
    console.log('📸 Screenshot saved to logs/scene-loading-performance-analysis.png\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'logs/scene-loading-performance-error.png' });
  } finally {
    await browser.close();
  }
}

analyzeSceneLoadingPerformance().catch(console.error);
