/**
 * Novel Generation Streaming API
 *
 * Unified endpoint for complete novel generation using the Adversity-Triumph Engine.
 * Replaces the legacy HNS generation system.
 *
 * This endpoint:
 * 1. Orchestrates all 9 novel generation phases
 * 2. Streams progress updates via Server-Sent Events (SSE)
 * 3. Creates database records for story, characters, settings, parts, chapters, scenes
 * 4. Generates and optimizes images for all visual elements
 *
 * Usage:
 *   POST /api/studio/stories
 *   Body: { userPrompt, preferredGenre?, preferredTone?, characterCount?, language? }
 *   Returns: SSE stream with progress updates
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { NextRequest } from "next/server";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { GENRE, STORY_GENRES, type StoryGenre } from "@/lib/constants/genres";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
    stories,
} from "@/lib/schemas/database";
import {
    insertChapterSchema,
    insertCharacterSchema,
    insertPartSchema,
    insertSceneSchema,
    insertSettingSchema,
} from "@/lib/schemas/zod/generated";
import {
    type GeneratedNovelResult,
    type GenerateNovelParams,
    generateCompleteNovel,
    type ProgressData,
} from "../../../../../scripts/lib/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes

function createSSEMessage(data: ProgressData): string {
    return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest): Promise<Response> {
    // 1. Authenticate request (dual auth: API key OR session)
    console.log("[Novel Generate API] Authenticating request...");
    console.log("[Novel Generate API] Headers:", {
        authorization: request.headers.get("authorization")
            ? "Bearer ***"
            : "none",
        xApiKey: request.headers.get("x-api-key") ? "***" : "none",
    });

    const authResult = await authenticateRequest(request);

    console.log(
        "[Novel Generate API] Auth result:",
        authResult
            ? `type: ${authResult.type}, user: ${authResult.user.email}`
            : "null",
    );

    if (!authResult) {
        console.log(
            "[Novel Generate API] Unauthorized - no valid authentication",
        );
        return new Response("Unauthorized", { status: 401 });
    }

    // 2. Check required scope (stories:write)
    if (!hasRequiredScope(authResult, "stories:write")) {
        console.log(
            "[Novel Generate API] Forbidden - missing stories:write scope",
        );
        return new Response(
            JSON.stringify({
                error: "Insufficient permissions. Required scope: stories:write",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } },
        );
    }

    console.log(
        "[Novel Generate API] Authentication successful, proceeding with generation",
    );
    const userId = authResult.user.id;

    try {
        // 3. Parse and validate request body
        const body = (await request.json()) as GenerateNovelParams;
        const {
            userPrompt,
            preferredGenre,
            preferredTone,
            characterCount,
            settingCount,
            partsCount,
            chaptersPerPart,
            scenesPerChapter,
            language,
            skipImages,
        } = body;

        if (!userPrompt?.trim()) {
            return new Response("User prompt is required", { status: 400 });
        }

        console.log("[Novel Generate API] Options:", {
            userPrompt: `${userPrompt.substring(0, 50)}...`,
            skipImages,
        });

        // 4. Create SSE stream for progress updates
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    let generatedStoryId: string | null = null;
                    let _generatedStory: GeneratedNovelResult["story"] | null =
                        null;
                    let _generatedCharacters: GeneratedNovelResult["characters"] =
                        [];
                    let _generatedSettings: GeneratedNovelResult["settings"] =
                        [];
                    let _generatedParts: GeneratedNovelResult["parts"] = [];
                    let _generatedChapters: GeneratedNovelResult["chapters"] =
                        [];
                    const _generatedScenes: GeneratedNovelResult["scenes"] = [];

                    // 5. Define progress callback to stream updates
                    const onProgress = async (progress: ProgressData) => {
                        // Try to send SSE message, but continue if controller is closed
                        try {
                            controller.enqueue(
                                encoder.encode(createSSEMessage(progress)),
                            );
                        } catch (_error) {
                            // Controller may be closed if client disconnected or timeout occurred
                            // This is not fatal - we continue with database insertion
                            console.log(
                                "SSE stream closed, continuing with database insertion...",
                            );
                        }

                        // Store data for database insertion
                        if (progress.phase === "story_complete") {
                            _generatedStory = progress.data?.story;
                        } else if (progress.phase === "characters_complete") {
                            _generatedCharacters =
                                progress.data?.characters || [];
                        } else if (progress.phase === "settings_complete") {
                            _generatedSettings = progress.data?.settings || [];
                        } else if (progress.phase === "parts_complete") {
                            _generatedParts = progress.data?.parts || [];
                        } else if (progress.phase === "chapters_complete") {
                            _generatedChapters = progress.data?.chapters || [];
                        } else if (
                            progress.phase === "scene_summaries_complete"
                        ) {
                            // Scene summaries are integrated into scenes
                        } else if (
                            progress.phase === "scene_content_complete"
                        ) {
                            // Will be handled after complete generation
                        }
                    };

                    // 6. Generate the complete novel (9 phases)
                    const result = await generateCompleteNovel(
                        {
                            userPrompt,
                            preferredGenre,
                            preferredTone,
                            characterCount,
                            settingCount,
                            partsCount,
                            chaptersPerPart,
                            scenesPerChapter,
                            language,
                            skipImages,
                        },
                        onProgress,
                    );

                    // 7. Save generated content to database
                    try {
                        controller.enqueue(
                            encoder.encode(
                                createSSEMessage({
                                    phase: "scene_content_progress",
                                    message: "Saving story to database...",
                                }),
                            ),
                        );
                    } catch (_error) {
                        console.log(
                            "SSE stream closed, continuing with database insertion...",
                        );
                    }

                    // 7.1. Insert story record
                    generatedStoryId = nanoid();

                    // Extract first tone value if multiple are provided (comma-separated)
                    let toneValue:
                        | "hopeful"
                        | "dark"
                        | "bittersweet"
                        | "satirical" = "hopeful"; // default
                    if (result.story.tone) {
                        const firstTone = result.story.tone
                            .split(",")[0]
                            .trim()
                            .toLowerCase();
                        // Validate against enum values
                        if (
                            [
                                "hopeful",
                                "dark",
                                "bittersweet",
                                "satirical",
                            ].includes(firstTone)
                        ) {
                            toneValue = firstTone as
                                | "hopeful"
                                | "dark"
                                | "bittersweet"
                                | "satirical";
                        }
                    }

                    // Map AI-generated genre to database enum values
                    const validGenres = STORY_GENRES;

                    type ValidGenre = StoryGenre;
                    let genreValue: ValidGenre = GENRE.SLICE; // default genre

                    if (result.story.genre) {
                        const aiGenre = result.story.genre.trim();

                        // Try exact match first (case-insensitive)
                        const exactMatch = validGenres.find(
                            (g) => g.toLowerCase() === aiGenre.toLowerCase(),
                        );
                        if (exactMatch) {
                            genreValue = exactMatch;
                        } else {
                            // Smart mapping for common AI-generated genres that don't match enum
                            const genreMapping: Record<string, ValidGenre> = {
                                "science fiction": GENRE.SCIFI,
                                scifi: GENRE.SCIFI,
                                "sci-fi": GENRE.SCIFI,
                                cyberpunk: GENRE.SCIFI,
                                "cyberpunk noir": GENRE.SCIFI,
                                steampunk: GENRE.SCIFI,
                                "space opera": GENRE.SCIFI,
                                noir: GENRE.MYSTERY,
                                detective: GENRE.MYSTERY,
                                "urban fantasy": GENRE.FANTASY,
                                "epic fantasy": GENRE.FANTASY,
                                paranormal: GENRE.PARANORMAL,
                                vampire: GENRE.PARANORMAL,
                                werewolf: GENRE.PARANORMAL,
                                supernatural: GENRE.PARANORMAL,
                                suspense: GENRE.MYSTERY,
                                thriller: GENRE.ACTION,
                                "psychological thriller": GENRE.MYSTERY,
                                action: GENRE.ACTION,
                                adventure: GENRE.ACTION,
                                spy: GENRE.ACTION,
                                western: GENRE.ACTION,
                                wuxia: GENRE.CULTIVATION,
                                xianxia: GENRE.CULTIVATION,
                                murim: GENRE.CULTIVATION,
                                "martial arts": GENRE.CULTIVATION,
                                "game world": GENRE.LITRPG,
                                "video game": GENRE.LITRPG,
                                rpg: GENRE.LITRPG,
                                system: GENRE.LITRPG,
                                transmigration: GENRE.ISEKAI,
                                reincarnation: GENRE.ISEKAI,
                                portal: GENRE.ISEKAI,
                                "other world": GENRE.ISEKAI,
                                "slice of life": GENRE.SLICE,
                                contemporary: GENRE.SLICE,
                                "daily life": GENRE.SLICE,
                                "post-apocalyptic": GENRE.DYSTOPIAN,
                                apocalypse: GENRE.DYSTOPIAN,
                                "boys love": GENRE.LGBTQ,
                                "girls love": GENRE.LGBTQ,
                                bl: GENRE.LGBTQ,
                                gl: GENRE.LGBTQ,
                                yaoi: GENRE.LGBTQ,
                                yuri: GENRE.LGBTQ,
                                "historical fiction": GENRE.HISTORICAL,
                            };

                            const lowerGenre = aiGenre.toLowerCase();
                            if (genreMapping[lowerGenre]) {
                                genreValue = genreMapping[lowerGenre];
                            } else {
                                // Fallback: try to find closest match by checking if genre contains valid genre names
                                for (const validGenre of validGenres) {
                                    if (
                                        lowerGenre.includes(
                                            validGenre.toLowerCase(),
                                        ) ||
                                        validGenre
                                            .toLowerCase()
                                            .includes(lowerGenre)
                                    ) {
                                        genreValue = validGenre;
                                        break;
                                    }
                                }
                            }
                        }

                        console.log(
                            `[GENRE MAPPING] AI genre "${result.story.genre}" → DB genre "${genreValue}"`,
                        );
                    }

                    const [storyRecord] = await db
                        .insert(stories)
                        .values({
                            id: generatedStoryId,
                            authorId: userId, // Use userId from authResult (supports both API key and session auth)
                            title: result.story.title,
                            genre: genreValue, // Mapped and validated genre value
                            summary: result.story.summary, // Adversity-Triumph: General thematic premise
                            tone: toneValue, // Adversity-Triumph: Emotional direction (validated enum value)
                            moralFramework: result.story.moralFramework, // Adversity-Triumph: Virtue framework
                            status: "writing", // Fixed: Use 'writing' instead of 'draft' (valid enum value)
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        })
                        .returning();

                    // 7.2. Insert characters with ID mapping and relationship remapping
                    // Fixed: Two-pass approach to properly remap relationship IDs
                    console.log(
                        "[Novel Generation] Starting character insertion with relationship ID remapping fix",
                    );
                    const characterIdMap = new Map<string, string>();
                    if (result.characters.length > 0) {
                        // First pass: Create all character ID mappings
                        result.characters.forEach((char) => {
                            const newId = nanoid();
                            characterIdMap.set(char.id, newId);
                            console.log(
                                `[Novel Generation] Mapped character ${char.name}: ${char.id} → ${newId}`,
                            );
                        });

                        // Second pass: Build character records
                        const characterRecords = result.characters.map(
                            (char) => {
                                const newId = characterIdMap.get(char.id)!;

                                // Validate character data before insert
                                return insertCharacterSchema.parse({
                                    id: newId,
                                    storyId: generatedStoryId!,
                                    name: char.name,
                                    isMain: char.isMain,
                                    summary: char.summary,
                                    coreTrait: char.coreTrait,
                                    internalFlaw: char.internalFlaw,
                                    externalGoal: char.externalGoal,
                                    personality: char.personality,
                                    backstory: char.backstory,
                                    physicalDescription:
                                        char.physicalDescription,
                                    voiceStyle: char.voiceStyle,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                });
                            },
                        );

                        await db.insert(characters).values(characterRecords);
                    }

                    // 7.3. Insert settings with ID mapping
                    const settingIdMap = new Map<string, string>();
                    if (result.settings.length > 0) {
                        const settingRecords = result.settings.map(
                            (setting) => {
                                const newId = nanoid();
                                settingIdMap.set(setting.id, newId); // Map temp ID to database ID

                                // Validate setting data before insert
                                return insertSettingSchema.parse({
                                    id: newId,
                                    storyId: generatedStoryId!,
                                    name: setting.name,
                                    summary: setting.description,
                                    adversityElements:
                                        setting.adversityElements,
                                    symbolicMeaning: setting.symbolicMeaning,
                                    cycleAmplification:
                                        setting.cycleAmplification,
                                    mood: setting.mood,
                                    emotionalResonance:
                                        setting.emotionalResonance,
                                    sensory: setting.sensory,
                                    architecturalStyle:
                                        setting.architecturalStyle,
                                    visualReferences: setting.visualReferences,
                                    colorPalette: setting.colorPalette,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                });
                            },
                        );

                        await db.insert(settings).values(settingRecords);
                    }

                    // 7.4. Insert parts with character arc mapping
                    const partIdMap = new Map<string, string>();
                    if (result.parts.length > 0) {
                        // Create character name-to-ID map for parts (LLM sometimes uses names instead of IDs)
                        const characterNameToIdMap = new Map<string, string>();
                        result.characters.forEach((char) => {
                            characterNameToIdMap.set(
                                char.name,
                                characterIdMap.get(char.id)!,
                            );
                            console.log(
                                `[Novel Generation] Character name map: "${char.name}" -> ${characterIdMap.get(char.id)}`,
                            );
                        });
                        console.log(
                            `[Novel Generation] Character ID map:`,
                            Object.fromEntries(characterIdMap),
                        );

                        const partRecords = result.parts.map((part, _index) => {
                            const newId = nanoid();
                            partIdMap.set(part.id, newId); // Map temp ID to database ID

                            // Map temporary character IDs to database character IDs in characterArcs
                            // Try both ID mapping and name mapping (LLM sometimes uses names)
                            const mappedCharacterArcs = part.characterArcs.map(
                                (arc: any) => {
                                    console.log(
                                        `[Novel Generation] Mapping arc.characterId: "${arc.characterId}"`,
                                    );
                                    let dbCharId = characterIdMap.get(
                                        arc.characterId,
                                    );
                                    console.log(
                                        `  - Try temp ID map: ${dbCharId || "null"}`,
                                    );
                                    if (!dbCharId) {
                                        // Fallback: try name-to-ID mapping
                                        dbCharId = characterNameToIdMap.get(
                                            arc.characterId,
                                        );
                                        console.log(
                                            `  - Try name map: ${dbCharId || "null"}`,
                                        );
                                    }
                                    console.log(
                                        `  - Final result: ${dbCharId || arc.characterId}`,
                                    );
                                    return {
                                        ...arc,
                                        characterId:
                                            dbCharId || arc.characterId,
                                    };
                                },
                            );

                            // Validate part data before insert
                            return insertPartSchema.parse({
                                id: newId,
                                storyId: generatedStoryId!,
                                authorId: userId,
                                title: part.title,
                                summary: part.summary,
                                orderIndex: part.orderIndex,
                                characterArcs: mappedCharacterArcs,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                            });
                        });

                        await db.insert(parts).values(partRecords);
                    }

                    // 7.5. Insert chapters with character focus mapping
                    const chapterIdMap = new Map<string, string>();
                    if (result.chapters.length > 0) {
                        const chapterRecords = result.chapters.map(
                            (chapter, index) => {
                                const newId = nanoid();
                                chapterIdMap.set(chapter.id, newId); // Map temp ID to database ID

                                // Map temporary character IDs to database character IDs in focusCharacters array
                                const mappedFocusCharacters =
                                    chapter.focusCharacters?.map(
                                        (charId: any) =>
                                            characterIdMap.get(charId) ||
                                            charId,
                                    ) || [];

                                // Validate chapter data before insert
                                return insertChapterSchema.parse({
                                    id: newId,
                                    storyId: generatedStoryId!,
                                    authorId: userId,
                                    partId: chapter.partId
                                        ? partIdMap.get(chapter.partId) || null
                                        : null,
                                    title: chapter.title,
                                    summary: chapter.summary,
                                    characterId: chapter.characterId
                                        ? characterIdMap.get(
                                              chapter.characterId,
                                          ) || null
                                        : null,
                                    arcPosition: chapter.arcPosition,
                                    contributesToMacroArc:
                                        chapter.contributesToMacroArc,
                                    focusCharacters: mappedFocusCharacters,
                                    adversityType: chapter.adversityType,
                                    virtueType: chapter.virtueType,
                                    seedsPlanted: chapter.seedsPlanted,
                                    seedsResolved: chapter.seedsResolved,
                                    connectsToPreviousChapter:
                                        chapter.connectsToPreviousChapter,
                                    createsNextAdversity:
                                        chapter.createsNextAdversity,
                                    orderIndex: index,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                });
                            },
                        );

                        await db.insert(chapters).values(chapterRecords);
                    }

                    // 7.6. Insert scenes with complete ID mapping
                    const sceneIdMap = new Map<string, string>();
                    if (result.scenes.length > 0) {
                        console.log(
                            "[Novel Generation] Chapter ID Map:",
                            Object.fromEntries(chapterIdMap),
                        );
                        console.log(
                            "[Novel Generation] Scene chapter IDs:",
                            result.scenes.map((s) => ({
                                sceneId: s.id,
                                chapterId: s.chapterId,
                            })),
                        );

                        const sceneRecords = result.scenes.map(
                            (scene, index) => {
                                const newId = nanoid();
                                sceneIdMap.set(scene.id, newId); // Map temp ID to database ID

                                // Try to map chapter ID, fallback to first chapter if mapping fails
                                let mappedChapterId = scene.chapterId
                                    ? chapterIdMap.get(scene.chapterId)
                                    : null;
                                if (!mappedChapterId && chapterIdMap.size > 0) {
                                    // Fallback: use the first (and usually only) chapter
                                    mappedChapterId = Array.from(
                                        chapterIdMap.values(),
                                    )[0];
                                    console.log(
                                        `[Novel Generation] Scene ${index + 1}: chapterId=${scene.chapterId} not found, using first chapter: ${mappedChapterId}`,
                                    );
                                } else {
                                    console.log(
                                        `[Novel Generation] Scene ${index + 1}: chapterId=${scene.chapterId}, mapped=${mappedChapterId}`,
                                    );
                                }

                                // Map temporary character IDs to database character IDs in characterFocus array
                                // Filter out invalid IDs (like character names that LLM might hallucinate)
                                const mappedCharacterFocus =
                                    scene.characterFocus
                                        ?.map((charId: any) =>
                                            characterIdMap.get(charId),
                                        )
                                        .filter(
                                            (id: any) => id !== undefined,
                                        ) || [];

                                // Map temporary setting ID to database setting ID
                                const mappedSettingId = scene.settingId
                                    ? settingIdMap.get(scene.settingId) || null
                                    : null;

                                // Validate scene data before insert
                                return insertSceneSchema.parse({
                                    id: newId,
                                    chapterId: mappedChapterId,
                                    title: scene.title || `Scene ${index + 1}`, // Fallback title if missing
                                    summary: scene.summary,
                                    content: scene.content,
                                    cyclePhase: scene.cyclePhase,
                                    emotionalBeat: scene.emotionalBeat,
                                    // Planning metadata from scene summary generation
                                    characterFocus: mappedCharacterFocus,
                                    settingId: mappedSettingId,
                                    sensoryAnchors: scene.sensoryAnchors || [],
                                    dialogueVsDescription:
                                        scene.dialogueVsDescription ||
                                        "balanced",
                                    suggestedLength:
                                        scene.suggestedLength || "medium",
                                    orderIndex: index,
                                    createdAt: new Date().toISOString(),
                                    updatedAt: new Date().toISOString(),
                                });
                            },
                        );

                        await db.insert(scenes).values(sceneRecords);

                        console.log(
                            "[Novel Generation] ✅ All entities created with FK relationships",
                        );
                    }

                    // 8. Generate and optimize images (Phase 9 of novel generation)
                    // Skip if skipImages flag is set
                    if (!skipImages) {
                        const totalImages =
                            1 +
                            result.characters.length +
                            result.settings.length +
                            result.scenes.length; // +1 for story cover
                        let completedImages = 0;

                        controller.enqueue(
                            encoder.encode(
                                createSSEMessage({
                                    phase: "images_start",
                                    message:
                                        "Generating story cover, character, setting, and scene images...",
                                    data: {
                                        totalImages,
                                    },
                                }),
                            ),
                        );

                        const baseUrl =
                            process.env.NEXT_PUBLIC_API_URL ||
                            "http://localhost:3000";

                        // 8.1. Generate story cover image
                        try {
                            controller.enqueue(
                                encoder.encode(
                                    createSSEMessage({
                                        phase: "images_progress",
                                        message:
                                            "Generating story cover image...",
                                        data: {
                                            currentItem: 1,
                                            totalItems: totalImages,
                                            percentage: Math.round(
                                                (1 / totalImages) * 100,
                                            ),
                                        },
                                    }),
                                ),
                            );

                            const storyCoverResponse = await fetch(
                                `${baseUrl}/api/studio/images`,
                                {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        storyId: generatedStoryId,
                                        imageType: "story",
                                        targetData: {
                                            title: result.story.title,
                                            genre: result.story.genre,
                                            summary: result.story.summary,
                                            tone: result.story.tone,
                                        },
                                    }),
                                },
                            );

                            if (storyCoverResponse.ok) {
                                const imageResult =
                                    await storyCoverResponse.json();
                                console.log(
                                    "[Novel Generation] Generated story cover image:",
                                    imageResult.originalUrl,
                                );

                                // Update story record with cover image
                                await db
                                    .update(stories)
                                    .set({
                                        imageUrl: imageResult.originalUrl,
                                        imageVariants: imageResult.optimizedSet,
                                        updatedAt: new Date().toISOString(),
                                    })
                                    .where(eq(stories.id, generatedStoryId!));
                            } else {
                                const error = await storyCoverResponse.json();
                                console.error(
                                    "[Novel Generation] Failed to generate story cover:",
                                    error,
                                );
                            }

                            completedImages++;
                        } catch (error) {
                            console.error(
                                "[Novel Generation] Error generating story cover:",
                                error,
                            );
                            completedImages++;
                        }

                        // 8.2. Generate character images
                        for (let i = 0; i < result.characters.length; i++) {
                            const character = result.characters[i];
                            const characterDbId = characterIdMap.get(
                                character.id,
                            );

                            try {
                                controller.enqueue(
                                    encoder.encode(
                                        createSSEMessage({
                                            phase: "images_progress",
                                            message: `Generating image for ${character.name}...`,
                                            data: {
                                                currentItem:
                                                    completedImages + 1,
                                                totalItems: totalImages,
                                                percentage: Math.round(
                                                    ((completedImages + 1) /
                                                        totalImages) *
                                                        100,
                                                ),
                                            },
                                        }),
                                    ),
                                );

                                const imageResponse = await fetch(
                                    `${baseUrl}/api/studio/images`,
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            storyId: generatedStoryId,
                                            imageType: "character",
                                            targetData: character,
                                        }),
                                    },
                                );

                                if (imageResponse.ok) {
                                    const imageResult =
                                        await imageResponse.json();
                                    console.log(
                                        `[Novel Generation] Generated image for character ${character.name}:`,
                                        imageResult.originalUrl,
                                    );

                                    // Update character record with image URL and optimized variants
                                    if (characterDbId) {
                                        await db
                                            .update(characters)
                                            .set({
                                                imageUrl:
                                                    imageResult.originalUrl,
                                                imageVariants:
                                                    imageResult.optimizedSet,
                                                updatedAt:
                                                    new Date().toISOString(),
                                            })
                                            .where(
                                                eq(
                                                    characters.id,
                                                    characterDbId,
                                                ),
                                            );
                                    }
                                } else {
                                    const error = await imageResponse.json();
                                    console.error(
                                        `[Novel Generation] Failed to generate image for character ${character.name}:`,
                                        error,
                                    );
                                }

                                completedImages++;
                            } catch (error) {
                                console.error(
                                    `[Novel Generation] Error generating image for character ${character.name}:`,
                                    error,
                                );
                                completedImages++;
                            }
                        }

                        // 8.3. Generate setting images
                        for (let i = 0; i < result.settings.length; i++) {
                            const setting = result.settings[i];
                            const settingDbId = settingIdMap.get(setting.id);

                            try {
                                controller.enqueue(
                                    encoder.encode(
                                        createSSEMessage({
                                            phase: "images_progress",
                                            message: `Generating image for ${setting.name}...`,
                                            data: {
                                                currentItem:
                                                    completedImages + 1,
                                                totalItems: totalImages,
                                                percentage: Math.round(
                                                    ((completedImages + 1) /
                                                        totalImages) *
                                                        100,
                                                ),
                                            },
                                        }),
                                    ),
                                );

                                const imageResponse = await fetch(
                                    `${baseUrl}/api/studio/images`,
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            storyId: generatedStoryId,
                                            imageType: "setting",
                                            targetData: setting,
                                        }),
                                    },
                                );

                                if (imageResponse.ok) {
                                    const imageResult =
                                        await imageResponse.json();
                                    console.log(
                                        `[Novel Generation] Generated image for setting ${setting.name}:`,
                                        imageResult.originalUrl,
                                    );

                                    // Update setting record with image URL and optimized variants
                                    if (settingDbId) {
                                        await db
                                            .update(settings)
                                            .set({
                                                imageUrl:
                                                    imageResult.originalUrl,
                                                imageVariants:
                                                    imageResult.optimizedSet,
                                                updatedAt:
                                                    new Date().toISOString(),
                                            })
                                            .where(
                                                eq(settings.id, settingDbId),
                                            );
                                    }
                                } else {
                                    const error = await imageResponse.json();
                                    console.error(
                                        `[Novel Generation] Failed to generate image for setting ${setting.name}:`,
                                        error,
                                    );
                                }

                                completedImages++;
                            } catch (error) {
                                console.error(
                                    `[Novel Generation] Error generating image for setting ${setting.name}:`,
                                    error,
                                );
                                completedImages++;
                            }
                        }

                        // 8.4. Generate scene images
                        for (let i = 0; i < result.scenes.length; i++) {
                            const scene = result.scenes[i];
                            const sceneDbId = sceneIdMap.get(scene.id);

                            try {
                                controller.enqueue(
                                    encoder.encode(
                                        createSSEMessage({
                                            phase: "images_progress",
                                            message: `Generating image for scene: ${scene.title}...`,
                                            data: {
                                                currentItem:
                                                    completedImages + 1,
                                                totalItems: totalImages,
                                                percentage: Math.round(
                                                    ((completedImages + 1) /
                                                        totalImages) *
                                                        100,
                                                ),
                                            },
                                        }),
                                    ),
                                );

                                const imageResponse = await fetch(
                                    `${baseUrl}/api/studio/images`,
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                            storyId: generatedStoryId,
                                            sceneId: sceneDbId,
                                            imageType: "scene",
                                            targetData: scene,
                                        }),
                                    },
                                );

                                if (imageResponse.ok) {
                                    const imageResult =
                                        await imageResponse.json();
                                    console.log(
                                        `[Novel Generation] Generated image for scene ${scene.title}:`,
                                        imageResult.originalUrl,
                                    );

                                    // Update scene record with image URL and optimized variants
                                    if (sceneDbId) {
                                        await db
                                            .update(scenes)
                                            .set({
                                                imageUrl:
                                                    imageResult.originalUrl,
                                                imageVariants:
                                                    imageResult.optimizedSet,
                                                updatedAt:
                                                    new Date().toISOString(),
                                            })
                                            .where(eq(scenes.id, sceneDbId));
                                    }
                                } else {
                                    const error = await imageResponse.json();
                                    console.error(
                                        `[Novel Generation] Failed to generate image for scene ${scene.title}:`,
                                        error,
                                    );
                                }

                                completedImages++;
                            } catch (error) {
                                console.error(
                                    `[Novel Generation] Error generating image for scene ${scene.title}:`,
                                    error,
                                );
                                completedImages++;
                            }
                        }

                        controller.enqueue(
                            encoder.encode(
                                createSSEMessage({
                                    phase: "images_complete",
                                    message: "All images generated",
                                    data: {
                                        completedImages,
                                        totalImages,
                                    },
                                }),
                            ),
                        );
                    } else {
                        console.log(
                            "[Novel Generation] Skipping image generation (skipImages=true)",
                        );
                        try {
                            controller.enqueue(
                                encoder.encode(
                                    createSSEMessage({
                                        phase: "images_complete",
                                        message: "Image generation skipped",
                                        data: {
                                            completedImages: 0,
                                            totalImages: 0,
                                        },
                                    }),
                                ),
                            );
                        } catch (_error) {
                            console.log("SSE stream closed, continuing...");
                        }
                    }

                    // 9. Send completion message with final results
                    controller.enqueue(
                        encoder.encode(
                            createSSEMessage({
                                phase: "complete",
                                message: "Story generation complete!",
                                data: {
                                    storyId: generatedStoryId,
                                    story: storyRecord,
                                    charactersCount: result.characters.length,
                                    settingsCount: result.settings.length,
                                    partsCount: result.parts.length,
                                    chaptersCount: result.chapters.length,
                                    scenesCount: result.scenes.length,
                                },
                            }),
                        ),
                    );

                    controller.close();
                } catch (error) {
                    console.error("Novel generation error:", error);

                    controller.enqueue(
                        encoder.encode(
                            createSSEMessage({
                                phase: "error",
                                message:
                                    error instanceof Error
                                        ? error.message
                                        : "Unknown error",
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : String(error),
                            }),
                        ),
                    );

                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        console.error("Novel generation request error:", error);
        return new Response(
            JSON.stringify({
                error: "Failed to start novel generation",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}
