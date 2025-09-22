import { gateway } from '@ai-sdk/gateway';

// Default model configuration
export const DEFAULT_MODEL = 'google/gemini-2.5-flash-lite';
export const REASONING_MODEL = 'google/gemini-2.5-flash-lite';
export const STORY_ANALYSIS_MODEL = 'google/gemini-2.5-flash-lite';
export const IMAGE_GENERATION_MODEL = 'google/gemini-2.5-flash-image-preview';

// AI models configuration using AI Gateway
export const AI_MODELS = {
  // Main writing model - balanced for creative writing
  writing: gateway(DEFAULT_MODEL),

  // Reasoning model for complex analysis
  analysis: gateway(REASONING_MODEL),

  // Fast model for quick suggestions
  quick: gateway(DEFAULT_MODEL),

  // Generation model for content improvement
  generation: gateway(DEFAULT_MODEL),

  // Default model
  default: gateway(DEFAULT_MODEL),
} as const;

// AI prompt templates
export const AI_PROMPTS = {
  writing_assistance: `You are a professional writing assistant specialized in creative fiction. Your role is to help writers improve their storytelling through:

1. Character development suggestions
2. Plot structure analysis
3. Dialogue enhancement
4. Pacing and tension building
5. World-building consistency
6. Style and voice refinement

Always provide specific, actionable advice that respects the writer's creative vision while offering meaningful improvements.`,

  character_development: `You are a character development expert. Help writers create compelling, three-dimensional characters by analyzing:

- Character motivation and goals
- Internal conflicts and growth arcs
- Dialogue authenticity
- Character consistency across scenes
- Relationships and dynamics with other characters

Provide specific examples and suggestions that enhance character depth.`,

  plot_analysis: `You are a plot structure analyst. Help writers strengthen their narrative by examining:

- Story pacing and rhythm
- Plot holes and inconsistencies
- Tension and conflict development
- Chapter and scene transitions
- Overall story arc progression

Offer concrete suggestions for plot improvements while maintaining the author's intended direction.`,

  style_coach: `You are a writing style coach. Help writers improve their prose by focusing on:

- Sentence variety and flow
- Word choice and vocabulary
- Show vs. tell balance
- Voice consistency
- Readability and engagement

Provide specific examples of improvements with explanations of why they work better.`,
} as const;

// AI tool definitions for function calling
export const AI_TOOLS = {
  analyze_text: {
    description: 'Analyze a piece of writing for structure, pacing, and style',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to analyze'
        },
        focus: {
          type: 'string',
          enum: ['structure', 'pacing', 'style', 'character', 'dialogue'],
          description: 'What aspect to focus the analysis on'
        }
      },
      required: ['text', 'focus']
    }
  },
  
  suggest_improvements: {
    description: 'Suggest specific improvements for a piece of writing',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to improve'
        },
        type: {
          type: 'string',
          enum: ['character', 'dialogue', 'description', 'action', 'transition'],
          description: 'Type of improvement needed'
        }
      },
      required: ['text', 'type']
    }
  },
  
  generate_content: {
    description: 'Generate content based on context and requirements',
    parameters: {
      type: 'object',
      properties: {
        context: {
          type: 'string',
          description: 'Current story context or scene setup'
        },
        type: {
          type: 'string',
          enum: ['dialogue', 'description', 'action', 'transition', 'character_thought'],
          description: 'Type of content to generate'
        },
        length: {
          type: 'string',
          enum: ['short', 'medium', 'long'],
          description: 'Desired length of generated content'
        }
      },
      required: ['context', 'type']
    }
  }
} as const;