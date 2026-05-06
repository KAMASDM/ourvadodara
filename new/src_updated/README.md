# Our Vadodara — src/ Modernization

This folder contains **phase 1–2** of the redesign, written to mirror your `src/` tree. Copy each file over its matching path in your project.

## Install prerequisites

```bash
npm i -D @tailwindcss/line-clamp
```

Your existing `lucide-react` and `framer-motion` deps are fine.

## Phase 1 — tokens (safe, non-breaking)

- `tailwind.config.js` → replace your existing one (merge `theme.extend` if you customized it).
- `src/index.css` → replace. Adds: warm ivory palette, `card` / `btn-primary` / `pill-*` / `chip-active` / `skeleton` / `eyebrow` utilities, font imports, reduced-motion support, iOS anti-zoom, safe-area helpers, `.content-vis` perf hint.

After phase 1 you should be able to `npm run dev` and see **no visual change**. Everything still works because all your existing classes keep working.

## Phase 2 — shell (light refactor)

- `src/components/Layout/Header.jsx` — frosted chrome, weather/location inline, bell badge, ARIA.
- `src/components/Layout/Navigation.jsx` — simpler DOM, `active:scale-95` feedback, keyboard + screen-reader labels, safe-area padding, `React.memo`.
- `src/components/Layout/ResponsiveLayout.jsx` — uses `matchMedia` instead of resize listener, lazy-loads `DesktopLayout`.
- `src/components/Shared/Logo.jsx` — clean 3-size component with soft glow.

**What got removed vs. your current code:** nothing functional. Props on `Header` are the same surface-area — pass your existing handlers.

## Phase 3 — feed surfaces

- `src/components/Feed/PremiumNewsCard.jsx` — split into `DefaultCard` / `FeaturedCard` / `CompactCard` composing shared `Media` / `AuthorRow` / `MetaRow` blocks. Custom `memo` comparator only re-renders when id/like/save/counts change. Lazy images with skeleton. Same public props as your current component.
- `src/components/Category/SwipeableCategoryFilter.jsx` — pointer-events-based drag (single code path for touch + mouse, no more touchstart hacks), keyboard arrow-nav, auto-scrolls active chip into view.
- `src/components/Story/EnhancedStorySection.jsx` — lean, memoized bubbles + "Your story" creator slot. Drop-in replacement; accepts `stories`, `userAvatar`, `onOpen`, `onCreate`.
- `src/components/Weather/WeatherWidget.jsx` — sessionStorage cache (10 min), skeleton fallback, tabular-nums temperature, `fetchImpl` prop so you can plug in OpenWeather without editing the component.

Breaking: `WeatherWidget` now takes a `fetchImpl(city) => data` prop. If you don't pass one, it renders mock data. Wire your existing fetch call into it.

## Phase 4 — coming next

- Article detail (hero, byline, 12-reaction tray, related rail)
- Login (EN/हिं/ગુ toggle, Google OAuth, guest, OTP)
- Reels (snap scroll + side actions)
- Roundup (numbered editorial digest)
- Breaking (gradient header + live cards)
- Profile (streak, saved, settings)

## Known caveats

- `src/index.css` import of Google Fonts — if your `index.html` already imports Inter, remove the `@import` at the top of index.css to avoid duplicate requests.
- If you use Tailwind v4 the `require('@tailwindcss/line-clamp')` line can be removed (built-in now).
- Logo import path assumes the file is still at `src/assets/images/our-vadodara-logo.png.png` (the filename has the double `.png`).
