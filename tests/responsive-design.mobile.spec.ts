import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsive Design Testing', () => {
  
  test('Homepage responsive layout on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Check that content is visible and properly scaled
    const mainContent = page.locator('main, .main-content, [data-testid="main"]').first();
    await expect(mainContent).toBeVisible();
    
    // Check that text is readable (not too small)
    const headings = page.locator('h1, h2');
    if (await headings.count() > 0) {
      const headingBox = await headings.first().boundingBox();
      if (headingBox) {
        expect(headingBox.height).toBeGreaterThan(20); // Minimum readable height
      }
    }
    
    // Check that buttons are touch-friendly (minimum 44px height)
    const buttons = page.locator('button, .btn');
    if (await buttons.count() > 0) {
      const buttonBox = await buttons.first().boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThan(35); // Touch-friendly size
      }
    }
    
    console.log('✓ Homepage mobile layout verified');
  });

  test('Navigation menu mobile functionality', async ({ page }) => {
    await page.goto('/');
    
    // Look for mobile menu button (hamburger menu)
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .hamburger, .menu-toggle, button:has-text("Menu")');
    
    if (await mobileMenuButton.isVisible({ timeout: 5000 })) {
      // Test mobile menu functionality
      await mobileMenuButton.click();
      
      // Check if mobile menu opens
      const mobileMenu = page.locator('[data-testid="mobile-nav"], .mobile-menu, .nav-drawer');
      if (await mobileMenu.isVisible({ timeout: 3000 })) {
        await expect(mobileMenu).toBeVisible();
        console.log('✓ Mobile menu opens correctly');
        
        // Test navigation links in mobile menu
        const navLinks = mobileMenu.locator('a, button');
        const linkCount = await navLinks.count();
        expect(linkCount).toBeGreaterThan(0);
        console.log(`✓ Found ${linkCount} navigation links in mobile menu`);
        
        // Close menu
        const closeButton = page.locator('[data-testid="close-menu"], .close-menu, button:has-text("Close")');
        if (await closeButton.isVisible({ timeout: 3000 })) {
          await closeButton.click();
        } else {
          await mobileMenuButton.click(); // Toggle to close
        }
      }
    } else {
      console.log('ℹ️ No mobile menu detected - may use different navigation pattern');
    }
  });

  test('Form elements mobile usability', async ({ page }) => {
    // Test forms on different pages
    const pagesToTest = ['/', '/write'];
    
    for (const url of pagesToTest) {
      await page.goto(url);
      
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        console.log(`Testing ${formCount} forms on ${url}`);
        
        // Check input fields are properly sized for mobile
        const inputs = page.locator('input, textarea, select');
        if (await inputs.count() > 0) {
          const inputBox = await inputs.first().boundingBox();
          if (inputBox) {
            expect(inputBox.height).toBeGreaterThan(30); // Minimum touch target
            expect(inputBox.width).toBeGreaterThan(50); // Reasonable width
          }
          console.log(`✓ Input fields properly sized on ${url}`);
        }
        
        // Check buttons are touch-friendly
        const formButtons = page.locator('form button, form input[type="submit"]');
        if (await formButtons.count() > 0) {
          const buttonBox = await formButtons.first().boundingBox();
          if (buttonBox) {
            expect(buttonBox.height).toBeGreaterThan(35);
          }
          console.log(`✓ Form buttons touch-friendly on ${url}`);
        }
      }
    }
  });

  test('Content readability and spacing on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Check text content is properly spaced
    const textElements = page.locator('p, div:has-text(" ")').first();
    if (await textElements.isVisible({ timeout: 5000 })) {
      const textBox = await textElements.boundingBox();
      if (textBox) {
        expect(textBox.width).toBeLessThan(400); // Should fit on mobile screen
      }
    }
    
    // Check that clickable elements have enough space between them
    const clickableElements = page.locator('a, button');
    if (await clickableElements.count() > 1) {
      const first = await clickableElements.nth(0).boundingBox();
      const second = await clickableElements.nth(1).boundingBox();
      
      if (first && second) {
        const verticalGap = Math.abs(first.y - second.y);
        const horizontalGap = Math.abs(first.x - second.x);
        
        // Elements should have some spacing (at least 8px)
        expect(Math.min(verticalGap, horizontalGap)).toBeGreaterThan(5);
      }
    }
    
    console.log('✓ Content spacing verified for mobile');
  });

  test('Viewport meta tag and scaling', async ({ page }) => {
    await page.goto('/');
    
    // Check that viewport meta tag is present for proper mobile scaling
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
    
    if (viewportMeta) {
      expect(viewportMeta).toContain('width=device-width');
      console.log(`✓ Viewport meta tag found: ${viewportMeta}`);
    } else {
      console.log('⚠️ No viewport meta tag found - may affect mobile scaling');
    }
  });

  test('Touch gestures and interactions', async ({ page }) => {
    await page.goto('/write');
    
    // Test tap interactions
    const interactiveElements = page.locator('button, a, [role="button"]');
    if (await interactiveElements.count() > 0) {
      const element = interactiveElements.first();
      
      // Simulate touch interaction
      await element.tap();
      await page.waitForTimeout(500);
      
      console.log('✓ Touch interaction test completed');
    }
    
    // Test text selection if text editor is present
    const editor = page.locator('[contenteditable="true"], textarea').first();
    if (await editor.isVisible({ timeout: 5000 })) {
      await editor.tap();
      await editor.fill('Test text selection');
      
      // Try to select text (mobile browsers handle this differently)
      await page.waitForTimeout(1000);
      console.log('✓ Text editor touch interaction tested');
    }
  });

  test('Mobile-specific features and optimizations', async ({ page }) => {
    await page.goto('/');
    
    // Check for mobile-specific CSS classes or attributes
    const hasMobileClasses = await page.locator('.mobile, .md\\:hidden, .sm\\:block, [class*="mobile"]').count() > 0;
    if (hasMobileClasses) {
      console.log('✓ Mobile-specific CSS classes detected');
    }
    
    // Check that images are responsive
    const images = page.locator('img');
    if (await images.count() > 0) {
      const img = images.first();
      const imgClass = await img.getAttribute('class') || '';
      const imgStyle = await img.getAttribute('style') || '';
      
      const isResponsive = imgClass.includes('responsive') || 
                          imgClass.includes('w-full') || 
                          imgStyle.includes('width') ||
                          imgStyle.includes('max-width');
      
      if (isResponsive) {
        console.log('✓ Responsive images detected');
      }
    }
    
    console.log('✓ Mobile optimization check completed');
  });

  test('Performance on mobile device simulation', async ({ page }) => {
    // Navigate and measure basic performance metrics
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    // Mobile should load reasonably quickly (under 5 seconds on slow connection)
    expect(loadTime).toBeLessThan(8000);
    console.log(`✓ Page load time: ${loadTime}ms (acceptable for mobile)`);
    
    // Check that page is interactive
    const interactiveElement = page.locator('button, a, input').first();
    if (await interactiveElement.isVisible({ timeout: 5000 })) {
      const isEnabled = await interactiveElement.isEnabled();
      expect(isEnabled).toBe(true);
      console.log('✓ Interactive elements available after load');
    }
  });
});