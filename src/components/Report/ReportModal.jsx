// =============================================
// src/components/Report/ReportModal.jsx
// =============================================
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Flag, AlertTriangle } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, contentId, contentType = 'post' }) => {
  const { t } = useTranslation();
  const [reportReason, setReportReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { id: 'spam', label: t('report.spam'), icon: '🚫' },
    { id: 'harassment', label: t('report.harassment'), icon: '😠' },
    { id: 'hate_speech', label: t('report.hate_speech'), icon: '💢' },
    { id: 'misinformation', label: t('report.misinformation'), icon: '❌' },
    { id: 'violence', label: t('report.violence'), icon: '⚠️' },
    { id: 'inappropriate', label: t('report.inappropriate'), icon: '🔞' },
    { id: 'copyright', label: t('report.copyright'), icon: '©️' },
    { id: 'other', label: t('report.other'), icon: '📝' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason) return;

    setIsSubmitting(true);
    
    try {
      // Here you would normally send the report to your backend
      console.log('Report submitted:', {
        contentId,
        contentType,
        reason: reportReason,
        description
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert(t('report.success_message'));
      onClose();
      setReportReason('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert(t('report.error_message'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Flag className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('report.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('report.description')}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('report.reason_label')}
            </label>
            <div className="space-y-2">
              {reportReasons.map((reason) => (
                <label
                  key={reason.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    reportReason === reason.id
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason.id}
                    checked={reportReason === reason.id}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-lg mr-3">{reason.icon}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {reason.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('report.additional_details')} ({t('common.optional')})
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder={t('report.details_placeholder')}
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {description.length}/500
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium mb-1">{t('report.important_note')}</p>
                <p>{t('report.false_reports_warning')}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!reportReason || isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('report.submitting')}</span>
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4" />
                  <span>{t('report.submit')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;