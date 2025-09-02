import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { ChapterEditor } from "@/components/writing/ChapterEditor";
import { getChapterWithPart, getStoryWithStructure } from '@/lib/db/queries';

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

  // Transform chapter data to match ChapterEditor interface
  const chapterData = {
    id: chapterInfo.chapter.id,
    title: chapterInfo.chapter.title,
    partTitle: chapterInfo.partTitle || "Chapter",
    wordCount: chapterInfo.chapter.wordCount || 0,
    targetWordCount: chapterInfo.chapter.targetWordCount || 4000,
    status: chapterInfo.chapter.status || 'draft',
    purpose: chapterInfo.chapter.summary || "Chapter purpose",
    hook: "Chapter hook", // We could add this to schema later
    characterFocus: "Character focus", // We could add this to schema later
    scenes: storyStructure.scenes // Use scenes from the story structure
  };
  
  return <ChapterEditor chapter={chapterData} story={storyStructure} />;
}