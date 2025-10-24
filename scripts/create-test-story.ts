import { db } from '@/lib/db';
import { stories, parts, chapters } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

async function createTestStory() {
  try {
    console.log('📚 Creating test story...');

    // Create the story
    const storyId = nanoid();
    const [story] = await db.insert(stories).values({
      id: storyId,
      title: 'The Shadow Keeper',
      description: 'A young photographer discovers her shadow magic abilities when her sister disappears into a parallel realm.',
      genre: 'urban_fantasy',
      authorId: 'JKRn6svvRaFz--rNA3LZu', // Admin User ID
      targetWordCount: 80000,
      status: 'draft',
      isPublic: false,
      storyData: {
        title: 'The Shadow Keeper',
        genre: 'urban_fantasy',
        words: 80000,
        question: 'Can Maya master shadow magic before power corrupts her?',
        goal: 'Save Elena from Shadow Realm',
        conflict: 'Shadow magic corrupts those who use it',
        outcome: 'Maya embraces darkness to save light',
        chars: {
          maya: { role: 'protag', arc: 'denial→acceptance', flaw: 'overprotective' },
          elena: { role: 'catalyst', arc: 'missing→transformed', goal: 'survive_realm' },
          marcus: { role: 'mentor', arc: 'guilt→redemption', secret: 'previous_failure' }
        },
        themes: ['responsibility_for_power', 'love_vs_control', 'inner_battles'],
        structure: {
          type: '3_part',
          parts: ['setup', 'confrontation', 'resolution'],
          dist: [25, 50, 25]
        }
      }
    }).returning();

    console.log('✅ Story created:', story.title);

    // Create parts
    const partData = [
      { title: 'Discovery', description: 'Maya discovers her abilities and Elena disappears', wordPercent: 25 },
      { title: 'Training', description: 'Maya learns to control her powers while searching for Elena', wordPercent: 50 },
      { title: 'Confrontation', description: 'Final battle in the Shadow Realm', wordPercent: 25 }
    ];

    const createdParts = [];
    for (let i = 0; i < partData.length; i++) {
      const partId = nanoid();
      const [part] = await db.insert(parts).values({
        id: partId,
        title: partData[i].title,
        storyId: storyId,
        authorId: 'JKRn6svvRaFz--rNA3LZu',
        orderIndex: i + 1,
        targetWordCount: Math.floor(80000 * (partData[i].wordPercent / 100)),
        status: 'planned',
        partData: {
          title: partData[i].title,
          description: partData[i].description,
          part: i + 1,
          goal: i === 0 ? 'Maya accepts supernatural reality' : 
                i === 1 ? 'Maya masters her shadow abilities' : 
                'Maya rescues Elena and defeats the shadow entity',
          conflict: i === 0 ? 'Denial vs mounting evidence' :
                   i === 1 ? 'Power growth vs corruption risk' :
                   'Ultimate power vs moral cost'
        }
      }).returning();

      createdParts.push(part);
      console.log('✅ Part created:', part.title);
    }

    // Create first chapter of first part
    const chapterId = nanoid();
    const [chapter] = await db.insert(chapters).values({
      id: chapterId,
      title: 'Missing',
      storyId: storyId,
      partId: createdParts[0].id,
      authorId: 'JKRn6svvRaFz--rNA3LZu',
      orderIndex: 1,
      targetWordCount: 4000,
      status: 'draft',
      purpose: 'Establish Elena\'s disappearance and supernatural threat',
      hook: 'Door unlocked, coffee warm, Elena gone',
      characterFocus: 'Maya',
      content: 'The apartment door hung slightly ajar, and Maya\'s stomach lurched...'
    }).returning();

    console.log('✅ Chapter created:', chapter.title);

    console.log('\n🎉 Test story structure created successfully!');
    console.log('📚 Story:', story.title);
    console.log('📖 Parts:', createdParts.length);
    console.log('📝 Chapters: 1');

  } catch (error) {
    console.error('❌ Error creating test story:', error);
    throw error;
  }
}

if (require.main === module) {
  createTestStory()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { createTestStory };