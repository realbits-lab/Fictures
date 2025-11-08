/**
 * Novel Generation Constants
 *
 * Centralized configuration for novel generation constraints and defaults.
 * Used across UI components, API routes, and orchestrator for consistency.
 *
 * Based on Adversity-Triumph Engine specifications.
 */

/**
 * Novel generation constraints
 *
 * MIN: Absolute minimum for functional story (fastest generation)
 * DEFAULT: Recommended default for balanced quality/speed
 * MAX: Maximum allowed for optimal narrative quality
 */
export const NOVEL_GENERATION_CONSTRAINTS = {
	/**
	 * Character counts
	 * - MIN: 2 (minimum for story dynamics and interactions)
	 * - DEFAULT: 2 (optimized for fast generation)
	 * - MAX: 4 (maximum main characters per specification)
	 */
	CHARACTER: {
		MIN: 2,
		DEFAULT: 2,
		MAX: 4,
	},

	/**
	 * Setting counts
	 * - MIN: 2 (minimum for location variety)
	 * - DEFAULT: 2 (optimized for fast generation)
	 * - MAX: 6 (maximum settings per specification)
	 */
	SETTING: {
		MIN: 2,
		DEFAULT: 2,
		MAX: 6,
	},

	/**
	 * Parts (Acts) counts
	 * - MIN: 1 (single act = shortest story structure)
	 * - DEFAULT: 1 (fastest generation)
	 * - MAX: 3 (three-act structure)
	 */
	PARTS: {
		MIN: 1,
		DEFAULT: 1,
		MAX: 3,
	},

	/**
	 * Chapters per part
	 * - MIN: 1 (minimum micro-cycle)
	 * - DEFAULT: 1 (fastest generation)
	 * - MAX: 4 (typical range per specification: 2-4)
	 */
	CHAPTERS_PER_PART: {
		MIN: 1,
		DEFAULT: 1,
		MAX: 4,
	},

	/**
	 * Scenes per chapter
	 * - MIN: 3 (minimum for adversity-triumph cycle)
	 * - DEFAULT: 3 (fastest complete cycle)
	 * - MAX: 7 (typical range per specification: 3-7)
	 */
	SCENES_PER_CHAPTER: {
		MIN: 3,
		DEFAULT: 3,
		MAX: 7,
	},
} as const;

/**
 * Helper to validate generation options
 */
export function validateGenerationConstraints(options: {
	characterCount?: number;
	settingCount?: number;
	partsCount?: number;
	chaptersPerPart?: number;
	scenesPerChapter?: number;
}): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (options.characterCount !== undefined) {
		if (options.characterCount < NOVEL_GENERATION_CONSTRAINTS.CHARACTER.MIN) {
			errors.push(
				`Character count must be at least ${NOVEL_GENERATION_CONSTRAINTS.CHARACTER.MIN}`,
			);
		}
		if (options.characterCount > NOVEL_GENERATION_CONSTRAINTS.CHARACTER.MAX) {
			errors.push(
				`Character count must not exceed ${NOVEL_GENERATION_CONSTRAINTS.CHARACTER.MAX}`,
			);
		}
	}

	if (options.settingCount !== undefined) {
		if (options.settingCount < NOVEL_GENERATION_CONSTRAINTS.SETTING.MIN) {
			errors.push(
				`Setting count must be at least ${NOVEL_GENERATION_CONSTRAINTS.SETTING.MIN}`,
			);
		}
		if (options.settingCount > NOVEL_GENERATION_CONSTRAINTS.SETTING.MAX) {
			errors.push(
				`Setting count must not exceed ${NOVEL_GENERATION_CONSTRAINTS.SETTING.MAX}`,
			);
		}
	}

	if (options.partsCount !== undefined) {
		if (options.partsCount < NOVEL_GENERATION_CONSTRAINTS.PARTS.MIN) {
			errors.push(
				`Parts count must be at least ${NOVEL_GENERATION_CONSTRAINTS.PARTS.MIN}`,
			);
		}
		if (options.partsCount > NOVEL_GENERATION_CONSTRAINTS.PARTS.MAX) {
			errors.push(
				`Parts count must not exceed ${NOVEL_GENERATION_CONSTRAINTS.PARTS.MAX}`,
			);
		}
	}

	if (options.chaptersPerPart !== undefined) {
		if (
			options.chaptersPerPart <
			NOVEL_GENERATION_CONSTRAINTS.CHAPTERS_PER_PART.MIN
		) {
			errors.push(
				`Chapters per part must be at least ${NOVEL_GENERATION_CONSTRAINTS.CHAPTERS_PER_PART.MIN}`,
			);
		}
		if (
			options.chaptersPerPart >
			NOVEL_GENERATION_CONSTRAINTS.CHAPTERS_PER_PART.MAX
		) {
			errors.push(
				`Chapters per part must not exceed ${NOVEL_GENERATION_CONSTRAINTS.CHAPTERS_PER_PART.MAX}`,
			);
		}
	}

	if (options.scenesPerChapter !== undefined) {
		if (
			options.scenesPerChapter <
			NOVEL_GENERATION_CONSTRAINTS.SCENES_PER_CHAPTER.MIN
		) {
			errors.push(
				`Scenes per chapter must be at least ${NOVEL_GENERATION_CONSTRAINTS.SCENES_PER_CHAPTER.MIN}`,
			);
		}
		if (
			options.scenesPerChapter >
			NOVEL_GENERATION_CONSTRAINTS.SCENES_PER_CHAPTER.MAX
		) {
			errors.push(
				`Scenes per chapter must not exceed ${NOVEL_GENERATION_CONSTRAINTS.SCENES_PER_CHAPTER.MAX}`,
			);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Helper to apply defaults to generation options
 */
export function applyGenerationDefaults(options: {
	characterCount?: number;
	settingCount?: number;
	partsCount?: number;
	chaptersPerPart?: number;
	scenesPerChapter?: number;
}): {
	characterCount: number;
	settingCount: number;
	partsCount: number;
	chaptersPerPart: number;
	scenesPerChapter: number;
} {
	return {
		characterCount:
			options.characterCount ?? NOVEL_GENERATION_CONSTRAINTS.CHARACTER.DEFAULT,
		settingCount:
			options.settingCount ?? NOVEL_GENERATION_CONSTRAINTS.SETTING.DEFAULT,
		partsCount:
			options.partsCount ?? NOVEL_GENERATION_CONSTRAINTS.PARTS.DEFAULT,
		chaptersPerPart:
			options.chaptersPerPart ??
			NOVEL_GENERATION_CONSTRAINTS.CHAPTERS_PER_PART.DEFAULT,
		scenesPerChapter:
			options.scenesPerChapter ??
			NOVEL_GENERATION_CONSTRAINTS.SCENES_PER_CHAPTER.DEFAULT,
	};
}
