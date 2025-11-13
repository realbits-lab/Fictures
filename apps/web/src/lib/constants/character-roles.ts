/**
 * Character Role Constants
 *
 * Single source of truth for character roles in story hierarchy.
 * Defines the narrative significance and priority of each character.
 *
 * Based on the Adversity-Triumph Engine's character hierarchy framework.
 */

/**
 * Character Role Enum
 * Use CHARACTER_ROLE.PROTAGONIST, CHARACTER_ROLE.DEUTERAGONIST, etc. in code
 */
export const CHARACTER_ROLE = {
	PROTAGONIST: "protagonist",
	DEUTERAGONIST: "deuteragonist",
	TRITAGONIST: "tritagonist",
	ANTAGONIST: "antagonist",
	SUPPORTING: "supporting",
} as const;

/**
 * Array of all valid character role values
 * Use for iteration, validation, and database enum definition
 */
export const CHARACTER_ROLES = Object.values(CHARACTER_ROLE);

/**
 * Type for character roles
 */
export type CharacterRole =
	(typeof CHARACTER_ROLE)[keyof typeof CHARACTER_ROLE];

/**
 * Character role metadata for UI components and generation guidance
 */
export const CHARACTER_ROLE_METADATA: Record<
	CharacterRole,
	{
		label: string;
		description: string;
		narrativeSignificance: string;
		typicalCount: string;
	}
> = {
	[CHARACTER_ROLE.PROTAGONIST]: {
		label: "Protagonist",
		description: "The main character whose journey drives the primary narrative",
		narrativeSignificance:
			"Carries the central moral arc and undergoes the most significant transformation",
		typicalCount: "1 per story",
	},
	[CHARACTER_ROLE.DEUTERAGONIST]: {
		label: "Deuteragonist",
		description: "The second most important character, supporting the protagonist",
		narrativeSignificance:
			"Provides contrast, support, or alternative perspective to protagonist's journey",
		typicalCount: "0-1 per story",
	},
	[CHARACTER_ROLE.TRITAGONIST]: {
		label: "Tritagonist",
		description: "The third most important character in the narrative",
		narrativeSignificance:
			"Adds complexity and depth to the story through their own subplot",
		typicalCount: "0-1 per story",
	},
	[CHARACTER_ROLE.ANTAGONIST]: {
		label: "Antagonist",
		description:
			"The character who opposes the protagonist, creating conflict",
		narrativeSignificance:
			"Forces protagonist to confront their flaws and make difficult moral choices",
		typicalCount: "1-2 per story",
	},
	[CHARACTER_ROLE.SUPPORTING]: {
		label: "Supporting",
		description:
			"Characters who support the narrative without carrying major arcs",
		narrativeSignificance:
			"Provides context, assistance, obstacles, or world-building",
		typicalCount: "Variable",
	},
};

/**
 * Get character role metadata by name
 */
export function getCharacterRoleMetadata(role: string) {
	return (
		CHARACTER_ROLE_METADATA[role as CharacterRole] || {
			label: "Unknown",
			description: "Character role",
			narrativeSignificance: "Contributes to story",
			typicalCount: "Variable",
		}
	);
}

/**
 * Validate if a string is a valid character role
 */
export function isValidCharacterRole(role: string): role is CharacterRole {
	return CHARACTER_ROLES.includes(role as CharacterRole);
}

/**
 * Get character role label for display
 */
export function getCharacterRoleLabel(role: string): string {
	const metadata = getCharacterRoleMetadata(role);
	return metadata.label;
}
