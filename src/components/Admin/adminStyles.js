// =============================================
// src/components/Admin/adminStyles.js
// Consistent Admin UI Styling
// =============================================

export const adminStyles = {
  // Card/Container styles
  card: "bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm",
  cardCompact: "bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm",
  
  // Button styles
  primaryButton: "px-6 py-3 bg-primary-red text-white rounded-lg hover:bg-secondary-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
  secondaryButton: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
  outlineButton: "px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors",
  dangerButton: "px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
  successButton: "px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
  
  // Small button variants
  primaryButtonSm: "px-4 py-2 bg-primary-red text-white rounded-lg hover:bg-secondary-red disabled:opacity-50 transition-colors text-sm",
  secondaryButtonSm: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm",
  outlineButtonSm: "px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm",
  
  // Input fields
  input: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white",
  textarea: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white resize-none",
  select: "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-red focus:border-transparent dark:bg-gray-700 dark:text-white",
  
  // Labels
  label: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",
  labelRequired: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 after:content-['*'] after:ml-0.5 after:text-red-500",
  
  // Badges/Tags
  badge: "inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm",
  badgeSuccess: "inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm",
  badgeWarning: "inline-flex items-center px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm",
  badgeDanger: "inline-flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm",
  
  // Table styles
  table: "min-w-full divide-y divide-gray-200 dark:divide-gray-700",
  tableHeader: "px-6 py-3 bg-gray-50 dark:bg-gray-900 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
  tableCell: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100",
  
  // Status colors
  statusPending: "text-yellow-600 dark:text-yellow-400",
  statusApproved: "text-green-600 dark:text-green-400",
  statusRejected: "text-red-600 dark:text-red-400",
  statusActive: "text-green-600 dark:text-green-400",
  statusInactive: "text-gray-600 dark:text-gray-400",
  
  // Utility
  divider: "border-t border-gray-200 dark:border-gray-700 my-6",
  heading: "text-2xl font-bold text-gray-900 dark:text-white",
  subheading: "text-lg font-semibold text-gray-900 dark:text-white",
  text: "text-gray-700 dark:text-gray-300",
  textMuted: "text-gray-600 dark:text-gray-400",
  textSmall: "text-sm text-gray-600 dark:text-gray-400",
};
