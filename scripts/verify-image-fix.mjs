import { chromium } from '@playwright/test';

async function verifyImageFix() {
  console.log('Starting browser for verification...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/reading...');
  await page.goto('http://localhost:3000/reading', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for images to load or fail
  await page.waitForTimeout(5000);

  // Check for broken images
  const imageStatus = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map(img => ({
      alt: img.alt,
      src: img.src.substring(0, 100),
      isBroken: img.complete && img.naturalWidth === 0,
      hasError: img.getAttribute('data-error') === 'true'
    }));
  });

  // Check for SVG placeholders
  const svgPlaceholders = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg'));
    return svgs.map(svg => ({
      parent: svg.parentElement?.className || '',
      width: svg.getAttribute('width'),
      height: svg.getAttribute('height')
    }));
  });

  console.log('\n=== VERIFICATION RESULTS ===');
  console.log(`Total images: ${imageStatus.length}`);
  console.log(`Broken images: ${imageStatus.filter(img => img.isBroken).length}`);
  console.log(`SVG placeholders: ${svgPlaceholders.length}`);

  if (imageStatus.filter(img => img.isBroken).length === 0) {
    console.log('\n✅ SUCCESS: No broken images detected!');
  } else {
    console.log('\n❌ FAILURE: Still have broken images:');
    imageStatus.filter(img => img.isBroken).forEach(img => {
      console.log(`  - ${img.alt}`);
      console.log(`    ${img.src}...`);
    });
  }

  if (svgPlaceholders.length > 0) {
    console.log('\n✅ SVG placeholders found:');
    svgPlaceholders.forEach((svg, idx) => {
      console.log(`  ${idx + 1}. Size: ${svg.width}x${svg.height}`);
    });
  }

  console.log('\n=== ALL IMAGES ===');
  imageStatus.forEach((img, idx) => {
    const status = img.isBroken ? '❌ BROKEN' : '✅ OK';
    console.log(`${idx + 1}. ${status} - ${img.alt}`);
  });

  // Take a screenshot for visual verification
  await page.screenshot({ path: 'logs/reading-page-fixed.png', fullPage: true });
  console.log('\n📸 Screenshot saved to logs/reading-page-fixed.png');

  console.log('\nBrowser will stay open for 30 seconds. Press Ctrl+C to close earlier.');
  await page.waitForTimeout(30000);

  await browser.close();
  console.log('Verification complete!');
}

verifyImageFix().catch(console.error);
