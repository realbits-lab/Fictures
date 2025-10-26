import { db } from '../src/lib/db/index.js';
import { stories, characters, settings, users } from '../src/lib/db/schema.js';
import { eq } from 'drizzle-orm';

const storyId = '3JpLdcXb5hQK7zy5g3QIj';

console.log(`🔍 Debugging story: ${storyId}\n`);

try {
  // Check if story exists
  console.log('1️⃣  Checking if story exists...');
  const storyResult = await db
    .select()
    .from(stories)
    .where(eq(stories.id, storyId))
    .limit(1);

  if (storyResult.length === 0) {
    console.log(`❌ Story NOT FOUND: ${storyId}\n`);
    console.log('💡 This story may have been deleted or the ID is incorrect.');
    process.exit(1);
  }

  const story = storyResult[0];
  console.log(`✅ Story found:`);
  console.log(`   Title: ${story.title}`);
  console.log(`   Status: ${story.status}`);
  console.log(`   Visibility: ${story.visibility}`);
  console.log(`   Author ID: ${story.authorId}\n`);

  // Check visibility
  if (story.visibility !== 'public') {
    console.log(`⚠️  Story is NOT PUBLIC (visibility: ${story.visibility})`);
    console.log(`   Community pages only show public stories.\n`);
  }

  // Check author
  console.log('2️⃣  Checking author...');
  const authorResult = await db
    .select()
    .from(users)
    .where(eq(users.id, story.authorId))
    .limit(1);

  if (authorResult.length > 0) {
    console.log(`✅ Author found: ${authorResult[0].name}\n`);
  } else {
    console.log(`⚠️  Author NOT FOUND (ID: ${story.authorId})\n`);
  }

  // Check characters
  console.log('3️⃣  Checking characters...');
  const charactersResult = await db
    .select()
    .from(characters)
    .where(eq(characters.storyId, storyId));
  console.log(`✅ Characters found: ${charactersResult.length}\n`);

  // Check settings
  console.log('4️⃣  Checking settings...');
  const settingsResult = await db
    .select()
    .from(settings)
    .where(eq(settings.storyId, storyId));
  console.log(`✅ Settings found: ${settingsResult.length}\n`);

  console.log('📊 Summary:');
  console.log(`   Story exists: ✅`);
  console.log(`   Visibility: ${story.visibility === 'public' ? '✅ public' : '⚠️  ' + story.visibility}`);
  console.log(`   Author exists: ${authorResult.length > 0 ? '✅' : '⚠️'}`);
  console.log(`   Characters: ${charactersResult.length}`);
  console.log(`   Settings: ${settingsResult.length}\n`);

  if (story.visibility !== 'public') {
    console.log('🔧 Fix: To make this story available in community pages, update visibility to "public"');
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error);
} finally {
  process.exit(0);
}
