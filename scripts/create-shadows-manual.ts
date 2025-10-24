#!/usr/bin/env tsx

import { db } from '../src/lib/db';
import { stories, parts, chapters, scenes, users } from '../src/lib/db/schema';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

// We'll use the existing writer user
let USER_ID = 'AIDDhSOzqzMLPQ7m5-esg'; // Default to known writer user ID

async function createShadowsOfResponsibilityManual() {
  console.log('🚀 Creating "Shadows of Responsibility" story manually...');
  
  try {
    // Step 0: Get or create writer user
    console.log('👤 Step 0: Finding writer user...');
    const writerUser = await db.select().from(users).where(eq(users.email, 'write@fictures.com')).limit(1);
    
    if (writerUser.length > 0) {
      USER_ID = writerUser[0].id;
      console.log(`✅ Found writer user: ${writerUser[0].email} (ID: ${USER_ID})`);
    } else {
      console.log('❌ Writer user not found. Please run fix-writer-email-password.ts first');
      throw new Error('Writer user not found');
    }
    // Step 1: Create main story
    console.log('📚 Step 1: Creating main story record...');
    const storyId = nanoid();
    
    const [story] = await db.insert(stories).values({
      id: storyId,
      title: 'Shadows of Responsibility',
      description: 'Dr. Elena Vasquez, a brilliant cognitive psychologist and university ethics committee chair, discovers she has the power to see and influence people\'s moral decisions as shadowy representations of their conscience. When a series of campus incidents escalate into life-threatening situations, Elena must grapple with whether to use her dangerous abilities to prevent harm, knowing that each intervention corrupts her own moral compass and threatens to turn her into the very thing she fights against.',
      genre: 'urban_fantasy',
      authorId: USER_ID,
      targetWordCount: 85000,
      status: 'draft',
      isPublic: false,
      storyData: {
        title: 'Shadows of Responsibility',
        genre: 'urban_fantasy',
        words: 85000,
        characters: {
          'Elena Vasquez': 'Protagonist - cognitive psychologist with shadow-sight powers',
          'Marcus Chen': 'Antagonist - wants to create perfect moral society through control',
          'Dr. James Rivera': 'Mentor - haunted by past failure with previous student',
          'Sarah Thompson': 'Student/catalyst - first major test case',
          'Detective Lisa Park': 'Ally - grounds story in realistic consequences'
        },
        themes: ['Responsibility vs control', 'Moral agency', 'Corruption of power', 'Redemption'],
        setting: 'Riverside University, San Francisco'
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log(`✅ Story created with ID: ${storyId}`);
    
    // Step 2: Create Parts
    console.log('📖 Step 2: Creating story parts...');
    
    const partData = [
      {
        part: 1,
        title: 'Discovery',
        goal: 'Elena discovers power and begins using it to help people, saves Sarah from suicide',
        conflict: 'Internal struggle between helping others and maintaining ethical standards',
        outcome: 'Elena chooses to embrace her power to prevent a suicide',
        tension: 'ethical_boundaries_vs_immediate_help',
        wordCount: 21250, // 25% of 85,000
        chapters: 5
      },
      {
        part: 2,
        title: 'Escalation', 
        goal: 'Elena tries to use power responsibly while bigger threats emerge',
        conflict: 'Each use of power makes moral decisions easier but corrupts her judgment',
        outcome: 'Elena realizes she\'s becoming like Marcus and must find another way',
        tension: 'good_intentions_vs_growing_corruption',
        wordCount: 42500, // 50% of 85,000
        chapters: 10
      },
      {
        part: 3,
        title: 'Resolution',
        goal: 'Elena must stop Marcus without becoming him',
        conflict: 'Final confrontation where Elena must choose between control and guidance',
        outcome: 'Elena defeats Marcus by inspiring others rather than controlling them',
        tension: 'power_vs_wisdom',
        wordCount: 21250, // 25% of 85,000
        chapters: 6
      }
    ];
    
    const createdParts = [];
    
    for (const partInfo of partData) {
      const partId = nanoid();
      
      const [part] = await db.insert(parts).values({
        id: partId,
        title: `Part ${partInfo.part}: ${partInfo.title}`,
        description: partInfo.goal,
        storyId: storyId,
        authorId: USER_ID,
        orderIndex: partInfo.part,
        targetWordCount: partInfo.wordCount,
        status: 'planned',
        partData: partInfo,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      createdParts.push({ ...part, chapters: partInfo.chapters });
      console.log(`✅ Created Part ${partInfo.part}: ${partInfo.title}`);
    }
    
    // Step 3: Create Chapters
    console.log('📄 Step 3: Creating chapters...');
    
    const chapterTitles = {
      1: ['The Ethics of Seeing', 'First Intervention', 'The Suicide Watch', 'Lines Crossed', 'The Watcher'],
      2: ['The Previous Student', 'Gradual Corruption', 'The Helper\'s High', 'Marcus\'s Vision', 'The Accuser', 'Recognition', 'The Cascade', 'Point of No Return', 'The Convert', 'Dark Reflection'],
      3: ['The Other Way', 'Building Light', 'The Gathering Storm', 'Tower of Choices', 'Guiding Light', 'New Ethics']
    };
    
    let totalChapters = 0;
    let totalScenes = 0;
    
    for (const part of createdParts) {
      const partNumber = part.orderIndex;
      const chapterList = chapterTitles[partNumber as keyof typeof chapterTitles] || [];
      const chapterWordCount = Math.floor(part.targetWordCount! / chapterList.length);
      
      for (let chapterIndex = 0; chapterIndex < chapterList.length; chapterIndex++) {
        const chapterId = nanoid();
        const chapterTitle = chapterList[chapterIndex];
        
        await db.insert(chapters).values({
          id: chapterId,
          title: chapterTitle,
          storyId: storyId,
          partId: part.id,
          authorId: USER_ID,
          orderIndex: chapterIndex + 1,
          targetWordCount: chapterWordCount,
          status: 'planned',
          content: `# ${chapterTitle}\n\n*This chapter is part of ${part.title} in "Shadows of Responsibility".*\n\n*Target word count: ${chapterWordCount.toLocaleString()} words*\n\n---\n\n*Chapter content to be written...*`,
          wordCount: 0,
          purpose: getChapterPurpose(partNumber, chapterIndex + 1),
          hook: getChapterHook(partNumber, chapterIndex + 1),
          characterFocus: 'Elena Vasquez',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        totalChapters++;
        console.log(`  ✅ Chapter ${totalChapters}: "${chapterTitle}"`);
        
        // Step 4: Create 3-4 scenes per chapter
        const sceneCount = (chapterIndex + 1) % 2 === 0 ? 4 : 3;
        
        for (let sceneIndex = 1; sceneIndex <= sceneCount; sceneIndex++) {
          const sceneId = nanoid();
          const sceneSummary = getSceneSummary(partNumber, chapterIndex + 1, sceneIndex);
          
          await db.insert(scenes).values({
            id: sceneId,
            title: `Scene ${sceneIndex}: ${sceneSummary}`,
            chapterId: chapterId,
            orderIndex: sceneIndex,
            goal: getSceneGoal(partNumber, chapterIndex + 1, sceneIndex),
            conflict: getSceneConflict(partNumber, chapterIndex + 1, sceneIndex),
            outcome: getSceneOutcome(partNumber, chapterIndex + 1, sceneIndex),
            status: 'planned',
            content: `*Scene ${sceneIndex} of Chapter "${chapterTitle}" - ${sceneSummary}*\n\n*Part of ${part.title}*\n\n*Scene content to be written...*`,
            wordCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          totalScenes++;
        }
        
        console.log(`    📝 Created ${sceneCount} scenes for chapter`);
      }
      
      console.log(`✅ Part ${partNumber} completed with ${chapterList.length} chapters`);
    }
    
    // Step 5: Final summary
    console.log('\n📊 Final Story Statistics:');
    console.log(`   📚 Title: Shadows of Responsibility`);
    console.log(`   🎭 Genre: Urban Fantasy/Psychological Thriller`);
    console.log(`   📝 Target Words: 85,000`);
    console.log(`   📖 Parts: 3`);
    console.log(`   📄 Chapters: ${totalChapters}`);
    console.log(`   🎬 Scenes: ${totalScenes}`);
    
    console.log('\n🎉 "Shadows of Responsibility" story creation completed successfully!');
    console.log(`✅ Story accessible in database with ID: ${storyId}`);
    
    return {
      success: true,
      storyId: storyId,
      title: 'Shadows of Responsibility',
      parts: 3,
      chapters: totalChapters,
      scenes: totalScenes
    };
    
  } catch (error) {
    console.error('\n❌ Error creating story:', error);
    throw error;
  }
}

// Helper functions
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
    console.log('📝 Shadows of Responsibility - Manual Story Creation Script');
    console.log('===========================================================\n');
    
    const result = await createShadowsOfResponsibilityManual();
    
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

export { createShadowsOfResponsibilityManual, main as createShadowsStoryManual };