#!/usr/bin/env tsx

import { config } from 'dotenv';
import { db } from '../src/lib/db';
import { users, stories } from '../src/lib/db/schema';
import { nanoid } from 'nanoid';
import { generateStoryFromPrompt } from '../src/lib/ai/story-development';

// Load environment variables
config({ path: '.env.local' });

async function createUserAndStory() {
  console.log('🚀 Creating user and generating story with image...\n');

  try {
    // Create a test user
    const userId = nanoid();
    const testUser = {
      id: userId,
      email: 'test@fictures.com',
      name: 'Test User',
      image: null,
      status: 'active' as const,
      planType: 'free' as const,
      credits: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('👤 Creating test user...');
    await db.insert(users).values(testUser);
    console.log('✅ User created:', testUser.email);

    // Story prompt
    const storyPrompt = `I want to write an epic fantasy adventure about a young alchemist named Lyra
    who discovers she can transform emotions into physical crystals. Set in the floating city of
    Celestia where emotions are currency, she must uncover a conspiracy that threatens to drain
    all joy from the world. The story should have themes of emotional intelligence, the value of
    feelings, and finding balance between logic and emotion.`;

    console.log('\n📝 Story Prompt:', storyPrompt);
    console.log('\n🎨 Generating story with image...\n');

    // Generate story directly using the story development function
    const story = await generateStoryFromPrompt(storyPrompt, userId, 'English');

    console.log('\n✅ Story Generation Complete!\n');
    console.log('📖 Story Details:');
    console.log('  - ID:', story.id);
    console.log('  - Title:', story.title);
    console.log('  - Genre:', story.genre);

    // Check the database for the generated story
    const [dbStory] = await db.select().from(stories).where((s) => s.id === story.id);

    if (dbStory) {
      console.log('\n🖼️ Story Image Information:');
      console.log('  - Cover Image URL:', dbStory.coverImage || 'Not generated');

      if (dbStory.hnsData && typeof dbStory.hnsData === 'object' && 'storyImage' in dbStory.hnsData) {
        const hnsData = dbStory.hnsData as any;
        console.log('  - Image Details:');
        console.log('    • URL:', hnsData.storyImage.url);
        console.log('    • Method:', hnsData.storyImage.method);
        console.log('    • Style:', hnsData.storyImage.style);
        console.log('    • Generated At:', hnsData.storyImage.generatedAt);

        // Check if it's a real image or placeholder
        if (hnsData.storyImage.url?.includes('picsum')) {
          console.log('    • Type: Placeholder image');
        } else if (hnsData.storyImage.url?.includes('blob.vercel-storage')) {
          console.log('    • Type: AI-generated image stored in Vercel Blob');
        } else {
          console.log('    • Type: AI-generated image');
        }
      } else {
        console.log('  - No HNS image data found');
      }
    }

    // Display generated content summary
    if (story.characters?.length > 0) {
      console.log(`\n👥 Generated ${story.characters.length} characters`);
    }

    if (story.places?.length > 0) {
      console.log(`📍 Generated ${story.places.length} places`);
    }

    if (story.partSpecifications?.length > 0) {
      console.log(`📚 Generated ${story.partSpecifications.length} parts`);
    }

    console.log('\n✨ Story generation successful!');
    console.log('\n🔗 View your story at:');
    console.log(`   http://localhost:3000/write/story/${story.id}`);
    console.log(`   http://localhost:3000/stories (after login)`);

    return story.id;

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Run the script
console.log('========================================');
console.log('   Create User and Generate Story');
console.log('========================================\n');

createUserAndStory()
  .then((storyId) => {
    if (storyId) {
      console.log('\n🎉 Success! Story created with ID:', storyId);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });