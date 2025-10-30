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
  Zap,
  MapPin
} from 'lucide-react';
import Dashboard from './Dashboard';
import UserManager from './UserManager';
import Analytics from './Analytics';
import AdminSettings from './AdminSettings';
import ContentManagement from './ContentManagement';
import EventManagement from './EventManagement';
import PollManagement from './PollManagement';
import CommentModeration from './CommentModeration';
import RealTimeContent from './RealTimeContent';
import MediaPostCreator from './MediaPostCreator';
import AuthenticationManager from './AuthenticationManager';
import CreatePost from './CreatePost';
import CityManagement from './CityManagement';

const AdminLayout = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMediaCreator, setShowMediaCreator] = useState(false);

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
    { id: 'content-management', label: 'Content', icon: FileText },
  ];

  // Desktop navigation items (full admin features)
  const desktopNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-post', label: 'Create Post', icon: Plus },
    { id: 'create-media', label: 'Create Media Post', icon: Monitor },
    { id: 'content-management', label: 'Content Manager', icon: FileText },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'city-management', label: 'City Management', icon: MapPin },
    { id: 'auth-management', label: 'Authentication', icon: Globe },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'comment-moderation', label: 'Moderation', icon: CheckSquare },
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
      case 'create-media':
        if (isMobile) return <MobileContentWarning />;
        setShowMediaCreator(true);
        setActiveSection('dashboard');
        return <Dashboard />;
      case 'content-management':
        return isMobile ? <MobileContentWarning /> : <ContentManagement />;
      case 'users':
        return <UserManager />;
      case 'city-management':
        return isMobile ? <MobileContentWarning /> : <CityManagement />;
      case 'auth-management':
        return <AuthenticationManager />;
      case 'analytics':
        return <Analytics />;
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
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 z-50 overflow-hidden">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Mobile</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
            ? `fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }` 
            : 'w-64 bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200 dark:border-gray-800 flex-shrink-0 h-full'
          }
        `}>
          {/* Desktop Header */}
          {!isMobile && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700">
              <div className="flex items-center space-x-3">
                <Monitor className="h-8 w-8 text-white" />
                <div>
                  <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                  <p className="text-sm text-blue-100">Desktop Mode</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="p-4 overflow-y-auto h-full">
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
                      w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                      ${activeSection === item.id
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 dark:shadow-blue-400/30'
                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
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
        </div>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0 w-full h-full flex flex-col bg-gray-50 dark:bg-gray-950">
          {/* Desktop Header */}
          {!isMobile && (
            <div className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 w-full flex-shrink-0">
              <div className="px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent capitalize">
                      {activeSection.replace('-', ' ')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {getPageDescription(activeSection)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
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

      {/* Media Post Creator Modal */}
      {showMediaCreator && (
        <MediaPostCreator 
          onClose={() => setShowMediaCreator(false)}
          onSuccess={(result) => {
            console.log('Media post created:', result);
            setShowMediaCreator(false);
            // Optionally switch to content management to see the new post
            setActiveSection('content-management');
          }}
        />
      )}
    </div>
  );
};

// Mobile Content Warning Component
const MobileContentWarning = () => (
  <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
    <Monitor className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Desktop Required</h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4">
      Content creation and management features are optimized for desktop use.
    </p>
    <p className="text-sm text-gray-500 dark:text-gray-500">
      Please use a desktop or tablet (landscape mode) to access these features.
    </p>
  </div>
);

// Helper function for page descriptions
const getPageDescription = (section) => {
  const descriptions = {
    'dashboard': 'Overview of your admin panel and key metrics',
    'create-post': 'Create and publish new articles with multi-language support',
    'create-media': 'Create stories, reels, and media-rich content',
    'content-management': 'Manage all your published content across cities',
    'users': 'Manage user accounts and permissions',
    'city-management': 'Add and manage cities with logos',
    'auth-management': 'Manage authentication and security settings',
    'analytics': 'Detailed analytics and performance metrics',
    'comment-moderation': 'Moderate and manage user comments',
    'events': 'Create and manage events and announcements',
    'polls': 'Create and manage interactive polls',
    'realtime-content': 'Manage breaking news and live updates',
    'settings': 'Configure admin panel settings'
  };
  return descriptions[section] || 'Admin panel section';
};

export default AdminLayout;