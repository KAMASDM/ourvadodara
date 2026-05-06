---
name: our-vadodara-design
description: Use this skill to generate well-branded interfaces and assets for Our Vadodara, the hyper-local Vadodara news + community PWA, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Reference `colors_and_type.css` for CSS variables (indigo primary, warm ivory wash, slate neutrals; Inter + Noto Sans Devanagari/Gujarati). Copy assets from `assets/` rather than linking in-place. Reuse the UI kit under `ui_kits/mobile-app/` as a starting point for any app-style design.

If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand — follow the Tailwind tokens described in README (indigo-500/600 primary, orange-500 accent, red-500 danger, ivory-50/100 wash, warmBrown-300/500 accents, slate neutrals) and the Lucide React icon set.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (which screen? which language? mobile or desktop? which product area — feed, article, reels, roundup, breaking, profile?), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## File index

- `README.md` — voice, visual foundations, iconography, layout rules
- `colors_and_type.css` — CSS variables for color, type, radii, shadows, semantic tokens
- `assets/our-vadodara-logo.png` — brand logo (always use in ivory tile)
- `preview/*.html` — design-system preview cards
- `ui_kits/mobile-app/` — React recreation of core screens (home, article, reels, login, roundup, breaking, profile)
