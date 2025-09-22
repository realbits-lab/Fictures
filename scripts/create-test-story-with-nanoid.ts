import { nanoid } from 'nanoid';
import { db } from '../src/lib/db';
import { stories, parts, chapters, scenes, users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function createTestStoryWithNanoid() {
  console.log('🚀 Creating test story with nanoid IDs...\n');

  try {
    // Find or create a test user
    let testUser = await db.select().from(users).where(eq(users.email, 'test@example.com')).limit(1);

    let userId: string;
    if (testUser.length === 0) {
      console.log('Creating test user...');
      const newUserId = nanoid();
      await db.insert(users).values({
        id: newUserId,
        email: 'test@example.com',
        name: 'Test User',
      });
      userId = newUserId;
      console.log('✅ Test user created with ID:', userId);
    } else {
      userId = testUser[0].id;
      console.log('✅ Using existing test user:', userId);
    }

    // Create a new story with nanoid
    const storyId = nanoid();
    console.log('\n📚 Creating story with nanoid:', storyId);

    await db.insert(stories).values({
      id: storyId,
      title: 'Cyberpunk Detective Story',
      description: 'A neo-noir thriller in virtual reality',
      genre: 'Science Fiction',
      status: 'active',
      authorId: userId,
    });

    // Create parts with nanoid
    const partIds = [];
    for (let i = 1; i <= 3; i++) {
      const partId = nanoid();
      partIds.push(partId);

      await db.insert(parts).values({
        id: partId,
        title: `Part ${i}`,
        description: `Part ${i} of the story`,
        storyId,
        authorId: userId,
        orderIndex: i,
      });

      console.log(`✅ Created Part ${i} with nanoid:`, partId);
    }

    // Create chapters with nanoid (5 chapters per part)
    const chapterIds = [];
    for (const [partIndex, partId] of partIds.entries()) {
      for (let i = 1; i <= 5; i++) {
        const chapterId = nanoid();
        chapterIds.push(chapterId);

        await db.insert(chapters).values({
          id: chapterId,
          title: `Chapter ${(partIndex * 5) + i}`,
          summary: `Chapter ${(partIndex * 5) + i} summary`,
          storyId,
          partId,
          authorId: userId,
          orderIndex: i,
        });
      }
    }
    console.log(`✅ Created ${chapterIds.length} chapters with nanoid IDs`);

    // Create scenes with nanoid (3 scenes for first chapter)
    const firstChapterId = chapterIds[0];
    const sceneIds = [];
    for (let i = 1; i <= 3; i++) {
      const sceneId = nanoid();
      sceneIds.push(sceneId);

      await db.insert(scenes).values({
        id: sceneId,
        title: `Scene ${i}`,
        content: `Scene ${i} content...`,
        chapterId: firstChapterId,
        orderIndex: i,
      });
    }
    console.log(`✅ Created ${sceneIds.length} scenes with nanoid IDs`);

    // Display summary
    console.log('\n📊 Summary of created IDs:');
    console.log('=====================================');
    console.log('Story ID:', storyId, `(${storyId.length} chars)`);
    console.log('Part IDs:');
    partIds.forEach((id, i) => console.log(`  Part ${i + 1}:`, id, `(${id.length} chars)`));
    console.log('Sample Chapter IDs:');
    chapterIds.slice(0, 3).forEach((id, i) => console.log(`  Chapter ${i + 1}:`, id, `(${id.length} chars)`));
    console.log('Sample Scene IDs:');
    sceneIds.forEach((id, i) => console.log(`  Scene ${i + 1}:`, id, `(${id.length} chars)`));

    console.log('\n✅ All IDs now use nanoid format (21 characters, URL-safe)');
    console.log('🔗 Sample chapter URL would be: /write/' + chapterIds[0]);

    // Verify the data
    const verifyChapters = await db.select({
      id: chapters.id,
      title: chapters.title,
    }).from(chapters).where(eq(chapters.storyId, storyId)).limit(3);

    console.log('\n🔍 Verification - First 3 chapters:');
    verifyChapters.forEach(ch => {
      console.log(`  ${ch.title}: ${ch.id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestStoryWithNanoid()
  .then(() => {
    console.log('\n🎉 Test story created successfully with all nanoid IDs!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Failed:', error);
    process.exit(1);
  });