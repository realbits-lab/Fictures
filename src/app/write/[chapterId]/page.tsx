import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { UnifiedWritingEditor } from "@/components/writing/UnifiedWritingEditor";
import { getChapterWithPart, getStoryWithStructure, getUserStoriesWithFirstChapter } from '@/lib/db/queries';

export default async function WritePage({ params }: { params: Promise<{ chapterId: string }> }) {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  const { chapterId } = await params;
  
  // Get chapter data with part information from database
  const chapterInfo = await getChapterWithPart(chapterId, session.user?.id);
  
  if (!chapterInfo || !chapterInfo.storyId) {
    notFound();
  }

  // Get story structure for navigation sidebar
  const storyStructure = await getStoryWithStructure(chapterInfo.storyId, session.user?.id);
  
  if (!storyStructure) {
    notFound();
  }

  // Get all user stories for the story list sidebar
  const allUserStories = await getUserStoriesWithFirstChapter(session.user?.id);

  // Create initial selection to focus on the story level first
  const initialSelection = {
    level: "story" as const,
    storyId: chapterInfo.storyId
  };
  
  return (
    <UnifiedWritingEditor 
      story={storyStructure} 
      allStories={allUserStories}
      initialSelection={initialSelection}
    />
  );
}