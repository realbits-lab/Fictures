import { MainLayout } from "@/components/layout";
import { StoryOverview } from "@/components/story/StoryOverview";

// Sample story data
const sampleStory = {
  id: "1",
  title: "The Shadow Keeper",
  genre: "Urban Fantasy",
  status: "Publishing",
  startDate: "Mar 2024",
  wordCount: 63000,
  targetWordCount: 80000,
  readers: 2400,
  rating: 4.7,
  parts: [
    {
      id: "1",
      title: "Setup",
      completed: true,
      chapters: 5,
      wordCount: 20000
    },
    {
      id: "2", 
      title: "Dev",
      completed: true,
      chapters: 8,
      wordCount: 35000
    },
    {
      id: "3",
      title: "Res",
      completed: false,
      chapters: 2,
      wordCount: 8000
    }
  ]
};

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <MainLayout>
      <StoryOverview story={sampleStory} />
    </MainLayout>
  );
}