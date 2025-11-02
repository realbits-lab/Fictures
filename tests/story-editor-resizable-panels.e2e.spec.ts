import { test, expect } from '@playwright/test';
import fs from 'fs';

/**
 * E2E Tests for Story Editor Resizable Panels
 *
 * PURPOSE:
 * Tests the resizable panel functionality and independent scrolling in the story editor.
 *
 * KEY FEATURES TESTED:
 * - Panel resize handles are visible and draggable
 * - Each panel has independent vertical scrolling
 * - Panel widths can be adjusted by dragging dividers
 *
 * AUTHENTICATION:
 * - Uses programmatic login with credentials from .auth/user.json
 */

// Helper function to login programmatically
async function login(page: any) {
  const authData = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));
  const email = authData.profiles.writer.email;
  const password = authData.profiles.writer.password;

  await page.goto('/login');  // Use relative URL to work with baseURL
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button:has-text("Sign in with Email")');
  await page.waitForLoadState('networkidle');

  // Wait for redirect after successful login
  await page.waitForURL(/\/(novels|studio|comics|community)/, { timeout: 10000 });
  await page.waitForTimeout(2000);
}

test.describe('Story Editor Resizable Panels Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('TC-EDITOR-PANELS-001: Navigate to story editor and verify layout', async ({ page }) => {
    console.log('📖 Testing story editor panel layout...');

    // First go to studio to find a story
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find first story card (using actual card structure from StoryGrid)
    const storyCard = page.locator('div.cursor-pointer.rounded-lg.shadow-sm').first();
    const storyCount = await storyCard.count();

    if (storyCount === 0) {
      console.log('⚠️  No stories found - cannot test editor panels');
      test.skip();
      return;
    }

    // Click on first story to navigate to editor
    await storyCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify we're on the editor page
    expect(page.url()).toMatch(/\/studio\/edit\/(story\/[^\/]+|[^\/]+)/);

    console.log('✅ Navigated to story editor');
  });

  test('TC-EDITOR-PANELS-002: Verify three panels are present', async ({ page }) => {
    console.log('📖 Testing three panel structure...');

    // Navigate to studio and click first story
    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const storyCard = page.locator('div.cursor-pointer.rounded-lg.shadow-sm').first();
    if (await storyCard.count() === 0) {
      console.log('⚠️  No stories found');
      test.skip();
      return;
    }

    await storyCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for the panel group structure
    const panelGroup = page.locator('[data-panel-group]').first();
    await expect(panelGroup).toBeVisible();

    // Count panels
    const panels = page.locator('[data-panel]');
    const panelCount = await panels.count();

    console.log(`   Found ${panelCount} panels`);
    expect(panelCount).toBe(3);

    console.log('✅ Three panels are present');
  });

  test('TC-EDITOR-PANELS-003: Verify resize handles are present', async ({ page }) => {
    console.log('📖 Testing resize handles...');

    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const storyCard = page.locator('div.cursor-pointer.rounded-lg.shadow-sm').first();
    if (await storyCard.count() === 0) {
      console.log('⚠️  No stories found');
      test.skip();
      return;
    }

    await storyCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for resize handles
    const resizeHandles = page.locator('[data-panel-resize-handle]');
    const handleCount = await resizeHandles.count();

    console.log(`   Found ${handleCount} resize handles`);
    expect(handleCount).toBe(2); // Two handles between three panels

    console.log('✅ Resize handles are present');
  });

  test('TC-EDITOR-PANELS-004: Verify panels have overflow scrolling', async ({ page }) => {
    console.log('📖 Testing panel overflow scrolling...');

    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const storyCard = page.locator('div.cursor-pointer.rounded-lg.shadow-sm').first();
    if (await storyCard.count() === 0) {
      console.log('⚠️  No stories found');
      test.skip();
      return;
    }

    await storyCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check each panel has overflow-y-auto class
    const panels = page.locator('[data-panel]');
    const panelCount = await panels.count();

    for (let i = 0; i < panelCount; i++) {
      const panel = panels.nth(i);
      const hasOverflow = await panel.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.overflowY === 'auto' || styles.overflowY === 'scroll';
      });

      console.log(`   Panel ${i + 1} has overflow-y: ${hasOverflow ? 'auto/scroll' : 'other'}`);
      expect(hasOverflow).toBe(true);
    }

    console.log('✅ All panels have overflow scrolling');
  });

  test('TC-EDITOR-PANELS-005: Test panel resizing functionality', async ({ page }) => {
    console.log('📖 Testing panel resize functionality...');

    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const storyCard = page.locator('div.cursor-pointer.rounded-lg.shadow-sm').first();
    if (await storyCard.count() === 0) {
      console.log('⚠️  No stories found');
      test.skip();
      return;
    }

    await storyCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Get initial width of first panel
    const firstPanel = page.locator('[data-panel]').first();
    const initialWidth = await firstPanel.evaluate((el) => el.getBoundingClientRect().width);

    console.log(`   Initial width of first panel: ${initialWidth}px`);

    // Find first resize handle
    const firstHandle = page.locator('[data-panel-resize-handle]').first();
    const handleBox = await firstHandle.boundingBox();

    if (!handleBox) {
      console.log('⚠️  Could not find resize handle bounding box');
      test.skip();
      return;
    }

    // Drag the handle to resize
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 100, handleBox.y + handleBox.height / 2);
    await page.mouse.up();
    await page.waitForTimeout(500);

    // Get new width
    const newWidth = await firstPanel.evaluate((el) => el.getBoundingClientRect().width);

    console.log(`   New width of first panel: ${newWidth}px`);
    console.log(`   Width change: ${newWidth - initialWidth}px`);

    // Width should have changed (allowing for some tolerance)
    expect(Math.abs(newWidth - initialWidth)).toBeGreaterThan(10);

    console.log('✅ Panel resizing works');
  });

  // TC-EDITOR-PANELS-006: Removed - Story Structure heading was removed in sidebar redesign

  test('TC-EDITOR-PANELS-007: Verify collapse button is removed', async ({ page }) => {
    console.log('📖 Testing collapse button removal...');

    await page.goto('/studio');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const storyCard = page.locator('div.cursor-pointer.rounded-lg.shadow-sm').first();
    if (await storyCard.count() === 0) {
      console.log('⚠️  No stories found');
      test.skip();
      return;
    }

    await storyCard.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for collapse button (should not exist)
    const collapseButton = page.locator('button[title*="Collapse Sidebar"], button:has-text("Collapse")');
    const collapseCount = await collapseButton.count();

    console.log(`   Collapse button count: ${collapseCount}`);
    expect(collapseCount).toBe(0);

    console.log('✅ Collapse button is removed');
  });
});
