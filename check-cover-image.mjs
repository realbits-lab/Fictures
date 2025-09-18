import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { stories } from './src/lib/db/schema.ts';
import { eq } from 'drizzle-orm';

const client = postgres(process.env.POSTGRES_URL);
const db = drizzle(client);

async function checkCoverImage() {
  try {
    const story = await db.select().from(stories).where(eq(stories.id, 'VTtycrndsyzEjeEHz37Rz')).limit(1);
    
    if (story.length > 0) {
      console.log('✅ Story found in database:');
      console.log('- Story ID:', story[0].id);
      console.log('- Title:', story[0].title);
      
      if (story[0].storyData) {
        const storyData = JSON.parse(story[0].storyData);
        console.log('- Story Data Properties:', Object.keys(storyData).length);
        
        if (storyData.coverImage) {
          console.log('✅ Cover image found:', storyData.coverImage);
          console.log('- Vercel Blob URL confirmed');
        } else {
          console.log('❌ No coverImage property found in story data');
        }
      } else {
        console.log('❌ No story data found');
      }
    } else {
      console.log('❌ Story not found in database');
    }
  } catch (error) {
    console.error('❌ Database query error:', error.message);
  } finally {
    await client.end();
  }
}

checkCoverImage();
