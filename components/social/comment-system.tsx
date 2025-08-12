'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ThumbsUp, 
  MessageCircle, 
  MoreVertical, 
  Pin, 
  Flag, 
  Trash2, 
  UserX,
  Reply,
  Heart
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  isPinned?: boolean;
  replies: Comment[];
}

interface CommentSystemProps {
  storyId: string;
  chapterId?: string;
  isAuthor?: boolean;
}

export function CommentSystem({ storyId, chapterId, isAuthor = false }: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'BookLover123',
      content: 'This is an excellent story! Love the character development.',
      timestamp: '2 hours ago',
      likes: 15,
      isLiked: false,
      isPinned: true,
      replies: [
        {
          id: '1-1',
          author: 'StoryFan456',
          content: 'I completely agree! The plot twist in chapter 5 was amazing.',
          timestamp: '1 hour ago',
          likes: 8,
          isLiked: true,
          replies: []
        }
      ]
    },
    {
      id: '2',
      author: 'ReaderPro',
      content: 'The pacing in this chapter really picked up!',
      timestamp: '4 hours ago',
      likes: 23,
      isLiked: false,
      replies: []
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentType, setCommentType] = useState<'story' | 'chapter'>('story');

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: 'Current User',
      content: newComment,
      timestamp: 'just now',
      likes: 0,
      isLiked: false,
      replies: []
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleSubmitReply = (parentId: string) => {
    if (!replyText.trim()) return;

    const reply: Comment = {
      id: `${parentId}-${Date.now()}`,
      author: 'Current User',
      content: replyText,
      timestamp: 'just now',
      likes: 0,
      isLiked: false,
      replies: []
    };

    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === parentId 
          ? { ...comment, replies: [...comment.replies, reply] }
          : comment
      )
    );

    setReplyText('');
    setReplyingTo(null);
  };

  const handleLikeComment = (commentId: string, isReply = false, parentId?: string) => {
    if (isReply && parentId) {
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === parentId 
            ? {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === commentId
                    ? { 
                        ...reply, 
                        likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                        isLiked: !reply.isLiked 
                      }
                    : reply
                )
              }
            : comment
        )
      );
    } else {
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
                isLiked: !comment.isLiked 
              }
            : comment
        )
      );
    }
  };

  const handlePinComment = (commentId: string) => {
    setComments(prevComments => 
      prevComments.map(comment => 
        comment.id === commentId 
          ? { ...comment, isPinned: !comment.isPinned }
          : comment
      )
    );
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(prevComments => 
      prevComments.filter(comment => comment.id !== commentId)
    );
  };

  const CommentItem = ({ comment, isReply = false, parentId }: { comment: Comment; isReply?: boolean; parentId?: string }) => (
    <div 
      className={`${isReply ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}
      data-testid={isReply ? 'reply-item' : 'comment-item'}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm" data-testid={isReply ? 'reply-author' : 'comment-author'}>
              {comment.author}
            </span>
            <span className="text-xs text-gray-500" data-testid={isReply ? 'reply-timestamp' : 'comment-timestamp'}>
              {comment.timestamp}
            </span>
            {comment.isPinned && (
              <Pin className="h-3 w-3 text-blue-500" data-testid="pinned-comment-indicator" />
            )}
          </div>
          
          {isAuthor && !isReply && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="comment-moderation-menu">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent data-testid="moderation-options">
                <DropdownMenuItem onClick={() => handlePinComment(comment.id)} data-testid="pin-comment">
                  <Pin className="h-4 w-4 mr-2" />
                  {comment.isPinned ? 'Unpin' : 'Pin'} Comment
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="delete-comment" onClick={() => handleDeleteComment(comment.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Comment
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="report-comment">
                  <Flag className="h-4 w-4 mr-2" />
                  Report Comment
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="block-user">
                  <UserX className="h-4 w-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <p className="text-sm" data-testid={isReply ? 'reply-content' : 'comment-content'}>
          {comment.content}
        </p>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0"
            onClick={() => handleLikeComment(comment.id, isReply, parentId)}
            data-testid={isReply ? 'like-reply-button' : 'like-comment-button'}
            aria-pressed={comment.isLiked}
          >
            <Heart className={`h-4 w-4 mr-1 ${comment.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span data-testid={isReply ? 'reply-likes-count' : 'comment-likes-count'}>
              {comment.likes}
            </span>
          </Button>
          
          {!isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0"
              onClick={() => setReplyingTo(comment.id)}
              data-testid="reply-button"
            >
              <Reply className="h-4 w-4 mr-1" />
              Reply
            </Button>
          )}
        </div>
        
        {/* Reply form */}
        {replyingTo === comment.id && (
          <div className="mt-2 space-y-2" data-testid="reply-form">
            <Textarea
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              data-testid="reply-textarea"
              className="min-h-[60px]"
            />
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleSubmitReply(comment.id)}
                data-testid="submit-reply-button"
              >
                Reply
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
                data-testid="cancel-reply-button"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="mt-4 space-y-4" data-testid="replies-list">
            {comment.replies.map((reply) => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                isReply={true} 
                parentId={comment.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid={chapterId ? 'chapter-comments-section' : 'story-comments-section'}>
      {/* Comment type toggle for chapters */}
      {chapterId && (
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1" data-testid="comment-type-toggle">
          <Button
            variant={commentType === 'story' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCommentType('story')}
            data-testid="story-comments-tab"
          >
            Story Comments
          </Button>
          <Button
            variant={commentType === 'chapter' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCommentType('chapter')}
            data-testid="chapter-comments-tab"
          >
            Chapter Comments
          </Button>
        </div>
      )}

      {/* Comment count */}
      <div className="flex items-center space-x-2">
        <MessageCircle className="h-5 w-5" />
        <span className="font-medium" data-testid={chapterId && commentType === 'chapter' ? 'chapter-comment-count' : 'comment-count'}>
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </div>

      {/* New comment form */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3" data-testid={chapterId && commentType === 'chapter' ? 'new-chapter-comment-form' : 'new-comment-form'}>
            <Textarea
              placeholder={`Share your thoughts about this ${chapterId ? 'chapter' : 'story'}...`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              data-testid="comment-textarea"
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500" data-testid="character-counter">
                {newComment.length}/1000
              </span>
              <Button 
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                data-testid="submit-comment-button"
              >
                Post Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments list */}
      <div className="space-y-6" data-testid={chapterId && commentType === 'chapter' ? 'chapter-comments-list' : 'comments-list'}>
        {comments
          .sort((a, b) => a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1)
          .map((comment) => (
          <div key={comment.id}>
            <CommentItem comment={comment} />
            <Separator className="mt-6" />
          </div>
        ))}
      </div>
    </div>
  );
}