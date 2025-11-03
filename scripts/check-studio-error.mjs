import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });

  const page = await context.newPage();

  // Navigate to the page
  await page.goto('http://localhost:3000/studio/edit/story/kfiNwbdYD2BAnC7IAyjps');
  await page.waitForLoadState('networkidle');

  // Wait a bit for any client-side rendering
  await page.waitForTimeout(2000);

  // Search for error-related text
  const bodyText = await page.locator('body').textContent();

  console.log('\n=== Checking for plain error text ===\n');

  if (bodyText?.includes('Error loading')) {
    console.log('✗ FOUND: "Error loading" in page');
    // Find the exact element
    const elements = await page.locator('text=Error loading').all();
    for (let i = 0; i < elements.length; i++) {
      const text = await elements[i].textContent();
      console.log(`  Element ${i + 1}: ${text}`);
    }
  } else {
    console.log('✓ No "Error loading" text found');
  }

  if (bodyText?.includes('Failed to fetch')) {
    console.log('✗ FOUND: "Failed to fetch" in page');
    const elements = await page.locator('text=Failed to fetch').all();
    for (let i = 0; i < elements.length; i++) {
      const text = await elements[i].textContent();
      console.log(`  Element ${i + 1}: ${text}`);
    }
  } else {
    console.log('✓ No "Failed to fetch" text found');
  }

  // Check for ContentLoadError component (should be pretty)
  const contentLoadError = await page.locator('[class*="ContentLoadError"]').count();
  console.log(`\nContentLoadError components found: ${contentLoadError}`);

  // Screenshot for debugging
  await page.screenshot({ path: 'logs/studio-error-check.png', fullPage: true });
  console.log('\nScreenshot saved to: logs/studio-error-check.png');

  await browser.close();
})();
