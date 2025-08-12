'use client';

import { AIWritingAssistant } from '@/components/ai-writing/writing-assistant';
import { PlotStructureDashboard } from '@/components/ai-writing/plot-visualization';
import { WritingProductivityDashboard } from '@/components/ai-writing/writing-productivity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WritePageProps {
  params: { id: string };
}

export default function WritePage({ params }: WritePageProps) {
  return (
    <div className="container mx-auto p-6" data-testid="story-writing-interface">
      <h1 className="text-3xl font-bold mb-6">Writing Tools</h1>
      
      <Tabs defaultValue="assistant" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
          <TabsTrigger value="plot">Plot Structure</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assistant" className="space-y-6">
          <AIWritingAssistant storyId={params.id} />
        </TabsContent>
        
        <TabsContent value="plot" className="space-y-6">
          <PlotStructureDashboard storyId={params.id} />
        </TabsContent>
        
        <TabsContent value="productivity" className="space-y-6">
          <WritingProductivityDashboard storyId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}