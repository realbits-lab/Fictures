import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { UnifiedWritingEditor } from "@/components/writing/UnifiedWritingEditor";
import { getStoryWithStructure } from '@/lib/db/queries';

export default async function WriteStoryPage({ params }: { params: Promise<{ storyId: string }> }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { storyId } = await params;

  // Get story structure for navigation sidebar
  const storyStructure = await getStoryWithStructure(storyId, true, session.user?.id);

  if (!storyStructure) {
    notFound();
  }

  // Check write permissions - user must be the author for write access
  if (storyStructure.authorId !== session.user?.id) {
    notFound();
  }

  // Create initial selection to focus on the story level first
  const initialSelection = {
    level: "story" as const,
    storyId: storyId
  };

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