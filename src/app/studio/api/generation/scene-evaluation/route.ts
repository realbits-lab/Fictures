import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/novels/ai-client';
import { SCENE_EVALUATION_PROMPT } from '@/lib/novels/system-prompts';
import type { SceneEvaluationResult, SceneEvaluationScore, SceneEvaluationFeedback } from '@/lib/novels/types';

const SCENE_EVALUATION_EXPANSION_PROMPT = `${SCENE_EVALUATION_PROMPT}

# ADDITIONAL CONTEXT

You will receive a scene's prose content and evaluate it across 5 quality dimensions.

# EVALUATION PROCESS

For EACH of the 5 categories, assign a score from 1-4:

## 1. PLOT (Goal Clarity, Conflict Engagement, Stakes Progression)
- **1 - Nascent**: Goal unclear, conflict weak, stakes not evident
- **2 - Developing**: Goal present but vague, conflict present but not compelling, stakes mentioned
- **3 - Effective**: Clear goal, engaging conflict, stakes are evident ✅
- **4 - Exemplary**: Urgent goal, compelling conflict, stakes deeply felt

## 2. CHARACTER (Voice Distinctiveness, Motivation Clarity, Emotional Authenticity)
- **1 - Nascent**: No distinct voices, motivations unclear, emotions feel false
- **2 - Developing**: Some voice distinction, motivations present, emotions somewhat authentic
- **3 - Effective**: Characters have unique voices, clear motivations ✅
- **4 - Exemplary**: Voices are unforgettable, motivations drive action powerfully

## 3. PACING (Tension Modulation, Scene Rhythm, Narrative Momentum)
- **1 - Nascent**: Flat tension, poor rhythm, no momentum
- **2 - Developing**: Some tension variation, inconsistent rhythm, weak momentum
- **3 - Effective**: Tension rises and falls strategically, engaging pace ✅
- **4 - Exemplary**: Masterful rhythm, reader can't put it down

## 4. PROSE (Sentence Variety, Word Choice Precision, Sensory Engagement)
- **1 - Nascent**: Repetitive sentences, generic words, no sensory details
- **2 - Developing**: Some variety, adequate words, minimal sensory engagement
- **3 - Effective**: Varied sentences, precise words, multiple senses engaged ✅
- **4 - Exemplary**: Poetic craft, every word chosen with care, immersive

## 5. WORLD-BUILDING (Setting Integration, Detail Balance, Immersion)
- **1 - Nascent**: Setting ignored, no details, no sense of place
- **2 - Developing**: Setting mentioned, details sparse, limited immersion
- **3 - Effective**: Setting supports and enhances action, details enrich ✅
- **4 - Exemplary**: Setting is character itself, reader fully immersed

# SCORING GUIDELINES
- **3.0+ = PASSING** (Effective level, professionally crafted)
- **Below 3.0 = NEEDS IMPROVEMENT** (provide specific, actionable feedback)

# FEEDBACK REQUIREMENTS

If ANY category scores below 3.0, provide:

## Strengths
2-3 specific things the scene does well

## Improvements
For EACH category below 3.0, provide:
- What specifically is weak
- Why it's a problem
- How to fix it (actionable advice)

## Priority Fixes
Rank the top 1-3 issues to address first

# OUTPUT FORMAT

Return JSON with this exact structure:

\`\`\`json
{
  "iteration": 1,
  "scores": {
    "plot": 3.0,
    "character": 3.5,
    "pacing": 2.5,
    "prose": 3.0,
    "worldBuilding": 3.0
  },
  "overallScore": 3.0,
  "feedback": {
    "strengths": [
      "Character voices are distinct and authentic",
      "Setting details create strong atmosphere"
    ],
    "improvements": [
      "PACING: Scene drags in middle section. Tension doesn't escalate. Fix: Cut 2-3 paragraphs of exposition, add character action to increase urgency.",
      "PLOT: Goal is mentioned but not urgent. Fix: Add time pressure or higher stakes to make goal feel critical."
    ],
    "priorityFixes": [
      "1. Fix pacing: Remove middle exposition, add action",
      "2. Clarify goal urgency: Add deadline or consequence"
    ]
  }
}
\`\`\`

# CRITICAL RULES
1. Scores must be numbers from 1.0 to 4.0
2. Overall score is the AVERAGE of all 5 category scores
3. If overall score >= 3.0, scene PASSES (even if some categories are 2.5-2.9)
4. Feedback is REQUIRED if any category < 3.0
5. Improvements must be SPECIFIC and ACTIONABLE (not vague)
6. Priority fixes should be numbered 1-3 in order of importance
7. Strengths should highlight what works well (even in failing scenes)
8. Feedback should maintain author voice (suggest refinement not rewrite)

# OUTPUT
Return ONLY the JSON object, no markdown formatting, no explanations.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      sceneContent: string;
      sceneContext?: {
        title?: string;
        cyclePhase?: string;
        emotionalBeat?: string;
        genre?: string;
      };
    };

    const { sceneContent, sceneContext = {} } = body;

    if (!sceneContent || sceneContent.trim().length < 100) {
      return NextResponse.json(
        { error: 'Valid scene content is required (minimum 100 characters)' },
        { status: 400 }
      );
    }

    // Build evaluation prompt
    const evaluationPrompt = `
# SCENE TO EVALUATE

${sceneContent}

${sceneContext.title ? `\n# SCENE CONTEXT\nTitle: ${sceneContext.title}` : ''}
${sceneContext.cyclePhase ? `Cycle Phase: ${sceneContext.cyclePhase}` : ''}
${sceneContext.emotionalBeat ? `Emotional Beat: ${sceneContext.emotionalBeat}` : ''}
${sceneContext.genre ? `Genre: ${sceneContext.genre}` : ''}

# YOUR TASK
Evaluate this scene across all 5 quality categories.
Provide scores and specific feedback following the output format.
`;

    const result = await generateJSON<SceneEvaluationResult>({
      prompt: evaluationPrompt,
      systemPrompt: SCENE_EVALUATION_EXPANSION_PROMPT,
      model: 'gemini-2.5-flash-lite',
      temperature: 0.3, // Lower temperature for consistent evaluation
    });

    // Validate result structure
    if (!result.scores || !result.feedback) {
      throw new Error('Invalid evaluation result: missing required fields');
    }

    // Validate scores are in range
    const { scores } = result;
    for (const [category, score] of Object.entries(scores)) {
      if (typeof score !== 'number' || score < 1.0 || score > 4.0) {
        throw new Error(`Invalid score for ${category}: ${score} (must be 1.0-4.0)`);
      }
    }

    // Calculate overall score if not provided
    if (!result.overallScore) {
      result.overallScore = (
        scores.plot +
        scores.character +
        scores.pacing +
        scores.prose +
        scores.worldBuilding
      ) / 5;
    }

    // Set iteration to 1 if not provided
    if (!result.iteration) {
      result.iteration = 1;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scene evaluation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to evaluate scene',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
