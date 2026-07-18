const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', '20minutemail.com', 'dispostable.com',
  'fakeinbox.com', 'getnada.com', 'guerrillamail.com', 'guerrillamail.net',
  'maildrop.cc', 'mailinator.com', 'mailnesia.com', 'moakt.com', 'sharklasers.com',
  'temp-mail.org', 'tempail.com', 'tempmail.com', 'tempmail.net', 'throwawaymail.com',
  'trashmail.com', 'yopmail.com', 'yopmail.fr', 'yopmail.net'
]);

export const validateRegistrationEmail = (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  const domain = normalized.split('@')[1];
  if (!domain || !domain.includes('.')) throw new Error('Please enter a valid email address');
  if (DISPOSABLE_DOMAINS.has(domain) || /(^|\.)(temp|trash|throwaway|disposable)[-_.]?mail/.test(domain)) {
    throw new Error('Temporary or disposable email addresses are not allowed. Please use a personal or business email.');
  }
  return normalized;
};

export const enforceRegistrationRateLimit = () => {
  const key = 'ov_registration_attempts';
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const attempts = JSON.parse(localStorage.getItem(key) || '[]').filter(time => now - time < windowMs);
  if (attempts.length >= 5) throw new Error('Too many registration attempts. Please try again later.');
  localStorage.setItem(key, JSON.stringify([...attempts, now]));
};
