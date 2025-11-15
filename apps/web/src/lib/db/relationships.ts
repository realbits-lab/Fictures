import { asc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { chapters, parts, scenes, stories } from "@/lib/schemas/database";

/**
 * RelationshipManager handles database relationships using foreign keys
 * All ordering is managed via orderIndex column
 */
export class RelationshipManager {
    /**
     * Add a part to a story
     */
    static async addPartToStory(
        storyId: string,
        partData: Partial<typeof parts.$inferInsert>,
    ): Promise<string> {
        const partId = `part_${nanoid()}`;

        return await db.transaction(async (tx) => {
            // Create the part with foreign key reference
            await tx.insert(parts).values({
                id: partId,
                storyId,
                title: partData.title!,
                summary: partData.summary,
                // authorId removed - access via story JOIN
                orderIndex: partData.orderIndex!,
            });

            // Update story timestamp
            await tx
                .update(stories)
                .set({ updatedAt: new Date() })
                .where(eq(stories.id, storyId));

            return partId;
        });
    }

    /**
     * Add a chapter to a story/part
     */
    static async addChapterToStory(
        storyId: string,
        chapterData: Partial<typeof chapters.$inferInsert>,
        partId?: string,
    ): Promise<string> {
        const chapterId = nanoid();

        return await db.transaction(async (tx) => {
            // Create the chapter with foreign key references
            await tx.insert(chapters).values({
                id: chapterId,
                storyId,
                partId: partId || null,
                title: chapterData.title!,
                // authorId removed - access via story JOIN
                orderIndex: chapterData.orderIndex!,
                status: chapterData.status,
                summary: chapterData.summary,
            });

            // Update parent timestamps
            await tx
                .update(stories)
                .set({ updatedAt: new Date() })
                .where(eq(stories.id, storyId));

            if (partId) {
                await tx
                    .update(parts)
                    .set({ updatedAt: new Date() })
                    .where(eq(parts.id, partId));
            }

            return chapterId;
        });
    }

    /**
     * Add a scene to a chapter
     */
    static async addSceneToChapter(
        chapterId: string,
        sceneData: Partial<typeof scenes.$inferInsert>,
    ): Promise<string> {
        const sceneId = nanoid();

        return await db.transaction(async (tx) => {
            // Create the scene with foreign key reference
            await tx.insert(scenes).values({
                id: sceneId,
                chapterId,
                title: sceneData.title!,
                orderIndex: sceneData.orderIndex!,
                content: sceneData.content,
                characterFocus: (sceneData as any).characterFocus || [],
                settingId: (sceneData as any).settingId,
            });

            // Update chapter timestamp
            await tx
                .update(chapters)
                .set({ updatedAt: new Date() })
                .where(eq(chapters.id, chapterId));

            return sceneId;
        });
    }

    /**
     * Move a chapter from one part to another (or to standalone)
     */
    static async moveChapter(
        chapterId: string,
        newPartId?: string,
    ): Promise<void> {
        return await db.transaction(async (tx) => {
            // Get current chapter info
            const [chapter] = await tx
                .select()
                .from(chapters)
                .where(eq(chapters.id, chapterId))
                .limit(1);

            if (!chapter) throw new Error(`Chapter ${chapterId} not found`);

            // Update chapter's part reference
            await tx
                .update(chapters)
                .set({
                    partId: newPartId || null,
                    updatedAt: new Date(),
                })
                .where(eq(chapters.id, chapterId));

            // Update timestamps on affected parts
            if (chapter.partId) {
                await tx
                    .update(parts)
                    .set({ updatedAt: new Date() })
                    .where(eq(parts.id, chapter.partId));
            }

            if (newPartId) {
                await tx
                    .update(parts)
                    .set({ updatedAt: new Date() })
                    .where(eq(parts.id, newPartId));
            }
        });
    }

    /**
     * Delete a chapter and all its scenes
     */
    static async deleteChapter(chapterId: string): Promise<void> {
        return await db.transaction(async (tx) => {
            // Get chapter info first
            const [chapter] = await tx
                .select()
                .from(chapters)
                .where(eq(chapters.id, chapterId))
                .limit(1);

            if (!chapter) return; // Already deleted

            // Delete all scenes (cascade should handle this, but being explicit)
            await tx.delete(scenes).where(eq(scenes.chapterId, chapterId));

            // Delete the chapter itself
            await tx.delete(chapters).where(eq(chapters.id, chapterId));

            // Update parent timestamps
            await tx
                .update(stories)
                .set({ updatedAt: new Date() })
                .where(eq(stories.id, chapter.storyId));

            if (chapter.partId) {
                await tx
                    .update(parts)
                    .set({ updatedAt: new Date() })
                    .where(eq(parts.id, chapter.partId));
            }
        });
    }

    /**
     * Delete a part and all its chapters/scenes
     */
    static async deletePart(partId: string): Promise<void> {
        return await db.transaction(async (tx) => {
            // Get part info first
            const [part] = await tx
                .select()
                .from(parts)
                .where(eq(parts.id, partId))
                .limit(1);

            if (!part) return; // Already deleted

            // Get all chapters in this part
            const partChapters = await tx
                .select()
                .from(chapters)
                .where(eq(chapters.partId, partId));

            // Delete all chapters and their scenes
            for (const chapter of partChapters) {
                await RelationshipManager.deleteChapter(chapter.id);
            }

            // Delete the part itself
            await tx.delete(parts).where(eq(parts.id, partId));

            // Update story timestamp
            await tx
                .update(stories)
                .set({ updatedAt: new Date() })
                .where(eq(stories.id, part.storyId));
        });
    }

    /**
     * Delete a scene
     */
    static async deleteScene(sceneId: string): Promise<void> {
        return await db.transaction(async (tx) => {
            // Get scene info first
            const [scene] = await tx
                .select()
                .from(scenes)
                .where(eq(scenes.id, sceneId))
                .limit(1);

            if (!scene) return; // Already deleted

            // Delete the scene itself
            await tx.delete(scenes).where(eq(scenes.id, sceneId));

            // Update chapter timestamp
            await tx
                .update(chapters)
                .set({ updatedAt: new Date() })
                .where(eq(chapters.id, scene.chapterId));
        });
    }

    /**
     * Reorder chapters within a story or part
     */
    static async reorderChapters(chapterIds: string[]): Promise<void> {
        return await db.transaction(async (tx) => {
            for (let i = 0; i < chapterIds.length; i++) {
                await tx
                    .update(chapters)
                    .set({
                        orderIndex: i + 1,
                        updatedAt: new Date(),
                    })
                    .where(eq(chapters.id, chapterIds[i]));
            }
        });
    }

    /**
     * Reorder parts within a story
     */
    static async reorderParts(partIds: string[]): Promise<void> {
        return await db.transaction(async (tx) => {
            for (let i = 0; i < partIds.length; i++) {
                await tx
                    .update(parts)
                    .set({
                        orderIndex: i + 1,
                        updatedAt: new Date(),
                    })
                    .where(eq(parts.id, partIds[i]));
            }
        });
    }

    /**
     * Reorder scenes within a chapter
     */
    static async reorderScenes(sceneIds: string[]): Promise<void> {
        return await db.transaction(async (tx) => {
            for (let i = 0; i < sceneIds.length; i++) {
                await tx
                    .update(scenes)
                    .set({
                        orderIndex: i + 1,
                        updatedAt: new Date(),
                    })
                    .where(eq(scenes.id, sceneIds[i]));
            }
        });
    }

    /**
     * Get story with all relationships populated using foreign key joins
     * For reading mode, scenes are loaded separately on demand
     */
    static async getStoryWithStructure(
        storyId: string,
        includeScenes: boolean = true,
    ) {
        const [story] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId))
            .limit(1);

        if (!story) return null;

        // Get all parts ordered by orderIndex
        const storyParts = await db
            .select()
            .from(parts)
            .where(eq(parts.storyId, storyId))
            .orderBy(asc(parts.orderIndex));

        // Get all chapters for this story ordered by orderIndex
        const allChapters = await db
            .select()
            .from(chapters)
            .where(eq(chapters.storyId, storyId))
            .orderBy(asc(chapters.orderIndex));

        if (!includeScenes) {
            // For reading mode - don't load scenes, they'll be fetched on demand
            return {
                ...story,
                parts: storyParts.map((part) => ({
                    ...part,
                    chapters: allChapters
                        .filter((chapter) => chapter.partId === part.id)
                        .map((chapter) => ({
                            ...chapter,
                            scenes: undefined, // Will be loaded on demand
                        })),
                })),
                chapters: allChapters
                    .filter((chapter) => !chapter.partId)
                    .map((chapter) => ({
                        ...chapter,
                        scenes: undefined, // Will be loaded on demand
                    })),
            };
        }

        // For writing mode - load all scenes
        // OPTIMIZATION: Fetch all scenes in a SINGLE query using inArray() instead of looping (fixes N+1 query problem)
        const chapterIds = allChapters.map((c) => c.id);

        console.log(
            `[DB] 🔍 Chapter IDs before query:`,
            JSON.stringify({
                chapterIds,
                count: chapterIds.length,
                isArray: Array.isArray(chapterIds),
            }),
        );

        const sceneQueryStart = Date.now();
        // Ensure chapterIds is an array and has items
        const allScenes =
            chapterIds.length > 0 && Array.isArray(chapterIds)
                ? await db
                      .select()
                      .from(scenes)
                      .where(inArray(scenes.chapterId, chapterIds))
                      .orderBy(asc(scenes.chapterId), asc(scenes.orderIndex))
                : [];
        const sceneQueryDuration = Date.now() - sceneQueryStart;
        console.log(
            `[DB] ✅ Fetched ${allScenes.length} scenes for ${chapterIds.length} chapters in ${sceneQueryDuration}ms (single query)`,
        );

        // Group scenes by chapter in memory (fast in-memory operation)
        const scenesByChapter: Record<string, typeof allScenes> = {};
        for (const scene of allScenes) {
            if (!scenesByChapter[scene.chapterId]) {
                scenesByChapter[scene.chapterId] = [];
            }
            scenesByChapter[scene.chapterId].push(scene);
        }

        const result = {
            ...story,
            parts: storyParts.map((part) => ({
                ...part,
                chapters: allChapters
                    .filter((chapter) => chapter.partId === part.id)
                    .map((chapter) => ({
                        ...chapter,
                        scenes: scenesByChapter[chapter.id] || [],
                    })),
            })),
            chapters: allChapters
                .filter((chapter) => !chapter.partId)
                .map((chapter) => ({
                    ...chapter,
                    scenes: scenesByChapter[chapter.id] || [],
                })),
        };

        return result;
    }

    /**
     * Get parts for a story (ordered by orderIndex)
     */
    static async getStoryParts(storyId: string) {
        return await db
            .select()
            .from(parts)
            .where(eq(parts.storyId, storyId))
            .orderBy(asc(parts.orderIndex));
    }

    /**
     * Get chapters for a story (ordered by orderIndex)
     */
    static async getStoryChapters(storyId: string) {
        return await db
            .select()
            .from(chapters)
            .where(eq(chapters.storyId, storyId))
            .orderBy(asc(chapters.orderIndex));
    }

    /**
     * Get chapters for a part (ordered by orderIndex)
     */
    static async getPartChapters(partId: string) {
        return await db
            .select()
            .from(chapters)
            .where(eq(chapters.partId, partId))
            .orderBy(asc(chapters.orderIndex));
    }

    /**
     * Get scenes for a chapter (ordered by orderIndex)
     */
    static async getChapterScenes(chapterId: string) {
        return await db
            .select()
            .from(scenes)
            .where(eq(scenes.chapterId, chapterId))
            .orderBy(asc(scenes.orderIndex));
    }

    /**
     * Validate database consistency (for debugging/maintenance)
     * Checks for orphaned records and orderIndex gaps
     */
    static async validateConsistency(storyId: string): Promise<{
        isConsistent: boolean;
        issues: string[];
    }> {
        const issues: string[] = [];

        const story = await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId))
            .then((rows) => rows[0]);

        if (!story) {
            return { isConsistent: false, issues: ["Story not found"] };
        }

        // Check for orphaned parts
        const storyParts = await db
            .select()
            .from(parts)
            .where(eq(parts.storyId, storyId));

        // Check for gaps in part orderIndex
        const partOrders = storyParts
            .map((p) => p.orderIndex)
            .sort((a, b) => a - b);
        for (let i = 0; i < partOrders.length - 1; i++) {
            if (partOrders[i + 1] - partOrders[i] > 1) {
                issues.push(
                    `Gap in part ordering between ${partOrders[i]} and ${partOrders[i + 1]}`,
                );
            }
        }

        // Check for orphaned chapters
        const storyChapters = await db
            .select()
            .from(chapters)
            .where(eq(chapters.storyId, storyId));

        // Check for chapters pointing to non-existent parts
        const partIds = new Set(storyParts.map((p) => p.id));
        for (const chapter of storyChapters) {
            if (chapter.partId && !partIds.has(chapter.partId)) {
                issues.push(
                    `Chapter ${chapter.id} references non-existent part ${chapter.partId}`,
                );
            }
        }

        // Check for gaps in chapter orderIndex
        const chapterOrders = storyChapters
            .map((c) => c.orderIndex)
            .sort((a, b) => a - b);
        for (let i = 0; i < chapterOrders.length - 1; i++) {
            if (chapterOrders[i + 1] - chapterOrders[i] > 1) {
                issues.push(
                    `Gap in chapter ordering between ${chapterOrders[i]} and ${chapterOrders[i + 1]}`,
                );
            }
        }

        return {
            isConsistent: issues.length === 0,
            issues,
        };
    }
}
