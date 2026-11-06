#!/usr/bin/env python3
"""Generate assets/img/og-cover.jpg — the 1200x630 card Facebook / WhatsApp show
when a page of the site is shared.

    python3 tools/make-og-cover.py

Run locally; the output is committed. Needs Pillow with Raqm: ImageMagick cannot
shape Bengali (conjuncts and pre-base vowels come out wrong).
"""
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont, features

ROOT = pathlib.Path(__file__).resolve().parent.parent
if not features.check("raqm"):
    sys.exit("Pillow was built without Raqm: Bengali text would be malformed.")

W, H = 1200, 630
NAVY = (27, 42, 74)          # --m-navy
BRASS = (176, 141, 87)       # --m-brass
CREAM = (250, 248, 244)      # --m-bg
MUTED = (200, 208, 224)
BN_BOLD = "/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf"
BN_REG = "/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf"
LATIN = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

img = Image.new("RGB", (W, H), NAVY)
d = ImageDraw.Draw(img)

crest = Image.open(ROOT / "assets" / "img" / "crest.png").convert("RGBA")
ch = 420
crest = crest.resize((round(crest.width * ch / crest.height), ch), Image.LANCZOS)
cx, cy = 90, (H - ch) // 2
img.paste(crest, (cx, cy), crest)

x = cx + crest.width + 70
d.rectangle([x, 168, x + 72, 173], fill=BRASS)


def line(text, path, size, y, fill, bn=True):
    font = ImageFont.truetype(path, size, layout_engine=ImageFont.Layout.RAQM)
    kw = {"language": "bn"} if bn else {}
    d.text((x, y), text, font=font, fill=fill, **kw)


line("ঘোনার চালা", BN_BOLD, 88, 190, CREAM)
line("উচ্চ বিদ্যালয়", BN_BOLD, 88, 300, CREAM)
line("Ghonar Chala High School", LATIN, 34, 440, MUTED, bn=False)
_f = ImageFont.truetype(BN_REG, 32, layout_engine=ImageFont.Layout.RAQM)
_a = "সখিপুর, টাঙ্গাইল"
_w = d.textlength(_a, font=_f, language="bn")
line(_a, BN_REG, 32, 495, BRASS)
d.rectangle([x + _w + 22, 500, x + _w + 24, 532], fill=BRASS)      # divider
d.text((x + _w + 46, 495), "স্থাপিত ১৯৮৫", font=_f, fill=BRASS, language="bn")

out = ROOT / "assets" / "img" / "og-cover.jpg"
img.save(out, quality=88, optimize=True, progressive=True)
print("wrote", out.relative_to(ROOT), "%.1f kB" % (out.stat().st_size / 1024))
