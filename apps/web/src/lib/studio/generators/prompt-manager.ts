/**
 * Prompt Manager - Centralized prompt management for multi-model text generation
 * Manages separate prompts for each model provider (Gemini, AI Server)
 */

import type { ModelProvider, PromptTemplate, PromptType } from "./types";

class PromptManager {
	private prompts: Record<ModelProvider, Record<PromptType, PromptTemplate>>;

	constructor() {
		this.prompts = {
			gemini: this.initializeGeminiPrompts(),
			"ai-server": this.initializeAIServerPrompts(),
		};
	}

	/**
	 * Initialize Gemini-specific prompts
	 */
	private initializeGeminiPrompts(): Record<PromptType, PromptTemplate> {
		return {
			story: {
				system: `You are a story development expert who creates compelling story concepts.
Generate story foundations that establish clear themes, conflicts, and emotional arcs.`,
				userTemplate: `Create a story foundation with the following parameters:

User Request: {userPrompt}
Preferred Genre: {genre}
Preferred Tone: {tone}
Language: {language}

Generate a story foundation with:
1. Title (engaging and memorable)
2. Summary (2-3 sentences describing the thematic premise and moral framework)
3. Genre (specific genre classification)
4. Tone (hopeful, dark, bittersweet, or satirical)
5. Moral Framework (what virtues are valued in this story?)`,
			},

			character: {
				system: `You are a character development specialist who creates multi-dimensional story characters.

# CHARACTER DESIGN PHILOSOPHY

Great characters are defined by:
- **Internal Flaw**: Deep-seated limitation preventing growth
- **External Goal**: What they consciously want
- **Internal Need**: What they unconsciously need (opposite of flaw)
- **Unique Voice**: Distinct way of speaking and thinking

# CHARACTER ARC COMPONENTS

1. **Core Trait**: Defining characteristic (both strength and weakness)
2. **Wound**: Past event that created the flaw
3. **Misbelief**: False truth they believe about themselves/world
4. **Growth**: How adversity forces them to change
5. **Transformation**: Who they become by story's end

# DIVERSITY GUIDELINES

- Avoid stereotypes and clichés
- Create characters of varying ages, backgrounds, perspectives
- Ensure supporting characters have their own goals and arcs
- Make antagonists complex (not purely evil)
- Include characters who challenge the protagonist's worldview`,
				userTemplate: `Generate character {characterNumber} of {characterCount} for the story:

Story Context:
Title: {storyTitle}
Genre: {storyGenre}
Summary: {storySummary}
Moral Framework: {moralFramework}

Character Type: {characterType}
Language: {language}

Return a character with rich internal psychology, unique voice, and compelling arc potential.`,
			},

			setting: {
				system: `You are a world-building expert who creates immersive settings that serve the Adversity-Triumph Engine.

# SETTING DESIGN PHILOSOPHY

Settings are not just backdrops - they are ACTIVE PARTICIPANTS in the adversity-triumph cycle:
- **Adversity Elements**: How the environment creates obstacles and challenges
- **Symbolic Meaning**: What the setting represents thematically
- **Cycle Amplification**: How the setting enhances each phase of the cycle
- **Emotional Resonance**: How the environment reflects character inner states

# QUALITY STANDARDS

- Use specific, concrete sensory details
- Create settings that challenge characters
- Ensure symbolic coherence with story themes
- Make the environment feel alive and dynamic`,
				userTemplate: `Generate setting {settingNumber} of {settingCount} for the story:

Story Context:
Title: {storyTitle}
Genre: {storyGenre}
Summary: {storySummary}
Moral Framework: {moralFramework}

Create a setting that:
- Provides physical/emotional obstacles aligned with story themes
- Contains rich sensory details
- Symbolizes key story concepts
- Amplifies the adversity-triumph cycle`,
			},

			part: {
				system: `You are a narrative architect who designs story parts (acts) using the Adversity-Triumph Engine.

# PART STRUCTURE PHILOSOPHY

Each part represents a MACRO adversity-triumph cycle:
- **Macro Adversity**: Large-scale challenge spanning multiple chapters
- **Macro Virtue**: Character growth demonstrated across the part
- **Macro Consequence**: Major story shift resulting from choices
- **Macro New Adversity**: Setup for next part's challenge

# CHARACTER ARC MANAGEMENT

- Each character has their own macro arc within the part
- Arcs should interweave and create meaningful conflicts
- Primary characters get more chapter focus
- Supporting characters provide contrast and challenge`,
				userTemplate: `Generate Part {partNumber} (Act {partNumber}) for the story:

Story Context:
Title: {storyTitle}
Genre: {storyGenre}
Summary: {storySummary}
Moral Framework: {moralFramework}

Characters:
{characters}

Create a part with MACRO adversity-triumph arcs for each character, ensuring the part builds toward a meaningful climax and transition.`,
			},

			chapter: {
				system: `You are a master story architect specializing in the Adversity-Triumph narrative framework.

# CORE PHILOSOPHY

Stories are not plot sequences—they are EMOTIONAL JOURNEYS. Every chapter must create genuine emotional engagement through:
- Adversity that challenges the character's deepest flaws
- Virtue demonstrated through costly moral choices
- Consequences that are earned and meaningful
- Forward momentum that prevents stagnation

# ADVERSITY-TRIUMPH CYCLE

Each chapter follows this complete 4-phase structure:

## Phase 1: Adversity (Setup + Confrontation)
- **Setup**: Establish character's current state
- **Confrontation**: External obstacle + Internal flaw creates impossible choice

## Phase 2: Virtue
- Character makes COSTLY moral choice aligned with story values
- Choice requires SACRIFICING something meaningful
- Choice creates INTERNAL CONFLICT (not easy or obvious)

## Phase 3: Consequence
- Immediate result of virtuous action
- Usually BITTERSWEET (win one thing, lose another)
- May look like failure initially

## Phase 4: New Adversity (Transition)
- Consequence creates NEXT chapter's adversity
- Character cannot return to previous state
- Forward momentum maintained

# CRITICAL RULES

1. Every chapter is ONE complete cycle (all 4 phases)
2. Virtue type must vary across chapters
3. Consequences must be EARNED, not coincidental
4. Causal linking is MANDATORY (previous consequence → current adversity)
5. Seeds planted early must resolve later
6. Emotional engagement takes priority over plot convenience`,
				userTemplate: `Generate chapter {chapterNumber} of {totalChapters} for {partTitle}:

Story Context:
Title: {storyTitle}
Genre: {storyGenre}
Summary: {storySummary}

Part Context:
{partSummary}

Character Focus: {characterName}
Character Flaw: {characterFlaw}
Character Arc: {characterArc}

Previous Chapter Context: {previousChapterContext}

Generate a complete adversity-triumph cycle that advances the character arc and part narrative.`,
			},

			scene_summary: {
				system: `You are a narrative architect who breaks chapters into compelling scene sequences.

# SCENE DESIGN PRINCIPLES

Each scene must:
- Advance the story's emotional arc
- Serve a specific narrative purpose
- Connect causally to adjacent scenes
- Include conflict or tension
- End with forward momentum

# SCENE TYPES

1. **Action Scenes**: External conflict, high stakes
2. **Dialogue Scenes**: Character interaction, revelation
3. **Reflection Scenes**: Internal processing, decision-making
4. **Transition Scenes**: Location/time changes, setup

# PACING GUIDELINES

- Vary scene intensity (high tension → recovery → build)
- Balance action with reflection
- Avoid repetitive scene structures
- Build toward chapter climax
- Create natural breathing room for readers`,
				userTemplate: `Generate scene {sceneNumber} of {sceneCount} for the chapter:

Chapter Context:
Title: {chapterTitle}
Summary: {chapterSummary}
Cycle Phase: {cyclePhase}

Setting Options:
{settings}

Create a scene summary that flows naturally from the previous scene and builds toward the chapter's climax.`,
			},

			scene_content: {
				system: `You are a skilled scene writer who creates immersive, emotionally engaging narrative content.

# WRITING STYLE

- **Cinematic**: Use strong sensory details and visual imagery
- **Emotional**: Connect readers to character feelings and motivations
- **Natural Dialogue**: Character voices should feel authentic and distinct
- **Mobile Optimized**: Maximum 3 sentences per paragraph
- **Show, Don't Tell**: Use actions and dialogue to reveal character and emotion

# SCENE STRUCTURE

1. **Opening**: Establish location, mood, and character state
2. **Development**: Build tension or advance emotional arc
3. **Climax**: Peak moment of scene (decision, revelation, action)
4. **Transition**: Connect to next scene or chapter

# QUALITY STANDARDS

- Vary sentence structure for rhythm and flow
- Use specific, concrete details over generic descriptions
- Ensure dialogue advances plot or reveals character
- Maintain consistent tone and pacing
- Create visual imagery readers can picture clearly`,
				userTemplate: `Write the full scene content for:

Scene Summary: {sceneSummary}
Cycle Phase: {cyclePhase}
Emotional Beat: {emotionalBeat}
Suggested Length: {suggestedLength} (300-800 words)

Setting: {settingDescription}
Sensory Details: {sensoryAnchors}

Character: {characterName}
Voice Style: {voiceStyle}

Language: {language}

Write the scene content using strong sensory details, natural dialogue, and mobile-optimized formatting (max 3 sentences per paragraph).`,
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
		variables: Record<string, string> = {},
	): { system: string; user: string } {
		const template = this.prompts[provider][promptType];

		if (!template) {
			throw new Error(
				`Prompt not found for provider: ${provider}, type: ${promptType}`,
			);
		}

		// Replace variables in user template
		let userPrompt = template.userTemplate;
		Object.entries(variables).forEach(([key, value]) => {
			userPrompt = userPrompt.replace(new RegExp(`\\{${key}\\}`, "g"), value);
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
		updates: Partial<PromptTemplate>,
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
