'use client';

import { CharacterDevelopmentDashboard } from '@/components/ai-writing/character-development';

interface CharactersPageProps {
  params: { id: string };
}

export default function CharactersPage({ params }: CharactersPageProps) {
  return (
    <div className="container mx-auto p-6">
      <CharacterDevelopmentDashboard storyId={params.id} />
    </div>
  );
}