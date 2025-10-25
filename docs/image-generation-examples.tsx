/**
 * Example React components for using the Story Image Generation API
 *
 * These examples show how to integrate DALL-E 3 image generation
 * into your story writing interface.
 */

'use client';

import { useState } from 'react';

// Example 1: Simple Image Generator Component
export function SimpleImageGenerator({ storyId }: { storyId: string }) {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          storyId,
          style: 'vivid',
          quality: 'hd',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate image');
      }

      const data = await response.json();
      setImageUrl(data.image.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Image Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A mysterious forest at twilight with ancient trees, cinematic widescreen composition"
          className="w-full p-3 border rounded-lg"
          rows={4}
        />
      </div>

      <button
        onClick={generateImage}
        disabled={loading || !prompt}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Image'}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {imageUrl && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-600">
            ✅ Image generated successfully!
          </p>
          <img
            src={imageUrl}
            alt="Generated story illustration"
            className="w-full rounded-lg shadow-lg"
          />
          <p className="text-xs text-gray-500">
            Dimensions: 1792x1024 (16:9) • Format: PNG
          </p>
        </div>
      )}
    </div>
  );
}

// Example 2: Auto-Generate from Story Context
export function AutoImageGenerator({ storyId }: { storyId: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [usedPrompt, setUsedPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const autoGenerateImage = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          autoPrompt: true,
          style: 'vivid',
          quality: 'hd',
        }),
      });

      const data = await response.json();
      setImageUrl(data.image.url);
      setUsedPrompt(data.prompt);
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={autoGenerateImage}
        disabled={loading}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
      >
        {loading ? 'Auto-generating...' : '✨ Auto-Generate from Story'}
      </button>

      {usedPrompt && (
        <div className="p-3 bg-gray-50 border rounded-lg text-sm">
          <strong>Generated Prompt:</strong> {usedPrompt}
        </div>
      )}

      {imageUrl && (
        <img
          src={imageUrl}
          alt="Auto-generated story cover"
          className="w-full rounded-lg shadow-lg"
        />
      )}
    </div>
  );
}

// Example 3: Scene-Specific Image Generator
export function SceneImageGenerator({
  storyId,
  chapterId,
  sceneId,
}: {
  storyId: string;
  chapterId: string;
  sceneId: string;
}) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSceneImage = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          storyId,
          chapterId,
          sceneId,
          style,
          quality: 'hd',
        }),
      });

      const data = await response.json();
      setImageUrl(data.image.url);
    } catch (err) {
      console.error('Failed to generate scene image:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Scene Description
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the scene visually..."
          className="w-full p-3 border rounded-lg"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Style</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="vivid"
              checked={style === 'vivid'}
              onChange={(e) => setStyle(e.target.value as 'vivid' | 'natural')}
              className="mr-2"
            />
            Vivid (Cinematic)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="natural"
              checked={style === 'natural'}
              onChange={(e) => setStyle(e.target.value as 'vivid' | 'natural')}
              className="mr-2"
            />
            Natural (Realistic)
          </label>
        </div>
      </div>

      <button
        onClick={generateSceneImage}
        disabled={loading || !prompt}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Generating Scene Image...' : 'Generate Scene Image'}
      </button>

      {imageUrl && (
        <div className="border rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt="Scene illustration"
            className="w-full"
          />
          <div className="p-3 bg-gray-50 text-xs text-gray-600">
            Scene ID: {sceneId} • 1792x1024 (16:9)
          </div>
        </div>
      )}
    </div>
  );
}

// Example 4: Image Gallery for Story
export function StoryImageGallery({
  storyId,
  images,
}: {
  storyId: string;
  images: Array<{ id: string; url: string; prompt: string }>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {images.map((image) => (
        <div key={image.id} className="space-y-2">
          <img
            src={image.url}
            alt={image.prompt}
            className="w-full aspect-video object-cover rounded-lg shadow"
          />
          <p className="text-sm text-gray-600 line-clamp-2">{image.prompt}</p>
        </div>
      ))}
    </div>
  );
}

// Example 5: Quick Action Button for Story Editor
export function QuickImageButton({ storyId }: { storyId: string }) {
  const [generating, setGenerating] = useState(false);

  const quickGenerate = async () => {
    setGenerating(true);

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          autoPrompt: true,
          style: 'vivid',
          quality: 'hd',
        }),
      });

      const data = await response.json();

      // Show success notification or open image in modal
      console.log('Image generated:', data.image.url);

      // You could also trigger a download or copy to clipboard
      navigator.clipboard.writeText(data.image.url);
    } catch (err) {
      console.error('Quick generate failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={quickGenerate}
      disabled={generating}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
      </svg>
      {generating ? 'Generating...' : 'Generate Cover'}
    </button>
  );
}
