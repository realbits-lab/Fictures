import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateText } from 'ai';
import { AI_MODELS, AI_PROMPTS } from '@/lib/ai/config';
import { z } from 'zod';
import { db } from '@/lib/db';
import { aiInteractions } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

const suggestionSchema = z.object({
  text: z.string().min(10).max(10000),
  type: z.enum(['character', 'plot', 'style', 'dialogue', 'pacing']),
  context: z.string().optional(),
  sessionId: z.string().optional(),
});

// POST /api/ai/suggestions - Get AI writing suggestions
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, type, context, sessionId } = suggestionSchema.parse(body);

    // Select appropriate prompt based on suggestion type
    let systemPrompt: string = AI_PROMPTS.writing_assistance;
    switch (type) {
      case 'character':
        systemPrompt = AI_PROMPTS.character_development;
        break;
      case 'plot':
        systemPrompt = AI_PROMPTS.plot_analysis;
        break;
      case 'style':
        systemPrompt = AI_PROMPTS.style_coach;
        break;
      case 'dialogue':
        systemPrompt = `${AI_PROMPTS.character_development}\n\nFocus specifically on dialogue authenticity, natural speech patterns, and character voice consistency.`;
        break;
      case 'pacing':
        systemPrompt = `${AI_PROMPTS.plot_analysis}\n\nFocus specifically on scene pacing, tension building, and narrative rhythm.`;
        break;
    }

    const userPrompt = `Please analyze this text and provide specific writing suggestions:

${context ? `Context: ${context}\n\n` : ''}Text to analyze:
${text}

Focus on: ${type}

Provide 2-3 concrete, actionable suggestions with specific examples where possible.`;

    // Generate AI response
    const { text: suggestion } = await generateText({
      model: AI_MODELS.writing,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    // Store AI interaction
    const interactionId = nanoid();
    await db.insert(aiInteractions).values({
      id: interactionId,
      userId: session.user.id,
      type: `suggestion_${type}`,
      prompt: userPrompt,
      response: suggestion,
      applied: false,
    });

    return NextResponse.json({ 
      suggestion,
      interactionId,
      type,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error generating AI suggestion:', error);
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 });
  }
}