/**
 * Global Genre Constants
 *
 * Single source of truth for all story genres across the application.
 * Use these constants for:
 * - AI story generation (ensures valid genre selection)
 * - UI dropdowns and filters
 * - Database validation
 * - Genre display components
 *
 * Optimized for web novel and webtoon audiences with modern subgenres.
 */

/**
 * Story Genre Enum
 * Use GENRE.FANTASY, GENRE.ROMANCE, etc. in code
 */
export const GENRE = {
    FANTASY: "Fantasy",
    ROMANCE: "Romance",
    SCIFI: "SciFi",
    MYSTERY: "Mystery",
    HORROR: "Horror",
    ACTION: "Action",
    ISEKAI: "Isekai",
    LITRPG: "LitRPG",
    CULTIVATION: "Cultivation",
    SLICE: "Slice",
    PARANORMAL: "Paranormal",
    DYSTOPIAN: "Dystopian",
    HISTORICAL: "Historical",
    LGBTQ: "LGBTQ",
} as const;

/**
 * Array of all valid genre values
 * Use for iteration, validation, and database enum definition
 */
export const STORY_GENRES = Object.values(GENRE);

/**
 * Type for story genres
 */
export type StoryGenre = (typeof GENRE)[keyof typeof GENRE];

/**
 * Genre metadata for UI components
 * Includes icons and color gradients for visual representation
 */
export const GENRE_METADATA: Record<
    StoryGenre,
    { icon: string; gradient: string; summary: string }
> = {
    [GENRE.FANTASY]: {
        icon: "🧙",
        gradient: "from-purple-500 to-pink-500",
        summary: "Magical worlds and supernatural elements",
    },
    [GENRE.ROMANCE]: {
        icon: "💖",
        gradient: "from-pink-500 to-rose-500",
        summary: "Love stories and relationships",
    },
    [GENRE.SCIFI]: {
        icon: "🚀",
        gradient: "from-blue-500 to-cyan-500",
        summary: "Future technology and space exploration",
    },
    [GENRE.MYSTERY]: {
        icon: "🔍",
        gradient: "from-indigo-500 to-purple-500",
        summary: "Puzzles and investigation",
    },
    [GENRE.HORROR]: {
        icon: "👻",
        gradient: "from-gray-900 to-red-900",
        summary: "Fear and supernatural terror",
    },
    [GENRE.ACTION]: {
        icon: "⚡",
        gradient: "from-red-500 to-orange-500",
        summary: "Fast-paced battles and adventures",
    },
    [GENRE.ISEKAI]: {
        icon: "🌀",
        gradient: "from-violet-500 to-fuchsia-500",
        summary: "Reborn or transported to new worlds",
    },
    [GENRE.LITRPG]: {
        icon: "🎮",
        gradient: "from-cyan-500 to-blue-600",
        summary: "Game-like systems and progression",
    },
    [GENRE.CULTIVATION]: {
        icon: "⚔️",
        gradient: "from-orange-500 to-red-600",
        summary: "Martial arts and power progression",
    },
    [GENRE.SLICE]: {
        icon: "☕",
        gradient: "from-amber-400 to-yellow-500",
        summary: "Everyday moments and relationships",
    },
    [GENRE.PARANORMAL]: {
        icon: "🌙",
        gradient: "from-purple-600 to-indigo-600",
        summary: "Vampires, werewolves, and supernatural beings",
    },
    [GENRE.DYSTOPIAN]: {
        icon: "🏚️",
        gradient: "from-slate-600 to-gray-800",
        summary: "Dark futures and oppressive societies",
    },
    [GENRE.HISTORICAL]: {
        icon: "📜",
        gradient: "from-amber-700 to-yellow-600",
        summary: "Stories set in the past",
    },
    [GENRE.LGBTQ]: {
        icon: "🏳️‍🌈",
        gradient: "from-purple-400 to-pink-400",
        summary: "LGBTQ+ romance and stories",
    },
};

/**
 * Get genre metadata by name
 */
export function getGenreMetadata(genre: string) {
    return (
        GENRE_METADATA[genre as StoryGenre] || {
            icon: "📖",
            gradient: "from-gray-500 to-gray-700",
            summary: "Story",
        }
    );
}

/**
 * Validate if a string is a valid genre
 */
export function isValidGenre(genre: string): genre is StoryGenre {
    return STORY_GENRES.includes(genre as StoryGenre);
}
