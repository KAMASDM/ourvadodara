// =============================================
// src/utils/constants.js
// =============================================
export const CATEGORIES = [
  { id: 'all', name: { en: 'All News', hi: 'सभी समाचार', gu: 'બધા સમાચાર' }, icon: '📰' },
  { id: 'politics', name: { en: 'Politics', hi: 'राजनीति', gu: 'રાજકારણ' }, icon: '🏛️' },
  { id: 'sports', name: { en: 'Sports', hi: 'खेल', gu: 'રમતગમત' }, icon: '⚽' },
  { id: 'entertainment', name: { en: 'Entertainment', hi: 'मनोरंजन', gu: 'મનોરંજન' }, icon: '🎬' },
  { id: 'business', name: { en: 'Business', hi: 'व्यापार', gu: 'વ્યવસાય' }, icon: '💼' },
  { id: 'technology', name: { en: 'Technology', hi: 'तकनीक', gu: 'ટેકનોલોજી' }, icon: '💻' },
  { id: 'local', name: { en: 'Local News', hi: 'स्थानीय समाचार', gu: 'સ્થાનિક સમાચાર' }, icon: '🏠' },
  { id: 'weather', name: { en: 'Weather', hi: 'मौसम', gu: 'હવામાન' }, icon: '🌤️' },
];

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};
