// =============================================
// src/components/Live/LiveUpdatesReal.jsx
// Real-time Live Updates Component with Firebase Integration
// =============================================

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase-config';
import { DATABASE_PATHS } from '../../utils/databaseSchema';
import { Radio, Clock, MapPin, AlertCircle } from 'lucide-react';

const LiveUpdatesReal = () => {
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const liveRef = ref(db, DATABASE_PATHS.LIVE_UPDATES);
    const unsubscribe = onValue(liveRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const updates = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(update => update.isActive)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5); // Show latest 5 updates
        
        setLiveUpdates(updates);
      } else {
        setLiveUpdates([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
            <Radio className="h-5 w-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Live Updates</h2>
          </div>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {liveUpdates.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Radio className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No live updates at the moment</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {liveUpdates.map((update) => (
              <div 
                key={update.id} 
                className={`p-4 border-l-4 hover:bg-gray-50 transition-colors ${getPriorityColor(update.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {update.priority === 'urgent' && (
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mr-1" />
                        <span className="text-xs font-semibold text-red-600 uppercase">URGENT</span>
                      </div>
                    )}
                    
                    <h3 className="font-medium text-gray-900 mb-1">
                      {update.title?.en || 'Live Update'}
                    </h3>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      {update.content?.en || 'No content available'}
                    </p>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimeAgo(update.createdAt)}
                      </div>
                      
                      {update.location && (
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {update.location}
                        </div>
                      )}
                      
                      {update.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {update.category}
                        </span>
                      )}
                    </div>
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

export default LiveUpdatesReal;