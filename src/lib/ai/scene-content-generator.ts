/**
 * Scene Content Generator
 * Generates narrative content for individual scenes after structure is complete
 */

import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./config";
import { db } from "@/lib/db";
import { scenes as scenesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { HNSScene, HNSChapter, HNSCharacter, HNSSetting, HNSStory } from "@/types/hns";

// Schema for scene content generation
const SceneContentSchema = z.object({
  content: z.string().describe("Complete scene narrative content (800-1500 words) - full scene from beginning to end"),
  writing_notes: z.string().optional().describe("Brief notes about the scene's purpose and flow"),
});

/**
 * Generate narrative content for a single scene
 */
export async function generateSceneContent(
  scene: HNSScene,
  chapter: HNSChapter,
  story: HNSStory,
  characters: HNSCharacter[],
  settings: HNSSetting[]
): Promise<{ content: string; writing_notes?: string }> {
  try {
    // Find the POV character and setting for this scene
    const povCharacter = characters.find(c => c.character_id === scene.pov_character_id);
    const setting = settings.find(s => s.setting_id === scene.setting_id);
    const sceneCharacters = characters.filter(c => scene.character_ids?.includes(c.character_id || ''));

    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: SceneContentSchema,
      system: `You are a professional novelist writing a complete scene for a story. Your task is to craft the FULL narrative content from beginning to end, not just an opening.

Story Context:
- Title: ${story.story_title}
- Genre: ${story.genre.join(", ")}
- Theme: ${story.theme}
- Premise: ${story.premise}

Chapter Context:
- Title: ${chapter.chapter_title}
- Summary: ${chapter.summary}
- Pacing: ${chapter.pacing_goal}
- Hook: ${JSON.stringify(chapter.chapter_hook)}

Scene Blueprint:
- Title: ${scene.scene_title}
- Summary: ${scene.summary}
- Entry Hook: ${scene.entry_hook}
- Goal: ${scene.goal}
- Conflict: ${scene.conflict}
- Outcome: ${scene.outcome}
- Emotional Journey: From "${scene.emotional_shift?.from}" to "${scene.emotional_shift?.to}"
- Narrative Voice: ${scene.narrative_voice}

POV Character: ${povCharacter?.name || 'Unknown'}
- Role: ${povCharacter?.role}
- Summary: ${povCharacter?.summary}
- Personality: ${povCharacter?.personality?.traits?.join(", ")}
- Voice: ${povCharacter?.voice?.speech_pattern}

Setting: ${setting?.name || 'Unknown'}
- Description: ${setting?.description}
- Mood: ${setting?.mood}
- Sensory Details:
  - Sight: ${setting?.sensory?.sight?.join(", ")}
  - Sound: ${setting?.sensory?.sound?.join(", ")}
  - Smell: ${setting?.sensory?.smell?.join(", ")}

Characters in Scene:
${sceneCharacters.map(c => `- ${c.name}: ${c.role} - ${c.archetype}`).join("\n")}

CRITICAL WRITING REQUIREMENTS:
You must write the COMPLETE SCENE from start to finish, not just an introduction. Structure your narrative as follows:

1. OPENING (15-20%): Start with the entry hook "${scene.entry_hook}"
   - Establish setting and atmosphere
   - Ground reader in POV character's perspective
   - Set initial emotional tone (${scene.emotional_shift?.from})

2. DEVELOPMENT (25-30%): Build toward the scene's goal
   - Show ${povCharacter?.name || 'the protagonist'} pursuing: ${scene.goal}
   - Develop character interactions and relationships
   - Layer in sensory details and world-building

3. RISING ACTION (20-25%): Introduce and escalate the conflict
   - Present the obstacle/conflict: ${scene.conflict}
   - Show character reactions and attempts to overcome
   - Build tension through action, dialogue, or internal struggle

4. CLIMAX (15-20%): Peak moment of the scene
   - Confront the conflict directly
   - Reveal key information or make critical decisions
   - Shift emotional energy toward resolution

5. RESOLUTION (10-15%): Conclude with the outcome
   - Show the result: ${scene.outcome}
   - Complete emotional arc to ${scene.emotional_shift?.to}
   - Create transition hook or question for next scene

STYLE GUIDELINES:
- Write in ${scene.narrative_voice || 'third_person_limited'} perspective consistently
- Maintain ${chapter.pacing_goal} pacing throughout
- Balance narrative, dialogue, and action appropriately
- Use vivid, sensory language matching the ${story.genre.join("/")} genre
- Show character emotions through actions and reactions
- Vary sentence structure for rhythm and flow
- Target 800-1500 words for complete scene coverage

Remember: This is a COMPLETE SCENE, not a summary or excerpt. Write the full narrative as it would appear in the published story.`,
      prompt: `Write the COMPLETE scene narrative from beginning to end. Start with the entry hook and develop through to resolution. Begin with: "${scene.entry_hook}"`,
      temperature: 0.85,
    });

    return object;
  } catch (error) {
    console.error(`Error generating content for scene ${scene.scene_id}:`, error);

    // Return fallback content if generation fails
    return {
      content: `${scene.entry_hook}\n\nThe scene unfolds as the protagonist pursues ${scene.goal}, but faces ${scene.conflict}. The emotional journey moves from ${scene.emotional_shift?.from} to ${scene.emotional_shift?.to}, culminating in ${scene.outcome}.\n\n[Full scene content generation in progress...]`,
      writing_notes: "Fallback content - generation failed"
    };
  }
}

/**
 * Generate content for all scenes in a story and save to database
 * @param storyId - The story ID
 * @param allScenes - All scenes to generate content for
 * @param allChapters - All chapters for context
 * @param story - Story context
 * @param characters - Character data
 * @param settings - Setting data
 * @param progressCallback - Callback for progress updates
 */
export async function generateAllSceneContent(
  storyId: string,
  allScenes: HNSScene[],
  allChapters: HNSChapter[],
  story: HNSStory,
  characters: HNSCharacter[],
  settings: HNSSetting[],
  progressCallback?: (event: string, data: any) => void
): Promise<void> {
  const totalScenes = allScenes.length;
  let completedScenes = 0;

  console.log(`Phase 7: Generating content for ${totalScenes} scenes...`);
  progressCallback?.("phase7_start", {
    message: `Generating narrative content for ${totalScenes} scenes...`,
    totalScenes,
  });

  for (const scene of allScenes) {
    try {
      // Find the chapter this scene belongs to
      const chapter = allChapters.find(ch => ch.chapter_id === scene.chapter_ref);

      if (!chapter) {
        console.warn(`Chapter not found for scene ${scene.scene_id}`);
        continue;
      }

      // Generate content for this scene
      const { content, writing_notes } = await generateSceneContent(
        scene,
        chapter,
        story,
        characters,
        settings
      );

      // Update the scene in the database immediately
      console.log(`Updating scene ${scene.scene_id} with ${content.split(/\s+/).length} words...`);

      const updateResult = await db
        .update(scenesTable)
        .set({
          content,
          wordCount: content.split(/\s+/).length,
          updatedAt: new Date(),
        })
        .where(eq(scenesTable.id, scene.scene_id || ''))
        .returning();

      if (updateResult.length === 0) {
        console.error(`❌ Failed to update scene ${scene.scene_id} - scene not found in database!`);
      } else {
        console.log(`✅ Scene ${scene.scene_id} updated successfully`);
      }

      completedScenes++;

      // Send progress update
      progressCallback?.("phase7_progress", {
        message: `Generated content for scene ${completedScenes}/${totalScenes}: ${scene.scene_title}`,
        completedScenes,
        totalScenes,
        currentScene: scene.scene_title,
        percentage: Math.round((completedScenes / totalScenes) * 100),
      });

      console.log(`✅ Scene ${completedScenes}/${totalScenes} content generated: ${scene.scene_title}`);

      // Small delay to prevent rate limiting
      if (completedScenes < totalScenes) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Failed to generate content for scene ${scene.scene_id}:`, error);

      // Continue with next scene even if one fails
      progressCallback?.("phase7_warning", {
        message: `Skipped scene: ${scene.scene_title}`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  console.log(`✅ Phase 7 complete: Generated content for ${completedScenes}/${totalScenes} scenes`);
  progressCallback?.("phase7_complete", {
    message: "Scene content generation complete",
    completedScenes,
    totalScenes,
  });
}