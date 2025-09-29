// =============================================
// src/components/Dashboard/StatsCard.jsx
// =============================================
import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color = 'blue',
  format = 'number',
  className = '' 
}) => {
  const formatValue = (val) => {
    if (format === 'number') {
      return val?.toLocaleString() || '0';
    }
    if (format === 'percentage') {
      return `${val || 0}%`;
    }
    if (format === 'currency') {
      return `₹${val?.toLocaleString() || '0'}`;
    }
    return val || '0';
  };

  const getTrend = () => {
    if (!previousValue || previousValue === 0) return null;
    
    const change = ((value - previousValue) / previousValue) * 100;
    
    if (change > 0) {
      return { direction: 'up', value: change, color: 'text-green-600' };
    } else if (change < 0) {
      return { direction: 'down', value: Math.abs(change), color: 'text-red-600' };
    }
    return { direction: 'neutral', value: 0, color: 'text-gray-500' };
  };

  const trend = getTrend();

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
  };

  const iconColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    purple: 'text-purple-600 dark:text-purple-400',
    indigo: 'text-indigo-600 dark:text-indigo-400'
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]} ${className}`}>
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div className={`p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
            <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
          </div>
        )}
        {trend && (
          <div className={`flex items-center space-x-1 ${trend.color}`}>
            {trend.direction === 'up' && <TrendingUp className="w-4 h-4" />}
            {trend.direction === 'down' && <TrendingDown className="w-4 h-4" />}
            {trend.direction === 'neutral' && <Minus className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {trend.value.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          {title}
        </h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatValue(value)}
        </p>
      </div>
    </div>
  );
};

export default StatsCard;