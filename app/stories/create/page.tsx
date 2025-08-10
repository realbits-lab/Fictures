'use client';

import { useState } from 'react';
import { Upload, X, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

export default function CreateStoryPage() {
  const [tags, setTags] = useState(['magic', 'adventure']);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Create New Story</h1>
        <p className="text-muted-foreground">Share your creative story with the world</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Story Title */}
        <div className="space-y-2">
          <label htmlFor="story-title" className="text-sm font-medium text-foreground">
            Story Title *
          </label>
          <input 
            id="story-title"
            data-testid="story-title-input" 
            type="text"
            placeholder="Enter your story title..."
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <div data-testid="story-title-error" className="text-red-500 text-sm hidden">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Title is required
          </div>
        </div>
        
        {/* Story Description */}
        <div className="space-y-2">
          <label htmlFor="story-description" className="text-sm font-medium text-foreground">
            Description *
          </label>
          <textarea 
            id="story-description"
            data-testid="story-description-textarea"
            placeholder="Describe your story... What's it about? What makes it unique?"
            rows={4}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical"
          />
          <div data-testid="story-description-error" className="text-red-500 text-sm hidden">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Description is required
          </div>
        </div>
        
        {/* Genre and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="story-genre" className="text-sm font-medium text-foreground">
              Genre *
            </label>
            <select 
              id="story-genre" 
              data-testid="story-genre-select"
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Select a genre...</option>
              <option data-testid="genre-option-fantasy" value="fantasy">Fantasy</option>
              <option data-testid="genre-option-sci-fi" value="sci-fi">Sci-Fi</option>
              <option data-testid="genre-option-romance" value="romance">Romance</option>
              <option data-testid="genre-option-mystery" value="mystery">Mystery</option>
              <option data-testid="genre-option-horror" value="horror">Horror</option>
              <option value="adventure">Adventure</option>
              <option value="drama">Drama</option>
              <option value="historical">Historical</option>
            </select>
            <div data-testid="story-genre-error" className="text-red-500 text-sm hidden">
              <AlertCircle className="inline h-4 w-4 mr-1" />
              Please select a genre
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="story-status" className="text-sm font-medium text-foreground">
              Status
            </label>
            <select 
              id="story-status"
              className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="hiatus">On Hiatus</option>
            </select>
          </div>
        </div>
        
        {/* Tags */}
        <div className="space-y-2">
          <label htmlFor="story-tags" className="text-sm font-medium text-foreground">
            Tags
          </label>
          <input 
            id="story-tags"
            data-testid="story-tags-input"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagAdd}
            placeholder="Type a tag and press Enter"
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <div data-testid="tags-container" className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag, index) => (
              <span 
                key={index}
                data-testid={`tag-${tag}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full"
              >
                {tag}
                <button 
                  type="button"
                  data-testid={`remove-tag-${tag}`}
                  onClick={() => handleTagRemove(tag)}
                  className="ml-1 text-primary hover:text-primary/70 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div data-testid="story-tags-error" className="text-red-500 text-sm hidden">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Tag error
          </div>
        </div>
        
        {/* Mature Content Checkbox */}
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              data-testid="story-mature-checkbox"
              className="rounded border-border text-primary focus:ring-primary focus:ring-offset-0 h-4 w-4"
            />
            <span className="text-sm text-foreground">
              This story contains mature content (18+)
            </span>
          </label>
          <p className="text-xs text-muted-foreground ml-7">
            Check this if your story contains violence, sexual content, or other mature themes
          </p>
          <div data-testid="story-mature-error" className="text-red-500 text-sm hidden">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Mature content error
          </div>
        </div>
        
        {/* Cover Image Upload */}
        <div className="space-y-4">
          <label className="text-sm font-medium text-foreground">
            Cover Image (Optional)
          </label>
          
          {!coverImage ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <label 
                  htmlFor="cover-image" 
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Choose Cover Image
                </label>
                <input 
                  id="cover-image"
                  type="file" 
                  data-testid="cover-image-upload"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="sr-only"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  PNG, JPG, GIF up to 2MB
                </p>
              </div>
            </div>
          ) : (
            <div data-testid="cover-image-preview" className="relative inline-block">
              <img 
                src={coverImage} 
                alt="Cover preview" 
                className="max-w-xs h-48 object-cover rounded-lg border border-border"
              />
              <button 
                data-testid="remove-cover-button" 
                type="button"
                onClick={() => setCoverImage(null)}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          <div data-testid="cover-image-error" className="text-red-500 text-sm hidden">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Cover image error
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex gap-4 pt-6">
          <button 
            type="submit"
            data-testid="create-story-button"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Create Story
          </button>
          <button 
            type="button"
            className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Save as Draft
          </button>
        </div>
        
        {/* Success Message */}
        {showSuccess && (
          <div data-testid="success-message" className="flex items-center gap-2 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            Story created successfully!
          </div>
        )}
      </form>
    </div>
  );
}