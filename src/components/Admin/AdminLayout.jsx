// =============================================
// src/components/Admin/AdminLayout.jsx
// Responsive Admin Layout - Desktop for creation, Mobile for analytics
// =============================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  TrendingUp, 
  Settings, 
  Menu, 
  X,
  Monitor,
  Smartphone,
  Plus,
  BarChart3,
  MessageSquare,
  Calendar,
  Globe,
  CheckSquare,
  Zap
} from 'lucide-react';
import Dashboard from './Dashboard';
import PostManager from './PostManager';
import UserManager from './UserManager';
import Analytics from './Analytics';
import CreatePost from './CreatePost';
import AdminSettings from './AdminSettings';
import ContentManagement from './ContentManagement';
import CommentManagement from './CommentManagement';
import EventManagement from './EventManagement';
import PollManagement from './PollManagement';
import CommentModeration from './CommentModeration';
import RealTimeContent from './RealTimeContent';


const AdminLayout = () => {
  const { user, isAdmin } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // Changed from 768 to 1024 for better laptop support
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Mobile navigation items (analytics focused)
  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content-mobile', label: 'Content', icon: FileText },
  ];

  // Desktop navigation items (full admin features)
  const desktopNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-post', label: 'Create Post', icon: Plus },
    { id: 'content-management', label: 'Content Management', icon: FileText },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'comments', label: 'Comments', icon: MessageSquare },
    { id: 'comment-moderation', label: 'Comment Moderation', icon: CheckSquare },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'polls', label: 'Polls', icon: BarChart3 },
    { id: 'realtime-content', label: 'Breaking News & Live', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = isMobile ? mobileNavItems : desktopNavItems;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have admin permissions.</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'create-post':
        return isMobile ? <MobileContentWarning /> : <CreatePost />;
      case 'content-management':
        return isMobile ? <MobileContentWarning /> : <ContentManagement />;
      case 'content-mobile':
        return <PostManager />;
      case 'users':
        return <UserManager />;
      case 'analytics':
        return <Analytics />;
      case 'comments':
        return isMobile ? <MobileContentWarning /> : <CommentManagement />;
      case 'comment-moderation':
        return isMobile ? <MobileContentWarning /> : <CommentModeration />;
      case 'events':
        return isMobile ? <MobileContentWarning /> : <EventManagement />;
      case 'polls':
        return isMobile ? <MobileContentWarning /> : <PollManagement />;
      case 'realtime-content':
        return isMobile ? <MobileContentWarning /> : <RealTimeContent />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-semibold text-gray-900">Admin Mobile</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      )}

      <div className="flex w-full h-full">
        {/* Sidebar */}
        <div className={`
          ${isMobile 
            ? `fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }` 
            : 'w-64 bg-white shadow-sm flex-shrink-0 h-full'
          }
        `}>
          {/* Desktop Header */}
          {!isMobile && (
            <div className="p-6 border-b">
              <div className="flex items-center space-x-3">
                <Monitor className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-sm text-gray-500">Desktop Mode</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="p-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                      ${activeSection === item.id
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* User Info */}
          <div className="absolute bottom-0 w-full p-4 border-t">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.displayName || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0 w-full h-full flex flex-col">
          {/* Desktop Header */}
          {!isMobile && (
            <div className="bg-white shadow-sm border-b w-full flex-shrink-0">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 capitalize">
                      {activeSection.replace('-', ' ')}
                    </h2>
                    <p className="text-gray-600">
                      {getPageDescription(activeSection)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Monitor className="h-4 w-4" />
                    <span>Desktop Mode</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <main className="flex-1 p-6 w-full max-w-none overflow-y-auto">
            <div className="w-full">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

// Mobile Content Warning Component
const MobileContentWarning = () => (
  <div className="text-center p-8 bg-white rounded-lg shadow-sm">
    <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Desktop Required</h3>
    <p className="text-gray-600 mb-4">
      Content creation and management features are optimized for desktop use.
    </p>
    <p className="text-sm text-gray-500">
      Please use a desktop or tablet to access these features.
    </p>
  </div>
);

// Helper function for page descriptions
const getPageDescription = (section) => {
  const descriptions = {
    'dashboard': 'Overview of your admin panel and key metrics',
    'create-post': 'Create and publish new content',
    'content-management': 'Manage all your published content',
    'users': 'Manage user accounts and permissions',
    'analytics': 'Detailed analytics and performance metrics',
    'comments': 'Moderate and manage user comments',
    'events': 'Create and manage events and announcements',
    'settings': 'Configure admin panel settings'
  };
  return descriptions[section] || 'Admin panel section';
};

export default AdminLayout;