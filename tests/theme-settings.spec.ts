import { test, expect } from '@playwright/test';

test.describe('Theme Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings/appearance page
    await page.goto('http://localhost:3001/settings/appearance');
  });

  test('should display theme selector with available themes', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if theme selector is visible
    await expect(page.locator('h3').filter({ hasText: 'Choose Your Theme' })).toBeVisible();

    // Check if theme previews are visible
    const themeCards = page.locator('[data-testid="theme-preview"]').or(
      page.locator('div').filter({ hasText: /Light|Dark|Ocean|Purple|Forest|Sunset|Rose|Midnight|Auto/ }).first()
    );
    
    // Should have multiple theme options
    await expect(themeCards).toBeVisible({ timeout: 10000 });

    // Check for specific theme names
    await expect(page.getByText('Light', { exact: false })).toBeVisible();
    await expect(page.getByText('Dark', { exact: false })).toBeVisible();
    await expect(page.getByText('Ocean', { exact: false })).toBeVisible();
  });

  test('should change theme when clicking on theme preview', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Get initial theme (likely light)
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme') || 'light';
    });

    // Find and click on a different theme (dark theme)
    const darkTheme = page.locator('div').filter({ hasText: 'Dark' }).filter({ hasText: 'Modern dark theme' }).first();
    
    if (await darkTheme.isVisible()) {
      await darkTheme.click();

      // Wait for theme to apply
      await page.waitForTimeout(500);

      // Check if theme changed
      const newTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme') || 'light';
      });

      // Theme should have changed or be applied
      expect(newTheme === 'dark' || newTheme !== initialTheme).toBeTruthy();
    }
  });

  test('should persist theme selection in localStorage', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click on purple theme
    const purpleTheme = page.locator('div').filter({ hasText: 'Purple' }).filter({ hasText: 'Creative purple theme' }).first();
    
    if (await purpleTheme.isVisible()) {
      await purpleTheme.click();

      // Wait for theme to apply
      await page.waitForTimeout(500);

      // Check localStorage
      const storedTheme = await page.evaluate(() => {
        return localStorage.getItem('theme');
      });

      expect(storedTheme).toBe('purple');

      // Refresh page and check if theme persists
      await page.reload();
      await page.waitForLoadState('networkidle');

      const persistedTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme') || 'light';
      });

      expect(persistedTheme).toBe('purple');
    }
  });

  test('should show current theme information', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if current theme info is displayed
    const currentThemeInfo = page.locator('div').filter({ hasText: 'Current Theme:' });
    await expect(currentThemeInfo).toBeVisible({ timeout: 10000 });
  });

  test('should apply theme styles to the page', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Click on forest theme
    const forestTheme = page.locator('div').filter({ hasText: 'Forest' }).filter({ hasText: 'Nature-inspired green' }).first();
    
    if (await forestTheme.isVisible()) {
      await forestTheme.click();

      // Wait for theme to apply
      await page.waitForTimeout(1000);

      // Check if CSS variables are updated
      const backgroundColorVar = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
      });

      // Forest theme should have a different background
      expect(backgroundColorVar).toBeTruthy();
      expect(backgroundColorVar).not.toBe('255 255 255'); // Not the default light background
    }
  });
});

test.describe('Theme Settings Navigation', () => {
  test('should navigate to appearance settings via sidebar', async ({ page }) => {
    // Navigate to main settings page
    await page.goto('http://localhost:3001/settings');
    await page.waitForLoadState('networkidle');

    // Click on Appearance in sidebar
    const appearanceLink = page.getByRole('link', { name: /Appearance/i });
    await expect(appearanceLink).toBeVisible({ timeout: 10000 });
    await appearanceLink.click();

    // Should be on appearance page
    await expect(page).toHaveURL(/\/settings\/appearance/);
    await expect(page.locator('h3').filter({ hasText: 'Choose Your Theme' })).toBeVisible({ timeout: 10000 });
  });
});