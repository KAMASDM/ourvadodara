const crypto = require('crypto');

const BUILT_IN_DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', '20minutemail.com', '33mail.com',
  'dispostable.com', 'emailondeck.com', 'fakeinbox.com', 'getairmail.com',
  'getnada.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'inboxbear.com', 'maildrop.cc', 'mailinator.com', 'mailnesia.com', 'mintemail.com',
  'moakt.com', 'mytemp.email', 'sharklasers.com', 'spamgourmet.com', 'temp-mail.org',
  'tempail.com', 'tempmail.com', 'tempmail.net', 'tempmailo.com', 'throwawaymail.com',
  'trashmail.com', 'trashmail.net', 'yopmail.com', 'yopmail.fr', 'yopmail.net'
]);

const normalizeEmail = value => String(value || '').trim().toLowerCase();
const getEmailDomain = value => normalizeEmail(value).split('@').pop();
const domainKey = domain => Buffer.from(String(domain || '').toLowerCase()).toString('base64url');
const hashValue = value => crypto.createHash('sha256').update(String(value || 'unknown')).digest('hex').slice(0, 32);

const looksDisposable = domain => (
  BUILT_IN_DISPOSABLE_DOMAINS.has(domain) ||
  /(^|[.-])(temp|trash|throwaway|disposable)([.-]?(mail|email))?([.-]|$)/i.test(domain)
);

const isDisposableDomain = async (database, domain) => {
  if (!domain || looksDisposable(domain)) return true;
  const snapshot = await database.ref(`registrationSecurity/disposableDomains/${domainKey(domain)}`).once('value');
  return snapshot.exists() && snapshot.val()?.active !== false;
};

const consumeRateLimit = async (database, bucket, identifier, maximum) => {
  const hour = Math.floor(Date.now() / 3600000);
  const path = `registrationSecurity/rateLimits/${hour}/${bucket}/${hashValue(identifier)}`;
  let exceeded = false;
  const result = await database.ref(path).transaction(current => {
    const count = Number(current?.count || 0);
    if (count >= maximum) {
      exceeded = true;
      return;
    }
    return { count: count + 1, updatedAt: Date.now() };
  });
  return exceeded || !result.committed;
};

const writeSecurityEvent = (database, event) => database.ref('registrationSecurity/audit').push({
  ...event,
  createdAt: Date.now()
});

module.exports = {
  BUILT_IN_DISPOSABLE_DOMAINS,
  consumeRateLimit,
  domainKey,
  getEmailDomain,
  hashValue,
  isDisposableDomain,
  normalizeEmail,
  writeSecurityEvent
};
