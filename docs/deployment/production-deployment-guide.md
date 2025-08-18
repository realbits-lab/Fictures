# Production Deployment Guide - 4-Level Hierarchy Feature

## Overview

This guide covers the complete deployment process for the 4-level book organization hierarchy feature, including performance optimizations, monitoring setup, and security hardening.

## Pre-Deployment Checklist

### ✅ **Phase 6 Completion Verification**

- [x] **Performance Optimizations**
  - [x] Database query optimization with proper indexing
  - [x] Frontend bundle optimization with code splitting
  - [x] Redis caching implementation
  - [x] Virtual scrolling for large lists
  - [x] Image optimization and lazy loading

- [x] **UI/UX Enhancements**
  - [x] Loading states and skeletons
  - [x] Toast notification system
  - [x] Error boundaries implementation
  - [x] Responsive design improvements

- [x] **Error Handling**
  - [x] React Error Boundaries
  - [x] Input validation and sanitization
  - [x] API error handling
  - [x] User-friendly error messages

- [x] **Documentation**
  - [x] User documentation and guides
  - [x] Developer documentation
  - [x] API documentation
  - [x] Deployment guides

- [x] **Production Readiness**
  - [x] Performance monitoring setup
  - [x] Security hardening
  - [x] Health check implementation
  - [x] Audit logging

## Environment Setup

### Required Environment Variables

```bash
# Core Application
NEXT_PUBLIC_APP_URL=https://fictures.app
AUTH_SECRET=your-super-secure-secret-key-here
NODE_ENV=production

# Database
POSTGRES_URL=postgresql://username:password@host:port/database
DATABASE_SSL=require

# AI Services
XAI_API_KEY=your-xai-api-key
# OR use AI Gateway
AI_GATEWAY_API_KEY=your-ai-gateway-key

# Caching
REDIS_URL=redis://username:password@host:port
# OR Upstash Redis for Vercel
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# File Storage
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
```

### Production Configuration Files

#### next.config.ts
```typescript
const nextConfig: NextConfig = {
  experimental: {
    ppr: false, // Enable when stable
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  compress: true,
  poweredByHeader: false,
  // Bundle optimization for hierarchy components
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        hierarchy: {
          name: 'hierarchy-components',
          test: /[\\/]components[\\/]books[\\/]hierarchy/,
          chunks: 'all',
          priority: 20,
        },
        // ... other optimizations
      };
    }
    return config;
  },
};
```

#### Security Headers
Automatically applied via `/lib/security/input-validation.ts`:
```typescript
{
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': 'default-src self; ...',
}
```

## Database Deployment

### 1. Migration Strategy

```bash
# Run database migrations
pnpm db:migrate

# Verify hierarchy tables exist
psql $POSTGRES_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Book', 'Story', 'Part', 'ChapterEnhanced', 'Scene');"
```

### 2. Performance Indexes

The following indexes are automatically created by migration `0014_hierarchy_performance_indexes.sql`:

```sql
-- Foreign key indexes (CRITICAL for performance)
CREATE INDEX CONCURRENTLY idx_stories_book_id ON "Story"(book_id);
CREATE INDEX CONCURRENTLY idx_parts_story_id ON "Part"(story_id);
CREATE INDEX CONCURRENTLY idx_chapters_part_id ON "ChapterEnhanced"(part_id);
CREATE INDEX CONCURRENTLY idx_scenes_chapter_id ON "Scene"(chapter_id);

-- Composite indexes for ordering
CREATE INDEX CONCURRENTLY idx_stories_book_order ON "Story"(book_id, order_in_book);
-- ... additional indexes
```

### 3. Database Monitoring

```sql
-- Monitor index usage
SELECT * FROM analyze_hierarchy_query_performance();

-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
WHERE query LIKE '%hierarchy%' 
ORDER BY total_time DESC;
```

## Redis Cache Deployment

### 1. Cache Configuration

For Vercel deployment, use Upstash Redis:
```bash
# Create Upstash Redis instance
# Set environment variables:
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 2. Cache Warming Strategy

```typescript
// Warm critical caches after deployment
await hierarchyCache.warmCache(bookId, hierarchyData);
```

### 3. Cache Monitoring

```typescript
// Monitor cache performance
const stats = await hierarchyCache.getCacheStats();
console.log(`Cache hit rate: ${stats.hitRate}`);
```

## Application Deployment

### Vercel Deployment (Recommended)

#### 1. Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "POSTGRES_URL": "@postgres-url",
    "REDIS_URL": "@redis-url",
    "XAI_API_KEY": "@xai-api-key"
  },
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

#### 2. Build Optimization

```bash
# Pre-build steps
pnpm install
pnpm db:migrate  # Run migrations
pnpm build       # Build with optimizations

# Verify bundle sizes
npx @next/bundle-analyzer
```

#### 3. Deployment Command

```bash
# Deploy to Vercel
vercel --prod

# Or use GitHub integration
git push origin main  # Auto-deploys via Vercel GitHub app
```

### Alternative: Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - POSTGRES_URL=${POSTGRES_URL}
      - REDIS_URL=${REDIS_URL}
      - XAI_API_KEY=${XAI_API_KEY}
    depends_on:
      - postgres
      - redis
    
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: fictures
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Monitoring Setup

### 1. Health Checks

The application includes built-in health checks at `/api/health`:

```typescript
// Checks database, cache, AI service, memory, and performance
const health = await performanceMonitor.performHealthCheck();
```

### 2. Performance Monitoring

Automatic performance tracking is enabled:

```typescript
// Database query monitoring
export const getHierarchy = withQueryMonitoring(
  'getOptimizedHierarchy',
  getOptimizedHierarchy
);

// API route monitoring  
export const GET = withAPIMonitoring(async (request, context) => {
  // ... handler logic
});
```

### 3. Error Tracking

Global error handling setup:

```typescript
// In production, errors are automatically sent to monitoring services
setupGlobalErrorHandling();
```

### 4. Monitoring Dashboard

Key metrics to monitor:

- **Performance Metrics**
  - Database query response times (target: <100ms)
  - API response times (target: <2s)
  - Cache hit rates (target: >80%)
  - Component render times (target: <100ms)

- **Error Metrics**
  - Error rates per endpoint
  - Failed hierarchy operations
  - AI generation failures
  - Database connection errors

- **Business Metrics**
  - Hierarchy creation rates
  - User engagement with features
  - Content generation usage
  - Search query performance

## Security Hardening

### 1. Input Validation

All inputs are validated using Zod schemas:

```typescript
// Automatic validation for all hierarchy inputs
const validatedData = InputValidator.validateHierarchyInput('scene', sceneData);
```

### 2. Content Sanitization

```typescript
// HTML content is automatically sanitized
const safeContent = ContentSanitizer.sanitizeHTML(userContent);
```

### 3. Rate Limiting

API routes are protected with rate limiting:

```typescript
// Different limits for different operations
api: 100 requests/15min
ai: 10 requests/1min
auth: 5 requests/15min
```

### 4. Audit Logging

All actions are logged for compliance:

```typescript
await AuditLogger.logAction(userId, 'create_scene', 'scene', sceneId);
```

## Post-Deployment Verification

### 1. Functional Tests

```bash
# Run E2E tests against production
PLAYWRIGHT_BASE_URL=https://fictures.app pnpm test:e2e

# Test key user workflows
npm run test:hierarchy-workflows
```

### 2. Performance Tests

```bash
# Load testing
artillery run load-test-config.yml

# Database performance verification
npm run test:db-performance
```

### 3. Security Scan

```bash
# Security audit
npm audit --audit-level high

# Content Security Policy validation
csp-validator https://fictures.app
```

## Rollback Strategy

### Quick Rollback (Vercel)

```bash
# List deployments
vercel list

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### Database Rollback

```bash
# If needed, rollback migrations
pnpm db:rollback

# Restore from backup
pg_restore -d $POSTGRES_URL backup.sql
```

### Cache Invalidation

```bash
# Clear all caches if needed
redis-cli -u $REDIS_URL FLUSHALL
```

## Maintenance Tasks

### Daily

- Monitor error rates and response times
- Check cache hit rates
- Review security logs

### Weekly

- Analyze performance metrics
- Review user feedback
- Update security dependencies

### Monthly

- Performance optimization review
- Database maintenance (VACUUM, ANALYZE)
- Security audit
- Backup verification

## Troubleshooting

### Common Issues

#### 1. Slow Hierarchy Queries

```sql
-- Check index usage
EXPLAIN ANALYZE SELECT * FROM hierarchy_view WHERE book_id = 'xxx';

-- Rebuild indexes if needed
REINDEX TABLE "Story";
```

#### 2. Cache Miss Issues

```typescript
// Check cache connectivity
const stats = await hierarchyCache.getCacheStats();
console.log('Cache status:', stats);

// Warm cache manually
await hierarchyCache.warmCache(bookId, hierarchyData);
```

#### 3. Memory Issues

```typescript
// Monitor memory usage
const health = await performanceMonitor.performHealthCheck();
console.log('Memory status:', health.checks.memory);
```

### Performance Benchmarks

Target performance metrics:

- **Database Queries**: <100ms for hierarchy operations
- **API Response Times**: <2s for complex operations
- **Cache Hit Rate**: >80% for hierarchy data
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3s
- **Cumulative Layout Shift**: <0.1

## Success Metrics

### Technical KPIs

- 99.9% uptime
- <2s average response time
- <5% error rate
- >90% cache hit rate
- Zero security incidents

### User Experience KPIs

- >95% user satisfaction
- <10% task abandonment rate
- >80% feature adoption
- <3 clicks to any content
- Mobile performance score >90

---

## Support and Contact

- **Technical Issues**: Create GitHub issue
- **Performance Problems**: Check monitoring dashboard
- **Security Concerns**: Contact security team
- **User Feedback**: Review user documentation

The 4-level hierarchy feature is now production-ready with comprehensive monitoring, security, and performance optimizations. This implementation provides a solid foundation for complex story organization at scale.