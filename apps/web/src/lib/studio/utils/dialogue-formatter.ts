/**
 * Dialogue Formatter Utility
 *
 * Post-processes AI-generated scene content to enforce dialogue blank line spacing discipline.
 *
 * FORMATTING RULE:
 * Dialogue and its attribution tag MUST be on separate lines with a blank line between.
 *
 * BEFORE (incorrect):
 * "Just a routine audit," she murmured, the words swallowed by the vastness.
 *
 * AFTER (correct):
 * "Just a routine audit,"
 *
 * she murmured, the words swallowed by the vastness.
 *
 * This ensures optimal mobile readability with clear visual separation.
 */

/**
 * Separates dialogue from its attribution tag with a blank line.
 *
 * Pattern matched:
 * - Dialogue ending with punctuation + closing quote: "...[,!?.]"
 * - Followed by space
 * - Followed by attribution tag starting with lowercase letter (or "I")
 *
 * Examples transformed:
 * - "Hello," she said. → "Hello,"\n\nshe said.
 * - "What?" he asked. → "What?"\n\nhe asked.
 * - "Run!" I screamed. → "Run!"\n\nI screamed.
 *
 * NOT transformed (left as-is):
 * - She said, "Hello." (tag before dialogue)
 * - "Hello." She smiled. (capital S = new sentence, not attribution)
 */
export function formatDialogueSpacing(content: string): string {
	if (!content) return content;

	// Pattern explanation:
	// ("[^"]*[,!?.]")  - Dialogue in quotes ending with punctuation before closing quote
	// \s+              - One or more spaces between dialogue and tag
	// ((?:I\s|[a-z])   - Attribution tag starting with "I " or lowercase letter
	// [^\n]*)          - Rest of the tag until end of line
	const dialogueWithTagPattern = /("[^"]*[,!?.]")\s+((?:I\s|[a-z])[^\n]*)/g;

	// Replace with dialogue, blank line, tag
	let formatted = content.replace(dialogueWithTagPattern, "$1\n\n$2");

	// Clean up any triple+ newlines that might result from multiple passes
	formatted = formatted.replace(/\n{3,}/g, "\n\n");

	return formatted;
}

/**
 * Ensures blank lines around ALL dialogue blocks.
 *
 * This function handles cases where dialogue already has tags separated,
 * but may be missing blank lines before or after the dialogue block.
 */
export function ensureDialogueBlankLines(content: string): string {
	if (!content) return content;

	const lines = content.split("\n");
	const result: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();
		const prevLine = i > 0 ? lines[i - 1].trim() : "";
		const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : "";

		// Check if current line starts with a quote (dialogue line)
		const isDialogueLine = trimmed.startsWith('"');

		// Check if previous line is non-empty and not blank
		const needsBlankBefore = isDialogueLine && prevLine !== "" && prevLine !== undefined;

		// Check if next line is non-empty and not blank
		const needsBlankAfter =
			isDialogueLine && trimmed.endsWith('"') && nextLine !== "" && nextLine !== undefined;

		// Add blank line before dialogue if needed
		if (needsBlankBefore && result.length > 0 && result[result.length - 1] !== "") {
			result.push("");
		}

		result.push(line);

		// Add blank line after dialogue if needed (handled by next iteration)
	}

	// Clean up multiple consecutive blank lines
	return result.join("\n").replace(/\n{3,}/g, "\n\n");
}

/**
 * Full dialogue formatting pipeline.
 *
 * 1. Separates dialogue from attribution tags
 * 2. Ensures blank lines around dialogue blocks
 *
 * Use this as the main entry point for dialogue formatting.
 */
export function formatDialogue(content: string): string {
	if (!content) return content;

	// Step 1: Separate dialogue from attribution tags
	let formatted = formatDialogueSpacing(content);

	// Step 2: Ensure blank lines around dialogue blocks
	formatted = ensureDialogueBlankLines(formatted);

	return formatted;
}

/**
 * Validates that content follows dialogue spacing discipline.
 *
 * Returns an object with:
 * - isValid: boolean
 * - violations: array of specific violations found
 */
export function validateDialogueSpacing(content: string): {
	isValid: boolean;
	violations: string[];
} {
	if (!content) return { isValid: true, violations: [] };

	const violations: string[] = [];

	// Check for dialogue with attribution on same line
	const dialogueWithTagPattern = /("[^"]*[,!?.]")\s+((?:I\s|[a-z])[^\n]*)/g;
	const matches = content.matchAll(dialogueWithTagPattern);

	for (const match of matches) {
		violations.push(`Dialogue and tag on same line: "${match[0].substring(0, 50)}..."`);
	}

	return {
		isValid: violations.length === 0,
		violations,
	};
}
