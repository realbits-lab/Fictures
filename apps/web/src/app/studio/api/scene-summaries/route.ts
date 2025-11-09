/**
 * Scene Summaries API Route
 *
 * POST /studio/api/scene-summaries - Update scene summary
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { scenes } from "@/lib/db/schema";

export const runtime = "nodejs";

const updateSceneSummarySchema = z.object({
	sceneId: z.string(),
	summary: z.string(),
});

export async function POST(request: NextRequest) {
	try {
		const authResult = await authenticateRequest(request);
		if (!authResult) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (!hasRequiredScope(authResult, "stories:write")) {
			return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
		}

		const body = await request.json();
		const validatedData = updateSceneSummarySchema.parse(body);

		const [updatedScene] = await db
			.update(scenes)
			.set({
				summary: validatedData.summary,
				updatedAt: new Date(),
			})
			.where(eq(scenes.id, validatedData.sceneId))
			.returning();

		return NextResponse.json({ success: true, scene: updatedScene }, { status: 200 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: "Invalid input", details: JSON.stringify(error.errors) }, { status: 400 });
		}
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
