# ঘোনার চালা উচ্চ বিদ্যালয় — ওয়েবসাইট

Static website for **ঘোনার চালা উচ্চ বিদ্যালয় / Ghonar Chala High School**
(EIIN 114612, Dhaka Education Board, established 10 January 1985, Ghonar Chala Bazar,
Kachua, Sakhipur, Tangail-1951).

Live at **https://gchighschool.edu.bd** — বাংলা ও English, দুই ভাষাতেই।

---

## স্কুল অফিসের জন্য: তথ্য কীভাবে বদলাবেন

সাইটের সব তালিকা `data/` ফোল্ডারের ফাইলে আছে। GitHub-এর ওয়েবসাইট থেকেই সম্পাদনা করা যায় —
কোনো সফটওয়্যার লাগে না। **Commit changes** চাপার পর ২–৩ মিনিটে সাইটে দেখা যাবে।

### নতুন নোটিশ (`data/notices.json`)

ফাইলটি খুলে পেন্সিল (✏️) আইকনে চাপুন। `"notices": [` লেখার ঠিক পরে নিচের অংশটি বসান
(নতুন নোটিশ সবার উপরে বসাবেন, শেষে কমা `,` রাখবেন):

```json
{
  "id": "4",
  "date": "2026-01-15",
  "pinned": false,
  "category": { "bn": "সাধারণ", "en": "General" },
  "title":    { "bn": "নোটিশের শিরোনাম", "en": "Notice title" },
  "summary":  { "bn": "এক-দুই বাক্যের সারসংক্ষেপ।", "en": "One or two sentences." },
  "body": [
    { "type": "p",
      "bn": ["নোটিশ ", { "b": "২০ জানুয়ারি" }, " থেকে কার্যকর।"],
      "en": ["Effective from ", { "b": "20 January" }, "."] },
    { "type": "h", "bn": "বিস্তারিত", "en": "Details" },
    { "type": "list",
      "bn": [[{ "b": "সময়" }, ": সকাল ৯টা"], [{ "b": "স্থান" }, ": মূল ভবন"]],
      "en": [[{ "b": "Time" }, ": 9:00 am"], [{ "b": "Venue" }, ": Main building"]] }
  ]
},
```

**নিয়ম:**

| ফিল্ড | নিয়ম |
|---|---|
| `id` | প্রতিটি নোটিশের আলাদা হতে হবে — শুধু ইংরেজি অক্ষর, সংখ্যা, `-`। এটাই নোটিশের ঠিকানা: `id` `4` হলে `…/notices/4.html`। **পুরোনো নোটিশের `id` কখনো বদলাবেন না**, বদলালে শেয়ার করা লিংক নষ্ট হবে। |
| `date` | `2026-01-15` — বছর-মাস-তারিখ। |
| `pinned` | `true` দিলে নোটিশ সবসময় সবার উপরে থাকে। |
| `title`, `category`, `summary` | `bn` ও `en` — দুটোই লিখতে হবে। |
| `body` | অনুচ্ছেদ (`p`), শিরোনাম (`h`), তালিকা (`list`)। **গাঢ়** লেখা: `{ "b": "লেখা" }`। |

> **ভুল হলে কী হবে?** কমা বা কোটেশন চিহ্ন ভুল হলে GitHub-এর **Actions** ট্যাবে লাল ✗ দেখাবে এবং
> কোন ফাইলের কোন জায়গায় ভুল তা বাংলা-ইংরেজিতে লেখা থাকবে। ভুল থাকা অবস্থায় সাইট বদলায় না —
> আগের ঠিক সংস্করণটিই চালু থাকে। ঠিক করে আবার commit করলেই হবে।

### শিক্ষক, পরিচালনা পর্ষদ

`data/teachers.json` ও `data/committee.json` — আগের এন্ট্রির মতো নতুন এন্ট্রি যোগ করুন।
`name`, `designation`, `subject`, `note` প্রতিটিতে `bn` ও `en` লাগবে। ছবি না থাকলে `"photo": ""` রাখুন —
নামের আদ্যক্ষর দেখাবে। ছবি দিতে চাইলে `assets/img/` এ আপলোড করে পথটি লিখুন।

### গ্যালারির ছবি

১. মূল ছবি (`.jpg`) `images/` ফোল্ডারে রাখুন।
২. কম্পিউটারে `bash tools/make-gallery.sh` চালান (ImageMagick লাগে) — ছোট ও বড় সংস্করণ তৈরি হবে।
৩. `data/gallery.json`-এ একটি এন্ট্রি যোগ করুন (ফাইলের উপরের নোট দেখুন)।

### যোগাযোগের তথ্য (ফোন, ঠিকানা)

ফোন/ঠিকানা সাইটের পাতাগুলোতে (`contact.html`, ফুটার) লেখা আছে এবং সার্চ ইঞ্জিনের জন্য
`data/site.json`-এও আছে। বদলাতে হলে **দুই জায়গাতেই** বদলাতে হবে।

---

## For developers

```
index.html, about.html, …   the pages (plain HTML, Bootstrap 5 + custom theme)
assets/css, assets/js       theme, language switch (BN/EN), notice/people/gallery renderers
assets/img                  logo, icons, hero and gallery images, og-cover.jpg (share card)
data/                       notices, teachers, committee, gallery, site facts (JSON)
tools/                      build + helper scripts (never published)
tools/templates/notice.html template for the per-notice pages
images/                     original photos and crest sources (never published)
_archive/                   the previous site designs, kept for reference (never published)
CNAME                       custom domain
```

**How publishing works.** Pushing to `main` runs `.github/workflows/static.yml`, which runs
`python3 tools/build.py` and deploys the `dist/` folder it produces.

The build:

1. validates `data/*.json` (`tools/validate-data.py`) and stops on any problem;
2. writes one real page per notice at `dist/notices/<id>.html`;
3. fills the notice list, teacher/committee cards and gallery into the HTML, so search
   engines and Facebook/WhatsApp previews see the content without running JavaScript
   (the browser script redraws identical markup, so nothing jumps);
4. adds `canonical`, Open Graph/Twitter tags and schema.org JSON-LD to every indexable page;
5. writes `sitemap.xml` and `robots.txt`; the site address is read from `CNAME`.

Pages work without the build too — open `index.html` from any static server and the JavaScript
fills in the lists. `dist/` is git-ignored.

```bash
python3 tools/build.py                 # build into dist/
python3 -m http.server -d dist 8000    # preview the built site
python3 tools/validate-data.py         # data check only
python3 tools/make-og-cover.py         # regenerate the 1200x630 share image
python3 tools/fix-crest-text.py        # re-set the crest lettering (images/crest/)
python3 tools/make-logo.py             # regenerate logo + icons from the crest
```

Python 3.10+ with Pillow (built with Raqm for Bengali shaping), NumPy and SciPy is needed only
for the logo/crest scripts; `build.py` and `validate-data.py` use the standard library only.

**Old links.** `notice-view.html?id=N` (the previous site's notice address) redirects to
`notices/N.html`. `notices.html` and `admission.html` keep the same addresses as before.

**Domain.** DNS for `gchighschool.edu.bd` must point at GitHub Pages (four `A` records:
`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`; `www` as `CNAME` to
`gchighschool.github.io`) with "Enforce HTTPS" on in the repo's Pages settings.
