# Image Iteration Testing Infrastructure

This testing infrastructure implements a systematic approach to improving the image generation system through data-driven prompt refinement and metric calibration.

## Overview

The image iteration testing system evaluates image generation quality using 4 weighted quality categories:

1. **Generation Quality** (30%) - Prompt adherence, aspect ratio, resolution
2. **Optimization Quality** (25%) - Compression efficiency, file sizes
3. **Visual Quality** (25%) - Visual assessment, artifact detection
4. **Performance** (20%) - Generation time, success rate

**Passing Score**: 3.0/5.0 weighted average

## Directory Structure

```
tests/iteration-testing/images/
├── config/                    # Configuration files
│   └── test-scenarios.ts     # Test scenario definitions
├── src/                       # Source code
│   ├── types.ts              # TypeScript type definitions
│   └── metrics-tracker.ts    # Metrics aggregation utilities
├── results/                   # Test results (gitignored)
│   ├── v1.0/                 # Results for prompt v1.0
│   ├── v1.1/                 # Results for prompt v1.1
│   └── ...                   # Additional versions
├── reports/                   # Generated reports (gitignored)
├── run-image-tests.ts        # Main evaluation script
├── ab-test-images.ts         # A/B testing script
└── README.md                 # This file
```

## Test Scenarios

We use 5 standardized test scenarios, each designed to test specific aspects:

| Scenario ID | Name | Focus Areas | Challenge |
|-------------|------|-------------|-----------|
| `story-cover` | Story Cover Image | Composition, genre accuracy | Create compelling cover that represents story |
| `character-portrait` | Character Portrait | Character accuracy, expression | Match character description precisely |
| `setting-landscape` | Setting Landscape | Atmosphere, detail richness | Convey mood and setting through visuals |
| `scene-action` | Action Scene | Dynamic composition, clarity | Show action clearly with good composition |
| `emotional-moment` | Emotional Moment | Emotional expression, mood | Capture emotional nuance visually |

## Key Metrics

### Generation Quality (30% weight)

| Metric | Target | Threshold | Why It Matters |
|--------|--------|-----------|----------------|
| **Aspect Ratio Accuracy** | ±0.5% deviation | <1% | Correct aspect ratio for image type |
| **Resolution Compliance** | Exact match | Critical failure if wrong | Proper dimensions for display |
| **Prompt Adherence** | >90% match | >85% | Image matches intended description |
| **Format Validation** | 100% PNG | Critical failure if wrong | Correct file format |

### Optimization Quality (25% weight)

| Metric | Target | Threshold | Why It Matters |
|--------|--------|-----------|----------------|
| **AVIF Compression Ratio** | 93-97% reduction | >90% | Efficient file size reduction |
| **AVIF Mobile 1x Size** | ~15KB | <20KB | Fast mobile loading |
| **AVIF Mobile 2x Size** | ~30KB | <40KB | High-res mobile support |
| **Total Variant Size** | ~45KB | <60KB | Storage efficiency |

### Visual Quality (25% weight)

| Metric | Target | Threshold | Why It Matters |
|--------|--------|-----------|----------------|
| **Visual Quality Score** | 4.0/5.0 | 3.0/5.0 | Professional appearance |
| **Artifact Detection** | 0 artifacts | <2 minor | Clean, professional output |
| **Aspect Ratio Preservation** | ±0.1% deviation | <0.5% | Consistent across variants |
| **Variant Count** | 2 variants | Exactly 2 | Proper optimization |

### Performance (20% weight)

| Metric | Target | Threshold | Why It Matters |
|--------|--------|-----------|----------------|
| **Generation Time** | 8-10s (Gemini) / 3-4s (AI Server) | <15s / <8s | Fast user experience |
| **Success Rate** | >95% | >90% | Reliable generation |
| **Optimization Time** | +1-2s | <3s | Quick optimization |

## Getting Started

### Prerequisites

1. Ensure the development server is running:
```bash
cd apps/web
dotenv --file .env.local run pnpm dev  # Port 3000
```

2. Ensure image API is available:
```bash
# Test image endpoint
curl http://localhost:3000/api/studio/images -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"prompt": "A mysterious forest", "contentId": "test", "imageType": "story"}'
```

### Phase 1: Baseline Establishment

#### Step 1: Generate Baseline Images

Run the evaluation suite to generate and evaluate images:

```bash
# Generate 5 images for each of the 5 test scenarios (25 total)
dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/run-image-tests.ts \
  --version v1.0 \
  --scenarios "story-cover,character-portrait,setting-landscape,scene-action,emotional-moment" \
  --iterations 5 \
  --mode standard \
  --output results/v1.0/baseline.json
```

**Options:**
- `--version`: Prompt version to test (default: v1.0)
- `--scenarios`: Comma-separated scenario IDs (default: all 5)
- `--iterations`: Images per scenario (default: 5)
- `--mode`: Evaluation mode - quick|standard|thorough (default: standard)
- `--output`: Output file path

**Expected Output:**
- 25 images generated (5 scenarios × 5 iterations)
- Full evaluation for each image
- Results saved to `results/v1.0/baseline.json`
- Execution time: ~5-10 minutes for standard mode

#### Step 2: Analyze Baseline Metrics

The evaluation suite automatically:
- Aggregates metrics across all images
- Identifies failure patterns
- Generates summary statistics

Review the output file for:
- Overall weighted scores
- Category-specific failures
- Performance metrics
- Top priority issues to address

### Phase 2: Prompt Optimization

#### Step 3: A/B Test Improvements

After identifying issues from baseline testing, create prompt refinements:

```bash
# Example: Test improvements to prompt adherence
dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/images/ab-test-images.ts \
  --control v1.0 \
  --experiment v1.1 \
  --scenarios "character-portrait,emotional-moment" \
  --sample-size 5 \
  --hypothesis "Improve prompt adherence from 85% to 90%+"
```

**Options:**
- `--control`: Control version (baseline)
- `--experiment`: Experiment version (with improvements)
- `--scenarios`: Test scenarios to use
- `--sample-size`: Images per version
- `--hypothesis`: What you expect to improve

**Expected Output:**
- Statistical comparison (t-test)
- Metric deltas (improvements and regressions)
- Recommendation: ADOPT | REVISE | REVERT
- Detailed markdown report

## Metrics Reference

### Critical Thresholds

| Metric | Excellent | Good | Needs Work | Critical |
|--------|-----------|------|------------|----------|
| **Weighted Score** | ≥4.0 | ≥3.5 | ≥3.0 | <3.0 |
| **Prompt Adherence** | >95% | >90% | >85% | ≤85% |
| **AVIF Compression** | >95% | >93% | >90% | ≤90% |
| **Generation Time** | <8s | <12s | <15s | ≥15s |
| **Success Rate** | >98% | >95% | >90% | ≤90% |

## Evaluation Modes

- **`quick`**: Automated metrics only (~10 sec/image)
- **`standard`**: Balanced automated + AI (~30 sec/image) **[Default]**
- **`thorough`**: Comprehensive analysis (~60 sec/image)

Use `standard` for most testing, `thorough` for final validation, `quick` for rapid iteration.

## Best Practices

1. **Establish baseline first** - Run v1.0 tests before making changes
2. **Test one aspect at a time** - Isolate variables (e.g., prompt improvements only)
3. **Use sufficient sample size** - Minimum 5 images per version
4. **Check for regressions** - Don't improve one metric at expense of others
5. **Document everything** - Track hypotheses, changes, and decisions
6. **Wait for significance** - p-value < 0.05 before adopting changes

## Troubleshooting

### Issue: Image API not responding

**Solution**: Ensure dev server running on port 3000
```bash
dotenv --file .env.local run pnpm dev
curl http://localhost:3000/api/studio/images  # Should return 400 or 401
```

### Issue: Generation timeout

**Solution**: Check AI Server or Gemini API status
- Gemini: May take 8-15s per image
- AI Server: Should be 3-6s per image
- Check logs: `curl http://localhost:8000/health`

### Issue: Results not significant

**Solution**: Increase sample size
- Minimum 5 images per version
- For smaller effects, use 10+ images

## Next Steps

After setting up the infrastructure:

1. Complete Phase 1 baseline testing (5 scenarios × 5 iterations = 25 images)
2. Prioritize top 3 failure patterns (likely: prompt adherence, visual quality, performance)
3. Begin Phase 2 optimization cycles
4. Run monthly iteration cycles after initial optimization

For detailed methodology, see:
- `apps/web/docs/image/image-evaluation.md` - Metrics and evaluation framework
- `apps/web/docs/image/image-development.md` - API specifications and implementation
- `apps/web/docs/image/image-specification.md` - Core concepts and architecture

