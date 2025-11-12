import { notFound, redirect } from "next/navigation";
import { UnifiedWritingEditor } from "@/components/studio/UnifiedWritingEditor";
import { auth } from "@/lib/auth";
import { getChapterWithPart, getStoryWithStructure } from "@/lib/db/queries";

export default async function WritePage({
    params,
}: {
    params: Promise<{ chapterId: string }>;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const { chapterId } = await params;

    // Get chapter data with part information from database
    const chapterInfo = await getChapterWithPart(chapterId, session.user?.id);

    if (!chapterInfo || !chapterInfo.storyId) {
        notFound();
    }

    // Get story structure for navigation sidebar
    const storyStructure = await getStoryWithStructure(
        chapterInfo.storyId,
        true,
        session.user?.id,
    );

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
        storyId: chapterInfo.storyId,
    };

    return (
        <UnifiedWritingEditor
            story={
                {
                    ...storyStructure,
                    hnsData: (storyStructure as any).hnsData || {},
                } as any
            }
            initialSelection={initialSelection}
        />
    );
}
