'use client';

// Story Creation Page - minimal implementation for GREEN phase
export default function CreateStoryPage() {
  return (
    <div>
      <h1>Create New Story</h1>
      <form>
        <div>
          <label htmlFor="story-title">Title</label>
          <input 
            id="story-title"
            data-testid="story-title-input" 
            type="text"
            placeholder="Enter story title"
          />
          <div data-testid="story-title-error" style={{ color: 'red' }}></div>
        </div>
        
        <div>
          <label htmlFor="story-description">Description</label>
          <textarea 
            id="story-description"
            data-testid="story-description-textarea"
            placeholder="Describe your story..."
          />
          <div data-testid="story-description-error" style={{ color: 'red' }}></div>
        </div>
        
        <div>
          <label htmlFor="story-genre">Genre</label>
          <select id="story-genre" data-testid="story-genre-select">
            <option value="">Select a genre...</option>
            <option data-testid="genre-option-fantasy" value="fantasy">Fantasy</option>
            <option data-testid="genre-option-sci-fi" value="sci-fi">Sci-Fi</option>
            <option data-testid="genre-option-romance" value="romance">Romance</option>
            <option data-testid="genre-option-mystery" value="mystery">Mystery</option>
            <option data-testid="genre-option-horror" value="horror">Horror</option>
          </select>
          <div data-testid="story-genre-error" style={{ color: 'red' }}></div>
        </div>
        
        <div>
          <label htmlFor="story-tags">Tags</label>
          <input 
            id="story-tags"
            data-testid="story-tags-input"
            placeholder="Type a tag and press Enter"
          />
          <div data-testid="tags-container">
            {/* Sample tags for testing */}
            <span data-testid="tag-magic">magic <button data-testid="remove-tag-magic">×</button></span>
            <span data-testid="tag-adventure">adventure <button data-testid="remove-tag-adventure">×</button></span>
          </div>
          <div data-testid="story-tags-error" style={{ color: 'red' }}></div>
        </div>
        
        <div>
          <label>
            <input 
              type="checkbox" 
              data-testid="story-mature-checkbox"
            />
            This story contains mature content (18+)
          </label>
          <div data-testid="story-mature-error" style={{ color: 'red' }}></div>
        </div>
        
        <div>
          <label htmlFor="cover-image">Cover Image (Optional)</label>
          <input 
            id="cover-image"
            type="file" 
            data-testid="cover-image-upload"
            accept="image/*"
          />
          <div data-testid="cover-image-preview" style={{ display: 'none' }}>
            <img src="" alt="Cover preview" />
            <button data-testid="remove-cover-button" type="button">Remove</button>
          </div>
          <div data-testid="cover-image-error" style={{ color: 'red' }}></div>
        </div>
        
        <button 
          type="submit"
          data-testid="create-story-button"
        >
          Create Story
        </button>
        
        <div data-testid="success-message" style={{ color: 'green', display: 'none' }}>
          Story created successfully!
        </div>
      </form>
    </div>
  );
}