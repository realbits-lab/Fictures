/**
 * HNS Story Generation Functions
 * Implements the Hierarchical Narrative Schema from the story specification
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { AI_MODELS } from './config';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import {
  stories,
  parts as partsTable,
  chapters as chaptersTable,
  scenes as scenesTable,
  characters as charactersTable,
  settings as settingsTable
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type {
  HNSStory,
  HNSPart,
  HNSChapter,
  HNSScene,
  HNSCharacter,
  HNSSetting,
  HNSDocument
} from '@/types/hns';

// Constants for story structure
const CHAPTERS_PER_PART = 1;
const SCENES_PER_CHAPTER = 1;

// Define Zod schemas for each HNS component
const HNSStorySchema = z.object({
  story_id: z.string().optional(),
  story_title: z.string(),
  genre: z.array(z.string()).min(1).max(3),
  premise: z.string().max(200), // Increased from 100 to allow for more descriptive premises
  dramatic_question: z.string(),
  theme: z.string(),
  characters: z.array(z.any()).default([]),
  settings: z.array(z.any()).default([]),
  parts: z.array(z.any()).default([])
});

const HNSPartSchema = z.object({
  part_id: z.string().optional(),
  part_title: z.string(),
  part_summary: z.string(),
  key_beats: z.array(z.string()),
  chapters: z.array(z.any()).default([])
});

const HNSChapterSchema = z.object({
  chapter_id: z.string().optional(),
  chapter_title: z.string(),
  chapter_summary: z.string(),
  chapter_hook: z.string(),
  scenes: z.array(z.any()).default([])
});

const HNSSceneSchema = z.object({
  scene_id: z.string().optional(),
  scene_title: z.string(),
  scene_goal: z.string(),
  scene_conflict: z.string(),
  scene_outcome: z.string(),
  dialogue_snippets: z.array(z.string()).optional(),
  setting_ref: z.string().optional(),
  characters_present: z.array(z.string()).optional()
});

const HNSCharacterSchema = z.object({
  character_id: z.string().optional(),
  character_name: z.string(),
  role: z.string(),
  description: z.string(),
  psychological_profile: z.string(),
  backstory: z.string(),
  arc: z.string(),
  speech_pattern: z.string().optional(),
  relationships: z.array(z.object({
    character_id: z.string(),
    relationship_type: z.string()
  })).optional()
});

const HNSSettingSchema = z.object({
  setting_id: z.string().optional(),
  setting_name: z.string(),
  description: z.string(),
  sensory_details: z.string(),
  mood_atmosphere: z.string(),
  significance: z.string(),
  time_period: z.string().optional()
});

/**
 * Phase 1: Core Concept Generation (Story Object)
 * Creates one-sentence summary and foundational story elements
 */
export async function generateHNSStory(userPrompt: string, language: string = 'English'): Promise<HNSStory> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: HNSStorySchema,
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
    console.error('Error generating story foundation:', error);
    throw new Error('Failed to generate story foundation');
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
        parts: z.array(HNSPartSchema).length(3)
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
- part_summary: One paragraph describing main movements and developments
- key_beats: Array of narrative beats for this act
- chapters: Empty array (will be populated later)`,
      prompt: 'Generate three-act structure with proper narrative beats and development.',
      temperature: 0.8,
    });

    return object.parts.map((part, index) => ({
      ...part,
      part_id: nanoid(), // Always use nanoid, ignore AI-generated IDs
    }));
  } catch (error) {
    console.error('Error generating story parts:', error);
    throw new Error('Failed to generate story parts');
  }
}

/**
 * Phase 3: Character Conception (Character Objects)
 * Creates detailed character profiles with psychology and backstory
 */
export async function generateHNSCharacters(story: HNSStory, parts: HNSPart[]): Promise<HNSCharacter[]> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: z.object({
        characters: z.array(HNSCharacterSchema).min(4).max(6)
      }),
      system: `You are creating detailed character profiles following the Hierarchical Narrative Schema.

Story Context:
- Title: ${story.story_title}
- Premise: ${story.premise}
- Theme: ${story.theme}
- Genre: ${story.genre.join(', ')}

Act Summaries:
${parts.map(p => `${p.part_title}: ${p.part_summary}`).join('\n')}

Create 4-6 main characters with diverse roles. Include:
1. Protagonist (the main character driving the story)
2. Antagonist (the primary opposition)
3. Mentor or ally (supportive character)
4. Additional key characters as needed

For each character provide:
- character_name: Full name
- role: Their function in the story (protagonist/antagonist/mentor/ally/neutral)
- description: Physical appearance and initial impression
- psychological_profile: Personality traits, Myers-Briggs type, motivations
- backstory: Key life events that shaped them
- arc: How they change throughout the story
- speech_pattern: How they speak (optional)
- relationships: Connections to other characters (optional)`,
      prompt: 'Create diverse, compelling characters with depth and clear motivations.',
      temperature: 0.9,
    });

    return object.characters.map((char, index) => ({
      ...char,
      character_id: char.character_id || `char_${index + 1}_${nanoid(6)}`,
    }));
  } catch (error) {
    console.error('Error generating characters:', error);
    throw new Error('Failed to generate characters');
  }
}

/**
 * Phase 4: Setting Development (Setting Objects)
 * Creates immersive locations with sensory details
 */
export async function generateHNSSettings(story: HNSStory, parts: HNSPart[]): Promise<HNSSetting[]> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: z.object({
        settings: z.array(HNSSettingSchema).min(3).max(6)
      }),
      system: `You are creating detailed settings following the Hierarchical Narrative Schema.

Story Context:
- Title: ${story.story_title}
- Genre: ${story.genre.join(', ')}
- Theme: ${story.theme}

Create 3-6 key settings where the story unfolds. Include:
1. Primary location (where most action occurs)
2. Contrasting location (different atmosphere)
3. Significant locations for key scenes

For each setting provide:
- setting_name: Clear, memorable name
- description: Visual and atmospheric details
- sensory_details: Sounds, smells, textures, temperatures
- mood_atmosphere: The feeling this place evokes
- significance: Why this location matters to the story
- time_period: When this takes place (optional)`,
      prompt: 'Create immersive, memorable settings that enhance the narrative.',
      temperature: 0.8,
    });

    return object.settings.map((setting, index) => ({
      ...setting,
      setting_id: setting.setting_id || `setting_${index + 1}_${nanoid(6)}`,
    }));
  } catch (error) {
    console.error('Error generating settings:', error);
    throw new Error('Failed to generate settings');
  }
}

/**
 * Phase 5: Chapter Structuring (Chapter Objects)
 * Creates chapter breakdowns with hooks and arcs
 */
export async function generateHNSChapters(story: HNSStory, part: HNSPart, chapterCount: number = CHAPTERS_PER_PART): Promise<HNSChapter[]> {
  try {
    const { object } = await generateObject({
      model: AI_MODELS.writing,
      schema: z.object({
        chapters: z.array(HNSChapterSchema).length(chapterCount)
      }),
      system: `You are creating chapter structures following the Hierarchical Narrative Schema.

Story Context:
- Title: ${story.story_title}
- Part: ${part.part_title}
- Part Summary: ${part.part_summary}
- Key Beats: ${part.key_beats.join(', ')}

Create ${chapterCount} chapters for this part, each with:
- chapter_title: Engaging, descriptive title
- chapter_summary: What happens in this chapter (1-2 paragraphs)
- chapter_hook: Opening line or situation that grabs attention
- scenes: Empty array (will be populated later)

Ensure chapters:
1. Flow naturally from one to the next
2. Each advances the plot meaningfully
3. Include the key beats at appropriate points
4. Build tension toward the part's climax`,
      prompt: `Create ${chapterCount} compelling chapters that develop the narrative beats: ${part.key_beats.join(', ')}`,
      temperature: 0.8,
    });

    return object.chapters.map((chapter, index) => ({
      ...chapter,
      chapter_id: nanoid(), // Always use nanoid, ignore AI-generated IDs
    }));
  } catch (error) {
    console.error('Error generating chapters:', error);
    throw new Error('Failed to generate chapters');
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
        scenes: z.array(HNSSceneSchema).length(sceneCount)
      }),
      system: `You are creating scene structures following the Hierarchical Narrative Schema.

Chapter Context:
- Title: ${chapter.chapter_title}
- Summary: ${chapter.chapter_summary}
- Hook: ${chapter.chapter_hook}

Available Characters:
${characters.map(c => `- ${c.character_name} (${c.role})`).join('\n')}

Available Settings:
${settings.map(s => `- ${s.setting_name}`).join('\n')}

Create ${sceneCount} scenes, each with:
- scene_title: Clear, action-oriented title
- scene_goal: What the protagonist wants to achieve
- scene_conflict: What prevents them from achieving it
- scene_outcome: How the scene resolves (success/failure/complication)
- dialogue_snippets: 2-3 key lines of dialogue (optional)
- setting_ref: Which setting this occurs in (optional)
- characters_present: Which characters appear (optional)

Each scene should:
1. Have clear cause-and-effect with other scenes
2. Advance character arcs or plot
3. Include conflict or tension
4. End with a hook or question`,
      prompt: `Create ${sceneCount} dynamic scenes that bring the chapter to life.`,
      temperature: 0.9,
    });

    return object.scenes.map((scene, index) => ({
      ...scene,
      scene_id: nanoid(), // Always use nanoid, ignore AI-generated IDs
    }));
  } catch (error) {
    console.error('Error generating scenes:', error);
    throw new Error('Failed to generate scenes');
  }
}

/**
 * Complete HNS Generation Pipeline with Incremental Saving
 * Orchestrates all phases to create a complete story structure
 * Saves data to database after each phase completion
 */
export async function generateCompleteHNS(
  userPrompt: string,
  language: string = 'English',
  userId: string,
  storyId?: string
): Promise<HNSDocument> {
  console.log('🚀 Starting HNS story generation with incremental saving...');

  // Generate story ID upfront if not provided
  const currentStoryId = storyId || nanoid();

  try {
    // Phase 1: Generate core story and save immediately
    console.log('Phase 1: Generating story foundation...');
    const story = await generateHNSStory(userPrompt, language);
    story.story_id = currentStoryId; // Assign the story ID
    console.log('✅ Story foundation generated');

    // Save Phase 1 data to database
    console.log('💾 Saving Phase 1 data to database...');
    await db.insert(stories)
      .values({
        id: currentStoryId,
        title: story.story_title,
        description: story.premise,
        genre: story.genre.join(', '),
        authorId: userId,
        status: 'phase1_in_progress',
        isPublic: false,
        premise: story.premise,
        dramaticQuestion: story.dramatic_question,
        theme: story.theme,
        hnsData: {
          phase1_story: story,
          metadata: {
            version: '1.0.0',
            language,
            generation_prompt: userPrompt,
            phase: 'phase1_complete'
          }
        },
        partIds: [],
        chapterIds: [],
      })
      .onConflictDoUpdate({
        target: [stories.id],
        set: {
          status: 'phase1_complete',
          hnsData: {
            phase1_story: story,
            metadata: {
              version: '1.0.0',
              language,
              generation_prompt: userPrompt,
              phase: 'phase1_complete'
            }
          },
          updatedAt: new Date()
        }
      });
    console.log('✅ Phase 1 data saved');

    // Phase 2: Generate three-act structure and save
    console.log('Phase 2: Creating three-act structure...');
    const parts = await generateHNSParts(story);
    console.log('✅ Three-act structure created');

    // Update story with Phase 2 data
    console.log('💾 Saving Phase 2 data to database...');
    const [phase2Story] = await db.select().from(stories).where(eq(stories.id, currentStoryId));
    const phase2HnsData = phase2Story?.hnsData as any || {};

    await db.update(stories)
      .set({
        status: 'phase2_complete',
        hnsData: {
          ...phase2HnsData,
          phase2_parts: parts,
          metadata: {
            ...phase2HnsData.metadata,
            phase: 'phase2_complete'
          }
        },
        partIds: parts.map(p => p.part_id),
        updatedAt: new Date()
      })
      .where(eq(stories.id, currentStoryId));

    // Create parts in database
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      await db.insert(partsTable)
        .values({
          id: part.part_id,
          title: part.part_title,
          description: part.part_summary,
          storyId: currentStoryId,
          authorId: userId,
          orderIndex: i + 1,
          summary: part.part_summary,
          keyBeats: part.key_beats,
          hnsData: part as Record<string, unknown>,
          chapterIds: [],
          status: 'planned',
        })
        .onConflictDoNothing();
    }
    console.log('✅ Phase 2 data and parts saved');

    // Phase 3: Generate characters and save
    console.log('Phase 3: Developing characters...');
    const characters = await generateHNSCharacters(story, parts);
    console.log('✅ Characters developed');

    // Update story with Phase 3 data
    console.log('💾 Saving Phase 3 data to database...');
    const [phase3Story] = await db.select().from(stories).where(eq(stories.id, currentStoryId));
    const phase3HnsData = phase3Story?.hnsData as any || {};

    await db.update(stories)
      .set({
        status: 'phase3_complete',
        hnsData: {
          ...phase3HnsData,
          phase3_characters: characters,
          metadata: {
            ...phase3HnsData.metadata,
            phase: 'phase3_complete'
          }
        },
        updatedAt: new Date()
      })
      .where(eq(stories.id, currentStoryId));

    // Create characters in database
    for (const character of characters) {
      await db.insert(charactersTable)
        .values({
          id: character.character_id || nanoid(),
          name: character.character_name,
          storyId: currentStoryId,
          isMain: ['protagonist', 'antagonist'].includes(character.role.toLowerCase()),
          role: character.role,
          summary: character.description,
          backstory: character.backstory,
          personality: character.psychological_profile,
          hnsData: character as Record<string, unknown>,
          content: JSON.stringify(character),
        })
        .onConflictDoNothing();
    }
    console.log('✅ Phase 3 data and characters saved');

    // Phase 4: Generate settings and save
    console.log('Phase 4: Building settings...');
    const settings = await generateHNSSettings(story, parts);
    console.log('✅ Settings built');

    // Update story with Phase 4 data
    console.log('💾 Saving Phase 4 data to database...');
    const [phase4Story] = await db.select().from(stories).where(eq(stories.id, currentStoryId));
    const phase4HnsData = phase4Story?.hnsData as any || {};

    await db.update(stories)
      .set({
        status: 'phase4_complete',
        hnsData: {
          ...phase4HnsData,
          phase4_settings: settings,
          metadata: {
            ...phase4HnsData.metadata,
            phase: 'phase4_complete'
          }
        },
        updatedAt: new Date()
      })
      .where(eq(stories.id, currentStoryId));

    // Create settings in database
    for (const setting of settings) {
      await db.insert(settingsTable)
        .values({
          id: setting.setting_id || nanoid(),
          name: setting.setting_name,
          storyId: currentStoryId,
          description: setting.description,
          mood: setting.mood_atmosphere,
          sensory: { details: setting.sensory_details },
        })
        .onConflictDoNothing();
    }
    console.log('✅ Phase 4 data and settings saved');

    // Phase 5 & 6: Generate chapters and scenes for each part
    console.log('Phase 5 & 6: Creating chapters and scenes...');
    const allChapters: HNSChapter[] = [];
    const allScenes: HNSScene[] = [];

    const partsWithContent = await Promise.all(
      parts.map(async (part) => {
        const chapters = await generateHNSChapters(story, part, CHAPTERS_PER_PART);

        // Assign chapter IDs and part references
        chapters.forEach((chapter, index) => {
          chapter.chapter_id = nanoid(); // Always use new nanoid
          chapter.part_ref = part.part_id;
          chapter.chapter_number = index + 1;
          allChapters.push(chapter);
        });

        const chaptersWithScenes = await Promise.all(
          chapters.map(async (chapter) => {
            const scenes = await generateHNSScenes(story, chapter, characters, settings, SCENES_PER_CHAPTER);

            // Assign scene IDs and chapter references
            scenes.forEach((scene, index) => {
              scene.scene_id = scene.scene_id || `${chapter.chapter_id}_scene_${index + 1}`;
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
    console.log('✅ Chapters and scenes created');

    // Save chapters to database
    console.log('💾 Saving chapters to database...');
    for (const chapter of allChapters) {
      await db.insert(chaptersTable)
        .values({
          id: chapter.chapter_id || nanoid(),
          title: chapter.chapter_title,
          summary: chapter.chapter_summary,
          storyId: currentStoryId,
          partId: chapter.part_ref,
          authorId: userId,
          orderIndex: chapter.chapter_number || 1,
          chapterHook: chapter.chapter_hook,
          hnsData: chapter as Record<string, unknown>,
          sceneIds: chapter.scenes?.map(s => s.scene_id || nanoid()) || [],
          status: 'draft',
        })
        .onConflictDoNothing();
    }
    console.log('✅ Chapters saved');

    // Save scenes to database
    console.log('💾 Saving scenes to database...');
    for (const scene of allScenes) {
      await db.insert(scenesTable)
        .values({
          id: scene.scene_id || nanoid(),
          title: scene.scene_title || `Scene ${scene.scene_number}`,
          chapterId: scene.chapter_ref,
          orderIndex: scene.scene_number || 1,
          goal: scene.scene_goal,
          conflict: scene.scene_conflict,
          outcome: scene.scene_outcome,
          povCharacterId: scene.characters_present?.[0],
          settingId: scene.setting_ref,
          summary: `${scene.scene_goal} - ${scene.scene_conflict} - ${scene.scene_outcome}`,
          hnsData: scene as Record<string, unknown>,
          characterIds: scene.characters_present || [],
          placeIds: scene.setting_ref ? [scene.setting_ref] : [],
          status: 'planned',
        })
        .onConflictDoNothing();
    }
    console.log('✅ Scenes saved');

    // Update status to phase 5&6 complete
    await db.update(stories)
      .set({
        status: 'phase5_6_complete',
        updatedAt: new Date()
      })
      .where(eq(stories.id, currentStoryId));
    console.log('✅ Phase 5&6 marked as complete');

    // Assemble complete HNS document
    const completeStory: HNSStory = {
      ...story,
      characters,
      settings,
      parts: partsWithContent,
    };

    // Final update with complete HNS data (but not marking as fully completed yet)
    console.log('💾 Saving complete HNS data to database...');
    await db.update(stories)
      .set({
        status: 'phase5_6_complete',  // Keep at phase5_6 since images aren't generated yet
        hnsData: {
          story: completeStory,
          metadata: {
            version: '1.0.0',
            created_at: new Date().toISOString(),
            language,
            generation_prompt: userPrompt,
            phase: 'completed'
          },
          phases: {
            phase1_story: story,
            phase2_parts: parts,
            phase3_characters: characters,
            phase4_settings: settings,
            phase5_6_chapters_scenes: {
              chapters: allChapters,
              scenes: allScenes,
              partsWithContent
            }
          }
        },
        chapterIds: allChapters.map(c => c.chapter_id || nanoid()),
        updatedAt: new Date()
      })
      .where(eq(stories.id, currentStoryId));

    console.log('✅ HNS generation complete with incremental saves!');

    return {
      metadata: {
        version: '1.0.0',
        created_at: new Date().toISOString(),
        language,
        generation_prompt: userPrompt,
      },
      story: completeStory,
      parts,
      chapters: allChapters,
      scenes: allScenes,
      characters,
      settings,
    };
  } catch (error) {
    console.error('❌ Error in HNS generation:', error);

    // Update story status to failed if it exists
    await db.update(stories)
      .set({
        status: 'failed',
        updatedAt: new Date()
      })
      .where(eq(stories.id, currentStoryId));

    throw error;
  }
}

/**
 * Generate image prompt for a character
 */
export function generateCharacterImagePrompt(character: HNSCharacter): string {
  return `Portrait of ${character.character_name}, ${character.description}. ${character.role} character. Photorealistic, detailed, professional photography style.`;
}

/**
 * Generate image prompt for a setting
 */
export function generateSettingImagePrompt(setting: HNSSetting): string {
  return `${setting.setting_name}: ${setting.description}. ${setting.mood_atmosphere}. Cinematic, atmospheric, detailed environment art.`;
}