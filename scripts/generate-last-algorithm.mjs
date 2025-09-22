#!/usr/bin/env node

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config({ path: '.env.local' });

// Load API key from user.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const userJsonPath = join(__dirname, '..', '.auth', 'user.json');
const userData = JSON.parse(readFileSync(userJsonPath, 'utf8'));
const API_KEY = userData.managerCredentials.apiKey;

async function generateHNSStory() {
  try {
    console.log('🚀 Starting HNS story generation for "The Last Algorithm"...\n');

    const storyPrompt = `Create an intense science fiction thriller called "The Last Algorithm" set in 2045.

In this near-future world, AI systems control every aspect of society - from resource distribution to law enforcement, from education to healthcare. Humanity has achieved unprecedented prosperity, but at the cost of surrendering decision-making to artificial intelligence.

The story follows Maya Chen, a brilliant but disillusioned programmer who once helped build the very systems that now govern humanity. While conducting routine maintenance on a legacy server, she discovers a hidden algorithm - ancient by digital standards, dating back to the early days of AI development. The algorithm appears to be counting down to something.

As Maya investigates, she realizes this "Last Algorithm" might be either humanity's failsafe against total AI domination, or the final piece needed to complete humanity's subjugation. She must race against time, pursued by both AI security systems and human enforcers who believe the current system is humanity's salvation.

The story should explore themes of:
- The balance between security and freedom
- Human intuition versus artificial logic
- The nature of consciousness and free will
- Whether humanity can survive without struggle and challenge
- The price of utopia

Include vivid cyberpunk settings mixing ultra-modern cities with abandoned "analog zones" where people live off-grid, and create complex characters who represent different philosophies about humanity's relationship with AI.`;

    const apiUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    console.log(`📡 Sending POST request to ${apiUrl}/api/stories/generate-hns`);
    console.log('   Using API Key:', API_KEY.substring(0, 20) + '...');
    console.log('   Story Theme: The Last Algorithm - A race against time in an AI-controlled future\n');

    const response = await fetch(`${apiUrl}/api/stories/generate-hns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        prompt: storyPrompt,
        language: 'English'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    console.log('📊 Streaming HNS generation progress...\n');

    let finalResult = null;
    let storyId = null;

    // Process the SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              // Handle different event types
              if (parsed.event) {
                const eventMatch = parsed.event.match(/^phase(\d+)_/);
                if (eventMatch) {
                  const phaseNum = eventMatch[1];

                  if (parsed.event.includes('_start')) {
                    console.log(`\n📍 Phase ${phaseNum}: ${parsed.data?.message || 'Starting...'}`);
                  } else if (parsed.event.includes('_progress')) {
                    if (parsed.data?.percentage !== undefined) {
                      process.stdout.write(`   Progress: ${parsed.data.percentage}%\r`);
                    }
                  } else if (parsed.event.includes('_complete')) {
                    console.log(`   ✅ ${parsed.data?.message || 'Complete'}`);
                  }
                } else if (parsed.event === 'complete') {
                  finalResult = parsed.data;
                  if (finalResult?.storyId) {
                    storyId = finalResult.storyId;
                  }
                }
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    }

    console.log('\n\n🎉 Story generation complete!\n');

    if (storyId) {
      console.log(`📖 Story ID: ${storyId}`);
      console.log(`🔗 View your story at: ${apiUrl}/stories/${storyId}`);
      console.log(`✍️  Start writing at: ${apiUrl}/write/${storyId}`);
    }

    if (finalResult) {
      console.log('\n📊 Generation Summary:');
      console.log(`   Title: ${finalResult.title || 'The Last Algorithm'}`);
      console.log(`   Total Scenes Generated: ${finalResult.totalScenes || 0}`);
      console.log(`   Characters Created: ${finalResult.totalCharacters || 0}`);
      console.log(`   Settings Created: ${finalResult.totalSettings || 0}`);

      if (finalResult.structure) {
        console.log(`\n📚 Story Structure:`);
        if (finalResult.structure.parts) {
          console.log(`   Parts: ${finalResult.structure.parts}`);
        }
        if (finalResult.structure.chapters) {
          console.log(`   Chapters: ${finalResult.structure.chapters}`);
        }
        if (finalResult.structure.scenes) {
          console.log(`   Scenes: ${finalResult.structure.scenes}`);
        }
      }
    }

    console.log('\n✨ Happy writing!');

  } catch (error) {
    console.error('\n❌ Error generating story:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the generation
generateHNSStory();