// =============================================
// src/components/Admin/FirebaseSetup.jsx
// Firebase Setup Helper Component
// =============================================

import React, { useState } from 'react';
import { populateSampleData, securityRules, temporaryRules } from '../../utils/firebaseSetup';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../../utils/adminSetup';
import { useAuth } from '../../context/Auth/AuthContext';
import { Database, Shield, CheckCircle, AlertCircle, Copy, UserPlus, Key } from 'lucide-react';

const FirebaseSetup = () => {
  const { user, createAdmin, isAdmin } = useAuth();
  const [isPopulating, setIsPopulating] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [setupStatus, setSetupStatus] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);

  const handlePopulateSampleData = async (bypassAuth = false) => {
    if (!user && !bypassAuth) {
      setSetupStatus({ type: 'error', message: 'Please sign in first to populate data' });
      return;
    }

    setIsPopulating(true);
    setSetupStatus(null);

    try {
      const success = await populateSampleData();
      if (success) {
        setSetupStatus({ 
          type: 'success', 
          message: 'Sample data populated successfully! Check your Firebase Console and refresh the homepage.' 
        });
      } else {
        setSetupStatus({ 
          type: 'error', 
          message: 'Failed to populate sample data. Make sure Firebase security rules are set up first.' 
        });
      }
    } catch (error) {
      setSetupStatus({ 
        type: 'error', 
        message: `Error: ${error.message}. Make sure to set up security rules first.` 
      });
    } finally {
      setIsPopulating(false);
    }
  };

  const copyRulesToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(securityRules, null, 2));
    setSetupStatus({ 
      type: 'success', 
      message: 'Security rules copied to clipboard!' 
    });
  };

  const handleCreateAdmin = async () => {
    setIsCreatingAdmin(true);
    setSetupStatus(null);

    try {
      await createAdmin(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
      setAdminCreated(true);
      setSetupStatus({
        type: 'success',
        message: `Admin account created successfully! You can now login with: ${DEFAULT_ADMIN_EMAIL}`
      });
    } catch (error) {
      console.error('Error creating admin:', error);
      let errorMessage = `Error creating admin: ${error.message}`;
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Admin account already exists! You can now login with the admin credentials.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Authentication not enabled in Firebase. Please enable Email/Password authentication in Firebase Console → Authentication → Sign-in method.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      }
      
      setSetupStatus({
        type: error.code === 'auth/email-already-in-use' ? 'success' : 'error',
        message: errorMessage
      });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Database className="w-6 h-6 mr-2" />
          Firebase Setup Helper
        </h2>
        
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
            🚀 Quick Setup Process (2 minutes)
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-300">
            <li><strong>Set Security Rules</strong> → Copy rules below and paste in Firebase Console</li>
            <li><strong>Populate Sample Data</strong> → Click "Populate Data (Bypass Auth)" button</li>
            <li><strong>Enable Authentication</strong> → Enable Email/Password in Firebase Console</li>
            <li><strong>Test App</strong> → Go back to homepage to see working news feed</li>
          </ol>
        </div>

        <div className="space-y-4">
          {/* Security Rules Section - MOVED TO FIRST */}
          <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              🚨 STEP 1: Setup Security Rules (CRITICAL)
            </h3>
            
            {/* Quick Start Option */}
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center">
                🚀 QUICK START: Use Temporary Rules
              </h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                <strong>Recommended:</strong> Use these simple rules to populate sample data without authentication. 
                You can change to production rules later.
              </p>
              
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs overflow-x-auto mb-3">
                <pre>{JSON.stringify(temporaryRules, null, 2)}</pre>
              </div>
              
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(temporaryRules, null, 2))}
                className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center text-sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Temporary Rules
              </button>
            </div>

            {/* Production Rules Option */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                🔒 Production Rules (Use after populating data)
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
                Secure rules that require authentication for write operations:
              </p>
              
              <details className="mb-3">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Click to view production rules
                </summary>
                <div className="mt-2 bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                  <pre>{JSON.stringify(securityRules, null, 2)}</pre>
                </div>
              </details>
              
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(securityRules, null, 2))}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center text-sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Production Rules
              </button>
            </div>
            
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                <strong>CRITICAL:</strong> Go to{' '}
                <a href="https://console.firebase.google.com/project/ourvadodara-a4002/database/ourvadodara-a4002-default-rtdb/rules" 
                   target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  Firebase Console → Database Rules
                </a>, paste the rules above, and click "Publish"
              </p>
            </div>

            {/* Authentication Setup Instructions */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>ALSO REQUIRED:</strong> Enable Email/Password authentication in{' '}
                <a href="https://console.firebase.google.com/project/ourvadodara-a4002/authentication/providers" 
                   target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  Firebase Console → Authentication → Sign-in method
                </a>, then enable Email/Password provider.
              </p>
            </div>
          </div>

          {/* Admin Account Creation Section */}
          <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              👤 STEP 2: Create Admin Account
            </h3>
            <p className="text-blue-800 dark:text-blue-300 mb-4">
              Create an admin account to manage posts and access administrative features.
            </p>
            
            <div className="space-y-4">
              {!adminCreated && !user ? (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <Key className="w-4 h-4 mr-2" />
                    Default Admin Credentials
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                      <code className="text-blue-600 dark:text-blue-400">{DEFAULT_ADMIN_EMAIL}</code>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Password:</span>
                      <code className="text-blue-600 dark:text-blue-400">{DEFAULT_ADMIN_PASSWORD}</code>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCreateAdmin}
                    disabled={isCreatingAdmin}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isCreatingAdmin ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Admin...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Admin Account
                      </>
                    )}
                  </button>
                </div>
              ) : user?.role === 'admin' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      You are logged in as an administrator!
                    </span>
                  </div>
                  <p className="text-green-700 dark:text-green-300 text-sm mt-2">
                    You can now access admin features like creating posts and managing content.
                  </p>
                </div>
              ) : adminCreated ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                    <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                      Admin account created! Please login to continue.
                    </span>
                  </div>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                    Use the login button in the navigation to sign in with the admin credentials.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                    <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                      Please login first to proceed with setup.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sample Data Section */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              📊 STEP 3: Populate Sample Data
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add sample news posts to your Firebase Realtime Database to test the application.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handlePopulateSampleData(false)}
                disabled={isPopulating || !user}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isPopulating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Populating...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Populate Sample Data (Signed In)
                  </>
                )}
              </button>

              {!user && (
                <div className="space-y-2">
                  <p className="text-amber-600 dark:text-amber-400 text-sm">
                    ⚠️ Authentication not enabled yet. Set up security rules first, then:
                  </p>
                  <button
                    onClick={() => handlePopulateSampleData(true)}
                    disabled={isPopulating}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                  >
                    {isPopulating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Populating...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Populate Data (Bypass Auth)
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ⚠️ Only use bypass if security rules are already set up
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Authentication Setup */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              🔐 STEP 4: Enable Authentication (Optional)
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              After setting up security rules and populating data, enable authentication for user features.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Authentication Setup:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>Go to <a href="https://console.firebase.google.com/project/ourvadodara-a4002/authentication/providers" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">Firebase Console → Authentication → Sign-in method</a></li>
                <li>Enable "Email/Password" provider</li>
                <li>Optionally enable "Google" provider</li>
                <li>Add your domain to "Authorized domains" if needed</li>
              </ul>
            </div>
          </div>

          {/* Status Messages */}
          {setupStatus && (
            <div className={`p-4 rounded-lg flex items-center ${
              setupStatus.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}>
              {setupStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {setupStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Firebase Console Links */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
          Quick Links to Firebase Console
        </h3>
        <div className="space-y-2 text-sm">
          <a 
            href="https://console.firebase.google.com/project/ourvadodara-a4002/database/ourvadodara-a4002-default-rtdb/data"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 dark:text-blue-400 hover:underline"
          >
            → Realtime Database
          </a>
          <a 
            href="https://console.firebase.google.com/project/ourvadodara-a4002/database/ourvadodara-a4002-default-rtdb/rules"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 dark:text-blue-400 hover:underline"
          >
            → Database Rules
          </a>
          <a 
            href="https://console.firebase.google.com/project/ourvadodara-a4002/authentication/users"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 dark:text-blue-400 hover:underline"
          >
            → Authentication
          </a>
          <a 
            href="https://console.firebase.google.com/project/ourvadodara-a4002/authentication/providers"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 dark:text-blue-400 hover:underline"
          >
            → Authentication Providers
          </a>
        </div>
      </div>
    </div>
  );
};

export default FirebaseSetup;