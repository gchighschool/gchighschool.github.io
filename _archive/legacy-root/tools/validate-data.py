#!/usr/bin/env python3
"""Validate everything under data/ before it reaches the live site.

A single trailing comma typed into the GitHub web editor is enough to make the
notice board fail to load, with no signal to anyone. Run this after editing any
data file:

    python3 tools/validate-data.py
"""
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
os.chdir(ROOT)

ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")
errors = []


def err(msg):
    errors.append(msg)


def load(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        err("%s: file not found" % path)
    except json.JSONDecodeError as e:
        err("%s: invalid JSON at line %d column %d — %s" % (path, e.lineno, e.colno, e.msg))
    return None


def check_notices():
    data = load("data/notices.json")
    if not data:
        return
    notices = data.get("notices")
    if not isinstance(notices, list):
        err("data/notices.json: top-level 'notices' must be a list")
        return

    seen = set()
    for i, n in enumerate(notices):
        where = "data/notices.json notice[%d]" % i
        for field in ("id", "title", "date", "body"):
            if not n.get(field):
                err("%s: missing required field '%s'" % (where, field))

        nid = str(n.get("id", ""))
        if nid in seen:
            err("%s: duplicate id '%s' — ids must be unique or old links break" % (where, nid))
        seen.add(nid)

        date = n.get("date", "")
        if date and not ISO.match(str(date)):
            err("%s: date '%s' must be YYYY-MM-DD" % (where, date))

        # The page owns its single <h1>; a '# ' heading in the body would add a second.
        if str(n.get("body", "")).lstrip().startswith("# "):
            err("%s: body starts with '# ' — use '## ' so the page keeps one <h1>" % where)

        att = n.get("attachment")
        if att:
            url = att.get("url")
            if not url:
                err("%s: attachment has no url" % where)
            elif not os.path.exists(url):
                err("%s: attachment file '%s' does not exist in the repo" % (where, url))


def check_people(path, key):
    data = load(path)
    if not data:
        return
    people = data.get(key)
    if not isinstance(people, list):
        err("%s: top-level '%s' must be a list" % (path, key))
        return
    for i, p in enumerate(people):
        if not p.get("name"):
            err("%s %s[%d]: missing 'name'" % (path, key, i))
        photo = p.get("photo")
        if photo and not os.path.exists(photo):
            err("%s %s[%d]: photo '%s' does not exist" % (path, key, i, photo))


def check_gallery():
    data = load("data/gallery.json")
    if not data:
        return
    photos = data.get("photos")
    if not isinstance(photos, list):
        err("data/gallery.json: top-level 'photos' must be a list")
        return
    for i, p in enumerate(photos):
        for field in ("src", "thumb"):
            v = p.get(field)
            if not v:
                err("data/gallery.json photos[%d]: missing '%s'" % (i, field))
            elif not os.path.exists(v):
                err("data/gallery.json photos[%d]: %s '%s' does not exist" % (i, field, v))


def check_site_contact():
    """Contact details are hardcoded in the HTML for SEO and no-JS support.
    data/site.json is the canonical record — assert they still agree, so the
    old homepage/admission phone-number mismatch cannot silently return."""
    data = load("data/site.json")
    if not data:
        return
    pages = [p for p in os.listdir(".") if p.endswith(".html")]
    for phone in data.get("phones", []):
        tel = phone.get("tel", "")
        if not tel:
            continue
        if not any(tel in open(p, encoding="utf-8").read() for p in pages):
            err("data/site.json: phone %s appears in no HTML page" % tel)

    known = {ph.get("tel") for ph in data.get("phones", [])}
    for p in pages:
        html = open(p, encoding="utf-8").read()
        for found in sorted(set(re.findall(r"tel:(\+880\d+)", html))):
            if found not in known:
                err("%s: phone link tel:%s is not listed in data/site.json" % (p, found))


check_notices()
check_people("data/teachers.json", "teachers")
check_people("data/committee.json", "members")
check_gallery()
check_site_contact()

if errors:
    print("FAILED — %d problem(s):\n" % len(errors))
    for e in errors:
        print("  •", e)
    sys.exit(1)

print("OK — all data files valid.")
