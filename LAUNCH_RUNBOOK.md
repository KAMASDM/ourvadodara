# Production launch runbook

## Required configuration

- Confirm `APP_URL=https://ourcitymedia.in` for Functions.
- Rotate the SMTP password and the legacy Botnex token before launch.
- Configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` before enabling paid events.
- Enable Firebase App Check enforcement after validating the web reCAPTCHA key in staging.
- Confirm Firebase budget alerts, Realtime Database usage alerts, and function error alerts.

## Compatibility-safe deployment order

1. Create a release tag and record the current Firebase rules release as the rollback point.
2. Deploy Cloud Functions first. Do not deploy the tightened rules yet.
3. Run `node functions/scripts/backfill-public-projections.js` and review the counts.
4. Run `node functions/scripts/backfill-public-projections.js --apply`.
5. Verify `publicPosts`, `publicStories`, `publicReels`, `publicCarousels`, `publicEvents`, and `publicOffers` contain only publishable records.
6. Deploy the web application and smoke-test guest, user, editor, admin, and brand journeys while the old rules remain compatible.
7. Deploy Realtime Database and Storage rules.
8. Repeat the smoke tests and run `npm run test:rules` against the checked-in rules.
9. Monitor function errors, denied database operations, email failures, payment failures, and client errors for at least 60 minutes.

## Mandatory smoke tests

- Guest: home feed, article details, search, reels, breaking news, offers, events, PWA install.
- User: login/signup, profile, bookmarks, comments/replies/likes, poll vote, notifications, free event registration.
- Payments: successful charge, cancelled checkout, failed charge, duplicate callback, last-seat concurrency, receipt email, refund/reconciliation process.
- Editor: create/edit/publish/schedule post, upload and delete owned media, city mirrors.
- Admin: all content management, moderation, users, events, QR check-in, leads, brand management, email and push tests.
- Brand: login, create/edit offer, approval status, scan/redeem coupon, analytics export, password change.

## Rollback

- Web: restore the prior Netlify deploy.
- Rules: restore the previous Firebase rules release immediately if legitimate operations are denied.
- Functions: redeploy the release tag. Public projection nodes are additive and can remain during rollback.
- Never roll back payment records or registrations by replacing the database; reconcile them transactionally.
