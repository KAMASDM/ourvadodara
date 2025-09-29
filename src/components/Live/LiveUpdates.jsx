// =============================================
// src/components/Live/LiveUpdates.jsx
// Real-time breaking news and live updates
// =============================================
import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Clock, 
  AlertCircle, 
  Volume2, 
  VolumeX,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Users,
  Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LiveUpdates = ({ className = '' }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(1247);
  const [updates, setUpdates] = useState([]);
  const audioRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Mock live updates
  const mockUpdates = [
    {
      id: 1,
      time: '2:45 PM',
      type: 'breaking',
      title: 'Breaking: Major traffic update on NH-8',
      content: 'Heavy congestion reported near Koyali due to ongoing construction work.',
      priority: 'high'
    },
    {
      id: 2,
      time: '2:30 PM', 
      type: 'weather',
      title: 'Weather Alert: Monsoon update',
      content: 'Light to moderate rainfall expected in Vadodara region this evening.',
      priority: 'medium'
    },
    {
      id: 3,
      time: '2:15 PM',
      type: 'local',
      title: 'City Development: New metro line approved',
      content: 'Vadodara Metro Phase 2 gets government approval for eastern corridor.',
      priority: 'low'
    },
    {
      id: 4,
      time: '2:00 PM',
      type: 'sports',
      title: 'Sports: Local cricket team wins championship',
      content: 'Vadodara Warriors defeat Ahmedabad Lions in state-level tournament.',
      priority: 'low'
    }
  ];

  useEffect(() => {
    setUpdates(mockUpdates);

    // Simulate live updates
    const interval = setInterval(() => {
      const newUpdate = {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: ['breaking', 'weather', 'local', 'sports'][Math.floor(Math.random() * 4)],
        title: 'Live Update: ' + ['Traffic', 'Weather', 'Government', 'Sports'][Math.floor(Math.random() * 4)] + ' news',
        content: 'This is a simulated live update for demonstration purposes.',
        priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
      };

      setUpdates(prev => [newUpdate, ...prev.slice(0, 9)]);
      
      // Simulate viewer count changes
      setViewerCount(prev => prev + Math.floor(Math.random() * 20) - 10);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'breaking': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'weather': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'local': return <Users className="w-4 h-4 text-green-500" />;
      case 'sports': return <Play className="w-4 h-4 text-purple-500" />;
      default: return <Radio className="w-4 h-4 text-gray-500" />;
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-red-500 text-white p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <Radio className="w-5 h-5" />
              <span className="font-semibold">
                {t('live.breaking', 'LIVE UPDATES')}
              </span>
            </div>
            <div className="flex items-center text-sm bg-red-600 px-2 py-1 rounded">
              <Eye className="w-3 h-3 mr-1" />
              {viewerCount.toLocaleString()}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAudio}
              className="p-1 hover:bg-red-600 rounded transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-1 hover:bg-red-600 rounded transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-red-600 rounded transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Updates List */}
      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-80' : 'max-h-40'} overflow-y-auto`}>
        {updates.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>{t('live.noUpdates', 'No live updates at the moment')}</p>
          </div>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {updates.map((update) => (
              <div
                key={update.id}
                className={`p-4 border-l-4 ${getPriorityColor(update.priority)} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(update.type)}
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {update.time}
                    </span>
                  </div>
                  {update.priority === 'high' && (
                    <span className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs px-2 py-1 rounded-full">
                      {t('live.breaking', 'BREAKING')}
                    </span>
                  )}
                </div>
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                  {update.title}
                </h4>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {update.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {t('live.lastUpdate', 'Last update')}: {new Date().toLocaleTimeString()}
          </span>
          <span>
            {t('live.autoRefresh', 'Auto-refresh: ON')}
          </span>
        </div>
      </div>

      {/* Hidden audio element for notification sounds */}
      <audio
        ref={audioRef}
        loop
        muted={isMuted}
        preload="metadata"
      >
        <source src="/audio/live-background.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default LiveUpdates;