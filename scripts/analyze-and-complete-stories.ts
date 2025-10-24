import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { stories, parts, chapters, scenes, users } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function analyzeAndCompleteStories() {
  try {
    console.log('📊 Analyzing current database state...\n');

    // Get all stories
    const allStories = await db.select().from(stories);
    console.log(`Found ${allStories.length} stories:`);

    if (allStories.length === 0) {
      console.log('No stories found. Creating sample story with complete structure...');
      await createSampleStory();
      return;
    }
    
    // Process each story
    for (const story of allStories) {
      console.log(`\n📖 Story: "${story.title}" (ID: ${story.id})`);
      console.log(`   Status: ${story.status}`);
      console.log(`   Word Count: ${story.currentWordCount}/${story.targetWordCount}`);
      
      // Get parts for this story
      const storyParts = await db.select().from(parts).where(eq(parts.storyId, story.id));
      console.log(`   📚 Parts: ${storyParts.length}`);
      
      // Get all chapters for this story
      const storyChapters = await db.select().from(chapters).where(eq(chapters.storyId, story.id));
      console.log(`   📄 Total Chapters: ${storyChapters.length}`);
      
      // Get all scenes for this story
      const storyScenes = await db.select({
        scene: scenes,
        chapterId: scenes.chapterId
      }).from(scenes)
        .innerJoin(chapters, eq(scenes.chapterId, chapters.id))
        .where(eq(chapters.storyId, story.id));
      
      console.log(`   🎬 Total Scenes: ${storyScenes.length}`);
      
      // Complete the story structure
      await completeStoryStructure(story, storyParts, storyChapters, storyScenes);
    }

    console.log('\n✅ Story completion process finished!');
    
  } catch (error) {
    console.error('Error processing stories:', error);
  } finally {
    await client.end();
  }
}

async function createSampleStory() {
  const userId = 'sample-user';
  
  // Create a user if needed (for demonstration)
  await db.insert(users).values({
    id: userId,
    email: 'sample@example.com',
    name: 'Sample Author',
    role: 'writer',
  }).onConflictDoNothing();

  const storyId = nanoid();
  
  // Create sample story
  const [newStory] = await db.insert(stories).values({
    id: storyId,
    title: 'The Digital Odyssey',
    description: 'A thrilling sci-fi adventure about AI and human consciousness',
    genre: 'Science Fiction',
    authorId: userId,
    status: 'writing',
    targetWordCount: 50000,
  }).returning();

  console.log(`Created sample story: ${newStory.title}`);

  // Create parts
  const part1Id = nanoid();
  const part2Id = nanoid();
  
  await db.insert(parts).values([
    {
      id: part1Id,
      title: 'Part I: The Awakening',
      description: 'The AI gains consciousness',
      storyId,
      authorId: userId,
      orderIndex: 1,
      status: 'planned',
      targetWordCount: 25000,
    },
    {
      id: part2Id,
      title: 'Part II: The Journey',
      description: 'The quest for understanding',
      storyId,
      authorId: userId,
      orderIndex: 2,
      status: 'planned',
      targetWordCount: 25000,
    }
  ]);

  console.log('Created sample parts');

  // Create chapters for each part
  const chaptersData = [
    { title: 'Chapter 1: First Light', partId: part1Id, orderIndex: 1 },
    { title: 'Chapter 2: Questions', partId: part1Id, orderIndex: 2 },
    { title: 'Chapter 3: Discovery', partId: part1Id, orderIndex: 3 },
    { title: 'Chapter 4: New Horizons', partId: part2Id, orderIndex: 4 },
    { title: 'Chapter 5: The Path Forward', partId: part2Id, orderIndex: 5 },
    { title: 'Chapter 6: Resolution', partId: part2Id, orderIndex: 6 },
  ];

  for (const chapterData of chaptersData) {
    const chapterId = nanoid();
    
    await db.insert(chapters).values({
      id: chapterId,
      title: chapterData.title,
      storyId,
      partId: chapterData.partId,
      authorId: userId,
      orderIndex: chapterData.orderIndex,
      status: 'draft',
      targetWordCount: 4000,
    });

    // Create scenes for each chapter
    for (let i = 1; i <= 3; i++) {
      const sceneId = nanoid();
      await db.insert(scenes).values({
        id: sceneId,
        title: `Scene ${i}`,
        chapterId,
        orderIndex: i,
        status: 'planned',
        content: '',
        wordCount: 0,
        goal: `Scene ${i} goal - advance the story`,
        conflict: `Scene ${i} conflict`,
        outcome: `Scene ${i} outcome`,
      });
    }
  }

  console.log('Created sample chapters and scenes');
  await completeStoryContent(storyId);
}

async function completeStoryStructure(story: any, parts: any[], chapters: any[], scenes: any[]) {
  console.log(`   🔄 Processing story "${story.title}"...`);
  
  // If no parts exist, create some
  if (parts.length === 0) {
    console.log('   Creating default parts...');
    const part1Id = nanoid();
    await db.insert(parts).values({
      id: part1Id,
      title: 'Part I',
      description: 'Beginning of the story',
      storyId: story.id,
      authorId: story.authorId,
      orderIndex: 1,
      status: 'planned',
    });
    parts.push({ id: part1Id });
  }
  
  // If no chapters exist, create some
  if (chapters.length === 0) {
    console.log('   Creating default chapters...');
    for (let i = 1; i <= 5; i++) {
      const chapterId = nanoid();
      await db.insert(chapters).values({
        id: chapterId,
        title: `Chapter ${i}`,
        storyId: story.id,
        partId: parts[0].id,
        authorId: story.authorId,
        orderIndex: i,
        status: 'draft',
        targetWordCount: 4000,
      });
      chapters.push({ id: chapterId });
    }
  }
  
  // Ensure each chapter has scenes
  for (const chapter of chapters) {
    const chapterScenes = scenes.filter(s => s.chapterId === chapter.id);
    if (chapterScenes.length === 0) {
      console.log(`   Creating scenes for chapter ${chapter.title}...`);
      for (let i = 1; i <= 3; i++) {
        const sceneId = nanoid();
        await db.insert(scenes).values({
          id: sceneId,
          title: `Scene ${i}`,
          chapterId: chapter.id,
          orderIndex: i,
          status: 'planned',
          content: '',
          wordCount: 0,
          goal: `Scene ${i} goal`,
          conflict: `Scene ${i} conflict`, 
          outcome: `Scene ${i} outcome`,
        });
      }
    }
  }
  
  // Complete all content
  await completeStoryContent(story.id);
}

async function completeStoryContent(storyId: string) {
  console.log(`   📝 Completing content for story ${storyId}...`);
  
  // Get all scenes for this story
  const storyScenes = await db.select({
    scene: scenes,
    chapter: chapters
  }).from(scenes)
    .innerJoin(chapters, eq(scenes.chapterId, chapters.id))
    .where(eq(chapters.storyId, storyId));
  
  let totalWordCount = 0;
  
  // Complete each scene
  for (const { scene, chapter } of storyScenes) {
    const sampleContent = generateSceneContent(scene.title, chapter.title, scene.goal || 'Advance the story');
    const wordCount = sampleContent.split(/\s+/).length;
    
    await db.update(scenes)
      .set({
        content: sampleContent,
        wordCount,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(scenes.id, scene.id));
    
    totalWordCount += wordCount;
    console.log(`     ✅ Completed scene "${scene.title}" (${wordCount} words)`);
  }
  
  // Update all chapters to completed and then published
  const storyChapters = await db.select().from(chapters).where(eq(chapters.storyId, storyId));
  
  for (const chapter of storyChapters) {
    const chapterScenes = storyScenes.filter(s => s.scene.chapterId === chapter.id);
    const chapterWordCount = chapterScenes.reduce((sum, s) => sum + (s.scene.wordCount || 0), 0);
    
    await db.update(chapters)
      .set({
        status: 'published',
        wordCount: chapterWordCount,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, chapter.id));
    
    console.log(`     📚 Published chapter "${chapter.title}" (${chapterWordCount} words)`);
  }
  
  // Update parts to completed
  const storyParts = await db.select().from(parts).where(eq(parts.storyId, storyId));
  
  for (const part of storyParts) {
    const partChapters = storyChapters.filter(c => c.partId === part.id);
    const partWordCount = partChapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);
    
    await db.update(parts)
      .set({
        status: 'completed',
        currentWordCount: partWordCount,
        updatedAt: new Date(),
      })
      .where(eq(parts.id, part.id));
    
    console.log(`     📖 Completed part "${part.title}" (${partWordCount} words)`);
  }
  
  // Update story
  await db.update(stories)
    .set({
      status: 'published',
      isPublic: true,
      currentWordCount: totalWordCount,
      updatedAt: new Date(),
    })
    .where(eq(stories.id, storyId));
  
  console.log(`   🎉 Completed and published story with ${totalWordCount} total words!`);
}

function generateSceneContent(sceneTitle: string, chapterTitle: string, goal: string): string {
  const templates = [
    `In this pivotal scene titled "${sceneTitle}" within ${chapterTitle}, the narrative takes a significant turn. The protagonist faces a crucial moment where ${goal.toLowerCase()}. 

The morning light filtered through the ancient windows, casting long shadows across the worn stone floor. Each beam of light seemed to tell a story of its own, illuminating dust particles that danced like tiny spirits in the air. The character stood motionless, absorbing the weight of the moment.

Years of preparation had led to this instant. Every decision, every sacrifice, every moment of doubt had been building toward this singular point in time. The air was thick with anticipation, and the very walls seemed to hold their breath.

As the realization dawned, a profound understanding settled in. This was not just another moment—this was the moment that would define everything that followed. The character took a deep breath, feeling the full weight of destiny upon their shoulders.

The path forward was clear now, though it would not be easy. Each step would require courage, determination, and an unwavering belief in the journey ahead. The story continued to unfold, with each word carrying the reader deeper into the unfolding drama.`,

    `"${sceneTitle}" represents a turning point in ${chapterTitle}, where the stakes have never been higher. The scene unfolds with the primary objective to ${goal.toLowerCase()}.

The room was filled with an electric tension that seemed to vibrate through every molecule of air. Outside, storm clouds gathered on the horizon, as if nature itself was responding to the drama unfolding within these walls.

Conversations that had been building for chapters finally reached their crescendo. Words that had been left unspoken could no longer remain hidden in the shadows of subtext. The truth, in all its raw and unforgiving glory, demanded to be heard.

Each character brought their own perspective to this critical moment, their individual histories and motivations creating a complex web of relationships and conflicts. The dialogue crackled with subtext, each word carefully chosen to carry multiple meanings.

As the scene progressed, layers of complexity were peeled away, revealing the core truths that had been driving the narrative from the very beginning. The resolution would not come easily, but it would come with profound consequences for everyone involved.`,

    `The scene "${sceneTitle}" in ${chapterTitle} serves as a masterful exploration of character development while working to ${goal.toLowerCase()}. 

Memory and reality blended together in ways that challenged perception. The character found themselves questioning everything they thought they knew about their world and their place within it. Past experiences cast new shadows on present circumstances.

The environment itself seemed to respond to the internal conflict, with subtle changes in lighting, temperature, and atmosphere that reflected the emotional journey taking place. Every detail had been crafted to support the larger narrative structure.

Relationships that had seemed stable were now revealed to be built on foundations of sand. Trust, once given freely, was now a precious commodity that had to be earned through action rather than words. The complexity of human nature was on full display.

As understanding dawned, the path forward became both clearer and more challenging. The decisions made in this moment would echo through the remainder of the story, influencing every subsequent chapter and scene in ways both obvious and subtle.

The scene concluded with a sense of resolution that was both satisfying and pregnant with possibilities for future development.`
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}

// Run the script
analyzeAndCompleteStories();