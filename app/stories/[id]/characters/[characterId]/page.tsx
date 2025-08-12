'use client';

import { CharacterProfileEditor } from '@/components/ai-writing/character-development';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CharacterPageProps {
  params: { id: string; characterId: string };
}

export default function CharacterPage({ params }: CharacterPageProps) {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Character Profile: {params.characterId}</CardTitle>
        </CardHeader>
        <CardContent>
          <CharacterProfileEditor 
            storyId={params.id} 
            characterId={params.characterId}
          />
        </CardContent>
      </Card>
    </div>
  );
}