import { test, expect } from '@playwright/test';

test.describe('Menu Page Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page first
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Home page loads successfully', async ({ page }) => {
    console.log('🏠 Testing Home page...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Look for common elements that should be present
    const hasContent = await page.locator('main, div, section').first().isVisible();
    expect(hasContent).toBe(true);
    
    console.log('✅ Home page loaded successfully');
  });

  test('Browse/Reading page loads successfully', async ({ page }) => {
    console.log('📖 Testing Browse/Reading page...');
    
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Wait a bit more for dynamic content
    await page.waitForTimeout(2000);
    
    // Check for any error messages
    const hasError = await page.locator('text=Failed to load').isVisible();
    const hasErrorBoundary = await page.locator('text=Something went wrong').isVisible();
    
    if (hasError || hasErrorBoundary) {
      console.log('❌ Browse page has errors');
      const errorText = await page.locator('body').textContent();
      console.log('Error content:', errorText?.substring(0, 500));
    } else {
      console.log('✅ Browse page loaded successfully');
    }
    
    expect(hasError).toBe(false);
    expect(hasErrorBoundary).toBe(false);
  });

  test('Community page loads successfully', async ({ page }) => {
    console.log('💬 Testing Community page...');
    
    await page.goto('/community');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for dynamic content
    await page.waitForTimeout(2000);
    
    // Check for any error messages
    const hasError = await page.locator('text=Failed to load').isVisible();
    const hasErrorBoundary = await page.locator('text=Something went wrong').isVisible();
    
    if (hasError || hasErrorBoundary) {
      console.log('❌ Community page has errors');
      const errorText = await page.locator('body').textContent();
      console.log('Error content:', errorText?.substring(0, 500));
    } else {
      console.log('✅ Community page loaded successfully');
    }
    
    expect(hasError).toBe(false);
    expect(hasErrorBoundary).toBe(false);
  });

  test('Stories/Writing page loads successfully', async ({ page }) => {
    console.log('✍️ Testing Stories/Writing page...');
    
    await page.goto('/stories');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for dynamic content
    await page.waitForTimeout(2000);
    
    // Check for any error messages or sign-in requirements
    const hasError = await page.locator('text=Failed to load').isVisible();
    const hasErrorBoundary = await page.locator('text=Something went wrong').isVisible();
    const needsSignIn = await page.locator('text=Please sign in').isVisible();
    
    if (needsSignIn) {
      console.log('ℹ️ Stories page requires authentication (expected behavior)');
    } else if (hasError || hasErrorBoundary) {
      console.log('❌ Stories page has errors');
      const errorText = await page.locator('body').textContent();
      console.log('Error content:', errorText?.substring(0, 500));
    } else {
      console.log('✅ Stories page loaded successfully');
    }
    
    expect(hasError).toBe(false);
    expect(hasErrorBoundary).toBe(false);
  });

  test('Publish page loads successfully', async ({ page }) => {
    console.log('📤 Testing Publish page...');
    
    await page.goto('/publish');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for dynamic content
    await page.waitForTimeout(2000);
    
    // Check for any error messages or sign-in requirements
    const hasError = await page.locator('text=Failed to load').isVisible();
    const hasErrorBoundary = await page.locator('text=Something went wrong').isVisible();
    const needsSignIn = await page.locator('text=Please sign in').isVisible();
    
    if (needsSignIn) {
      console.log('ℹ️ Publish page requires authentication (expected behavior)');
    } else if (hasError || hasErrorBoundary) {
      console.log('❌ Publish page has errors');
      const errorText = await page.locator('body').textContent();
      console.log('Error content:', errorText?.substring(0, 500));
    } else {
      console.log('✅ Publish page loaded successfully');
    }
    
    expect(hasError).toBe(false);
    expect(hasErrorBoundary).toBe(false);
  });

  test('Analytics page loads successfully', async ({ page }) => {
    console.log('📊 Testing Analytics page...');
    
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for dynamic content
    await page.waitForTimeout(2000);
    
    // Check for any error messages or sign-in requirements
    const hasError = await page.locator('text=Failed to load').isVisible();
    const hasErrorBoundary = await page.locator('text=Something went wrong').isVisible();
    const needsSignIn = await page.locator('text=Please sign in').isVisible();
    
    if (needsSignIn) {
      console.log('ℹ️ Analytics page requires authentication (expected behavior)');
    } else if (hasError || hasErrorBoundary) {
      console.log('❌ Analytics page has errors');
      const errorText = await page.locator('body').textContent();
      console.log('Error content:', errorText?.substring(0, 500));
    } else {
      console.log('✅ Analytics page loaded successfully');
    }
    
    expect(hasError).toBe(false);
    expect(hasErrorBoundary).toBe(false);
  });

  test('Settings page loads successfully', async ({ page }) => {
    console.log('⚙️ Testing Settings page...');
    
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Check if page loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for dynamic content
    await page.waitForTimeout(2000);
    
    // Check for any error messages or sign-in requirements
    const hasError = await page.locator('text=Failed to load').isVisible();
    const hasErrorBoundary = await page.locator('text=Something went wrong').isVisible();
    const needsSignIn = await page.locator('text=Please sign in').isVisible();
    
    if (needsSignIn) {
      console.log('ℹ️ Settings page requires authentication (expected behavior)');
    } else if (hasError || hasErrorBoundary) {
      console.log('❌ Settings page has errors');
      const errorText = await page.locator('body').textContent();
      console.log('Error content:', errorText?.substring(0, 500));
    } else {
      console.log('✅ Settings page loaded successfully');
    }
    
    expect(hasError).toBe(false);
    expect(hasErrorBoundary).toBe(false);
  });

  test('Check for JavaScript errors on all pages', async ({ page }) => {
    console.log('🔍 Testing for JavaScript errors across all pages...');
    
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console error: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(`Page error: ${error.message}`);
    });
    
    const pages = ['/', '/browse', '/community', '/stories', '/publish', '/analytics', '/settings'];
    
    for (const pagePath of pages) {
      console.log(`🔍 Checking ${pagePath} for JS errors...`);
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for any lazy-loaded content
    }
    
    if (errors.length > 0) {
      console.log('❌ JavaScript errors found:');
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      
      // Only fail if there are critical errors (not warnings)
      const criticalErrors = errors.filter(error => 
        !error.includes('Warning:') && 
        !error.includes('favicon') &&
        !error.includes('404')
      );
      
      expect(criticalErrors.length).toBe(0);
    } else {
      console.log('✅ No critical JavaScript errors found');
    }
  });
});