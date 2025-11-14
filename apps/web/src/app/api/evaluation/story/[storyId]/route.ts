/**
 * Story Evaluation Retrieval API
 * GET /api/evaluation/story/[storyId] - Retrieve latest story evaluation
 */

import { NextResponse } from "next/server";
import { createErrorResponse } from "../../utils";

export async function GET(
    _request: Request,
    { params }: { params: { storyId: string } },
) {
    try {
        const { storyId: _storyId } = params;

        // TODO: Implement database query to fetch latest evaluation
        // For now, return a placeholder response

        return NextResponse.json(
            createErrorResponse(
                "SERVICE_ERROR",
                "Evaluation retrieval not yet implemented. Use POST /api/evaluation/story to create new evaluation.",
            ),
            { status: 501 },
        );
    } catch (error) {
        console.error("Story evaluation retrieval error:", error);
        return NextResponse.json(
            createErrorResponse(
                "SERVICE_ERROR",
                "Failed to retrieve story evaluation",
                error instanceof Error ? error.message : String(error),
            ),
            { status: 500 },
        );
    }
}
