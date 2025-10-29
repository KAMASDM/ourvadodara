// =============================================
// src/components/Admin/AuthenticationManager.jsx
// Enhanced Authentication Management for Admins
// =============================================
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEnhancedAuth } from '../../context/Auth/SimpleEnhancedAuth';
import { 
  getAllUsers, 
  setUserRole, 
  deleteUserProfile, 
  trackAuthEvent,
  updateUserProfile 
} from '../../utils/adminSetup';
import {
  Users,
  Shield,
  Phone,
  Mail,
  Chrome,
  UserPlus,
  Settings,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  UserX,
  UserCheck,
  Crown,
  Key
} from 'lucide-react';
import LoadingSpinner from '../Common/LoadingSpinner';

const AuthenticationManager = () => {
  const { t } = useTranslation();
  const { user, isAdmin } = useEnhancedAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  const [sortBy, setSortBy] = useState('lastLogin');
  const [sortOrder, setSortOrder] = useState('desc');

  // Analytics data
  const [authStats, setAuthStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    emailUsers: 0,
    googleUsers: 0,
    phoneUsers: 0,
    anonymousUsers: 0,
    adminUsers: 0,
    editorUsers: 0,
    moderatorUsers: 0
  });

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
      calculateStats(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData) => {
    const stats = {
      totalUsers: usersData.length,
      activeUsers: 0,
      emailUsers: 0,
      googleUsers: 0,
      phoneUsers: 0,
      anonymousUsers: 0,
      adminUsers: 0,
      editorUsers: 0,
      moderatorUsers: 0
    };

    usersData.forEach(user => {
      // Count active users (logged in within last 30 days)
      if (user.lastLogin) {
        const lastLogin = new Date(user.lastLogin);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (lastLogin > thirtyDaysAgo) {
          stats.activeUsers++;
        }
      }

      // Count by authentication method
      if (user.email) stats.emailUsers++;
      if (user.phoneNumber) stats.phoneUsers++;
      if (user.isAnonymous) stats.anonymousUsers++;
      
      // Check for Google provider
      if (user.providerData && user.providerData.some(p => p.providerId === 'google.com')) {
        stats.googleUsers++;
      }

      // Count by role
      switch (user.role) {
        case 'admin':
          stats.adminUsers++;
          break;
        case 'editor':
          stats.editorUsers++;
          break;
        case 'moderator':
          stats.moderatorUsers++;
          break;
      }
    });

    setAuthStats(stats);
  };

  const handleUserRoleChange = async (userUid, newRole) => {
    try {
      await setUserRole(userUid, newRole);
      await trackAuthEvent(user.uid, 'role_changed', { 
        targetUser: userUid, 
        newRole,
        changedBy: user.uid 
      });
      loadUsers();
    } catch (error) {
      console.error('Error changing user role:', error);
    }
  };

  const handleDeleteUser = async (userUid) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUserProfile(userUid);
        await trackAuthEvent(user.uid, 'user_deleted', { 
          deletedUser: userUid,
          deletedBy: user.uid 
        });
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSuspendUser = async (userUid, suspended) => {
    try {
      await updateUserProfile(userUid, { 
        suspended,
        suspendedAt: suspended ? new Date().toISOString() : null,
        suspendedBy: suspended ? user.uid : null
      });
      await trackAuthEvent(user.uid, suspended ? 'user_suspended' : 'user_unsuspended', { 
        targetUser: userUid 
      });
      loadUsers();
    } catch (error) {
      console.error('Error updating user suspension:', error);
    }
  };

  const getFilteredUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      
      let matchesProvider = true;
      if (filterProvider !== 'all') {
        switch (filterProvider) {
          case 'email':
            matchesProvider = user.email && !user.isAnonymous;
            break;
          case 'google':
            matchesProvider = user.providerData?.some(p => p.providerId === 'google.com');
            break;
          case 'phone':
            matchesProvider = user.phoneNumber;
            break;
          case 'anonymous':
            matchesProvider = user.isAnonymous;
            break;
        }
      }

      return matchesSearch && matchesRole && matchesProvider;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'lastLogin' || sortBy === 'createdAt') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const exportUsers = () => {
    const data = getFilteredUsers().map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isAnonymous: user.isAnonymous,
      suspended: user.suspended
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to access authentication management.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Authentication Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage users, authentication methods, and access controls
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{authStats.totalUsers}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{authStats.activeUsers}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admin Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{authStats.adminUsers}</p>
            </div>
            <Crown className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Google Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{authStats.googleUsers}</p>
            </div>
            <Chrome className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>

            <select
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Providers</option>
              <option value="email">Email</option>
              <option value="google">Google</option>
              <option value="phone">Phone</option>
              <option value="anonymous">Anonymous</option>
            </select>
          </div>

          <button
            onClick={exportUsers}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Authentication
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
              {getFilteredUsers().map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.displayName || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email || 'No Email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {user.email && <Mail className="h-4 w-4 text-blue-500" />}
                      {user.phoneNumber && <Phone className="h-4 w-4 text-green-500" />}
                      {user.providerData?.some(p => p.providerId === 'google.com') && (
                        <Chrome className="h-4 w-4 text-red-500" />
                      )}
                      {user.isAnonymous && <UserX className="h-4 w-4 text-gray-500" />}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleUserRoleChange(user.uid, e.target.value)}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.suspended ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleSuspendUser(user.uid, !user.suspended)}
                        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 ${
                          user.suspended ? 'text-green-600' : 'text-yellow-600'
                        }`}
                        title={user.suspended ? 'Unsuspend user' : 'Suspend user'}
                      >
                        {user.suspended ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.uid)}
                        className="p-1 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {getFilteredUsers().length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthenticationManager;