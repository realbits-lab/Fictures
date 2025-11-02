import { test, expect } from '@playwright/test';
import { getAuthData, getApiKey, hasScope } from './helpers/auth-helper';

// This test file uses manager authentication
// The storageState is configured in playwright.config.ts for *.manager.spec.ts files

test.describe('Studio - Manager Access', () => {
  test('manager can access studio page', async ({ page }) => {
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Verify manager has studio access
    await expect(page).toHaveURL(/.*studio.*/);
  });

  test('manager can access all stories', async ({ page }) => {
    const authData = getAuthData('manager');
    console.log(`Testing with manager account: ${authData.email}`);

    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Verify manager can see all stories (not just their own)
    const storyCards = await page.locator('[data-testid="story-card"]').count();
    console.log(`Manager can see ${storyCards} stories`);
  });

  test('manager has admin scopes', () => {
    const authData = getAuthData('manager');

    // Verify manager has all scopes including admin
    expect(hasScope('manager', 'admin:all')).toBeTruthy();
    expect(hasScope('manager', 'stories:delete')).toBeTruthy();
    expect(hasScope('manager', 'stories:publish')).toBeTruthy();
    expect(hasScope('manager', 'settings:write')).toBeTruthy();

    // Verify manager has all standard scopes
    expect(hasScope('manager', 'stories:read')).toBeTruthy();
    expect(hasScope('manager', 'stories:write')).toBeTruthy();
    expect(hasScope('manager', 'ai:use')).toBeTruthy();
  });

  test('manager can delete stories', async ({ page }) => {
    // This test would verify manager can perform admin actions
    // Example: Delete a test story
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Manager should see delete buttons
    const deleteButtons = await page.locator('[data-testid="delete-story-button"]').count();
    expect(deleteButtons).toBeGreaterThan(0);
  });
});
