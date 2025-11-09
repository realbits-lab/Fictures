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
} from "@/app/studio/api/types";
import { loadWriterAuth } from "../../helpers/auth-loader";

// Load writer authentication
const apiKey: string = loadWriterAuth();

describe("Setting API", () => {
    let testStoryId: string;

    beforeAll(async () => {
        console.log("🔧 Setting up test story...");

        // 1. Prepare story request
        const response: Response = await fetch(
            "http://localhost:3000/studio/api/stories",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                },
                body: JSON.stringify({
                    userPrompt: "A test story for setting testing",
                    language: "English",
                    preferredGenre: "Fantasy",
                    preferredTone: "dark",
                }),
            },
        );

        // 2. Parse story response
        const data: { story: { id: string } } = await response.json();

        // 3. Validate story response
        if (!response.ok) {
            throw new Error(
                `Failed to create test story: ${JSON.stringify(data)}`,
            );
        }

        // 4. Store test story ID
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

        // 10. Verify settings data
        const { settings }: { settings: GenerateSettingsResponse["settings"] } =
            successData;
        const firstSetting = settings[0];
        expect(firstSetting.id).toMatch(/^setting_/);
        expect(firstSetting.storyId).toBe(testStoryId);
        expect(firstSetting.name).toBeDefined();
        expect(typeof firstSetting.name).toBe("string");
        expect(firstSetting.summary).toBeDefined();

        // 11. Log success details
        console.log("✅ Settings generated successfully:");
        console.log(`  Total Generated: ${settings.length}`);
        console.log(`  Generation Time: ${metadata.generationTime}ms`);
        for (let idx = 0; idx < settings.length; idx++) {
            const setting = settings[idx];
            console.log(`  ${idx + 1}. ${setting.name}`);
            console.log(`     ID: ${setting.id}`);
            console.log(
                `     Summary: ${setting.summary?.substring(0, 80) || "N/A"}...`,
            );
            console.log(`     Mood: ${setting.mood || "N/A"}`);
        }
    }, 60000);
});
