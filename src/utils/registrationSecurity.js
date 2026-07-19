const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', '20minutemail.com', '33mail.com',
  'dispostable.com', 'emailondeck.com', 'fakeinbox.com', 'getairmail.com',
  'getnada.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'inboxbear.com', 'maildrop.cc', 'mailinator.com', 'mailnesia.com', 'mintemail.com',
  'moakt.com', 'mytemp.email', 'sharklasers.com', 'spamgourmet.com', 'temp-mail.org',
  'tempail.com', 'tempmail.com', 'tempmail.net', 'tempmailo.com', 'throwawaymail.com',
  'trashmail.com', 'trashmail.net', 'yopmail.com', 'yopmail.fr', 'yopmail.net'
]);

export const validateRegistrationEmail = (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  const domain = normalized.split('@')[1];
  if (!domain || !domain.includes('.')) throw new Error('Please enter a valid email address');
  if (DISPOSABLE_DOMAINS.has(domain) || /(^|[.-])(temp|trash|throwaway|disposable)([.-]?(mail|email))?([.-]|$)/i.test(domain)) {
    throw new Error('Temporary or disposable email addresses are not allowed. Please use a personal or business email.');
  }
  return normalized;
};

export const enforceRegistrationRateLimit = () => {
  const key = 'ov_registration_attempts';
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  let storedAttempts = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    storedAttempts = Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(key);
  }
  const attempts = storedAttempts.filter(time => now - Number(time) < windowMs);
  if (attempts.length >= 5) throw new Error('Too many registration attempts. Please try again later.');
  localStorage.setItem(key, JSON.stringify([...attempts, now]));
};

const requestRegistrationChallenge = async ({ email, registrationType }) => {
  enforceRegistrationRateLimit();
  if (!window.grecaptcha?.enterprise) {
    throw new Error('Security verification is still loading. Please wait a moment and try again.');
  }

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeXXPsrAAAAAJEpQ2J-1TPTTmNvE5G8U1GSWsVQ';
  const captchaToken = await new Promise((resolve, reject) => {
    window.grecaptcha.enterprise.ready(() => {
      window.grecaptcha.enterprise.execute(siteKey, { action: 'REGISTER' }).then(resolve).catch(reject);
    });
  });
  const { functions, httpsCallable } = await import('../firebase-config');
  const result = await httpsCallable(functions, 'verifyRegistrationChallenge')({ token: captchaToken, email, registrationType });
  if (!result.data?.valid) throw new Error('Security verification failed. Please try again.');
};

export const runRegistrationSecurityCheck = async email => {
  const safeEmail = validateRegistrationEmail(email);
  await requestRegistrationChallenge({ email: safeEmail, registrationType: 'email' });
  return safeEmail;
};

export const runAnonymousRegistrationSecurityCheck = () => requestRegistrationChallenge({ registrationType: 'anonymous' });
