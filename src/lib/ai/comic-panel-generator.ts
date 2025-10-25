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
import { comicPanels } from '@/lib/db/schema';
import { convertSceneToScreenplay, type ComicScreenplay } from './screenplay-converter';
import { buildPanelCharacterPrompts, extractKeyPhysicalTraits } from '@/lib/services/character-consistency';
import { calculateTotalHeight, estimateReadingTime } from '@/lib/services/comic-layout';

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
  dialogue: any[];
  sfx: any[];
  gutter_after: number;
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
  console.log(`   Scene: ${scene.scene_title || scene.title}`);
  console.log(`   Scene ID: ${scene.scene_id || scene.id}`);
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
      panelSpec.character_poses
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
      settingAtmosphere: setting.atmosphere,
      characterPrompts,
      keyTraits,
      lighting: panelSpec.lighting,
      description: panelSpec.description,
      mood: panelSpec.mood,
    });

    console.log(`   Prompt: ${imagePrompt.substring(0, 100)}...`);

    // Generate image
    const imageResult = await generateStoryImage({
      prompt: imagePrompt,
      storyId: story.story_id,
      imageType: 'comic-panel',
      style: 'vivid',
      quality: 'standard',
    });

    console.log(`   ✅ Image generated: ${imageResult.url}`);
    console.log(`   ✅ Variants: ${imageResult.optimizedSet?.variants.length || 0}`);

    // Store panel in database
    const panelId = nanoid();
    await db.insert(comicPanels).values({
      id: panelId,
      sceneId: scene.scene_id || scene.id,
      panelNumber: panelSpec.panel_number,
      shotType: panelSpec.shot_type,
      imageUrl: imageResult.url,
      imageVariants: imageResult.optimizedSet as any,
      dialogue: panelSpec.dialogue as any,
      sfx: panelSpec.sfx as any,
      gutterAfter: panelSpec.gutter_after,
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
      dialogue: panelSpec.dialogue,
      sfx: panelSpec.sfx,
      gutter_after: panelSpec.gutter_after,
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

Style: Clean comic linework, vibrant colors, semi-realistic proportions, 16:9 widescreen format,
professional ${genre} comic art style, cinematic composition, similar to Naver COMIC quality.

CRITICAL: Maintain exact character appearances - ${keyTraits}`;

  return prompt;
}
