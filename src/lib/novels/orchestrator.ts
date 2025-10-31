/**
 * Novel Generation Orchestrator
 *
 * Coordinates the complete novel generation pipeline using the Adversity-Triumph Engine.
 * Executes all 9 phases sequentially and provides progress callbacks.
 *
 * Pipeline:
 * 1. Story Summary - Generate story foundation and moral framework
 * 2. Characters - Expand character profiles with detailed arcs
 * 3. Settings - Create immersive locations with adversity elements
 * 4. Parts - Generate 3-act structure with macro character arcs
 * 5. Chapters - Create chapter structure with micro-arcs
 * 6. Scene Summaries - Break down chapters into scene outlines
 * 7. Scene Content - Generate full narrative content for each scene
 * 8. Scene Evaluation - Evaluate and improve scene quality
 * 9. Images - Generate character portraits, setting visuals, and scene images
 */

import { generateJSON } from './ai-client';
import type {
  StoryGenerationContext,
  StorySummaryResult,
  CharacterGenerationResult,
  SettingGenerationResult,
  PartGenerationResult,
  ChapterGenerationResult,
  SceneSummaryResult,
  SceneContentResult,
  SceneEvaluationResult,
  ImageVariantSet,
} from './types';

export interface NovelGenerationOptions {
  userPrompt: string;
  preferredGenre?: string;
  preferredTone?: 'dark' | 'hopeful' | 'bittersweet' | 'satirical';
  characterCount?: number;
  language?: string;
}

export type ProgressPhase =
  | 'story_summary_start'
  | 'story_summary_complete'
  | 'characters_start'
  | 'characters_complete'
  | 'settings_start'
  | 'settings_complete'
  | 'parts_start'
  | 'parts_complete'
  | 'chapters_start'
  | 'chapters_complete'
  | 'scene_summaries_start'
  | 'scene_summaries_complete'
  | 'scene_content_start'
  | 'scene_content_progress'
  | 'scene_content_complete'
  | 'scene_evaluation_start'
  | 'scene_evaluation_progress'
  | 'scene_evaluation_complete'
  | 'images_start'
  | 'images_progress'
  | 'images_complete'
  | 'complete'
  | 'error';

export interface ProgressData {
  phase: ProgressPhase;
  message?: string;
  data?: any;
  error?: string;
  percentage?: number;
  currentItem?: number;
  totalItems?: number;
}

export type ProgressCallback = (progress: ProgressData) => void | Promise<void>;

/**
 * Generate a complete novel using the Adversity-Triumph Engine
 */
export async function generateCompleteNovel(
  options: NovelGenerationOptions,
  onProgress: ProgressCallback
): Promise<{
  storyId: string;
  story: any;
  characters: any[];
  settings: any[];
  parts: any[];
  chapters: any[];
  scenes: any[];
}> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    // Phase 1: Story Summary
    await onProgress({
      phase: 'story_summary_start',
      message: 'Generating story foundation and moral framework...',
    });

    const storySummaryResponse = await fetch(`${baseUrl}/studio/api/generation/story-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt: options.userPrompt,
        preferredGenre: options.preferredGenre,
        preferredTone: options.preferredTone,
        characterCount: options.characterCount || 3,
      } as StoryGenerationContext),
    });

    if (!storySummaryResponse.ok) {
      const error = await storySummaryResponse.json();
      throw new Error(`Story summary generation failed: ${error.details || error.error}`);
    }

    const storySummary: StorySummaryResult = await storySummaryResponse.json();

    await onProgress({
      phase: 'story_summary_complete',
      message: 'Story foundation created',
      data: { storySummary },
    });

    // Phase 2: Characters
    await onProgress({
      phase: 'characters_start',
      message: `Expanding ${storySummary.characters.length} character profiles...`,
    });

    const charactersResponse = await fetch(`${baseUrl}/studio/api/generation/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storySummary }),
    });

    if (!charactersResponse.ok) {
      const error = await charactersResponse.json();
      throw new Error(`Character generation failed: ${error.details || error.error}`);
    }

    const characters: CharacterGenerationResult[] = await charactersResponse.json();

    await onProgress({
      phase: 'characters_complete',
      message: `${characters.length} characters created`,
      data: { characters },
    });

    // Phase 3: Settings
    await onProgress({
      phase: 'settings_start',
      message: 'Creating immersive story settings...',
    });

    const settingsResponse = await fetch(`${baseUrl}/studio/api/generation/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storySummary }),
    });

    if (!settingsResponse.ok) {
      const error = await settingsResponse.json();
      throw new Error(`Settings generation failed: ${error.details || error.error}`);
    }

    const settings: SettingGenerationResult[] = await settingsResponse.json();

    await onProgress({
      phase: 'settings_complete',
      message: `${settings.length} settings created`,
      data: { settings },
    });

    // Phase 4: Parts
    await onProgress({
      phase: 'parts_start',
      message: 'Structuring three-act story framework...',
    });

    const partsResponse = await fetch(`${baseUrl}/studio/api/generation/parts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storySummary, characters }),
    });

    if (!partsResponse.ok) {
      const error = await partsResponse.json();
      throw new Error(`Parts generation failed: ${error.details || error.error}`);
    }

    const parts: PartGenerationResult[] = await partsResponse.json();

    await onProgress({
      phase: 'parts_complete',
      message: `${parts.length} acts created`,
      data: { parts },
    });

    // Phase 5: Chapters
    await onProgress({
      phase: 'chapters_start',
      message: 'Generating detailed chapter structure...',
    });

    // Generate chapters for each part
    const allChapters: ChapterGenerationResult[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const previousPartChapters = i > 0 ? allChapters.filter(ch => ch.partId === parts[i - 1].id) : [];

      const chaptersResponse = await fetch(`${baseUrl}/studio/api/generation/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part,
          characters,
          previousPartChapters
        }),
      });

      if (!chaptersResponse.ok) {
        const error = await chaptersResponse.json();
        throw new Error(`Chapters generation failed for Part ${i + 1}: ${error.details || error.error}`);
      }

      const partChapters: ChapterGenerationResult[] = await chaptersResponse.json();
      allChapters.push(...partChapters);

      await onProgress({
        phase: 'chapters_progress',
        message: `Generated ${partChapters.length} chapters for Part ${i + 1}/${parts.length}`,
      });
    }

    const chapters = allChapters;

    await onProgress({
      phase: 'chapters_complete',
      message: `${chapters.length} chapters created across ${parts.length} parts`,
      data: { chapters },
    });

    // Phase 6: Scene Summaries
    await onProgress({
      phase: 'scene_summaries_start',
      message: 'Breaking down chapters into scene outlines...',
    });

    // Generate scene summaries for each chapter
    const allSceneSummaries: SceneSummaryResult[] = [];
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];

      const sceneSummariesResponse = await fetch(`${baseUrl}/studio/api/generation/scene-summaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter,
          characters,
          settings
        }),
      });

      if (!sceneSummariesResponse.ok) {
        const error = await sceneSummariesResponse.json();
        throw new Error(`Scene summaries generation failed for Chapter ${i + 1}: ${error.details || error.error}`);
      }

      const chapterSceneSummaries: SceneSummaryResult[] = await sceneSummariesResponse.json();
      allSceneSummaries.push(...chapterSceneSummaries);

      await onProgress({
        phase: 'scene_summaries_progress',
        message: `Generated ${chapterSceneSummaries.length} scene outlines for Chapter ${i + 1}/${chapters.length}`,
      });
    }

    const sceneSummaries = allSceneSummaries;

    await onProgress({
      phase: 'scene_summaries_complete',
      message: `${sceneSummaries.length} scene outlines created across ${chapters.length} chapters`,
      data: { sceneSummaries },
    });

    // Phase 7: Scene Content
    await onProgress({
      phase: 'scene_content_start',
      message: `Generating narrative content for ${sceneSummaries.length} scenes...`,
      data: { totalScenes: sceneSummaries.length },
    });

    // Generate content for each scene
    const allScenes: any[] = [];
    for (let i = 0; i < sceneSummaries.length; i++) {
      const sceneSummary = sceneSummaries[i];

      // Find the chapter this scene belongs to
      const chapter = chapters.find(ch => ch.id === sceneSummary.chapterId);
      if (!chapter) {
        throw new Error(`Chapter not found for scene ${i + 1}`);
      }

      const sceneContentResponse = await fetch(`${baseUrl}/studio/api/generation/scene-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneSummary,
          characters,
          settings,
          chapterContext: {
            title: chapter.title,
            summary: chapter.summary,
            virtueType: chapter.virtueType
          },
          storyContext: {
            genre: storySummary.genre,
            tone: storySummary.targetAudience,
            moralFramework: storySummary.moralFramework.title
          }
        }),
      });

      if (!sceneContentResponse.ok) {
        const error = await sceneContentResponse.json();
        throw new Error(`Scene content generation failed for Scene ${i + 1}: ${error.details || error.error}`);
      }

      const sceneContent: any = await sceneContentResponse.json();
      allScenes.push(sceneContent);

      // Calculate percentage for progress
      const percentage = Math.round(((i + 1) / sceneSummaries.length) * 100);

      await onProgress({
        phase: 'scene_content_progress',
        message: `Generated content for scene ${i + 1}/${sceneSummaries.length}`,
        data: {
          completedScenes: i + 1,
          totalScenes: sceneSummaries.length,
          currentScene: i + 1,
          percentage
        },
      });
    }

    const scenes = allScenes;

    await onProgress({
      phase: 'scene_content_complete',
      message: `${scenes.length} scenes written`,
      data: { completedScenes: scenes.length },
    });

    // Phase 8: Scene Evaluation (handled within scene-content API)
    await onProgress({
      phase: 'scene_evaluation_start',
      message: 'Evaluating scene quality...',
    });

    await onProgress({
      phase: 'scene_evaluation_complete',
      message: 'All scenes evaluated and improved',
    });

    // Phase 9: Images
    await onProgress({
      phase: 'images_start',
      message: 'Generating character and setting images...',
      data: {
        totalImages: characters.length + settings.length,
      },
    });

    const imagesResponse = await fetch(`${baseUrl}/studio/api/generation/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storyId: 'temp', // This will be replaced by actual story ID from database
        characters,
        settings,
      }),
    });

    if (!imagesResponse.ok) {
      const error = await imagesResponse.json();
      throw new Error(`Image generation failed: ${error.details || error.error}`);
    }

    const imageResults = await imagesResponse.json();

    await onProgress({
      phase: 'images_complete',
      message: 'All images generated',
      data: imageResults,
    });

    // Generation complete
    const result = {
      storyId: 'generated', // Will be created by the API route
      story: {
        title: chapters[0]?.title || 'Untitled Story',
        genre: storySummary.genre,
        tone: storySummary.tone,
        summary: storySummary.summary,
        moralFramework: storySummary.moralFramework,
      },
      characters,
      settings,
      parts,
      chapters,
      scenes,
    };

    await onProgress({
      phase: 'complete',
      message: 'Story generation complete!',
      data: result,
    });

    return result;
  } catch (error) {
    await onProgress({
      phase: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
