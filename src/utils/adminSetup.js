// =============================================
// src/utils/adminSetup.js
// Admin User Management Utilities
// =============================================
import { ref, set, get } from '../firebase-config';
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