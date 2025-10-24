#!/usr/bin/env tsx

import { generateStoryFromPrompt, generateChapterSpecifications, generateSceneSpecifications } from '../src/lib/ai/story-development';
import type { Story, PartSpecification, ChapterSpecification, SceneSpecification } from '../src/lib/ai/schemas';
import { writeFileSync } from 'fs';
import { join } from 'path';

const STORY_PROMPT = `
Dr. Elena Vasquez, a brilliant cognitive psychologist and university ethics committee chair, discovers she has the power to see and influence people's moral decisions as shadowy representations of their conscience. When a series of campus incidents escalate into life-threatening situations, Elena must grapple with whether to use her dangerous abilities to prevent harm, knowing that each intervention corrupts her own moral compass and threatens to turn her into the very thing she fights against.

This is an urban fantasy/psychological thriller set at Riverside University in San Francisco. The story explores themes of responsibility vs control, moral agency, corruption of power, and redemption.

Key characters:
- Elena Vasquez (protagonist): Arc from control→guidance, flaw is being controlling/paternalistic
- Marcus Chen (antagonist): Arc from idealism→extremism, wants to create "perfect" moral society through control
- Dr. James Rivera (mentor): Arc from guilt→acceptance, haunted by past failure with previous student
- Sarah Thompson (student/catalyst): Arc from despair→hope, first major test case
- Detective Lisa Park (ally): Arc from skepticism→belief, grounds story in realistic consequences

Three-part structure:
Part 1 (25%): Elena discovers power and begins using it to help people, saves Sarah from suicide
Part 2 (50%): Elena's power use corrupts her judgment, realizes she's becoming like Marcus
Part 3 (25%): Elena must stop Marcus without becoming him, learns to guide rather than control

Target: 85,000 words, weekly publication, 4,000 word chapters
`;

const USER_ID = 'shadows-story-author';
const LANGUAGE = 'English';

interface CompleteStoryData {
  story: Story;
  parts: PartSpecification[];
  chapters: {
    [partNumber: number]: ChapterSpecification[];
  };
  scenes: {
    [partNumber: number]: {
      [chapterNumber: number]: SceneSpecification[];
    };
  };
}

async function generateCompleteStory(): Promise<CompleteStoryData> {
  console.log('🚀 Starting complete story generation for "Shadows of Responsibility"...');
  
  // Phase 1 & 2: Generate story concept and parts
  console.log('\n📚 Phase 1-2: Generating story concept and part specifications...');
  const storyData = await generateStoryFromPrompt(STORY_PROMPT, USER_ID, LANGUAGE);
  
  const story = storyData.developmentPhases.phase1_story;
  const parts = storyData.developmentPhases.phase2_parts;
  
  console.log(`✅ Generated story: "${story.title}"`);
  console.log(`✅ Generated ${parts.length} part specifications`);
  
  // Phase 3: Generate chapters for each part
  console.log('\n📖 Phase 3: Generating chapter specifications...');
  const chapters: { [partNumber: number]: ChapterSpecification[] } = {};
  
  // Part 1: 5 chapters (Discovery)
  console.log('  Generating Part 1 chapters (5 chapters)...');
  chapters[1] = await generateChapterSpecifications(story, parts[0], 5);
  
  // Part 2: 10 chapters (Escalation) 
  console.log('  Generating Part 2 chapters (10 chapters)...');
  chapters[2] = await generateChapterSpecifications(story, parts[1], 10);
  
  // Part 3: 6 chapters (Resolution)
  console.log('  Generating Part 3 chapters (6 chapters)...');
  chapters[3] = await generateChapterSpecifications(story, parts[2], 6);
  
  const totalChapters = Object.values(chapters).reduce((sum, chaps) => sum + chaps.length, 0);
  console.log(`✅ Generated ${totalChapters} chapter specifications`);
  
  // Phase 4: Generate scenes for each chapter
  console.log('\n🎬 Phase 4: Generating scene specifications...');
  const scenes: { [partNumber: number]: { [chapterNumber: number]: SceneSpecification[] } } = {};
  
  for (const [partNum, partChapters] of Object.entries(chapters)) {
    const partNumber = parseInt(partNum);
    scenes[partNumber] = {};
    
    console.log(`  Generating scenes for Part ${partNumber}...`);
    for (let i = 0; i < partChapters.length; i++) {
      const chapter = partChapters[i];
      const chapterNumber = i + 1;
      
      // Generate 3-4 scenes per chapter
      const sceneCount = Math.random() > 0.5 ? 4 : 3;
      scenes[partNumber][chapterNumber] = await generateSceneSpecifications(chapter, sceneCount);
      
      console.log(`    Chapter ${chapterNumber}: ${scenes[partNumber][chapterNumber].length} scenes`);
    }
  }
  
  const totalScenes = Object.values(scenes).reduce((sum, part) => 
    sum + Object.values(part).reduce((partSum, chap) => partSum + chap.length, 0), 0);
  console.log(`✅ Generated ${totalScenes} scene specifications`);
  
  return {
    story,
    parts,
    chapters,
    scenes
  };
}

async function saveStoryData(completeStory: CompleteStoryData) {
  const outputDir = join(process.cwd(), 'generated-story');
  
  console.log('\n💾 Saving story data...');
  
  // Create output directory structure
  const dirs = [
    outputDir,
    join(outputDir, 'parts'),
    join(outputDir, 'chapters'),
    join(outputDir, 'scenes')
  ];
  
  for (const dir of dirs) {
    try {
      const fs = await import('fs');
      await fs.promises.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory already exists or other error, continue
    }
  }
  
  // Save main story data
  writeFileSync(
    join(outputDir, 'story.json'),
    JSON.stringify(completeStory.story, null, 2)
  );
  console.log('✅ Saved story.json');
  
  // Save parts
  writeFileSync(
    join(outputDir, 'parts', 'all-parts.json'),
    JSON.stringify(completeStory.parts, null, 2)
  );
  
  completeStory.parts.forEach((part, index) => {
    writeFileSync(
      join(outputDir, 'parts', `part-${index + 1}.json`),
      JSON.stringify(part, null, 2)
    );
  });
  console.log(`✅ Saved ${completeStory.parts.length} part files`);
  
  // Save chapters
  writeFileSync(
    join(outputDir, 'chapters', 'all-chapters.json'),
    JSON.stringify(completeStory.chapters, null, 2)
  );
  
  Object.entries(completeStory.chapters).forEach(([partNum, partChapters]) => {
    partChapters.forEach((chapter, chapterIndex) => {
      writeFileSync(
        join(outputDir, 'chapters', `part-${partNum}-chapter-${chapterIndex + 1}.json`),
        JSON.stringify(chapter, null, 2)
      );
    });
  });
  
  const totalChapters = Object.values(completeStory.chapters).reduce((sum, chaps) => sum + chaps.length, 0);
  console.log(`✅ Saved ${totalChapters} chapter files`);
  
  // Save scenes
  writeFileSync(
    join(outputDir, 'scenes', 'all-scenes.json'),
    JSON.stringify(completeStory.scenes, null, 2)
  );
  
  Object.entries(completeStory.scenes).forEach(([partNum, partScenes]) => {
    Object.entries(partScenes).forEach(([chapNum, chapterScenes]) => {
      chapterScenes.forEach((scene, sceneIndex) => {
        writeFileSync(
          join(outputDir, 'scenes', `part-${partNum}-chapter-${chapNum}-scene-${sceneIndex + 1}.json`),
          JSON.stringify(scene, null, 2)
        );
      });
    });
  });
  
  const totalScenes = Object.values(completeStory.scenes).reduce((sum, part) => 
    sum + Object.values(part).reduce((partSum, chap) => partSum + chap.length, 0), 0);
  console.log(`✅ Saved ${totalScenes} scene files`);
  
  // Save complete data structure
  writeFileSync(
    join(outputDir, 'complete-story-data.json'),
    JSON.stringify(completeStory, null, 2)
  );
  console.log('✅ Saved complete-story-data.json');
  
  // Generate summary
  const summary = {
    title: completeStory.story.title,
    genre: completeStory.story.genre,
    totalWords: completeStory.story.words,
    language: completeStory.story.language,
    parts: completeStory.parts.length,
    chapters: totalChapters,
    scenes: totalScenes,
    characters: Object.keys(completeStory.story.chars).length,
    themes: completeStory.story.themes,
    generatedAt: new Date().toISOString(),
    outputDirectory: outputDir
  };
  
  writeFileSync(
    join(outputDir, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('✅ Saved summary.json');
  console.log(`\n📊 Generation Summary:`);
  console.log(`   Title: ${summary.title}`);
  console.log(`   Genre: ${summary.genre}`);
  console.log(`   Target Words: ${summary.totalWords.toLocaleString()}`);
  console.log(`   Parts: ${summary.parts}`);
  console.log(`   Chapters: ${summary.chapters}`);
  console.log(`   Scenes: ${summary.scenes}`);
  console.log(`   Characters: ${summary.characters}`);
  console.log(`   Output: ${outputDir}`);
}

async function main() {
  try {
    console.log('📝 Shadows of Responsibility - Complete Story Generator');
    console.log('====================================================\n');
    
    const completeStory = await generateCompleteStory();
    await saveStoryData(completeStory);
    
    console.log('\n🎉 Story generation completed successfully!');
    console.log('All files saved to: generated-story/');
    
  } catch (error) {
    console.error('\n❌ Error during story generation:');
    console.error(error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { generateCompleteStory, saveStoryData };