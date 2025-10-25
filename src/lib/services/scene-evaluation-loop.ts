/**
 * Scene Evaluation Loop Service
 *
 * Implements iterative scene evaluation and improvement:
 * 1. Apply rule-based formatting (deterministic fixes)
 * 2. Evaluate scene with qualitative AI evaluation
 * 3. Check if scene meets quality threshold
 * 4. Improve scene based on evaluation feedback
 * 5. Repeat until passing or max iterations reached
 */

import { db } from '@/lib/db';
import { scenes as scenesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { gateway } from '@ai-sdk/gateway';
import { generateObject } from 'ai';
import {
  evaluationResultSchema,
  type EvaluationResult,
  type EvaluationContext
} from '@/lib/evaluation/schemas';
import { buildEvaluationPrompt } from '@/lib/evaluation/prompts';
import { formatSceneContent, type FormatResult } from '@/lib/services/scene-formatter';

export interface SceneEvaluationLoopOptions {
  maxIterations?: number;        // Default: 3
  passingScore?: number;         // Default: 3.0 (Effective on 1-4 scale)
  improvementLevel?: 'conservative' | 'moderate' | 'aggressive'; // Default: 'moderate'
  storyContext?: {
    storyGenre?: string;
    arcPosition?: 'beginning' | 'middle' | 'end';
    chapterNumber?: number;
    previousSceneSummary?: string;
    characterContext?: string[];
  };
}

export interface SceneEvaluationLoopResult {
  scene: any;
  evaluations: Array<{
    evaluation: EvaluationResult;
    categoryScores: {
      plot: number;
      character: number;
      pacing: number;
      prose: number;
      worldBuilding: number;
    };
    overallScore: number;
  }>;
  iterations: number;
  finalScore: number;
  passed: boolean;
  improvements: string[];
  formattingStats: {
    totalChanges: number;
    paragraphsSplit: number;
    spacingFixed: number;
  };
}

/**
 * Helper function to calculate category score from individual metrics
 */
function calculateCategoryScore(scores: number[]): number {
  return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2));
}

/**
 * Evaluate a scene using AI
 */
async function evaluateSceneContent(
  content: string,
  context?: EvaluationContext
): Promise<{
  evaluation: EvaluationResult;
  categoryScores: {
    plot: number;
    character: number;
    pacing: number;
    prose: number;
    worldBuilding: number;
  };
  overallScore: number;
}> {
  // Build evaluation prompt
  const prompt = buildEvaluationPrompt(content, context);

  // Generate evaluation using AI
  const result = await generateObject({
    model: gateway('openai/gpt-4o-mini'),
    schema: evaluationResultSchema,
    prompt: prompt,
    temperature: 0.3,
  });

  const evaluation = result.object as EvaluationResult;

  // Calculate category scores
  const categoryScores = {
    plot: calculateCategoryScore([
      evaluation.metrics.plot.hookEffectiveness.score,
      evaluation.metrics.plot.goalClarity.score,
      evaluation.metrics.plot.conflictEngagement.score,
      evaluation.metrics.plot.cliffhangerTransition.score,
    ]),
    character: calculateCategoryScore([
      evaluation.metrics.character.agency.score,
      evaluation.metrics.character.voiceDistinction.score,
      evaluation.metrics.character.emotionalDepth.score,
      evaluation.metrics.character.relationshipDynamics.score,
    ]),
    pacing: calculateCategoryScore([
      evaluation.metrics.pacing.microPacing.score,
      evaluation.metrics.pacing.tensionManagement.score,
      evaluation.metrics.pacing.sceneEconomy.score,
    ]),
    prose: calculateCategoryScore([
      evaluation.metrics.prose.clarity.score,
      evaluation.metrics.prose.showDontTell.score,
      evaluation.metrics.prose.voiceConsistency.score,
      evaluation.metrics.prose.technicalQuality.score,
    ]),
    worldBuilding: calculateCategoryScore([
      evaluation.metrics.worldBuilding.integration.score,
      evaluation.metrics.worldBuilding.consistency.score,
      evaluation.metrics.worldBuilding.mysteryGeneration.score,
    ]),
  };

  // Calculate overall score
  const overallScore = Number((
    (categoryScores.plot +
     categoryScores.character +
     categoryScores.pacing +
     categoryScores.prose +
     categoryScores.worldBuilding) / 5
  ).toFixed(2));

  return { evaluation, categoryScores, overallScore };
}

/**
 * Evaluate and iteratively improve a scene until it passes quality threshold
 *
 * @param sceneId - ID of the scene to evaluate and improve
 * @param content - Scene content to evaluate
 * @param options - Evaluation loop configuration
 * @returns Result with final scene, evaluation history, and improvements made
 */
export async function evaluateAndImproveScene(
  sceneId: string,
  content: string,
  options: SceneEvaluationLoopOptions = {}
): Promise<SceneEvaluationLoopResult> {
  const {
    maxIterations = 3,
    passingScore = 3.0,
    improvementLevel = 'moderate',
    storyContext = {}
  } = options;

  console.log(`\n🔄 ============= SCENE EVALUATION LOOP START =============`);
  console.log(`   Scene ID: ${sceneId}`);
  console.log(`   Max Iterations: ${maxIterations}`);
  console.log(`   Passing Score: ${passingScore}/4.0`);
  console.log(`   Improvement Level: ${improvementLevel}`);

  // Fetch scene from database
  const sceneRecords = await db.select().from(scenesTable).where(eq(scenesTable.id, sceneId));

  if (sceneRecords.length === 0) {
    throw new Error(`Scene not found: ${sceneId}`);
  }

  let currentScene = sceneRecords[0];
  let currentContent = content;
  const evaluations: Array<{
    evaluation: EvaluationResult;
    categoryScores: any;
    overallScore: number;
  }> = [];
  const improvements: string[] = [];
  let iteration = 0;
  let totalFormattingChanges = 0;
  let totalParagraphsSplit = 0;
  let totalSpacingFixed = 0;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n--- Iteration ${iteration}/${maxIterations} ---`);

    // Step 0: Apply rule-based formatting BEFORE evaluation
    console.log(`📝 Applying rule-based formatting...`);
    const formatStartTime = Date.now();

    const formatResult = formatSceneContent(currentContent);

    if (formatResult.changes.length > 0) {
      console.log(`✓ Formatting applied in ${Date.now() - formatStartTime}ms`);
      console.log(`   Changes: ${formatResult.changes.length}`);
      console.log(`   Paragraphs split: ${formatResult.stats.sentencesSplit}`);
      console.log(`   Spacing fixed: ${formatResult.stats.spacingFixed}`);

      // Update content with formatted version
      currentContent = formatResult.formatted;
      totalFormattingChanges += formatResult.changes.length;
      totalParagraphsSplit += formatResult.stats.sentencesSplit;
      totalSpacingFixed += formatResult.stats.spacingFixed;

      // Update database with formatted content
      await db.update(scenesTable)
        .set({ content: formatResult.formatted })
        .where(eq(scenesTable.id, sceneId));

      // Log specific changes
      formatResult.changes.forEach(change => {
        console.log(`     - ${change.type}: ${change.description}`);
      });
    } else {
      console.log(`✓ No formatting changes needed (${Date.now() - formatStartTime}ms)`);
    }

    // Step 1: Evaluate the scene
    console.log(`📊 Evaluating scene "${currentScene.title}"...`);
    const startTime = Date.now();

    const evaluationResult = await evaluateSceneContent(currentContent, storyContext);

    evaluations.push(evaluationResult);
    const evalTime = Date.now() - startTime;
    console.log(`✓ Evaluation complete in ${evalTime}ms`);
    console.log(`   Overall Score: ${evaluationResult.overallScore}/4.0`);
    console.log(`   Category Scores:`);
    console.log(`     - Plot: ${evaluationResult.categoryScores.plot}/4.0`);
    console.log(`     - Character: ${evaluationResult.categoryScores.character}/4.0`);
    console.log(`     - Pacing: ${evaluationResult.categoryScores.pacing}/4.0`);
    console.log(`     - Prose: ${evaluationResult.categoryScores.prose}/4.0`);
    console.log(`     - World Building: ${evaluationResult.categoryScores.worldBuilding}/4.0`);

    // Step 2: Check if scene passes
    const passed = evaluationResult.overallScore >= passingScore;

    if (passed) {
      console.log(`✅ Scene "${currentScene.title}" PASSED evaluation!`);
      console.log(`   Score: ${evaluationResult.overallScore} >= ${passingScore}`);
      break;
    }

    // Step 3: Identify areas for improvement
    console.log(`⚠️ Scene needs improvement (score: ${evaluationResult.overallScore} < ${passingScore})`);
    console.log(`   Key improvements needed:`);
    evaluationResult.evaluation.actionableFeedback
      .filter(f => f.priority === 'high')
      .forEach(feedback => {
        console.log(`     - ${feedback.category}: ${feedback.diagnosis}`);
      });

    // If this is the last iteration, don't improve - just use current version
    if (iteration === maxIterations) {
      console.log(`⏹️ Reached max iterations (${maxIterations})`);
      console.log(`   Using current version even though it didn't pass`);
      break;
    }

    // Step 4: Improve scene based on evaluation feedback
    console.log(`🔧 Improving scene based on evaluation feedback...`);
    const improveStartTime = Date.now();

    const improved = await improveSceneWithEvaluation(
      currentScene,
      currentContent,
      evaluationResult,
      improvementLevel
    );

    const improveTime = Date.now() - improveStartTime;
    console.log(`✓ Scene improved in ${improveTime}ms`);
    console.log(`   Changes: ${improved.changes.join(', ')}`);

    // Update scene in database
    if (improved.content) {
      await db.update(scenesTable)
        .set({
          content: improved.content,
          goal: improved.goal || currentScene.goal,
          conflict: improved.conflict || currentScene.conflict,
          outcome: improved.outcome || currentScene.outcome,
          summary: improved.summary || currentScene.summary,
        })
        .where(eq(scenesTable.id, sceneId));

      currentContent = improved.content;
      improvements.push(...improved.changes);

      // Refresh scene data
      const updated = await db.select().from(scenesTable).where(eq(scenesTable.id, sceneId));
      currentScene = updated[0];
    }
  }

  const finalEvaluation = evaluations[evaluations.length - 1];
  const result: SceneEvaluationLoopResult = {
    scene: currentScene,
    evaluations,
    iterations: iteration,
    finalScore: finalEvaluation.overallScore,
    passed: finalEvaluation.overallScore >= passingScore,
    improvements,
    formattingStats: {
      totalChanges: totalFormattingChanges,
      paragraphsSplit: totalParagraphsSplit,
      spacingFixed: totalSpacingFixed,
    }
  };

  console.log(`\n🎯 ============= SCENE EVALUATION LOOP COMPLETE =============`);
  console.log(`   Total Iterations: ${iteration}`);
  console.log(`   Final Score: ${result.finalScore}/4.0`);
  console.log(`   Status: ${result.passed ? 'PASSED ✅' : 'DID NOT PASS ⚠️'}`);
  console.log(`   Improvements Made: ${improvements.length}`);
  if (improvements.length > 0) {
    console.log(`   Changes: ${improvements.join(', ')}`);
  }
  console.log(`   Formatting Applied:`);
  console.log(`     - Total formatting changes: ${totalFormattingChanges}`);
  console.log(`     - Paragraphs split: ${totalParagraphsSplit}`);
  console.log(`     - Spacing fixes: ${totalSpacingFixed}`);

  return result;
}

/**
 * Improve scene based on evaluation feedback
 */
async function improveSceneWithEvaluation(
  scene: any,
  content: string,
  evaluationResult: {
    evaluation: EvaluationResult;
    categoryScores: any;
    overallScore: number;
  },
  improvementLevel: 'conservative' | 'moderate' | 'aggressive'
): Promise<{
  content: string;
  goal?: string;
  conflict?: string;
  outcome?: string;
  summary?: string;
  changes: string[];
}> {
  const { generateText } = await import('ai');
  const { AI_MODELS } = await import('@/lib/ai/config');

  const { evaluation, categoryScores, overallScore } = evaluationResult;

  // Collect high-priority feedback
  const highPriorityFeedback = evaluation.actionableFeedback
    .filter(f => f.priority === 'high')
    .map(f => `${f.category}: ${f.diagnosis} → ${f.suggestion}`)
    .join('\n');

  const mediumPriorityFeedback = evaluation.actionableFeedback
    .filter(f => f.priority === 'medium')
    .map(f => `${f.category}: ${f.diagnosis} → ${f.suggestion}`)
    .join('\n');

  // Get category-specific improvements
  const plotImprovements = evaluation.analysis.plot.improvements
    .map(i => `${i.point}: ${i.evidence}`)
    .join('\n');

  const characterImprovements = evaluation.analysis.character.improvements
    .map(i => `${i.point}: ${i.evidence}`)
    .join('\n');

  const pacingImprovements = evaluation.analysis.pacing.improvements
    .map(i => `${i.point}: ${i.evidence}`)
    .join('\n');

  const proseImprovements = evaluation.analysis.prose.improvements
    .map(i => `${i.point}: ${i.evidence}`)
    .join('\n');

  const { text } = await generateText({
    model: AI_MODELS.generation,
    prompt: `You are an expert fiction editor. Improve this scene based on detailed evaluation feedback.

CURRENT SCENE:
Title: ${scene.title}
Goal: ${scene.goal || 'Not specified'}
Conflict: ${scene.conflict || 'Not specified'}
Outcome: ${scene.outcome || 'Not specified'}

Content (${content.split(/\s+/).length} words):
${content}

EVALUATION SCORES:
- Overall: ${overallScore}/4.0
- Plot: ${categoryScores.plot}/4.0
- Character: ${categoryScores.character}/4.0
- Pacing: ${categoryScores.pacing}/4.0
- Prose: ${categoryScores.prose}/4.0
- World Building: ${categoryScores.worldBuilding}/4.0

HIGH PRIORITY IMPROVEMENTS:
${highPriorityFeedback || 'None'}

MEDIUM PRIORITY IMPROVEMENTS:
${mediumPriorityFeedback || 'None'}

SPECIFIC CATEGORY FEEDBACK:

PLOT:
${plotImprovements || 'No issues'}

CHARACTER:
${characterImprovements || 'No issues'}

PACING:
${pacingImprovements || 'No issues'}

PROSE:
${proseImprovements || 'No issues'}

KEY STRENGTHS TO PRESERVE:
${evaluation.summary.keyStrengths.join('\n')}

IMPROVEMENT LEVEL: ${improvementLevel}

${improvementLevel === 'conservative' ? 'Make minimal targeted fixes while preserving the author\'s voice and style.' : ''}
${improvementLevel === 'moderate' ? 'Make meaningful improvements while maintaining the core narrative and author voice.' : ''}
${improvementLevel === 'aggressive' ? 'Feel free to substantially rewrite for maximum quality and reader engagement.' : ''}

INSTRUCTIONS:
1. Address all HIGH priority feedback first
2. Improve weak category scores (below 3.0)
3. Preserve identified strengths
4. Maintain scene goal, conflict, and outcome
5. Show more, tell less - use sensory details and action
6. Ensure dialogue is natural and character-specific
7. Improve sentence variety and flow

Return ONLY the improved scene content. Do not include any explanations or metadata.`,
    temperature: 0.8,
  });

  const changes: string[] = [];

  // Identify what changed
  if (text !== content) {
    changes.push('content');
  }

  // Extract structural improvements from feedback if needed
  const structuralChanges: any = {};

  // Check if goal clarity was an issue
  if (evaluation.metrics.plot.goalClarity.score < 3.0 && scene.goal) {
    // Goal needs clarification - this would need additional AI call
    changes.push('goal');
  }

  // Check if conflict needed work
  if (evaluation.metrics.plot.conflictEngagement.score < 3.0 && scene.conflict) {
    changes.push('conflict');
  }

  return {
    content: text,
    ...structuralChanges,
    changes
  };
}

/**
 * Batch evaluate and improve multiple scenes
 */
export async function evaluateAndImproveScenes(
  scenes: Array<{ id: string; content: string }>,
  options: SceneEvaluationLoopOptions = {}
): Promise<SceneEvaluationLoopResult[]> {
  const results: SceneEvaluationLoopResult[] = [];

  console.log(`\n🔄 ============= BATCH SCENE EVALUATION START =============`);
  console.log(`   Total Scenes: ${scenes.length}`);

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    console.log(`\n📖 Processing scene ${i + 1}/${scenes.length}`);

    const result = await evaluateAndImproveScene(
      scene.id,
      scene.content,
      {
        ...options,
        storyContext: {
          ...options.storyContext,
          chapterNumber: i + 1,
        }
      }
    );

    results.push(result);

    // Small delay between scenes to avoid rate limiting
    if (i < scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n🎯 ============= BATCH SCENE EVALUATION COMPLETE =============`);
  console.log(`   Total Scenes: ${scenes.length}`);
  console.log(`   Passed: ${results.filter(r => r.passed).length}`);
  console.log(`   Failed: ${results.filter(r => !r.passed).length}`);
  console.log(`   Average Score: ${(results.reduce((sum, r) => sum + r.finalScore, 0) / results.length).toFixed(2)}/4.0`);
  console.log(`   Total Iterations: ${results.reduce((sum, r) => sum + r.iterations, 0)}`);

  return results;
}
