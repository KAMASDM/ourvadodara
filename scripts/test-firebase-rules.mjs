import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { equalTo, get, limitToLast, orderByChild, query, ref, set, update } from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';

const projectId = 'ourvadodara-a4002';
const [databaseRules, storageRules] = await Promise.all([
  readFile(new URL('../database.rules.json', import.meta.url), 'utf8'),
  readFile(new URL('../storage.rules', import.meta.url), 'utf8')
]);
const environment = await initializeTestEnvironment({
  projectId,
  database: { rules: databaseRules },
  storage: { rules: storageRules }
});

try {
  await environment.withSecurityRulesDisabled(async context => {
    const database = context.database();
    await set(ref(database), {
      users: {
        admin: { role: 'admin', status: 'active' },
        alice: { role: 'user', status: 'active' },
        bob: { role: 'user', status: 'active' },
        brandUser: { role: 'brand', status: 'active', brandId: 'brand1' }
      },
      events: { event1: { status: 'published', registrations: { reg1: { userEmail: 'private@example.com' } } } },
      publicEvents: { event1: { id: 'event1', status: 'published', title: 'Public event' } },
      posts: { post1: { status: 'published', commentsEnabled: true } },
      publicPosts: { post1: { id: 'post1', status: 'published', title: 'Public post', timestamp: 1 } },
      comments: { post1: { comment1: { authorId: 'alice', text: 'Owned by Alice', likes: 0 } } },
      polls: { poll1: { isPublished: true, settings: { isActive: true }, options: [{ id: 'yes', votes: 0 }] } },
      offers: { offer1: { brandId: 'brand1', status: 'draft', reviewNote: 'private' } },
      publicOffers: { offer2: { brandId: 'brand1', status: 'published', title: 'Public offer' } }
    });
  });

  const guestDb = environment.unauthenticatedContext().database();
  const aliceDb = environment.authenticatedContext('alice').database();
  const bobDb = environment.authenticatedContext('bob').database();
  const adminDb = environment.authenticatedContext('admin').database();
  const brandDb = environment.authenticatedContext('brandUser').database();

  await assertSucceeds(get(ref(guestDb, 'publicEvents/event1')));
  await assertSucceeds(get(ref(guestDb, 'publicPosts/post1')));
  await assertSucceeds(get(query(ref(guestDb, 'publicPosts'), orderByChild('timestamp'), limitToLast(120))));
  await assertFails(get(ref(guestDb, 'posts/post1')));
  await assertFails(set(ref(guestDb, 'posts/post1/analytics/views'), 999));
  await assertSucceeds(set(ref(aliceDb, 'posts/post1/analytics/likes'), 1));
  await assertFails(set(ref(guestDb, 'views/post1/forged'), true));
  await assertFails(get(ref(guestDb, 'events/event1')));
  await assertFails(get(ref(aliceDb, 'events/event1')));
  await assertSucceeds(get(ref(adminDb, 'events/event1')));
  await assertFails(set(ref(aliceDb, 'events/event1/status'), 'cancelled'));
  await assertSucceeds(update(ref(adminDb, 'events/event1'), { status: 'cancelled' }));

  await assertSucceeds(set(ref(aliceDb, 'comments/post1/newComment'), {
    authorId: 'alice', text: 'A new comment', createdAt: Date.now(), likes: 0
  }));
  await assertFails(set(ref(bobDb, 'comments/post1/comment1'), null));
  await assertSucceeds(set(ref(bobDb, 'comments/post1/comment1/likedBy/bob'), true));
  await assertFails(set(ref(bobDb, 'comments/post1/comment1/text'), 'tampered'));

  await assertFails(set(ref(aliceDb, 'notifications/bob/fake'), { title: 'phishing' }));
  await assertSucceeds(set(ref(aliceDb, 'notifications/alice/readState'), { isRead: true }));
  await assertFails(set(ref(aliceDb, 'fcmTokens/alice'), { token: 'forged', topics: ['admin-leads'] }));
  await assertFails(set(ref(aliceDb, 'polls/poll1/options/0/votes'), 999));
  await assertSucceeds(set(ref(adminDb, 'polls/poll1/settings/isActive'), false));
  await assertFails(set(ref(aliceDb, 'pollVotes/poll1/alice'), { optionId: 'yes' }));
  await assertFails(get(ref(guestDb, 'offers')));
  await assertSucceeds(get(ref(guestDb, 'publicOffers')));
  await assertFails(get(ref(brandDb, 'offers')));
  await assertSucceeds(get(query(ref(brandDb, 'offers'), orderByChild('brandId'), equalTo('brand1'))));
  await assertSucceeds(set(ref(aliceDb, 'userInteractions/interaction1'), { userId: 'alice', postId: 'post1', type: 'view' }));
  await assertFails(set(ref(aliceDb, 'userInteractions/interaction2'), { userId: 'bob', postId: 'post1', type: 'view' }));
  await assertSucceeds(set(ref(aliceDb, 'blood-sos/vadodara/request1'), { createdBy: 'alice', status: 'active' }));
  await assertFails(update(ref(bobDb, 'blood-sos/vadodara/request1'), { status: 'fulfilled' }));

  const aliceStorage = environment.authenticatedContext('alice').storage();
  const bobStorage = environment.authenticatedContext('bob').storage();
  const image = new Uint8Array([137, 80, 78, 71]);
  const ownedMedia = storageRef(aliceStorage, 'posts/alice/images/test.png');
  await assertSucceeds(uploadBytes(ownedMedia, image, { contentType: 'image/png' }));
  await assertSucceeds(getDownloadURL(ownedMedia));
  await assertFails(uploadBytes(storageRef(bobStorage, 'posts/alice/images/replaced.png'), image, { contentType: 'image/png' }));
  await assertFails(uploadBytes(storageRef(aliceStorage, 'posts/alice/files/script.html'), image, { contentType: 'text/html' }));
  await assertSucceeds(uploadBytes(storageRef(aliceStorage, 'avatars/alice/avatar.png'), image, { contentType: 'image/png' }));
  await assertFails(uploadBytes(storageRef(bobStorage, 'avatars/alice/avatar2.png'), image, { contentType: 'image/png' }));

  assert.ok(true);
  console.log('Firebase security rule checks passed (36 assertions).');
} finally {
  await environment.cleanup();
}
