// =============================================
// src/components/Admin/RoundupManagement.jsx
// Admin Interface for Managing Daily News Roundups
// =============================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { ref, get, set, update, onValue } from 'firebase/database';
import { db } from '../../firebase-config';
import {
  createRoundupTemplate,
  getTodayRoundupId,
  autoSelectPosts,
  extractPostDetails,
  validateRoundup,
  formatDateForTitle,
  ROUNDUP_STATUS
} from '../../utils/roundupSchema';
import {
  Newspaper,
  Sparkles,
  Plus,
  Trash2,
  Eye,
  Save,
  Clock,
  TrendingUp,
  Check,
  X,
  Loader,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Calendar,
  RefreshCw
} from 'lucide-react';

const RoundupManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [todayRoundup, setTodayRoundup] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [availablePosts, setAvailablePosts] = useState([]);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const todayId = getTodayRoundupId();

  // Load today's roundup and all posts
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if user is admin
        if (!user || user.role !== 'admin') {
          setError('Admin access required to manage roundups.');
          setLoading(false);
          return;
        }

        // Load existing roundup for today
        const roundupRef = ref(db, `news-roundups/${todayId}`);
        const roundupSnapshot = await get(roundupRef);
        
        if (roundupSnapshot.exists()) {
          const roundupData = roundupSnapshot.val();
          setTodayRoundup(roundupData);
          setSelectedPosts(roundupData.posts || []);
        }

        // Load all posts from today
        const postsRef = ref(db, 'posts');
        const postsSnapshot = await get(postsRef);
        
        if (postsSnapshot.exists()) {
          const postsData = postsSnapshot.val();
          const postsArray = Object.entries(postsData).map(([id, post]) => ({
            id,
            ...post
          }));
          
          // Filter posts from today
          const today = new Date();
          const todayPosts = postsArray.filter(post => {
            if (!post.publishedAt && !post.createdAt) return false;
            const postDate = new Date(post.publishedAt || post.createdAt);
            return (
              postDate.getDate() === today.getDate() &&
              postDate.getMonth() === today.getMonth() &&
              postDate.getFullYear() === today.getFullYear() &&
              post.isPublished
            );
          });
          
          setAllPosts(todayPosts);
          
          // Set available posts (not selected)
          if (roundupSnapshot.exists()) {
            const selectedIds = roundupSnapshot.val().posts || [];
            setAvailablePosts(todayPosts.filter(p => !selectedIds.includes(p.id)));
          } else {
            setAvailablePosts(todayPosts);
          }
        }
      } catch (err) {
        console.error('Error loading roundup data:', err);
        setError(`Failed to load data: ${err.message}. Make sure you're logged in as admin.`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [todayId, user]);

  const handleAutoGenerate = async () => {
    setGenerating(true);
    setError(null);
    
    try {
      // Auto-select top posts based on engagement
      const topPosts = autoSelectPosts(allPosts, 10);
      
      if (topPosts.length === 0) {
        setError('No posts available from today to create a roundup.');
        setGenerating(false);
        return;
      }
      
      // Create new roundup
      const newRoundup = createRoundupTemplate(user.uid, true);
      newRoundup.posts = topPosts.map(p => p.id);
      newRoundup.postDetails = {};
      
      topPosts.forEach(post => {
        newRoundup.postDetails[post.id] = extractPostDetails(post);
      });
      
      setTodayRoundup(newRoundup);
      setSelectedPosts(newRoundup.posts);
      setAvailablePosts(allPosts.filter(p => !newRoundup.posts.includes(p.id)));
      setSuccess('✨ Roundup auto-generated! Review and save when ready.');
    } catch (err) {
      console.error('Error auto-generating roundup:', err);
      setError('Failed to auto-generate roundup. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateManual = () => {
    const newRoundup = createRoundupTemplate(user.uid, false);
    setTodayRoundup(newRoundup);
    setSelectedPosts([]);
    setAvailablePosts(allPosts);
    setSuccess('✅ New roundup created! Add posts manually.');
  };

  const handleAddPost = (postId) => {
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const newSelectedPosts = [...selectedPosts, postId];
    const updatedRoundup = {
      ...todayRoundup,
      posts: newSelectedPosts,
      postDetails: {
        ...todayRoundup.postDetails,
        [postId]: extractPostDetails(post)
      },
      updatedAt: new Date().toISOString()
    };

    setTodayRoundup(updatedRoundup);
    setSelectedPosts(newSelectedPosts);
    setAvailablePosts(availablePosts.filter(p => p.id !== postId));
  };

  const handleRemovePost = (postId) => {
    const newSelectedPosts = selectedPosts.filter(id => id !== postId);
    const post = allPosts.find(p => p.id === postId);
    
    const updatedPostDetails = { ...todayRoundup.postDetails };
    delete updatedPostDetails[postId];

    const updatedRoundup = {
      ...todayRoundup,
      posts: newSelectedPosts,
      postDetails: updatedPostDetails,
      updatedAt: new Date().toISOString()
    };

    setTodayRoundup(updatedRoundup);
    setSelectedPosts(newSelectedPosts);
    if (post) {
      setAvailablePosts([...availablePosts, post]);
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const newPosts = [...selectedPosts];
    [newPosts[index], newPosts[index - 1]] = [newPosts[index - 1], newPosts[index]];
    
    setSelectedPosts(newPosts);
    setTodayRoundup({
      ...todayRoundup,
      posts: newPosts,
      updatedAt: new Date().toISOString()
    });
  };

  const handleMoveDown = (index) => {
    if (index === selectedPosts.length - 1) return;
    
    const newPosts = [...selectedPosts];
    [newPosts[index], newPosts[index + 1]] = [newPosts[index + 1], newPosts[index]];
    
    setSelectedPosts(newPosts);
    setTodayRoundup({
      ...todayRoundup,
      posts: newPosts,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSave = async (publish = false) => {
    if (!todayRoundup) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const validation = validateRoundup(todayRoundup);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        setSaving(false);
        return;
      }

      const roundupToSave = {
        ...todayRoundup,
        status: publish ? ROUNDUP_STATUS.PUBLISHED : ROUNDUP_STATUS.DRAFT,
        updatedAt: new Date().toISOString()
      };

      const roundupRef = ref(db, `news-roundups/${todayId}`);
      await set(roundupRef, roundupToSave);

      setTodayRoundup(roundupToSave);
      setSuccess(publish ? '🎉 Roundup published successfully!' : '💾 Roundup saved as draft!');
    } catch (err) {
      console.error('Error saving roundup:', err);
      setError('Failed to save roundup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading roundup data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Today's News Roundup
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {formatDateForTitle(new Date())}
                </p>
              </div>
            </div>

            {!todayRoundup && (
              <div className="flex space-x-3">
                <button
                  onClick={handleAutoGenerate}
                  disabled={generating || allPosts.length === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  {generating ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  <span className="font-semibold">Auto-Generate</span>
                </button>

                <button
                  onClick={handleCreateManual}
                  disabled={generating}
                  className="flex items-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">Create Manually</span>
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              icon={Calendar}
              label="Total Posts Today"
              value={allPosts.length}
              color="blue"
            />
            <StatCard
              icon={Check}
              label="Selected Posts"
              value={selectedPosts.length}
              color="green"
            />
            <StatCard
              icon={Clock}
              label="Status"
              value={todayRoundup?.status || 'Not Created'}
              color="purple"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Views"
              value={todayRoundup?.analytics?.views || 0}
              color="orange"
            />
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start space-x-3">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {allPosts.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Posts Published Today
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Publish some news posts to create today's roundup.
            </p>
          </div>
        )}

        {allPosts.length > 0 && todayRoundup && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Selected Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span>Selected Posts ({selectedPosts.length})</span>
                </h2>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {selectedPosts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                  <Plus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No posts selected yet. Add posts from the right panel.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {selectedPosts.map((postId, index) => {
                    const postDetail = todayRoundup.postDetails[postId];
                    if (!postDetail) return null;

                    return (
                      <div
                        key={postId}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
                      >
                        <span className="text-sm font-bold text-gray-400 w-6">
                          {index + 1}
                        </span>
                        
                        {postDetail.thumbnailUrl && (
                          <img
                            src={postDetail.thumbnailUrl}
                            alt={postDetail.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {postDetail.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {postDetail.category}
                          </p>
                        </div>

                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                            title="Move up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === selectedPosts.length - 1}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                            title="Move down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemovePost(postId)}
                            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons */}
              {selectedPosts.length > 0 && (
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-all font-semibold"
                  >
                    {saving ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>Save Draft</span>
                  </button>

                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 transition-all font-semibold shadow-lg"
                  >
                    {saving ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    <span>Publish</span>
                  </button>
                </div>
              )}
            </div>

            {/* Available Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Available Posts ({availablePosts.length})</span>
              </h2>

              {availablePosts.length === 0 ? (
                <div className="text-center py-12">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    All posts have been added to the roundup!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {availablePosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group"
                    >
                      {(post.thumbnailUrl || post.imageUrl) && (
                        <img
                          src={post.thumbnailUrl || post.imageUrl}
                          alt={post.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {post.title || post.content?.substring(0, 50) || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {post.category || 'General'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddPost(post.id)}
                        className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-all"
                        title="Add to roundup"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default RoundupManagement;
