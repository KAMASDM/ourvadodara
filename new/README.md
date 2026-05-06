# Our Vadodara — Design System

**Our Vadodara** is a hyper-local news, community, and civic-engagement PWA for the city of Vadodara (a.k.a. Baroda), Gujarat, India. It blends a Google News-style editorial feed with Instagram-style stories & reels, real-time weather, events, polls, Blood SOS alerts, and a multilingual experience (English, हिंदी, ગુજરાતી).

## Product surfaces

There is effectively **one primary product**: the `ourvadodara` mobile-first PWA (responsive — serves a desktop layout at ≥1024px but the design DNA is mobile). Key surface areas inside it:

- **Home feed** — Stories rail, category filter chips, For-You / All feed tabs, a "Focus" bottom sheet that pins Weather / Events / Polls / AI Picks / Live / Trending above the feed.
- **News detail** — long-form article view with reactions, comments, save, share.
- **Reels** — vertical TikTok-style video feed.
- **Roundup** — a daily editorial digest.
- **Breaking** — dedicated breaking-news surface (admins can post from here).
- **Profile / Auth** — email, phone OTP, Google, anonymous-guest; reading streaks & gamification.
- **Blood SOS** — emergency blood-donor banner across the app.
- **Admin dashboard** — CMS for editors (desktop-first, full-width view).

## Sources

- **Codebase** (read-only, mounted via `local_*` tools): `src/` — a Vite + React + Tailwind PWA backed by Firebase (auth, realtime DB, FCM). Key files:
  - `src/App.jsx` — routing + providers
  - `src/index.css` — tokens, utilities, glass/ivory helpers, animation keyframes
  - `src/components/Layout/{Header,Navigation,ResponsiveLayout}.jsx` — shell chrome
  - `src/components/Feed/PremiumNewsCard.jsx` — the canonical news card (5 variants)
  - `src/components/Category/SwipeableCategoryFilter.jsx` — category chips
  - `src/components/Weather/WeatherWidget.jsx` — weather card
  - `src/components/Story/EnhancedStorySection.jsx` — stories rail
  - `src/utils/constants.js` — categories, languages, reactions
  - `src/data/newsData.js` — sample news content
- **Logo**: `src/assets/images/our-vadodara-logo.png.png` — copied to `assets/our-vadodara-logo.png`.
- No Figma link was provided.

---

## Content fundamentals

**Voice**: neighbourly, clear, and quietly optimistic about Vadodara. It's a local paper wearing the jacket of a consumer app — not bloggy, not corporate. Headlines are informative ("Vadodara Smart City Project Reaches New Milestone"), not punny. Microcopy is friendly and direct ("Pin a section above the news feed.", "Complete your profile").

**Tone & casing**:
- Headlines use **Title Case** ("Major Traffic Changes on RC Dutt Road").
- Section titles use Title Case ("Top Stories", "Latest News", "For You").
- Labels + eyebrows are **UPPERCASE with wide tracking** ("CITY", "LIVE", "TRENDING", category pills).
- Buttons are sentence-case ("Complete your profile", "Done", "Clear focus").
- Badges are ultra-compact uppercase ("LIVE", "9+").

**Person**: second-person imperative for prompts ("Pin a section…", "Complete your profile"). First-person plural only in brand-voice touchpoints ("Our Vadodara Team").

**Multilingual**: every user-facing string ships in English, Hindi (Devanagari), and Gujarati. Content titles are stored as `{en, hi, gu}` objects. Hindi/Gujarati use the same type family (Noto Sans covers Devanagari + Gujarati).

**Emoji**: used sparingly and with purpose. Category chips each have a single leading emoji (🏛️ Politics, ⚽ Sports, 🎬 Entertainment, 🏠 Local, 🌤️ Weather, 🇮🇳 India, 🌍 World, 🚀 Space, 🏥 Health). Reactions are emoji-driven (👍 ❤️ 😂 😮 😢 😡 🔥 🎉 👏 🤔 🙏 😍). Avoid emoji in headlines, body, or buttons.

**Examples**:
- Category eyebrow above a card: `LOCAL` (purple pill) → headline: `Vadodara Smart City Project Reaches New Milestone`.
- Empty-focus hint: `Pin a section above the news feed.`
- Auth success: `✅ Successfully signed in!` (emoji used as a status glyph in a transient toast — acceptable).

---

## Visual foundations

### Palette — a dual personality
The app deliberately runs **two overlapping palettes**:
1. **Indigo "Primary"** (`#6366f1` / `#4f46e5`) — the functional app color: active nav, primary buttons, focus rings, links. With an orange **Accent** (`#f97316`) for breaking/location/attention moments and a red **Danger** (`#ef4444`).
2. **Warm ivory & brown** — a warmer Indian editorial feel. `ivory-50 → ivory-200` (`#fffef9 → #fff9e6`) for page/card washes; `warmBrown-300 → warmBrown-700` (`#d4c189 → #73624b → #a8926f`) for logo accents, borders, body copy in editorial contexts. The brand logo and long-form article surfaces lean heavily into this warmth.

Neutrals are **slate** (`#0f172a → #f8fafc`). Dark mode flips the ivory wash to slate-900/950 and keeps indigo as the accent.

### Typography
- **Display/body**: **Inter** (loaded from Google Fonts CDN). Sans-only — no serif display.
- **Hindi/Gujarati**: **Noto Sans Devanagari** / **Noto Sans Gujarati**.
- **Mono**: system monospace stack (for admin/code views only).
- Scale favors tight, dense editorial type: `text-xs (12) → text-sm (14) → text-base (16) → text-lg (18) → text-xl (20) → text-2xl (24) → text-3xl (30)`. Mobile headlines cap around 20–24px. `line-clamp-2/3` is used everywhere to keep cards uniform.
- Tracking: `tracking-wide` on eyebrows; `tracking-tight` on large titles.
- Weights: 400 body, 500 medium, 600 semibold, 700 bold. `font-bold` for headlines, `font-semibold` for buttons/titles.

### Spacing & layout
- 4pt grid. Cards pad at 16 or 20px (`p-4 / p-5`). Sections gap at 12 / 16 / 24px.
- Content column on mobile is **`max-w-md` (448px)** — everything scrolls in a phone-width column even on desktop narrow layouts. Desktop layout ≥1024px switches to a full app shell.
- Safe areas: fixed top header (`h-14`) + fixed bottom tab bar (`h-16`), with `pb-24` on scrolling pages.
- News-card aspect: `16/9` media; `aspect-[16/9]` for featured, full-bleed for hero.

### Radii
- Small controls: `rounded-full` (pills, chips, icon buttons).
- Cards: `rounded-2xl` (16px) or `rounded-3xl` (24px, for bottom sheets).
- Inputs: `rounded-xl` (12px).
- Logo tile: `rounded-xl` (12px) with a 2px warmBrown border.

### Shadows & elevation
Two shadow systems coexist:
- **Slate/card shadows** (default): `shadow-sm`, `shadow-md`, `shadow-lg` — Tailwind defaults. Used in the functional UI.
- **Ivory shadows** — custom warm-toned shadows (`rgba(162,146,111,…)`) used on the logo and ivory cards:
  - `shadow-ivory`: `0 4px 6px -1px rgba(162,146,111,.1)`
  - `shadow-ivory-lg`: `0 10px 15px -3px rgba(162,146,111,.15)`
  - `shadow-ivory-xl`: `0 20px 25px -5px rgba(162,146,111,.2)`

### Borders
Hairline `border-neutral-200 dark:border-neutral-800` is the workhorse. WarmBrown borders (`border-warmBrown-200/300`) appear on editorial cards. Breaking/trending moments use a 2-stop gradient border instead of a solid one.

### Backgrounds
- Primary page bg: `bg-neutral-50` light / `bg-neutral-950` dark.
- Chrome (header, nav): `bg-white/95 backdrop-blur-md` — **frosted glass** over content.
- Editorial cards: ivory gradient wash (`from-ivory-50 via-ivory-100 to-ivory-200`).
- Stories/reels: full-bleed imagery with a `bg-gradient-to-t from-black/90 via-black/50 to-transparent` overlay so white text lands cleanly.
- Patterns: a subtle ivory dot pattern (`radial-gradient(circle, #f5e0b3 1px, transparent 1px)` at 20px) for decorative backgrounds.
- **No illustrations, no hand-drawn art.** Imagery is photography (warm, natural light, Vadodara-centric — temples, streets, markets, people).

### Transparency & blur
Used deliberately and only on floating chrome:
- Top header + bottom nav: `bg-white/95 backdrop-blur-md` (frosted).
- Glass card: `rgba(255,255,255,0.7) + backdrop-blur(10px) saturate(180%)`.
- Story ring: gradient → `from-purple-500 via-pink-500 to-red-500` (unseen states use solid gray).

### Animation
- Easing: **`cubic-bezier(0.4, 0, 0.2, 1)`** (material "standard") is the default. Bounce-in uses **`cubic-bezier(0.34, 1.56, 0.64, 1)`** (out-back) for reaction pickers and streak badges.
- Durations: 150ms for color/tap feedback, 200–300ms for transitions, 600ms–1s for celebratory moments (heart burst, confetti).
- Named animations baked into `index.css`: `fadeInUp` (0.25–0.6s), `scale-fade`, `slide-in-right`, `slide-in-bottom`, `scale-up`, `heartBurst`, `flame-flicker` (streak), `confetti-burst`, `ping-once`, `bounce-slow`, `story-progress` (linear, 15s default).
- **Hover**: lift + glow on ivory (`translateY(-2px)` + soft brown glow), color darken on primary, `scale-105` on chips.
- **Press/active**: `active:scale-95` on action buttons, `active:opacity-70` for touch feedback.

### Card anatomy
A standard news card is:
1. 16:9 media at top (optionally a multi-image Instagram-carousel indicator or a play-button overlay for video).
2. Purple category pill + optional orange trending pill + optional red LIVE pill (top-left over image for featured; in-content for default).
3. Author avatar (or initial) + name + verified tick + timestamp.
4. **Headline** (2-line clamp, font-bold).
5. **Excerpt** (2–3 line clamp, gray-600).
6. Meta row: location (MapPin + city), read time (Calendar + "N min read").
7. Stats + actions row: views / comments / shares + emoji-reaction picker + Share + Bookmark. Divider above.

### Layout rules
- Fixed: top header (`z-50`), bottom nav (`z-50`), toast region (`z-60`), bottom-sheet backdrop (`z-60`), modals (`z-70+`).
- Mobile content is `max-w-2xl mx-auto` (narrow column even on tablets).
- Admin / Firebase setup / QR scanner are the only **full-width** views.
- Protection gradients used at scroll edges of horizontal rails (category chips, stories).

### Breaking/urgent treatment
- Red `#ef4444` background on the LIVE pill.
- Orange → red linear gradient on TRENDING pills.
- `animate-pulse` on the SOS indicator and unread dots.
- Blood SOS banner sits above content on mobile only.

---

## Iconography

- **Primary icon set: Lucide React** (`lucide-react` npm). Outline, 1.5–2.5 px stroke, 16/18/20px. Stroke-width bumps to 2.5 when active. The app imports specific icons ad-hoc (Home, Newspaper, User, Bell, Globe, MapPin, Clock, Eye, MessageCircle, Share2, Bookmark, TrendingUp, AlertCircle, ChevronDown, Sparkles, Radio, Cloud, Sun, CloudRain, etc.).
- **Brand logo**: `assets/our-vadodara-logo.png` — a circular illustrated crest. Always shown inside the ivory tile (rounded-xl, warmBrown border, ivory gradient bg, soft warm glow). Never used as a flat mark.
- **Emoji as icons**: yes, but only on category chips and reaction picker (see Content Fundamentals). Never in headlines or body.
- **Custom SVG icons**: one — `src/components/Icons/GoogleIcon.jsx` (Google "G" for OAuth).
- **No custom icon font**, no sprite sheet, no duotone or filled-glyph style.
- **Flags / emoji icons for geo**: `🇮🇳` for India category.

Substitutions (if Lucide isn't available offline): use Feather Icons (same DNA) or Heroicons outline. Flag these substitutions to the user.

---

## Index

Root files:
- `README.md` — this document.
- `SKILL.md` — Agent Skill manifest.
- `colors_and_type.css` — CSS variables for colors, type, radii, shadows, semantic tokens.
- `assets/` — logos, brand imagery.
- `fonts/` — *(none shipped; Inter + Noto loaded from Google Fonts CDN. See "Font substitution" note.)*
- `preview/` — design-system preview cards (referenced from the Design System tab).
- `ui_kits/mobile-app/` — React recreation of core Our Vadodara screens (home feed, article, reels, login, roundup, breaking, profile, tabs, stories).
- `SKILL.md` — Claude Code / Agent Skill manifest.

**Font substitution note**: no `.ttf`/`.woff` files were shipped with the codebase — the app loads Inter from Google Fonts at runtime. `colors_and_type.css` imports Inter + Noto Sans Devanagari + Noto Sans Gujarati from Google Fonts for parity. If exact metrics matter, attach the original font files.
