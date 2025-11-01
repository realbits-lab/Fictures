/**
 * Community Story Detail Page - Server Component with PPR
 *
 * Architecture: Hybrid Server/Client
 * - Server Component: Fetches story + posts data via SSR
 * - Client Component: Handles interactivity (create post, real-time updates)
 * - PPR: Pre-renders static shell
 * - Suspense: Progressive streaming
 *
 * Performance Optimizations:
 * - ⚡ SSR data fetching with Redis cache
 * - ⚡ PPR for instant first paint
 * - ⚡ Parallel data fetching (story + posts)
 * - ⚡ Optimized queries (field selection, JOINs)
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { CommunityStoryDetailClient } from '@/components/community/CommunityStoryDetailClient';
import { CommunityStorySkeleton } from '@/components/community/CommunityLoadingSkeleton';
import { getCommunityStoryOptimized, getCommunityPostsOptimized } from '@/lib/db/cached-queries';

interface StoryPageProps {
  params: Promise<{ storyId: string }>;
}

// ⚡ Enable Partial Prerendering (PPR)
export const experimental_ppr = true;

// Server Component for data fetching
async function StoryContent({ storyId }: { storyId: string }) {
  const ssrStart = performance.now();
  console.log('\n📖 [SSR] Community story page rendering started:', storyId);

  try {
    // Parallel data fetching for better performance
    const [story, posts] = await Promise.all([
      getCommunityStoryOptimized(storyId),
      getCommunityPostsOptimized(storyId)
    ]);

    const ssrEnd = performance.now();
    const ssrDuration = Math.round(ssrEnd - ssrStart);
    console.log(`✅ [SSR] Story data fetched in ${ssrDuration}ms`);
    console.log(`📊 [SSR] Posts count: ${posts.length}`);

    if (!story) {
      console.log('❌ [SSR] Story not found:', storyId);
      notFound();
    }

    // Pass SSR data to client component
    return (
      <CommunityStoryDetailClient
        initialStory={story}
        initialPosts={posts}
        storyId={storyId}
      />
    );
  } catch (error) {
    const errorDuration = Math.round(performance.now() - ssrStart);
    console.error(`❌ [SSR] Story data fetch failed after ${errorDuration}ms:`, error);
    throw error;
  }
}

// Main page component
export default async function StoryCommunityPage({ params }: StoryPageProps) {
  const { storyId } = await params;
  console.log('📄 [SSR] Story community page component rendering:', storyId);

  return (
    <MainLayout>
      {/* Progressive content streaming with Suspense */}
      <Suspense fallback={<CommunityStorySkeleton />}>
        <StoryContent storyId={storyId} />
      </Suspense>
    </MainLayout>
  );
}
