#!/usr/bin/env node

/**
 * Test script for AI image generation (OpenAI DALL-E 3)
 * Tests widescreen (16:9 equivalent) aspect ratio image generation using Vercel AI SDK
 *
 * Note: DALL-E 3 supports specific sizes:
 * - 1024x1024 (square)
 * - 1792x1024 (landscape - approximately 16:9)
 * - 1024x1792 (portrait)
 *
 * Usage: dotenv --file .env.local run node scripts/test-imagen-generation.mjs
 */

import { experimental_generateImage as generateImage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testImagenGeneration() {
  console.log('🎨 Starting AI image generation test (OpenAI DALL-E 3)...\n');

  try {
    // Validate environment variables
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing required API key. Set AI_GATEWAY_API_KEY or OPENAI_API_KEY in .env.local');
    }

    // Configure OpenAI provider with custom API key
    const openaiProvider = createOpenAI({
      apiKey: apiKey,
    });

    // Test prompt
    const prompt = 'A beautiful sunset over a calm ocean with sailboats, cinematic widescreen composition';

    console.log(`📝 Prompt: "${prompt}"`);
    console.log(`📐 Size: 1792x1024 (landscape - approximately 16:9)`);
    console.log(`🤖 Model: OpenAI DALL-E 3`);
    console.log(`🔑 API Key: ${process.env.AI_GATEWAY_API_KEY ? 'AI Gateway' : 'Direct OpenAI'}\n`);

    // Generate image with DALL-E 3
    const { image } = await generateImage({
      model: openaiProvider.image('dall-e-3'),
      prompt: prompt,
      size: '1792x1024', // Landscape format (approximately 16:9)
      providerOptions: {
        openai: {
          style: 'vivid', // 'vivid' or 'natural'
          quality: 'hd', // 'standard' or 'hd'
        },
      },
    });

    console.log('✅ Image generated successfully!\n');

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'logs', 'generated-images');
    await fs.mkdir(outputDir, { recursive: true });

    // Save image with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dalle3-1792x1024-${timestamp}.png`;
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

  } catch (error) {
    console.error('❌ Error generating image:', error.message);

    if (error.cause) {
      console.error('Cause:', error.cause);
    }

    if (error.response) {
      console.error('Response:', error.response);
    }

    process.exit(1);
  }
}

// Run the test
testImagenGeneration();
