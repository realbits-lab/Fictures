import { chromium } from '@playwright/test';
import fs from 'fs/promises';

(async () => {
  const authData = JSON.parse(await fs.readFile('.auth/user.json', 'utf8'));
  const manager = authData.profiles.manager;

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: {
      cookies: manager.cookies,
      origins: manager.origins
    }
  });

  const page = await context.newPage();

  // Navigate to the story edit page
  await page.goto('http://localhost:3000/studio/edit/story/qMH4sJmFTlB6KmdR0C6Uu');

  // Wait for page to load
  await page.waitForTimeout(3000);

  // Take screenshot of the Story details table
  await page.screenshot({ path: 'logs/story-details-table.png', fullPage: true });

  console.log('✅ Screenshot saved to logs/story-details-table.png');
  console.log('📊 Ready to inspect field display');

  // Keep browser open for inspection
  await page.waitForTimeout(60000);

  await browser.close();
})();
