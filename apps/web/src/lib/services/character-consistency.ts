/**
 * Character Consistency Service
 *
 * Manages character visual profiles to ensure consistent appearance
 * across all comic panels, working within DALL-E 3's constraints
 * (no reference image support).
 */

import type { characters as charactersTable } from "@/lib/schemas/database";

// ============================================
// CHARACTER VISUAL CACHE
// ============================================

interface CharacterVisualProfile {
    character_id: string;
    base_prompt: string;
    last_generated: Date;
}

const characterVisualCache: Map<string, CharacterVisualProfile> = new Map();

// ============================================
// CHARACTER PROMPT BUILDING
// ============================================

/**
 * Build a consistent character description fragment for image prompts
 */
export function buildCharacterPromptFragment(
    character: typeof charactersTable.$inferSelect,
    pose: string,
): string {
    const cacheKey = character.id;

    // Check cache first
    if (!characterVisualCache.has(cacheKey)) {
        const basePrompt = createCharacterBasePrompt(character);
        characterVisualCache.set(cacheKey, {
            character_id: character.id,
            base_prompt: basePrompt,
            last_generated: new Date(),
        });
    }

    const cachedProfile = characterVisualCache.get(cacheKey)!;
    return `${cachedProfile.base_prompt}: ${pose}`;
}

/**
 * Create a detailed base prompt for a character
 */
function createCharacterBasePrompt(
    character: typeof charactersTable.$inferSelect,
): string {
    const physicalDesc = character.physicalDescription as any;

    // Build detailed physical description
    const parts: string[] = [character.name];

    // Age and gender
    if (physicalDesc?.age) parts.push(`${physicalDesc.age} years old`);
    if (physicalDesc?.gender) parts.push(physicalDesc.gender);

    // Body characteristics
    if (physicalDesc?.height) parts.push(physicalDesc.height);
    if (physicalDesc?.build) parts.push(`${physicalDesc.build} build`);

    // Facial features
    const facialFeatures: string[] = [];
    if (physicalDesc?.hair_color)
        facialFeatures.push(`${physicalDesc.hair_color} hair`);
    if (physicalDesc?.hair_style) facialFeatures.push(physicalDesc.hair_style);
    if (physicalDesc?.eye_color)
        facialFeatures.push(`${physicalDesc.eye_color} eyes`);
    if (physicalDesc?.skin_tone)
        facialFeatures.push(`${physicalDesc.skin_tone} skin tone`);

    if (facialFeatures.length > 0) {
        parts.push(facialFeatures.join(", "));
    }

    // Clothing
    if (physicalDesc?.typical_attire) {
        parts.push(`wearing ${physicalDesc.typical_attire}`);
    }

    // Distinguishing features
    if (physicalDesc?.distinguishing_features) {
        parts.push(physicalDesc.distinguishing_features);
    }

    // If physical description is missing, use fallback
    if (!physicalDesc) {
        parts.push("adult character");
        if (character.role) parts.push(`${character.role}`);
    }

    return parts.join(", ");
}

/**
 * Build multiple character descriptions for a panel
 */
export function buildPanelCharacterPrompts(
    characterIds: string[],
    characters: (typeof charactersTable.$inferSelect)[],
    characterPoses: Record<string, string>,
): string {
    const characterPrompts = characterIds
        .map((charId) => {
            const character = characters.find((c) => c.id === charId);
            if (!character) return "";

            const pose = characterPoses[charId] || "standing naturally";
            return buildCharacterPromptFragment(character, pose);
        })
        .filter(Boolean);

    return characterPrompts.join(". ");
}

/**
 * Clear character cache (useful for testing or when character designs change)
 */
export function clearCharacterCache(): void {
    characterVisualCache.clear();
    console.log("Character visual cache cleared");
}

/**
 * Get cached character count
 */
export function getCachedCharacterCount(): number {
    return characterVisualCache.size;
}

/**
 * Get character from cache
 */
export function getCharacterFromCache(
    characterId: string,
): CharacterVisualProfile | undefined {
    return characterVisualCache.get(characterId);
}

/**
 * Extract key physical traits for emphasis in prompts
 */
export function extractKeyPhysicalTraits(
    character: typeof charactersTable.$inferSelect,
): string[] {
    const physicalDesc = character.physicalDescription as any;
    const traits: string[] = [];

    if (!physicalDesc) return traits;

    // Most distinctive features
    if (physicalDesc.hair_color && physicalDesc.hair_style) {
        traits.push(
            `${physicalDesc.hair_color} ${physicalDesc.hair_style} hair`,
        );
    } else if (physicalDesc.hair_color) {
        traits.push(`${physicalDesc.hair_color} hair`);
    }

    if (physicalDesc.eye_color) {
        traits.push(`${physicalDesc.eye_color} eyes`);
    }

    if (physicalDesc.distinguishing_features) {
        traits.push(physicalDesc.distinguishing_features);
    }

    if (physicalDesc.typical_attire) {
        traits.push(physicalDesc.typical_attire);
    }

    return traits;
}
