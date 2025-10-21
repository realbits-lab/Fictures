import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { AI_MODELS } from '@/lib/ai/config';
import type {
  ValidationResult,
  StoryEvaluationResult,
  FullValidationResult,
  OverallEvaluation
} from '@/types/validation-evaluation';

// Improvement schemas
const ImprovedStorySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  premise: z.string().optional(),
  dramaticQuestion: z.string().optional(),
  theme: z.string().optional(),
  hnsData: z.object({
    narrative_structure: z.string().optional(),
    story_arc: z.string().optional(),
    central_conflict: z.string().optional(),
    emotional_journey: z.string().optional(),
    thematic_elements: z.array(z.string()).optional(),
    tone: z.string().optional(),
    pov_strategy: z.string().optional()
  }).optional()
});

const ImprovedPartSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  structuralRole: z.string().optional(),
  summary: z.string().optional(),
  keyBeats: z.array(z.string()).optional(),
  hnsData: z.object({
    tension_progression: z.string().optional(),
    narrative_function: z.string().optional(),
    key_turning_points: z.array(z.string()).optional(),
    emotional_arc: z.string().optional()
  }).optional()
});

const ImprovedChapterSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  purpose: z.string().optional(),
  hook: z.string().optional(),
  characterFocus: z.string().optional(),
  pacingGoal: z.string().optional(),
  actionDialogueRatio: z.string().optional(),
  chapterHook: z.object({
    type: z.string(),
    description: z.string(),
    urgency_level: z.string()
  }).optional(),
  hnsData: z.object({
    scene_transitions: z.array(z.string()).optional(),
    tension_beats: z.array(z.string()).optional(),
    chapter_arc: z.string().optional(),
    cliffhanger: z.string().optional()
  }).optional()
});

const ImprovedSceneSchema = z.object({
  title: z.string().optional(),
  goal: z.string().optional(),
  conflict: z.string().optional(),
  outcome: z.string().optional(),
  summary: z.string().optional(),
  entryHook: z.string().optional(),
  narrativeVoice: z.string().optional(),
  emotionalShift: z.object({
    from: z.string(),
    to: z.string()
  }).optional(),
  hnsData: z.object({
    sensory_details: z.array(z.string()).optional(),
    dialogue_goals: z.array(z.string()).optional(),
    action_beats: z.array(z.string()).optional(),
    subtext: z.string().optional(),
    scene_purpose: z.string().optional()
  }).optional(),
  content: z.string().optional() // Add content field for prose improvements
});

const ImprovedCharacterSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  archetype: z.string().optional(),
  summary: z.string().optional(),
  storyline: z.string().optional(),
  personality: z.object({
    traits: z.array(z.string()),
    myers_briggs: z.string(),
    enneagram: z.string()
  }).optional(),
  backstory: z.record(z.string(), z.string()).optional(),
  motivations: z.object({
    primary: z.string(),
    secondary: z.string(),
    fear: z.string()
  }).optional(),
  voice: z.object({
    speech_patterns: z.array(z.string()).optional(),
    vocabulary_level: z.string().optional(),
    catchphrases: z.array(z.string()).optional(),
    dialogue_style: z.string().optional()
  }).optional(),
  physicalDescription: z.object({
    appearance: z.string().optional(),
    distinguishing_features: z.array(z.string()).optional(),
    mannerisms: z.array(z.string()).optional()
  }).optional(),
  hnsData: z.object({
    character_arc: z.string().optional(),
    relationships: z.record(z.string(), z.string()).optional(),
    internal_conflict: z.string().optional(),
    external_conflict: z.string().optional(),
    growth_trajectory: z.string().optional(),
    key_scenes: z.array(z.string()).optional()
  }).optional()
});

const ImprovedSettingSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  mood: z.string().optional(),
  sensory: z.record(z.string(), z.array(z.string())).optional(),
  visualStyle: z.string().optional(),
  visualReferences: z.array(z.string()).optional(),
  colorPalette: z.array(z.string()).optional(),
  architecturalStyle: z.string().optional(),
  hnsData: z.object({
    atmosphere: z.string().optional(),
    symbolic_meaning: z.string().optional(),
    story_function: z.string().optional(),
    time_period: z.string().optional(),
    cultural_context: z.string().optional(),
    environmental_challenges: z.array(z.string()).optional()
  }).optional()
});

// Types
export interface StoryImprovementRequest {
  analysisResult: {
    validation?: FullValidationResult;
    evaluation?: StoryEvaluationResult;
  };
  originalData: {
    story: any;
    parts?: any[];
    chapters?: any[];
    scenes?: any[];
    characters?: any[];
    settings?: any[];
  };
  options?: {
    updateLevel: 'conservative' | 'moderate' | 'aggressive';
    preserveUserContent: boolean;
    focusAreas?: ('structure' | 'character' | 'world' | 'pacing' | 'dialogue')[];
    autoApply: boolean;
  };
}

export interface StoryImprovementResult {
  improved: {
    story: any;
    parts: any[];
    chapters: any[];
    scenes: any[];
    characters: any[];
    settings: any[];
  };
  changes: {
    story: ChangeLog;
    parts: ChangeLog[];
    chapters: ChangeLog[];
    scenes: ChangeLog[];
    characters: ChangeLog[];
    settings: ChangeLog[];
  };
  summary: {
    totalChanges: number;
    majorImprovements: string[];
    minorAdjustments: string[];
    preservedElements: string[];
  };
}

interface ChangeLog {
  id: string;
  fieldsUpdated: string[];
  improvements: string[];
  rationale: string;
}

// Main improvement function
export async function improveStoryContent(
  request: StoryImprovementRequest
): Promise<StoryImprovementResult> {
  const improvementStartTime = Date.now();
  console.log('🔧 =================== STORY IMPROVEMENT START ===================');
  console.log('   Start Time:', new Date().toISOString());
  console.log('   Request Options:', request.options);

  const { analysisResult, originalData, options } = request;
  const updateLevel = options?.updateLevel || 'moderate';

  console.log('   Update Level:', updateLevel);
  console.log('   Analysis Result Summary:');
  console.log('     - Validation Errors:', analysisResult.validation?.totalErrors || 0);
  console.log('     - Validation Warnings:', analysisResult.validation?.totalWarnings || 0);
  console.log('     - Overall Score:', analysisResult.evaluation?.storyEvaluation?.overallScore || 0);

  console.log('   Original Data Counts:');
  console.log('     - Story:', originalData.story ? '1' : '0');
  console.log('     - Parts:', originalData.parts?.length || 0);
  console.log('     - Chapters:', originalData.chapters?.length || 0);
  console.log('     - Scenes:', originalData.scenes?.length || 0);
  console.log('     - Characters:', originalData.characters?.length || 0);
  console.log('     - Settings:', originalData.settings?.length || 0);

  const result: StoryImprovementResult = {
    improved: {
      story: { ...originalData.story },
      parts: [...(originalData.parts || [])],
      chapters: [...(originalData.chapters || [])],
      scenes: [...(originalData.scenes || [])],
      characters: [...(originalData.characters || [])],
      settings: [...(originalData.settings || [])],
    },
    changes: {
      story: { id: originalData.story?.id || '', fieldsUpdated: [], improvements: [], rationale: '' },
      parts: [],
      chapters: [],
      scenes: [],
      characters: [],
      settings: [],
    },
    summary: {
      totalChanges: 0,
      majorImprovements: [],
      minorAdjustments: [],
      preservedElements: []
    }
  };

  // Improve story
  console.log('\n📖 ============= STORY IMPROVEMENT =============');
  const storyStartTime = Date.now();
  if (originalData.story && shouldImproveComponent(analysisResult.validation?.story, analysisResult.evaluation?.storyEvaluation)) {
    console.log('   Story needs improvement, starting...');
    const improvedStory = await improveStory(
      originalData.story,
      analysisResult.validation?.story,
      analysisResult.evaluation?.storyEvaluation,
      updateLevel
    );
    console.log('   Story improvement completed in', Date.now() - storyStartTime, 'ms');
    console.log('   Changes made:', improvedStory.changes.length);

    if (improvedStory.changes.length > 0) {
      result.improved.story = { ...originalData.story, ...improvedStory.data };
      result.changes.story = {
        id: originalData.story.id,
        fieldsUpdated: improvedStory.changes,
        improvements: improvedStory.improvements,
        rationale: improvedStory.rationale
      };
      result.summary.totalChanges += improvedStory.changes.length;
    }
  } else {
    console.log('   Story does not need improvement, skipping');
  }

  // Improve parts
  console.log('\n📚 ============= PARTS IMPROVEMENT =============');
  const partsStartTime = Date.now();
  console.log('   Total parts to process:', (originalData.parts || []).length);

  for (let i = 0; i < (originalData.parts || []).length; i++) {
    const partStartTime = Date.now();
    const part = originalData.parts![i];
    const partValidation = analysisResult.validation?.parts[i];
    const partEvaluation = analysisResult.evaluation?.partEvaluations.find(e => e.partId === part.id);

    console.log(`   Processing part ${i + 1}/${originalData.parts!.length}: ${part.title}`);

    const priority = getImprovementPriority(partValidation, partEvaluation);
    if (priority === 'high' || priority === 'medium') {
      console.log(`     Part needs ${priority} priority improvement, starting AI call...`);
      const improvedPart = await improvePart(part, partValidation, partEvaluation, updateLevel);
      console.log(`     Part ${i + 1} improved in ${Date.now() - partStartTime}ms, changes: ${improvedPart.changes.length}`);

      if (improvedPart.changes.length > 0) {
        result.improved.parts[i] = { ...part, ...improvedPart.data };
        result.changes.parts.push({
          id: part.id,
          fieldsUpdated: improvedPart.changes,
          improvements: improvedPart.improvements,
          rationale: improvedPart.rationale
        });
        result.summary.totalChanges += improvedPart.changes.length;
      }
    } else {
      console.log('     Part skipped (low priority or no issues)');
    }
  }
  console.log(`   All parts processed in ${Date.now() - partsStartTime}ms`);

  // Improve chapters
  console.log('\n📖 ============= CHAPTERS IMPROVEMENT =============');
  const chaptersStartTime = Date.now();
  console.log('   Total chapters to process:', (originalData.chapters || []).length);

  for (let i = 0; i < (originalData.chapters || []).length; i++) {
    const chapterStartTime = Date.now();
    const chapter = originalData.chapters![i];
    const chapterValidation = analysisResult.validation?.chapters[i];
    const chapterEvaluation = analysisResult.evaluation?.chapterEvaluations.find(e => e.chapterId === chapter.id);

    console.log(`   Processing chapter ${i + 1}/${originalData.chapters!.length}: ${chapter.title}`);

    const priority = getImprovementPriority(chapterValidation, chapterEvaluation);
    if (priority === 'high' || priority === 'medium') {
      console.log(`     Chapter needs ${priority} priority improvement, starting AI call...`);
      const improvedChapter = await improveChapter(chapter, chapterValidation, chapterEvaluation, updateLevel);
      console.log(`     Chapter ${i + 1} improved in ${Date.now() - chapterStartTime}ms, changes: ${improvedChapter.changes.length}`);

      if (improvedChapter.changes.length > 0) {
        result.improved.chapters[i] = { ...chapter, ...improvedChapter.data };
        result.changes.chapters.push({
          id: chapter.id,
          fieldsUpdated: improvedChapter.changes,
          improvements: improvedChapter.improvements,
          rationale: improvedChapter.rationale
        });
        result.summary.totalChanges += improvedChapter.changes.length;
      }
    } else {
      console.log('     Chapter skipped (low priority or no issues)');
    }
  }
  console.log(`   All chapters processed in ${Date.now() - chaptersStartTime}ms`);

  // Improve scenes
  console.log('\n🎬 ============= SCENES IMPROVEMENT =============');
  const scenesStartTime = Date.now();
  console.log('   Total scenes to process:', (originalData.scenes || []).length);

  for (let i = 0; i < (originalData.scenes || []).length; i++) {
    const sceneStartTime = Date.now();
    const scene = originalData.scenes![i];
    const sceneValidation = analysisResult.validation?.scenes[i];
    const sceneEvaluation = analysisResult.evaluation?.sceneEvaluations.find(e => e.sceneId === scene.id);

    console.log(`   Processing scene ${i + 1}/${originalData.scenes!.length}: ${scene.title}`);

    const priority = getImprovementPriority(sceneValidation, sceneEvaluation);
    if (priority === 'high' || priority === 'medium') {
      console.log(`     Scene needs ${priority} priority improvement, starting AI call...`);
      const improvedScene = await improveScene(scene, sceneValidation, sceneEvaluation, updateLevel);
      console.log(`     Scene ${i + 1} improved in ${Date.now() - sceneStartTime}ms, changes: ${improvedScene.changes.length}`);

      if (improvedScene.changes.length > 0) {
        result.improved.scenes[i] = { ...scene, ...improvedScene.data };
        result.changes.scenes.push({
          id: scene.id,
          fieldsUpdated: improvedScene.changes,
          improvements: improvedScene.improvements,
          rationale: improvedScene.rationale
        });
        result.summary.totalChanges += improvedScene.changes.length;
      }
    } else {
      console.log('     Scene skipped (low priority or no issues)');
    }
  }
  console.log(`   All scenes processed in ${Date.now() - scenesStartTime}ms`);

  // Improve characters
  console.log('\n👥 ============= CHARACTERS IMPROVEMENT =============');
  const charactersStartTime = Date.now();
  console.log('   Total characters to process:', (originalData.characters || []).length);

  for (let i = 0; i < (originalData.characters || []).length; i++) {
    const characterStartTime = Date.now();
    const character = originalData.characters![i];
    const characterValidation = analysisResult.validation?.characters[i];
    const characterEvaluation = analysisResult.evaluation?.characterEvaluations.find(e => e.characterId === character.id);

    console.log(`   Processing character ${i + 1}/${originalData.characters!.length}: ${character.name}`);

    const priority = getImprovementPriority(characterValidation, characterEvaluation);
    if (priority === 'high' || priority === 'medium') {
      console.log(`     Character needs ${priority} priority improvement, starting AI call...`);
      const improvedCharacter = await improveCharacter(character, characterValidation, characterEvaluation, updateLevel);
      console.log(`     Character ${i + 1} improved in ${Date.now() - characterStartTime}ms, changes: ${improvedCharacter.changes.length}`);

      if (improvedCharacter.changes.length > 0) {
        result.improved.characters[i] = { ...character, ...improvedCharacter.data };
        result.changes.characters.push({
          id: character.id,
          fieldsUpdated: improvedCharacter.changes,
          improvements: improvedCharacter.improvements,
          rationale: improvedCharacter.rationale
        });
        result.summary.totalChanges += improvedCharacter.changes.length;
      }
    } else {
      console.log('     Character skipped (low priority or no issues)');
    }
  }
  console.log(`   All characters processed in ${Date.now() - charactersStartTime}ms`);

  // Improve settings
  console.log('\n🏙️ ============= SETTINGS IMPROVEMENT =============');
  const settingsStartTime = Date.now();
  console.log('   Total settings to process:', (originalData.settings || []).length);

  for (let i = 0; i < (originalData.settings || []).length; i++) {
    const settingStartTime = Date.now();
    const setting = originalData.settings![i];
    const settingValidation = analysisResult.validation?.settings[i];
    const settingEvaluation = analysisResult.evaluation?.settingEvaluations.find(e => e.settingId === setting.id);

    console.log(`   Processing setting ${i + 1}/${originalData.settings!.length}: ${setting.name}`);

    const priority = getImprovementPriority(settingValidation, settingEvaluation);
    if (priority === 'high' || priority === 'medium') {
      console.log(`     Setting needs ${priority} priority improvement, starting AI call...`);
      const improvedSetting = await improveSetting(setting, settingValidation, settingEvaluation, updateLevel);
      console.log(`     Setting ${i + 1} improved in ${Date.now() - settingStartTime}ms, changes: ${improvedSetting.changes.length}`);

      if (improvedSetting.changes.length > 0) {
        result.improved.settings[i] = { ...setting, ...improvedSetting.data };
        result.changes.settings.push({
          id: setting.id,
          fieldsUpdated: improvedSetting.changes,
          improvements: improvedSetting.improvements,
          rationale: improvedSetting.rationale
        });
        result.summary.totalChanges += improvedSetting.changes.length;
      }
    } else {
      console.log('     Setting skipped (low priority or no issues)');
    }
  }
  console.log(`   All settings processed in ${Date.now() - settingsStartTime}ms`);

  // Generate summary
  console.log('\n📊 ============= GENERATING SUMMARY =============');
  const summaryStartTime = Date.now();
  result.summary = generateImprovementSummary(result.changes, analysisResult);
  console.log(`   Summary generated in ${Date.now() - summaryStartTime}ms`);

  console.log(`\n🎯 ============= IMPROVEMENT COMPLETE =============`);
  console.log(`   Total improvement time: ${Date.now() - improvementStartTime}ms`);
  console.log(`   Total changes made: ${result.summary.totalChanges}`);
  console.log(`   Major improvements: ${result.summary.majorImprovements.length}`);
  console.log(`   Minor adjustments: ${result.summary.minorAdjustments.length}`);
  console.log('🔧 =================== STORY IMPROVEMENT END ===================\n');

  return result;
}

// Helper functions
function shouldImproveComponent(validation?: ValidationResult, evaluation?: any): boolean {
  if (!validation && !evaluation) return false;

  // Improve if there are validation errors or warnings
  if (validation && (!validation.isValid || validation.warnings.length > 0)) return true;

  // Improve if evaluation score is below threshold
  if (evaluation) {
    const scores = [
      evaluation.overallScore,
      evaluation.structuralEffectiveness,
      evaluation.contributionToStory,
      evaluation.hookEffectiveness,
      evaluation.pacingScore,
      evaluation.goalClarity,
      evaluation.consistency,
      evaluation.atmosphereScore
    ].filter(s => s !== undefined);

    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 100;
    return avgScore < 75; // Improve if below 75%
  }

  return false;
}

// Helper function to determine improvement priority (optimize for speed)
function getImprovementPriority(validation?: ValidationResult, evaluation?: any): 'high' | 'medium' | 'low' | 'skip' {
  const errorCount = validation?.errors?.length || 0;
  const warningCount = validation?.warnings?.length || 0;

  // Get average score for evaluation
  let avgScore = 100;
  if (evaluation) {
    const scores = [
      evaluation.overallScore,
      evaluation.structuralEffectiveness,
      evaluation.contributionToStory,
      evaluation.hookEffectiveness,
      evaluation.pacingScore,
      evaluation.goalClarity,
      evaluation.consistency,
      evaluation.atmosphereScore
    ].filter(s => s !== undefined);
    avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 100;
  }

  console.log(`     Priority check - Errors: ${errorCount}, Warnings: ${warningCount}, Score: ${avgScore}`);

  // High priority: Critical errors or very low scores
  if (errorCount >= 5 || avgScore < 40) {
    console.log('     → HIGH priority improvement');
    return 'high';
  }

  // Medium priority: Some errors or low scores
  if (errorCount >= 2 || warningCount >= 5 || avgScore < 60) {
    console.log('     → MEDIUM priority improvement');
    return 'medium';
  }

  // Skip low priority to save time
  console.log('     → SKIPPING (low priority)');
  return 'skip';
}

async function improveStory(
  story: any,
  validation?: ValidationResult,
  evaluation?: OverallEvaluation | null,
  updateLevel: string = 'moderate'
): Promise<{ data: any; changes: string[]; improvements: string[]; rationale: string }> {
  try {
    const issues = [
      ...(validation?.errors.map(e => e.message) || []),
      ...(validation?.warnings.map(w => w.message) || []),
      ...(evaluation?.prioritizedImprovements || [])
    ];

    const { object } = await generateObject({
      model: AI_MODELS.generation,
      schema: ImprovedStorySchema,
      prompt: `Improve this story structure based on feedback:

ORIGINAL STORY:
Title: ${story.title}
Description: ${story.description || 'N/A'}
Premise: ${story.premise || 'N/A'}
Dramatic Question: ${story.dramaticQuestion || 'N/A'}
Theme: ${story.theme || 'N/A'}
Current HNS Data: ${JSON.stringify(story.hnsData || {})}

ISSUES TO ADDRESS:
${issues.join('\n')}

EVALUATION SCORES:
${evaluation ? `
- Narrative Structure: ${evaluation.narrativeStructure.score}/100
- Character Development: ${evaluation.characterDevelopment.score}/100
- World Building: ${evaluation.worldBuilding.score}/100
- Pacing: ${evaluation.pacing.score}/100
- Theme Consistency: ${evaluation.themeConsistency.score}/100
` : 'No evaluation available'}

Update Level: ${updateLevel}

Provide improvements that:
1. Address all identified issues
2. Enhance weak areas based on scores
3. Maintain existing strengths
4. Add comprehensive hnsData for story development
5. ${updateLevel === 'conservative' ? 'Make minimal necessary changes' : updateLevel === 'aggressive' ? 'Make comprehensive improvements' : 'Balance improvements with preservation'}

Return ONLY the fields that need updating. Keep other fields unchanged.`
    });

    const changes: string[] = [];
    const improvements: string[] = [];

    // Track what was improved
    if (object.description && object.description !== story.description) {
      changes.push('description');
      improvements.push('Enhanced story description for clarity');
    }
    if (object.premise && object.premise !== story.premise) {
      changes.push('premise');
      improvements.push('Clarified story premise');
    }
    if (object.dramaticQuestion && object.dramaticQuestion !== story.dramaticQuestion) {
      changes.push('dramaticQuestion');
      improvements.push('Strengthened dramatic question');
    }
    if (object.theme && object.theme !== story.theme) {
      changes.push('theme');
      improvements.push('Refined thematic elements');
    }
    if (object.hnsData) {
      changes.push('hnsData');
      improvements.push('Added comprehensive HNS narrative data');
    }

    return {
      data: object,
      changes,
      improvements,
      rationale: `Improved story structure to address ${issues.length} issues and enhance narrative coherence`
    };
  } catch (error) {
    console.error('Story improvement error:', error);
    return { data: {}, changes: [], improvements: [], rationale: 'Unable to improve at this time' };
  }
}

async function improvePart(
  part: any,
  validation?: ValidationResult,
  evaluation?: any,
  updateLevel: string = 'moderate'
): Promise<{ data: any; changes: string[]; improvements: string[]; rationale: string }> {
  try {
    const issues = [
      ...(validation?.errors.map(e => e.message) || []),
      ...(validation?.warnings.map(w => w.message) || []),
      ...(evaluation?.suggestions || [])
    ];

    // Truncate overly long titles to prevent JSON parsing issues
    const truncateString = (str: string, maxLength: number = 500) => {
      if (!str) return 'N/A';
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength) + '...';
    };

    const { object } = await generateObject({
      model: AI_MODELS.generation,
      schema: ImprovedPartSchema,
      prompt: `Improve this story part based on feedback:

ORIGINAL PART:
Title: ${truncateString(part.title, 200)}
Description: ${truncateString(part.description || 'N/A', 500)}
Structural Role: ${part.structuralRole || 'N/A'}
Summary: ${truncateString(part.summary || 'N/A', 1000)}
Key Beats: ${JSON.stringify(part.keyBeats || []).substring(0, 500)}
Current HNS Data: ${JSON.stringify(part.hnsData || {}).substring(0, 500)}

ISSUES TO ADDRESS:
${issues.join('\n')}

EVALUATION SCORES:
${evaluation ? `
- Structural Effectiveness: ${evaluation.structuralEffectiveness}/100
- Contribution to Story: ${evaluation.contributionToStory}/100
` : 'No evaluation available'}

Update Level: ${updateLevel}

Improve the part to:
1. Address all identified issues
2. Enhance structural role and contribution
3. Add comprehensive hnsData for narrative development
4. Maintain consistency with overall story
5. CRITICAL: Keep title concise (max 50 characters) and clear

Return ONLY the fields that need updating. Ensure all text fields are reasonable in length.`
    });

    const changes: string[] = [];
    const improvements: string[] = [];

    if (object.description) {
      changes.push('description');
      improvements.push('Enhanced part description');
    }
    if (object.structuralRole) {
      changes.push('structuralRole');
      improvements.push('Clarified structural role');
    }
    if (object.summary) {
      changes.push('summary');
      improvements.push('Improved part summary');
    }
    if (object.keyBeats) {
      changes.push('keyBeats');
      improvements.push('Added/refined key story beats');
    }
    if (object.hnsData) {
      changes.push('hnsData');
      improvements.push('Added HNS narrative progression data');
    }

    // Validate and truncate any overly long fields in the improved data
    const sanitizedData: any = {};
    if (object.title && object.title.length > 200) {
      sanitizedData.title = object.title.substring(0, 200);
      console.log('Warning: Part title truncated from', object.title.length, 'to 200 characters');
    } else if (object.title) {
      sanitizedData.title = object.title;
    }

    // Copy other fields normally
    Object.keys(object).forEach(key => {
      if (key !== 'title') {
        sanitizedData[key] = (object as any)[key];
      }
    });

    return {
      data: sanitizedData,
      changes,
      improvements,
      rationale: `Enhanced part structure for better narrative flow`
    };
  } catch (error) {
    console.error('Part improvement error:', error);
    return { data: {}, changes: [], improvements: [], rationale: 'Unable to improve at this time' };
  }
}

async function improveChapter(
  chapter: any,
  validation?: ValidationResult,
  evaluation?: any,
  updateLevel: string = 'moderate'
): Promise<{ data: any; changes: string[]; improvements: string[]; rationale: string }> {
  try {
    const issues = [
      ...(validation?.errors.map(e => e.message) || []),
      ...(validation?.warnings.map(w => w.message) || []),
      ...(evaluation?.suggestions || [])
    ];

    // Truncate overly long fields to prevent JSON parsing issues
    const truncateString = (str: string, maxLength: number = 500) => {
      if (!str) return 'N/A';
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength) + '...';
    };

    const { object } = await generateObject({
      model: AI_MODELS.generation,
      schema: ImprovedChapterSchema,
      prompt: `Improve this chapter based on feedback:

ORIGINAL CHAPTER:
Title: ${truncateString(chapter.title, 200)}
Summary: ${truncateString(chapter.summary || 'N/A', 1000)}
Purpose: ${truncateString(chapter.purpose || 'N/A', 500)}
Hook: ${truncateString(chapter.hook || 'N/A', 500)}
Pacing Goal: ${truncateString(chapter.pacingGoal || 'N/A', 200)}
Character Focus: ${truncateString(chapter.characterFocus || 'N/A', 200)}
Current HNS Data: ${JSON.stringify(chapter.hnsData || {}).substring(0, 500)}

ISSUES TO ADDRESS:
${issues.join('\n')}

EVALUATION SCORES:
${evaluation ? `
- Hook Effectiveness: ${evaluation.hookEffectiveness}/100
- Pacing Score: ${evaluation.pacingScore}/100
- Purpose Fulfillment: ${evaluation.purposeFulfillment}/100
` : 'No evaluation available'}

Update Level: ${updateLevel}

Improve the chapter to:
1. Address all identified issues
2. Enhance hook and pacing
3. Clarify chapter purpose
4. Add comprehensive hnsData for scene development

Return ONLY the fields that need updating.`
    });

    const changes: string[] = [];
    const improvements: string[] = [];

    if (object.summary) {
      changes.push('summary');
      improvements.push('Enhanced chapter summary');
    }
    if (object.purpose) {
      changes.push('purpose');
      improvements.push('Clarified chapter purpose');
    }
    if (object.hook) {
      changes.push('hook');
      improvements.push('Strengthened chapter hook');
    }
    if (object.chapterHook) {
      changes.push('chapterHook');
      improvements.push('Added detailed hook structure');
    }
    if (object.hnsData) {
      changes.push('hnsData');
      improvements.push('Added HNS chapter progression data');
    }

    // Validate and truncate any overly long fields in the improved data
    const sanitizedData: any = {};
    if (object.title && object.title.length > 200) {
      sanitizedData.title = object.title.substring(0, 200);
      console.log('Warning: Chapter title truncated from', object.title.length, 'to 200 characters');
    } else if (object.title) {
      sanitizedData.title = object.title;
    }

    // Copy other fields normally, but check for extremely long text
    Object.keys(object).forEach(key => {
      if (key !== 'title') {
        const value = (object as any)[key];
        if (typeof value === 'string' && value.length > 10000) {
          sanitizedData[key] = value.substring(0, 10000);
          console.log(`Warning: Chapter ${key} truncated from ${value.length} to 10000 characters`);
        } else {
          sanitizedData[key] = value;
        }
      }
    });

    return {
      data: sanitizedData,
      changes,
      improvements,
      rationale: `Improved chapter structure for better reader engagement`
    };
  } catch (error) {
    console.error('Chapter improvement error:', error);
    return { data: {}, changes: [], improvements: [], rationale: 'Unable to improve at this time' };
  }
}

async function improveScene(
  scene: any,
  validation?: ValidationResult,
  evaluation?: any,
  updateLevel: string = 'moderate'
): Promise<{ data: any; changes: string[]; improvements: string[]; rationale: string }> {
  try {
    const issues = [
      ...(validation?.errors.map(e => e.message) || []),
      ...(validation?.warnings.map(w => w.message) || []),
      ...(evaluation?.suggestions || [])
    ];

    // Step 1: First improve scene metadata/structure
    const structureImprovement = await improveSceneStructure(scene, issues, evaluation, updateLevel);

    // Step 2: Check if content needs improvement
    const hasContent = scene.content && scene.content.trim().length > 0;
    const contentNeedsImprovement = hasContent && evaluation && (
      evaluation.contentQuality < 70 ||
      evaluation.proseQuality < 70 ||
      evaluation.showDontTell < 70 ||
      evaluation.dialogueNaturalness < 70
    );

    let improvedData = { ...structureImprovement.data };
    const changes = [...structureImprovement.changes];
    const improvements = [...structureImprovement.improvements];

    // Step 3: If content needs improvement and update level allows it, improve content
    if (contentNeedsImprovement && updateLevel !== 'conservative') {
      // Merge the improved structure with original scene for context
      const enhancedScene = { ...scene, ...improvedData };

      const contentImprovement = await improveSceneContent(
        enhancedScene,
        scene.content,
        evaluation,
        updateLevel
      );

      if (contentImprovement.improvedContent) {
        improvedData.content = contentImprovement.improvedContent;
        changes.push('content');
        improvements.push(contentImprovement.improvement);
      }
    }

    return {
      data: improvedData,
      changes,
      improvements,
      rationale: contentNeedsImprovement
        ? `Enhanced scene structure and improved written content for better reader engagement`
        : `Enhanced scene structure for maximum impact`
    };
  } catch (error) {
    console.error('Scene improvement error:', error);
    return { data: {}, changes: [], improvements: [], rationale: 'Unable to improve at this time' };
  }
}

// Helper function to improve scene structure/metadata only
async function improveSceneStructure(
  scene: any,
  issues: string[],
  evaluation: any,
  updateLevel: string
): Promise<{ data: any; changes: string[]; improvements: string[] }> {
  const structureSchema = z.object({
    title: z.string().optional(),
    goal: z.string().optional(),
    conflict: z.string().optional(),
    outcome: z.string().optional(),
    summary: z.string().optional(),
    entryHook: z.string().optional(),
    narrativeVoice: z.string().optional(),
    emotionalShift: z.object({
      from: z.string(),
      to: z.string()
    }).optional(),
    hnsData: z.object({
      sensory_details: z.array(z.string()).optional(),
      dialogue_goals: z.array(z.string()).optional(),
      action_beats: z.array(z.string()).optional(),
      subtext: z.string().optional(),
      scene_purpose: z.string().optional()
    }).optional()
  });

  const { object } = await generateObject({
    model: AI_MODELS.generation,
    schema: structureSchema,
    prompt: `Improve this scene's STRUCTURE AND METADATA ONLY (not the content):

ORIGINAL SCENE STRUCTURE:
Title: ${scene.title}
Goal: ${scene.goal || 'N/A'}
Conflict: ${scene.conflict || 'N/A'}
Outcome: ${scene.outcome || 'N/A'}
Summary: ${scene.summary || 'N/A'}
Entry Hook: ${scene.entryHook || 'N/A'}
Emotional Shift: ${JSON.stringify(scene.emotionalShift || {})}
Current HNS Data: ${JSON.stringify(scene.hnsData || {})}

ISSUES TO ADDRESS:
${issues.join('\n')}

EVALUATION SCORES:
${evaluation ? `
- Goal Clarity: ${evaluation.goalClarity}/100
- Conflict Tension: ${evaluation.conflictTension}/100
- Outcome Impact: ${evaluation.outcomeImpact}/100
- Emotional Resonance: ${evaluation.emotionalResonance}/100
` : 'No evaluation available'}

Update Level: ${updateLevel}

Improve the scene STRUCTURE to:
1. Address all identified structural issues
2. Enhance goal, conflict, and outcome clarity
3. Define emotional progression
4. Add comprehensive hnsData for writing guidance

DO NOT generate or modify any actual scene content/prose.
Return ONLY the structural fields that need updating.`
  });

  const changes: string[] = [];
  const improvements: string[] = [];

  if (object.goal) {
    changes.push('goal');
    improvements.push('Clarified scene goal');
  }
  if (object.conflict) {
    changes.push('conflict');
    improvements.push('Enhanced conflict tension');
  }
  if (object.outcome) {
    changes.push('outcome');
    improvements.push('Strengthened scene outcome');
  }
  if (object.emotionalShift) {
    changes.push('emotionalShift');
    improvements.push('Defined emotional progression');
  }
  if (object.hnsData) {
    changes.push('hnsData');
    improvements.push('Added HNS scene writing data');
  }

  return { data: object, changes, improvements };
}

// Helper function to improve scene content/prose only
async function improveSceneContent(
  enhancedScene: any,
  originalContent: string,
  evaluation: any,
  updateLevel: string
): Promise<{ improvedContent: string | null; improvement: string }> {
  try {
    const { text } = await generateText({
      model: AI_MODELS.generation,
      prompt: `Improve this scene's WRITTEN CONTENT based on the enhanced structure:

ENHANCED SCENE STRUCTURE (use this for guidance):
Title: ${enhancedScene.title}
Goal: ${enhancedScene.goal}
Conflict: ${enhancedScene.conflict}
Outcome: ${enhancedScene.outcome}
Entry Hook: ${enhancedScene.entryHook || 'N/A'}
Emotional Shift: ${JSON.stringify(enhancedScene.emotionalShift || {})}
HNS Data: ${JSON.stringify(enhancedScene.hnsData || {})}

ORIGINAL CONTENT (${originalContent.split(/\s+/).length} words):
${originalContent}

CONTENT EVALUATION SCORES:
- Content Quality: ${evaluation.contentQuality || 'N/A'}/100
- Show Don't Tell: ${evaluation.showDontTell || 'N/A'}/100
- Dialogue Naturalness: ${evaluation.dialogueNaturalness || 'N/A'}/100
- Prose Quality: ${evaluation.proseQuality || 'N/A'}/100

Update Level: ${updateLevel}

${updateLevel === 'aggressive' ? 'REWRITE' : 'IMPROVE'} the content to:
1. Show more, tell less - use action and sensory details
2. Make dialogue more natural and character-specific
3. Improve prose flow and sentence variety
4. Strengthen emotional impact through the enhanced structure
5. Ensure the content reflects the improved goal, conflict, and outcome

${updateLevel === 'moderate' ? 'Make targeted improvements while preserving the author\'s voice and style.' : ''}
${updateLevel === 'aggressive' ? 'Feel free to substantially rewrite for maximum impact.' : ''}

Return ONLY the improved scene content (no explanations or metadata).`
    });

    if (text && text !== originalContent) {
      return {
        improvedContent: text,
        improvement: `Improved scene prose quality (show don't tell, dialogue, flow)`
      };
    }

    return {
      improvedContent: null,
      improvement: ''
    };
  } catch (error) {
    console.error('Scene content improvement error:', error);
    return {
      improvedContent: null,
      improvement: ''
    };
  }
}

async function improveCharacter(
  character: any,
  validation?: ValidationResult,
  evaluation?: any,
  updateLevel: string = 'moderate'
): Promise<{ data: any; changes: string[]; improvements: string[]; rationale: string }> {
  try {
    const issues = [
      ...(validation?.errors.map(e => e.message) || []),
      ...(validation?.warnings.map(w => w.message) || []),
      ...(evaluation?.suggestions || [])
    ];

    const { object } = await generateObject({
      model: AI_MODELS.generation,
      schema: ImprovedCharacterSchema,
      prompt: `Improve this character based on feedback:

ORIGINAL CHARACTER:
Name: ${character.name}
Role: ${character.role || 'N/A'}
Archetype: ${character.archetype || 'N/A'}
Summary: ${character.summary || 'N/A'}
Motivations: ${JSON.stringify(character.motivations || {})}
Personality: ${JSON.stringify(character.personality || {})}
Current HNS Data: ${JSON.stringify(character.hnsData || {})}

ISSUES TO ADDRESS:
${issues.join('\n')}

EVALUATION SCORES:
${evaluation ? `
- Consistency: ${evaluation.consistency}/100
- Depth: ${evaluation.depth}/100
- Arc Development: ${evaluation.arcDevelopment}/100
- Voice Distinctiveness: ${evaluation.voiceDistinctiveness}/100
` : 'No evaluation available'}

Update Level: ${updateLevel}

Improve the character to:
1. Address all identified issues
2. Enhance depth and consistency
3. Clarify character arc
4. Add comprehensive hnsData for character development

Return ONLY the fields that need updating.`
    });

    const changes: string[] = [];
    const improvements: string[] = [];

    if (object.role) {
      changes.push('role');
      improvements.push('Clarified character role');
    }
    if (object.motivations) {
      changes.push('motivations');
      improvements.push('Enhanced character motivations');
    }
    if (object.personality) {
      changes.push('personality');
      improvements.push('Developed personality traits');
    }
    if (object.voice) {
      changes.push('voice');
      improvements.push('Defined unique voice characteristics');
    }
    if (object.hnsData) {
      changes.push('hnsData');
      improvements.push('Added HNS character development data');
    }

    return {
      data: object,
      changes,
      improvements,
      rationale: `Enhanced character depth and consistency`
    };
  } catch (error) {
    console.error('Character improvement error:', error);
    return { data: {}, changes: [], improvements: [], rationale: 'Unable to improve at this time' };
  }
}

async function improveSetting(
  setting: any,
  validation?: ValidationResult,
  evaluation?: any,
  updateLevel: string = 'moderate'
): Promise<{ data: any; changes: string[]; improvements: string[]; rationale: string }> {
  try {
    const issues = [
      ...(validation?.errors.map(e => e.message) || []),
      ...(validation?.warnings.map(w => w.message) || []),
      ...(evaluation?.suggestions || [])
    ];

    const { object } = await generateObject({
      model: AI_MODELS.generation,
      schema: ImprovedSettingSchema,
      prompt: `Improve this setting based on feedback:

ORIGINAL SETTING:
Name: ${setting.name}
Description: ${setting.description || 'N/A'}
Mood: ${setting.mood || 'N/A'}
Sensory: ${JSON.stringify(setting.sensory || {})}
Visual Style: ${setting.visualStyle || 'N/A'}
Current HNS Data: ${JSON.stringify(setting.hnsData || {})}

ISSUES TO ADDRESS:
${issues.join('\n')}

EVALUATION SCORES:
${evaluation ? `
- Atmosphere Score: ${evaluation.atmosphereScore}/100
- Sensory Detail: ${evaluation.sensoryDetail}/100
- World Building Contribution: ${evaluation.worldBuildingContribution}/100
` : 'No evaluation available'}

Update Level: ${updateLevel}

Improve the setting to:
1. Address all identified issues
2. Enhance atmosphere and sensory details
3. Strengthen world-building elements
4. Add comprehensive hnsData for scene setting

Return ONLY the fields that need updating.`
    });

    const changes: string[] = [];
    const improvements: string[] = [];

    if (object.description) {
      changes.push('description');
      improvements.push('Enhanced setting description');
    }
    if (object.mood) {
      changes.push('mood');
      improvements.push('Clarified atmospheric mood');
    }
    if (object.sensory) {
      changes.push('sensory');
      improvements.push('Added rich sensory details');
    }
    if (object.hnsData) {
      changes.push('hnsData');
      improvements.push('Added HNS setting context data');
    }

    return {
      data: object,
      changes,
      improvements,
      rationale: `Enhanced setting for immersive world-building`
    };
  } catch (error) {
    console.error('Setting improvement error:', error);
    return { data: {}, changes: [], improvements: [], rationale: 'Unable to improve at this time' };
  }
}

function generateImprovementSummary(changes: any, analysisResult: any): any {
  const totalChanges =
    changes.story.fieldsUpdated.length +
    changes.parts.reduce((sum: number, p: any) => sum + p.fieldsUpdated.length, 0) +
    changes.chapters.reduce((sum: number, c: any) => sum + c.fieldsUpdated.length, 0) +
    changes.scenes.reduce((sum: number, s: any) => sum + s.fieldsUpdated.length, 0) +
    changes.characters.reduce((sum: number, c: any) => sum + c.fieldsUpdated.length, 0) +
    changes.settings.reduce((sum: number, s: any) => sum + s.fieldsUpdated.length, 0);

  const majorImprovements: string[] = [];
  const minorAdjustments: string[] = [];
  const preservedElements: string[] = [];

  // Categorize improvements
  if (changes.story.fieldsUpdated.includes('hnsData')) {
    majorImprovements.push('Added comprehensive HNS narrative structure data');
  }
  if (changes.story.fieldsUpdated.includes('premise') || changes.story.fieldsUpdated.includes('dramaticQuestion')) {
    majorImprovements.push('Strengthened core story elements');
  }

  if (changes.characters.length > 0) {
    const characterCount = changes.characters.filter((c: any) => c.fieldsUpdated.includes('hnsData')).length;
    if (characterCount > 0) {
      majorImprovements.push(`Enhanced ${characterCount} character(s) with development arcs`);
    }
  }

  if (changes.scenes.length > 0) {
    const sceneCount = changes.scenes.filter((s: any) => s.fieldsUpdated.includes('goal') || s.fieldsUpdated.includes('conflict')).length;
    if (sceneCount > 0) {
      minorAdjustments.push(`Clarified goals and conflicts in ${sceneCount} scene(s)`);
    }
  }

  // Track what was preserved
  if (changes.story.fieldsUpdated.length === 0) {
    preservedElements.push('Core story structure');
  }

  const unchangedCharacters = (analysisResult.originalData?.characters?.length || 0) - changes.characters.length;
  if (unchangedCharacters > 0) {
    preservedElements.push(`${unchangedCharacters} character(s) unchanged`);
  }

  return {
    totalChanges,
    majorImprovements,
    minorAdjustments,
    preservedElements
  };
}