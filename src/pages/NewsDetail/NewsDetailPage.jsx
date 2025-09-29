// =============================================
// src/pages/NewsDetail/NewsDetailPage.jsx
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/Language/LanguageContext';
import { useAuth } from '../../context/Auth/AuthContext';
import { useToast } from '../../components/Common/Toast';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share, 
  Bookmark, 
  MoreHorizontal,
  Calendar,
  User,
  MapPin,
  Eye,
  Clock,
  Flag
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import CommentSection from '../../components/Comments/CommentSection';
import ShareModal from '../../components/Social/ShareModal';
import ReportModal from '../../components/Report/ReportModal';
import ImageViewer from '../../components/Media/ImageViewer';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import useReadTime from '../../hooks/useReadTime';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const NewsDetailPage = ({ newsId, onBack }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const { success } = useToast();
  
  // Fetch real-time data from Firebase
  const { data: postsObject, isLoading, error } = useRealtimeData('posts');
  
  // Initialize read time tracking
  useReadTime(newsId, user?.uid);
  
  const [news, setNews] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [comments, setComments] = useState([]);
  const [relatedNews, setRelatedNews] = useState([]);
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    if (postsObject && newsId) {
      // Convert Firebase object to array and find the specific post
      const postsArray = Object.keys(postsObject).map(key => ({
        id: key,
        ...postsObject[key]
      }));
      
      const newsItem = postsArray.find(item => item.id === newsId);
      
      if (newsItem) {
        setNews(newsItem);
        setIsLiked(false); // Check from user's liked posts
        setIsSaved(false); // Check from user's saved posts
        setViewCount(newsItem.views || Math.floor(Math.random() * 1000) + 100);
        
        // Load related news
        const related = postsArray
          .filter(item => item.id !== newsId && item.category === newsItem.category)
          .slice(0, 3);
        setRelatedNews(related);
        
        // Load comments
        loadComments();
      }
    }
  }, [postsObject, newsId]);

  const loadComments = () => {
    // Mock comments data
    const mockComments = [
      {
        id: '1',
        text: 'Great article! Very informative.',
        author: 'News Reader',
        authorId: 'user1',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        likes: 5,
        isLiked: false,
        replies: []
      },
      {
        id: '2',
        text: 'Thanks for keeping us updated on local news.',
        author: 'Local Citizen',
        authorId: 'user2',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        likes: 3,
        isLiked: false,
        replies: []
      }
    ];
    setComments(mockComments);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setNews(prev => ({
      ...prev,
      likes: prev.likes + (isLiked ? -1 : 1)
    }));
    success(isLiked ? 'Removed from likes' : 'Added to likes');
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    success(isSaved ? 'Removed from saved posts' : 'Saved to your collection');
  };

  const handleAddComment = (comment) => {
    setComments(prev => [comment, ...prev]);
    setNews(prev => ({
      ...prev,
      comments: prev.comments + 1
    }));
  };

  const handleLikeComment = (commentId) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              isLiked: !comment.isLiked, 
              likes: comment.likes + (comment.isLiked ? -1 : 1) 
            }
          : comment
      )
    );
  };

  // Helper functions to handle both string and multi-language content
  const getTitleText = () => {
    if (!news?.title) return '';
    
    // If title is a string, return it directly
    if (typeof news.title === 'string') {
      return news.title;
    }
    
    // If title is an object, try to get the current language or fallback
    if (typeof news.title === 'object') {
      return news.title[currentLanguage] || 
             news.title['gu'] || 
             news.title['en'] || 
             Object.values(news.title)[0] || '';
    }
    
    return '';
  };

  const getContentText = () => {
    if (!news?.content) return '';
    
    // If content is a string, return it directly
    if (typeof news.content === 'string') {
      return news.content;
    }
    
    // If content is an object, try to get the current language or fallback
    if (typeof news.content === 'object') {
      return news.content[currentLanguage] || 
             news.content['gu'] || 
             news.content['en'] || 
             Object.values(news.content)[0] || '';
    }
    
    return '';
  };

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state if Firebase data fetch failed
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Unable to Load Post
            </h3>
            <p className="text-red-600 dark:text-red-300 mb-4">
              Please check your Firebase setup or try again later.
            </p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while finding specific post
  if (!news && !isLoading) {
    // If we have loaded posts but didn't find the specific post
    if (postsObject) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 flex items-center justify-center">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Post Not Found
              </h3>
              <p className="text-yellow-600 dark:text-yellow-300 mb-4">
                The post you're looking for might have been removed or doesn't exist. Post ID: {newsId}
              </p>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Go Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // Still loading posts
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading post details...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <div className="flex items-center space-x-1">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <Flag className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 py-6">
              {/* Breaking News Badge */}
              {news.isBreaking && (
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block animate-pulse">
                  🚨 BREAKING NEWS
                </div>
              )}

              {/* Category */}
              <div className="mb-3">
                <span className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full text-sm font-medium">
                  {news.category.charAt(0).toUpperCase() + news.category.slice(1)}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                {getTitleText()}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>By {news.author}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(news.publishedAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDistanceToNow(new Date(news.publishedAt), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{viewCount.toLocaleString()} views</span>
                </div>
              </div>

              {/* Tags */}
              {news.tags && news.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {news.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Featured Image */}
          {news.image && (
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="px-4 py-4">
                <img
                  src={news.image}
                  alt={getTitleText()}
                  className="w-full h-64 md:h-96 object-cover rounded-lg cursor-pointer"
                  onClick={() => setShowImageViewer(true)}
                />
              </div>
            </div>
          )}

          {/* Article Content */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 py-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                  {getContentText()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 transition-colors ${
                      isLiked
                        ? 'text-red-500'
                        : 'text-gray-600 dark:text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="font-medium">{news.likes}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="font-medium">{news.comments}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors"
                  >
                    <Share className="w-6 h-6" />
                    <span className="font-medium">Share</span>
                  </button>
                </div>
                
                <button
                  onClick={handleSave}
                  className={`transition-colors ${
                    isSaved
                      ? 'text-yellow-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-yellow-500'
                  }`}
                >
                  <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <CommentSection
              postId={news.id}
              comments={comments}
              onAddComment={handleAddComment}
              onLikeComment={handleLikeComment}
            />
          )}

          {/* Related Articles */}
          {relatedNews.length > 0 && (
            <div className="bg-white dark:bg-gray-900 mt-4">
              <div className="px-4 py-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Related Articles
                </h3>
                <div className="space-y-4">
                  {relatedNews.map((article) => (
                    <div
                      key={article.id}
                      className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => window.location.reload()} // In real app, navigate to article
                    >
                      <img
                        src={article.image}
                        alt={article.title[currentLanguage]}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                          {article.title[currentLanguage]}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={news}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType="post"
        contentId={news.id}
      />

      <ImageViewer
        isOpen={showImageViewer}
        images={[{ url: news.image, caption: getTitleText() }]}
        initialIndex={0}
        onClose={() => setShowImageViewer(false)}
      />
    </>
  );
};

export default NewsDetailPage;