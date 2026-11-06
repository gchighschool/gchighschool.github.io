# DESIGN.md — ঘোনার চালা উচ্চ বিদ্যালয়

Direction: **photo-first, plain.** The school's own photos and crest carry the identity.
Everything else stays quiet and practical, like a site a careful local designer built for
parents, students and the school office. If a choice exists only to look "designed", drop it.

## Taste parameters
| Lever | Value | Meaning |
|---|---|---|
| BOLD (design variance) | 3 / 10 | Conventional, familiar layout. The photos are the only big gesture. |
| MOTION (intensity) | 1 / 10 | Slider change and link underline only. No reveals, lifts, parallax. |
| DENSITY (visual density) | 6 / 10 | Information-first: notices, dates, phone numbers visible without hunting. |

## Banned (these read as AI-generated)
- Invented slogans or marketing headlines. Headings are plain labels: নোটিশ, ভর্তি, পরিচিতি, শিক্ষকমণ্ডলী, গ্যালারি, যোগাযোগ.
- Small eyebrow/kicker labels above headings; thick rules under every heading.
- Monospace for dates/numbers; dotted-leader fact rows; ০১/০২/০৩ numbered rows; drop caps.
- Stat tiles / big-number strips; icon-in-tinted-square tiles; emoji.
- Gradients, gradient text, glass, glows, shadows, hover lifts, pill buttons.
- Serif display faces. Over-polished symmetry for its own sake.

## Colour tokens (exact)
| Token | Hex | Use |
|---|---|---|
| `--text` | `#1B1F1D` | Body and headings |
| `--muted` | `#5A625E` | Dates, captions (6.3:1 on white) |
| `--bg` | `#FFFFFF` | Page |
| `--bg-alt` | `#F3F4F2` | Alternate sections, map placeholder |
| `--border` | `#DCDFDC` | Dividers, box borders |
| `--green` | `#1D6B3C` | Uniform green: header bar, buttons, links |
| `--green-dark` | `#14502C` | Hover, footer |
| `--red` | `#C0322B` | From the crest: "নতুন"/pinned tag only |

## Typography
One family: **Hind Siliguri** (Bengali + Latin).
| Role | Size / line-height | Weight |
|---|---|---|
| School name (header) | 26 / 1.25 (mobile 20) | 700 |
| H2 section label | 24 / 1.3 (mobile 21) | 700 |
| H3 | 18 / 1.4 | 600 |
| Body | 17 / 1.7 | 400 |
| Small (dates, captions) | 14 / 1.5 | 400 |

## Spacing, radius, borders
- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64. Sections 56px apart (mobile 40).
- Content max-width 1180px; gutter 24px (mobile 16px).
- Radius: 6px on boxes, buttons and photos. Borders 1px `--border`. No shadows.

## Components
- **Header**: white; crest 56px + name + English name under it; phone on the right. Below it, a solid `--green` menu bar with white links; active item underlined.
- **Hero**: one real photo, full width of the container, 480px tall (mobile 240), prev/next buttons, one-line caption below the photo (not on top).
- **Button**: `--green` bg, white text, 6px radius, 10×18 padding, min-height 44px. Secondary: 1px `--green` border, green text.
- **Notice row**: date (plain text, `--muted`) on its own line above the title; "নতুন" tag in `--red` for pinned.
- **Person**: real photo (or plain grey box with "ছবি" until supplied), name, designation, short message.

## Accessibility (non-negotiable)
- Hit targets ≥ 24×24px; ≥ 44×44px on mobile.
- Never `user-scalable=no` or `maximum-scale`.
- Any async action (loading more notices, submitting a form) shows a spinner while pending and is disabled meanwhile.
- Text ≥ 4.5:1; real `<a href>` / `<button>`; `aria-label` on icon-only buttons.

## Feature inventory (merged from original / root / modern / new)
| Feature | From |
|---|---|
| Crest + bilingual name header, phone visible | root, modern |
| বাং / EN switch | modern |
| Photo slider with captions | original, root |
| Notice board (pinned tag, category, detail page with markdown body) | root |
| Admission 2026 box with the real admission poster | new, modern |
| Short about with real facts (1985, 1988, EIIN, board, classes, departments) | all |
| Headmaster + president with messages | original, new |
| Quick links (ফলাফল, শিক্ষক, পর্ষদ) | root |
| Gallery | root, new |
| Contact + Google map | all |
