// =============================================
// src/components/Common/ShareSheet.jsx
// Native-style Share Sheet with Social Options
// =============================================
import React, { useState, useEffect } from 'react';
import {
  X,
  Link2,
  Facebook,
  Twitter,
  MessageCircle,
  Mail,
  Copy,
  Check
} from 'lucide-react';

const ShareSheet = ({ isOpen, onClose, shareData }) => {
  const [copied, setCopied] = useState(false);
  const { title, text, url } = shareData || {};

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        onClose();
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  const shareOptions = [
    {
      id: 'copy',
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      color: copied ? 'text-green-600' : 'text-gray-700 dark:text-gray-300',
      bgColor: copied ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800',
      onClick: handleCopyLink
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      onClick: () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
        window.open(whatsappUrl, '_blank');
        onClose();
      }
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      onClick: () => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(fbUrl, '_blank', 'width=600,height=400');
        onClose();
      }
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'text-sky-500',
      bgColor: 'bg-sky-100 dark:bg-sky-900/30',
      onClick: () => {
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
        window.open(tweetUrl, '_blank', 'width=600,height=400');
        onClose();
      }
    },
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      onClick: () => {
        const mailto = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
        window.location.href = mailto;
        onClose();
      }
    }
  ];

  // Add native share button if available
  if (navigator.share) {
    shareOptions.push({
      id: 'more',
      name: 'More',
      icon: Link2,
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      onClick: handleNativeShare
    });
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        style={{
          animation: isOpen ? 'fadeIn 0.2s ease-out' : 'fadeOut 0.2s ease-out'
        }}
      />

      {/* Share Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-w-2xl mx-auto transition-transform"
        style={{
          animation: isOpen ? 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'slideDown 0.3s ease-out'
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Share URL Preview */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
              {title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {url}
            </p>
          </div>

          {/* Share Options Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {shareOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className={`w-14 h-14 rounded-full ${option.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <Icon className={`w-6 h-6 ${option.color}`} />
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-300 text-center">
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Safe area for mobile */}
        <div className="h-6 sm:h-4" />
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(100%);
          }
        }
      `}</style>
    </>
  );
};

export default ShareSheet;
