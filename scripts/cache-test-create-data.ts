#!/usr/bin/env ts-node

/**
 * Create Cache Test Data
 * Uses TypeScript for proper schema access
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as schema from '../src/lib/db/schema';

config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);
const db = drizzle(sql, { schema });

async function main() {
  console.log('🚀 Creating Cache Test Data\n');

  try {
    // Use existing writer user
    console.log('📝 Finding writer user...');
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, 'writer@fictures.xyz')
    });

    if (!user) {
      throw new Error('Writer user not found. Please ensure writer@fictures.xyz exists.');
    }

    const userId = user.id;
    console.log(`✅ User: ${userId} (${user.email})\n`);

    // Clear old test data
    console.log('🗑️  Clearing old test data...');
    const oldStories = await db.query.stories.findMany({
      where: (stories, { and, eq, like }) =>
        and(
          eq(stories.authorId, userId),
          like(stories.title, 'Cache Test Story%')
        )
    });

    for (const story of oldStories) {
      await db.delete(schema.stories).where(eq(schema.stories.id, story.id));
    }
    console.log(`✅ Cleared ${oldStories.length} old stories\n`);

    // Create 3 test stories
    console.log('📚 Creating 3 test stories...\n');

    for (let i = 1; i <= 3; i++) {
      const storyId = nanoid();
      const [story] = await db
        .insert(schema.stories)
        .values({
          id: storyId,
          title: `Cache Test Story ${i}`,
          genre: 'Fantasy',
          status: i === 1 ? 'published' : 'writing',
          authorId: userId,
          summary: `Test story ${i} for cache performance testing with chapters and scenes.`,
          tone: 'hopeful',
          moralFramework: {
            centralVirtue: 'courage',
            testedVirtues: ['honesty', 'perseverance'],
            consequencePattern: 'redemption',
          },
          viewCount: i * 100,
          imageUrl: `https://placehold.co/1792x1024?text=Story+${i}`,
        })
        .returning();

      console.log(`  Story ${i}: ${story.id} (${story.status})`);

      // Create 5 chapters per story
      for (let j = 1; j <= 5; j++) {
        const chapterId = nanoid();
        const [chapter] = await db
          .insert(schema.chapters)
          .values({
            id: chapterId,
            title: `Chapter ${j}: Testing Cache Layer ${j}`,
            summary: `Chapter ${j} tests caching behavior with multiple scenes.`,
            storyId: story.id,
            authorId: userId,
            orderIndex: j,
            status: j <= 3 ? 'published' : 'writing',
          })
          .returning();

        // Create 3 scenes per chapter
        for (let k = 1; k <= 3; k++) {
          const sceneNum = (j - 1) * 3 + k;
          const content = `Scene ${sceneNum} for cache testing.\n\nMultiple paragraphs to test caching:\n- SWR Memory (30 min)\n- localStorage (1 hour)\n- Redis (10 min)\n\nScene ${sceneNum} - Chapter ${j} - Story ${i}`;

          await db.insert(schema.scenes).values({
            id: nanoid(),
            title: `Scene ${sceneNum}: Cache Test`,
            content: content,
            chapterId: chapter.id,
            authorId: userId,
            orderIndex: k,
            status: 'published',
            visibility: k === 1 ? 'public' : 'unlisted',
            wordCount: content.split(/\s+/).length,
          });
        }
      }
    }

    // Verify
    console.log('\n✅ Data created successfully!\n');

    const stories = await db.query.stories.findMany({
      where: (stories, { and, eq, like }) =>
        and(
          eq(stories.authorId, userId),
          like(stories.title, 'Cache Test Story%')
        ),
      with: {
        chapters: {
          with: {
            scenes: true
          }
        }
      }
    });

    console.log('📊 Summary:');
    console.log(`  Stories: ${stories.length}`);
    console.log(`  Chapters: ${stories.reduce((sum, s) => sum + s.chapters.length, 0)}`);
    console.log(`  Scenes: ${stories.reduce((sum, s) => sum + s.chapters.reduce((cs, c) => cs + c.scenes.length, 0), 0)}`);

    console.log('\nStory IDs:');
    stories.forEach(s => console.log(`  ${s.id} - ${s.title} (${s.status})`));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
