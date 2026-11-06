#!/usr/bin/env python3
"""Generate assets/img/og-cover.jpg (1200x630 social share card).

Uses Pillow with Raqm text shaping. ImageMagick's -annotate cannot shape
Bengali (conjuncts and pre-base vowel signs come out misplaced), so do not
be tempted to fold this back into make-images.sh as a `magick` call.
"""
from PIL import Image, ImageDraw, ImageFont, features
import sys, os

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

if not features.check("raqm"):
    sys.exit("ERROR: Pillow built without Raqm — Bengali text would render malformed.")

W, H = 1200, 630
BN = "/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf"
LAT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

img = Image.new("RGB", (W, H))
d = ImageDraw.Draw(img)
c1, c2 = (0, 106, 78), (0, 53, 42)
for y in range(H):
    t = y / (H - 1)
    d.line([(0, y), (W, y)], fill=tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)))

mark = Image.open("assets/img/icon-512.png").convert("RGBA").resize((200, 200), Image.LANCZOS)
img.paste(mark, (W // 2 - 100, 70), mark)

def centered(text, font_path, size, y, fill):
    f = ImageFont.truetype(font_path, size)
    kw = dict(font=f, language="bn", direction="ltr")
    b = d.textbbox((0, 0), text, **kw)
    d.text((W // 2 - (b[2] - b[0]) // 2 - b[0], y), text, fill=fill, **kw)

centered("ঘোনার চালা উচ্চ বিদ্যালয়", BN, 68, 300, (255, 255, 255))
centered("Ghonar Chala High School", LAT, 34, 415, (188, 217, 206))
centered("EIIN 114612  •  Sakhipur, Tangail", LAT, 26, 480, (201, 162, 39))

img.save("assets/img/og-cover.jpg", quality=88, optimize=True, progressive=True)
print("wrote assets/img/og-cover.jpg")
