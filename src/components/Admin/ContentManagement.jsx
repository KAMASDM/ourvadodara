// =============================================
// src/components/Admin/ContentManagement.jsx
// Comprehensive Content Management Interface
// =============================================
import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { db } from '../../firebase-config';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Tag, 
  MapPin, 
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  X
} from 'lucide-react';
import EditPost from './EditPost';

const ContentManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Helper function to extract text from multi-language objects or strings
  const getTextContent = (content) => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      // Return the first available language content
      return content.en || content.hi || content.gu || Object.values(content)[0] || '';
    }
    return '';
  };

  useEffect(() => {
    const postsRef = ref(db, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      if (snapshot.exists()) {
        const postsData = snapshot.val();
        const postsArray = Object.entries(postsData).map(([id, data]) => ({
          id,
          ...data
        }));
        setPosts(postsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } else {
        setPosts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDeletePost = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (window.confirm(`Are you sure you want to delete "${getTextContent(post?.title)}"?\n\nThis action cannot be undone.`)) {
      try {
        await remove(ref(db, `posts/${postId}`));
        alert('Post deleted successfully');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post');
      }
    }
  };

  const handleToggleStatus = async (postId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const post = posts.find(p => p.id === postId);
    const action = newStatus === 'published' ? 'publish' : 'unpublish';
    
    if (window.confirm(`Are you sure you want to ${action} "${getTextContent(post?.title)}"?`)) {
      try {
        await update(ref(db, `posts/${postId}`), {
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
        alert(`Post ${action}ed successfully`);
      } catch (error) {
        console.error('Error updating post:', error);
        alert('Error updating post status');
      }
    }
  };

  const handleEditPost = (postId) => {
    setEditingPostId(postId);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setEditingPostId(null);
    setShowEditModal(false);
  };

  const handleSavePost = () => {
    // Post will be automatically updated through Firebase real-time listeners
    setEditingPostId(null);
    setShowEditModal(false);
    // Note: Success message is handled by EditPost component
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showEditModal) {
        handleCloseEditModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal]);

  const handleViewPost = (postId) => {
    // Open post in new tab or navigate to post detail
    const post = posts.find(p => p.id === postId);
    if (post) {
      alert(`View Post: ${getTextContent(post.title)}\nStatus: ${post.status}\nCreated: ${new Date(post.createdAt).toLocaleString()}`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedPosts.length === 0) {
      alert('Please select posts first');
      return;
    }

    if (action === 'delete') {
      if (window.confirm(`Are you sure you want to delete ${selectedPosts.length} selected posts?`)) {
        try {
          const deletePromises = selectedPosts.map(postId => 
            remove(ref(db, `posts/${postId}`))
          );
          await Promise.all(deletePromises);
          setSelectedPosts([]);
          alert('Selected posts deleted successfully');
        } catch (error) {
          console.error('Error deleting posts:', error);
          alert('Error deleting some posts');
        }
      }
    } else if (action === 'publish') {
      try {
        const updatePromises = selectedPosts.map(postId =>
          update(ref(db, `posts/${postId}`), {
            status: 'published',
            updatedAt: new Date().toISOString()
          })
        );
        await Promise.all(updatePromises);
        setSelectedPosts([]);
        alert('Selected posts published successfully');
      } catch (error) {
        console.error('Error publishing posts:', error);
        alert('Error publishing some posts');
      }
    } else if (action === 'draft') {
      try {
        const updatePromises = selectedPosts.map(postId =>
          update(ref(db, `posts/${postId}`), {
            status: 'draft',
            updatedAt: new Date().toISOString()
          })
        );
        await Promise.all(updatePromises);
        setSelectedPosts([]);
        alert('Selected posts moved to draft successfully');
      } catch (error) {
        console.error('Error updating posts:', error);
        alert('Error updating some posts');
      }
    }
  };

  const filteredPosts = posts.filter(post => {
    // Safety check for post object
    if (!post || typeof post !== 'object') return false;
    
    const titleText = getTextContent(post.title);
    const contentText = getTextContent(post.content);
    
    const matchesSearch = !searchTerm || 
      titleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contentText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const statusStyles = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || statusStyles.draft}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Safety check for posts array
  if (!Array.isArray(posts)) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <p>Error loading posts. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
          <p className="text-gray-600">Manage all your published content</p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center text-sm text-gray-600">
            <input
              type="checkbox"
              checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPosts(filteredPosts.map(post => post.id));
                } else {
                  setSelectedPosts([]);
                }
              }}
              className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            Select All
          </label>
          <div className="text-sm text-gray-500">
            {filteredPosts.length} posts
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedPosts.length} posts selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('publish')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Publish
              </button>
              <button
                onClick={() => handleBulkAction('draft')}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Move to Draft
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedPosts([])}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="createdAt">Date Created</option>
            <option value="updatedAt">Last Updated</option>
            <option value="title">Title</option>
            <option value="views">Views</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-white rounded-lg shadow-sm">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Edit className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500">No posts match your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPosts.map(post => (
              <div key={post.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPosts([...selectedPosts, post.id]);
                      } else {
                        setSelectedPosts(selectedPosts.filter(id => id !== post.id));
                      }
                    }}
                    className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post thumbnail"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {getTextContent(post.title)}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                          {getTextContent(post.excerpt) || getTextContent(post.content)?.substring(0, 100) + '...'}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                          {post.category && (
                            <span className="flex items-center">
                              <Tag className="w-3 h-3 mr-1" />
                              {post.category}
                            </span>
                          )}
                          {post.location && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {post.location}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {post.views || 0} views
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(post.status)}
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleStatus(post.id, post.status)}
                            className={`p-1 transition-colors ${
                              post.status === 'published' 
                                ? 'text-green-600 hover:text-green-800' 
                                : 'text-gray-400 hover:text-blue-600'
                            }`}
                            title={post.status === 'published' ? 'Unpublish Post' : 'Publish Post'}
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditPost(post.id)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit Post"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleViewPost(post.id)}
                            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="View Post Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Post Modal */}
      {showEditModal && editingPostId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Post</h2>
              <button
                onClick={handleCloseEditModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <EditPost
                postId={editingPostId}
                onClose={handleCloseEditModal}
                onSave={handleSavePost}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagement;