/**
 * Settings API Route
 *
 * POST /studio/api/settings - Generate settings using AI
 * GET /studio/api/settings - Get settings for a story
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required for POST
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { settings, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { generateSettings } from "@/lib/studio/generators/settings-generator";
import type { GenerateSettingsParams } from "@/lib/studio/generators/types";
import type {
	GenerateSettingsErrorResponse,
	GenerateSettingsRequest,
	GenerateSettingsResponse,
} from "../types";

export const runtime = "nodejs";

/**
 * Validation schema for generating settings
 */
const generateSettingsSchema = z.object({
	storyId: z.string(),
	settingCount: z.number().min(1).max(10).optional().default(3),
});

/**
 * GET /studio/api/settings
 *
 * Get all settings for a story
 */
export async function GET(request: NextRequest) {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("📚 [SETTINGS API] GET request received");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const storyId = searchParams.get("storyId");

		if (!storyId) {
			return NextResponse.json(
				{ error: "storyId parameter is required" },
				{ status: 400 },
			);
		}

		// Verify story exists and user has access
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, storyId))
			.limit(1);

		if (!story) {
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		if (story.authorId !== authResult.user.id) {
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		// Get all settings for this story
		const storySettings = await db
			.select()
			.from(settings)
			.where(eq(settings.storyId, storyId))
			.orderBy(settings.createdAt);

		console.log(`✅ [SETTINGS API] Found ${storySettings.length} settings`);

		return NextResponse.json({
			success: true,
			settings: storySettings,
		});
	} catch (error) {
		console.error("❌ [SETTINGS API] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * POST /studio/api/settings
 *
 * Generate settings for a story using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log("📚 [SETTINGS API] POST request received");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			console.error("❌ [SETTINGS API] Authentication failed");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!hasRequiredScope(authResult, "stories:write")) {
			console.error("❌ [SETTINGS API] Insufficient scopes:", {
				required: "stories:write",
				actual: authResult.scopes,
			});
			return NextResponse.json(
				{ error: "Insufficient permissions. Required scope: stories:write" },
				{ status: 403 },
			);
		}

		console.log("✅ [SETTINGS API] Authentication successful:", {
			type: authResult.type,
			userId: authResult.user.id,
			email: authResult.user.email,
		});

		// Parse and validate request body with type safety
		const body = (await request.json()) as GenerateSettingsRequest;
		const validatedData = generateSettingsSchema.parse(body);

		console.log("[SETTINGS API] Request parameters:", {
			storyId: validatedData.storyId,
			settingCount: validatedData.settingCount,
			language: validatedData.language,
		});

		// Fetch story and verify ownership
		const [story] = await db
			.select()
			.from(stories)
			.where(eq(stories.id, validatedData.storyId));

		if (!story) {
			console.error("❌ [SETTINGS API] Story not found");
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		if (story.authorId !== authResult.user.id) {
			console.error("❌ [SETTINGS API] Access denied - not story author");
			return NextResponse.json({ error: "Access denied" }, { status: 403 });
		}

		console.log("✅ [SETTINGS API] Story verified:", {
			id: story.id,
			title: story.title,
		});

		// Generate settings using AI
		console.log("[SETTINGS API] 🤖 Calling settings generator...");
		const generateParams: GenerateSettingsParams = {
			storyId: validatedData.storyId,
			story: story as any,
			settingCount: validatedData.settingCount,
		};

		const generationResult = await generateSettings(generateParams);

		console.log("[SETTINGS API] ✅ Settings generation completed:", {
			count: generationResult.settings.length,
			generationTime: generationResult.metadata.generationTime,
		});

		// Save generated settings to database
		console.log("[SETTINGS API] 💾 Saving settings to database...");
		const savedSettings = [];

		for (const settingData of generationResult.settings) {
			const settingId = `setting_${nanoid(16)}`;
			const [savedSetting] = await db
				.insert(settings)
				.values({
					id: settingId,
					storyId: validatedData.storyId,
					name: settingData.name || "Unnamed Setting",
					description: settingData.description || null,
					timeframe: settingData.timeframe || null,
					socialStructure: settingData.socialStructure || null,
					geographyClimate: settingData.geographyClimate || null,
					adversityElements: settingData.adversityElements || null,
					cycleAmplification: settingData.cycleAmplification || null,
					sensory: settingData.sensory || null,
					mood: settingData.mood || null,
					imageUrl: null,
					imageVariants: null,
					visualStyle: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			savedSettings.push(savedSetting);
		}

		console.log(
			`[SETTINGS API] ✅ Saved ${savedSettings.length} settings to database`,
		);

		// Invalidate cache
		await invalidateStudioCache(authResult.user.id);
		console.log("[SETTINGS API] ✅ Cache invalidated");

		console.log("✅ [SETTINGS API] Request completed successfully");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// Return typed response
		const response: GenerateSettingsResponse = {
			success: true,
			settings: savedSettings,
			metadata: {
				totalGenerated: savedSettings.length,
				generationTime: generationResult.metadata.generationTime,
			},
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error) {
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.error("❌ [SETTINGS API] Error:", error);
		console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		if (error instanceof z.ZodError) {
			const errorResponse: GenerateSettingsErrorResponse = {
				error: "Invalid input",
				details: error.issues,
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		const errorResponse: GenerateSettingsErrorResponse = {
			error: "Failed to generate and save settings",
			details: error instanceof Error ? error.message : "Unknown error",
		};

		return NextResponse.json(errorResponse, { status: 500 });
	}
}
