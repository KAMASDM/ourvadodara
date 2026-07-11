// =============================================
// src/utils/authVerification.js
// Mandatory email verification policy for signups
// =============================================

// Only accounts created after this moment must verify their email.
// Accounts that existed before the policy shipped (admin, early users)
// are grandfathered in so they are never locked out.
export const EMAIL_VERIFICATION_ENFORCED_FROM = Date.parse('2026-07-11T00:00:00Z');

export const requiresEmailVerification = (firebaseUser) => {
  if (!firebaseUser || firebaseUser.isAnonymous || firebaseUser.emailVerified) {
    return false;
  }

  const isPasswordAccount = firebaseUser.providerData?.some(
    (provider) => provider.providerId === 'password'
  );
  if (!isPasswordAccount) return false;

  const createdAt = Date.parse(firebaseUser.metadata?.creationTime || '');
  // Unknown creation time → allow, to avoid accidental lockouts.
  return Number.isFinite(createdAt) && createdAt >= EMAIL_VERIFICATION_ENFORCED_FROM;
};
