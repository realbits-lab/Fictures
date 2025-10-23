import { chromium } from '@playwright/test';

async function testCommunityImages() {
  console.log('🎬 Testing community page images...\n');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📍 Navigating to http://localhost:3000/community...');
  await page.goto('http://localhost:3000/community', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Analyze images
  const imageAnalysis = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const storyCards = document.querySelectorAll('a[href^="/community/story/"]');
    const svgPlaceholders = document.querySelectorAll('svg[width="120"][height="120"]');

    return {
      totalImages: images.length,
      loadedImages: images.filter(img => img.complete && img.naturalWidth > 0).length,
      brokenImages: images.filter(img => img.complete && img.naturalWidth === 0).length,
      storyCardsCount: storyCards.length,
      svgPlaceholders: svgPlaceholders.length,
      imageDetails: images.map(img => ({
        alt: img.alt,
        src: img.src.substring(0, 80),
        loaded: img.complete && img.naturalWidth > 0,
        naturalSize: `${img.naturalWidth}x${img.naturalHeight}`
      }))
    };
  });

  console.log('\n=== COMMUNITY PAGE ANALYSIS ===');
  console.log(`📊 Story cards: ${imageAnalysis.storyCardsCount}`);
  console.log(`🖼️  Total images: ${imageAnalysis.totalImages}`);
  console.log(`✅ Loaded images: ${imageAnalysis.loadedImages}`);
  console.log(`❌ Broken images: ${imageAnalysis.brokenImages}`);
  console.log(`🎨 SVG placeholders: ${imageAnalysis.svgPlaceholders}`);

  if (imageAnalysis.brokenImages === 0) {
    console.log('\n✅ SUCCESS: All images loaded or have placeholders!');
  } else {
    console.log('\n❌ FAILURE: Some images are broken');
  }

  console.log('\n=== IMAGE DETAILS ===');
  imageAnalysis.imageDetails.forEach((img, idx) => {
    const status = img.loaded ? '✅' : '❌';
    console.log(`${idx + 1}. ${status} ${img.alt} (${img.naturalSize})`);
    console.log(`   ${img.src}...`);
  });

  // Take screenshot
  await page.screenshot({ path: 'logs/community-page-images.png', fullPage: true });
  console.log('\n📸 Screenshot saved to logs/community-page-images.png');

  console.log('\n⏸️  Browser will stay open for 30 seconds...');
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('\n✨ Test complete!');
}

testCommunityImages().catch(console.error);
