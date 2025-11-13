// =============================================
// src/components/Admin/PollManagement.jsx
// Comprehensive Poll Management System
// =============================================

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { createPoll, DATABASE_PATHS } from '../../utils/databaseSchema';
import { ref, onValue, update, remove } from 'firebase/database';
import { db } from '../../firebase-config';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  AlertCircle,
  BarChart3,
  Users,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { adminStyles } from './adminStyles';

const PollManagement = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPoll, setEditingPoll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    question: { en: '', hi: '', gu: '' },
    description: { en: '', hi: '', gu: '' },
    options: [
      { id: '1', text: { en: '', hi: '', gu: '' }, votes: 0, voters: [] },
      { id: '2', text: { en: '', hi: '', gu: '' }, votes: 0, voters: [] }
    ],
    category: 'general',
    tags: [],
    settings: {
      allowMultipleVotes: false,
      requireAuth: true,
      showResults: 'after_vote',
      endDate: '',
      isActive: true
    },
    isPublished: false
  });

  // Load polls from Firebase
  useEffect(() => {
    const pollsRef = ref(db, DATABASE_PATHS.POLLS);
    const unsubscribe = onValue(pollsRef, (snapshot) => {
      const pollsData = snapshot.val();
      if (pollsData) {
        const pollsList = Object.keys(pollsData).map(key => ({
          id: key,
          ...pollsData[key]
        }));
        setPolls(pollsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } else {
        setPolls([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleMultiLanguageChange = (field, lang, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value
      }
    }));
  };

  const handleOptionChange = (optionIndex, lang, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, index) => 
        index === optionIndex 
          ? { ...option, text: { ...option.text, [lang]: value }}
          : option
      )
    }));
  };

  const addOption = () => {
    const newOption = {
      id: Date.now().toString(),
      text: { en: '', hi: '', gu: '' },
      votes: 0,
      voters: []
    };
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, newOption]
    }));
  };

  const removeOption = (optionIndex) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, index) => index !== optionIndex)
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.question.en.trim()) newErrors.question = 'English question is required';
    if (formData.options.some(option => !option.text.en.trim())) {
      newErrors.options = 'All options must have English text';
    }
    if (formData.options.length < 2) newErrors.options = 'At least 2 options are required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (editingPoll) {
        // Update existing poll
        const pollRef = ref(db, `${DATABASE_PATHS.POLLS}/${editingPoll.id}`);
        await update(pollRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new poll
        await createPoll(formData, user.uid);
      }
      
      // Reset form
      setFormData({
        question: { en: '', hi: '', gu: '' },
        description: { en: '', hi: '', gu: '' },
        options: [
          { id: '1', text: { en: '', hi: '', gu: '' }, votes: 0, voters: [] },
          { id: '2', text: { en: '', hi: '', gu: '' }, votes: 0, voters: [] }
        ],
        category: 'general',
        tags: [],
        settings: {
          allowMultipleVotes: false,
          requireAuth: true,
          showResults: 'after_vote',
          endDate: '',
          isActive: true
        },
        isPublished: false
      });
      
      setShowCreateForm(false);
      setEditingPoll(null);
      
    } catch (error) {
      console.error('Error saving poll:', error);
      setErrors({ submit: 'Failed to save poll' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (poll) => {
    setFormData(poll);
    setEditingPoll(poll);
    setShowCreateForm(true);
  };

  const handleDelete = async (pollId) => {
    if (!window.confirm('Are you sure you want to delete this poll?')) return;
    
    try {
      const pollRef = ref(db, `${DATABASE_PATHS.POLLS}/${pollId}`);
      await remove(pollRef);
    } catch (error) {
      console.error('Error deleting poll:', error);
    }
  };

  const togglePollStatus = async (pollId, currentStatus) => {
    try {
      const pollRef = ref(db, `${DATABASE_PATHS.POLLS}/${pollId}/settings/isActive`);
      await update(ref(db, `${DATABASE_PATHS.POLLS}/${pollId}`), {
        'settings.isActive': !currentStatus,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating poll status:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (showCreateForm) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingPoll ? 'Edit Poll' : 'Create New Poll'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingPoll(null);
                setErrors({});
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Multi-language Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Question *
              </label>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">English</label>
                  <input
                    type="text"
                    value={formData.question.en}
                    onChange={(e) => handleMultiLanguageChange('question', 'en', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="What is your question?"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Hindi</label>
                  <input
                    type="text"
                    value={formData.question.hi}
                    onChange={(e) => handleMultiLanguageChange('question', 'hi', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="आपका प्रश्न क्या है?"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Gujarati</label>
                  <input
                    type="text"
                    value={formData.question.gu}
                    onChange={(e) => handleMultiLanguageChange('question', 'gu', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="તમારો પ્રશ્ન શું છે?"
                  />
                </div>
              </div>
              {errors.question && (
                <p className="text-red-500 text-sm mt-2">{errors.question}</p>
              )}
            </div>

            {/* Poll Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Options *
              </label>
              <div className="space-y-4">
                {formData.options.map((option, index) => (
                  <div key={option.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Option {index + 1}</h4>
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">English</label>
                        <input
                          type="text"
                          value={option.text.en}
                          onChange={(e) => handleOptionChange(index, 'en', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Option text"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Hindi</label>
                        <input
                          type="text"
                          value={option.text.hi}
                          onChange={(e) => handleOptionChange(index, 'hi', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="विकल्प पाठ"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Gujarati</label>
                        <input
                          type="text"
                          value={option.text.gu}
                          onChange={(e) => handleOptionChange(index, 'gu', e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="વિકલ્પ ટેક્સ્ટ"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addOption}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </button>
              </div>
              {errors.options && (
                <p className="text-red-500 text-sm mt-2">{errors.options}</p>
              )}
            </div>

            {/* Poll Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Settings
              </label>
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.settings.allowMultipleVotes}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, allowMultipleVotes: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow multiple votes per user</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.settings.requireAuth}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, requireAuth: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Require user authentication</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Show Results
                  </label>
                  <select
                    value={formData.settings.showResults}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, showResults: e.target.value }
                    }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="always">Always show results</option>
                    <option value="after_vote">Show after voting</option>
                    <option value="after_end">Show after poll ends</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.settings.endDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      settings: { ...prev.settings, endDate: e.target.value }
                    }))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Publish Poll</span>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="ml-3 text-sm text-red-700">{errors.submit}</p>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPoll(null);
                  setErrors({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingPoll ? 'Update Poll' : 'Create Poll'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Poll Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Poll
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Options
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Votes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {polls.map((poll) => (
                <tr key={poll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {poll.question.en}
                    </div>
                    <div className="text-sm text-gray-500">
                      Created: {formatDate(poll.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {poll.options.length} options
                    </div>
                    <div className="text-xs text-gray-500">
                      {poll.options.slice(0, 2).map(option => option.text.en).join(', ')}
                      {poll.options.length > 2 && '...'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {poll.totalVotes || 0} total
                    </div>
                    <div className="text-xs text-gray-500">
                      {(() => {
                        const uniqueVoters = new Set();
                        poll.options?.forEach(opt => {
                          (opt.voters || []).forEach(voter => uniqueVoters.add(voter));
                        });
                        return uniqueVoters.size;
                      })()} unique voters
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        poll.settings?.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {poll.settings?.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {poll.isPublished && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Published
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(poll)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => togglePollStatus(poll.id, poll.settings?.isActive)}
                        className={poll.settings?.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                      >
                        {poll.settings?.isActive ? <X className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(poll.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {polls.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No polls</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first poll.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollManagement;