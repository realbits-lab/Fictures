/**
 * Nested Zod Schemas - SSOT for JSON field structures
 *
 * These schemas define the structure for nested JSON fields in the database.
 * They are used in both Drizzle .$type<>() and Zod validation.
 */

// Character schemas
export {
    type PersonalityType,
    personalitySchema,
} from "./personality";

export {
    type PhysicalDescriptionType,
    physicalDescriptionSchema,
} from "./physical-description";
// Setting schemas
export {
    type AdversityElementsType,
    adversityElementsSchema,
    type ConsequenceElementsType,
    consequenceElementsSchema,
    type SensoryType,
    sensorySchema,
    type VirtueElementsType,
    virtueElementsSchema,
} from "./setting-elements";
export {
    type VoiceStyleType,
    voiceStyleSchema,
} from "./voice-style";
