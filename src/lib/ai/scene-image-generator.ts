/**
 * Scene Image Generation Service
 * Generates images for story scenes using Gemini and stores them in Vercel Blob
 */

import { HNSScene, HNSStory, HNSCharacter, HNSSetting } from '@/types/hns';
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
  scene: HNSScene,
  story: HNSStory,
  characters: HNSCharacter[],
  settings: HNSSetting[]
): string {
  // Get character details
  const povCharacter = characters.find(c => c.character_id === scene.pov_character_id);
  const sceneCharacters = scene.character_ids
    .map(id => characters.find(c => c.character_id === id))
    .filter(Boolean);

  // Get setting details
  const setting = settings.find(s => s.setting_id === scene.setting_id);

  // Build the prompt
  const characterDescriptions = sceneCharacters
    .slice(0, 2) // Limit to 2 main characters for clarity
    .map(c => c?.physical_description ?
      `${c.name}: ${c.physical_description.typical_attire}` :
      c?.name
    )
    .filter(Boolean)
    .join(', ');

  const settingDescription = setting ?
    `${setting.name}: ${setting.description}` :
    'atmospheric scene';

  const emotionalTone = scene.emotional_shift ?
    `mood transitioning from ${scene.emotional_shift.from} to ${scene.emotional_shift.to}` :
    '';

  const actionFocus = scene.summary || scene.goal || 'dramatic moment';

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
function getStyleForGenre(genre: string): AnimationStyle {
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
  const lowerGenre = genre.toLowerCase().replace(/[- ']/g, '_');
  return genreStyles[lowerGenre] || 'fantasy-art';
}

/**
 * Generate and upload scene image using Gemini
 */
export async function generateSceneImage(
  scene: HNSScene,
  story: HNSStory,
  characters: HNSCharacter[],
  settings: HNSSetting[],
  storyId: string
): Promise<{ url: string; prompt: string; style: AnimationStyle }> {
  try {
    // Generate the image prompt
    const prompt = generateSceneImagePrompt(scene, story, characters, settings);

    // Determine the style based on genre
    const style = getStyleForGenre(story.genre);

    console.log(`🎨 Generating image for scene: ${scene.scene_title || scene.summary}`);
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
    console.error(`❌ Failed to generate image for scene ${scene.scene_id}:`, error);

    // Since images are mandatory, throw the error to be handled upstream
    throw error;
  }
}

/**
 * Get appropriate lighting based on scene mood and outcome
 */
function getSceneLighting(scene: HNSScene): string {
  if (scene.outcome === 'failure' || scene.outcome === 'failure_with_discovery') {
    return 'dramatic shadows, low key lighting';
  } else if (scene.outcome === 'success') {
    return 'bright, optimistic lighting';
  } else {
    return 'cinematic lighting, balanced contrast';
  }
}

/**
 * Generate images for multiple scenes in batch (mandatory)
 */
export async function generateSceneImages(
  scenes: HNSScene[],
  story: HNSStory,
  characters: HNSCharacter[],
  settings: HNSSetting[],
  storyId: string,
  progressCallback?: (current: number, total: number) => void
): Promise<Map<string, { url: string; prompt: string; style: AnimationStyle }>> {
  const results = new Map<string, { url: string; prompt: string; style: AnimationStyle }>();

  console.log(`🎬 Generating mandatory images for ${scenes.length} scenes...`);

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    if (progressCallback) {
      progressCallback(i + 1, scenes.length);
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
        characters,
        settings,
        storyId
      );

      results.set(scene.scene_id, result);

    } catch (error) {
      console.error(`⚠️ Retrying image generation for scene ${scene.scene_id}...`);

      // Retry once on failure since images are mandatory
      try {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait before retry
        const result = await generateSceneImage(
          scene,
          story,
          characters,
          settings,
          storyId
        );
        results.set(scene.scene_id, result);
      } catch (retryError) {
        console.error(`❌ Failed to generate mandatory image for scene ${scene.scene_id}:`, retryError);
        // Since images are mandatory, throw an error
        throw new Error(`Failed to generate mandatory image for scene ${scene.scene_id}: ${retryError}`);
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
  scene: HNSScene,
  imageData: { url: string; prompt: string; style: AnimationStyle }
): HNSScene {
  return {
    ...scene,
    scene_image: {
      prompt: imageData.prompt,
      url: imageData.url,
      style: imageData.style || 'cinematic',
      mood: scene.emotional_shift ?
        `${scene.emotional_shift.from} to ${scene.emotional_shift.to}` :
        'dramatic',
      generated_at: new Date().toISOString()
    }
  };
}