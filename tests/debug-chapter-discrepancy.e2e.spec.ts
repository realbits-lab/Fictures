import { test, expect } from '@playwright/test';

test.describe('Debug Chapter Discrepancy - Reader vs Writer', () => {

  test('Compare reader view chapters with writer view access', async ({ page }) => {
    console.log('🔍 Investigating reader vs writer view discrepancy...');

    // First, check what chapters are shown in reader view
    await page.goto('http://localhost:3000/read/78YZmbHM-Kp766Qp06XKa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const readerChapters = [];
    const chapterButtons = page.locator('.w-80 button');
    const chapterCount = await chapterButtons.count();
    
    console.log(`\n📚 READER VIEW: Found ${chapterCount} chapters`);

    // Extract chapter information from reader view
    for (let i = 0; i < chapterCount; i++) {
      const chapterButton = chapterButtons.nth(i);
      const fullText = await chapterButton.textContent();
      const statusIcon = await chapterButton.locator('span').first().textContent();
      
      // Try to extract chapter number and title
      const chapterMatch = fullText?.match(/Ch (\d+): (.+?)(\d+ words)?$/);
      const chapterNum = chapterMatch ? chapterMatch[1] : 'unknown';
      const chapterTitle = chapterMatch ? chapterMatch[2].trim() : 'unknown';
      
      readerChapters.push({
        number: chapterNum,
        title: chapterTitle,
        status: statusIcon,
        fullText: fullText
      });

      console.log(`  Chapter ${chapterNum}: "${chapterTitle}" [${statusIcon}]`);
    }

    // Now test accessing each chapter in writer mode
    console.log(`\n✏️  WRITER VIEW: Testing individual chapter access`);

    // We need to find the actual chapter IDs to test writer view
    // Let's click on each chapter in reader view to see if we can extract the ID
    for (let i = 0; i < Math.min(chapterCount, 3); i++) {
      const chapterButton = chapterButtons.nth(i);
      
      // Click the chapter to select it
      await chapterButton.click();
      await page.waitForTimeout(1000);

      // Check if the URL changes or if we can inspect the page for chapter ID
      const currentUrl = page.url();
      console.log(`  Selected chapter ${i + 1}, URL: ${currentUrl}`);

      // Look for any data attributes or chapter content that might reveal the ID
      const chapterContent = page.locator('.flex-1 article, .main-content');
      const hasContent = await chapterContent.count();
      console.log(`    Content sections found: ${hasContent}`);

      if (hasContent > 0) {
        const contentPreview = await chapterContent.first().textContent();
        console.log(`    Content preview: ${contentPreview?.substring(0, 100)}...`);
      }
    }

    // Try to access the specific chapter we know works
    console.log(`\n🧪 Testing known working chapter: odCvt_y4zTjW6fshWCEOm`);
    await page.goto('http://localhost:3000/write/odCvt_y4zTjW6fshWCEOm');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    if (!page.url().includes('/login')) {
      const scenesFound = await page.locator('text=/scene/i').count();
      const createSceneButton = await page.locator('text=/create.*scene/i').count();
      const noScenesMessage = await page.locator('text=/no scenes/i').count();
      
      console.log(`    Writer view scenes found: ${scenesFound}`);
      console.log(`    Create scene button: ${createSceneButton > 0}`);
      console.log(`    No scenes message: ${noScenesMessage > 0}`);
    } else {
      console.log('    Requires authentication');
    }

    // Take screenshots for debugging
    await page.screenshot({ 
      path: 'test-results/chapter-discrepancy-debug.png',
      fullPage: true 
    });
  });

  test('Debug: Extract actual chapter IDs from story structure', async ({ page }) => {
    console.log('🔍 Trying to find actual chapter IDs...');

    // Go to reader view
    await page.goto('http://localhost:3000/read/78YZmbHM-Kp766Qp06XKa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to inspect the page source for chapter IDs
    const pageContent = await page.content();
    
    // Look for patterns that might contain chapter IDs
    const chapterIdMatches = pageContent.match(/chapterId['":\s]*['"][a-zA-Z0-9_-]{10,}['"]|id['":\s]*['"][a-zA-Z0-9_-]{10,}['"]/g);
    if (chapterIdMatches) {
      console.log('Potential chapter ID patterns found:');
      chapterIdMatches.slice(0, 10).forEach((match, i) => {
        console.log(`  ${i + 1}: ${match}`);
      });
    }

    // Try to access developer tools or React developer info
    const debugInfo = await page.evaluate(() => {
      // Look for any window objects that might contain story data
      const possibleData = {};
      
      // Check if there are any script tags with JSON data
      const scripts = document.querySelectorAll('script');
      let foundData = [];
      
      scripts.forEach((script, index) => {
        const content = script.textContent || '';
        if (content.includes('chapter') && content.includes('id')) {
          foundData.push(`Script ${index}: ${content.substring(0, 200)}...`);
        }
      });
      
      return {
        scriptDataFound: foundData.length,
        sampleData: foundData.slice(0, 3)
      };
    });
    
    console.log('Page script analysis:', debugInfo);

    // Try clicking on chapters and inspect network requests
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('chapter')) {
        console.log(`API call: ${response.url()} - Status: ${response.status()}`);
      }
    });

    // Click on different chapters to trigger network requests
    const chapterButtons = page.locator('.w-80 button');
    const count = await chapterButtons.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      console.log(`\nClicking chapter ${i + 1}...`);
      await chapterButtons.nth(i).click();
      await page.waitForTimeout(1500); // Wait for potential API calls
    }
  });

  test('Test writer access with hypothetical chapter IDs', async ({ page }) => {
    console.log('🧪 Testing writer access patterns...');

    // Test the known working chapter first
    const knownChapterId = 'odCvt_y4zTjW6fshWCEOm';
    console.log(`\n✅ Testing known working chapter: ${knownChapterId}`);
    
    await page.goto(`http://localhost:3000/write/${knownChapterId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    if (!page.url().includes('/login')) {
      // Analyze the structure of this working page
      const mainElements = await page.locator('h1, h2, h3, [class*="card"]').count();
      const sceneElements = await page.locator('text=/scene/i').count();
      const chapterOverview = await page.locator('text=/chapter overview/i').count();
      
      console.log(`    Main sections: ${mainElements}`);
      console.log(`    Scene references: ${sceneElements}`);
      console.log(`    Chapter overview: ${chapterOverview > 0}`);

      // Try to find any hints about other chapter IDs in the page
      const sidebarContent = await page.locator('.w-80, [data-testid="sidebar"]').textContent();
      console.log(`    Sidebar preview: ${sidebarContent?.substring(0, 200)}...`);
    }

    // Test some common ID patterns that might exist for chapters 2 and 3
    // This is speculative, but might reveal the pattern
    const hypotheticalIds = [
      // Pattern similar to the working ID but different
      knownChapterId.replace('odCvt_', 'chap2_'),
      knownChapterId.replace('odCvt_', 'chap3_'),
      // Or just try different patterns
      '78YZmbHM-Kp766Qp06XKb', // Similar to story ID with different ending
      '78YZmbHM-Kp766Qp06XKc',
    ];

    for (const testId of hypotheticalIds) {
      console.log(`\n🔍 Testing hypothetical ID: ${testId}`);
      await page.goto(`http://localhost:3000/write/${testId}`);
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      if (!currentUrl.includes('/login') && !currentUrl.includes('404')) {
        console.log(`    ✅ Found valid chapter: ${currentUrl}`);
        const hasScenes = await page.locator('text=/scene/i').count();
        console.log(`    Scenes found: ${hasScenes}`);
      } else {
        console.log(`    ❌ Invalid: ${currentUrl.includes('404') ? '404' : 'login required'}`);
      }
    }
  });
});