// =============================================
// src/components/Polls/PollWidget.jsx
// Interactive polls and surveys
// =============================================
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle, 
  Vote,
  Eye,
  Share2,
  MessageCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PollWidget = ({ className = '' }) => {
  const { t } = useTranslation();
  const [polls, setPolls] = useState([]);
  const [userVotes, setUserVotes] = useState(new Map());
  const [showResults, setShowResults] = useState(new Map());

  // Mock polls data
  const mockPolls = [
    {
      id: 1,
      question: 'What is the most important issue for Vadodara city development?',
      options: [
        { id: 'a', text: 'Traffic Management', votes: 1247, percentage: 35 },
        { id: 'b', text: 'Water Supply', votes: 892, percentage: 25 },
        { id: 'c', text: 'Public Transportation', votes: 714, percentage: 20 },
        { id: 'd', text: 'Waste Management', votes: 535, percentage: 15 },
        { id: 'e', text: 'Healthcare Facilities', votes: 178, percentage: 5 }
      ],
      totalVotes: 3566,
      category: 'civic',
      createdAt: '2025-09-25T10:00:00Z',
      endsAt: '2025-10-25T23:59:59Z',
      isActive: true,
      allowMultiple: false,
      showResultsBeforeVoting: false,
      creator: 'Vadodara Municipal Corporation'
    },
    {
      id: 2,
      question: 'Which festival celebration do you enjoy most in Vadodara?',
      options: [
        { id: 'a', text: 'Navratri', votes: 2156, percentage: 45 },
        { id: 'b', text: 'Diwali', votes: 1678, percentage: 35 },
        { id: 'c', text: 'Uttarayan', votes: 718, percentage: 15 },
        { id: 'd', text: 'Ganesh Chaturthi', votes: 239, percentage: 5 }
      ],
      totalVotes: 4791,
      category: 'culture',
      createdAt: '2025-09-20T15:30:00Z',
      endsAt: '2025-10-01T23:59:59Z',
      isActive: true,
      allowMultiple: false,
      showResultsBeforeVoting: true,
      creator: 'Cultural Society Vadodara'
    },
    {
      id: 3,
      question: 'How do you prefer to get your local news?',
      options: [
        { id: 'a', text: 'Mobile Apps', votes: 1834, percentage: 40 },
        { id: 'b', text: 'Social Media', votes: 1467, percentage: 32 },
        { id: 'c', text: 'Newspapers', votes: 825, percentage: 18 },
        { id: 'd', text: 'TV News', votes: 459, percentage: 10 }
      ],
      totalVotes: 4585,
      category: 'media',
      createdAt: '2025-09-28T09:00:00Z',
      endsAt: '2025-10-28T23:59:59Z',
      isActive: true,
      allowMultiple: true,
      showResultsBeforeVoting: false,
      creator: 'Our Vadodara News'
    }
  ];

  useEffect(() => {
    setPolls(mockPolls);
  }, []);

  const handleVote = (pollId, optionId) => {
    const poll = polls.find(p => p.id === pollId);
    if (!poll || !poll.isActive) return;

    const currentVote = userVotes.get(pollId);
    let newVote;

    if (poll.allowMultiple) {
      // Multiple choice poll
      const currentSelection = currentVote || new Set();
      const newSelection = new Set(currentSelection);
      
      if (newSelection.has(optionId)) {
        newSelection.delete(optionId);
      } else {
        newSelection.add(optionId);
      }
      newVote = newSelection;
    } else {
      // Single choice poll
      newVote = optionId;
    }

    const newUserVotes = new Map(userVotes);
    if (poll.allowMultiple && newVote.size === 0) {
      newUserVotes.delete(pollId);
    } else {
      newUserVotes.set(pollId, newVote);
    }
    setUserVotes(newUserVotes);

    // Update poll results (simulate real-time updates)
    const updatedPolls = polls.map(p => {
      if (p.id === pollId) {
        const updatedOptions = p.options.map(option => {
          let newVotes = option.votes;
          
          if (poll.allowMultiple) {
            const wasSelected = currentVote?.has(option.id) || false;
            const isSelected = newVote.has(option.id);
            
            if (!wasSelected && isSelected) {
              newVotes += 1;
            } else if (wasSelected && !isSelected) {
              newVotes -= 1;
            }
          } else {
            if (currentVote === option.id) {
              newVotes -= 1;
            }
            if (newVote === option.id) {
              newVotes += 1;
            }
          }
          
          return { ...option, votes: Math.max(0, newVotes) };
        });

        const newTotalVotes = updatedOptions.reduce((sum, opt) => sum + opt.votes, 0);
        const optionsWithPercentage = updatedOptions.map(option => ({
          ...option,
          percentage: newTotalVotes > 0 ? Math.round((option.votes / newTotalVotes) * 100) : 0
        }));

        return {
          ...p,
          options: optionsWithPercentage,
          totalVotes: newTotalVotes
        };
      }
      return p;
    });

    setPolls(updatedPolls);

    // Show results after voting
    if (!poll.showResultsBeforeVoting) {
      const newShowResults = new Map(showResults);
      newShowResults.set(pollId, true);
      setShowResults(newShowResults);
    }
  };

  const toggleResults = (pollId) => {
    const newShowResults = new Map(showResults);
    newShowResults.set(pollId, !showResults.get(pollId));
    setShowResults(newShowResults);
  };

  const isOptionSelected = (pollId, optionId) => {
    const vote = userVotes.get(pollId);
    if (!vote) return false;
    
    const poll = polls.find(p => p.id === pollId);
    if (poll?.allowMultiple) {
      return vote.has(optionId);
    }
    return vote === optionId;
  };

  const hasVoted = (pollId) => {
    const vote = userVotes.get(pollId);
    const poll = polls.find(p => p.id === pollId);
    
    if (poll?.allowMultiple) {
      return vote && vote.size > 0;
    }
    return vote !== undefined;
  };

  const shouldShowResults = (poll) => {
    return poll.showResultsBeforeVoting || showResults.get(poll.id) || hasVoted(poll.id);
  };

  const getCategoryColor = (category) => {
    const colors = {
      civic: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      culture: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      media: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      business: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      sports: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[category] || colors.civic;
  };

  const getRemainingTime = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m left`;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Vote className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('polls.title', 'Community Polls')}
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span>{t('polls.active', 'Active')}</span>
          </div>
        </div>
      </div>

      {/* Polls List */}
      <div className="divide-y dark:divide-gray-700 max-h-80 overflow-y-auto">
        {polls.map((poll) => (
          <div key={poll.id} className="p-3">
            {/* Poll Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {poll.question}
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(poll.category)}`}>
                    {poll.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{poll.totalVotes.toLocaleString()} votes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{getRemainingTime(poll.endsAt)}</span>
                  </div>
                  {poll.allowMultiple && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>{t('polls.multipleChoice', 'Multiple Choice')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Poll Options */}
            <div className="space-y-3 mb-4">
              {poll.options.map((option) => {
                const isSelected = isOptionSelected(poll.id, option.id);
                const showRes = shouldShowResults(poll);
                
                return (
                  <div
                    key={option.id}
                    onClick={() => poll.isActive && handleVote(poll.id, option.id)}
                    className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${!poll.isActive ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    {/* Results Bar */}
                    {showRes && (
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-purple-100 to-transparent dark:from-purple-900/30 dark:to-transparent rounded-lg transition-all duration-500"
                        style={{ width: `${option.percentage}%` }}
                      />
                    )}
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 border-2 rounded ${
                          poll.allowMultiple ? 'rounded-sm' : 'rounded-full'
                        } ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300 dark:border-gray-600'
                        } flex items-center justify-center`}>
                          {isSelected && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {option.text}
                        </span>
                      </div>
                      
                      {showRes && (
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            {option.percentage}%
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            ({option.votes.toLocaleString()})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Poll Footer */}
            <div className="flex items-center justify-between pt-3 border-t dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('polls.by', 'By')} {poll.creator}
              </div>
              
              <div className="flex items-center space-x-3">
                {!poll.showResultsBeforeVoting && !hasVoted(poll.id) && (
                  <button
                    onClick={() => toggleResults(poll.id)}
                    className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>
                      {showResults.get(poll.id) 
                        ? t('polls.hideResults', 'Hide Results')
                        : t('polls.showResults', 'Show Results')
                      }
                    </span>
                  </button>
                )}
                
                <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  <MessageCircle className="w-4 h-4" />
                  <span>{t('polls.discuss', 'Discuss')}</span>
                </button>
                
                <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                  <Share2 className="w-4 h-4" />
                  <span>{t('polls.share', 'Share')}</span>
                </button>
              </div>
            </div>

            {/* Vote Status */}
            {hasVoted(poll.id) && (
              <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center space-x-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-200">
                  {t('polls.voteSubmitted', 'Your vote has been submitted successfully!')}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Poll Button */}
      <div className="p-4 border-t dark:border-gray-700">
        <button className="w-full flex items-center justify-center space-x-2 py-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">
          <Vote className="w-4 h-4" />
          <span>{t('polls.createPoll', 'Create a Poll')}</span>
        </button>
      </div>
    </div>
  );
};

export default PollWidget;