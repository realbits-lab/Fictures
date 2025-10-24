# Google AdSense Implementation Guide

## Overview
This guide covers implementing Google AdSense on the Fictures platform to monetize reading traffic. We've strategically placed ads to maximize visibility and revenue while maintaining a good user experience.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setup Process](#setup-process)
3. [Implementation](#implementation)
4. [Ad Placement Strategy](#ad-placement-strategy)
5. [Best Practices](#best-practices)
6. [Performance Optimization](#performance-optimization)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### 1. Google AdSense Account
- Create an account at [Google AdSense](https://www.google.com/adsense/)
- Domain verification required (can take 24-48 hours)
- Must meet AdSense eligibility requirements:
  - Original, quality content
  - Site has sufficient content
  - Complies with Google policies

### 2. Environment Setup
Add your AdSense publisher ID to `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
```

**Important**: Use `NEXT_PUBLIC_` prefix to make it accessible on client-side.

## Setup Process

### Step 1: Site Verification

1. **Add Site in AdSense Dashboard**
   - Go to Sites → Add site
   - Enter your domain: `fictures.xyz` (or your domain)
   - Copy the verification code provided

2. **Verify Ownership**
   - AdSense provides a `<script>` tag to add to your site's `<head>`
   - This is automatically handled by our `AdSenseScript` component
   - Verification typically completes within minutes to 48 hours

### Step 2: Create ads.txt File

Create `/public/ads.txt` with your AdSense publisher information:

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

Replace `pub-XXXXXXXXXXXXXXXX` with your actual publisher ID.

**Purpose**: The ads.txt file helps prevent unauthorized inventory sales and is required by Google.

### Step 3: Configure Ad Units

In your AdSense dashboard:

1. **Navigate to Ads → Overview**
2. **Create Display Ads** with these recommended sizes:
   - **Desktop**: 728x90 (Leaderboard), 300x250 (Medium Rectangle)
   - **Mobile**: 320x100, 300x250 (adapts automatically)
   - **Responsive**: Auto size (recommended for most placements)

3. **Get Ad Slot IDs**
   - Each ad unit has a unique slot ID
   - Format: `data-ad-slot="1234567890"`
   - Save these IDs for implementation

## Implementation

### Core Components

We've implemented three main components for AdSense integration:

#### 1. AdSenseScript Component
Location: `/src/components/ads/AdSenseScript.tsx`

```typescript
// Loads Google AdSense script globally
// Only loads in production environment
// Uses next/script for optimal performance
```

**Usage**: Add once in your root layout:
```tsx
import { AdSenseScript } from '@/components/ads/AdSenseScript';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <AdSenseScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

#### 2. AdUnit Component
Location: `/src/components/ads/AdUnit.tsx`

```typescript
// Reusable ad display component
// Supports multiple formats and sizes
// Responsive design with mobile optimization
```

**Props**:
- `slot: string` - AdSense ad slot ID
- `format?: string` - Ad format (default: 'auto')
- `responsive?: boolean` - Enable responsive sizing (default: true)
- `className?: string` - Custom styling classes

**Usage**:
```tsx
<AdUnit
  slot="1234567890"
  format="horizontal"
  responsive={true}
  className="my-4"
/>
```

#### 3. InFeedAd Component
Location: `/src/components/ads/InFeedAd.tsx`

```typescript
// Specialized component for in-content ads
// Blends naturally with story grid
// Optimized for feed layouts
```

**Usage**:
```tsx
<InFeedAd
  slot="9876543210"
  className="col-span-1"
/>
```

## Ad Placement Strategy

### Browse Page (/reading)

Our placement strategy follows the **30% ads / 70% content** rule with focus on high-visibility areas:

#### 1. **Above the Fold** (Highest Priority)
- **Location**: Immediately before story grid
- **Ad Type**: Horizontal banner (728x90 desktop, 320x100 mobile)
- **Rationale**: First thing users see = highest CTR
- **Implementation**:
  ```tsx
  <AdUnit
    slot="SLOT_ID_1"
    format="horizontal"
    className="mb-8"
  />
  <StoryGrid stories={stories} />
  ```

#### 2. **In-Feed Placement** (High Priority)
- **Location**: After every 8 story cards
- **Ad Type**: In-feed ad unit (matches story card size)
- **Rationale**: Natural integration with browsing flow
- **Implementation**: Automatically inserted in StoryGrid component

#### 3. **End of Content** (Medium Priority)
- **Location**: After all stories
- **Ad Type**: Rectangle (300x250)
- **Rationale**: Captures users who finish browsing
- **Implementation**:
  ```tsx
  <StoryGrid stories={stories} />
  <AdUnit
    slot="SLOT_ID_3"
    format="rectangle"
    className="mt-8 mx-auto max-w-sm"
  />
  ```

### Story Reading Page (/reading/[id])

#### 1. **Pre-Content Ad** (Highest Priority)
- **Location**: Before story title/first chapter
- **Ad Type**: Horizontal banner
- **Spacing**: 150px margin below to prevent accidental clicks
- **Rationale**: Users are engaged and ready to read

#### 2. **In-Content Ads** (High Priority)
- **Location**: Between chapters or after every 2-3 paragraphs
- **Ad Type**: Rectangle (300x250) or In-article ad
- **Frequency**: Every 1000-1500 words
- **Rationale**: High engagement point when users are invested

#### 3. **End of Chapter** (Medium Priority)
- **Location**: After each chapter, before "Next Chapter" button
- **Ad Type**: Rectangle or responsive
- **Rationale**: Natural pause point in reading

## Best Practices

### 1. Performance Optimization

**Lazy Loading**
```typescript
// Ads only load when visible in viewport
useEffect(() => {
  if (isVisible && typeof window !== 'undefined') {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }
}, [isVisible]);
```

**Script Loading Strategy**
- Use `next/script` with `strategy="afterInteractive"`
- Prevents blocking initial page render
- Improves Core Web Vitals scores

**Disable in Development**
```typescript
if (process.env.NODE_ENV !== 'production') {
  return <div className="border-2 border-dashed p-4">Ad Placeholder</div>;
}
```

### 2. Mobile Optimization

**Responsive Ad Units**
```html
<ins class="adsbygoogle"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true">
</ins>
```

**Mobile-Specific Sizes**
- Use 320x100 instead of 320x50 for better fill rates
- Enable full-width responsive for portrait mode
- Maintain 150px spacing from content

### 3. User Experience

**Prevent Accidental Clicks**
- Minimum 150px spacing between ads and interactive elements
- Clear visual distinction between ads and content
- Use border/background to separate ad from content

**Ad Density Guidelines**
- Maximum 3 ads per screen height
- No ads within first 500px on mobile
- No two ads directly adjacent

**Loading States**
```tsx
{!adLoaded && (
  <div className="h-[250px] bg-gray-100 animate-pulse" />
)}
```

### 4. Content Policy Compliance

**Prohibited Content**
- Adult content
- Violent or graphic content
- Illegal content
- Copyright violations

**Required Disclosures**
- Privacy policy with cookie usage
- Terms of service
- GDPR compliance for EU users
- CCPA compliance for California users

## Performance Optimization

### Core Web Vitals

**Largest Contentful Paint (LCP)**
- Load AdSense script after interactive
- Use lazy loading for below-fold ads
- Target: < 2.5 seconds

**Cumulative Layout Shift (CLS)**
- Reserve space for ads with fixed heights
- Use skeleton loaders during ad load
- Target: < 0.1

**First Input Delay (FID)**
- Defer non-critical ad scripts
- Target: < 100ms

### Monitoring

**AdSense Dashboard Metrics**
- Page RPM (Revenue per 1000 impressions)
- CTR (Click-through rate) - Target: 1-3%
- CPC (Cost per click)
- Fill rate - Target: > 90%

**Performance Tracking**
```typescript
// Track ad viewability
const trackAdImpression = (adSlot: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'ad_impression', {
      ad_slot: adSlot,
      page_location: window.location.href
    });
  }
};
```

## Troubleshooting

### Common Issues

#### 1. Ads Not Showing
**Symptoms**: Empty ad spaces or "AdSense ad" placeholder

**Solutions**:
- Check environment variable is set correctly
- Verify publisher ID format: `ca-pub-XXXXXXXXXXXXXXXX`
- Ensure ads.txt file is accessible at root
- Wait 24-48 hours after initial setup
- Check browser console for errors
- Verify site is approved in AdSense dashboard

#### 2. Low Fill Rate
**Symptoms**: Many empty ad slots

**Solutions**:
- Enable multiple ad sizes for single slot
- Use responsive ad units
- Check geographic targeting settings
- Review content policy compliance
- Increase site traffic (minimum threshold required)

#### 3. Policy Violations
**Symptoms**: Email from Google about policy issues

**Solutions**:
- Review AdSense program policies
- Check specific violation in dashboard
- Remove or fix problematic content
- Request review after fixes
- May take 7-30 days for review

#### 4. Layout Shift Issues
**Symptoms**: Content jumps when ads load

**Solutions**:
- Set explicit heights for ad containers
- Use CSS aspect ratios
- Implement skeleton loaders
- Test on multiple devices

### Testing Ads

**Development Environment**
- Ads don't show in development mode
- Use placeholder divs for layout testing
- Test in production or staging environment

**AdSense Test Mode**
```typescript
// For testing without policy violations
const TEST_MODE = false; // Set to true for testing

<AdUnit
  slot={TEST_MODE ? "test-slot" : PRODUCTION_SLOT}
  format="auto"
/>
```

**Ad Preview**
- Use AdSense dashboard ad preview tool
- Test different device sizes
- Verify responsive behavior

## Revenue Optimization Tips

### 1. Strategic Placement
- Place ads where users naturally pause
- Test different positions with A/B testing
- Focus on high-traffic pages

### 2. Content Quality
- More content = more ad impressions
- Quality content = higher CPM
- Regular updates keep users returning

### 3. Traffic Growth
- SEO optimization
- Social media promotion
- Content marketing
- Email newsletters

### 4. Ad Optimization
- Test different ad formats
- Enable auto ads for optimization
- Review performance reports weekly
- Adjust placement based on data

### 5. User Engagement
- Longer session duration = more impressions
- Reduce bounce rate
- Improve page load speed
- Mobile-friendly design

## Compliance Checklist

- [ ] AdSense account approved
- [ ] Publisher ID configured in environment
- [ ] ads.txt file deployed
- [ ] Privacy policy includes ad disclosure
- [ ] Cookie consent implemented (GDPR)
- [ ] Age restriction compliance (COPPA if applicable)
- [ ] Content review for policy compliance
- [ ] No click fraud mechanisms
- [ ] No misleading ad placement
- [ ] Proper ad labeling ("Advertisement" text)

## Next Steps

1. **Monitor Performance**
   - Check AdSense dashboard daily for first week
   - Review earnings, CTR, and fill rate
   - Identify top-performing ad units

2. **Optimize Placement**
   - Use AdSense experiments
   - Test different formats
   - Remove underperforming units

3. **Scale Revenue**
   - Increase quality content
   - Grow organic traffic
   - Improve user engagement metrics

4. **Stay Compliant**
   - Review monthly policy updates
   - Audit content regularly
   - Maintain high-quality standards

## Resources

- [Google AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Program Policies](https://support.google.com/adsense/answer/48182)
- [Next.js Script Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)
- [Web Vitals](https://web.dev/vitals/)

## Support

For technical issues with implementation:
- Check browser console for errors
- Review Next.js server logs
- Test in incognito mode (disable ad blockers)

For AdSense-specific issues:
- Contact Google AdSense support
- Visit AdSense Community forums
- Review policy center in dashboard
