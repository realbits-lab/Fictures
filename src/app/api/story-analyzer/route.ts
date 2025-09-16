import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import * as yaml from 'js-yaml';

interface StoryData {
  title: string;
  genre: string;
  words: number;
  question: string;
  goal: string;
  conflict: string;
  outcome: string;
  chars: Record<string, { role: string; arc: string }>;
  themes: string[];
  structure: { type: string; parts: string[]; dist: number[] };
  parts: Array<{ part: number; goal: string; conflict: string; outcome: string; tension: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const { storyData, userRequest } = await request.json();

    const currentStoryYAML = `story:
  title: "${storyData.title}"
  genre: "${storyData.genre}"
  words: ${storyData.words}
  question: "${storyData.question}"
  goal: "${storyData.goal}"
  conflict: "${storyData.conflict}"
  outcome: "${storyData.outcome}"
  chars:${Object.entries(storyData.chars).map(([name, char]: [string, any]) => `
    ${name}: { role: "${char.role}", arc: "${char.arc}" }`).join('')}
  themes: [${storyData.themes.map((theme: string) => `"${theme}"`).join(', ')}]
  structure:
    type: "${storyData.structure.type}"
    parts: [${storyData.structure.parts.map((part: string) => `"${part}"`).join(', ')}]
    dist: [${storyData.structure.dist.join(', ')}]
  parts:${storyData.parts.map((part: any) => `
    - part: ${part.part}
      goal: "${part.goal}"
      conflict: "${part.conflict}"
      tension: "${part.tension}"`).join('')}`;

    const result = await generateText({
      model: 'gpt-4o-mini',
      system: `You are a story development assistant. Your job is to:

1. UNDERSTAND the user's request for modifying the story
2. REFINE and articulate what the user wants to change
3. MODIFY the provided story YAML data according to the user's request
4. RETURN the updated story data as valid YAML

RULES:
- Follow the user's request exactly as specified
- Make precise changes only to the requested elements
- Keep all existing data that wasn't requested to be changed
- Ensure the output is valid YAML that follows the story structure format
- Be direct and literal in implementing changes - don't analyze or interpret beyond what's asked
- If adding characters, use names and roles specified by the user
- If changing genre, use the exact genre requested
- If modifying goals/conflicts/outcomes, use language that matches the user's intent
- Maintain proper YAML indentation and formatting

YAML structure should follow this format:
story:
  title: "string"
  genre: "string"
  words: number
  question: "string"
  goal: "string"
  conflict: "string"
  outcome: "string"
  chars:
    character_name: { role: "string", arc: "string" }
  themes: ["theme1", "theme2"]
  structure:
    type: "string"
    parts: ["part1", "part2"]
    dist: [number, number]
  parts:
    - part: number
      goal: "string"
      conflict: "string"
      outcome: "string"
      tension: "string"

Return ONLY valid YAML of the updated story data, nothing else.`,
      prompt: `Current story YAML:
${currentStoryYAML}

User request: "${userRequest}"

Please modify the story data according to this request and return the updated story as valid YAML.`,
    });

    // Clean the AI response by removing markdown code blocks if present
    let cleanedResponse = result.text.trim();

    // Remove ```yaml or ```json at the beginning and ``` at the end if present
    if (cleanedResponse.startsWith('```yaml')) {
      cleanedResponse = cleanedResponse.replace(/^```yaml\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse the cleaned AI response as YAML and extract the story data
    const parsedYAML = yaml.load(cleanedResponse) as any;
    const updatedStoryData = parsedYAML.story;

    return NextResponse.json({
      success: true,
      updatedStoryData,
      originalRequest: userRequest
    });

  } catch (error) {
    console.error('Story analyzer API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}