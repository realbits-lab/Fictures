import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });

  const page = await context.newPage();

  // Collect ALL console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('Navigating to studio page...');
  await page.goto('http://localhost:3000/studio/edit/story/kfiNwbdYD2BAnC7IAyjps');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000); // Wait for React rendering

  console.log(`\n=== Collected ${logs.length} console messages ===\n`);

  // Print logs related to story structure
  const structureLogs = logs.filter(log =>
    log.includes('[CLIENT]') ||
    log.includes('parts') ||
    log.includes('chapters') ||
    log.includes('Processing') ||
    log.includes('tree') ||
    log.includes('Story')
  );

  console.log(`Structure-related logs (${structureLogs.length}):`);
  structureLogs.forEach(log => console.log(log));

  // Check DOM for tree elements
  const htmlContent = await page.content();
  const hasTreeView = htmlContent.includes('tree-view') || htmlContent.includes('TreeView');
  const hasParts = htmlContent.includes('Part ') || htmlContent.includes('Act ');
  const hasChapters = htmlContent.includes('Chapter');

  console.log(`\n=== DOM Check ===`);
  console.log(`Has TreeView: ${hasTreeView}`);
  console.log(`Has Parts: ${hasParts}`);
  console.log(`Has Chapters: ${hasChapters}`);

  await browser.close();
})();
