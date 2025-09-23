#!/usr/bin/env tsx

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const API_BASE_URL = 'http://localhost:3000';

async function generateNewStory() {
  console.log('🎨 Generating New Story with Image...\n');

  try {
    // Interesting story prompt for testing
    const storyPrompt = `I want to write an epic fantasy adventure about a young alchemist named Lyra
    who discovers she can transform emotions into physical crystals. Set in the floating city of
    Celestia where emotions are currency, she must uncover a conspiracy that threatens to drain
    all joy from the world. The story should have themes of emotional intelligence, the value of
    feelings, and finding balance between logic and emotion.`;

    console.log('📝 Story Prompt:', storyPrompt);
    console.log('\n🚀 Generating story with AI and image...\n');

    // First, we need to authenticate - using the session from logged-in user
    // Since we're using localhost, we'll need to get the session cookie
    const response = await fetch(`${API_BASE_URL}/api/stories/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any needed auth headers here
      },
      body: JSON.stringify({
        prompt: storyPrompt,
        language: 'English'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate story: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ Story Generation Complete!\n');
    console.log('📖 Story Details:');
    console.log('  - ID:', result.story?.id);
    console.log('  - Title:', result.story?.title || result.story?.databaseStory?.title);
    console.log('  - Genre:', result.story?.genre || result.story?.databaseStory?.genre);
    console.log('  - Status:', result.generationStatus);

    // Check for story image
    const dbStory = result.story?.databaseStory;
    if (dbStory) {
      console.log('\n🖼️ Story Image Information:');
      console.log('  - Cover Image URL:', dbStory.coverImage || 'Not generated');

      if (dbStory.hnsData?.storyImage) {
        console.log('  - Image Details:');
        console.log('    • URL:', dbStory.hnsData.storyImage.url);
        console.log('    • Method:', dbStory.hnsData.storyImage.method);
        console.log('    • Style:', dbStory.hnsData.storyImage.style);
        console.log('    • Generated At:', dbStory.hnsData.storyImage.generatedAt);

        // Check if it's a real image or placeholder
        if (dbStory.hnsData.storyImage.url?.includes('picsum')) {
          console.log('    • Type: Placeholder image');
        } else if (dbStory.hnsData.storyImage.url?.includes('blob.vercel-storage')) {
          console.log('    • Type: AI-generated image stored in Vercel Blob');
        } else {
          console.log('    • Type: AI-generated image');
        }
      } else {
        console.log('  - No HNS image data found');
      }
    }

    // Check generated content
    if (result.story?.characters?.length > 0) {
      console.log(`\n👥 Generated ${result.story.characters.length} characters:`);
      result.story.characters.forEach((char: any) => {
        console.log(`  - ${char.parsedData?.name || char.id}`);
      });
    }

    if (result.story?.places?.length > 0) {
      console.log(`\n📍 Generated ${result.story.places.length} places:`);
      result.story.places.forEach((place: any) => {
        console.log(`  - ${place.parsedData?.name || place.name}`);
      });
    }

    if (result.story?.parts?.length > 0) {
      console.log(`\n📚 Generated ${result.story.parts.length} parts:`);
      result.story.parts.forEach((part: any) => {
        console.log(`  - Part ${part.orderIndex}: ${part.title}`);
      });
    }

    console.log('\n✨ Story generation successful!');

    // Return the story ID for viewing
    const storyId = result.story?.id;
    if (storyId) {
      console.log('\n🔗 View your story at:');
      console.log(`   ${API_BASE_URL}/write/story/${storyId}`);
      console.log(`   ${API_BASE_URL}/stories`);
    }

    return storyId;

  } catch (error) {
    console.error('❌ Story generation failed:', error);
    return null;
  }
}

// Run the generation
console.log('========================================');
console.log('   New Story Generation with Image');
console.log('========================================\n');

generateNewStory()
  .then((storyId) => {
    if (storyId) {
      console.log('\n🎉 Success! Your new story with image has been created.');
    } else {
      console.log('\n⚠️ Story generation completed with issues.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });