// =============================================
// src/pages/Roundup/RoundupPage.jsx
// News Roundup Page - Dedicated page for daily news roundup
// =============================================
import React from 'react';
import TodaysRoundup from '../../components/Feed/TodaysRoundup';

const RoundupPage = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TodaysRoundup onClose={onBack} />
    </div>
  );
};

export default RoundupPage;
