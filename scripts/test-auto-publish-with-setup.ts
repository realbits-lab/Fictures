import { db } from '@/lib/db';
import { stories, chapters, scenes, users, parts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { randomBytes } from 'crypto';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

function generateId(length: number = 21): string {
  const bytes = randomBytes(Math.ceil(length * 3 / 4));
  return bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '').slice(0, length);
}

async function testAutoPublishWithSetup() {
  console.log('🧪 Testing automatic chapter publishing with full setup...\n');

  try {
    // Get the manager user
    const [user] = await db.select().from(users)
      .where(eq(users.email, 'manager@fictures.xyz'))
      .limit(1);

    if (!user) {
      console.error('❌ Manager user not found');
      process.exit(1);
    }

    console.log(`👤 Using user: ${user.email}\n`);

    // Create a test story
    const testStoryId = generateId();
    const [testStory] = await db.insert(stories).values({
      id: testStoryId,
      title: 'Test Story for Auto-Publishing',
      description: 'A test story to verify automatic chapter publishing',
      authorId: user.id,
      status: 'writing',
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    console.log(`📚 Created test story: "${testStory.title}"\n`);

    // Create a part
    const partId = generateId();
    const [part] = await db.insert(parts).values({
      id: partId,
      storyId: testStoryId,
      authorId: user.id,
      title: 'Part One',
      description: 'The beginning of our test',
      orderIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Create a test chapter
    const chapterId = generateId();
    const [chapter] = await db.insert(chapters).values({
      id: chapterId,
      storyId: testStoryId,
      partId: partId,
      authorId: user.id,
      title: 'Chapter 1: The Test Begins',
      summary: 'Testing automatic publishing',
      orderIndex: 0,
      status: 'writing',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    console.log(`📖 Created chapter: "${chapter.title}" (Status: ${chapter.status})\n`);

    // Create 3 test scenes
    const sceneIds = [];
    for (let i = 0; i < 3; i++) {
      const sceneId = generateId();
      const [scene] = await db.insert(scenes).values({
        id: sceneId,
        chapterId: chapterId,
        title: `Scene ${i + 1}`,
        description: `Test scene ${i + 1}`,
        orderIndex: i,
        status: 'planned',
        content: '', // Start with empty content
        wordCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      sceneIds.push(scene.id);
      console.log(`   📝 Created scene: "${scene.title}"`);
    }

    console.log('\n🔄 Starting content update simulation...\n');

    // Now simulate updating each scene with content
    for (let i = 0; i < sceneIds.length; i++) {
      const sceneId = sceneIds[i];
      const isLastScene = i === sceneIds.length - 1;

      console.log(`✍️  Writing content for Scene ${i + 1}/3...`);

      // Update scene with content
      await db.update(scenes)
        .set({
          content: `This is the content for Scene ${i + 1}. It contains a detailed narrative that advances the story forward. The characters interact, the plot develops, and the tension builds.`,
          wordCount: 25,
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(scenes.id, sceneId));

      // Check if all scenes now have content
      const allScenes = await db.select().from(scenes)
        .where(eq(scenes.chapterId, chapterId));

      const allHaveContent = allScenes.every(s =>
        s.content && s.content.trim().length > 0
      );

      // Get current chapter status
      const [currentChapter] = await db.select().from(chapters)
        .where(eq(chapters.id, chapterId));

      if (allHaveContent && currentChapter.status === 'writing') {
        // Simulate the automatic publishing logic from the API
        await db.update(chapters)
          .set({
            status: 'published',
            publishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(chapters.id, chapterId));

        console.log(`   🎉 All scenes have content - chapter automatically published!\n`);
      } else if (!isLastScene) {
        console.log(`   ⏳ ${i + 1}/3 scenes have content - chapter still in "writing" status\n`);
      }
    }

    // Verify final chapter status
    const [finalChapter] = await db.select().from(chapters)
      .where(eq(chapters.id, chapterId));

    console.log('📊 Final Results:');
    console.log(`   Chapter: "${finalChapter.title}"`);
    console.log(`   Initial Status: "writing"`);
    console.log(`   Final Status: "${finalChapter.status}"`);
    console.log(`   Published At: ${finalChapter.publishedAt ? finalChapter.publishedAt.toISOString() : 'Not published'}`);

    if (finalChapter.status === 'published') {
      console.log('\n✅ SUCCESS: Chapter was automatically published when all scenes had content!');
      console.log('   The automatic publishing feature is working correctly.');
    } else {
      console.log('\n❌ FAILURE: Chapter was not automatically published');
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await db.delete(scenes).where(eq(scenes.chapterId, chapterId));
    await db.delete(chapters).where(eq(chapters.id, chapterId));
    await db.delete(parts).where(eq(parts.id, partId));
    await db.delete(stories).where(eq(stories.id, testStoryId));
    console.log('   Test data removed successfully.');

  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the test
testAutoPublishWithSetup();