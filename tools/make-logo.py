#!/usr/bin/env python3
"""Derive every logo and icon asset from the school crest.

    python3 modern/tools/make-logo.py [source.jpg]

Run locally; the OUTPUT is committed. This never runs in CI — GitHub Pages
serves the repo verbatim. Same convention as the root's tools/make-images.sh.

The source is a flat JPEG of the crest on a cream ground. Two details matter:

  * The background is removed by FLOOD-FILLING FROM THE FOUR CORNERS, never by
    replacing the cream colour globally — roughly 1300 cream-ish pixels live
    inside the crest (the white ribbon lettering, the book's pages), and a
    global replace punches holes straight through them.

  * The crest is a solid filled disc, so a plain alpha silhouette would be a
    featureless blob: all of its detail is drawn inside the disc, not cut out
    of it. The dark-surface variant is therefore a LUMINANCE duotone, which
    keeps the red-on-gold artwork readable as navy-on-brass.
"""
import pathlib
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "img"
DEFAULT_SRC = ROOT / "images" / "crest" / "crest-source-fixed.png"   # text corrected by fix-crest-text.py

# Palette (mirrors the tokens in assets/css/style.css)
# Duotone ends for the dark-surface variant. The dark end is deliberately a
# shade LIGHTER than the footer's own #142038, so the engraved lines stay
# readable instead of dissolving into the background.
MONO_DARK = "#24365C"
MONO_LIGHT = "#E5D3B3"
PAGE_BG = (250, 248, 244)     # --m-bg, for the opaque iOS icon

FLOOD_THRESHOLD = 42          # measured against this source's cream ground
LOGO_HEIGHT = 320             # covers a 56px slot at ~5x DPR
PALETTE = 128                 # colours after quantisation


def cut_background(src_path):
    """Return the crest as RGBA, background cleared and trimmed to its bounds."""
    im = Image.open(src_path).convert("RGB")
    w, h = im.size

    # Paint the background a colour that cannot occur in the artwork, starting
    # from each corner, so only pixels reachable from outside are affected.
    KEY = (255, 0, 255)
    flood = im.copy()
    # Seed from the four corners AND from every background-coloured pixel along
    # the image border: the pocket between the ribbon tails touches only the
    # bottom edge, so corner seeds alone leave a cream sliver behind it.
    ref = im.getpixel((0, 0))
    near = lambda p: sum(abs(a - b) for a, b in zip(p, ref)) <= FLOOD_THRESHOLD * 3
    border = [(x, 0) for x in range(0, w, 6)] + [(x, h - 1) for x in range(0, w, 6)] \
        + [(0, y) for y in range(0, h, 6)] + [(w - 1, y) for y in range(0, h, 6)]
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)] + [pt for pt in border if near(im.getpixel(pt))]
    for seed in seeds:
        if flood.getpixel(seed) != KEY:
            ImageDraw.floodfill(flood, seed, KEY, thresh=FLOOD_THRESHOLD)

    alpha = Image.new("L", (w, h), 255)
    alpha.putdata([0 if p == KEY else 255 for p in flood.getdata()])

    # The AI drew a soft drop shadow under the ribbon: grey-brown, so too dark
    # for the flood fill. Remove any dull (low-saturation, non-white) pixels that
    # are connected to the cleared background; the crest's own colours are all
    # strongly saturated, and the white ribbon lettering is enclosed by blue.
    rgb = np.asarray(im).astype(int)
    dull = ((rgb.max(2) - rgb.min(2)) < 70) & (rgb.max(2) < 232)
    cleared = np.asarray(alpha) == 0
    cleared = ndimage.binary_propagation(cleared, mask=cleared | dull)
    alpha = Image.fromarray(np.where(cleared, 0, 255).astype(np.uint8))

    # JPEG leaves a pale fringe where the artwork meets the ground. Pull the
    # alpha in by a pixel to eat it, then feather so the edge is not stepped.
    alpha = alpha.filter(ImageFilter.MinFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))

    out = im.convert("RGBA")
    out.putalpha(alpha)
    return out.crop(out.getbbox())


def fit(im, height):
    w = max(1, round(im.width * height / im.height))
    return im.resize((w, height), Image.LANCZOS)


def duotone(im):
    """Luminance duotone: navy in the darks, brass in the lights.

    The crest's luminance is bimodal — red/blue linework near 38, the gold
    field near 172, nothing in between. A plain autocontrast leaves the field
    only two thirds of the way to the light end, which renders as mud. The
    cutoff clips both tails so the field lands on full brass and the linework
    on full navy, giving a crisp two-tone medallion."""
    gray = ImageOps.autocontrast(ImageOps.grayscale(im.convert("RGB")), cutoff=(12, 14))
    toned = ImageOps.colorize(gray, black=MONO_DARK, white=MONO_LIGHT).convert("RGBA")
    toned.putalpha(im.getchannel("A"))
    return toned


def square(im, size, pad=0.06, background=None):
    """Centre the crest on a square canvas, with `pad` of breathing room."""
    inner = round(size * (1 - 2 * pad))
    art = fit(im, inner)
    if art.width > inner:
        art = art.resize((inner, round(art.height * inner / art.width)), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (background or (0, 0, 0, 0)))
    canvas.alpha_composite(art, ((size - art.width) // 2, (size - art.height) // 2))
    return canvas


def shrink(path):
    """Palette-quantise with ImageMagick. The crest is flat vector-style art, so
    128 colours is visually lossless (measured mean abs error 0.6%) at roughly a
    fifth of the truecolour size. No-op if magick is unavailable."""
    if not shutil.which("magick"):
        return
    subprocess.run(["magick", str(path), "-strip", "-colors", str(PALETTE), str(path)],
                   check=False, capture_output=True)


def save(im, name):
    path = IMG / name
    im.save(path, optimize=True)
    before = path.stat().st_size
    shrink(path)
    print("  %-24s %4dx%-4d %6.1f kB  (from %.1f)"
          % (name, im.width, im.height, path.stat().st_size / 1024, before / 1024))


def main():
    src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.exists():
        sys.exit("source not found: %s" % src)

    crest = cut_background(src)
    print("crest cut from %s -> %dx%d (aspect %.3f)"
          % (src.name, crest.width, crest.height, crest.width / crest.height))

    logo = fit(crest, LOGO_HEIGHT)
    save(logo, "crest.png")
    save(duotone(logo), "crest-mono.png")

    save(square(crest, 192), "icon-192.png")
    save(square(crest, 512), "icon-512.png")
    # Maskable icons get cropped to a circle by the launcher — keep the art well
    # inside the 80% safe area.
    save(square(crest, 512, pad=0.18), "icon-512-maskable.png")
    # iOS ignores transparency and composites on black, so bake the page colour in.
    save(square(crest, 180, background=PAGE_BG + (255,)).convert("RGB"), "icon-180.png")

    ico = ROOT / "favicon.ico"
    square(crest, 64).save(ico, sizes=[(16, 16), (32, 32), (48, 48)])
    print("  %-24s %6.1f kB" % ("favicon.ico", ico.stat().st_size / 1024))


if __name__ == "__main__":
    main()
