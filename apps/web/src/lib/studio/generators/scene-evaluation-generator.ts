/**
 * Scene Evaluation Generator
 *
 * Evaluates and iteratively improves scene content quality.
 * This is the eighth phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import type { EvaluateSceneParams, EvaluateSceneResult } from "./types";
import {
	type GeneratedSceneEvaluationData,
	GeneratedSceneEvaluationSchema,
} from "./zod-schemas.generated";

/**
 * Evaluate and iteratively improve a scene
 *
 * @param params - Scene evaluation parameters
 * @returns Evaluated and improved scene content
 */
export async function evaluateScene(
	params: EvaluateSceneParams,
): Promise<EvaluateSceneResult> {
	const startTime: number = Date.now();

	// 1. Extract and set default parameters
	const { content, story, maxIterations = 2 }: EvaluateSceneParams = params;

	let currentContent: string = content;
	let iterations: number = 0;
	let bestScore: number = 0;
	let improved: boolean = false;

	// 2. Initialize evaluation categories based on "Architectonics of Engagement"
	type EvaluationCategories = EvaluateSceneResult["categories"];

	const categories: EvaluationCategories = {
		plot: 0,
		character: 0,
		pacing: 0,
		prose: 0,
		worldBuilding: 0,
	};

	// 3. Iterative improvement loop
	for (let i = 0; i < maxIterations; i++) {
		iterations++;

		// 4. Prepare evaluation prompt
		const evaluationPrompt: string = `Evaluate this scene content on a scale of 1-4 for each category:

Scene Content:
${currentContent}

Story Context:
Title: ${story.title}
Genre: ${story.genre}
Moral Framework: ${story.moralFramework}

Evaluate on these dimensions (1-4 scale):
- Plot Progression: Does the scene advance the story meaningfully?
- Character Development: Are characters revealed through action and dialogue?
- Pacing: Is the rhythm appropriate for the emotional beat?
- Prose Quality: Is the writing clear, vivid, and engaging?
- World-Building: Does the setting feel immersive and purposeful?

Return as JSON:
{
  "plot": 3.5,
  "character": 3.2,
  "pacing": 3.8,
  "prose": 3.0,
  "worldBuilding": 3.4,
  "overallScore": 3.38,
  "feedback": "Detailed feedback on strengths and weaknesses...",
  "suggestedImprovements": "Specific actionable suggestions..."
}`;

		// 5. Generate structured evaluation
		const evaluation: GeneratedSceneEvaluationData =
			await textGenerationClient.generateStructured(
				evaluationPrompt,
				GeneratedSceneEvaluationSchema,
				{
					temperature: 0.3,
					maxTokens: 2048,
				},
			);

		// 6. Update category scores
		categories.plot = evaluation.plot || 0;
		categories.character = evaluation.character || 0;
		categories.pacing = evaluation.pacing || 0;
		categories.prose = evaluation.prose || 0;
		categories.worldBuilding = evaluation.worldBuilding || 0;

		const currentScore: number = evaluation.overallScore || 0;

		console.log(
			`[scene-evaluation-generator] Iteration ${i + 1}/${maxIterations}:`,
			{
				score: currentScore,
				categories,
			},
		);

		// 7. Check if score meets quality threshold (>= 3.0)
		if (currentScore >= 3.0) {
			bestScore = currentScore;
			break;
		}

		// 8. Skip improvement on last iteration
		if (i === maxIterations - 1) {
			bestScore = currentScore;
			break;
		}

		// 9. Prepare improvement prompt
		const improvementPrompt: string = `Improve this scene based on the evaluation feedback:

Original Scene:
${currentContent}

Evaluation Feedback:
${evaluation.feedback}

Suggested Improvements:
${evaluation.suggestedImprovements}

Current Scores:
- Plot: ${evaluation.plot}/4
- Character: ${evaluation.character}/4
- Pacing: ${evaluation.pacing}/4
- Prose: ${evaluation.prose}/4
- World-Building: ${evaluation.worldBuilding}/4

Rewrite the scene addressing the feedback. Maintain the core narrative while improving weak areas.

Return only the improved prose content (no JSON, no wrapper).`;

		// 10. Generate improved scene content
		type TextGenerationResponse = Awaited<
			ReturnType<typeof textGenerationClient.generate>
		>;

		const improveResponse: TextGenerationResponse =
			await textGenerationClient.generate({
				prompt: improvementPrompt,
				temperature: 0.85,
				maxTokens: 8192,
			});

		const improvedContent: string = improveResponse.text.trim();

		// 11. Validate and apply improvement
		if (improvedContent.length > currentContent.length * 0.5) {
			currentContent = improvedContent;
			improved = true;
		}

		bestScore = Math.max(bestScore, currentScore);
	}

	// 12. Calculate total generation time
	const totalTime: number = Date.now() - startTime;

	console.log("[scene-evaluation-generator] Evaluation complete:", {
		finalScore: bestScore,
		iterations,
		improved,
		generationTime: totalTime,
	});

	// 13. Return evaluation result
	return {
		finalContent: currentContent,
		score: bestScore,
		categories,
		feedback: {
			strengths: [
				`Scene evaluated with ${iterations} iteration(s)`,
				`Final score: ${bestScore}/4.0`,
			],
			improvements: improved
				? ["Scene content improved based on AI feedback"]
				: ["Scene accepted at current quality level"],
		},
		iterations,
		improved,
		metadata: {
			generationTime: totalTime,
		},
	};
}
