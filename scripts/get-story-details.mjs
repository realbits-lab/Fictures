import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL);
const storyId = '55vnp7_fxk5rE7-VQWXIF';

try {
  // Get story basic info
  const storyResult = await sql`
    SELECT id, title, genre, status, premise, dramatic_question, theme
    FROM stories
    WHERE id = ${storyId}
  `;

  if (storyResult.length === 0) {
    console.log('❌ Story not found');
    process.exit(1);
  }

  const story = storyResult[0];

  // Get counts
  const counts = await sql`
    SELECT
      (SELECT COUNT(*) FROM parts WHERE story_id = ${storyId}) as part_count,
      (SELECT COUNT(*) FROM chapters WHERE part_id IN (SELECT id FROM parts WHERE story_id = ${storyId})) as chapter_count,
      (SELECT COUNT(*) FROM scenes WHERE chapter_id IN (SELECT id FROM chapters WHERE part_id IN (SELECT id FROM parts WHERE story_id = ${storyId}))) as scene_count,
      (SELECT COUNT(*) FROM characters WHERE story_id = ${storyId}) as character_count,
      (SELECT COUNT(*) FROM characters WHERE story_id = ${storyId} AND image_url IS NOT NULL) as characters_with_images,
      (SELECT COUNT(*) FROM settings WHERE story_id = ${storyId}) as setting_count,
      (SELECT COUNT(*) FROM settings WHERE story_id = ${storyId} AND image_url IS NOT NULL) as settings_with_images
  `;

  const stats = counts[0];

  // Get character names
  const characters = await sql`
    SELECT name, role, image_url
    FROM characters
    WHERE story_id = ${storyId}
    ORDER BY name
  `;

  // Get setting names
  const settings = await sql`
    SELECT name, image_url
    FROM settings
    WHERE story_id = ${storyId}
    ORDER BY name
  `;

  console.log('\n' + '='.repeat(80));
  console.log('📖 STORY DETAILS');
  console.log('='.repeat(80));
  console.log(`\nTitle: ${story.title}`);
  console.log(`Genre: ${story.genre}`);
  console.log(`Status: ${story.status === 'published' ? '📢 Published' : '✏️ Draft'}`);
  console.log(`\nPremise: ${story.premise}`);
  console.log(`Dramatic Question: ${story.dramatic_question}`);
  console.log(`Theme: ${story.theme}`);

  console.log('\n' + '-'.repeat(80));
  console.log('📊 STRUCTURE STATISTICS');
  console.log('-'.repeat(80));
  console.log(`📚 Parts: ${stats.part_count}`);
  console.log(`📝 Chapters: ${stats.chapter_count}`);
  console.log(`🎬 Scenes: ${stats.scene_count}`);
  console.log(`👥 Characters: ${stats.character_count} (${stats.characters_with_images} with images)`);
  console.log(`🏞️  Settings: ${stats.setting_count} (${stats.settings_with_images} with images)`);

  console.log('\n' + '-'.repeat(80));
  console.log('👥 CHARACTERS');
  console.log('-'.repeat(80));
  characters.forEach((char, index) => {
    const imageStatus = char.image_url ? '✓' : '✗';
    console.log(`${index + 1}. ${char.name} (${char.role}) [${imageStatus}]`);
  });

  console.log('\n' + '-'.repeat(80));
  console.log('🏞️  SETTINGS');
  console.log('-'.repeat(80));
  settings.forEach((setting, index) => {
    const imageStatus = setting.image_url ? '✓' : '✗';
    console.log(`${index + 1}. ${setting.name} [${imageStatus}]`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('📍 NAVIGATION LINKS');
  console.log('='.repeat(80));
  console.log(`Edit story:    http://localhost:3000/writing/${storyId}`);
  console.log(`Read story:    http://localhost:3000/reading/${storyId}`);
  console.log(`Community:     http://localhost:3000/community/story/${storyId}`);
  console.log(`All stories:   http://localhost:3000/writing`);
  console.log('='.repeat(80) + '\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
