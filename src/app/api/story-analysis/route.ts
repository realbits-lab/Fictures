import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { validateStoryStructure } from '@/lib/services/validation';
import { evaluateStoryContent } from '@/lib/services/evaluation';
import { improveStoryContent } from '@/lib/services/story-improvement';
import { z } from 'zod';

export const runtime = 'nodejs';

const StoryAnalysisRequestSchema = z.object({
  analysisType: z.enum(['validation', 'evaluation', 'both']).default('both'),
  data: z.object({
    story: z.unknown(),
    parts: z.array(z.unknown()).optional(),
    chapters: z.array(z.unknown()).optional(),
    scenes: z.array(z.unknown()).optional(),
    characters: z.array(z.unknown()).optional(),
    settings: z.array(z.unknown()).optional()
  }),
  options: z.object({
    includeWarnings: z.boolean().optional().default(true),
    includeAIFeedback: z.boolean().optional().default(true),
    detailLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional().default('detailed'),
    generateReport: z.boolean().optional().default(false),
    autoImprove: z.boolean().optional().default(false),
    improvementLevel: z.enum(['conservative', 'moderate', 'aggressive']).optional().default('moderate')
  }).optional()
});

// POST /api/story-analysis - Combined validation and evaluation API
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedRequest = StoryAnalysisRequestSchema.parse(body);

    const results: any = {
      success: true,
      analysisType: validatedRequest.analysisType,
      timestamp: new Date().toISOString()
    };

    // Run validation
    if (validatedRequest.analysisType === 'validation' || validatedRequest.analysisType === 'both') {
      const validationResult = validateStoryStructure(validatedRequest.data);

      // Filter warnings if requested
      if (!validatedRequest.options?.includeWarnings) {
        validationResult.story.warnings = [];
        validationResult.parts = validationResult.parts.map(p => ({ ...p, warnings: [] }));
        validationResult.chapters = validationResult.chapters.map(c => ({ ...c, warnings: [] }));
        validationResult.scenes = validationResult.scenes.map(s => ({ ...s, warnings: [] }));
        validationResult.characters = validationResult.characters.map(c => ({ ...c, warnings: [] }));
        validationResult.settings = validationResult.settings.map(s => ({ ...s, warnings: [] }));
      }

      results.validation = {
        overallValid: validationResult.overallValid,
        totalErrors: validationResult.totalErrors,
        totalWarnings: validationResult.totalWarnings,
        details: validatedRequest.options?.detailLevel !== 'basic' ? validationResult : undefined,
        summary: generateValidationSummary(validationResult)
      };
    }

    // Run evaluation
    if (validatedRequest.analysisType === 'evaluation' || validatedRequest.analysisType === 'both') {
      if (validatedRequest.options?.includeAIFeedback) {
        const evaluationResult = await evaluateStoryContent(validatedRequest.data);

        if (validatedRequest.options?.detailLevel === 'basic') {
          results.evaluation = {
            overallScore: evaluationResult.storyEvaluation?.overallScore || 0,
            summary: evaluationResult.storyEvaluation?.summary || 'No evaluation available',
            keyStrengths: evaluationResult.storyEvaluation?.keyStrengths || [],
            prioritizedImprovements: evaluationResult.storyEvaluation?.prioritizedImprovements || []
          };
        } else {
          results.evaluation = evaluationResult;
        }
      } else {
        results.evaluation = {
          message: 'AI evaluation disabled',
          structuralAnalysis: analyzeStructure(validatedRequest.data)
        };
      }
    }

    // Generate comprehensive report if requested
    if (validatedRequest.options?.generateReport && validatedRequest.analysisType === 'both') {
      results.report = generateComprehensiveReport(results.validation, results.evaluation);
    }

    // Auto-improve if requested
    if (validatedRequest.options?.autoImprove && validatedRequest.analysisType === 'both') {
      try {
        const improvementResult = await improveStoryContent({
          analysisResult: {
            validation: results.validation?.details,
            evaluation: results.evaluation
          },
          originalData: validatedRequest.data,
          options: {
            updateLevel: validatedRequest.options.improvementLevel || 'moderate',
            preserveUserContent: true,
            autoApply: false // Don't auto-apply to DB from analysis API
          }
        });

        results.improvements = {
          enabled: true,
          result: improvementResult,
          summary: improvementResult.summary,
          message: 'Improvements generated. Use /api/story-update with autoApply: true to apply changes.'
        };

        // Add improvement workflow instructions
        results.nextSteps = [
          ...(results.report?.nextSteps || []),
          'Review the generated improvements',
          'Call POST /api/story-update with autoApply: true to apply improvements',
          'Or manually apply selected improvements using PATCH /api/story-update'
        ];
      } catch (improvementError) {
        console.error('Auto-improvement error:', improvementError);
        results.improvements = {
          enabled: true,
          error: 'Failed to generate improvements',
          message: 'Analysis completed but improvement generation failed'
        };
      }
    }

    return NextResponse.json(results);

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

    console.error('Story analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateValidationSummary(validationResult: any): string {
  const components = [];

  if (validationResult.story.isValid) {
    components.push(`Story: ${validationResult.story.stats.completenessPercentage}% complete`);
  } else {
    components.push(`Story: ${validationResult.story.errors.length} errors`);
  }

  if (validationResult.parts.length > 0) {
    const validParts = validationResult.parts.filter((p: any) => p.isValid).length;
    components.push(`Parts: ${validParts}/${validationResult.parts.length} valid`);
  }

  if (validationResult.chapters.length > 0) {
    const validChapters = validationResult.chapters.filter((c: any) => c.isValid).length;
    components.push(`Chapters: ${validChapters}/${validationResult.chapters.length} valid`);
  }

  if (validationResult.scenes.length > 0) {
    const validScenes = validationResult.scenes.filter((s: any) => s.isValid).length;
    components.push(`Scenes: ${validScenes}/${validationResult.scenes.length} valid`);
  }

  if (validationResult.characters.length > 0) {
    const validCharacters = validationResult.characters.filter((c: any) => c.isValid).length;
    components.push(`Characters: ${validCharacters}/${validationResult.characters.length} valid`);
  }

  if (validationResult.settings.length > 0) {
    const validSettings = validationResult.settings.filter((s: any) => s.isValid).length;
    components.push(`Settings: ${validSettings}/${validationResult.settings.length} valid`);
  }

  return components.join(', ');
}

function analyzeStructure(data: any): any {
  return {
    hasStory: !!data.story,
    structure: {
      parts: data.parts?.length || 0,
      chapters: data.chapters?.length || 0,
      scenes: data.scenes?.length || 0,
      averageScenesPerChapter: data.chapters?.length > 0
        ? Math.round((data.scenes?.length || 0) / data.chapters.length)
        : 0
    },
    worldBuilding: {
      characters: data.characters?.length || 0,
      mainCharacters: data.characters?.filter((c: any) => c.isMain).length || 0,
      settings: data.settings?.length || 0
    }
  };
}

function generateComprehensiveReport(validation: any, evaluation: any): any {
  return {
    executiveSummary: {
      validationStatus: validation?.overallValid ? 'PASS' : 'FAIL',
      evaluationScore: evaluation?.overallScore || evaluation?.storyEvaluation?.overallScore || 0,
      readiness: calculateReadiness(validation, evaluation)
    },
    strengths: [
      ...(validation?.overallValid ? ['Story structure is technically valid'] : []),
      ...(evaluation?.keyStrengths || evaluation?.storyEvaluation?.keyStrengths || [])
    ],
    criticalIssues: [
      ...(validation?.totalErrors > 0 ? [`${validation.totalErrors} validation errors need fixing`] : []),
      ...(evaluation?.prioritizedImprovements || evaluation?.storyEvaluation?.prioritizedImprovements || [])
    ],
    recommendations: generateRecommendations(validation, evaluation),
    nextSteps: generateNextSteps(validation, evaluation)
  };
}

function calculateReadiness(validation: any, evaluation: any): string {
  const validationValid = validation?.overallValid || false;
  const evaluationScore = evaluation?.overallScore || evaluation?.storyEvaluation?.overallScore || 0;

  if (!validationValid) return 'Not Ready - Fix validation errors first';
  if (evaluationScore < 50) return 'Early Draft - Significant improvements needed';
  if (evaluationScore < 70) return 'Developing - Continue refining';
  if (evaluationScore < 85) return 'Nearly Ready - Polish and fine-tune';
  return 'Publication Ready';
}

function generateRecommendations(validation: any, evaluation: any): string[] {
  const recommendations = [];

  if (validation?.totalErrors > 0) {
    recommendations.push('Priority: Fix all validation errors before proceeding');
  }

  if (validation?.totalWarnings > 5) {
    recommendations.push(`Address ${validation.totalWarnings} warnings to improve quality`);
  }

  const evalScore = evaluation?.overallScore || evaluation?.storyEvaluation?.overallScore || 0;
  if (evalScore < 70) {
    recommendations.push('Focus on fundamental story elements and structure');
  }

  if (evaluation?.crossReferenceAnalysis?.plotHoles?.length > 0) {
    recommendations.push('Resolve identified plot holes for narrative consistency');
  }

  if (evaluation?.characterEvaluations?.some((c: any) => c.consistency < 60)) {
    recommendations.push('Improve character consistency throughout the story');
  }

  return recommendations;
}

function generateNextSteps(validation: any, evaluation: any): string[] {
  const steps = [];

  if (!validation?.overallValid) {
    steps.push('1. Fix all validation errors');
    steps.push('2. Re-run validation to confirm fixes');
  }

  const evalScore = evaluation?.overallScore || evaluation?.storyEvaluation?.overallScore || 0;
  if (evalScore < 85) {
    steps.push('3. Review and implement AI feedback suggestions');
    steps.push('4. Focus on highest-impact improvements first');
  }

  steps.push('5. Run comprehensive analysis again after changes');
  steps.push('6. Consider beta reader feedback before publication');

  return steps;
}