import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);
const storyId = process.argv[2] || 'kfiNwbdYD2BAnC7IAyjps';

const story = await sql`SELECT * FROM stories WHERE id = ${storyId}`;
const characters = await sql`SELECT * FROM characters WHERE story_id = ${storyId}`;
const settings = await sql`SELECT * FROM settings WHERE story_id = ${storyId}`;
const chapters = await sql`SELECT * FROM chapters WHERE story_id = ${storyId}`;
const scenes = await sql`SELECT * FROM scenes WHERE story_id = ${storyId} ORDER BY scene_number`;

if (story.length === 0) {
  console.log('Story not found:', storyId);
  process.exit(1);
}

console.log('\n📖 STORY GENERATION COMPLETE!\n');
console.log('='.repeat(80));
console.log('\n✨ Title:', story[0].title);
console.log('📅 Created:', new Date(story[0].created_at).toLocaleString());
console.log('👤 Author ID:', story[0].user_id);
console.log('\n📝 Summary:');
console.log(story[0].summary);
console.log('\n🎯 Moral Framework:');
console.log(story[0].moral_framework);
console.log('\n📊 Story Structure:');
console.log('  - Characters:', characters.length);
console.log('  - Settings:', settings.length);
console.log('  - Chapters:', chapters.length);
console.log('  - Scenes:', scenes.length);
console.log('\n👥 CHARACTERS:');
characters.forEach((c, idx) => {
  console.log(`\n${idx + 1}. ${c.name} (${c.role})`);
  console.log(`   Internal Flaw: ${c.internal_flaw}`);
  console.log(`   External Goal: ${c.external_goal}`);
  console.log(`   Character Arc: ${c.character_arc}`);
  console.log(`   Image: ${c.image_url ? '✓' : '✗'}`);
});
console.log('\n🏞️  SETTINGS:');
settings.forEach((s, idx) => {
  console.log(`\n${idx + 1}. ${s.name}`);
  console.log(`   ${s.description.substring(0, 150)}...`);
  console.log(`   Image: ${s.image_url ? '✓' : '✗'}`);
});
console.log('\n🎬 SCENES:');
scenes.forEach((s, idx) => {
  console.log(`\nScene ${idx + 1}: ${s.summary}`);
  console.log(`   Evaluation Score: ${s.evaluation_score || 'N/A'}`);
  console.log(`   Word Count: ${s.content?.split(' ').length || 0}`);
  console.log(`   Image: ${s.image_url ? '✓' : '✗'}`);
});
console.log('\n' + '='.repeat(80));
console.log('\n🔗 Access the story at:');
console.log(`   http://localhost:3000/novels/${storyId}`);
console.log('\n');
