---
title: "Vercel Analytics Setup"
---

# Vercel Analytics Setup

## Installation Complete ✅

Vercel Analytics has been successfully integrated into your Next.js application.

### Changes Made

#### 1. Package Installation
```bash
pnpm add @vercel/analytics
```

**Installed Version**: `@vercel/analytics@1.5.0`

#### 2. Code Integration
**File Modified**: `src/app/layout.tsx`

**Changes**:
- Added import: `import { Analytics } from '@vercel/analytics/next';`
- Added `<Analytics />` component at the end of the body tag (line 59)

**Implementation**:
```typescript
import { Analytics } from '@vercel/analytics/next';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* ... existing components ... */}
        <Analytics />
      </body>
    </html>
  );
}
```

## Next Steps to Enable Analytics

### Step 1: Enable Web Analytics on Vercel Dashboard

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: **Fictures**
3. Navigate to the **Analytics** tab
4. Click **Enable Web Analytics**

This will automatically add new routes at `/_vercel/insights/*` after your next deployment.

### Step 2: Deploy to Vercel

Deploy your application using one of these methods:

**Option A: Git Push (Recommended)**
```bash
git add .
git commit -m "Add Vercel Analytics"
git push
```

Your Vercel project will automatically deploy if connected to Git.

**Option B: Manual Deployment**
```bash
vercel deploy
```

**Option C: Production Deployment**
```bash
vercel --prod
```

### Step 3: Verify Analytics

After deployment:
1. Visit your deployed site
2. Navigate through a few pages
3. Return to Vercel Dashboard → Analytics tab
4. Wait a few minutes for data to appear
5. You should see page views, visitor metrics, and performance data

## What Vercel Analytics Tracks

### Core Web Vitals
- **LCP** (Largest Contentful Paint) - Loading performance
- **FID** (First Input Delay) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability
- **FCP** (First Contentful Paint) - Perceived load speed
- **TTFB** (Time to First Byte) - Server response time

### Traffic Metrics
- Page views
- Unique visitors
- Top pages
- Referrer sources
- Geographic distribution

### User Experience
- Browser usage
- Device types
- Screen resolutions
- Operating systems

## Analytics Dashboard Features

Once enabled, you can view:
- **Real-time analytics** - Live visitor data
- **Historical trends** - Performance over time
- **Page insights** - Per-page metrics
- **Core Web Vitals** - SEO and UX metrics
- **Audience** - Geographic and device breakdown

## Configuration Options

### Development Mode
The Analytics component automatically detects the environment:
- **Development**: No data sent (localhost)
- **Preview**: Data sent to preview environment
- **Production**: Full analytics tracking

### Custom Events (Optional)
To track custom events, you can use the `track()` function:

```typescript
import { track } from '@vercel/analytics';

// Track custom events
track('button_clicked', { button_id: 'signup' });
track('story_created', { genre: 'fantasy' });
```

### Debug Mode (Optional)
To see analytics events in the console during development:

```typescript
import { Analytics } from '@vercel/analytics/next';

<Analytics debug={true} />
```

## Integration with Existing Features

The Analytics component is integrated alongside:
- ✅ Google AdSense
- ✅ Theme Provider
- ✅ Session Provider
- ✅ Toast Notifications
- ✅ Auth Modal

All components work together without conflicts.

## Privacy & GDPR Compliance

Vercel Analytics is:
- **Privacy-friendly** - No cookies required
- **GDPR compliant** - No personal data collected
- **Lightweight** - ~1KB script size
- **Fast** - No impact on Core Web Vitals

## Troubleshooting

### Analytics Not Showing Data?

1. **Check if enabled on dashboard**
   - Verify Analytics is enabled in Vercel project settings

2. **Verify deployment**
   - Ensure you deployed after adding the Analytics component

3. **Wait for data**
   - Analytics data may take 5-10 minutes to appear

4. **Check browser console**
   - Enable debug mode to see tracking events
   - Look for any error messages

5. **Verify production environment**
   - Analytics only works on deployed sites (not localhost)

### Testing Analytics

To test that Analytics is working:
```bash
# Enable debug mode in layout.tsx
<Analytics debug={true} />

# Deploy and visit your site
# Open browser console
# Navigate between pages
# You should see tracking events logged
```

## Documentation

- **Quickstart**: https://vercel.com/docs/analytics/quickstart
- **Custom Events**: https://vercel.com/docs/analytics/custom-events
- **API Reference**: https://vercel.com/docs/analytics/api-reference

## Support

If you encounter issues:
1. Check Vercel Status: https://www.vercel-status.com/
2. Vercel Support: https://vercel.com/support
3. Analytics Discussion: https://github.com/vercel/analytics/discussions

---

**Setup Date**: 2025-10-24  
**Version**: @vercel/analytics@1.5.0  
**Status**: ✅ Installed - Awaiting Vercel Dashboard Activation
