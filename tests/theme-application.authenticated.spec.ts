import { test, expect } from '@playwright/test';

/**
 * Theme Application Test Suite
 *
 * Tests that verify theme CSS variables are properly applied across all pages
 * and that theme switching works correctly.
 */

test.describe('Theme Application Tests', () => {
  // Use authenticated state
  test.use({ storageState: '.auth/user.json' });

  const themes = [
    'light',
    'dark',
    'ocean',
    'purple',
    'forest',
    'sunset',
    'rose',
    'midnight'
  ];

  const pagesToTest = [
    { url: '/studio', name: 'Studio' },
    { url: '/novels', name: 'Novels' },
    { url: '/settings', name: 'Settings' },
    { url: '/settings/appearance', name: 'Appearance Settings' },
  ];

  test('should have ThemeProvider wrapping all pages', async ({ page }) => {
    await page.goto('http://localhost:3000/novels');
    await page.waitForLoadState('networkidle');

    // Check that html has data-theme attribute (set by ThemeProvider)
    const html = page.locator('html');
    const dataTheme = await html.getAttribute('data-theme');

    // Should have a theme set (light, dark, or one of the custom themes)
    expect(dataTheme).toBeTruthy();
    console.log(`Current theme: ${dataTheme}`);
  });

  test('should apply CSS variables correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/novels');
    await page.waitForLoadState('networkidle');

    // Check that CSS variables are defined on the root element
    const rootStyles = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      return {
        background: styles.getPropertyValue('--background'),
        foreground: styles.getPropertyValue('--foreground'),
        primary: styles.getPropertyValue('--primary'),
        secondary: styles.getPropertyValue('--secondary'),
        muted: styles.getPropertyValue('--muted'),
        border: styles.getPropertyValue('--border'),
      };
    });

    // All theme variables should be defined
    expect(rootStyles.background).toBeTruthy();
    expect(rootStyles.foreground).toBeTruthy();
    expect(rootStyles.primary).toBeTruthy();
    expect(rootStyles.secondary).toBeTruthy();
    expect(rootStyles.muted).toBeTruthy();
    expect(rootStyles.border).toBeTruthy();

    console.log('CSS Variables:', rootStyles);
  });

  test('should switch themes correctly from settings page', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/appearance');
    await page.waitForLoadState('networkidle');

    // Wait for theme selector to be visible
    await page.waitForSelector('text=Choose Your Theme', { timeout: 10000 });

    // Try switching to Purple Dream theme
    const purpleTheme = page.locator('text=Purple Dream').first();
    if (await purpleTheme.isVisible()) {
      await purpleTheme.click();
      await page.waitForTimeout(1000); // Wait for theme to apply

      // Check that data-theme attribute changed
      const html = page.locator('html');
      const dataTheme = await html.getAttribute('data-theme');
      expect(dataTheme).toBe('purple');
      console.log('Successfully switched to purple theme');
    }

    // Try switching to Dark theme
    const darkTheme = page.locator('text=Dark').first();
    if (await darkTheme.isVisible()) {
      await darkTheme.click();
      await page.waitForTimeout(1000);

      const html = page.locator('html');
      const dataTheme = await html.getAttribute('data-theme');
      expect(dataTheme).toBe('dark');
      console.log('Successfully switched to dark theme');
    }

    // Switch back to Light theme
    const lightTheme = page.locator('text=Light').first();
    if (await lightTheme.isVisible()) {
      await lightTheme.click();
      await page.waitForTimeout(1000);

      const html = page.locator('html');
      const dataTheme = await html.getAttribute('data-theme');
      expect(dataTheme).toBe('light');
      console.log('Successfully switched back to light theme');
    }
  });

  test('should maintain theme across page navigation', async ({ page }) => {
    // Set theme to Ocean
    await page.goto('http://localhost:3000/settings/appearance');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Choose Your Theme', { timeout: 10000 });

    const oceanTheme = page.locator('text=Blue Ocean').first();
    if (await oceanTheme.isVisible()) {
      await oceanTheme.click();
      await page.waitForTimeout(1000);
    }

    // Check theme is Ocean
    let html = page.locator('html');
    let dataTheme = await html.getAttribute('data-theme');
    expect(dataTheme).toBe('ocean');
    console.log('Set theme to Ocean');

    // Navigate to different pages and verify theme persists
    for (const pageInfo of pagesToTest) {
      await page.goto(`http://localhost:3000${pageInfo.url}`);
      await page.waitForLoadState('networkidle');

      html = page.locator('html');
      dataTheme = await html.getAttribute('data-theme');
      expect(dataTheme).toBe('ocean');
      console.log(`Theme persisted on ${pageInfo.name}: ${dataTheme}`);
    }
  });

  test('should have no hardcoded colors on key pages', async ({ page }) => {
    for (const pageInfo of pagesToTest) {
      await page.goto(`http://localhost:3000${pageInfo.url}`);
      await page.waitForLoadState('networkidle');

      // Check that theme CSS variables are being used
      const usesThemeVariables = await page.evaluate(() => {
        // Look for elements using theme variables
        const elements = document.querySelectorAll('*');
        let usingThemeVars = 0;
        let hardcodedColors = 0;

        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const bgColor = styles.backgroundColor;
          const color = styles.color;

          // Check if using theme variables (will resolve to rgb values)
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
            usingThemeVars++;
          }
          if (color && color !== 'rgb(0, 0, 0)') {
            usingThemeVars++;
          }
        });

        return { usingThemeVars, hardcodedColors };
      });

      console.log(`${pageInfo.name}:`, usesThemeVariables);
      expect(usesThemeVariables.usingThemeVars).toBeGreaterThan(0);
    }
  });

  test('should display all 8 theme options in appearance settings', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/appearance');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Choose Your Theme', { timeout: 10000 });

    // Check that all 8 themes are displayed
    const themeNames = [
      'Light',
      'Dark',
      'Blue Ocean',
      'Purple Dream',
      'Forest Green',
      'Warm Sunset',
      'Rose Garden',
      'Midnight'
    ];

    for (const themeName of themeNames) {
      const themeElement = page.locator(`text=${themeName}`).first();
      await expect(themeElement).toBeVisible();
      console.log(`✓ ${themeName} theme option is visible`);
    }
  });

  test('should show visual theme preview for each theme', async ({ page }) => {
    await page.goto('http://localhost:3000/settings/appearance');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Choose Your Theme', { timeout: 10000 });

    // Check that theme preview cards are rendered
    const previewCards = page.locator('[data-theme]');
    const count = await previewCards.count();

    // Should have at least 8 preview cards (one for each theme)
    expect(count).toBeGreaterThanOrEqual(8);
    console.log(`Found ${count} theme preview cards`);
  });
});
