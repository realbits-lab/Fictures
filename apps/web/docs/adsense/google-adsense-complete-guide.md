# Google AdSense Complete Guide for Fictures

**Complete documentation for implementing and optimizing Google AdSense monetization on the Fictures platform.**

---

## Table of Contents

1. [Quick Start (5 Minutes)](#quick-start-5-minutes)
2. [What Was Implemented](#what-was-implemented)
3. [Prerequisites](#prerequisites)
4. [Setup Process](#setup-process)
5. [Implementation Details](#implementation-details)
6. [Ad Placement Strategy](#ad-placement-strategy)
7. [Best Practices](#best-practices)
8. [Performance Optimization](#performance-optimization)
9. [Expected Revenue](#expected-revenue)
10. [Troubleshooting](#troubleshooting)
11. [Compliance](#compliance)
12. [Resources](#resources)

---

# Quick Start (5 Minutes)

## Step 1: Get Your AdSense Publisher ID

1. Sign up at [Google AdSense](https://www.google.com/adsense/)
2. Complete site verification (may take 24-48 hours)
3. Get your Publisher ID from: Account → Account Information
   - Format: `ca-pub-XXXXXXXXXXXXXXXX`

## Step 2: Configure Environment

Add to your `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
```

**Important**: Replace `XXXXXXXXXXXXXXXX` with your actual publisher ID.

## Step 3: Update ads.txt

Edit `/public/ads.txt` and replace the placeholder:

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

## Step 4: Create Ad Units in AdSense

1. Go to AdSense Dashboard → Ads → Overview
2. Click "By ad unit" → "Display ads"
3. Create these ad units:

| Ad Name | Size | Slot ID (example) | Usage |
|---------|------|-------------------|-------|
| Browse Hero | Responsive | 1234567890 | Above story grid |
| Browse Footer | Rectangle 300x250 | 0987654321 | Below story grid |
| In-Feed Story | In-feed | 5555555555 | Between story cards |

4. Copy each "data-ad-slot" ID (the number after the dash)

## Step 5: Update Slot IDs in Code

**File: `/src/components/browse/BrowseClient.tsx`**

```typescript
// Line 177 - Above-the-fold ad
<AdUnit
  slot="YOUR_HERO_AD_SLOT_ID"  // ← Replace this
  format="horizontal"
  ...
/>

// Line 189 - End-of-content ad
<AdUnit
  slot="YOUR_FOOTER_AD_SLOT_ID"  // ← Replace this
  format="rectangle"
  ...
/>
```

**File: `/src/components/browse/StoryGrid.tsx`**

```typescript
// Line 361 - In-feed ad
<InFeedAd
  slot="YOUR_INFEED_AD_SLOT_ID"  // ← Replace this
  ...
/>
```

## Step 6: Deploy & Test

1. Build and deploy to production:
   ```bash
   pnpm build
   pnpm start
   # OR deploy to Vercel/your hosting
   ```

2. **Important**: Ads only show in production, not in development mode!

3. Test in production:
   - Visit your live site
   - Check browser console for errors
   - Verify ads load (may take a few minutes initially)

## Quick Reference Checklist

- [ ] AdSense account approved
- [ ] Publisher ID added to `.env.local`
- [ ] ads.txt file updated
- [ ] 3 ad units created in AdSense dashboard
- [ ] All slot IDs replaced in code
- [ ] Site deployed to production
- [ ] Ads verified loading on live site

---

# What Was Implemented

## Core Components Created

### 1. AdSenseScript Component
**Location**: `/src/components/ads/AdSenseScript.tsx`

Loads Google AdSense script globally. Only loads in production environment using Next.js Script component with `afterInteractive` strategy for optimal performance.

**Usage**: Already added to root layout.

### 2. AdUnit Component
**Location**: `/src/components/ads/AdUnit.tsx`

Reusable ad display component supporting multiple formats and sizes with responsive design.

**Props**:
- `slot: string` - AdSense ad slot ID
- `format?: string` - Ad format (default: 'auto')
- `responsive?: boolean` - Enable responsive sizing (default: true)
- `className?: string` - Custom styling classes

**Example**:
```tsx
<AdUnit
  slot="1234567890"
  format="horizontal"
  responsive={true}
  className="my-4"
/>
```

### 3. InFeedAd Component
**Location**: `/src/components/ads/InFeedAd.tsx`

Specialized component for in-content ads that blends naturally with story grid.

**Example**:
```tsx
<InFeedAd
  slot="9876543210"
  className="col-span-1"
/>
```

## Ad Placements on /novels Page

### Visual Layout

```
┌───────────────────────────────────────────────────┐
│  🔍 Filters Row                                   │
│  [All/History] [Card/Table] [Genre] [Sort]       │
├───────────────────────────────────────────────────┤
│                                                   │
│  🎯 AD #1: HERO BANNER (Above the Fold)          │
│     - Horizontal: 728x90 (desktop)               │
│     - Horizontal: 320x100 (mobile)               │
│     - Slot: 1234567890                           │
│     - Priority: HIGHEST                          │
│     - Expected CTR: 2-4%                         │
│                                                   │
├───────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │Story │ │Story │ │Story │ │Story │           │
│  │ #1   │ │ #2   │ │ #3   │ │ #4   │           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│                                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │Story │ │Story │ │Story │ │Story │           │
│  │ #5   │ │ #6   │ │ #7   │ │ #8   │           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
├───────────────────────────────────────────────────┤
│  🎯 AD #2: IN-FEED AD                            │
│     - Format: Fluid (matches card style)        │
│     - Slot: 5555555555                           │
│     - Priority: HIGH                             │
│     - Expected CTR: 1.5-3%                       │
├───────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │Story │ │Story │ │Story │ │Story │           │
│  │ #9   │ │ #10  │ │ #11  │ │ #12  │           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│                                                   │
│  ... more stories ...                             │
├───────────────────────────────────────────────────┤
│         🎯 AD #3: FOOTER RECTANGLE                │
│            - Size: 300x250                       │
│            - Slot: 0987654321                    │
│            - Priority: MEDIUM                    │
│            - Expected CTR: 1-2%                  │
└───────────────────────────────────────────────────┘
```

### Placement Details

#### 1. Above-the-Fold Hero Ad (HIGHEST PRIORITY)
- **File**: `/src/components/browse/BrowseClient.tsx` (Lines 176-182)
- **Location**: Immediately before story grid
- **Format**: Horizontal banner (728x90 desktop, 320x100 mobile)
- **Rationale**: First thing users see = highest CTR
- **Expected CTR**: 2-4%

#### 2. In-Feed Ads (HIGH PRIORITY)
- **File**: `/src/components/browse/StoryGrid.tsx` (Lines 358-365)
- **Location**: After every 8 story cards
- **Format**: In-feed ad unit (matches story card size)
- **Rationale**: Natural integration with browsing flow
- **Expected CTR**: 1.5-3%

#### 3. End-of-Content Footer Ad (MEDIUM PRIORITY)
- **File**: `/src/components/browse/BrowseClient.tsx` (Lines 186-193)
- **Location**: After all stories
- **Format**: Rectangle (300x250)
- **Rationale**: Captures users who finish browsing
- **Expected CTR**: 1-2%

## Files Modified

### Created
- `/src/components/ads/AdSenseScript.tsx`
- `/src/components/ads/AdUnit.tsx`
- `/src/components/ads/InFeedAd.tsx`
- `/src/components/ads/index.ts`
- `/public/ads.txt`
- `/.env.adsense.example`

### Modified
- `/src/app/layout.tsx` (added AdSenseScript)
- `/src/components/browse/BrowseClient.tsx` (added hero & footer ads)
- `/src/components/browse/StoryGrid.tsx` (added in-feed ads)

---

# Prerequisites

## Google AdSense Account

- Create account at [Google AdSense](https://www.google.com/adsense/)
- Domain verification required (can take 24-48 hours)
- Must meet eligibility requirements:
  - Original, quality content
  - Site has sufficient content
  - Complies with Google policies

## Environment Setup

Add your AdSense publisher ID to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
```

**Important**: Use `NEXT_PUBLIC_` prefix to make it accessible on client-side.

---

# Setup Process

## Step 1: Site Verification

1. **Add Site in AdSense Dashboard**
   - Go to Sites → Add site
   - Enter your domain: `fictures.xyz` (or your domain)
   - Copy the verification code provided

2. **Verify Ownership**
   - AdSense provides a `<script>` tag to add to your site's `<head>`
   - This is automatically handled by our `AdSenseScript` component
   - Verification typically completes within minutes to 48 hours

## Step 2: Create ads.txt File

Create `/public/ads.txt` with your AdSense publisher information:

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

Replace `pub-XXXXXXXXXXXXXXXX` with your actual publisher ID.

**Purpose**: The ads.txt file helps prevent unauthorized inventory sales and is required by Google.

## Step 3: Configure Ad Units

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

---

# Implementation Details

## Component Architecture

All ad components are located in `/src/components/ads/`:

```
src/components/ads/
├── AdSenseScript.tsx    # Global script loader
├── AdUnit.tsx           # Standard ad display
├── InFeedAd.tsx         # In-feed specialized ads
└── index.ts             # Exports
```

## AdSenseScript Component

```typescript
// Loads Google AdSense script globally
// Only loads in production environment
// Uses next/script for optimal performance
```

Already added in `/src/app/layout.tsx`:

```tsx
import { AdSenseScript } from '@/components/ads';

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

## AdUnit Component

Reusable ad display component with responsive design:

```tsx
<AdUnit
  slot="1234567890"
  format="horizontal"  // auto | horizontal | rectangle | vertical
  responsive={true}
  className="my-4"
  style={{ minHeight: '90px' }}  // Prevents layout shift
/>
```

**Features**:
- Multiple format support
- Responsive sizing
- Loading states
- Error handling
- Development placeholders

## InFeedAd Component

Specialized for feed layouts:

```tsx
<InFeedAd
  slot="9876543210"
  layoutKey="-fb+5w+4e-db+86"  // From AdSense dashboard
  className="col-span-1"
/>
```

**Features**:
- Blends with content
- Matches story card styling
- Fluid layout
- Natural integration

---

# Ad Placement Strategy

## Strategic Reasoning

### Why These Locations?

1. **Above-the-Fold Hero**
   - Highest visibility
   - Users see it before scrolling
   - Banner format = high CPM
   - Responsive = good mobile revenue

2. **In-Feed Integration**
   - Natural reading flow
   - Users already engaged
   - Blends with content
   - Multiple impressions per session

3. **Footer Rectangle**
   - Captures engaged users
   - Medium rectangle = versatile
   - After content consumption
   - Good for retargeting

## Ad Density Guidelines

**Total Page Content**:
- Story cards: 12-50 (typical)
- Filters: 1 row
- Navigation: Header

**Ad Distribution**:
- Hero ad: 1 (above fold)
- In-feed ads: 1 per 8 cards (e.g., 3-6 ads for 24-48 cards)
- Footer ad: 1 (end of content)

**Ratio**: ~30% ads / 70% content ✅

**Spacing**: 150px minimum from interactive elements ✅

---

# Best Practices

## 1. Performance Optimization

### Lazy Loading

Ads only load when visible in viewport:

```typescript
useEffect(() => {
  if (isVisible && typeof window !== 'undefined') {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }
}, [isVisible]);
```

### Script Loading Strategy

- Use `next/script` with `strategy="afterInteractive"`
- Prevents blocking initial page render
- Improves Core Web Vitals scores

### Disable in Development

```typescript
if (process.env.NODE_ENV !== 'production') {
  return <div className="border-2 border-dashed p-4">Ad Placeholder</div>;
}
```

## 2. Mobile Optimization

### Responsive Ad Units

```html
<ins class="adsbygoogle"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true">
</ins>
```

### Mobile-Specific Sizes

- Use 320x100 instead of 320x50 for better fill rates
- Enable full-width responsive for portrait mode
- Maintain 150px spacing from content

### Mobile Behavior

**Responsive Behavior**:
- Hero: 728x90 → 320x100
- In-feed: Auto-adjusts to card width
- Footer: 300x250 (same on mobile)

## 3. User Experience

### Prevent Accidental Clicks

- Minimum 150px spacing between ads and interactive elements
- Clear visual distinction between ads and content
- Use border/background to separate ad from content

### Ad Density

- Maximum 3 ads per screen height
- No ads within first 500px on mobile
- No two ads directly adjacent

### Loading States

```tsx
{!adLoaded && (
  <div className="h-[250px] bg-gray-100 animate-pulse" />
)}
```

## 4. Content Policy Compliance

### Prohibited Content

- Adult content
- Violent or graphic content
- Illegal content
- Copyright violations

### Required Disclosures

- Privacy policy with cookie usage
- Terms of service
- GDPR compliance for EU users
- CCPA compliance for California users

---

# Performance Optimization

## Core Web Vitals

### Largest Contentful Paint (LCP)

- Load AdSense script after interactive
- Use lazy loading for below-fold ads
- Target: < 2.5 seconds

### Cumulative Layout Shift (CLS)

- Reserve space for ads with fixed heights
- Use skeleton loaders during ad load
- Target: < 0.1

### First Input Delay (FID)

- Defer non-critical ad scripts
- Target: < 100ms

## Monitoring

### AdSense Dashboard Metrics

- Page RPM (Revenue per 1000 impressions)
- CTR (Click-through rate) - Target: 1-3%
- CPC (Cost per click)
- Fill rate - Target: > 90%

### Performance Tracking

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

---

# Expected Revenue

## Revenue Estimates

### Assumptions

- 1,000 daily visitors
- 3 page views per session
- Average CPM: $2-5
- Average CTR: 1-3%

### Monthly Revenue Estimate

- **Low**: $60-90/month
- **Medium**: $180-300/month
- **High**: $450-750/month

### Growth Factors

- Quality content → Higher CPM
- More traffic → More impressions
- Better engagement → Higher CTR
- Optimized placement → Better fill rate

## Performance Metrics to Monitor

### Key Metrics

- Page RPM (Revenue per 1000 impressions)
- CTR (Click-through rate)
- Fill rate (% of ad requests filled)
- Viewability (% of ads actually seen)

### Targets

- CTR: 1-3% (good)
- Fill Rate: >90%
- Viewability: >50%
- Page RPM: $2-10+

---

# Troubleshooting

## Common Issues

### 1. Ads Not Showing

**Symptoms**: Empty ad spaces or "AdSense ad" placeholder

**Solutions**:
- Check environment variable is set correctly
- Verify publisher ID format: `ca-pub-XXXXXXXXXXXXXXXX`
- Ensure ads.txt file is accessible at root
- Wait 24-48 hours after initial setup
- Check browser console for errors
- Verify site is approved in AdSense dashboard

### 2. Low Fill Rate

**Symptoms**: Many empty ad slots

**Solutions**:
- Enable multiple ad sizes for single slot
- Use responsive ad units
- Check geographic targeting settings
- Review content policy compliance
- Increase site traffic (minimum threshold required)

### 3. Policy Violations

**Symptoms**: Email from Google about policy issues

**Solutions**:
- Review AdSense program policies
- Check specific violation in dashboard
- Remove or fix problematic content
- Request review after fixes
- May take 7-30 days for review

### 4. Layout Shift Issues

**Symptoms**: Content jumps when ads load

**Solutions**:
- Set explicit heights for ad containers
- Use CSS aspect ratios
- Implement skeleton loaders
- Test on multiple devices

## Testing Ads

### Development Environment

- Ads don't show in development mode
- Use placeholder divs for layout testing
- Test in production or staging environment

### Ad Preview

- Use AdSense dashboard ad preview tool
- Test different device sizes
- Verify responsive behavior

### Browser Console Checks

```javascript
// Check if AdSense script loaded
console.log(window.adsbygoogle);

// Check for errors
// Look for "adsbygoogle.push() error" messages
```

---

# Compliance

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

## Policy Requirements

### Content Quality

- Original content required
- No copyright violations
- Appropriate language and topics
- Regular content updates

### User Experience

- Clear navigation
- No deceptive practices
- No forced clicks
- Proper ad labeling

### Technical Requirements

- ads.txt file required
- Valid publisher ID
- Proper script implementation
- Responsive design

---

# Revenue Optimization Tips

## 1. Strategic Placement

- Place ads where users naturally pause
- Test different positions with A/B testing
- Focus on high-traffic pages

## 2. Content Quality

- More content = more ad impressions
- Quality content = higher CPM
- Regular updates keep users returning

## 3. Traffic Growth

- SEO optimization
- Social media promotion
- Content marketing
- Email newsletters

## 4. Ad Optimization

- Test different ad formats
- Enable auto ads for optimization
- Review performance reports weekly
- Adjust placement based on data

## 5. User Engagement

- Longer session duration = more impressions
- Reduce bounce rate
- Improve page load speed
- Mobile-friendly design

---

# Resources

## Google AdSense

- [AdSense Homepage](https://www.google.com/adsense/)
- [AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Program Policies](https://support.google.com/adsense/answer/48182)
- [AdSense Community Forums](https://support.google.com/adsense/community)

## Technical Documentation

- [Next.js Script Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)
- [Web Vitals](https://web.dev/vitals/)
- [Google Publisher Policies](https://support.google.com/publisherpolicies/)

## Best Practices

- [AdSense Optimization Tips](https://support.google.com/adsense/answer/17957)
- [Responsive Ad Units](https://support.google.com/adsense/answer/9183362)
- [Ad Placement Best Practices](https://support.google.com/adsense/answer/1282097)

---

# Next Steps

## Week 1: Setup & Monitoring

1. Complete all setup steps
2. Monitor AdSense dashboard daily
3. Fix any policy issues immediately
4. Verify ads showing correctly
5. Check for errors in browser console

## Week 2: Initial Optimization

1. Review performance reports
2. Identify top-performing ad units
3. Remove underperforming units
4. Test different ad positions
5. Analyze user behavior

## Month 1: Scale & Optimize

1. Optimize based on data
2. Increase quality content
3. Grow organic traffic
4. Improve user engagement metrics
5. Test advanced placements

## Ongoing: Maintain & Grow

1. Monitor weekly performance
2. Stay updated on policy changes
3. Create regular content
4. Optimize based on seasonal trends
5. Scale successful strategies

---

# Summary

## What You Get

✅ **3 Strategic Ad Placements** on browse page
✅ **Responsive Design** (mobile + desktop)
✅ **Production-Ready Code** with error handling
✅ **Comprehensive Documentation**
✅ **Performance Optimized** (Core Web Vitals friendly)
✅ **Policy Compliant** (follows Google guidelines)
✅ **Revenue Potential** ($60-750+/month based on traffic)

## Implementation Status

All code is implemented and ready for production. Just add your AdSense credentials:

1. Publisher ID in `.env.local`
2. Slot IDs in code (3 locations)
3. Publisher ID in `ads.txt`
4. Deploy to production

## Support

For technical issues with implementation:
- Check browser console for errors
- Review Next.js server logs
- Test in incognito mode (disable ad blockers)

For AdSense-specific issues:
- Contact Google AdSense support
- Visit AdSense Community forums
- Review policy center in dashboard

---

**Ready to monetize!** 🚀💰

Follow the Quick Start section to get your ads live in 5 minutes.
