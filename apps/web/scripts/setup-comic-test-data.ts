/**
 * Setup Comic Test Data
 *
 * Creates test stories, chapters, and scenes in the database for comic iteration testing.
 * These test scenes are required for the 5-cycle comic generation tests.
 *
 * Usage:
 *   pnpm dotenv -e .env.local -- pnpm exec tsx scripts/setup-comic-test-data.ts
 */

import * as fs from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
    stories,
    users,
} from "../src/lib/schemas/database";

// Test scene configurations matching test-scenes.ts
const TEST_SCENES_CONFIG = [
    {
        id: "action-sequence",
        name: "Action Sequence",
        content: `Marcus burst through the market crowd, his feet pounding against the worn cobblestones. Stalls of vegetables and spices blurred past him as he dodged around startled vendors. The guards' shouts grew louder behind him, their boots thundering in pursuit.

"Stop that thief!" The captain's voice cut through the market noise.

Marcus vaulted over a fruit cart, sending oranges tumbling in his wake. He didn't look back. Looking back meant getting caught, and getting caught meant death.

His foot slipped. For a heart-stopping moment, he hung suspended three stories above the street. His fingers found purchase on a window ledge. With a grunt, he pulled himself up and sprinted across the tiles.

The guards reached the base of the building, but Marcus was already gone, disappearing into the maze of rooftops.`,
        cyclePhase: "adversity",
        emotionalBeat: "tension",
        settingId: "setting-market",
        characterIds: ["char-marcus", "char-guard"],
    },
    {
        id: "dialogue-heavy",
        name: "Dialogue Scene",
        content: `The coffee shop was quiet in the afternoon lull. Elena wrapped her hands around her cup, staring at the foam patterns dissolving on the surface.

"I can't do this anymore," she said finally.

David looked up from his coffee, confusion creasing his forehead. "What are you talking about?"

"This. Us. The pretending." Her voice was steady despite the tremor in her hands. "I've been lying to myself for months."

He set down his cup slowly. "Elena..."

"Don't." She held up a hand. "Please don't try to fix it. Not this time."

The silence stretched between them, filled with the hiss of the espresso machine and the distant murmur of other conversations.

"I thought we were happy," David said quietly.

Elena finally met his eyes. "That's the problem. You thought. I knew we weren't."`,
        cyclePhase: "virtue",
        emotionalBeat: "catharsis",
        settingId: "setting-coffeeshop",
        characterIds: ["char-elena", "char-david"],
    },
    {
        id: "emotional-beat",
        name: "Emotional Beat",
        content: `Sarah stood at the window, watching the rain trace patterns down the glass. In her hands, the letter trembled slightly—not from the cold, but from something deeper.

After fifteen years, her mother had finally written back.

The handwriting was shakier now, the loops less confident than she remembered from childhood birthday cards. But it was unmistakably hers.

"Dear Sarah," it began. Simple words that unlocked a flood of memories.

She didn't open it. Not yet. She couldn't. Fifteen years of silence deserved more than a rushed reading in a kitchen that still smelled of morning coffee.

The rain continued to fall. Sarah pressed her forehead against the cool glass and let the tears come.

Some letters took fifteen years to arrive. Some answers took even longer.`,
        cyclePhase: "consequence",
        emotionalBeat: "catharsis",
        settingId: "setting-apartment",
        characterIds: ["char-sarah"],
    },
    {
        id: "establishing-shot",
        name: "Establishing Shot",
        content: `The library had been forgotten for decades.

Dust motes danced in shafts of sunlight that pierced through broken skylights. The air hung thick with the musty scent of decaying paper and old leather bindings.

Books lay scattered across the marble floors like fallen soldiers—some splayed open, their pages yellowed and brittle. Others stood in precarious towers, defying gravity through sheer stubbornness.

The grand reading room stretched out in silence. Ornate chandeliers hung askew, their crystals catching the light and scattering rainbows across the walls. Mahogany shelves rose three stories high, their ladders frozen in mid-climb.

Nature had begun its slow reclamation. Ivy crept through cracked windows. A bird's nest occupied the reference desk.

Yet somehow, despite the decay, the room retained its dignity. A monument to knowledge, waiting patiently for readers who would never return.`,
        cyclePhase: "setup",
        emotionalBeat: "elevation",
        settingId: "setting-library",
        characterIds: [],
    },
    {
        id: "climactic-moment",
        name: "Climactic Moment",
        content: `The courtroom was silent. Not the comfortable silence of a pause, but the heavy silence that precedes a storm.

Judge Harrison adjusted his glasses, peering down at the papers before him. The clock on the wall ticked loudly in the stillness.

Thomas Wright sat rigid in the defendant's chair, his hands clasped so tightly his knuckles had gone white. Behind him, his wife clutched their daughter's hand.

"Thomas Wright," the judge began, his voice filling every corner of the room, "on the charge of first-degree murder, this court has found you guilty."

A gasp rippled through the gallery.

"However..." The judge paused, and Thomas dared to lift his eyes. "In light of new evidence presented by the defense, and given the extraordinary circumstances of this case..."

The room held its breath.

"...this court orders a new trial, effective immediately."

The gavel fell like thunder.`,
        cyclePhase: "virtue",
        emotionalBeat: "hope",
        settingId: "setting-courtroom",
        characterIds: ["char-judge", "char-thomas"],
    },
];

// Test characters
const TEST_CHARACTERS = [
    {
        id: "char-marcus",
        name: "Marcus",
        role: "protagonist",
        summary: "Street-smart thief with a heart of gold",
    },
    {
        id: "char-guard",
        name: "Captain Varen",
        role: "antagonist",
        summary: "Relentless city guard captain",
    },
    {
        id: "char-elena",
        name: "Elena",
        role: "protagonist",
        summary: "Woman finding her voice after years of silence",
    },
    {
        id: "char-david",
        name: "David",
        role: "deuteragonist",
        summary: "Elena's partner, struggling to understand",
    },
    {
        id: "char-sarah",
        name: "Sarah",
        role: "protagonist",
        summary: "Daughter reconciling with her past",
    },
    {
        id: "char-judge",
        name: "Judge Harrison",
        role: "supporting",
        summary: "Fair but stern judge presiding over the case",
    },
    {
        id: "char-thomas",
        name: "Thomas Wright",
        role: "protagonist",
        summary: "Wrongly accused man fighting for his freedom",
    },
];

// Test settings
const TEST_SETTINGS = [
    {
        id: "setting-market",
        name: "The Grand Market",
        summary: "Bustling market square with vendors and crowds",
    },
    {
        id: "setting-coffeeshop",
        name: "Corner Coffee",
        summary: "Quiet neighborhood coffee shop with warm atmosphere",
    },
    {
        id: "setting-apartment",
        name: "Sarah's Apartment",
        summary: "Modest apartment with rain-streaked windows",
    },
    {
        id: "setting-library",
        name: "The Forgotten Library",
        summary: "Abandoned grand library reclaimed by nature",
    },
    {
        id: "setting-courtroom",
        name: "Central Courthouse",
        summary: "Grand courtroom with high ceilings and oak furniture",
    },
];

async function setupComicTestData(): Promise<void> {
    console.log("=".repeat(60));
    console.log("📚 Setting up Comic Test Data");
    console.log("=".repeat(60));

    try {
        // 1. Get writer user ID from database
        const writerEmail = "writer@fictures.xyz";
        const [writerUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, writerEmail))
            .limit(1);

        if (!writerUser) {
            throw new Error(
                `Writer user (${writerEmail}) not found. Run setup-auth-users.ts first.`,
            );
        }

        const authorId = writerUser.id;
        console.log(`\n✅ Using author ID: ${authorId}`);

        // 2. Create test story
        const storyId = `story_comic_test_${Date.now()}`;
        const now = new Date().toISOString();

        console.log(`\n📖 Creating test story: ${storyId}`);

        await db.insert(stories).values({
            id: storyId,
            authorId,
            title: "Comic Test Story",
            summary: "Test story for comic iteration testing",
            genre: "Action",
            tone: "hopeful",
            moralFramework: "Courage and determination overcome adversity",
            language: "en",
            status: "draft",
            createdAt: now,
            updatedAt: now,
        });

        // 3. Create test part
        const partId = `part_comic_test_${Date.now()}`;

        console.log(`\n📗 Creating test part: ${partId}`);

        await db.insert(parts).values({
            id: partId,
            storyId,
            title: "Test Part",
            summary: "Part containing test chapters",
            orderIndex: 1,
            characterArcs: [],
            settingIds: [],
            createdAt: now,
            updatedAt: now,
        });

        // 4. Create test characters first (needed for chapter.characterId)
        console.log(
            `\n👤 Creating ${TEST_CHARACTERS.length} test characters...`,
        );

        const createdCharacterIds: Record<string, string> = {};

        for (const char of TEST_CHARACTERS) {
            const characterId = `${char.id}_${Date.now()}`;
            createdCharacterIds[char.id] = characterId;

            await db.insert(characters).values({
                id: characterId,
                storyId,
                name: char.name,
                role: char.role,
                summary: char.summary,
                coreTrait: "courage",
                internalFlaw: "fears failure because of past mistakes",
                externalGoal: "To prove themselves worthy",
                backstory: `${char.name} has a complex history...`,
                personality: {
                    traits: ["determined", "resourceful"],
                    values: ["honor", "family"],
                },
                physicalDescription: {
                    age: "30s",
                    appearance: "Average build",
                    distinctiveFeatures: "None",
                    style: "Casual",
                },
                voiceStyle: {
                    tone: "measured",
                    vocabulary: "educated",
                    quirks: [],
                    emotionalRange: "moderate",
                },
                createdAt: now,
                updatedAt: now,
            });

            console.log(
                `   ✓ Created character: ${char.name} (${characterId})`,
            );
        }

        // 5. Create test chapter (uses characterId from first character)
        const chapterId = `chapter_comic_test_${Date.now()}`;
        const firstCharacterId = createdCharacterIds["char-marcus"];

        console.log(`\n📑 Creating test chapter: ${chapterId}`);

        await db.insert(chapters).values({
            id: chapterId,
            storyId,
            partId,
            characterId: firstCharacterId,
            title: "Test Chapter",
            summary: "Chapter containing all test scenes",
            arcPosition: "middle",
            orderIndex: 1,
            contributesToMacroArc: true,
            adversityType: "external",
            virtueType: "courage",
            connectsToPreviousChapter: "First chapter",
            createsNextAdversity: "Continues story",
            focusCharacters: [],
            settingIds: [],
            seedsPlanted: [],
            seedsResolved: [],
            createdAt: now,
            updatedAt: now,
        });

        // 6. Create test settings
        console.log(`\n🏛️ Creating ${TEST_SETTINGS.length} test settings...`);

        const createdSettingIds: Record<string, string> = {};

        for (const setting of TEST_SETTINGS) {
            const settingId = `${setting.id}_${Date.now()}`;
            createdSettingIds[setting.id] = settingId;

            await db.insert(settings).values({
                id: settingId,
                storyId,
                name: setting.name,
                summary: setting.summary,
                mood: "atmospheric",
                emotionalResonance: "immersive",
                architecturalStyle: "varied",
                sensory: {
                    sights: ["dim lighting", "scattered papers"],
                    sounds: ["distant echoes"],
                    smells: ["old books"],
                    textures: ["rough stone"],
                },
                adversityElements: {
                    physicalObstacles: [],
                    scarcityFactors: [],
                    dangerSources: [],
                    socialDynamics: [],
                },
                virtueElements: {
                    virtuesAvailable: [],
                    testMoments: [],
                    growthOpportunities: [],
                },
                consequenceElements: {
                    naturalConsequences: [],
                    environmentalChanges: [],
                    socialRipples: [],
                },
                symbolicMeaning: "Represents the passage of time",
                visualReferences: [],
                colorPalette: ["neutral"],
                createdAt: now,
                updatedAt: now,
            });

            console.log(`   ✓ Created setting: ${setting.name} (${settingId})`);
        }

        // 7. Create test scenes
        console.log(
            `\n🎬 Creating ${TEST_SCENES_CONFIG.length} test scenes...`,
        );

        const createdSceneIds: string[] = [];

        for (let i = 0; i < TEST_SCENES_CONFIG.length; i++) {
            const sceneConfig = TEST_SCENES_CONFIG[i];
            const sceneId = `scene_${sceneConfig.id}_${Date.now()}_${i}`;

            // Get the mapped setting ID for this scene
            const settingId =
                createdSettingIds[sceneConfig.settingId] ||
                Object.values(createdSettingIds)[0];

            await db.insert(scenes).values({
                id: sceneId,
                chapterId,
                title: sceneConfig.name,
                summary: `Test scene for ${sceneConfig.name.toLowerCase()}`,
                content: sceneConfig.content,
                orderIndex: i + 1,
                cyclePhase: sceneConfig.cyclePhase,
                emotionalBeat: sceneConfig.emotionalBeat,
                characterFocus: sceneConfig.characterIds, // Array of character IDs
                settingId, // Required field - mapped from config
                dialogueVsDescription: "balanced",
                suggestedLength: "medium",
                createdAt: now,
                updatedAt: now,
            });

            createdSceneIds.push(sceneId);
            console.log(`   ✓ Created scene: ${sceneConfig.name} (${sceneId})`);
        }

        // 7. Output scene IDs for test configuration
        console.log("\n" + "=".repeat(60));
        console.log("✅ Comic Test Data Setup Complete!");
        console.log("=".repeat(60));

        console.log(
            "\n📋 Created Scene IDs (use these in test configuration):\n",
        );
        console.log("```typescript");
        console.log("const COMIC_TEST_SCENE_IDS = {");
        TEST_SCENES_CONFIG.forEach((config, i) => {
            console.log(`    "${config.id}": "${createdSceneIds[i]}",`);
        });
        console.log("};");
        console.log("```");

        console.log(`\n📍 Story ID: ${storyId}`);
        console.log(`📍 Chapter ID: ${chapterId}`);

        // Save to a config file for easy reference
        const configOutput = {
            storyId,
            chapterId,
            sceneIds: TEST_SCENES_CONFIG.reduce(
                (acc, config, i) => {
                    acc[config.id] = createdSceneIds[i];
                    return acc;
                },
                {} as Record<string, string>,
            ),
            createdAt: now,
        };

        const configPath =
            "tests/iteration-testing/comics/config/test-scene-ids.json";

        fs.writeFileSync(configPath, JSON.stringify(configOutput, null, 2));
        console.log(`\n💾 Scene IDs saved to: ${configPath}`);
    } catch (error) {
        console.error("\n❌ Error setting up comic test data:", error);
        throw error;
    }
}

// Run the setup
setupComicTestData()
    .then(() => {
        console.log("\n✅ Setup completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Setup failed:", error);
        process.exit(1);
    });
