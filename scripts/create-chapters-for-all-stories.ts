// Environment variables will be loaded by pnpm command
import { db } from '../src/lib/db';
import { stories, chapters, parts } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function createChaptersForAllStories() {
  try {
    console.log('Creating chapters for stories without any...');

    // Get all stories
    const allStories = await db.select().from(stories);
    console.log(`Found ${allStories.length} stories`);

    for (const story of allStories) {
      // Check if this story already has chapters
      const existingChapters = await db
        .select()
        .from(chapters)
        .where(eq(chapters.storyId, story.id));

      if (existingChapters.length > 0) {
        console.log(`✓ ${story.title} already has ${existingChapters.length} chapters, skipping`);
        continue;
      }

      console.log(`📝 Creating chapters for: ${story.title}`);

      // Create a part for this story
      const partId = nanoid();
      const [createdPart] = await db.insert(parts).values({
        id: partId,
        title: "Part I",
        description: `Opening part of ${story.title}`,
        storyId: story.id,
        orderIndex: 1
      }).returning();
      
      console.log(`  Created part: ${createdPart.title}`);

      // Create 3 sample chapters for each story
      const chapterTemplates = [
        {
          title: "The Beginning",
          summary: "Opening chapter that sets the stage",
          status: 'completed',
          wordCount: 2500,
          content: "The story begins..."
        },
        {
          title: "Rising Action", 
          summary: "The plot thickens and conflicts arise",
          status: 'in_progress',
          wordCount: 1800,
          content: "As events unfold..."
        },
        {
          title: "Turning Point",
          summary: "A crucial moment that changes everything", 
          status: 'draft',
          wordCount: 0,
          content: ""
        }
      ];

      for (let i = 0; i < chapterTemplates.length; i++) {
        const template = chapterTemplates[i];
        const chapterId = nanoid();
        
        const [chapter] = await db.insert(chapters).values({
          id: chapterId,
          title: template.title,
          summary: template.summary,
          content: template.content,
          storyId: story.id,
          partId: createdPart.id,
          orderIndex: i + 1,
          status: template.status,
          wordCount: template.wordCount,
          targetWordCount: 3000,
        }).returning();

        console.log(`  Created chapter: ${chapter.title} (${template.status})`);
      }

      console.log(`✅ Created 1 part and 3 chapters for ${story.title}\n`);
    }

    console.log('🎉 All stories now have chapters and parts!');

  } catch (error) {
    console.error('❌ Error creating chapters:', error);
  } finally {
    process.exit(0);
  }
}

createChaptersForAllStories();