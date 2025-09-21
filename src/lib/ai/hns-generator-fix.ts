/**
 * Fixed version of generateHNSScenes with reduced content size and better error handling
 */
import { generateObject } from "ai";
import { z } from "zod";
import { nanoid } from "nanoid";
import { AI_MODELS } from "./config";
import type { HNSStory, HNSChapter, HNSCharacter, HNSSetting, HNSScene } from "@/types/hns";

// Reduced schema for scenes to avoid large JSON responses
const HNSSceneCompactSchema = z.object({
  scene_title: z.string(),
  summary: z.string(),
  entry_hook: z.string(),
  goal: z.string(),
  conflict: z.string(),
  outcome: z.enum([
    "success",
    "failure",
    "success_with_cost",
    "failure_with_discovery",
  ]),
  emotional_shift: z.object({
    from: z.string(),
    to: z.string(),
  }),
  pov_character_id: z.string(),
  character_ids: z.array(z.string()),
  setting_id: z.string(),
  narrative_voice: z
    .enum(["third_person_limited", "first_person", "third_person_omniscient"])
    .optional(),
  // Removed the 'content' field to reduce JSON size
});

/**
 * Fixed Phase 6: Scene Creation with reduced payload
 * Creates scene-level breakdowns without full content
 */
export async function generateHNSScenesFixed(
  story: HNSStory,
  chapter: HNSChapter,
  characters: HNSCharacter[],
  settings: HNSSetting[],
  sceneCount: number = 3
): Promise<HNSScene[]> {
  try {
    // Limit scene count to prevent oversized JSON
    const actualSceneCount = Math.min(sceneCount, 3);

    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: z.object({
        scenes: z.array(HNSSceneCompactSchema).length(actualSceneCount),
      }),
      system: `You are creating scene structures following the Hierarchical Narrative Schema.

IMPORTANT: You must generate EXACTLY ${actualSceneCount} scenes - no more, no less.

Chapter Context:
- Title: ${chapter.chapter_title}
- Summary: ${chapter.summary}
- Hook: ${JSON.stringify(chapter.chapter_hook)}
- Pacing Goal: ${chapter.pacing_goal}

Story Context:
- Premise: ${story.premise}
- Theme: ${story.theme}
- Genre: ${story.genre.join(", ")}

Available Characters (use these IDs):
${characters.slice(0, 5).map((c) => `- ID: "${c.character_id}" - ${c.name} (${c.role})`).join("\n")}

Available Settings (use these IDs):
${settings.slice(0, 3).map((s) => `- ID: "${s.setting_id}" - ${s.name}`).join("\n")}

Create EXACTLY ${actualSceneCount} scenes, each with:
- scene_title: Descriptive title
- summary: One-sentence core action description
- entry_hook: Opening line for engagement
- goal: What the POV character wants
- conflict: What prevents achievement
- outcome: One of 'success', 'failure', 'success_with_cost', 'failure_with_discovery'
- emotional_shift: From/to emotional states
- pov_character_id: Use exact ID from the list above
- character_ids: Array of exact character IDs from the list
- setting_id: Use exact ID from the settings list
- narrative_voice: One of 'third_person_limited', 'first_person', 'third_person_omniscient'

Each scene should advance the plot and include clear conflict.`,
      prompt: `Generate EXACTLY ${actualSceneCount} scenes. Use the provided character and setting IDs exactly as shown.`,
      temperature: 0.7, // Lower temperature for more consistent output
    });

    return object.scenes.map((scene, index) => ({
      ...scene,
      scene_id: nanoid(),
      scene_number: index + 1,
      narrative_voice: scene.narrative_voice || "third_person_limited",
      // Add a placeholder for content that can be generated separately if needed
      content: `[Scene content to be generated separately for: ${scene.scene_title}]`,
    })) as HNSScene[];
  } catch (error) {
    console.error("Error generating scenes:", error);

    // Return fallback scenes if generation fails
    console.log("Using fallback scene generation...");
    return Array.from({ length: Math.min(sceneCount, 2) }, (_, i) => ({
      scene_id: nanoid(),
      scene_title: `Chapter ${chapter.chapter_number} Scene ${i + 1}`,
      summary: `Scene ${i + 1} of ${chapter.chapter_title}`,
      entry_hook: "The scene begins...",
      goal: "Advance the plot",
      conflict: "Internal or external conflict",
      outcome: "success_with_cost" as const,
      emotional_shift: {
        from: "uncertain",
        to: "determined",
      },
      pov_character_id: characters[0]?.character_id || "unknown",
      character_ids: characters.slice(0, 2).map(c => c.character_id || "unknown"),
      setting_id: settings[0]?.setting_id || "unknown",
      scene_number: i + 1,
      narrative_voice: "third_person_limited" as const,
      content: "[Scene content pending]",
    }));
  }
}

/**
 * Fixed chapter generation with reduced scene count
 */
export async function generateHNSChaptersFixed(
  story: HNSStory,
  part: any,
  chapterCount: number = 3
): Promise<HNSChapter[]> {
  try {
    // Limit chapter count to prevent oversized JSON
    const actualChapterCount = Math.min(chapterCount, 3);

    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: z.object({
        chapters: z.array(z.object({
          chapter_title: z.string(),
          summary: z.string(),
          pacing_goal: z.enum(["fast", "medium", "slow", "reflective"]).optional(),
          action_dialogue_ratio: z.string().optional(),
          chapter_hook: z.object({
            type: z.enum([
              "revelation",
              "danger",
              "decision",
              "question",
              "emotional_turning_point",
            ]),
            description: z.string(),
            urgency_level: z.enum(["high", "medium", "low"]),
          }),
        })).length(actualChapterCount),
      }),
      system: `Create ${actualChapterCount} chapter structures for the story part.
Story: ${story.story_title}
Part: ${part.part_title}
Summary: ${part.summary}

Create engaging chapters that advance the plot with clear hooks and pacing.`,
      prompt: `Generate EXACTLY ${actualChapterCount} chapters.`,
      temperature: 0.7,
    });

    return object.chapters.map((chapter, index) => ({
      ...chapter,
      chapter_id: nanoid(),
      chapter_number: index + 1,
      pacing_goal: chapter.pacing_goal || "medium",
      action_dialogue_ratio: chapter.action_dialogue_ratio || "50:50",
      scenes: [], // Will be populated separately
    })) as HNSChapter[];
  } catch (error) {
    console.error("Error generating chapters:", error);

    // Return fallback chapters
    return Array.from({ length: Math.min(chapterCount, 2) }, (_, i) => ({
      chapter_id: nanoid(),
      chapter_title: `Part ${part.part_number} Chapter ${i + 1}`,
      summary: `Chapter ${i + 1} of ${part.part_title}`,
      chapter_number: i + 1,
      pacing_goal: "medium" as const,
      action_dialogue_ratio: "50:50",
      chapter_hook: {
        type: "question" as const,
        description: "What happens next?",
        urgency_level: "medium" as const,
      },
      scenes: [],
    }));
  }
}