import { type NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/studio/generators/images-generator";

/**
 * Test API: Generate Image (No Vercel Blob Upload)
 *
 * Generates images using AI providers without uploading to Vercel Blob.
 * Returns base64-encoded image data for local saving.
 *
 * Authentication: Required (writer API key)
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized - API key required" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { prompt, aspectRatio = "16:9", seed } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: "prompt is required" },
                { status: 400 },
            );
        }

        console.log(
            "[TEST-IMAGE-GEN] Generating image without Vercel Blob upload",
        );
        console.log("[TEST-IMAGE-GEN] Prompt:", prompt.substring(0, 100));
        console.log("[TEST-IMAGE-GEN] Aspect Ratio:", aspectRatio);

        // Generate image using AI provider
        const result = await generateImage({
            prompt,
            aspectRatio: aspectRatio as any,
            seed,
            imageType: "story",
        });

        console.log("[TEST-IMAGE-GEN] Image generated successfully");
        console.log("[TEST-IMAGE-GEN] Provider:", result.provider);
        console.log("[TEST-IMAGE-GEN] Model:", result.model);
        console.log(
            "[TEST-IMAGE-GEN] Dimensions:",
            `${result.width}×${result.height}`,
        );

        // Return image data
        return NextResponse.json({
            success: true,
            imageUrl: result.imageUrl, // This will be a data URL or temporary URL from AI server
            width: result.width,
            height: result.height,
            provider: result.provider,
            model: result.model,
            aspectRatio,
        });
    } catch (error) {
        console.error("[TEST-IMAGE-GEN] Error:", error);
        return NextResponse.json(
            {
                error: "Failed to generate image",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
