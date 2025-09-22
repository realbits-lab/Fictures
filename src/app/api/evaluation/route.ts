import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  evaluateStoryContent,
  quickEvaluate,
  type StoryEvaluationResult
} from '@/lib/services/evaluation';
import { z } from 'zod';

export const runtime = 'nodejs';

const EvaluationRequestSchema = z.object({
  mode: z.enum(['full', 'quick']),
  type: z.enum(['story', 'part', 'chapter', 'scene', 'character', 'setting']).optional(),
  data: z.unknown(),
  includeAIFeedback: z.boolean().optional().default(true),
  detailLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed')
});

const FullEvaluationRequestSchema = z.object({
  mode: z.literal('full'),
  data: z.object({
    story: z.unknown(),
    parts: z.array(z.unknown()).optional(),
    chapters: z.array(z.unknown()).optional(),
    scenes: z.array(z.unknown()).optional(),
    characters: z.array(z.unknown()).optional(),
    settings: z.array(z.unknown()).optional()
  }),
  includeAIFeedback: z.boolean().optional().default(true),
  detailLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed')
});

// POST /api/evaluation - Evaluate story content quality
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if AI feedback is disabled
    if (body.includeAIFeedback === false) {
      // Return basic structural evaluation without AI
      return NextResponse.json({
        success: true,
        mode: body.mode,
        result: {
          message: 'Basic evaluation completed without AI feedback',
          structuralAnalysis: {
            hasStory: !!body.data?.story,
            partCount: body.data?.parts?.length || 0,
            chapterCount: body.data?.chapters?.length || 0,
            sceneCount: body.data?.scenes?.length || 0,
            characterCount: body.data?.characters?.length || 0,
            settingCount: body.data?.settings?.length || 0
          }
        }
      });
    }

    // Full evaluation with AI
    if (body.mode === 'full') {
      const validatedRequest = FullEvaluationRequestSchema.parse(body);

      const result: StoryEvaluationResult = await evaluateStoryContent(validatedRequest.data);

      // Adjust detail level
      if (validatedRequest.detailLevel === 'basic') {
        // Simplify the result for basic detail level
        return NextResponse.json({
          success: true,
          mode: 'full',
          result: {
            overallScore: result.storyEvaluation?.overallScore || 0,
            summary: result.storyEvaluation?.summary || 'No evaluation available',
            keyStrengths: result.storyEvaluation?.keyStrengths || [],
            prioritizedImprovements: result.storyEvaluation?.prioritizedImprovements || [],
            componentCounts: {
              parts: result.partEvaluations.length,
              chapters: result.chapterEvaluations.length,
              scenes: result.sceneEvaluations.length,
              characters: result.characterEvaluations.length,
              settings: result.settingEvaluations.length
            }
          }
        });
      }

      return NextResponse.json({
        success: true,
        mode: 'full',
        result
      });
    }

    // Quick evaluation for single component
    const validatedRequest = EvaluationRequestSchema.parse(body);

    if (validatedRequest.mode === 'quick' && validatedRequest.type) {
      const quickResult = await quickEvaluate(validatedRequest.type, validatedRequest.data);

      return NextResponse.json({
        success: true,
        mode: 'quick',
        type: validatedRequest.type,
        result: quickResult
      });
    }

    return NextResponse.json(
      { error: 'Invalid evaluation request' },
      { status: 400 }
    );

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues
        },
        { status: 400 }
      );
    }

    console.error('Evaluation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/evaluation - Get evaluation history for a story
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    // This would typically fetch evaluation history from database
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      storyId,
      evaluations: [
        {
          id: 'eval_1',
          timestamp: new Date().toISOString(),
          overallScore: 78,
          type: 'full',
          summary: 'Strong character development with room for pacing improvement',
          improvements: [
            'Scene transitions could be smoother',
            'Chapter 3 pacing feels rushed',
            'Consider adding more sensory details in settings'
          ]
        }
      ],
      totalCount: 1
    });

  } catch (error) {
    console.error('Evaluation history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}