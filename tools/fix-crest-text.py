#!/usr/bin/env python3
"""Replace the AI-garbled Bengali lettering on the school crest with correctly
shaped text, keeping the original artwork (disc, rings, candle, book, palms,
ribbon).

    python3 tools/fix-crest-text.py            # writes images/crest/crest-source-fixed.png
    python3 tools/make-logo.py                 # then regenerate every logo/icon

Errors in the AI source (images/crest/crest-source.jpg) that this fixes:
  * motto "জ্যানই পক্তি"  -> "জ্ঞানই শক্তি"   (broken জ্ঞ conjunct, শ drawn as প)
  * book letters অ ক / অ খ -> অ ক / আ খ     (আ was drawn as a second অ)
  * outer ring: malformed ঘ in ঘোনার and দ্য in বিদ্যালয়
  * place line "সখীপুর, টাংগাইল" with mangled letterforms -> "সখিপুর, টাঙ্গাইল"
  * ribbon "স্থাপিতঃ ১৯৮৫ খ্রিঃ" re-set cleanly

Text is shaped with libraqm (Pillow's complex-script layout), rendered straight,
then bent onto the arc as a whole, so conjuncts and vowel signs stay intact.
"""
import math
import pathlib
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont, features
from scipy import ndimage

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "images" / "crest" / "crest-source.jpg"
OUT = ROOT / "images" / "crest" / "crest-source-fixed.png"

SANS_BOLD = "/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf"
SERIF_REG = "/usr/share/fonts/truetype/noto/NotoSerifBengali-Regular.ttf"

SS = 3                       # supersampling for the bent text
RED = (204, 36, 40)
WHITE = (255, 255, 255)

# Geometry measured on images/crest/crest-source.jpg (997x1200)
CX, CY = 499.5, 490.0
OUTER_RING_IN = 468          # inner edge of the outer red ring
INNER_RING_OUT = 304         # outer edge of the inner red ring
INNER_RING_IN = 288          # inner edge of the inner red ring
BOOK_WINDOWS = [(288, 498, 382, 640), (396, 498, 480, 640)]   # left / right page
BOOK_LETTERS = {"অ": (335, 541), "আ": (335, 600), "ক": (446, 541), "খ": (446, 600)}   # page centres
BOOK_LETTER_H = 51           # ink height of each book letter, px


def rgb(a):
    return a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)


def nearest_fill(img, mask):
    """Paint masked pixels with the colour of the nearest unmasked pixel."""
    _, (iy, ix) = ndimage.distance_transform_edt(mask, return_indices=True)
    out = img.copy()
    out[mask] = img[iy[mask], ix[mask]]
    return out


def radius_grid(h, w):
    yy, xx = np.mgrid[0:h, 0:w]
    return np.hypot(xx - CX, yy - CY), yy, xx


# --------------------------------------------------------------- erase -----

def erase_text(a):
    h, w, _ = a.shape
    r, g, b = rgb(a)
    rad, yy, xx = radius_grid(h, w)
    goldish = (r > 200) & (g > 150) & (b < 140) & (r - b > 90)

    # Outer band: everything between the two rings that is not gold is lettering.
    band = (rad > INNER_RING_OUT + 2) & (rad < OUTER_RING_IN - 2)
    m_band = band & ~goldish

    # Motto: top of the inner disc, above the candle's rays.
    m_motto = (rad < INNER_RING_IN - 3) & (yy < 352) & ~goldish

    # Book letters: inside each page window, every red blob that does not touch
    # the window's edge is a letter (the page frames and spine all cross the edge).
    red = (r > 140) & (g < 130) & (b < 120) & (r - g > 60)
    m_book = np.zeros_like(red)
    for (x0, y0, x1, y1) in BOOK_WINDOWS:
        lab, n = ndimage.label(red[y0:y1, x0:x1])
        hh, ww = lab.shape
        for i in range(1, n + 1):
            ys, xs = np.where(lab == i)
            if ys.min() > 0 and xs.min() > 0 and ys.max() < hh - 1 and xs.max() < ww - 1:
                m_book[y0 + ys, x0 + xs] = True

    # Ribbon lettering: whitish pixels inside the blue ribbon.
    blue = (b > 90) & (r < 90) & (b - r > 50)
    ribbon = ndimage.binary_closing(blue, structure=np.ones((31, 31)))
    ribbon = ndimage.binary_fill_holes(ribbon)
    ribbon &= yy > 880
    m_ribbon = ribbon & ~blue & ~((r > 150) & (g < 120) & (b < 120))

    out = a.copy()
    grow = lambda m, k: ndimage.binary_dilation(m, iterations=k)

    # The gold field is flat, so paint it flat: nearest-fill drags JPEG halo
    # colours along and leaves ghost letters.
    gold = np.median(a[band & goldish], axis=0).astype(np.uint8)
    out[band] = gold
    out[(rad < INNER_RING_IN - 3) & (yy < 352)] = gold
    out[grow(m_book, 3)] = gold

    # The ribbon is shaded, so fill from the nearest blue, then smooth the
    # filled zone so no letter outlines survive.
    zone = grow(m_ribbon, 3) & ribbon & ~grow((r > 150) & (g < 120) & (b < 120), 2)
    filled = nearest_fill(out, zone)
    soft = np.stack([ndimage.gaussian_filter(filled[..., k].astype(float), 5) for k in range(3)], -1)
    out[zone] = soft[zone].astype(np.uint8)

    # Stray specks of old lettering sitting on the ring's inner edge: small red
    # islands on the disc that belong to no ring, frame or flame.
    r2, g2, b2 = rgb(out)
    red2 = (r2 > 140) & (g2 < 130) & (b2 < 120) & (r2 - g2 > 60)
    lab, n = ndimage.label(red2)
    sizes = ndimage.sum(red2, lab, range(1, n + 1))
    on_disc = (rad > INNER_RING_OUT + 2) & (rad < OUTER_RING_IN + 4)   # outer band only, never the candle's rays
    for i, size in enumerate(sizes, start=1):
        blob = lab == i
        if size < 150 and on_disc[blob].all():
            out[ndimage.binary_dilation(blob, iterations=2)] = gold
    return out, ribbon


# ---------------------------------------------------------------- draw -----

def shaped(text, font_path, size, color):
    """Shape `text` with raqm; return the RGBA image cropped to its ink."""
    font = ImageFont.truetype(font_path, size, layout_engine=ImageFont.Layout.RAQM)
    w = int(font.getlength(text)) + 2 * size
    im = Image.new("RGBA", (w, 3 * size), color + (0,))
    ImageDraw.Draw(im).text((size, size), text, font=font, fill=color + (255,))
    return im.crop(im.getbbox())


def shaped_line(text, font_path, size, color, hscale=1.0, extra_gap=0.0):
    """Shape each word separately (so conjuncts stay intact), widen the glyphs by
    `hscale`, and join the words on one shared baseline with `extra_gap` px
    added to every word space. Returns the RGBA line cropped to its ink."""
    font = ImageFont.truetype(font_path, size, layout_engine=ImageFont.Layout.RAQM)
    words = text.split()
    space = font.getlength(" ") * hscale
    h = 3 * size
    parts = []
    for word in words:
        w = int(font.getlength(word)) + 2 * size
        im = Image.new("RGBA", (w, h), color + (0,))
        ImageDraw.Draw(im).text((size, size), word, font=font, fill=color + (255,))
        x0, _, x1, _ = im.getbbox()
        im = im.crop((x0, 0, x1, h))
        if hscale != 1.0:
            im = im.resize((max(1, round(im.width * hscale)), h), Image.LANCZOS)
        parts.append(im)
    gap = round(space + extra_gap)
    total = sum(p.width for p in parts) + gap * (len(parts) - 1)
    line = Image.new("RGBA", (total, h), color + (0,))
    x = 0
    for p in parts:
        line.alpha_composite(p, (x, 0))
        x += p.width + gap
    return line.crop(line.getbbox())


MAX_WIDEN = 1.18   # the original lettering is wide; widen glyphs up to this


def arc_text(canvas, text, font_path, color, center, r_in, r_out, phi_mid,
             span_deg, outward=True):
    """Bend text onto the ring r_in..r_out around `center`, matching the original
    lettering: ink height = r_out - r_in and arc length = span_deg.

    If the text is naturally shorter than the arc, the glyphs are widened (up to
    MAX_WIDEN) and the rest goes into the word gaps; if it is longer, the whole
    line is scaled down. phi runs clockwise from 12 o'clock. outward=True: tops
    point away from the centre; outward=False: tops point to the centre."""
    r_mid = (r_in + r_out) / 2 * SS
    target_h = (r_out - r_in) * SS
    target_w = math.radians(span_deg) * r_mid
    probe = shaped_line(text, font_path, 100 * SS, color)
    size = int(100 * SS * target_h / probe.height)
    natural = shaped_line(text, font_path, size, color)
    if natural.width >= target_w:
        # too long: keep a clear word gap (35% of the size) and scale the line down
        roomy = shaped_line(text, font_path, size, color, extra_gap=0.35 * size)
        size = int(size * target_w / roomy.width)
        strip = shaped_line(text, font_path, size, color, extra_gap=0.35 * size)
    else:
        hscale = min(MAX_WIDEN, target_w / natural.width)
        widened = shaped_line(text, font_path, size, color, hscale=hscale)
        gaps = max(1, len(text.split()) - 1)
        strip = shaped_line(text, font_path, size, color, hscale=hscale,
                            extra_gap=(target_w - widened.width) / gaps)
    s = np.asarray(strip).astype(np.float32)
    sh, sw = s.shape[:2]
    H, W = canvas.shape[:2]
    cx, cy = center[0] * SS, center[1] * SS
    reach = r_mid + sh
    y0, y1 = max(0, int(cy - reach)), min(H, int(cy + reach))
    x0, x1 = max(0, int(cx - reach)), min(W, int(cx + reach))
    ys, xs = np.mgrid[y0:y1, x0:x1]
    dx, dy = xs - cx, ys - cy
    rr = np.hypot(dx, dy)
    dphi = (np.arctan2(dx, -dy) - phi_mid + np.pi) % (2 * np.pi) - np.pi
    if outward:
        sx = sw / 2 + dphi * r_mid
        sy = sh / 2 - (rr - r_mid)
    else:
        sx = sw / 2 - dphi * r_mid
        sy = sh / 2 + (rr - r_mid)
    ok = (sx >= 0) & (sx < sw - 1) & (sy >= 0) & (sy < sh - 1)
    fx = np.clip(np.floor(sx).astype(int), 0, sw - 2)
    fy = np.clip(np.floor(sy).astype(int), 0, sh - 2)
    ax, ay = (sx - fx)[..., None], (sy - fy)[..., None]
    p = (s[fy, fx] * (1 - ax) * (1 - ay) + s[fy, fx + 1] * ax * (1 - ay)
         + s[fy + 1, fx] * (1 - ax) * ay + s[fy + 1, fx + 1] * ax * ay)
    p[~ok] = 0
    a = p[..., 3:4] / 255.0
    canvas[y0:y1, x0:x1] = canvas[y0:y1, x0:x1] * (1 - a) + p[..., :3] * a
    return math.degrees(sw / r_mid), sh / SS


def stamp(canvas, text, font_path, color, cx, cy, ink_h):
    """Centre one upright glyph at (cx, cy), scaled to ink height ink_h px."""
    probe = shaped(text, font_path, 100 * SS, color)
    g = shaped(text, font_path, int(100 * SS * ink_h * SS / probe.height), color)
    s = np.asarray(g).astype(np.float32)
    gh, gw = s.shape[:2]
    ox, oy = int(cx * SS - gw / 2), int(cy * SS - gh / 2)
    a = s[..., 3:4] / 255.0
    canvas[oy:oy + gh, ox:ox + gw] = canvas[oy:oy + gh, ox:ox + gw] * (1 - a) + s[..., :3] * a


def fit_ribbon_arc(ribbon):
    """Least-squares circle through the ribbon's centre line (x 220..790)."""
    pts = []
    for x in range(220, 790, 10):
        ys = np.where(ribbon[:, x])[0]
        if len(ys):
            pts.append((x, (ys.min() + ys.max()) / 2))
    P = np.array(pts, dtype=float)
    A = np.c_[2 * P[:, 0], 2 * P[:, 1], np.ones(len(P))]
    cx, cy, c = np.linalg.lstsq(A, (P ** 2).sum(1), rcond=None)[0]
    return (cx, cy), math.sqrt(c + cx * cx + cy * cy)


def main():
    if not features.check("raqm"):
        sys.exit("Pillow was built without libraqm: Bengali would be shaped wrongly.")
    src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else SRC
    a = np.asarray(Image.open(src).convert("RGB"))
    clean, ribbon = erase_text(a)
    big = np.asarray(Image.fromarray(clean).resize(
        (clean.shape[1] * SS, clean.shape[0] * SS), Image.LANCZOS)).astype(np.float32)

    # Sizes and arc lengths measured on the original AI lettering, so the
    # corrected text occupies the same space.
    spans = {}
    spans["ring"] = arc_text(big, "ঘোনার চালা উচ্চ বিদ্যালয়", SANS_BOLD, RED, (CX, CY),
                             r_in=313, r_out=449, phi_mid=0.0, span_deg=268, outward=True)
    spans["place"] = arc_text(big, "সখিপুর, টাঙ্গাইল", SANS_BOLD, RED, (CX, CY),
                              r_in=314, r_out=442, phi_mid=math.pi, span_deg=79, outward=False)
    spans["motto"] = arc_text(big, "জ্ঞানই শক্তি", SANS_BOLD, RED, (CX, CY),
                              r_in=196, r_out=272, phi_mid=0.0, span_deg=91, outward=True)
    for ch, (x, y) in BOOK_LETTERS.items():
        stamp(big, ch, SERIF_REG, RED, x, y, BOOK_LETTER_H)
    (rcx, rcy), rr = fit_ribbon_arc(ribbon)
    spans["ribbon"] = arc_text(big, "স্থাপিতঃ ১৯৮৫ খ্রিঃ", SANS_BOLD, WHITE, (rcx, rcy),
                               r_in=rr - 50, r_out=rr + 48, phi_mid=math.pi, span_deg=76,
                               outward=False)

    out = Image.fromarray(np.clip(big, 0, 255).astype(np.uint8)).resize(
        (clean.shape[1], clean.shape[0]), Image.LANCZOS)
    out.save(OUT, optimize=True)
    print("wrote", OUT)
    print("span deg / ink height px:", {k: (round(v[0]), round(v[1])) for k, v in spans.items()})


if __name__ == "__main__":
    main()
