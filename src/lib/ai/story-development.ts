import { generateText } from 'ai';
import * as yaml from 'js-yaml';
import { AI_MODELS } from './config';
import { type Story, type PartSpecification, type ChapterSpecification, type SceneSpecification } from './schemas';
import { db } from '@/lib/db';
import { stories, parts, characters, places } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { RelationshipManager } from '@/lib/db/relationships';
import { generateStoryImage } from '@/lib/services/image-generation';

// Helper function to extract and clean YAML content from markdown code blocks
function extractYamlFromText(text: string): string {
  // Remove markdown code fences if present
  const yamlBlockRegex = /^```ya?ml\s*\n([\s\S]*?)\n```$/m;
  const match = text.match(yamlBlockRegex);

  let yamlContent = match ? match[1] : text.trim();

  // Clean up common YAML formatting issues
  yamlContent = cleanYamlContent(yamlContent);

  return yamlContent;
}

// Helper function to clean and fix common YAML formatting issues
function cleanYamlContent(yamlContent: string): string {
  const lines = yamlContent.split('\n');
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Skip empty lines at the beginning
    if (cleanedLines.length === 0 && line.trim() === '') {
      continue;
    }

    // Fix common array item indentation issues
    if (line.trim().startsWith('- ') && line.includes('"')) {
      // Ensure proper indentation for array items with quotes
      const indentMatch = line.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      const content = line.trim();

      // If the content looks malformed (e.g., "- some text", instead of proper YAML)
      if (content.match(/^-\s+"[^"]*",?\s*$/)) {
        // Clean up trailing commas and ensure proper YAML format
        const cleanContent = content.replace(/,$/, '').replace(/^-\s+"([^"]*)"$/, '- "$1"');
        line = indent + cleanContent;
      }
    }

    // Fix malformed array items in feedback sections
    if (line.includes('- "') && line.includes('",')) {
      line = line.replace(/",\s*$/, '"');
    }

    // Remove trailing commas that break YAML
    if (line.trim().endsWith(',') && !line.includes('"')) {
      line = line.replace(/,\s*$/, '');
    }

    cleanedLines.push(line);
  }

  return cleanedLines.join('\n');
}

// Phase 1: Story Foundation
export async function storyConceptDevelopment(userPrompt: string, language: string = 'English'): Promise<Story> {
  const { text } = await generateText({
    model: AI_MODELS.writing,
    system: `You are an expert story developer implementing Phase 1: Story Foundation.

Create a story concept in YAML format following this EXACT structure (use only keys, no example values):

---
title: [story title derived from user prompt]
genre: [MUST be ONE of: Fantasy, Science Fiction, Romance, Mystery, Thriller, Detective, Adventure]
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
- Output must be valid YAML format - NO semicolons, proper indentation, quotes around string values
- All string values must be properly quoted and indented`,
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
- You can add more key/value pairs to YAML data if needed for better part development
- Output must be valid YAML format - NO semicolons, proper indentation, quotes around string values
- For arrays, use proper YAML format: each item on new line with "- " prefix, NO trailing commas
- Example: discussions:\n    - "Topic 1"\n    - "Topic 2"`,
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

      // Create fallback part specification instead of failing
      const fallbackPartSpec: PartSpecification = {
        part: storyPart.part,
        title: `Part ${storyPart.part}: ${storyPart.goal}`,
        words: Math.floor((storyConcept.words || 60000) / storyConcept.parts.length),
        function: `Develops the story through Part ${storyPart.part}`,
        goals: storyPart.goal,
        conflict: storyPart.conflict,
        outcome: storyPart.outcome,
        questions: {
          primary: "What will happen in this part of the story?",
          secondary: "How will the characters develop?"
        },
        chars: {
          protag: {
            name: "Protagonist",
            start: "Beginning state",
            end: "Changed state",
            arc: ["Character development arc"],
            development: "Character grows and changes",
            conflict: "Internal and external challenges",
            transforms: ["Key transformation"],
            function: "Drives the story forward"
          }
        },
        plot: {
          events: [`Events for Part ${storyPart.part}`],
          reveals: [`Revelations in Part ${storyPart.part}`],
          escalation: [`Escalation in Part ${storyPart.part}`]
        },
        themes: {
          primary: "Main theme",
          elements: ["Theme elements"],
          moments: ["Key thematic moments"],
          symbols: ["Symbolic elements"]
        },
        emotion: {
          start: "Initial emotional state",
          progression: ["Emotional journey"],
          end: "Final emotional state"
        },
        ending: {
          resolution: [`Resolution for Part ${storyPart.part}`],
          setup: [`Setup for next part`],
          hooks: [`Hooks to continue reading`],
          hook_out: "Ending hook"
        },
        serial: {
          arc: "Part arc in serial",
          climax_at: "Climactic moment",
          satisfaction: ["Satisfying elements"],
          anticipation: ["Elements building anticipation"],
          chapter_words: storyConcept.serial?.chapter_words || 3000
        },
        engagement: {
          discussions: ["Discussion topics"],
          speculation: ["Speculation points"],
          debates: ["Debate topics"],
          feedback: ["Feedback areas"]
        }
      };

      console.log(`✅ Created fallback part specification for Part ${storyPart.part}`);
      partSpecs.push(fallbackPartSpec);
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
export async function generateSceneSpecifications(chapterSpec: ChapterSpecification, storyCharacters: any[] = [], storyPlaces: any[] = [], sceneCount: number = 3): Promise<SceneSpecification[]> {
  const scenes: SceneSpecification[] = [];

  for (let i = 1; i <= sceneCount; i++) {
    const { text } = await generateText({
      model: AI_MODELS.writing,
      system: `You are implementing Scene Generation.

Create detailed scene specifications in YAML format following this structure:

---
id: [scene number]
summary: [scene summary]
time: [scene time]
place_name: [specific location from story places]
place_id: [will be filled by system]
pov: [POV character name]
character_names:
  - [character name 1]
  - [character name 2]
character_ids: [will be filled by system]
characters:
  [character_name]:
    enters: [how character enters]
    exits: [how character exits]
    status: [character status]
    evidence: [evidence character provides]
goal: [scene goal]
obstacle: [scene obstacle]
outcome: [scene outcome]
beats:
  - [beat 1]
  - [beat 2]
  - [beat 3]
shift: [emotional/value shift through scene]
leads_to: [what this leads to]
image_prompt: [visual description for scene visualization]
---

REQUIREMENTS:
- Each scene must include at least one character and one place from the story
- Use actual character names and place names from the story context
- Characters and places must be relevant to the scene's purpose
- Generate detailed scenes that serve as complete dramatic units while advancing the chapter
- You can add more key/value pairs to YAML data if needed for richer scene development
- Output must be valid YAML format - NO semicolons, proper indentation, quotes around string values
- For arrays, use proper YAML format: each item on new line with "- " prefix, NO trailing commas
- Example: discussions:\n    - "Topic 1"\n    - "Topic 2"`,
      prompt: `Chapter specification: ${JSON.stringify(chapterSpec, null, 2)}

Available characters: ${storyCharacters.map(c => `${c.parsedData?.name || c.id} (${c.parsedData?.role || c.id})`).join(', ') || 'No characters available'}

Available places: ${storyPlaces.map(p => p.parsedData?.name || p.name).join(', ') || 'No places available'}

Generate Scene ${i} of Chapter ${chapterSpec.chap}.
This scene should contribute to the chapter's three-act structure:
- Act 1 (Setup): Scene 1
- Act 2 (Confrontation): Scenes 2-3
- Act 3 (Resolution): Final scene

Scene ${i} function within chapter structure. Must include at least one character and one place from the available lists above.`,
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

// Generate character data from story concept (Parallel)
export async function generateCharacterData(storyConcept: Story, language: string = 'English') {
  const characterPromises = Object.entries(storyConcept.chars).map(async ([key, char]) => {
    try {
      const { text } = await generateText({
        model: AI_MODELS.writing,
        messages: [
          {
            role: 'system',
            content: `Generate detailed character data in YAML format for story development.

Structure:
---
name: "Character Name"
role: "Character Role"
summary: "Physical description in one line"
personality: "Personality traits in one line"
background: "Character history in one line"
motivations: "What drives them in one line"
flaws: "Character weaknesses in one line"
strengths: "Character strengths in one line"
relationships: "Connections to other characters in one line"
arc: "Character development arc in one line"
dialogue_style: "How they speak in one line"
secrets: "Hidden aspects in one line"
goals: "What they want in one line"
conflicts: "Internal/external conflicts in one line"
---

CRITICAL YAML REQUIREMENTS:
- ALL values must be quoted strings on single lines
- NO multi-line values or complex nested structures
- NO colons (:) inside quoted values
- Use simple, flat YAML structure only
- Keep descriptions concise and in single sentences
- Name must be culturally appropriate for ${language}
- All details must connect to the user's story concept
- Output must be valid, parseable YAML format`
          },
          {
            role: 'user',
            content: `Create detailed character data for: ${char.role}
Story context: ${storyConcept.title} - ${storyConcept.genre}
Story language: ${language}
Character info from story concept: ${JSON.stringify(char, null, 2)}

Generate comprehensive character details in YAML format.`
          }
        ]
      });

      const cleanYaml = extractYamlFromText(text);
      let parsedData: any;
      try {
        parsedData = yaml.load(cleanYaml);
      } catch (yamlError) {
        console.error(`Failed to parse character YAML for ${key}:`, yamlError);
        // Create fallback parsed data
        parsedData = {
          name: key,
          role: char.role || 'Character',
          summary: 'Character description not available due to parsing error'
        };
      }

      return {
        id: key,
        content: cleanYaml,
        parsedData
      };
    } catch (error) {
      console.error(`Failed to generate character data for ${key}:`, error);
      // Create fallback character
      return {
        id: key,
        content: `name: "${key}"\nrole: "${char.role || 'Character'}"\nsummary: "Generated with errors"`,
        parsedData: {
          name: key,
          role: char.role || 'Character',
          summary: 'Generated with errors'
        }
      };
    }
  });

  const characters = await Promise.all(characterPromises);
  return characters;
}

// Generate place data from story concept (Parallel)
export async function generatePlaceData(storyConcept: Story, language: string = 'English') {
  const allPlaces = [...(storyConcept.setting?.primary || []), ...(storyConcept.setting?.secondary || [])];

  const placePromises = allPlaces.map(async (place) => {
    try {
      const { text } = await generateText({
        model: AI_MODELS.writing,
        messages: [
          {
            role: 'system',
            content: `Generate detailed location data in YAML format for story development.

Structure:
---
name: "Location Name"
type: "Location Type"
summary: "Detailed description in one line"
atmosphere: "Mood and feeling in one line"
significance: "Importance to story in one line"
culture: "Cultural aspects in one line"
history: "Location background in one line"
details: "Specific features in one line"
connections: "How it relates to plot/characters in one line"
sensory: "Sounds, smells, textures in one line"
accessibility: "How characters reach it in one line"
secrets: "Hidden aspects in one line"
---

CRITICAL YAML REQUIREMENTS:
- ALL values must be quoted strings on single lines
- NO multi-line values or complex nested structures
- NO colons (:) inside quoted values
- Use simple, flat YAML structure only
- Keep descriptions concise and in single sentences
- Location must be culturally appropriate for ${language}
- Details must serve the story's plot and themes
- Output must be valid, parseable YAML format`
          },
          {
            role: 'user',
            content: `Create detailed location data for: ${place}
Story context: ${storyConcept.title} - ${storyConcept.genre}
Story language: ${language}

Generate comprehensive location details in YAML format.`
          }
        ]
      });

      const cleanYaml = extractYamlFromText(text);
      let parsedData: any;
      try {
        parsedData = yaml.load(cleanYaml);
      } catch (yamlError) {
        console.error(`Failed to parse place YAML for ${place}:`, yamlError);
        // Create fallback parsed data
        parsedData = {
          name: place,
          type: 'location',
          summary: 'Place description not available due to parsing error'
        };
      }

      return {
        name: place,
        content: cleanYaml,
        parsedData
      };
    } catch (error) {
      console.error(`Failed to generate place data for ${place}:`, error);
      // Create fallback place
      return {
        name: place,
        content: `name: "${place}"\ntype: "location"\nsummary: "Generated with errors"`,
        parsedData: {
          name: place,
          type: 'location',
          summary: 'Generated with errors'
        }
      };
    }
  });

  const places = await Promise.all(placePromises);
  return places;
}

// Main story development workflow with incremental database saving
export async function generateStoryFromPrompt(userPrompt: string, userId: string, language: string = 'English', storyId?: string) {
  console.log('🚀 Starting story development process...');

  // Generate story ID upfront if not provided
  const currentStoryId = storyId || nanoid();

  try {
    // Phase 1: Story Foundation
    console.log('Phase 1: Story Foundation');
    const storyConcept = await storyConceptDevelopment(userPrompt, language);
    console.log('✅ Story concept developed');

    // Generate story cover image
    console.log('🎨 Generating story cover image...');
    let storyImageUrl = null;
    let storyImageData = null;
    try {
      const storyImagePrompt = `${storyConcept.title}: ${storyConcept.genre} story. ${storyConcept.question}. ${storyConcept.goal}. Key themes: ${storyConcept.themes?.join(', ')}. Setting: ${storyConcept.setting?.primary?.join(', ')}`;
      const imageResult = await generateStoryImage({
        prompt: storyImagePrompt,
        storyId: currentStoryId,
        imageType: 'story',
        style: 'vivid',
        quality: 'standard',
      });
      storyImageUrl = imageResult.url;
      storyImageData = {
        url: imageResult.url,
        method: 'dall-e-3-optimized',
        style: 'vivid',
        generatedAt: new Date().toISOString(),
        prompt: storyImagePrompt,
        optimizedSet: imageResult.optimizedSet,
      };
      console.log('✅ Story image generated:', storyImageUrl);
      console.log('✅ Optimized variants:', imageResult.optimizedSet?.variants.length || 0);
    } catch (error) {
      console.error('⚠️ Failed to generate story image:', error);
      // Continue without image if generation fails
    }

    // Save story after Phase 1 with status 'phase1_in_progress'
    console.log('💾 Saving Phase 1 data to database...');
    await db.insert(stories)
      .values({
        id: currentStoryId,
        title: storyConcept.title || 'Generated Story',
        summary: `${storyConcept.goal} | ${storyConcept.conflict} | ${storyConcept.outcome}`,
        genre: storyConcept.genre || 'General',
        authorId: userId,
        status: 'writing',
        hnsData: storyImageData ? { storyImage: storyImageData } : {},
        content: JSON.stringify({
          phase1_story: storyConcept,
          developmentPhases: {
            phase1_story: storyConcept
          }
        }),
      })
      .onConflictDoUpdate({
        target: [stories.id],
        set: {
          status: 'writing',
            hnsData: storyImageData ? { storyImage: storyImageData } : {},
          content: JSON.stringify({
            phase1_story: storyConcept,
            developmentPhases: {
              phase1_story: storyConcept
            }
          }),
          updatedAt: new Date()
        }
      });
    console.log('✅ Phase 1 data saved');

    // Phase 2: Part Development
    console.log('Phase 2: Part Development');
    const partSpecs = await generatePartSpecifications(storyConcept);
    console.log('✅ Part specifications completed');

    // Update story after Phase 2
    console.log('💾 Saving Phase 2 data to database...');
    const [phase2Story] = await db.select().from(stories).where(eq(stories.id, currentStoryId));
    const phase2Content = phase2Story?.content ? JSON.parse(phase2Story.content as string) : {};

    await db.update(stories)
      .set({
        status: 'writing',
        content: JSON.stringify({
          ...phase2Content,
          phase2_parts: partSpecs,
          developmentPhases: {
            ...phase2Content.developmentPhases,
            phase2_parts: partSpecs
          }
        }),
        updatedAt: new Date()
      })
      .where(eq(stories.id, currentStoryId));

    // Create parts in database
    const createdPartIds = [];
    for (let partIndex = 0; partIndex < partSpecs.length; partIndex++) {
      const partSpec = partSpecs[partIndex];
      const partWordCount = storyConcept.structure?.dist?.[partIndex]
        ? Math.floor((storyConcept.words || 60000) * (storyConcept.structure.dist[partIndex] / 100))
        : Math.floor((storyConcept.words || 60000) / partSpecs.length);

      const partId = await RelationshipManager.addPartToStory(
        currentStoryId,
        {
          title: `Part ${partSpec.part}: ${(partSpec as any).desc || storyConcept.parts[partIndex]?.goal || 'Part ' + (partIndex + 1)}`,
          authorId: userId,
          orderIndex: partSpec.part,
          content: JSON.stringify(partSpec),
        }
      );
      createdPartIds.push(partId);
    }
    console.log('✅ Phase 2 data and parts saved');

    // Phase 3: Character Development
    console.log('Phase 3: Character Development');
    const characterData = await generateCharacterData(storyConcept, language);
    console.log('✅ Character data generated');

    // Update story after Phase 3
    console.log('💾 Saving Phase 3 data to database...');
    const [phase3Story] = await db.select().from(stories).where(eq(stories.id, currentStoryId));
    const phase3Content = phase3Story?.content ? JSON.parse(phase3Story.content as string) : {};

    await db.update(stories)
      .set({
        status: 'writing',
        content: JSON.stringify({
          ...phase3Content,
          phase3_characters: characterData,
          developmentPhases: {
            ...phase3Content.developmentPhases,
            phase3_characters: characterData
          }
        }),
        updatedAt: new Date()
      })
      .where(eq(stories.id, currentStoryId));

    // Create characters in database
    for (const character of characterData) {
      const characterId = nanoid();
      await db.insert(characters).values({
        id: characterId,
        name: character.parsedData?.name || character.id,
        storyId: currentStoryId,
        isMain: ['protag', 'antag'].includes(character.id),
        content: character.content,
      });
    }
    console.log('✅ Phase 3 data and characters saved');

    // Phase 4: Place Development
    console.log('Phase 4: Place Development');
    const placeData = await generatePlaceData(storyConcept, language);
    console.log('✅ Place data generated');

    // Update story after Phase 4 with final status
    console.log('💾 Saving Phase 4 data to database...');
    const [phase4Story] = await db.select().from(stories).where(eq(stories.id, currentStoryId));
    const phase4Content = phase4Story?.content ? JSON.parse(phase4Story.content as string) : {};

    const completeStory = {
      ...storyConcept,
      userId,
      createdAt: new Date(),
      partSpecifications: partSpecs,
      characters: characterData,
      places: placeData,
      developmentPhases: {
        phase1_story: storyConcept,
        phase2_parts: partSpecs,
        phase3_characters: characterData,
        phase4_places: placeData,
      }
    };

    await db.update(stories)
      .set({
        status: 'published',
        content: JSON.stringify(completeStory),
        updatedAt: new Date()
      })
      .where(eq(stories.id, currentStoryId));

    // Create places in database
    for (const place of placeData) {
      const placeId = nanoid();
      await db.insert(places).values({
        id: placeId,
        name: place.parsedData?.name || place.name,
        storyId: currentStoryId,
        isMain: ['primary', 'main'].some(keyword =>
          (place.parsedData?.significance || '').toLowerCase().includes(keyword)
        ),
        content: place.content,
      });
    }
    console.log('✅ Phase 4 data and places saved');
    console.log('🎉 Story development completed successfully!');

    // Return complete story with database ID
    return {
      id: currentStoryId,
      ...completeStory
    };

  } catch (error) {
    console.error('❌ Story generation failed:', error);

    // Update story status to failed if it exists
    await db.update(stories)
      .set({
        status: 'writing',
        updatedAt: new Date()
      })
      .where(eq(stories.id, currentStoryId));

    throw error;
  }
}

// Helper functions for generating individual parts/chapters/scenes
export { storyConceptDevelopment as generateStory };
export { generatePartSpecifications as generateParts };
export { generateChapterSpecifications as generateChapters };
export { generateSceneSpecifications as generateScenes };