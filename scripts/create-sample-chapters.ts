// Environment variables will be loaded by pnpm command
import { db } from '../src/lib/db';
import { stories, chapters, parts, scenes } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function createSampleChapters() {
  try {
    console.log('Starting to create sample chapters...');

    // Get an existing story to add chapters to
    const existingStories = await db.select().from(stories).limit(1);
    if (existingStories.length === 0) {
      console.log('No existing stories found. Please create a story first.');
      return;
    }

    const story = existingStories[0];
    console.log(`Using story: ${story.title}`);

    // Create a sample part first
    const partId = nanoid();
    const [createdPart] = await db.insert(parts).values({
      id: partId,
      title: "The Awakening",
      description: "Maya discovers her powers and enters the shadow realm",
      storyId: story.id,
      orderIndex: 1
    }).returning();
    
    console.log(`Created part: ${createdPart.title}`);

    // Create sample chapters
    const chaptersData = [
      {
        title: "Discovering Powers",
        summary: "Maya first encounters her shadow abilities during a crisis",
        orderIndex: 1,
        partId: createdPart.id,
        status: 'completed',
        wordCount: 3200,
        targetWordCount: 4000,
        content: "The Shadow Realm pulsed around Maya like a living thing..."
      },
      {
        title: "First Portal",
        summary: "Maya opens her first portal to the void realm",
        orderIndex: 2,
        partId: createdPart.id,
        status: 'completed',
        wordCount: 3800,
        targetWordCount: 4000,
        content: "The portal shimmered with dark energy..."
      },
      {
        title: "The Other Side",
        summary: "Maya steps through the portal and encounters the Void Collector",
        orderIndex: 3,
        partId: createdPart.id,
        status: 'in_progress',
        wordCount: 2100,
        targetWordCount: 4000,
        content: "On the other side, reality was different..."
      }
    ];

    const createdChapters = [];
    for (const chapterData of chaptersData) {
      const chapterId = nanoid();
      const [chapter] = await db.insert(chapters).values({
        id: chapterId,
        title: chapterData.title,
        summary: chapterData.summary,
        content: chapterData.content,
        storyId: story.id,
        partId: chapterData.partId,
        orderIndex: chapterData.orderIndex,
        status: chapterData.status,
        wordCount: chapterData.wordCount,
        targetWordCount: chapterData.targetWordCount,
      }).returning();

      createdChapters.push(chapter);
      console.log(`Created chapter: ${chapter.title} (ID: ${chapter.id})`);
    }

    // Create sample scenes for the first chapter
    const scenesData = [
      {
        title: "Entering the Void",
        status: "completed",
        wordCount: 856,
        goal: "Maya infiltrates Shadow Realm",
        conflict: "Void defenses",
        outcome: "Discovers Elena's location but alerts Void Collector",
        orderIndex: 1
      },
      {
        title: "Power's Temptation",
        status: "in_progress",
        wordCount: 991,
        goal: "Resist corruption",
        conflict: "Void Collector's offer",
        outcome: "[In Progress] Maya must choose power or purity",
        orderIndex: 2
      },
      {
        title: "True Strength",
        status: "planned",
        wordCount: 0,
        goal: "Save Elena",
        conflict: "Final battle",
        outcome: "Victory through moral choice",
        orderIndex: 3
      }
    ];

    for (const sceneData of scenesData) {
      const sceneId = nanoid();
      const [scene] = await db.insert(scenes).values({
        id: sceneId,
        title: sceneData.title,
        content: `Scene content for ${sceneData.title}...`,
        chapterId: createdChapters[0].id, // Attach to first chapter
        orderIndex: sceneData.orderIndex,
        status: sceneData.status,
        wordCount: sceneData.wordCount,
        goal: sceneData.goal,
        conflict: sceneData.conflict,
        outcome: sceneData.outcome
      }).returning();

      console.log(`Created scene: ${scene.title}`);
    }

    console.log('\n✅ Sample chapters, parts, and scenes created successfully!');
    console.log(`\nYou can now navigate to: http://localhost:3001/write/${createdChapters[0].id}`);

  } catch (error) {
    console.error('❌ Error creating sample chapters:', error);
  } finally {
    process.exit(0);
  }
}

createSampleChapters();