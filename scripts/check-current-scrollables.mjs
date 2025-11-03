import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/test-story-editor-mockup');
  await page.waitForLoadState('networkidle');

  const scrollables = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('.overflow-y-auto'));
    return elements.map((el, index) => ({
      index,
      className: el.className,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      canScroll: el.scrollHeight > el.clientHeight,
      scrollTop: el.scrollTop,
      hasContent: el.textContent?.slice(0, 50)
    }));
  });

  console.log('Current scrollable elements:');
  console.log(JSON.stringify(scrollables, null, 2));

  await browser.close();
})();
