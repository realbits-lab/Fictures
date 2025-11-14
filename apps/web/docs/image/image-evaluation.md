# Image Evaluation Guide: Quality Metrics & Performance

## Overview

This document specifies quality metrics, performance benchmarks, and testing strategies for the image generation and optimization system.

**Related Documents:**
- 📖 **Specification** (`image-specification.md`): Core concepts, data model, architecture
- 📋 **Development Guide** (`image-development.md`): API specifications, implementation

---

## Part I: Quality Metrics

### 1.1 Image Generation Quality

**Evaluation Criteria**:

| Metric | Target | Measurement | Priority |
|--------|--------|-------------|----------|
| **Visual Fidelity** | High | Manual review | Critical |
| **Prompt Adherence** | > 90% | AI evaluation | High |
| **Aspect Ratio Accuracy** | ±0.5% | Automated check | Critical |
| **Resolution** | Meets spec | Dimension validation | Critical |
| **Artifact Rate** | < 5% | Manual review | Medium |

### 1.2 Optimization Quality

**Compression Metrics**:

| Format | Quality Setting | Target Size Reduction | Visual Quality |
|--------|----------------|----------------------|----------------|
| **AVIF** | 75 | 93-97% vs original PNG | Excellent |
| **JPEG** | 85 | 82-90% vs original PNG | Good |

**Target File Sizes** (per variant):

| Variant | Expected Size | Tolerance |
|---------|--------------|-----------|
| AVIF mobile 1x (672×384) | ~10KB | ±5KB |
| AVIF mobile 2x (1344×768) | ~20KB | ±10KB |
| JPEG mobile 1x (672×384) | ~30KB | ±10KB |
| JPEG mobile 2x (1344×768) | ~55KB | ±15KB |

**Total Per Image**: ~115KB for all 4 variants

### 1.3 Visual Quality Assessment

**Scoring Scale** (1-5):

```
5 = Exceptional - Professional-grade, no visible compression artifacts
4 = High - Minor artifacts only visible on close inspection
3 = Acceptable - Meets minimum standards, suitable for web
2 = Poor - Visible artifacts, quality degradation
1 = Unacceptable - Severe quality loss, unusable
```

**Manual Review Checklist**:
- [ ] Sharp focus on main subject
- [ ] No obvious compression artifacts
- [ ] Colors accurate and vibrant
- [ ] Text readable (if present)
- [ ] No banding in gradients
- [ ] Acceptable noise levels

---

## Part II: Performance Benchmarks

### 2.1 Generation Performance

**Gemini 2.5 Flash**:

| Metric | Target | Typical | Acceptable Range |
|--------|--------|---------|------------------|
| Single image | 5-15s | 8-10s | 5-20s |
| Optimization | +2-3s | +2.5s | +2-5s |
| Total time | 7-18s | 10-12s | 7-25s |

**AI Server (Qwen-Image)**:

| Metric | Target | Typical | Acceptable Range |
|--------|--------|---------|------------------|
| Single image | 2-5s | 3-4s | 2-8s |
| Optimization | +2-3s | +2.5s | +2-5s |
| Total time | 4-8s | 5-7s | 4-13s |

**Performance Goals**:
- ✅ Gemini: < 20 seconds total
- ✅ AI Server: < 10 seconds total
- ✅ 95th percentile under targets

### 2.2 Loading Performance

**Network Simulations**:

```typescript
// Test configuration
const NETWORK_PROFILES = {
  '3G': { latency: 400, downloadSpeed: 0.4, uploadSpeed: 0.4 }, // Mbps
  '4G': { latency: 100, downloadSpeed: 4, uploadSpeed: 2 },
  'WiFi': { latency: 20, downloadSpeed: 50, uploadSpeed: 25 },
};
```

**Target Loading Times**:

| Network | Original (300KB) | AVIF Mobile 1x (10KB) | Improvement |
|---------|------------------|----------------------|-------------|
| 3G (0.4 Mbps) | 6.0s | **0.2s** | **30× faster** |
| 4G (4 Mbps) | 0.6s | **0.02s** | **30× faster** |
| WiFi (50 Mbps) | 0.05s | **< 0.01s** | **5× faster** |

**Lighthouse Scores** (target):
- Performance: > 90
- LCP (Largest Contentful Paint): < 2.5s
- CLS (Cumulative Layout Shift): < 0.1

### 2.3 Storage Efficiency

**Per Image Metrics**:

```
Original PNG: 300KB
4 Optimized Variants: ~115KB total
Storage Ratio: 38% of original
Compression: 62% reduction
```

**Per Story (50 scenes with comics)**:

```
Original only: 500 images × 300KB = 150MB
With optimization: 500 × 115KB = 57.5MB
Incremental: +57.5MB for variants
Total: 207.5MB (original + variants)
```

**Cost Efficiency**:
- Vercel Blob: $0.15/GB/month
- 1,000 images: ~115MB = **$0.017/month**
- Bandwidth saved: 93% (AVIF vs original PNG)

---

## Part III: Testing Strategies

### 3.1 Unit Tests

**Image Generation Service**:

```typescript
describe('Image Generation Service', () => {
  it('should select correct aspect ratio for image type', () => {
    expect(getAspectRatioForImageType('story')).toBe('16:9');
    expect(getAspectRatioForImageType('character')).toBe('1:1');
    expect(getAspectRatioForImageType('comic-panel')).toBe('9:16');
  });

  it('should return provider-specific dimensions', () => {
    const geminiDims = getImageDimensions('gemini', '16:9');
    expect(geminiDims).toEqual({ width: 1024, height: 576 });

    const aiServerDims = getImageDimensions('ai-server', '16:9');
    expect(aiServerDims).toEqual({ width: 1664, height: 928 });
  });

  it('should generate image with correct metadata', async () => {
    const result = await generateStoryImage({
      prompt: 'test scene',
      storyId: 'test',
      imageType: 'scene',
    });

    expect(result.aspectRatio).toBe('16:9');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.optimizedSet).toBeDefined();
    expect(result.optimizedSet.variants).toHaveLength(4);
  });
});
```

**Image Optimization Service**:

```typescript
describe('Image Optimization Service', () => {
  it('should generate 4 variants (2 formats × 2 sizes)', async () => {
    const optimized = await optimizeImage(
      originalUrl,
      'test-image',
      'story-123',
      'scene'
    );

    expect(optimized.variants).toHaveLength(4);
    expect(optimized.variants.filter(v => v.format === 'avif')).toHaveLength(2);
    expect(optimized.variants.filter(v => v.format === 'jpeg')).toHaveLength(2);
    expect(optimized.variants.filter(v => v.resolution === '1x')).toHaveLength(2);
    expect(optimized.variants.filter(v => v.resolution === '2x')).toHaveLength(2);
  });

  it('should maintain aspect ratio across variants', async () => {
    const optimized = await optimizeImage(originalUrl, 'test', 'story', 'scene');

    for (const variant of optimized.variants) {
      const ratio = variant.width / variant.height;
      expect(ratio).toBeCloseTo(1.75, 1); // 7:4 = 1.75
    }
  });

  it('should reduce file size significantly', async () => {
    const optimized = await optimizeImage(originalUrl, 'test', 'story', 'scene');

    const avif1x = optimized.variants.find(v => v.format === 'avif' && v.resolution === '1x');
    expect(avif1x.size).toBeLessThan(20000); // < 20KB
    expect(avif1x.size).toBeGreaterThan(5000); // > 5KB
  });
});
```

### 3.2 Integration Tests (Playwright)

```typescript
test('Generate and display optimized image', async ({ page }) => {
  // Login as writer
  await login(page, writer.email, writer.password);

  // Navigate to story creation
  await page.goto('http://localhost:3000/studio/new');

  // Generate story cover
  await page.click('button:has-text("Generate Cover Image")');

  // Wait for generation
  await page.waitForSelector('[data-testid="cover-image"]', {
    timeout: 30000,
  });

  // Verify image loaded
  const image = page.locator('[data-testid="cover-image"] img');
  await expect(image).toBeVisible();

  // Check for AVIF source (if browser supports)
  const picture = page.locator('[data-testid="cover-image"] picture');
  const avifSource = picture.locator('source[type="image/avif"]');
  await expect(avifSource).toBeVisible();

  // Verify responsive srcset
  const srcset = await avifSource.getAttribute('srcset');
  expect(srcset).toContain('672w');
  expect(srcset).toContain('1344w');
});
```

### 3.3 Performance Testing

```typescript
test('Image loading performance', async ({ page }) => {
  // Set network throttling (4G)
  await page.route('**/*', route => route.continue());

  await page.goto('http://localhost:3000/novels/test-story');

  // Measure LCP (Largest Contentful Paint)
  const lcp = await page.evaluate(() => {
    return new Promise(resolve => {
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.renderTime || lastEntry.loadTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    });
  });

  expect(lcp).toBeLessThan(2500); // < 2.5s for LCP
});
```

### 3.4 Visual Regression Testing

```typescript
test('Visual consistency across variants', async ({ page }) => {
  await page.goto('http://localhost:3000/novels/test-story');

  // Take screenshot at mobile resolution
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'screenshots/mobile-scene.png' });

  // Take screenshot at desktop resolution
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'screenshots/desktop-scene.png' });

  // Compare with baseline (using pixelmatch or similar)
  const mobileMatch = await compareImages(
    'screenshots/mobile-scene.png',
    'baselines/mobile-scene.png'
  );
  expect(mobileMatch).toBeGreaterThan(0.95); // 95% similarity
});
```

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
- [ ] 4 variants generated for each image
- [ ] AVIF quality acceptable
- [ ] JPEG fallback working
- [ ] File sizes within targets
- [ ] Vercel Blob uploads successful

**Frontend**:
- [ ] OptimizedImage component rendering correctly
- [ ] `<picture>` element with proper sources
- [ ] AVIF served to supporting browsers
- [ ] JPEG fallback for older browsers
- [ ] Lazy loading working
- [ ] Priority loading for above-fold images

**Performance**:
- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s
- [ ] Total image weight per page acceptable
- [ ] CDN caching configured

### 4.2 Monitoring Dashboard

**Key Metrics to Track**:

```typescript
// Generation metrics
{
  successRate: number;           // % successful generations
  averageGenerationTime: number; // Seconds
  failureReasons: Record<string, number>;
  provider: 'gemini' | 'ai-server';
}

// Optimization metrics
{
  averageOptimizationTime: number; // Seconds
  averageFileSize: {
    avif1x: number;
    avif2x: number;
    jpeg1x: number;
    jpeg2x: number;
  };
  compressionRatio: number; // vs original
}

// Loading metrics
{
  averageLCP: number;        // Largest Contentful Paint
  cacheHitRate: number;      // % served from cache
  formatDistribution: {
    avif: number;            // % served as AVIF
    jpeg: number;            // % served as JPEG
  };
}
```

---

## Part V: Troubleshooting Guide

### 5.1 Common Issues

**Issue: Images not generating**
```
Symptom: API returns error or timeout
Causes:
  - Missing API key (Gemini)
  - AI Server unavailable
  - Network timeout
  - Rate limit exceeded

Solutions:
  1. Check environment variables (GOOGLE_GENERATIVE_AI_API_KEY)
  2. Verify AI Server is running (if using)
  3. Check API quota/billing
  4. Verify network connectivity
  5. Check logs for specific error messages
```

**Issue: Optimization failing**
```
Symptom: Only original image saved, no variants
Causes:
  - Sharp library error
  - Vercel Blob upload failure
  - Insufficient memory
  - Invalid image format

Solutions:
  1. Check Sharp is installed: `pnpm list sharp`
  2. Verify BLOB_READ_WRITE_TOKEN
  3. Check Vercel Blob storage limits
  4. Review server logs for Sharp errors
  5. Verify original image is valid PNG/JPEG
```

**Issue: AVIF not loading**
```
Symptom: Images always load as JPEG
Causes:
  - Browser doesn't support AVIF
  - AVIF variant missing
  - Incorrect MIME type

Solutions:
  1. Check browser support (Safari 16+, Chrome 85+)
  2. Verify AVIF variants in database
  3. Check Content-Type header
  4. Ensure <source type="image/avif"> in HTML
```

**Issue: Poor image quality**
```
Symptom: Visible compression artifacts
Causes:
  - Quality setting too low
  - Incorrect aspect ratio
  - Over-compression

Solutions:
  1. Increase quality settings (AVIF: 75 → 80, JPEG: 85 → 90)
  2. Verify aspect ratio matches expected
  3. Check original image quality
  4. Test different quality settings
```

### 5.2 Performance Debugging

**Slow Generation**:
```bash
# Enable detailed logging
DEBUG=image-generation node scripts/test-imagen-generation.mjs

# Monitor provider response times
# Check AI Server GPU usage (if using)
# Verify network latency to Gemini API
```

**Slow Loading**:
```bash
# Check Lighthouse performance
npx lighthouse http://localhost:3000/novels/test-story

# Analyze network waterfall in DevTools
# Verify CDN caching headers
# Check image sizes in Network tab
```

---

## Conclusion

The image evaluation system ensures quality through:

1. **Automated Metrics**: File size, dimensions, aspect ratios
2. **Performance Benchmarks**: Generation time, loading speed
3. **Visual Quality**: Manual review and automated checks
4. **Comprehensive Testing**: Unit, integration, E2E, visual regression
5. **Monitoring**: Real-time metrics and alerting

**Quality Targets**:
- Generation success rate: > 95%
- Average generation time: < 15s (Gemini), < 8s (AI Server)
- File size reduction: > 85% vs original
- LCP (Largest Contentful Paint): < 2.5s
- Visual quality score: ≥ 4/5

**Next Steps:**
- See `image-specification.md` for core concepts and architecture
- See `image-development.md` for API specifications and implementation
