import { test, expect } from '@playwright/test';

test('Independent scrolling between sidebar and main content', async ({ page }) => {
  // Navigate to a story read page
  await page.goto('http://localhost:3000/read/story-1');
  
  // Wait for the page to load and chapter reader to be visible
  await page.waitForSelector('[data-testid="chapter-reader"]', { timeout: 10000 });
  
  // Verify the layout structure exists
  const sidebar = page.locator('.w-80'); // Left sidebar
  const mainContent = page.locator('.flex-1.h-full.overflow-y-auto'); // Main content area
  
  await expect(sidebar).toBeVisible();
  await expect(mainContent).toBeVisible();
  
  // Get initial scroll positions
  const initialSidebarScrollTop = await sidebar.evaluate(el => el.scrollTop);
  const initialMainScrollTop = await mainContent.evaluate(el => el.scrollTop);
  
  // Test 1: Scroll in sidebar should only affect sidebar
  console.log('Testing sidebar scroll independence...');
  await sidebar.hover();
  await page.mouse.wheel(0, 200); // Scroll down in sidebar
  await page.waitForTimeout(500); // Wait for scroll to complete
  
  const newSidebarScrollTop = await sidebar.evaluate(el => el.scrollTop);
  const mainScrollTopAfterSidebarScroll = await mainContent.evaluate(el => el.scrollTop);
  
  // Sidebar should have scrolled
  expect(newSidebarScrollTop).toBeGreaterThan(initialSidebarScrollTop);
  // Main content should NOT have scrolled
  expect(mainScrollTopAfterSidebarScroll).toBe(initialMainScrollTop);
  
  console.log(`Sidebar scroll: ${initialSidebarScrollTop} -> ${newSidebarScrollTop}`);
  console.log(`Main content scroll: ${initialMainScrollTop} -> ${mainScrollTopAfterSidebarScroll}`);
  
  // Test 2: Scroll in main content should only affect main content
  console.log('Testing main content scroll independence...');
  await mainContent.hover();
  await page.mouse.wheel(0, 300); // Scroll down in main content
  await page.waitForTimeout(500); // Wait for scroll to complete
  
  const sidebarScrollTopAfterMainScroll = await sidebar.evaluate(el => el.scrollTop);
  const newMainScrollTop = await mainContent.evaluate(el => el.scrollTop);
  
  // Main content should have scrolled
  expect(newMainScrollTop).toBeGreaterThan(initialMainScrollTop);
  // Sidebar should NOT have changed from its previous position
  expect(sidebarScrollTopAfterMainScroll).toBe(newSidebarScrollTop);
  
  console.log(`Sidebar scroll after main scroll: ${newSidebarScrollTop} -> ${sidebarScrollTopAfterMainScroll}`);
  console.log(`Main content scroll: ${initialMainScrollTop} -> ${newMainScrollTop}`);
  
  // Test 3: Verify scroll events are properly isolated
  let sidebarScrollEvents = 0;
  let mainScrollEvents = 0;
  
  await sidebar.evaluate(() => {
    (window as any).sidebarScrollCount = 0;
    document.querySelector('.w-80')?.addEventListener('scroll', () => {
      (window as any).sidebarScrollCount++;
    });
  });
  
  await mainContent.evaluate(() => {
    (window as any).mainScrollCount = 0;
    document.querySelector('.flex-1.h-full.overflow-y-auto')?.addEventListener('scroll', () => {
      (window as any).mainScrollCount++;
    });
  });
  
  // Scroll sidebar and check events
  await sidebar.hover();
  await page.mouse.wheel(0, 100);
  await page.waitForTimeout(300);
  
  sidebarScrollEvents = await page.evaluate(() => (window as any).sidebarScrollCount);
  mainScrollEvents = await page.evaluate(() => (window as any).mainScrollCount);
  
  expect(sidebarScrollEvents).toBeGreaterThan(0);
  expect(mainScrollEvents).toBe(0);
  
  console.log('✅ Independent scrolling test passed!');
});

test('Chapter reader layout and navigation', async ({ page }) => {
  // Navigate to story read page
  await page.goto('http://localhost:3000/read/story-1');
  
  // Wait for chapter reader to load
  await page.waitForSelector('[data-testid="chapter-reader"]', { timeout: 10000 });
  
  // Verify layout structure
  const sidebar = page.locator('.w-80');
  const mainContent = page.locator('.flex-1.h-full.overflow-y-auto');
  
  // Check that layout doesn't have vertical gaps
  const sidebarRect = await sidebar.boundingBox();
  const mainContentRect = await mainContent.boundingBox();
  
  if (sidebarRect && mainContentRect) {
    // Both should start at the same top position (accounting for navigation bar)
    expect(Math.abs(sidebarRect.y - mainContentRect.y)).toBeLessThan(5);
    console.log(`Sidebar top: ${sidebarRect.y}, Main content top: ${mainContentRect.y}`);
  }
  
  // Verify first chapter is auto-selected
  const selectedChapter = page.locator('.bg-blue-100, .dark\\:bg-blue-900\\/20');
  await expect(selectedChapter).toBeVisible();
  
  console.log('✅ Layout and navigation test passed!');
});