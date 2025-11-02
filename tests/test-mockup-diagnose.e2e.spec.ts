import { test } from '@playwright/test';

/**
 * Diagnose why mockup panels cannot scroll
 */

test('Diagnose mockup panel styles', async ({ page }) => {
  test.setTimeout(60000);

  console.log('🔍 Diagnosing mockup panel styles...');

  await page.goto('http://localhost:3000/test-scrolling');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Get all divs with overflow-y-auto class
  const scrollableDivs = page.locator('div.overflow-y-auto');
  const count = await scrollableDivs.count();

  console.log(`\nFound ${count} divs with overflow-y-auto class`);

  for (let i = 0; i < Math.min(count, 5); i++) {
    const div = scrollableDivs.nth(i);

    const info = await div.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        className: el.className,
        overflowY: computed.overflowY,
        height: computed.height,
        maxHeight: computed.maxHeight,
        minHeight: computed.minHeight,
        flex: computed.flex,
        flexGrow: computed.flexGrow,
        flexShrink: computed.flexShrink,
        flexBasis: computed.flexBasis,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        offsetHeight: el.offsetHeight,
        canScroll: el.scrollHeight > el.clientHeight,
      };
    });

    console.log(`\nDiv ${i + 1}:`, JSON.stringify(info, null, 2));

    // Try to set scrollTop
    await div.evaluate(el => { el.scrollTop = 500; });
    await page.waitForTimeout(200);

    const scrollTop = await div.evaluate(el => el.scrollTop);
    console.log(`  After setting scrollTop=500, actual scrollTop: ${scrollTop}`);
  }

  // Also check the Panel elements themselves
  const panels = page.locator('[data-panel-group-direction="horizontal"] > [data-panel]');
  const panelCount = await panels.count();

  console.log(`\n\nFound ${panelCount} Panel elements`);

  for (let i = 0; i < Math.min(panelCount, 3); i++) {
    const panel = panels.nth(i);

    const panelInfo = await panel.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        dataPanel: el.getAttribute('data-panel'),
        display: computed.display,
        flexDirection: computed.flexDirection,
        overflow: computed.overflow,
        overflowY: computed.overflowY,
        height: computed.height,
      };
    });

    console.log(`\nPanel ${i + 1}:`, JSON.stringify(panelInfo, null, 2));
  }
});
