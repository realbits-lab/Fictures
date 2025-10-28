#!/usr/bin/env node

/**
 * Simple Gemini 2.5 Flash Image Generation Test
 *
 * Tests just the Gemini image generation with 16:9 aspect ratio
 * to verify it produces 1344×768 images.
 *
 * Usage:
 *   dotenv --file .env.local run node scripts/test-gemini-generation-simple.mjs
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
  testPrompt: 'A magical forest with glowing mushrooms and fireflies, cinematic widescreen composition, fantasy art',
  outputDir: path.join(__dirname, '../logs/test-images'),
  expectedWidth: 1344,
  expectedHeight: 768,
};

async function testGeminiGeneration() {
  console.log('🧪 Gemini 2.5 Flash Image Generation Test\n');
  console.log('━'.repeat(60));

  // Check API key
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    console.error('❌ Missing GOOGLE_GENERATIVE_AI_API_KEY');
    process.exit(1);
  }
  console.log('✓ API key found\n');

  // Ensure output directory
  await fs.mkdir(TEST_CONFIG.outputDir, { recursive: true });

  // Generate image
  console.log('📝 Configuration:');
  console.log(`   Model: ${TEST_CONFIG.model}`);
  console.log(`   Aspect Ratio: ${TEST_CONFIG.aspectRatio}`);
  console.log(`   Expected Size: ${TEST_CONFIG.expectedWidth}×${TEST_CONFIG.expectedHeight}`);
  console.log(`   Prompt: "${TEST_CONFIG.testPrompt}"\n`);

  console.log('🎨 Generating image...');
  const startTime = Date.now();

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: TEST_CONFIG.model });

    const result = await model.generateContent({
      contents: [{
        parts: [{ text: TEST_CONFIG.testPrompt }]
      }],
      generationConfig: {
        responseModalities: ['Image'],
        imageConfig: {
          aspectRatio: TEST_CONFIG.aspectRatio,
        },
      },
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ Generated in ${generationTime}s\n`);

    // Extract image
    const response = await result.response;
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (!imagePart) {
      console.error('❌ No image in response');
      process.exit(1);
    }

    console.log('✓ Image found in response\n');

    // Save image
    const timestamp = Date.now();
    const filename = `gemini-simple-${timestamp}.png`;
    const filepath = path.join(TEST_CONFIG.outputDir, filename);

    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    await fs.writeFile(filepath, imageBuffer);

    console.log('💾 Image saved:', filepath);
    console.log(`   File size: ${(imageBuffer.length / 1024).toFixed(2)} KB\n`);

    // Verify dimensions
    console.log('🔍 Verifying dimensions...');
    const metadata = await sharp(filepath).metadata();

    console.log(`   Width: ${metadata.width}px`);
    console.log(`   Height: ${metadata.height}px`);
    console.log(`   Format: ${metadata.format}`);
    console.log(`   Aspect Ratio: ${(metadata.width / metadata.height).toFixed(4)}\n`);

    // Check if dimensions match
    const dimensionsMatch =
      metadata.width === TEST_CONFIG.expectedWidth &&
      metadata.height === TEST_CONFIG.expectedHeight;

    console.log('━'.repeat(60));
    if (dimensionsMatch) {
      console.log('\n🎉 TEST PASSED!\n');
      console.log(`✓ Generated ${metadata.width}×${metadata.height} image as expected`);
      console.log('✓ Gemini 2.5 Flash Image working correctly');
      console.log('✓ Ready for optimization pipeline\n');
      return true;
    } else {
      console.log('\n⚠️  TEST WARNING\n');
      console.log(`   Expected: ${TEST_CONFIG.expectedWidth}×${TEST_CONFIG.expectedHeight}`);
      console.log(`   Got: ${metadata.width}×${metadata.height}`);
      console.log('   Image generated but dimensions differ from expected\n');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

testGeminiGeneration()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
