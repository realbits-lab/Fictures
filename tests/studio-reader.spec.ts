import { test, expect } from '@playwright/test';
import { getAuthData, getApiKey, hasScope } from './helpers/auth-helper';

// This test file uses reader authentication
// The storageState is configured in playwright.config.ts for *.reader.spec.ts files

test.describe('Studio - Reader Access', () => {
  test('reader cannot access studio page', async ({ page }) => {
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Verify reader is redirected (no studio access)
    await expect(page).not.toHaveURL(/.*studio.*/);
  });

  test('reader can access novels page', async ({ page }) => {
    const authData = getAuthData('reader');
    console.log(`Testing with reader account: ${authData.email}`);

    await page.goto('http://localhost:3000/novels');
    await page.waitForLoadState('networkidle');

    // Verify reader has access to novels
    await expect(page).toHaveURL(/.*novels.*/);
  });

  test('reader has read-only scopes', () => {
    const authData = getAuthData('reader');

    // Verify reader has read-only scopes
    expect(hasScope('reader', 'stories:read')).toBeTruthy();
    expect(hasScope('reader', 'chapters:read')).toBeTruthy();
    expect(hasScope('reader', 'community:read')).toBeTruthy();

    // Verify reader does NOT have write scopes
    expect(hasScope('reader', 'stories:write')).toBeFalsy();
    expect(hasScope('reader', 'chapters:write')).toBeFalsy();
    expect(hasScope('reader', 'ai:use')).toBeFalsy();
    expect(hasScope('reader', 'admin:all')).toBeFalsy();
  });
});
