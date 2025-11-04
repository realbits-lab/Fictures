import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateText } from 'ai';
import { AI_MODELS, AI_PROMPTS } from '@/lib/ai/config';
import { z } from 'zod';
import { db } from '@/lib/db';
import { aiInteractions } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

const generateSchema = z.object({
  context: z.string().min(10).max(5000),
  type: z.enum(['dialogue', 'summary', 'action', 'transition', 'character_thought']),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  style: z.string().optional(),
  sessionId: z.string().optional(),
});

// POST /api/ai/generate - Generate content based on context
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { context, type, length, style, sessionId } = generateSchema.parse(body);

    // Create type-specific prompts
    const typePrompts = {
      dialogue: 'Write natural, character-appropriate dialogue that advances the scene.',
      summary: 'Write vivid, immersive description that engages the senses.',
      action: 'Write dynamic action sequence that maintains tension and clarity.',
      transition: 'Write a smooth transition that connects scenes or ideas naturally.',
      character_thought: 'Write internal character thoughts that reveal motivation and emotion.',
    };

    const lengthGuides = {
      short: '1-2 sentences',
      medium: '3-5 sentences',
      long: '6-10 sentences',
    };

    const userPrompt = `Context: ${context}

Generate ${lengthGuides[length]} of ${type} that fits naturally with this context.

${typePrompts[type]}

${style ? `Writing style: ${style}` : ''}

Requirements:
- Maintain consistency with the established tone and voice
- Ensure the generated content flows naturally from the context
- Make it engaging and well-crafted
- Avoid clichés and overused phrases`;

    // Generate AI content
    const { text: generatedContent } = await generateText({
      model: AI_MODELS.writing,
      system: AI_PROMPTS.writing_assistance,
      prompt: userPrompt,
      temperature: 0.8,
    });

    // Store AI interaction
    const interactionId = nanoid();
    await db.insert(aiInteractions).values({
      id: interactionId,
      userId: session.user.id,
      type: `generate_${type}`,
      prompt: userPrompt,
      response: generatedContent,
      applied: false,
    });

    return NextResponse.json({ 
      content: generatedContent,
      interactionId,
      type,
      length,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error generating AI content:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}