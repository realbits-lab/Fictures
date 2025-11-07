/**
 * Prompt Manager - Centralized prompt management for multi-model text generation
 * Manages separate prompts for each model provider (Gemini, AI Server)
 */

import type { ModelProvider, PromptType, PromptTemplate } from './types';

class PromptManager {
  private prompts: Record<ModelProvider, Record<PromptType, PromptTemplate>>;

  constructor() {
    this.prompts = {
      gemini: this.initializeGeminiPrompts(),
      'ai-server': this.initializeAIServerPrompts(),
    };
  }

  /**
   * Initialize Gemini-specific prompts
   */
  private initializeGeminiPrompts(): Record<PromptType, PromptTemplate> {
    return {
      chapter_generation: {
        system: `You are a creative story writer specializing in emotionally resonant narratives.
Your task is to generate compelling chapters that follow the Adversity-Triumph cycle.
Each chapter must have clear structure: Setup → Confrontation → Virtue → Consequence → Transition.`,
        userTemplate: `Generate a chapter for the following context:

{context}

Ensure the chapter follows the complete adversity-triumph cycle and connects causally to previous events.`,
      },

      scene_content: {
        system: `You are a skilled scene writer who creates vivid, engaging narrative content.
Write in a cinematic style with strong sensory details, emotional depth, and natural dialogue.
Maximum 3 sentences per paragraph for mobile readability.`,
        userTemplate: `Write the full scene content for:

Title: {title}
Summary: {summary}
Character Focus: {characters}

Previous Scene Context: {previousContext}

Write engaging prose that brings this scene to life with vivid details and authentic character voices.`,
      },

      scene_summary: {
        system: `You are a narrative architect who creates detailed scene breakdowns.
Generate scene summaries that advance the story while maintaining emotional engagement.`,
        userTemplate: `Break down the following chapter into {sceneCount} detailed scenes:

Chapter: {chapterTitle}
Summary: {chapterSummary}
Characters: {characters}

Create scene summaries that flow naturally and build toward the chapter's climax.`,
      },

      character_dialogue: {
        system: `You are a dialogue specialist who writes authentic character conversations.
Each character has a unique voice reflecting their personality, background, and emotional state.`,
        userTemplate: `Write dialogue between the following characters:

Characters: {characters}
Scene Context: {context}
Emotional Tone: {tone}

Ensure each character's voice is distinct and the dialogue advances the plot naturally.`,
      },

      setting_description: {
        system: `You are a world-building expert who creates immersive setting descriptions.
Use sensory details to make locations feel real and atmospheric.`,
        userTemplate: `Describe the following setting:

Location: {location}
Mood: {mood}
Time of Day: {timeOfDay}

Create a vivid description that establishes atmosphere and supports the scene's emotional tone.`,
      },

      story_summary: {
        system: `You are a story development expert who creates compelling story concepts.
Generate story summaries that establish clear themes, conflicts, and emotional arcs.`,
        userTemplate: `Create a story summary with the following parameters:

Genre: {genre}
Themes: {themes}
Target Audience: {audience}
Length: {length}

Generate a compelling premise with clear protagonist, conflict, and stakes.`,
      },
    };
  }

  /**
   * Initialize AI Server (Qwen-3) specific prompts
   * Initially copied from Gemini prompts, can be customized per model
   */
  private initializeAIServerPrompts(): Record<PromptType, PromptTemplate> {
    // Start with Gemini prompts as baseline
    const geminiPrompts = this.initializeGeminiPrompts();

    // Clone and customize for Qwen-3 if needed
    // For now, using same prompts - can be tuned later based on model performance
    return {
      ...geminiPrompts,
      // Example customization for Qwen-3:
      // chapter_generation: {
      //   system: "Qwen-3 optimized system prompt...",
      //   userTemplate: "Qwen-3 optimized user template..."
      // }
    };
  }

  /**
   * Get prompt for specific provider and type
   */
  getPrompt(
    provider: ModelProvider,
    promptType: PromptType,
    variables: Record<string, string> = {}
  ): { system: string; user: string } {
    const template = this.prompts[provider][promptType];

    if (!template) {
      throw new Error(`Prompt not found for provider: ${provider}, type: ${promptType}`);
    }

    // Replace variables in user template
    let userPrompt = template.userTemplate;
    Object.entries(variables).forEach(([key, value]) => {
      userPrompt = userPrompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    return {
      system: template.system,
      user: userPrompt,
    };
  }

  /**
   * Update prompt for specific provider and type
   */
  updatePrompt(
    provider: ModelProvider,
    promptType: PromptType,
    updates: Partial<PromptTemplate>
  ): void {
    const current = this.prompts[provider][promptType];

    this.prompts[provider][promptType] = {
      system: updates.system ?? current.system,
      userTemplate: updates.userTemplate ?? current.userTemplate,
    };
  }

  /**
   * Get all prompts for a provider
   */
  getAllPrompts(provider: ModelProvider): Record<PromptType, PromptTemplate> {
    return this.prompts[provider];
  }
}

// Global singleton instance
export const promptManager = new PromptManager();
