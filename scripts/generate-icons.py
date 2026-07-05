#!/usr/bin/env python3
"""
Generate all PWA/Apple icons, favicons, and splash screens from the brand logo.

The logo is a wide wordmark with transparency, so each square icon centers it
on an opaque white canvas (transparency must be filled or iOS renders it black)
with margin, which also keeps it inside the Android maskable safe zone.

Re-run after changing the logo:  python3 scripts/generate-icons.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, "src/assets/images/our-vadodara-logo.png.png")
PUBLIC = os.path.join(ROOT, "public")
ICONS_DIR = os.path.join(PUBLIC, "icons")
BG = (255, 255, 255)  # matches manifest background_color

# Square app-icon sizes (PWA + Apple touch)
ICON_SIZES = [57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 180, 192, 384, 512]
# Apple splash screens: (width, height)
SPLASH = [
    (1125, 2436), (1242, 2208), (1536, 2048),
    (1668, 2224), (2048, 2732), (750, 1334), (828, 1792),
]


def load_logo():
    logo = Image.open(LOGO).convert("RGBA")
    return logo


def fit_logo(logo, target_w, target_h):
    """Scale the logo to fit within target box, preserving aspect ratio."""
    lw, lh = logo.size
    scale = min(target_w / lw, target_h / lh)
    new = (max(1, round(lw * scale)), max(1, round(lh * scale)))
    return logo.resize(new, Image.LANCZOS)


def make_square(logo, size, margin=0.18):
    """Center the logo on an opaque white square with margin (maskable-safe)."""
    canvas = Image.new("RGB", (size, size), BG)
    inner_w = round(size * (1 - margin))
    inner_h = round(size * (1 - margin))
    scaled = fit_logo(logo, inner_w, inner_h)
    x = (size - scaled.width) // 2
    y = (size - scaled.height) // 2
    canvas.paste(scaled, (x, y), scaled)  # alpha as mask
    return canvas


def make_splash(logo, w, h):
    """White splash with the logo centered, sized to ~55% of the width."""
    canvas = Image.new("RGB", (w, h), BG)
    target_w = round(w * 0.55)
    target_h = round(h * 0.25)
    scaled = fit_logo(logo, target_w, target_h)
    canvas.paste(scaled, ((w - scaled.width) // 2, (h - scaled.height) // 2), scaled)
    return canvas


def main():
    logo = load_logo()
    os.makedirs(ICONS_DIR, exist_ok=True)

    # Square icons
    for size in ICON_SIZES:
        img = make_square(logo, size)
        img.save(os.path.join(ICONS_DIR, f"icon-{size}x{size}.png"), "PNG")
        print(f"icon-{size}x{size}.png")

    # Maskable variants: extra padding so Android's circular/squircle crop
    # never clips the wide wordmark (content stays inside the safe zone).
    for size in (192, 512):
        img = make_square(logo, size, margin=0.42)
        img.save(os.path.join(ICONS_DIR, f"icon-{size}x{size}-maskable.png"), "PNG")
        print(f"icon-{size}x{size}-maskable.png")

    # public/logo.png (used by manifest/legacy refs) — clean 512 square
    make_square(logo, 512).save(os.path.join(PUBLIC, "logo.png"), "PNG")
    print("logo.png")

    # Favicons — tiny, so use less margin so the mark fills more of the frame
    fav = make_square(logo, 256, margin=0.08)
    fav.save(os.path.join(PUBLIC, "favicon.png"), "PNG")
    fav.save(
        os.path.join(PUBLIC, "favicon.ico"),
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print("favicon.png, favicon.ico")

    # Splash screens
    for w, h in SPLASH:
        img = make_splash(logo, w, h)
        img.save(os.path.join(PUBLIC, f"apple-splash-{w}x{h}.png"), "PNG")
        print(f"apple-splash-{w}x{h}.png")

    print("Done.")


if __name__ == "__main__":
    main()
