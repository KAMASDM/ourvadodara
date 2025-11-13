// =============================================
// src/components/Admin/CommentModeration.jsx
// Advanced Comment Moderation System
// =============================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { getCommentsForModeration, moderateComment, DATABASE_PATHS } from '../../utils/databaseSchema';
import { ref, onValue, get } from 'firebase/database';
import { db } from '../../firebase-config';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Calendar, 
  ExternalLink,
  Filter,
  Search,
  AlertTriangle
} from 'lucide-react';
import { adminStyles } from './adminStyles';

const CommentModeration = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [filteredComments, setFilteredComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPost, setSelectedPost] = useState('all');
  const [posts, setPosts] = useState([]);

  // Helper function to safely get title text
  const getTitleText = (title) => {
    if (typeof title === 'string') return title;
    if (typeof title === 'object' && title !== null) {
      return title.en || title.hi || title.gu || Object.values(title)[0] || 'Untitled';
    }
    return 'Untitled';
  };

  // Load comments and posts
  useEffect(() => {
    const loadData = async () => {
      try {
        let postsDataMap = {};
        let postsListCache = [];
        // Load posts for filter dropdown
        const postsRef = ref(db, DATABASE_PATHS.POSTS);
        const postsSnapshot = await get(postsRef);
        if (postsSnapshot.exists()) {
          postsDataMap = postsSnapshot.val();
          postsListCache = Object.keys(postsDataMap).map(key => ({
            id: key,
            ...postsDataMap[key],
            // Ensure title is always a string for the dropdown
            displayTitle: postsDataMap[key].title?.en || postsDataMap[key].title || 'Untitled'
          }));
          setPosts(postsListCache);
        } else {
          setPosts([]);
        }

        // Load comments with real-time updates
        const commentsRef = ref(db, DATABASE_PATHS.COMMENTS);
        const unsubscribe = onValue(commentsRef, async (snapshot) => {
          if (snapshot.exists()) {
            const commentsData = snapshot.val();
            const commentsList = Object.keys(commentsData).map(key => ({
              id: key,
              ...commentsData[key]
            }));

            // Enhance comments with post information
            const enhancedComments = await Promise.all(
              commentsList.map(async (comment) => {
                const post = postsListCache.find(p => p.id === comment.postId) || 
                            postsDataMap?.[comment.postId];
                return {
                  ...comment,
                  postTitle: post?.title?.en || post?.title || 'Unknown Post',
                  postCategory: post?.category || 'uncategorized'
                };
              })
            );

            setComments(enhancedComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          } else {
            setComments([]);
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading moderation data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter comments based on status, search, and post selection
  useEffect(() => {
    let filtered = comments;

    // Filter by moderation status
    if (filter === 'pending') {
      filtered = filtered.filter(comment => 
        comment.approved !== true && comment.rejected !== true
      );
    } else if (filter === 'approved') {
      filtered = filtered.filter(comment => comment.approved === true);
    } else if (filter === 'rejected') {
      filtered = filtered.filter(comment => comment.rejected === true);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(comment =>
        comment.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.author?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.postTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by selected post
    if (selectedPost !== 'all') {
      filtered = filtered.filter(comment => comment.postId === selectedPost);
    }

    setFilteredComments(filtered);
  }, [comments, filter, searchTerm, selectedPost]);

  const handleModeration = async (commentId, action) => {
    try {
      await moderateComment(commentId, action, user.uid);
      
      // Update local state immediately for better UX
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                approved: action === 'approve',
                rejected: action === 'reject',
                moderatedBy: user.uid,
                moderatedAt: new Date().toISOString()
              }
            : comment
        )
      );
    } catch (error) {
      console.error('Error moderating comment:', error);
      alert('Failed to moderate comment. Please try again.');
    }
  };

  const getStatusColor = (comment) => {
    if (comment.approved) return 'text-green-600 bg-green-100';
    if (comment.rejected) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getStatusText = (comment) => {
    if (comment.approved) return 'Approved';
    if (comment.rejected) return 'Rejected';
    return 'Pending';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = comments.filter(c => !c.approved && !c.rejected).length;
  const approvedCount = comments.filter(c => c.approved).length;
  const rejectedCount = comments.filter(c => c.rejected).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Comment Moderation</h1>
        <p className={adminStyles.textMuted}>Review and moderate user comments across all posts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={adminStyles.cardCompact}>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className={adminStyles.textSmall}>Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
            </div>
          </div>
        </div>
        
        <div className={adminStyles.cardCompact}>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className={adminStyles.textSmall}>Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{approvedCount}</p>
            </div>
          </div>
        </div>
        
        <div className={adminStyles.cardCompact}>
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className={adminStyles.textSmall}>Rejected</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{rejectedCount}</p>
            </div>
          </div>
        </div>
        
        <div className={adminStyles.cardCompact}>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className={adminStyles.textSmall}>Total Comments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{comments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${adminStyles.cardCompact} mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className={adminStyles.label}>
              Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={adminStyles.select}
            >
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="all">All Comments</option>
            </select>
          </div>

          {/* Post Filter */}
          <div>
            <label className={adminStyles.label}>
              Post
            </label>
            <select
              value={selectedPost}
              onChange={(e) => setSelectedPost(e.target.value)}
              className={adminStyles.select}
            >
              <option value="all">All Posts</option>
              {posts.map(post => {
                const titleText = post.displayTitle || getTitleText(post.title);
                return (
                  <option key={post.id} value={post.id}>
                    {titleText.substring(0, 50)}{titleText.length > 50 ? '...' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search */}
          <div className="md:col-span-2">
            <label className={adminStyles.label}>
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${adminStyles.input} pl-10`}
                placeholder="Search comments, authors, or posts..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className={adminStyles.card}>
        {filteredComments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No comments found</h3>
            <p className="text-gray-500">
              {filter === 'pending' 
                ? 'All comments have been reviewed!' 
                : 'Try adjusting your filters to see more comments.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Comment Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {comment.author?.name || 'Anonymous'}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(comment)}`}>
                          {getStatusText(comment)}
                        </span>
                      </div>
                      
                      {/* Post Link */}
                      <a
                        href={`/news/${comment.postId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Post
                      </a>
                    </div>

                    {/* Post Title */}
                    <div className="mb-3">
                      <p className={adminStyles.textSmall}>
                        Comment on: <span className="font-medium text-gray-900 dark:text-white">{comment.postTitle}</span>
                      </p>
                    </div>

                    {/* Comment Content */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                      <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{comment.content}</p>
                    </div>

                    {/* User Information */}
                    <div className={`${adminStyles.textSmall} mb-4`}>
                      <p>Email: {comment.author?.email || 'Not provided'}</p>
                      {comment.author?.uid && (
                        <p>User ID: {comment.author.uid}</p>
                      )}
                    </div>

                    {/* Moderation Info */}
                    {(comment.approved || comment.rejected) && (
                      <div className={`${adminStyles.textSmall} bg-gray-50 dark:bg-gray-700 rounded p-2`}>
                        <p>
                          {comment.approved ? 'Approved' : 'Rejected'} by{' '}
                          {comment.moderatedBy} on{' '}
                          {formatDate(comment.moderatedAt)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {!comment.approved && !comment.rejected && (
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => handleModeration(comment.id, 'approve')}
                        className={adminStyles.successButton}
                      >
                        <CheckCircle className="h-4 w-4 mr-1 inline" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleModeration(comment.id, 'reject')}
                        className={adminStyles.dangerButton}
                      >
                        <XCircle className="h-4 w-4 mr-1 inline" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentModeration;