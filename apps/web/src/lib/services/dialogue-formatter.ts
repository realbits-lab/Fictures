/**
 * Dialogue Formatter Service
 * Applies rule-based formatting to ensure proper dialogue isolation
 */

/**
 * Apply dialogue formatting rules to text
 *
 * Rules:
 * 1. If character before starting quote is not a newline, add two newlines
 * 2. If character before starting quote is one newline and the character before that is not a newline, add one newline
 * 3. Apply same rules to ending quotes
 *
 * @param text - The text to format
 * @returns The formatted text with proper dialogue isolation
 */
export function formatDialogue(text: string): string {
    if (!text) return text;

    let result = "";
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
        const char = text[i];
        const isQuote = char === '"' || char === '"' || char === '"';

        if (isQuote) {
            if (!inQuotes) {
                // Starting quote - apply rules for spacing before
                const lastChar =
                    result.length > 0 ? result[result.length - 1] : "";
                const secondLastChar =
                    result.length > 1 ? result[result.length - 2] : "";

                if (lastChar !== "\n") {
                    // No newline before quote, add two
                    result += "\n\n";
                } else if (secondLastChar !== "\n") {
                    // One newline before quote, add one more
                    result += "\n";
                }
                // If already two or more newlines, don't add more

                result += char;
                inQuotes = true;
            } else {
                // Ending quote
                result += char;

                // Add two newlines after ending quote
                // Check what's coming next to avoid excessive spacing
                if (i < text.length - 1) {
                    const nextChar = text[i + 1];
                    const nextNextChar = i < text.length - 2 ? text[i + 2] : "";

                    if (nextChar === "\n" && nextNextChar === "\n") {
                        // Already has two newlines coming, don't add more
                    } else if (nextChar === "\n") {
                        // Has one newline, add one more
                        result += "\n";
                    } else {
                        // No newlines, add two
                        result += "\n\n";
                    }
                }

                inQuotes = false;
            }
        } else {
            result += char;
        }

        i++;
    }

    return result;
}

/**
 * Split text into dialogue and narrative segments for better formatting
 */
function splitDialogueAndNarrative(text: string): string[] {
    const segments: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const isQuote = char === '"' || char === '"' || char === '"';

        if (isQuote) {
            if (!inQuotes) {
                // Starting quote
                if (current.trim()) {
                    segments.push(current.trim());
                }
                current = char;
                inQuotes = true;
            } else {
                // Ending quote
                current += char;
                segments.push(current.trim());
                current = "";
                inQuotes = false;
            }
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        segments.push(current.trim());
    }

    return segments;
}

/**
 * Enhanced dialogue formatter that handles more complex cases
 * @param text - The text to format
 * @returns The formatted text
 */
export function formatDialogueEnhanced(text: string): string {
    if (!text) return text;

    const lines = text.split("\n");
    const formattedLines: string[] = [];
    let lastWasDialogue = false;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
            formattedLines.push("");
            lastWasDialogue = false;
            continue;
        }

        // Check if line contains dialogue
        const hasDialogue = /[""]/.test(trimmedLine);

        if (hasDialogue) {
            // Check if it's pure dialogue or mixed with narrative
            const segments = splitDialogueAndNarrative(trimmedLine);

            for (const segment of segments) {
                const isDialogueSegment = /^[""]/.test(segment);

                // Add blank line before if needed
                if (
                    formattedLines.length > 0 &&
                    formattedLines[formattedLines.length - 1] !== ""
                ) {
                    formattedLines.push("");
                }

                formattedLines.push(segment);
                lastWasDialogue = isDialogueSegment;
            }
        } else {
            // Pure narrative line
            if (
                lastWasDialogue &&
                formattedLines.length > 0 &&
                formattedLines[formattedLines.length - 1] !== ""
            ) {
                formattedLines.push("");
            }
            formattedLines.push(trimmedLine);
            lastWasDialogue = false;
        }
    }

    // Join and clean up
    let result = formattedLines.join("\n");

    // Remove excessive blank lines (more than 2 consecutive)
    result = result.replace(/\n{4,}/g, "\n\n\n");

    // Ensure single newline at end
    result = result.trimEnd() + "\n";

    return result;
}

/**
 * Validate if text follows dialogue formatting rules
 * @param text - The text to validate
 * @returns Object with validation result and any issues found
 */
export function validateDialogueFormatting(text: string): {
    isValid: boolean;
    issues: string[];
    fixedText?: string;
} {
    const issues: string[] = [];
    const lines = text.split("\n");
    let needsFixing = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Check if line contains dialogue
        const hasDialogue = /[""]/.test(line);

        if (hasDialogue) {
            // Check for proper isolation

            // Check blank line before (unless it's the first line)
            if (i > 0) {
                const prevLine = lines[i - 1];
                if (prevLine.trim() !== "") {
                    issues.push(
                        `Line ${i + 1}: Dialogue not isolated with blank line before`,
                    );
                    needsFixing = true;
                }
            }

            // Check blank line after (unless it's the last line)
            if (i < lines.length - 1) {
                const nextLine = lines[i + 1];
                if (nextLine.trim() !== "") {
                    issues.push(
                        `Line ${i + 1}: Dialogue not isolated with blank line after`,
                    );
                    needsFixing = true;
                }
            }

            // Check for multiple dialogue sentences in one line
            const dialogueMatches = line.match(
                /[""][^"""]*[""](?:\s*[""][^"""]*[""])+/,
            );
            if (dialogueMatches) {
                issues.push(
                    `Line ${i + 1}: Multiple dialogue sentences in single paragraph`,
                );
                needsFixing = true;
            }

            // Check for narrative mixed with dialogue
            const segments = splitDialogueAndNarrative(line);
            if (segments.length > 1) {
                issues.push(
                    `Line ${i + 1}: Dialogue mixed with narrative text`,
                );
                needsFixing = true;
            }
        }
    }

    return {
        isValid: issues.length === 0,
        issues,
        fixedText: needsFixing ? formatDialogueEnhanced(text) : undefined,
    };
}

/**
 * Format a scene's content to ensure proper dialogue formatting
 * @param content - The scene content to format
 * @returns The formatted content
 */
export function formatSceneContent(content: string): string {
    if (!content) return content;

    // Apply enhanced formatting
    let formatted = formatDialogueEnhanced(content);

    // Validate and fix any remaining issues
    const validation = validateDialogueFormatting(formatted);
    if (!validation.isValid && validation.fixedText) {
        formatted = validation.fixedText;
    }

    return formatted;
}
