import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Utility function to parse YAML-like text into JSON
function parseYamlText(yamlText: string): any {
  try {
    // Simple YAML parsing - convert to JSON format
    const lines = yamlText.split('\n');
    const result: any = {};
    let currentKey = '';
    let currentValue = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        if (trimmed.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':');
          currentKey = key.trim();
          currentValue = valueParts.join(':').trim();
          
          // Handle different value types
          if (currentValue.startsWith('[') && currentValue.endsWith(']')) {
            // Array
            result[currentKey] = JSON.parse(currentValue);
          } else if (currentValue.startsWith('{') && currentValue.endsWith('}')) {
            // Object
            result[currentKey] = JSON.parse(currentValue);
          } else if (!isNaN(Number(currentValue))) {
            // Number
            result[currentKey] = Number(currentValue);
          } else if (currentValue === 'true' || currentValue === 'false') {
            // Boolean
            result[currentKey] = currentValue === 'true';
          } else {
            // String
            result[currentKey] = currentValue.replace(/^["']|["']$/g, '');
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('YAML parsing error, attempting JSON parse:', error);
    try {
      return JSON.parse(yamlText);
    } catch (jsonError) {
      console.error('JSON parsing also failed:', jsonError);
      return yamlText;
    }
  }
}

// Phase 1: Story Foundation
export async function storyConceptDevelopment(userPrompt: string): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: `You are an expert story developer implementing Phase 1: Story Foundation.

Analyze the user's story prompt and extract core elements to create a structured story concept following the exact YAML format from the story development documentation.

Key requirements:
- Extract genre, characters, conflict, and themes from the user prompt
- Create a 3-part structure with 25%/50%/25% word distribution
- Design characters with clear roles: protag, antag, mentor, catalyst, etc.
- Establish serial publication parameters
- Create reader engagement hooks
- Use the universal pattern: goal → conflict → outcome
- Set reasonable word count (60000-100000 for full stories)

Output must be valid YAML format that can be parsed. Use the exact format and terminology from the documentation.`,
    prompt: `User story prompt: "${userPrompt}"

Create a complete story concept following the story development documentation format. Extract elements from the prompt and expand them into a full story structure with characters, themes, parts, and publication strategy.

Return only valid YAML format without code blocks or additional text.`,
  });

  return text;
}

// Phase 2: Structural Development
export async function partDevelopmentProcess(storyConcept: string): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: `You are implementing Phase 2: Structural Development.

Take the story concept from Phase 1 and develop detailed part-level structure with:
- Expanded part details with specific titles and word counts
- Publication flow planning for serial fiction
- Conflict escalation patterns
- Tension peak planning

Output must be valid YAML format that can be parsed. Follow the documentation format exactly.`,
    prompt: `Story concept from Phase 1: ${storyConcept}

Develop the part-level structure following the part development process format from the documentation.

Return only valid YAML format without code blocks or additional text.`,
  });

  return text;
}

// Phase 3: Character Development
export async function characterDevelopmentProcess(partDevelopment: string, storyConcept: string): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: `You are implementing Phase 3: Character Development & World-Building.

Take the part development and story concept to create detailed character evolution tracking:
- Character development stages for each character
- Voice authenticity markers
- Relationship dynamics with tension levels
- Reader engagement hooks through characters

Output must be valid YAML format that can be parsed. Follow the documentation format exactly.`,
    prompt: `Part development: ${partDevelopment}

Story concept: ${storyConcept}

Develop character evolution, relationships, and voice authenticity following the character development process format.

Return only valid YAML format without code blocks or additional text.`,
  });

  return text;
}

// Phase 4: Quality Assurance
export async function storyConsistencyVerification(characterDevelopment: string, partDevelopment: string, storyConcept: string): Promise<string> {
  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: `You are implementing Phase 4: Quality Assurance and Refinement.

Perform final consistency verification and create the complete story specification that matches the story-specification format.

Verify:
- Character consistency and development arcs
- Plot thread development
- World-building coherence
- Timeline accuracy

Output must be valid YAML format that can be parsed. Output the final story format ready for database storage.`,
    prompt: `Character development: ${characterDevelopment}

Part development: ${partDevelopment}

Story concept: ${storyConcept}

Create the final verified story specification following the exact format from the documentation.

Return only valid YAML format without code blocks or additional text.`,
  });

  return text;
}

// Main story development workflow
export async function generateStoryFromPrompt(userPrompt: string, userId: string) {
  console.log('🚀 Starting story development process...');
  
  // Phase 1: Story Foundation
  console.log('Phase 1: Story Foundation');
  const storyConceptYaml = await storyConceptDevelopment(userPrompt);
  console.log('✅ Story concept developed');
  
  // Phase 2: Structural Development
  console.log('Phase 2: Structural Development');
  const partDevelopmentYaml = await partDevelopmentProcess(storyConceptYaml);
  console.log('✅ Part development completed');
  
  // Phase 3: Character Development
  console.log('Phase 3: Character Development');
  const characterDevelopmentYaml = await characterDevelopmentProcess(partDevelopmentYaml, storyConceptYaml);
  console.log('✅ Character development completed');
  
  // Phase 4: Quality Assurance
  console.log('Phase 4: Quality Assurance');
  const finalStoryYaml = await storyConsistencyVerification(characterDevelopmentYaml, partDevelopmentYaml, storyConceptYaml);
  const finalStory = parseYamlText(finalStoryYaml);
  console.log('✅ Story verification completed');
  
  // Add metadata
  const completeStory = {
    ...finalStory,
    userId,
    createdAt: new Date(),
    developmentPhases: {
      phase1: parseYamlText(storyConceptYaml),
      phase2: parseYamlText(partDevelopmentYaml),
      phase3: parseYamlText(characterDevelopmentYaml),
      phase4: finalStory,
    }
  };
  
  console.log('🎉 Story development completed successfully!');
  
  return completeStory;
}