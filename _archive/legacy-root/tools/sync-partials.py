#!/usr/bin/env python3
"""Propagate partials/header.html and partials/footer.html into every page.

The header and footer markup is duplicated into each HTML file on purpose:
it must be present for crawlers and must render with JavaScript disabled.
This script keeps those copies identical.

Run it after editing anything in partials/:

    python3 tools/sync-partials.py           # rewrite the pages
    python3 tools/sync-partials.py --check   # exit 1 if any page is stale

It is a developer convenience only — it never runs during deployment.
GitHub Pages continues to serve the committed HTML verbatim.
"""
import glob
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
os.chdir(ROOT)

REGIONS = {
    "header": "partials/header.html",
    "footer": "partials/footer.html",
}

def region_re(name):
    return re.compile(
        r"(<!-- gc:%s:start[^>]*-->\n)(.*?)(\n<!-- gc:%s:end -->)" % (name, name),
        re.DOTALL,
    )

def main():
    check = "--check" in sys.argv
    stale, changed = [], []

    for name, path in REGIONS.items():
        if not os.path.exists(path):
            sys.exit("missing partial: %s" % path)

    for page in sorted(glob.glob("*.html")):
        original = open(page, encoding="utf-8").read()
        updated = original
        for name, path in REGIONS.items():
            body = open(path, encoding="utf-8").read().rstrip("\n")
            pattern = region_re(name)
            if not pattern.search(updated):
                print("  ! %s has no gc:%s region" % (page, name))
                continue
            updated = pattern.sub(
                lambda m: m.group(1) + body + m.group(3), updated, count=1)
        if updated != original:
            if check:
                stale.append(page)
            else:
                open(page, "w", encoding="utf-8").write(updated)
                changed.append(page)

    if check:
        if stale:
            print("stale pages (run: python3 tools/sync-partials.py):")
            for p in stale:
                print("  -", p)
            return 1
        print("all pages are in sync with partials/")
        return 0

    print("updated %d page(s)%s" % (len(changed), (": " + ", ".join(changed)) if changed else ""))
    return 0

if __name__ == "__main__":
    sys.exit(main())
