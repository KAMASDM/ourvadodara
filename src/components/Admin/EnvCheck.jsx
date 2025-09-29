// =============================================
// src/components/Admin/EnvCheck.jsx
// Environment Variables Validation Component
// =============================================
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const EnvCheck = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_DATABASE_URL'
  ];

  const optionalEnvVars = [
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID'
  ];

  const checkEnvVar = (envVar) => {
    const value = import.meta.env[envVar];
    return {
      name: envVar,
      exists: !!value,
      value: value ? `${value.substring(0, 10)}...` : 'Not set'
    };
  };

  const requiredStatus = requiredEnvVars.map(checkEnvVar);
  const optionalStatus = optionalEnvVars.map(checkEnvVar);

  const allRequiredSet = requiredStatus.every(env => env.exists);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        {allRequiredSet ? (
          <CheckCircle className="w-6 h-6 text-green-500" />
        ) : (
          <XCircle className="w-6 h-6 text-red-500" />
        )}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Environment Configuration
        </h2>
      </div>

      {/* Required Variables */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <span className="mr-2">Required Variables</span>
          {allRequiredSet ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </h3>
        
        <div className="space-y-2">
          {requiredStatus.map((env) => (
            <div key={env.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                {env.exists ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {env.name}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {env.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Variables */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <span className="mr-2">Optional Variables</span>
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
        </h3>
        
        <div className="space-y-2">
          {optionalStatus.map((env) => (
            <div key={env.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                {env.exists ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {env.name}
                </span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {env.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Message */}
      <div className={`p-4 rounded-lg ${allRequiredSet 
        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
      }`}>
        <p className={`text-sm ${allRequiredSet 
          ? 'text-green-800 dark:text-green-200' 
          : 'text-red-800 dark:text-red-200'
        }`}>
          {allRequiredSet 
            ? '✅ All required environment variables are configured correctly!'
            : '❌ Some required environment variables are missing. Please check your .env file.'
          }
        </p>
      </div>

      {/* Instructions */}
      {!allRequiredSet && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Setup Instructions:
          </h4>
          <ol className="list-decimal list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>Copy <code>.env.example</code> to <code>.env</code></li>
            <li>Get your Firebase config from Firebase Console</li>
            <li>Fill in all the VITE_FIREBASE_* variables</li>
            <li>Restart the development server</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default EnvCheck;