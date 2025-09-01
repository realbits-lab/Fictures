import { MainLayout } from "@/components/layout";
import { StoryCard, CreateStoryCard } from "@/components/dashboard";
import { Button } from "@/components/ui";

// Sample stories data
const sampleStories = [
  {
    id: "1",
    title: "The Shadow Keeper",
    genre: "Urban Fantasy",
    parts: { completed: 3, total: 3 },
    chapters: { completed: 15, total: 15 },
    readers: 2400,
    rating: 4.7,
    status: "publishing" as const,
    wordCount: 63000
  },
  {
    id: "2", 
    title: "Dragon Chronicles",
    genre: "Epic Fantasy",
    parts: { completed: 5, total: 7 },
    chapters: { completed: 28, total: 35 },
    readers: 890,
    rating: 4.2,
    status: "draft" as const,
    wordCount: 45000
  },
  {
    id: "3",
    title: "Cyberpunk Nights",
    genre: "Sci-Fi",
    parts: { completed: 2, total: 4 },
    chapters: { completed: 12, total: 20 },
    readers: 456,
    rating: 4.1,
    status: "draft" as const,
    wordCount: 28000
  }
];

export default function StoriesPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <span>📚</span>
              My Stories
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage and organize all your creative works
            </p>
          </div>
          <Button>+ New Story</Button>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sampleStories.map((story) => (
            <StoryCard key={story.id} {...story} />
          ))}
          <CreateStoryCard />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {sampleStories.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Stories
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {sampleStories.reduce((acc, story) => acc + story.chapters.completed, 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Chapters Written
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {sampleStories.reduce((acc, story) => acc + story.readers, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Readers
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {(sampleStories.reduce((acc, story) => acc + story.rating, 0) / sampleStories.length).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg Rating
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}