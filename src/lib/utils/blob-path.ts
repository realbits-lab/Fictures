/**
 * Blob Path Utility
 *
 * Constructs environment-aware Vercel Blob paths.
 * All blob paths are prefixed with environment (main/develop) for data isolation.
 */

import { getFicturesEnv, type FicturesEnvironment } from './environment';

/**
 * Construct environment-aware blob path
 *
 * @param path - Relative path within the environment (e.g., 'stories/story_123/cover.png')
 * @param env - Optional environment override (defaults to current environment)
 * @returns Full blob path with environment prefix
 *
 * @example
 * // In develop environment
 * getBlobPath('stories/story_123/cover.png')
 * // Returns: 'develop/stories/story_123/cover.png'
 *
 * // Force main environment
 * getBlobPath('stories/story_123/cover.png', 'main')
 * // Returns: 'main/stories/story_123/cover.png'
 */
export function getBlobPath(path: string, env?: FicturesEnvironment): string {
  const environment = env || getFicturesEnv();

  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${environment}/${cleanPath}`;
}

/**
 * Construct story cover image blob path
 *
 * @param storyId - Story ID
 * @param env - Optional environment override
 * @returns Blob path for story cover image
 */
export function getStoryCoverPath(storyId: string, env?: FicturesEnvironment): string {
  return getBlobPath(`stories/${storyId}/cover.png`, env);
}

/**
 * Construct scene image blob path
 *
 * @param storyId - Story ID
 * @param sceneId - Scene ID
 * @param env - Optional environment override
 * @returns Blob path for scene image
 */
export function getSceneImagePath(
  storyId: string,
  sceneId: string,
  env?: FicturesEnvironment
): string {
  return getBlobPath(`stories/${storyId}/scenes/${sceneId}/image.png`, env);
}

/**
 * Construct character portrait blob path
 *
 * @param storyId - Story ID
 * @param characterId - Character ID
 * @param env - Optional environment override
 * @returns Blob path for character portrait
 */
export function getCharacterPortraitPath(
  storyId: string,
  characterId: string,
  env?: FicturesEnvironment
): string {
  return getBlobPath(`stories/${storyId}/characters/${characterId}/portrait.png`, env);
}

/**
 * Construct setting visual blob path
 *
 * @param storyId - Story ID
 * @param settingId - Setting ID
 * @param env - Optional environment override
 * @returns Blob path for setting visual
 */
export function getSettingVisualPath(
  storyId: string,
  settingId: string,
  env?: FicturesEnvironment
): string {
  return getBlobPath(`stories/${storyId}/settings/${settingId}/visual.png`, env);
}

/**
 * Construct comic panel image blob path
 *
 * @param storyId - Story ID
 * @param sceneId - Scene ID
 * @param panelNumber - Panel number (1-based)
 * @param env - Optional environment override
 * @returns Blob path for comic panel image
 */
export function getComicPanelPath(
  storyId: string,
  sceneId: string,
  panelNumber: number,
  env?: FicturesEnvironment
): string {
  return getBlobPath(
    `stories/${storyId}/scenes/${sceneId}/panels/panel-${panelNumber}.png`,
    env
  );
}

/**
 * Get environment prefix for blob listing/deletion operations
 *
 * @param env - Optional environment override
 * @returns Environment prefix for blob operations
 *
 * @example
 * // List all blobs in develop environment
 * const prefix = getEnvironmentPrefix(); // 'develop/'
 * const blobs = await list({ prefix: prefix + 'stories/' });
 */
export function getEnvironmentPrefix(env?: FicturesEnvironment): string {
  const environment = env || getFicturesEnv();
  return `${environment}/`;
}

/**
 * Get story-specific blob prefix for listing/deletion
 *
 * @param storyId - Story ID
 * @param env - Optional environment override
 * @returns Blob prefix for all story-related files
 */
export function getStoryBlobPrefix(storyId: string, env?: FicturesEnvironment): string {
  return getBlobPath(`stories/${storyId}/`, env);
}

/**
 * Extract environment from blob URL
 *
 * @param url - Full blob URL
 * @returns Environment extracted from URL, or null if not found
 */
export function extractEnvironmentFromUrl(url: string): FicturesEnvironment | null {
  const match = url.match(/\/(main|develop)\//);
  return match ? (match[1] as FicturesEnvironment) : null;
}

/**
 * Check if blob path belongs to specific environment
 *
 * @param path - Blob path
 * @param env - Environment to check
 * @returns True if path belongs to specified environment
 */
export function isBlobPathInEnvironment(
  path: string,
  env: FicturesEnvironment
): boolean {
  return path.startsWith(`${env}/`);
}

/**
 * Get system placeholder image path
 *
 * @param imageType - Type of placeholder image
 * @param env - Optional environment override
 * @returns Blob path for system placeholder image
 *
 * @example
 * // In develop environment
 * getSystemPlaceholderPath('character')
 * // Returns: 'develop/system/placeholders/character-default.png'
 */
export function getSystemPlaceholderPath(
  imageType: 'character' | 'setting' | 'scene' | 'story',
  env?: FicturesEnvironment
): string {
  const filenames = {
    character: 'character-default.png',
    setting: 'setting-visual.png',
    scene: 'scene-illustration.png',
    story: 'story-cover.png',
  };
  return getBlobPath(`system/placeholders/${filenames[imageType]}`, env);
}

/**
 * Get system placeholder image URL
 *
 * Constructs full Vercel Blob URL for system placeholder images.
 * Uses environment-aware paths (main/system or develop/system).
 *
 * @param imageType - Type of placeholder image
 * @param env - Optional environment override
 * @returns Full Vercel Blob URL for system placeholder image
 *
 * @example
 * // In develop environment
 * getSystemPlaceholderUrl('character')
 * // Returns: 'https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/develop/system/placeholders/character-default.png'
 */
export function getSystemPlaceholderUrl(
  imageType: 'character' | 'setting' | 'scene' | 'story',
  env?: FicturesEnvironment
): string {
  const path = getSystemPlaceholderPath(imageType, env);
  // Vercel Blob base URL (same for all environments)
  const baseUrl = 'https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com';
  return `${baseUrl}/${path}`;
}
