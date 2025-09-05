// Debug script to test chapter query
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { chapters, parts, stories } from './src/lib/db/schema.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

const client = postgres(process.env.POSTGRES_URL, { prepare: false });
const db = drizzle(client);

async function testChapterQuery() {
  try {
    console.log('Testing chapter query for ID: 78YZmbHM-chapter-3');
    
    const [result] = await db
      .select({
        chapter: chapters,
        part: parts,
        story: stories
      })
      .from(chapters)
      .leftJoin(parts, eq(chapters.partId, parts.id))
      .leftJoin(stories, eq(chapters.storyId, stories.id))
      .where(eq(chapters.id, '78YZmbHM-chapter-3'))
      .limit(1);

    if (!result) {
      console.log('No result found');
    } else {
      console.log('Chapter found:', result.chapter?.title);
      console.log('Story found:', result.story?.title);
      console.log('Story isPublic:', result.story?.isPublic);
      console.log('Story authorId:', result.story?.authorId);
      console.log('Access check would pass for user test-user-1:', 
        result.story?.isPublic || result.story?.authorId === 'test-user-1');
    }
  } catch (error) {
    console.error('Query failed:', error);
  } finally {
    await client.end();
  }
}

testChapterQuery();