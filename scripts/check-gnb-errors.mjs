/**
 * Check GNB Menu Errors
 *
 * Navigates to each GNB menu item and captures console errors
 */

import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GNB_ROUTES = [
  { name: 'Studio', url: '/studio', icon: '🎬' },
  { name: 'Novels', url: '/novels', icon: '📖' },
  { name: 'Comics', url: '/comics', icon: '🎨' },
  { name: 'Community', url: '/community', icon: '💬' },
  { name: 'Publish', url: '/publish', icon: '📤' },
  { name: 'Analytics', url: '/analytics', icon: '📊' },
  { name: 'Settings', url: '/settings', icon: '⚙️' },
];

async function checkGNBRoutes() {
  console.log('🔍 Starting GNB route error checking...\n');

  const browser = await chromium.launch({
    headless: false,
  });

  const context = await browser.newContext({
    storageState: path.join(__dirname, '..', '.auth', 'user.json'),
  });

  const page = await context.newPage();
  const errors = [];

  // Capture console errors
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error' || type === 'warning') {
      console.log(`  [CONSOLE ${type.toUpperCase()}] ${text}`);
      errors.push({ type, text, route: page.url() });
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`  [PAGE ERROR] ${error.message}`);
    errors.push({ type: 'pageerror', text: error.message, route: page.url() });
  });

  // Capture network errors
  page.on('requestfailed', request => {
    const failure = request.failure();
    if (failure && !request.url().includes('analytics.google.com')) {
      console.log(`  [NETWORK ERROR] ${request.url()}`);
      console.log(`    Failure: ${failure.errorText}`);
      errors.push({
        type: 'network',
        text: `${request.url()} - ${failure.errorText}`,
        route: page.url()
      });
    }
  });

  try {
    for (const route of GNB_ROUTES) {
      console.log(`\n${route.icon} Testing: ${route.name} (${route.url})`);
      console.log('━'.repeat(60));

      const routeErrors = [];
      const startErrorCount = errors.length;

      try {
        await page.goto(`http://localhost:3000${route.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        console.log(`✅ Page loaded: ${route.name}`);

        // Wait a bit to catch any delayed errors
        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({
          path: `logs/gnb-${route.name.toLowerCase()}.png`,
          fullPage: true
        });
        console.log(`📸 Screenshot saved: logs/gnb-${route.name.toLowerCase()}.png`);

        // Count errors for this route
        const routeErrorCount = errors.length - startErrorCount;
        if (routeErrorCount > 0) {
          console.log(`⚠️  Found ${routeErrorCount} error(s) on ${route.name}`);
        } else {
          console.log(`✓ No errors found on ${route.name}`);
        }

      } catch (error) {
        console.log(`❌ Failed to load ${route.name}: ${error.message}`);
        errors.push({
          type: 'navigation',
          text: `Failed to load ${route.name}: ${error.message}`,
          route: route.url
        });
      }
    }

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 ERROR SUMMARY');
    console.log('='.repeat(60));

    if (errors.length === 0) {
      console.log('\n✅ No errors found across all GNB routes!');
    } else {
      console.log(`\n⚠️  Total errors found: ${errors.length}\n`);

      // Group errors by route
      const errorsByRoute = {};
      errors.forEach(err => {
        const route = err.route || 'unknown';
        if (!errorsByRoute[route]) {
          errorsByRoute[route] = [];
        }
        errorsByRoute[route].push(err);
      });

      for (const [route, routeErrors] of Object.entries(errorsByRoute)) {
        console.log(`\n📍 ${route} (${routeErrors.length} errors):`);
        routeErrors.forEach((err, i) => {
          console.log(`  ${i + 1}. [${err.type}] ${err.text}`);
        });
      }

      // Save error report
      const report = {
        timestamp: new Date().toISOString(),
        totalErrors: errors.length,
        errorsByRoute,
        allErrors: errors,
      };

      const fs = await import('fs');
      fs.writeFileSync(
        'logs/gnb-error-report.json',
        JSON.stringify(report, null, 2)
      );
      console.log('\n📄 Full error report saved: logs/gnb-error-report.json');
    }

  } catch (error) {
    console.error('\n❌ Script error:', error);
  } finally {
    console.log('\n📍 Cleaning up...');
    await browser.close();
    console.log('✅ Browser closed');
  }
}

// Run the script
checkGNBRoutes().catch(console.error);
