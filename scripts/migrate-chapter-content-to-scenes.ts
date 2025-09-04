import { db } from '@/lib/db';
import { chapters, scenes } from '@/lib/db/schema';
import { eq, isNotNull, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Migration script to convert existing chapter.content into individual scenes
 * This allows the UnifiedWritingEditor to properly edit content that was stored
 * directly in the chapters table instead of the scenes table.
 */

interface ChapterToMigrate {
  id: string;
  title: string;
  content: string;
  storyId: string;
}

/**
 * Split chapter content into logical scenes based on paragraph breaks and content structure
 */
function splitContentIntoScenes(content: string, chapterTitle: string): Array<{
  title: string;
  content: string;
  orderIndex: number;
}> {
  if (!content || content.trim().length === 0) {
    return [];
  }

  // Remove the chapter header and metadata if present
  let cleanContent = content
    .replace(/^[🚀✅🔄📝]\s*/, '') // Remove status icons
    .replace(/^Chapter\s+\d+[^\n]*\n?/, '') // Remove "Chapter X" lines
    .replace(/^\d+\s+words[^\n]*\n?/, '') // Remove word count lines
    .replace(/^#\s*Chapter[^\n]*\n?/m, '') // Remove markdown chapter headers
    .trim();

  // Split content into paragraphs
  const paragraphs = cleanContent
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length === 0) {
    return [];
  }

  // Group paragraphs into scenes (roughly 3-5 paragraphs per scene, or by natural breaks)
  const sceneGroups: string[][] = [];
  let currentGroup: string[] = [];
  
  for (const paragraph of paragraphs) {
    currentGroup.push(paragraph);
    
    // Create a new scene group if:
    // 1. We have 4+ paragraphs in current group, OR
    // 2. This paragraph seems like a natural break (dialogue ending, action sequence, etc.)
    const seemsLikeBreak = paragraph.length < 100 || // Short paragraph often indicates transition
                          paragraph.endsWith('."') || // Dialogue ending
                          paragraph.includes('***') || // Scene break marker
                          paragraph.includes('---'); // Scene break marker
                          
    if (currentGroup.length >= 4 || (currentGroup.length >= 2 && seemsLikeBreak)) {
      sceneGroups.push([...currentGroup]);
      currentGroup = [];
    }
  }
  
  // Add remaining paragraphs as final scene
  if (currentGroup.length > 0) {
    sceneGroups.push(currentGroup);
  }

  // Convert groups into scenes
  return sceneGroups.map((group, index) => {
    const sceneContent = group.join('\n\n');
    
    // Generate scene title based on content
    const firstSentence = group[0].split('.')[0].substring(0, 50);
    const sceneTitle = generateSceneTitle(firstSentence, index + 1, chapterTitle);
    
    return {
      title: sceneTitle,
      content: sceneContent,
      orderIndex: index + 1
    };
  });
}

/**
 * Generate a meaningful scene title based on content and context
 */
function generateSceneTitle(firstSentence: string, sceneNumber: number, chapterTitle: string): string {
  // Clean up the first sentence
  const cleanSentence = firstSentence
    .replace(/^["']/, '') // Remove leading quotes
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Try to extract key words that aren't common words
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'was', 'is', 'are', 'were', 'been', 'have', 'has', 'had']);
  const words = cleanSentence.toLowerCase().split(' ').filter(word => 
    word.length > 2 && !commonWords.has(word)
  );

  if (words.length > 0) {
    // Take first 2-3 meaningful words and capitalize them
    const keyWords = words.slice(0, 3).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    if (keyWords.length > 5) {
      return `Scene ${sceneNumber}: ${keyWords}`;
    }
  }

  // Fallback to generic naming
  return `Scene ${sceneNumber}`;
}

/**
 * Calculate word count for content
 */
function calculateWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Main migration function
 */
export async function migrateChapterContentToScenes(dryRun = true) {
  console.log('🔄 Starting chapter content to scenes migration...');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
  
  try {
    // Find chapters that have content but no scenes
    const chaptersWithContent = await db
      .select({
        id: chapters.id,
        title: chapters.title,
        content: chapters.content,
        storyId: chapters.storyId
      })
      .from(chapters)
      .where(
        and(
          isNotNull(chapters.content),
          // Only migrate chapters with substantial content
        )
      );

    console.log(`📚 Found ${chaptersWithContent.length} chapters with direct content`);

    const chaptersToMigrate: ChapterToMigrate[] = [];
    
    // Check which chapters actually need migration (have content but no scenes)
    for (const chapter of chaptersWithContent) {
      if (!chapter.content || chapter.content.trim().length < 100) {
        continue; // Skip chapters with minimal content
      }

      // Check if chapter already has scenes
      const existingScenes = await db
        .select({ count: scenes.id })
        .from(scenes)
        .where(eq(scenes.chapterId, chapter.id));

      if (existingScenes.length === 0) {
        chaptersToMigrate.push(chapter as ChapterToMigrate);
        console.log(`📝 Chapter "${chapter.title}" needs migration (${chapter.content?.length} chars, 0 scenes)`);
      } else {
        console.log(`✅ Chapter "${chapter.title}" already has ${existingScenes.length} scenes`);
      }
    }

    if (chaptersToMigrate.length === 0) {
      console.log('✅ No chapters need migration');
      return;
    }

    console.log(`\n🎯 ${chaptersToMigrate.length} chapters will be migrated:`);
    
    let totalScenesCreated = 0;

    for (const chapter of chaptersToMigrate) {
      console.log(`\n--- Migrating "${chapter.title}" ---`);
      
      // Split content into scenes
      const sceneData = splitContentIntoScenes(chapter.content, chapter.title);
      
      console.log(`📄 Split into ${sceneData.length} scenes:`);
      sceneData.forEach((scene, idx) => {
        console.log(`  ${idx + 1}. "${scene.title}" (${calculateWordCount(scene.content)} words)`);
      });

      if (!dryRun && sceneData.length > 0) {
        // Create scenes in database
        const scenesToInsert = sceneData.map(scene => ({
          id: nanoid(),
          chapterId: chapter.id,
          title: scene.title,
          content: scene.content,
          orderIndex: scene.orderIndex,
          wordCount: calculateWordCount(scene.content),
          goal: '', // Will be filled by users later
          conflict: '', // Will be filled by users later
          outcome: '', // Will be filled by users later
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        await db.insert(scenes).values(scenesToInsert);
        
        // Clear the chapter content since it's now in scenes
        await db
          .update(chapters)
          .set({ 
            content: null, // Clear direct content
            updatedAt: new Date()
          })
          .where(eq(chapters.id, chapter.id));

        console.log(`✅ Created ${scenesToInsert.length} scenes and cleared chapter content`);
        totalScenesCreated += scenesToInsert.length;
      }
    }

    if (dryRun) {
      console.log('\n🔍 DRY RUN COMPLETED - No changes made to database');
      console.log('Run with dryRun=false to apply changes');
    } else {
      console.log(`\n✅ MIGRATION COMPLETED`);
      console.log(`📊 Summary:`);
      console.log(`  - Chapters migrated: ${chaptersToMigrate.length}`);
      console.log(`  - Scenes created: ${totalScenesCreated}`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--execute');
  
  migrateChapterContentToScenes(dryRun)
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}