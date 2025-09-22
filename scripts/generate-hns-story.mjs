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
    console.log('🚀 Starting HNS story generation...\n');

    const storyPrompt = `Create an epic science fiction story called "The Quantum Architects" about a team of scientists who discover they can manipulate reality through quantum mechanics. The story should explore themes of power, responsibility, and the nature of reality itself. Include compelling characters with distinct personalities and vivid futuristic settings.`;

    const apiUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    console.log(`📡 Sending POST request to ${apiUrl}/api/stories/generate-hns`);
    console.log('   Using API Key:', API_KEY.substring(0, 20) + '...');
    console.log('   Story Prompt:', storyPrompt.substring(0, 100) + '...\n');

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
            try {
              const data = JSON.parse(line.slice(6));

              if (data.phase === 'progress') {
                console.log(`🔄 ${data.data.step}: ${data.data.message}`);
              } else if (data.phase === 'hns_complete') {
                console.log('✅ HNS structure generated successfully!');
                storyId = data.data.hnsDocument?.story?.story_id;
                if (storyId) {
                  console.log(`   Story ID: ${storyId}`);
                }
              } else if (data.phase === 'complete') {
                console.log('\n🎉 Story generation completed successfully!');
                finalResult = data.data;
                storyId = data.data.storyId;

                console.log('================================');
                console.log('📖 Final Story Details:');
                console.log(`   Story ID: ${finalResult.storyId}`);
                console.log(`   Title: ${finalResult.story?.title || finalResult.hnsDocument?.story?.title}`);
                console.log(`   Parts: ${finalResult.hnsDocument?.story?.parts?.length || 0}`);
                console.log(`   Characters: ${finalResult.characters?.length || 0}`);
                console.log(`   Settings: ${finalResult.settings?.length || 0}`);

                if (finalResult.characters?.length > 0) {
                  console.log('\n👥 Characters:');
                  finalResult.characters.forEach(char => {
                    console.log(`   - ${char.name} ${char.imageUrl ? '(with image)' : '(no image)'}`);
                  });
                }

                if (finalResult.settings?.length > 0) {
                  console.log('\n🏞️  Settings:');
                  finalResult.settings.forEach(setting => {
                    console.log(`   - ${setting.name} ${setting.imageUrl ? '(with image)' : '(no image)'}`);
                  });
                }
              } else if (data.phase === 'error') {
                console.error('❌ Error:', data.error);
                throw new Error(data.error);
              }
            } catch (parseError) {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
    }

    if (storyId) {
      console.log('\n✨ HNS Story generation completed successfully!');
      console.log('\n📌 Next Steps:');
      console.log(`1. View the story at: http://localhost:3000/stories/${storyId}`);
      console.log(`2. Edit the story at: http://localhost:3000/write/${storyId}`);
      console.log('\n🔍 Verification checks will now begin...');

      return {
        storyId,
        finalResult
      };
    } else {
      throw new Error('Story ID not received from API response');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Provide helpful debugging info
    if (error.message.includes('fetch')) {
      console.log('\n💡 Tip: Make sure the development server is running:');
      console.log('   dotenv --file .env.local run pnpm dev');
    }

    throw error;
  }
}

// Execute
generateHNSStory()
  .then(({ storyId, finalResult }) => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });