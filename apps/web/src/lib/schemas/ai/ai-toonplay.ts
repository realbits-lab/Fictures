/**
 * AI Schemas for Toonplay Generation
 *
 * Following the Adversity-Triumph Engine pattern:
 * - AiToonplayZodSchema: SSOT for validation
 * - AiToonplayType: Derived TypeScript type
 * - AiToonplayJsonSchema: Derived JSON Schema for AI models
 *
 * Based on toonplay-specification.md and toonplay-development.md
 */

import { z } from "zod";

// ============================================================================
// Comic Panel Specification Schema
// ============================================================================

/**
 * Shot types for visual composition
 * Based on cinematography and webtoon visual grammar
 */
export const shotTypeEnum = z.enum([
    "establishing_shot", // Scene opener, location establishment
    "wide_shot", // Full environment, multiple characters
    "medium_shot", // Main storytelling, conversations
    "close_up", // Emotional beats, reactions
    "extreme_close_up", // Intense emotion, critical details
    "over_shoulder", // Conversations, POV
    "dutch_angle", // Tension, disorientation
]);

/**
 * Sound effect emphasis levels
 */
export const sfxEmphasisEnum = z.enum([
    "normal", // Regular sound effects
    "large", // Impactful moments
    "dramatic", // Climactic, intense moments
]);

/**
 * Individual Comic Panel Specification
 *
 * Every panel must specify all visual grammar components for AI image generation
 */
export const AiComicPanelSpecZodSchema = z.object({
    panel_number: z
        .number()
        .describe("Sequential panel number (1-indexed)"),

    shot_type: shotTypeEnum.describe(
        "Camera framing type (establishing_shot, wide_shot, medium_shot, close_up, etc.)",
    ),

    description: z
        .string()
        .describe(
            "Detailed visual description for AI image generation (200-400 characters)",
        ),

    characters_visible: z
        .array(z.string())
        .describe("Character IDs appearing in this panel (from database)"),

    character_poses: z
        .array(
            z.object({
                character_id: z.string().describe("Character ID from database"),
                pose: z.string().describe("Pose/body language description"),
            }),
        )
        .optional()
        .describe(
            "Specific body language for each character (characterId → pose description)",
        ),

    setting_focus: z
        .string()
        .describe("Which part of the setting is emphasized in this panel"),

    lighting: z
        .string()
        .describe("Lighting description for mood and atmosphere"),

    camera_angle: z
        .string()
        .describe(
            "Camera perspective (low angle, high angle, eye level, bird's eye, etc.)",
        ),

    narrative: z
        .string()
        .optional()
        .describe(
            "Caption text for narration (time/location markers, strategic internal monologue). Use sparingly (<5% of panels for narration, <10% for internal monologue)",
        ),

    dialogue: z
        .array(
            z.object({
                character_id: z.string().describe("Character ID from database"),
                text: z
                    .string()
                    .describe(
                        "Dialogue text (max 150 characters per speech bubble)",
                    ),
                tone: z
                    .string()
                    .optional()
                    .describe(
                        "Emotional tone of dialogue (angry, sad, cheerful, sarcastic, etc.)",
                    ),
            }),
        )
        .describe(
            "Character dialogue for this panel (target: ~70% of panels should have dialogue)",
        ),

    sfx: z
        .array(
            z.object({
                text: z
                    .string()
                    .describe("Sound effect text (BOOM, CRASH, whisper, etc.)"),
                emphasis: sfxEmphasisEnum.describe(
                    "Visual emphasis level (normal, large, dramatic)",
                ),
            }),
        )
        .describe("Sound effects as visual text overlays"),

    mood: z
        .string()
        .describe(
            "Overall emotional tone of the panel (tense, hopeful, melancholic, etc.)",
        ),
});

// Derived TypeScript type
export type AiComicPanelSpecType = z.infer<typeof AiComicPanelSpecZodSchema>;

// ============================================================================
// Complete Toonplay Schema
// ============================================================================

/**
 * Complete Toonplay (Novel-to-Webtoon Adaptation)
 *
 * Converts a narrative scene into a structured comic script with:
 * - 8-12 panels (target: 10)
 * - Visual grammar for each panel
 * - Content proportions: 70% dialogue, 30% visual, <5% narration, <10% internal monologue
 */
export const AiComicToonplayZodSchema = z.object({
    scene_id: z.string().describe("ID of the source scene being adapted"),

    scene_title: z
        .string()
        .describe("Title of this scene/toonplay"),

    total_panels: z
        .number()
        .describe("Total number of panels (target: 8-12)"),

    panels: z
        .array(AiComicPanelSpecZodSchema)
        .describe("Array of panel specifications (8-12 panels)"),

    pacing_notes: z
        .string()
        .optional()
        .describe(
            "Notes on panel spacing and pacing rhythm for webtoon scroll",
        ),

    narrative_arc: z
        .string()
        .describe(
            "Narrative structure of this scene (Setup → Tension → Climax → Resolution)",
        ),
});

// Derived TypeScript type
export type AiComicToonplayType = z.infer<typeof AiComicToonplayZodSchema>;

// ============================================================================
// Toonplay Evaluation Schema
// ============================================================================

/**
 * Evaluation Result for Toonplay Quality Assessment
 *
 * 4-category weighted scoring:
 * - Narrative Fidelity (20%)
 * - Visual Transformation (30%)
 * - Webtoon Pacing (30%)
 * - Script Formatting (20%)
 */
export const AiToonplayEvaluationZodSchema = z.object({
    weighted_score: z
        .number()
        .min(1.0)
        .max(5.0)
        .describe("Overall weighted score (1.0-5.0, passing threshold: 3.0)"),

    passes: z.boolean().describe("True if weighted_score >= 3.0"),

    category_scores: z
        .object({
            narrative_fidelity: z
                .number()
                .min(1)
                .max(5)
                .describe("Preserves story 'soul' (weight: 20%)"),

            visual_transformation: z
                .number()
                .min(1)
                .max(5)
                .describe(
                    "Shows vs tells, strategic internal monologue (weight: 30%)",
                ),

            webtoon_pacing: z
                .number()
                .min(1)
                .max(5)
                .describe("Thumb-scroll optimization (weight: 30%)"),

            script_formatting: z
                .number()
                .min(1)
                .max(5)
                .describe("Production usability (weight: 20%)"),
        })
        .describe("Individual category scores (1-5 scale)"),

    metrics: z
        .object({
            narration_percentage: z
                .number()
                .min(0)
                .max(100)
                .describe("Percentage of panels with narration (target: <5%)"),

            internal_monologue_percentage: z
                .number()
                .min(0)
                .max(100)
                .describe(
                    "Percentage of panels with internal monologue (target: <10%)",
                ),

            dialogue_presence: z
                .number()
                .min(0)
                .max(100)
                .describe("Percentage of panels with dialogue (target: ~70%)"),

            shot_type_distribution: z
                .record(z.string(), z.number())
                .describe("Count of each shot type used"),

            text_overlay_validation: z
                .boolean()
                .describe(
                    "All panels have either dialogue OR narrative (required: 100%)",
                ),

            dialogue_length_compliance: z
                .boolean()
                .describe("All dialogue under 150 characters (required: 100%)"),
        })
        .describe("Automatic metrics calculated from toonplay"),

    recommendations: z
        .array(z.string())
        .describe("Improvement suggestions for failed categories"),

    final_report: z
        .string()
        .min(50)
        .max(2000)
        .describe("Full evaluation breakdown with specific feedback"),
});

// Derived TypeScript type
export type AiToonplayEvaluationType = z.infer<
    typeof AiToonplayEvaluationZodSchema
>;

// ============================================================================
// Toonplay Improvement Schema
// ============================================================================

/**
 * Improved Toonplay after evaluation feedback
 */
export const AiToonplayImprovementZodSchema = z.object({
    improved_toonplay: AiComicToonplayZodSchema.describe(
        "Improved version of toonplay addressing evaluation weaknesses",
    ),

    changes_made: z
        .array(z.string())
        .describe("List of specific improvements made to address issues"),

    addressed_categories: z
        .array(z.string())
        .describe("Category names that were targeted for improvement"),
});

// Derived TypeScript type
export type AiToonplayImprovementType = z.infer<
    typeof AiToonplayImprovementZodSchema
>;
