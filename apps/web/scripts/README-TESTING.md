# Studio API Testing Guide

This document explains how to run tests for the Studio API endpoints with proper logging.

## Quick Start

### Run All Studio Tests

```bash
# From apps/web directory
pnpm test:studio

# Or directly
./scripts/run-studio-tests.sh all
```

### Run Individual Tests

```bash
# Stories API
pnpm test:studio:stories

# Characters API
pnpm test:studio:characters

# Parts API
pnpm test:studio:parts

# Settings API
pnpm test:studio:settings

# Scenes API
pnpm test:studio:scenes
```

## Test Script Details

### Location
`apps/web/scripts/run-studio-tests.sh`

### Features
- ✅ Automatic log directory creation (`logs/` in project root)
- ✅ Individual or bulk test execution
- ✅ Proper environment variable loading (`.env.local`)
- ✅ Test output saved to log files with timestamps
- ✅ Real-time console output with `tee`

### Log Files
All test logs are saved to the project root `logs/` directory:
- `logs/stories-test.log` - Stories API test results
- `logs/characters-test.log` - Characters API test results
- `logs/parts-test.log` - Parts API test results
- `logs/settings-test.log` - Settings API test results
- `logs/scenes-test.log` - Scenes API test results

## Available Tests

### Stories API (`stories.test.ts`)
Tests story generation and management:
- POST `/studio/api/stories` - Generate new story
- Story metadata validation
- Generation time tracking

### Characters API (`characters.test.ts`)
Tests character generation:
- POST `/studio/api/characters` - Generate characters for a story
- Character profile validation (backstory, personality, traits)
- Multiple character generation (3 characters)

### Parts API (`parts.test.ts`)
Tests story parts generation:
- POST `/studio/api/parts` - Generate story parts
- GET `/studio/api/parts` - Fetch parts for a story
- Query parameter validation

### Settings API (`settings.test.ts`)
Tests setting generation:
- POST `/studio/api/settings` - Generate story settings
- Setting mood and atmosphere validation
- Multiple setting generation

### Scenes API (`scenes.test.ts`)
Tests scene generation and management:
- Scene creation and content generation
- Scene quality validation
- Scene ordering and chapter association

## Manual Test Commands

If you need to run tests manually without the script:

```bash
# Run from apps/web directory
cd apps/web

# Single test file
dotenv --file .env.local run pnpm test __tests__/api/studio/stories.test.ts

# All tests in a directory
dotenv --file .env.local run pnpm test __tests__/api/studio/

# With logging
dotenv --file .env.local run pnpm test __tests__/api/studio/stories.test.ts 2>&1 | tee ../../logs/stories-test.log
```

## Troubleshooting

### Log Directory Not Found
The script automatically creates the `logs/` directory. If you still encounter issues:

```bash
# From project root
mkdir -p logs
```

### Environment Variables Not Loading
Ensure `.env.local` exists in `apps/web/`:

```bash
# Check if .env.local exists
ls -la apps/web/.env.local

# Copy from example if needed
cp apps/web/.env.example apps/web/.env.local
```

### Test Timeouts
Some tests (especially character generation) can take 10-20 seconds. If tests timeout:

1. Check if AI server is running (if using ai-server provider)
2. Check if Gemini API key is valid (if using gemini provider)
3. Check network connectivity

### Port 3000 Already in Use
If tests fail because port 3000 is busy:

```bash
# Kill process on port 3000
lsof -ti :3000 | xargs -r kill -9

# Restart dev server
cd apps/web
rm -rf .next
dotenv --file .env.local run pnpm dev
```

## Test Coverage

Current test coverage:
- ✅ Story generation
- ✅ Character generation
- ✅ Parts generation and retrieval
- ✅ Settings generation
- 🚧 Scenes generation (in progress)
- 🚧 Chapter generation (planned)
- 🚧 Image generation (planned)

## CI/CD Integration

To run these tests in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Studio API Tests
  run: |
    cd apps/web
    pnpm test:studio
```

## Performance Benchmarks

Typical test execution times:
- **Stories**: ~2-5 seconds
- **Characters**: ~10-15 seconds (generates 3 characters)
- **Parts**: ~8-10 seconds (generates 2 parts)
- **Settings**: ~16-18 seconds (generates 2 settings)
- **Full Suite**: ~40-50 seconds

## Related Documentation

- [Testing Strategy](../docs/test/test-specification.md) - Overall testing approach
- [API Documentation](../docs/api/) - API endpoint specifications
- [Novel Generation](../docs/novels/novels-development.md) - Novel generation system details
