import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateObject } from 'ai';
import { AI_MODELS, AI_PROMPTS } from '@/lib/ai/config';
import { z } from 'zod';
import { db } from '@/lib/db';
import { aiInteractions } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

const analysisSchema = z.object({
  text: z.string().min(50).max(10000),
  analysisType: z.enum(['full', 'pacing', 'character', 'dialogue', 'style']),
  sessionId: z.string().optional(),
});

// Response schema for structured analysis
const analysisResponseSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.object({
    issue: z.string(),
    suggestion: z.string(),
    example: z.string().optional(),
  })),
  metrics: z.object({
    pace: z.number().min(0).max(100),
    dialog: z.number().min(0).max(100),
    action: z.number().min(0).max(100),
    emotion: z.number().min(0).max(100),
  }),
  overallScore: z.number().min(0).max(100),
});

// POST /api/ai/analyze - Comprehensive text analysis
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, analysisType, sessionId } = analysisSchema.parse(body);

    // Select appropriate analysis prompt
    const analysisPrompts = {
      full: 'Provide a comprehensive analysis covering all aspects of the writing.',
      pacing: 'Focus your analysis on pacing, rhythm, and narrative flow.',
      character: 'Focus your analysis on character development, consistency, and authenticity.',
      dialogue: 'Focus your analysis on dialogue quality, naturalness, and character voice.',
      style: 'Focus your analysis on writing style, voice, and prose quality.',
    };

    const userPrompt = `Analyze this text and provide detailed feedback:

${text}

Analysis focus: ${analysisPrompts[analysisType]}

Provide:
1. A brief summary of the text's main strengths
2. Specific areas that work well
3. Concrete improvement suggestions with examples
4. Metrics for pace, dialogue, action, and emotion (0-100 scale)
5. An overall quality score (0-100)

Be specific and actionable in your feedback.`;

    // Generate structured analysis
    const { object: analysis } = await generateObject({
      model: AI_MODELS.analysis,
      system: AI_PROMPTS.writing_assistance,
      prompt: userPrompt,
      schema: analysisResponseSchema,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    // Store AI interaction
    const interactionId = nanoid();
    await db.insert(aiInteractions).values({
      id: interactionId,
      userId: session.user.id,
      sessionId: sessionId || null,
      type: `analysis_${analysisType}`,
      prompt: userPrompt,
      response: JSON.stringify(analysis),
      applied: false,
    });

    return NextResponse.json({ 
      analysis,
      interactionId,
      analysisType,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error analyzing text:', error);
    return NextResponse.json({ error: 'Failed to analyze text' }, { status: 500 });
  }
}