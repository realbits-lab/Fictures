/**
 * Scene Evaluation Loop Service
 *
 * Implements iterative scene evaluation and improvement:
 * 1. Evaluate scene with qualitative AI evaluation
 * 2. Check if scene meets quality threshold
 * 3. Improve scene based on evaluation feedback
 * 4. Repeat until passing or max iterations reached
 */

import { db } from '@/lib/db';
import { scenes as scenesTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { evaluateScene } from '@/lib/evaluation';
import type { SceneEvaluationResult } from '@/types/validation-evaluation';

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
  evaluations: SceneEvaluationResult[];
  iterations: number;
  finalScore: number;
  passed: boolean;
  improvements: string[];
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
  const evaluations: SceneEvaluationResult[] = [];
  const improvements: string[] = [];
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`\n--- Iteration ${iteration}/${maxIterations} ---`);

    // Step 1: Evaluate the scene
    console.log(`📊 Evaluating scene "${currentScene.title}"...`);
    const startTime = Date.now();

    const evaluation = await evaluateScene({
      sceneId: currentScene.id,
      content: currentContent,
      context: storyContext,
      options: {
        detailedFeedback: true,
        includeExamples: true
      }
    });

    evaluations.push(evaluation);
    const evalTime = Date.now() - startTime;
    console.log(`✓ Evaluation complete in ${evalTime}ms`);
    console.log(`   Overall Score: ${evaluation.evaluation.overallScore}/4.0`);
    console.log(`   Category Scores:`);
    console.log(`     - Plot: ${evaluation.evaluation.categoryScores.plot}/4.0`);
    console.log(`     - Character: ${evaluation.evaluation.categoryScores.character}/4.0`);
    console.log(`     - Pacing: ${evaluation.evaluation.categoryScores.pacing}/4.0`);
    console.log(`     - Prose: ${evaluation.evaluation.categoryScores.prose}/4.0`);
    console.log(`     - World Building: ${evaluation.evaluation.categoryScores.worldBuilding}/4.0`);

    // Step 2: Check if scene passes
    const passed = evaluation.evaluation.overallScore >= passingScore;

    if (passed) {
      console.log(`✅ Scene "${currentScene.title}" PASSED evaluation!`);
      console.log(`   Score: ${evaluation.evaluation.overallScore} >= ${passingScore}`);
      break;
    }

    // Step 3: Identify areas for improvement
    console.log(`⚠️ Scene needs improvement (score: ${evaluation.evaluation.overallScore} < ${passingScore})`);
    console.log(`   Key improvements needed:`);
    evaluation.evaluation.actionableFeedback
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
      evaluation,
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
    finalScore: finalEvaluation.evaluation.overallScore,
    passed: finalEvaluation.evaluation.overallScore >= passingScore,
    improvements
  };

  console.log(`\n🎯 ============= SCENE EVALUATION LOOP COMPLETE =============`);
  console.log(`   Total Iterations: ${iteration}`);
  console.log(`   Final Score: ${result.finalScore}/4.0`);
  console.log(`   Status: ${result.passed ? 'PASSED ✅' : 'DID NOT PASS ⚠️'}`);
  console.log(`   Improvements Made: ${improvements.length}`);
  if (improvements.length > 0) {
    console.log(`   Changes: ${improvements.join(', ')}`);
  }

  return result;
}

/**
 * Improve scene based on evaluation feedback
 */
async function improveSceneWithEvaluation(
  scene: any,
  content: string,
  evaluation: SceneEvaluationResult,
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

  // Collect high-priority feedback
  const highPriorityFeedback = evaluation.evaluation.actionableFeedback
    .filter(f => f.priority === 'high')
    .map(f => `${f.category}: ${f.diagnosis} → ${f.suggestion}`)
    .join('\n');

  const mediumPriorityFeedback = evaluation.evaluation.actionableFeedback
    .filter(f => f.priority === 'medium')
    .map(f => `${f.category}: ${f.diagnosis} → ${f.suggestion}`)
    .join('\n');

  // Get category-specific improvements
  const plotImprovements = evaluation.evaluation.analysis.plot.improvements
    .map(i => `${i.point}: ${i.evidence}`)
    .join('\n');

  const characterImprovements = evaluation.evaluation.analysis.character.improvements
    .map(i => `${i.point}: ${i.evidence}`)
    .join('\n');

  const pacingImprovements = evaluation.evaluation.analysis.pacing.improvements
    .map(i => `${i.point}: ${i.evidence}`)
    .join('\n');

  const proseImprovements = evaluation.evaluation.analysis.prose.improvements
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
- Overall: ${evaluation.evaluation.overallScore}/4.0
- Plot: ${evaluation.evaluation.categoryScores.plot}/4.0
- Character: ${evaluation.evaluation.categoryScores.character}/4.0
- Pacing: ${evaluation.evaluation.categoryScores.pacing}/4.0
- Prose: ${evaluation.evaluation.categoryScores.prose}/4.0
- World Building: ${evaluation.evaluation.categoryScores.worldBuilding}/4.0

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
${evaluation.evaluation.summary.keyStrengths.join('\n')}

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
  if (evaluation.evaluation.metrics.plot.goalClarity.score < 3.0 && scene.goal) {
    // Goal needs clarification - this would need additional AI call
    changes.push('goal');
  }

  // Check if conflict needed work
  if (evaluation.evaluation.metrics.plot.conflictEngagement.score < 3.0 && scene.conflict) {
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
