// =============================================
// src/components/Common/PullToRefreshIndicator.jsx
// Visual Indicator for Pull-to-Refresh
// =============================================
import React from 'react';
import { Loader2, ArrowDown, Check } from 'lucide-react';

const PullToRefreshIndicator = ({ 
  pullDistance, 
  progress, 
  rotation, 
  isThresholdReached, 
  refreshing 
}) => {
  if (pullDistance === 0 && !refreshing) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        transform: `translateY(${Math.min(pullDistance, 80)}px)`,
        transition: refreshing ? 'transform 0.3s ease-out' : 'none'
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg p-3 border-2 border-gray-200 dark:border-gray-700">
        {refreshing ? (
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        ) : isThresholdReached ? (
          <Check className="w-6 h-6 text-green-600" />
        ) : (
          <ArrowDown 
            className="w-6 h-6 text-gray-600 dark:text-gray-400 transition-transform"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              opacity: progress
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
