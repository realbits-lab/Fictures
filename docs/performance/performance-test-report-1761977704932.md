---
title: Performance Test Report
---

# Performance Test Report

**Generated:** 2025-11-01T06:15:04.931Z
**Test Story:** V-brkWWynVrT6vX_XE-JG
**Base URL:** http://localhost:3000

---

## 🎯 Implemented Optimizations

- ✅ Strategy 1: Streaming SSR with Suspense Boundaries
- ✅ Strategy 4: Vercel Edge Caching Headers
- ✅ Strategy 8: bfcache Optimization (no blockers)

---

## 📊 Performance Results

### First Visit (Cold Cache)
- **First Paint:** 9468ms
- **First Contentful Paint:** 9468ms
- **Time to Interactive:** 8994ms
- **Full Load:** 9380ms
- **Data Transfer:** 1.38 KB

### Second Visit (Warm Cache)
- **First Paint:** 628ms
- **First Contentful Paint:** 628ms
- **Time to Interactive:** 442ms
- **Full Load:** 579ms
- **Cache Hit:** ❌ NO
- **Data Transfer:** 1.38 KB

### Performance Improvement
- **First Paint:** 93.4% faster
- **FCP:** 93.4% faster
- **TTI:** 95.1% faster
- **Data Saved:** 0.00 KB

---

## 🔧 Strategy Verification

### Strategy 1: Streaming SSR
- **Enabled:** ❌ NO
- **Suspense Fallback:** ❌ NO
- **Response Chunks:** 1

### Strategy 4: Edge Caching
- **Cache-Control:** ✅ SET
  - Value: `no-store, must-revalidate`
- **CDN-Cache-Control:** ❌ NOT SET
  - Value: `N/A`
- **ETag:** ✅ SET

### Strategy 8: bfcache
- **Blockers Found:** ❌ NO (optimized)
- **Eligibility:** ✅ 100%

---

## 🎯 Performance Targets vs Actual

| Metric | Target | Actual (Cold) | Actual (Warm) | Status |
|--------|--------|---------------|---------------|--------|
| First Contentful Paint | < 1000ms | 9468ms | 628ms | ⚠️ |
| Largest Contentful Paint | < 2500ms | 9380ms | 579ms | ⚠️ |
| Time to Interactive | < 3500ms | 8994ms | 442ms | ⚠️ |
| Cache Hit Rate | > 95% | N/A | 0% | ❌ |
| Data Transfer | < 200 KB | 1.38 KB | 1.38 KB | ✅ |

---

## 📈 Recommendations

- ⚠️ First Contentful Paint exceeds 1s - consider implementing Strategy 2 (Partial Prerendering)
- ⚠️ CDN-Cache-Control header not set - edge caching not enabled
- ⚠️ Streaming SSR not detected - verify Suspense boundaries


---

**Test completed at:** 2025-11-01T06:15:04.932Z
