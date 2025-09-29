// =============================================
// src/components/Admin/CommentManagement.jsx
// Comment Moderation and Management
// =============================================
import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { db } from '../../firebase-config';
import { 
  MessageSquare, 
  Check, 
  X, 
  Flag, 
  Eye, 
  Trash2,
  Calendar,
  User
} from 'lucide-react';

const CommentManagement = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const commentsRef = ref(db, 'comments');
    const unsubscribe = onValue(commentsRef, (snapshot) => {
      if (snapshot.exists()) {
        const commentsData = snapshot.val();
        const commentsArray = Object.entries(commentsData).map(([id, data]) => ({
          id,
          ...data
        }));
        setComments(commentsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } else {
        setComments([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (commentId) => {
    try {
      await update(ref(db, `comments/${commentId}`), {
        status: 'approved',
        moderatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error approving comment:', error);
    }
  };

  const handleReject = async (commentId) => {
    try {
      await update(ref(db, `comments/${commentId}`), {
        status: 'rejected',
        moderatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error rejecting comment:', error);
    }
  };

  const handleDelete = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await remove(ref(db, `comments/${commentId}`));
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true;
    return comment.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || statusStyles.pending}`}>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comment Management</h2>
          <p className="text-gray-600">Moderate and manage user comments</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Comments</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Comments List */}
      <div className="bg-white rounded-lg shadow-sm">
        {filteredComments.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No comments found</h3>
            <p className="text-gray-500">No comments match your current filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredComments.map(comment => (
              <div key={comment.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {comment.authorName || 'Anonymous'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      {getStatusBadge(comment.status || 'pending')}
                    </div>
                    
                    <p className="text-gray-800 mb-3">{comment.content}</p>
                    
                    <div className="text-xs text-gray-500">
                      Post: {comment.postTitle || comment.postId}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {comment.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(comment.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {comment.status !== 'rejected' && (
                      <button
                        onClick={() => handleReject(comment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentManagement;