import { chromium } from '@playwright/test';

async function checkRendering() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/novels', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check if header has proper styling
  const headerStyles = await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return null;
    const styles = window.getComputedStyle(header);
    return {
      position: styles.position,
      top: styles.top,
      zIndex: styles.zIndex,
      borderBottom: styles.borderBottomWidth,
      backgroundColor: styles.backgroundColor,
    };
  });
  
  console.log('Header styles:', headerStyles);
  
  // Check if flex container works
  const navStyles = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return null;
    const styles = window.getComputedStyle(nav);
    return {
      display: styles.display,
      alignItems: styles.alignItems,
      justifyContent: styles.justifyContent,
    };
  });
  
  console.log('Nav styles:', navStyles);
  
  // Check if Tailwind colors are applied
  const buttonStyles = await page.evaluate(() => {
    const button = document.querySelector('button');
    if (!button) return null;
    const styles = window.getComputedStyle(button);
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      padding: styles.padding,
    };
  });
  
  console.log('Button styles:', buttonStyles);
  
  await browser.close();
  
  if (headerStyles && headerStyles.position === 'sticky') {
    console.log('\n✅ Tailwind CSS is working!');
  } else {
    console.log('\n❌ Tailwind CSS is NOT working');
  }
}

checkRendering();
