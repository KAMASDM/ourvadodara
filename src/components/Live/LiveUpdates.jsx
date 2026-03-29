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
  Eye,
  Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase-config';
import { useLanguage } from '../../context/Language/LanguageContext';

const LiveUpdates = ({ className = '' }) => {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
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
    // Listen to live updates from Firebase
    const liveUpdatesRef = ref(db, 'liveUpdates');
    const unsubscribe = onValue(liveUpdatesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const updatesArray = Object.entries(data)
          .map(([id, update]) => ({ ...update, id }))
          .filter(update => update.isActive)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10); // Show latest 10 updates
        
        setUpdates(updatesArray);
      } else {
        // Fallback to mock data if no Firebase data
        setUpdates(mockUpdates);
      }
      setLoading(false);
    });

    // Listen to live viewer count
    const viewersRef = ref(db, 'liveViewers/count');
    const viewersUnsubscribe = onValue(viewersRef, (snapshot) => {
      const count = snapshot.val();
      if (count) {
        setViewerCount(count);
      } else {
        // Simulate viewer count
        setViewerCount(Math.floor(Math.random() * 1000) + 500);
      }
    });

    return () => {
      unsubscribe();
      viewersUnsubscribe();
    };
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-danger bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-l-neutral-400 bg-neutral-50 dark:bg-neutral-800/40';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'breaking': return <AlertCircle className="w-4 h-4 text-danger" />;
      case 'weather': return <Clock className="w-4 h-4 text-sky-500" />;
      case 'local': return <Users className="w-4 h-4 text-green-500" />;
      case 'sports': return <Play className="w-4 h-4 text-primary-500" />;
      default: return <Radio className="w-4 h-4 text-neutral-400" />;
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
    <div className={`bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-danger text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <Radio className="w-4 h-4" />
              <span className="text-sm font-bold tracking-wide">
                {t('live.breaking', 'LIVE')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs bg-red-700 px-2 py-0.5 rounded-full">
              <Eye className="w-3 h-3" />
              {viewerCount.toLocaleString()}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleAudio}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-700 transition"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={toggleMute}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-700 transition"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-700 transition"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Updates List */}
      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-80' : 'max-h-48'} overflow-y-auto`}>
        {updates.length === 0 ? (
          <div className="p-6 flex flex-col items-center gap-2 text-neutral-400 dark:text-neutral-500">
            <Radio className="w-8 h-8 opacity-50" />
            <p className="text-sm">{t('live.noUpdates', 'No live updates at the moment')}</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
            {updates.map((update) => (
              <div
                key={update.id}
                className={`px-4 py-3 border-l-4 ${getPriorityColor(update.priority)} hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(update.type)}
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                      {update.time}
                    </span>
                  </div>
                  {update.priority === 'high' && (
                    <span className="bg-red-100 text-danger dark:bg-red-900/30 dark:text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {t('live.breaking', 'BREAKING')}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white mb-0.5">
                  {typeof update.title === 'object'
                    ? (update.title[currentLanguage] || update.title.en || Object.values(update.title)[0])
                    : update.title}
                </h4>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {typeof update.content === 'object'
                    ? (update.content[currentLanguage] || update.content.en || Object.values(update.content)[0])
                    : update.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-neutral-50 dark:bg-neutral-700/40 px-4 py-2 border-t border-neutral-100 dark:border-neutral-700">
        <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
          <span>{t('live.lastUpdate', 'Last update')}: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            {t('live.autoRefresh', 'Auto-refresh on')}
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