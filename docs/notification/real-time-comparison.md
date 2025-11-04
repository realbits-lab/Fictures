# Real-Time Update Strategies Comparison

## Quick Decision Matrix

| Approach | Latency | Complexity | Infrastructure | Cost | Best For |
|----------|---------|------------|----------------|------|----------|
| **Redis Pub/Sub + SSE** ⭐ | `<100ms` | Medium | Redis (existing) | $0 | **Story publishing notifications** |
| WebSocket (Socket.io) | `<50ms` | High | WebSocket server | $$ | Bi-directional (chat, collab) |
| Next.js Server Actions | N/A | Low | None | $0 | Single-user updates only |
| Polling (current) | 0-5min | Low | None | $ (server load) | Low-priority updates |

## Detailed Comparison

### 1. Redis Pub/Sub + SSE (RECOMMENDED ⭐)

**Implementation Time:** ~4 hours

**Code Changes:**
```typescript
// 1. Install: pnpm add ioredis
// 2. Create Redis client (src/lib/redis/client.ts) - 50 lines
// 3. Update publish API to emit events - 10 lines
// 4. Create SSE endpoint (src/app/api/community/events/route.ts) - 100 lines
// 5. Create client hook (src/lib/hooks/use-community-events.ts) - 150 lines
// 6. Update community page - 20 lines
```

**Performance:**
- ✅ Instant cross-user updates (`<100ms`)
- ✅ Efficient: only sends when changes occur
- ✅ Scales horizontally with Redis
- ✅ Auto-reconnection built-in
- ⚠️ One-way server→client only

**When to Use:**
- ✅ Story publishing/updating
- ✅ New community posts
- ✅ Notifications
- ✅ Live activity feed
- ❌ Chat/messaging (use WebSocket instead)

---

### 2. WebSocket (Socket.io)

**Implementation Time:** ~8 hours

**Code Changes:**
```typescript
// 1. Install: pnpm add socket.io socket.io-client
// 2. Create custom WebSocket server (can't use Next.js API routes)
// 3. Configure deployment for WebSocket support
// 4. Implement client-side Socket.io connection
// 5. Handle reconnection, room management, authentication
```

**Performance:**
- ✅ Bi-directional communication
- ✅ Very low latency (`<50ms`)
- ✅ Rich ecosystem (rooms, namespaces)
- ⚠️ Requires dedicated server process
- ⚠️ More complex deployment
- ⚠️ Higher memory usage per connection

**When to Use:**
- ✅ Real-time chat
- ✅ Collaborative editing
- ✅ Multiplayer games
- ✅ Live cursors/presence
- ❌ Simple one-way notifications (overkill)

**Deployment Complexity:**
- Vercel: ❌ Requires separate WebSocket server
- Railway: ✅ Full support
- Self-hosted: ✅ Full support

---

### 3. Next.js Server Actions + Revalidation

**Implementation Time:** ~1 hour

**Code Changes:**
```typescript
// In publish action:
'use server';

export async function publishStory(storyId: string) {
  await db.update(stories).set({ status: 'published' });
  revalidatePath('/community');
  revalidatePath('/studio');
}
```

**Performance:**
- ✅ Simple implementation
- ✅ Native to Next.js 15
- ✅ Works with Server Components
- ❌ Only updates current user's session
- ❌ Other users don't see updates until refresh
- ❌ Not truly "real-time"

**When to Use:**
- ✅ Form submissions
- ✅ Single-user interactions
- ✅ Dashboard updates
- ❌ Cross-user real-time updates
- ❌ Community features

---

### 4. Client-Side Polling (Current Implementation)

**Implementation Time:** Already implemented

**Current Setup:**
```typescript
// use-page-cache.ts
refreshInterval: 5 * 60 * 1000 // 5 minutes
```

**Performance:**
- ✅ Simple, no server changes
- ⚠️ 0-5 minute delay (random based on when user opened page)
- ⚠️ Wasteful: requests even when no changes
- ⚠️ High server load with many users
- ⚠️ Battery drain on mobile

**Current Cost (100 concurrent users):**
- Requests: 100 users × 12 polls/hour = 1,200 requests/hour
- Data: 1,200 × 5KB = 6MB/hour = 4.3GB/month
- Server CPU: ~15% with caching

**When to Use:**
- ✅ Low-priority updates
- ✅ Infrequent changes
- ❌ Real-time requirements
- ❌ High-traffic applications

---

## Hybrid Approach (Best of Both Worlds)

**Recommendation for Fictures:**

```typescript
// Primary: Redis Pub/Sub + SSE for real-time
useCommunityEvents({
  onStoryPublished: (event) => {
    toast.success(`New story: ${event.title}`);
  },
  autoRevalidate: true,
});

// Fallback: SWR polling (increased interval)
useCommunityStories({
  refreshInterval: 30 * 60 * 1000, // 30 minutes (was 5 min)
  // SSE handles real-time, polling is just backup
});
```

**Benefits:**
- ✅ Real-time updates when connected (SSE)
- ✅ Graceful degradation if SSE fails
- ✅ Works offline/online
- ✅ Reduces polling frequency by 6x

---

## Testing Strategy

### Manual Testing Steps

```bash
# 1. Start dev server with Redis
dotenv --file .env.local run pnpm dev

# 2. Open Terminal 2 - Monitor Redis
redis-cli SUBSCRIBE story:published

# 3. Open 2 browser tabs
# Tab 1: http://localhost:3000/community
# Tab 2: http://localhost:3000/studio

# 4. In Tab 2: Publish a story
# 5. Watch Tab 1: Should see new story within 1 second
# 6. Watch Terminal 2: Should see Redis event
```

### Playwright E2E Test

```typescript
// tests/real-time-story-updates.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Real-time Story Updates', () => {
  test('community page updates when story published in another tab', async ({ page, context }) => {
    // Use authenticated state
    await page.goto('http://localhost:3000/community');

    // Get initial story count
    const initialCount = await page.locator('[data-testid="story-card"]').count();

    // Open writing page in new tab
    const writingPage = await context.newPage();
    await writingPage.goto('http://localhost:3000/studio');

    // Publish a story
    await writingPage.locator('[data-testid="story-item"]').first().click();
    await writingPage.locator('[data-testid="publish-button"]').click();
    await writingPage.locator('[data-testid="confirm-publish"]').click();

    // Original community tab should update via SSE
    await expect(page.locator('[data-testid="new-story-notification"]')).toBeVisible({
      timeout: 2000, // Should appear within 2 seconds
    });

    // Click notification to refresh view
    await page.locator('[data-testid="new-story-notification"]').click();

    // Verify story count increased
    await expect(page.locator('[data-testid="story-card"]')).toHaveCount(initialCount + 1);
  });

  test('handles SSE connection errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000/community');

    // Simulate network offline
    await page.context().setOffline(true);

    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Reconnect
    await page.context().setOffline(false);

    // Should reconnect automatically
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible({
      timeout: 5000,
    });
  });
});
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Install `ioredis` package
- [ ] Create Redis client utilities
- [ ] Add Redis event publishing to story visibility API
- [ ] Test Redis pub/sub locally

### Phase 2: SSE Implementation (Week 2)
- [ ] Create SSE endpoint (`/api/community/events`)
- [ ] Test SSE connection in browser DevTools
- [ ] Handle connection errors and reconnection
- [ ] Add keep-alive ping mechanism

### Phase 3: Client Integration (Week 3)
- [ ] Create `useCommunityEvents` hook
- [ ] Update community page to use hook
- [ ] Add toast notifications for new stories
- [ ] Add "X new stories" indicator UI

### Phase 4: Testing & Polish (Week 4)
- [ ] Write Playwright E2E tests
- [ ] Test with multiple concurrent users
- [ ] Monitor performance and latency
- [ ] Add production logging and alerts
- [ ] Update documentation

### Phase 5: Deployment (Week 5)
- [ ] Deploy to staging environment
- [ ] Test with real users
- [ ] Monitor Redis metrics
- [ ] Roll out to production
- [ ] Gather user feedback

---

## Cost Analysis (for 1,000 active users)

### Current Polling Approach
```
1,000 users × 12 polls/hour × 24 hours = 288,000 requests/day
288,000 × 5KB = 1.44GB/day = 43GB/month
Server CPU: ~30% average
Battery drain: High (constant polling)
```

### Redis SSE Approach
```
Redis Pub/Sub: Already included in hosting ($0)
SSE connections: 1,000 concurrent = ~50MB RAM
Events: ~1,000 events/day × 100 bytes = 100KB/day
Server CPU: ~10% average (event-driven)
Battery drain: Low (push notifications)

Savings: -33GB/month bandwidth, -20% CPU, better UX
```

---

## Monitoring & Debugging

### Production Metrics to Track

```typescript
// Add to SSE endpoint
let connectionCount = 0;

export async function GET(request: Request) {
  connectionCount++;
  console.log(`[SSE] Active connections: ${connectionCount}`);

  // In cleanup
  request.signal.addEventListener('abort', () => {
    connectionCount--;
    console.log(`[SSE] Active connections: ${connectionCount}`);
  });
}

// Add Redis latency tracking
const start = Date.now();
await publisher.publish(channel, message);
const latency = Date.now() - start;
console.log(`[Redis] Publish latency: ${latency}ms`);
```

### Debug Commands

```bash
# Check Redis connection
redis-cli PING

# Monitor all Redis commands
redis-cli MONITOR

# Check active subscriptions
redis-cli PUBSUB CHANNELS

# Check subscriber count for channel
redis-cli PUBSUB NUMSUB story:published

# View server logs
tail -f logs/dev-server.log | grep SSE
```

### Browser DevTools

```javascript
// Console: Monitor SSE events
const es = new EventSource('/api/community/events');
es.addEventListener('story-published', (e) => {
  console.log('Story published:', JSON.parse(e.data));
});
es.addEventListener('error', (e) => {
  console.error('SSE error:', e);
});

// Network tab: Look for "eventsource" connection
// Should stay open with "pending" status
```

---

## Security Considerations

### Authentication for SSE
```typescript
// Option 1: Session-based (recommended)
import { auth } from '@/lib/auth/config';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Create SSE stream...
}

// Option 2: URL token (for mobile apps)
const url = new URL(request.url);
const token = url.searchParams.get('token');
// Validate token...
```

### Rate Limiting
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from '@/lib/redis/client';

const ratelimit = new Ratelimit({
  redis: getRedisClient(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 connections per 10 seconds
});

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too many requests', { status: 429 });
  }

  // Create SSE stream...
}
```

### Event Filtering (Privacy)
```typescript
// Only send events for stories the user has access to
subscriber.on('message', async (channel, message) => {
  const event = JSON.parse(message);

  // Check user permissions
  const canView = await checkUserCanViewStory(session.user.id, event.storyId);

  if (canView) {
    sendEvent('story-published', event);
  }
});
```

---

## Conclusion

**For Fictures, I strongly recommend: Redis Pub/Sub + SSE**

**Why:**
1. ✅ You already have Redis infrastructure ($0 additional cost)
2. ✅ Perfect for one-way story publishing notifications
3. ✅ Works seamlessly with Next.js 15 App Router
4. ✅ Scales horizontally across multiple servers
5. ✅ Simple browser API (EventSource) - no library needed
6. ✅ 4-hour implementation vs 8+ hours for WebSocket
7. ✅ Better battery life than polling

**When to upgrade to WebSocket:**
- If you add real-time chat between readers
- If you add collaborative story writing
- If you add live cursors/presence indicators

**Quick Start:**
```bash
# 1. Install Redis client
pnpm add ioredis

# 2. Follow implementation guide in docs/real-time-story-updates.md

# 3. Test locally
dotenv --file .env.local run pnpm dev
# Open 2 browser tabs and test story publishing

# 4. Deploy
# Works on Vercel, Railway, and self-hosted
```
