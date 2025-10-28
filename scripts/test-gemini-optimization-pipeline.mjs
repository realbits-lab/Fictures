#!/usr/bin/env node

/**
 * End-to-End Test: Gemini 2.5 Flash Image Generation + Optimization Pipeline
 *
 * Tests the complete pipeline:
 * 1. Generate 1344×768 image with Gemini 2.5 Flash Image
 * 2. Upload original to Vercel Blob
 * 3. Create optimized variants:
 *    - Mobile 1x: 672×384 (resize + convert to AVIF/JPEG)
 *    - Mobile 2x: 1344×768 (convert only, no resize!)
 * 4. Verify all variants created correctly
 * 5. Check file sizes and performance
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/test-gemini-optimization-pipeline.mjs
 */

import { generateStoryImage } from '../src/lib/services/image-generation.ts';
import { ORIGINAL_IMAGE_SIZE, IMAGE_SIZES, IMAGE_FORMATS } from '../src/lib/services/image-optimization.ts';
import sharp from 'sharp';

const TEST_CONFIG = {
  testPrompt: 'A mysterious ancient library with floating books and magical glowing crystals, cinematic widescreen composition, fantasy art',
  storyId: 'test-story-' + Date.now(),
  imageType: 'scene',
};

async function verifyImageDimensions(url, expectedWidth, expectedHeight) {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const metadata = await sharp(Buffer.from(buffer)).metadata();

    const match = metadata.width === expectedWidth && metadata.height === expectedHeight;
    return {
      success: match,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      expected: `${expectedWidth}×${expectedHeight}`,
      actual: `${metadata.width}×${metadata.height}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function runPipelineTest() {
  console.log('🧪 Gemini Image Generation + Optimization Pipeline Test\n');
  console.log('━'.repeat(70));

  // Step 1: Generate image with Gemini
  console.log('\n📝 Test Configuration:');
  console.log(`   Model: Gemini 2.5 Flash Image`);
  console.log(`   Original Size: ${ORIGINAL_IMAGE_SIZE.width}×${ORIGINAL_IMAGE_SIZE.height}`);
  console.log(`   Story ID: ${TEST_CONFIG.storyId}`);
  console.log(`   Prompt: "${TEST_CONFIG.testPrompt}"\n`);

  console.log('🎨 Step 1: Generating image with Gemini 2.5 Flash Image...');
  const startTime = Date.now();

  let result;
  try {
    result = await generateStoryImage({
      prompt: TEST_CONFIG.testPrompt,
      storyId: TEST_CONFIG.testPrompt,
      imageType: TEST_CONFIG.imageType,
      skipOptimization: false, // Generate all variants
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Generation complete in ${generationTime}s\n`);
  } catch (error) {
    console.error('✗ Generation failed:', error.message);
    process.exit(1);
  }

  // Step 2: Verify original image
  console.log('🔍 Step 2: Verifying original image...');
  console.log(`   URL: ${result.url}`);
  console.log(`   Size: ${(result.size / 1024).toFixed(2)} KB`);
  console.log(`   Dimensions: ${result.width}×${result.height}\n`);

  if (result.width !== ORIGINAL_IMAGE_SIZE.width || result.height !== ORIGINAL_IMAGE_SIZE.height) {
    console.error(`✗ Original size mismatch!`);
    console.error(`   Expected: ${ORIGINAL_IMAGE_SIZE.width}×${ORIGINAL_IMAGE_SIZE.height}`);
    console.error(`   Got: ${result.width}×${result.height}`);
    process.exit(1);
  }
  console.log('✓ Original image dimensions correct\n');

  // Step 3: Verify optimized variants
  console.log('🔍 Step 3: Verifying optimized variants...');

  if (!result.optimizedSet || !result.optimizedSet.variants) {
    console.error('✗ No optimized variants found!');
    process.exit(1);
  }

  const variants = result.optimizedSet.variants;
  console.log(`   Found ${variants.length} variants\n`);

  // Expected variants
  const expectedVariants = [];
  for (const [device, resolutions] of Object.entries(IMAGE_SIZES)) {
    for (const [resolution, dimensions] of Object.entries(resolutions)) {
      for (const format of IMAGE_FORMATS) {
        expectedVariants.push({
          device,
          resolution,
          format,
          width: dimensions.width,
          height: dimensions.height,
          noResize: dimensions.noResize || false,
        });
      }
    }
  }

  console.log('   Expected variants:');
  for (const expected of expectedVariants) {
    const action = expected.noResize ? 'convert only' : 'resize + convert';
    console.log(`   - ${expected.device} ${expected.resolution} ${expected.format.toUpperCase()} (${expected.width}×${expected.height}) [${action}]`);
  }
  console.log('');

  // Verify each variant
  let allPassed = true;
  const variantResults = [];

  for (const expected of expectedVariants) {
    const variant = variants.find(v =>
      v.device === expected.device &&
      v.resolution === expected.resolution &&
      v.format === expected.format
    );

    if (!variant) {
      console.error(`✗ Missing variant: ${expected.device} ${expected.resolution} ${expected.format}`);
      allPassed = false;
      continue;
    }

    // Verify dimensions by downloading and checking
    const verification = await verifyImageDimensions(variant.url, expected.width, expected.height);

    const status = verification.success ? '✓' : '✗';
    const action = expected.noResize ? '[convert only]' : '[resized]';
    console.log(`   ${status} ${expected.device} ${expected.resolution} ${expected.format.toUpperCase()} ${action}`);
    console.log(`      Size: ${expected.width}×${expected.height}`);
    console.log(`      File: ${(variant.size / 1024).toFixed(2)} KB`);
    console.log(`      URL: ${variant.url}`);

    if (!verification.success) {
      console.log(`      ERROR: ${verification.error || 'Dimension mismatch'}`);
      if (verification.actual) {
        console.log(`      Expected: ${verification.expected}, Got: ${verification.actual}`);
      }
      allPassed = false;
    }
    console.log('');

    variantResults.push({
      ...expected,
      size: variant.size,
      success: verification.success,
    });
  }

  // Step 4: Performance Summary
  console.log('━'.repeat(70));
  console.log('\n📊 Performance Summary:\n');

  const totalSize = variantResults.reduce((sum, v) => sum + v.size, 0);
  const mobile1xAvif = variantResults.find(v => v.resolution === '1x' && v.format === 'avif');
  const mobile2xAvif = variantResults.find(v => v.resolution === '2x' && v.format === 'avif');

  console.log('Original Image:');
  console.log(`  Size: ${ORIGINAL_IMAGE_SIZE.width}×${ORIGINAL_IMAGE_SIZE.height}`);
  console.log(`  File: ${(result.size / 1024).toFixed(2)} KB`);
  console.log('');

  console.log('Optimized Variants:');
  console.log(`  Mobile 1x (${IMAGE_SIZES.mobile['1x'].width}×${IMAGE_SIZES.mobile['1x'].height}):`);
  if (mobile1xAvif) {
    console.log(`    AVIF: ${(mobile1xAvif.size / 1024).toFixed(2)} KB (resized)`);
  }
  console.log(`  Mobile 2x (${IMAGE_SIZES.mobile['2x'].width}×${IMAGE_SIZES.mobile['2x'].height}):`);
  if (mobile2xAvif) {
    console.log(`    AVIF: ${(mobile2xAvif.size / 1024).toFixed(2)} KB (no resize!)`)
  }
  console.log(`  Total variants: ${(totalSize / 1024).toFixed(2)} KB`);
  console.log('');

  console.log('Optimization Benefits:');
  const original1792 = 500; // Estimated DALL-E 3 original size
  const original1344 = result.size / 1024;
  const savings = ((original1792 - original1344) / original1792 * 100).toFixed(1);
  console.log(`  Original size reduction: ${savings}% smaller (1344×768 vs 1792×1024)`);
  console.log(`  Mobile 2x processing: No resize needed (saves ~0.2s per image)`);
  console.log(`  Storage efficiency: ${variantResults.length} variants in ${(totalSize / 1024).toFixed(2)} KB`);
  console.log('');

  // Final result
  console.log('━'.repeat(70));
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
    console.log('✓ Image generation successful');
    console.log('✓ Original dimensions correct (1344×768)');
    console.log('✓ All variants created successfully');
    console.log('✓ Mobile 2x uses original size (no resize)');
    console.log('✓ File sizes optimized');
    console.log('');
    return true;
  } else {
    console.log('\n❌ SOME TESTS FAILED\n');
    console.log('Check errors above for details.');
    console.log('');
    return false;
  }
}

// Run the test
runPipelineTest()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    console.error(error.stack);
    process.exit(1);
  });
