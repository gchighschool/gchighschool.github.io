#!/usr/bin/env bash
# Turn the original photos in images/ into the gallery thumbnails and full-size
# versions the site serves. Run locally; the OUTPUT is committed.
#
#   1. Put the original photo (.jpg) in images/        e.g. images/sports-day.jpg
#   2. bash tools/make-gallery.sh
#   3. Add an entry to data/gallery.json (see the note at the top of that file)
#
# Needs ImageMagick (the `magick` command).
set -euo pipefail
cd "$(dirname "$0")/.."

GAL="assets/img/gallery"
mkdir -p "$GAL/thumb" "$GAL/full"
for src in images/*.jpg; do
  base=$(basename "$src" .jpg)
  magick "$src" -auto-orient -strip -resize 600x600^ -gravity center -crop 600x420+0+0 +repage \
    -quality 76 -define webp:method=6 "$GAL/thumb/$base.webp"
  magick "$src" -auto-orient -strip -resize 1600x1600\> -quality 80 -interlace JPEG "$GAL/full/$base.jpg"
  echo "  $base"
done
echo "gallery done"
