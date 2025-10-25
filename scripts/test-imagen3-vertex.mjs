#!/usr/bin/env node

/**
 * Test script for Google Imagen 3 image generation via Vertex AI
 * Tests widescreen (16:9) aspect ratio image generation using Vercel AI SDK
 *
 * Supported aspect ratios for Imagen 3:
 * - 1:1 (square)
 * - 3:4 (portrait)
 * - 4:3 (landscape)
 * - 9:16 (vertical)
 * - 16:9 (widescreen) ✅
 *
 * Usage: dotenv --file .env.local run node scripts/test-imagen3-vertex.mjs
 */

import { experimental_generateImage as generateImage } from 'ai';
import { vertex } from '@ai-sdk/google-vertex';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImagen3Generation() {
  console.log('🎨 Starting Google Imagen 3 image generation test (Vertex AI)...\n');

  try {
    // Validate environment variables
    const apiKey = process.env.GOOGLE_VERTEX_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GOOGLE_VERTEX_API_KEY in .env.local');
    }

    // Get project ID and location (region) - required for Vertex AI
    // The SDK uses GOOGLE_VERTEX_PROJECT environment variable
    if (!process.env.GOOGLE_VERTEX_PROJECT && !process.env.GOOGLE_VERTEX_PROJECT_ID) {
      throw new Error('Missing GOOGLE_VERTEX_PROJECT or GOOGLE_VERTEX_PROJECT_ID in .env.local');
    }

    // Set the environment variable that the SDK expects
    if (process.env.GOOGLE_VERTEX_PROJECT_ID && !process.env.GOOGLE_VERTEX_PROJECT) {
      process.env.GOOGLE_VERTEX_PROJECT = process.env.GOOGLE_VERTEX_PROJECT_ID;
    }

    const projectId = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';

    console.log(`🔧 Configuration:`);
    console.log(`   - Project ID: ${projectId}`);
    console.log(`   - Location: ${location}\n`);

    // Test prompt
    const prompt = 'A beautiful sunset over a calm ocean with sailboats, cinematic widescreen composition';

    console.log(`📝 Prompt: "${prompt}"`);
    console.log(`📐 Aspect Ratio: 16:9 (widescreen)`);
    console.log(`🤖 Model: Google Imagen 3 (imagen-3.0-generate-001)`);
    console.log(`🔑 Using: Google Vertex AI\n`);

    console.log('⏳ Generating image (this may take 10-30 seconds)...\n');

    // Generate image with Imagen 3
    // The vertex provider will automatically use GOOGLE_VERTEX_PROJECT and GOOGLE_VERTEX_LOCATION env vars
    const { image } = await generateImage({
      model: vertex.image('imagen-3.0-generate-001'),
      prompt: prompt,
      aspectRatio: '16:9', // Widescreen format
      providerOptions: {
        vertex: {
          // Optional: Add more Imagen-specific options here
          // numberOfImages: 1,
          // negativePrompt: 'blurry, low quality',
        },
      },
    });

    console.log('✅ Image generated successfully!\n');

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'logs', 'generated-images');
    await fs.mkdir(outputDir, { recursive: true });

    // Save image with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `imagen3-16-9-${timestamp}.png`;
    const filepath = path.join(outputDir, filename);

    // Convert base64 to buffer and save
    const base64Data = image.base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.writeFile(filepath, buffer);

    console.log(`💾 Image saved to: ${filepath}`);
    console.log(`📊 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
    console.log(`🖼️  Image format: PNG`);

    // Log image metadata if available
    if (image.width && image.height) {
      console.log(`📏 Dimensions: ${image.width}x${image.height}`);
      console.log(`📐 Actual ratio: ${(image.width / image.height).toFixed(2)}:1`);
    }

    console.log('\n🎉 Test completed successfully!');
    console.log(`\nTo view the image, open: ${filepath}`);

  } catch (error) {
    console.error('❌ Error generating image:', error.message);

    if (error.cause) {
      console.error('\n📋 Error details:', error.cause);
    }

    if (error.response) {
      console.error('\n📋 Response:', error.response);
    }

    console.error('\n💡 Troubleshooting:');
    console.error('  1. Verify GOOGLE_VERTEX_API_KEY is set in .env.local');
    console.error('  2. Set GOOGLE_VERTEX_PROJECT or GOOGLE_VERTEX_PROJECT_ID to your Google Cloud project ID');
    console.error('  3. Optionally set GOOGLE_VERTEX_LOCATION (default: us-central1)');
    console.error('  4. Ensure your Google Cloud project has Vertex AI API enabled');
    console.error('  5. Check that billing is enabled for your project');
    console.error('  6. Verify you have permissions to use Imagen models');

    process.exit(1);
  }
}

// Run the test
testImagen3Generation();
