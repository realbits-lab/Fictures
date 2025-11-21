# Comics Panel Image Evaluation Guide: Quality Metrics & Performance

## Overview

This document specifies quality metrics, performance benchmarks, and testing strategies for comic panel image generation and optimization. It focuses on the visual quality of generated webtoon panel images.

**Related Documents:**
- **Specification** (`comics-specification.md`): Core concepts, data model, architecture
- **Development Guide** (`comics-development.md`): API specifications, implementation
- **Toonplay Evaluation** (`../toonplay/toonplay-evaluation.md`): Script/content quality metrics

**Note**: This document covers **image quality** for comic panels. For toonplay script quality (narrative fidelity, visual transformation, pacing), see `toonplay-evaluation.md`.

---

## Part I: Comic Panel Image Quality Metrics

### 1.1 Generation Quality

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Aspect Ratio Accuracy** | Validates 9:16 vertical webtoon ratio (928×1664) | ±0.5% deviation | Critical failure if > 1% | Automated dimension check |
| **Resolution Compliance** | Validates panel dimensions match specification | Exact 928×1664 | Critical failure if incorrect | Automated dimension validation |
| **Format Validation** | Validates image format (PNG original) | 100% PNG | Critical failure if wrong format | Automated file type check |
| **Prompt Adherence** | Measures how well image matches panel description | > 85% match | Warning if < 80% | Automated AI evaluation |
| **File Size** | Validates original panel image size | 200-400KB | Warning if > 500KB | Automated file size check |

### 1.2 Comic-Specific Visual Quality

**Character Rendering Quality**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Expression Accuracy** | Facial expression matches emotional beat | Score 4-5/5 | Warning if < 3/5 | AI evaluation |
| **Body Language Clarity** | Pose communicates emotion/action clearly | Score 4-5/5 | Warning if < 3/5 | AI evaluation |
| **Character Consistency** | Same character recognizable across panels | > 85% similarity | Warning if < 80% | AI comparison |
| **Emotion Visibility** | Emotion readable without text | Score 4-5/5 | Warning if < 3/5 | AI evaluation |

**Style Consistency Quality**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Webtoon Style Adherence** | Matches webtoon/manhwa visual style | Score 4-5/5 | Warning if < 3/5 | AI evaluation |
| **Linework Quality** | Clean, professional linework | Score 4-5/5 | Warning if < 3/5 | AI evaluation |
| **Color Vibrancy** | Vibrant colors appropriate for webtoon | Score 4-5/5 | Warning if < 3/5 | AI evaluation |
| **Lighting Consistency** | Coherent lighting within scene | Score 4-5/5 | Warning if < 3/5 | AI evaluation |

**Shot Type Adherence Quality**:

| Shot Type | Key Characteristics | Quality Criteria |
|-----------|---------------------|------------------|
| **wide_shot** | Full environment visible, characters in context | Environment detail, spatial relationships, atmosphere |
| **medium_shot** | Waist-up framing, character interaction focus | Character poses, interaction clarity, background context |
| **close_up** | Face/detail focus, emotional emphasis | Expression detail, emotion clarity, dramatic impact |
| **extreme_close_up** | Single feature emphasis (eyes, hands) | Detail sharpness, emotional impact, symbolic resonance |
| **establishing_shot** | Scene-setting, location introduction | Environmental detail, atmosphere, mood setting |
| **over_shoulder** | Conversation framing, POV indication | Clear speaker/listener, spatial relationship, intimacy |

### 1.3 Visual Quality Scoring Scale (1-5)

| Score | Level | Definition | Example |
|-------|-------|------------|---------|
| **5** | Exceptional | Professional-grade, publication-ready | Clear expression, perfect composition, style-consistent |
| **4** | High | Minor improvements only | Good expression, solid composition, slight style variance |
| **3** | Acceptable | Meets minimum standards | Readable emotion, adequate composition, usable |
| **2** | Poor | Significant issues | Unclear expression, weak composition, style inconsistent |
| **1** | Unacceptable | Fundamental rework required | Wrong emotion, broken composition, unusable |

### 1.4 Optimization Quality

**Compression Metrics**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **AVIF Compression Ratio** | Size reduction vs original PNG | 90-95% reduction | Warning if < 85% | Automated size comparison |
| **AVIF Quality Setting** | AVIF encoder quality parameter | 75 | Fixed parameter | Configuration validation |

**Target File Sizes (AVIF-Only for Comic Panels)**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **AVIF Mobile 1x** | File size for 464×832 (9:16) AVIF | ~18KB | Warning if > 25KB | Automated size check |
| **AVIF Mobile 2x** | File size for 928×1664 (9:16) AVIF | ~35KB | Warning if > 50KB | Automated size check |
| **Total Per Panel** | Combined size of 2 AVIF variants | ~53KB | Warning if > 75KB | Automated total calculation |

---

## Part II: Testing Strategies

### 2.1 Automated Unit Testing

**Panel Generation Service Tests**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **Aspect Ratio Validation** | Validates 9:16 vertical ratio (928×1664) | Exact match | Critical failure if wrong | Automated unit test |
| **Shot Type Parameter** | Validates shot type passed to generator | 100% correct | Critical failure if missing | Automated unit test |
| **Metadata Completeness** | Validates panel metadata fields present | 100% complete | Critical failure if missing | Automated unit test |
| **Optimized Set Structure** | Validates optimizedSet contains 2 AVIF variants | Exactly 2 variants | Critical failure if ≠ 2 | Automated unit test |

**Panel Optimization Service Tests**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **Variant Count** | Validates 2 AVIF variants generated (1x + 2x) | Exactly 2 | Critical failure if ≠ 2 | Automated unit test |
| **Format Validation** | Validates all variants are AVIF | 100% AVIF | Critical failure if not AVIF | Automated unit test |
| **Aspect Ratio Preservation** | Validates variants maintain 9:16 ratio | ±0.1% deviation | Critical failure if > 0.5% | Automated unit test |
| **File Size Compliance** | Validates AVIF 1x < 25KB | Within range | Warning if out of range | Automated unit test |

### 2.2 Integration Testing

**End-to-End Panel Generation Flow**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **Panel Generation API** | Validates API generates panel image | Success | Critical failure if error | Automated E2E test |
| **Panel Display** | Validates generated panel displays correctly | Visible | Critical failure if not visible | Automated E2E test |
| **AVIF Source Presence** | Validates AVIF source in picture element | Present | Critical failure if missing | Automated E2E test |
| **Responsive srcset** | Validates srcset contains 1x and 2x variants | Both present | Critical failure if missing | Automated E2E test |
| **Generation Timeout** | Validates generation completes within limit | < 30s | Critical failure if > 30s | Automated E2E test |

**Character Consistency Testing**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **Same Character Recognition** | Character recognizable across panel sequence | > 85% similarity | Warning if < 80% | AI comparison |
| **Expression Progression** | Emotional progression coherent across panels | Score 4-5/5 | Warning if < 3/5 | AI evaluation |
| **Outfit Consistency** | Character clothing consistent across scene | > 90% match | Warning if < 85% | AI comparison |

### 2.3 Performance Testing

**Generation Performance Tests**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **Single Panel Timing** | Measures time to generate one panel | 12-16s | Warning if > 20s | Automated timing |
| **Batch Panel Timing** | Measures time to generate scene (10 panels) | 2-3 min | Warning if > 4 min | Automated timing |
| **Success Rate Tracking** | Tracks percentage of successful generations | > 95% | Warning if < 90% | Automated tracking |
| **95th Percentile Calculation** | 95% of panels complete within threshold | < 20s | Critical if > 25s | Automated percentile |

**Network Performance Tests**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **4G Network Throttling** | Tests panel load on 4G simulation | < 0.1s | Warning if > 0.2s | Automated network simulation |
| **3G Network Throttling** | Tests panel load on 3G simulation | < 0.8s | Warning if > 1.5s | Automated network simulation |
| **Scene Load (Vertical Scroll)** | Tests loading 10 panels sequentially | < 1.0s total | Warning if > 2.0s | Automated scroll simulation |

### 2.4 Visual Quality Testing

**Automated Visual Quality Assessment**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **Style Consistency Check** | Validates webtoon style across panels | Score 4-5/5 | Warning if < 3/5 | AI evaluation |
| **Composition Quality Check** | Validates visual hierarchy and focal point | Score 4-5/5 | Warning if < 3/5 | AI evaluation |
| **Expression Accuracy Check** | Validates emotion matches description | Score 4-5/5 | Warning if < 3/5 | AI evaluation |
| **Shot Type Adherence Check** | Validates panel matches shot type spec | Score 4-5/5 | Warning if < 3/5 | AI evaluation |

**Visual Regression Testing**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **Mobile Screenshot Comparison** | Compares mobile rendering to baseline | > 95% similarity | Warning if < 90% | Automated screenshot diff |
| **Vertical Scroll Rendering** | Validates panels render correctly in scroll | 100% correct | Critical failure if broken | Automated scroll test |
| **Cross-Browser AVIF Support** | Validates AVIF loads in supporting browsers | 100% success | Critical failure if fails | Automated browser testing |

---

## Part III: Quality Assurance Checklist

### 3.1 Pre-Deployment Checklist

**Panel Generation**:
- [ ] AI Server endpoint configured for image generation
- [ ] API key authentication working
- [ ] 9:16 aspect ratio (928×1664) correctly applied
- [ ] Shot type parameters passed to generator
- [ ] Placeholder panels available for failures

**Panel Optimization**:
- [ ] 2 AVIF variants generated for each panel
- [ ] AVIF quality acceptable (quality 75)
- [ ] File sizes within targets (~18KB 1x, ~35KB 2x)
- [ ] Vercel Blob uploads successful
- [ ] Vertical aspect ratio preserved in variants

**Frontend**:
- [ ] Comic reader component rendering panels correctly
- [ ] `<picture>` element with AVIF source
- [ ] AVIF served to modern browsers (93.8% coverage)
- [ ] Graceful fallback to original PNG for legacy browsers
- [ ] Lazy loading for off-screen panels
- [ ] Priority loading for visible panels

**Performance**:
- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s for comic reader
- [ ] Smooth vertical scrolling on mobile
- [ ] CDN caching configured for panels

### 3.2 Monitoring Dashboard

**Generation Metrics**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Panel Success Rate** | Percentage of successful panel generations | > 95% | Warning if < 90%, Critical if < 85% | Automated tracking |
| **Average Generation Time** | Mean time to generate panel | 12-16s | Warning if > 20s | Automated timing |
| **Failure Reasons** | Categorized failure counts | N/A - diagnostic | N/A - for analysis | Automated error logging |
| **Queue Depth** | Pending panel generation requests | < 10 | Warning if > 20 | Automated queue monitoring |

**Quality Metrics**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Average Style Score** | Mean webtoon style adherence score | 4-5/5 | Warning if < 3.5/5 | AI evaluation |
| **Average Composition Score** | Mean visual hierarchy score | 4-5/5 | Warning if < 3.5/5 | AI evaluation |
| **Character Consistency Rate** | Percentage of consistent character renders | > 85% | Warning if < 80% | AI comparison |
| **Expression Accuracy Rate** | Percentage of accurate emotion renders | > 85% | Warning if < 80% | AI evaluation |

**Loading Metrics**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Average Panel LCP** | Mean time to render panel | < 2.5s | Warning if > 3.0s | Automated LCP tracking |
| **Cache Hit Rate** | Percentage served from cache | > 80% | Warning if < 70% | Automated cache analytics |
| **AVIF Distribution** | Percentage served as AVIF | 100% (all variants) | Critical if < 100% | Automated format tracking |
| **Mobile Scroll Performance** | Frames per second during scroll | > 30 fps | Warning if < 24 fps | Automated FPS tracking |

---

## Part IV: Iteration Testing Framework

### 4.1 5-Cycle Testing Methodology

The comics iteration testing uses progressive prompt enhancement cycles aligned with quality evaluation criteria:

**Cycle Structure**:

| Cycle | Focus Area | Weight | Prompt Enhancements |
|-------|------------|--------|---------------------|
| 1 | Baseline | - | None (establish baseline metrics) |
| 2 | Visual Transformation | 30% | Expressive body language, character emotion through pose, environmental mood lighting |
| 3 | Webtoon Pacing | 30% | Clear visual hierarchy, single focal point, thumb-scroll optimization |
| 4 | Narrative Fidelity | 20% | Detailed facial expressions, emotional nuance, dramatic tension |
| 5 | Production Quality | All | Combined: professional webtoon, expressive poses, cinematic lighting, clear hierarchy |

### 4.2 Expected Performance Targets

Based on iteration testing results:

| Metric | Baseline (Cycle 1) | Target (Cycle 5) | Acceptable Range |
|--------|-------------------|------------------|------------------|
| **Success Rate** | 100% | 100% | > 95% |
| **Avg Generation Time** | 15.0s | 14.2s | 12-18s |
| **Min Generation Time** | 12.3s | 12.3s | > 10s |
| **Max Generation Time** | 16.4s | 16.4s | < 25s |

### 4.3 Running Iteration Tests

```bash
# Run evaluation-based 5-cycle comics iteration testing
dotenv --file .env.local run pnpm exec tsx tests/iteration-testing/run-5-cycle-comics.ts

# Output locations
# Results: results/5-cycle-comics-evaluation/all-cycles-*.json
# Report: results/5-cycle-comics-evaluation/comics-eval-report-*.md
```

---

## Conclusion

The comics panel image evaluation system ensures quality through:

1. **Comic-Specific Visual Metrics**: Style consistency, character rendering, shot type adherence
2. **Performance Benchmarks**: Generation time (12-16s), loading time, storage efficiency
3. **Automated Testing**: Unit tests, integration tests, visual quality assessment
4. **Iteration Testing**: 5-cycle methodology with progressive prompt enhancement

**Quality Targets**:
- Success rate: > 95%
- Average generation time: 12-16s
- Style consistency score: 4-5/5
- Character consistency: > 85%
- LCP: < 2.5s

**Next Steps**:
- See `comics-specification.md` for core concepts and data model
- See `comics-development.md` for API specifications and implementation
- See `../toonplay/toonplay-evaluation.md` for script/content quality metrics
