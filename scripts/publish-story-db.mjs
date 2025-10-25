import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL);
const storyId = '55vnp7_fxk5rE7-VQWXIF';

try {
  console.log(`📤 Publishing story ${storyId} in database...`);

  const result = await sql`
    UPDATE stories
    SET status = 'published', updated_at = NOW()
    WHERE id = ${storyId}
    RETURNING id, title, status
  `;

  if (result.length === 0) {
    console.log('❌ Story not found');
    process.exit(1);
  }

  const story = result[0];
  console.log(`✅ Story published successfully!`);
  console.log(`   ID: ${story.id}`);
  console.log(`   Title: ${story.title}`);
  console.log(`   Status: ${story.status}`);
} catch (error) {
  console.error('❌ Error publishing story:', error.message);
  process.exit(1);
}
