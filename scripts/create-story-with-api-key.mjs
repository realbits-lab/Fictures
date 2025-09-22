#!/usr/bin/env node

import { config } from 'dotenv';
import postgres from 'postgres';

// Load environment variables
config({ path: '.env.local' });

async function createStoryWithApiKey() {
  const sql = postgres(process.env.POSTGRES_URL);

  try {
    console.log('📚 Creating a new story with manager API key...\n');

    // First, get the manager user and their API key
    const managerQuery = await sql`
      SELECT u.id, u.email, u.name, ak.key, ak.name as key_name
      FROM users u
      LEFT JOIN api_keys ak ON u.id = ak.user_id
      WHERE u.email = 'manager@realbits.co'
      ORDER BY ak.created_at DESC
      LIMIT 1
    `;

    if (managerQuery.length === 0) {
      throw new Error('Manager user not found. Please run setup-manager-simple.mjs first.');
    }

    const manager = managerQuery[0];
    console.log('✅ Found manager:', manager.email);
    console.log('   API Key:', manager.key ? `${manager.key.substring(0, 10)}...` : 'Not found');
    console.log('   Key Name:', manager.key_name || 'N/A');

    if (!manager.key) {
      console.log('\n⚠️  No API key found for manager. Creating one...');

      // Generate a new API key
      const apiKey = `sk_${Array.from({ length: 32 }, () =>
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]
      ).join('')}`;

      const newKey = await sql`
        INSERT INTO api_keys (user_id, key, name)
        VALUES (${manager.id}, ${apiKey}, 'Manager Default Key')
        RETURNING key, name
      `;

      manager.key = newKey[0].key;
      manager.key_name = newKey[0].name;
      console.log('✅ Created API key:', `${manager.key.substring(0, 10)}...`);
    }

    // Now create a story using the API endpoint
    console.log('\n🔄 Creating story via API...');

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
    const response = await fetch(`${apiUrl}/api/stories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${manager.key}`
      },
      body: JSON.stringify(storyPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const story = await response.json();
    console.log('\n✅ Story created successfully!');
    console.log('   ID:', story.id);
    console.log('   Title:', story.title);
    console.log('   Genre:', story.genre);
    console.log('   Status:', story.status);

    // Verify in database
    const dbStory = await sql`
      SELECT id, title, user_id, created_at
      FROM stories
      WHERE id = ${story.id}
    `;

    if (dbStory.length > 0) {
      console.log('\n✅ Story confirmed in database:');
      console.log('   Created at:', new Date(dbStory[0].created_at).toLocaleString());
      console.log('   User ID:', dbStory[0].user_id);
    }

    await sql.end();
    return story;

  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    throw error;
  }
}

// Execute
createStoryWithApiKey()
  .then((story) => {
    console.log('\n✨ Story creation completed successfully!');
    console.log('\nYou can now:');
    console.log('1. View the story at http://localhost:3000/stories/' + story.id);
    console.log('2. Generate content using the HNS pipeline');
    console.log('3. Add chapters and scenes through the API');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });