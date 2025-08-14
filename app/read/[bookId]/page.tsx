import { notFound } from 'next/navigation';
import { getBookById } from '@/lib/db/queries/books';
import { getPublishedChaptersByStory } from '@/lib/db/chapter-queries';
import Link from 'next/link';

export default async function PublicBookPage({ 
  params 
}: { 
  params: Promise<{ bookId: string }>
}) {
  // Await params as required in Next.js 15
  const { bookId } = await params;
  
  // Get book data
  const book = await getBookById(bookId);
  
  if (!book) {
    notFound();
  }
  
  // Get published chapters
  const chapters = await getPublishedChaptersByStory(bookId);
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        {/* Book Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {book.coverImageUrl && (
            <div className="flex-shrink-0">
              <img
                src={book.coverImageUrl}
                alt={book.title}
                className="w-48 h-72 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}
          
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{book.title}</h1>
            <p className="text-lg text-gray-600 mb-4">by Author</p>
            
            {book.description && (
              <p className="text-gray-700 mb-4 leading-relaxed">
                {book.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {book.genre && <span className="bg-gray-100 px-2 py-1 rounded">{book.genre}</span>}
              <span>{book.chapterCount} chapters</span>
              <span>{book.wordCount.toLocaleString()} words</span>
              {book.status && <span className="capitalize">{book.status}</span>}
            </div>
            
            {book.tags && book.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {book.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Chapters List */}
        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">Chapters</h2>
          
          {chapters.length > 0 ? (
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/read/${bookId}/chapter/${chapter.chapterNumber}`}
                  className="block p-4 border rounded-lg hover:shadow-md transition-shadow hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{chapter.title}</h3>
                      {chapter.authorNote && (
                        <p className="text-sm text-gray-600 mt-1">{chapter.authorNote}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>{chapter.wordCount.toLocaleString()} words</div>
                      {chapter.publishedAt && (
                        <div>Published {new Date(chapter.publishedAt).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center">
              No published chapters available yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}