// =============================================
// src/utils/adminSetup.js
// Enhanced Admin User Management Utilities
// =============================================
import { ref, set, get, update } from 'firebase/database';
import { db } from '../firebase-config';

// Create initial admin user in the database
export const createAdminUser = async (userUid, email) => {
  try {
    const userRef = ref(db, `users/${userUid}`);
    await set(userRef, {
      email,
      role: 'admin',
      displayName: 'Admin User',
      createdAt: new Date().toISOString(),
      permissions: {
        canCreatePosts: true,
        canEditPosts: true,
        canDeletePosts: true,
        canManageUsers: true,
        canViewAnalytics: true
      }
    });
    console.log('Admin user created successfully');
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

// Check if user is admin
export const checkAdminStatus = async (userUid) => {
  try {
    const userRef = ref(db, `users/${userUid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return userData.role === 'admin';
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get user profile with role information
export const getUserProfile = async (userUid) => {
  try {
    const userRef = ref(db, `users/${userUid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Create or update user profile
export const createUserProfile = async (userUid, userData) => {
  try {
    const userRef = ref(db, `users/${userUid}`);
    const defaultData = {
      email: userData.email,
      role: 'user',
      displayName: userData.displayName || 'User',
      createdAt: new Date().toISOString(),
      permissions: {}
    };
    
    await set(userRef, { ...defaultData, ...userData });
    console.log('User profile created successfully');
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Upgrade existing user to admin
export const upgradeToAdmin = async (userUid, email) => {
  try {
    const userRef = ref(db, `users/${userUid}`);
    
    // Check if user exists first
    const snapshot = await get(userRef);
    let userData = {};
    
    if (snapshot.exists()) {
      userData = snapshot.val();
    }
    
    // Update with admin privileges
    const adminData = {
      ...userData,
      email,
      role: 'admin',
      displayName: userData.displayName || 'Admin User',
      updatedAt: new Date().toISOString(),
      permissions: {
        canCreatePosts: true,
        canEditPosts: true,
        canDeletePosts: true,
        canManageUsers: true,
        canViewAnalytics: true
      }
    };
    
    if (!userData.createdAt) {
      adminData.createdAt = new Date().toISOString();
    }
    
    await set(userRef, adminData);
    console.log('User upgraded to admin successfully');
    return true;
  } catch (error) {
    console.error('Error upgrading user to admin:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userUid, updates) => {
  try {
    const userRef = ref(db, `users/${userUid}`);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await update(userRef, updateData);
    console.log('User profile updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Set user role and permissions
export const setUserRole = async (userUid, role, customPermissions = null) => {
  try {
    const rolePermissions = {
      admin: {
        canCreatePosts: true,
        canEditPosts: true,
        canDeletePosts: true,
        canManageUsers: true,
        canViewAnalytics: true,
        canManageComments: true,
        canManageEvents: true,
        canSendNotifications: true
      },
      editor: {
        canCreatePosts: true,
        canEditPosts: true,
        canDeletePosts: false,
        canManageUsers: false,
        canViewAnalytics: true,
        canManageComments: true,
        canManageEvents: true,
        canSendNotifications: false
      },
      moderator: {
        canCreatePosts: false,
        canEditPosts: false,
        canDeletePosts: false,
        canManageUsers: false,
        canViewAnalytics: false,
        canManageComments: true,
        canManageEvents: false,
        canSendNotifications: false
      },
      user: {}
    };

    const permissions = customPermissions || rolePermissions[role] || {};
    
    await updateUserProfile(userUid, {
      role,
      permissions
    });
    
    return true;
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
};

// Get all users for admin management
export const getAllUsers = async () => {
  try {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      return Object.entries(users).map(([uid, userData]) => ({
        uid,
        ...userData
      }));
    }
    return [];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

// Delete user profile
export const deleteUserProfile = async (userUid) => {
  try {
    const userRef = ref(db, `users/${userUid}`);
    await set(userRef, null);
    console.log('User profile deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting user profile:', error);
    throw error;
  }
};

// Link anonymous account data
export const linkAnonymousAccountData = async (anonymousUid, newUserUid, userData) => {
  try {
    // Transfer any anonymous user data to the new authenticated account
    const anonymousRef = ref(db, `users/${anonymousUid}`);
    const anonymousSnapshot = await get(anonymousRef);
    
    let mergedData = { ...userData };
    
    if (anonymousSnapshot.exists()) {
      const anonymousData = anonymousSnapshot.val();
      // Merge bookmarks, preferences, etc.
      mergedData = {
        ...userData,
        bookmarks: anonymousData.bookmarks || [],
        preferences: anonymousData.preferences || {},
        readingHistory: anonymousData.readingHistory || []
      };
      
      // Delete the anonymous account data
      await set(anonymousRef, null);
    }
    
    // Create/update the new user profile
    await createUserProfile(newUserUid, mergedData);
    
    return true;
  } catch (error) {
    console.error('Error linking anonymous account data:', error);
    throw error;
  }
};

// Track user authentication events
export const trackAuthEvent = async (userUid, eventType, metadata = {}) => {
  try {
    const eventRef = ref(db, `authEvents/${userUid}/${Date.now()}`);
    await set(eventRef, {
      event: eventType,
      timestamp: new Date().toISOString(),
      metadata
    });
  } catch (error) {
    console.error('Error tracking auth event:', error);
  }
};

// Default admin credentials for initial setup
export const DEFAULT_ADMIN_EMAIL = 'admin@ourvadodara.com';
export const DEFAULT_ADMIN_PASSWORD = 'admin123456';

// Setup function to create the initial admin account
export const setupInitialAdmin = async () => {
  try {
    // This function should be called from the Firebase setup helper
    return {
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      setupInstructions: [
        'Use the Firebase setup helper to create the admin account',
        'Login with the default credentials',
        'Change the password after first login'
      ]
    };
  } catch (error) {
    console.error('Error in admin setup:', error);
    throw error;
  }
};