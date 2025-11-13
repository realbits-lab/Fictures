# Schema Synchronization Strategy

**Date**: 2025-10-31
**Purpose**: Define how to keep database schema, code, and documentation in sync for the Adversity-Triumph Engine

---

## Executive Summary

This document outlines the synchronization strategy between three critical components:
1. **Specification** (`docs/novels/novels-specification.md`) - The authoritative design document
2. **Database Schema** (`src/lib/db/schema.ts` + Drizzle migrations) - The data layer
3. **Generation Code** (`src/lib/novels/` + `src/app/studio/api/novels/`) - The implementation

**Core Principle**: **Documentation-First Development** - The specification document is the single source of truth, and all code must synchronize with it.

---

## 1. Documentation-First Development Workflow

### The Golden Rule

> **ALWAYS update `docs/novels/novels-specification.md` FIRST** before making changes to schema or code.

### Why Documentation First?

1. **Design Review**: Changes can be reviewed and validated before implementation begins
2. **Single Source of Truth**: Documentation defines intended behavior definitively
3. **Knowledge Transfer**: New developers understand the system from authoritative docs
4. **Version Control**: Intent is tracked alongside implementation
5. **Prevents Drift**: Schema and code stay aligned with design vision

### The Correct Change Workflow

```
┌──────────────────────────────────────────────────────┐
│ 1. UPDATE SPECIFICATION                               │
│    docs/novels/novels-specification.md                │
│    - Update data model section (Part III)            │
│    - Update field descriptions                        │
│    - Update examples                                  │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 2. UPDATE DATABASE SCHEMA                            │
│    a. Create migration SQL                           │
│       drizzle/NNNN_description.sql                   │
│    b. Update schema.ts                               │
│       src/lib/db/schema.ts                           │
│    c. Generate migration                             │
│       pnpm db:generate                               │
│    d. Run migration                                  │
│       pnpm db:migrate                                │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 3. UPDATE TYPESCRIPT TYPES                           │
│    src/lib/novels/types.ts                           │
│    - Align TypeScript interfaces with schema         │
│    - Update type definitions                         │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 4. UPDATE GENERATION CODE                            │
│    src/lib/novels/ + src/app/studio/api/novels/  │
│    - Update AI prompts to use new fields             │
│    - Update database queries and inserts             │
│    - Update API responses                            │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 5. UPDATE TESTS                                      │
│    __tests__/ + docs/novels/novels-evaluation.md        │
│    - Add tests for new fields                        │
│    - Update validation tests                         │
└──────────────────────────────────────────────────────┘
```

---

## 2. Component Responsibilities

### 2.1 Specification Document (`docs/novels/novels-specification.md`)

**Role**: Single Source of Truth
**Contains**:
- Data model definitions (Part III)
- Field descriptions and rationales
- TypeScript interface examples
- Enum definitions
- Migration strategy
- Validation rules

**Update Triggers**:
- New feature requirements
- Field additions/changes
- Data structure refinements
- Enum value changes

**Update Frequency**: Before any schema or code changes

### 2.2 Database Schema (`src/lib/db/schema.ts`)

**Role**: Data persistence layer
**Contains**:
- Drizzle ORM table definitions
- Field types and constraints
- Enum definitions
- Relations between tables
- Default values

**Update Triggers**:
- After specification updates
- When adding new fields
- When changing field types
- When adding enums or constraints

**Update Method**:
1. Modify `schema.ts` with new fields
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:migrate` to apply to database

### 2.3 TypeScript Types (`src/lib/novels/types.ts`)

**Role**: Type safety and code contracts
**Contains**:
- TypeScript interfaces for each entity
- Type definitions for API requests/responses
- Enum type definitions
- Utility types

**Update Triggers**:
- After schema updates
- When API signatures change
- When adding new generation phases

**Update Method**:
Manually sync interfaces with schema.ts definitions

### 2.4 Generation Code

**Locations**:
- `src/lib/novels/` - Core generation logic, AI client
- `src/app/studio/api/novels/` - API endpoints for each generation phase

**Update Triggers**:
- After schema changes
- When new fields need to be populated
- When AI prompts need field data
- When API responses need new fields

**Update Method**:
Update prompts, database queries, and API responses to use new fields

---

## 3. Synchronization Checkpoints

### Before Each Deployment

Run these checks to ensure everything is in sync:

#### 3.1 Schema → Specification Check

```bash
# Compare schema.ts field names with specification
# Manual review: Does schema.ts match Part III of novels-specification.md?

# Checklist:
# [ ] All fields in specification exist in schema.ts
# [ ] All enums in specification exist in schema.ts
# [ ] Field types match specification
# [ ] Default values match specification
```

#### 3.2 Types → Schema Check

```bash
# Compare TypeScript types with schema definitions
# Manual review: Does types.ts match schema.ts?

# Checklist:
# [ ] All tables have corresponding TypeScript interfaces
# [ ] Field types match schema types
# [ ] Enums are properly typed
# [ ] Optional vs required fields match
```

#### 3.3 Code → Types Check

```bash
# Run TypeScript compiler to catch type mismatches
pnpm build

# Check for type errors - this validates that:
# [ ] Generation code uses correct types
# [ ] API responses match expected types
# [ ] Database queries return correct types
```

#### 3.4 Database → Schema Check

```bash
# Verify migrations are up to date
pnpm db:generate

# Should output: "No schema changes detected"
# If changes detected, migration is out of sync!
```

### Regular Audits

**Monthly**:
- Review `docs/novels/schema-gap-analysis.md`
- Update gap analysis with current state
- Identify any drift between spec and implementation

**Quarterly**:
- Full documentation review
- Update examples with real generated data
- Validate that all specification sections are accurate

---

## 4. Common Drift Scenarios and Fixes

### Scenario 1: Schema Drifted from Specification

**Symptom**: Fields in `schema.ts` don't match `novels-specification.md`

**Fix**:
1. Determine which is correct (usually specification)
2. Update the incorrect source
3. If schema is wrong: Create migration + update schema.ts
4. If spec is wrong: Update specification (rare - spec should lead)

### Scenario 2: Code Using Undefined Fields

**Symptom**: TypeScript errors about missing properties

**Fix**:
1. Check if field exists in schema.ts
2. If missing: Add to schema.ts + run migration
3. If exists: Update types.ts interface
4. Update generation code to use field correctly

### Scenario 3: Database Missing Expected Columns

**Symptom**: Runtime errors about missing columns

**Fix**:
1. Check schema.ts - is field defined?
2. Run `pnpm db:generate` to create missing migration
3. Run `pnpm db:migrate` to apply
4. Restart dev server to pick up changes

### Scenario 4: AI Prompts Not Using New Fields

**Symptom**: Generated data doesn't populate new fields

**Fix**:
1. Locate the generation API endpoint (e.g., `src/app/studio/api/novels/characters/route.ts`)
2. Update system prompt to request new fields
3. Update prompt context to include field descriptions
4. Update database insert to save new fields
5. Test generation end-to-end

---

## 5. Migration Best Practices

### Adding New Fields

1. **Always make fields nullable initially**
   ```sql
   ALTER TABLE stories ADD COLUMN summary TEXT;
   -- NOT: ADD COLUMN summary TEXT NOT NULL
   ```

2. **Provide migration path for existing data**
   ```sql
   -- Migrate old fields to new field
   UPDATE stories
   SET summary = CONCAT_WS(' | ', premise, dramatic_question, theme)
   WHERE summary IS NULL;
   ```

3. **Add NOT NULL constraint only after migration**
   ```sql
   -- After data is migrated
   ALTER TABLE stories ALTER COLUMN summary SET NOT NULL;
   ```

### Changing Field Types

1. **Create new field with new type**
2. **Migrate data to new field**
3. **Drop old field**
4. **Rename new field to old name** (if needed)

### Adding Enums

1. **Create enum type first**
   ```sql
   CREATE TYPE tone AS ENUM ('hopeful', 'dark', 'bittersweet', 'satirical');
   ```

2. **Add column using enum**
   ```sql
   ALTER TABLE stories ADD COLUMN tone tone;
   ```

3. **Update schema.ts with matching enum**
   ```typescript
   export const toneEnum = pgEnum('tone', ['hopeful', 'dark', 'bittersweet', 'satirical']);
   ```

---

## 6. Documentation Maintenance

### When to Update Each Document

| Document | Update When... |
|----------|----------------|
| `novels-specification.md` | **FIRST** - before any code changes |
| `schema-gap-analysis.md` | After specification changes, before implementation |
| `novels-development.md` | When API endpoints or system prompts change |
| `novels-evaluation.md` | When validation rules or quality metrics change |
| `schema-synchronization-strategy.md` | When sync process itself needs refinement |

### Documentation Review Checklist

Before marking a feature "complete":
- [ ] Specification updated with design
- [ ] Gap analysis created/updated
- [ ] Migration SQL created and tested
- [ ] Schema.ts updated and synced
- [ ] Types.ts updated and synced
- [ ] Generation code updated
- [ ] Tests updated
- [ ] All sync checks passing

---

## 7. Tooling and Automation

### Current Manual Processes

These processes are currently manual but could be automated:

1. **Schema → Spec validation**: Compare schema.ts fields with specification
2. **Types → Schema sync**: Generate TypeScript types from schema
3. **Gap analysis**: Identify differences between spec and implementation

### Potential Automation

**Future Tools** (not yet implemented):

```bash
# Proposed CLI commands
pnpm schema:validate    # Compare schema.ts with specification
pnpm types:generate     # Auto-generate types from schema
pnpm spec:audit         # Check specification completeness
pnpm sync:check         # Run all synchronization checks
```

### Current Workflow

For now, synchronization is manual:

1. Read specification document
2. Update schema.ts by hand
3. Generate migration: `pnpm db:generate`
4. Apply migration: `pnpm db:migrate`
5. Update types.ts by hand
6. Update generation code by hand
7. Test: `pnpm build`

---

## 8. Quick Reference: Sync Checklist

### For Adding a New Field

- [ ] 1. Update `docs/novels/novels-specification.md` with field definition
- [ ] 2. Add field to `src/lib/db/schema.ts`
- [ ] 3. Run `pnpm db:generate` to create migration
- [ ] 4. Review generated SQL in `drizzle/` directory
- [ ] 5. Run `pnpm db:migrate` to apply migration
- [ ] 6. Add field to TypeScript interface in `src/lib/novels/types.ts`
- [ ] 7. Update generation API to populate field
- [ ] 8. Update AI system prompt to request field
- [ ] 9. Update database insert statement
- [ ] 10. Test generation end-to-end
- [ ] 11. Update `schema-gap-analysis.md` to remove from missing list

### For Changing a Field Type

- [ ] 1. Update specification first
- [ ] 2. Create migration SQL to change type
- [ ] 3. Update schema.ts with new type
- [ ] 4. Update types.ts interface
- [ ] 5. Update all code using this field
- [ ] 6. Run `pnpm build` to catch type errors
- [ ] 7. Test all affected features

### For Adding a New Enum

- [ ] 1. Add enum definition to specification
- [ ] 2. Create enum type in migration SQL
- [ ] 3. Add `pgEnum` definition in schema.ts
- [ ] 4. Add fields using this enum
- [ ] 5. Export TypeScript type from types.ts
- [ ] 6. Update code to use enum values
- [ ] 7. Test enum validation

---

## 9. Emergency Drift Recovery

If schema has drifted significantly from specification:

### Step 1: Audit Current State

```bash
# 1. Compare schema with spec
# Create new gap analysis document
# Identify ALL differences

# 2. Check database state
pnpm db:studio
# Review actual database columns

# 3. Check code usage
# Search codebase for field usage
grep -r "characterId" src/
```

### Step 2: Create Recovery Plan

1. List all missing fields
2. List all incorrect field types
3. List all deprecated fields to remove
4. Prioritize: Critical → Important → Nice-to-have

### Step 3: Execute Recovery

1. Create comprehensive migration SQL
2. Test migration on development database first
3. Update schema.ts with all changes
4. Update types.ts with all changes
5. Update all generation code
6. Run full test suite
7. Manual testing of story generation

### Step 4: Prevent Future Drift

1. Document what went wrong
2. Add this scenario to this guide
3. Implement additional checks if needed
4. Consider automation for repetitive checks

---

## 10. Success Criteria

The schema is considered "in sync" when:

1. ✅ All fields in specification exist in schema.ts
2. ✅ All fields in schema.ts are documented in specification
3. ✅ `pnpm db:generate` outputs "No schema changes detected"
4. ✅ `pnpm build` completes without type errors
5. ✅ All generation APIs populate expected fields
6. ✅ Test story generation produces valid data for all fields
7. ✅ Gap analysis document shows zero missing fields

---

## Conclusion

**Remember the Golden Rule**:
> Update `docs/novels/novels-specification.md` FIRST, then schema, then code.

This documentation-first approach ensures:
- Design quality through review
- Implementation clarity
- Long-term maintainability
- Team alignment
- System integrity

When in doubt, **refer to the specification** - it is the single source of truth for the Adversity-Triumph Engine.

---

## Related Documentation

- **[Schema Simplification](./schema-simplification.md)** - Removal of bi-directional links (2025-11-01)
- **[Novels Specification](./novels-specification.md)** - Complete data model and field definitions
- **[Novels Development Guide](./novels-development.md)** - API implementation details
- **[Novels Testing Guide](./novels-evaluation.md)** - Validation and quality metrics

## Schema Evolution Milestones

### 2025-11-01: Schema Simplification
- **Change**: Removed bi-directional linking (JSON arrays in stories table)
- **Rationale**: Eliminated data redundancy without performance cost
- **Impact**: Simpler writes, no desync risk, reduced storage
- **Migration**: `drizzle/0024_remove_story_id_arrays.sql`
- **Documentation**: [schema-simplification.md](./schema-simplification.md)

### Future Considerations
- Monitor query performance as story count grows
- Consider materialized views for complex aggregations
- Evaluate need for read replicas for high-traffic scenarios
