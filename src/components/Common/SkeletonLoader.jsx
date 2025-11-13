// =============================================
// src/components/Common/SkeletonLoader.jsx
// Reusable Skeleton Loading Components
// =============================================
import React from 'react';

// Base skeleton element with shimmer animation
const Skeleton = ({ className = '', variant = 'rectangular' }) => {
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded'
  };

  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] ${variantClasses[variant]} ${className}`}
      style={{
        animation: 'shimmer 2s infinite linear'
      }}
    >
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

// Post Card Skeleton
export const PostCardSkeleton = () => {
  return (
    <div className="rounded-3xl border border-gray-200/60 dark:border-gray-700/60 bg-white dark:bg-gray-900 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="text" className="h-3 w-24" />
        </div>
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Skeleton variant="text" className="h-5 w-full" />
        <Skeleton variant="text" className="h-5 w-3/4" />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-3 w-2/3" />
      </div>

      {/* Media */}
      <Skeleton variant="rectangular" className="w-full h-64" />

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-4">
          <Skeleton variant="text" className="h-8 w-16" />
          <Skeleton variant="text" className="h-8 w-16" />
          <Skeleton variant="text" className="h-8 w-16" />
        </div>
        <Skeleton variant="text" className="h-8 w-16" />
      </div>
    </div>
  );
};

// Story Card Skeleton
export const StoryCardSkeleton = () => {
  return (
    <div className="flex-shrink-0">
      <Skeleton variant="circular" className="w-16 h-16" />
      <Skeleton variant="text" className="h-3 w-16 mt-2" />
    </div>
  );
};

// Reel Card Skeleton
export const ReelCardSkeleton = () => {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800">
      <Skeleton variant="rectangular" className="w-full aspect-[9/16]" />
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <Skeleton variant="text" className="h-4 w-32" />
        <Skeleton variant="text" className="h-3 w-48" />
      </div>
    </div>
  );
};

// Comment Skeleton
export const CommentSkeleton = () => {
  return (
    <div className="flex space-x-3 py-3">
      <Skeleton variant="circular" className="w-8 h-8" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="rectangular" className="h-12 rounded-lg" />
        <Skeleton variant="text" className="h-3 w-24" />
      </div>
    </div>
  );
};

// Notification Skeleton
export const NotificationSkeleton = () => {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
      <Skeleton variant="circular" className="w-10 h-10" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-3 w-full" />
        <Skeleton variant="text" className="h-3 w-3/4" />
        <Skeleton variant="text" className="h-2 w-20 mt-1" />
      </div>
    </div>
  );
};

// Feed Skeleton - Multiple post cards
export const FeedSkeleton = ({ count = 3 }) => {
  return (
    <div className="flex flex-col gap-6 px-3 pb-8 sm:px-4">
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </div>
  );
};

// Stories Rail Skeleton
export const StoriesRailSkeleton = () => {
  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <Skeleton variant="text" className="h-5 w-24 mb-3" />
      <div className="flex space-x-3 overflow-x-hidden">
        {Array.from({ length: 8 }).map((_, index) => (
          <StoryCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

// Grid Skeleton for Reels
export const ReelsGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
      {Array.from({ length: count }).map((_, index) => (
        <ReelCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default Skeleton;
