import { type NextRequest, NextResponse } from "next/server";
import { generateCharacters } from "@/lib/studio/generators";
import type { StorySummaryResult } from "@/lib/studio/generators/ai-types";

export async function POST(request: NextRequest) {
    try {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("👥 [CHARACTERS API] Request received");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        const body = (await request.json()) as {
            storySummary: StorySummaryResult;
        };
        const { storySummary } = body;

        console.log("[CHARACTERS API] Request summary:", {
            hasStorySummary: !!storySummary,
            genre: storySummary?.genre,
            tone: storySummary?.tone,
            characterCount: storySummary?.characters?.length || 0,
            characterNames:
                storySummary?.characters?.map((c) => c.name).join(", ") ||
                "(none)",
        });

        if (
            !storySummary ||
            !storySummary.characters ||
            storySummary.characters.length < 2
        ) {
            console.error("❌ [CHARACTERS API] Validation failed:", {
                hasStorySummary: !!storySummary,
                hasCharacters: !!storySummary?.characters,
                characterCount: storySummary?.characters?.length || 0,
            });
            return NextResponse.json(
                {
                    error: "Valid story summary with at least 2 characters is required",
                },
                { status: 400 },
            );
        }

        console.log("✅ [CHARACTERS API] Validation passed");
        console.log("[CHARACTERS API] 🤖 Calling character generator...");

        // Use the common generator (does NOT save to database)
        const generationResult = await generateCharacters({
            story: storySummary,
            characterCount: storySummary.characters.length,
            language: "English",
        });

        console.log("[CHARACTERS API] ✅ Character generation completed");
        console.log("[CHARACTERS API] Result summary:", {
            count: generationResult.characters.length,
            expectedCount: storySummary.characters.length,
            characterNames: generationResult.characters
                .map((c) => c.name)
                .join(", "),
            generationTime: generationResult.metadata.generationTime,
        });

        console.log(
            "✅ [CHARACTERS API] All validations passed, returning result",
        );
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // Return just the characters array (maintain API contract)
        return NextResponse.json(generationResult.characters);
    } catch (error) {
        console.error("Character generation error:", error);
        return NextResponse.json(
            {
                error: "Failed to generate characters",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
