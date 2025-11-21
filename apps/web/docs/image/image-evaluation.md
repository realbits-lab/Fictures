# Image Evaluation Guide: Quality Metrics & Performance

## Overview

This document specifies quality metrics, performance benchmarks, and testing strategies for the image generation and optimization system.

**Related Documents:**
- 📖 **Specification** (`image-specification.md`): Core concepts, data model, architecture
- 📋 **Development Guide** (`image-development.md`): API specifications, implementation

---

## Part I: Quality Metrics

### 1.1 Image Generation Quality

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Aspect Ratio Accuracy** | Validates generated image matches expected aspect ratio | ±0.5% deviation | Critical failure if > 1% | Automated dimension check |
| **Resolution Compliance** | Validates image dimensions match specification | Exact match | Critical failure if incorrect | Automated dimension validation |
| **Prompt Adherence** | Measures how well image matches text prompt | > 90% match | Warning if < 85% | Automated AI evaluation |
| **Format Validation** | Validates image is in correct format (PNG original) | 100% PNG | Critical failure if wrong format | Automated file type check |
| **File Size** | Validates original image size is reasonable | 200-400KB | Warning if > 500KB | Automated file size check |

### 1.2 Optimization Quality

**Compression Metrics**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **AVIF Compression Ratio** | Size reduction vs original PNG | 93-97% reduction | Warning if < 90% | Automated size comparison |
| **AVIF Quality Setting** | AVIF encoder quality parameter | 75 | Fixed parameter | Configuration validation |

**Target File Sizes (AVIF-Only)**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **AVIF Mobile 1x** | File size for 832×464 (16:9) AVIF | ~15KB | Warning if > 20KB | Automated size check |
| **AVIF Mobile 2x** | File size for 1664×928 (16:9) AVIF | ~30KB | Warning if > 40KB | Automated size check |
| **Total Per Image** | Combined size of 2 AVIF variants | ~45KB | Warning if > 60KB | Automated total calculation |

### 1.3 Visual Quality Assessment

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Aspect Ratio Preservation** | Variants maintain unified aspect ratio | ±0.1% deviation | Critical failure if > 0.5% | Automated ratio calculation |
| **Variant Count** | Correct number of variants generated | 2 AVIF variants (1x + 2x) | Critical failure if ≠ 2 | Automated count validation |
| **Format Validation** | All variants are AVIF format | 100% AVIF | Critical failure if not AVIF | Automated format check |
| **Resolution Distribution** | Correct size mix in variants | 1x + 2x resolutions | Critical failure if incorrect | Automated resolution check |
| **Image Accessibility** | All variant URLs are accessible | 100% accessible | Critical failure if any unreachable | Automated HTTP check |

**Visual Quality Scoring Scale** (1-5):

- **5 = Exceptional** - Professional-grade, no visible compression artifacts
- **4 = High** - Minor artifacts only visible on close inspection
- **3 = Acceptable** - Meets minimum standards, suitable for web
- **2 = Poor** - Visible artifacts, quality degradation
- **1 = Unacceptable** - Severe quality loss, unusable

---

## Part II: Performance Benchmarks

### 2.1 Generation Performance

**Gemini 2.5 Flash**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Single Image Generation** | Time to generate one image | 8-10s | Warning if > 15s, Critical if > 20s | Automated timing measurement |
| **Image Optimization** | Time to create 2 AVIF variants | +1-2s | Warning if > 3s, Critical if > 4s | Automated timing measurement |
| **Total Generation Time** | End-to-end image creation | 9-12s | Warning if > 16s, Critical if > 22s | Automated timing measurement |
| **Success Rate** | Percentage of successful generations | > 95% | Warning if < 90%, Critical if < 85% | Automated success tracking |
| **95th Percentile Time** | 95% of generations complete within | < 20s | Critical if > 25s | Automated percentile calculation |

**AI Server (Qwen-Image)**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Single Image Generation** | Time to generate one image | 3-4s | Warning if > 6s, Critical if > 8s | Automated timing measurement |
| **Image Optimization** | Time to create 2 AVIF variants | +1-2s | Warning if > 3s, Critical if > 4s | Automated timing measurement |
| **Total Generation Time** | End-to-end image creation | 4-6s | Warning if > 9s, Critical if > 12s | Automated timing measurement |
| **Success Rate** | Percentage of successful generations | > 95% | Warning if < 90%, Critical if < 85% | Automated success tracking |
| **95th Percentile Time** | 95% of generations complete within | < 9s | Critical if > 12s | Automated percentile calculation |

### 2.2 Loading Performance

**Network Performance Metrics**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **3G Load Time (Original)** | 300KB PNG load on 3G (0.4 Mbps) | 6.0s baseline | N/A - baseline measurement | Automated network simulation |
| **3G Load Time (AVIF 1x)** | 10KB AVIF load on 3G (0.4 Mbps) | 0.2s (30× faster) | Warning if > 0.5s | Automated network simulation |
| **4G Load Time (Original)** | 300KB PNG load on 4G (4 Mbps) | 0.6s baseline | N/A - baseline measurement | Automated network simulation |
| **4G Load Time (AVIF 1x)** | 10KB AVIF load on 4G (4 Mbps) | 0.02s (30× faster) | Warning if > 0.1s | Automated network simulation |
| **WiFi Load Time (Original)** | 300KB PNG load on WiFi (50 Mbps) | 0.05s baseline | N/A - baseline measurement | Automated network simulation |
| **WiFi Load Time (AVIF 1x)** | 10KB AVIF load on WiFi (50 Mbps) | < 0.01s (5× faster) | Warning if > 0.05s | Automated network simulation |

**Lighthouse Core Web Vitals**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Performance Score** | Overall Lighthouse performance score | > 90 | Warning if < 85, Critical if < 80 | Automated Lighthouse audit |
| **LCP (Largest Contentful Paint)** | Time to render largest content element | < 2.5s | Warning if > 3.0s, Critical if > 4.0s | Automated Lighthouse audit |
| **CLS (Cumulative Layout Shift)** | Visual stability during page load | < 0.1 | Warning if > 0.15, Critical if > 0.25 | Automated Lighthouse audit |
| **FID (First Input Delay)** | Time to first user interaction | < 100ms | Warning if > 200ms, Critical if > 300ms | Automated Lighthouse audit |
| **TBT (Total Blocking Time)** | Sum of blocking time during load | < 200ms | Warning if > 400ms, Critical if > 600ms | Automated Lighthouse audit |

### 2.3 Storage Efficiency

**Per Image Storage Metrics**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Original Image Size** | Size of original PNG image | ~300KB | Warning if > 400KB | Automated file size check |
| **Variants Total Size** | Combined size of 2 AVIF variants | ~45KB | Warning if > 60KB | Automated total calculation |
| **Storage Ratio** | Variants size as % of original | ~15% | Warning if > 20% | Automated percentage calculation |
| **Compression Efficiency** | Storage reduction from optimization | ~85% reduction | Warning if < 80% | Automated percentage calculation |

**Per Story Storage Metrics** (50 scenes):

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Original Images Only** | 500 images × 300KB | 150MB | N/A - baseline | Automated calculation |
| **Optimized Variants** | 500 images × 45KB | 22.5MB | Warning if > 30MB | Automated calculation |
| **Total Storage** | Original + variants | 172.5MB | Warning if > 200MB | Automated calculation |
| **Incremental Cost** | Additional storage for variants | +15% | N/A - low overhead | Automated percentage |

**Cost Efficiency Metrics**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Storage Cost (1000 images)** | Monthly Vercel Blob cost | ~$0.017/month | N/A - very low cost | Automated cost calculation |
| **Bandwidth Savings** | AVIF vs original PNG bandwidth | 93% reduction | Warning if < 85% | Automated bandwidth tracking |
| **Cost per User Session** | Average cost per reader | < $0.001 | N/A - negligible | Automated session cost calc |

---

## Part III: Testing Strategies

### 3.1 Automated Unit Testing

**Image Generation Service Tests**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **Aspect Ratio Selection** | Validates correct aspect ratio for image type | 100% correct | Critical failure if wrong | Automated unit test |
| **Provider Dimensions** | Validates provider-specific dimensions | Exact match | Critical failure if mismatch | Automated unit test |
| **Metadata Completeness** | Validates all required metadata fields present | 100% complete | Critical failure if missing | Automated unit test |
| **Optimized Set Structure** | Validates optimizedSet contains 2 AVIF variants | Exactly 2 variants | Critical failure if ≠ 2 | Automated unit test |

**Image Optimization Service Tests**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **Variant Count** | Validates 2 AVIF variants generated (1x + 2x) | Exactly 2 | Critical failure if ≠ 2 | Automated unit test |
| **Format Validation** | Validates all variants are AVIF | 100% AVIF | Critical failure if not AVIF | Automated unit test |
| **Aspect Ratio Preservation** | Validates variants maintain unified aspect ratio | ±0.1% deviation | Critical failure if > 0.5% | Automated unit test |
| **File Size Reduction** | Validates AVIF 1x < 20KB and > 10KB | Within range | Warning if out of range | Automated unit test |
| **Resolution Distribution** | Validates 1x + 2x variants | Correct mix | Critical failure if wrong | Automated unit test |

### 3.2 Automated Integration Testing

**End-to-End Image Generation Flow**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **Image Generation UI** | Validates image generation button triggers process | Success | Critical failure if error | Automated E2E test |
| **Image Display** | Validates generated image displays correctly | Visible | Critical failure if not visible | Automated E2E test |
| **AVIF Source Presence** | Validates AVIF source in picture element | Present | Critical failure if missing | Automated E2E test |
| **Responsive srcset** | Validates srcset contains 1x and 2x variants | Both present | Critical failure if missing | Automated E2E test |
| **Generation Timeout** | Validates generation completes within time limit | < 25s | Critical failure if > 25s | Automated E2E test |

### 3.3 Automated Performance Testing

**Core Web Vitals Monitoring**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **LCP Measurement** | Measures Largest Contentful Paint time | < 2.5s | Warning if > 3.0s, Critical if > 4.0s | Automated performance test |
| **Network Throttling (4G)** | Tests image load on 4G simulation | < 0.1s | Warning if > 0.2s | Automated network simulation |
| **Network Throttling (3G)** | Tests image load on 3G simulation | < 0.5s | Warning if > 1.0s | Automated network simulation |
| **Image Decode Time** | Measures time to decode AVIF/JPEG | < 50ms | Warning if > 100ms | Automated timing measurement |
| **Total Page Load Time** | Measures complete page load with images | < 3.0s | Warning if > 4.0s, Critical if > 5.0s | Automated performance test |

### 3.4 Automated Visual Regression Testing

**Visual Consistency Tests**:

| Test Case | Description | Target | Threshold | Method |
|-----------|-------------|--------|-----------|--------|
| **Mobile Screenshot Comparison** | Compares mobile rendering to baseline | > 95% similarity | Warning if < 90% | Automated screenshot diff |
| **Desktop Screenshot Comparison** | Compares desktop rendering to baseline | > 95% similarity | Warning if < 90% | Automated screenshot diff |
| **Cross-Browser AVIF Support** | Validates AVIF loads in supporting browsers | 100% success | Critical failure if fails | Automated browser testing |
| **Responsive Layout** | Validates correct variant loads per viewport | Correct variant | Critical failure if wrong | Automated responsive test |
| **Legacy Browser Behavior** | Validates fallback to original PNG in unsupported browsers | Graceful fallback | Warning if broken | Automated browser testing |

---

## Part IV: Quality Assurance Checklist

### 4.1 Pre-Deployment Checklist

**Image Generation**:
- [ ] Gemini API key configured
- [ ] AI Server endpoint configured (if using)
- [ ] Aspect ratios tested for all image types
- [ ] Provider fallback working
- [ ] Placeholder images available

**Optimization**:
- [ ] 2 AVIF variants generated for each image
- [ ] AVIF quality acceptable (quality 75)
- [ ] File sizes within targets (~15KB 1x, ~30KB 2x)
- [ ] Vercel Blob uploads successful
- [ ] Unified dimensions matching Qwen sizes

**Frontend**:
- [ ] OptimizedImage component rendering correctly
- [ ] `<picture>` element with AVIF source
- [ ] AVIF served to modern browsers (93.8% coverage)
- [ ] Graceful fallback to original PNG for legacy browsers
- [ ] Lazy loading working
- [ ] Priority loading for above-fold images

**Performance**:
- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s
- [ ] Total image weight per page acceptable
- [ ] CDN caching configured

### 4.2 Monitoring Dashboard

**Generation Metrics**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Success Rate** | Percentage of successful generations | > 95% | Warning if < 90%, Critical if < 85% | Automated tracking |
| **Average Generation Time** | Mean time to generate image | 8-10s (Gemini), 3-4s (AI Server) | Warning if > targets | Automated timing |
| **Failure Reasons** | Categorized failure counts | N/A - diagnostic | N/A - for analysis | Automated error logging |
| **Provider Status** | Active provider (gemini/ai-server) | N/A - informational | N/A - monitoring | Automated status check |

**Optimization Metrics**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Average Optimization Time** | Mean time to create 2 AVIF variants | 1-2s | Warning if > 3s, Critical if > 4s | Automated timing |
| **Average AVIF 1x Size** | Mean file size for AVIF mobile 1x | ~15KB | Warning if > 20KB | Automated size tracking |
| **Average AVIF 2x Size** | Mean file size for AVIF mobile 2x | ~30KB | Warning if > 40KB | Automated size tracking |
| **Compression Ratio** | Average size reduction vs original | 85% reduction | Warning if < 80% | Automated calculation |
| **Variant Format Distribution** | Percentage of variants that are AVIF | 100% AVIF | Critical if not 100% | Automated format tracking |

**Loading Metrics**:

| Metric | Description | Target | Threshold | Method |
|--------|-------------|--------|-----------|--------|
| **Average LCP** | Mean Largest Contentful Paint time | < 2.5s | Warning if > 3.0s, Critical if > 4.0s | Automated LCP tracking |
| **Cache Hit Rate** | Percentage served from cache | > 80% | Warning if < 70% | Automated cache analytics |
| **AVIF Distribution** | Percentage served as AVIF | 100% (all variants) | Critical if < 100% | Automated format tracking |
| **Browser Support Coverage** | Percentage of users with AVIF support | > 93% | Informational | Automated browser analytics |
| **CDN Cache Hit Rate** | Percentage served from CDN cache | > 90% | Warning if < 80% | Automated CDN analytics |

