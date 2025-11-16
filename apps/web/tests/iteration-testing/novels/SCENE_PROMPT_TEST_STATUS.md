# Scene Prompt Test Status Report

## ✅ Completed

### 1. Version Support Infrastructure
- ✅ Added `promptVersion` parameter support to:
  - `GenerateSceneSummaryParams` (types)
  - `GeneratorSceneContentParams` (types)
  - `SceneSummaryService.generateAndSave()` (service)
  - `SceneContentService.generateAndSave()` (service)
  - `generateSceneSummary()` (generator)
  - `generateSceneContent()` (generator)
  - `promptManager.getPrompt()` (prompt manager)

### 2. Test Scripts Created
- ✅ `scene-summary-test.ts` - Tests scene summary prompt versions
- ✅ `scene-content-test.ts` - Tests scene content prompt versions

### 3. Test Infrastructure Features
- ✅ Shared pre-data generation (story, characters, settings, part, chapter)
- ✅ Scene summary generation with version support
- ✅ Scene content generation with version support
- ✅ Evaluation API integration
- ✅ Metrics extraction and comparison
- ✅ Statistical analysis (p-value calculation)
- ✅ Report generation (JSON + Markdown)

## ⚠️ Issues Encountered

### 1. Missing v1.1 Prompt Files
**Error**: `Cannot find module '/home/web/GitHub/@dev.realbits/Fictures/apps/web/src/lib/studio/prompts/v1.1/scene-summary-prompt.js'`

**Solution Needed**: Create v1.1 prompt files:
- `apps/web/src/lib/studio/prompts/v1.1/scene-summary-prompt.js`
- `apps/web/src/lib/studio/prompts/v1.1/scene-content-prompt.js`

### 2. Evaluation API Not Available
**Error**: Scene evaluation API calls failing

**Solution Needed**: Ensure evaluation API is running at `http://localhost:3000/api/evaluation/scene-summary` and `http://localhost:3000/api/evaluation/scene-content`

### 3. Timeout Issues
**Error**: AI server requests timing out during scene generation

**Solution Needed**: Increase timeout or optimize prompts for faster generation

## 📋 Next Steps

### Immediate Actions Required

1. **Create v1.1 Prompt Files**
   - Copy current prompts from `prompt-manager.ts`
   - Create improved versions based on:
     - Better phase distribution guidance
     - Enhanced emotional beat instructions
     - Clearer sensory anchor requirements
     - Improved pacing rhythm guidelines

2. **Verify Evaluation API**
   - Check if evaluation endpoints exist
   - Test API endpoints manually
   - Fix any API issues

3. **Run Tests**
   ```bash
   # Test scene-summary prompts
   cd apps/web
   pnpm tsx tests/iteration-testing/novels/scene-summary-test.ts \
     --control v1.0 \
     --experiment v1.1 \
     --prompts "last-garden" \
     --iterations 2

   # Test scene-content prompts
   pnpm tsx tests/iteration-testing/novels/scene-content-test.ts \
     --control v1.0 \
     --experiment v1.1 \
     --prompts "last-garden" \
     --iterations 2
   ```

## 🎯 Test Design

### Scene Summary Test
- **Pre-data**: Story, characters, settings, part, chapter (shared)
- **Test**: Generate 5 scene summaries with v1.0, then v1.1
- **Metrics**: 
  - Phase distribution balance
  - Emotional beat assignment
  - Pacing rhythm
- **Comparison**: Same chapter, different prompt versions

### Scene Content Test
- **Pre-data**: Story, characters, settings, part, chapter, scene summaries (shared)
- **Test**: Generate scene content with v1.0, then v1.1
- **Metrics**:
  - Word count compliance
  - Cycle alignment
  - Emotional resonance
- **Comparison**: Same scene summaries, different prompt versions

## 📊 Expected Improvements

### Scene Summary v1.1 Goals
- Better phase distribution (all 5 phases represented)
- More varied emotional beats
- Clearer pacing progression
- More specific sensory anchors

### Scene Content v1.1 Goals
- Better word count compliance per phase
- Stronger cycle phase alignment
- Enhanced emotional resonance
- Improved prose quality

## 🔧 Technical Notes

### Prompt Version Resolution
- v1.0: Uses default prompts from `prompt-manager.ts`
- v1.1: Loads from `prompts/v1.1/scene-*-prompt.js` files
- Path resolution: `__dirname/../prompts/v1.1/`

### Test Execution Flow
1. Generate pre-data once per iteration
2. Generate scenes with control version
3. Evaluate control scenes
4. Delete control scenes
5. Generate scenes with experiment version (same pre-data)
6. Evaluate experiment scenes
7. Compare metrics and generate report

