# Schema & Types Unification Plan

**Goal**: Consolidate all schemas and types into unified `src/lib/schemas/` directory with clear layered architecture.

---

## Current Problems

1. **Scattered Organization**: Types spread across `app/api/`, `lib/studio/`, `lib/schemas/`, `types/`
2. **Duplication**: Evaluation types exist in both `app/api/evaluation/types.ts` AND `lib/schemas/evaluation/`
3. **Mixed Responsibilities**: API files contain Zod schemas (should be in `lib/schemas/`)
4. **Unclear SSOT**: Hard to know which file is source of truth
5. **Inconsistent Naming**: Some use `Api` prefix, some don't

---

## Proposed Unified Structure

```
src/lib/schemas/
│
├── 📁 database/                    # Database layer (SSOT for DB)
│   └── index.ts                   # Drizzle ORM table definitions
│                                   # (moved from schemas/drizzle/)
│
├── 📁 zod/                         # All Zod schemas
│   ├── generated/                 # Auto-generated from Drizzle
│   │   └── index.ts              # (moved from schemas/generated-zod/)
│   ├── nested/                    # Hand-written nested JSON schemas
│   │   ├── personality.ts
│   │   ├── physical-description.ts
│   │   ├── voice-style.ts
│   │   └── setting-elements.ts   # (moved from schemas/nested-zod/)
│   └── ai/                        # AI generation schemas
│       └── index.ts              # (moved from schemas/ai/)
│
├── 📁 api/                         # API layer (HTTP contracts)
│   ├── studio.ts                  # Studio API types + validation schemas
│   │                              # (moved from app/api/studio/types.ts)
│   └── evaluation.ts              # Evaluation API types + validation schemas
│                                   # (consolidated from app/api/evaluation/types.ts)
│
├── 📁 services/                    # Service layer types
│   ├── generators.ts              # Generator service types
│   │                              # (moved from lib/studio/generators/types.ts)
│   ├── evaluation/                # Evaluation domain
│   │   ├── metrics.ts
│   │   ├── requests.ts
│   │   ├── results.ts
│   │   ├── story-evaluation.ts
│   │   └── index.ts              # (moved from schemas/evaluation/)
│   ├── validation/                # Validation domain
│   │   ├── full-validation.ts
│   │   ├── requests.ts
│   │   ├── results.ts
│   │   └── index.ts              # (moved from schemas/validation/)
│   └── improvement/               # Improvement domain
│       ├── change-log.ts
│       ├── requests.ts
│       ├── results.ts
│       └── index.ts              # (moved from schemas/improvement/)
│
├── 📁 domain/                      # Domain-specific types
│   └── image.ts                   # Image generation types
│                                   # (moved from lib/ai/types/image.ts)
│
└── index.ts                       # Central re-export point
```

---

## Layer Principles

### **Database Layer** (`database/`)
- **SSOT**: Drizzle ORM table definitions
- **Purpose**: Database schema only
- **Exports**: Table definitions for use with Drizzle queries

### **Zod Layer** (`zod/`)
- **SSOT**: All Zod validation schemas
- **Sub-layers**:
  - `generated/` - Auto-generated from Drizzle via drizzle-zod
  - `nested/` - Hand-written schemas for JSON columns
  - `ai/` - AI-specific schemas derived from generated validators
- **Purpose**: Runtime validation and TypeScript type inference

### **API Layer** (`api/`)
- **SSOT**: HTTP request/response contracts
- **Naming**: Always use `Api{Entity}Request/Response/ErrorResponse`
- **Contains**: Both TypeScript types AND Zod validation schemas
- **Purpose**: Define API contracts for route handlers

### **Services Layer** (`services/`)
- **SSOT**: Service function contracts and business logic types
- **Naming**: Service-specific (e.g., `GeneratorOptions`, `EvaluationResult`)
- **Purpose**: Types used by service layer functions

### **Domain Layer** (`domain/`)
- **SSOT**: Domain-specific concepts not tied to DB/API/Services
- **Purpose**: Shared domain types (image specs, reading history, etc.)

---

## Migration Plan

### Phase 1: Database & Zod Reorganization

**Move and rename core schema directories:**

```bash
# 1. Create new structure
mkdir -p src/lib/schemas/database
mkdir -p src/lib/schemas/zod/{generated,nested,ai}

# 2. Move files
mv src/lib/schemas/drizzle/* src/lib/schemas/database/
mv src/lib/schemas/generated-zod/* src/lib/schemas/zod/generated/
mv src/lib/schemas/nested-zod/* src/lib/schemas/zod/nested/
mv src/lib/schemas/ai/* src/lib/schemas/zod/ai/

# 3. Delete old directories
rmdir src/lib/schemas/{drizzle,generated-zod,nested-zod,ai}
```

**Update imports (82+ files):**
- `@/lib/schemas/drizzle` → `@/lib/schemas/database`
- `@/lib/schemas/generated-zod` → `@/lib/schemas/zod/generated`
- `@/lib/schemas/nested-zod` → `@/lib/schemas/zod/nested`
- `@/lib/schemas/ai` → `@/lib/schemas/zod/ai`

**Update drizzle.config.ts:**
```typescript
schema: "./src/lib/schemas/database/index.ts"
```

### Phase 2: API Layer Consolidation

**Move API types to unified location:**

```bash
# 1. Create API directory
mkdir -p src/lib/schemas/api

# 2. Move Studio API types
mv src/app/api/studio/types.ts src/lib/schemas/api/studio.ts

# 3. Move Evaluation API types
mv src/app/api/evaluation/types.ts src/lib/schemas/api/evaluation.ts
```

**Update imports:**
- Route handlers: `import { ... } from "@/lib/schemas/api/studio"`
- Test files: `import { ... } from "@/lib/schemas/api/studio"`

### Phase 3: Services Layer Consolidation

**Move service types:**

```bash
# 1. Create services directory
mkdir -p src/lib/schemas/services

# 2. Move generator types
mv src/lib/studio/generators/types.ts src/lib/schemas/services/generators.ts

# 3. Move domain schemas to services
mv src/lib/schemas/evaluation src/lib/schemas/services/evaluation
mv src/lib/schemas/validation src/lib/schemas/services/validation
mv src/lib/schemas/improvement src/lib/schemas/services/improvement
```

**Update imports:**
- Generators: `@/lib/studio/generators/types` → `@/lib/schemas/services/generators`
- Evaluation: `@/lib/schemas/evaluation` → `@/lib/schemas/services/evaluation`
- Validation: `@/lib/schemas/validation` → `@/lib/schemas/services/validation`
- Improvement: `@/lib/schemas/improvement` → `@/lib/schemas/services/improvement`

### Phase 4: Domain Layer

**Move domain types:**

```bash
mkdir -p src/lib/schemas/domain
mv src/lib/ai/types/image.ts src/lib/schemas/domain/image.ts
```

**Update imports:**
- `@/lib/ai/types/image` → `@/lib/schemas/domain/image`

### Phase 5: Update Central Re-exports

**Update `src/lib/schemas/index.ts`:**

```typescript
// Database layer
export * from "./database";

// Zod layer
export * from "./zod/generated";
export * from "./zod/nested";
export * from "./zod/ai";

// API layer
export * from "./api/studio";
export * from "./api/evaluation";

// Services layer
export * from "./services/generators";
export * from "./services/evaluation";
export * from "./services/validation";
export * from "./services/improvement";

// Domain layer
export * from "./domain/image";
```

**Update `src/types/index.ts`:**

```typescript
// Re-export from unified schemas location
export type {
  // API types
  ApiStoryRequest,
  ApiStoryResponse,
  // ... all API types
} from "@/lib/schemas/api/studio";

export type {
  // Evaluation types
  EvaluationResult,
  // ... all evaluation types
} from "@/lib/schemas/services/evaluation";

// ... etc
```

### Phase 6: Cleanup

**Delete old empty directories:**
```bash
# Check these are empty first, then delete
rmdir src/lib/schemas/drizzle
rmdir src/lib/schemas/generated-zod
rmdir src/lib/schemas/nested-zod
rmdir src/lib/schemas/ai
rmdir src/lib/ai/types
```

---

## Import Path Changes Summary

| Old Path | New Path |
|----------|----------|
| `@/lib/schemas/drizzle` | `@/lib/schemas/database` |
| `@/lib/schemas/generated-zod` | `@/lib/schemas/zod/generated` |
| `@/lib/schemas/nested-zod` | `@/lib/schemas/zod/nested` |
| `@/lib/schemas/ai` | `@/lib/schemas/zod/ai` |
| `@/app/api/studio/types` | `@/lib/schemas/api/studio` |
| `@/app/api/evaluation/types` | `@/lib/schemas/api/evaluation` |
| `@/lib/studio/generators/types` | `@/lib/schemas/services/generators` |
| `@/lib/schemas/evaluation` | `@/lib/schemas/services/evaluation` |
| `@/lib/schemas/validation` | `@/lib/schemas/services/validation` |
| `@/lib/schemas/improvement` | `@/lib/schemas/services/improvement` |
| `@/lib/ai/types/image` | `@/lib/schemas/domain/image` |

---

## Benefits

1. ✅ **Single Location**: All schemas and types in `src/lib/schemas/`
2. ✅ **Clear Layers**: database → zod → api → services → domain
3. ✅ **No Duplication**: One file per concept
4. ✅ **Consistent Naming**: Clear conventions per layer
5. ✅ **Easy Discovery**: Developers know where to find and add types
6. ✅ **Import Clarity**: `@/lib/schemas/{layer}/{entity}` pattern

---

## Risks

1. **Large Refactor**: 100+ files need import updates
2. **Type Check Time**: Will need full type-check after each phase
3. **Potential Breakage**: Route handlers, services, tests all affected
4. **Documentation Updates**: Need to update all architecture docs

---

## Execution Strategy

**Recommended**: Phase-by-phase with verification between each phase

1. Run Phase 1 → Type-check → Commit
2. Run Phase 2 → Type-check → Commit
3. Run Phase 3 → Type-check → Commit
4. Run Phase 4 → Type-check → Commit
5. Run Phase 5 → Type-check → Commit
6. Run Phase 6 → Type-check → Commit

**Total Estimated Time**: 30-45 minutes with automated bulk updates
