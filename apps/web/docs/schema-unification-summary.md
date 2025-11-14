# Schema & Types Unification - Executive Summary

## 🎯 Goal

Unify all schemas and types into single `src/lib/schemas/` directory with clear layered architecture.

---

## 📊 Current State Analysis

### Files Found
- **Total**: 25 type definition files
- **Total Lines**: 4,929 lines
- **Scattered across**: 4 different directory trees

### Critical Issues
1. **Duplication**: Evaluation types in 2 locations (API + schemas)
2. **Mixed Responsibilities**: Zod schemas in API route files
3. **Inconsistent Naming**: Some use `Api` prefix, some don't
4. **Unclear SSOT**: Hard to know source of truth

---

## 🏗️ Proposed Structure

```
src/lib/schemas/
│
├── database/           # Drizzle ORM (SSOT for DB)
│   └── index.ts
│
├── zod/               # All Zod validation schemas
│   ├── generated/     # Auto-generated from Drizzle
│   ├── nested/        # Hand-written nested JSON
│   └── ai/           # AI generation schemas
│
├── api/              # HTTP API contracts
│   ├── studio.ts     # Studio API
│   └── evaluation.ts # Evaluation API
│
├── services/         # Service layer types
│   ├── generators.ts
│   ├── evaluation/
│   ├── validation/
│   └── improvement/
│
├── domain/           # Domain concepts
│   └── image.ts
│
└── index.ts         # Central re-export
```

---

## 🔄 Migration Overview

### Phase 1: Database & Zod (Core Layer)
**Moves**: 4 directories
- `schemas/drizzle/` → `schemas/database/`
- `schemas/generated-zod/` → `schemas/zod/generated/`
- `schemas/nested-zod/` → `schemas/zod/nested/`
- `schemas/ai/` → `schemas/zod/ai/`

**Impact**: ~82 import updates

### Phase 2: API Layer
**Moves**: 2 files
- `app/api/studio/types.ts` → `schemas/api/studio.ts`
- `app/api/evaluation/types.ts` → `schemas/api/evaluation.ts`

**Impact**: ~15 import updates (route handlers + tests)

### Phase 3: Services Layer
**Moves**: 4 items
- `lib/studio/generators/types.ts` → `schemas/services/generators.ts`
- `schemas/evaluation/` → `schemas/services/evaluation/`
- `schemas/validation/` → `schemas/services/validation/`
- `schemas/improvement/` → `schemas/services/improvement/`

**Impact**: ~25 import updates

### Phase 4: Domain Layer
**Moves**: 1 file
- `lib/ai/types/image.ts` → `schemas/domain/image.ts`

**Impact**: ~5 import updates

### Phase 5: Central Re-exports
**Updates**: 2 files
- `src/lib/schemas/index.ts` - Add all new exports
- `src/types/index.ts` - Update re-export paths

**Impact**: Downstream consumers can use central import

### Phase 6: Cleanup
**Deletes**: Old empty directories

---

## 📈 Benefits

| Benefit | Before | After |
|---------|--------|-------|
| **Schema locations** | 4 directories | 1 directory (`schemas/`) |
| **Type duplication** | 2 locations for evaluation | 1 location per concept |
| **Import clarity** | Mixed patterns | Consistent `@/lib/schemas/{layer}` |
| **Layer separation** | Blurred | Clear: database → zod → api → services → domain |
| **Developer experience** | "Where do I put this?" | Clear layered structure |

---

## ⚠️ Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Large refactor (100+ files) | Phase-by-phase with type-check between each |
| Potential breakage | Full type-check after each phase |
| Time investment | Automated bulk updates with sed |
| Documentation drift | Update all docs immediately after migration |

---

## 🚀 Execution Plan

**Recommended**: Automated execution with verification

1. **Run Phase 1** → Move database/zod → Type-check → Commit
2. **Run Phase 2** → Move API types → Type-check → Commit
3. **Run Phase 3** → Move services → Type-check → Commit
4. **Run Phase 4** → Move domain → Type-check → Commit
5. **Run Phase 5** → Update re-exports → Type-check → Commit
6. **Run Phase 6** → Cleanup → Type-check → Commit

**Estimated Time**: 30-45 minutes total

---

## 📋 Import Path Changes (Quick Reference)

```typescript
// Database
"@/lib/schemas/drizzle" → "@/lib/schemas/database"

// Zod
"@/lib/schemas/generated-zod" → "@/lib/schemas/zod/generated"
"@/lib/schemas/nested-zod" → "@/lib/schemas/zod/nested"
"@/lib/schemas/ai" → "@/lib/schemas/zod/ai"

// API
"@/app/api/studio/types" → "@/lib/schemas/api/studio"
"@/app/api/evaluation/types" → "@/lib/schemas/api/evaluation"

// Services
"@/lib/studio/generators/types" → "@/lib/schemas/services/generators"
"@/lib/schemas/evaluation" → "@/lib/schemas/services/evaluation"
"@/lib/schemas/validation" → "@/lib/schemas/services/validation"
"@/lib/schemas/improvement" → "@/lib/schemas/services/improvement"

// Domain
"@/lib/ai/types/image" → "@/lib/schemas/domain/image"
```

---

## 🎯 Success Criteria

- ✅ All schemas and types in `src/lib/schemas/`
- ✅ Clear 5-layer structure (database → zod → api → services → domain)
- ✅ No duplication
- ✅ Consistent naming conventions
- ✅ Zero type errors
- ✅ All tests passing
- ✅ Documentation updated

---

## 📖 Related Documents

- **Detailed Plan**: `docs/schema-types-unification-plan.md`
- **Current Analysis**: `docs/type-analysis-summary.md`
- **Duplication Issues**: `docs/type-duplication-issues.txt`
- **Files Reference**: `docs/type-files-reference.txt`
