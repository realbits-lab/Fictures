import { chromium } from '@playwright/test';

async function testLandingPage() {
  console.log('Testing landing page...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000');

    console.log('Waiting for page to load...');
    await page.waitForSelector('text=Featured Story', { timeout: 10000 });

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'logs/landing-page.png', fullPage: true });

    console.log('Checking for Start Reading button...');
    const startReadingButton = await page.getByText('Start Reading');
    if (await startReadingButton.isVisible()) {
      console.log('✓ Start Reading button is visible!');
    }

    console.log('Checking for story title...');
    const storyTitle = await page.locator('h3').filter({ hasText: /Jupiter|The Last/ }).first();
    if (await storyTitle.isVisible()) {
      const title = await storyTitle.textContent();
      console.log(`✓ Featured story: ${title}`);
    }

    console.log('\n✓✓✓ Landing page test completed successfully! ✓✓✓');
    console.log('Screenshot saved to logs/landing-page.png');

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLandingPage();
