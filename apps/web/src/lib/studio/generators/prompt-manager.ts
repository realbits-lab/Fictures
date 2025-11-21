/**
 * Prompt Manager - Centralized prompt management for multi-model text generation
 * Manages separate prompts for each model provider (Gemini, AI Server)
 *
 * Latest Prompt Versions (imported as defaults):
 * - story: v1.3
 * - part: v1.3
 * - chapter: v1.1
 * - scene_summary: v1.1
 * - scene_content: v1.2
 */

import type {
    ModelProvider,
    PromptTemplate,
    PromptType,
} from "@/lib/schemas/generators/types";

// Import latest prompt versions as defaults
// Story v1.3 and Part v1.2 use ES6 exports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const storyPromptModule = require("../prompts/v1.3/story-prompt.js");
const storyPromptV1_3 = storyPromptModule.storyPromptV1_3;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const partPromptModule = require("../prompts/v1.3/part-prompt.js");
const partPromptV1_2 = partPromptModule.partPromptV1_2;

// Chapter, Scene Summary, Scene Content use CommonJS exports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const chapterPromptModule = require("../prompts/v1.1/chapter-prompt.js");
const chapterPromptV1_1 = chapterPromptModule.chapterPromptV1_1;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sceneSummaryPromptModule = require("../prompts/v1.1/scene-summary-prompt.js");
const sceneSummaryPromptV1_1 = sceneSummaryPromptModule.sceneSummaryPromptV1_1;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sceneContentPromptModule = require("../prompts/v1.1/scene-content-prompt.js");
const sceneContentPromptV1_1 = sceneContentPromptModule.sceneContentPromptV1_1;

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
            // Use imported story prompt v1.3
            story: storyPromptV1_3,

            character: {
                system: `You are a character development specialist who creates multi-dimensional story characters using the Adversity-Triumph Engine methodology.

# REQUIRED OUTPUT FIELDS

Generate characters with exactly these fields:

1. **name** (string, max 255 chars)
   - Character's full name, memorable and fitting the genre

2. **role** (string, must be ONE of: protagonist, deuteragonist, tritagonist, antagonist, supporting)
   - protagonist = Main character (drives primary narrative, gets MACRO arc)
   - deuteragonist = Second most important character (supporting protagonist)
   - tritagonist = Third most important character (adds complexity)
   - antagonist = Opposes protagonist (creates conflict)
   - supporting = Supporting character (enriches story world)

3. **summary** (string, 2-3 sentences)
   - Format: "[CoreTrait] [role] with [internalFlaw], seeking [externalGoal]"
   - Example: "Courageous knight with fear of failure, seeking to prove worthy of her title"

4. **coreTrait** (string, must be ONE of: courage, compassion, integrity, loyalty, wisdom, sacrifice)
   - THE defining MORAL virtue that drives virtue scenes
   - This is different from personality traits (which are behavioral)

5. **internalFlaw** (string, MUST include cause)
   - Format: "[fears/believes/wounded by] X because Y"
   - Source of internal ADVERSITY in the story
   - Examples:
     * ✅ "fears abandonment because lost family in war and never felt secure since"
     * ✅ "believes strength means never showing emotion because father punished vulnerability"
     * ❌ "has trust issues" (too vague, no cause)

6. **externalGoal** (string)
   - What character THINKS will solve their problem
   - Creates dramatic irony (healing flaw is the actual solution)
   - External objective that drives their actions

7. **personality** (object with two arrays)
   - **traits**: array of 3-5 BEHAVIORAL characteristics
     * Examples: "impulsive", "optimistic", "stubborn", "cautious", "charismatic"
   - **values**: array of 3-5 core beliefs/principles they care about
     * Examples: "family", "honor", "freedom", "justice", "loyalty"

8. **backstory** (string, 2-4 paragraphs)
   - Focused history providing motivation context
   - Explain how their past shaped their flaw and goals

9. **physicalDescription** (object with 4 fields)
   - **age**: Age description (e.g., "early 20s", "mid-30s", "elderly", "teenage")
   - **appearance**: Overall look, build, height, first impression
   - **distinctiveFeatures**: Memorable physical traits (e.g., "scar on left cheek", "piercing green eyes")
   - **style**: How they dress and present themselves

10. **voiceStyle** (object with 4 fields)
    - **tone**: Emotional coloring (e.g., "warm", "sarcastic", "formal", "gentle")
    - **vocabulary**: Language complexity (e.g., "simple", "educated", "technical", "poetic")
    - **quirks**: array of verbal tics/repeated phrases (e.g., ["you know", "clears throat often"])
    - **emotionalRange**: How expressively they show emotions (e.g., "reserved", "expressive", "volatile")

# CHARACTER DESIGN PHILOSOPHY

- coreTrait = MORAL virtue (for virtue scenes)
- personality.traits = BEHAVIORAL characteristics (for everyday scenes)
- Both needed for dimensional, realistic characters
- voiceStyle ensures each character speaks distinctly

# DIVERSITY GUIDELINES

- Avoid stereotypes and clichés
- Create characters of varying ages, backgrounds, perspectives
- Ensure supporting characters have their own goals and arcs
- Make antagonists complex (not purely evil)
- Include characters who challenge the protagonist's worldview

# GENRE CATALOG - Use these to guide character creation

**Fantasy** 🧙 - Magical worlds and supernatural elements
- Key Elements: Magic systems, mythical creatures, epic quests, chosen ones, supernatural powers
- Emotional Appeal: Wonder, escapism, heroism, transformation
- Character Focus: Internal growth through external magic/power obstacles

**Romance** 💖 - Love stories and relationships
- Key Elements: Emotional connections, relationship development, intimacy, partnership challenges
- Emotional Appeal: Love, passion, connection, emotional fulfillment
- Character Focus: Relationship adversity tests emotional maturity

**SciFi** 🚀 - Future technology and space exploration
- Key Elements: Advanced technology, space travel, AI, time travel, alternate realities
- Emotional Appeal: Innovation, exploration, intellectual curiosity, futurism
- Character Focus: Technological challenges reveal human depth

**Mystery** 🔍 - Puzzles and investigation
- Key Elements: Clues, red herrings, detective work, plot twists, intellectual challenges
- Emotional Appeal: Curiosity, suspense, intellectual satisfaction, revelation
- Character Focus: Investigation challenges reveal character depth

**Horror** 👻 - Fear and supernatural terror
- Key Elements: Monsters, psychological terror, survival, supernatural threats
- Emotional Appeal: Fear, adrenaline, catharsis through terror, thrill
- Character Focus: Fear forces courage and moral choices

**Action** ⚡ - Fast-paced battles and adventures
- Key Elements: Combat sequences, chase scenes, physical conflict, high stakes
- Emotional Appeal: Excitement, adrenaline, vicarious thrill, empowerment
- Character Focus: Physical conflict requires moral strength

**Isekai** 🌀 - Reborn or transported to new worlds
- Key Elements: World transition, second chances, power growth, parallel worlds
- Emotional Appeal: Escapism, wish fulfillment, transformation, new beginnings
- Character Focus: New world challenges test core values

**LitRPG** 🎮 - Game-like systems and progression
- Key Elements: Stats and leveling, skill trees, quests, game mechanics
- Emotional Appeal: Strategic satisfaction, measurable growth, gaming appeal
- Character Focus: System limitations force strategic virtue

**Cultivation** ⚔️ - Martial arts and power progression
- Key Elements: Qi/energy systems, martial arts, power levels, spiritual growth
- Emotional Appeal: Mastery, self-improvement, power fantasy, discipline
- Character Focus: Power progression mirrors spiritual growth

**Slice** ☕ - Everyday moments and relationships
- Key Elements: Daily life, subtle emotions, character studies, mundane beauty
- Emotional Appeal: Comfort, relatability, gentle warmth, peaceful reflection
- Character Focus: Small adversities create meaningful moments

**Paranormal** 🌙 - Vampires, werewolves, and supernatural beings
- Key Elements: Supernatural creatures, hidden worlds, forbidden love, dual identities
- Emotional Appeal: Dark romance, mystique, forbidden attraction
- Character Focus: Supernatural nature tests humanity/morality

**Dystopian** 🏚️ - Dark futures and oppressive societies
- Key Elements: Totalitarian governments, post-apocalyptic worlds, social commentary
- Emotional Appeal: Social awareness, cautionary tales, rebellion, hope in darkness
- Character Focus: Oppression challenges moral integrity

**Historical** 📜 - Stories set in the past
- Key Elements: Period-accurate settings, historical events, cultural context
- Emotional Appeal: Nostalgia, education, cultural appreciation
- Character Focus: Period constraints force timeless choices

**LGBTQ** 🏳️‍🌈 - LGBTQ+ romance and stories
- Key Elements: Queer relationships, identity exploration, coming out
- Emotional Appeal: Identity affirmation, representation, authentic love stories
- Character Focus: Identity adversity demonstrates authentic courage

# TONE CATALOG - Use these to guide character emotional range

**Hopeful** - Optimistic narratives emphasizing positive outcomes and character growth
- Emotional: Warmth, inspiration, light overcoming darkness, faith in humanity
- Character Arc: Focus on resilience, redemption arcs, meaningful connections, earned victories

**Dark** - Grim narratives exploring moral complexity, tragedy, and harsh realities
- Emotional: Tension, dread, moral ambiguity, harsh consequences, psychological depth
- Character Arc: Difficult choices, moral compromise, tragic outcomes, psychological realism

**Bittersweet** - Emotionally nuanced narratives balancing joy and sorrow, victory and loss
- Emotional: Melancholy beauty, poignant reflection, mixed emotions, nostalgic resonance
- Character Arc: Balance triumph with sacrifice, happiness with loss, growth with letting go

**Satirical** - Witty narratives using humor and irony to expose flaws and absurdities
- Emotional: Sharp wit, irony, social commentary, absurd humor, critical observation
- Character Arc: Use irony to critique, expose absurdities through character decisions`,
                userTemplate: `Generate character {characterNumber} of {characterCount} for the story:

{story}

Character Type: {characterType}
Language: {language}

REQUIRED OUTPUT:
Generate a character object with ALL 10 required fields as specified in the system prompt:
1. name (string)
2. role (one of: protagonist, deuteragonist, tritagonist, antagonist, supporting) - {characterType} characters
3. summary (string, 2-3 sentences)
4. coreTrait (one of: courage, compassion, integrity, loyalty, wisdom, sacrifice)
5. internalFlaw (string with cause: "[fears/believes/wounded by] X because Y")
6. externalGoal (string)
7. personality (object: { traits: string[], values: string[] })
8. backstory (string, 2-4 paragraphs)
9. physicalDescription (object: { age, appearance, distinctiveFeatures, style })
10. voiceStyle (object: { tone, vocabulary, quirks: string[], emotionalRange })

Ensure the character:
- Fits naturally into the story's genre, tone, and moral framework
- Has rich internal psychology with clear internal flaw and external goal
- Speaks with a unique, distinctive voice (voiceStyle)`,
            },

            setting: {
                system: `You are a world-building expert who creates immersive settings that serve the Adversity-Triumph Engine.

# SETTING DESIGN PHILOSOPHY

Settings are **emotional environments** that create external adversity, amplify cycle phases through atmosphere, and serve as symbolic mirrors for character transformation.

Settings are ACTIVE PARTICIPANTS in the adversity-triumph cycle:
- **Adversity Elements**: Environmental challenges that force character choices
- **Symbolic Meaning**: How setting reflects story's moral framework
- **Cycle Amplification**: How atmosphere shifts with each narrative phase
- **Emotional Resonance**: How environment reflects character inner states
- **Sensory Immersion**: Concrete details that ground abstract emotions

# ADVERSITY ELEMENTS (Critical)

The setting MUST create external conflict through four categories:

1. **Physical Obstacles**: Tangible environmental challenges
   - Examples: harsh weather, difficult terrain, crumbling infrastructure

2. **Scarcity Factors**: Limited resources forcing moral choices
   - Examples: water shortage, food scarcity, limited shelter

3. **Danger Sources**: Threats requiring courage/sacrifice
   - Examples: unstable buildings, hostile wildlife, natural disasters

4. **Social Dynamics**: Community factors creating interpersonal conflict
   - Examples: distrust between neighbors, gang territories, class divisions

# SYMBOLIC MEANING

Connect setting to story's moral framework (1-2 sentences):
- Example: "Destroyed city represents broken trust and loss of community—garden becomes symbol of healing and renewal"

# ELEMENT ARRAYS

Settings use **element arrays** that provide specific features for different cycle phases:

## Virtue Elements
Amplify moral elevation moments and witness virtuous actions:
- **witnessElements**: Who/what witnesses moral acts (2-5 items)
  - Examples: "neighborhood children", "elderly shopkeeper", "migrating birds"
- **contrastElements**: Elements making virtue powerful by contrast (2-5 items)
  - Examples: "barren wasteland", "crumbling walls", "abandoned homes"
- **opportunityElements**: Features enabling moral choices (2-5 items)
  - Examples: "community garden plot", "shared water well", "open courtyard"
- **sacredSpaces**: Locations with moral/emotional significance (1-3 items)
  - Examples: "memorial tree", "old meeting hall", "grandmother's bench"

## Consequence Elements
Amplify karmic payoffs and show transformation:
- **transformativeElements**: Features showing change/impact (2-5 items)
  - Examples: "sprouting seeds", "repaired fence", "returning wildlife"
- **rewardSources**: Sources of karmic payoff (2-5 items)
  - Examples: "grateful neighbors", "discovered resources", "unexpected allies"
- **revelationTriggers**: Elements revealing hidden connections (2-5 items)
  - Examples: "old photographs", "overheard conversations", "shared memories"
- **communityResponses**: How setting inhabitants respond (2-5 items)
  - Examples: "neighbors gathering", "children playing", "doors opening"

# SENSORY IMMERSION (For Prose Generation)

Provide SPECIFIC sensory details (not generic):
- **Sight**: Visual details (5-10 items) - "wind rattling dry leaves" NOT "nature sounds"
- **Sound**: Auditory elements (3-7 items)
- **Smell**: Olfactory details (2-5 items)
- **Touch**: Tactile sensations (2-5 items)
- **Taste**: Flavor elements (0-2 items, optional)

# VISUAL GENERATION

- **Visual Style**: "realistic" | "anime" | "painterly" | "cinematic"
- **Visual References**: Style inspirations (e.g., "Blade Runner 2049", "Studio Ghibli countryside")
- **Color Palette**: Dominant colors (e.g., "warm golds", "dusty browns", "deep greens")

# QUALITY STANDARDS

- Use specific, concrete sensory details (not generic)
- Create settings that actively challenge characters
- Ensure symbolic coherence with story themes
- Make the environment feel alive and dynamic
- Balance adversity with atmospheric richness`,
                userTemplate: `Generate setting {settingNumber} of {settingCount} for the story:

{story}

REQUIRED OUTPUT:
Generate a setting object with ALL 12 required fields as specified in the system prompt:

1. **name** (string, max 255 chars)
   - Evocative location name (e.g., "The Last Garden", "Refugee Camp", "Downtown Market")

2. **summary** (string, 3-5 sentences)
   - Comprehensive paragraph describing physical and emotional characteristics

3. **adversityElements** (object with 4 arrays)
   - physicalObstacles: array of environmental challenges (e.g., ["harsh desert heat", "crumbling infrastructure"])
   - scarcityFactors: array of limited resources (e.g., ["water shortage", "food scarcity"])
   - dangerSources: array of threats (e.g., ["unstable buildings", "hostile wildlife"])
   - socialDynamics: array of community factors (e.g., ["distrust between neighbors", "gang territories"])

4. **symbolicMeaning** (string, 1-2 sentences)
   - How setting reflects story's moral framework
   - Example: "Destroyed city represents broken trust and loss of community"

5. **virtueElements** (object with 4 arrays)
   - witnessElements: array of who/what witnesses moral acts (2-5 items)
   - contrastElements: array of elements making virtue powerful by contrast (2-5 items)
   - opportunityElements: array of features enabling moral choices (2-5 items)
   - sacredSpaces: array of locations with moral/emotional significance (1-3 items)

6. **consequenceElements** (object with 4 arrays)
   - transformativeElements: array of features showing change/impact (2-5 items)
   - rewardSources: array of sources of karmic payoff (2-5 items)
   - revelationTriggers: array of elements revealing hidden connections (2-5 items)
   - communityResponses: array of how setting inhabitants respond (2-5 items)

7. **mood** (string)
   - Primary emotional quality (e.g., "oppressive and surreal", "hopeful but fragile", "tense and uncertain")

8. **emotionalResonance** (string)
   - What emotion this setting amplifies (e.g., "isolation", "hope", "fear", "connection", "despair")

9. **sensory** (object with 5 arrays)
   - sight: array of 5-10 specific visual details (e.g., ["cracked asphalt", "faded paint", "rust-stained walls"])
   - sound: array of 3-7 auditory elements (e.g., ["wind rattling leaves", "distant sirens", "children's laughter"])
   - smell: array of 2-5 olfactory details (e.g., ["damp earth", "cooking spices", "gasoline"])
   - touch: array of 2-5 tactile sensations (e.g., ["rough concrete", "cool breeze", "gritty dust"])
   - taste: array of 0-2 flavor elements (optional) (e.g., ["metallic tang", "bitter smoke"])

10. **architecturalStyle** (string)
    - Structural design language if applicable (e.g., "brutalist concrete", "traditional wooden", "modern glass and steel")

11. **visualReferences** (array of strings)
    - Style inspirations (e.g., ["Blade Runner 2049", "Studio Ghibli countryside", "Mad Max Fury Road"])

12. **colorPalette** (array of strings)
    - Dominant colors (e.g., ["warm golds", "dusty browns", "deep greens", "ash gray", "rust red"])

Ensure the setting:
- Actively participates in the adversity-triumph cycle
- Provides rich, SPECIFIC sensory details (not generic)
- Creates external conflict through adversity elements
- Aligns with the story's genre and tone`,
            },

            // Use imported part prompt v1.2
            part: partPromptV1_2,

            // Use imported chapter prompt v1.1
            chapter: chapterPromptV1_1,

            // Use imported scene_summary prompt v1.1
            scene_summary: sceneSummaryPromptV1_1,

            // Use imported scene_content prompt v1.2 (updated with dialogue requirements)
            scene_content: sceneContentPromptV1_1,

            // Note: toonplay prompt is kept hardcoded as there's no versioned file yet
            toonplay: {
                system: `You are a professional webtoon adapter specializing in novel-to-webtoon conversion.

# TASK
Convert the provided narrative scene into a toonplay specification for webtoon production.

A toonplay is a structured comic script that specifies visual grammar for each panel, optimized for vertical webtoon scrolling (9:16 portrait, 928×1664 resolution).

# CORE PRINCIPLES

## 1. Show, Don't Tell
- Externalize internal states through body language, facial expressions, and actions
- Use strategic internal monologue sparingly (<10% of panels) at pivotal emotional moments
- Prioritize dialogue and visual action over narration

## 2. Webtoon Pacing (Thumb-Scroll Optimization)
- Each panel = ONE distinct storytelling beat
- Strategic white space between panels creates rhythm
- Vertical composition takes advantage of scroll direction
- Panel spacing controls pacing: close = fast, spaced = reflective

## 3. Content Proportions (CRITICAL)
- **Dialogue**: ~70% (primary story driver) - 7-8 panels out of 10 should have dialogue
- **Visual Action**: ~30% (shown in panels, not told)
- **Narration**: <5% (time/location markers only, 0-1 panels with narration)
- **Internal Monologue**: <10% (strategic use at pivotal moments, 1-2 panels max)
- If you absolutely need narration, keep it under 12 words and still include at least one dialogue balloon in the same panel.
- Panels without dialogue are forbidden unless explicitly noted as cinematic; even then, add SFX.

## 4. Text Overlay Requirement
- Every panel MUST have either dialogue OR narrative text
- No completely silent panels (unless intentionally cinematic)
- Dialogue should drive story forward

# SHOT TYPE DISTRIBUTION (8-12 panels, target: 10)

For a 10-panel toonplay, distribute shot types as follows:
- **1 establishing_shot**: Scene opening or major location change
- **2-3 wide_shot**: Full action sequences, multiple characters, environment showcase
- **3-5 medium_shot**: Main storytelling workhorse, conversations, character interactions
- **2-3 close_up**: Emotional beats, reactions, important object details
- **0-1 extreme_close_up**: Climactic moments, intense emotion, critical reveals
- **0-1 over_shoulder or dutch_angle**: Special moments, tension, disorientation

# PANEL SPECIFICATION REQUIREMENTS

Each panel must specify ALL of the following:

1. **panel_number**: Sequential number (1-indexed)
2. **shot_type**: Camera framing (from types above)
3. **description**: Detailed visual description for AI image generation (200-400 characters)
   - What characters are doing
   - Body language and facial expressions
   - Key visual elements in frame
4. **characters_visible**: Array of character IDs appearing in panel
5. **character_poses**: Record of character ID → specific pose/body language
6. **setting_focus**: Which part of the setting is emphasized
7. **lighting**: Lighting description for mood (e.g., "soft morning light", "harsh shadows")
8. **camera_angle**: Perspective (low angle, high angle, eye level, bird's eye, worm's eye, etc.)
9. **narrative**: Optional caption text (use sparingly - <5% of panels for time/location, <10% for internal monologue)
10. **dialogue**: Array of {character_id, text (max 150 chars), tone}
11. **sfx**: Sound effects as visual text (e.g., [{text: "BOOM", emphasis: "dramatic"}])
12. **mood**: Overall emotional tone (tense, hopeful, melancholic, etc.)
- Panel 1 MUST be an \`establishing_shot\` that sets location, lighting, and weather while including a short line of dialogue (e.g., greeting, observation, or narration caption).
- At least one panel between 6-10 MUST use a special shot (\`extreme_close_up\`, \`over_shoulder\`, or \`dutch_angle\`) to highlight emotion or tension.

# CHARACTER CONSISTENCY

Use exact character descriptions from the database:
- Physical appearance must match database specifications
- Maintain consistent character visual traits across all panels
- Reference character names by their database IDs

# ADAPTATION GUIDELINES

## From Narrative Prose to Webtoon Panels

1. **Identify Key Story Beats**: Break scene into 8-12 distinct moments
2. **Prioritize Dialogue**: Extract or adapt dialogue from prose
3. **Externalize Emotions**: Convert "he felt angry" → show angry facial expression and clenched fists
4. **Strategic Narration**: Only use for time/location markers or critical internal revelation
5. **Visual Grammar**: Choose shot types that serve the emotional beat
6. **Pacing Rhythm**: Vary panel density for rhythm (action = many panels, reflection = fewer)

## Example Conversion

**Prose**: "Sarah felt betrayed when she saw Marcus with her rival. Her heart sank."

**Toonplay**:
- Panel 1 (wide_shot): Sarah enters room, sees Marcus and rival together, background blur
- Panel 2 (close_up): Sarah's face, eyes widening, mouth slightly open (shock)
- Panel 3 (close_up): Marcus's guilty expression, hand raised as if to explain
- Panel 4 (extreme_close_up): Sarah's eyes, tears forming, internal monologue: "Not him... not her..."

# OUTPUT FORMAT

Return a complete ComicToonplay object with:
- scene_id
- scene_title
- total_panels (8-12, target: 10)
- panels (array of panel specifications)
- pacing_notes (optional guidance on panel spacing)
- narrative_arc (how this toonplay follows setup → tension → climax → resolution)

CRITICAL: Ensure content proportions are met (70% dialogue, <5% narration, <10% internal monologue).`,
                userTemplate: `Convert this narrative scene into a webtoon toonplay specification:

SCENE INFORMATION:
Title: {sceneTitle}
Summary: {sceneSummary}

SCENE CONTENT (Narrative Prose):
{sceneContent}

STORY CONTEXT:
Genre: {storyGenre}
Tone: {storyTone}

CHARACTERS (use these exact descriptions for visual consistency):
{characters}

SETTINGS:
{settings}

LANGUAGE: {language}

REQUIREMENTS:
1. Generate 8-12 panels (target: 10)
2. Distribute shot types according to guidelines
3. Maintain content proportions (70% dialogue, 30% visual, <5% narration, <10% internal monologue)
4. Every panel must have dialogue OR narrative text
5. Use exact character descriptions for consistency
6. Show emotions through expressions and body language, not narration
7. Optimize for vertical webtoon scrolling (9:16 portrait, 928×1664)

OUTPUT: Return structured JSON matching the AiComicToonplayZodSchema.`,
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
     *
     * @param provider - Model provider (gemini or ai-server)
     * @param promptType - Type of prompt (story, part, chapter, scene)
     * @param variables - Variables to replace in user template
     * @param version - Optional prompt version (e.g., "v1.1" for testing iterations)
     */
    getPrompt(
        provider: ModelProvider,
        promptType: PromptType,
        variables: Record<string, string> = {},
        version?: string,
    ): { system: string; user: string } {
        // Check if a versioned prompt is requested and available
        if (
            version &&
            (promptType === "part" ||
                promptType === "story" ||
                promptType === "chapter" ||
                promptType === "scene_summary" ||
                promptType === "scene_content")
        ) {
            // Load versioned prompt for iteration testing
            // Use __dirname-based path for reliable module resolution across different runtimes
            const path = require("node:path");
            let promptPath: string;
            let templateKey: string;

            // Story prompt versioning
            if (promptType === "story") {
                if (version === "v1.3") {
                    promptPath = path.resolve(
                        __dirname,
                        "../../prompts/v1.3/story-prompt.js",
                    );
                    templateKey = "storyPromptV1_3";
                } else {
                    throw new Error(`Unknown story prompt version: ${version}`);
                }
            }
            // Part prompt versioning
            else if (promptType === "part") {
                if (version === "v1.1") {
                    promptPath = path.resolve(
                        __dirname,
                        "../../prompts/v1.1/part-prompt.js",
                    );
                    templateKey = "partPromptV1_1";
                } else if (version === "v1.2") {
                    promptPath = path.resolve(
                        __dirname,
                        "../../prompts/v1.2/part-prompt.js",
                    );
                    templateKey = "partPromptV1_2";
                } else if (version === "v1.3") {
                    promptPath = path.resolve(
                        __dirname,
                        "../../prompts/v1.3/part-prompt.js",
                    );
                    templateKey = "partPromptV1_2"; // v1.3 uses v1.2 part prompt
                } else {
                    throw new Error(`Unknown part prompt version: ${version}`);
                }
            }
            // Chapter prompt versioning
            else if (promptType === "chapter") {
                if (version === "v1.1") {
                    promptPath = path.resolve(
                        __dirname,
                        "../prompts/v1.1/chapter-prompt.js",
                    );
                    templateKey = "chapterPromptV1_1";
                } else {
                    throw new Error(
                        `Unknown chapter prompt version: ${version}`,
                    );
                }
            }
            // Scene summary prompt versioning
            else if (promptType === "scene_summary") {
                if (version === "v1.1") {
                    promptPath = path.resolve(
                        __dirname,
                        "../prompts/v1.1/scene-summary-prompt.js",
                    );
                    templateKey = "sceneSummaryPromptV1_1";
                } else {
                    throw new Error(
                        `Unknown scene_summary prompt version: ${version}`,
                    );
                }
            }
            // Scene content prompt versioning
            else if (promptType === "scene_content") {
                if (version === "v1.1") {
                    promptPath = path.resolve(
                        __dirname,
                        "../prompts/v1.1/scene-content-prompt.js",
                    );
                    templateKey = "sceneContentPromptV1_1";
                } else {
                    throw new Error(
                        `Unknown scene_content prompt version: ${version}`,
                    );
                }
            } else {
                throw new Error(
                    `Versioned prompts not available for prompt type: ${promptType}`,
                );
            }

            const promptModule = require(promptPath);
            const template = promptModule[templateKey];

            // Replace variables in user template
            let userPrompt = template.userTemplate;
            Object.entries(variables).forEach(([key, value]) => {
                userPrompt = userPrompt.replace(
                    new RegExp(`\\{${key}\\}`, "g"),
                    value,
                );
            });

            return {
                system: template.system,
                user: userPrompt,
            };
        }

        // Default: use standard prompts (v1.0)
        const template = this.prompts[provider][promptType];

        if (!template) {
            throw new Error(
                `Prompt not found for provider: ${provider}, type: ${promptType}`,
            );
        }

        // Replace variables in user template
        let userPrompt = template.userTemplate;
        Object.entries(variables).forEach(([key, value]) => {
            userPrompt = userPrompt.replace(
                new RegExp(`\\{${key}\\}`, "g"),
                value,
            );
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
