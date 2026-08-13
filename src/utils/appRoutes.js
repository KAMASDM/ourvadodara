const FIRST_PARTY_ROOTS = new Set([
  'activity',
  'admin',
  'advertise',
  'brand-solutions',
  'breaking',
  'category',
  'contact',
  'coupons',
  'enquiry',
  'events',
  'explore',
  'firebase-setup',
  'headlines',
  'home',
  'admin-upgrade',
  'login',
  'marketing',
  'notifications',
  'notifications-settings',
  'offers',
  'polls',
  'post',
  'privacy',
  'profile',
  'register',
  'reel',
  'reels',
  'roundup',
  'saved',
  'search',
  'settings',
  'sign-in',
  'signin',
  'signup',
  'terms',
  'trending'
]);

export const normalizeAppPath = rawPath => {
  const withLeadingSlash = String(rawPath || '/').startsWith('/')
    ? String(rawPath || '/')
    : `/${rawPath}`;
  const withoutDuplicateSlashes = withLeadingSlash.replace(/\/{2,}/g, '/');
  if (withoutDuplicateSlashes === '/') return '/';
  return withoutDuplicateSlashes.replace(/\/+$/, '') || '/';
};

const route = (type, activeTab, data = null, options = {}) => ({
  type,
  activeTab,
  data,
  ...options
});

const safeDecode = value => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const resolveAppRoute = (rawPath, rawSearch = '') => {
  const path = normalizeAppPath(rawPath);
  const lowerPath = path.toLowerCase();
  const canonicalPath = path !== rawPath ? path : null;

  if (lowerPath === '/' || lowerPath === '/home') {
    return route('home', 'home', null, {
      canonicalPath: lowerPath === '/home' ? '/' : canonicalPath
    });
  }

  if (['/login', '/signin', '/sign-in', '/signup', '/register'].includes(lowerPath)) {
    return route('home', 'home', null, { canonicalPath, openLogin: true });
  }

  const postMatch = path.match(/^\/post\/([^/]+)$/i);
  if (postMatch) {
    return route('news-detail', 'home', {
      newsId: safeDecode(postMatch[1])
    }, { canonicalPath });
  }

  // Event scanners support both /events/:id/scanqr and the legacy
  // /:event-slug/scanqr format.
  const scannerMatch = path.match(/^\/events\/([^/]+)\/scanqr$/i) ||
    path.match(/^\/([^/]+)\/scanqr$/i);
  if (scannerMatch) {
    return route('qr-scanner', 'qr-scanner', {
      eventId: safeDecode(scannerMatch[1])
    }, { canonicalPath });
  }

  const eventMatch = path.match(/^\/events\/([^/]+)$/i);
  if (eventMatch) {
    return route('event-detail', 'explore', {
      eventId: safeDecode(eventMatch[1])
    }, { canonicalPath });
  }

  const reelMatch = path.match(/^\/reels?\/([^/]+)$/i);
  if (reelMatch) {
    return route('reels', 'reels', {
      reelId: safeDecode(reelMatch[1])
    }, { canonicalPath });
  }

  const breakingMatch = path.match(/^\/breaking\/([^/]+)$/i);
  if (breakingMatch) {
    return route('breaking-detail', 'breaking', {
      newsId: safeDecode(breakingMatch[1])
    }, { canonicalPath });
  }

  const exploreMatch = path.match(/^\/explore(?:\/([^/]+))?$/i);
  if (exploreMatch) {
    return route('explore', 'explore', {
      section: exploreMatch[1] ? safeDecode(exploreMatch[1]) : null
    }, { canonicalPath });
  }

  const categoryMatch = path.match(/^\/category\/([^/]+)$/i);
  if (categoryMatch) {
    return route('category', 'home', {
      category: safeDecode(categoryMatch[1])
    }, { canonicalPath });
  }

  if (/^\/admin(?:\/.*)?$/i.test(path)) return route('admin', 'admin', null, { canonicalPath });
  if (lowerPath === '/marketing') return route('marketing', 'marketing', null, { canonicalPath });
  if (['/contact', '/terms', '/privacy'].includes(lowerPath)) {
    return route('legal', 'home', { page: lowerPath.slice(1) }, { canonicalPath });
  }
  if (['/advertise', '/enquiry', '/brand-solutions'].includes(lowerPath)) {
    return route('advertise', 'advertise', null, { canonicalPath });
  }
  if (['/offers', '/coupons'].includes(lowerPath)) return route('offers', 'explore', null, { canonicalPath });
  if (lowerPath === '/search') return route('search', 'home', null, { canonicalPath });
  if (lowerPath === '/breaking') return route('breaking', 'breaking', null, { canonicalPath });
  if (lowerPath === '/reels') return route('reels', 'reels', null, { canonicalPath });
  if (lowerPath === '/events') return route('events', 'explore', null, { canonicalPath });
  if (lowerPath === '/polls') return route('explore', 'explore', { section: 'polls' }, { canonicalPath });
  if (lowerPath === '/saved') return route('saved', 'home', null, { canonicalPath });
  if (lowerPath === '/profile') return route('profile', 'profile', null, { canonicalPath });
  if (lowerPath === '/settings') return route('settings', 'home', null, { canonicalPath });
  if (lowerPath === '/notifications-settings') return route('notifications-settings', 'home', null, { canonicalPath });
  if (lowerPath === '/notifications') return route('notifications', 'home', null, { canonicalPath });
  if (lowerPath === '/activity') return route('activity', 'profile', null, { canonicalPath });
  if (['/roundup', '/trending', '/headlines'].includes(lowerPath)) {
    return route('home', 'home', null, { canonicalPath: '/' });
  }

  // Brand partner portals intentionally use /brand-name. A first-party root
  // can never be interpreted as a brand, even if a newly introduced route is
  // accidentally omitted from one of the exact match groups above.
  const brandPortalMatch = path.match(/^\/([a-z0-9][a-z0-9-]*)$/i);
  if (brandPortalMatch) {
    const slug = brandPortalMatch[1].toLowerCase();
    if (!FIRST_PARTY_ROOTS.has(slug)) {
      return route('brand-portal', 'brand-portal', { slug }, { canonicalPath });
    }
  }

  return route('home', 'home', null, { canonicalPath });
};

export { FIRST_PARTY_ROOTS };
