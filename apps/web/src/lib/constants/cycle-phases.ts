/**
 * Cycle phase constants for scene structure
 * Represents the 5 phases of the Adversity-Triumph cycle
 */
export const CYCLE_PHASES = [
    "setup",
    "confrontation",
    "virtue",
    "consequence",
    "transition",
] as const;

export type CyclePhase = (typeof CYCLE_PHASES)[number];
