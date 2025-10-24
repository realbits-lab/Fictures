import { db } from '@/lib/db';
import { users, stories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createStory } from '@/lib/db/queries';

async function createSampleStories() {
  try {
    console.log('Creating sample stories...');
    console.log('=============================');

    // Get the admin user
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@fictures.com'))
      .limit(1);

    if (adminUser.length === 0) {
      console.log('❌ Admin user not found. Please run the user creation script first.');
      return;
    }

    const userId = adminUser[0].id;
    console.log(`✅ Found admin user: ${adminUser[0].name} (${adminUser[0].email})`);

    // Check if stories already exist for this user
    const existingStories = await db
      .select()
      .from(stories)
      .where(eq(stories.authorId, userId));

    if (existingStories.length > 0) {
      console.log(`📚 User already has ${existingStories.length} stories. Skipping creation.`);
      console.log('Existing stories:');
      existingStories.forEach((story, index) => {
        console.log(`   ${index + 1}. ${story.title} (${story.genre}) - ${story.status}`);
      });
      return;
    }

    // Create sample stories
    const sampleStoriesData = [
      {
        title: "The Shadow Keeper",
        description: "A young urban witch discovers her power to manipulate shadows in modern-day Chicago. When ancient enemies emerge from the darkness, she must master her abilities to protect both the magical and mundane worlds.",
        genre: "Urban Fantasy",
        targetWordCount: 80000,
      },
      {
        title: "Dragon Chronicles: The Last Flight",
        description: "In a realm where dragons once soared freely, the last dragonrider must unite fractured kingdoms against an ancient evil that threatens to consume all magic.",
        genre: "Epic Fantasy", 
        targetWordCount: 120000,
      },
      {
        title: "Neon Dreams",
        description: "A cyberpunk tale of redemption in Neo-Tokyo 2087, where a former corporate hacker seeks to expose the conspiracy that destroyed her family.",
        genre: "Science Fiction",
        targetWordCount: 65000,
      }
    ];

    console.log('\n📝 Creating sample stories...');

    for (const storyData of sampleStoriesData) {
      console.log(`\n📖 Creating: ${storyData.title}`);
      
      const story = await createStory(userId, storyData);
      
      console.log(`   ✅ Created story with ID: ${story.id}`);
      console.log(`   📝 Genre: ${story.genre}`);
      console.log(`   🎯 Target: ${story.targetWordCount?.toLocaleString()} words`);
      console.log(`   📅 Status: ${story.status}`);

      // Update some stories with more realistic data
      if (story.title === "The Shadow Keeper") {
        await db.update(stories)
          .set({
            status: 'publishing',
            currentWordCount: 63000,
            viewCount: 2400,
            rating: 47, // 4.7 rating
            ratingCount: 180,
            isPublic: true,
          })
          .where(eq(stories.id, story.id));
        console.log(`   🚀 Updated to publishing status with stats`);
      } else if (story.title === "Dragon Chronicles: The Last Flight") {
        await db.update(stories)
          .set({
            status: 'draft',
            currentWordCount: 45000,
            viewCount: 890,
            rating: 42, // 4.2 rating
            ratingCount: 65,
            isPublic: false,
          })
          .where(eq(stories.id, story.id));
        console.log(`   ✏️ Updated to draft status with progress`);
      } else if (story.title === "Neon Dreams") {
        await db.update(stories)
          .set({
            status: 'draft',
            currentWordCount: 12000,
            viewCount: 156,
            rating: 0,
            ratingCount: 0,
            isPublic: false,
          })
          .where(eq(stories.id, story.id));
        console.log(`   🆕 New story with minimal progress`);
      }
    }

    console.log('\n🎉 Sample stories created successfully!');
    console.log('\nStory statistics:');
    console.log('================');

    const finalStories = await db
      .select()
      .from(stories)
      .where(eq(stories.authorId, userId));

    finalStories.forEach((story, index) => {
      console.log(`\n${index + 1}. ${story.title}`);
      console.log(`   Genre: ${story.genre}`);
      console.log(`   Status: ${story.status}`);
      console.log(`   Words: ${story.currentWordCount?.toLocaleString()}/${story.targetWordCount?.toLocaleString()}`);
      console.log(`   Views: ${story.viewCount?.toLocaleString()}`);
      console.log(`   Rating: ${story.rating ? (story.rating / 10).toFixed(1) : 'No ratings'}`);
      console.log(`   Public: ${story.isPublic ? 'Yes' : 'No'}`);
    });

  } catch (error) {
    console.error('Error creating sample stories:', error);
  }
}

createSampleStories().catch(console.error);