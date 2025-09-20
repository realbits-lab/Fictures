/**
 * HNS Story Generation Functions
 * Implements the Hierarchical Narrative Schema from the story specification
 */

import { generateText } from 'ai';
import { AI_MODELS } from './config';
import { nanoid } from 'nanoid';
import type {
  HNSStory,
  HNSPart,
  HNSChapter,
  HNSScene,
  HNSCharacter,
  HNSSetting,
  HNSDocument
} from '@/types/hns';

/**
 * Phase 1: Core Concept Generation (Story Object)
 * Creates one-sentence summary and foundational story elements
 */
export async function generateHNSStory(userPrompt: string, language: string = 'English'): Promise<HNSStory> {
  const { text } = await generateText({
    model: AI_MODELS.writing,
    system: `You are an expert story developer creating a story following the Hierarchical Narrative Schema (HNS).

Your task is to create a comprehensive story foundation based on the user's prompt.

Requirements:
1. Premise must be under 20 words - a single succinct sentence that encapsulates the entire novel
2. Dramatic question must be a yes/no question that drives the narrative
3. Theme should be a concise statement of the story's central message
4. Genre should be an array of 1-3 relevant genres
5. Create placeholder arrays for characters, settings, and parts (will be populated later)

Output JSON format:
{
  "story_id": "[generate unique id]",
  "story_title": "[compelling title]",
  "genre": ["primary_genre", "secondary_genre"],
  "premise": "[single sentence under 20 words tying together conflict and personal stakes]",
  "dramatic_question": "[central yes/no question, e.g., 'Will she save her sister?']",
  "theme": "[central message or underlying idea]",
  "characters": [],
  "settings": [],
  "parts": []
}

Language preference: ${language}`,
    prompt: userPrompt,
    temperature: 0.9,
  });

  try {
    const storyData = JSON.parse(text);
    return {
      ...storyData,
      story_id: storyData.story_id || `story_${nanoid()}`,
    };
  } catch (error) {
    console.error('Error parsing story JSON:', error);
    throw new Error('Failed to generate story foundation');
  }
}

/**
 * Phase 2: Act-Level Structuring (Part Objects)
 * Expands premise into three-act structure with key narrative beats
 */
export async function generateHNSParts(story: HNSStory): Promise<HNSPart[]> {
  const { text } = await generateText({
    model: AI_MODELS.writing,
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

Output JSON format:
[
  {
    "part_id": "part_001",
    "part_title": "Part I: [Descriptive Title]",
    "structural_role": "Act 1: Setup",
    "summary": "[One paragraph describing main movements and developments]",
    "key_beats": ["Exposition", "Inciting Incident", "Plot Point One"],
    "chapters": []
  },
  {
    "part_id": "part_002",
    "part_title": "Part II: [Descriptive Title]",
    "structural_role": "Act 2: Confrontation",
    "summary": "[One paragraph describing main movements and developments]",
    "key_beats": ["Rising Action", "Midpoint", "Plot Point Two"],
    "chapters": []
  },
  {
    "part_id": "part_003",
    "part_title": "Part III: [Descriptive Title]",
    "structural_role": "Act 3: Resolution",
    "summary": "[One paragraph describing main movements and developments]",
    "key_beats": ["Climax", "Falling Action", "Resolution"],
    "chapters": []
  }
]`,
    prompt: 'Generate three-act structure',
    temperature: 0.8,
  });

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing parts JSON:', error);
    throw new Error('Failed to generate story parts');
  }
}

/**
 * Phase 3: Character Conception (Character Objects)
 * Creates detailed character profiles with psychological complexity
 */
export async function generateHNSCharacters(story: HNSStory, parts: HNSPart[]): Promise<HNSCharacter[]> {
  const { text } = await generateText({
    model: AI_MODELS.writing,
    system: `You are creating detailed character profiles following the Hierarchical Narrative Schema.

Story Context:
- Title: ${story.story_title}
- Premise: ${story.premise}
- Theme: ${story.theme}
- Genre: ${story.genre.join(', ')}

Act Summaries:
${parts.map(p => `${p.structural_role}: ${p.summary}`).join('\n')}

Create 4-6 main characters with diverse roles. Include:
1. Protagonist (the main character driving the story)
2. Antagonist (the primary opposition)
3. Mentor or ally (supportive character)
4. Additional key characters as needed

For each character, provide comprehensive details following this structure:

Output JSON format:
[
  {
    "character_id": "char_[name]_001",
    "name": "[Full character name]",
    "role": "[protagonist/antagonist/mentor/ally/neutral]",
    "archetype": "[e.g., reluctant_hero, trickster, sage]",
    "summary": "[Brief description and role in story]",
    "storyline": "[Character's complete narrative journey]",
    "personality": {
      "traits": ["trait1", "trait2", "trait3", "trait4"],
      "myers_briggs": "[MBTI type]",
      "enneagram": "[Type # - Label]"
    },
    "backstory": {
      "childhood": "[Formative years and key events]",
      "education": "[Academic and training background]",
      "career": "[Professional history]",
      "relationships": "[Key connections]",
      "trauma": "[Defining wounds or losses]"
    },
    "motivations": {
      "primary": "[Main driving goal]",
      "secondary": "[Supporting objectives]",
      "fear": "[Core anxieties]"
    },
    "voice": {
      "speech_pattern": "[How they structure sentences]",
      "vocabulary": "[Word choice level]",
      "verbal_tics": ["tic1", "tic2"],
      "internal_voice": "[Thought patterns]"
    },
    "physical_description": {
      "age": [number],
      "ethnicity": "[Cultural background]",
      "height": "[Physical stature]",
      "build": "[Body type]",
      "hair_style_color": "[Hair appearance]",
      "eye_color": "[Eye characteristics]",
      "facial_features": "[Distinctive features]",
      "distinguishing_marks": "[Unique identifiers]",
      "typical_attire": "[Standard clothing]"
    }
  }
]`,
    prompt: 'Generate main characters',
    temperature: 0.9,
  });

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing characters JSON:', error);
    throw new Error('Failed to generate characters');
  }
}

/**
 * Phase 4: Setting Development (Setting Objects)
 * Creates immersive locations with sensory details
 */
export async function generateHNSSettings(story: HNSStory, parts: HNSPart[]): Promise<HNSSetting[]> {
  const { text } = await generateText({
    model: AI_MODELS.writing,
    system: `You are creating detailed settings following the Hierarchical Narrative Schema.

Story Context:
- Title: ${story.story_title}
- Genre: ${story.genre.join(', ')}
- Theme: ${story.theme}

Create 3-5 key settings where the story takes place. Include varied locations that support different narrative moments.

For each setting, provide rich sensory details:

Output JSON format:
[
  {
    "setting_id": "setting_[name]_001",
    "name": "[Location name]",
    "description": "[Comprehensive paragraph describing the location]",
    "mood": "[Atmospheric quality, e.g., 'oppressive', 'serene', 'bustling']",
    "sensory": {
      "sight": ["visual detail 1", "visual detail 2", "visual detail 3"],
      "sound": ["auditory element 1", "auditory element 2"],
      "smell": ["olfactory detail 1", "olfactory detail 2"],
      "touch": ["tactile sensation 1", "tactile sensation 2"],
      "taste": ["optional taste element"]
    },
    "visual_style": "[Artistic direction, e.g., 'dark fantasy', 'cyberpunk', 'pastoral']",
    "visual_references": ["reference 1", "reference 2"],
    "color_palette": ["dominant color 1", "dominant color 2", "accent color"],
    "architectural_style": "[Structural design language]"
  }
]`,
    prompt: 'Generate key settings',
    temperature: 0.8,
  });

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing settings JSON:', error);
    throw new Error('Failed to generate settings');
  }
}

/**
 * Phase 5: Chapter-Level Expansion (Chapter Objects)
 * Breaks each part into chapters with hooks and pacing
 */
export async function generateHNSChapters(story: HNSStory, part: HNSPart, chapterCount: number = 5): Promise<HNSChapter[]> {
  const { text } = await generateText({
    model: AI_MODELS.writing,
    system: `You are creating detailed chapters for a story part following the Hierarchical Narrative Schema.

Story Context:
- Title: ${story.story_title}
- Part: ${part.part_title}
- Role: ${part.structural_role}
- Summary: ${part.summary}
- Key Beats: ${part.key_beats.join(', ')}

Create ${chapterCount} chapters that:
1. Advance the plot through the key beats
2. Each have a compelling hook for reader retention
3. Vary pacing appropriately
4. Balance action and dialogue

Output JSON format:
[
  {
    "chapter_id": "chap_[number]",
    "chapter_number": [sequential number],
    "chapter_title": "[Compelling chapter title]",
    "part_ref": "${part.part_id}",
    "summary": "[Detailed paragraph of chapter events]",
    "pacing_goal": "[fast/medium/slow/reflective]",
    "action_dialogue_ratio": "[e.g., 40:60]",
    "chapter_hook": {
      "type": "[revelation/danger/decision/question/emotional_turning_point]",
      "description": "[Specific hook content]",
      "urgency_level": "[high/medium/low]"
    },
    "scenes": []
  }
]`,
    prompt: `Generate ${chapterCount} chapters for ${part.part_title}`,
    temperature: 0.8,
  });

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing chapters JSON:', error);
    throw new Error('Failed to generate chapters');
  }
}

/**
 * Phase 6: Scene Breakdown (Scene Objects)
 * Creates discrete scenes with goals, conflicts, and emotional shifts
 */
export async function generateHNSScenes(
  chapter: HNSChapter,
  characters: HNSCharacter[],
  settings: HNSSetting[],
  sceneCount: number = 3
): Promise<HNSScene[]> {
  const { text } = await generateText({
    model: AI_MODELS.writing,
    system: `You are creating detailed scenes following the Hierarchical Narrative Schema's Scene-Sequel model.

Chapter Context:
- Title: ${chapter.chapter_title}
- Summary: ${chapter.summary}
- Pacing Goal: ${chapter.pacing_goal}
- Chapter Hook: ${chapter.chapter_hook.description}

Available Characters:
${characters.map(c => `- ${c.name} (${c.role}): ${c.summary}`).join('\n')}

Available Settings:
${settings.map(s => `- ${s.name}: ${s.mood}`).join('\n')}

Create ${sceneCount} scenes that:
1. Each have a clear goal, conflict, and outcome
2. Show emotional progression in POV character
3. Advance toward the chapter hook
4. Follow Scene-Sequel structure (goal → conflict → outcome)

Output JSON format:
[
  {
    "scene_id": "scene_[number]",
    "scene_number": [sequential number],
    "chapter_ref": "${chapter.chapter_id}",
    "character_ids": ["char_id1", "char_id2"],
    "setting_id": "setting_id",
    "pov_character_id": "char_id",
    "narrative_voice": "[third_person_limited/first_person/third_person_omniscient]",
    "summary": "[One-sentence scene description]",
    "entry_hook": "[Opening line or action for engagement]",
    "goal": "[What POV character wants to achieve]",
    "conflict": "[Obstacle preventing easy achievement]",
    "outcome": "[success/failure/success_with_cost/failure_with_discovery]",
    "emotional_shift": {
      "from": "[starting emotional state]",
      "to": "[ending emotional state]"
    }
  }
]`,
    prompt: `Generate ${sceneCount} scenes`,
    temperature: 0.8,
  });

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing scenes JSON:', error);
    throw new Error('Failed to generate scenes');
  }
}

/**
 * Complete HNS Document Generation
 * Orchestrates all phases to create a full story structure
 */
export async function generateCompleteHNS(userPrompt: string, language: string = 'English'): Promise<HNSDocument> {
  console.log('🚀 Starting HNS story generation...');

  // Phase 1: Story Foundation
  console.log('Phase 1: Generating story foundation...');
  const story = await generateHNSStory(userPrompt, language);

  // Phase 2: Three-Act Structure
  console.log('Phase 2: Generating three-act structure...');
  const parts = await generateHNSParts(story);

  // Phase 3: Character Development
  console.log('Phase 3: Generating characters...');
  const characters = await generateHNSCharacters(story, parts);

  // Phase 4: Setting Development
  console.log('Phase 4: Generating settings...');
  const settings = await generateHNSSettings(story, parts);

  // Update story with character and setting references
  story.characters = characters.map(c => c.character_id);
  story.settings = settings.map(s => s.setting_id);
  story.parts = parts.map(p => p.part_id);

  // Phase 5 & 6: Generate chapters and scenes for each part
  console.log('Phase 5 & 6: Generating chapters and scenes...');
  const allChapters: HNSChapter[] = [];
  const allScenes: HNSScene[] = [];

  for (const part of parts) {
    const chapters = await generateHNSChapters(story, part, 5);

    for (const chapter of chapters) {
      const scenes = await generateHNSScenes(chapter, characters, settings, 3);
      chapter.scenes = scenes.map(s => s.scene_id);
      allScenes.push(...scenes);
    }

    part.chapters = chapters.map(c => c.chapter_id);
    allChapters.push(...chapters);
  }

  console.log('✅ HNS generation complete!');

  return {
    story,
    parts,
    chapters: allChapters,
    scenes: allScenes,
    characters,
    settings
  };
}

/**
 * Generate Gemini image prompts from HNS data
 */
export function generateCharacterImagePrompt(character: HNSCharacter): string {
  const { name, physical_description: pd } = character;

  return `A photorealistic portrait of ${name}, a ${pd.age}-year-old ${pd.ethnicity} person with ${pd.build} build.
They have ${pd.hair_style_color} and ${pd.eye_color} eyes with ${pd.facial_features}.
Notable features include ${pd.distinguishing_marks}.
They wear ${pd.typical_attire}, reflecting their role as ${character.archetype}.
Their expression shows ${character.personality.traits[0]} and ${character.personality.traits[1]} personality.
Shot with an 85mm portrait lens, soft natural lighting, professional photography style.`;
}

export function generateSettingImagePrompt(setting: HNSSetting): string {
  return `A ${setting.visual_style} wide establishing shot of ${setting.name}: ${setting.description}.
The architecture features ${setting.architectural_style} design elements.
The scene shows ${setting.sensory.sight[0]} in the foreground and ${setting.sensory.sight[1]} in the background.
The atmosphere feels ${setting.mood}, with ${setting.sensory.sound[0]} implied through visual elements.
Color palette dominated by ${setting.color_palette[0]}, ${setting.color_palette[1]}, and ${setting.color_palette[2]}.
Photographic style inspired by ${setting.visual_references[0]}.
Wide-angle lens perspective capturing the full environment.`;
}