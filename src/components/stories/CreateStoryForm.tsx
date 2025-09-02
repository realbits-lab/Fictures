"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';

interface StoryFormData {
  title: string;
  description: string;
  genre: string;
  tags: string;
}

export function CreateStoryForm() {
  const [formData, setFormData] = useState<StoryFormData>({
    title: '',
    description: '',
    genre: '',
    tags: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const story = await response.json();
        router.push(`/write/${story.id}`);
      } else {
        console.error('Failed to create story');
      }
    } catch (error) {
      console.error('Error creating story:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof StoryFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-2xl">📚</span>
          <span>Story Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={handleInputChange('title')}
              placeholder="Enter your story title"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="Describe your story..."
              rows={4}
              disabled={isLoading}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              type="text"
              value={formData.genre}
              onChange={handleInputChange('genre')}
              placeholder="e.g., Fantasy, Romance, Thriller"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={handleInputChange('tags')}
              placeholder="Separate tags with commas"
              disabled={isLoading}
            />
          </div>

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title}
              className="flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Story'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}