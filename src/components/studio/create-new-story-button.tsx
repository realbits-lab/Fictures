'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function CreateNewStoryButton() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNewStory = async () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    setIsCreating(true);
    try {
      // Create empty story
      const response = await fetch('/studio/api/stories/create-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          title: 'Untitled Story',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create story');
      }

      const data = await response.json();

      // Navigate to agent chat page with the new story
      router.push(`/studio/agent/new?storyId=${data.storyId}`);
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Failed to create story. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={handleCreateNewStory}
      disabled={isCreating}
      size="lg"
      className="gap-2"
    >
      {isCreating ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Sparkles className="h-5 w-5" />
          Create New Story
        </>
      )}
    </Button>
  );
}
