import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '../Common/Toast';

const FirebaseSetupGuide = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState(null);
  const toast = useToast();

  const copyToClipboard = (text, stepName) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepName);
    toast.success(`${stepName} copied to clipboard!`);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const setupSteps = [
    {
      title: "Enable Phone Authentication",
      description: "Go to Firebase Console > Authentication > Sign-in method",
      action: "Enable 'Phone' provider and configure reCAPTCHA settings",
      important: true,
      details: "Add your domain to authorized domains and configure reCAPTCHA"
    },
    {
      title: "Enable Anonymous Authentication",
      description: "In the same Sign-in method tab",
      action: "Enable the 'Anonymous' provider",
      important: true
    },
    {
      title: "Enable Google Authentication", 
      description: "In the same Sign-in method tab",
      action: "Enable 'Google' provider and configure OAuth consent screen",
      important: false
    },
    {
      title: "Enable Email/Password Authentication",
      description: "In the same Sign-in method tab", 
      action: "Enable 'Email/Password' provider",
      important: false
    },
    {
      title: "Configure Authorized Domains",
      description: "Go to Authentication > Settings > Authorized domains",
      action: "Add localhost and your domain to authorized domains list",
      important: true,
      details: "Add: localhost, 127.0.0.1, and your production domain"
    },
    {
      title: "Set up Realtime Database",
      description: "Go to Firebase Console > Realtime Database",
      action: "Create database and set up security rules",
      important: true
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Firebase Setup Required
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <p className="text-orange-800 dark:text-orange-200 text-sm mb-2">
              <strong>🔧 Firebase Configuration Required</strong>
            </p>
            <p className="text-orange-700 dark:text-orange-300 text-sm">
              Phone authentication (and other auth methods) require proper Firebase setup. 
              The most critical step is enabling <strong>Phone Authentication</strong> and configuring <strong>authorized domains</strong>.
            </p>
          </div>

          <div className="space-y-4">
            {setupSteps.map((step, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${step.important 
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.important 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-500 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {step.title}
                      {step.important && (
                        <span className="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                          Required
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {step.description}
                    </p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                      {step.action}
                    </p>
                    {step.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        💡 {step.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Quick Access Links
            </h4>
            <div className="space-y-2">
              <button
                onClick={() => copyToClipboard('https://console.firebase.google.com/project/ourvadodara-a4002/authentication/providers', 'Firebase Console URL')}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Firebase Console - Authentication
                {copiedStep === 'Firebase Console URL' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              I'll Set This Up Later
            </button>
            <button
              onClick={() => {
                window.open('https://console.firebase.google.com/project/ourvadodara-a4002/authentication/providers', '_blank');
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Firebase Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseSetupGuide;