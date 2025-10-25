#!/usr/bin/env node

/**
 * Simple test for Google AI image generation with a technical prompt
 *
 * Usage: dotenv --file .env.local run node scripts/test-google-ai-simple.mjs
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  console.log('🎨 Testing Google AI image generation...\n');

  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      throw new Error('Missing API key');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Simple, clear prompt
    const prompt = 'Create a landscape photograph showing a modern house with large windows, surrounded by trees, 16:9 aspect ratio, professional architectural photography style';

    console.log(`📝 Prompt: "${prompt}"\n`);
    console.log('⏳ Generating...\n');

    const result = await model.generateContent(prompt);
    const response = result.response;

    console.log(`Response: ${response.text()}\n`);

    // Check for images
    let found = false;
    const candidates = response.candidates || [];

    for (const candidate of candidates) {
      if (!candidate.content?.parts) continue;

      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          found = true;

          const outputDir = path.join(__dirname, '..', 'logs', 'generated-images');
          await fs.mkdir(outputDir, { recursive: true });

          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filepath = path.join(outputDir, `gemini-${timestamp}.png`);

          const buffer = Buffer.from(part.inlineData.data, 'base64');
          await fs.writeFile(filepath, buffer);

          console.log(`✅ Image saved: ${filepath}`);
          console.log(`📊 Size: ${(buffer.length / 1024).toFixed(2)} KB`);
        }
      }
    }

    if (!found) {
      console.log('⚠️  No images generated - Gemini may not support image generation with this API key');
      console.log('Gemini 2.0 Flash image generation is still experimental and may be limited');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
