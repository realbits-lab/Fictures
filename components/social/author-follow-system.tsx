'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  BookOpen, 
  Eye, 
  Users,
  Bell,
  UserPlus,
  UserMinus,
  Calendar,
  TrendingUp
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/alert-dialog';

interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  followersCount: number;
  storiesCount: number;
  totalReads: number;
  isFollowing: boolean;
}

interface AuthorUpdate {
  id: string;
  authorName: string;
  updateType: 'new-chapter' | 'new-story' | 'story-completed';
  storyTitle: string;
  timestamp: string;
}

interface AuthorFollowSystemProps {
  author: Author;
  className?: string;
}

export function AuthorFollowSystem({ author: initialAuthor, className }: AuthorFollowSystemProps) {
  const [author, setAuthor] = useState<Author>(initialAuthor);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);

  const handleFollowToggle = () => {
    if (author.isFollowing) {
      setShowUnfollowDialog(true);
    } else {
      setAuthor(prev => ({
        ...prev,
        isFollowing: true,
        followersCount: prev.followersCount + 1
      }));
    }
  };

  const confirmUnfollow = () => {
    setAuthor(prev => ({
      ...prev,
      isFollowing: false,
      followersCount: prev.followersCount - 1
    }));
    setShowUnfollowDialog(false);
  };

  return (
    <>
      <Card className={className} data-testid="story-author-section">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>About the Author</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="author-profile">
            {/* Author Basic Info */}
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16" data-testid="author-avatar">
                <AvatarImage src={author.avatar} alt={author.name} />
                <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold" data-testid="author-name">
                  {author.name}
                </h3>
                
                <p className="text-sm text-gray-600" data-testid="author-bio">
                  {author.bio}
                </p>
                
                {/* Author Statistics */}
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1" data-testid="author-followers-count">
                    <Users className="h-4 w-4" />
                    <span>{author.followersCount.toLocaleString()} followers</span>
                  </div>
                  
                  <div className="flex items-center space-x-1" data-testid="author-stories-count">
                    <BookOpen className="h-4 w-4" />
                    <span>{author.storiesCount} stories</span>
                  </div>
                  
                  <div className="flex items-center space-x-1" data-testid="author-total-reads">
                    <Eye className="h-4 w-4" />
                    <span>{author.totalReads.toLocaleString()} reads</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Follow Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleFollowToggle}
                variant={author.isFollowing ? "outline" : "default"}
                data-testid="follow-author-button"
                aria-pressed={author.isFollowing}
                className="min-w-[120px]"
              >
                {author.isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-2" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unfollow Confirmation Dialog */}
      <Dialog open={showUnfollowDialog} onOpenChange={setShowUnfollowDialog}>
        <DialogContent data-testid="unfollow-confirmation-modal">
          <DialogHeader>
            <DialogTitle>Unfollow {author.name}?</DialogTitle>
            <DialogDescription>
              You will no longer receive notifications about new stories and updates from this author.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowUnfollowDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmUnfollow}
              data-testid="confirm-unfollow-button"
            >
              Unfollow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Following Dashboard Component
export function FollowingDashboard() {
  const [followedAuthors] = useState([
    {
      id: '1',
      name: 'Sarah Mitchell',
      latestUpdate: 'Published Chapter 15 of "The Last Kingdom"',
      lastActivity: '2 hours ago',
      avatar: undefined
    },
    {
      id: '2',
      name: 'James Cooper',
      latestUpdate: 'Started new story "Digital Dreams"',
      lastActivity: '1 day ago',
      avatar: undefined
    }
  ]);

  const [followingStats] = useState({
    totalFollowing: 12,
    newUpdatesCount: 3
  });

  return (
    <div className="space-y-6" data-testid="following-dashboard">
      {/* Following Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Following Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4" data-testid="following-stats">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600" data-testid="total-following">
                {followingStats.totalFollowing}
              </div>
              <div className="text-sm text-blue-600">Authors Following</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600" data-testid="new-updates-count">
                {followingStats.newUpdatesCount}
              </div>
              <div className="text-sm text-green-600">New Updates</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Followed Authors List */}
      <Card>
        <CardHeader>
          <CardTitle>Authors You Follow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="followed-authors-list">
            {followedAuthors.map((author) => (
              <div 
                key={author.id}
                className="flex items-center justify-between p-4 border rounded-lg"
                data-testid="followed-author-item"
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={author.avatar} alt={author.name} />
                    <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <h4 className="font-medium" data-testid="author-name">
                      {author.name}
                    </h4>
                    <p className="text-sm text-gray-600" data-testid="latest-story-update">
                      {author.latestUpdate}
                    </p>
                    <p className="text-xs text-gray-500" data-testid="last-activity-date">
                      {author.lastActivity}
                    </p>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" data-testid="unfollow-button">
                  Unfollow
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Notifications Component
export function AuthorNotifications() {
  const [notifications] = useState<AuthorUpdate[]>([
    {
      id: '1',
      authorName: 'Sarah Mitchell',
      updateType: 'new-chapter',
      storyTitle: 'The Last Kingdom',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      authorName: 'James Cooper',
      updateType: 'new-story',
      storyTitle: 'Digital Dreams',
      timestamp: '1 day ago'
    },
    {
      id: '3',
      authorName: 'Emily Parker',
      updateType: 'story-completed',
      storyTitle: 'Midnight Mysteries',
      timestamp: '3 days ago'
    }
  ]);

  const getUpdateTypeLabel = (type: string) => {
    switch (type) {
      case 'new-chapter':
        return 'New Chapter';
      case 'new-story':
        return 'New Story';
      case 'story-completed':
        return 'Story Completed';
      default:
        return 'Update';
    }
  };

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'new-chapter':
        return <BookOpen className="h-4 w-4" />;
      case 'new-story':
        return <TrendingUp className="h-4 w-4" />;
      case 'story-completed':
        return <Badge className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6" data-testid="notifications-page">
      {/* Notification Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1" data-testid="notification-tabs">
        <Button variant="default" size="sm" data-testid="all-notifications">
          All
        </Button>
        <Button variant="ghost" size="sm" data-testid="author-updates">
          Author Updates
        </Button>
        <Button variant="ghost" size="sm" data-testid="story-comments">
          Comments
        </Button>
        <Button variant="ghost" size="sm" data-testid="story-reviews">
          Reviews
        </Button>
      </div>

      {/* Author Updates List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Author Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="author-updates-list">
            {notifications.map((update) => (
              <div 
                key={update.id}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                data-testid="author-update-item"
              >
                <div className="mt-1">
                  {getUpdateTypeIcon(update.updateType)}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium" data-testid="author-name">
                      {update.authorName}
                    </span>
                    <Badge variant="secondary" data-testid="update-type">
                      {getUpdateTypeLabel(update.updateType)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600" data-testid="story-title">
                    {update.storyTitle}
                  </p>
                  
                  <p className="text-xs text-gray-500" data-testid="update-timestamp">
                    {update.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Author Profile Activity Feed
export function AuthorActivityFeed({ authorId }: { authorId: string }) {
  const [activities] = useState([
    {
      id: '1',
      type: 'chapter-published',
      description: 'Published Chapter 15 of "The Last Kingdom"',
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      type: 'story-created',
      description: 'Started writing a new story "Digital Dreams"',
      timestamp: '1 week ago'
    },
    {
      id: '3',
      type: 'milestone-reached',
      description: 'Reached 10,000 total reads across all stories',
      timestamp: '2 weeks ago'
    }
  ]);

  return (
    <div className="space-y-6" data-testid="author-page">
      {/* Author Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1" data-testid="author-tabs">
        <Button variant="ghost" size="sm" data-testid="stories-tab">
          Stories
        </Button>
        <Button variant="default" size="sm" data-testid="activity-tab">
          Activity
        </Button>
        <Button variant="ghost" size="sm" data-testid="about-tab">
          About
        </Button>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="author-activity-feed">
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start space-x-3 pb-4 border-b last:border-b-0"
                data-testid="activity-item"
              >
                <div className="mt-1">
                  <Calendar className="h-4 w-4" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <p className="text-sm" data-testid="activity-description">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500" data-testid="activity-timestamp">
                      {activity.timestamp}
                    </span>
                    <Badge variant="outline" size="sm" data-testid="activity-type">
                      {activity.type}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}