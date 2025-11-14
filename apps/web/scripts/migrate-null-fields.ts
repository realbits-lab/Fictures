/**
 * Data Migration Script: Update NULL fields to default values
 *
 * This script updates existing database records with NULL values
 * to appropriate default values before applying NOT NULL constraints.
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx scripts/migrate-null-fields.ts
 */

import { isNull, or, sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
} from "../src/lib/schemas/database";

async function migrateNullFields(): Promise<void> {
    console.log("🔄 Starting data migration to fix NULL fields...\n");

    try {
        // ============================================================================
        // 1. MIGRATE CHAPTERS TABLE
        // ============================================================================
        console.log("📝 Migrating chapters table...");

        // Update NULL summary
        const chaptersWithNullSummary = await db
            .update(chapters)
            .set({ summary: "" })
            .where(isNull(chapters.summary))
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullSummary.length} chapters with NULL summary`,
        );

        // Update NULL focus_characters
        const chaptersWithNullFocus = await db
            .update(chapters)
            .set({ focusCharacters: [] })
            .where(isNull(chapters.focusCharacters))
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullFocus.length} chapters with NULL focusCharacters`,
        );

        // Update NULL seeds_planted
        const chaptersWithNullSeeds = await db
            .update(chapters)
            .set({ seedsPlanted: [] })
            .where(isNull(chapters.seedsPlanted))
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullSeeds.length} chapters with NULL seedsPlanted`,
        );

        // Update NULL seeds_resolved
        const chaptersWithNullResolved = await db
            .update(chapters)
            .set({ seedsResolved: [] })
            .where(isNull(chapters.seedsResolved))
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullResolved.length} chapters with NULL seedsResolved`,
        );

        // Update NULL part_id - Get first part of each story as default
        const chaptersWithNullPartId = await db
            .select()
            .from(chapters)
            .where(isNull(chapters.partId));

        for (const chapter of chaptersWithNullPartId) {
            // Find first part for this story
            const [firstPart] = await db
                .select()
                .from(parts)
                .where(sql`${parts.storyId} = ${chapter.storyId}`)
                .orderBy(parts.orderIndex)
                .limit(1);

            if (firstPart) {
                await db
                    .update(chapters)
                    .set({ partId: firstPart.id })
                    .where(sql`${chapters.id} = ${chapter.id}`);
            }
        }
        console.log(
            `  ✓ Updated ${chaptersWithNullPartId.length} chapters with NULL partId`,
        );

        // Update NULL character_id - Get first character of each story as default
        const chaptersWithNullCharId = await db
            .select()
            .from(chapters)
            .where(isNull(chapters.characterId));

        for (const chapter of chaptersWithNullCharId) {
            // Find first character for this story
            const [firstChar] = await db
                .select()
                .from(characters)
                .where(sql`${characters.storyId} = ${chapter.storyId}`)
                .limit(1);

            if (firstChar) {
                await db
                    .update(chapters)
                    .set({ characterId: firstChar.id })
                    .where(sql`${chapters.id} = ${chapter.id}`);
            }
        }
        console.log(
            `  ✓ Updated ${chaptersWithNullCharId.length} chapters with NULL characterId`,
        );

        // Update NULL arc_position - Default to 'beginning'
        const chaptersWithNullArcPos = await db
            .update(chapters)
            .set({ arcPosition: "beginning" })
            .where(isNull(chapters.arcPosition))
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullArcPos.length} chapters with NULL arcPosition`,
        );

        // Update NULL contributes_to_macro_arc
        const chaptersWithNullMacro = await db
            .update(chapters)
            .set({
                contributesToMacroArc:
                    "This chapter contributes to character development.",
            })
            .where(isNull(chapters.contributesToMacroArc))
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullMacro.length} chapters with NULL contributesToMacroArc`,
        );

        // Update NULL adversity_type - Default to 'both'
        const chaptersWithNullAdversity = await db
            .update(chapters)
            .set({ adversityType: "both" })
            .where(isNull(chapters.adversityType))
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullAdversity.length} chapters with NULL adversityType`,
        );

        // Update NULL virtue_type - Default to 'courage'
        const chaptersWithNullVirtue = await db
            .update(chapters)
            .set({ virtueType: "courage" })
            .where(isNull(chapters.virtueType))
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullVirtue.length} chapters with NULL virtueType`,
        );

        // Update NULL connects_to_previous_chapter
        const chaptersWithNullPrev = await db
            .update(chapters)
            .set({
                connectsToPreviousChapter:
                    "This chapter follows from previous events.",
            })
            .where(isNull(chapters.connectsToPreviousChapter))
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullPrev.length} chapters with NULL connectsToPreviousChapter`,
        );

        // Update NULL creates_next_adversity
        const chaptersWithNullNext = await db
            .update(chapters)
            .set({
                createsNextAdversity: "This chapter sets up future challenges.",
            })
            .where(isNull(chapters.createsNextAdversity))
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullNext.length} chapters with NULL createsNextAdversity`,
        );

        // Update NULL published_at - Use current timestamp for published chapters
        const chaptersWithNullPublished = await db
            .update(chapters)
            .set({ publishedAt: new Date().toISOString() })
            .where(
                or(
                    isNull(chapters.publishedAt),
                    sql`${chapters.status} = 'published'`,
                ),
            )
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullPublished.length} chapters with NULL publishedAt`,
        );

        // Update NULL scheduled_for - Use far future date as placeholder
        const chaptersWithNullScheduled = await db
            .update(chapters)
            .set({ scheduledFor: new Date("2099-12-31").toISOString() })
            .where(isNull(chapters.scheduledFor))
            .returning({ id: chapters.id });
        console.log(
            `  ✓ Updated ${chaptersWithNullScheduled.length} chapters with NULL scheduledFor`,
        );

        // ============================================================================
        // 2. MIGRATE PARTS TABLE
        // ============================================================================
        console.log("\n📝 Migrating parts table...");

        // Update NULL summary
        const partsWithNullSummary = await db
            .update(parts)
            .set({ summary: "" })
            .where(isNull(parts.summary))
            .returning({ id: parts.id });
        console.log(
            `  ✓ Updated ${partsWithNullSummary.length} parts with NULL summary`,
        );

        // Update NULL character_arcs
        const partsWithNullArcs = await db
            .update(parts)
            .set({ characterArcs: [] })
            .where(isNull(parts.characterArcs))
            .returning({ id: parts.id });
        console.log(
            `  ✓ Updated ${partsWithNullArcs.length} parts with NULL characterArcs`,
        );

        // Update NULL order_index
        const partsWithNullOrder = await db
            .update(parts)
            .set({ orderIndex: 0 })
            .where(isNull(parts.orderIndex))
            .returning({ id: parts.id });
        console.log(
            `  ✓ Updated ${partsWithNullOrder.length} parts with NULL orderIndex`,
        );

        // ============================================================================
        // 3. MIGRATE SCENES TABLE
        // ============================================================================
        console.log("\n📝 Migrating scenes table...");

        // Update NULL summary
        const scenesWithNullSummary = await db
            .update(scenes)
            .set({ summary: "" })
            .where(isNull(scenes.summary))
            .returning({ id: scenes.id });
        console.log(
            `  ✓ Updated ${scenesWithNullSummary.length} scenes with NULL summary`,
        );

        // Update NULL character_focus
        const scenesWithNullFocus = await db
            .update(scenes)
            .set({ characterFocus: [] })
            .where(isNull(scenes.characterFocus))
            .returning({ id: scenes.id });
        console.log(
            `  ✓ Updated ${scenesWithNullFocus.length} scenes with NULL characterFocus`,
        );

        // Update NULL sensory_anchors
        const scenesWithNullSensory = await db
            .update(scenes)
            .set({ sensoryAnchors: [] })
            .where(isNull(scenes.sensoryAnchors))
            .returning({ id: scenes.id });
        console.log(
            `  ✓ Updated ${scenesWithNullSensory.length} scenes with NULL sensoryAnchors`,
        );

        // Update NULL content
        const scenesWithNullContent = await db
            .update(scenes)
            .set({ content: "" })
            .where(isNull(scenes.content))
            .returning({ id: scenes.id });
        console.log(
            `  ✓ Updated ${scenesWithNullContent.length} scenes with NULL content`,
        );

        // Update NULL auto_publish
        const scenesWithNullAutoPublish = await db
            .update(scenes)
            .set({ autoPublish: false })
            .where(isNull(scenes.autoPublish))
            .returning({ id: scenes.id });
        console.log(
            `  ✓ Updated ${scenesWithNullAutoPublish.length} scenes with NULL autoPublish`,
        );

        // Update NULL comic_panel_count
        const scenesWithNullPanelCount = await db
            .update(scenes)
            .set({ comicPanelCount: 0 })
            .where(isNull(scenes.comicPanelCount))
            .returning({ id: scenes.id });
        console.log(
            `  ✓ Updated ${scenesWithNullPanelCount.length} scenes with NULL comicPanelCount`,
        );

        // Update NULL comic_version
        const scenesWithNullVersion = await db
            .update(scenes)
            .set({ comicVersion: 1 })
            .where(isNull(scenes.comicVersion))
            .returning({ id: scenes.id });
        console.log(
            `  ✓ Updated ${scenesWithNullVersion.length} scenes with NULL comicVersion`,
        );

        // Update NULL cycle_phase
        const scenesWithNullCyclePhase = await db
            .update(scenes)
            .set({ cyclePhase: "setup" })
            .where(isNull(scenes.cyclePhase))
            .returning({ id: scenes.id });
        console.log(
            `  ✓ Updated ${scenesWithNullCyclePhase.length} scenes with NULL cyclePhase`,
        );

        // Update NULL emotional_beat
        const scenesWithNullEmotionalBeat = await db
            .update(scenes)
            .set({ emotionalBeat: "tension" })
            .where(isNull(scenes.emotionalBeat))
            .returning({ id: scenes.id });
        console.log(
            `  ✓ Updated ${scenesWithNullEmotionalBeat.length} scenes with NULL emotionalBeat`,
        );

        // Update NULL setting_id - Get first setting of each story as default
        const scenesWithNullSettingId = await db
            .select()
            .from(scenes)
            .leftJoin(chapters, sql`${scenes.chapterId} = ${chapters.id}`)
            .where(isNull(scenes.settingId));

        for (const row of scenesWithNullSettingId) {
            const scene = row.scenes;
            const chapter = row.chapters;
            if (chapter) {
                // Find first setting for this story
                const [firstSetting] = await db
                    .select()
                    .from(settings)
                    .where(sql`${settings.storyId} = ${chapter.storyId}`)
                    .limit(1);

                if (firstSetting) {
                    await db
                        .update(scenes)
                        .set({ settingId: firstSetting.id })
                        .where(sql`${scenes.id} = ${scene.id}`);
                }
            }
        }
        console.log(
            `  ✓ Updated ${scenesWithNullSettingId.length} scenes with NULL settingId`,
        );

        // Update NULL dialogue_vs_description
        const scenesWithNullDialogue = await db
            .update(scenes)
            .set({ dialogueVsDescription: "50% dialogue, 50% description" })
            .where(isNull(scenes.dialogueVsDescription))
            .returning({ id: scenes.id });
        console.log(
            `  ✓ Updated ${scenesWithNullDialogue.length} scenes with NULL dialogueVsDescription`,
        );

        // Update NULL suggested_length
        const scenesWithNullLength = await db
            .update(scenes)
            .set({ suggestedLength: "medium" })
            .where(isNull(scenes.suggestedLength))
            .returning({ id: scenes.id });
        console.log(
            `  ✓ Updated ${scenesWithNullLength.length} scenes with NULL suggestedLength`,
        );

        // ============================================================================
        // 4. MIGRATE SETTINGS TABLE
        // ============================================================================
        console.log("\n📝 Migrating settings table...");

        // Update NULL summary
        const settingsWithNullSummary = await db
            .update(settings)
            .set({ summary: "" })
            .where(isNull(settings.summary))
            .returning({ id: settings.id });
        console.log(
            `  ✓ Updated ${settingsWithNullSummary.length} settings with NULL summary`,
        );

        // Update NULL adversity_elements
        const settingsWithNullAdversity = await db
            .update(settings)
            .set({
                adversityElements: {
                    physicalObstacles: [],
                    scarcityFactors: [],
                    dangerSources: [],
                    socialDynamics: [],
                },
            })
            .where(isNull(settings.adversityElements))
            .returning({ id: settings.id });
        console.log(
            `  ✓ Updated ${settingsWithNullAdversity.length} settings with NULL adversityElements`,
        );

        // Update NULL symbolic_meaning
        const settingsWithNullSymbolic = await db
            .update(settings)
            .set({ symbolicMeaning: "" })
            .where(isNull(settings.symbolicMeaning))
            .returning({ id: settings.id });
        console.log(
            `  ✓ Updated ${settingsWithNullSymbolic.length} settings with NULL symbolicMeaning`,
        );

        // Update NULL cycle_amplification
        const settingsWithNullCycle = await db
            .update(settings)
            .set({
                cycleAmplification: {
                    setup: "",
                    confrontation: "",
                    virtue: "",
                    consequence: "",
                    transition: "",
                },
            })
            .where(isNull(settings.cycleAmplification))
            .returning({ id: settings.id });
        console.log(
            `  ✓ Updated ${settingsWithNullCycle.length} settings with NULL cycleAmplification`,
        );

        // Update NULL mood
        const settingsWithNullMood = await db
            .update(settings)
            .set({ mood: "" })
            .where(isNull(settings.mood))
            .returning({ id: settings.id });
        console.log(
            `  ✓ Updated ${settingsWithNullMood.length} settings with NULL mood`,
        );

        // Update NULL emotional_resonance
        const settingsWithNullEmotion = await db
            .update(settings)
            .set({ emotionalResonance: "" })
            .where(isNull(settings.emotionalResonance))
            .returning({ id: settings.id });
        console.log(
            `  ✓ Updated ${settingsWithNullEmotion.length} settings with NULL emotionalResonance`,
        );

        // Update NULL sensory
        const settingsWithNullSensory = await db
            .update(settings)
            .set({
                sensory: {
                    sight: [],
                    sound: [],
                    smell: [],
                    touch: [],
                    taste: [],
                },
            })
            .where(isNull(settings.sensory))
            .returning({ id: settings.id });
        console.log(
            `  ✓ Updated ${settingsWithNullSensory.length} settings with NULL sensory`,
        );

        // Update NULL architectural_style
        const settingsWithNullArch = await db
            .update(settings)
            .set({ architecturalStyle: "" })
            .where(isNull(settings.architecturalStyle))
            .returning({ id: settings.id });
        console.log(
            `  ✓ Updated ${settingsWithNullArch.length} settings with NULL architecturalStyle`,
        );

        // Update NULL visual_references
        const settingsWithNullVisual = await db
            .update(settings)
            .set({ visualReferences: [] })
            .where(isNull(settings.visualReferences))
            .returning({ id: settings.id });
        console.log(
            `  ✓ Updated ${settingsWithNullVisual.length} settings with NULL visualReferences`,
        );

        // Update NULL color_palette
        const settingsWithNullColor = await db
            .update(settings)
            .set({ colorPalette: [] })
            .where(isNull(settings.colorPalette))
            .returning({ id: settings.id });
        console.log(
            `  ✓ Updated ${settingsWithNullColor.length} settings with NULL colorPalette`,
        );

        console.log("\n✅ Data migration completed successfully!");
        console.log(
            "\n💡 Now you can run: dotenv --file .env.local run pnpm db:migrate",
        );
    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        throw error;
    }
}

// Execute migration
migrateNullFields();
