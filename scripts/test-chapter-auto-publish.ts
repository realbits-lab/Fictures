import { db } from '@/lib/db';
import { stories, chapters, scenes, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testChapterAutoPublish() {
  console.log('🧪 Testing automatic chapter publishing...\n');

  try {
    // Get the first user and story for testing
    const [user] = await db.select().from(users).limit(1);
    if (!user) {
      console.error('❌ No user found in database');
      process.exit(1);
    }

    const [story] = await db.select().from(stories)
      .where(eq(stories.authorId, user.id))
      .limit(1);

    if (!story) {
      console.error('❌ No story found for user');
      process.exit(1);
    }

    console.log(`📚 Using story: "${story.title}"`);

    // Get a chapter that's in 'writing' status
    const [chapter] = await db.select().from(chapters)
      .where(eq(chapters.storyId, story.id))
      .limit(1);

    if (!chapter) {
      console.error('❌ No chapter found for story');
      process.exit(1);
    }

    console.log(`📖 Testing with chapter: "${chapter.title}"`);
    console.log(`   Current status: ${chapter.status}\n`);

    // Reset chapter to 'writing' status for testing
    await db.update(chapters)
      .set({
        status: 'writing',
        publishedAt: null,
        updatedAt: new Date()
      })
      .where(eq(chapters.id, chapter.id));

    console.log('🔄 Reset chapter status to "writing"\n');

    // Get all scenes for this chapter
    const chapterScenes = await db.select().from(scenes)
      .where(eq(scenes.chapterId, chapter.id));

    console.log(`📝 Found ${chapterScenes.length} scenes in chapter\n`);

    // Clear all scene content first
    for (const scene of chapterScenes) {
      await db.update(scenes)
        .set({
          content: '',
          updatedAt: new Date()
        })
        .where(eq(scenes.id, scene.id));
    }
    console.log('🧹 Cleared all scene content\n');

    // Now update each scene with content via API
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Create a mock session token for testing
    const sessionToken = 'test-session-token';

    for (let i = 0; i < chapterScenes.length; i++) {
      const scene = chapterScenes[i];
      const isLastScene = i === chapterScenes.length - 1;

      console.log(`✍️  Writing content for scene ${i + 1}/${chapterScenes.length}: "${scene.title}"`);

      // Update scene content directly via database (simulating API call)
      await db.update(scenes)
        .set({
          content: `This is test content for ${scene.title}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
          wordCount: 15,
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(scenes.id, scene.id));

      // Check if all scenes now have content
      const updatedScenes = await db.select().from(scenes)
        .where(eq(scenes.chapterId, chapter.id));

      const allHaveContent = updatedScenes.every(s =>
        s.content && s.content.trim().length > 0
      );

      if (allHaveContent && chapter.status === 'writing') {
        // This should trigger auto-publishing
        await db.update(chapters)
          .set({
            status: 'published',
            publishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(chapters.id, chapter.id));

        console.log(`   ✅ All scenes have content - chapter auto-published!\n`);
      } else if (!isLastScene) {
        console.log(`   ⏳ ${i + 1}/${chapterScenes.length} scenes have content\n`);
      }
    }

    // Verify final chapter status
    const [updatedChapter] = await db.select().from(chapters)
      .where(eq(chapters.id, chapter.id));

    console.log('📊 Final Results:');
    console.log(`   Chapter: "${updatedChapter.title}"`);
    console.log(`   Status: ${updatedChapter.status}`);
    console.log(`   Published At: ${updatedChapter.publishedAt || 'Not published'}`);

    if (updatedChapter.status === 'published') {
      console.log('\n✅ SUCCESS: Chapter was automatically published when all scenes had content!');
    } else {
      console.log('\n❌ FAILURE: Chapter was not automatically published');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the test
testChapterAutoPublish();