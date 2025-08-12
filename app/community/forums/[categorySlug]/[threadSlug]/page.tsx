'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface ForumPost {
  id: string;
  content: string;
  author: string;
  timestamp: string;
  likeCount: number;
  isEdited: boolean;
  isOwn: boolean;
}

export default function ThreadPage() {
  const params = useParams();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [editingPost, setEditingPost] = useState<string | null>(null);

  useEffect(() => {
    // Mock thread data
    setPosts([
      {
        id: '1',
        content: 'Welcome to this discussion thread! Feel free to share your thoughts.',
        author: 'ThreadStarter',
        timestamp: '2 hours ago',
        likeCount: 3,
        isEdited: false,
        isOwn: true,
      },
      {
        id: '2',
        content: 'Great topic! I have been thinking about this too.',
        author: 'CommunityMember',
        timestamp: '1 hour ago',
        likeCount: 1,
        isEdited: false,
        isOwn: false,
      },
    ]);
  }, [params]);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likeCount: post.likeCount + 1 }
        : post
    ));
  };

  const handleEdit = (postId: string, newContent: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, content: newContent, isEdited: true }
        : post
    ));
    setEditingPost(null);
  };

  const handleSubmitPost = () => {
    if (!newPostContent.trim()) return;
    
    const newPost: ForumPost = {
      id: Date.now().toString(),
      content: newPostContent,
      author: 'CurrentUser',
      timestamp: 'Just now',
      likeCount: 0,
      isEdited: false,
      isOwn: true,
    };
    
    setPosts([...posts, newPost]);
    setNewPostContent('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div data-testid="thread-header" className="mb-8">
        <h1 data-testid="thread-title" className="text-3xl font-bold text-gray-900">
          Test Thread Title
        </h1>
        <div className="mt-2 text-gray-600">
          <span data-testid="thread-author">Started by ThreadStarter</span>
          <span className="mx-2">•</span>
          <span>{posts.length} posts</span>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {posts.map((post) => (
          <div key={post.id} data-testid="forum-post" className="bg-white border rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span data-testid="post-author" className="font-semibold text-gray-900">
                    {post.author}
                  </span>
                  <span data-testid="post-timestamp" className="text-sm text-gray-500">
                    {post.timestamp}
                  </span>
                  {post.isEdited && (
                    <span data-testid="edited-indicator" className="text-xs text-gray-400">
                      (edited)
                    </span>
                  )}
                </div>
                
                {editingPost === post.id ? (
                  <div data-testid="edit-post-form">
                    <textarea
                      data-testid="edit-post-content"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mb-3"
                      rows={4}
                      defaultValue={post.content}
                    />
                    <div className="flex space-x-2">
                      <button
                        data-testid="save-edit-button"
                        onClick={() => {
                          const textarea = document.querySelector('[data-testid="edit-post-content"]') as HTMLTextAreaElement;
                          handleEdit(post.id, textarea.value);
                        }}
                        className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingPost(null)}
                        className="border border-gray-300 text-gray-700 px-3 py-1 text-sm rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div data-testid="post-content" className="text-gray-800 mb-4">
                    {post.content}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  data-testid="like-post-button"
                  onClick={() => handleLike(post.id)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-600"
                >
                  <span>👍</span>
                  <span data-testid="like-count">{post.likeCount}</span>
                </button>
                
                {post.isOwn && (
                  <button
                    data-testid="edit-post-button"
                    onClick={() => setEditingPost(post.id)}
                    className="text-sm text-gray-500 hover:text-blue-600"
                  >
                    Edit
                  </button>
                )}
                
                <button
                  data-testid="moderate-post-button"
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Report
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Reply to Thread</h3>
        <textarea
          data-testid="post-content-editor"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4"
          rows={4}
          placeholder="Write your reply..."
        />
        <button
          data-testid="submit-post-button"
          onClick={handleSubmitPost}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Post Reply
        </button>
      </div>

      {/* Moderation Modal - placeholder */}
      <div data-testid="moderation-modal" className="hidden">
        <select data-testid="moderation-action-select">
          <option>Warn</option>
          <option>Delete</option>
        </select>
        <textarea data-testid="moderation-reason" placeholder="Reason..."></textarea>
      </div>
    </div>
  );
}