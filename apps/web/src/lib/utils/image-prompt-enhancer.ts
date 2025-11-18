/**
 * Image Prompt Enhancer
 *
 * Adds genre-specific style patterns to image generation prompts.
 * Based on Cycle 4 iteration testing results which showed +0.05 weighted score
 * improvement with genre-specific prompt patterns.
 *
 * @see results/5-cycle-iteration/FINAL-ITERATION-REPORT.md
 */

/**
 * Genre-specific visual style patterns
 *
 * These patterns were tested in Cycle 4 of iteration testing and showed
 * the best improvement in image quality scores.
 */
const GENRE_STYLE_PATTERNS: Record<string, string> = {
    // Primary genres with tested patterns
    Fantasy: "epic fantasy art style, detailed environment, magical atmosphere",
    Action: "dynamic action scene, motion blur, high energy, dramatic composition",
    Slice: "intimate realistic style, natural lighting, emotional depth",

    // Extended genres with appropriate visual styles
    Romance:
        "romantic atmosphere, soft lighting, emotional intimacy, beautiful composition",
    SciFi: "futuristic sci-fi style, advanced technology, sleek design, atmospheric lighting",
    Mystery:
        "noir atmosphere, dramatic shadows, moody lighting, suspenseful composition",
    Horror: "dark horror aesthetic, ominous atmosphere, dramatic contrast, unsettling composition",
    Isekai: "vibrant fantasy world, otherworldly atmosphere, detailed environment, magical elements",
    LitRPG: "game-inspired aesthetic, interface elements, fantasy RPG style, detailed characters",
    Cultivation:
        "martial arts epic style, spiritual energy effects, dynamic poses, Asian-inspired aesthetics",
    Paranormal:
        "supernatural atmosphere, ethereal lighting, mystical elements, dark romance aesthetic",
    Dystopian:
        "post-apocalyptic style, gritty atmosphere, muted colors, industrial decay",
    Historical:
        "period-accurate style, classical composition, historical authenticity, rich details",
    LGBTQ: "vibrant colors, authentic emotion, intimate moments, beautiful composition",
};

/**
 * Image type specific quality modifiers
 */
const IMAGE_TYPE_MODIFIERS: Record<string, string> = {
    story: "cinematic composition, professional illustration, high detail",
    character:
        "detailed character portrait, expressive features, professional quality",
    setting: "atmospheric environment, rich details, immersive setting",
    scene: "dynamic composition, storytelling clarity, emotional impact",
    "comic-panel":
        "webtoon style, clean linework, vibrant colors, professional comic art",
};

/**
 * Enhance an image generation prompt with genre-specific style patterns
 *
 * @param prompt - Original prompt
 * @param genre - Story genre (optional)
 * @param imageType - Type of image being generated (optional)
 * @returns Enhanced prompt with genre-specific patterns
 */
export function enhanceImagePrompt(
    prompt: string,
    genre?: string,
    imageType?: string,
): string {
    const enhancements: string[] = [];

    // 1. Add genre-specific style pattern
    if (genre && GENRE_STYLE_PATTERNS[genre]) {
        enhancements.push(GENRE_STYLE_PATTERNS[genre]);
    }

    // 2. Add image type specific modifiers
    if (imageType && IMAGE_TYPE_MODIFIERS[imageType]) {
        enhancements.push(IMAGE_TYPE_MODIFIERS[imageType]);
    }

    // If no enhancements, return original prompt
    if (enhancements.length === 0) {
        return prompt;
    }

    // Combine original prompt with enhancements
    // Format: {original prompt}, {genre style}, {type modifier}
    return `${prompt}, ${enhancements.join(", ")}`;
}

/**
 * Get genre style pattern for a specific genre
 *
 * @param genre - Story genre
 * @returns Genre-specific style pattern or undefined
 */
export function getGenreStylePattern(genre: string): string | undefined {
    return GENRE_STYLE_PATTERNS[genre];
}

/**
 * Check if a genre has a defined style pattern
 *
 * @param genre - Story genre to check
 * @returns True if genre has a style pattern
 */
export function hasGenreStylePattern(genre: string): boolean {
    return genre in GENRE_STYLE_PATTERNS;
}

/**
 * Get all available genre style patterns
 *
 * @returns Record of all genre style patterns
 */
export function getAllGenreStylePatterns(): Record<string, string> {
    return { ...GENRE_STYLE_PATTERNS };
}
