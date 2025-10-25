#!/usr/bin/env node

/**
 * Test script for Google AI (Gemini) image generation
 * Uses Google Generative AI API with direct API key authentication
 *
 * Note: This uses the @google/generative-ai package directly
 * since @ai-sdk/google doesn't support image generation yet
 *
 * Usage: dotenv --file .env.local run node scripts/test-google-ai-image.mjs
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testGoogleAIImageGeneration() {
  console.log('🎨 Starting Google AI (Gemini) image generation test...\n');

  try {
    // Validate environment variables
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY or AI_GATEWAY_API_KEY in .env.local');
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use Gemini 2.0 Flash Exp which supports image generation
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
      }
    });

    // Test prompt - explicitly request 16:9 aspect ratio
    const prompt = 'Generate a beautiful sunset over a calm ocean with sailboats, cinematic widescreen composition. Use 16:9 aspect ratio, landscape orientation.';

    console.log(`📝 Prompt: "${prompt}"`);
    console.log(`🤖 Model: Gemini 2.0 Flash Exp`);
    console.log(`📐 Requested: 16:9 aspect ratio (via prompt)\n`);

    console.log('⏳ Generating image (this may take 10-30 seconds)...\n');

    // Generate content with image
    const result = await model.generateContent(prompt);
    const response = result.response;

    console.log(`Response text: ${response.text()}\n`);

    // Check for images in the response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      console.log('❌ No candidates found in response');
      return;
    }

    let imageCount = 0;
    const outputDir = path.join(__dirname, '..', 'logs', 'generated-images');
    await fs.mkdir(outputDir, { recursive: true });

    for (const candidate of candidates) {
      if (!candidate.content || !candidate.content.parts) continue;

      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          imageCount++;

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `gemini-ai-${timestamp}-${imageCount}.png`;
          const filepath = path.join(outputDir, filename);

          // Convert base64 to buffer and save
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          await fs.writeFile(filepath, buffer);

          console.log(`✅ Image ${imageCount} generated successfully!`);
          console.log(`💾 Saved to: ${filepath}`);
          console.log(`📊 File size: ${(buffer.length / 1024).toFixed(2)} KB\n`);
        }
      }
    }

    if (imageCount === 0) {
      console.log('⚠️  No images found in response');
      console.log('Note: Gemini image generation is experimental and may not always produce images');
      console.log('Try running the script again or adjust the prompt');
    } else {
      console.log(`🎉 Test completed successfully! Generated ${imageCount} image(s)`);
    }

  } catch (error) {
    console.error('❌ Error generating image:', error.message);

    if (error.response) {
      console.error('\n📋 Response:', error.response);
    }

    if (error.stack) {
      console.error('\n📋 Stack:', error.stack);
    }

    console.error('\n💡 Troubleshooting:');
    console.error('  1. Verify GOOGLE_GENERATIVE_AI_API_KEY is set in .env.local');
    console.error('  2. Ensure your API key has access to Gemini 2.0 Flash Exp');
    console.error('  3. Check that your API key has image generation enabled');
    console.error('  4. Try a different prompt or model');

    process.exit(1);
  }
}

// Run the test
testGoogleAIImageGeneration();
