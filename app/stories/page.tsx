'use client';

// Story Browsing Page - minimal implementation for GREEN phase
export default function StoriesPage() {
  return (
    <div>
      <h1>Story Browse</h1>
      <input data-testid="story-search-input" placeholder="Search stories..." />
      <select data-testid="genre-filter">
        <option value="">All Genres</option>
        <option data-testid="genre-filter-fantasy" value="fantasy">Fantasy</option>
        <option data-testid="genre-filter-sci-fi" value="sci-fi">Sci-Fi</option>
        <option data-testid="genre-filter-romance" value="romance">Romance</option>
      </select>
      
      <div data-testid="mature-content-toggle">
        <label>
          <input type="checkbox" />
          Show Mature Content
        </label>
      </div>
      
      <select data-testid="sort-dropdown">
        <option value="">Sort by...</option>
        <option data-testid="sort-by-popularity" value="popularity">Popularity</option>
        <option data-testid="sort-by-newest" value="newest">Newest</option>
      </select>
      
      <div data-testid="story-grid">
        {/* Sample story cards for testing */}
        <div data-testid="story-card">
          <div data-testid="story-title">The Dragon's Quest</div>
          <div data-testid="story-description">A fantasy adventure about magic and dragons in a mystical world.</div>
          <div data-testid="story-author">John Fantasy Author</div>
          <div data-testid="story-genre">Fantasy</div>
          <div data-testid="story-stats">
            <span data-testid="word-count">15,000 words</span>
            <span data-testid="chapter-count">5 chapters</span>
            <span data-testid="read-count">100 reads</span>
            <span data-testid="like-count">25 likes</span>
          </div>
          <div data-testid="mature-indicator" style={{ display: 'none' }}>18+</div>
          <div data-testid="publication-date">Jan 1, 2024</div>
          <button data-testid="bookmark-button">Bookmark</button>
          <button data-testid="like-button">Like</button>
        </div>
        
        <div data-testid="story-card">
          <div data-testid="story-title">Space Explorer Chronicles</div>
          <div data-testid="story-description">A thrilling sci-fi adventure through the cosmos.</div>
          <div data-testid="story-author">Jane Sci-Fi Writer</div>
          <div data-testid="story-genre">Sci-Fi</div>
          <div data-testid="story-stats">
            <span data-testid="word-count">20,000 words</span>
            <span data-testid="chapter-count">8 chapters</span>
            <span data-testid="read-count">150 reads</span>
            <span data-testid="like-count">30 likes</span>
          </div>
          <div data-testid="mature-indicator" style={{ display: 'none' }}>18+</div>
          <div data-testid="publication-date">Dec 15, 2023</div>
          <button data-testid="bookmark-button">Bookmark</button>
          <button data-testid="like-button">Like</button>
        </div>
        
        <div data-testid="story-card">
          <div data-testid="story-title">Magic Academy: First Year</div>
          <div data-testid="story-description">Young wizards learn the ways of magic in this fantasy adventure.</div>
          <div data-testid="story-author">Magic Author</div>
          <div data-testid="story-genre">Fantasy</div>
          <div data-testid="story-stats">
            <span data-testid="word-count">12,000 words</span>
            <span data-testid="chapter-count">4 chapters</span>
            <span data-testid="read-count">75 reads</span>
            <span data-testid="like-count">20 likes</span>
          </div>
          <div data-testid="mature-indicator">18+</div>
          <div data-testid="publication-date">Feb 10, 2024</div>
          <button data-testid="bookmark-button">Bookmark</button>
          <button data-testid="like-button">Like</button>
        </div>
      </div>
      
      <div data-testid="pagination">
        <button data-testid="next-page-button">Next Page</button>
      </div>
    </div>
  );
}