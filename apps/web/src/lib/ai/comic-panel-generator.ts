/**
 * Comic Panel Generator
 *
 * Main orchestrator for converting HNS scene narrative into visually compelling
 * comic panels with AI-generated images optimized for vertical scroll.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import type { characters, scenes, settings } from "@/lib/schemas/database";
import { comicPanels, scenes as scenesTable } from "@/lib/schemas/database";
import {
    buildPanelCharacterPrompts,
    extractKeyPhysicalTraits,
} from "@/lib/services/character-consistency";
import {
    calculateTotalHeight,
    estimateReadingTime,
} from "@/lib/services/comic-layout";
import { generateStoryImage } from "@/lib/services/image-generation";
import { generateToonplayWithEvaluation } from "@/lib/services/toonplay-improvement-loop";
import type { ComicToonplay } from "./toonplay-converter";

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sanitize image prompt to avoid content filter triggers
 */
function sanitizePromptForContentFilter(
    originalPrompt: string,
    attemptNumber: number,
): string {
    let sanitized = originalPrompt;

    // List of potentially sensitive words/phrases to remove or replace
    const sensitiveTerms = [
        // Emotional distress
        { pattern: /distress(ed)?/gi, replacement: "concern" },
        { pattern: /hurt/gi, replacement: "affected" },
        { pattern: /pain(ful)?/gi, replacement: "discomfort" },
        { pattern: /erase(d)?/gi, replacement: "reset" },
        { pattern: /scar(red)?/gi, replacement: "worried" },
        { pattern: /terrif(ied|ying)/gi, replacement: "anxious" },
        { pattern: /desperat(e|ion)/gi, replacement: "determined" },

        // Physical descriptions that might trigger filters
        { pattern: /slumped/gi, replacement: "seated" },
        { pattern: /trembl(ing|e)/gi, replacement: "moving" },
        { pattern: /tears?/gi, replacement: "eyes glistening" },
    ];

    // Apply sanitization based on attempt number
    if (attemptNumber === 1) {
        // First retry: Remove sensitive emotional terms
        sensitiveTerms.forEach(({ pattern, replacement }) => {
            sanitized = sanitized.replace(pattern, replacement);
        });
    } else if (attemptNumber >= 2) {
        // Second retry: Use a very generic, safe description
        // Extract just the basic setting and shot type
        const genre =
            sanitized.match(/Professional\s+(\w+\s?\w*)\s+comic panel/i)?.[1] ||
            "Science Fiction";
        const shotType =
            sanitized.match(/comic panel,\s+([\w\s]+),/i)?.[1] || "medium shot";

        sanitized = `Professional ${genre} comic panel, ${shotType}, cinematic composition. Characters in a futuristic setting with neutral expressions, clean modern environment, balanced lighting.`;
    }

    return sanitized;
}

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface GenerateComicPanelsOptions {
    sceneId: string;
    scene: typeof scenes.$inferSelect;
    characters: (typeof characters.$inferSelect)[];
    setting: typeof settings.$inferSelect;
    story: { story_id: string; genre: string | null };
    targetPanelCount?: number;
    progressCallback?: (current: number, total: number, status: string) => void;
}

export interface GeneratedPanel {
    id: string;
    panel_number: number;
    shot_type: string;
    image_url: string;
    image_variants: any;
    narrative?: string;
    dialogue: any[];
    sfx: any[];
    metadata: any;
}

export interface ComicPanelGenerationResult {
    toonplay: ComicToonplay;
    panels: GeneratedPanel[];
    evaluation?: {
        weighted_score: number;
        passes: boolean;
        iterations: number;
        final_report: string;
    };
    metadata: {
        total_generation_time: number;
        total_panels: number;
        total_images: number;
        total_height: number;
        estimated_reading_time: string;
    };
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export async function generateComicPanels(
    options: GenerateComicPanelsOptions,
): Promise<ComicPanelGenerationResult> {
    const startTime = Date.now();
    const {
        scene,
        characters,
        setting,
        story,
        targetPanelCount,
        progressCallback,
    } = options;

    // Use database field names (not legacy HNS names)
    const sceneId = scene.id;
    const sceneTitle = scene.title;

    console.log(
        `\n🎬 ============= COMIC PANEL GENERATION START =============`,
    );
    console.log(`   Scene: ${sceneTitle}`);
    console.log(`   Scene ID: ${sceneId}`);
    console.log(`   Genre: ${story.genre}`);

    // ========================================
    // STEP 1: Generate Toonplay with Quality Evaluation
    // ========================================

    progressCallback?.(
        0,
        100,
        "Generating toonplay with quality evaluation...",
    );

    const toonplayResult = await generateToonplayWithEvaluation({
        scene,
        characters,
        setting,
        storyGenre: story.genre,
        targetPanelCount,
        maxIterations: 2,
        passingScore: 3.0,
    });

    const toonplay = toonplayResult.toonplay;

    console.log(`✅ Toonplay generated: ${toonplay.total_panels} panels`);
    console.log(
        `   Quality Score: ${toonplayResult.evaluation.weighted_score.toFixed(2)}/5.0 ${toonplayResult.evaluation.passes ? "✅" : "⚠️"}`,
    );
    console.log(`   Iterations: ${toonplayResult.iterations}`);

    // Log evaluation report
    console.log("\n" + toonplayResult.final_report);

    progressCallback?.(
        20,
        100,
        `Toonplay ready: ${toonplay.total_panels} panels (score: ${toonplayResult.evaluation.weighted_score.toFixed(1)}/5.0)`,
    );

    // ========================================
    // STEP 2: Generate Panel Images
    // ========================================

    const generatedPanels: GeneratedPanel[] = [];
    const totalPanels = toonplay.panels.length;

    for (let i = 0; i < toonplay.panels.length; i++) {
        const panelSpec = toonplay.panels[i];
        const progress = 20 + Math.floor((i / totalPanels) * 70);

        progressCallback?.(
            progress,
            100,
            `Generating panel ${i + 1}/${totalPanels}: ${panelSpec.shot_type}`,
        );

        console.log(
            `\n🎨 Panel ${i + 1}/${totalPanels}: ${panelSpec.shot_type}`,
        );

        // Build character descriptions for this panel
        const characterPrompts = buildPanelCharacterPrompts(
            panelSpec.characters_visible,
            characters,
            panelSpec.character_poses as Record<string, string>,
        );

        // Extract key traits for emphasis (use 'id' not 'character_id')
        const keyTraits = panelSpec.characters_visible
            .flatMap((charId) => {
                const char = characters.find((c) => c.id === charId);
                return char ? extractKeyPhysicalTraits(char) : [];
            })
            .join(", ");

        // Construct full image prompt (use 'mood' not 'atmosphere')
        const imagePrompt = buildPanelImagePrompt({
            genre: story.genre || "general",
            shotType: panelSpec.shot_type,
            cameraAngle: panelSpec.camera_angle,
            settingFocus: panelSpec.setting_focus,
            settingAtmosphere: setting.mood || "neutral",
            characterPrompts,
            keyTraits,
            lighting: panelSpec.lighting,
            summary: panelSpec.summary,
            mood: panelSpec.mood,
        });

        console.log(`   Prompt: ${imagePrompt.substring(0, 100)}...`);

        // Generate image with automatic retry for content filter errors
        let imageResult;
        let attemptCount = 0;
        const maxAttempts = 3;

        while (attemptCount < maxAttempts) {
            try {
                const promptToUse =
                    attemptCount === 0
                        ? imagePrompt
                        : sanitizePromptForContentFilter(
                              imagePrompt,
                              attemptCount,
                          );

                if (attemptCount > 0) {
                    console.log(
                        `   ⚠️  Retrying with sanitized prompt (attempt ${attemptCount + 1}/${maxAttempts})...`,
                    );
                }

                imageResult = await generateStoryImage({
                    prompt: promptToUse,
                    storyId: story.story_id,
                    imageType: "comic-panel",
                    sceneId: sceneId,
                    style: "vivid",
                    quality: "standard",
                });

                break; // Success!
            } catch (error: any) {
                attemptCount++;
                const isContentFilter =
                    error.message?.includes("content filter") ||
                    error.message?.includes("safety system");

                if (!isContentFilter || attemptCount >= maxAttempts) {
                    console.error(
                        `   ✗ Image generation failed after ${attemptCount} attempts:`,
                        error.message,
                    );
                    throw error;
                }

                console.log(
                    `   ⚠️  Content filter triggered, sanitizing prompt...`,
                );
            }
        }

        if (!imageResult) {
            throw new Error("Failed to generate image after all attempts");
        }

        console.log(`   ✅ Image generated: ${imageResult.url}`);
        console.log(
            `   ✅ Variants: ${imageResult.optimizedSet?.variants.length || 0}`,
        );

        // Store panel in database
        const panelId = nanoid();
        await db.insert(comicPanels).values({
            id: panelId,
            sceneId: sceneId,
            panelNumber: panelSpec.panel_number,
            shotType: panelSpec.shot_type,
            imageUrl: imageResult.url,
            imageVariants: imageResult.optimizedSet as any,
            narrative: panelSpec.narrative || null,
            dialogue: panelSpec.dialogue as any,
            sfx: panelSpec.sfx as any,
            summary: panelSpec.summary,
            metadata: {
                prompt: imagePrompt,
                characters_visible: panelSpec.characters_visible,
                camera_angle: panelSpec.camera_angle,
                mood: panelSpec.mood,
                generated_at: new Date().toISOString(),
            } as any,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        generatedPanels.push({
            id: panelId,
            panel_number: panelSpec.panel_number,
            shot_type: panelSpec.shot_type,
            image_url: imageResult.url,
            image_variants: imageResult.optimizedSet,
            narrative: panelSpec.narrative,
            dialogue: panelSpec.dialogue,
            sfx: panelSpec.sfx,
            metadata: {
                prompt: imagePrompt,
                characters_visible: panelSpec.characters_visible,
                camera_angle: panelSpec.camera_angle,
                mood: panelSpec.mood,
                generated_at: new Date().toISOString(),
            },
        });

        // Rate limiting delay
        if (i < totalPanels - 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }

    progressCallback?.(100, 100, "Panel generation complete!");

    // Calculate final statistics
    const totalHeight = calculateTotalHeight(generatedPanels);
    const readingTime = estimateReadingTime(generatedPanels);
    const totalTime = Date.now() - startTime;

    console.log(
        `\n✅ ============= COMIC PANEL GENERATION COMPLETE =============`,
    );
    console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`   Panels Generated: ${generatedPanels.length}`);
    console.log(`   Images Generated: ${generatedPanels.length}`);
    console.log(`   Total Height: ${totalHeight}px`);
    console.log(`   Estimated Reading Time: ${readingTime.formatted}`);

    // Update scene metadata with comics generation info and toonplay
    console.log(`\n📝 Updating scene metadata for ${sceneId}...`);
    await db
        .update(scenesTable)
        .set({
            comicStatus: "draft",
            comicToonplay: toonplay as any, // Store the generated toonplay specification
            comicGeneratedAt: new Date().toISOString(),
            comicPanelCount: generatedPanels.length,
        })
        .where(eq(scenesTable.id, sceneId));
    console.log(`✅ Scene metadata updated successfully (including toonplay)`);

    return {
        toonplay,
        panels: generatedPanels,
        evaluation: {
            weighted_score: toonplayResult.evaluation.weighted_score,
            passes: toonplayResult.evaluation.passes,
            iterations: toonplayResult.iterations,
            final_report: toonplayResult.final_report,
        },
        metadata: {
            total_generation_time: totalTime,
            total_panels: generatedPanels.length,
            total_images: generatedPanels.length,
            total_height: totalHeight,
            estimated_reading_time: readingTime.formatted,
        },
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface BuildPanelImagePromptOptions {
    genre: string;
    shotType: string;
    cameraAngle: string;
    settingFocus: string;
    settingAtmosphere?: string;
    characterPrompts: string;
    keyTraits: string;
    lighting: string;
    summary: string;
    mood: string;
}

function buildPanelImagePrompt(options: BuildPanelImagePromptOptions): string {
    const {
        genre,
        shotType,
        cameraAngle,
        settingFocus,
        settingAtmosphere,
        characterPrompts,
        keyTraits,
        lighting,
        summary,
        mood,
    } = options;

    const prompt = `Professional ${genre} comic panel, ${shotType}, ${cameraAngle}.

SCENE: ${settingFocus}${settingAtmosphere ? `. ${settingAtmosphere}` : ""}.

CHARACTERS: ${characterPrompts}

LIGHTING: ${lighting}

ACTION: ${summary}

MOOD: ${mood}

COMPOSITION RULES FOR 7:4 LANDSCAPE FORMAT (1344×768):
- This is a 7:4 aspect ratio (1.75:1) - landscape-oriented widescreen
- Cinematic horizontal composition - wider than tall
- Frame composition: Utilize horizontal space for panoramic storytelling
- For establishing shots: Show expansive width - landscapes, cityscapes, wide environments
- For medium shots: Position characters off-center using rule of thirds, horizontal negative space
- For close-ups: Frame character detail with horizontal breathing room
- Background: Extend horizontally - show more left-right environment detail
- Multiple characters: Arrange side-by-side or use depth (foreground/background positioning)

VISUAL STYLE:
- Clean comic linework, vibrant colors, semi-realistic proportions
- Professional ${genre} comic art style, cinematic composition
- Similar to Naver COMIC/Webtoon quality

CRITICAL CHARACTER CONSISTENCY:
Maintain exact character appearances - ${keyTraits}

FRAME FILL REQUIREMENT:
Fill the ENTIRE 7:4 landscape frame completely from edge to edge.
No blank margins, no empty space, no letterboxing, no pillarboxing.
Utilize the full horizontal width and full vertical height.
The composition must reach all four edges of the 1344×768 canvas.

BACKGROUND/MARGIN FALLBACK:
If any margins, padding, or blank space cannot be avoided, use PURE WHITE (#FFFFFF) background.
NEVER use black, gray, or colored margins - ONLY pure white (#FFFFFF).
This is critical: any padding MUST be white, not black.`;

    return prompt;
}
