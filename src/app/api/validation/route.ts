import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  validateStory,
  validatePart,
  validateChapter,
  validateScene,
  validateCharacter,
  validateSetting,
  validateStoryStructure
} from '@/lib/services/validation';
import { z } from 'zod';

export const runtime = 'nodejs';

const ValidationRequestSchema = z.object({
  type: z.enum(['story', 'part', 'chapter', 'scene', 'character', 'setting', 'full']),
  data: z.unknown(),
  includeWarnings: z.boolean().optional().default(true)
});

const FullValidationRequestSchema = z.object({
  type: z.literal('full'),
  data: z.object({
    story: z.unknown(),
    parts: z.array(z.unknown()).optional(),
    chapters: z.array(z.unknown()).optional(),
    scenes: z.array(z.unknown()).optional(),
    characters: z.array(z.unknown()).optional(),
    settings: z.array(z.unknown()).optional()
  }),
  includeWarnings: z.boolean().optional().default(true)
});

// POST /api/validation - Validate story components
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if it's a full validation request
    if (body.type === 'full') {
      const validatedRequest = FullValidationRequestSchema.parse(body);

      const result = validateStoryStructure(validatedRequest.data);

      // Filter out warnings if not requested
      if (!validatedRequest.includeWarnings) {
        result.story.warnings = [];
        result.parts = result.parts.map(p => ({ ...p, warnings: [] }));
        result.chapters = result.chapters.map(c => ({ ...c, warnings: [] }));
        result.scenes = result.scenes.map(s => ({ ...s, warnings: [] }));
        result.characters = result.characters.map(c => ({ ...c, warnings: [] }));
        result.settings = result.settings.map(s => ({ ...s, warnings: [] }));
      }

      return NextResponse.json({
        success: true,
        type: 'full',
        result
      });
    }

    // Single component validation
    const validatedRequest = ValidationRequestSchema.parse(body);

    let validationResult;

    switch (validatedRequest.type) {
      case 'story':
        validationResult = validateStory(validatedRequest.data);
        break;
      case 'part':
        validationResult = validatePart(validatedRequest.data);
        break;
      case 'chapter':
        validationResult = validateChapter(validatedRequest.data);
        break;
      case 'scene':
        validationResult = validateScene(validatedRequest.data);
        break;
      case 'character':
        validationResult = validateCharacter(validatedRequest.data);
        break;
      case 'setting':
        validationResult = validateSetting(validatedRequest.data);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid validation type' },
          { status: 400 }
        );
    }

    // Filter out warnings if not requested
    if (!validatedRequest.includeWarnings) {
      validationResult.warnings = [];
    }

    return NextResponse.json({
      success: true,
      type: validatedRequest.type,
      result: validationResult
    });

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

    console.error('Validation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/validation - Get validation status for a story
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json(
        { error: 'Story ID is required' },
        { status: 400 }
      );
    }

    // This would typically fetch the story data from database
    // For now, return a placeholder response
    return NextResponse.json({
      success: true,
      storyId,
      validationStatus: {
        lastValidated: new Date().toISOString(),
        overallValid: true,
        componentStatus: {
          story: { valid: true, completeness: 85 },
          parts: { valid: true, completeness: 90 },
          chapters: { valid: true, completeness: 75 },
          scenes: { valid: true, completeness: 60 },
          characters: { valid: true, completeness: 95 },
          settings: { valid: true, completeness: 80 }
        }
      }
    });

  } catch (error) {
    console.error('Validation status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}