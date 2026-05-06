# Our Vadodara — Mobile UI kit

A click-through recreation of the Our Vadodara PWA in a phone frame.

## Screens
- **Home** — stories rail, category chips, breaking banner, pinned weather, featured + feed
- **Roundup** — warm-ivory editorial daily digest (numbered stories)
- **Reels** — vertical video feed with side actions
- **Breaking** — live banner with gradient header
- **Profile** — avatar, streak stats, settings list
- **Login** — English / हिंदी / ગુજરાતી language toggle, Google OAuth, guest

## Components
- `Chrome.jsx` — `StatusBar`, `Header`, `TabBar`, `BackBar`, `Icon` (Lucide-style outline)
- `NewsFeed.jsx` — `StoriesRail`, `CategoryChips`, `FocusCard` (weather), `BreakingBanner`, `FeaturedCard`, `NewsCard`
- `Screens.jsx` — `ArticleScreen`, `ReelsScreen`, `LoginScreen`, `ProfileScreen`
- `App.jsx` — router + state

## Interactions
- Tap a card → article detail with reaction tray
- Tap reels tab → full-bleed reel stack with prev/next
- Log out → login screen, tap Login → back into app
- Bookmark button toggles saved state
- Top-left App / Login toggle cycles between the two entry points

## Fidelity notes
- Indigo primary, orange accent, red danger, warm ivory wash — per `colors_and_type.css`.
- Icons are hand-rolled SVG mirroring Lucide's outline DNA (2px stroke, round caps). For production, swap to the real `lucide-react` package.
- Photography pulled from Unsplash to stand in for editorial images.
