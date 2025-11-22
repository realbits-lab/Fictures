#!/usr/bin/env tsx

/**
 * Generate Test Images for Static Novel Test Data
 *
 * Generates all images for testing and stores them in the test/ prefix
 * in Vercel Blob. Outputs the complete data structures for static-novel-data.ts.
 *
 * Generates:
 * - 1 Story cover (1344×756, 16:9)
 * - 2 Character portraits (896×896, 1:1)
 * - 2 Setting images (896×896, 1:1)
 * - 6 Scene images (1344×756, 16:9)
 * - Comic panels for all 6 scenes (7-12 panels each)
 *
 * Usage:
 *   # Preview what will be generated
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-test-images.ts
 *
 *   # Generate all images (takes 15-30 minutes)
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-test-images.ts --confirm
 *
 *   # Generate only novel images (no comic panels)
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-test-images.ts --confirm --no-panels
 *
 *   # Background execution
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-test-images.ts --confirm > logs/test-images.log 2>&1 &
 *
 * Prerequisites:
 *   - BLOB_READ_WRITE_TOKEN environment variable
 *   - GOOGLE_GENERATIVE_AI_API_KEY for Gemini image generation
 *   - AI Server running for text generation (optional, for toonplay)
 */

import fs from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import sharp from "sharp";
import type { AuthContext } from "../src/lib/auth/context";
import { withAuth } from "../src/lib/auth/server-context";
import type {
    GeneratorImageParams,
    GeneratorImageType,
} from "../src/lib/schemas/generators/types";
// Import from source
import { generateImage } from "../src/lib/studio/generators/images-generator";
import type {
    ImageVariant,
    OptimizedImageSet,
} from "../src/lib/studio/services/image-optimization-service";

// Import test data definitions
import { TEST_IDS } from "../tests/helpers/static-novel-data";

// Load API key from .auth/user.json
function loadWriterApiKey(): string {
    const authPath = path.resolve(process.cwd(), ".auth/user.json");
    if (!fs.existsSync(authPath)) {
        throw new Error("Authentication file not found at .auth/user.json");
    }
    const authData = JSON.parse(fs.readFileSync(authPath, "utf-8"));

    // Try environment-specific structure first (develop/main)
    const apiKey =
        authData.develop?.profiles?.writer?.apiKey ||
        authData.main?.profiles?.writer?.apiKey ||
        authData.profiles?.writer?.apiKey;

    if (!apiKey) {
        throw new Error("Writer API key not found in .auth/user.json");
    }
    return apiKey;
}

// Create auth context for script execution
function createScriptAuthContext(apiKey: string): AuthContext {
    return {
        userId: "script-user",
        email: "writer@fictures.xyz",
        apiKey,
        scopes: ["stories:write", "images:write", "ai:use"],
        metadata: {
            requestId: `script-${Date.now()}`,
            timestamp: Date.now(),
            source: "script",
        },
    };
}

// Parse arguments
const args = process.argv.slice(2);
const confirmFlag = args.includes("--confirm");
const noPanelsFlag = args.includes("--no-panels");
const helpFlag = args.includes("--help") || args.includes("-h");

if (helpFlag) {
    console.log(`
Generate Test Images for Static Novel Test Data

Generates all images for testing and stores them in the test/ prefix.

Usage:
  dotenv --file .env.local run pnpm exec tsx scripts/generate-test-images.ts [OPTIONS]

Options:
  --confirm     Execute image generation (required for actual generation)
  --no-panels   Skip comic panel generation (faster, novel images only)
  --help, -h    Show this help message

Generates:
  - 1 Story cover (1344×756)
  - 2 Character portraits (896×896)
  - 2 Setting images (896×896)
  - 6 Scene images (1344×756)
  - Comic panels for all 6 scenes (7-12 panels each, ~60 images)

Total: ~70 images (or ~10 without panels)

Time: 15-30 minutes with panels, 5-10 minutes without
`);
    process.exit(0);
}

console.log("🎨 Test Image Generator");
console.log("=".repeat(60));
console.log();

// =============================================================================
// Image Prompts for Test Data
// =============================================================================

const IMAGE_PROMPTS = {
    story: `Epic fantasy book cover showing a female knight in silver armor standing before a dark castle at twilight, with an ominous forest in the background. Her sword glows faintly with silver light. Dramatic lighting, cinematic composition, digital art style.`,

    characters: {
        protagonist: `Portrait of a young female knight in her mid-20s with determined brown eyes and sun-bronzed skin. She has a thin scar across her left cheekbone. Her silver armor bears the crest of the Silver Dawn. Athletic build, practical military appearance. Confident but haunted expression. Digital art portrait style.`,
        antagonist: `Portrait of an ancient sorcerer with unnaturally pale skin and eyes that shift between black and violet. He wears flowing dark robes adorned with arcane symbols. Shadows seem to move independently around him. Gaunt, ageless appearance with cold, detached expression. Dark fantasy portrait style.`,
    },

    settings: {
        castle: `Gothic fortress at dusk with silver-inlaid stone walls and defensive towers. Silver banners catch the fading golden light while shadows creep along the battlements. Stained glass windows glow with candlelight. Atmospheric, somber but hopeful mood. Fantasy architecture digital art.`,
        forest: `Ancient enchanted forest with gnarled twisted trees forming natural archways. Shafts of moonlight pierce the dark canopy. Glowing fungi on bark, mist swirling between trunks. Mysterious and testing atmosphere. Dark fantasy environment digital art.`,
    },

    scenes: {
        scene1_1: `Interior of a grand medieval hall with a large map table. Morning light streams through stained glass windows casting colored shadows on strategy markers. A female knight in silver armor stands before an older commander. Formal, tense atmosphere. Fantasy interior digital art.`,
        scene1_2: `Memorial hall with marble walls carved with names. A lone knight kneels before a fresh stone with sharp-edged letters. Twilight light through windows, incense smoke drifting. Cold, somber, guilt-laden atmosphere. Fantasy interior digital art.`,
        scene1_3: `Great hall with dozens of knights gathered, torchlight gleaming on armor. A female knight stands on a raised platform addressing the crowd, her sword drawn and glowing silver. Determined faces in the crowd. Inspiring, hopeful atmosphere. Fantasy scene digital art.`,
        scene2_1: `Party of mounted knights entering a dark twisted forest. Colors leaching away at the boundary. Ancient gnarled trees with faces in bark. Leaves rustling despite still air. Fog rolling in. Ominous, oppressive atmosphere. Dark fantasy scene digital art.`,
        scene2_2: `Female knight fighting shadow wolves in a misty ravine. Ghost-like vision of a fallen knight in the background. Her eyes show determination breaking through fear. Dynamic action pose. Dark, intense, transformative atmosphere. Dark fantasy action scene.`,
        scene2_3: `Moonlit forest clearing with wounded knights resting. A female knight tends to their injuries while a translucent forest spirit made of silver mist and starlight appears at the clearing's edge. Peaceful, mysterious, hopeful atmosphere. Fantasy scene digital art.`,
    },
};

// =============================================================================
// Comic Panel Specifications
// =============================================================================

interface PanelSpec {
    panelNumber: number;
    shotType: string;
    prompt: string;
    dialogue?: string[];
    sfx?: string[];
    narrative?: string;
}

const COMIC_PANEL_SPECS: Record<string, PanelSpec[]> = {
    scene1_1: [
        {
            panelNumber: 1,
            shotType: "establishing_shot",
            prompt: "Exterior view of Silverhold Castle at dawn, silver banners catching first light, fortress silhouette against orange sky",
            narrative: "Silverhold Castle, dawn...",
        },
        {
            panelNumber: 2,
            shotType: "wide_shot",
            prompt: "Hall of Echoes interior with map table, colored light through stained glass, Knight Commander Varen standing at table",
            narrative: "Hall of Echoes",
        },
        {
            panelNumber: 3,
            shotType: "medium_shot",
            prompt: "Elena entering the hall, silver armor gleaming, hand on sword hilt, determined but apprehensive expression",
            dialogue: ["Sir Elena."],
        },
        {
            panelNumber: 4,
            shotType: "close_up",
            prompt: "Knight Commander Varen's weathered face, sharp eyes, grave expression",
            dialogue: [
                "The Shadow Lord's forces have seized the Northern Pass.",
            ],
        },
        {
            panelNumber: 5,
            shotType: "medium_shot",
            prompt: "Elena's hand tightening on sword hilt, slight glow from the blade, tension in her posture",
            dialogue: ["You want me to lead the mission."],
        },
        {
            panelNumber: 6,
            shotType: "over_shoulder",
            prompt: "View over Varen's shoulder showing Elena, map table between them with strategic markers",
            dialogue: ["You are the finest blade we have."],
        },
        {
            panelNumber: 7,
            shotType: "close_up",
            prompt: "Elena's eyes showing resolve mixed with hidden fear, scar visible on cheek",
            dialogue: ["I'll need a team. Volunteers only."],
        },
        {
            panelNumber: 8,
            shotType: "wide_shot",
            prompt: "Elena walking away through hall, portraits of past heroes watching from walls, long shadows",
            narrative: "Whatever it costs me.",
        },
    ],
    scene1_2: [
        {
            panelNumber: 1,
            shotType: "establishing_shot",
            prompt: "Memorial Hall at twilight, marble walls with carved names, crimson light through windows",
            narrative: "Memorial Hall, twilight...",
        },
        {
            panelNumber: 2,
            shotType: "medium_shot",
            prompt: "Elena standing before a fresh memorial stone, her reflection visible in polished marble",
            narrative: "Knight Commander Aldric Stormwind",
        },
        {
            panelNumber: 3,
            shotType: "extreme_close_up",
            prompt: "Elena's hand pressing against carved letters of Aldric's name, fingertips in grooves",
            dialogue: ["I should have been faster."],
        },
        {
            panelNumber: 4,
            shotType: "close_up",
            prompt: "Elena's face in profile, eyes closed, single tear, expression of deep grief",
            dialogue: ["Why did you save me?"],
        },
        {
            panelNumber: 5,
            shotType: "medium_shot",
            prompt: "Elena kneeling before the memorial, head bowed, surrounded by cold marble and shadows",
            narrative: "I wasn't worth it.",
        },
        {
            panelNumber: 6,
            shotType: "wide_shot",
            prompt: "Elena alone in vast memorial hall, small figure among countless names of fallen heroes",
        },
    ],
    scene1_3: [
        {
            panelNumber: 1,
            shotType: "wide_shot",
            prompt: "Great hall filled with armored knights, torchlight gleaming on metal, all eyes on raised platform",
            narrative: "The Great Hall",
        },
        {
            panelNumber: 2,
            shotType: "medium_shot",
            prompt: "Elena stepping onto platform, hand finding sword hilt, feeling warmth from blade",
        },
        {
            panelNumber: 3,
            shotType: "close_up",
            prompt: "Elena's face as she addresses the crowd, determined but honest expression",
            dialogue: ["You all know what we face."],
        },
        {
            panelNumber: 4,
            shotType: "medium_shot",
            prompt: "Crowd reaction - mix of determination and fear on knights' faces, some exchanging glances",
            dialogue: ["Some of us may not return."],
        },
        {
            panelNumber: 5,
            shotType: "close_up",
            prompt: "Elena's expression vulnerable but resolute, admitting her fear",
            dialogue: ["I also will not pretend that I am without fear."],
        },
        {
            panelNumber: 6,
            shotType: "medium_shot",
            prompt: "Elena drawing sword, blade glowing bright silver, her face illuminated",
            dialogue: ["Fear is not the enemy. Giving in to fear is."],
        },
        {
            panelNumber: 7,
            shotType: "close_up",
            prompt: "Young Sir Brennan stepping forward, drawing his sword, youthful determination",
            dialogue: ["For the Silver Dawn!"],
        },
        {
            panelNumber: 8,
            shotType: "wide_shot",
            prompt: "All knights drawing swords, blades gleaming in torchlight, united chorus",
            dialogue: ["FOR THE SILVER DAWN!"],
            sfx: ["SHING!"],
        },
        {
            panelNumber: 9,
            shotType: "medium_shot",
            prompt: "Elena looking at her companions, hint of hope in her eyes, purpose found",
            dialogue: ["We leave at first light."],
        },
    ],
    scene2_1: [
        {
            panelNumber: 1,
            shotType: "establishing_shot",
            prompt: "Autumn forest with gold and crimson leaves, clear boundary where colors fade to gray",
            narrative: "The boundary of the Whispering Woods...",
        },
        {
            panelNumber: 2,
            shotType: "wide_shot",
            prompt: "Party of mounted knights crossing into twisted gray forest, colors draining away",
            dialogue: ["Hold formation. Stay together."],
        },
        {
            panelNumber: 3,
            shotType: "medium_shot",
            prompt: "Gnarled trees with faces in bark, branches like reaching arms, leaves rustling",
            sfx: ["whisper whisper whisper"],
        },
        {
            panelNumber: 4,
            shotType: "close_up",
            prompt: "Young Brennan's nervous face, eyes scanning shadows",
            dialogue: ["What are they saying?"],
        },
        {
            panelNumber: 5,
            shotType: "medium_shot",
            prompt: "Old knight Garrett with hand on shield, eyes scanning, protective stance",
            dialogue: ["Nothing we need to hear. Focus on the path."],
        },
        {
            panelNumber: 6,
            shotType: "medium_shot",
            prompt: "Lady Mira consulting map with troubled expression, looking up confused",
            dialogue: ["We should have reached the waypoint an hour ago."],
        },
        {
            panelNumber: 7,
            shotType: "close_up",
            prompt: "Elena's determined face, projecting confidence she doesn't feel",
            dialogue: ["Then we press on. Eyes forward, minds clear."],
        },
        {
            panelNumber: 8,
            shotType: "wide_shot",
            prompt: "Party riding deeper into twisted forest, whispers seeming to follow them",
            narrative:
                "The whispers followed them, patient as only ancient things can be.",
        },
    ],
    scene2_2: [
        {
            panelNumber: 1,
            shotType: "establishing_shot",
            prompt: "Fog-shrouded ravine, shadow wolves bursting from mist on all sides, red ember eyes",
            sfx: ["ATTACK!"],
        },
        {
            panelNumber: 2,
            shotType: "medium_shot",
            prompt: "Elena drawing sword, shouting command, chaos around her",
            dialogue: ["Defensive positions!"],
        },
        {
            panelNumber: 3,
            shotType: "wide_shot",
            prompt: "Flashback - broken walls of Thornhaven, fallen knights, red burning sky",
            narrative: "Thornhaven...",
        },
        {
            panelNumber: 4,
            shotType: "medium_shot",
            prompt: "Vision of Aldric fighting shadow mass, silver armor stained, broken shield arm",
            dialogue: ["RUN, ELENA!"],
        },
        {
            panelNumber: 5,
            shotType: "extreme_close_up",
            prompt: "Elena's frozen expression, paralyzed with fear, eyes wide",
            narrative: "Not again not again not again—",
        },
        {
            panelNumber: 6,
            shotType: "medium_shot",
            prompt: "Vision of darkness swallowing Aldric, his last words cut off",
        },
        {
            panelNumber: 7,
            shotType: "close_up",
            prompt: "Elena's hand gripping sword hilt, knuckles white, blade pulsing with warmth",
            dialogue: ["NO!"],
        },
        {
            panelNumber: 8,
            shotType: "medium_shot",
            prompt: "Elena breaking free from paralysis, illusion shattering like glass around her",
        },
        {
            panelNumber: 9,
            shotType: "wide_shot",
            prompt: "Back in ravine, three wolves circling Brennan who fights with injured arm",
            dialogue: ["SIR ELENA!"],
        },
        {
            panelNumber: 10,
            shotType: "medium_shot",
            prompt: "Elena charging into battle, blade slicing through first wolf",
            sfx: ["SLASH!"],
        },
        {
            panelNumber: 11,
            shotType: "medium_shot",
            prompt: "Elena catching wolf's leap on armored forearm, driving sword through its chest",
            narrative: "I will not freeze. I will not fail.",
        },
        {
            panelNumber: 12,
            shotType: "wide_shot",
            prompt: "Team regrouping around Elena, ghost of Aldric smiling proudly in shadows between trees",
            dialogue: ["Everyone, to me!"],
        },
    ],
    scene2_3: [
        {
            panelNumber: 1,
            shotType: "establishing_shot",
            prompt: "Moonlit clearing in forest, canopy parting to let light through, camp setup",
            narrative: "A rare pocket of peace...",
        },
        {
            panelNumber: 2,
            shotType: "medium_shot",
            prompt: "Elena applying healing salve to Brennan's wounded arm, gentle hands",
        },
        {
            panelNumber: 3,
            shotType: "close_up",
            prompt: "Brennan's face looking at Elena with concern",
            dialogue: [
                "Your eyes... during the fight. They were somewhere else.",
            ],
        },
        {
            panelNumber: 4,
            shotType: "medium_shot",
            prompt: "Elena pausing, considering, then meeting their eyes honestly",
            dialogue: ["The forest showed me Thornhaven."],
        },
        {
            panelNumber: 5,
            shotType: "medium_shot",
            prompt: "Garrett stepping forward, rough but kind expression",
            dialogue: ["But you didn't freeze. You came for us."],
        },
        {
            panelNumber: 6,
            shotType: "close_up",
            prompt: "Elena's face showing vulnerability and honesty",
            dialogue: [
                "If it tries to use your past against you, call out. We fight together.",
            ],
        },
        {
            panelNumber: 7,
            shotType: "wide_shot",
            prompt: "Soft light appearing at clearing edge, forest spirit forming from silver mist",
        },
        {
            panelNumber: 8,
            shotType: "medium_shot",
            prompt: "Forest spirit made of starlight and mist, ancient eyes, ethereal beauty",
            dialogue: ["Young knight, you broke free of the forest's mirror."],
        },
        {
            panelNumber: 9,
            shotType: "close_up",
            prompt: "Spirit's face delivering cryptic message",
            dialogue: ["The shadow remembers what the heart forgets."],
        },
        {
            panelNumber: 10,
            shotType: "wide_shot",
            prompt: "Spirit dissolving into motes of light drifting up through canopy",
        },
        {
            panelNumber: 11,
            shotType: "medium_shot",
            prompt: "Elena standing watch as companions sleep, hand on sword, grim smile",
            narrative: "Let's see what else you have.",
        },
    ],
};

// =============================================================================
// Image Optimization for Test Prefix
// =============================================================================

/**
 * Download image from URL and return buffer
 */
async function downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

/**
 * Create optimized variants for test images
 * Stores in test/ prefix instead of environment-based path
 */
async function createTestOptimizedVariants(
    originalUrl: string,
    imageId: string,
    storyId: string,
    imageType: "story" | "scene" | "character" | "setting" | "panel",
    sceneId?: string,
): Promise<OptimizedImageSet> {
    console.log(`  Creating optimized variants...`);

    // Download original
    const originalBuffer = await downloadImage(originalUrl);

    // Define storage path with test/ prefix
    const basePath =
        imageType === "panel" && sceneId
            ? `test/stories/${storyId}/comics/${sceneId}/panel`
            : imageType === "panel"
              ? `test/stories/${storyId}/comics/panel`
              : `test/stories/${storyId}/${imageType}`;

    // Store original in variants folder
    const originalPath = `${basePath}/original/${imageId}.png`;
    const originalBlob = await put(originalPath, originalBuffer, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: true,
    });

    // Define variant configurations
    const formats = ["avif", "jpeg"] as const;
    const resolutions = ["1x", "2x"] as const;

    // Get original dimensions
    const metadata = await sharp(originalBuffer).metadata();
    const originalWidth = metadata.width || 1344;
    const originalHeight = metadata.height || 756;

    const variants: ImageVariant[] = [];

    for (const format of formats) {
        for (const resolution of resolutions) {
            // Calculate target dimensions
            const scale = resolution === "1x" ? 0.5 : 1;
            const targetWidth = Math.round(originalWidth * scale);
            const targetHeight = Math.round(originalHeight * scale);

            // Process image
            let processedBuffer: Buffer;
            let mimeType: string;

            const sharpInstance = sharp(originalBuffer).resize(
                targetWidth,
                targetHeight,
            );

            if (format === "avif") {
                processedBuffer = await sharpInstance
                    .avif({ quality: 80 })
                    .toBuffer();
                mimeType = "image/avif";
            } else {
                processedBuffer = await sharpInstance
                    .jpeg({ quality: 85 })
                    .toBuffer();
                mimeType = "image/jpeg";
            }

            // Upload variant
            const variantPath = `${basePath}/variants/${imageId}_${resolution}.${format}`;
            const variantBlob = await put(variantPath, processedBuffer, {
                access: "public",
                contentType: mimeType,
                addRandomSuffix: true,
            });

            variants.push({
                format,
                resolution,
                url: variantBlob.url,
                width: targetWidth,
                height: targetHeight,
                size: processedBuffer.length,
            });
        }
    }

    return {
        imageId,
        originalUrl: originalBlob.url,
        variants,
        generatedAt: new Date().toISOString(),
    };
}

// =============================================================================
// Generation Functions
// =============================================================================

interface GeneratedImage {
    imageId: string;
    imageUrl: string;
    imageVariants: OptimizedImageSet;
    width: number;
    height: number;
}

/**
 * Generate and upload a single image to test/ prefix
 */
async function generateAndUploadImage(
    prompt: string,
    imageType: GeneratorImageType,
    blobPath: string,
    contentId: string,
): Promise<GeneratedImage> {
    console.log(`  Generating ${imageType} image...`);

    // Determine aspect ratio
    const aspectRatios: Record<GeneratorImageType, "16:9" | "1:1" | "9:16"> = {
        story: "16:9",
        character: "1:1",
        setting: "1:1",
        scene: "16:9",
        "comic-panel": "9:16",
    };

    const aspectRatio = aspectRatios[imageType];

    // Generate image
    const generatorParams: GeneratorImageParams = {
        prompt,
        aspectRatio,
        imageType,
    };

    const result = await generateImage(generatorParams);

    console.log(
        `  ✓ Generated (${result.width}×${result.height}, ${result.generationTime}ms)`,
    );

    // Upload to test/ prefix in Vercel Blob
    const blob = await put(blobPath, result.imageBuffer, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: false,
    });

    console.log(`  ✓ Uploaded to ${blobPath}`);

    // Generate optimized variants with test/ prefix
    const imageId = `img_test_${nanoid(8)}`;
    const optimizationImageType:
        | "story"
        | "scene"
        | "character"
        | "setting"
        | "panel" = imageType === "comic-panel" ? "panel" : imageType;

    // Extract storyId from blobPath (test/stories/{storyId}/...)
    const pathParts = blobPath.split("/");
    const storyId = pathParts[2]; // test/stories/{storyId}

    // Extract sceneId for scene/panel types
    const sceneId =
        imageType === "scene" || imageType === "comic-panel"
            ? contentId
            : undefined;

    const optimizedSet = await createTestOptimizedVariants(
        blob.url,
        imageId,
        storyId,
        optimizationImageType,
        sceneId,
    );

    console.log(`  ✓ Created ${optimizedSet.variants.length} variants`);

    return {
        imageId,
        imageUrl: blob.url,
        imageVariants: optimizedSet,
        width: result.width,
        height: result.height,
    };
}

// =============================================================================
// Main Generation Logic
// =============================================================================

interface GenerationResults {
    story: GeneratedImage | null;
    characters: {
        protagonist: GeneratedImage | null;
        antagonist: GeneratedImage | null;
    };
    settings: {
        castle: GeneratedImage | null;
        forest: GeneratedImage | null;
    };
    scenes: Record<string, GeneratedImage | null>;
    panels: Record<
        string,
        Array<{ panelNumber: number; image: GeneratedImage; spec: PanelSpec }>
    >;
}

async function main(): Promise<void> {
    // Check environment
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error(
            "❌ Error: BLOB_READ_WRITE_TOKEN environment variable is required",
        );
        process.exit(1);
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        console.error(
            "❌ Error: GOOGLE_GENERATIVE_AI_API_KEY environment variable is required",
        );
        process.exit(1);
    }

    // Calculate totals
    const novelImageCount = 1 + 2 + 2 + 6; // story + characters + settings + scenes
    let panelCount = 0;
    if (!noPanelsFlag) {
        for (const panels of Object.values(COMIC_PANEL_SPECS)) {
            panelCount += panels.length;
        }
    }
    const totalImages = novelImageCount + panelCount;

    console.log("📊 Generation Plan:");
    console.log(`  • Story cover: 1`);
    console.log(`  • Character portraits: 2`);
    console.log(`  • Setting images: 2`);
    console.log(`  • Scene images: 6`);
    if (!noPanelsFlag) {
        console.log(`  • Comic panels: ${panelCount}`);
    }
    console.log(`  • Total images: ${totalImages}`);
    console.log(
        `  • Estimated time: ${noPanelsFlag ? "5-10" : "15-30"} minutes`,
    );
    console.log();

    if (!confirmFlag) {
        console.log("⚠️  PREVIEW MODE - No images will be generated");
        console.log();
        console.log("To generate images, run with --confirm flag:");
        console.log(
            "  dotenv --file .env.local run pnpm exec tsx scripts/generate-test-images.ts --confirm",
        );
        console.log();
        process.exit(0);
    }

    console.log("🚀 Starting image generation...\n");

    const results: GenerationResults = {
        story: null,
        characters: { protagonist: null, antagonist: null },
        settings: { castle: null, forest: null },
        scenes: {},
        panels: {},
    };

    const storyId = TEST_IDS.story;
    let generatedCount = 0;

    try {
        // 1. Generate story cover
        console.log("📖 Generating story cover...");
        results.story = await generateAndUploadImage(
            IMAGE_PROMPTS.story,
            "story",
            `test/stories/${storyId}/cover.png`,
            storyId,
        );
        generatedCount++;
        console.log(`  Progress: ${generatedCount}/${totalImages}\n`);

        // 2. Generate character portraits
        console.log("👤 Generating character portraits...");

        console.log("  Protagonist (Elena Brightblade):");
        results.characters.protagonist = await generateAndUploadImage(
            IMAGE_PROMPTS.characters.protagonist,
            "character",
            `test/stories/${storyId}/characters/${TEST_IDS.characters.protagonist}/portrait.png`,
            TEST_IDS.characters.protagonist,
        );
        generatedCount++;
        console.log(`  Progress: ${generatedCount}/${totalImages}\n`);

        console.log("  Antagonist (Lord Malachar):");
        results.characters.antagonist = await generateAndUploadImage(
            IMAGE_PROMPTS.characters.antagonist,
            "character",
            `test/stories/${storyId}/characters/${TEST_IDS.characters.antagonist}/portrait.png`,
            TEST_IDS.characters.antagonist,
        );
        generatedCount++;
        console.log(`  Progress: ${generatedCount}/${totalImages}\n`);

        // 3. Generate setting images
        console.log("🏰 Generating setting images...");

        console.log("  Castle (Silverhold Castle):");
        results.settings.castle = await generateAndUploadImage(
            IMAGE_PROMPTS.settings.castle,
            "setting",
            `test/stories/${storyId}/settings/${TEST_IDS.settings.castle}/visual.png`,
            TEST_IDS.settings.castle,
        );
        generatedCount++;
        console.log(`  Progress: ${generatedCount}/${totalImages}\n`);

        console.log("  Forest (The Whispering Woods):");
        results.settings.forest = await generateAndUploadImage(
            IMAGE_PROMPTS.settings.forest,
            "setting",
            `test/stories/${storyId}/settings/${TEST_IDS.settings.forest}/visual.png`,
            TEST_IDS.settings.forest,
        );
        generatedCount++;
        console.log(`  Progress: ${generatedCount}/${totalImages}\n`);

        // 4. Generate scene images
        console.log("🎬 Generating scene images...");

        const sceneConfigs = [
            {
                key: "scene1_1",
                id: TEST_IDS.scenes.scene1_1,
                name: "The Commander's Summons",
            },
            {
                key: "scene1_2",
                id: TEST_IDS.scenes.scene1_2,
                name: "Ghosts of the Memorial Hall",
            },
            {
                key: "scene1_3",
                id: TEST_IDS.scenes.scene1_3,
                name: "The Choice to Lead",
            },
            {
                key: "scene2_1",
                id: TEST_IDS.scenes.scene2_1,
                name: "Into the Whispering Woods",
            },
            {
                key: "scene2_2",
                id: TEST_IDS.scenes.scene2_2,
                name: "The Forest's Test",
            },
            {
                key: "scene2_3",
                id: TEST_IDS.scenes.scene2_3,
                name: "A Light in the Darkness",
            },
        ];

        for (const scene of sceneConfigs) {
            console.log(`  Scene: ${scene.name}`);
            results.scenes[scene.key] = await generateAndUploadImage(
                IMAGE_PROMPTS.scenes[
                    scene.key as keyof typeof IMAGE_PROMPTS.scenes
                ],
                "scene",
                `test/stories/${storyId}/scenes/${scene.id}/image.png`,
                scene.id,
            );
            generatedCount++;
            console.log(`  Progress: ${generatedCount}/${totalImages}\n`);
        }

        // 5. Generate comic panels (if not skipped)
        if (!noPanelsFlag) {
            console.log("🎨 Generating comic panels...\n");

            for (const scene of sceneConfigs) {
                const panelSpecs = COMIC_PANEL_SPECS[scene.key];
                if (!panelSpecs) continue;

                console.log(
                    `  Scene: ${scene.name} (${panelSpecs.length} panels)`,
                );
                results.panels[scene.key] = [];

                for (const spec of panelSpecs) {
                    console.log(
                        `    Panel ${spec.panelNumber}/${panelSpecs.length}:`,
                    );
                    const image = await generateAndUploadImage(
                        spec.prompt,
                        "comic-panel",
                        `test/stories/${storyId}/scenes/${scene.id}/panels/panel-${spec.panelNumber}.png`,
                        scene.id,
                    );
                    results.panels[scene.key].push({
                        panelNumber: spec.panelNumber,
                        image,
                        spec,
                    });
                    generatedCount++;
                    console.log(
                        `    Progress: ${generatedCount}/${totalImages}`,
                    );
                }
                console.log();
            }
        }

        // Save results to file
        const outputPath = path.join(
            process.cwd(),
            "logs",
            "test-images-results.json",
        );
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

        console.log("=".repeat(60));
        console.log("✅ IMAGE GENERATION COMPLETE");
        console.log("=".repeat(60));
        console.log();
        console.log("📊 Summary:");
        console.log(`  • Images generated: ${generatedCount}`);
        console.log(`  • Results saved to: ${outputPath}`);
        console.log();
        console.log("📝 Next Steps:");
        console.log(
            "  1. Review the generated images in Vercel Blob (test/ prefix)",
        );
        console.log(
            "  2. Update tests/helpers/static-novel-data.ts with the image URLs",
        );
        console.log(
            "  3. The results JSON file contains all URLs and variants",
        );
        console.log();

        // Output sample code for updating static-novel-data.ts
        console.log("📋 Sample code for static-novel-data.ts:\n");
        console.log("// Story imageUrl and imageVariants:");
        if (results.story) {
            console.log(`imageUrl: "${results.story.imageUrl}",`);
            console.log(
                `imageVariants: ${JSON.stringify(results.story.imageVariants, null, 2)},`,
            );
        }
    } catch (error) {
        console.error("\n❌ Error during generation:", error);
        process.exit(1);
    }
}

// Run main with authentication context
async function runWithAuth(): Promise<void> {
    // Load API key and create auth context
    const apiKey = loadWriterApiKey();
    const authContext = createScriptAuthContext(apiKey);

    console.log(`🔑 Using API key: ${apiKey.substring(0, 10)}...`);

    // Run main function with auth context
    await withAuth(authContext, main);
}

runWithAuth().catch((error) => {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
});
