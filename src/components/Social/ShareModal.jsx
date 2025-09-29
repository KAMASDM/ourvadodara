// =============================================
// src/components/Social/ShareModal.jsx
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Copy, 
  Mail, 
  MessageCircle, 
  Share2,
  Check
} from 'lucide-react';

const ShareModal = ({ isOpen, onClose, post }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !post) return null;

  const shareUrl = `${window.location.origin}/post/${post.id}`;
  const shareTitle = post.title?.en || 'Check out this article';
  const shareText = post.content?.en?.substring(0, 100) + '...' || '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        onClose();
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const shareOptions = [
    {
      name: 'Native Share',
      icon: Share2,
      color: 'bg-blue-500',
      action: handleNativeShare,
      available: navigator.share
    },
    {
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      color: copied ? 'bg-green-500' : 'bg-gray-500',
      action: handleCopyLink,
      available: true
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500',
      action: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${shareUrl}`)}`);
      },
      available: true
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-red-500',
      action: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
      },
      available: true
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-t-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Share Article
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {shareOptions.filter(option => option.available).map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.name}
                  onClick={option.action}
                  className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className={`p-3 rounded-full ${option.color} text-white`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-gray-700 dark:text-gray-300 text-center">
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
