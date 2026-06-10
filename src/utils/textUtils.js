export const stripHtmlTags = (value = '') => {
  if (!value) return '';
  const stringValue = String(value);

  if (typeof document !== 'undefined') {
    const element = document.createElement('div');
    element.innerHTML = stringValue;
    return (element.textContent || element.innerText || '').replace(/\s+/g, ' ').trim();
  }

  return stringValue
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

export const getLocalizedText = (value, language = 'en') => {
  if (!value) return '';
  if (typeof value === 'string') return stripHtmlTags(value);
  if (typeof value === 'object') {
    return stripHtmlTags(value[language] || value.en || value.gu || value.hi || Object.values(value)[0] || '');
  }
  return stripHtmlTags(value);
};
