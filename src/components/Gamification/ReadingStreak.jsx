// =============================================
// src/components/Gamification/ReadingStreak.jsx
// Reading Streak Tracker with Firebase Integration
// =============================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { db } from '../../firebase-config';
import { Flame, Trophy, Target, TrendingUp } from 'lucide-react';
import { format, differenceInDays, isToday, parseISO } from 'date-fns';

const ReadingStreak = ({ compact = false, showInHeader = false }) => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
    lastReadDate: null
  });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user || user.isAnonymous) return;

    const loadStreak = async () => {
      try {
        const streakRef = ref(db, `users/${user.uid}/streak`);
        const snapshot = await get(streakRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          setStreakData(data);
        }
      } catch (error) {
        console.error('Error loading streak:', error);
      }
    };

    loadStreak();
  }, [user]);

  // Update streak when user reads an article
  useEffect(() => {
    if (!user || user.isAnonymous) return;

    const updateStreak = async () => {
      try {
        const streakRef = ref(db, `users/${user.uid}/streak`);
        const snapshot = await get(streakRef);
        
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const lastRead = data.lastReadDate;

          // Check if already read today
          if (lastRead === today) {
            return;
          }

          // Check if streak continues
          const lastDate = parseISO(lastRead);
          const daysDiff = differenceInDays(now, lastDate);

          let newStreak;
          if (daysDiff === 1) {
            // Streak continues
            newStreak = data.currentStreak + 1;
            
            // Show confetti on milestone
            if (newStreak % 7 === 0) {
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 3000);
            }
          } else if (daysDiff === 0) {
            // Same day, keep streak
            newStreak = data.currentStreak;
          } else {
            // Streak broken
            newStreak = 1;
          }

          const updates = {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, data.longestStreak || 0),
            totalDays: (data.totalDays || 0) + 1,
            lastReadDate: today,
            updatedAt: serverTimestamp()
          };

          await set(streakRef, updates);
          setStreakData(updates);
        } else {
          // Initialize streak
          const initial = {
            currentStreak: 1,
            longestStreak: 1,
            totalDays: 1,
            lastReadDate: today,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          await set(streakRef, initial);
          setStreakData(initial);
        }
      } catch (error) {
        console.error('Error updating streak:', error);
      }
    };

    // Listen for article read events
    const handleArticleRead = () => {
      updateStreak();
    };

    document.addEventListener('articleRead', handleArticleRead);
    return () => document.removeEventListener('articleRead', handleArticleRead);
  }, [user]);

  if (!user || user.isAnonymous) return null;

  if (showInHeader) {
    return (
      <div className="relative">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg">
          <Flame className="w-4 h-4 animate-flame" />
          <span className="text-sm font-bold">{streakData.currentStreak}</span>
        </div>
        
        {showConfetti && (
          <div className="absolute -top-2 -right-2 text-2xl animate-confetti">
            🎉
          </div>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="glass-card rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white animate-flame" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Reading streak
              </div>
            </div>
          </div>
          
          {streakData.currentStreak >= 7 && (
            <Trophy className="w-5 h-5 text-yellow-500" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Reading Streak
        </h3>
        <div className="flex items-center gap-1">
          <Flame className="w-5 h-5 text-purple-500 animate-flame" />
        </div>
      </div>

      {/* Current Streak */}
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 shadow-2xl mb-4">
          <div className="text-4xl font-black text-white">
            {streakData.currentStreak}
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          day{streakData.currentStreak !== 1 ? 's' : ''} in a row
        </div>
        {streakData.currentStreak >= 7 && (
          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold">
            <Trophy className="w-3 h-3" />
            <span>On Fire!</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-subtle rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {streakData.longestStreak}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Best Streak
          </div>
        </div>

        <div className="glass-subtle rounded-xl p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {streakData.totalDays}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total Days
          </div>
        </div>
      </div>

      {/* Motivation Message */}
      <div className="glass-subtle rounded-xl p-3 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {streakData.currentStreak === 0 && "Start your reading journey today!"}
          {streakData.currentStreak >= 1 && streakData.currentStreak < 7 && "Keep it up! You're building a great habit."}
          {streakData.currentStreak >= 7 && streakData.currentStreak < 30 && "Amazing! You're on fire! 🔥"}
          {streakData.currentStreak >= 30 && "Incredible dedication! You're a reading champion! 🏆"}
        </p>
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                fontSize: `${Math.random() * 20 + 10}px`
              }}
            >
              {['🎉', '🔥', '⭐', '💪', '🎊'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingStreak;
