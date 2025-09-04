import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { StorySchema, PartSpecificationSchema, ChapterSpecificationSchema, SceneSpecificationSchema, type Story, type PartSpecification, type ChapterSpecification, type SceneSpecification } from './schemas';

// Phase 1: Story Foundation
export async function storyConceptDevelopment(userPrompt: string, language: string = 'English'): Promise<Story> {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: StorySchema,
    system: `You are an expert story developer implementing Phase 1: Story Foundation.

Analyze the user's story prompt and extract core elements to create a structured story concept following JSON schema specifications.

Key requirements:
- Extract genre, characters, conflict, and themes from the user prompt
- Create a 3-part structure with 25%/50%/25% word distribution
- Design characters with clear roles: protag, antag, mentor, catalyst, etc.
- Establish serial publication parameters
- Create reader engagement hooks
- Use the universal pattern: goal → conflict → outcome
- Set reasonable word count (60000-100000 for full stories)
- Set the main language for the story content

Output structured JSON data that follows the Story schema.`,
    prompt: `User story prompt: "${userPrompt}"
Main language: ${language}

Create a complete story concept following the story development format. Extract elements from the prompt and expand them into a full story structure with characters, themes, parts, and publication strategy.`,
  });

  return object;
}

// Phase 2: Structural Development - Generate detailed part specifications
export async function generatePartSpecifications(storyConcept: Story): Promise<PartSpecification[]> {
  const partSpecs: PartSpecification[] = [];
  
  for (let i = 0; i < storyConcept.parts.length; i++) {
    const storyPart = storyConcept.parts[i];
    
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: PartSpecificationSchema,
      system: `You are implementing Phase 2: Structural Development.

Take the story concept and develop detailed part-level structure with:
- Expanded part details with specific character development
- Publication flow planning for serial fiction
- Conflict escalation patterns
- Tension peak planning
- Reader engagement strategies

Output structured JSON data following the PartSpecification schema.`,
      prompt: `Story concept: ${JSON.stringify(storyConcept, null, 2)}

Current part to develop: Part ${storyPart.part}
- Goals: ${storyPart.goals}
- Conflict: ${storyPart.conflict}
- Outcome: ${storyPart.outcome}

Develop the detailed part specification for Part ${storyPart.part} following the part development format. Include character development, plot progression, themes, and reader engagement elements.`,
    });

    partSpecs.push(object);
  }
  
  return partSpecs;
}

// Phase 3: Chapter Generation
export async function generateChapterSpecifications(storyConcept: Story, partSpec: PartSpecification, chapterCount: number = 5): Promise<ChapterSpecification[]> {
  const chapters: ChapterSpecification[] = [];
  
  for (let i = 1; i <= chapterCount; i++) {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: ChapterSpecificationSchema,
      system: `You are implementing Chapter Generation.

Generate detailed chapter specifications that fulfill the dual mandate:
1. Episodic Satisfaction: Complete mini-story arc within chapter
2. Serial Momentum: Compelling hook to next chapter

Key requirements:
- Three-act structure (Setup 20%, Confrontation 60%, Resolution 20%)
- Clear goal/conflict/outcome for chapter
- Character development within chapter
- Multi-layered tension architecture
- Strong forward hook that emerges naturally

Output structured JSON data following the ChapterSpecification schema.`,
      prompt: `Story concept: ${JSON.stringify(storyConcept, null, 2)}

Part specification: ${JSON.stringify(partSpec, null, 2)}

Generate Chapter ${i} of Part ${partSpec.part} (${partSpec.title}).
This chapter should advance the part's goals while being self-contained.
Target word count: ${storyConcept.serial.chapter_words} words
POV character should be the main protagonist: ${Object.keys(storyConcept.chars).find(k => storyConcept.chars[k].role === 'protag')}`,
    });

    chapters.push(object);
  }
  
  return chapters;
}

// Phase 4: Scene Generation
export async function generateSceneSpecifications(chapterSpec: ChapterSpecification, sceneCount: number = 3): Promise<SceneSpecification[]> {
  const scenes: SceneSpecification[] = [];
  
  for (let i = 1; i <= sceneCount; i++) {
    const { object } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: SceneSpecificationSchema,
      system: `You are implementing Scene Generation.

Generate detailed scene specifications that serve as building blocks of chapters:
- Clear dramatic goal/obstacle/outcome
- Meaningful emotional/situational shift
- Connection to chapter flow
- Visual scene description for atmosphere

Each scene should advance the chapter while being a complete dramatic unit.

Output structured JSON data following the SceneSpecification schema.`,
      prompt: `Chapter specification: ${JSON.stringify(chapterSpec, null, 2)}

Generate Scene ${i} of Chapter ${chapterSpec.chap}.
This scene should contribute to the chapter's three-act structure:
- Act 1 (Setup): Scene 1
- Act 2 (Confrontation): Scenes 2-3  
- Act 3 (Resolution): Final scene

Scene ${i} function within chapter structure.`,
    });

    scenes.push(object);
  }
  
  return scenes;
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
  
  // Add metadata and structure the complete story
  const completeStory = {
    ...storyConcept,
    userId,
    createdAt: new Date(),
    partSpecifications: partSpecs,
    developmentPhases: {
      phase1_story: storyConcept,
      phase2_parts: partSpecs,
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