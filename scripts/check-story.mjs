import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

const storyId = '55vnp7_fxk5rE7-VQWXIF';

try {
  const result = await sql`
    SELECT
      s.id, s.title, s.genre, s.status, s.created_at,
      COUNT(DISTINCT p.id) as part_count,
      COUNT(DISTINCT c.id) as chapter_count,
      COUNT(DISTINCT ch.id) as character_count,
      COUNT(DISTINCT st.id) as setting_count
    FROM stories s
    LEFT JOIN parts p ON s.id = p.story_id
    LEFT JOIN chapters c ON p.id = c.part_id
    LEFT JOIN characters ch ON s.id = ch.story_id
    LEFT JOIN settings st ON s.id = st.story_id
    WHERE s.id = ${storyId}
    GROUP BY s.id, s.title, s.genre, s.status, s.created_at
  `;

  const story = result[0];

  if (!story) {
    console.log('❌ Story not found in database');
    process.exit(1);
  }

  console.log('✅ Story found!');
  console.log(JSON.stringify({
    id: story.id,
    title: story.title,
    genre: story.genre,
    status: story.status,
    partCount: parseInt(story.part_count) || 0,
    chapterCount: parseInt(story.chapter_count) || 0,
    characterCount: parseInt(story.character_count) || 0,
    settingCount: parseInt(story.setting_count) || 0,
    createdAt: story.created_at
  }, null, 2));
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
