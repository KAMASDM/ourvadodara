import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Clock, CheckCircle, Vote, Eye, Share2, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { useAuth } from '../../context/Auth/AuthContext';
import { DATABASE_PATHS } from '../../utils/databaseSchema';

const PollWidget = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [userVotes, setUserVotes] = useState(new Map());
  const [showResults, setShowResults] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const getCurrentLang = () => {
    const lang = i18n.language || 'en';
    return ['en', 'hi', 'gu'].includes(lang) ? lang : 'en';
  };

  useEffect(() => {
    const db = getDatabase();
    const pollsRef = ref(db, DATABASE_PATHS.POLLS);

    const unsubscribe = onValue(pollsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const pollsArray = Object.entries(data)
          .map(([id, poll]) => ({ ...poll, id }))
          .filter(poll => poll.isPublished && poll.settings?.isActive)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setPolls(pollsArray);
      } else {
        setPolls([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleVote = async (pollId, optionId) => {
    const poll = polls.find(p => p.id === pollId);
    if (!poll || !poll.settings?.isActive) return;
    
    if (poll.settings?.requireAuth && !user) {
      alert('Please sign in to vote');
      return;
    }

    try {
      const db = getDatabase();
      const pollRef = ref(db, `${DATABASE_PATHS.POLLS}/${pollId}`);
      
      const optionIndex = poll.options.findIndex(opt => opt.id === optionId);
      if (optionIndex === -1) return;
      
      const currentVotes = poll.options[optionIndex].votes || 0;
      const currentVoters = poll.options[optionIndex].voters || [];
      
      if (user && currentVoters.includes(user.uid)) {
        alert('You have already voted on this option');
        return;
      }
      
      const updates = {};
      const newTotalVotes = (poll.totalVotes || 0) + 1;
      
      updates[`options/${optionIndex}/votes`] = currentVotes + 1;
      
      if (user) {
        updates[`options/${optionIndex}/voters`] = [...currentVoters, user.uid];
      }
      
      updates['totalVotes'] = newTotalVotes;
      updates['analytics/totalVotes'] = newTotalVotes;
      
      await update(pollRef, updates);
      
      const newUserVotes = new Map(userVotes);
      newUserVotes.set(pollId, optionId);
      setUserVotes(newUserVotes);

      if (poll.settings?.showResults !== 'before_vote') {
        const newShowResults = new Map(showResults);
        newShowResults.set(pollId, true);
        setShowResults(newShowResults);
      }
      
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to submit vote. Please try again.');
    }
  };

  const toggleResults = (pollId) => {
    const newShowResults = new Map(showResults);
    newShowResults.set(pollId, !showResults.get(pollId));
    setShowResults(newShowResults);
  };

  const hasVoted = (pollId) => {
    const poll = polls.find(p => p.id === pollId);
    if (user && poll) {
      return poll.options.some(option => option.voters && option.voters.includes(user.uid));
    }
    return userVotes.has(pollId);
  };

  const calculatePercentage = (optionVotes, totalVotes) => {
    if (totalVotes === 0) return 0;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  const getMultiLangText = (textObj, fallback = '') => {
    const currentLang = getCurrentLang();
    if (!textObj) return fallback;
    return textObj[currentLang] || textObj.en || fallback;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        <div className="text-center py-8">
          <Vote className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Polls</h3>
          <p className="text-gray-500">Check back later for community polls and surveys.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Community Polls
          </h2>
          <span className="text-sm text-gray-500">
            {polls.length} active {polls.length === 1 ? 'poll' : 'polls'}
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {polls.slice(0, 3).map((poll) => {
          const userHasVoted = hasVoted(poll.id);
          const shouldShowResults = showResults.get(poll.id) || poll.settings?.showResults === 'always' || poll.settings?.showResults === 'before_vote';
          const totalVotes = poll.totalVotes || 0;

          return (
            <div key={poll.id} className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {getMultiLangText(poll.question)}
                </h3>
                
                {poll.description && getMultiLangText(poll.description) && (
                  <p className="text-gray-600 text-sm mb-3">
                    {getMultiLangText(poll.description)}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                    </span>
                    
                    {poll.settings?.endDate && (
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Ends soon
                      </span>
                    )}

                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {poll.category}
                    </span>
                  </div>

                  {userHasVoted && (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Voted
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {poll.options.map((option) => {
                  const optionVotes = option.votes || 0;
                  const percentage = calculatePercentage(optionVotes, totalVotes);

                  return (
                    <div key={option.id} className="relative">
                      {shouldShowResults ? (
                        <div className="relative bg-gray-50 rounded-lg p-3 border">
                          <div className="flex items-center justify-between relative z-10">
                            <span className="font-medium text-gray-900">
                              {getMultiLangText(option.text)}
                            </span>
                            <span className="text-sm font-semibold text-gray-700">
                              {percentage}% ({optionVotes})
                            </span>
                          </div>
                          
                          <div className="absolute inset-0 bg-blue-100 rounded-lg transition-all duration-500"
                               style={{ width: `${percentage}%` }}>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleVote(poll.id, option.id)}
                          disabled={userHasVoted}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            userHasVoted ? 'opacity-50 cursor-not-allowed border-gray-200' : 'cursor-pointer border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <span className="font-medium">
                            {getMultiLangText(option.text)}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => toggleResults(poll.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {shouldShowResults ? 'Hide Results' : 'View Results'}
                </button>

                <div className="flex items-center space-x-2 text-gray-500">
                  <button className="p-1 hover:text-blue-600 transition-colors">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button className="p-1 hover:text-blue-600 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {polls.length > 3 && (
        <div className="p-4 border-t border-gray-100 text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All Polls
          </button>
        </div>
      )}
    </div>
  );
};

export default PollWidget;
