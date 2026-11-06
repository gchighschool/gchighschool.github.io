# ঘোনার চালা উচ্চ বিদ্যালয় — ওয়েবসাইট

Static website for **ঘোনার চালা উচ্চ বিদ্যালয় / Ghonar Chala High School**
(EIIN 114612, Dhaka Education Board, established 10 January 1985, Ghonar Chala Bazar,
Kachua, Sakhipur, Tangail-1951).

Live at **https://gchighschool.edu.bd**

---

## নোটিশ কীভাবে যুক্ত করবেন (স্কুল অফিসের জন্য)

সাইটের সব তথ্য `data/` ফোল্ডারের ফাইলে রাখা আছে। GitHub-এর ওয়েবসাইট থেকেই এগুলো সম্পাদনা করা যায় —
কোনো সফটওয়্যার ইনস্টল করার দরকার নেই। পরিবর্তন সেভ (commit) করার ২–৩ মিনিটের মধ্যে
ওয়েবসাইটে দেখা যাবে।

### নতুন নোটিশ

১. GitHub-এ `data/notices.json` ফাইলটি খুলুন এবং পেন্সিল (✏️) আইকনে ক্লিক করুন।
২. `"notices": [` লেখার ঠিক পরে নিচের অংশটি বসান (নতুন নোটিশ সবার উপরে থাকবে):

```json
{
  "id": "2026-01-15-notun-notice",
  "title": "নোটিশের শিরোনাম",
  "titleEn": "Notice title in English",
  "date": "2026-01-15",
  "category": "সাধারণ",
  "pinned": false,
  "body": "নোটিশের মূল লেখা এখানে লিখুন।\n\n### বিস্তারিত\n\n- প্রথম পয়েন্ট\n- দ্বিতীয় পয়েন্ট"
},
```

৩. নিচে **Commit changes** বাটনে ক্লিক করুন।

**নিয়মগুলো মনে রাখবেন:**

| ফিল্ড | নিয়ম |
|---|---|
| `id` | প্রতিটি নোটিশের জন্য আলাদা হতে হবে। তারিখ দিয়ে শুরু করলে সুবিধা। **পুরোনো নোটিশের `id` কখনো বদলাবেন না** — বদলালে আগের শেয়ার করা লিংক নষ্ট হয়ে যাবে। |
| `date` | সবসময় `YYYY-MM-DD` ইংরেজি সংখ্যায়। ওয়েবসাইটে এটি স্বয়ংক্রিয়ভাবে বাংলায় (যেমন ১৫ জানুয়ারি ২০২৬) দেখানো হবে। |
| `category` | সাধারণ / ভর্তি / পরীক্ষা / ফলাফল / ছুটি / নিয়োগ |
| `pinned` | `true` দিলে নোটিশটি সবসময় তালিকার সবার উপরে থাকবে। |
| `body` | সাধারণ লেখা। `**গাঢ়**` দিলে **গাঢ়**, `### শিরোনাম` দিলে উপশিরোনাম, `- ` দিয়ে তালিকা। নতুন লাইনের জন্য `\n` লিখুন। `# ` (একটি হ্যাশ) ব্যবহার করবেন না। |

প্রকাশের ১৪ দিন পর্যন্ত নোটিশের পাশে স্বয়ংক্রিয়ভাবে **নতুন** ব্যাজ দেখা যাবে — এটি হাতে মুছতে হয় না।

### পিডিএফ বা ছবি সংযুক্ত করা

ফাইলটি `files/` ফোল্ডারে আপলোড করুন, তারপর নোটিশে যোগ করুন:

```json
"attachment": { "url": "files/bhorti-2026.pdf", "label": "ভর্তি বিজ্ঞপ্তি (পিডিএফ)" }
```

### অন্যান্য তথ্য

| কী বদলাতে চান | কোন ফাইল |
|---|---|
| শিক্ষকমণ্ডলীর তালিকা | `data/teachers.json` |
| পরিচালনা পর্ষদ | `data/committee.json` |
| ফটো গ্যালারি | `data/gallery.json` |
| ঠিকানা, ফোন, ইমেইল | `data/site.json` **এবং** সংশ্লিষ্ট HTML পাতা |

> ⚠️ কমা (`,`), উদ্ধৃতি চিহ্ন (`"`) আর বন্ধনী ঠিক জায়গায় আছে কিনা দেখে নেবেন — একটি ভুল কমাও
> পুরো নোটিশ তালিকা লোড হতে বাধা দিতে পারে।

---

## Developer notes

### Stack

Plain static HTML + Bootstrap 5.3.3 (CDN) + vanilla JavaScript. **No build step, no npm,
no framework.** Every committed file is served as-is. Deployment is
`.github/workflows/static.yml`, which uploads the repository root to GitHub Pages.

`marked` and `DOMPurify` are self-hosted in `assets/vendor/` with the version pinned in the
filename — upgrading is a visible one-line diff and there is no third CDN origin on the
critical path.

### Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

A real HTTP origin is required — `fetch()` will not read the JSON files over `file://`.

### Layout

```
*.html              pages (header/footer duplicated on purpose — see below)
partials/           canonical header/footer source
assets/css/site.css the only stylesheet, loaded after Bootstrap
assets/js/          site.js (shared) + one script per page
assets/vendor/      pinned marked + DOMPurify
assets/img/         brand, optimized sliders, gallery derivatives
data/               all editable content
files/              notice attachments
images/             ORIGINAL uploads — kept as the source for tools/make-images.sh
tools/              maintenance scripts (never run at deploy time)
```

### Why the header and footer are duplicated in every page

They must be present for crawlers and must render with JavaScript disabled, so they are real
markup in each file rather than injected at runtime. To keep the copies identical:

```bash
python3 tools/sync-partials.py          # rewrite every page from partials/
python3 tools/sync-partials.py --check  # exit 1 if any page has drifted
```

Edit `partials/header.html` / `partials/footer.html`, then run the sync — never edit the
region between `<!-- gc:header:start -->` and `<!-- gc:header:end -->` by hand.

The active navigation item is pure CSS, driven by `<body data-page="…">`, so it is correct
before JavaScript runs. `site.js` only adds `aria-current` for screen readers.

### Before committing

```bash
python3 tools/validate-data.py     # JSON syntax, required fields, unique ids,
                                   # ISO dates, attachments exist, phone numbers
                                   # in the HTML match data/site.json
python3 tools/sync-partials.py --check
```

### Regenerating images

Originals live in `images/`. After adding one there:

```bash
bash tools/make-images.sh
```

This writes optimized slider widths (WebP + JPEG), gallery thumbnails, and the Open Graph
card, all of which are **committed**. The OG card is drawn by `tools/make-og-cover.py` using
Pillow — ImageMagick's `-annotate` cannot shape Bengali conjuncts and produces malformed text.

Requires ImageMagick and Pillow built with Raqm.

### Conventions

- `<html lang="bn">`; English runs are wrapped in `<span lang="en">`.
- **Bangla digits** for dates, counts and pagination (via `GC.bnNum` / `GC.formatDate`).
  **Latin digits** for EIIN, phone numbers and email — those must stay searchable and dialable,
  and `<time datetime="…">` always carries the ISO value.
- Text is written to the DOM with `textContent`, never string-concatenated into `innerHTML`.
  The only exception is sanitized Markdown on `notice-view.html`.
- Exactly one `<h1>` per page.
- **Never put `height: 100%` on `.gc-card`.** In a Bootstrap column that also
  contains a heading, a percentage height resolves against the whole column and the
  card overflows by exactly the heading's height. For equal-height cards, add
  Bootstrap's `h-100` when the card is the column's only child, or put
  `gc-col-fill` on the column when it is not.

---

## Open items for the school

1. **Phone numbers.** `01309-114612` is confirmed (it appears both on the previous site and
   first on the school's own 2025 admission banner). The banner also lists `01916-251019`,
   `01727-274709` and `01719-989264`, whereas the old website listed `01966-824398`. The site
   currently shows `01309-114612` and `01966-824398` — please confirm which are current.
2. **Official emblem.** The school's admission banner carries a real circular seal
   (“EIIN NO: 114612 — সখিপুর, টাঙ্গাইল”). The site currently uses a clean SVG monogram
   (`assets/img/mark.svg`, `assets/img/logo.svg`, `favicon.svg`) as a stand-in. Supply the
   emblem as a high-resolution PNG or SVG and replace those three files.
3. **Teacher and committee rosters.** Only the headmaster and the committee president are
   listed, because those are the only names on record. Add the rest to
   `data/teachers.json` and `data/committee.json`.
4. **Student/teacher counts** for the homepage statistics strip, if the school wants them shown.
