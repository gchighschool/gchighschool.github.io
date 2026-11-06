#!/usr/bin/env python3
"""Build the publishable site into dist/.

    python3 tools/build.py            # CI runs this, then uploads dist/

The source pages in the repo root work on their own (JavaScript fills in the
notices, teachers and photos). This script makes the same content visible to
search engines and link previews WITHOUT running any JavaScript:

  1. validates data/*.json (the build stops if the data is malformed)
  2. copies the site into dist/
  3. writes one real page per notice:  dist/notices/<id>.html
  4. pre-fills the notice list, teacher/committee cards and gallery in the
     HTML (the browser script redraws the same markup, so nothing jumps)
  5. adds <link rel=canonical>, Open Graph / Twitter tags, and a schema.org
     JSON-LD block (home page) to every indexable page
  6. writes sitemap.xml and robots.txt

Standard library only. The site's address comes from the CNAME file.
"""
import datetime
import html
import json
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
DATA = ROOT / "data"
TEMPLATE = ROOT / "tools" / "templates" / "notice.html"

# Things in the repo that are NOT part of the published site.
EXCLUDE = {".git", ".github", "_archive", "dist", "tools", "images", "README.md",
           ".gitignore", "__pycache__"}
NOINDEX = {"404.html", "notice-view.html"}

OG_IMAGE = "assets/img/og-cover.jpg"
SITE_NAME_BN = "ঘোনার চালা উচ্চ বিদ্যালয়"


# ------------------------------------------------------------------ helpers

def esc(s):
    return html.escape(str(s), quote=True)


def site_url():
    cname = ROOT / "CNAME"
    host = cname.read_text().strip() if cname.exists() else "gchighschool.github.io"
    return "https://" + host


def read_json(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


# Bengali text pulled from the same place the browser script reads it, so the
# pre-rendered HTML can never drift from what the script draws.
SITE_JS = (ROOT / "assets" / "js" / "site.js").read_text(encoding="utf-8")


def js_array(name):
    m = re.search(r"var %s = \[(.*?)\];" % name, SITE_JS, re.S)
    return re.findall(r"'([^']*)'", m.group(1))


BN_DIGITS = js_array("BN_DIGITS")
BN_MONTHS = js_array("BN_MONTHS")
BN_MONTHS_SHORT = js_array("BN_MONTHS_SHORT")


def bn_block():
    start = re.search(r"^\s*bn:\s*\{", SITE_JS, re.M).end()
    return SITE_JS[start:]


def t_bn(key):
    m = re.search(r"^\s*'%s':\s*'((?:[^'\\]|\\.)*)',?\s*$" % re.escape(key), bn_block(), re.M)
    if not m:
        raise KeyError("site.js has no Bangla string for %r" % key)
    return m.group(1).replace("\\'", "'")


def bn_num(n):
    return "".join(BN_DIGITS[int(c)] if c.isdigit() else c for c in str(n))


def parse_date(iso):
    return datetime.date.fromisoformat(iso)


def fmt_date(iso):
    d = parse_date(iso)
    return "%s %s %s" % (bn_num(d.day), BN_MONTHS[d.month - 1], bn_num(d.year))


def date_parts(iso):
    d = parse_date(iso)
    return bn_num(d.day), BN_MONTHS_SHORT[d.month - 1]


def sort_notices(notices):
    """Newest first, pinned on top — same order as M.loadNotices()."""
    by_date = sorted(notices, key=lambda n: str(n["date"]), reverse=True)
    return sorted(by_date, key=lambda n: not n.get("pinned"))


# ---------------------------------------------- markup mirrored from the JS

def runs_html(runs):
    out = []
    for r in runs if isinstance(runs, list) else [runs]:
        if isinstance(r, str):
            out.append(esc(r))
        elif isinstance(r, dict) and r.get("b"):
            out.append("<strong>%s</strong>" % esc(r["b"]))
    return "".join(out)


def body_html(body):
    out = []
    for b in body or []:
        c = b.get("bn", b.get("en"))
        if c is None:
            continue
        if b["type"] == "h":
            out.append("<h2>%s</h2>" % esc(c))
        elif b["type"] == "list":
            out.append("<ul>%s</ul>" % "".join("<li>%s</li>" % runs_html(i) for i in c))
        else:
            out.append("<p>%s</p>" % runs_html(c))
    return "".join(out)


def notice_row(n, root="", compact=False):
    day, mon = date_parts(n["date"])
    summary = n["summary"]["bn"]
    parts = ['<a class="m-notice" href="%snotices/%s.html">' % (root, esc(n["id"])),
             '<div class="m-date-chip"><span class="m-date-day">%s</span><span class="m-date-mon">%s</span></div>' % (day, mon),
             '<div class="flex-grow-1"><h3 class="m-notice-title">%s</h3>' % esc(n["title"]["bn"])]
    if summary and not compact:
        parts.append('<p class="m-notice-summary">%s</p>' % esc(summary))
    parts.append('<p class="m-notice-meta"><span class="m-tag">%s</span>' % esc(n["category"]["bn"]))
    if n.get("pinned"):
        parts.append(' <span class="m-tag m-tag-pin">%s</span>' % esc(t_bn("news.pinned")))
    parts.append(' <time datetime="%s">%s</time></p></div></a>' % (esc(n["date"]), esc(fmt_date(n["date"]))))
    return "".join(parts)


def initials(name):
    words = [w for w in name.strip().split() if w]
    if not words:
        return ""
    return (words[0][0] + (words[-1][0] if len(words) > 1 else "")).upper()


def person_card(p):
    name = p["name"]["bn"]
    if p.get("photo"):
        avatar = '<div class="m-avatar"><img src="%s" alt="" width="76" height="76"></div>' % esc(p["photo"])
    else:
        avatar = '<div class="m-avatar" aria-hidden="true">%s</div>' % esc(initials(name))
    parts = ['<div class="col-12 col-sm-6 col-lg-4"><div class="m-card h-100 text-center">',
             '<div class="d-flex justify-content-center mb-3">%s</div>' % avatar]
    if p.get("designation", {}).get("bn"):
        parts.append('<span class="m-eyebrow">%s</span>' % esc(p["designation"]["bn"]))
    parts.append("<h3>%s</h3>" % esc(name))
    if p.get("subject", {}).get("bn"):
        parts.append('<p class="m-muted small mb-1">%s</p>' % esc(p["subject"]["bn"]))
    if p.get("note", {}).get("bn"):
        parts.append('<p class="m-muted mb-0">%s</p>' % esc(p["note"]["bn"]))
    if p.get("joined"):
        parts.append('<p class="m-muted small mb-0 mt-2">%s: <time datetime="%s">%s</time></p>'
                     % (esc(t_bn("teach.joined")), esc(p["joined"]), esc(fmt_date(p["joined"]))))
    parts.append("</div></div>")
    return "".join(parts)


TILES = [("col-12 col-md-7", "ratio-21x9"), ("col-12 col-md-5", "ratio-4x3"),
         ("col-6 col-md-4", "ratio-1x1"), ("col-6 col-md-4", "ratio-1x1"),
         ("col-12 col-md-4", "ratio-4x3")]


def gallery_tile(photo, i):
    col, ratio = TILES[i % len(TILES)]
    cap = photo["caption"]["bn"]
    label = t_bn("gal.open").replace("%CAPTION%", cap)
    return ('<div class="%s"><figure class="mb-0">'
            '<button type="button" class="p-0 border-0 w-100 bg-transparent text-start" data-gal-open="" '
            'data-gal-index="%d" aria-label="%s"><div class="m-figure ratio %s">'
            '<img src="%s" alt="%s" loading="lazy" width="600" height="420"></div></button>'
            '<figcaption class="m-muted small mt-2 mb-0">%s</figcaption></figure></div>'
            % (col, i, esc(label), ratio, esc(photo["thumb"]), esc(cap), esc(cap)))


def count_text(n, one_key, many_key):
    return t_bn(one_key) if n == 1 else t_bn(many_key).replace("%N%", bn_num(n))


# --------------------------------------------------- container replacement

def replace_inner(src, attr, new_inner, new_class=None):
    """Replace the inside of the element whose opening tag carries `attr`."""
    m = re.search(r"<(div|p)\b[^>]*\b%s\b[^>]*>" % re.escape(attr), src)
    if not m:
        return src, False
    tag = m.group(1)
    opening = m.group(0)
    if new_class:
        opening = re.sub(r'class="[^"]*"', 'class="%s"' % new_class, opening, count=1)
    depth, pos = 1, m.end()
    token = re.compile(r"<%s\b|</%s>" % (tag, tag))
    for t in token.finditer(src, m.end()):
        depth += 1 if t.group(0).startswith("<%s" % tag) and not t.group(0).startswith("</") else -1
        if depth == 0:
            return src[:m.start()] + opening + new_inner + src[t.start():], True
    raise ValueError("unclosed <%s %s>" % (tag, attr))


def prerender(page, src, notices, teachers, members, photos):
    ok = True
    if page == "index.html":
        inner = "".join(notice_row(n) for n in notices[:3])
        src, ok = replace_inner(src, "data-home-notices", inner)
    elif page == "notices.html":
        src, a = replace_inner(src, "data-news-count", esc(count_text(len(notices), "news.count1", "news.count")))
        src, b = replace_inner(src, "data-news-list", "".join(notice_row(n) for n in notices))
        ok = a and b
    elif page == "teachers.html":
        src, ok = replace_inner(src, "data-teachers-list", "".join(person_card(p) for p in teachers), "row g-4")
    elif page == "committee.html":
        src, ok = replace_inner(src, "data-committee-list", "".join(person_card(p) for p in members), "row g-4")
    elif page == "gallery.html":
        src, a = replace_inner(src, "data-gal-count", esc(count_text(len(photos), "gal.count1", "gal.count")))
        src, b = replace_inner(src, "data-gal-grid", "".join(gallery_tile(p, i) for i, p in enumerate(photos)),
                               "row g-4 g-lg-5")
        ok = a and b
    if not ok:
        raise SystemExit("build: could not find the list container in %s" % page)
    return src


# ---------------------------------------------------------- notice pages

def prefix_urls(src, prefix):
    """Point every relative href/src one folder up (page lives in notices/)."""
    def fix(m):
        v = m.group(2)
        if re.match(r"^(https?:|//|#|mailto:|tel:|data:|javascript:)", v):
            return m.group(0)
        return '%s="%s%s"' % (m.group(1), prefix, v)
    return re.sub(r'\b(href|src)="([^"]*)"', fix, src)


def notice_page(template, n, notices):
    title = n["title"]["bn"]
    src = template
    src = re.sub(r'<html lang="bn"[^>]*>', '<html lang="bn" data-page="news" data-root="../">', src, count=1)
    src = re.sub(r"<title>.*?</title>", "<title>%s — %s</title>" % (esc(title), esc(SITE_NAME_BN)), src, count=1, flags=re.S)
    src = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + esc(n["summary"]["bn"]) + m.group(2), src, count=1)

    h1 = '<h1 data-detail-title data-i18n="news.loading">'
    assert h1 in src, "notice template changed: h1"
    src = re.sub(r'<h1 data-detail-title data-i18n="news.loading">.*?</h1>',
                 lambda m: "<h1 data-detail-title>%s</h1>" % esc(title), src, count=1, flags=re.S)
    src = src.replace('<span class="m-eyebrow" data-detail-category></span>',
                      '<span class="m-eyebrow" data-detail-category>%s</span>' % esc(n["category"]["bn"]))
    src = src.replace("<p data-detail-date></p>",
                      '<p data-detail-date>%s: <time datetime="%s">%s</time></p>'
                      % (esc(t_bn("news.published")), esc(n["date"]), esc(fmt_date(n["date"]))))
    src = src.replace('<div class="m-prose" data-detail-body></div>',
                      '<div class="m-prose" data-detail-body data-notice-id="%s">%s</div>' % (esc(n["id"]), body_html(n["body"])))
    others = [x for x in notices if x is not n][:4]
    others_html = "".join(notice_row(x, root="../", compact=True) for x in others) if others else \
        '<p class="m-muted mb-0">%s</p>' % esc(t_bn("news.empty"))
    src = src.replace("<div data-detail-others></div>", "<div data-detail-others>%s</div>" % others_html)
    for needle in ("data-detail-others>", 'data-notice-id="'):
        assert needle in src, "notice template changed: " + needle
    return prefix_urls(src, "../")


# ------------------------------------------------------------------- SEO

def meta_of(src):
    t = re.search(r"<title>(.*?)</title>", src, re.S)
    d = re.search(r'<meta name="description" content="([^"]*)"', src)
    return html.unescape(t.group(1).strip()) if t else SITE_NAME_BN, html.unescape(d.group(1)) if d else ""


def page_url(site, rel):
    return site + "/" if rel == "index.html" else "%s/%s" % (site, rel)


def seo_head(site, rel, src, kind="website"):
    title, desc = meta_of(src)
    url = page_url(site, rel)
    image = "%s/%s" % (site, OG_IMAGE)
    tags = [
        '<meta name="robots" content="index,follow,max-image-preview:large">',
        '<link rel="canonical" href="%s">' % esc(url),
        '<meta property="og:type" content="%s">' % kind,
        '<meta property="og:site_name" content="%s">' % esc(SITE_NAME_BN),
        '<meta property="og:locale" content="bn_BD">',
        '<meta property="og:locale:alternate" content="en_US">',
        '<meta property="og:title" content="%s">' % esc(title),
        '<meta property="og:description" content="%s">' % esc(desc),
        '<meta property="og:url" content="%s">' % esc(url),
        '<meta property="og:image" content="%s">' % esc(image),
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:image:alt" content="%s — Ghonar Chala High School">' % esc(SITE_NAME_BN),
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="%s">' % esc(title),
        '<meta name="twitter:description" content="%s">' % esc(desc),
        '<meta name="twitter:image" content="%s">' % esc(image),
    ]
    return "\n  ".join(tags)


def json_ld(site, s):
    a = s["address"]
    return json.dumps({
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "HighSchool",
                "@id": site + "/#school",
                "name": s["name"]["bn"],
                "alternateName": s["name"]["en"],
                "description": s["description"]["bn"],
                "url": site + "/",
                "logo": site + "/assets/img/icon-512.png",
                "image": site + "/" + OG_IMAGE,
                "foundingDate": s["founded"],
                "identifier": {"@type": "PropertyValue", "propertyID": "EIIN", "value": s["eiin"]},
                "telephone": s["phones"][0],
                "contactPoint": [{"@type": "ContactPoint", "telephone": p, "contactType": "customer service",
                                  "availableLanguage": ["bn", "en"]} for p in s["phones"]],
                "email": s["email"],
                "address": {"@type": "PostalAddress", "streetAddress": a["street"], "addressLocality": a["locality"],
                            "addressRegion": a["region"], "postalCode": a["postalCode"], "addressCountry": a["country"]},
                "geo": {"@type": "GeoCoordinates", "latitude": s["geo"]["latitude"], "longitude": s["geo"]["longitude"]},
                "sameAs": s["sameAs"],
            },
            {
                "@type": "WebSite",
                "@id": site + "/#website",
                "url": site + "/",
                "name": s["name"]["bn"],
                "alternateName": s["name"]["en"],
                "inLanguage": ["bn", "en"],
                "publisher": {"@id": site + "/#school"},
            },
        ],
    }, ensure_ascii=False, indent=2)


def add_seo(src, site, rel, kind="website", site_data=None):
    block = seo_head(site, rel, src, kind)
    if rel == "index.html" and site_data:
        block += '\n  <script type="application/ld+json">\n%s\n  </script>' % json_ld(site, site_data)
    if "</head>" not in src:
        raise SystemExit("build: %s has no </head>" % rel)
    return src.replace("</head>", "  %s\n</head>" % block, 1)


# ------------------------------------------------------------------ main

def main():
    check = subprocess.run([sys.executable, str(ROOT / "tools" / "validate-data.py")])
    if check.returncode:
        sys.exit("build stopped: fix the data problems listed above.")

    site = site_url()
    site_data = read_json("site.json")
    notices = sort_notices(read_json("notices.json")["notices"])
    teachers = read_json("teachers.json")["teachers"]
    members = read_json("committee.json")["members"]
    photos = read_json("gallery.json")["photos"]

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    for item in sorted(ROOT.iterdir()):
        if item.name in EXCLUDE:
            continue
        if item.is_dir():
            shutil.copytree(item, DIST / item.name, ignore=shutil.ignore_patterns("__pycache__"))
        else:
            shutil.copy2(item, DIST / item.name)

    # One page per notice.
    template = TEMPLATE.read_text(encoding="utf-8")
    (DIST / "notices").mkdir()
    notice_files = {}
    for n in notices:
        rel = "notices/%s.html" % n["id"]
        (DIST / rel).write_text(notice_page(template, n, notices), encoding="utf-8")
        notice_files[rel] = n["date"]

    # Pre-fill lists, then add SEO tags to every indexable page.
    indexable = []
    for path in sorted(DIST.rglob("*.html")):
        rel = path.relative_to(DIST).as_posix()
        src = path.read_text(encoding="utf-8")
        if "/" not in rel:
            src = prerender(rel, src, notices, teachers, members, photos)
        if rel not in NOINDEX:
            src = add_seo(src, site, rel, "article" if rel in notice_files else "website", site_data)
            indexable.append(rel)
        path.write_text(src, encoding="utf-8")

    # sitemap.xml — lastmod only where it is true (notice dates).
    newest = max((n["date"] for n in notices), default=None)
    lastmod = dict(notice_files)
    if newest:
        lastmod["index.html"] = newest
        lastmod["notices.html"] = newest
    priority = {"index.html": "1.0", "notices.html": "0.9", "admission.html": "0.9"}
    urls = []
    for rel in sorted(indexable, key=lambda r: (r != "index.html", r.startswith("notices/"), r)):
        entry = "  <url>\n    <loc>%s</loc>\n" % esc(page_url(site, rel))
        if rel in lastmod:
            entry += "    <lastmod>%s</lastmod>\n" % lastmod[rel]
        entry += "    <priority>%s</priority>\n  </url>" % priority.get(rel, "0.6" if rel.startswith("notices/") else "0.7")
        urls.append(entry)
    (DIST / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s\n</urlset>\n'
        % "\n".join(urls), encoding="utf-8")
    (DIST / "robots.txt").write_text("User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % site, encoding="utf-8")

    print("Built %s" % DIST)
    print("  site address : %s" % site)
    print("  pages        : %d indexable (%d notices)" % (len(indexable), len(notice_files)))
    print("  sitemap.xml, robots.txt written")


if __name__ == "__main__":
    main()
