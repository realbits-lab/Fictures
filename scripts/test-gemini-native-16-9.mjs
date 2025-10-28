#!/usr/bin/env node

/**
 * Test Script: Direct Google Generative AI SDK Test for 16:9 Aspect Ratio
 *
 * Purpose:
 * - Test Gemini image generation using native Google Generative AI SDK
 * - Verify if aspectRatio parameter works at the API level
 * - Bypass AI SDK to isolate the issue
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/test-gemini-native-16-9.mjs
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_CONFIG = {
  model: 'gemini-2.5-flash-image',
  aspectRatio: '16:9',
  testPrompt: 'A serene mountain landscape at sunset with dramatic clouds, cinematic widescreen composition, photorealistic',
  outputDir: path.join(__dirname, '../logs/test-images'),
  expectedRatio: 16 / 9,
  ratioTolerance: 0.03, // 3% tolerance (Google may use close approximations like 7:4 = 1.75 vs 16:9 = 1.78)
};

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

async function testNativeGeminiAPI() {
  console.log('🧪 Native Google Generative AI SDK - 16:9 Test\n');
  console.log('━'.repeat(60));

  // 1. Check API key
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: Missing GOOGLE_GENERATIVE_AI_API_KEY');
    console.log('   AI_GATEWAY_API_KEY:', process.env.AI_GATEWAY_API_KEY ? 'EXISTS (but not usable with native SDK)' : 'NOT FOUND');
    process.exit(1);
  }
  console.log('✓ GOOGLE_GENERATIVE_AI_API_KEY found (length:', apiKey.length + ')');

  // 2. Ensure output directory
  await fs.mkdir(TEST_CONFIG.outputDir, { recursive: true });
  console.log(`✓ Output directory: ${TEST_CONFIG.outputDir}\n`);

  // 3. Initialize Google Generative AI
  console.log('📝 Test Configuration:');
  console.log(`   Model: ${TEST_CONFIG.model}`);
  console.log(`   Aspect Ratio: ${TEST_CONFIG.aspectRatio}`);
  console.log(`   Prompt: "${TEST_CONFIG.testPrompt}"\n`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: TEST_CONFIG.model,
  });

  // 4. Generate image with aspect ratio config
  console.log('🎨 Generating image with native SDK...');
  const startTime = Date.now();

  try {
    const result = await model.generateContent({
      contents: [{
        parts: [{
          text: TEST_CONFIG.testPrompt
        }]
      }],
      generationConfig: {
        responseModalities: ['Image'],
        imageConfig: {
          aspectRatio: TEST_CONFIG.aspectRatio,
        },
      },
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ API call completed in ${generationTime}s\n`);

    // 5. Extract image from response
    const response = await result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      console.error('❌ No candidates in response');
      console.log('Response:', JSON.stringify(response, null, 2));
      process.exit(1);
    }

    console.log(`✓ Found ${candidates.length} candidate(s)`);

    // Find image part
    const candidate = candidates[0];
    const imagePart = candidate.content.parts.find(part => part.inlineData);

    if (!imagePart) {
      console.error('❌ No image data found in response');
      console.log('Parts:', JSON.stringify(candidate.content.parts, null, 2));
      process.exit(1);
    }

    console.log(`✓ Image found (${imagePart.inlineData.mimeType})\n`);

    // 6. Save image
    const timestamp = Date.now();
    const filename = `gemini-native-${timestamp}.png`;
    const filepath = path.join(TEST_CONFIG.outputDir, filename);

    console.log('💾 Saving image...');
    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    await fs.writeFile(filepath, imageBuffer);
    console.log(`✓ Image saved: ${filepath}\n`);

    // 7. Verify dimensions
    console.log('🔍 Verifying image dimensions...');
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
    console.log(`   Actual Ratio: ${verification.actualRatio}`);
    console.log(`   Expected Ratio: ${verification.expectedRatio} (16:9)`);
    console.log(`   Difference: ${verification.difference} (${verification.percentDiff}%)`);
    console.log(`   Status: ${verification.isValid ? '✓ PASS' : '✗ FAIL'}\n`);

    // 9. Summary
    console.log('━'.repeat(60));
    if (verification.isValid) {
      console.log('🎉 TEST PASSED - Native API supports 16:9 aspect ratio');
      console.log(`   Generated image: ${filepath}`);
      return true;
    } else {
      console.log('❌ TEST FAILED - Image not 16:9');
      console.log(`   This suggests the aspect ratio parameter may not be working`);
      console.log(`   or requires different configuration`);
      return false;
    }
  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testNativeGeminiAPI()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
