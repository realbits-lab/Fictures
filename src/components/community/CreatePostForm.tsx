"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Label } from '@/components/ui';
import { toast } from 'sonner';

interface CreatePostFormProps {
  storyId: string;
  onPostCreated: () => void;
  onCancel: () => void;
}

const postTypes = [
  { value: 'discussion', label: '💭 Discussion', description: 'General story discussion' },
  { value: 'theory', label: '🤔 Theory', description: 'Character/plot theories' },
  { value: 'question', label: '❓ Question', description: 'Ask about the story' },
  { value: 'review', label: '⭐ Review', description: 'Chapter or story review' },
  { value: 'fan-content', label: '🎨 Fan Content', description: 'Fan art, music, etc.' },
];

export function CreatePostForm({ storyId, onPostCreated, onCancel }: CreatePostFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'discussion',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Sign in required
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to be signed in to create posts
          </p>
          <Button onClick={onCancel} variant="outline">
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.warning('Please fill in both title and content');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId,
          title: formData.title,
          content: formData.content,
          type: formData.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post');
      }

      toast.success('Post created successfully!');
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create post. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="border-blue-200 dark:border-blue-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>✍️</span>
          Create New Post
        </CardTitle>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Posting as <strong>{session.user?.name}</strong>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selection */}
          <div>
            <Label className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 block">
              Post Type
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {postTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('type', type.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="font-medium text-sm mb-1">{type.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
              Post Title *
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="What would you like to discuss?"
              maxLength={255}
              className="w-full"
              required
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.title.length}/255 characters
            </div>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content" className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 block">
              Content *
            </Label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Share your thoughts, theories, questions, or fan content..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 resize-y min-h-[120px]"
              required
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex justify-between">
              <span>{formData.content.length} characters</span>
              <span>Markdown formatting supported</span>
            </div>
          </div>

          {/* Guidelines Reminder */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              📋 Community Guidelines
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <li>• Be respectful and constructive in your discussions</li>
              <li>• Use spoiler tags when discussing plot points</li>
              <li>• Keep discussions relevant to the story</li>
              <li>• No harassment, spam, or inappropriate content</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Create Post</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}