/**
 * Scene Image Generation Service
 * Generates images for story scenes using Gemini and stores them in Vercel Blob
 */

import type { scenes, stories, characters, settings } from '@/../drizzle/schema';
import { generateStoryImage } from '@/lib/services/image-generation';

// Animation styles compatible with DALL-E 3
export type AnimationStyle =
  | 'fantasy-art'
  | 'realistic'
  | 'watercolor'
  | 'pixar'
  | 'disney';

/**
 * Generate an image prompt for a scene based on its content
 */
export function generateSceneImagePrompt(
  scene: typeof scenes.$inferSelect,
  story: typeof stories.$inferSelect,
  charactersList: (typeof characters.$inferSelect)[],
  settingsList: (typeof settings.$inferSelect)[]
): string {
  // Get character details from characterFocus field (array of character IDs)
  const characterFocusIds = Array.isArray(scene.characterFocus) ? scene.characterFocus as string[] : [];
  const sceneCharacters = characterFocusIds
    .map(id => charactersList.find(c => c.id === id))
    .filter(Boolean);

  // Get setting details - scenes don't have settingId in the new schema
  // Use the first setting from the story
  const setting = settingsList[0];

  // Build the prompt
  const characterDescriptions = sceneCharacters
    .slice(0, 2) // Limit to 2 main characters for clarity
    .map(c => {
      const physicalDesc = c?.physicalDescription as any;
      return physicalDesc?.typical_attire
        ? `${c?.name}: ${physicalDesc.typical_attire}`
        : c?.name;
    })
    .filter(Boolean)
    .join(', ');

  const settingDescription = setting
    ? `${setting.name}: ${setting.description || setting.mood || 'atmospheric scene'}`
    : 'atmospheric scene';

  const emotionalTone = scene.emotionalBeat
    ? `${scene.emotionalBeat} emotional tone`
    : '';

  const actionFocus = scene.summary || 'dramatic moment';

  // Construct the detailed prompt for Gemini
  const prompt = `${actionFocus} in ${settingDescription}.
${characterDescriptions ? `Characters: ${characterDescriptions}.` : ''}
${emotionalTone}.
Dramatic scene capturing the emotional peak of the moment.`;

  return prompt.replace(/\s+/g, ' ').trim();
}

/**
 * Get appropriate animation style based on genre
 */
function getStyleForGenre(genre: string | null): AnimationStyle {
  const genreStyles: Record<string, AnimationStyle> = {
    'fantasy': 'fantasy-art',
    'science_fiction': 'realistic',
    'sci-fi': 'realistic',
    'horror': 'realistic',
    'romance': 'watercolor',
    'thriller': 'realistic',
    'mystery': 'realistic',
    'detective': 'realistic',
    'adventure': 'pixar',
    'historical_fiction': 'realistic',
    'historical': 'realistic',
    'contemporary': 'realistic',
  };

  // Find matching style or default
  if (!genre) return 'fantasy-art';
  const lowerGenre = genre.toLowerCase().replace(/[- ']/g, '_');
  return genreStyles[lowerGenre] || 'fantasy-art';
}

/**
 * Generate and upload scene image using Gemini
 */
export async function generateSceneImage(
  scene: typeof scenes.$inferSelect,
  story: typeof stories.$inferSelect,
  charactersList: (typeof characters.$inferSelect)[],
  settingsList: (typeof settings.$inferSelect)[],
  storyId: string
): Promise<{ url: string; prompt: string; style: AnimationStyle }> {
  try {
    // Generate the image prompt
    const prompt = generateSceneImagePrompt(scene, story, charactersList, settingsList);

    // Determine the style based on genre
    const style = getStyleForGenre(story.genre);

    console.log(`🎨 Generating image for scene: ${scene.title || scene.summary}`);
    console.log(`   Style: ${style}`);
    console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

    // Generate image with DALL-E 3 and optimization
    const result = await generateStoryImage({
      prompt,
      storyId,
      imageType: 'scene',
      style: style === 'fantasy-art' ? 'vivid' : 'natural',
      quality: 'standard',
    });

    console.log(`   ✅ Scene image generated: ${result.url}`);
    console.log(`   ✅ Optimized variants: ${result.optimizedSet?.variants.length || 0}`);
    return {
      url: result.url,
      prompt,
      style
    };

  } catch (error) {
    console.error(`❌ Failed to generate image for scene ${scene.id}:`, error);

    // Since images are mandatory, throw the error to be handled upstream
    throw error;
  }
}

/**
 * Get appropriate lighting based on scene mood and cycle phase
 */
function getSceneLighting(scene: typeof scenes.$inferSelect): string {
  if (scene.cyclePhase === 'confrontation') {
    return 'dramatic shadows, low key lighting';
  } else if (scene.cyclePhase === 'consequence') {
    return 'bright, optimistic lighting';
  } else {
    return 'cinematic lighting, balanced contrast';
  }
}

/**
 * Generate images for multiple scenes in batch (mandatory)
 */
export async function generateSceneImages(
  scenesList: (typeof scenes.$inferSelect)[],
  story: typeof stories.$inferSelect,
  charactersList: (typeof characters.$inferSelect)[],
  settingsList: (typeof settings.$inferSelect)[],
  storyId: string,
  progressCallback?: (current: number, total: number) => void
): Promise<Map<string, { url: string; prompt: string; style: AnimationStyle }>> {
  const results = new Map<string, { url: string; prompt: string; style: AnimationStyle }>();

  console.log(`🎬 Generating mandatory images for ${scenesList.length} scenes...`);

  for (let i = 0; i < scenesList.length; i++) {
    const scene = scenesList[i];

    if (progressCallback) {
      progressCallback(i + 1, scenesList.length);
    }

    try {
      // Small delay between requests to be respectful to the API
      if (i > 0) {
        console.log('   ⏳ Processing next scene...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }

      const result = await generateSceneImage(
        scene,
        story,
        charactersList,
        settingsList,
        storyId
      );

      results.set(scene.id, result);

    } catch (error) {
      console.error(`⚠️ Retrying image generation for scene ${scene.id}...`);

      // Retry once on failure since images are mandatory
      try {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait before retry
        const result = await generateSceneImage(
          scene,
          story,
          charactersList,
          settingsList,
          storyId
        );
        results.set(scene.id, result);
      } catch (retryError) {
        console.error(`❌ Failed to generate mandatory image for scene ${scene.id}:`, retryError);
        // Since images are mandatory, throw an error
        throw new Error(`Failed to generate mandatory image for scene ${scene.id}: ${retryError}`);
      }
    }
  }

  console.log(`✅ Successfully generated all ${results.size} mandatory scene images`);
  return results;
}

/**
 * Update scene with image data
 */
export function updateSceneWithImage(
  scene: typeof scenes.$inferSelect,
  imageData: { url: string; prompt: string; style: AnimationStyle }
): typeof scenes.$inferSelect {
  return {
    ...scene,
    imageUrl: imageData.url,
    // Note: We don't have a scene_image field in the new schema
    // Images are stored in imageUrl and imageVariants
  };
}