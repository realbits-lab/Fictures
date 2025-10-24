import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });
  const page = await context.newPage();

  console.log('Fetching story API...');
  await page.goto('http://localhost:3000/reading/PoAQD-N76wSTiCxwQQCuQ', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const result = await page.evaluate(async () => {
    const response = await fetch('/writing/api/stories/PoAQD-N76wSTiCxwQQCuQ/read', {
      credentials: 'include'
    });
    const data = await response.json();

    // Simulate the sorting logic
    const chaptersWithPartOrder = data.story.parts.flatMap(part =>
      part.chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        orderIndex: chapter.orderIndex,
        partOrderIndex: part.orderIndex,
        partTitle: part.title
      }))
    );

    const rootChapters = data.story.chapters.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      orderIndex: chapter.orderIndex,
      partOrderIndex: 0,
      partTitle: '(Root)'
    }));

    const allChapters = [...chaptersWithPartOrder, ...rootChapters];

    // Deduplicate
    const seenIds = new Set();
    const uniqueChapters = allChapters.filter(chapter => {
      if (seenIds.has(chapter.id)) {
        return false;
      }
      seenIds.add(chapter.id);
      return true;
    });

    // Sort
    const sorted = uniqueChapters.sort((a, b) => {
      if (a.partOrderIndex !== b.partOrderIndex) {
        return a.partOrderIndex - b.partOrderIndex;
      }
      return a.orderIndex - b.orderIndex;
    });

    return sorted;
  });

  console.log('\n=== Expected Chapter Order (after sorting) ===');
  result.forEach((ch, idx) => {
    console.log(`${idx + 1}. "${ch.title}" (Part: ${ch.partTitle}, partOrder: ${ch.partOrderIndex}, chapterOrder: ${ch.orderIndex})`);
  });

  await browser.close();
})();
