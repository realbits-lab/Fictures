/**
 * Comic Panel Generator
 *
 * Main orchestrator for converting HNS scene narrative into visually compelling
 * comic panels with AI-generated images optimized for vertical scroll.
 */

import { nanoid } from 'nanoid';
import type { HNSScene, HNSCharacter, HNSSetting } from '@/types/hns';
import { generateStoryImage } from '@/lib/services/image-generation';
import { db } from '@/lib/db';
import { comicPanels, scenes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { convertSceneToScreenplay, type ComicScreenplay } from './screenplay-converter';
import { buildPanelCharacterPrompts, extractKeyPhysicalTraits } from '@/lib/services/character-consistency';
import { calculateTotalHeight, estimateReadingTime } from '@/lib/services/comic-layout';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sanitize image prompt to avoid content filter triggers
 */
function sanitizePromptForContentFilter(originalPrompt: string, attemptNumber: number): string {
  let sanitized = originalPrompt;

  // List of potentially sensitive words/phrases to remove or replace
  const sensitiveTerms = [
    // Emotional distress
    { pattern: /distress(ed)?/gi, replacement: 'concern' },
    { pattern: /hurt/gi, replacement: 'affected' },
    { pattern: /pain(ful)?/gi, replacement: 'discomfort' },
    { pattern: /erase(d)?/gi, replacement: 'reset' },
    { pattern: /scar(red)?/gi, replacement: 'worried' },
    { pattern: /terrif(ied|ying)/gi, replacement: 'anxious' },
    { pattern: /desperat(e|ion)/gi, replacement: 'determined' },

    // Physical descriptions that might trigger filters
    { pattern: /slumped/gi, replacement: 'seated' },
    { pattern: /trembl(ing|e)/gi, replacement: 'moving' },
    { pattern: /tears?/gi, replacement: 'eyes glistening' },
  ];

  // Apply sanitization based on attempt number
  if (attemptNumber === 1) {
    // First retry: Remove sensitive emotional terms
    sensitiveTerms.forEach(({ pattern, replacement }) => {
      sanitized = sanitized.replace(pattern, replacement);
    });
  } else if (attemptNumber >= 2) {
    // Second retry: Use a very generic, safe description
    // Extract just the basic setting and shot type
    const genre = sanitized.match(/Professional\s+(\w+\s?\w*)\s+comic panel/i)?.[1] || 'Science Fiction';
    const shotType = sanitized.match(/comic panel,\s+([\w\s]+),/i)?.[1] || 'medium shot';

    sanitized = `Professional ${genre} comic panel, ${shotType}, cinematic composition. Characters in a futuristic setting with neutral expressions, clean modern environment, balanced lighting.`;
  }

  return sanitized;
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface GenerateComicPanelsOptions {
  sceneId: string;
  scene: HNSScene;
  characters: HNSCharacter[];
  setting: HNSSetting;
  story: { story_id: string; genre: string };
  targetPanelCount?: number;
  progressCallback?: (current: number, total: number, status: string) => void;
}

export interface GeneratedPanel {
  id: string;
  panel_number: number;
  shot_type: string;
  image_url: string;
  image_variants: any;
  narrative?: string;
  dialogue: any[];
  sfx: any[];
  metadata: any;
}

export interface ComicPanelGenerationResult {
  screenplay: ComicScreenplay;
  panels: GeneratedPanel[];
  metadata: {
    total_generation_time: number;
    total_panels: number;
    total_images: number;
    total_height: number;
    estimated_reading_time: string;
  };
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export async function generateComicPanels(
  options: GenerateComicPanelsOptions
): Promise<ComicPanelGenerationResult> {

  const startTime = Date.now();
  const { scene, characters, setting, story, targetPanelCount, progressCallback } = options;

  console.log(`\n🎬 ============= COMIC PANEL GENERATION START =============`);
  console.log(`   Scene: ${scene.scene_title || (scene as any).title}`);
  console.log(`   Scene ID: ${scene.scene_id || (scene as any).id}`);
  console.log(`   Genre: ${story.genre}`);

  // ========================================
  // STEP 1: Convert Scene to Screenplay
  // ========================================

  progressCallback?.(0, 100, 'Converting scene to screenplay...');

  const screenplay = await convertSceneToScreenplay({
    scene,
    characters,
    setting,
    storyGenre: story.genre,
    targetPanelCount,
  });

  console.log(`✅ Screenplay generated: ${screenplay.total_panels} panels`);

  progressCallback?.(20, 100, `Screenplay ready: ${screenplay.total_panels} panels`);

  // ========================================
  // STEP 2: Generate Panel Images
  // ========================================

  const generatedPanels: GeneratedPanel[] = [];
  const totalPanels = screenplay.panels.length;

  for (let i = 0; i < screenplay.panels.length; i++) {
    const panelSpec = screenplay.panels[i];
    const progress = 20 + Math.floor((i / totalPanels) * 70);

    progressCallback?.(
      progress,
      100,
      `Generating panel ${i + 1}/${totalPanels}: ${panelSpec.shot_type}`
    );

    console.log(`\n🎨 Panel ${i + 1}/${totalPanels}: ${panelSpec.shot_type}`);

    // Build character descriptions for this panel
    const characterPrompts = buildPanelCharacterPrompts(
      panelSpec.characters_visible,
      characters,
      panelSpec.character_poses as Record<string, string>
    );

    // Extract key traits for emphasis
    const keyTraits = panelSpec.characters_visible
      .map(charId => {
        const char = characters.find(c => c.character_id === charId);
        return char ? extractKeyPhysicalTraits(char) : [];
      })
      .flat()
      .join(', ');

    // Construct full image prompt
    const imagePrompt = buildPanelImagePrompt({
      genre: story.genre,
      shotType: panelSpec.shot_type,
      cameraAngle: panelSpec.camera_angle,
      settingFocus: panelSpec.setting_focus,
      settingAtmosphere: (setting as any).atmosphere || setting.mood,
      characterPrompts,
      keyTraits,
      lighting: panelSpec.lighting,
      description: panelSpec.description,
      mood: panelSpec.mood,
    });

    console.log(`   Prompt: ${imagePrompt.substring(0, 100)}...`);

    // Generate image with automatic retry for content filter errors
    let imageResult;
    let attemptCount = 0;
    const maxAttempts = 3;

    while (attemptCount < maxAttempts) {
      try {
        const promptToUse = attemptCount === 0
          ? imagePrompt
          : sanitizePromptForContentFilter(imagePrompt, attemptCount);

        if (attemptCount > 0) {
          console.log(`   ⚠️  Retrying with sanitized prompt (attempt ${attemptCount + 1}/${maxAttempts})...`);
        }

        imageResult = await generateStoryImage({
          prompt: promptToUse,
          storyId: story.story_id,
          imageType: 'panel',
          sceneId: scene.scene_id || (scene as any).id,
          panelNumber: panelSpec.panel_number,
          style: 'vivid',
          quality: 'standard',
        });

        break; // Success!
      } catch (error: any) {
        attemptCount++;
        const isContentFilter = error.message?.includes('content filter') ||
                                error.message?.includes('safety system');

        if (!isContentFilter || attemptCount >= maxAttempts) {
          console.error(`   ✗ Image generation failed after ${attemptCount} attempts:`, error.message);
          throw error;
        }

        console.log(`   ⚠️  Content filter triggered, sanitizing prompt...`);
      }
    }

    console.log(`   ✅ Image generated: ${imageResult.url}`);
    console.log(`   ✅ Variants: ${imageResult.optimizedSet?.variants.length || 0}`);

    // Store panel in database
    const panelId = nanoid();
    await db.insert(comicPanels).values({
      id: panelId,
      sceneId: scene.scene_id || (scene as any).id,
      panelNumber: panelSpec.panel_number,
      shotType: panelSpec.shot_type,
      imageUrl: imageResult.url,
      imageVariants: imageResult.optimizedSet as any,
      narrative: panelSpec.narrative || null,
      dialogue: panelSpec.dialogue as any,
      sfx: panelSpec.sfx as any,
      metadata: {
        prompt: imagePrompt,
        characters_visible: panelSpec.characters_visible,
        camera_angle: panelSpec.camera_angle,
        mood: panelSpec.mood,
        generated_at: new Date().toISOString()
      } as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    generatedPanels.push({
      id: panelId,
      panel_number: panelSpec.panel_number,
      shot_type: panelSpec.shot_type,
      image_url: imageResult.url,
      image_variants: imageResult.optimizedSet,
      narrative: panelSpec.narrative,
      dialogue: panelSpec.dialogue,
      sfx: panelSpec.sfx,
      metadata: {
        prompt: imagePrompt,
        characters_visible: panelSpec.characters_visible,
        camera_angle: panelSpec.camera_angle,
        mood: panelSpec.mood,
        generated_at: new Date().toISOString()
      },
    });

    // Rate limiting delay
    if (i < totalPanels - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  progressCallback?.(100, 100, 'Panel generation complete!');

  // Calculate final statistics
  const totalHeight = calculateTotalHeight(generatedPanels);
  const readingTime = estimateReadingTime(generatedPanels);
  const totalTime = Date.now() - startTime;

  console.log(`\n✅ ============= COMIC PANEL GENERATION COMPLETE =============`);
  console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`   Panels Generated: ${generatedPanels.length}`);
  console.log(`   Images Generated: ${generatedPanels.length}`);
  console.log(`   Total Height: ${totalHeight}px`);
  console.log(`   Estimated Reading Time: ${readingTime.formatted}`);

  // Update scene metadata with comics generation info
  const sceneId = scene.scene_id || (scene as any).id;
  console.log(`\n📝 Updating scene metadata for ${sceneId}...`);
  await db.update(scenes)
    .set({
      comicStatus: 'draft',
      comicGeneratedAt: new Date(),
      comicPanelCount: generatedPanels.length,
    })
    .where(eq(scenes.id, sceneId));
  console.log(`✅ Scene metadata updated successfully`);

  return {
    screenplay,
    panels: generatedPanels,
    metadata: {
      total_generation_time: totalTime,
      total_panels: generatedPanels.length,
      total_images: generatedPanels.length,
      total_height: totalHeight,
      estimated_reading_time: readingTime.formatted,
    }
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface BuildPanelImagePromptOptions {
  genre: string;
  shotType: string;
  cameraAngle: string;
  settingFocus: string;
  settingAtmosphere?: string;
  characterPrompts: string;
  keyTraits: string;
  lighting: string;
  description: string;
  mood: string;
}

function buildPanelImagePrompt(options: BuildPanelImagePromptOptions): string {
  const {
    genre,
    shotType,
    cameraAngle,
    settingFocus,
    settingAtmosphere,
    characterPrompts,
    keyTraits,
    lighting,
    description,
    mood,
  } = options;

  const prompt = `Professional ${genre} comic panel, ${shotType}, ${cameraAngle}.

SCENE: ${settingFocus}${settingAtmosphere ? `. ${settingAtmosphere}` : ''}.

CHARACTERS: ${characterPrompts}

LIGHTING: ${lighting}

ACTION: ${description}

MOOD: ${mood}

COMPOSITION RULES FOR 7:5 VERTICAL FORMAT:
- This is a 7:5 aspect ratio (1.4:1) - portrait-oriented, NOT widescreen
- Optimal for vertical-scroll comics - taller than wide
- Frame composition: Utilize vertical space - characters can fill more of the height
- For wide shots: Show depth front-to-back rather than side-to-side
- For medium shots: Frame characters from head to waist, use vertical negative space above/below
- For close-ups: Fill the taller frame with character detail, leave minimal headroom
- Background: Extend vertically - show more sky/ceiling and ground/floor
- Multiple characters: Stack vertically or use diagonal arrangements, not horizontal lineups

VISUAL STYLE:
- Clean comic linework, vibrant colors, semi-realistic proportions
- Professional ${genre} comic art style, cinematic composition
- Similar to Naver COMIC/Webtoon quality

CRITICAL CHARACTER CONSISTENCY:
Maintain exact character appearances - ${keyTraits}

FRAME FILL REQUIREMENT:
Fill the ENTIRE 7:5 frame completely from edge to edge.
No blank margins, no empty space, no letterboxing.
Utilize the full vertical height and full horizontal width.
The composition must reach all four edges of the canvas.

BACKGROUND/MARGIN FALLBACK:
If any margins, padding, or blank space cannot be avoided, use PURE WHITE (#FFFFFF) background.
Never use black, gray, or colored margins - white only.`;

  return prompt;
}
