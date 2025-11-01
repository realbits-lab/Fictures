import { Suspense } from 'react';
import { MainLayout } from '@/components/layout';
import { ChapterReaderClient } from '@/components/reading/ChapterReaderClient';
import { StoryHeaderSkeleton, ChapterListSkeleton } from '@/components/reading/ReadingSkeletons';
import { getStoryForReading } from '@/lib/db/reading-queries';
import { notFound } from 'next/navigation';

interface ReadPageProps {
  params: Promise<{ id: string }>;
}

// ⚡ Strategy 2: Partial Prerendering (PPR)
// Enable experimental PPR to pre-render static shell at build time
export const experimental_ppr = true;

// ⚡ Strategy 4: Edge Runtime
// TODO: Enable after fixing UI component file casing issues
// export const runtime = 'edge';

// ⚡ Strategy 1: Streaming SSR with Suspense Boundaries
// Split loading into progressive chunks for faster perceived performance

async function StoryHeader({ storyId }: { storyId: string }) {
  const pageLoadStart = Date.now();
  console.log('\n🚀 [SSR-Stream] StoryHeader loading started');

  // ⚡ Strategy 3: Use optimized reading query (skips studio fields, keeps imageVariants)
  const story = await getStoryForReading(storyId);

  const loadDuration = Date.now() - pageLoadStart;
  console.log(`✅ [SSR-Stream] StoryHeader loaded in ${loadDuration}ms (optimized query)`);

  if (!story) {
    notFound();
  }

  return <ChapterReaderClient storyId={storyId} initialData={story} />;
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { id } = await params;
  console.log(`📖 [SSR] Streaming page for story: ${id}`);

  return (
    <MainLayout>
      {/* Stream story content progressively */}
      <Suspense fallback={<StoryHeaderSkeleton />}>
        <StoryHeader storyId={id} />
      </Suspense>
    </MainLayout>
  );
}