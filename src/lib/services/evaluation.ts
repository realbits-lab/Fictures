import { generateObject } from 'ai';
import { z } from 'zod';
import { AI_MODELS } from '@/lib/ai/config';

// Evaluation Score Schema
const EvaluationScoreSchema = z.object({
  score: z.number().min(0).max(100),
  category: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string())
});

const OverallEvaluationSchema = z.object({
  narrativeStructure: EvaluationScoreSchema,
  characterDevelopment: EvaluationScoreSchema,
  worldBuilding: EvaluationScoreSchema,
  pacing: EvaluationScoreSchema,
  dialogueQuality: EvaluationScoreSchema,
  themeConsistency: EvaluationScoreSchema,
  emotionalImpact: EvaluationScoreSchema,
  overallScore: z.number().min(0).max(100),
  summary: z.string(),
  keyStrengths: z.array(z.string()),
  prioritizedImprovements: z.array(z.string())
});

// Evaluation Types
export type EvaluationScore = z.infer<typeof EvaluationScoreSchema>;
export type OverallEvaluation = z.infer<typeof OverallEvaluationSchema>;

export interface StoryEvaluationResult {
  storyEvaluation: OverallEvaluation | null;
  partEvaluations: PartEvaluation[];
  chapterEvaluations: ChapterEvaluation[];
  sceneEvaluations: SceneEvaluation[];
  characterEvaluations: CharacterEvaluation[];
  settingEvaluations: SettingEvaluation[];
  crossReferenceAnalysis: CrossReferenceAnalysis;
}

export interface PartEvaluation {
  partId: string;
  title: string;
  structuralEffectiveness: number;
  contributionToStory: number;
  suggestions: string[];
}

export interface ChapterEvaluation {
  chapterId: string;
  title: string;
  hookEffectiveness: number;
  pacingScore: number;
  purposeFulfillment: number;
  suggestions: string[];
}

export interface SceneEvaluation {
  sceneId: string;
  title: string;
  goalClarity: number;
  conflictTension: number;
  outcomeImpact: number;
  emotionalResonance: number;
  contentQuality?: number;
  showDontTell?: number;
  dialogueNaturalness?: number;
  proseQuality?: number;
  suggestions: string[];
}

export interface CharacterEvaluation {
  characterId: string;
  name: string;
  consistency: number;
  depth: number;
  arcDevelopment: number;
  voiceDistinctiveness: number;
  suggestions: string[];
}

export interface SettingEvaluation {
  settingId: string;
  name: string;
  atmosphereScore: number;
  sensoryDetail: number;
  worldBuildingContribution: number;
  suggestions: string[];
}

export interface CrossReferenceAnalysis {
  plotHoles: string[];
  inconsistencies: string[];
  timelineIssues: string[];
  characterInconsistencies: string[];
  unresolvedThreads: string[];
  suggestions: string[];
}

// AI-Powered Content Evaluation
export async function evaluateStoryContent(storyData: {
  story: any;
  parts?: any[];
  chapters?: any[];
  scenes?: any[];
  characters?: any[];
  settings?: any[];
}): Promise<StoryEvaluationResult> {
  try {
    // Prepare story summary for AI evaluation
    const storySummary = prepareStorySummary(storyData);

    // Evaluate overall story
    const storyEvaluation = await evaluateOverallStory(storySummary);

    // Evaluate individual components
    const partEvaluations = await Promise.all(
      (storyData.parts || []).map(part => evaluatePart(part, storySummary))
    );

    const chapterEvaluations = await Promise.all(
      (storyData.chapters || []).map(chapter => evaluateChapter(chapter, storySummary))
    );

    const sceneEvaluations = await Promise.all(
      (storyData.scenes || []).map(scene => evaluateScene(scene))
    );

    const characterEvaluations = await Promise.all(
      (storyData.characters || []).map(character => evaluateCharacter(character, storySummary))
    );

    const settingEvaluations = await Promise.all(
      (storyData.settings || []).map(setting => evaluateSetting(setting))
    );

    // Cross-reference analysis
    const crossReferenceAnalysis = await analyzeCrossReferences(storyData);

    return {
      storyEvaluation,
      partEvaluations,
      chapterEvaluations,
      sceneEvaluations,
      characterEvaluations,
      settingEvaluations,
      crossReferenceAnalysis
    };
  } catch (error) {
    console.error('Evaluation error:', error);
    return {
      storyEvaluation: null,
      partEvaluations: [],
      chapterEvaluations: [],
      sceneEvaluations: [],
      characterEvaluations: [],
      settingEvaluations: [],
      crossReferenceAnalysis: {
        plotHoles: [],
        inconsistencies: [],
        timelineIssues: [],
        characterInconsistencies: [],
        unresolvedThreads: [],
        suggestions: []
      }
    };
  }
}

async function evaluateOverallStory(storySummary: string): Promise<OverallEvaluation | null> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.analysis,
      schema: OverallEvaluationSchema,
      prompt: `Evaluate the following story structure and provide detailed feedback:

${storySummary}

Analyze the following aspects:
1. Narrative Structure - How well the story flows and progresses
2. Character Development - Depth and growth of characters
3. World Building - Richness and consistency of the story world
4. Pacing - Balance of action, dialogue, and description
5. Dialogue Quality - Natural and character-appropriate dialogue
6. Theme Consistency - How well themes are developed and maintained
7. Emotional Impact - Ability to engage readers emotionally

Provide specific strengths, weaknesses, and actionable suggestions for each category.
Score each category from 0-100.`
    });

    return object;
  } catch (error) {
    console.error('Story evaluation error:', error);
    return null;
  }
}

async function evaluatePart(part: any, storySummary: string): Promise<PartEvaluation> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.analysis,
      schema: z.object({
        structuralEffectiveness: z.number().min(0).max(100),
        contributionToStory: z.number().min(0).max(100),
        suggestions: z.array(z.string())
      }),
      prompt: `Evaluate this story part in context of the overall story:

Part Title: ${part.title}
Description: ${part.description || 'N/A'}
Structural Role: ${part.structuralRole || 'N/A'}
Summary: ${part.summary || 'N/A'}
Key Beats: ${JSON.stringify(part.keyBeats || [])}

Story Context: ${storySummary}

Rate:
1. Structural Effectiveness (0-100): How well does this part serve its structural role?
2. Contribution to Story (0-100): How essential is this part to the overall narrative?

Provide specific suggestions for improvement.`
    });

    return {
      partId: part.id,
      title: part.title,
      ...object
    };
  } catch (error) {
    console.error('Part evaluation error:', error);
    return {
      partId: part.id,
      title: part.title,
      structuralEffectiveness: 50,
      contributionToStory: 50,
      suggestions: ['Unable to evaluate at this time']
    };
  }
}

async function evaluateChapter(chapter: any, storySummary: string): Promise<ChapterEvaluation> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.analysis,
      schema: z.object({
        hookEffectiveness: z.number().min(0).max(100),
        pacingScore: z.number().min(0).max(100),
        purposeFulfillment: z.number().min(0).max(100),
        suggestions: z.array(z.string())
      }),
      prompt: `Evaluate this chapter:

Chapter Title: ${chapter.title}
Summary: ${chapter.summary || 'N/A'}
Purpose: ${chapter.purpose || 'N/A'}
Hook: ${chapter.hook || 'N/A'}
Pacing Goal: ${chapter.pacingGoal || 'N/A'}
Character Focus: ${chapter.characterFocus || 'N/A'}

Rate:
1. Hook Effectiveness (0-100): How engaging is the chapter opening?
2. Pacing Score (0-100): How well does the chapter maintain momentum?
3. Purpose Fulfillment (0-100): How well does it achieve its stated purpose?

Provide specific improvement suggestions.`
    });

    return {
      chapterId: chapter.id,
      title: chapter.title,
      ...object
    };
  } catch (error) {
    console.error('Chapter evaluation error:', error);
    return {
      chapterId: chapter.id,
      title: chapter.title,
      hookEffectiveness: 50,
      pacingScore: 50,
      purposeFulfillment: 50,
      suggestions: ['Unable to evaluate at this time']
    };
  }
}

async function evaluateScene(scene: any): Promise<SceneEvaluation> {
  try {
    // Check if we have actual scene content to evaluate
    const hasContent = scene.content && scene.content.trim().length > 0;

    if (hasContent) {
      // Evaluate the actual written content
      const { object } = await generateObject({
        model: AI_MODELS.analysis,
        schema: z.object({
          goalClarity: z.number().min(0).max(100),
          conflictTension: z.number().min(0).max(100),
          outcomeImpact: z.number().min(0).max(100),
          emotionalResonance: z.number().min(0).max(100),
          contentQuality: z.number().min(0).max(100),
          showDontTell: z.number().min(0).max(100),
          dialogueNaturalness: z.number().min(0).max(100),
          proseQuality: z.number().min(0).max(100),
          suggestions: z.array(z.string())
        }),
        prompt: `Evaluate this scene's written content and structure:

Scene Title: ${scene.title}

SCENE METADATA:
Goal: ${scene.goal || 'N/A'}
Conflict: ${scene.conflict || 'N/A'}
Outcome: ${scene.outcome || 'N/A'}
POV Character: ${scene.povCharacterId || 'N/A'}
Setting: ${scene.settingId || 'N/A'}
Entry Hook: ${scene.entryHook || 'N/A'}
Emotional Shift: ${JSON.stringify(scene.emotionalShift || {})}

ACTUAL SCENE CONTENT:
${scene.content.substring(0, 3000)}${scene.content.length > 3000 ? '...[truncated]' : ''}

Evaluate both the structure AND the written content:
1. Goal Clarity (0-100): Is the scene's purpose clear in the actual writing?
2. Conflict Tension (0-100): How well is conflict portrayed in the text?
3. Outcome Impact (0-100): Does the resolution feel earned?
4. Emotional Resonance (0-100): Does the writing evoke appropriate emotions?
5. Content Quality (0-100): Overall quality of the written prose
6. Show Don't Tell (0-100): Does it show rather than tell?
7. Dialogue Naturalness (0-100): How natural and character-appropriate is dialogue?
8. Prose Quality (0-100): Sentence variety, flow, and readability

Provide specific suggestions based on the actual written content.`
      });

      return {
        sceneId: scene.id,
        title: scene.title,
        goalClarity: object.goalClarity,
        conflictTension: object.conflictTension,
        outcomeImpact: object.outcomeImpact,
        emotionalResonance: object.emotionalResonance,
        contentQuality: object.contentQuality,
        showDontTell: object.showDontTell,
        dialogueNaturalness: object.dialogueNaturalness,
        proseQuality: object.proseQuality,
        suggestions: object.suggestions
      };
    } else {
      // Evaluate only the structure/metadata when no content exists
      const { object } = await generateObject({
        model: AI_MODELS.analysis,
        schema: z.object({
          goalClarity: z.number().min(0).max(100),
          conflictTension: z.number().min(0).max(100),
          outcomeImpact: z.number().min(0).max(100),
          emotionalResonance: z.number().min(0).max(100),
          suggestions: z.array(z.string())
        }),
        prompt: `Evaluate this scene structure (no content written yet):

Scene Title: ${scene.title}
Goal: ${scene.goal || 'N/A'}
Conflict: ${scene.conflict || 'N/A'}
Outcome: ${scene.outcome || 'N/A'}
Summary: ${scene.summary || 'N/A'}
Entry Hook: ${scene.entryHook || 'N/A'}
Emotional Shift: ${JSON.stringify(scene.emotionalShift || {})}

Rate the PLANNED structure:
1. Goal Clarity (0-100): Is the scene's purpose clear?
2. Conflict Tension (0-100): How engaging is the planned conflict?
3. Outcome Impact (0-100): Will the outcome matter to the story?
4. Emotional Resonance (0-100): Potential for emotional impact?

Provide suggestions for when writing begins.`
      });

      return {
        sceneId: scene.id,
        title: scene.title,
        ...object
      };
    }
  } catch (error) {
    console.error('Scene evaluation error:', error);
    return {
      sceneId: scene.id,
      title: scene.title,
      goalClarity: 50,
      conflictTension: 50,
      outcomeImpact: 50,
      emotionalResonance: 50,
      suggestions: ['Unable to evaluate at this time']
    };
  }
}

async function evaluateCharacter(character: any, storySummary: string): Promise<CharacterEvaluation> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.analysis,
      schema: z.object({
        consistency: z.number().min(0).max(100),
        depth: z.number().min(0).max(100),
        arcDevelopment: z.number().min(0).max(100),
        voiceDistinctiveness: z.number().min(0).max(100),
        suggestions: z.array(z.string())
      }),
      prompt: `Evaluate this character:

Character Name: ${character.name}
Role: ${character.role || 'N/A'}
Archetype: ${character.archetype || 'N/A'}
Summary: ${character.summary || 'N/A'}
Storyline: ${character.storyline || 'N/A'}
Personality: ${JSON.stringify(character.personality || {})}
Motivations: ${JSON.stringify(character.motivations || {})}

Story Context: ${storySummary}

Rate:
1. Consistency (0-100): How consistent is the character throughout?
2. Depth (0-100): How well-developed and multi-dimensional?
3. Arc Development (0-100): How compelling is their journey?
4. Voice Distinctiveness (0-100): How unique is their voice?

Provide specific suggestions.`
    });

    return {
      characterId: character.id,
      name: character.name,
      ...object
    };
  } catch (error) {
    console.error('Character evaluation error:', error);
    return {
      characterId: character.id,
      name: character.name,
      consistency: 50,
      depth: 50,
      arcDevelopment: 50,
      voiceDistinctiveness: 50,
      suggestions: ['Unable to evaluate at this time']
    };
  }
}

async function evaluateSetting(setting: any): Promise<SettingEvaluation> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.analysis,
      schema: z.object({
        atmosphereScore: z.number().min(0).max(100),
        sensoryDetail: z.number().min(0).max(100),
        worldBuildingContribution: z.number().min(0).max(100),
        suggestions: z.array(z.string())
      }),
      prompt: `Evaluate this setting:

Setting Name: ${setting.name}
Description: ${setting.description || 'N/A'}
Mood: ${setting.mood || 'N/A'}
Sensory Details: ${JSON.stringify(setting.sensory || {})}
Visual Style: ${setting.visualStyle || 'N/A'}
Architectural Style: ${setting.architecturalStyle || 'N/A'}

Rate:
1. Atmosphere Score (0-100): How well does it create atmosphere?
2. Sensory Detail (0-100): How rich are the sensory descriptions?
3. World Building Contribution (0-100): How much does it enhance the world?

Provide specific suggestions.`
    });

    return {
      settingId: setting.id,
      name: setting.name,
      ...object
    };
  } catch (error) {
    console.error('Setting evaluation error:', error);
    return {
      settingId: setting.id,
      name: setting.name,
      atmosphereScore: 50,
      sensoryDetail: 50,
      worldBuildingContribution: 50,
      suggestions: ['Unable to evaluate at this time']
    };
  }
}

async function analyzeCrossReferences(storyData: any): Promise<CrossReferenceAnalysis> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.analysis,
      schema: z.object({
        plotHoles: z.array(z.string()),
        inconsistencies: z.array(z.string()),
        timelineIssues: z.array(z.string()),
        characterInconsistencies: z.array(z.string()),
        unresolvedThreads: z.array(z.string()),
        suggestions: z.array(z.string())
      }),
      prompt: `Analyze this story structure for cross-reference issues:

Story: ${JSON.stringify({
  title: storyData.story?.title,
  premise: storyData.story?.premise,
  dramaticQuestion: storyData.story?.dramaticQuestion
})}

Parts: ${JSON.stringify(storyData.parts?.map((p: any) => ({
  title: p.title,
  summary: p.summary
})) || [])}

Chapters: ${JSON.stringify(storyData.chapters?.map((c: any) => ({
  title: c.title,
  summary: c.summary,
  purpose: c.purpose
})) || [])}

Characters: ${JSON.stringify(storyData.characters?.map((c: any) => ({
  name: c.name,
  role: c.role,
  storyline: c.storyline
})) || [])}

Identify:
1. Plot holes or logical gaps
2. Inconsistencies between different parts
3. Timeline issues
4. Character behavior inconsistencies
5. Unresolved story threads
6. Suggestions for fixing these issues`
    });

    return {
      plotHoles: object.plotHoles,
      inconsistencies: object.inconsistencies,
      timelineIssues: object.timelineIssues,
      characterInconsistencies: object.characterInconsistencies,
      unresolvedThreads: object.unresolvedThreads,
      suggestions: object.suggestions
    };
  } catch (error) {
    console.error('Cross-reference analysis error:', error);
    return {
      plotHoles: [],
      inconsistencies: [],
      timelineIssues: [],
      characterInconsistencies: [],
      unresolvedThreads: [],
      suggestions: []
    };
  }
}

function prepareStorySummary(storyData: any): string {
  const story = storyData.story || {};
  const parts = storyData.parts || [];
  const characters = storyData.characters || [];

  return `
Title: ${story.title || 'Untitled'}
Genre: ${story.genre || 'N/A'}
Premise: ${story.premise || 'N/A'}
Dramatic Question: ${story.dramaticQuestion || 'N/A'}
Theme: ${story.theme || 'N/A'}

Parts: ${parts.map((p: any) => p.title).join(', ')}
Main Characters: ${characters.filter((c: any) => c.isMain).map((c: any) => c.name).join(', ')}
Total Chapters: ${storyData.chapters?.length || 0}
Total Scenes: ${storyData.scenes?.length || 0}
  `.trim();
}

// Quick evaluation for real-time feedback
export async function quickEvaluate(type: string, content: any): Promise<{
  score: number;
  feedback: string;
  suggestions: string[];
}> {
  try {
    const prompts: { [key: string]: string } = {
      scene: `Quick evaluation of scene: ${content.title}. Goal: ${content.goal}, Conflict: ${content.conflict}`,
      chapter: `Quick evaluation of chapter: ${content.title}. Purpose: ${content.purpose}, Hook: ${content.hook}`,
      character: `Quick evaluation of character: ${content.name}. Role: ${content.role}, Archetype: ${content.archetype}`
    };

    const { object } = await generateObject({
      model: AI_MODELS.analysis,
      schema: z.object({
        score: z.number().min(0).max(100),
        feedback: z.string(),
        suggestions: z.array(z.string()).max(3)
      }),
      prompt: `${prompts[type] || 'Quick evaluation of content'}

Provide:
1. A quality score (0-100)
2. One-line feedback
3. Up to 3 quick suggestions`
    });

    return object;
  } catch (error) {
    console.error('Quick evaluation error:', error);
    return {
      score: 50,
      feedback: 'Unable to evaluate at this time',
      suggestions: []
    };
  }
}