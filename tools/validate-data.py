#!/usr/bin/env python3
"""Check data/*.json before the site is built.

    python3 tools/validate-data.py

Exit code 1 with a plain list of problems if anything is malformed, so a typo
made while editing on github.com stops the deploy (the live site keeps the last
good version) instead of publishing a broken page. tools/build.py runs this
first.
"""
import datetime
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
BLOCK_TYPES = {"p", "h", "list"}


def load(name, errors):
    path = DATA / name
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        errors.append("%s: file is missing" % name)
    except json.JSONDecodeError as e:
        errors.append("%s: not valid JSON — %s (line %d, column %d)" % (name, e.msg, e.lineno, e.colno))
    return None


def is_pair(v, allow_empty=False):
    return (isinstance(v, dict) and isinstance(v.get("bn"), str) and isinstance(v.get("en"), str)
            and (allow_empty or (v["bn"].strip() and v["en"].strip())))


def check_date(s):
    try:
        datetime.date.fromisoformat(s)
        return True
    except (TypeError, ValueError):
        return False


def check_runs(runs):
    return isinstance(runs, list) and all(
        isinstance(r, str) or (isinstance(r, dict) and isinstance(r.get("b"), str)) for r in runs)


def check_notices(errors):
    data = load("notices.json", errors)
    if data is None:
        return
    seen = set()
    for i, n in enumerate(data.get("notices", []), start=1):
        where = "notices.json, notice #%d" % i
        nid = n.get("id")
        if not isinstance(nid, str) or not nid or any(c in nid for c in "/\\ ?#%."):
            errors.append("%s: \"id\" must be text without spaces, dots or slashes (it becomes the page address notices/<id>.html)" % where)
        elif nid in seen:
            errors.append("%s: id \"%s\" is used twice" % (where, nid))
        seen.add(nid)
        where = "notices.json, notice \"%s\"" % nid
        if not check_date(n.get("date")):
            errors.append("%s: \"date\" must look like 2026-01-15" % where)
        for field in ("title", "category", "summary"):
            if not is_pair(n.get(field)):
                errors.append("%s: \"%s\" needs both \"bn\" and \"en\" text" % (where, field))
        if not isinstance(n.get("body"), list) or not n["body"]:
            errors.append("%s: \"body\" must be a list of blocks" % where)
            continue
        for j, b in enumerate(n["body"], start=1):
            if b.get("type") not in BLOCK_TYPES:
                errors.append("%s, block %d: \"type\" must be p, h or list" % (where, j))
                continue
            for lang in ("bn", "en"):
                c = b.get(lang)
                ok = isinstance(c, str) if b["type"] == "h" else (
                    isinstance(c, list) and all(check_runs(x) if b["type"] == "list" else not isinstance(x, list)
                                                for x in c)
                    and (b["type"] == "list" or check_runs(c)))
                if not ok:
                    errors.append("%s, block %d: \"%s\" text is malformed" % (where, j, lang))


def check_people(name, key, errors):
    data = load(name, errors)
    if data is None:
        return
    for i, p in enumerate(data.get(key, []), start=1):
        where = "%s, entry #%d" % (name, i)
        for field in ("name", "designation"):
            if not is_pair(p.get(field)):
                errors.append("%s: \"%s\" needs both \"bn\" and \"en\" text" % (where, field))
        for field in ("subject", "note"):
            if field in p and not is_pair(p[field], allow_empty=True):
                errors.append("%s: \"%s\" must have \"bn\" and \"en\" (may be empty)" % (where, field))
        if p.get("joined") and not check_date(p["joined"]):
            errors.append("%s: \"joined\" must look like 1994-04-09" % where)
        photo = p.get("photo")
        if photo and not (ROOT / photo).exists():
            errors.append("%s: photo file \"%s\" does not exist" % (where, photo))


def check_gallery(errors):
    data = load("gallery.json", errors)
    if data is None:
        return
    for i, g in enumerate(data.get("photos", []), start=1):
        where = "gallery.json, photo #%d" % i
        for field in ("thumb", "full"):
            if not g.get(field) or not (ROOT / g[field]).exists():
                errors.append("%s: \"%s\" file \"%s\" does not exist" % (where, field, g.get(field)))
        if not is_pair(g.get("caption")):
            errors.append("%s: \"caption\" needs both \"bn\" and \"en\" text" % where)


def check_site(errors):
    data = load("site.json", errors)
    if data is None:
        return
    for field in ("name", "description"):
        if not is_pair(data.get(field)):
            errors.append("site.json: \"%s\" needs both \"bn\" and \"en\"" % field)
    for field in ("eiin", "founded", "email"):
        if not data.get(field):
            errors.append("site.json: \"%s\" is missing" % field)


def validate():
    errors = []
    check_notices(errors)
    check_people("teachers.json", "teachers", errors)
    check_people("committee.json", "members", errors)
    check_gallery(errors)
    check_site(errors)
    return errors


if __name__ == "__main__":
    problems = validate()
    if problems:
        print("Data check FAILED — %d problem(s):" % len(problems))
        for p in problems:
            print("  - " + p)
        sys.exit(1)
    print("Data check passed.")
