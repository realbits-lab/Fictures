# Google AdSense Quick Start Guide

This is a condensed version of the full implementation guide for quick setup. For detailed information, see `google-adsense-implementation.md`.

## 5-Minute Setup

### Step 1: Get Your AdSense Publisher ID

1. Sign up at [Google AdSense](https://www.google.com/adsense/)
2. Complete site verification (may take 24-48 hours)
3. Get your Publisher ID from: Account → Account Information
   - Format: `ca-pub-XXXXXXXXXXXXXXXX`

### Step 2: Configure Environment

Add to your `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
```

**Important**: Replace `XXXXXXXXXXXXXXXX` with your actual publisher ID.

### Step 3: Update ads.txt

Edit `/public/ads.txt` and replace the placeholder:

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

### Step 4: Create Ad Units in AdSense

1. Go to AdSense Dashboard → Ads → Overview
2. Click "By ad unit" → "Display ads"
3. Create these ad units:

| Ad Name | Size | Slot ID (example) | Usage |
|---------|------|-------------------|-------|
| Browse Hero | Responsive | 1234567890 | Above story grid |
| Browse Footer | Rectangle 300x250 | 0987654321 | Below story grid |
| In-Feed Story | In-feed | 5555555555 | Between story cards |

4. Copy each "data-ad-slot" ID (the number after the dash)

### Step 5: Update Slot IDs in Code

**File: `/src/components/browse/BrowseClient.tsx`**

```typescript
// Line 176 - Above-the-fold ad
<AdUnit
  slot="YOUR_HERO_AD_SLOT_ID"  // ← Replace this
  format="horizontal"
  ...
/>

// Line 188 - End-of-content ad
<AdUnit
  slot="YOUR_FOOTER_AD_SLOT_ID"  // ← Replace this
  format="rectangle"
  ...
/>
```

**File: `/src/components/browse/StoryGrid.tsx`**

```typescript
// Line 360 - In-feed ad
<InFeedAd
  slot="YOUR_INFEED_AD_SLOT_ID"  // ← Replace this
  ...
/>
```

### Step 6: Deploy & Test

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

## Current Ad Placements

### Browse Page (/reading)

```
┌─────────────────────────────────┐
│  Filters (History, View, etc.)  │
├─────────────────────────────────┤
│  🎯 AD #1: Hero Banner          │ ← slot="1234567890"
│     (728x90 desktop,            │
│      320x100 mobile)            │
├─────────────────────────────────┤
│  📚 Story Card 1                │
│  📚 Story Card 2                │
│  📚 Story Card 3                │
│  ...                            │
│  📚 Story Card 8                │
├─────────────────────────────────┤
│  🎯 AD #2: In-Feed              │ ← slot="5555555555"
│     (Matches card style)        │
├─────────────────────────────────┤
│  📚 Story Card 9                │
│  📚 Story Card 10               │
│  ...                            │
├─────────────────────────────────┤
│  🎯 AD #3: Footer Rectangle     │ ← slot="0987654321"
│     (300x250)                   │
└─────────────────────────────────┘
```

### Ad Frequency
- **Hero Ad**: Once at top (highest CTR)
- **In-Feed Ads**: Every 8 story cards
- **Footer Ad**: Once at bottom

### Mobile Optimization
- Responsive ad units automatically adjust size
- Full-width responsive enabled for mobile portrait
- Maintains 30% ads / 70% content ratio

## Verification Checklist

After setup, verify:

- [ ] Environment variable set in `.env.local`
- [ ] ads.txt file updated with your publisher ID
- [ ] All 3 slot IDs replaced in code
- [ ] Site deployed to production
- [ ] AdSense account approved and active
- [ ] No errors in browser console
- [ ] Ads showing on live site (wait 5-10 minutes)

## Troubleshooting

### Ads Not Showing?

1. **Check Environment Variable**
   ```bash
   # In terminal, verify it's set:
   echo $NEXT_PUBLIC_GOOGLE_ADSENSE_ID
   ```

2. **Check Production Mode**
   - Ads ONLY show in production
   - Development mode shows placeholder boxes

3. **Check Browser Console**
   - Open DevTools (F12)
   - Look for AdSense errors
   - Common: "No fill" (normal initially)

4. **Wait Time**
   - New accounts: may take 24-48 hours
   - New ad units: may take 10-30 minutes

5. **Ad Blocker**
   - Disable ad blockers to test
   - Use incognito mode

### Low Fill Rate?

- Enable multiple ad sizes per slot
- Check geographic targeting
- Ensure sufficient traffic (minimum threshold)
- Review content policy compliance

### Policy Violations?

- Review email from Google
- Check AdSense dashboard → Policy center
- Remove/fix flagged content
- Request review (7-30 days)

## Performance Tips

### Core Web Vitals
- Ads use `afterInteractive` loading (optimal)
- Fixed heights prevent layout shift
- Lazy loading for below-fold ads

### Revenue Optimization
- Monitor Page RPM in dashboard
- Target CTR: 1-3%
- Test different ad positions
- Focus on quality content

## Next Steps

1. **Week 1**: Monitor daily, fix any issues
2. **Week 2**: Review performance reports
3. **Month 1**: Optimize based on data
4. **Ongoing**: Add more content, grow traffic

## Support

- **Technical Issues**: Check documentation at `@docs/google-adsense-implementation.md`
- **AdSense Issues**: [Google AdSense Help](https://support.google.com/adsense/)
- **Policy Questions**: AdSense dashboard → Policy center

## Quick Reference

### Ad Slot IDs to Replace

| Location | File | Line | Default Value | Your ID |
|----------|------|------|---------------|---------|
| Hero Banner | BrowseClient.tsx | 177 | "1234567890" | _______ |
| Footer Rectangle | BrowseClient.tsx | 188 | "0987654321" | _______ |
| In-Feed | StoryGrid.tsx | 361 | "5555555555" | _______ |

### Required Files

- ✅ `/public/ads.txt` - Updated with your publisher ID
- ✅ `.env.local` - Contains `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`
- ✅ `/src/app/layout.tsx` - AdSenseScript added (already done)
- ✅ `/src/components/browse/BrowseClient.tsx` - Ads imported (already done)
- ✅ `/src/components/browse/StoryGrid.tsx` - In-feed ads added (already done)

---

**That's it!** You're ready to start earning with AdSense.

Remember: Quality content + Good UX = Better revenue 📈
