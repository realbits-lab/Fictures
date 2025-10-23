import { chromium } from '@playwright/test';

async function checkBrokenImages() {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/reading...');
  await page.goto('http://localhost:3000/reading', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for page to fully load
  await page.waitForTimeout(3000);

  // Check for broken images
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map(img => ({
      src: img.src,
      alt: img.alt,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      currentSrc: img.currentSrc,
      isBroken: img.complete && img.naturalWidth === 0
    }));
  });

  console.log('\n=== IMAGE ANALYSIS ===');
  console.log(`Total images: ${images.length}`);

  const brokenImages = images.filter(img => img.isBroken);
  console.log(`Broken images: ${brokenImages.length}`);

  if (brokenImages.length > 0) {
    console.log('\n❌ Broken Images Found:');
    brokenImages.forEach((img, idx) => {
      console.log(`\n${idx + 1}. ${img.alt || 'No alt text'}`);
      console.log(`   Source: ${img.src}`);
      console.log(`   Current Src: ${img.currentSrc}`);
    });
  }

  // Get all images info
  console.log('\n=== ALL IMAGES ===');
  images.forEach((img, idx) => {
    const status = img.isBroken ? '❌ BROKEN' : '✅ OK';
    console.log(`${idx + 1}. ${status} - ${img.alt || 'No alt'} (${img.naturalWidth}x${img.naturalHeight})`);
    console.log(`   ${img.src.substring(0, 80)}...`);
  });

  console.log('\nBrowser will stay open for 60 seconds. Press Ctrl+C to close earlier.');
  await page.waitForTimeout(60000);

  await browser.close();
}

checkBrokenImages().catch(console.error);
