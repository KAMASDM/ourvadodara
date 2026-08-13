# Market readiness report — 13 August 2026

## Release status

**Conditional NO-GO.** The code is a verified release candidate, but production deployment is paused because the live database contains one published paid event and Firebase has no `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET`. Deploying the new server-verified checkout without those secrets would break that event.

## Launch blockers

1. Configure both Razorpay secrets, then test successful, cancelled, failed, duplicate-callback, and last-seat-concurrency payment paths.
2. Rotate the SMTP credential that was shared in chat and update `SMTP_PASSWORD` in Firebase.
3. Deploy using the staged order in `LAUNCH_RUNBOOK.md`; do not deploy the web client before the public projection backfill.

## Completed hardening

- Brand coupon analytics/export is server-generated and aggregate-only; customer identity and contact fields are not returned.
- Draft/private content, event registrations, promo codes, payment data, internal offer review data, and author account identifiers are separated from public projections.
- Event registration, ticket inventory, promo usage, payment verification, and poll voting are server-authoritative and retry-safe.
- Comments, notifications, FCM tokens, SOS records, interactions, offers, and storage uploads have ownership/role rules.
- Rich article and breaking-news HTML is sanitized before rendering.
- Mobile infinite scrolling has an observer plus bottom-distance fallback. High-traffic home/reel/story listeners are bounded; old direct article/reel links still load individually.
- Push messaging uses a dedicated service-worker scope, topic authorization is server-side, and notification publication no longer scans every user token.
- The mobile header install control remains available; the competing mobile bottom install card is disabled.
- reCAPTCHA Enterprise is loaded only on registration flows instead of blocking every page.
- Removed public setup/privilege-helper routes and embedded default login credentials.
- Added robots/sitemap metadata, valid PWA metadata, transport/security headers, and non-cacheable service-worker controls.

## Verification evidence

- Production projection dry run: 370 posts, 3 stories, 285 reels, 5 carousels, 1 event, and 3 offers; zero private author-field leaks.
- Route regression suite: 48/48 passed.
- Database and Storage security suite: 36/36 passed.
- Production PWA build: passed.
- Frontend lint: 0 errors (176 existing warnings).
- Functions syntax and emulator discovery: passed, including all new callables/triggers.
- Root production dependency audit: 0 critical, 1 high, 9 moderate. The remaining high advisory is in the old Firebase SDK dependency chain and requires a major SDK upgrade.
- Functions production dependency audit: 0 critical/high, 8 moderate; remediation requires a firebase-admin major upgrade.

## Residual launch risks

- The Firebase Web SDK and Admin SDK major upgrades should be scheduled immediately after launch with a dedicated regression window; they were not force-upgraded two days before release.
- Search and saved-item screens intentionally query the archive on demand. Home/reels/stories use bounded live windows to control launch traffic.
- Bulk email uses the configured SMTP provider. Confirm its hourly/daily limits against the expected opt-in subscriber count and monitor delivery failures.
- Enable Firebase App Check only after validating the production web key; premature enforcement can block legitimate clients.
- Automated tests do not replace the role-by-role device/payment smoke tests listed in the launch runbook.
