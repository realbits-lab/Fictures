import { chromium } from '@playwright/test';

async function verifyCSS() {
  console.log('Verifying CSS on /novels page...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  try {
    // Navigate to novels page
    await page.goto('http://localhost:3000/novels', { waitUntil: 'networkidle' });
    
    // Wait a bit for any late-loading resources
    await page.waitForTimeout(2000);
    
    // Check if CSS is loaded
    const styleSheets = await page.evaluate(() => {
      return Array.from(document.styleSheets).map(sheet => ({
        href: sheet.href,
        rules: sheet.cssRules?.length || 0
      }));
    });
    
    console.log('✅ CSS Stylesheets loaded:');
    styleSheets.forEach(sheet => {
      if (sheet.href) {
        console.log(`   - ${sheet.href} (${sheet.rules} rules)`);
      }
    });
    
    // Check console errors
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors:');
      consoleErrors.forEach(err => console.log(`   - ${err}`));
    } else {
      console.log('\n✅ No console errors detected');
    }
    
    // Check if content has styling
    const hasStyles = await page.evaluate(() => {
      const body = document.body;
      const computedStyle = window.getComputedStyle(body);
      return computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
             computedStyle.color !== 'rgb(0, 0, 0)';
    });
    
    console.log(hasStyles ? '\n✅ CSS is being applied to elements' : '\n❌ CSS not being applied');
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await browser.close();
  }
}

verifyCSS();
