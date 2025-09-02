#!/usr/bin/env tsx

import { generateStoryFromPrompt } from '../src/lib/ai/story-development';
import { db } from '../src/lib/db';
import { stories, parts, chapters, scenes } from '../src/lib/db/schema';
import { nanoid } from 'nanoid';

// Story prompt based on our detailed outline
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
Part 1 "Discovery" (25% - 5 chapters): Elena discovers power and begins using it to help people, saves Sarah from suicide
Part 2 "Escalation" (50% - 10 chapters): Elena's power use corrupts her judgment, realizes she's becoming like Marcus  
Part 3 "Resolution" (25% - 6 chapters): Elena must stop Marcus without becoming him, learns to guide rather than control

Target: 85,000 words total, weekly publication, 4,000 word chapters, 21 chapters across 3 parts.
`;

const USER_ID = 'shadows-story-author';
const LANGUAGE = 'English';

interface DetailedChapterData {
  chap: number;
  title: string;
  pov: string;
  words: number;
  goal: string;
  conflict: string;
  outcome: string;
}

interface DetailedSceneData {
  id: number;
  title: string;
  summary: string;
  time: string;
  place: string;
  goal: string;
  obstacle: string;
  outcome: string;
}

async function createShadowsOfResponsibilityComplete() {
  console.log('🚀 Starting complete creation of "Shadows of Responsibility" story...');
  console.log('📝 Using direct story generation functions...');
  
  try {
    // Step 1: Generate the complete story using AI
    console.log('\n📚 Step 1: Generating story structure with AI...');
    const generatedStory = await generateStoryFromPrompt(STORY_PROMPT, USER_ID, LANGUAGE);
    
    console.log(`✅ Generated story: "${generatedStory.title}"`);
    console.log(`📊 Story details: ${generatedStory.words} words, ${generatedStory.parts?.length || 0} parts`);
    
    // Step 2: Store main story in database
    console.log('\n💾 Step 2: Storing main story in database...');
    const storyId = nanoid();
    
    const [story] = await db.insert(stories).values({
      id: storyId,
      title: generatedStory.title || 'Shadows of Responsibility',
      description: generatedStory.question || 'A psychological thriller about moral choices and supernatural power',
      genre: generatedStory.genre || 'urban_fantasy',
      authorId: USER_ID,
      targetWordCount: generatedStory.words || 85000,
      status: 'draft',
      isPublic: false,
      storyData: generatedStory, // Store complete AI-generated data
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log(`✅ Story stored with ID: ${storyId}`);
    
    // Step 3: Create all parts with detailed structure
    console.log('\n📖 Step 3: Creating parts with detailed structure...');
    const createdParts = [];
    
    // Ensure we have parts data
    const storyParts = generatedStory.parts || [
      { part: 1, goal: "Elena discovers power and begins using it to help people", conflict: "Internal struggle between helping others and maintaining ethical standards", outcome: "Elena chooses to embrace her power to prevent a suicide", tension: "ethical_boundaries_vs_immediate_help" },
      { part: 2, goal: "Elena tries to use power responsibly while bigger threats emerge", conflict: "Each use of power makes moral decisions easier but corrupts her judgment", outcome: "Elena realizes she's becoming like Marcus and must find another way", tension: "good_intentions_vs_growing_corruption" },
      { part: 3, goal: "Elena must stop Marcus without becoming him", conflict: "Final confrontation where Elena must choose between control and guidance", outcome: "Elena defeats Marcus by inspiring others rather than controlling them", tension: "power_vs_wisdom" }
    ];
    
    for (let partIndex = 0; partIndex < storyParts.length; partIndex++) {
      const storyPart = storyParts[partIndex];
      const partId = nanoid();
      
      // Calculate word count based on distribution (25%, 50%, 25%)
      const distributions = [25, 50, 25];
      const partWordCount = Math.floor((generatedStory.words || 85000) * (distributions[partIndex] / 100));
      
      // Determine number of chapters per part (5, 10, 6)
      const chapterCounts = [5, 10, 6];
      const chapterCount = chapterCounts[partIndex] || 5;
      
      console.log(`  📘 Creating Part ${storyPart.part}: ${storyPart.goal?.substring(0, 50)}...`);
      
      // Create part
      const [part] = await db.insert(parts).values({
        id: partId,
        title: `Part ${storyPart.part}: ${getPartTitle(storyPart.part)}`,
        description: storyPart.goal,
        storyId: storyId,
        authorId: USER_ID,
        orderIndex: storyPart.part,
        targetWordCount: partWordCount,
        status: 'planned',
        partData: storyPart,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      createdParts.push(part);
      
      // Step 4: Create chapters for this part
      console.log(`    📄 Creating ${chapterCount} chapters for Part ${storyPart.part}...`);
      
      for (let chapterIndex = 1; chapterIndex <= chapterCount; chapterIndex++) {
        const chapterId = nanoid();
        const chapterTitle = getChapterTitle(storyPart.part, chapterIndex);
        const chapterWords = Math.floor(partWordCount / chapterCount);
        
        await db.insert(chapters).values({
          id: chapterId,
          title: chapterTitle,
          storyId: storyId,
          partId: partId,
          authorId: USER_ID,
          orderIndex: chapterIndex,
          targetWordCount: chapterWords,
          status: 'planned',
          content: `# ${chapterTitle}\n\n*This chapter is part of the ${getPartTitle(storyPart.part)} section of "Shadows of Responsibility".*\n\n*Target word count: ${chapterWords.toLocaleString()} words*\n\n---\n\n*Chapter content to be written...*`,
          wordCount: 0,
          purpose: getChapterPurpose(storyPart.part, chapterIndex),
          hook: getChapterHook(storyPart.part, chapterIndex),
          characterFocus: 'Elena Vasquez',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        console.log(`      ✅ Chapter ${chapterIndex}: "${chapterTitle}"`);
        
        // Step 5: Create 3-4 scenes per chapter
        const sceneCount = chapterIndex % 2 === 0 ? 4 : 3; // Alternate between 3 and 4 scenes
        
        for (let sceneIndex = 1; sceneIndex <= sceneCount; sceneIndex++) {
          const sceneId = nanoid();
          const sceneSummary = getSceneSummary(storyPart.part, chapterIndex, sceneIndex);
          
          await db.insert(scenes).values({
            id: sceneId,
            title: `Scene ${sceneIndex}: ${sceneSummary}`,
            chapterId: chapterId,
            orderIndex: sceneIndex,
            goal: getSceneGoal(storyPart.part, chapterIndex, sceneIndex),
            conflict: getSceneConflict(storyPart.part, chapterIndex, sceneIndex),
            outcome: getSceneOutcome(storyPart.part, chapterIndex, sceneIndex),
            status: 'planned',
            content: `*Scene ${sceneIndex} of Chapter ${chapterIndex} - ${sceneSummary}*\n\n*Part of ${getPartTitle(storyPart.part)}*\n\n*Scene content to be written...*`,
            wordCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        
        console.log(`      📝 Created ${sceneCount} scenes for chapter`);
      }
      
      console.log(`  ✅ Part ${storyPart.part} completed with ${chapterCount} chapters`);
    }
    
    // Step 6: Final verification
    console.log('\n🔍 Step 6: Verifying story structure...');
    
    const storyStats = {
      storyId: storyId,
      title: story.title,
      genre: story.genre,
      targetWords: story.targetWordCount,
      parts: createdParts.length,
      totalChapters: 0,
      totalScenes: 0
    };
    
    // Count chapters and scenes
    for (const part of createdParts) {
      const partChapters = await db.query.chapters.findMany({
        where: (chapters, { eq }) => eq(chapters.partId, part.id)
      });
      
      storyStats.totalChapters += partChapters.length;
      
      for (const chapter of partChapters) {
        const chapterScenes = await db.query.scenes.findMany({
          where: (scenes, { eq }) => eq(scenes.chapterId, chapter.id)
        });
        storyStats.totalScenes += chapterScenes.length;
      }
    }
    
    console.log('\n📊 Final Story Statistics:');
    console.log(`   📚 Title: ${storyStats.title}`);
    console.log(`   🎭 Genre: ${storyStats.genre}`);
    console.log(`   📝 Target Words: ${storyStats.targetWords?.toLocaleString()}`);
    console.log(`   📖 Parts: ${storyStats.parts}`);
    console.log(`   📄 Chapters: ${storyStats.totalChapters}`);
    console.log(`   🎬 Scenes: ${storyStats.totalScenes}`);
    
    console.log('\n🎉 "Shadows of Responsibility" story creation completed successfully!');
    console.log(`✅ Story accessible in database with ID: ${storyId}`);
    
    return {
      success: true,
      story: story,
      parts: createdParts,
      statistics: storyStats,
      generatedData: generatedStory
    };
    
  } catch (error) {
    console.error('\n❌ Error creating story:', error);
    throw error;
  }
}

// Helper functions to generate specific content based on our outline
function getPartTitle(partNumber: number): string {
  const titles = {
    1: 'Discovery',
    2: 'Escalation', 
    3: 'Resolution'
  };
  return titles[partNumber as keyof typeof titles] || `Part ${partNumber}`;
}

function getChapterTitle(partNumber: number, chapterNumber: number): string {
  // Part 1 chapters (5 chapters)
  if (partNumber === 1) {
    const part1Chapters = [
      'The Ethics of Seeing',
      'First Intervention',
      'The Suicide Watch',
      'Lines Crossed',
      'The Watcher'
    ];
    return part1Chapters[chapterNumber - 1] || `Chapter ${chapterNumber}`;
  }
  
  // Part 2 chapters (10 chapters) 
  if (partNumber === 2) {
    const part2Chapters = [
      'The Previous Student',
      'Gradual Corruption',
      'The Helper\'s High',
      'Marcus\'s Vision',
      'The Accuser',
      'Recognition',
      'The Cascade',
      'Point of No Return',
      'The Convert',
      'Dark Reflection'
    ];
    return part2Chapters[chapterNumber - 1] || `Chapter ${chapterNumber + 5}`;
  }
  
  // Part 3 chapters (6 chapters)
  if (partNumber === 3) {
    const part3Chapters = [
      'The Other Way',
      'Building Light',
      'The Gathering Storm',
      'Tower of Choices',
      'Guiding Light',
      'New Ethics'
    ];
    return part3Chapters[chapterNumber - 1] || `Chapter ${chapterNumber + 15}`;
  }
  
  return `Chapter ${chapterNumber}`;
}

function getChapterPurpose(partNumber: number, chapterNumber: number): string {
  if (partNumber === 1) {
    const purposes = [
      'Establish Elena\'s normal life and first supernatural experience',
      'Elena discovers she can influence moral choices through shadows',
      'Elena discovers Sarah\'s suicidal ideation through shadow-sight',
      'Elena saves Sarah by manipulating her moral choice to seek help',
      'Elena encounters more moral crises and meets mysterious Marcus'
    ];
    return purposes[chapterNumber - 1] || 'Advance the story';
  }
  
  if (partNumber === 2) {
    const purposes = [
      'Elena learns about Dr. Rivera\'s past with Marcus and the dangers of power',
      'Elena continues using her power, each time more easily than before',
      'Elena experiences the addictive nature of "helping" others',
      'Marcus reveals his plan to create a morally perfect society',
      'Elena uses her power to punish someone she believes deserves it',
      'Elena sees herself clearly for the first time in Marcus\'s philosophy',
      'Without Elena\'s interventions, campus incidents escalate',
      'Major campus crisis forces Elena to use her power extensively',
      'Elena mind-controls an innocent person to prevent them from interfering',
      'Elena and Marcus have their first direct confrontation'
    ];
    return purposes[chapterNumber - 1] || 'Escalate the conflict';
  }
  
  if (partNumber === 3) {
    const purposes = [
      'Elena discovers she can inspire good choices rather than forcing them',
      'Elena builds a network of students who choose to help each other',
      'Marcus begins his final plan to control everyone on campus',
      'Final confrontation in the campus bell tower',
      'Elena defeats Marcus by inspiring his followers to choose freedom',
      'Epilogue showing the long-term consequences of Elena\'s choice'
    ];
    return purposes[chapterNumber - 1] || 'Resolve the story';
  }
  
  return 'Develop the narrative';
}

function getChapterHook(partNumber: number, chapterNumber: number): string {
  if (partNumber === 1) {
    const hooks = [
      'Elena notices strange shadows during heated moral discussions',
      'Elena realizes she can touch and influence the shadows',
      'Elena realizes Sarah\'s shadow indicates suicidal thoughts',
      'Elena saved a life but feels the addictive rush of total control',
      'Marcus reveals himself as someone who understands Elena\'s power'
    ];
    return hooks[chapterNumber - 1] || 'Create anticipation for next chapter';
  }
  
  return 'Build tension and anticipation';
}

function getSceneSummary(partNumber: number, chapterNumber: number, sceneNumber: number): string {
  return `P${partNumber}C${chapterNumber}S${sceneNumber} scene`;
}

function getSceneGoal(partNumber: number, chapterNumber: number, sceneNumber: number): string {
  return `Advance Chapter ${chapterNumber} narrative`;
}

function getSceneConflict(partNumber: number, chapterNumber: number, sceneNumber: number): string {
  return `Scene-level obstacle in Chapter ${chapterNumber}`;
}

function getSceneOutcome(partNumber: number, chapterNumber: number, sceneNumber: number): string {
  return `Progress toward Chapter ${chapterNumber} resolution`;
}

// Run the script
async function main() {
  try {
    console.log('📝 Shadows of Responsibility - Complete Story Creation Script');
    console.log('===============================================================\n');
    
    const result = await createShadowsOfResponsibilityComplete();
    
    if (result.success) {
      console.log('\n🎊 SUCCESS! Story creation completed.');
      console.log('📁 Story data is now in the database and ready for use.');
    }
    
  } catch (error) {
    console.error('\n💥 FAILED! Story creation encountered an error:');
    console.error(error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { createShadowsOfResponsibilityComplete, main as createShadowsStoryDirect };