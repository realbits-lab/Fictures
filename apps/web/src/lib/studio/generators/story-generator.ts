/**
 * Story Generator
 *
 * Generates story foundation using the Adversity-Triumph Engine.
 * This is the first phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";
import type { GenerateStoryParams, GenerateStoryResult } from "./types";
import {
  type AIStoryGenerationData,
  aiStoryGenerationSchema,
} from "./zod-schemas.generated";

/**
 * Generate story foundation from user prompt
 *
 * @param params - Story generation parameters
 * @returns Story data (caller responsible for database save)
 */
export async function generateStory(
  params: GenerateStoryParams
): Promise<GenerateStoryResult> {
  const startTime = Date.now();
  const {
    userPrompt,
    preferredGenre = "Any",
    preferredTone = "hopeful",
    language = "English",
  } = params;

  // Get the prompt template
  const { system, user } = promptManager.getPrompt(
    textGenerationClient.getProviderType(),
    "story",
    {
      userPrompt,
      genre: preferredGenre,
      tone: preferredTone,
      language,
    }
  );

  console.log(
    "[story-generator] Using generateStructured method with manual schema"
  );

  // Generate story data using structured output method
  // NOTE: We use manual schema (aiStoryGenerationSchema) instead of .pick() on insertStorySchema
  // because drizzle-zod schemas don't convert well to JSON Schema when using .pick()
  const storyData: AIStoryGenerationData =
    await textGenerationClient.generateStructured(
      user,
      aiStoryGenerationSchema,
      {
        systemPrompt: system,
        temperature: 0.8,
        maxTokens: 8192,
      }
    );

  console.log("[story-generator] Story generated:", {
    title: storyData.title,
    genre: storyData.genre,
    tone: storyData.tone,
  });

  // Validate result (title and tone are required in the schema)
  if (!storyData.title) {
    throw new Error("Invalid story data generated - missing required fields");
  }

  return {
    story: storyData,
    metadata: {
      generationTime: Date.now() - startTime,
      model: textGenerationClient.getProviderType(),
    },
  };
}
