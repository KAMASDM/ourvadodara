import assert from 'node:assert/strict';
import { resolveAppRoute } from '../src/utils/appRoutes.js';

const cases = [
  ['/', 'home'],
  ['/login', 'home', { openLogin: true }],
  ['/login/', 'home', { openLogin: true, canonicalPath: '/login' }],
  ['/profile', 'profile'],
  ['/profile/', 'profile', { canonicalPath: '/profile' }],
  ['/events', 'events'],
  ['/events/', 'events', { canonicalPath: '/events' }],
  ['/events/summer-fest', 'event-detail'],
  ['/events/summer-fest/', 'event-detail', { canonicalPath: '/events/summer-fest' }],
  ['/reels', 'reels'],
  ['/reels/', 'reels', { canonicalPath: '/reels' }],
  ['/reels/reel-123', 'reels'],
  ['/reel/reel-123', 'reels'],
  ['/breaking', 'breaking'],
  ['/breaking/story-123/', 'breaking-detail', { canonicalPath: '/breaking/story-123' }],
  ['/search/', 'search', { canonicalPath: '/search' }],
  ['/explore/', 'explore', { canonicalPath: '/explore' }],
  ['/explore/events/', 'explore', { canonicalPath: '/explore/events' }],
  ['/category/local/', 'category', { canonicalPath: '/category/local' }],
  ['/offers/', 'offers', { canonicalPath: '/offers' }],
  ['/coupons/', 'offers', { canonicalPath: '/coupons' }],
  ['/saved/', 'saved', { canonicalPath: '/saved' }],
  ['/settings/', 'settings', { canonicalPath: '/settings' }],
  ['/notifications/', 'notifications', { canonicalPath: '/notifications' }],
  ['/notifications-settings/', 'notifications-settings', { canonicalPath: '/notifications-settings' }],
  ['/activity/', 'activity', { canonicalPath: '/activity' }],
  ['/advertise/', 'advertise', { canonicalPath: '/advertise' }],
  ['/enquiry/', 'advertise', { canonicalPath: '/enquiry' }],
  ['/brand-solutions/', 'advertise', { canonicalPath: '/brand-solutions' }],
  ['/marketing/', 'marketing', { canonicalPath: '/marketing' }],
  ['/admin/users/', 'admin', { canonicalPath: '/admin/users' }],
  ['/contact/', 'legal', { canonicalPath: '/contact' }],
  ['/terms/', 'legal', { canonicalPath: '/terms' }],
  ['/privacy/', 'legal', { canonicalPath: '/privacy' }],
  ['/polls/', 'explore', { canonicalPath: '/polls' }],
  ['/firebase-setup/', 'home'],
  ['/admin-upgrade/', 'home'],
  ['/my-local-brand', 'brand-portal'],
  ['/my-local-brand/', 'brand-portal', { canonicalPath: '/my-local-brand' }],
  ['/unknown/nested/path', 'home']
];

for (const [path, expectedType, expected = {}] of cases) {
  const result = resolveAppRoute(path);
  assert.equal(result.type, expectedType, `${path} should resolve to ${expectedType}`);
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(result[key], value, `${path} should set ${key}`);
  }
}

for (const reservedPath of ['/home', '/signin', '/signup', '/polls', '/trending', '/headlines']) {
  assert.notEqual(
    resolveAppRoute(reservedPath).type,
    'brand-portal',
    `${reservedPath} must never resolve as a brand portal`
  );
}

assert.equal(resolveAppRoute('/anything', '?setup=firebase').type, 'brand-portal');
assert.equal(resolveAppRoute('/anything', '?admin=upgrade').type, 'brand-portal');

console.log(`Route refresh checks passed (${cases.length + 8} route cases).`);
