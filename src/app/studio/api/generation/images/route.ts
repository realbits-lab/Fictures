import { NextRequest, NextResponse } from 'next/server';
import { generateStoryImage, type GenerateStoryImageParams } from '@/lib/services/image-generation';
import type { CharacterGenerationResult, SettingGenerationResult, SceneSummaryResult } from '@/lib/novels/types';

interface StoryData {
  title: string;
  genre: string;
  summary: string;
  tone: string;
}

interface ImageGenerationRequest {
  storyId: string;
  imageType: 'story' | 'character' | 'setting' | 'scene';
  targetData: StoryData | CharacterGenerationResult | SettingGenerationResult | (SceneSummaryResult & { content?: string });
  chapterId?: string;
  sceneId?: string;
}

/**
 * API 9: Image Generation (All Story Assets)
 *
 * Generates images for story covers, characters, settings, and scenes using Gemini 2.5 Flash Image.
 * Automatically creates optimized variants for mobile devices.
 *
 * Dimensions: 1344×768 (7:4 aspect ratio)
 * Optimization: 4 variants (AVIF/JPEG × mobile 1x/2x)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 [IMAGES API] Request received');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const body = await request.json() as ImageGenerationRequest;
    const { storyId, imageType, targetData, chapterId, sceneId } = body;

    console.log('[IMAGES API] Request parameters:', {
      storyId,
      imageType,
      hasTargetData: !!targetData,
      chapterId,
      sceneId,
    });

    if (!storyId || !imageType || !targetData) {
      console.error('❌ [IMAGES API] Validation failed');
      return NextResponse.json(
        { error: 'storyId, imageType, and targetData are required' },
        { status: 400 }
      );
    }

    console.log('✅ [IMAGES API] Validation passed');

    // Build image generation prompt based on type
    let prompt: string;
    let params: GenerateStoryImageParams;

    switch (imageType) {
      case 'story': {
        const story = targetData as StoryData;

        // Build story cover image prompt
        const genreVisual = story.genre || 'dramatic story';
        const toneVisual = story.tone || 'captivating';
        const summary = story.summary.substring(0, 250); // Limit summary length

        prompt = `Book cover illustration for "${story.title}". ${summary}.
Genre: ${genreVisual}. Tone: ${toneVisual}.
Cinematic widescreen composition, professional book cover art, dramatic and engaging visual.
High quality illustration, 7:4 aspect ratio, story cover design.`;

        params = {
          prompt: prompt.trim(),
          storyId,
          imageType: 'story',
          style: 'vivid', // Story covers benefit from vivid style
          quality: 'standard',
        };
        break;
      }

      case 'character': {
        const char = targetData as CharacterGenerationResult;

        // Build character portrait prompt
        const visualStyle = char.visualStyle || 'realistic portrait, professional photography';
        const description = char.physicalDescription;
        const personality = char.personality.traits.join(', ');

        prompt = `Portrait of ${char.name}. ${description.appearance}. ${description.distinctiveFeatures}.
Personality: ${personality}. Style: ${description.style}.
Visual aesthetic: ${visualStyle}.
High quality portrait, centered composition, neutral background, detailed facial features.`;

        params = {
          prompt: prompt.trim(),
          storyId,
          imageType: 'character',
          style: 'natural', // Portraits work better with natural style
          quality: 'standard',
        };
        break;
      }

      case 'setting': {
        const setting = targetData as SettingGenerationResult;

        // Build setting visual prompt
        const visualStyle = setting.visualStyle || 'cinematic landscape';
        const mood = setting.mood;
        const architecturalStyle = setting.architecturalStyle || '';
        const colorPalette = setting.colorPalette.length > 0
          ? `Color palette: ${setting.colorPalette.slice(0, 4).join(', ')}`
          : '';

        // Use first 2 sensory details for each sense
        const sight = setting.sensory.sight.slice(0, 2).join(', ');
        const sound = setting.sensory.sound.slice(0, 1).join(', ');

        prompt = `${setting.name}. ${setting.description.substring(0, 200)}.
${architecturalStyle ? `Architecture: ${architecturalStyle}.` : ''}
Atmosphere: ${mood}. Visual elements: ${sight}. ${sound}.
${colorPalette}
Visual style: ${visualStyle}. Cinematic widescreen composition, dramatic lighting.`;

        params = {
          prompt: prompt.trim(),
          storyId,
          imageType: 'setting',
          style: 'vivid', // Settings benefit from vivid style
          quality: 'standard',
        };
        break;
      }

      case 'scene': {
        const scene = targetData as SceneSummaryResult & { content?: string };

        // Build scene illustration prompt
        // If we have scene content, extract visual description from first paragraphs
        let visualDescription = scene.summary;
        if (scene.content) {
          // Extract first 2-3 paragraphs for visual context
          const paragraphs = scene.content.split('\n\n').slice(0, 3).join(' ');
          visualDescription = paragraphs.substring(0, 300);
        }

        // Use sensory anchors for rich visual details
        const sensoryDetails = scene.sensoryAnchors.slice(0, 3).join(', ');

        prompt = `Scene: ${scene.title}. ${visualDescription}.
Emotional tone: ${scene.emotionalBeat}. Visual details: ${sensoryDetails}.
Cinematic widescreen composition, story illustration style, dramatic moment capture.`;

        params = {
          prompt: prompt.trim(),
          storyId,
          imageType: 'scene',
          chapterId,
          sceneId,
          style: 'vivid',
          quality: 'standard',
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Invalid imageType: ${imageType}` },
          { status: 400 }
        );
    }

    // Generate image using existing service
    console.log(`[IMAGES API] 🎨 Generating ${imageType} image for story ${storyId}`);
    console.log(`[IMAGES API] Prompt preview: ${prompt.substring(0, 150)}...`);
    console.log(`[IMAGES API] Style: ${params.style}, Quality: ${params.quality}`);

    const result = await generateStoryImage(params);

    console.log('[IMAGES API] ✅ Image generation completed');
    console.log('[IMAGES API] Result summary:', {
      imageId: result.imageId,
      dimensions: `${result.width}×${result.height}`,
      size: result.size,
      hasOptimizedSet: !!result.optimizedSet,
      variantsCount: result.optimizedSet?.variants?.length || 0,
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Return result with all URLs
    return NextResponse.json({
      success: true,
      imageType,
      imageId: result.imageId,
      originalUrl: result.url,
      blobUrl: result.blobUrl,
      dimensions: {
        width: result.width,
        height: result.height,
      },
      size: result.size,
      optimizedSet: result.optimizedSet,
      isPlaceholder: result.isPlaceholder,
    });

  } catch (error) {
    console.error('[API 9] Image generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
