import { db } from '../src/lib/db';
import { stories } from '../src/lib/db/schema';

async function makeAllStoriesPublic() {
  try {
    console.log('🔄 Making all stories public...');

    // Get all stories with current status
    const allStories = await db
      .select({
        id: stories.id,
        title: stories.title,
        status: stories.status,
        authorId: stories.authorId,
      })
      .from(stories);

    console.log(`📚 Found ${allStories.length} stories in database`);

    // Count how many are already public
    const publicCount = allStories.filter(s => s.status === 'published').length;
    const privateCount = allStories.filter(s => s.status === 'writing').length;

    console.log(`   - ${publicCount} already public (published)`);
    console.log(`   - ${privateCount} private (writing)`);

    if (privateCount === 0) {
      console.log('✅ All stories are already public!');
      return;
    }

    // Update all stories to published status
    const result = await db
      .update(stories)
      .set({
        status: 'published',
        updatedAt: new Date(),
      })
      .returning({
        id: stories.id,
        title: stories.title,
        status: stories.status,
      });

    console.log('');
    console.log('✅ Successfully updated all stories to public!');
    console.log('');
    console.log('📋 Updated Stories:');
    result.forEach((story, index) => {
      console.log(`   ${index + 1}. ${story.title} (${story.id}) - status: ${story.status}`);
    });

  } catch (error) {
    console.error('❌ Error making stories public:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

makeAllStoriesPublic();
