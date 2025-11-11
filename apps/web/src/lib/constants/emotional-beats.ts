/**
 * Emotional beat constants for scene atmosphere
 * Represents target emotional responses in scenes
 */
export const EMOTIONAL_BEATS = [
    "fear",
    "hope",
    "tension",
    "relief",
    "elevation",
    "catharsis",
    "despair",
    "joy",
] as const;

export type EmotionalBeat = (typeof EMOTIONAL_BEATS)[number];
