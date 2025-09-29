// =============================================
// src/pages/Profile/ProfilePage.jsx
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/Auth/AuthContext';
import { useTheme } from '../../context/Theme/ThemeContext';
import { useLanguage } from '../../context/Language/LanguageContext';
import { 
  User, 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  LogOut, 
  Edit3,
  Camera,
  Heart,
  MessageCircle,
  Bookmark,
  Share
} from 'lucide-react';

const ProfilePage = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);

  const userStats = {
    postsLiked: 156,
    postsSaved: 89,
    commentsPosted: 234,
    articlesShared: 67
  };

  const recentActivity = [
    { type: 'like', article: 'Vadodara Smart City Project Update', time: '2 hours ago' },
    { type: 'comment', article: 'Traffic Changes on RC Dutt Road', time: '5 hours ago' },
    { type: 'save', article: 'Cricket Tournament Announcement', time: '1 day ago' },
    { type: 'share', article: 'Local Weather Update', time: '2 days ago' },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'save': return <Bookmark className="w-4 h-4 text-yellow-500" />;
      case 'share': return <Share className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user?.name || 'News Reader'}
                </h1>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1 text-gray-500 hover:text-primary-500"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.email || 'reader@ourvadodara.com'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Member since January 2024
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.postsLiked}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Liked</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.postsSaved}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Saved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.commentsPosted}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comments</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{userStats.articlesShared}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Shared</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="mt-4">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settings</h2>
            
            <div className="space-y-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span className="text-gray-900 dark:text-white">
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </div>
              </button>

              {/* Language Selector */}
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5" />
                  <span className="text-gray-900 dark:text-white">Language</span>
                </div>
                <select
                  value={currentLanguage}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="gu">ગુજરાતી</option>
                </select>
              </div>

              {/* Notifications */}
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5" />
                  <span className="text-gray-900 dark:text-white">Notifications</span>
                </div>
                <div className="w-5 h-5 bg-primary-500 rounded-full"></div>
              </button>

              {/* General Settings */}
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5" />
                  <span className="text-gray-900 dark:text-white">General Settings</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-4">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.article}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="mt-4">
        <div className="bg-white dark:bg-gray-900">
          <div className="px-4 py-3">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
