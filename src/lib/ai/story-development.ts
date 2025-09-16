import { generateText } from 'ai';
import * as yaml from 'js-yaml';
import { AI_MODELS } from './config';
import { type Story, type PartSpecification, type ChapterSpecification, type SceneSpecification } from './schemas';

// Helper function to extract YAML content from markdown code blocks
function extractYamlFromText(text: string): string {
  // Remove markdown code fences if present
  const yamlBlockRegex = /^```ya?ml\s*\n([\s\S]*?)\n```$/m;
  const match = text.match(yamlBlockRegex);

  if (match) {
    return match[1]; // Return content between code fences
  }

  // If no code fences, return original text (might already be clean YAML)
  return text.trim();
}

// Phase 1: Story Foundation
export async function storyConceptDevelopment(userPrompt: string, language: string = 'English'): Promise<Story> {
  const { text } = await generateText({
    model: AI_MODELS.writing,
    system: `You are an expert story developer implementing Phase 1: Story Foundation.

Create a story concept in YAML format following this EXACT structure (use only keys, no example values):

---
title: [story title derived from user prompt]
genre: [genre that matches the story]
words: [target word count]
question: [central dramatic question]
goal: [protagonist overall goal]
conflict: [main obstacle]
outcome: [resolution]
chars:
  protag:
    role: "protag"
    arc: [character transformation]
    flaw: [character weakness]
    goal: [character desire]
    secret: [hidden aspect]
  antag:
    role: "antag"
    arc: [character transformation]
    flaw: [character weakness]
    goal: [character desire]
    secret: [hidden aspect]
  mentor:
    role: "mentor"
    arc: [character transformation]
    flaw: [character weakness]
    goal: [character desire]
    secret: [hidden aspect]
  catalyst:
    role: "catalyst"
    arc: [character transformation]
    flaw: [character weakness]
    goal: [character desire]
    secret: [hidden aspect]
themes:
  - [theme 1]
  - [theme 2]
  - [theme 3]
structure:
  type: "3_part"
  parts:
    - [part 1 description]
    - [part 2 description]
    - [part 3 description]
  dist: [25, 50, 25]
setting:
  primary:
    - [main location 1]
    - [main location 2]
  secondary:
    - [secondary location 1]
    - [secondary location 2]
parts:
  - part: 1
    goal: [part goal]
    conflict: [part conflict]
    outcome: [part outcome]
    tension: [tension type]
  - part: 2
    goal: [part goal]
    conflict: [part conflict]
    outcome: [part outcome]
    tension: [tension type]
  - part: 3
    goal: [part goal]
    conflict: [part conflict]
    outcome: [part outcome]
    tension: [tension type]
serial:
  schedule: "weekly"
  duration: [schedule duration]
  chapter_words: 3000
  breaks:
    - [break 1]
    - [break 2]
  buffer: "2 weeks"
hooks:
  overarching:
    - [hook 1]
    - [hook 2]
  mysteries:
    - [mystery 1]
    - [mystery 2]
  part_endings:
    - [part 1 hook]
    - [part 2 hook]
    - [part 3 hook]
language: "${language}"
---

CRITICAL REQUIREMENTS:
- Deeply analyze the user's prompt to extract story essence, characters, conflict, and setting
- Character names must match the target language (Korean names for Korean, Japanese for Japanese, etc.)
- All story elements must logically connect to the user's specific prompt
- Create culturally appropriate settings and themes for the target language
- serial.schedule must be exactly: "weekly", "daily", or "monthly"
- You can add more key/value pairs to YAML data if needed for better story development
- Output must be valid YAML format`,
    prompt: `Analyze this user story prompt deeply: "${userPrompt}"
Target language: ${language}

Create a complete story concept that:
1. Extracts the core conflict, characters, and setting from the user's prompt
2. Uses culturally appropriate character names for ${language}
3. Develops themes that resonate with the prompt's essence
4. Creates settings that match the story world described in the prompt
5. Ensures all elements serve the user's original story vision

Generate the YAML story structure now.`,
  });

  // Parse YAML and return as Story object
  try {
    const cleanYaml = extractYamlFromText(text);
    const storyData = yaml.load(cleanYaml) as Story;
    return storyData;
  } catch (error) {
    console.error('Failed to parse YAML story data:', error);
    console.error('Raw text:', text);
    throw new Error(`Invalid YAML output: ${error}`);
  }
}

// Phase 2: Structural Development - Generate detailed part specifications
export async function generatePartSpecifications(storyConcept: Story): Promise<PartSpecification[]> {
  const partSpecs: PartSpecification[] = [];

  for (let i = 0; i < storyConcept.parts.length; i++) {
    const storyPart = storyConcept.parts[i];

    const { text } = await generateText({
      model: AI_MODELS.writing,
      system: `You are implementing Phase 2: Structural Development.

Create detailed part specifications in YAML format following this structure (no example values):

---
part: [part number]
title: [part title]
words: [part word count]
function: [part function in story]
goals: [part goals]
conflict: [part conflict]
outcome: [part outcome]
questions:
  primary: [primary question for this part]
  secondary: [secondary question for this part]
chars:
  protag:
    name: [character name appropriate for language]
    start: [starting state]
    end: [ending state]
    arc:
      - [arc step]
      - [arc step]
    development: [character development]
    conflict: [character conflict]
    transforms:
      - [transformation]
      - [transformation]
    function: [character function in part]
  antag:
    name: [character name appropriate for language]
    start: [starting state]
    end: [ending state]
    arc:
      - [arc step]
      - [arc step]
    development: [character development]
    conflict: [character conflict]
    transforms:
      - [transformation]
      - [transformation]
    function: [character function in part]
plot:
  events:
    - [event]
    - [event]
  reveals:
    - [reveal]
    - [reveal]
  escalation:
    - [escalation]
    - [escalation]
themes:
  primary: [primary theme]
  elements:
    - [theme element]
    - [theme element]
  moments:
    - [theme moment]
    - [theme moment]
  symbols:
    - [symbol]
    - [symbol]
emotion:
  start: [starting emotion]
  progression:
    - [emotion step]
    - [emotion step]
  end: [ending emotion]
ending:
  resolution:
    - [resolution]
    - [resolution]
  setup:
    - [setup]
    - [setup]
  hooks:
    - [hook]
    - [hook]
  hook_out: [ending hook]
serial:
  arc: [serial arc]
  climax_at: [climax point]
  satisfaction:
    - [satisfaction element]
    - [satisfaction element]
  anticipation:
    - [anticipation element]
    - [anticipation element]
  chapter_words: 3000
engagement:
  discussions:
    - [discussion topic]
    - [discussion topic]
  speculation:
    - [speculation]
    - [speculation]
  debates:
    - [debate topic]
    - [debate topic]
  feedback:
    - [feedback area]
    - [feedback area]
---

REQUIREMENTS:
- Character names must match the story's target language and culture
- All elements must connect to the user's original prompt and story concept
- Focus on character development that serves the story's central conflict
- You can add more key/value pairs to YAML data if needed for better part development`,
      prompt: `Story concept: ${JSON.stringify(storyConcept, null, 2)}

Current part to develop: Part ${storyPart.part}
- Goals: ${storyPart.goal}
- Conflict: ${storyPart.conflict}
- Outcome: ${storyPart.outcome}

Create detailed part specification in YAML format for Part ${storyPart.part}. Include character development, plot progression, themes, and reader engagement elements.`,
    });

    try {
      const cleanYaml = extractYamlFromText(text);
      const partSpec = yaml.load(cleanYaml) as PartSpecification;
      partSpecs.push(partSpec);
    } catch (error) {
      console.error(`Failed to parse YAML part specification for Part ${storyPart.part}:`, error);
      console.error('Raw text:', text);
      throw new Error(`Invalid YAML output for Part ${storyPart.part}: ${error}`);
    }
  }

  return partSpecs;
}

// Phase 3: Chapter Generation
export async function generateChapterSpecifications(storyConcept: Story, partSpec: PartSpecification, chapterCount: number = 5): Promise<ChapterSpecification[]> {
  const chapters: ChapterSpecification[] = [];

  for (let i = 1; i <= chapterCount; i++) {
    const { text } = await generateText({
      model: AI_MODELS.writing,
      system: `You are implementing Chapter Generation.

Create detailed chapter specifications in YAML format following this structure:

---
chap: 1
title: "Chapter Title"
pov: "POV Character"
words: 3000
goal: "Chapter goal"
conflict: "Chapter conflict"
outcome: "Chapter outcome"
acts:
  setup:
    hook_in: "Opening hook"
    orient: "Orientation"
    incident: "Inciting incident"
  confrontation:
    rising: "Rising action"
    midpoint: "Midpoint"
    complicate: "Complication"
  resolution:
    climax: "Chapter climax"
    resolve: "Resolution"
    hook_out: "Ending hook"
chars:
  protag:
    start: "Starting state"
    arc: "Character arc"
    end: "Ending state"
    motivation: "Character motivation"
    growth: "Character growth"
  antag:
    start: "Starting state"
    arc: "Character arc"
    end: "Ending state"
    motivation: "Character motivation"
    growth: "Character growth"
tension:
  external: "External tension"
  internal: "Internal tension"
  interpersonal: "Interpersonal tension"
  atmospheric: "Atmospheric tension"
  peak: "Tension peak"
mandate:
  episodic:
    arc: "Episodic arc"
    payoff: "Chapter payoff"
    answered: "Questions answered"
  serial:
    complication: "Serial complication"
    stakes: "Raised stakes"
    compulsion: "Forward compulsion"
hook:
  type: "revelation"  # revelation, threat, emotional, compound
  reveal: "Revelation content"
  threat: "Threat content"
  emotion: "Emotional content"
continuity:
  foreshadow:
    - "Foreshadowing 1"
    - "Foreshadowing 2"
  theories:
    - "Reader theory 1"
    - "Reader theory 2"
genre: "Chapter genre"
pacing: "Pacing description"
exposition: "Exposition approach"
---

Generate detailed chapters that fulfill episodic satisfaction while building serial momentum.`,
      prompt: `Story concept: ${JSON.stringify(storyConcept, null, 2)}

Part specification: ${JSON.stringify(partSpec, null, 2)}

Generate Chapter ${i} of Part ${partSpec.part} (${partSpec.title}).
This chapter should advance the part's goals while being self-contained.
Target word count: ${storyConcept.serial.chapter_words} words
POV character should be the main protagonist: ${Object.keys(storyConcept.chars).find(k => storyConcept.chars[k].role === 'protag')}`,
    });

    try {
      const cleanYaml = extractYamlFromText(text);
      const chapterSpec = yaml.load(cleanYaml) as ChapterSpecification;
      chapters.push(chapterSpec);
    } catch (error) {
      console.error(`Failed to parse YAML chapter specification for Chapter ${i}:`, error);
      console.error('Raw text:', text);
      throw new Error(`Invalid YAML output for Chapter ${i}: ${error}`);
    }
  }

  return chapters;
}

// Phase 4: Scene Generation
export async function generateSceneSpecifications(chapterSpec: ChapterSpecification, sceneCount: number = 3): Promise<SceneSpecification[]> {
  const scenes: SceneSpecification[] = [];

  for (let i = 1; i <= sceneCount; i++) {
    const { text } = await generateText({
      model: AI_MODELS.writing,
      system: `You are implementing Scene Generation.

Create detailed scene specifications in YAML format following this structure:

---
id: 1
summary: "Scene summary"
time: "Scene time"
place: "Scene location"
pov: "POV character"
characters:
  protag:
    enters: "How character enters"
    exits: "How character exits"
    status: "Character status"
    evidence: "Evidence character provides"
  antag:
    enters: "How character enters"
    exits: "How character exits"
    status: "Character status"
    evidence: "Evidence character provides"
goal: "Scene goal"
obstacle: "Scene obstacle"
outcome: "Scene outcome"
beats:
  - "Beat 1"
  - "Beat 2"
  - "Beat 3"
shift: "Emotional/value shift through scene"
leads_to: "What this leads to"
image_prompt: "Visual description for scene visualization"
---

Generate detailed scenes that serve as complete dramatic units while advancing the chapter.`,
      prompt: `Chapter specification: ${JSON.stringify(chapterSpec, null, 2)}

Generate Scene ${i} of Chapter ${chapterSpec.chap}.
This scene should contribute to the chapter's three-act structure:
- Act 1 (Setup): Scene 1
- Act 2 (Confrontation): Scenes 2-3
- Act 3 (Resolution): Final scene

Scene ${i} function within chapter structure.`,
    });

    try {
      const cleanYaml = extractYamlFromText(text);
      const sceneSpec = yaml.load(cleanYaml) as SceneSpecification;
      scenes.push(sceneSpec);
    } catch (error) {
      console.error(`Failed to parse YAML scene specification for Scene ${i}:`, error);
      console.error('Raw text:', text);
      throw new Error(`Invalid YAML output for Scene ${i}: ${error}`);
    }
  }

  return scenes;
}

// Generate character data from story concept
export async function generateCharacterData(storyConcept: Story, language: string = 'English') {
  const characters = [];

  for (const [key, char] of Object.entries(storyConcept.chars)) {
    const { text } = await generateText({
      model: AI_MODELS.writing,
      system: `Generate detailed character data in YAML format for story development.

Structure:
---
name: [character name appropriate for ${language} language]
role: [character role]
description: [physical description]
personality: [personality traits]
background: [character history]
motivations: [what drives them]
flaws: [character weaknesses]
strengths: [character strengths]
relationships: [connections to other characters]
arc: [character development arc]
dialogue_style: [how they speak]
secrets: [hidden aspects]
goals: [what they want]
conflicts: [internal/external conflicts]
---

REQUIREMENTS:
- Name must be culturally appropriate for ${language}
- All details must connect to the user's story concept
- Character should feel authentic to the story's world
- You can add more key/value pairs to YAML data if needed for richer character development`,
      prompt: `Create detailed character data for: ${char.role}
Story context: ${storyConcept.title} - ${storyConcept.genre}
Story language: ${language}
Character info from story concept: ${JSON.stringify(char, null, 2)}

Generate comprehensive character details in YAML format.`
    });

    try {
      const cleanYaml = extractYamlFromText(text);
      characters.push({
        id: key,
        content: cleanYaml,
        parsedData: yaml.load(cleanYaml)
      });
    } catch (error) {
      console.error(`Failed to parse character YAML for ${key}:`, error);
    }
  }

  return characters;
}

// Generate place data from story concept
export async function generatePlaceData(storyConcept: Story, language: string = 'English') {
  const places = [];
  const allPlaces = [...(storyConcept.setting?.primary || []), ...(storyConcept.setting?.secondary || [])];

  for (const place of allPlaces) {
    const { text } = await generateText({
      model: AI_MODELS.writing,
      system: `Generate detailed location data in YAML format for story development.

Structure:
---
name: [location name]
type: [location type]
description: [detailed description]
atmosphere: [mood and feeling]
significance: [importance to story]
culture: [cultural aspects appropriate for ${language}]
history: [location background]
details: [specific features]
connections: [how it relates to plot/characters]
sensory: [sounds, smells, textures]
accessibility: [how characters reach it]
secrets: [hidden aspects]
---

REQUIREMENTS:
- Location must be culturally appropriate for ${language}
- Details must serve the story's plot and themes
- Should enhance the story's atmosphere
- You can add more key/value pairs to YAML data if needed for more detailed location development`,
      prompt: `Create detailed location data for: ${place}
Story context: ${storyConcept.title} - ${storyConcept.genre}
Story language: ${language}

Generate comprehensive location details in YAML format.`
    });

    try {
      const cleanYaml = extractYamlFromText(text);
      places.push({
        name: place,
        content: cleanYaml,
        parsedData: yaml.load(cleanYaml)
      });
    } catch (error) {
      console.error(`Failed to parse place YAML for ${place}:`, error);
    }
  }

  return places;
}

// Main story development workflow
export async function generateStoryFromPrompt(userPrompt: string, userId: string, language: string = 'English') {
  console.log('🚀 Starting story development process...');

  // Phase 1: Story Foundation
  console.log('Phase 1: Story Foundation');
  const storyConcept = await storyConceptDevelopment(userPrompt, language);
  console.log('✅ Story concept developed');

  // Phase 2: Part Development
  console.log('Phase 2: Part Development');
  const partSpecs = await generatePartSpecifications(storyConcept);
  console.log('✅ Part specifications completed');

  // Phase 3: Character Development
  console.log('Phase 3: Character Development');
  const characters = await generateCharacterData(storyConcept, language);
  console.log('✅ Character data generated');

  // Phase 4: Place Development
  console.log('Phase 4: Place Development');
  const places = await generatePlaceData(storyConcept, language);
  console.log('✅ Place data generated');

  // Add metadata and structure the complete story
  const completeStory = {
    ...storyConcept,
    userId,
    createdAt: new Date(),
    partSpecifications: partSpecs,
    characters,
    places,
    developmentPhases: {
      phase1_story: storyConcept,
      phase2_parts: partSpecs,
      phase3_characters: characters,
      phase4_places: places,
    }
  };

  console.log('🎉 Story development completed successfully!');

  return completeStory;
}

// Helper functions for generating individual parts/chapters/scenes
export { storyConceptDevelopment as generateStory };
export { generatePartSpecifications as generateParts };
export { generateChapterSpecifications as generateChapters };
export { generateSceneSpecifications as generateScenes };