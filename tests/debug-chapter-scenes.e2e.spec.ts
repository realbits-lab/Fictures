import { test, expect } from '@playwright/test';

test.describe('Debug Chapter Scenes Loading', () => {

  test('Analyze story structure and chapter data', async ({ page }) => {
    console.log('🔍 Analyzing story structure and scene loading...');

    // Navigate to reader view to get story structure
    await page.goto('http://localhost:3000/read/78YZmbHM-Kp766Qp06XKa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Extract story data from the page
    const storyData = await page.evaluate(() => {
      // Try to find story data in the page
      const scripts = document.querySelectorAll('script');
      let storyInfo = null;
      
      for (const script of scripts) {
        const content = script.textContent || '';
        
        // Look for story data in Next.js serialized data
        if (content.includes('"story"') && content.includes('"chapters"')) {
          // Try to extract chapter information
          try {
            // Look for patterns like "chapters":[{...}] or "parts":[{...}]
            const chapterMatches = content.match(/"chapters":\s*\[([^\]]*)\]/);
            const partMatches = content.match(/"parts":\s*\[([^\]]*)\]/);
            
            if (chapterMatches || partMatches) {
              storyInfo = {
                foundChapterData: !!chapterMatches,
                foundPartData: !!partMatches,
                chapterSnippet: chapterMatches ? chapterMatches[0].substring(0, 200) : 'none',
                partSnippet: partMatches ? partMatches[0].substring(0, 200) : 'none'
              };
              break;
            }
          } catch (e) {
            // Continue searching
          }
        }
      }
      
      return storyInfo;
    });

    console.log('Story data analysis:', storyData);

    // Extract chapter information from the sidebar
    const chapters = [];
    const chapterButtons = page.locator('.w-80 button');
    const count = await chapterButtons.count();
    
    console.log(`\n📚 Found ${count} chapters in reader view`);

    for (let i = 0; i < count; i++) {
      const button = chapterButtons.nth(i);
      const text = await button.textContent();
      const statusIcon = await button.locator('span').first().textContent();
      
      chapters.push({
        index: i + 1,
        text: text?.trim(),
        status: statusIcon,
      });

      console.log(`  Chapter ${i + 1}: ${text?.substring(0, 50)}... [${statusIcon}]`);
    }

    // Try to analyze page structure for chapter IDs
    const pageSource = await page.content();
    
    // Look for chapter ID patterns
    const chapterIdPatterns = [
      /chapterId['":\s]*['"][a-zA-Z0-9_-]{10,}['"]/g,
      /"id"[:\s]*"[a-zA-Z0-9_-]{10,}"/g,
      /\/write\/([a-zA-Z0-9_-]{10,})/g
    ];

    console.log('\n🔍 Searching for chapter ID patterns...');
    chapterIdPatterns.forEach((pattern, index) => {
      const matches = pageSource.match(pattern);
      if (matches) {
        console.log(`  Pattern ${index + 1}: Found ${matches.length} matches`);
        matches.slice(0, 5).forEach(match => {
          console.log(`    ${match}`);
        });
      }
    });

    // Test network requests to see if we can identify API calls
    const apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/write/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
      }
    });

    // Click on each chapter to trigger any potential API calls
    console.log('\n🖱️  Testing chapter selection and API calls...');
    for (let i = 0; i < count; i++) {
      console.log(`  Clicking chapter ${i + 1}...`);
      await chapterButtons.nth(i).click();
      await page.waitForTimeout(1000);
    }

    if (apiCalls.length > 0) {
      console.log('\n🌐 API calls detected:');
      apiCalls.forEach(call => {
        console.log(`  ${call.method} ${call.url} - ${call.status}`);
      });
    } else {
      console.log('\n🌐 No API calls detected during chapter selection');
    }

    console.log('\n✅ Story structure analysis completed');
  });

  test('Test chapter data consistency', async ({ page }) => {
    console.log('🧪 Testing chapter data consistency between views...');

    // First, get reader view data
    await page.goto('http://localhost:3000/read/78YZmbHM-Kp766Qp06XKa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const readerChapters = await page.locator('.w-80 button').count();
    console.log(`Reader view chapters: ${readerChapters}`);

    // Check if we can find any hints about chapter content
    for (let i = 0; i < readerChapters; i++) {
      const button = page.locator('.w-80 button').nth(i);
      await button.click();
      await page.waitForTimeout(500);

      const contentArea = page.locator('.flex-1 article, .main-content');
      const hasContent = await contentArea.count();
      
      if (hasContent > 0) {
        const content = await contentArea.textContent();
        const wordCount = content?.split(/\s+/).length || 0;
        const hasSceneStructure = content?.includes('Scene') || content?.includes('scene') || false;
        
        console.log(`  Chapter ${i + 1}:`);
        console.log(`    Word count: ~${wordCount} words`);
        console.log(`    Has scene structure: ${hasSceneStructure}`);
        console.log(`    Content preview: ${content?.substring(0, 100)}...`);
      }
    }

    // Try to access some common chapter ID patterns based on the working one
    const knownWorkingId = 'odCvt_y4zTjW6fshWCEOm';
    console.log(`\n🔧 Testing variations of known working ID: ${knownWorkingId}`);

    // Generate potential IDs based on the working pattern
    const potentialIds = [
      knownWorkingId,
      knownWorkingId.replace('odCvt_', 'chap1_'),
      knownWorkingId.replace('odCvt_', 'chap2_'),
      knownWorkingId.replace('odCvt_', 'chap3_'),
      knownWorkingId.replace('odCvt', 'sec2'),
      knownWorkingId.replace('odCvt', 'sec3')
    ];

    for (const testId of potentialIds) {
      console.log(`  Testing ID: ${testId}`);
      
      // Make a simple request to see if the URL exists
      try {
        const response = await page.request.get(`http://localhost:3000/write/${testId}`);
        const status = response.status();
        const url = response.url();
        
        console.log(`    Response: ${status} - ${url.includes('/login') ? 'login required' : 'accessible'}`);
        
        if (status === 200 && !url.includes('/login')) {
          console.log(`    ✅ Valid chapter ID found: ${testId}`);
        }
      } catch (error) {
        console.log(`    ❌ Request failed: ${error}`);
      }
    }

    console.log('\n✅ Chapter consistency test completed');
  });
});