/**
 * Image Validator Service
 *
 * Validates that images exist and are accessible, regenerating them if missing.
 * This runs as part of the scene evaluation loop to ensure all scenes have valid images.
 */

import { generateStoryImage } from '@/lib/services/image-generation';

export interface ImageValidationResult {
  isValid: boolean;
  imageUrl: string | null;
  imageVariants: any;
  issues: Array<{
    type: 'missing_url' | 'url_not_accessible' | 'missing_variants';
    description: string;
  }>;
  regenerated: boolean;
}

export interface ImageValidationOptions {
  checkAccessibility?: boolean;  // Default: true - Actually fetch the URL to verify
  regenerateIfMissing?: boolean; // Default: true - Auto-regenerate missing images
  timeout?: number;              // Default: 5000ms - Timeout for accessibility checks
}

const DEFAULT_OPTIONS: Required<ImageValidationOptions> = {
  checkAccessibility: true,
  regenerateIfMissing: true,
  timeout: 5000,
};

/**
 * Check if a URL is accessible by making a HEAD request
 */
async function isUrlAccessible(url: string, timeout: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return response.ok;
  } catch (error) {
    // URL is not accessible (network error, 404, timeout, etc.)
    return false;
  }
}

/**
 * Validate a scene's image
 */
export async function validateSceneImage(
  sceneId: string,
  imageUrl: string | null,
  imageVariants: any,
  sceneContext: {
    sceneTitle: string;
    sceneContent: string;
    storyId: string;
    setting?: { name: string; description: string };
    characters?: Array<{ name: string; role: string }>;
  },
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const issues: ImageValidationResult['issues'] = [];
  let regenerated = false;
  let validImageUrl = imageUrl;
  let validImageVariants = imageVariants;

  // Check 1: Image URL exists
  if (!imageUrl || imageUrl.trim() === '') {
    issues.push({
      type: 'missing_url',
      description: 'Scene has no image URL',
    });

    console.log(`⚠️ Scene ${sceneId} is missing image URL`);

    // Regenerate if enabled
    if (opts.regenerateIfMissing) {
      console.log(`🔄 Regenerating missing image for scene: ${sceneContext.sceneTitle}`);
      const regenerationResult = await regenerateSceneImage(sceneId, sceneContext);

      if (regenerationResult.success) {
        validImageUrl = regenerationResult.imageUrl;
        validImageVariants = regenerationResult.imageVariants;
        regenerated = true;
        console.log(`✅ Image regenerated successfully`);
      } else {
        console.error(`❌ Failed to regenerate image: ${regenerationResult.error}`);
      }
    }
  }
  // Check 2: Image URL is accessible (if we have a URL)
  else if (opts.checkAccessibility) {
    const isAccessible = await isUrlAccessible(imageUrl, opts.timeout);

    if (!isAccessible) {
      issues.push({
        type: 'url_not_accessible',
        description: `Image URL is not accessible: ${imageUrl}`,
      });

      console.log(`⚠️ Scene ${sceneId} image is not accessible: ${imageUrl}`);

      // Regenerate if enabled
      if (opts.regenerateIfMissing) {
        console.log(`🔄 Regenerating inaccessible image for scene: ${sceneContext.sceneTitle}`);
        const regenerationResult = await regenerateSceneImage(sceneId, sceneContext);

        if (regenerationResult.success) {
          validImageUrl = regenerationResult.imageUrl;
          validImageVariants = regenerationResult.imageVariants;
          regenerated = true;
          console.log(`✅ Image regenerated successfully`);
        } else {
          console.error(`❌ Failed to regenerate image: ${regenerationResult.error}`);
        }
      }
    }
  }

  // Check 3: Optimized variants exist
  if (!imageVariants ||
      !imageVariants.variants ||
      !Array.isArray(imageVariants.variants) ||
      imageVariants.variants.length === 0) {
    issues.push({
      type: 'missing_variants',
      description: 'Scene image has no optimized variants',
    });

    console.log(`⚠️ Scene ${sceneId} is missing optimized image variants`);

    // Variants are generated automatically when image is regenerated, so this is only an issue
    // if we didn't regenerate above
  }

  const isValid = issues.length === 0 || regenerated;

  return {
    isValid,
    imageUrl: validImageUrl,
    imageVariants: validImageVariants,
    issues,
    regenerated,
  };
}

/**
 * Regenerate a scene's image
 */
async function regenerateSceneImage(
  sceneId: string,
  sceneContext: {
    sceneTitle: string;
    sceneContent: string;
    storyId: string;
    setting?: { name: string; description: string };
    characters?: Array<{ name: string; role: string }>;
  }
): Promise<{
  success: boolean;
  imageUrl?: string;
  imageVariants?: any;
  error?: string;
}> {
  try {
    // Extract key visual elements from scene content
    const visualDescription = extractVisualDescription(
      sceneContext.sceneContent,
      sceneContext.sceneTitle
    );

    // Build image generation prompt
    const prompt = buildSceneImagePrompt(
      visualDescription,
      sceneContext.sceneTitle,
      sceneContext.setting,
      sceneContext.characters
    );

    console.log(`   Generating image with prompt: ${prompt.substring(0, 100)}...`);

    // Generate new image
    const result = await generateStoryImage({
      prompt: prompt,
      storyId: sceneContext.storyId,
      imageType: 'scene',
      style: 'vivid',
      quality: 'standard',
    });

    return {
      success: true,
      imageUrl: result.url,
      imageVariants: result.optimizedSet,
    };
  } catch (error) {
    console.error('Image regeneration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Extract visual description from scene content
 * Takes the first 2-3 paragraphs which typically contain setting and atmosphere
 */
function extractVisualDescription(content: string, title: string): string {
  // Split into paragraphs
  const paragraphs = content
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0 && !p.startsWith('"')); // Filter out pure dialogue

  // Take first 2-3 description paragraphs (max 300 words)
  const descriptionParagraphs = paragraphs.slice(0, 3);
  let description = descriptionParagraphs.join(' ');

  // Limit to 300 words
  const words = description.split(/\s+/);
  if (words.length > 300) {
    description = words.slice(0, 300).join(' ') + '...';
  }

  return description;
}

/**
 * Build image generation prompt for a scene
 */
function buildSceneImagePrompt(
  visualDescription: string,
  sceneTitle: string,
  setting?: { name: string; description: string },
  characters?: Array<{ name: string; role: string }>
): string {
  const settingInfo = setting
    ? `Setting: ${setting.name}. ${setting.description}.`
    : '';

  const characterInfo = characters && characters.length > 0
    ? `Characters: ${characters.map(c => `${c.name} (${c.role})`).join(', ')}.`
    : '';

  return `Professional cinematic scene illustration for "${sceneTitle}".

${settingInfo}

${characterInfo}

Scene description:
${visualDescription}

Style: Cinematic widescreen composition, 16:9 aspect ratio, dramatic lighting, vivid colors,
professional digital art quality, detailed environment, atmospheric mood lighting.
High quality illustration suitable for story visualization.`;
}

/**
 * Validate multiple scene images in batch
 */
export async function validateSceneImages(
  scenes: Array<{
    sceneId: string;
    imageUrl: string | null;
    imageVariants: any;
    sceneTitle: string;
    sceneContent: string;
    storyId: string;
    setting?: { name: string; description: string };
    characters?: Array<{ name: string; role: string }>;
  }>,
  options: ImageValidationOptions = {}
): Promise<Map<string, ImageValidationResult>> {
  const results = new Map<string, ImageValidationResult>();

  console.log(`\n🖼️ ============= BATCH IMAGE VALIDATION START =============`);
  console.log(`   Total Scenes: ${scenes.length}`);

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    console.log(`\n📸 Validating image ${i + 1}/${scenes.length}: ${scene.sceneTitle}`);

    const result = await validateSceneImage(
      scene.sceneId,
      scene.imageUrl,
      scene.imageVariants,
      {
        sceneTitle: scene.sceneTitle,
        sceneContent: scene.sceneContent,
        storyId: scene.storyId,
        setting: scene.setting,
        characters: scene.characters,
      },
      options
    );

    results.set(scene.sceneId, result);

    // Small delay to avoid rate limiting when regenerating
    if (result.regenerated && i < scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const validCount = Array.from(results.values()).filter(r => r.isValid).length;
  const regeneratedCount = Array.from(results.values()).filter(r => r.regenerated).length;

  console.log(`\n✅ ============= BATCH IMAGE VALIDATION COMPLETE =============`);
  console.log(`   Total Scenes: ${scenes.length}`);
  console.log(`   Valid Images: ${validCount}`);
  console.log(`   Regenerated: ${regeneratedCount}`);
  console.log(`   Issues: ${scenes.length - validCount}`);

  return results;
}
