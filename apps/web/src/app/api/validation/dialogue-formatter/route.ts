import { type NextRequest, NextResponse } from "next/server";
import {
	formatSceneContent,
	validateDialogueFormatting,
} from "@/lib/services/dialogue-formatter";

export async function POST(request: NextRequest) {
	try {
		const { content, action = "format" } = await request.json();

		if (!content) {
			return NextResponse.json(
				{ error: "Content is required" },
				{ status: 400 },
			);
		}

		if (action === "validate") {
			// Validate the content
			const validation = validateDialogueFormatting(content);
			return NextResponse.json(validation);
		} else if (action === "format") {
			// Format the content
			const formattedContent = formatSceneContent(content);
			const validation = validateDialogueFormatting(formattedContent);

			return NextResponse.json({
				content: formattedContent,
				validation,
				changes: {
					originalLength: content.length,
					formattedLength: formattedContent.length,
					wasModified: content !== formattedContent,
				},
			});
		} else {
			return NextResponse.json(
				{ error: 'Invalid action. Use "format" or "validate"' },
				{ status: 400 },
			);
		}
	} catch (error) {
		console.error("Error in dialogue formatter:", error);
		return NextResponse.json(
			{ error: "Failed to process content" },
			{ status: 500 },
		);
	}
}
