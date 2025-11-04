# Google Analytics 4 Setup

## Installation Complete ✅

Google Analytics 4 has been successfully integrated into your Next.js application with comprehensive event tracking.

### Changes Made

#### 1. Package Installation
```bash
pnpm add @next/third-parties
```

**Installed Version**: `@next/third-parties@16.0.0`

#### 2. Code Integration

**Files Created**:

1. **`src/lib/analytics/google-analytics.ts`** - Comprehensive GA utilities
2. **`src/components/analytics/GoogleAnalytics.tsx`** - Server component for loading GA scripts
3. **`src/components/analytics/PageViewTracker.tsx`** - Client component for automatic page view tracking

**File Modified**: `src/app/layout.tsx`

**Changes**:
- Added imports for GA components
- Added `<GoogleAnalytics />` component in `<head>` tag (line 42)
- Added `<PageViewTracker />` component inside SessionProvider (line 50)

**Implementation**:
```typescript
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { PageViewTracker } from '@/components/analytics/PageViewTracker';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <AdSenseScript />
        <GoogleAnalytics />
      </head>
      <body>
        <ThemeProvider>
          <SessionProvider session={session}>
            <AuthModalProvider>
              <PageViewTracker />
              <GlobalNavigation />
              {children}
              <AuthModal />
              <Toaster />
            </AuthModalProvider>
          </SessionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
```

#### 3. Event Tracking Integration

Google Analytics event tracking has been added to key user actions throughout the application:

##### Authentication Events
- **File**: `src/components/auth/SignOutButton.tsx`
  - Tracks: `trackEngagement.signOut()`

- **File**: `src/components/auth/LoginForm.tsx`
  - Tracks: `trackEngagement.signIn('email')` for email login
  - Tracks: `trackEngagement.signIn('google')` for Google OAuth login

##### Story Creation Events
- **File**: `src/components/stories/CreateStoryForm.tsx`
  - Tracks: `trackStoryEvent.create(storyId)` when story generation completes

##### Reading Events
- **File**: `src/components/novels/ChapterReaderClient.tsx`
  - Tracks: `trackReading.startReading(storyId, chapterId)` when user starts reading

- **File**: `src/components/novels/LikeButton.tsx`
  - Tracks: `trackReading.bookmark(storyId)` when user likes a story
  - Tracks: `trackCommunity.like(commentId)` when user likes a comment

##### Community Events
- **File**: `src/components/community/CreatePostForm.tsx`
  - Tracks: `trackCommunity.createPost(postId)` when user creates a community post

- **File**: `src/components/novels/CommentForm.tsx`
  - Tracks: `trackCommunity.comment(storyId)` when user posts a comment

##### Discovery Events
- **File**: `src/components/browse/StoryGrid.tsx`
  - Tracks: `trackSearch.filterByGenre(genre)` when user filters by genre
  - Tracks: `trackStoryEvent.view(storyId, storyTitle)` when user views a story

## Next Steps to Enable Analytics

### Step 1: Add Google Analytics Measurement ID

Add the following environment variable to your `.env.local` file:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**How to get your Measurement ID:**
1. Go to Google Analytics: https://analytics.google.com/
2. Create a new GA4 property (or use an existing one)
3. Navigate to **Admin** → **Data Streams**
4. Select or create a **Web** data stream
5. Copy the **Measurement ID** (starts with "G-")

### Step 2: Deploy to Production

Deploy your application using one of these methods:

**Option A: Git Push (Recommended)**
```bash
git add .
git commit -m "Add Google Analytics tracking"
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
2. Navigate through pages and perform key actions (sign in, view stories, etc.)
3. Go to Google Analytics → **Reports** → **Realtime**
4. You should see active users and events appearing in real-time
5. Wait 24-48 hours for historical data to appear in standard reports

## What Google Analytics Tracks

### Automatic Tracking

#### Page Views
- **Automatic**: All page navigation is tracked automatically via `PageViewTracker` component
- **Events**: `page_view` event with full URL path and query parameters

### Custom Event Tracking

#### Story Events
- `create_story` - When user completes AI story generation
- `view_story` - When user opens a story to read
- `edit_story` - When user edits story content (utility available)
- `delete_story` - When user deletes a story (utility available)
- `publish_story` - When user publishes a story (utility available)
- `generate_chapter` / `generate_scene` / `generate_character` - AI content generation (utility available)

#### User Engagement Events
- `sign_in` - User authentication (email or Google method tracked)
- `sign_out` - User signs out
- `sign_up` - New user registration (utility available)

#### Reading Events
- `start_reading` - User starts reading a story/chapter
- `finish_chapter` - User completes a chapter (utility available)
- `bookmark_story` - User likes/bookmarks a story

#### Community Events
- `view_community_post` - User views a community post (utility available)
- `create_community_post` - User creates a community post
- `comment_on_post` - User posts a comment
- `like_post` - User likes a comment or post

#### Search and Discovery Events
- `filter_by_genre` - User filters stories by genre
- `search` - User searches for stories (utility available)

#### Error Tracking Events (Utilities Available)
- `api_error` - API endpoint failures
- `client_error` - Client-side errors

#### Performance Tracking Events (Utilities Available)
- `content_load_time` - Page load performance metrics

#### Conversion Events (Utilities Available)
- `complete_onboarding` - User completes onboarding
- `first_story_created` - User's first story creation milestone
- `first_story_published` - User's first story publication milestone

## Analytics Utilities Reference

### Import Statement
```typescript
import {
  trackStoryEvent,
  trackEngagement,
  trackReading,
  trackCommunity,
  trackSearch,
  trackError,
  trackPerformance,
  trackConversion
} from '@/lib/analytics/google-analytics';
```

### Usage Examples

#### Story Events
```typescript
// Track story creation
trackStoryEvent.create(storyId);

// Track story view with title
trackStoryEvent.view(storyId, storyTitle);

// Track story editing
trackStoryEvent.edit(storyId);

// Track story deletion
trackStoryEvent.delete(storyId);

// Track story publishing
trackStoryEvent.publish(storyId);

// Track AI content generation
trackStoryEvent.generateContent('chapter', storyId);
trackStoryEvent.generateContent('scene', storyId);
trackStoryEvent.generateContent('character', storyId);
```

#### User Engagement
```typescript
// Track sign in
trackEngagement.signIn('email');
trackEngagement.signIn('google');

// Track sign out
trackEngagement.signOut();

// Track sign up
trackEngagement.signUp('email');
trackEngagement.signUp('google');
```

#### Reading Events
```typescript
// Track reading start
trackReading.startReading(storyId, chapterId);

// Track chapter completion
trackReading.finishChapter(storyId, chapterId);

// Track bookmark
trackReading.bookmark(storyId);
```

#### Community Events
```typescript
// Track post view
trackCommunity.viewPost(postId);

// Track post creation
trackCommunity.createPost(postId);

// Track comment
trackCommunity.comment(postId);

// Track like
trackCommunity.like(postId);
```

#### Search and Discovery
```typescript
// Track search
trackSearch.search(query, resultCount);

// Track genre filter
trackSearch.filterByGenre(genre);
```

#### Error Tracking
```typescript
// Track API errors
trackError.apiError('/api/stories', 'Failed to fetch');

// Track client errors
trackError.clientError('Network timeout');
```

#### Performance Tracking
```typescript
// Track content load time
trackPerformance.contentLoad('StoryPage', loadTimeMs);
```

#### Conversion Tracking
```typescript
// Track onboarding completion
trackConversion.completeOnboarding();

// Track first story milestone
trackConversion.firstStoryCreated();

// Track first publish milestone
trackConversion.firstStoryPublished();
```

## Google Analytics Dashboard

### Key Metrics to Monitor

Once analytics is enabled, you can view:

#### Realtime Reports
- **Realtime** → View active users and current events
- See what pages users are viewing right now
- Monitor events as they happen

#### Standard Reports
- **Reports** → **Life cycle** → **Acquisition** - How users find your site
- **Reports** → **Life cycle** → **Engagement** - Page views, events, and user behavior
- **Reports** → **Life cycle** → **Retention** - User retention and churn
- **Reports** → **User** → **Demographics** - User age, gender, location
- **Reports** → **User** → **Tech** - Devices, browsers, OS

#### Custom Reports
Create custom reports to track:
- Story creation funnel (view → start → complete)
- Reading engagement (stories read, chapters completed)
- Community participation (posts, comments, likes)
- User journey from discovery to content creation

#### Exploration Reports
- **Explore** → Create funnels to track user flows
- Analyze story creation completion rates
- Track reading session duration
- Identify drop-off points in user journey

## Advanced Configuration

### Custom Dimensions (Optional)

You can add custom dimensions in Google Analytics to track additional data:

1. Go to **Admin** → **Custom definitions** → **Create custom dimension**
2. Add dimensions for:
   - `story_genre` - Track which genres are most popular
   - `user_role` - Track behavior by user role (reader, writer, manager)
   - `story_status` - Track engagement by story status
   - `content_type` - Track which content types users engage with

### Enhanced Measurement

Enable Enhanced Measurement in GA4 for automatic tracking:
- **Scrolls** - Track how far users scroll on pages
- **Outbound clicks** - Track external links
- **Site search** - Track internal searches
- **Video engagement** - If you add videos later
- **File downloads** - Track downloadable content

### Debug Mode

To see analytics events in the browser console during development:

```typescript
// In src/lib/analytics/google-analytics.ts
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';
export const GA_DEBUG = process.env.NODE_ENV === 'development';
```

Then in components:
```typescript
if (GA_DEBUG) {
  console.log('GA Event:', { action, category, label, value });
}
```

## Privacy & Compliance

### GDPR Compliance

Google Analytics 4 is designed for privacy:
- **IP Anonymization**: GA4 does not log or store IP addresses
- **Cookieless tracking**: Can function without cookies (with reduced functionality)
- **Data retention**: Configure in Admin → Data Settings → Data Retention
- **User deletion**: Can delete user data on request

### Cookie Consent

If you need to implement cookie consent for GDPR:

1. Install a consent management platform (CMP) like:
   - `@cookieyes/cookie-consent`
   - `react-cookie-consent`
   - Onetrust

2. Conditionally load GA based on consent:
```typescript
export function GoogleAnalytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    // Check for stored consent
    const consent = localStorage.getItem('ga-consent');
    setHasConsent(consent === 'granted');
  }, []);

  if (!GA_MEASUREMENT_ID || !hasConsent) {
    return null;
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      {/* ... */}
    </>
  );
}
```

### Data Control

Users can opt out of Google Analytics:
- Browser extension: https://tools.google.com/dlpage/gaoptout
- Your privacy policy should mention GA tracking
- Provide opt-out mechanism if required by regulations

## Troubleshooting

### Analytics Not Showing Data?

1. **Check Measurement ID**
   - Verify `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in `.env.local`
   - Ensure ID starts with "G-" (not "UA-" for old Universal Analytics)

2. **Verify Deployment**
   - Analytics only works on deployed sites (not localhost)
   - Check browser console for GA script loading errors

3. **Wait for Data**
   - Realtime reports show data within seconds
   - Standard reports may take 24-48 hours to populate

4. **Check Browser Extensions**
   - Ad blockers may block GA scripts
   - Test in incognito mode or different browser

5. **Verify Script Loading**
   - Open browser DevTools → Network tab
   - Look for requests to `www.googletagmanager.com`
   - Check for `gtag/js` script loading

### Events Not Appearing?

1. **Check Event Names**
   - Event names are case-sensitive
   - Verify spelling matches GA4 standards

2. **Test Events**
   - Use GA4 DebugView (Admin → DebugView)
   - Add `?debug_mode=true` to URL for testing

3. **Verify Tracking Code**
   - Check that tracking functions are being called
   - Add console.log to verify execution

### Common Errors

**Error**: "gtag is not defined"
- **Solution**: Ensure `<GoogleAnalytics />` component is loaded in layout head

**Error**: Events tracked but not showing in reports
- **Solution**: Wait 24-48 hours for data processing; check Realtime reports first

**Error**: Page views tracked as "(not set)"
- **Solution**: Ensure `PageViewTracker` has access to `usePathname` and `useSearchParams`

## Integration with Other Analytics

This GA4 implementation works alongside:
- ✅ **Vercel Analytics** - Web Vitals and performance metrics
- ✅ **Google AdSense** - Ad performance tracking
- ✅ **Custom Event Tracking** - Your own analytics endpoints

All analytics platforms can coexist without conflicts.

## Data Analysis Tips

### Key Questions to Answer

1. **User Acquisition**
   - Where do users come from? (Referral sources)
   - Which marketing channels drive the most traffic?
   - What's the conversion rate from visitor to creator?

2. **User Engagement**
   - How many stories are created per user?
   - What's the average reading session duration?
   - Which genres are most popular?
   - What's the retention rate after 7/30 days?

3. **Content Performance**
   - Which stories get the most views?
   - What's the chapter completion rate?
   - How many users leave comments or likes?
   - What's the publishing frequency?

4. **Conversion Funnel**
   - Visitor → Reader → Writer → Publisher
   - Where do users drop off?
   - What features drive conversions?

5. **Community Health**
   - How active is the community?
   - What's the comment/like ratio?
   - How many posts per story?
   - What's the response time on posts?

### Recommended Reports

Create these custom reports:
1. **Story Creation Funnel**: View story → Start reading → Create account → Generate story
2. **Reading Engagement**: Stories viewed, chapters read, time spent reading
3. **Community Participation**: Posts created, comments made, likes given
4. **User Journey**: From first visit to first story published
5. **Content Pipeline**: Stories created → Stories published → Stories with engagement

## Documentation

- **GA4 Documentation**: https://support.google.com/analytics/answer/9304153
- **GA4 Events Guide**: https://support.google.com/analytics/answer/9267735
- **Measurement Protocol**: https://developers.google.com/analytics/devguides/collection/protocol/ga4
- **Next.js Integration**: https://nextjs.org/docs/app/building-your-application/optimizing/analytics

## Support

If you encounter issues:
1. Check Google Analytics Status: https://www.google.com/appsstatus/dashboard/
2. GA4 Community: https://support.google.com/analytics/community
3. Stack Overflow: https://stackoverflow.com/questions/tagged/google-analytics-4

---

**Setup Date**: 2025-10-24
**Version**: @next/third-parties@16.0.0
**Status**: ✅ Installed and Integrated - Awaiting GA_MEASUREMENT_ID Configuration

## Quick Start Checklist

- [x] Install @next/third-parties package
- [x] Create GA utilities (`src/lib/analytics/google-analytics.ts`)
- [x] Create GoogleAnalytics component
- [x] Create PageViewTracker component
- [x] Add components to root layout
- [x] Add event tracking to key user actions
- [ ] Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to `.env.local`
- [ ] Deploy to production
- [ ] Verify events in GA4 Realtime reports
- [ ] Create custom reports and dashboards
- [ ] Set up alerts for important metrics
