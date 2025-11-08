/**
 * Cache Invalidation Hooks
 *
 * Automatically invalidate cache when story entities are modified
 * to ensure data consistency while maintaining read performance
 */

import {
	invalidateCacheForEntity,
	invalidateStoryCache,
} from "./story-structure-cache";

/**
 * Hook to call after creating/updating/deleting a story
 */
export async function onStoryMutation(storyId: string): Promise<void> {
	console.log(
		`[Cache Invalidation] Story ${storyId} mutated - invalidating cache`,
	);
	await invalidateStoryCache(storyId);
}

/**
 * Hook to call after creating/updating/deleting a part
 */
export async function onPartMutation(
	partId: string,
	storyId: string,
): Promise<void> {
	console.log(
		`[Cache Invalidation] Part ${partId} mutated in story ${storyId} - invalidating cache`,
	);
	await invalidateCacheForEntity("part", partId, storyId);
}

/**
 * Hook to call after creating/updating/deleting a chapter
 */
export async function onChapterMutation(
	chapterId: string,
	storyId: string,
): Promise<void> {
	console.log(
		`[Cache Invalidation] Chapter ${chapterId} mutated in story ${storyId} - invalidating cache`,
	);
	await invalidateCacheForEntity("chapter", chapterId, storyId);
}

/**
 * Hook to call after creating/updating/deleting a scene
 */
export async function onSceneMutation(
	sceneId: string,
	storyId: string,
): Promise<void> {
	console.log(
		`[Cache Invalidation] Scene ${sceneId} mutated in story ${storyId} - invalidating cache`,
	);
	await invalidateCacheForEntity("scene", sceneId, storyId);
}

/**
 * Hook to call after creating/updating/deleting a character
 */
export async function onCharacterMutation(
	characterId: string,
	storyId: string,
): Promise<void> {
	console.log(
		`[Cache Invalidation] Character ${characterId} mutated in story ${storyId} - invalidating cache`,
	);
	await invalidateCacheForEntity("character", characterId, storyId);
}

/**
 * Hook to call after creating/updating/deleting a setting (place/location)
 */
export async function onSettingMutation(
	settingId: string,
	storyId: string,
): Promise<void> {
	console.log(
		`[Cache Invalidation] Setting ${settingId} mutated in story ${storyId} - invalidating cache`,
	);
	await invalidateCacheForEntity("setting", settingId, storyId);
}

/**
 * Batch invalidation for multiple stories (e.g., after bulk operations)
 */
export async function onBulkStoryMutation(storyIds: string[]): Promise<void> {
	console.log(
		`[Cache Invalidation] Bulk mutation for ${storyIds.length} stories - invalidating cache`,
	);
	await Promise.all(storyIds.map((storyId) => invalidateStoryCache(storyId)));
}

/**
 * Usage Examples:
 *
 * // In story creation/update API:
 * await db.update(stories).set({...}).where(eq(stories.id, storyId));
 * await onStoryMutation(storyId);
 *
 * // In part creation API:
 * const part = await db.insert(parts).values({...}).returning();
 * await onPartMutation(part.id, storyId);
 *
 * // In chapter update API:
 * await db.update(chapters).set({...}).where(eq(chapters.id, chapterId));
 * await onChapterMutation(chapterId, storyId);
 *
 * // In scene deletion API:
 * await db.delete(scenes).where(eq(scenes.id, sceneId));
 * await onSceneMutation(sceneId, storyId);
 */
