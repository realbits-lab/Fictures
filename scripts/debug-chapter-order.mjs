import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });
  const page = await context.newPage();

  console.log('Navigating to reading page...');
  await page.goto('http://localhost:3000/reading/PoAQD-N76wSTiCxwQQCuQ', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Inject code to log the availableChapters array
  const chaptersData = await page.evaluate(() => {
    // Access React internals to get the component data
    const reactRoot = document.querySelector('[data-reactroot], #__next, main');
    if (!reactRoot) return null;

    // Try to find the fiber node
    const fiberKey = Object.keys(reactRoot).find(key => key.startsWith('__reactFiber'));
    if (!fiberKey) return null;

    let fiber = reactRoot[fiberKey];

    // Walk up the fiber tree to find ChapterReaderClient
    let attempts = 0;
    while (fiber && attempts < 100) {
      if (fiber.memoizedProps?.storyId) {
        // Found the component
        const hooks = fiber.memoizedState;

        // Try to extract availableChapters from hooks chain
        let current = hooks;
        let hookIndex = 0;
        const hookData = [];

        while (current && hookIndex < 20) {
          if (current.memoizedState) {
            hookData.push({
              index: hookIndex,
              type: typeof current.memoizedState,
              value: current.memoizedState
            });
          }
          current = current.next;
          hookIndex++;
        }

        return hookData;
      }
      fiber = fiber.return;
      attempts++;
    }

    return null;
  });

  console.log('\n=== React Hook Data ===');
  console.log(JSON.stringify(chaptersData, null, 2));

  // Alternative: Fetch the API directly
  console.log('\n=== Fetching Story API Directly ===');
  const apiResponse = await page.evaluate(async () => {
    const response = await fetch('/writing/api/stories/PoAQD-N76wSTiCxwQQCuQ/read', {
      credentials: 'include'
    });
    return await response.json();
  });

  console.log('\n=== Story Parts and Chapters ===');
  apiResponse.story.parts.forEach((part, idx) => {
    console.log(`\nPart ${idx}: "${part.title}" (orderIndex: ${part.orderIndex})`);
    part.chapters.forEach((ch, chIdx) => {
      console.log(`  Chapter ${chIdx}: "${ch.title}" (orderIndex: ${ch.orderIndex}, id: ${ch.id})`);
    });
  });

  console.log('\n=== Root Level Chapters ===');
  apiResponse.story.chapters.forEach((ch, idx) => {
    console.log(`Chapter ${idx}: "${ch.title}" (orderIndex: ${ch.orderIndex}, id: ${ch.id})`);
  });

  await browser.close();
})();
