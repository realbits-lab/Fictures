/**
 * Toonplay Converter Service
 *
 * Converts narrative scene text into panel-by-panel toonplay format
 * optimized for vertical-scroll comics.
 */

import { gateway } from "@ai-sdk/gateway";
import { generateObject } from "ai";
import { z } from "zod";
import type { characters, scenes, settings, stories } from "@/lib/schemas/database";

// ============================================
// SCHEMA DEFINITIONS
// ============================================

export const ComicPanelSpecSchema = z
    .object({
        panel_number: z.number().min(1),
        shot_type: z.enum([
            "establishing_shot",
            "wide_shot",
            "medium_shot",
            "close_up",
            "extreme_close_up",
            "over_shoulder",
            "dutch_angle",
        ]),
        summary: z
            .string()
            .describe("Detailed visual description for image generation"),
        characters_visible: z
            .array(z.string())
            .describe("Array of character IDs visible in panel"),
        character_poses: z
            .record(z.string(), z.string())
            .describe("Map of character_id to pose description"),
        setting_focus: z
            .string()
            .describe("Which part of the setting is emphasized"),
        lighting: z.string().describe("Lighting setup and mood"),
        camera_angle: z
            .string()
            .describe(
                "Camera positioning (e.g., low angle, eye level, birds eye)",
            ),
        narrative: z
            .string()
            .optional()
            .describe(
                "Narrative text explaining the current situation. REQUIRED when characters_visible is empty.",
            ),
        dialogue: z
            .array(
                z.object({
                    character_id: z.string(),
                    text: z
                        .string()
                        .max(200)
                        .describe("Max 200 characters for readability"),
                    tone: z.string().optional(),
                }),
            )
            .default([]),
        sfx: z
            .array(
                z.object({
                    text: z.string(),
                    emphasis: z.enum(["normal", "large", "dramatic"]),
                }),
            )
            .default([]),
        mood: z
            .string()
            .default("neutral")
            .describe("Overall emotional tone of the panel"),
    })
    .refine(
        (data) => {
            // Every panel MUST have either narrative text OR dialogue
            const hasNarrative =
                !!data.narrative && data.narrative.trim().length > 0;
            const hasDialogue = data.dialogue && data.dialogue.length > 0;
            return hasNarrative || hasDialogue;
        },
        {
            message:
                "Every panel MUST have either narrative text OR dialogue. No panel can be without text overlay. This is critical for webtoon readability.",
        },
    );

export const ComicToonplaySchema = z.object({
    scene_id: z.string(),
    scene_title: z.string(),
    total_panels: z.number().min(1).max(12),
    panels: z.array(ComicPanelSpecSchema),
    pacing_notes: z.string().optional(),
    narrative_arc: z
        .string()
        .describe("How the panels collectively tell the scene story"),
});

export type ComicPanelSpec = z.infer<typeof ComicPanelSpecSchema>;
export type ComicToonplay = z.infer<typeof ComicToonplaySchema>;

// ============================================
// TOONPLAY CONVERSION
// ============================================

export interface ConvertToToonplayOptions {
    scene: typeof scenes.$inferSelect;
    characters: (typeof characters.$inferSelect)[];
    setting: typeof settings.$inferSelect;
    storyGenre: string;
    targetPanelCount?: number;
}

export async function convertSceneToToonplay(
    options: ConvertToToonplayOptions,
): Promise<ComicToonplay> {
    const { scene, characters, setting, storyGenre, targetPanelCount } =
        options;

    const sceneTitle = scene.title || "Untitled Scene";

    // Derive narrative context from Adversity-Triumph Engine schema
    const goal = scene.summary || "Advance the story";
    const conflict =
        scene.cyclePhase === "adversity"
            ? "Characters face obstacles and challenges"
            : scene.cyclePhase === "virtue"
              ? "Characters must demonstrate moral courage"
              : "Tension and obstacles";
    const outcome =
        scene.cyclePhase === "consequence"
            ? "Actions lead to meaningful consequences"
            : scene.cyclePhase === "transition"
              ? "Scene transitions to next phase"
              : "Resolution";

    // Map emotionalBeat to emotional shift for toonplay context
    const emotionalFrom =
        scene.emotionalBeat === "fear"
            ? "anxious"
            : scene.emotionalBeat === "hope"
              ? "uncertain"
              : scene.emotionalBeat === "tension"
                ? "tense"
                : scene.emotionalBeat === "despair"
                  ? "defeated"
                  : "neutral";

    const emotionalTo =
        scene.emotionalBeat === "relief"
            ? "relieved"
            : scene.emotionalBeat === "elevation"
              ? "inspired"
              : scene.emotionalBeat === "catharsis"
                ? "transformed"
                : scene.emotionalBeat === "joy"
                  ? "joyful"
                  : "resolved";

    console.log(`\n🎬 Converting scene to toonplay: "${sceneTitle}"`);

    // Build character descriptions from Adversity-Triumph Engine fields
    const characterDescriptions = characters
        .map(
            (c) =>
                `${c.name}: ${c.summary || c.coreTrait || c.internalFlaw || c.externalGoal || "pursuing their goals"}`,
        )
        .join("\n");

    // Build toonplay prompt with detailed visual grammar from docs/comics/comics-toonplay.md
    const toonplayPrompt = `You are an expert comic storyboard artist. Convert this narrative scene into a panel-by-panel toonplay optimized for vertical-scroll comics.

SCENE INFORMATION:
Title: ${sceneTitle}
Goal: ${goal}
Conflict: ${conflict}
Outcome: ${outcome}
Emotional Arc: ${emotionalFrom} → ${emotionalTo}

NARRATIVE CONTENT:
${scene.content}

CHARACTERS PRESENT:
${characterDescriptions}

SETTING:
${setting.name}: ${setting.description || setting.mood || "atmospheric scene"}

GENRE: ${storyGenre}

═══════════════════════════════════════════════════════════════
CORE PRINCIPLES (THE 5 GOLDEN RULES)
═══════════════════════════════════════════════════════════════

1. **Dialogue > Description > Narration** (70% / 30% / <5%)
   - MOST content should be dialogue
   - Show action visually (description field)
   - Use narration ONLY for: time/location markers, essential tone, critical info
   - NEVER use narration for internal monologue or exposition

2. **Show, Don't Tell** (externalize all internal content)
   - Internal monologue → Externalize through action/expression
   - Backstory → Quick 2-3 panel flashback (if absolutely necessary)
   - Emotional state → Dramatic facial expressions, body language
   - World-building → Visual symbols, environmental storytelling

3. **Space = Time** (panel spacing controls perceived duration)
   - More space between panels = Longer perceived moment
   - Less space = Faster perceived moment

4. **Character Consistency** (identical trait descriptions across all panels)
   - Use EXACT same physical traits in every panel

5. **Distill, Don't Duplicate** (preserve the soul, not the text)
   - Identify the "soul" of the scene (core emotional beat)
   - Discard subplots and details that don't translate
   - NOT a 1:1 translation of source text

═══════════════════════════════════════════════════════════════
PANEL STRUCTURE INSTRUCTIONS
═══════════════════════════════════════════════════════════════

1. Break the narrative into ${targetPanelCount || "8-12"} visual panels (TARGET: ${targetPanelCount || 10} PANELS)
   - Aim for ${targetPanelCount || 10} panels for optimal pacing
   - Use more panels for complex action sequences (up to 12)
   - Use fewer panels for quiet, reflective moments (minimum 8)

2. Shot Type Distribution (for ${targetPanelCount || "8-12"} panels):
   - 1 establishing_shot (scene opening or major location change)
   - 2-3 wide_shot (show full action, multiple characters, environment context)
   - 3-5 medium_shot (main storytelling, conversations, character interactions)
   - 2-3 close_up (emotional beats, reactions, important details)
   - 0-1 extreme_close_up (climactic moments, critical details, intense emotion)
   - 0-1 over_shoulder or dutch_angle (special moments, tension)

3. Visual Variety and Pacing:
   - Vary shot types to maintain visual interest
   - Use establishing shots sparingly (scene openings, major transitions)
   - Alternate between wide/medium shots for rhythm
   - Save close-ups for emotional peaks
   - Build tension with shot progression (wide → medium → close-up)

4. TEXT OVERLAY REQUIREMENT (CRITICAL):
   - EVERY PANEL MUST HAVE EITHER NARRATIVE OR DIALOGUE - NO EXCEPTIONS
   - If characters_visible is EMPTY: MUST include "narrative" text
   - If characters_visible has characters: MUST include at least one "dialogue"
   - Narrative: <5% of panels, 1-2 sentences, only when necessary
   - Dialogue: max 2-3 speech bubbles per panel, max 200 chars each
   - VALIDATION ERROR if a panel has neither

5. Maintain character consistency - reference same physical traits across all panels

6. Add sound effects (SFX) for impactful moments (doors, footsteps, impacts, ambient sounds)

7. Ensure each panel advances the story - no redundant panels

═══════════════════════════════════════════════════════════════
VISUAL GRAMMAR LEXICON
═══════════════════════════════════════════════════════════════

Use these cinematography techniques to control narrative and emotional impact:

**CAMERA ANGLES (camera_angle field):**
- "low angle" = Hero Shot - Makes subject powerful, imposing, dominant, threatening
- "high angle" or "bird's eye" = Makes subject weak, vulnerable, small, distant
- "eye level" = Neutral, conversational, equal power dynamic
- "dutch angle" = Creates unease, tension, disorientation, instability

**SHOT TYPES (shot_type field):**
- establishing_shot = Establishes location, emphasizes isolation, shows full environment
- wide_shot = Shows full action, multiple characters, spatial relationships
- medium_shot = Main storytelling, conversations, character interactions (waist-up)
- close_up = Captures emotion, creates intimacy, builds tension (head/shoulders)
- extreme_close_up = Focuses on tiny details (eyes, hands), intense emotion
- over_shoulder = Conversation, two-person scenes, POV perspective

**LIGHTING (lighting field):**
- "rim lighting" or "cool edge" = Separates subject from background, creates halo/isolation
- "chiaroscuro" or "shadow play" = High contrast, drama, mystery, moral ambiguity
- "harsh overhead fluorescent creating shadows" = Interrogation, tension, harshness
- "strong side lighting" = Sharp contrast, tension, cyberpunk/noir feel
- "soft window light" or "diffused natural light" = Calm, neutral, natural, melancholic
- "warm golden sunset" = Romance, nostalgia, hope, comfort
- "cold blue moonlight" = Mystery, loneliness, supernatural

**CHARACTER POSING (character_poses field):**
- Describe exact body language and gestures
- Include emotional expressions (eyes, mouth, eyebrows)
- Specify hand positions and arm placement
- Note if character is moving or static
- Examples: "arms crossed defensively", "hand reaching out tentatively", "shoulders slumped in defeat"

**MOOD (mood field):**
Match the emotional tone: tense, romantic, mysterious, hopeful, desperate, triumphant, melancholic, etc.

═══════════════════════════════════════════════════════════════
ADAPTATION STRATEGY: "SHOW, DON'T TELL"
═══════════════════════════════════════════════════════════════

For each narrative element, externalize through visuals:

| Internal Element | External Visualization |
|------------------|------------------------|
| "I'm so nervous..." | Character bites lip, hands trembling |
| Backstory exposition | Quick 2-3 panel flashback, stylized |
| Character motivation | Silent panels of triggering memory |
| Emotional state | Dramatic facial expressions, body language |
| World-building | Visual symbols, environmental storytelling |

NEVER use narration boxes to explain emotions or motivations.
ALWAYS show through visual action, facial expressions, and dialogue.

═══════════════════════════════════════════════════════════════
CONTENT PROPORTION TARGET
═══════════════════════════════════════════════════════════════

📊 Dialogue:        ~70% (Primary story driver - most panels should have dialogue)
📊 Visual Action:   ~30% (Shown in description field, not told in narration)
📊 Narration:       <5%  (CRITICAL: Use narration in LESS THAN 5% of panels)

For a ${targetPanelCount || 10}-panel scene:
- Maximum narration panels: ${Math.ceil((targetPanelCount || 10) * 0.05)} (ideally 0-1 panels)
- Minimum dialogue panels: ${Math.floor((targetPanelCount || 10) * 0.7)} (7+ panels)

═══════════════════════════════════════════════════════════════

IMPORTANT: This is for a ${storyGenre} story. Match the visual style and tone accordingly.

Return your response as a valid JSON object matching the ComicToonplay schema.`;

    console.log(`   Sending toonplay generation request...`);

    const result = await generateObject({
        model: gateway("google/gemini-2.5-flash-lite"),
        schema: ComicToonplaySchema,
        prompt: toonplayPrompt,
        temperature: 0.7,
    });

    const toonplay = result.object;

    console.log(`   ✅ Toonplay generated: ${toonplay.total_panels} panels`);
    console.log(
        `   Panel types: ${toonplay.panels.map((p) => p.shot_type).join(", ")}`,
    );

    return toonplay;
}
