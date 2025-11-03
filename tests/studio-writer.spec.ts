import { test, expect } from '@playwright/test';
import { getAuthData, getApiKey, getAuthHeader } from './helpers/auth-helper';

// This test file uses writer authentication
// The storageState is configured in playwright.config.ts for *.writer.spec.ts files

test.describe('Studio - Writer Access', () => {
  test('writer can access studio page', async ({ page }) => {
    await page.goto('http://localhost:3000/studio');
    await page.waitForLoadState('networkidle');

    // Verify we're on the studio page
    await expect(page).toHaveURL(/.*studio.*/);
  });

  test('writer can edit story', async ({ page }) => {
    const authData = getAuthData('writer');
    console.log(`Testing with writer account: ${authData.email}`);

    // Navigate to a story edit page
    await page.goto('http://localhost:3000/studio/edit/story/test-story-id');
    await page.waitForLoadState('networkidle');

    // Verify writer has access
    await expect(page).not.toHaveURL(/.*login.*/);
  });

  test('writer API access with API key', async ({ request }) => {
    const apiKey = getApiKey('writer');
    const authHeader = getAuthHeader('writer');

    // Make API request with writer API key
    const response = await request.get('http://localhost:3000/api/stories', {
      headers: authHeader,
    });

    expect(response.ok()).toBeTruthy();
  });

  test('writer has correct scopes', () => {
    const authData = getAuthData('writer');

    // Verify writer has expected scopes
    expect(authData.apiKeyScopes).toContain('stories:read');
    expect(authData.apiKeyScopes).toContain('stories:write');
    expect(authData.apiKeyScopes).toContain('chapters:write');
    expect(authData.apiKeyScopes).toContain('ai:use');

    // Verify writer does NOT have admin scope
    expect(authData.apiKeyScopes).not.toContain('admin:all');
  });
});
