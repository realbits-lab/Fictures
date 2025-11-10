/**
 * Jest Test Suite for /studio/api/settings
 *
 * Tests setting creation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/settings.test.ts
 */

import type {
    GenerateSettingsErrorResponse,
    GenerateSettingsRequest,
    GenerateSettingsResponse,
    GenerateStoryRequest,
} from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Setting API", () => {
    let testStoryId: string = "";

    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Prepare story request body with proper TypeScript type
        const storyRequestBody: GenerateStoryRequest = {
            userPrompt: "A test story for setting testing",
            language: "English",
            preferredGenre: "Fantasy",
            preferredTone: "dark",
        };

        // 2. Send POST request to story creation API
        const response: Response = await fetch(
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

        // 3. Parse story response
        const data: { story: { id: string } } = await response.json();

        // 4. Validate story response
        if (!response.ok) {
            throw new Error(
                `Failed to create test story: ${JSON.stringify(data)}`,
            );
        }

        // 5. Store test story ID
        testStoryId = data.story.id;
        console.log(`✅ Test story created: ${testStoryId}`);
    }, 120000);

    it("should generate settings via POST /studio/api/settings", async () => {
        // 1. Prepare request body with proper TypeScript type
        const requestBody: GenerateSettingsRequest = {
            storyId: testStoryId,
            settingCount: 2, // Generate 2 settings for faster testing
        };

        // 2. Send POST request to settings generation API
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/settings",
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
        const data: GenerateSettingsResponse | GenerateSettingsErrorResponse =
            await response.json();

        // 4. Log error if request failed
        if (!response.ok) {
            console.error("❌ Settings API Error:", data);
            expect(response.ok).toBe(true); // Force fail with proper error logged
        }

        // 5. Verify response status
        expect(response.status).toBe(201);

        // 6. Type guard to ensure we have success response
        if (!("success" in data) || !data.success) {
            throw new Error("Expected GenerateSettingsResponse but got error");
        }

        // 7. Cast to success response type
        const successData = data as GenerateSettingsResponse;

        // 8. Verify response structure
        expect(successData.success).toBe(true);
        expect(successData.settings).toBeDefined();
        expect(Array.isArray(successData.settings)).toBe(true);
        expect(successData.settings.length).toBe(2);
        expect(successData.metadata).toBeDefined();

        // 9. Verify metadata
        const { metadata }: { metadata: GenerateSettingsResponse["metadata"] } =
            successData;
        expect(metadata.totalGenerated).toBe(2);
        expect(metadata.generationTime).toBeGreaterThan(0);

        // ============================================================================
        // 10. Verify ALL setting attributes for ALL settings (not just index 0)
        // ============================================================================
        const { settings }: { settings: GenerateSettingsResponse["settings"] } =
            successData;

        // 11. Loop through ALL settings and verify each one
        for (const setting of settings) {
            // === IDENTITY FIELDS ===
            expect(setting.id).toMatch(/^setting_/);
            expect(setting.storyId).toBe(testStoryId);
            expect(setting.name).toBeDefined();
            expect(typeof setting.name).toBe("string");
            expect(setting.name.length).toBeGreaterThan(0);

            // summary can be null or string
            expect(
                setting.summary === null || typeof setting.summary === "string",
            ).toBe(true);

            // === ADVERSITY-TRIUMPH CORE ===
            // adversityElements can be null or object
            expect(
                setting.adversityElements === null ||
                    typeof setting.adversityElements === "object",
            ).toBe(true);

            // symbolicMeaning can be null or string
            expect(
                setting.symbolicMeaning === null ||
                    typeof setting.symbolicMeaning === "string",
            ).toBe(true);

            // cycleAmplification can be null or object
            expect(
                setting.cycleAmplification === null ||
                    typeof setting.cycleAmplification === "object",
            ).toBe(true);

            // === EMOTIONAL ATMOSPHERE ===
            // mood can be null or string
            expect(
                setting.mood === null || typeof setting.mood === "string",
            ).toBe(true);

            // emotionalResonance can be null or string
            expect(
                setting.emotionalResonance === null ||
                    typeof setting.emotionalResonance === "string",
            ).toBe(true);

            // === SENSORY IMMERSION ===
            // sensory can be null or object
            expect(
                setting.sensory === null || typeof setting.sensory === "object",
            ).toBe(true);

            // architecturalStyle can be null or string
            expect(
                setting.architecturalStyle === null ||
                    typeof setting.architecturalStyle === "string",
            ).toBe(true);

            // === VISUAL GENERATION ===
            // imageUrl can be null or string
            expect(
                setting.imageUrl === null ||
                    typeof setting.imageUrl === "string",
            ).toBe(true);

            // imageVariants can be null or object
            expect(
                setting.imageVariants === null ||
                    typeof setting.imageVariants === "object",
            ).toBe(true);

            // visualStyle can be null or string
            expect(
                setting.visualStyle === null ||
                    typeof setting.visualStyle === "string",
            ).toBe(true);

            // visualReferences can be null or object
            expect(
                setting.visualReferences === null ||
                    typeof setting.visualReferences === "object",
            ).toBe(true);

            // colorPalette can be null or object
            expect(
                setting.colorPalette === null ||
                    typeof setting.colorPalette === "object",
            ).toBe(true);

            // === METADATA FIELDS ===
            expect(setting.createdAt).toBeDefined();
            expect(typeof setting.createdAt).toBe("string");

            expect(setting.updatedAt).toBeDefined();
            expect(typeof setting.updatedAt).toBe("string");
        }

        // ============================================================================
        // 12. Log success details
        // ============================================================================
        console.log("✅ Settings generated successfully:");
        console.log(`  Total Generated: ${settings.length}`);
        console.log(`  Generation Time: ${metadata.generationTime}ms`);
        for (const [idx, setting] of settings.entries()) {
            console.log(`  ${idx + 1}. ${setting.name}`);
            console.log(`     ID: ${setting.id}`);
            console.log(
                `     Summary: ${setting.summary?.substring(0, 80) || "N/A"}...`,
            );
            console.log(`     Mood: ${setting.mood || "N/A"}`);
        }
    }, 60000);
});
