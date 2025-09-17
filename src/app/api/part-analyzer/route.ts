import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const PartDataSchema = z.object({
  part: z.number(),
  title: z.string(),
  words: z.number(),
  function: z.string(),
  goal: z.string(),
  conflict: z.string(),
  outcome: z.string(),
  questions: z.object({
    primary: z.string(),
    secondary: z.string()
  }),
  chars: z.record(z.object({
    start: z.string(),
    end: z.string(),
    arc: z.union([z.array(z.string()), z.string()]),
    conflict: z.string().optional(),
    transforms: z.array(z.string()).optional()
  })),
  plot: z.object({
    events: z.array(z.string()),
    reveals: z.array(z.string()),
    escalation: z.array(z.string())
  }),
  emotion: z.object({
    start: z.string(),
    progression: z.array(z.string()),
    end: z.string()
  })
});

export async function POST(request: Request) {
  try {
    const { partData, userRequest } = await request.json();

    if (!partData || !userRequest) {
      return Response.json({
        success: false,
        error: 'Missing required fields: partData and userRequest'
      }, { status: 400 });
    }

    const systemPrompt = `You are an expert story part analyzer and editor. Your task is to modify story part data based on user requests.

Current Part Data (Part ${partData.part}):
- Title: ${partData.title}
- Function: ${partData.function}
- Word Count: ${partData.words}
- Goal: ${partData.goal}
- Conflict: ${partData.conflict}
- Outcome: ${partData.outcome}
- Central Questions: ${partData.questions.primary} / ${partData.questions.secondary}
- Characters: ${Object.keys(partData.chars).length} character developments
- Plot Events: ${partData.plot.events.length} events
- Plot Reveals: ${partData.plot.reveals.length} reveals

Your role:
1. Analyze the user's request carefully
2. Apply relevant changes to improve the part structure
3. Maintain story consistency and narrative flow
4. Keep character development logical and meaningful
5. Ensure plot elements support the part's function
6. Preserve the Korean story context if present

Guidelines:
- Only modify fields that are relevant to the user's request
- Keep changes realistic and story-appropriate
- Maintain proper character arc progression
- Ensure plot events support the part's goal and conflict
- Preserve existing good elements unless specifically asked to change them
- For Korean content, maintain language and cultural authenticity`;

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt: `User Request: "${userRequest}"

Please analyze and modify the part data accordingly. Return the updated part data with any improvements or changes based on the user's request.`,
      schema: PartDataSchema,
    });

    return Response.json({
      success: true,
      updatedPartData: result.object
    });

  } catch (error) {
    console.error('Part analyzer error:', error);
    return Response.json({
      success: false,
      error: 'Failed to process part analysis request'
    }, { status: 500 });
  }
}