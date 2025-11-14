/**
 * Jest Test Suite for /studio/api/settings
 *
 * Tests setting creation API with real API calls.
 *
 * Run:
 *   dotenv --file .env.local run pnpm test __tests__/api/studio/settings.test.ts
 */

import type {
    ApiSettingsErrorResponse,
    ApiSettingsRequest,
    ApiSettingsResponse,
    ApiStoryRequest,
} from "@/lib/schemas/api/studio";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Setting API", () => {
    let testStoryId: string = "";

    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Prepare story request body with proper TypeScript type
        const storyRequestBody: ApiStoryRequest = {
            userPrompt: "A test story for setting testing",
            language: "English",
            preferredGenre: "Fantasy",
            preferredTone: "dark",
        };

        // 2. Send POST request to story creation API
        const response: Response = await fetch(
            "http://localhost:3000/api/studio/story",
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
        const requestBody: ApiSettingsRequest = {
            storyId: testStoryId,
            settingCount: 2, // Generate 2 settings for faster testing
        };

        // 2. Send POST request to settings generation API
        const response: Response = await fetch(
            "http://localhost:3000/api/studio/settings",
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
        const data: ApiSettingsResponse | ApiSettingsErrorResponse =
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
            throw new Error("Expected ApiSettingsResponse but got error");
        }

        // 7. Cast to success response type
        const successData = data as ApiSettingsResponse;

        // 8. Verify response structure
        expect(successData.success).toBe(true);
        expect(successData.settings).toBeDefined();
        expect(Array.isArray(successData.settings)).toBe(true);
        expect(successData.settings.length).toBe(2);
        expect(successData.metadata).toBeDefined();

        // 9. Verify metadata
        const { metadata }: { metadata: ApiSettingsResponse["metadata"] } =
            successData;
        expect(metadata.totalGenerated).toBe(2);
        expect(metadata.generationTime).toBeGreaterThan(0);

        // ============================================================================
        // 10. Verify ALL setting attributes for ALL settings (not just index 0)
        // ============================================================================
        const { settings }: { settings: ApiSettingsResponse["settings"] } =
            successData;

        // 11. Loop through ALL settings and verify each one
        for (const setting of settings) {
            // === IDENTITY FIELDS ===
            expect(setting.id).toMatch(/^setting_/);
            expect(setting.storyId).toBe(testStoryId);
            expect(setting.name).toBeDefined();
            expect(typeof setting.name).toBe("string");
            expect(setting.name.length).toBeGreaterThan(0);

            // === REQUIRED FIELDS (notNull in schema) ===
            // summary MUST be a string (notNull)
            expect(setting.summary).toBeDefined();
            expect(typeof setting.summary).toBe("string");
            expect(setting.summary.length).toBeGreaterThan(0);

            // === ADVERSITY-TRIUMPH CORE ===
            // adversityElements MUST be an object (notNull)
            expect(setting.adversityElements).toBeDefined();
            expect(typeof setting.adversityElements).toBe("object");
            expect(setting.adversityElements).not.toBeNull();

            // symbolicMeaning MUST be a string (notNull)
            expect(setting.symbolicMeaning).toBeDefined();
            expect(typeof setting.symbolicMeaning).toBe("string");
            expect(setting.symbolicMeaning.length).toBeGreaterThan(0);

            // cycleAmplification field was removed from schema
            // expect(setting.cycleAmplification).toBeDefined();
            // expect(typeof setting.cycleAmplification).toBe("object");
            // expect(setting.cycleAmplification).not.toBeNull();

            // === EMOTIONAL ATMOSPHERE ===
            // mood MUST be a string (notNull)
            expect(setting.mood).toBeDefined();
            expect(typeof setting.mood).toBe("string");
            expect(setting.mood.length).toBeGreaterThan(0);

            // emotionalResonance MUST be a string (notNull)
            expect(setting.emotionalResonance).toBeDefined();
            expect(typeof setting.emotionalResonance).toBe("string");
            expect(setting.emotionalResonance.length).toBeGreaterThan(0);

            // === SENSORY IMMERSION ===
            // sensory MUST be an object (notNull)
            expect(setting.sensory).toBeDefined();
            expect(typeof setting.sensory).toBe("object");
            expect(setting.sensory).not.toBeNull();

            // architecturalStyle MUST be a string (notNull)
            expect(setting.architecturalStyle).toBeDefined();
            expect(typeof setting.architecturalStyle).toBe("string");
            expect(setting.architecturalStyle.length).toBeGreaterThan(0);

            // === VISUAL GENERATION ===
            // imageUrl CAN be null or string (nullable)
            expect(
                setting.imageUrl === null ||
                    typeof setting.imageUrl === "string",
            ).toBe(true);

            // imageVariants CAN be null or object (nullable)
            expect(
                setting.imageVariants === null ||
                    typeof setting.imageVariants === "object",
            ).toBe(true);

            // visualReferences MUST be an array (notNull)
            expect(setting.visualReferences).toBeDefined();
            expect(Array.isArray(setting.visualReferences)).toBe(true);

            // colorPalette MUST be an array (notNull)
            expect(setting.colorPalette).toBeDefined();
            expect(Array.isArray(setting.colorPalette)).toBe(true);

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
