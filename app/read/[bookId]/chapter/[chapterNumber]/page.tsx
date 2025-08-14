import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBookById } from '@/lib/db/queries/books';
import { getChapterByNumber, getNextChapter, getPreviousChapter } from '@/lib/db/chapter-queries';

export default async function PublicChapterPage({ 
  params 
}: { 
  params: Promise<{ bookId: string; chapterNumber: string }>
}) {
  // Await params as required in Next.js 15
  const { bookId, chapterNumber: chapterNumberStr } = await params;
  const chapterNumber = parseInt(chapterNumberStr);
  
  // Get book data
  const book = await getBookById(bookId);
  
  if (!book) {
    notFound();
  }
  
  // Get the chapter
  const chapter = await getChapterByNumber(bookId, chapterNumber);
  
  if (!chapter || !chapter.isPublished) {
    notFound();
  }
  
  // Get navigation chapters
  const [previousChapter, nextChapter] = await Promise.all([
    getPreviousChapter(bookId, chapterNumber),
    getNextChapter(bookId, chapterNumber)
  ]);
  
  // Extract content from different storage formats
  let chapterContent = '';
  
  if (typeof chapter.content === 'string') {
    chapterContent = chapter.content;
  } else if (Array.isArray(chapter.content)) {
    // Legacy format: [{ type: 'paragraph', children: [{ text: content }] }]
    try {
      const firstBlock = chapter.content[0];
      if (firstBlock?.children?.[0]?.text) {
        chapterContent = firstBlock.children[0].text;
      }
    } catch (e) {
      console.warn('Failed to extract content from legacy format:', e);
    }
  } else if (typeof chapter.content === 'object' && chapter.content !== null) {
    // Fallback for other object formats
    chapterContent = JSON.stringify(chapter.content);
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with book info and navigation */}
      <div className="mb-8">
        <nav className="text-sm text-gray-600 mb-4">
          <Link href="/read" className="hover:text-blue-600">
            Discover Stories
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/read/${bookId}`} className="hover:text-blue-600">
            {book.title}
          </Link>
          <span className="mx-2">/</span>
          <span>Chapter {chapterNumber}</span>
        </nav>
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{chapter.title}</h1>
            <p className="text-gray-600">
              by Author • {chapter.wordCount.toLocaleString()} words
            </p>
            {chapter.publishedAt && (
              <p className="text-sm text-gray-500 mt-1">
                Published {new Date(chapter.publishedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <Link
            href={`/read/${bookId}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to {book.title}
          </Link>
        </div>
        
        {chapter.authorNote && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Author's Note:</strong> {chapter.authorNote}
            </p>
          </div>
        )}
      </div>
      
      {/* Chapter Content */}
      <div className="prose prose-lg max-w-none mb-8">
        {chapterContent ? (
          <div className="whitespace-pre-wrap leading-relaxed">
            {chapterContent}
          </div>
        ) : (
          <p className="text-gray-500 italic">Chapter content is not available.</p>
        )}
      </div>
      
      {/* Navigation */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center">
          <div>
            {previousChapter && (
              <Link
                href={`/read/${bookId}/chapter/${previousChapter.chapterNumber}`}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <span className="mr-2">←</span>
                <div className="text-left">
                  <div className="text-sm text-gray-600">Previous</div>
                  <div className="font-medium">{previousChapter.title}</div>
                </div>
              </Link>
            )}
          </div>
          
          <div>
            {nextChapter && (
              <Link
                href={`/read/${bookId}/chapter/${nextChapter.chapterNumber}`}
                className="inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                <div className="text-right mr-2">
                  <div className="text-sm text-blue-600">Next</div>
                  <div className="font-medium text-blue-800">{nextChapter.title}</div>
                </div>
                <span>→</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}