#!/usr/bin/env node

/**
 * Test Script: Gemini 2.5 Flash Image Generation with 16:9 Aspect Ratio
 *
 * Purpose:
 * - Generate images using Google's gemini-2.5-flash-image-preview model
 * - Configure 16:9 landscape aspect ratio via AI SDK Gateway
 * - Verify the generated image dimensions and aspect ratio
 *
 * Requirements:
 * - AI_GATEWAY_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.local
 * - Sharp for image dimension verification
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/test-gemini-image-16-9.mjs
 */

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  model: 'gemini-2.5-flash-image', // Stable version (without -preview)
  aspectRatio: '16:9',
  testPrompt: 'A serene mountain landscape at sunset with dramatic clouds, cinematic widescreen composition, photorealistic',
  outputDir: path.join(__dirname, '../logs/test-images'),
  expectedRatio: 16 / 9,
  ratioTolerance: 0.01, // 1% tolerance for floating point comparison
};

/**
 * Verify aspect ratio with tolerance
 */
function verifyAspectRatio(width, height, expectedRatio, tolerance) {
  const actualRatio = width / height;
  const difference = Math.abs(actualRatio - expectedRatio);
  const percentDiff = (difference / expectedRatio) * 100;

  return {
    width,
    height,
    actualRatio: actualRatio.toFixed(4),
    expectedRatio: expectedRatio.toFixed(4),
    difference: difference.toFixed(4),
    percentDiff: percentDiff.toFixed(2),
    isValid: difference <= tolerance,
  };
}

/**
 * Main test function
 */
async function testGeminiImageGeneration() {
  console.log('🧪 Gemini 2.5 Flash Image - 16:9 Aspect Ratio Test\n');
  console.log('━'.repeat(60));

  // 1. Check API key
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: Missing API key');
    console.error('   Please set AI_GATEWAY_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.local');
    process.exit(1);
  }
  console.log('✓ API key found');

  // 2. Ensure output directory exists
  await fs.mkdir(TEST_CONFIG.outputDir, { recursive: true });
  console.log(`✓ Output directory: ${TEST_CONFIG.outputDir}\n`);

  // 3. Display test configuration
  console.log('📝 Test Configuration:');
  console.log(`   Model: ${TEST_CONFIG.model}`);
  console.log(`   Aspect Ratio: ${TEST_CONFIG.aspectRatio}`);
  console.log(`   Prompt: "${TEST_CONFIG.testPrompt}"\n`);

  // 4. Generate image with 16:9 aspect ratio
  console.log('🎨 Generating image...');
  const startTime = Date.now();

  let result;
  try {
    result = await generateText({
      model: google(TEST_CONFIG.model, {
        apiKey: apiKey,
      }),
      prompt: TEST_CONFIG.testPrompt,
      providerOptions: {
        google: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: TEST_CONFIG.aspectRatio,
          },
        },
      },
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Image generated in ${generationTime}s\n`);
  } catch (error) {
    console.error('❌ Image generation failed:', error.message);
    if (error.cause) {
      console.error('   Cause:', error.cause);
    }
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }

  // 5. Check if image was generated
  if (!result.files || result.files.length === 0) {
    console.error('❌ No image files returned in response');
    console.log('   Text response:', result.text);
    process.exit(1);
  }

  // Find the first image file
  const imageFile = result.files.find(file => file.mediaType.startsWith('image/'));
  if (!imageFile) {
    console.error('❌ No image file found in response');
    console.log(`   Found ${result.files.length} files:`, result.files.map(f => f.mediaType));
    process.exit(1);
  }

  console.log(`✓ Image file found (${imageFile.mediaType})\n`);

  // 6. Save the image
  const timestamp = Date.now();
  const filename = `gemini-test-${timestamp}.png`;
  const filepath = path.join(TEST_CONFIG.outputDir, filename);

  console.log('💾 Saving image...');
  try {
    // Convert uint8Array to Buffer
    const buffer = Buffer.from(imageFile.uint8Array);
    await fs.writeFile(filepath, buffer);
    console.log(`✓ Image saved: ${filepath}\n`);
  } catch (error) {
    console.error('❌ Failed to save image:', error.message);
    process.exit(1);
  }

  // 7. Verify image dimensions with Sharp
  console.log('🔍 Verifying image dimensions...');
  try {
    const metadata = await sharp(filepath).metadata();
    const { width, height, format, size } = metadata;

    console.log('📊 Image Metadata:');
    console.log(`   Format: ${format}`);
    console.log(`   Width: ${width}px`);
    console.log(`   Height: ${height}px`);
    console.log(`   File Size: ${(size / 1024).toFixed(2)} KB\n`);

    // 8. Verify aspect ratio
    console.log('✅ Aspect Ratio Verification:');
    const verification = verifyAspectRatio(
      width,
      height,
      TEST_CONFIG.expectedRatio,
      TEST_CONFIG.ratioTolerance
    );

    console.log(`   Width × Height: ${verification.width} × ${verification.height}`);
    console.log(`   Actual Ratio: ${verification.actualRatio} (${verification.width}:${verification.height})`);
    console.log(`   Expected Ratio: ${verification.expectedRatio} (16:9)`);
    console.log(`   Difference: ${verification.difference} (${verification.percentDiff}%)`);
    console.log(`   Status: ${verification.isValid ? '✓ PASS' : '✗ FAIL'}\n`);

    // 9. Final summary
    console.log('━'.repeat(60));
    if (verification.isValid) {
      console.log('🎉 TEST PASSED - Image has correct 16:9 aspect ratio');
      console.log(`   Generated image: ${filepath}`);
      return true;
    } else {
      console.log('❌ TEST FAILED - Image aspect ratio does not match 16:9');
      console.log(`   Expected: ${TEST_CONFIG.aspectRatio}`);
      console.log(`   Got: ${verification.actualRatio}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to verify image:', error.message);
    process.exit(1);
  }
}

// Run the test
testGeminiImageGeneration()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
