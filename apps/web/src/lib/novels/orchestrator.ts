/**
 * Novel Generation Orchestrator
 *
 * Coordinates all 9 phases of novel generation using the Adversity-Triumph Engine.
 * Streams progress updates via callback function.
 */

import { textGenerationClient } from './ai-client';
import {
  STORY_SUMMARY_PROMPT,
  CHARACTER_GENERATION_PROMPT,
  CHAPTERS_GENERATION_PROMPT,
  SCENE_SUMMARY_PROMPT,
  SCENE_CONTENT_PROMPT,
} from './system-prompts';
import {
  StorySummaryJsonSchema,
  CharacterJsonSchema,
  SettingJsonSchema,
  PartJsonSchema,
  ChapterJsonSchema,
  SceneSummaryJsonSchema,
} from './json-schemas';
import type {
  PartGenerationResult,
  CharacterGenerationResult,
  SettingGenerationResult,
  ChapterGenerationResult,
  SceneSummaryResult,
  VirtueType,
  ArcPosition,
  CyclePhase,
} from './types';
import { nanoid } from 'nanoid';

/**
 * Novel Generation Options
 */
export interface NovelGenerationOptions {
  userPrompt: string;
  preferredGenre?: string;
  preferredTone?: 'hopeful' | 'dark' | 'bittersweet' | 'satirical';
  characterCount?: number;      // Default: 3
  settingCount?: number;         // Default: 3
  partsCount?: number;           // Default: 1
  chaptersPerPart?: number;      // Default: 1
  scenesPerChapter?: number;     // Default: 3
  language?: string;             // Default: 'English'
  skipImages?: boolean;          // Default: false (for testing without image generation)
}

/**
 * Progress Callback Data
 */
export interface ProgressData {
  phase:
    | 'story_summary_start' | 'story_summary_complete'
    | 'characters_start' | 'characters_progress' | 'characters_complete'
    | 'settings_start' | 'settings_progress' | 'settings_complete'
    | 'parts_start' | 'parts_progress' | 'parts_complete'
    | 'chapters_start' | 'chapters_progress' | 'chapters_complete'
    | 'scene_summaries_start' | 'scene_summaries_progress' | 'scene_summaries_complete'
    | 'scene_content_start' | 'scene_content_progress' | 'scene_content_complete'
    | 'scene_evaluation_start' | 'scene_evaluation_progress' | 'scene_evaluation_complete'
    | 'images_start' | 'images_progress' | 'images_complete'
    | 'complete' | 'error';
  message: string;
  data?: any;
}

/**
 * Generated Novel Result
 */
export interface GeneratedNovelResult {
  story: {
    title: string;
    genre: string;
    summary: string;
    tone: string;
    moralFramework: string;
  };
  characters: CharacterGenerationResult[];
  settings: SettingGenerationResult[];
  parts: PartGenerationResult[];
  chapters: ChapterGenerationResult[];
  scenes: SceneWithContent[];
}

interface SceneWithContent extends SceneSummaryResult {
  id: string;
  chapterId: string;
  settingId?: string | null;
  content: string;
}

/**
 * Main Orchestrator Function
 */
export async function generateCompleteNovel(
  options: NovelGenerationOptions,
  onProgress: (progress: ProgressData) => void
): Promise<GeneratedNovelResult> {
  const {
    userPrompt,
    preferredGenre,
    preferredTone = 'hopeful',
    characterCount = 3,
    settingCount = 3,
    partsCount = 1,
    chaptersPerPart = 1,
    scenesPerChapter = 3,
    language = 'English',
    skipImages = false,
  } = options;

  try {
    // Phase 1: Generate Story Summary
    onProgress({ phase: 'story_summary_start', message: 'Generating story summary...' });

    const storySummaryPrompt = `${STORY_SUMMARY_PROMPT}

User Request: ${userPrompt}
Preferred Genre: ${preferredGenre || 'Any'}
Preferred Tone: ${preferredTone}
Language: ${language}

Generate a story foundation with:
1. Title (engaging and memorable)
2. Genre (specific genre classification)
3. Summary (2-3 sentences describing the thematic premise and moral framework)
4. Tone (hopeful, dark, bittersweet, or satirical)
5. Moral Framework (what virtues are valued in this story?)`;

    const storySummaryResponse = await textGenerationClient.generate({
      prompt: storySummaryPrompt,
      temperature: 0.8,
      maxTokens: 8192,
      responseFormat: 'json',
      responseSchema: StorySummaryJsonSchema,
    });

    console.log('[Orchestrator] Story summary response:', {
      text: storySummaryResponse.text,
      length: storySummaryResponse.text?.length || 0,
      model: storySummaryResponse.model,
      tokensUsed: storySummaryResponse.tokensUsed,
      finishReason: storySummaryResponse.finishReason,
    });

    if (!storySummaryResponse.text || storySummaryResponse.text.trim() === '') {
      throw new Error('Empty response from AI model for story summary');
    }

    const storyData = JSON.parse(storySummaryResponse.text);

    onProgress({
      phase: 'story_summary_complete',
      message: 'Story summary generated',
      data: { storySummary: storyData },
    });

    // Phase 2: Generate Characters
    onProgress({ phase: 'characters_start', message: `Generating ${characterCount} characters...` });

    const characters: CharacterGenerationResult[] = [];
    for (let i = 0; i < characterCount; i++) {
      onProgress({
        phase: 'characters_progress',
        message: `Generating character ${i + 1}/${characterCount}...`,
        data: { currentItem: i + 1, totalItems: characterCount },
      });

      const characterPrompt = `${CHARACTER_GENERATION_PROMPT}

Story Context:
Title: ${storyData.title}
Genre: ${storyData.genre}
Summary: ${storyData.summary}
Moral Framework: ${storyData.moralFramework}

Generate character ${i + 1} of ${characterCount} (${i === 0 ? 'main protagonist' : 'supporting character'}):
- id: "char_${i + 1}"
- isMain: ${i === 0}
- visualStyle: "realistic"`;

      const characterResponse = await textGenerationClient.generate({
        prompt: characterPrompt,
        temperature: 0.9,
        maxTokens: 8192,
        responseFormat: 'json',
        responseSchema: CharacterJsonSchema,
      });

      const characterData = JSON.parse(characterResponse.text);
      characters.push(characterData);
    }

    onProgress({
      phase: 'characters_complete',
      message: `Generated ${characters.length} characters`,
      data: { characters },
    });

    // Phase 3: Generate Settings
    onProgress({ phase: 'settings_start', message: `Generating ${settingCount} settings...` });

    const settings: SettingGenerationResult[] = [];
    for (let i = 0; i < settingCount; i++) {
      onProgress({
        phase: 'settings_progress',
        message: `Generating setting ${i + 1}/${settingCount}...`,
        data: { currentItem: i + 1, totalItems: settingCount },
      });

      const settingPrompt = `Generate a story setting that serves as an emotional environment for the Adversity-Triumph narrative framework.

Story Context:
Title: ${storyData.title}
Genre: ${storyData.genre}
Summary: ${storyData.summary}
Moral Framework: ${storyData.moralFramework}

Generate setting ${i + 1} of ${settingCount}:

Return as JSON with this exact structure:
{
  "id": "setting_${i + 1}",
  "name": "...",
  "description": "...",
  "adversityElements": {
    "physicalObstacles": ["...", "..."],
    "scarcityFactors": ["...", "..."],
    "dangerSources": ["...", "..."],
    "socialDynamics": ["...", "..."]
  },
  "symbolicMeaning": "...",
  "cycleAmplification": {
    "setup": "...",
    "confrontation": "...",
    "virtue": "...",
    "consequence": "...",
    "transition": "..."
  },
  "mood": "...",
  "emotionalResonance": "...",
  "sensory": {
    "sight": ["...", "...", "..."],
    "sound": ["...", "...", "..."],
    "smell": ["...", "..."],
    "touch": ["...", "..."],
    "taste": []
  },
  "architecturalStyle": "...",
  "visualStyle": "realistic",
  "visualReferences": ["...", "..."],
  "colorPalette": ["...", "...", "..."]
}`;

      const settingResponse = await textGenerationClient.generate({
        prompt: settingPrompt,
        temperature: 0.85,
        maxTokens: 8192,
        responseFormat: 'json',
        responseSchema: SettingJsonSchema,
      });

      const settingData = JSON.parse(settingResponse.text);
      settings.push(settingData);
    }

    onProgress({
      phase: 'settings_complete',
      message: `Generated ${settings.length} settings`,
      data: { settings },
    });

    // Phase 4: Generate Parts (3-Act Structure)
    onProgress({ phase: 'parts_start', message: `Generating ${partsCount} parts...` });

    const parts: PartGenerationResult[] = [];
    for (let i = 0; i < partsCount; i++) {
      onProgress({
        phase: 'parts_progress',
        message: `Generating part ${i + 1}/${partsCount}...`,
        data: { currentItem: i + 1, totalItems: partsCount },
      });

      const partPrompt = `Generate Part ${i + 1} (Act ${i + 1}) for the story using the Adversity-Triumph Engine.

Story Context:
Title: ${storyData.title}
Genre: ${storyData.genre}
Summary: ${storyData.summary}
Moral Framework: ${storyData.moralFramework}

Characters:
${characters.map(c => `- ${c.name}: ${c.coreTrait} (flaw: ${c.internalFlaw})`).join('\n')}

Generate a part with MACRO adversity-triumph arcs for each character.

Return as JSON:
{
  "id": "part_${i + 1}",
  "title": "Act ${i + 1}: ...",
  "summary": "...",
  "orderIndex": ${i},
  "characterArcs": [
    {
      "characterId": "char_1",
      "macroAdversity": {
        "internal": "...",
        "external": "..."
      },
      "macroVirtue": "...",
      "macroConsequence": "...",
      "macroNewAdversity": "...",
      "estimatedChapters": ${chaptersPerPart},
      "arcPosition": "primary",
      "progressionStrategy": "..."
    }
  ]
}`;

      const partResponse = await textGenerationClient.generate({
        prompt: partPrompt,
        temperature: 0.85,
        maxTokens: 8192,
        responseFormat: 'json',
        responseSchema: PartJsonSchema,
      });

      const partData = JSON.parse(partResponse.text);
      parts.push(partData);
    }

    onProgress({
      phase: 'parts_complete',
      message: `Generated ${parts.length} parts`,
      data: { parts },
    });

    // Phase 5: Generate Chapters
    onProgress({ phase: 'chapters_start', message: 'Generating chapters...' });

    const chapters: ChapterGenerationResult[] = [];
    let chapterIndex = 0;

    for (const part of parts) {
      for (let i = 0; i < chaptersPerPart; i++) {
        chapterIndex++;
        onProgress({
          phase: 'chapters_progress',
          message: `Generating chapter ${chapterIndex}...`,
          data: { currentItem: chapterIndex, totalItems: partsCount * chaptersPerPart },
        });

        const chapterPrompt = `${CHAPTERS_GENERATION_PROMPT}

Generate Chapter ${chapterIndex} for ${part.title}.

Story Context:
Title: ${storyData.title}
Part: ${part.title}
Part Summary: ${part.summary}

Previous Chapter: ${chapters.length > 0 ? chapters[chapters.length - 1].summary : 'None (this is the first chapter)'}

Return as JSON:
{
  "id": "chapter_${chapterIndex}",
  "partId": "${part.id}",
  "title": "Chapter ${chapterIndex}: ...",
  "summary": "...",
  "characterId": "${characters[0].id}",
  "arcPosition": "${i === 0 ? 'beginning' : i === chaptersPerPart - 1 ? 'climax' : 'middle'}",
  "contributesToMacroArc": "...",
  "focusCharacters": ["${characters[0].id}"],
  "adversityType": "both",
  "virtueType": "courage",
  "seedsPlanted": [],
  "seedsResolved": [],
  "connectsToPreviousChapter": "${chapters.length > 0 ? 'Previous chapter resolution creates this adversity' : 'Story beginning'}",
  "createsNextAdversity": "..."
}`;

        const chapterResponse = await textGenerationClient.generate({
          prompt: chapterPrompt,
          temperature: 0.85,
          maxTokens: 8192,
          responseFormat: 'json',
          responseSchema: ChapterJsonSchema,
        });

        const chapterData = JSON.parse(chapterResponse.text);
        chapters.push(chapterData);
      }
    }

    onProgress({
      phase: 'chapters_complete',
      message: `Generated ${chapters.length} chapters`,
      data: { chapters },
    });

    // Phase 6: Generate Scene Summaries
    onProgress({ phase: 'scene_summaries_start', message: 'Generating scene summaries...' });

    const scenesWithSummaries: SceneSummaryResult[] = [];
    const chapterSceneMap = new Map<string, SceneSummaryResult[]>();

    for (const chapter of chapters) {
      const chapSummaries: SceneSummaryResult[] = [];

      for (let i = 0; i < scenesPerChapter; i++) {
        onProgress({
          phase: 'scene_summaries_progress',
          message: `Generating scene summary ${scenesWithSummaries.length + 1}...`,
          data: { currentItem: scenesWithSummaries.length + 1, totalItems: chapters.length * scenesPerChapter },
        });

        const cyclePhases: CyclePhase[] = ['setup', 'confrontation', 'virtue', 'consequence', 'transition'];
        const cyclePhase = cyclePhases[Math.min(i, cyclePhases.length - 1)];

        const sceneSummaryPrompt = `${SCENE_SUMMARY_PROMPT}

Generate scene ${i + 1} of ${scenesPerChapter} for this chapter.

Chapter Context:
Title: ${chapter.title}
Summary: ${chapter.summary}
Cycle Phase: ${cyclePhase}

Setting Options:
${settings.map((s, idx) => `${idx + 1}. ${s.name}: ${s.description}`).join('\n')}

Return as JSON:
{
  "title": "Scene ${i + 1}: ...",
  "summary": "...",
  "cyclePhase": "${cyclePhase}",
  "emotionalBeat": "...",
  "dialogueVsDescription": "balanced",
  "suggestedLength": "medium",
  "characterFocus": ["${chapter.characterId}"],
  "settingId": "${settings[i % settings.length].id}",
  "sensoryAnchors": ["...", "...", "..."]
}`;

        const sceneResponse = await textGenerationClient.generate({
          prompt: sceneSummaryPrompt,
          temperature: 0.8,
          maxTokens: 8192,
          responseFormat: 'json',
          responseSchema: SceneSummaryJsonSchema,
        });

        const sceneData = JSON.parse(sceneResponse.text);
        scenesWithSummaries.push(sceneData);
        chapSummaries.push(sceneData);
      }

      chapterSceneMap.set(chapter.id, chapSummaries);
    }

    onProgress({
      phase: 'scene_summaries_complete',
      message: `Generated ${scenesWithSummaries.length} scene summaries`,
    });

    // Phase 7: Generate Scene Content
    onProgress({ phase: 'scene_content_start', message: 'Generating scene content...' });

    const scenes: SceneWithContent[] = [];
    let sceneIndex = 0;

    for (const chapter of chapters) {
      const chapterScenes = chapterSceneMap.get(chapter.id) || [];

      for (const sceneSummary of chapterScenes) {
        sceneIndex++;
        onProgress({
          phase: 'scene_content_progress',
          message: `Generating scene content ${sceneIndex}/${scenesWithSummaries.length}...`,
          data: { currentItem: sceneIndex, totalItems: scenesWithSummaries.length },
        });

        const setting = settings.find(s => s.id === sceneSummary.settingId);
        const character = characters.find(c => sceneSummary.characterFocus?.includes(c.id));

        const sceneContentPrompt = `${SCENE_CONTENT_PROMPT}

Generate prose content for this scene.

Scene Summary: ${sceneSummary.summary}
Cycle Phase: ${sceneSummary.cyclePhase}
Emotional Beat: ${sceneSummary.emotionalBeat}
Suggested Length: ${sceneSummary.suggestedLength} (300-800 words)

Setting: ${setting ? `${setting.name} - ${setting.description}` : 'Generic setting'}
Sensory Details: ${sceneSummary.sensoryAnchors ? sceneSummary.sensoryAnchors.join(', ') : 'Use setting-appropriate details'}

Character: ${character ? `${character.name} - ${character.summary}` : 'Unknown character'}
Voice Style: ${character ? `${character.voiceStyle.tone}, ${character.voiceStyle.vocabulary}` : 'Neutral'}

Write the scene content in ${language}. Use strong sensory details, natural dialogue, and mobile-optimized formatting (max 3 sentences per paragraph).

Return only the prose content (no JSON, no wrapper).`;

        const contentResponse = await textGenerationClient.generate({
          prompt: sceneContentPrompt,
          temperature: 0.85,
          maxTokens: 8192,
        });

        const sceneContent = contentResponse.text.trim();

        scenes.push({
          id: `scene_${sceneIndex}`,
          chapterId: chapter.id,
          settingId: sceneSummary.settingId,
          ...sceneSummary,
          content: sceneContent,
        });
      }
    }

    onProgress({
      phase: 'scene_content_complete',
      message: `Generated ${scenes.length} scenes with content`,
    });

    // Phase 8: Scene Evaluation (Optional - can be added later)
    // For now, we'll skip evaluation and just return the generated content

    // Return the complete novel
    return {
      story: storyData,
      characters,
      settings,
      parts,
      chapters,
      scenes,
    };

  } catch (error) {
    console.error('[Orchestrator] Generation error:', error);
    throw error;
  }
}
