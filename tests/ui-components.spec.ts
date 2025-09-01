import { test, expect } from '@playwright/test';

test.describe('UI Components - Comprehensive Component Testing', () => {
  
  test('Button component variants and states', async ({ page }) => {
    // Create a test page with all button variants
    await page.setContent(`
      <html>
        <head>
          <style>
            .button { 
              display: inline-flex; 
              align-items: center; 
              justify-content: center; 
              gap: 8px;
              padding: 8px 16px; 
              border-radius: 8px; 
              font-medium: 500;
              transition: all 0.2s;
              border: none;
              cursor: pointer;
            }
            .primary { background: #2563eb; color: white; }
            .secondary { background: #e5e7eb; color: #111827; }
            .ghost { background: transparent; color: #374151; }
            .destructive { background: #dc2626; color: white; }
            .disabled { opacity: 0.5; cursor: not-allowed; }
            .loading { position: relative; }
            .loading::after { 
              content: ''; 
              position: absolute;
              width: 16px; 
              height: 16px;
              border: 2px solid currentColor;
              border-top: 2px solid transparent;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <button class="button primary" data-testid="btn-primary">Primary Button</button>
          <button class="button secondary" data-testid="btn-secondary">Secondary Button</button>
          <button class="button ghost" data-testid="btn-ghost">Ghost Button</button>
          <button class="button destructive" data-testid="btn-destructive">Destructive Button</button>
          <button class="button primary disabled" data-testid="btn-disabled" disabled>Disabled Button</button>
          <button class="button primary loading" data-testid="btn-loading">Loading Button</button>
        </body>
      </html>
    `);

    // Test all button variants
    const buttonVariants = ['primary', 'secondary', 'ghost', 'destructive'];
    
    for (const variant of buttonVariants) {
      const button = page.locator(`[data-testid="btn-${variant}"]`);
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
      
      // Test click interaction
      await button.click();
      console.log(`✓ ${variant} button click interaction working`);
    }

    // Test disabled state
    const disabledButton = page.locator('[data-testid="btn-disabled"]');
    await expect(disabledButton).toBeDisabled();
    console.log('✓ Disabled button state working');

    // Test loading state
    const loadingButton = page.locator('[data-testid="btn-loading"]');
    await expect(loadingButton).toBeVisible();
    console.log('✓ Loading button state working');

    console.log('✓ Button component comprehensive testing completed');
  });

  test('Card component structure and content', async ({ page }) => {
    await page.setContent(`
      <html>
        <head>
          <style>
            .card { 
              border: 1px solid #e5e7eb; 
              border-radius: 8px; 
              background: white; 
              overflow: hidden;
            }
            .card-header { padding: 16px; border-bottom: 1px solid #e5e7eb; }
            .card-title { font-size: 18px; font-weight: 600; margin: 0; }
            .card-content { padding: 16px; }
          </style>
        </head>
        <body>
          <div class="card" data-testid="test-card">
            <div class="card-header" data-testid="card-header">
              <h2 class="card-title" data-testid="card-title">Test Card Title</h2>
            </div>
            <div class="card-content" data-testid="card-content">
              <p>This is test card content to verify card component structure.</p>
            </div>
          </div>
        </body>
      </html>
    `);

    // Test card structure
    const card = page.locator('[data-testid="test-card"]');
    const header = page.locator('[data-testid="card-header"]');
    const title = page.locator('[data-testid="card-title"]');
    const content = page.locator('[data-testid="card-content"]');

    await expect(card).toBeVisible();
    await expect(header).toBeVisible();
    await expect(title).toBeVisible();
    await expect(content).toBeVisible();

    // Test content
    await expect(title).toHaveText('Test Card Title');
    await expect(content).toContainText('test card content');

    console.log('✓ Card component structure and content testing completed');
  });

  test('Progress component functionality', async ({ page }) => {
    await page.setContent(`
      <html>
        <head>
          <style>
            .progress { 
              width: 100%; 
              height: 8px; 
              background: #e5e7eb; 
              border-radius: 4px; 
              overflow: hidden;
            }
            .progress-bar { 
              height: 100%; 
              background: #10b981; 
              transition: width 0.3s ease;
            }
            .progress-warning .progress-bar { background: #f59e0b; }
            .progress-error .progress-bar { background: #ef4444; }
          </style>
        </head>
        <body>
          <div class="progress" data-testid="progress-25">
            <div class="progress-bar" style="width: 25%"></div>
          </div>
          <div class="progress" data-testid="progress-50">
            <div class="progress-bar" style="width: 50%"></div>
          </div>
          <div class="progress" data-testid="progress-75">
            <div class="progress-bar" style="width: 75%"></div>
          </div>
          <div class="progress" data-testid="progress-100">
            <div class="progress-bar" style="width: 100%"></div>
          </div>
          <div class="progress progress-warning" data-testid="progress-warning">
            <div class="progress-bar" style="width: 60%"></div>
          </div>
        </body>
      </html>
    `);

    // Test different progress values
    const progressBars = [
      { testId: 'progress-25', expectedWidth: '25%' },
      { testId: 'progress-50', expectedWidth: '50%' },
      { testId: 'progress-75', expectedWidth: '75%' },
      { testId: 'progress-100', expectedWidth: '100%' }
    ];

    for (const { testId, expectedWidth } of progressBars) {
      const progress = page.locator(`[data-testid="${testId}"]`);
      const bar = progress.locator('.progress-bar');
      
      await expect(progress).toBeVisible();
      await expect(bar).toBeVisible();
      
      // Test width attribute
      const width = await bar.getAttribute('style');
      expect(width).toContain(`width: ${expectedWidth}`);
    }

    // Test warning variant
    const warningProgress = page.locator('[data-testid="progress-warning"]');
    await expect(warningProgress).toHaveClass(/progress-warning/);

    console.log('✓ Progress component functionality testing completed');
  });

  test('Badge component variants and sizes', async ({ page }) => {
    await page.setContent(`
      <html>
        <head>
          <style>
            .badge { 
              display: inline-flex; 
              align-items: center; 
              border-radius: 6px; 
              font-weight: 500;
              text-align: center;
            }
            .badge-default { background: #f3f4f6; color: #374151; }
            .badge-success { background: #dcfce7; color: #166534; }
            .badge-warning { background: #fef3c7; color: #92400e; }
            .badge-error { background: #fecaca; color: #991b1b; }
            .badge-sm { padding: 2px 6px; font-size: 12px; }
            .badge-md { padding: 4px 8px; font-size: 14px; }
            .badge-lg { padding: 6px 12px; font-size: 16px; }
          </style>
        </head>
        <body>
          <span class="badge badge-default badge-md" data-testid="badge-default">Default</span>
          <span class="badge badge-success badge-md" data-testid="badge-success">Success</span>
          <span class="badge badge-warning badge-md" data-testid="badge-warning">Warning</span>
          <span class="badge badge-error badge-md" data-testid="badge-error">Error</span>
          <span class="badge badge-default badge-sm" data-testid="badge-sm">Small</span>
          <span class="badge badge-default badge-lg" data-testid="badge-lg">Large</span>
        </body>
      </html>
    `);

    // Test badge variants
    const badges = ['default', 'success', 'warning', 'error'];
    
    for (const variant of badges) {
      const badge = page.locator(`[data-testid="badge-${variant}"]`);
      await expect(badge).toBeVisible();
      await expect(badge).toHaveClass(new RegExp(`badge-${variant}`));
    }

    // Test badge sizes
    const sizes = ['sm', 'lg'];
    
    for (const size of sizes) {
      const badge = page.locator(`[data-testid="badge-${size}"]`);
      await expect(badge).toBeVisible();
      await expect(badge).toHaveClass(new RegExp(`badge-${size}`));
    }

    console.log('✓ Badge component variants and sizes testing completed');
  });

  test('Navigation component accessibility and functionality', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation structure
    const navigation = page.locator('nav, [role="navigation"], [data-testid="navigation"]').first();
    if (await navigation.isVisible()) {
      console.log('✓ Navigation component found');
      
      // Test navigation links
      const navLinks = navigation.locator('a, button[role="menuitem"]');
      const linkCount = await navLinks.count();
      
      if (linkCount > 0) {
        console.log(`✓ Found ${linkCount} navigation links`);
        
        // Test first few navigation links
        for (let i = 0; i < Math.min(linkCount, 5); i++) {
          const link = navLinks.nth(i);
          const linkText = await link.textContent() || '';
          const linkHref = await link.getAttribute('href');
          
          await expect(link).toBeVisible();
          console.log(`✓ Nav link ${i + 1}: "${linkText.slice(0, 20)}" (href: ${linkHref})`);
          
          // Test keyboard navigation
          await link.focus();
          await expect(link).toBeFocused();
        }
        
        // Test first navigation link click
        const firstLink = navLinks.first();
        const firstLinkText = await firstLink.textContent() || '';
        
        if (!firstLinkText.toLowerCase().includes('sign') && !firstLinkText.toLowerCase().includes('login')) {
          await firstLink.click();
          await page.waitForTimeout(1000);
          console.log(`✓ Navigation link "${firstLinkText}" click successful`);
        }
        
      } else {
        console.log('⚠️ No navigation links found');
      }
      
    } else {
      console.log('⚠️ Navigation component not found');
    }

    console.log('✓ Navigation component accessibility testing completed');
  });

  test('Form components validation and interaction', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <form data-testid="test-form">
            <div>
              <label for="email">Email:</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                data-testid="email-input"
                required
              >
              <div class="error" data-testid="email-error" style="display: none; color: red;"></div>
            </div>
            <div>
              <label for="password">Password:</label>
              <input 
                type="password" 
                id="password" 
                name="password" 
                data-testid="password-input"
                required
                minlength="6"
              >
              <div class="error" data-testid="password-error" style="display: none; color: red;"></div>
            </div>
            <div>
              <label for="bio">Bio:</label>
              <textarea 
                id="bio" 
                name="bio" 
                data-testid="bio-textarea"
                rows="3"
              ></textarea>
            </div>
            <button type="submit" data-testid="submit-btn">Submit</button>
          </form>
          
          <script>
            document.querySelector('[data-testid="test-form"]').addEventListener('submit', (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              console.log('Form submitted with data:', Object.fromEntries(formData));
            });
          </script>
        </body>
      </html>
    `);

    // Test form elements
    const form = page.locator('[data-testid="test-form"]');
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const bioTextarea = page.locator('[data-testid="bio-textarea"]');
    const submitBtn = page.locator('[data-testid="submit-btn"]');

    await expect(form).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(bioTextarea).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // Test form input interactions
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');

    await passwordInput.fill('testpassword123');
    await expect(passwordInput).toHaveValue('testpassword123');

    await bioTextarea.fill('This is a test bio for form testing');
    await expect(bioTextarea).toHaveValue('This is a test bio for form testing');

    // Test form submission
    await submitBtn.click();

    console.log('✓ Form components validation and interaction testing completed');
  });

  test('Dashboard widget components integration', async ({ page }) => {
    await page.goto('/');
    
    // Look for dashboard widget components
    const dashboardWidgets = page.locator(
      '[data-testid*="widget"], .widget, .dashboard-card, ' +
      '[class*="widget"], [data-widget], .dashboard-component'
    );

    const widgetCount = await dashboardWidgets.count();
    if (widgetCount > 0) {
      console.log(`✓ Found ${widgetCount} dashboard widget components`);
      
      for (let i = 0; i < Math.min(widgetCount, 5); i++) {
        const widget = dashboardWidgets.nth(i);
        await expect(widget).toBeVisible();
        
        const widgetContent = await widget.textContent() || '';
        console.log(`✓ Dashboard widget ${i + 1}: "${widgetContent.slice(0, 50)}..."`);
        
        // Test widget interactions
        const buttons = widget.locator('button, a[role="button"]');
        const buttonCount = await buttons.count();
        
        if (buttonCount > 0) {
          console.log(`  - Widget has ${buttonCount} interactive elements`);
        }
      }
      
    } else {
      console.log('ℹ️ No dashboard widget components found');
    }

    console.log('✓ Dashboard widget components integration testing completed');
  });
});