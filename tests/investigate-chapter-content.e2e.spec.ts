import { test, expect } from '@playwright/test';

test.describe('Investigate Chapter 2 & 3 Content', () => {

  test('Extract actual content from chapters 2 & 3 in reader view', async ({ page }) => {
    console.log('🔍 Investigating what content is actually shown for chapters 2 & 3...');

    await page.goto('http://localhost:3000/read/78YZmbHM-Kp766Qp06XKa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const chapterButtons = page.locator('.w-80 button');
    const chapterCount = await chapterButtons.count();
    
    console.log(`\n📚 Found ${chapterCount} chapters in reader view`);

    // Check each chapter's actual content
    for (let i = 0; i < chapterCount; i++) {
      const chapterButton = chapterButtons.nth(i);
      const chapterText = await chapterButton.textContent();
      
      console.log(`\n--- Chapter ${i + 1}: ${chapterText?.substring(0, 50)}... ---`);
      
      // Click to select the chapter
      await chapterButton.click();
      await page.waitForTimeout(1000);

      // Get the main content area
      const contentArea = page.locator('.flex-1 article, .main-content');
      const contentExists = await contentArea.count();
      
      if (contentExists > 0) {
        const fullContent = await contentArea.textContent();
        const contentLength = fullContent?.length || 0;
        
        console.log(`Content length: ${contentLength} characters`);
        console.log(`Content preview (first 300 chars):`);
        console.log(`"${fullContent?.substring(0, 300)}..."`);
        
        // Check if content has scene structure
        const hasSceneMarkers = fullContent?.includes('Scene') || 
                                fullContent?.includes('scene') || 
                                fullContent?.includes('# ') ||
                                fullContent?.includes('##');
        
        console.log(`Has scene/section markers: ${hasSceneMarkers}`);
        
        // Count paragraphs/sections
        const paragraphCount = fullContent?.split('\n\n').filter(p => p.trim().length > 0).length || 0;
        console.log(`Paragraph/section count: ${paragraphCount}`);
        
        // Check if it's just the header or has actual story content
        const hasActualStoryContent = fullContent && fullContent.length > 100 && 
                                      !fullContent.trim().endsWith('words') &&
                                      fullContent.includes(' ');
        
        console.log(`Has substantial story content: ${hasActualStoryContent}`);
        
        if (hasActualStoryContent) {
          console.log('🚨 THIS CHAPTER HAS REAL CONTENT - should have scenes in database!');
          
          // Extract what looks like scenes
          const possibleScenes = fullContent?.split(/\n\n+/).filter(section => 
            section.trim().length > 50 && 
            !section.includes('Chapter ') &&
            !section.includes(' words')
          ) || [];
          
          console.log(`Possible scene sections: ${possibleScenes.length}`);
          possibleScenes.slice(0, 3).forEach((scene, idx) => {
            console.log(`  Scene ${idx + 1}: "${scene.substring(0, 100)}..."`);
          });
        }
      } else {
        console.log('No content area found');
      }
    }

    console.log('\n✅ Chapter content investigation completed');
  });

  test('Cross-reference with database chapter IDs', async ({ page }) => {
    console.log('🔍 Finding the actual chapter IDs used in reader view...');

    await page.goto('http://localhost:3000/read/78YZmbHM-Kp766Qp06XKa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to intercept any network requests that might reveal chapter IDs
    const apiCalls = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('chapter') || url.includes('scene')) {
        apiCalls.push({
          url,
          status: response.status(),
          method: response.request().method()
        });
      }
    });

    // Click through chapters to trigger any API calls
    const chapterButtons = page.locator('.w-80 button');
    const count = await chapterButtons.count();
    
    for (let i = 0; i < count; i++) {
      console.log(`Clicking chapter ${i + 1}...`);
      await chapterButtons.nth(i).click();
      await page.waitForTimeout(1500);
    }

    if (apiCalls.length > 0) {
      console.log('\n🌐 API calls detected:');
      apiCalls.forEach(call => {
        console.log(`  ${call.method} ${call.url} - ${call.status}`);
      });
    }

    // Try to extract data from the page HTML
    const pageHTML = await page.content();
    
    // Look for chapter data in Next.js hydration data
    const chapterDataMatches = pageHTML.match(/"chapters":\s*\[[^\]]+\]/g);
    if (chapterDataMatches) {
      console.log('\n📊 Found chapter data in page:');
      chapterDataMatches.forEach((match, idx) => {
        console.log(`  Match ${idx + 1}: ${match.substring(0, 200)}...`);
      });
    }

    // Look for scene data
    const sceneDataMatches = pageHTML.match(/"scenes":\s*\[[^\]]+\]/g);
    if (sceneDataMatches) {
      console.log('\n🎬 Found scene data in page:');
      sceneDataMatches.forEach((match, idx) => {
        console.log(`  Scene match ${idx + 1}: ${match.substring(0, 200)}...`);
      });
    }

    // Extract any chapter IDs from the HTML
    const idMatches = pageHTML.match(/"id":\s*"[a-zA-Z0-9_-]{10,}"/g);
    if (idMatches) {
      console.log('\n🔢 Found ID patterns:');
      const uniqueIds = [...new Set(idMatches)];
      uniqueIds.slice(0, 10).forEach(id => {
        console.log(`  ${id}`);
      });
    }

    console.log('\n✅ Cross-reference investigation completed');
  });
});