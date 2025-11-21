/**
 * Type Organization Index
 *
 * This file provides a quick reference to all type locations in the codebase.
 * All schemas and types are now unified under src/lib/schemas/ with a clear 5-layer architecture.
 *
 * ## Unified Schema Architecture
 *
 * **Layer Flow**: database → zod → api → services → domain
 *
 * ### Database Layer (Drizzle ORM)
 * - Location: src/lib/schemas/database/
 * - Purpose: Database table definitions (SSOT for DB)
 * - Example: stories, characters, scenes tables
 *
 * ### Zod Layer (Validation Schemas)
 * - Location: src/lib/schemas/zod/
 *   - zod/generated/ - Auto-generated from Drizzle
 *   - zod/nested/ - Hand-written nested JSON schemas
 *   - zod/ai/ - AI generation schemas
 * - Purpose: Runtime validation and type inference
 * - Example: Story, Character, Scene types
 *
 * ### API Layer (HTTP Contracts)
 * - Location: src/lib/schemas/api/
 * - Files: studio.ts, evaluation.ts
 * - Naming: Api{Entity}Request, Api{Entity}Response
 * - Example: ApiStoryRequest, ApiStoryResponse
 *
 * ### Services Layer (Business Logic)
 * - Location: src/lib/schemas/services/
 * - Files: generators.ts, evaluation/, validation/, improvement/
 * - Naming: Generator{Entity}Params, Generator{Entity}Result
 * - Example: GeneratorStoryParams, EvaluationResult
 *
 * ### Domain Layer (Domain Concepts)
 * - Location: src/lib/schemas/domain/
 * - Files: image.ts
 * - Purpose: Domain-specific types not tied to DB/API/Services
 * - Example: ImageProvider, AspectRatio
 *
 * ### Shared Layer (Cross-cutting Concerns)
 * - Location: src/types/ (this directory)
 * - Purpose: Globally shared types and re-exports
 * - Files: reading-history.ts, validation-evaluation.ts, next-auth.d.ts
 *
 * ## Type Naming Conventions
 *
 * ### API Layer (HTTP Boundary)
 * @example
 * // Request body
 * export interface GenerateEntityRequest { ... }
 *
 * // Success response
 * export interface GenerateEntityResponse { ... }
 *
 * // Error response
 * export interface GenerateEntityErrorResponse { ... }
 *
 * ### Service Layer (Business Logic)
 * @example
 * // Function parameters
 * export interface GenerateEntityParams { ... }
 *
 * // Function result
 * export interface GenerateEntityResult { ... }
 *
 * // Metadata
 * export interface EntityMetadata { ... }
 *
 * ### Domain Layer (Core Concepts)
 * @example
 * // Entity types
 * export interface Entity { ... }
 *
 * // Enumerations
 * export type EntityType = "option1" | "option2";
 *
 * // Domain concepts
 * export type Concept = ...;
 *
 * ## Import Guidelines
 *
 * ### From Global Types
 * @example
 * import type { ValidationResult, HistoryItem } from '@/types';
 *
 * ### From API Types
 * @example
 * import type { ApiStoryRequest } from '@/lib/schemas/api/studio';
 *
 * ### From Service Types
 * @example
 * import type { GeneratorStoryParams } from '@/lib/schemas/services/generators';
 *
 * ### From Domain Types
 * @example
 * import type { ImageProvider } from '@/lib/schemas/domain/image';
 */

// ============================================================================
// Re-export Global Shared Types
// ============================================================================

// Evaluation types
export type {
    ChapterEvaluation,
    CharacterEvaluation,
    CrossReferenceAnalysis,
    EvaluationScore,
    OverallEvaluation,
    PartEvaluation,
    QuickEvaluationResult,
    SceneEvaluation,
    SettingEvaluation,
    StoryEvaluationResult,
} from "@/lib/schemas/services/evaluation";
// Improvement types
export type {
    ChangeLog,
    StoryImprovementRequest,
    StoryImprovementResult,
} from "@/lib/schemas/services/improvement";
// Validation types
export type {
    FullValidationResult,
    ValidationError,
    ValidationRequest,
    ValidationResult,
    ValidationStats,
    ValidationWarning,
} from "@/lib/schemas/services/validation";
// Reading history types
export type {
    AddToHistoryOptions,
    HistoryItem,
    ReadingFormat,
    ReadingHistoryRecord,
    StorageData,
} from "./reading-history";

// Legacy API types (still in validation-evaluation.ts - will be migrated separately)
// TODO: Migrate these types to the appropriate schema layer
// These types are currently not used - the evaluation APIs use types from @/lib/schemas/api/evaluation
// export type {
//     ComprehensiveReport,
//     EvaluationRequest,
//     StoryAnalysisRequest,
//     StoryAnalysisResponse,
//     StoryAnalysisWithImprovementResponse,
// } from "./validation-evaluation";

// Note: next-auth.d.ts augments global types and doesn't need re-export
