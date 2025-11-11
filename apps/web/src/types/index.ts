/**
 * Type Organization Index
 *
 * This file provides a quick reference to all type locations in the codebase.
 * Types are organized by architectural layer following Clean Architecture principles.
 *
 * ## Architecture Layers
 *
 * ### API Layer (HTTP Contracts)
 * HTTP request/response types that define the public API contract.
 * - Location: src/app/star/api/types.ts
 * - Naming: ActionEntityRequest, ActionEntityResponse, ActionEntityErrorResponse
 * - Example: GenerateStoryRequest, GenerateStoryResponse
 *
 * ### Service Layer (Business Logic)
 * Internal function parameters and results for business logic.
 * - Location: src/lib/star/types.ts
 * - Naming: ActionEntityParams, ActionEntityResult
 * - Example: GenerateStoryParams, GenerateStoryResult
 *
 * ### Domain Layer (Core Concepts)
 * Domain-specific types and concepts.
 * - Location: src/lib/domain/types/
 * - Naming: Entity, EntityType, Concept
 * - Example: ImageProvider, AspectRatio
 *
 * ### Shared Layer (Cross-cutting Concerns)
 * Globally shared types used across multiple layers.
 * - Location: src/types/ (this directory)
 * - Naming: Descriptive names based on purpose
 * - Example: ValidationResult, ReadingHistoryRecord
 *
 * ## Type Locations
 *
 * ### Global Shared Types (this directory)
 * - validation-evaluation.ts - Story validation and quality evaluation types
 * - reading-history.ts - Reading progress tracking and history
 * - next-auth.d.ts - NextAuth.js authentication type augmentation
 *
 * ### API Layer Types
 * - app/studio/api/types.ts - Studio generation API contracts (stories, characters, settings, etc.)
 *
 * ### Service Layer Types
 * - lib/studio/generators/types.ts - Generator function parameters and results
 *
 * ### Domain Layer Types
 * - lib/ai/types/image.ts - AI image generation domain types
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
 * import type { GenerateStoryRequest } from '@/app/studio/api/types';
 *
 * ### From Service Types
 * @example
 * import type { GenerateStoryParams } from '@/lib/studio/generators/types';
 *
 * ### From Domain Types
 * @example
 * import type { ImageProvider } from '@/lib/ai/types/image';
 */

// ============================================================================
// Re-export Global Shared Types
// ============================================================================

// Reading history types
export type {
	AddToHistoryOptions,
	HistoryItem,
	ReadingFormat,
	ReadingHistoryRecord,
	StorageData,
} from "./reading-history";
// Validation and evaluation types
export type {
	ChangeLog,
	ChapterEvaluation,
	CharacterEvaluation,
	ComprehensiveReport,
	CrossReferenceAnalysis,
	EvaluationRequest,
	// Evaluation types
	EvaluationScore,
	FullValidationResult,
	OverallEvaluation,
	PartEvaluation,
	QuickEvaluationResult,
	SceneEvaluation,
	SettingEvaluation,
	StoryAnalysisRequest,
	StoryAnalysisResponse,
	StoryAnalysisWithImprovementResponse,
	StoryEvaluationResult,
	// Improvement types
	StoryImprovementRequest,
	StoryImprovementResult,
	ValidationError,
	// API types
	ValidationRequest,
	// Validation types
	ValidationResult,
	ValidationStats,
	ValidationWarning,
} from "./validation-evaluation";

// Note: next-auth.d.ts augments global types and doesn't need re-export
