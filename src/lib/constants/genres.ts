/**
 * Global Genre Constants
 *
 * Single source of truth for all story genres across the application.
 * Use these constants for:
 * - AI story generation (ensures valid genre selection)
 * - UI dropdowns and filters
 * - Database validation
 * - Genre display components
 */

export const STORY_GENRES = [
  "Fantasy",
  "Science Fiction",
  "Romance",
  "Mystery",
  "Thriller",
  "Detective",
  "Adventure",
  "Horror",
  "Historical Fiction",
  "Contemporary",
] as const;

export type StoryGenre = typeof STORY_GENRES[number];

/**
 * Genre metadata for UI components
 * Includes icons and color gradients for visual representation
 */
export const GENRE_METADATA: Record<StoryGenre, { icon: string; gradient: string; description: string }> = {
  "Fantasy": {
    icon: "🧙",
    gradient: "from-purple-500 to-pink-500",
    description: "Magical worlds and supernatural elements"
  },
  "Science Fiction": {
    icon: "🚀",
    gradient: "from-blue-500 to-cyan-500",
    description: "Future technology and space exploration"
  },
  "Romance": {
    icon: "💖",
    gradient: "from-pink-500 to-rose-500",
    description: "Love stories and relationships"
  },
  "Mystery": {
    icon: "🔍",
    gradient: "from-indigo-500 to-purple-500",
    description: "Puzzles and investigation"
  },
  "Detective": {
    icon: "🕵️",
    gradient: "from-gray-700 to-gray-900",
    description: "Crime-solving and investigation"
  },
  "Adventure": {
    icon: "🗺️",
    gradient: "from-green-500 to-emerald-500",
    description: "Exciting journeys and quests"
  },
  "Thriller": {
    icon: "⚡",
    gradient: "from-red-500 to-orange-500",
    description: "Suspense and tension"
  },
  "Horror": {
    icon: "👻",
    gradient: "from-gray-900 to-red-900",
    description: "Fear and supernatural terror"
  },
  "Historical Fiction": {
    icon: "📜",
    gradient: "from-amber-700 to-yellow-600",
    description: "Stories set in the past"
  },
  "Contemporary": {
    icon: "🏙️",
    gradient: "from-slate-500 to-blue-500",
    description: "Modern-day realistic fiction"
  },
};

/**
 * Get genre metadata by name
 */
export function getGenreMetadata(genre: string) {
  return GENRE_METADATA[genre as StoryGenre] || {
    icon: "📖",
    gradient: "from-gray-500 to-gray-700",
    description: "Story"
  };
}

/**
 * Validate if a string is a valid genre
 */
export function isValidGenre(genre: string): genre is StoryGenre {
  return STORY_GENRES.includes(genre as StoryGenre);
}
