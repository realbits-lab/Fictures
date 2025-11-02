import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });

  const page = await context.newPage();

  // Collect console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    // Print logs related to tree building
    if (text.includes('Processing') || text.includes('Adding') || text.includes('⚠️') || text.includes('✅')) {
      console.log(`[BROWSER LOG] ${text}`);
    }
  });

  console.log('\n=== Navigating to studio edit page ===\n');
  await page.goto('http://localhost:3000/studio/edit/story/kfiNwbdYD2BAnC7IAyjps');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000); // Wait for React to render

  console.log('\n=== Checking sidebar structure ===\n');

  // Check if tree view exists
  const treeView = page.locator('[role="tree"], .tree-view, [data-tree]');
  const treeCount = await treeView.count();
  console.log(`Tree view elements found: ${treeCount}`);

  // Check for tree items
  const treeItems = page.locator('[role="treeitem"], .tree-item, [data-tree-item]');
  const itemCount = await treeItems.count();
  console.log(`Tree items found: ${itemCount}`);

  // Try to find parts, chapters, scenes by text
  const parts = page.locator('text=/Part|Act/i');
  const chapters = page.locator('text=/Chapter/i');
  const scenes = page.locator('text=/Scene/i');

  console.log(`\nElements found by text:`);
  console.log(`  Parts: ${await parts.count()}`);
  console.log(`  Chapters: ${await chapters.count()}`);
  console.log(`  Scenes: ${await scenes.count()}`);

  // Check left sidebar specifically
  const leftPanel = page.locator('.overflow-y-auto').first();
  const leftPanelText = await leftPanel.textContent();
  console.log(`\nLeft panel text (first 500 chars):\n${leftPanelText?.substring(0, 500)}`);

  // Get all visible text in tree structure
  const allTreeText = await page.locator('button, div').filter({ hasText: /Part|Chapter|Scene/i }).allTextContents();
  console.log(`\nAll tree-related text found:`);
  allTreeText.forEach((text, i) => {
    if (text.trim()) {
      console.log(`  ${i + 1}. ${text.trim().substring(0, 100)}`);
    }
  });

  // Take screenshot
  await page.screenshot({ path: 'logs/sidebar-tree-test.png', fullPage: true });
  console.log('\n✅ Screenshot saved to: logs/sidebar-tree-test.png');

  console.log('\n=== Console logs summary ===');
  console.log(`Total console messages: ${consoleLogs.length}`);

  const relevantLogs = consoleLogs.filter(log =>
    log.includes('Processing') ||
    log.includes('Adding') ||
    log.includes('has') ||
    log.includes('⚠️') ||
    log.includes('✅')
  );

  if (relevantLogs.length > 0) {
    console.log('\nRelevant logs:');
    relevantLogs.forEach(log => console.log(`  ${log}`));
  }

  // Don't close immediately in non-headless mode
  console.log('\n⏸️  Browser will stay open for 10 seconds for inspection...');
  await page.waitForTimeout(10000);

  await browser.close();
})();
