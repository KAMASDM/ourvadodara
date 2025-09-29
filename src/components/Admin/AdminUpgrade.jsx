// =============================================
// src/components/Admin/AdminUpgrade.jsx
// Utility to upgrade current user to admin
// =============================================
import React, { useState } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { upgradeToAdmin } from '../../utils/adminSetup';

const AdminUpgrade = () => {
  const { user } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpgradeToAdmin = async () => {
    if (!user) {
      setMessage('Please login first');
      return;
    }

    setUpgrading(true);
    setMessage('');
    
    try {
      await upgradeToAdmin(user.uid, user.email);
      setMessage('Successfully upgraded to admin! Please refresh the page to see changes.');
      
      // Force page refresh to reload user data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error upgrading to admin:', error);
      setMessage('Error upgrading to admin: ' + error.message);
    } finally {
      setUpgrading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Admin Upgrade</h3>
        <p className="text-yellow-700">Please login first to upgrade to admin.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-lg font-semibold text-blue-800 mb-4">Admin Upgrade Tool</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">Current User:</p>
        <p className="font-medium">{user.email}</p>
        <p className="text-sm text-gray-500">Role: {user.role}</p>
      </div>

      {user.role === 'admin' ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 font-medium">✅ You already have admin access!</p>
        </div>
      ) : (
        <>
          <button
            onClick={handleUpgradeToAdmin}
            disabled={upgrading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {upgrading ? 'Upgrading...' : 'Upgrade to Admin'}
          </button>
          
          <p className="text-xs text-gray-500 mt-2">
            This will give you admin permissions including access to the admin dashboard.
          </p>
        </>
      )}

      {message && (
        <div className={`mt-4 p-3 rounded ${
          message.includes('Success') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminUpgrade;