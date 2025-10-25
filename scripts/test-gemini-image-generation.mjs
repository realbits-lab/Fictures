#!/usr/bin/env node

/**
 * Test script for Google Gemini 2.0 Flash image generation
 * Gemini 2.0 Flash can generate images directly in responses
 *
 * Usage: dotenv --file .env.local run node scripts/test-gemini-image-generation.mjs
 */

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testGeminiImageGeneration() {
  console.log('🎨 Starting Gemini 2.0 Flash image generation test...\n');

  try {
    // Validate environment variables
    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing required API key. Set AI_GATEWAY_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY in .env.local');
    }

    // Test prompt
    const prompt = 'Generate an image of a beautiful sunset over a calm ocean with sailboats, cinematic widescreen composition, 16:9 aspect ratio';

    console.log(`📝 Prompt: "${prompt}"`);
    console.log(`🤖 Model: Google Gemini 2.0 Flash`);
    console.log(`📐 Note: Aspect ratio controlled via prompt\n`);

    // Generate response with image
    const { text, experimental_output } = await generateText({
      model: google('gemini-2.0-flash-exp', {
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
      }),
      prompt: prompt,
    });

    console.log(`Response: ${text}\n`);

    // Check if response contains images
    if (experimental_output && Array.isArray(experimental_output)) {
      const images = experimental_output.filter(item => item.type === 'image');

      if (images.length > 0) {
        console.log(`✅ Generated ${images.length} image(s)!\n`);

        // Create output directory
        const outputDir = path.join(__dirname, '..', 'logs', 'generated-images');
        await fs.mkdir(outputDir, { recursive: true });

        // Save each image
        for (let i = 0; i < images.length; i++) {
          const imageData = images[i];
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `gemini-${timestamp}-${i + 1}.png`;
          const filepath = path.join(outputDir, filename);

          // Convert base64 to buffer and save
          const base64Data = imageData.image.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          await fs.writeFile(filepath, buffer);

          console.log(`💾 Image ${i + 1} saved to: ${filepath}`);
          console.log(`📊 File size: ${(buffer.length / 1024).toFixed(2)} KB\n`);
        }

        console.log('🎉 Test completed successfully!');
      } else {
        console.log('⚠️  No images found in response');
        console.log('Note: Gemini 2.0 Flash image generation is experimental and may not always produce images');
      }
    } else {
      console.log('⚠️  No images found in response');
      console.log('Note: Gemini 2.0 Flash image generation is experimental and may not always produce images');
    }

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
testGeminiImageGeneration();
