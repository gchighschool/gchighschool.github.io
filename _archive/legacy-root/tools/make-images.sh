#!/usr/bin/env bash
# One-time image preparation. Run locally; the OUTPUT is committed.
# This never runs in CI — GitHub Pages still serves the repo verbatim.
#
#   bash tools/make-images.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

SRC_DIR="images"
OUT="assets/img/slider"
mkdir -p "$OUT"

# Hero slides: crop to a fixed 16:7 so object-fit isn't discarding decoded pixels,
# and emit three widths in both WebP and JPEG.
for n in 1 2 3 4; do
  src="$SRC_DIR/slider-$n.jpg"
  [ -f "$src" ] || { echo "skip $src"; continue; }
  for w in 1600 1100 700; do
    h=$(( w * 7 / 16 ))
    magick "$src" -auto-orient -strip -resize "${w}x" \
      -gravity center -crop "${w}x${h}+0+0" +repage \
      -sampling-factor 4:2:0 -interlace JPEG -quality 78 "$OUT/slider-$n-$w.jpg"
    magick "$OUT/slider-$n-$w.jpg" -quality 74 -define webp:method=6 "$OUT/slider-$n-$w.webp"
  done
  echo "slider-$n done"
done

# Gallery: 600w lazy thumbnails + 1600w full size.
GAL="assets/img/gallery"
mkdir -p "$GAL/thumb" "$GAL/full"
for src in "$SRC_DIR"/*.jpg; do
  base=$(basename "$src" .jpg)
  magick "$src" -auto-orient -strip -resize 600x600^ -gravity center -crop 600x420+0+0 +repage \
    -quality 76 -define webp:method=6 "$GAL/thumb/$base.webp"
  magick "$src" -auto-orient -strip -resize 1600x1600\> -quality 80 -interlace JPEG "$GAL/full/$base.jpg"
done
echo "gallery done"

# Admission banner.
magick "$SRC_DIR/admission-25.jpg" -auto-orient -strip -resize 1400x -quality 80 -interlace JPEG \
  assets/img/admission-2025.jpg
magick assets/img/admission-2025.jpg -quality 76 assets/img/admission-2025.webp

# Open Graph card: 1200x630. Rendered via Pillow, NOT ImageMagick — `magick -annotate`
# has no complex-script shaping and mangles Bengali conjuncts and vowel signs.
python3 tools/make-og-cover.py
echo "og-cover done"
