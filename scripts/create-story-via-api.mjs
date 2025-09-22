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

async function createStoryViaApi() {
  try {
    console.log('📚 Creating a new story via API...\n');

    // Story payload
    const storyPayload = {
      title: "The Chronicles of Tomorrow",
      synopsis: "In a world where time flows differently for each person, a young chronologist discovers they can synchronize with others' temporal streams, revealing a hidden conspiracy that threatens the fabric of reality itself.",
      genre: "Science Fiction",
      targetAudience: "Young Adult",
      narrativePerspective: "third_limited",
      setting: "A futuristic metropolis where time is currency and memories are traded like commodities",
      mainCharacters: [
        {
          name: "Kira Tempus",
          role: "protagonist",
          description: "A 19-year-old chronologist with the rare ability to perceive and manipulate temporal streams",
          motivation: "To uncover the truth about her parents' disappearance and restore temporal balance"
        },
        {
          name: "Dr. Epoch",
          role: "mentor",
          description: "An enigmatic temporal scientist who guides Kira while harboring secrets of his own",
          motivation: "To prevent the collapse of the temporal matrix while protecting his research"
        },
        {
          name: "The Synchronizer",
          role: "antagonist",
          description: "A mysterious figure who seeks to merge all timelines into one, believing it will create utopia",
          motivation: "To eliminate temporal inequality by forcing everyone into a single timestream"
        }
      ],
      themes: ["The nature of time and memory", "Individual identity vs collective consciousness", "The cost of progress"],
      tone: "Thought-provoking with elements of mystery and adventure",
      pacing: "moderate"
    };

    // Make API request to create story
    const apiUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

    console.log(`🔄 Sending POST request to ${apiUrl}/api/stories`);
    console.log('   Using API Key:', API_KEY.substring(0, 20) + '...');

    const response = await fetch(`${apiUrl}/api/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(storyPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    const story = responseData.story || responseData; // Handle both wrapped and unwrapped responses

    console.log('\n✅ Story created successfully!');
    console.log('================================');

    console.log('\n📖 Story Details:');
    console.log('   ID:', story.id);
    console.log('   Title:', story.title);
    console.log('   Genre:', story.genre);
    console.log('   Status:', story.status);
    console.log('   Target Word Count:', story.targetWordCount);
    console.log('   Current Word Count:', story.currentWordCount);
    console.log('   Created At:', new Date(story.createdAt).toLocaleString());
    console.log('   Author ID:', story.authorId);

    const finalStoryId = story.id;
    if (finalStoryId) {
      console.log('\n✨ Story creation completed successfully!');
      console.log('\n📌 Next Steps:');
      console.log('1. View the story at: http://localhost:3000/stories/' + finalStoryId);
      console.log('2. Generate HNS content via API: POST /api/stories/' + finalStoryId + '/generate-hns');
      console.log('3. Add chapters via API: POST /api/stories/' + finalStoryId + '/chapters');
      console.log('4. Generate AI content: POST /api/ai/generate');
    }

    return story;

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
createStoryViaApi()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });