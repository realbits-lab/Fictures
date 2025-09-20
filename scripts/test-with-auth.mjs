import { chromium } from 'playwright';

async function testWithAuth() {
  console.log('🔐 Starting authenticated browser session...');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    storageState: '.auth/user.json'
  });

  const page = await context.newPage();

  console.log('📄 Navigating to stories page...');
  await page.goto('http://localhost:3000/stories');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check if we're authenticated
  const title = await page.title();
  const url = page.url();

  console.log('Page title:', title);
  console.log('Current URL:', url);

  if (url.includes('/login')) {
    console.log('❌ Authentication failed - redirected to login');
  } else {
    console.log('✅ Successfully authenticated!');

    // Navigate to create new story
    console.log('🎨 Creating new story...');
    await page.goto('http://localhost:3000/stories/new');
    await page.waitForLoadState('networkidle');

    // Fill in story idea
    const storyIdea = 'A cyberpunk detective investigates virtual reality crimes in Neo-Tokyo 2089';
    await page.fill('textarea[placeholder*="Describe your story idea"]', storyIdea);

    // Click generate button
    await page.click('button:has-text("Generate Story")');

    console.log('⏳ Waiting for story generation...');

    // Wait for generation to complete (max 60 seconds)
    try {
      await page.waitForURL('**/stories', { timeout: 60000 });
      console.log('✅ Story generation complete!');

      // Get the new story URL
      const newUrl = page.url();
      console.log('New story URL:', newUrl);

      // Extract story ID from URL or page
      const storyLinks = await page.locator('a[href*="/write/"]').all();
      if (storyLinks.length > 0) {
        const firstLink = await storyLinks[0].getAttribute('href');
        console.log('First chapter link:', firstLink);

        // Extract chapter ID
        const chapterIdMatch = firstLink?.match(/\/write\/(.+)/);
        if (chapterIdMatch) {
          console.log('📝 New Chapter ID:', chapterIdMatch[1]);
          console.log('✅ ID Format: Using nanoid -', chapterIdMatch[1].length, 'characters');
        }
      }
    } catch (error) {
      console.log('⚠️ Story generation timeout or error:', error.message);
    }
  }

  await browser.close();
  console.log('\n🏁 Test complete!');
}

testWithAuth().catch(console.error);