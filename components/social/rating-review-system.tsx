'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  ThumbsUp, 
  Filter,
  ChevronDown,
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/alert-dialog';

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
  helpfulCount: number;
  isMarkedHelpful: boolean;
}

interface RatingReviewSystemProps {
  storyId: string;
}

export function RatingReviewSystem({ storyId }: RatingReviewSystemProps) {
  const [averageRating] = useState(4.2);
  const [totalReviews] = useState(156);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [ratingDistribution] = useState({
    5: 78,
    4: 45,
    3: 20,
    2: 8,
    1: 5
  });

  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      reviewerName: 'BookCritic2024',
      rating: 5,
      reviewText: 'Absolutely fantastic story! The world-building is incredible and the characters feel so real. Can\'t wait for the next chapter!',
      reviewDate: '2024-01-15',
      helpfulCount: 24,
      isMarkedHelpful: false
    },
    {
      id: '2',
      reviewerName: 'StoryLover88',
      rating: 4,
      reviewText: 'Great character development and engaging plot. Some pacing issues in the middle chapters but overall excellent.',
      reviewDate: '2024-01-10',
      helpfulCount: 18,
      isMarkedHelpful: true
    },
    {
      id: '3',
      reviewerName: 'FantasyFan',
      rating: 5,
      reviewText: 'One of the best stories I\'ve read this year. The author has a real talent for dialogue.',
      reviewDate: '2024-01-08',
      helpfulCount: 31,
      isMarkedHelpful: false
    }
  ]);

  const handleRatingSubmit = (rating: number) => {
    setUserRating(rating);
  };

  const handleReviewSubmit = () => {
    if (!reviewText.trim() || userRating === 0) return;

    const newReview: Review = {
      id: Date.now().toString(),
      reviewerName: 'Current User',
      rating: userRating,
      reviewText: reviewText,
      reviewDate: new Date().toISOString().split('T')[0],
      helpfulCount: 0,
      isMarkedHelpful: false
    };

    setReviews([newReview, ...reviews]);
    setReviewText('');
    setShowReviewModal(false);
  };

  const handleMarkHelpful = (reviewId: string) => {
    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.id === reviewId
          ? {
              ...review,
              helpfulCount: review.isMarkedHelpful 
                ? review.helpfulCount - 1 
                : review.helpfulCount + 1,
              isMarkedHelpful: !review.isMarkedHelpful
            }
          : review
      )
    );
  };

  const StarRating = ({ 
    rating, 
    interactive = false, 
    onRatingChange,
    size = "sm",
    testId 
  }: { 
    rating: number; 
    interactive?: boolean; 
    onRatingChange?: (rating: number) => void;
    size?: "sm" | "lg";
    testId?: string;
  }) => {
    const starSize = size === "lg" ? "h-6 w-6" : "h-4 w-4";
    
    return (
      <div className="flex" data-testid={testId}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            onClick={() => interactive && onRatingChange?.(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            data-testid={interactive ? 'star-button' : undefined}
            disabled={!interactive}
          >
            <Star
              className={`${starSize} ${
                star <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const filteredAndSortedReviews = reviews
    .filter(review => selectedFilter === 'all' || review.rating.toString() === selectedFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime();
        case 'oldest':
          return new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime();
        case 'highest-rated':
          return b.rating - a.rating;
        case 'most-helpful':
          return b.helpfulCount - a.helpfulCount;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-8">
      {/* Rating Overview */}
      <Card data-testid="story-rating-section">
        <CardHeader>
          <CardTitle>Ratings & Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Average Rating */}
          <div className="flex items-center space-x-4" data-testid="average-rating">
            <div className="text-4xl font-bold" data-testid="rating-value">
              {averageRating.toFixed(1)}
            </div>
            <div className="space-y-1">
              <StarRating rating={averageRating} />
              <div className="text-sm text-gray-600">
                Based on {totalReviews} reviews
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2" data-testid="rating-distribution">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center space-x-2">
                <span className="text-sm w-8">{stars}</span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${(ratingDistribution[stars as keyof typeof ratingDistribution] / totalReviews) * 100}%`
                    }}
                    data-testid={`${stars}-star-bar`}
                  />
                </div>
                <span className="text-sm w-8 text-right" data-testid={`${stars}-star-count`}>
                  {ratingDistribution[stars as keyof typeof ratingDistribution]}
                </span>
              </div>
            ))}
          </div>

          {/* User Rating */}
          <div className="border-t pt-4" data-testid="user-rating-form">
            <h4 className="font-medium mb-2">Rate this story</h4>
            <div className="flex items-center space-x-4">
              <StarRating
                rating={userRating}
                interactive
                onRatingChange={handleRatingSubmit}
                size="lg"
                testId="star-rating-input"
              />
              {userRating > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600" data-testid="user-current-rating">
                    You rated: {userRating} star{userRating !== 1 ? 's' : ''}
                  </span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <Card data-testid="story-review-section">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reviews</CardTitle>
            <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
              <DialogTrigger asChild>
                <Button data-testid="write-review-button">Write a Review</Button>
              </DialogTrigger>
              <DialogContent data-testid="write-review-modal">
                <DialogHeader>
                  <DialogTitle>Write Your Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Rating</label>
                    <StarRating
                      rating={userRating}
                      interactive
                      onRatingChange={setUserRating}
                      size="lg"
                      testId="review-star-rating"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Review</label>
                    <Textarea
                      placeholder="Share your thoughts about this story..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      data-testid="review-textarea"
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowReviewModal(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleReviewSubmit}
                      disabled={!reviewText.trim() || userRating === 0}
                      data-testid="submit-review-button"
                    >
                      Publish Review
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Review Filters */}
          <div className="flex items-center space-x-4 mb-6" data-testid="review-filters">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="rating-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter by Rating
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedFilter('all')}>
                  All Ratings
                </DropdownMenuItem>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <DropdownMenuItem 
                    key={rating}
                    onClick={() => setSelectedFilter(rating.toString())}
                    data-testid={`filter-${rating}-stars`}
                  >
                    {rating} Star{rating !== 1 ? 's' : ''}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="review-sort">
                  Sort by
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => setSortBy('newest')}
                  data-testid="sort-newest"
                >
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('oldest')}
                  data-testid="sort-oldest"
                >
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('highest-rated')}
                  data-testid="sort-highest-rated"
                >
                  Highest Rated
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('most-helpful')}
                  data-testid="sort-most-helpful"
                >
                  Most Helpful
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Reviews List */}
          <div className="space-y-6" data-testid="reviews-list">
            {filteredAndSortedReviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4" data-testid="review-item">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium" data-testid="reviewer-name">
                        {review.reviewerName}
                      </span>
                      <div data-testid="review-rating" data-rating={review.rating}>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    <span className="text-sm text-gray-500" data-testid="review-date">
                      {new Date(review.reviewDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm mb-3" data-testid="review-text">
                  {review.reviewText}
                </p>
                
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkHelpful(review.id)}
                    data-testid="mark-helpful-button"
                    aria-pressed={review.isMarkedHelpful}
                  >
                    <ThumbsUp className={`h-4 w-4 mr-1 ${review.isMarkedHelpful ? 'fill-blue-500 text-blue-500' : ''}`} />
                    Helpful
                  </Button>
                  <span className="text-sm text-gray-500" data-testid="review-helpful-count">
                    {review.helpfulCount} found this helpful
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}