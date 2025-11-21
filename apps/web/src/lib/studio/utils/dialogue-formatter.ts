/**
 * Dialogue Formatter Utility
 *
 * Post-processes AI-generated scene content to enforce dialogue blank line spacing discipline.
 *
 * FORMATTING RULES:
 * 1. Dialogue and its attribution tag MUST be on separate lines with a blank line between
 * 2. Action/narrative followed by dialogue MUST have a blank line between
 * 3. No markdown emphasis markers (*word*) - use plain text
 *
 * BEFORE (incorrect):
 * "Just a routine audit," she murmured, the words swallowed by the vastness.
 * Mi-so flinched. "Hae-won, please."
 * "But it's *my* record," Hae-won insisted.
 *
 * AFTER (correct):
 * "Just a routine audit,"
 *
 * she murmured, the words swallowed by the vastness.
 *
 * Mi-so flinched.
 *
 * "Hae-won, please."
 *
 * "But it's my record,"
 *
 * Hae-won insisted.
 *
 * This ensures optimal mobile readability with clear visual separation.
 */

/**
 * Removes markdown emphasis markers from content.
 *
 * Transforms: *word* → word
 * Transforms: **word** → word
 */
export function removeMarkdownEmphasis(content: string): string {
	if (!content) return content;

	// Remove bold (**word**) first, then italic (*word*)
	let formatted = content.replace(/\*\*([^*]+)\*\*/g, "$1");
	formatted = formatted.replace(/\*([^*]+)\*/g, "$1");

	return formatted;
}

/**
 * Separates dialogue from following text with a blank line.
 *
 * Handles ALL cases where dialogue is followed by text on the same line:
 * - "Hello," she said. → dialogue + lowercase attribution
 * - "Hello." She walked. → dialogue + capitalized name/action
 * - "Hello." Hae-won smiled. → dialogue + proper noun
 *
 * Pattern: "dialogue" + space(s) + any word character
 */
export function formatDialogueFollowedByText(content: string): string {
	if (!content) return content;

	// Match dialogue ending with punctuation, followed by space(s) and word character
	// Uses [ \t]+ instead of \s+ to avoid matching across newlines
	const pattern = /("[^"]+[,!?.]")[ \t]+(\w)/g;

	return content.replace(pattern, "$1\n\n$2");
}

/**
 * Separates text/action from following dialogue with a blank line.
 *
 * Handles cases where narrative/action precedes dialogue:
 * - She smiled. "Hello." → action + dialogue
 * - Mi-so flinched. "Please." → action + dialogue
 *
 * Pattern: sentence ending (. ! ?) + space(s) + opening quote
 */
export function formatTextFollowedByDialogue(content: string): string {
	if (!content) return content;

	// Match sentence end followed by space(s) and opening quote
	// Uses [ \t]+ instead of \s+ to avoid matching across newlines
	const pattern = /([.!?])[ \t]+(")/g;

	return content.replace(pattern, "$1\n\n$2");
}

/**
 * Separates attribution tag from following dialogue with a blank line.
 *
 * Handles cases where attribution introduces dialogue mid-sentence:
 * - he continued, "is rarely..." → attribution, "dialogue"
 * - Thorne said softly, "is rarely..." → attribution, "dialogue"
 *
 * Pattern: comma + space(s) + opening quote
 */
export function formatAttributionFollowedByDialogue(content: string): string {
	if (!content) return content;

	// Match comma followed by space(s) and opening quote
	// Uses [ \t]+ instead of \s+ to avoid matching across newlines
	const pattern = /(,)[ \t]+(")/g;

	return content.replace(pattern, "$1\n\n$2");
}

/**
 * Separates dialogue from its attribution tag with a blank line.
 *
 * This is the comprehensive version that handles:
 * 1. Dialogue + attribution (lowercase or "I")
 * 2. Dialogue + any following text (including capitalized names)
 * 3. Action/text + dialogue (sentence end before quote)
 * 4. Attribution + dialogue (comma before quote)
 */
export function formatDialogueSpacing(content: string): string {
	if (!content) return content;

	let formatted = content;

	// Step 1: Dialogue followed by any text on same line
	formatted = formatDialogueFollowedByText(formatted);

	// Step 2: Text/action followed by dialogue on same line (. ! ? before quote)
	formatted = formatTextFollowedByDialogue(formatted);

	// Step 3: Attribution followed by dialogue on same line (, before quote)
	formatted = formatAttributionFollowedByDialogue(formatted);

	// Clean up any triple+ newlines
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

		// Check if current line starts with a quote (dialogue line)
		const isDialogueLine = trimmed.startsWith('"');

		// Check if previous line is non-empty and not blank
		const needsBlankBefore =
			isDialogueLine && prevLine !== "" && prevLine !== undefined;

		// Add blank line before dialogue if needed
		if (
			needsBlankBefore &&
			result.length > 0 &&
			result[result.length - 1] !== ""
		) {
			result.push("");
		}

		result.push(line);
	}

	// Clean up multiple consecutive blank lines
	return result.join("\n").replace(/\n{3,}/g, "\n\n");
}

/**
 * Full dialogue formatting pipeline.
 *
 * 1. Removes markdown emphasis (*word* → word)
 * 2. Separates dialogue from following text
 * 3. Separates text from following dialogue
 * 4. Ensures blank lines around dialogue blocks
 *
 * Use this as the main entry point for dialogue formatting.
 */
export function formatDialogue(content: string): string {
	if (!content) return content;

	// Step 1: Remove markdown emphasis markers
	let formatted = removeMarkdownEmphasis(content);

	// Step 2: Separate dialogue from following text (handles all cases)
	formatted = formatDialogueSpacing(formatted);

	// Step 3: Ensure blank lines around dialogue blocks
	formatted = ensureDialogueBlankLines(formatted);

	return formatted;
}

/**
 * Validates that content follows dialogue spacing discipline.
 *
 * Checks for:
 * 1. Dialogue followed by text on same line
 * 2. Text followed by dialogue on same line
 * 3. Markdown emphasis markers
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

	// Check for dialogue followed by text on same line (space/tab, not newline)
	const dialogueFollowedByText = /("[^"]+[,!?.]")[ \t]+(\w)/g;
	let match: RegExpExecArray | null;

	while ((match = dialogueFollowedByText.exec(content)) !== null) {
		const preview = match[0].substring(0, 60);
		violations.push(`Dialogue followed by text: "${preview}..."`);
	}

	// Check for text followed by dialogue on same line
	const textFollowedByDialogue = /([.!?])[ \t]+(")/g;

	while ((match = textFollowedByDialogue.exec(content)) !== null) {
		const start = Math.max(0, match.index - 15);
		const end = Math.min(content.length, match.index + 25);
		const context = content.substring(start, end).replace(/\n/g, " ");
		violations.push(`Text followed by dialogue: "...${context}..."`);
	}

	// Check for attribution followed by dialogue on same line (, before quote)
	const attributionFollowedByDialogue = /(,)[ \t]+(")/g;

	while ((match = attributionFollowedByDialogue.exec(content)) !== null) {
		const start = Math.max(0, match.index - 20);
		const end = Math.min(content.length, match.index + 30);
		const context = content.substring(start, end).replace(/\n/g, " ");
		violations.push(`Attribution followed by dialogue: "...${context}..."`);
	}

	// Check for markdown emphasis (*word*)
	const markdownEmphasis = /\*[^*\n]+\*/g;

	while ((match = markdownEmphasis.exec(content)) !== null) {
		violations.push(`Markdown emphasis found: "${match[0]}"`);
	}

	return {
		isValid: violations.length === 0,
		violations,
	};
}
