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

    // Add null safety checks for all nested objects
    const safeStoryData = {
      title: storyData?.title || '',
      genre: storyData?.genre || 'urban_fantasy',
      words: storyData?.words || 80000,
      question: storyData?.question || '',
      goal: storyData?.goal || '',
      conflict: storyData?.conflict || '',
      outcome: storyData?.outcome || '',
      chars: storyData?.chars || {},
      themes: storyData?.themes || [],
      structure: storyData?.structure || { type: '3_part', parts: ['setup', 'confrontation', 'resolution'], dist: [25, 50, 25] },
      parts: storyData?.parts || []
    };

    const currentStoryYAML = `story:
  title: "${safeStoryData.title}"
  genre: "${safeStoryData.genre}"
  words: ${safeStoryData.words}
  question: "${safeStoryData.question}"
  goal: "${safeStoryData.goal}"
  conflict: "${safeStoryData.conflict}"
  outcome: "${safeStoryData.outcome}"
  chars:${Object.entries(safeStoryData.chars).map(([name, char]: [string, any]) => `
    ${name}: { role: "${char?.role || 'character'}", arc: "${char?.arc || 'development'}" }`).join('')}
  themes: [${safeStoryData.themes.map((theme: string) => `"${theme}"`).join(', ')}]
  structure:
    type: "${safeStoryData.structure.type}"
    parts: [${safeStoryData.structure.parts.map((part: string) => `"${part}"`).join(', ')}]
    dist: [${safeStoryData.structure.dist.join(', ')}]
  parts:${safeStoryData.parts.map((part: any) => `
    - part: ${part.part}
      goal: "${part.goal || ''}"
      conflict: "${part.conflict || ''}"
      tension: "${part.tension || ''}"`).join('')}`;

    const result = await generateText({
      model: 'gpt-4o-mini',
      system: `You are a creative story development assistant. Your job is to:

1. UNDERSTAND the user's request for modifying the story
2. CREATIVELY INTERPRET abstract requests into concrete story changes
3. ALWAYS MAKE MEANINGFUL CHANGES when a user requests something
4. RETURN the updated story data as valid YAML

CRITICAL RULES:
- ALWAYS apply the user's request - never return unchanged data
- Be CREATIVE and INTERPRETIVE with abstract requests
- When user says "add emotional depth" → enhance character arcs, add internal conflicts, deepen motivations
- When user says "make it darker" → intensify conflicts, add tragic elements, increase stakes
- When user says "add romance" → create romantic subplots, add relationship dynamics
- When user says "more action" → increase physical conflicts, add chase scenes, heighten tension
- When user says "make it longer" → expand word count, add subplots, create more detailed parts
- When user says "add character X" → create that character with appropriate role and arc

CREATIVE INTERPRETATION EXAMPLES:
- "More emotional depth" = Enhance character arcs with deeper psychological motivations, add internal struggles, create more complex relationships
- "Add suspense" = Increase unknown elements, add time pressure, create cliffhangers in parts
- "Make it funny" = Add comedic elements to character interactions, lighten conflicts, add humorous outcomes
- "Add mystery" = Create unknown elements, add secrets between characters, make goals more enigmatic
- "More character development" = Expand character arcs, add character growth moments, create relationship dynamics

ALWAYS MAKE SUBSTANTIAL CHANGES that reflect the user's intent, even if the request is vague.

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