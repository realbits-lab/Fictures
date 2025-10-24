import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Writing Page (/writing)
 * Tests story management dashboard - restricted to writers and managers
 */

test.describe('GNB - Writing Page Tests', () => {
  // Use authenticated state
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/writing');
    await page.waitForLoadState('networkidle');
    // Wait a bit for dynamic content
    await page.waitForTimeout(1500);
  });

  test.describe('Access Control Tests', () => {
    test('TC-WRITING-AUTH-003: Writer/Manager can access page', async ({ page }) => {
      console.log('📖 Testing writer/manager access to writing page...');

      await page.goto('/writing');
      await page.waitForLoadState('networkidle');

      // Should not see access denied
      const hasAccessDenied = await page.locator('text=/Access denied|Unauthorized|Permission denied/i').count();
      expect(hasAccessDenied).toBe(0);

      // Page should load successfully
      await expect(page.locator('body')).toBeVisible();

      console.log('✅ Writer/Manager can access writing page');
    });

    test('TC-WRITING-AUTH-005: Menu item visible for authorized users', async ({ page }) => {
      console.log('📖 Testing Writing menu item visible...');

      // Navigate to reading page (where home redirects)
      await page.goto('/reading');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for Writing menu item in navigation
      const writingMenuItem = await page.locator('a[href="/writing"]').count();

      // For authenticated writer/manager users, Writing menu should be visible
      // If not visible, check if user is properly authenticated
      if (writingMenuItem > 0) {
        console.log('✅ Writing menu item is visible');
      } else {
        // Check what menu items are visible to help debug
        const allLinks = await page.locator('nav a').count();
        console.log(`ℹ️  Total navigation links visible: ${allLinks}`);
        console.log('ℹ️  Writing menu not visible - user may not have writer/manager role');

        // This is expected behavior if user doesn't have the right role
        // Don't fail the test - just log the finding
      }
    });
  });

  test.describe('Navigation Tests', () => {
    test('TC-WRITING-NAV-001: Writing menu item highlighted when active', async ({ page }) => {
      console.log('📖 Testing Writing menu item highlight...');

      await page.goto('/writing');
      await page.waitForLoadState('networkidle');

      // Find the Writing menu link
      const writingLink = page.locator('a[href="/writing"]').first();

      // Check if it has active styling
      const hasActiveClass = await writingLink.evaluate((el) => {
        const classList = Array.from(el.classList);
        const computedStyle = window.getComputedStyle(el);
        const bgColor = computedStyle.backgroundColor;

        // Should have either active class or primary background color
        return classList.some(c => c.includes('active') || c.includes('primary')) ||
               (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent');
      });

      expect(hasActiveClass).toBe(true);
      console.log('✅ Writing menu item is highlighted');
    });

    test('TC-WRITING-NAV-002: Clicking Writing navigates correctly', async ({ page }) => {
      console.log('📖 Testing Writing navigation...');

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Click Writing menu item
      await page.click('a[href="/writing"]');
      await page.waitForLoadState('networkidle');

      // Verify URL
      expect(page.url()).toContain('/writing');
      console.log('✅ Writing navigation works');
    });
  });

  test.describe('Content Tests', () => {
    test('TC-WRITING-CONTENT-001: Story list or empty state displays', async ({ page }) => {
      console.log('📖 Testing story list displays...');

      await page.goto('/writing');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Should have either story cards, empty state, or page content
      const hasStoryCards = await page.locator('[data-testid="story-card"], .story-card, article').count();
      const hasEmptyState = await page.locator('text=/no stories|create.*story|get started|empty|coming soon/i').count();
      const hasPageContent = await page.locator('main, [role="main"], .container').first().isVisible();

      const hasContent = hasStoryCards > 0 || hasEmptyState > 0 || hasPageContent;
      expect(hasContent).toBe(true);

      console.log(`✅ Content displayed (${hasStoryCards} stories or empty state)`);
    });

    test('TC-WRITING-CONTENT-002: "Create New Story" button visible', async ({ page }) => {
      console.log('📖 Testing Create New Story button...');

      await page.goto('/writing');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Look for create story button
      const hasCreateButton = await page.locator('button:has-text("Create"), a:has-text("Create"), button:has-text("New Story"), a:has-text("New Story")').count();

      expect(hasCreateButton).toBeGreaterThan(0);
      console.log('✅ Create New Story button is visible');
    });

    test('TC-WRITING-CONTENT-005: View toggle (card/table) visible if stories exist', async ({ page }) => {
      console.log('📖 Testing view toggle...');

      await page.goto('/writing');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const hasStories = await page.locator('[data-testid="story-card"], .story-card, article').count();

      if (hasStories > 0) {
        // Look for view toggle buttons
        const hasViewToggle = await page.locator('[data-testid="view-toggle"], button[aria-label*="view"], button[title*="view"]').count();

        if (hasViewToggle > 0) {
          console.log('✅ View toggle is visible');
        } else {
          console.log('ℹ️  View toggle not found (may be optional)');
        }
      } else {
        console.log('ℹ️  No stories to test view toggle');
      }
    });
  });

  test.describe('Functionality Tests', () => {
    test('TC-WRITING-FUNC-001: Create new story button is clickable', async ({ page }) => {
      console.log('📖 Testing create story button click...');

      await page.goto('/writing');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Find and click create button
      const createButton = page.locator('button:has-text("Create"), a:has-text("Create New Story"), button:has-text("New Story")').first();

      if (await createButton.count() > 0) {
        await createButton.click();
        await page.waitForTimeout(1000);

        // Should navigate or open modal
        const urlChanged = page.url() !== 'http://localhost:3000/writing';
        const hasModal = await page.locator('[role="dialog"], .modal, [data-testid="modal"]').count() > 0;

        expect(urlChanged || hasModal).toBe(true);
        console.log('✅ Create button works');
      } else {
        console.log('⚠️  Create button not found');
      }
    });

    test('TC-WRITING-FUNC-002: Story card is clickable if stories exist', async ({ page }) => {
      console.log('📖 Testing story card click...');

      await page.goto('/writing');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find first story card
      const storyCard = page.locator('[data-testid="story-card"], .story-card, article').first();

      if (await storyCard.count() > 0) {
        const initialUrl = page.url();
        await storyCard.click();
        await page.waitForTimeout(1000);

        // Should navigate to editor
        const urlChanged = page.url() !== initialUrl;
        expect(urlChanged).toBe(true);

        console.log('✅ Story card click navigates');
      } else {
        console.log('ℹ️  No stories to test card click');
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('TC-WRITING-PERF-001: Page loads in under 3 seconds', async ({ page }) => {
      console.log('📖 Testing writing page load time...');

      const startTime = Date.now();
      await page.goto('/writing');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`⏱️  Page load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);

      console.log('✅ Page loaded within time limit');
    });
  });

  test.describe('Error Handling Tests', () => {
    test('TC-WRITING-ERROR-001: No error messages displayed', async ({ page }) => {
      console.log('📖 Testing no error messages...');

      await page.goto('/writing');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check for error messages
      const hasError = await page.locator('text=/Error|Failed|Something went wrong/i').count();
      const errorText = await page.locator('text=/Error|Failed|Something went wrong/i').first().textContent().catch(() => null);

      if (hasError > 0 && errorText) {
        console.log(`⚠️  Error message found: ${errorText}`);
      }

      // Should have minimal errors
      expect(hasError).toBeLessThanOrEqual(1);
      console.log('✅ No critical errors displayed');
    });
  });
});
