import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ChapterEditor } from "@/components/writing/ChapterEditor";

// Sample chapter data
const sampleChapter = {
  id: "chapter-16",
  title: "Chapter 16: \"Final Confrontation\"",
  partTitle: "Part III",
  wordCount: 2847,
  targetWordCount: 4000,
  status: "in_progress",
  purpose: "Maya's final confrontation and power acceptance",
  hook: "Elena trapped, Void Collector's ultimatum",
  characterFocus: "Maya's transformation, Elena's rescue",
  scenes: [
    {
      id: "scene-1",
      title: "Entering the Void",
      status: "completed" as const,
      wordCount: 856,
      goal: "Maya infiltrates Shadow Realm",
      conflict: "Void defenses",
      outcome: "Discovers Elena's location but alerts Void Collector"
    },
    {
      id: "scene-2",
      title: "Power's Temptation",
      status: "in_progress" as const,
      wordCount: 991,
      goal: "Resist corruption",
      conflict: "Void Collector's offer",
      outcome: "[In Progress] Maya must choose power or purity"
    },
    {
      id: "scene-3",
      title: "True Strength",
      status: "planned" as const,
      wordCount: 0,
      goal: "Save Elena",
      conflict: "Final battle",
      outcome: "Victory"
    }
  ]
};

export default async function WritePage({ params }: { params: Promise<{ chapterId: string }> }) {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  const { chapterId } = await params;
  
  return <ChapterEditor chapter={sampleChapter} />;
}