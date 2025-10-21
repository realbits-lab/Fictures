import { db } from '@/lib/db';
import { stories, parts, chapters, scenes } from '@/lib/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * RelationshipManager handles bi-directional database relationships
 * ensuring data consistency across the story hierarchy
 */
export class RelationshipManager {
  /**
   * Add a part to a story, updating both sides of the relationship
   */
  static async addPartToStory(storyId: string, partData: Partial<typeof parts.$inferInsert>): Promise<string> {
    const partId = nanoid();
    
    return await db.transaction(async (tx) => {
      // Create the part
      await tx.insert(parts).values({
        id: partId,
        storyId,
        title: partData.title!,
        description: partData.description,
        authorId: partData.authorId!,
        orderIndex: partData.orderIndex!,
        targetWordCount: partData.targetWordCount,
        currentWordCount: partData.currentWordCount,
        content: partData.content,
        chapterIds: partData.chapterIds || [],
      });
      
      // Update story's part IDs
      await tx.update(stories)
        .set({
          partIds: sql`(COALESCE(part_ids, '[]'::json)::jsonb || ${JSON.stringify([partId])}::jsonb)::json`,
          updatedAt: new Date()
        })
        .where(eq(stories.id, storyId));
        
      return partId;
    });
  }

  /**
   * Add a chapter to a story/part, updating all relevant relationships
   */
  static async addChapterToStory(
    storyId: string, 
    chapterData: Partial<typeof chapters.$inferInsert>,
    partId?: string
  ): Promise<string> {
    const chapterId = nanoid();
    
    return await db.transaction(async (tx) => {
      // Create the chapter
      await tx.insert(chapters).values({
        id: chapterId,
        storyId,
        partId,
        title: chapterData.title!,
        authorId: chapterData.authorId!,
        orderIndex: chapterData.orderIndex!,
        status: chapterData.status,
        summary: chapterData.summary,
        targetWordCount: chapterData.targetWordCount,
        sceneIds: chapterData.sceneIds || [],
      });
      
      // Update story's chapter IDs
      await tx.update(stories)
        .set({
          chapterIds: sql`(COALESCE(chapter_ids, '[]'::json)::jsonb || ${JSON.stringify([chapterId])}::jsonb)::json`,
          updatedAt: new Date()
        })
        .where(eq(stories.id, storyId));
      
      // If part is specified, update part's chapter IDs
      if (partId) {
        await tx.update(parts)
          .set({
            chapterIds: sql`(COALESCE(chapter_ids, '[]'::json)::jsonb || ${JSON.stringify([chapterId])}::jsonb)::json`,
            updatedAt: new Date()
          })
          .where(eq(parts.id, partId));
      }
      
      return chapterId;
    });
  }

  /**
   * Add a scene to a chapter, updating bi-directional relationships
   */
  static async addSceneToChapter(
    chapterId: string, 
    sceneData: Partial<typeof scenes.$inferInsert>
  ): Promise<string> {
    const sceneId = nanoid();
    
    return await db.transaction(async (tx) => {
      // Create the scene
      await tx.insert(scenes).values({
        id: sceneId,
        chapterId,
        title: sceneData.title!,
        orderIndex: sceneData.orderIndex!,
        content: sceneData.content,
        characterIds: sceneData.characterIds || [],
        placeIds: sceneData.placeIds || [],
      });
      
      // Update chapter's scene IDs
      await tx.update(chapters)
        .set({
          sceneIds: sql`(COALESCE(scene_ids, '[]'::json)::jsonb || ${JSON.stringify([sceneId])}::jsonb)::json`,
          updatedAt: new Date()
        })
        .where(eq(chapters.id, chapterId));
        
      return sceneId;
    });
  }

  /**
   * Move a chapter from one part to another (or to standalone)
   */
  static async moveChapter(chapterId: string, newPartId?: string): Promise<void> {
    return await db.transaction(async (tx) => {
      // Get current chapter info
      const [chapter] = await tx.select()
        .from(chapters)
        .where(eq(chapters.id, chapterId))
        .limit(1);
        
      if (!chapter) throw new Error(`Chapter ${chapterId} not found`);
      
      // Remove from old part if it exists
      if (chapter.partId) {
        await tx.update(parts)
          .set({ 
            chapterIds: sql`chapter_ids - ${chapterId}`,
            updatedAt: new Date()
          })
          .where(eq(parts.id, chapter.partId));
      }
      
      // Update chapter's part reference
      await tx.update(chapters)
        .set({ 
          partId: newPartId || null,
          updatedAt: new Date()
        })
        .where(eq(chapters.id, chapterId));
      
      // Add to new part if specified
      if (newPartId) {
        await tx.update(parts)
          .set({
            chapterIds: sql`(COALESCE(chapter_ids, '[]'::json)::jsonb || ${JSON.stringify([chapterId])}::jsonb)::json`,
            updatedAt: new Date()
          })
          .where(eq(parts.id, newPartId));
      }
    });
  }

  /**
   * Delete a chapter and clean up all relationships
   */
  static async deleteChapter(chapterId: string): Promise<void> {
    return await db.transaction(async (tx) => {
      // Get chapter info first
      const [chapter] = await tx.select()
        .from(chapters)
        .where(eq(chapters.id, chapterId))
        .limit(1);
        
      if (!chapter) return; // Already deleted
      
      // Delete all scenes first
      await tx.delete(scenes)
        .where(eq(scenes.chapterId, chapterId));
      
      // Remove from story's chapter IDs
      await tx.update(stories)
        .set({ 
          chapterIds: sql`chapter_ids - ${chapterId}`,
          updatedAt: new Date()
        })
        .where(eq(stories.id, chapter.storyId));
      
      // Remove from part's chapter IDs if part exists
      if (chapter.partId) {
        await tx.update(parts)
          .set({ 
            chapterIds: sql`chapter_ids - ${chapterId}`,
            updatedAt: new Date()
          })
          .where(eq(parts.id, chapter.partId));
      }
      
      // Delete the chapter itself
      await tx.delete(chapters)
        .where(eq(chapters.id, chapterId));
    });
  }

  /**
   * Delete a part and all its chapters/scenes
   */
  static async deletePart(partId: string): Promise<void> {
    return await db.transaction(async (tx) => {
      // Get part info first
      const [part] = await tx.select()
        .from(parts)
        .where(eq(parts.id, partId))
        .limit(1);
        
      if (!part) return; // Already deleted
      
      // Get all chapters in this part
      const partChapters = await tx.select()
        .from(chapters)
        .where(eq(chapters.partId, partId));
      
      // Delete all chapters and their scenes
      for (const chapter of partChapters) {
        await this.deleteChapter(chapter.id);
      }
      
      // Remove from story's part IDs
      await tx.update(stories)
        .set({ 
          partIds: sql`part_ids - ${partId}`,
          updatedAt: new Date()
        })
        .where(eq(stories.id, part.storyId));
      
      // Delete the part itself
      await tx.delete(parts)
        .where(eq(parts.id, partId));
    });
  }

  /**
   * Delete a scene and clean up chapter reference
   */
  static async deleteScene(sceneId: string): Promise<void> {
    return await db.transaction(async (tx) => {
      // Get scene info first
      const [scene] = await tx.select()
        .from(scenes)
        .where(eq(scenes.id, sceneId))
        .limit(1);
        
      if (!scene) return; // Already deleted
      
      // Remove from chapter's scene IDs
      await tx.update(chapters)
        .set({ 
          sceneIds: sql`scene_ids - ${sceneId}`,
          updatedAt: new Date()
        })
        .where(eq(chapters.id, scene.chapterId));
      
      // Delete the scene itself
      await tx.delete(scenes)
        .where(eq(scenes.id, sceneId));
    });
  }

  /**
   * Reorder chapters within a story or part
   */
  static async reorderChapters(chapterIds: string[]): Promise<void> {
    return await db.transaction(async (tx) => {
      for (let i = 0; i < chapterIds.length; i++) {
        await tx.update(chapters)
          .set({ 
            orderIndex: i + 1,
            updatedAt: new Date()
          })
          .where(eq(chapters.id, chapterIds[i]));
      }
    });
  }

  /**
   * Get story with all relationships populated via direct lookup
   * For reading mode, scenes are loaded separately on demand
   */
  static async getStoryWithStructure(storyId: string, includeScenes: boolean = true) {
    const [story] = await db.select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .limit(1);


    if (!story) return null;
    
    // Get parts directly using stored IDs
    const storyParts = story.partIds.length > 0 
      ? await db.select().from(parts).where(inArray(parts.id, story.partIds))
      : [];
    
    // Get standalone chapters directly using stored IDs
    const storyChapters = story.chapterIds.length > 0
      ? await db.select().from(chapters).where(inArray(chapters.id, story.chapterIds))
      : [];
    
    // Collect all chapter IDs from parts and story
    const allChapterIds = [
      ...story.chapterIds,
      ...storyParts.flatMap(part => part.chapterIds || [])
    ].filter(Boolean);
    
    // Get all chapters at once
    const allChapters = allChapterIds.length > 0
      ? await db.select().from(chapters).where(inArray(chapters.id, allChapterIds))
      : [];
    
    if (!includeScenes) {
      // For reading mode - don't load scenes, they'll be fetched on demand
      return {
        ...story,
        parts: storyParts.map(part => ({
          ...part,
          chapters: allChapters.filter(chapter => 
            (part.chapterIds || []).includes(chapter.id)
          ).map(chapter => ({
            ...chapter,
            scenes: undefined // Will be loaded on demand
          }))
        })),
        chapters: storyChapters.map(chapter => ({
          ...chapter,
          scenes: undefined // Will be loaded on demand
        }))
      };
    }
    
    // For writing mode - load all scenes
    const allSceneIds = allChapters
      .flatMap(chapter => chapter.sceneIds)
      .filter(Boolean);
    
    const allScenes = allSceneIds.length > 0
      ? await db.select().from(scenes).where(inArray(scenes.id, allSceneIds))
      : [];
    
    const result = {
      ...story,
      parts: storyParts.map(part => ({
        ...part,
        chapters: allChapters.filter(chapter => chapter.partId === part.id)
          .map(chapter => ({
            ...chapter,
            scenes: allScenes.filter(scene => scene.chapterId === chapter.id)
          }))
      })),
      chapters: storyChapters.filter(chapter => !chapter.partId)
        .map(chapter => ({
          ...chapter,
          scenes: allScenes.filter(scene => scene.chapterId === chapter.id)
        }))
    };


    return result;
  }

  /**
   * Validate bi-directional consistency (for debugging/maintenance)
   */
  static async validateConsistency(storyId: string): Promise<{
    isConsistent: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    const story = await db.select()
      .from(stories)
      .where(eq(stories.id, storyId))
      .then(rows => rows[0]);
    
    if (!story) {
      return { isConsistent: false, issues: ['Story not found'] };
    }
    
    // Check parts consistency
    const actualParts = await db.select()
      .from(parts)
      .where(eq(parts.storyId, storyId));
    
    const actualPartIds = actualParts.map(p => p.id).sort();
    const storedPartIds = [...story.partIds].sort();
    
    if (JSON.stringify(actualPartIds) !== JSON.stringify(storedPartIds)) {
      issues.push(`Part IDs mismatch: stored ${storedPartIds}, actual ${actualPartIds}`);
    }
    
    // Check chapters consistency
    const actualChapters = await db.select()
      .from(chapters)
      .where(eq(chapters.storyId, storyId));
    
    const actualChapterIds = actualChapters.map(c => c.id).sort();
    const storedChapterIds = [...story.chapterIds].sort();
    
    if (JSON.stringify(actualChapterIds) !== JSON.stringify(storedChapterIds)) {
      issues.push(`Chapter IDs mismatch: stored ${storedChapterIds}, actual ${actualChapterIds}`);
    }
    
    return {
      isConsistent: issues.length === 0,
      issues
    };
  }
}