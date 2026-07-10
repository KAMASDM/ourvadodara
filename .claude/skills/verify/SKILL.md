---
name: verify
description: Build, launch, and drive the Our Vadodara PWA to verify changes end-to-end.
---

# Verifying Our Vadodara changes

## Build
```bash
npm run build        # vite build, ~2s; also regenerates the PWA service worker
```

## Launch
```bash
npx vite --port 5199 > /tmp/vite-5199.log 2>&1 &   # dev server, ready in ~4s
```

## Drive (headless Chrome via playwright-core)
- `playwright-core` is already in node_modules; launch with
  `executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`.
- Scripts MUST live in the project root (module resolution); name them `*.tmp.mjs` and delete after.
- Mobile layout: viewport 390×844 (+ iPhone UA). Desktop layout: ≥1024px wide.
- Useful routes: `/` (home), `/breaking`, `/post/<id>`, `/reels`, `/admin`.

## Data / auth notes
- RTDB is public-read for most content nodes — inspect directly:
  `curl "$VITE_FIREBASE_DATABASE_URL/breakingNews.json"` (URL in `.env`).
- Admin writes need the admin test account (`admin@ourvadodara.com`); user shares
  the password in-session. Label test data "QA TEST DELETE ME" and clean up.
- Signup flow can be tested with a throwaway email; the freshly created user can
  delete itself in-page: `(await import('/src/firebase-config.js')).firebaseAuth.currentUser.delete()`.
- Known-benign console noise: reCAPTCHA Enterprise 401/anchor iframe on localhost.

## Gotchas
- Unverified email/password accounts get NO app session (AuthContext gate) — the
  verification modal is the expected post-signup state.
- Breaking news only displays when `isActive: true` and `expiresAt` is unset/future.
