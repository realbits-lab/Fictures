import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { UnifiedWritingEditor } from "@/components/writing/UnifiedWritingEditor";
import { getStoryWithStructure } from '@/lib/db/cached-queries';

export default async function WriteStoryPage({ params }: { params: Promise<{ storyId: string }> }) {
  const pageLoadStart = Date.now();
  console.log('\n🚀 [SSR] WriteStoryPage loading started');

  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { storyId } = await params;
  console.log(`📖 [SSR] Loading story: ${storyId}`);

  // Get story structure for navigation sidebar
  const ssrFetchStart = Date.now();
  console.log('⏳ [SSR] Fetching story structure with scenes...');
  const storyStructure = await getStoryWithStructure(storyId, true, session.user?.id);
  const ssrFetchDuration = Date.now() - ssrFetchStart;
  console.log(`✅ [SSR] Story structure fetched in ${ssrFetchDuration}ms`);
  console.log(`📊 [SSR] Story has ${storyStructure?.parts?.length || 0} parts with ${storyStructure?.parts?.reduce((sum, p) => sum + (p.chapters?.length || 0), 0) || 0} total chapters`);

  if (!storyStructure) {
    notFound();
  }

  // Check write permissions - user must be the author for write access
  if (storyStructure.authorId !== session.user?.id) {
    notFound();
  }

  // Count total scenes
  const totalScenes = storyStructure.parts?.reduce((sum, part) => {
    return sum + (part.chapters?.reduce((chSum, ch) => chSum + (ch.scenes?.length || 0), 0) || 0);
  }, 0) || 0;
  console.log(`🎬 [SSR] Story structure includes ${totalScenes} scenes with content`);

  // Create initial selection to focus on the story level first
  const initialSelection = {
    level: "story" as const,
    storyId: storyId
  };

  const pageLoadDuration = Date.now() - pageLoadStart;
  console.log(`🏁 [SSR] WriteStoryPage rendering complete in ${pageLoadDuration}ms\n`);

  return (
    <UnifiedWritingEditor
      story={{
        ...storyStructure,
        hnsData: storyStructure.hnsData || {}
      } as any}
      initialSelection={initialSelection}
      disabled={false}
    />
  );
}