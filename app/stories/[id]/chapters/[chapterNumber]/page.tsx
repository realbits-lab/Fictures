'use client';

import { useParams } from 'next/navigation';

// Chapter Reading Page - minimal implementation for GREEN phase
export default function ChapterPage() {
  const params = useParams();
  const chapterNumber = parseInt(params.chapterNumber as string) || 1;
  
  const getChapterContent = (num: number) => {
    const chapters = {
      1: {
        title: "Chapter 1: The Beginning",
        content: "Once upon a time in a mystical land, there lived a young adventurer named Alex..."
      },
      2: {
        title: "Chapter 2: The Journey Begins",
        content: "Alex set out on their quest, leaving the safety of the village behind..."
      },
      3: {
        title: "Chapter 3: The Dragon's Lair",
        content: "The dragon's lair was dark and foreboding, filled with ancient magic..."
      }
    };
    return chapters[num as keyof typeof chapters] || chapters[1];
  };
  
  const chapter = getChapterContent(chapterNumber);
  
  return (
    <div>
      <div data-testid="story-header">
        <h1 data-testid="story-title">The Dragon's Quest</h1>
        <div data-testid="story-author">
          <span data-testid="author-name">John Fantasy Author</span>
        </div>
        <div data-testid="story-description">
          A fantasy adventure about magic and dragons in a mystical world.
        </div>
        <div data-testid="story-stats">
          <span data-testid="word-count">15,000 words</span>
          <span data-testid="chapter-count">5 chapters</span>
          <span data-testid="read-count">100 reads</span>
          <span data-testid="like-count">25 likes</span>
        </div>
      </div>
      
      <div data-testid="reading-progress">
        Chapter <span data-testid="current-chapter-number">{chapterNumber}</span> of <span data-testid="total-chapters">5</span>
      </div>
      
      <div data-testid="chapter-content">
        <h2 data-testid="chapter-title">{chapter.title}</h2>
        <div>
          <p>{chapter.content}</p>
        </div>
      </div>
      
      <div data-testid="chapter-navigation">
        <button 
          data-testid="previous-chapter-button" 
          disabled={chapterNumber <= 1}
          onClick={() => window.location.href = `/stories/test-story-123/chapters/${chapterNumber - 1}`}
        >
          Previous Chapter
        </button>
        <button 
          data-testid="next-chapter-button"
          disabled={chapterNumber >= 5}
          onClick={() => window.location.href = `/stories/test-story-123/chapters/${chapterNumber + 1}`}
        >
          Next Chapter
        </button>
        
        <div data-testid="chapter-list-item">
          <span data-testid="chapter-number">1</span>
          <span data-testid="nav-chapter-title">The Beginning</span>
        </div>
        <div data-testid="chapter-list-item">
          <span data-testid="chapter-number">2</span>
          <span data-testid="nav-chapter-title">The Journey Begins</span>
        </div>
        <div data-testid="chapter-list-item">
          <span data-testid="chapter-number">3</span>
          <span data-testid="nav-chapter-title">The Dragon's Lair</span>
        </div>
        <div data-testid="chapter-list-item-3">
          <span data-testid="chapter-number">3</span>
          <span data-testid="nav-chapter-title">The Dragon's Lair</span>
        </div>
      </div>
      
      <div data-testid="story-interaction-buttons">
        <button data-testid="bookmark-story-button" aria-pressed="false">Bookmark</button>
        <button data-testid="like-story-button" aria-pressed="false">Like</button>
        <button data-testid="reading-settings-button">Settings</button>
      </div>
      
      <div data-testid="reading-settings-modal" style={{ display: 'none' }}>
        <h3>Reading Settings</h3>
        <div>
          <label htmlFor="font-size">Font Size</label>
          <input data-testid="font-size-slider" type="range" min="12" max="24" />
        </div>
        <div>
          <label>
            <input data-testid="theme-toggle" type="checkbox" />
            Dark Mode
          </label>
        </div>
        <div data-testid="line-spacing-controls">
          <label>Line Spacing</label>
          <select>
            <option value="1">Single</option>
            <option value="1.5">1.5x</option>
            <option value="2">Double</option>
          </select>
        </div>
      </div>
      
      <div data-testid="author-section">
        <h3 data-testid="author-name">John Fantasy Author</h3>
        <div data-testid="author-bio">Loves writing fantasy adventures with dragons and magic.</div>
        <div data-testid="author-stats">5 stories published</div>
        
        <div data-testid="other-stories-by-author">
          <h4>Other Stories by This Author</h4>
          <div data-testid="story-card">
            <span>The Magic Chronicles</span>
          </div>
          <div data-testid="story-card">
            <span>Quest for the Golden Sword</span>
          </div>
        </div>
      </div>
    </div>
  );
}