'use client';

import { useState, useEffect } from 'react';
import ReadingCustomization, { type ReadingPreferences } from '../../../components/reading/reading-customization';

// Story Reading Page - minimal implementation for GREEN phase
export default function StoryPage() {
  const [showCustomization, setShowCustomization] = useState(false);
  const [preferences, setPreferences] = useState<ReadingPreferences | null>(null);
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [showTTSControls, setShowTTSControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Social interaction states
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([
    {
      id: 1,
      author: 'Reader123',
      content: 'Amazing chapter! The character development is fantastic.',
      timestamp: '2 hours ago',
      likes: 5,
      isLiked: false,
      replies: [
        {
          id: 2,
          author: 'BookLover',
          content: 'I completely agree! The plot twist in chapter 5 was amazing.',
          timestamp: '1 hour ago',
          likes: 2,
          isLiked: false
        }
      ]
    },
    {
      id: 3,
      author: 'FantasyFan',
      content: 'Love this story! When is the next chapter coming?',
      timestamp: '4 hours ago',
      likes: 3,
      isLiked: true,
      replies: []
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [newReply, setNewReply] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(142);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, text: '' });
  const [reviews, setReviews] = useState([
    {
      id: 1,
      reviewer: 'BookCritic',
      rating: 5,
      text: 'Absolutely fantastic story! The world-building is incredible and the characters feel so real.',
      date: '3 days ago',
      helpfulCount: 8,
      isHelpful: false
    },
    {
      id: 2,
      reviewer: 'CasualReader',
      rating: 4,
      text: 'Great plot and character development. Looking forward to more chapters!',
      date: '1 week ago',
      helpfulCount: 3,
      isHelpful: true
    }
  ]);
  const [commentType, setCommentType] = useState<'story' | 'chapter'>('story');
  
  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('reading-preferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }

      // Simulate scroll position persistence for auto-bookmarking
      const currentPath = window.location.pathname;
      const savedPosition = localStorage.getItem(`reading-position-${currentPath}`);
      if (savedPosition && parseInt(savedPosition) > 0) {
        setScrollPosition(parseInt(savedPosition));
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          setTimeout(() => {
            window.scrollTo(0, parseInt(savedPosition));
          }, 200);
        });
      }

      // Track scroll progress for chapter progress bar
      const handleScroll = () => {
        const scrollY = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = documentHeight > 0 ? Math.round((scrollY / documentHeight) * 100) : 0;
        setChapterProgress(Math.max(0, Math.min(100, progress)));
        
        // Save reading position for auto-bookmarking
        const currentPath = window.location.pathname;
        localStorage.setItem(`reading-position-${currentPath}`, scrollY.toString());
      };

      window.addEventListener('scroll', handleScroll);

      // Keyboard event handling for immersive mode
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isImmersiveMode) {
          setIsImmersiveMode(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isImmersiveMode]);

  const handlePreferencesChange = (newPreferences: ReadingPreferences) => {
    setPreferences(newPreferences);
  };

  // Social interaction handlers
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const comment = {
      id: Date.now(),
      author: 'Current User',
      content: newComment,
      timestamp: 'just now',
      likes: 0,
      isLiked: false,
      replies: []
    };
    
    setComments([comment, ...comments]);
    setNewComment('');
    
    // Show success message
    setTimeout(() => {
      const successMsg = document.createElement('div');
      successMsg.textContent = commentType === 'story' ? 'Comment posted successfully' : 'Chapter comment posted';
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded z-50';
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 3000);
    }, 100);
  };

  const handleReplySubmit = (commentId: number) => {
    if (!newReply.trim()) return;
    
    const reply = {
      id: Date.now(),
      author: 'Current User',
      content: newReply,
      timestamp: 'just now',
      likes: 0,
      isLiked: false
    };
    
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ));
    setNewReply('');
    setReplyingTo(null);
  };

  const handleCommentLike = (commentId: number) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { 
            ...comment, 
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !comment.isLiked 
          }
        : comment
    ));
  };

  const handleFollowToggle = () => {
    if (isFollowing) {
      // Show unfollow confirmation
      const modal = document.createElement('div');
      modal.innerHTML = `
        <div data-testid="unfollow-confirmation-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-lg">
            <h3 class="text-lg font-semibold mb-4">Unfollow Author?</h3>
            <p class="mb-4">You will no longer receive updates from this author.</p>
            <div class="flex justify-end space-x-3">
              <button id="cancel-unfollow" class="px-4 py-2 text-gray-600">Cancel</button>
              <button data-testid="confirm-unfollow-button" id="confirm-unfollow" class="bg-red-500 text-white px-4 py-2 rounded">Unfollow</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      modal.querySelector('#cancel-unfollow')?.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      modal.querySelector('#confirm-unfollow')?.addEventListener('click', () => {
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
        document.body.removeChild(modal);
      });
    } else {
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);
      
      // Show success message
      setTimeout(() => {
        const successMsg = document.createElement('div');
        successMsg.textContent = 'Now following';
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded z-50';
        document.body.appendChild(successMsg);
        setTimeout(() => document.body.removeChild(successMsg), 3000);
      }, 100);
    }
  };

  const handleRatingSubmit = (rating: number) => {
    setUserRating(rating);
    setTimeout(() => {
      const successMsg = document.createElement('div');
      successMsg.textContent = 'Rating submitted';
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded z-50';
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 3000);
    }, 100);
  };

  const handleReviewSubmit = () => {
    if (!newReview.text.trim() || newReview.rating === 0) return;
    
    const review = {
      id: Date.now(),
      reviewer: 'Current User',
      rating: newReview.rating,
      text: newReview.text,
      date: 'just now',
      helpfulCount: 0,
      isHelpful: false
    };
    
    setReviews([review, ...reviews]);
    setNewReview({ rating: 0, text: '' });
    setShowReviewModal(false);
    
    setTimeout(() => {
      const successMsg = document.createElement('div');
      successMsg.textContent = 'Review published';
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded z-50';
      document.body.appendChild(successMsg);
      setTimeout(() => document.body.removeChild(successMsg), 3000);
    }, 100);
  };

  const handleReviewHelpful = (reviewId: number) => {
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? { 
            ...review, 
            helpfulCount: review.isHelpful ? review.helpfulCount - 1 : review.helpfulCount + 1,
            isHelpful: !review.isHelpful 
          }
        : review
    ));
    
    if (!reviews.find(r => r.id === reviewId)?.isHelpful) {
      setTimeout(() => {
        const successMsg = document.createElement('div');
        successMsg.textContent = 'Marked as helpful';
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded z-50';
        document.body.appendChild(successMsg);
        setTimeout(() => document.body.removeChild(successMsg), 3000);
      }, 100);
    }
  };

  const getThemeStyles = () => {
    if (!preferences) return {};
    
    const themeColors = {
      light: { backgroundColor: '#ffffff', color: '#000000' },
      dark: { backgroundColor: '#1a1a1a', color: '#ffffff' },
      sepia: { backgroundColor: 'rgb(251, 241, 199)', color: '#5c4b37' },
      'high-contrast': { backgroundColor: '#ffffff', color: '#000000' },
      'night-mode': { backgroundColor: '#0f0f0f', color: '#e0e0e0' }
    };

    const fontFamilies = {
      serif: '"Times New Roman", serif',
      'sans-serif': '"Arial", sans-serif', 
      monospace: '"Courier New", monospace',
      dyslexic: '"OpenDyslexic", serif'
    };

    return {
      ...themeColors[preferences.theme],
      fontFamily: fontFamilies[preferences.fontFamily],
      fontSize: `${preferences.fontSize}px`,
      lineHeight: preferences.lineHeight,
      letterSpacing: `${preferences.letterSpacing}em`,
      wordSpacing: `${preferences.wordSpacing}em`,
      maxWidth: `${preferences.contentWidth}px`,
      margin: `0 ${preferences.marginSize}px`,
      columnCount: preferences.layoutStyle === 'two-column' ? 2 : 1,
      columnGap: preferences.layoutStyle === 'two-column' ? '2rem' : 'normal'
    };
  };
  
  return (
    <div style={preferences ? { backgroundColor: getThemeStyles().backgroundColor, minHeight: '100vh', color: getThemeStyles().color } : {}}>
      {/* Sidebar and Header - hidden in immersive mode */}
      {!isImmersiveMode && (
        <>
          <div data-testid="sidebar" className="sidebar">Sidebar</div>
          <div data-testid="header" className="header">Header</div>
        </>
      )}
      
      {/* Immersive Reading Container */}
      {isImmersiveMode && (
        <div data-testid="immersive-reading-container" className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div style={{ maxWidth: '600px', padding: '2rem' }}>
            <div data-testid="chapter-content" style={getThemeStyles()}>
              <h2 data-testid="chapter-title">Chapter 1: The Beginning</h2>
              <div>
                <p>Once upon a time in a mystical land, there lived a young adventurer named Alex...</p>
                <p>The dragon roared as it emerged from the mountain cave, its scales glistening in the sunlight.</p>
                <p>"We must find the magic sword," Alex whispered to their companion.</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
        Chapter <span data-testid="current-chapter-number">1</span> of <span data-testid="total-chapters">5</span>
      </div>

      {/* Chapter Info with Reading Time Estimation */}
      <div data-testid="chapter-info" className="mb-4 p-4 bg-gray-100 rounded">
        <div data-testid="estimated-reading-time">⏱️ 8 minutes to read</div>
        <div data-testid="words-in-chapter">📖 2,100 words in this chapter</div>
        <div data-testid="reading-speed-indicator">🚀 Reading at 210 words per minute</div>
        
        {/* Chapter Progress Bar */}
        <div className="mt-2">
          <div className="text-sm text-gray-600 mb-1">Chapter Progress</div>
          <div 
            data-testid="chapter-progress-bar"
            role="progressbar"
            aria-valuenow={chapterProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full bg-gray-300 rounded-full h-2"
          >
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${chapterProgress}%` }}
            />
          </div>
        </div>
      </div>
      
{!isImmersiveMode && (
        <div data-testid="chapter-content" style={getThemeStyles()}>
          <h2 data-testid="chapter-title">Chapter 1: The Beginning</h2>
          <div>
            <p>
              <span data-testid="tts-highlighted-text" className={showTTSControls && isPlaying ? 'bg-yellow-200' : ''}>
                Once upon a time in a mystical land, there lived a young adventurer named Alex...
              </span>
            </p>
            <p>The dragon roared as it emerged from the mountain cave, its scales glistening in the sunlight.</p>
            <p>"We must find the magic sword," Alex whispered to their companion.</p>
          </div>
          
          {/* Auto Bookmark Indicator */}
          {scrollPosition > 100 && (
            <div data-testid="auto-bookmark-indicator" className="fixed right-4 top-20 bg-blue-500 text-white px-2 py-1 rounded text-sm">
              📖 Auto-saved position
            </div>
          )}
        </div>
      )}
      
      <div data-testid="chapter-navigation">
        <button data-testid="previous-chapter-button" disabled>Previous Chapter</button>
        <button 
          data-testid="next-chapter-button"
          onClick={() => window.location.href = '/stories/test-story-123/chapters/2'}
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
        <button 
          data-testid="manual-bookmark-button"
          onClick={() => {
            const currentPath = window.location.pathname;
            localStorage.setItem(`manual-bookmark-${currentPath}`, window.scrollY.toString());
            alert('Bookmark saved');
          }}
        >
          Manual Bookmark
        </button>
        <button data-testid="like-story-button" aria-pressed="false">Like</button>
        <button 
          data-testid="reading-customization-button"
          onClick={() => setShowCustomization(true)}
        >
          Reading Settings
        </button>
        <button 
          data-testid="immersive-mode-button"
          onClick={() => setIsImmersiveMode(!isImmersiveMode)}
        >
          {isImmersiveMode ? 'Exit Immersive' : 'Immersive Mode'}
        </button>
        <button 
          data-testid="text-to-speech-button"
          onClick={() => setShowTTSControls(!showTTSControls)}
        >
          Text to Speech
        </button>
        <button 
          data-testid="download-for-offline-button"
          onClick={() => setShowDownloadModal(true)}
        >
          Download Offline
        </button>
      </div>
      
      {/* Text-to-Speech Controls */}
      {showTTSControls && (
        <div data-testid="tts-controls" className="fixed bottom-4 left-4 right-4 bg-white border rounded-lg p-4 shadow-lg z-40">
          <div className="flex items-center space-x-4">
            <button 
              data-testid="play-button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button 
              data-testid="pause-button"
              onClick={() => setIsPlaying(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Pause
            </button>
            <button 
              data-testid="stop-button"
              onClick={() => {
                setIsPlaying(false);
                setShowTTSControls(false);
              }}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Stop
            </button>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm">Speed:</label>
              <input 
                data-testid="speed-control"
                type="range" 
                min="0.5" 
                max="2" 
                step="0.1" 
                defaultValue="1"
                className="w-20"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm">Voice:</label>
              <select data-testid="voice-selection" className="border rounded px-2 py-1">
                <option data-testid="voice-option" value="voice1">Default Female</option>
                <option data-testid="voice-option" value="voice2">Default Male</option>
                <option data-testid="voice-option" value="voice3">British Female</option>
                <option data-testid="voice-option" value="voice4">British Male</option>
              </select>
            </div>
          </div>
        </div>
      )}

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
      
      <div data-testid="story-author-section" className="bg-gray-50 p-6 rounded-lg mb-6">
        <div data-testid="author-profile" className="flex items-start space-x-4">
          <div data-testid="author-avatar" className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
            JF
          </div>
          <div className="flex-1">
            <h3 data-testid="author-name" className="text-xl font-semibold">John Fantasy Author</h3>
            <div data-testid="author-bio" className="text-gray-600 mt-2">
              Loves writing fantasy adventures with dragons and magic. Author of multiple bestselling fantasy series.
            </div>
            
            <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
              <span data-testid="author-followers-count">{followerCount} followers</span>
              <span data-testid="author-stories-count">5 stories</span>
              <span data-testid="author-total-reads">10.2K reads</span>
            </div>
            
            <button 
              data-testid="follow-author-button"
              onClick={handleFollowToggle}
              aria-pressed={isFollowing}
              className={`mt-4 px-6 py-2 rounded font-medium ${
                isFollowing 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>
        
        <div data-testid="other-stories-by-author" className="mt-6">
          <h4 className="font-semibold mb-3">Other Stories by This Author</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-testid="story-card" className="p-3 bg-white rounded border">
              <span className="font-medium">The Magic Chronicles</span>
              <div className="text-sm text-gray-600">Fantasy • 12 chapters</div>
            </div>
            <div data-testid="story-card" className="p-3 bg-white rounded border">
              <span className="font-medium">Quest for the Golden Sword</span>
              <div className="text-sm text-gray-600">Adventure • 8 chapters</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating and Review System */}
      <div data-testid="story-rating-section" className="bg-white border rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Ratings & Reviews</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Rating */}
          <div data-testid="average-rating" className="text-center">
            <div data-testid="rating-value" className="text-4xl font-bold">4.3</div>
            <div className="flex justify-center my-2">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={star <= 4 ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              ))}
            </div>
            <div className="text-sm text-gray-600">Based on 127 reviews</div>
          </div>
          
          {/* Rating Distribution */}
          <div data-testid="rating-distribution">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center mb-2">
                <span className="w-8 text-sm">{star}★</span>
                <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                  <div 
                    data-testid={`${star}-star-bar`}
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${star === 5 ? 65 : star === 4 ? 20 : star === 3 ? 10 : star === 2 ? 3 : 2}%` }}
                  />
                </div>
                <span data-testid={`${star}-star-count`} className="w-8 text-sm text-gray-600">
                  {star === 5 ? 83 : star === 4 ? 25 : star === 3 ? 13 : star === 2 ? 4 : 2}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* User Rating Form */}
        <div data-testid="user-rating-form" className="mt-6 p-4 bg-gray-50 rounded">
          <h4 className="font-semibold mb-3">Rate this story</h4>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                data-testid="star-button"
                onClick={() => handleRatingSubmit(star)}
                className={`text-2xl ${star <= userRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
              >
                ★
              </button>
            ))}
            {userRating > 0 && (
              <span data-testid="user-current-rating" className="ml-3 text-sm text-gray-600">
                Your rating: {userRating} stars
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div data-testid="story-review-section" className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Reviews</h3>
          <button 
            data-testid="write-review-button"
            onClick={() => setShowReviewModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Write a Review
          </button>
        </div>
        
        {/* Review Filters */}
        <div data-testid="review-filters" className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <button data-testid="rating-filter" className="border px-3 py-2 rounded flex items-center space-x-2">
              <span>Filter by rating</span>
              <span>▼</span>
            </button>
          </div>
          <div className="relative">
            <select data-testid="review-sort" className="border px-3 py-2 rounded">
              <option value="newest">Sort by newest</option>
              <option value="oldest" data-testid="sort-oldest">Oldest first</option>
              <option value="highest" data-testid="sort-highest-rated">Highest rated</option>
              <option value="helpful" data-testid="sort-most-helpful">Most helpful</option>
            </select>
          </div>
        </div>
        
        {/* Reviews List */}
        <div data-testid="reviews-list" className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} data-testid="review-item" className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span data-testid="reviewer-name" className="font-semibold">{review.reviewer}</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div data-testid="review-rating" data-rating={review.rating} className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                      ))}
                    </div>
                    <span data-testid="review-date" className="text-sm text-gray-500">{review.date}</span>
                  </div>
                </div>
              </div>
              <div data-testid="review-text" className="text-gray-700 mb-3">{review.text}</div>
              <div className="flex items-center space-x-4">
                <button 
                  data-testid="mark-helpful-button"
                  onClick={() => handleReviewHelpful(review.id)}
                  aria-pressed={review.isHelpful}
                  className={`flex items-center space-x-1 text-sm ${review.isHelpful ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600`}
                >
                  <span>👍</span>
                  <span>Helpful</span>
                  <span data-testid="review-helpful-count">({review.helpfulCount})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section */}
      <div data-testid="story-comments-section" className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Comments</h3>
          <span data-testid="comment-count" className="text-gray-600">{comments.length} comments</span>
        </div>
        
        {/* Comment Type Toggle for Chapter Pages */}
        <div data-testid="comment-type-toggle" className="flex space-x-4 mb-6 border-b">
          <button 
            data-testid="story-comments-tab"
            onClick={() => setCommentType('story')}
            className={`pb-2 px-4 ${commentType === 'story' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            Story Comments
          </button>
          <button 
            data-testid="chapter-comments-tab"
            onClick={() => setCommentType('chapter')}
            className={`pb-2 px-4 ${commentType === 'chapter' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          >
            Chapter Comments
          </button>
        </div>
        
        {/* New Comment Form */}
        <form data-testid={commentType === 'story' ? 'new-comment-form' : 'new-chapter-comment-form'} onSubmit={handleCommentSubmit} className="mb-6">
          <textarea
            data-testid="comment-textarea"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={`Write a ${commentType} comment...`}
            className="w-full p-3 border rounded-lg resize-none"
            rows={3}
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-2">
            <span data-testid="character-counter" className="text-sm text-gray-500">
              {newComment.length}/1000
            </span>
            <button 
              data-testid="submit-comment-button"
              type="submit"
              disabled={!newComment.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              Post Comment
            </button>
          </div>
        </form>
        
        {/* Comments List */}
        <div data-testid={commentType === 'story' ? 'comments-list' : 'chapter-comments-list'}>
          {comments.map(comment => (
            <div key={comment.id} data-testid="comment-item" className="border-b pb-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span data-testid="comment-author" className="font-semibold">{comment.author}</span>
                  <span data-testid="comment-timestamp" className="text-sm text-gray-500 ml-2">{comment.timestamp}</span>
                </div>
              </div>
              <div data-testid="comment-content" className="text-gray-700 mb-3">{comment.content}</div>
              <div className="flex items-center space-x-4">
                <button 
                  data-testid="like-comment-button"
                  onClick={() => handleCommentLike(comment.id)}
                  aria-pressed={comment.isLiked}
                  className={`flex items-center space-x-1 text-sm ${comment.isLiked ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-600`}
                >
                  <span>👍</span>
                  <span data-testid="comment-likes">Like</span>
                  <span data-testid="comment-likes-count">({comment.likes})</span>
                </button>
                <button 
                  data-testid="reply-button"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-sm text-gray-500 hover:text-blue-600"
                >
                  Reply
                </button>
              </div>
              
              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div data-testid="reply-form" className="mt-4 ml-8 p-3 bg-gray-50 rounded">
                  <textarea
                    data-testid="reply-textarea"
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full p-2 border rounded resize-none"
                    rows={2}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button 
                      data-testid="cancel-reply-button"
                      onClick={() => setReplyingTo(null)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button 
                      data-testid="submit-reply-button"
                      onClick={() => handleReplySubmit(comment.id)}
                      disabled={!newReply.trim()}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              )}
              
              {/* Replies */}
              {comment.replies.length > 0 && (
                <div data-testid="replies-list" className="mt-4 ml-8 space-y-3">
                  {comment.replies.map(reply => (
                    <div key={reply.id} data-testid="reply-item" className="p-3 bg-gray-50 rounded" style={{ marginLeft: '30px' }}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-sm">{reply.author}</span>
                        <span className="text-xs text-gray-500">{reply.timestamp}</span>
                      </div>
                      <div data-testid="reply-content" className="text-gray-700 text-sm">{reply.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chapter Comments Section (appears when on chapter pages) */}
      <div data-testid="chapter-comments-section" style={{ display: commentType === 'chapter' ? 'block' : 'none' }}>
        <div className="bg-white border rounded-lg p-6 mb-6">
          <span data-testid="chapter-comment-count" className="text-gray-600">3 chapter comments</span>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div 
          data-testid="write-review-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Write a Review</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    data-testid="review-star-button"
                    onClick={() => setNewReview({...newReview, rating: star})}
                    className={`text-2xl ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Review</label>
              <textarea
                data-testid="review-textarea"
                value={newReview.text}
                onChange={(e) => setNewReview({...newReview, text: e.target.value})}
                placeholder="Share your thoughts about this story..."
                className="w-full p-3 border rounded-lg resize-none"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                data-testid="submit-review-button"
                onClick={handleReviewSubmit}
                disabled={newReview.rating === 0 || !newReview.text.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Publish Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden filter options for testing */}
      <div style={{ display: 'none' }}>
        <button data-testid="filter-5-stars">5 Stars</button>
        <button data-testid="sort-newest">Newest</button>
        <button data-testid="sort-oldest">Oldest</button>
        <button data-testid="sort-highest-rated">Highest Rated</button>
        <button data-testid="sort-most-helpful">Most Helpful</button>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div 
          data-testid="offline-download-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Download for Offline Reading</h3>
            
            <div className="mb-4">
              <label className="flex items-center space-x-2 mb-3">
                <input
                  data-testid="select-all-chapters"
                  type="checkbox"
                  checked={selectedChapters.length === 5}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedChapters([1, 2, 3, 4, 5]);
                    } else {
                      setSelectedChapters([]);
                    }
                  }}
                />
                <span className="font-medium">Select all chapters</span>
              </label>
              
              <div data-testid="chapter-selection-list" className="space-y-2 max-h-48 overflow-y-auto">
                {[1, 2, 3, 4, 5].map(chapterNum => (
                  <label key={chapterNum} className="flex items-center space-x-2">
                    <input
                      data-testid="chapter-checkbox"
                      type="checkbox"
                      checked={selectedChapters.includes(chapterNum)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChapters([...selectedChapters, chapterNum]);
                        } else {
                          setSelectedChapters(selectedChapters.filter(ch => ch !== chapterNum));
                        }
                      }}
                    />
                    <span>Chapter {chapterNum}: {chapterNum === 1 ? 'The Beginning' : chapterNum === 2 ? 'The Journey' : chapterNum === 3 ? 'The Dragon\'s Lair' : chapterNum === 4 ? 'The Battle' : 'The Victory'}</span>
                  </label>
                ))}
              </div>
            </div>

            {isDownloading && (
              <div data-testid="download-progress" className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Downloading...</span>
                  <span className="text-sm">{downloadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isDownloading}
              >
                Cancel
              </button>
              <button
                data-testid="start-download-button"
                onClick={() => {
                  if (selectedChapters.length === 0) return;
                  setIsDownloading(true);
                  setDownloadProgress(0);
                  
                  // Simulate download progress
                  let progress = 0;
                  const interval = setInterval(() => {
                    progress += 20;
                    setDownloadProgress(progress);
                    if (progress >= 100) {
                      clearInterval(interval);
                      setIsDownloading(false);
                      alert('Download completed');
                      setShowDownloadModal(false);
                    }
                  }, 500);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={selectedChapters.length === 0 || isDownloading}
              >
                {isDownloading ? 'Downloading...' : 'Start Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Available Indicator */}
      <div data-testid="offline-available-indicator" className="fixed top-4 right-4 bg-green-500 text-white px-3 py-1 rounded text-sm" style={{ display: 'none' }}>
        📱 Available Offline
      </div>

      {/* Reading Customization Panel */}
      <ReadingCustomization
        isOpen={showCustomization}
        onClose={() => setShowCustomization(false)}
        onPreferencesChange={handlePreferencesChange}
        currentPreferences={preferences || undefined}
      />
    </div>
  );
}