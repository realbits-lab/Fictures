import { getStoryWithStructure } from "../src/lib/db/queries";

const storyId = 'uHsfe456SMlHj1QW7GqBl';

async function checkStructure() {
  console.log('🔍 Checking story structure for:', storyId);

  const story = await getStoryWithStructure(storyId, true);

  if (!story) {
    console.log('❌ Story not found');
    return;
  }

  console.log('\n📖 Story Details:');
  console.log('  ID:', story.id);
  console.log('  Title:', story.title);
  console.log('  Parts:', story.parts ? `${story.parts.length} parts` : 'undefined');
  console.log('  Chapters (standalone):', story.chapters ? `${story.chapters.length} chapters` : 'undefined');

  if (story.parts && story.parts.length > 0) {
    console.log('\n📑 Parts Breakdown:');
    story.parts.forEach((part: any) => {
      console.log(`  Part: ${part.id}`);
      console.log(`    Title: ${part.title}`);
      console.log(`    Order: ${part.orderIndex}`);
      console.log(`    Chapters: ${part.chapters ? part.chapters.length : 0}`);

      if (part.chapters && part.chapters.length > 0) {
        part.chapters.forEach((chapter: any) => {
          console.log(`      Chapter: ${chapter.id}`);
          console.log(`        Title: ${chapter.title}`);
          console.log(`        Scenes: ${chapter.scenes ? chapter.scenes.length : 0}`);

          if (chapter.scenes && chapter.scenes.length > 0) {
            chapter.scenes.forEach((scene: any) => {
              console.log(`          Scene: ${scene.id} - ${scene.title}`);
            });
          }
        });
      }
    });
  }

  if (story.chapters && story.chapters.length > 0) {
    console.log('\n📄 Standalone Chapters:');
    story.chapters.forEach((chapter: any) => {
      console.log(`  Chapter: ${chapter.id}`);
      console.log(`    Title: ${chapter.title}`);
      console.log(`    Scenes: ${chapter.scenes ? chapter.scenes.length : 0}`);

      if (chapter.scenes && chapter.scenes.length > 0) {
        chapter.scenes.forEach((scene: any) => {
          console.log(`      Scene: ${scene.id} - ${scene.title}`);
        });
      }
    });
  }

  process.exit(0);
}

checkStructure().catch(console.error);