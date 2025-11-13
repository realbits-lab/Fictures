/**
 * Jest Test Suite for /studio/api/stories
 *
 * Tests story generation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/stories.test.ts
 */

import type {
    ApiChapterRequest,
    ApiChapterResponse,
    ApiCharactersRequest,
    ApiCharactersResponse,
    ApiPartRequest,
    ApiPartResponse,
    ApiSceneSummaryRequest,
    ApiSceneSummaryResponse,
    ApiSettingsRequest,
    ApiSettingsResponse,
    ApiStoryErrorResponse,
    ApiStoryRequest,
    ApiStoryResponse,
} from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Story Generation API", () => {
    it("should generate and save story via POST /studio/api/stories", async () => {
        // 1. Prepare request body with proper TypeScript type
        const requestBody: ApiStoryRequest = {
            userPrompt: "A short story about a brave knight on a quest",
            language: "English",
            preferredGenre: "Fantasy",
            preferredTone: "hopeful",
        };

        // 2. Send POST request to story generation API
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/stories",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(requestBody),
            },
        );

        // 3. Parse response data with proper typing
        const data: ApiStoryResponse | ApiStoryErrorResponse =
            await response.json();

        // 4. Log error if request failed
        if (!response.ok) {
            console.error("❌ API Error:", data);
            expect(response.ok).toBe(true); // Force fail with proper error logged
        }

        // 5. Verify response status
        expect(response.status).toBe(201);

        // 6. Type guard to ensure we have success response
        if (!("success" in data) || !data.success) {
            throw new Error("Expected ApiStoryResponse but got error");
        }

        // 7. Cast to success response type
        const successData = data as ApiStoryResponse;

        // ============================================================================
        // 8. Verify ALL top-level response structure
        // ============================================================================
        expect(successData.success).toBe(true);
        expect(successData.story).toBeDefined();
        expect(successData.metadata).toBeDefined();

        // ============================================================================
        // 9. Verify ALL story object attributes (15 total fields from Story type)
        // ============================================================================
        const { story }: { story: ApiStoryResponse["story"] } = successData;

        // 10. Identity fields (id, authorId, title)
        expect(story.id).toBeDefined();
        expect(typeof story.id).toBe("string");
        expect(story.id).toMatch(/^story_/);

        expect(story.authorId).toBeDefined();
        expect(typeof story.authorId).toBe("string");

        expect(story.title).toBeDefined();
        expect(typeof story.title).toBe("string");
        expect(story.title.length).toBeGreaterThan(0);

        // 11. Adversity-Triumph Core fields (summary, genre, tone, moralFramework)
        // All of these fields are required and cannot be null
        expect(story.summary).toBeDefined();
        expect(typeof story.summary).toBe("string");
        expect(story.summary.length).toBeGreaterThan(0);

        expect(story.genre).toBeDefined();
        expect(typeof story.genre).toBe("string");
        expect(story.genre.length).toBeGreaterThan(0);

        expect(story.tone).toBeDefined();
        expect(typeof story.tone).toBe("string");
        expect(["hopeful", "dark", "bittersweet", "satirical"]).toContain(
            story.tone,
        );

        expect(story.moralFramework).toBeDefined();
        expect(typeof story.moralFramework).toBe("string");
        expect(story.moralFramework.length).toBeGreaterThan(0);

        // 12. Publishing & Engagement fields (status, viewCount, rating, ratingCount)
        expect(story.status).toBeDefined();
        expect(typeof story.status).toBe("string");
        expect(story.status).toBe("writing"); // Should be 'writing' for new stories

        expect(story.viewCount).toBeDefined();
        expect(typeof story.viewCount).toBe("number");
        expect(story.viewCount).toBe(0); // Should be 0 for new stories

        expect(story.rating).toBeDefined();
        expect(typeof story.rating).toBe("number");
        expect(story.rating).toBe(0); // Should be 0 for new stories

        expect(story.ratingCount).toBeDefined();
        expect(typeof story.ratingCount).toBe("number");
        expect(story.ratingCount).toBe(0); // Should be 0 for new stories

        // 13. Visual fields (imageUrl, imageVariants)
        expect(
            story.imageUrl === null || typeof story.imageUrl === "string",
        ).toBe(true);

        // imageVariants can be null or an object
        expect(
            story.imageVariants === null ||
                typeof story.imageVariants === "object",
        ).toBe(true);

        // 14. Metadata fields (createdAt, updatedAt)
        expect(story.createdAt).toBeDefined();
        // createdAt should be a string (timestamp from database)
        expect(typeof story.createdAt).toBe("string");

        expect(story.updatedAt).toBeDefined();
        // updatedAt should be a string (timestamp from database)
        expect(typeof story.updatedAt).toBe("string");

        // ============================================================================
        // Verify ALL metadata attributes (as defined in ApiStoryResponse)
        // ============================================================================
        const { metadata }: { metadata: ApiStoryResponse["metadata"] } =
            successData;

        expect(metadata.generationTime).toBeDefined();
        expect(typeof metadata.generationTime).toBe("number");
        expect(metadata.generationTime).toBeGreaterThan(0);

        // model is optional, check if present
        if (metadata.model !== undefined) {
            expect(typeof metadata.model).toBe("string");
        }

        // ============================================================================
        // Log success details
        // ============================================================================
        console.log("✅ Story created successfully:");
        console.log(`  ID: ${story.id}`);
        console.log(`  Title: ${story.title}`);
        console.log(`  Genre: ${story.genre}`);
        console.log(`  Tone: ${story.tone}`);
        console.log(`  Summary: ${story.summary?.substring(0, 100)}...`);
        console.log(
            `  Moral Framework: ${story.moralFramework?.substring(0, 80)}...`,
        );
        console.log(`  Status: ${story.status}`);
        console.log(`  View Count: ${story.viewCount}`);
        console.log(`  Rating: ${story.rating}`);
        console.log(`  Rating Count: ${story.ratingCount}`);
        console.log(`  Image URL: ${story.imageUrl || "N/A"}`);
        console.log(
            `  Image Variants: ${story.imageVariants ? "Present" : "N/A"}`,
        );
        console.log(`  Author ID: ${story.authorId}`);
        console.log(`  Created: ${story.createdAt}`);
        console.log(`  Updated: ${story.updatedAt}`);
        console.log(`  Generation time: ${metadata.generationTime}ms`);
        console.log(`  Model: ${metadata.model || "N/A"}`);
    }, 60000); // 60 second timeout for AI generation

    it("should generate complete story structure: 2 parts, 3 chapters per part, 3 scene-summaries per chapter", async () => {
        console.log("\n🚀 Starting comprehensive story generation test...\n");

        // ====================================================================
        // STEP 1: Generate Story
        // ====================================================================
        console.log("📖 Step 1/5: Generating story...");
        const storyRequestBody: ApiStoryRequest = {
            userPrompt:
                "An epic fantasy adventure about a hero's journey to save their kingdom",
            language: "English",
            preferredGenre: "Fantasy",
            preferredTone: "hopeful",
        };

        const storyResponse: Response = await fetch(
            "http://localhost:3000/studio/api/stories",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(storyRequestBody),
            },
        );

        const storyData: ApiStoryResponse | ApiStoryErrorResponse =
            await storyResponse.json();

        if (!storyResponse.ok) {
            console.error("❌ Story generation failed:", storyData);
            expect(storyResponse.ok).toBe(true);
        }

        expect(storyResponse.status).toBe(201);
        expect("success" in storyData && storyData.success).toBe(true);

        const story = (storyData as ApiStoryResponse).story;
        const testStoryId = story.id;

        console.log(`✅ Story created: ${testStoryId}`);
        console.log(`   Title: ${story.title}`);

        // ====================================================================
        // STEP 2: Generate Characters (prerequisite)
        // ====================================================================
        console.log("\n👥 Step 2/5: Generating 2 characters...");
        const charactersRequestBody: ApiCharactersRequest = {
            storyId: testStoryId,
            characterCount: 2,
            language: "English",
        };

        const charactersResponse: Response = await fetch(
            "http://localhost:3000/studio/api/characters",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(charactersRequestBody),
            },
        );

        const charactersData: ApiCharactersResponse =
            await charactersResponse.json();

        if (!charactersResponse.ok) {
            console.error("❌ Character generation failed:", charactersData);
            expect(charactersResponse.ok).toBe(true);
        }

        expect(charactersResponse.status).toBe(201);
        expect(charactersData.characters.length).toBe(2);

        console.log(
            `✅ Characters generated: ${charactersData.characters.length}`,
        );
        for (const char of charactersData.characters) {
            console.log(`   - ${char.name} (${char.id})`);
        }

        // ====================================================================
        // STEP 2.5: Generate Settings (Required for Parts)
        // ====================================================================
        console.log("\n🏞️  Step 2.5/3: Generating settings...");

        const settingsRequestBody: ApiSettingsRequest = {
            storyId: testStoryId,
            settingCount: 2,
        };

        const settingsResponse: Response = await fetch(
            "http://localhost:3000/studio/api/settings",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify(settingsRequestBody),
            },
        );

        const settingsData: ApiSettingsResponse = await settingsResponse.json();

        if (!settingsResponse.ok) {
            console.error("❌ Settings generation failed:", settingsData);
            expect(settingsResponse.ok).toBe(true);
        }

        expect(settingsResponse.status).toBe(201);
        expect(settingsData.settings).toBeDefined();
        expect(settingsData.settings.length).toBe(2);

        console.log(`✅ Settings generated: ${settingsData.settings.length}`);
        for (const setting of settingsData.settings) {
            console.log(`   - ${setting.name} (${setting.id})`);
        }

        // ====================================================================
        // STEP 3-5: Generate Parts → Chapters → Scenes (Incremental Workflow)
        // ====================================================================
        console.log(
            "\n📚 Step 3/3: Generating 2 parts with chapters and scenes incrementally...",
        );

        const allPartIds: string[] = [];
        const allChapterIds: string[] = [];
        const allSceneIds: string[] = [];

        let globalChapterIndex = 0;
        let globalSceneIndex = 0;

        // Generate 2 parts incrementally
        for (let partNum = 0; partNum < 2; partNum++) {
            console.log(`\n   ╔═══ PART ${partNum + 1}/2 ═══╗`);

            // ================================================================
            // STEP 3.1: Generate Part
            // ================================================================
            console.log(`   ║ Generating part ${partNum + 1}...`);

            const partRequestBody: ApiPartRequest = {
                storyId: testStoryId,
            };

            const partResponse: Response = await fetch(
                "http://localhost:3000/studio/api/part",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                    },
                    body: JSON.stringify(partRequestBody),
                },
            );

            const partData: ApiPartResponse = await partResponse.json();

            if (!partResponse.ok) {
                console.error(
                    `❌ Part ${partNum + 1} generation failed:`,
                    partData,
                );
                expect(partResponse.ok).toBe(true);
            }

            expect(partResponse.status).toBe(201);
            expect(partData.success).toBe(true);

            const part = partData.part;
            allPartIds.push(part.id);

            // Verify part metadata
            expect(part.id).toMatch(/^part_/);
            expect(part.storyId).toBe(testStoryId);
            expect(part.title).toBeDefined();
            expect(typeof part.title).toBe("string");
            expect(partData.metadata.partIndex).toBe(partNum);
            expect(partData.metadata.totalParts).toBe(partNum + 1);

            console.log(`   ║ ✅ Part ${partNum + 1}: ${part.title}`);
            console.log(`   ║    ID: ${part.id}`);
            console.log(
                `   ║    Index: ${partData.metadata.partIndex}, Total: ${partData.metadata.totalParts}`,
            );

            // ================================================================
            // STEP 3.2: Generate 3 Chapters for this Part
            // ================================================================
            console.log(`   ║`);
            console.log(
                `   ║ Generating 3 chapters for part ${partNum + 1}...`,
            );

            for (let chapterNum = 0; chapterNum < 3; chapterNum++) {
                console.log(
                    `   ║   📖 Chapter ${globalChapterIndex + 1}/6 (Part ${partNum + 1}, Chapter ${chapterNum + 1}/3)`,
                );

                const chapterRequestBody: ApiChapterRequest = {
                    storyId: testStoryId,
                    partId: part.id,
                };

                const chapterResponse: Response = await fetch(
                    "http://localhost:3000/studio/api/chapter",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": apiKey,
                        },
                        body: JSON.stringify(chapterRequestBody),
                    },
                );

                const chapterData: ApiChapterResponse =
                    await chapterResponse.json();

                if (!chapterResponse.ok) {
                    console.error(
                        `❌ Chapter ${globalChapterIndex + 1} failed:`,
                        chapterData,
                    );
                    expect(chapterResponse.ok).toBe(true);
                }

                expect(chapterResponse.status).toBe(201);
                expect(chapterData.success).toBe(true);

                const chapter = chapterData.chapter;
                allChapterIds.push(chapter.id);

                // Verify chapter metadata
                expect(chapter.id).toMatch(/^chapter_/);
                expect(chapter.partId).toBe(part.id);
                expect(chapter.title).toBeDefined();
                expect(typeof chapter.title).toBe("string");
                expect(chapterData.metadata.chapterIndex).toBe(
                    globalChapterIndex,
                );
                expect(chapterData.metadata.totalChapters).toBe(
                    globalChapterIndex + 1,
                );

                console.log(`   ║      ✅ ${chapter.title}`);
                console.log(
                    `   ║         ID: ${chapter.id}, Global Index: ${chapterData.metadata.chapterIndex}`,
                );

                // ============================================================
                // STEP 3.3: Generate 3 Scene Summaries for this Chapter
                // ============================================================
                console.log(
                    `   ║         Generating 3 scenes for chapter ${globalChapterIndex + 1}...`,
                );

                for (let sceneNum = 0; sceneNum < 3; sceneNum++) {
                    console.log(
                        `   ║            📄 Scene ${globalSceneIndex + 1}/18 (Ch ${globalChapterIndex + 1}, Scene ${sceneNum + 1}/3)`,
                    );

                    const sceneRequestBody: ApiSceneSummaryRequest = {
                        storyId: testStoryId,
                        chapterId: chapter.id,
                    };

                    const sceneResponse: Response = await fetch(
                        "http://localhost:3000/studio/api/scene-summary",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "x-api-key": apiKey,
                            },
                            body: JSON.stringify(sceneRequestBody),
                        },
                    );

                    const sceneData: ApiSceneSummaryResponse =
                        await sceneResponse.json();

                    if (!sceneResponse.ok) {
                        console.error(
                            `❌ Scene ${globalSceneIndex + 1} failed:`,
                            sceneData,
                        );
                        expect(sceneResponse.ok).toBe(true);
                    }

                    expect(sceneResponse.status).toBe(201);
                    expect(sceneData.success).toBe(true);

                    const scene = sceneData.scene;
                    allSceneIds.push(scene.id);

                    // Verify scene metadata
                    expect(scene.id).toMatch(/^scene_/);
                    expect(scene.chapterId).toBe(chapter.id);
                    expect(scene.title).toBeDefined();
                    expect(typeof scene.title).toBe("string");
                    // sceneIndex is per-chapter, not global
                    expect(sceneData.metadata.sceneIndex).toBe(sceneNum);
                    expect(sceneData.metadata.totalScenes).toBe(sceneNum + 1);

                    console.log(`   ║               ✅ ${scene.title}`);
                    console.log(
                        `   ║                  ID: ${scene.id}, Chapter Scene Index: ${sceneData.metadata.sceneIndex}`,
                    );

                    globalSceneIndex++;
                }

                globalChapterIndex++;
            }

            console.log(`   ╚═══ Part ${partNum + 1} Complete ═══╝\n`);
        }

        // Verify final counts
        expect(allPartIds.length).toBe(2);
        expect(allChapterIds.length).toBe(6);
        expect(allSceneIds.length).toBe(18);

        console.log(
            `✅ All parts, chapters, and scenes generated incrementally`,
        );

        // ====================================================================
        // FINAL VALIDATION
        // ====================================================================
        console.log("\n🔍 Final Validation:");

        // Verify all IDs are unique
        const allIds = [
            testStoryId,
            ...charactersData.characters.map((c) => c.id),
            ...allPartIds,
            ...allChapterIds,
            ...allSceneIds,
        ];
        const uniqueIds = new Set(allIds);
        expect(uniqueIds.size).toBe(allIds.length);
        console.log(`   ✅ All ${allIds.length} IDs are unique`);

        // Verify ID formats
        expect(testStoryId).toMatch(/^story_/);
        for (const char of charactersData.characters) {
            expect(char.id).toMatch(/^char_/);
        }
        for (const partId of allPartIds) {
            expect(partId).toMatch(/^part_/);
        }
        for (const chapterId of allChapterIds) {
            expect(chapterId).toMatch(/^chapter_/);
        }
        for (const sceneId of allSceneIds) {
            expect(sceneId).toMatch(/^scene_/);
        }
        console.log("   ✅ All ID formats are valid");

        // Final counts
        console.log("\n📊 Final Statistics:");
        console.log(`   Story: 1 (${testStoryId})`);
        console.log(`   Characters: ${charactersData.characters.length}`);
        console.log(`   Parts: ${allPartIds.length}`);
        console.log(`   Chapters: ${allChapterIds.length}`);
        console.log(`   Scene Summaries: ${allSceneIds.length}`);
        console.log(
            "\n✅ Comprehensive incremental story generation test PASSED\n",
        );
    }, 1800000); // 30 minute timeout for full generation
});
