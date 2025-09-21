/**
 * HNS Story Generation Functions
 * Implements the Hierarchical Narrative Schema from the story specification
 */

import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODELS } from "./config";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  stories,
  parts as partsTable,
  chapters as chaptersTable,
  scenes as scenesTable,
  characters as charactersTable,
  settings as settingsTable,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateHNSChaptersFixed, generateHNSScenesFixed } from "./hns-generator-fix";
import { generateAllSceneContent } from "./scene-content-generator";
import {
  // Import Zod Schemas
  HNSStoryPartialSchema,
  HNSPartPartialSchema,
  HNSChapterPartialSchema,
  HNSScenePartialSchema,
  HNSCharacterPartialSchema,
  HNSSettingPartialSchema,
  // Import TypeScript Types
  HNSStory,
  HNSPart,
  HNSChapter,
  HNSScene,
  HNSCharacter,
  HNSSetting,
  HNSDocument,
} from "@/types/hns";

// Constants for story structure
const CHAPTERS_PER_PART = 1;
const SCENES_PER_CHAPTER = 1;

/**
 * Phase 1: Core Concept Generation (Story Object)
 * Creates one-sentence summary and foundational story elements
 */
export async function generateHNSStory(
  userPrompt: string,
  language: string = "English"
): Promise<HNSStory> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: HNSStoryPartialSchema,
      system: `You are an expert story developer creating a story following the Hierarchical Narrative Schema (HNS).

Your task is to create a comprehensive story foundation based on the user's prompt.

Requirements:
1. Premise must be under 20 words - a single succinct sentence that encapsulates the entire novel
2. Dramatic question must be a yes/no question that drives the narrative
3. Theme should be a concise statement of the story's central message
4. Genre should be an array of 1-3 relevant genres
5. Create placeholder empty arrays for characters, settings, and parts (will be populated later)

Language preference: ${language}`,
      prompt: userPrompt,
      temperature: 0.9,
    });

    return {
      ...object,
      story_id: object.story_id || `story_${nanoid()}`,
    };
  } catch (error) {
    console.error("Error generating story foundation:", error);
    throw new Error("Failed to generate story foundation");
  }
}

/**
 * Phase 2: Act-Level Structuring (Part Objects)
 * Expands premise into three-act structure with key narrative beats
 */
export async function generateHNSParts(story: HNSStory): Promise<HNSPart[]> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: z.object({
        parts: z.array(HNSPartPartialSchema).length(3),
      }),
      system: `You are structuring a story into three acts following the Hierarchical Narrative Schema.

Story Context:
- Title: ${story.story_title}
- Premise: ${story.premise}
- Dramatic Question: ${story.dramatic_question}
- Theme: ${story.theme}

Create three parts (acts) with the following structure for each:

Act 1 (Setup):
- Introduces characters and ordinary world
- Contains inciting incident
- Key beats: ["Exposition", "Inciting Incident", "Plot Point One"]

Act 2 (Confrontation):
- Develops rising action and obstacles
- Contains midpoint reversal
- Key beats: ["Rising Action", "Midpoint", "Plot Point Two"]

Act 3 (Resolution):
- Resolves conflicts and completes arcs
- Key beats: ["Climax", "Falling Action", "Resolution"]

Return a JSON object with a 'parts' array containing exactly three parts, each with:
- part_title: A descriptive title for the part
- structural_role: Must be exactly one of "Act 1: Setup", "Act 2: Confrontation", or "Act 3: Resolution"
- summary: One paragraph describing main movements and developments
- key_beats: Array of narrative beats for this act
- chapters: Empty array (will be populated later)`,
      prompt:
        "Generate three-act structure with proper narrative beats and development.",
      temperature: 0.8,
    });

    return object.parts.map((part, index) => ({
      ...part,
      part_id: nanoid(),
      structural_role:
        part.structural_role ||
        ((index === 0
          ? "Act 1: Setup"
          : index === 1
          ? "Act 2: Confrontation"
          : "Act 3: Resolution") as HNSPart["structural_role"]),
    }));
  } catch (error) {
    console.error("Error generating story parts:", error);
    throw new Error("Failed to generate story parts");
  }
}

/**
 * Phase 3: Character Conception (Character Objects)
 * Creates detailed character profiles with psychology and backstory
 */
export async function generateHNSCharacters(
  story: HNSStory,
  parts: HNSPart[]
): Promise<HNSCharacter[]> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: z.object({
        characters: z.array(HNSCharacterPartialSchema).min(4).max(6),
      }),
      system: `You are creating detailed character profiles following the Hierarchical Narrative Schema.

Story Context:
- Title: ${story.story_title}
- Premise: ${story.premise}
- Theme: ${story.theme}
- Genre: ${story.genre.join(", ")}

Act Summaries:
${parts.map((p) => `${p.part_title}: ${p.summary}`).join("\n")}

Create 4-6 main characters with diverse roles. Include:
1. Protagonist (the main character driving the story)
2. Antagonist (the primary opposition)
3. Mentor or ally (supportive character)
4. Additional key characters as needed

For each character provide:
- name: Full name
- role: Their function in the story (must be exactly one of: protagonist/antagonist/mentor/ally/neutral)
- archetype: Character pattern (e.g., 'reluctant hero', 'trickster', 'mentor')
- summary: Physical appearance and initial impression
- storyline: Their journey through the story
- personality: Object with traits (array), myers_briggs, and enneagram
- backstory: Object with childhood, education, career, relationships, trauma
- motivations: Object with primary, secondary, and fear
- voice: Object with speech_pattern, vocabulary, verbal_tics (array), internal_voice
- physical_description: Object with age, ethnicity, height, build, hair_style_color, eye_color, facial_features, distinguishing_marks, typical_attire`,
      prompt:
        "Create diverse, compelling characters with depth and clear motivations.",
      temperature: 0.9,
    });

    return object.characters.map((char) => ({
      ...char,
      character_id: nanoid(),
    })) as HNSCharacter[];
  } catch (error) {
    console.error("Error generating characters:", error);
    throw new Error("Failed to generate characters");
  }
}

/**
 * Phase 4: Setting Development (Setting Objects)
 * Creates immersive locations with sensory details
 */
export async function generateHNSSettings(
  story: HNSStory,
  parts: HNSPart[]
): Promise<HNSSetting[]> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: z.object({
        settings: z.array(HNSSettingPartialSchema).min(3).max(6),
      }),
      system: `You are creating detailed settings following the Hierarchical Narrative Schema.

Story Context:
- Title: ${story.story_title}
- Genre: ${story.genre.join(", ")}
- Theme: ${story.theme}

Create 3-6 key settings where the story unfolds. Include:
1. Primary location (where most action occurs)
2. Contrasting location (different atmosphere)
3. Significant locations for key scenes

For each setting provide:
- name: Clear, memorable name
- description: Visual and atmospheric details
- mood: The feeling this place evokes
- sensory: Object with sight, sound, smell, touch arrays, and optional taste array
- visual_style: Artistic direction (e.g., 'dark fantasy horror')
- visual_references: Array of style inspirations
- color_palette: Array of dominant colors
- architectural_style: Structural design language`,
      prompt:
        "Create immersive, memorable settings that enhance the narrative.",
      temperature: 0.8,
    });

    return object.settings.map((setting) => ({
      ...setting,
      setting_id: nanoid(),
    })) as HNSSetting[];
  } catch (error) {
    console.error("Error generating settings:", error);
    throw new Error("Failed to generate settings");
  }
}

/**
 * Phase 5: Chapter Structuring (Chapter Objects)
 * Creates chapter breakdowns with hooks and arcs
 */
export async function generateHNSChapters(
  story: HNSStory,
  part: HNSPart,
  chapterCount: number = CHAPTERS_PER_PART
): Promise<HNSChapter[]> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: z.object({
        chapters: z.array(HNSChapterPartialSchema).length(chapterCount),
      }),
      system: `You are creating chapter structures following the Hierarchical Narrative Schema.

Story Context:
- Title: ${story.story_title}
- Part: ${part.part_title}
- Part Summary: ${part.summary}
- Key Beats: ${part.key_beats.join(", ")}

Create ${chapterCount} chapters for this part, each with:
- chapter_title: Engaging, descriptive title
- summary: What happens in this chapter (1-2 paragraphs)
- pacing_goal: One of 'fast', 'medium', 'slow', or 'reflective'
- action_dialogue_ratio: String like '40:60' or '50:50'
- chapter_hook: Object with:
  - type: One of 'revelation', 'danger', 'decision', 'question', 'emotional_turning_point'
  - description: Brief sentence describing the hook
  - urgency_level: One of 'high', 'medium', 'low'
- scenes: Empty array (will be populated later)

Ensure chapters:
1. Flow naturally from one to the next
2. Each advances the plot meaningfully
3. Include the key beats at appropriate points
4. Build tension toward the part's climax`,
      prompt: `Create ${chapterCount} compelling chapters that develop the narrative beats: ${part.key_beats.join(
        ", "
      )}`,
      temperature: 0.8,
    });

    return object.chapters.map((chapter, index) => ({
      ...chapter,
      chapter_id: nanoid(),
      chapter_number: index + 1,
      pacing_goal: chapter.pacing_goal || "medium",
      action_dialogue_ratio: chapter.action_dialogue_ratio || "50:50",
    })) as HNSChapter[];
  } catch (error) {
    console.error("Error generating chapters:", error);
    throw new Error("Failed to generate chapters");
  }
}

/**
 * Phase 6: Scene Creation (Scene Objects)
 * Creates scene-level breakdowns with goals and conflicts
 */
export async function generateHNSScenes(
  story: HNSStory,
  chapter: HNSChapter,
  characters: HNSCharacter[],
  settings: HNSSetting[],
  sceneCount: number = SCENES_PER_CHAPTER
): Promise<HNSScene[]> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: z.object({
        scenes: z.array(HNSScenePartialSchema).length(sceneCount),
      }),
      system: `You are creating scene structures following the Hierarchical Narrative Schema and generating opening narrative content.

IMPORTANT: You must generate EXACTLY ${sceneCount} scene${sceneCount === 1 ? '' : 's'} - no more, no less.

Chapter Context:
- Title: ${chapter.chapter_title}
- Summary: ${chapter.summary}
- Hook: ${chapter.chapter_hook}
- Pacing Goal: ${chapter.pacing_goal}
- Action/Dialogue Ratio: ${chapter.action_dialogue_ratio}

Story Context:
- Premise: ${story.premise}
- Theme: ${story.theme}
- Genre: ${story.genre.join(", ")}

Available Characters:
${characters.map((c) => `- ${c.name} (${c.role}): ${c.summary}`).join("\n")}

Available Settings:
${settings.map((s) => `- ${s.name}: ${s.description}`).join("\n")}

You must create EXACTLY ${sceneCount} scene${sceneCount === 1 ? '' : 's'}, each with:
- scene_title: Descriptive title that captures the scene's essence or key event
- summary: One-sentence description of the scene's core action
- entry_hook: Opening line or action for immediate engagement
- goal: What the POV character wants to achieve
- conflict: What prevents them from achieving it
- outcome: Must be exactly one of 'success', 'failure', 'success_with_cost', 'failure_with_discovery'
- emotional_shift: Object with 'from' and 'to' emotional states
- pov_character_id: ID of the point-of-view character
- character_ids: Array of all character IDs present
- setting_id: ID of the setting
- narrative_voice: One of 'third_person_limited', 'first_person', 'third_person_omniscient'
- content: Opening narrative content (2-3 paragraphs) written in the specified narrative voice and POV

For the content field:
1. Write 2-3 well-crafted opening paragraphs (approximately 200-400 words)
2. Use the specified narrative voice and POV character perspective
3. Begin with the entry_hook to immediately engage readers
4. Establish the scene's setting, mood, and character state
5. Show the goal/conflict starting to emerge
6. Match the chapter's pacing goal and action/dialogue ratio
7. Reflect the story's genre, theme, and emotional tone

Each scene should:
1. Have clear cause-and-effect with other scenes
2. Advance character arcs or plot
3. Include conflict or tension
4. End with a hook or question`,
      prompt: `Generate EXACTLY ${sceneCount} scene${sceneCount === 1 ? '' : 's'} for this chapter. The response must contain a 'scenes' array with exactly ${sceneCount} element${sceneCount === 1 ? '' : 's'}.`,
      temperature: 0.9,
    });

    return object.scenes.map((scene, index) => ({
      ...scene,
      scene_id: nanoid(),
      scene_number: index + 1,
      narrative_voice: scene.narrative_voice || "third_person_limited",
    })) as HNSScene[];
  } catch (error) {
    console.error("Error generating scenes:", error);

    // Provide more detailed error information
    if (error instanceof Error) {
      if (error.message.includes("Array too big") || error.message.includes("Array too small")) {
        throw new Error(`Scene generation failed: Expected exactly ${sceneCount} scene${sceneCount === 1 ? '' : 's'}, but the AI generated a different number. ${error.message}`);
      }
    }

    throw new Error(`Failed to generate scenes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Complete HNS Generation Pipeline with Incremental Saving
 * Orchestrates all phases to create a complete story structure
 * Saves data to database after each phase completion
 */
export async function generateCompleteHNS(
  userPrompt: string,
  language: string = "English",
  userId: string,
  storyId?: string,
  progressCallback?: (phase: string, data: any) => void
): Promise<HNSDocument> {
  console.log("🚀 Starting HNS story generation with incremental saving...");

  // Generate story ID upfront if not provided
  const currentStoryId = storyId || nanoid();

  try {
    // Phase 1: Generate core story and save immediately
    console.log("Phase 1: Generating story foundation...");
    progressCallback?.("phase1_start", {
      message: "Generating story foundation...",
    });
    const story = await generateHNSStory(userPrompt, language);
    story.story_id = currentStoryId; // Assign the story ID
    console.log("✅ Story foundation generated");
    progressCallback?.("phase1_complete", {
      message: "Story foundation generated",
      story,
    });

    // Save Phase 1 data to database
    console.log("💾 Saving Phase 1 data to database...");
    await db
      .insert(stories)
      .values({
        id: currentStoryId,
        title: story.story_title,
        description: story.premise,
        genre: story.genre.join(", "),
        authorId: userId,
        status: "phase1_in_progress",
        isPublic: false,
        premise: story.premise,
        dramaticQuestion: story.dramatic_question,
        theme: story.theme,
        hnsData: {
          phase1_story: story,
          metadata: {
            version: "1.0.0",
            language,
            generation_prompt: userPrompt,
            phase: "phase1_complete",
          },
        },
        partIds: [],
        chapterIds: [],
      })
      .onConflictDoUpdate({
        target: [stories.id],
        set: {
          status: "phase1_complete",
          hnsData: {
            phase1_story: story,
            metadata: {
              version: "1.0.0",
              language,
              generation_prompt: userPrompt,
              phase: "phase1_complete",
            },
          },
          updatedAt: new Date(),
        },
      });
    console.log("✅ Phase 1 data saved");

    // Phase 2: Generate three-act structure and save
    console.log("Phase 2: Creating three-act structure...");
    progressCallback?.("phase2_start", {
      message: "Creating three-act structure...",
    });
    const parts = await generateHNSParts(story);
    console.log("✅ Three-act structure created");
    progressCallback?.("phase2_complete", {
      message: "Three-act structure created",
      parts,
    });

    // Update story with Phase 2 data
    console.log("💾 Saving Phase 2 data to database...");
    const [phase2Story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, currentStoryId));
    const phase2HnsData = (phase2Story?.hnsData as any) || {};

    await db
      .update(stories)
      .set({
        status: "phase2_complete",
        hnsData: {
          ...phase2HnsData,
          phase2_parts: parts,
          metadata: {
            ...phase2HnsData.metadata,
            phase: "phase2_complete",
          },
        },
        partIds: parts.map((p) => p.part_id),
        updatedAt: new Date(),
      })
      .where(eq(stories.id, currentStoryId));

    // Create parts in database
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      await db
        .insert(partsTable)
        .values({
          id: part.part_id,
          title: part.part_title,
          description: part.summary,
          storyId: currentStoryId,
          authorId: userId,
          orderIndex: i + 1,
          summary: part.summary,
          keyBeats: part.key_beats,
          hnsData: part as any,
          chapterIds: [],
          status: "planned",
        })
        .onConflictDoNothing();
    }
    console.log("✅ Phase 2 data and parts saved");

    // Phase 3: Generate characters and save
    console.log("Phase 3: Developing characters...");
    progressCallback?.("phase3_start", { message: "Developing characters..." });
    const characters = await generateHNSCharacters(story, parts);
    console.log("✅ Characters developed");
    progressCallback?.("phase3_complete", {
      message: "Characters developed",
      characters,
    });

    // Update story with Phase 3 data
    console.log("💾 Saving Phase 3 data to database...");
    const [phase3Story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, currentStoryId));
    const phase3HnsData = (phase3Story?.hnsData as any) || {};

    await db
      .update(stories)
      .set({
        status: "phase3_complete",
        hnsData: {
          ...phase3HnsData,
          phase3_characters: characters,
          metadata: {
            ...phase3HnsData.metadata,
            phase: "phase3_complete",
          },
        },
        updatedAt: new Date(),
      })
      .where(eq(stories.id, currentStoryId));

    // Create characters in database
    for (const character of characters) {
      await db
        .insert(charactersTable)
        .values({
          id: character.character_id || nanoid(),
          name: character.name,
          storyId: currentStoryId,
          isMain: ["protagonist", "antagonist"].includes(
            character.role.toLowerCase()
          ),
          role: character.role,
          summary: character.summary,
          backstory: character.backstory,
          personality: character.personality,
          hnsData: character as any,
          content: JSON.stringify(character),
        })
        .onConflictDoNothing();
    }
    console.log("✅ Phase 3 data and characters saved");

    // Phase 4: Generate settings and save
    console.log("Phase 4: Building settings...");
    progressCallback?.("phase4_start", { message: "Building settings..." });
    const settings = await generateHNSSettings(story, parts);
    console.log("✅ Settings built");
    progressCallback?.("phase4_complete", {
      message: "Settings built",
      settings,
    });

    // Update story with Phase 4 data
    console.log("💾 Saving Phase 4 data to database...");
    const [phase4Story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, currentStoryId));
    const phase4HnsData = (phase4Story?.hnsData as any) || {};

    await db
      .update(stories)
      .set({
        status: "phase4_complete",
        hnsData: {
          ...phase4HnsData,
          phase4_settings: settings,
          metadata: {
            ...phase4HnsData.metadata,
            phase: "phase4_complete",
          },
        },
        updatedAt: new Date(),
      })
      .where(eq(stories.id, currentStoryId));

    // Create settings in database
    for (const setting of settings) {
      await db
        .insert(settingsTable)
        .values({
          id: setting.setting_id || nanoid(),
          name: setting.name,
          storyId: currentStoryId,
          description: setting.description,
          mood: setting.mood,
          sensory: setting.sensory,
        })
        .onConflictDoNothing();
    }
    console.log("✅ Phase 4 data and settings saved");

    // Phase 5 & 6: Generate chapters and scenes for each part
    console.log("Phase 5 & 6: Creating chapters and scenes...");
    progressCallback?.("phase5_6_start", {
      message: "Creating chapters and scenes...",
    });
    const allChapters: HNSChapter[] = [];
    const allScenes: HNSScene[] = [];

    const partsWithContent = await Promise.all(
      parts.map(async (part) => {
        // Use the fixed version with reduced payload
        const chapters = await generateHNSChaptersFixed(
          story,
          part,
          Math.min(CHAPTERS_PER_PART, 3) // Limit to 3 chapters per part
        );

        // Assign chapter IDs and part references
        chapters.forEach((chapter, index) => {
          chapter.chapter_id = nanoid(); // Always use new nanoid
          chapter.part_ref = part.part_id;
          chapter.chapter_number = index + 1;
          allChapters.push(chapter);
        });

        const chaptersWithScenes = await Promise.all(
          chapters.map(async (chapter) => {
            // Use the fixed version with reduced payload
            const scenes = await generateHNSScenesFixed(
              story,
              chapter,
              characters,
              settings,
              Math.min(SCENES_PER_CHAPTER, 3) // Limit to 3 scenes per chapter
            );

            // Assign scene IDs and chapter references
            scenes.forEach((scene, index) => {
              scene.scene_id =
                scene.scene_id || `${chapter.chapter_id}_scene_${index + 1}`;
              scene.chapter_ref = chapter.chapter_id;
              scene.scene_number = index + 1;
              allScenes.push(scene);
            });

            return { ...chapter, scenes };
          })
        );

        return { ...part, chapters: chaptersWithScenes };
      })
    );
    console.log("✅ Chapters and scenes created");
    progressCallback?.("phase5_6_complete", {
      message: "Chapters and scenes created",
      chapters: allChapters,
      scenes: allScenes,
    });

    // Save chapters to database
    console.log("💾 Saving chapters to database...");
    for (const chapter of allChapters) {
      await db
        .insert(chaptersTable)
        .values({
          id: chapter.chapter_id || nanoid(),
          title: chapter.chapter_title,
          summary: chapter.summary,
          storyId: currentStoryId,
          partId: chapter.part_ref,
          authorId: userId,
          orderIndex: chapter.chapter_number || 1,
          hook: chapter.chapter_hook.description,
          hnsData: chapter as any,
          status: "draft",
        })
        .onConflictDoNothing();
    }
    console.log("✅ Chapters saved");

    // Save scenes to database
    console.log("💾 Saving scenes to database...");
    for (const scene of allScenes) {
      await db
        .insert(scenesTable)
        .values({
          id: scene.scene_id || nanoid(),
          title: scene.scene_title || scene.summary || `Scene ${scene.scene_number}`,
          chapterId: scene.chapter_ref,
          orderIndex: scene.scene_number || 1,
          goal: scene.goal,
          conflict: scene.conflict,
          outcome: scene.outcome,
          povCharacterId: scene.pov_character_id || undefined,
          settingId: scene.setting_id || undefined,
          summary: scene.summary,
          hnsData: scene as any,
          status: "planned",
        })
        .onConflictDoNothing();
    }
    console.log("✅ Scenes saved");

    // Update status to phase 5&6 complete
    await db
      .update(stories)
      .set({
        status: "phase5_6_complete",
        updatedAt: new Date(),
      })
      .where(eq(stories.id, currentStoryId));
    console.log("✅ Phase 5&6 marked as complete");

    // Phase 7: Generate actual narrative content for each scene
    console.log("Phase 7: Generating scene content...");
    progressCallback?.("phase7_start", {
      message: "Generating narrative content for scenes...",
    });

    await generateAllSceneContent(
      currentStoryId,
      allScenes,
      allChapters,
      story,
      characters,
      settings,
      progressCallback
    );

    // Update status to phase 7 complete
    await db
      .update(stories)
      .set({
        status: "phase7_complete",
        updatedAt: new Date(),
      })
      .where(eq(stories.id, currentStoryId));
    console.log("✅ Phase 7 marked as complete");

    // Assemble complete HNS document
    const completeStory: HNSStory = {
      ...story,
      characters: characters.map((c) => c.character_id || nanoid()),
      settings: settings.map((s) => s.setting_id || nanoid()),
      parts: partsWithContent.map((p) => p.part_id),
    };

    // Final update with complete HNS data (but not marking as fully completed yet)
    console.log("💾 Saving complete HNS data to database...");
    await db
      .update(stories)
      .set({
        status: "phase5_6_complete", // Keep at phase5_6 since images aren't generated yet
        hnsData: {
          story: completeStory,
          metadata: {
            version: "1.0.0",
            created_at: new Date().toISOString(),
            language,
            generation_prompt: userPrompt,
            phase: "completed",
          },
          phases: {
            phase1_story: story,
            phase2_parts: parts,
            phase3_characters: characters,
            phase4_settings: settings,
            phase5_6_chapters_scenes: {
              chapters: allChapters,
              scenes: allScenes,
              partsWithContent,
            },
          },
        },
        chapterIds: allChapters.map((c) => c.chapter_id || nanoid()),
        updatedAt: new Date(),
      })
      .where(eq(stories.id, currentStoryId));

    console.log("✅ HNS generation complete with incremental saves!");

    // Build the final HNSDocument structure with proper ID references
    const finalParts: HNSPart[] = parts.map(part => ({
      ...part,
      chapters: allChapters
        .filter(ch => ch.part_ref === part.part_id)
        .map(ch => ch.chapter_id)
    }));

    const finalChapters: HNSChapter[] = allChapters.map(chapter => ({
      ...chapter,
      scenes: allScenes
        .filter(scene => scene.chapter_ref === chapter.chapter_id)
        .map(scene => scene.scene_id)
    }));

    return {
      story: completeStory,
      parts: finalParts,  // Parts with chapter ID references
      chapters: finalChapters,  // Chapters with scene ID references
      scenes: allScenes,
      characters,
      settings,
    };
  } catch (error) {
    console.error("❌ Error in HNS generation:", error);

    // Update story status to failed if it exists
    await db
      .update(stories)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(stories.id, currentStoryId));

    throw error;
  }
}

/**
 * Generate image prompt for a character
 */
export function generateCharacterImagePrompt(character: HNSCharacter): string {
  return `Portrait of ${character.name}, ${character.summary}. ${character.role} character. Photorealistic, detailed, professional photography style.`;
}

/**
 * Generate image prompt for a setting
 */
export function generateSettingImagePrompt(setting: HNSSetting): string {
  return `${setting.name}: ${setting.description}. ${setting.mood}. Cinematic, atmospheric, detailed environment art.`;
}
