/* ==========================================================================
   Ghonar Chala High School — gallery.js
   Renders the photo grid on gallery.html and a hand-built, dependency-free
   lightbox for viewing full-size photos.

   Follows the news.js pattern: fetch data/gallery.json once, render, and
   redraw on the `languagechange` event that site.js's M.setLang fires.
   Loaded with `defer`, after site.js.

   The lightbox has no rules in style.css (none may be added here), so every
   visual property on it is set as an inline `style` string built from the
   theme's own CSS custom properties (--m-navy, --m-bg, --m-line, --m-radius,
   --m-shadow-lg, ...) so it matches the site in light and dark surfaces.
   Caption text is always written with `M.el`/`textContent` — never innerHTML.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var M = window.M;
  if (!M) return;

  /* ------------------------------------------------------------ Grid tiles */

  /* A short, repeating bento pattern gives a varied, masonry-ish grid out of
     plain Bootstrap columns + ratio utilities — no custom CSS needed. */
  var TILE_PATTERN = [
    { col: 'col-12 col-md-7', ratio: 'ratio-21x9' },
    { col: 'col-12 col-md-5', ratio: 'ratio-4x3' },
    { col: 'col-6 col-md-4', ratio: 'ratio-1x1' },
    { col: 'col-6 col-md-4', ratio: 'ratio-1x1' },
    { col: 'col-12 col-md-4', ratio: 'ratio-4x3' }
  ];

  function message(target, key) {
    M.clear(target);
    target.className = 'm-empty';
    target.appendChild(M.el('p', { class: 'mb-0', text: M.t(key) }));
  }

  function renderCount(countEl, n) {
    countEl.textContent = n === 1 ? M.t('gal.count1') : M.t('gal.count').replace('%N%', M.num(n));
  }

  /** One grid tile: a captioned figure whose image button opens the lightbox. */
  function buildTile(photo, index) {
    var pattern = TILE_PATTERN[index % TILE_PATTERN.length];
    var caption = M.pick(photo.caption);

    var img = M.el('img', {
      src: photo.thumb,
      alt: caption,
      loading: 'lazy',
      width: '600',
      height: '420'
    });

    var frame = M.el('div', { class: 'm-figure ratio ' + pattern.ratio }, [img]);

    var btn = M.el('button', {
      type: 'button',
      class: 'p-0 border-0 w-100 bg-transparent text-start',
      'data-gal-open': '',
      'data-gal-index': String(index),
      'aria-label': M.t('gal.open').replace('%CAPTION%', caption)
    }, [frame]);

    var figcaption = M.el('figcaption', { class: 'm-muted small mt-2 mb-0', text: caption });

    return M.el('div', { class: pattern.col }, [
      M.el('figure', { class: 'mb-0' }, [btn, figcaption])
    ]);
  }

  var photosPromise = null;

  /** Fetch data/gallery.json once per page load. */
  function loadPhotos() {
    if (!photosPromise) {
      photosPromise = fetch('data/gallery.json', { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) { return (data && data.photos) || []; });
    }
    return photosPromise;
  }

  function initGrid() {
    var grid = M.qs('[data-gal-grid]');
    if (!grid) return;
    var countEl = M.qs('[data-gal-count]');

    loadPhotos().then(function (photos) {
      var render = function () {
        if (countEl) renderCount(countEl, photos.length);

        if (!photos.length) {
          message(grid, 'gal.empty');
          return;
        }

        grid.className = 'row g-4 g-lg-5';
        M.clear(grid);
        photos.forEach(function (photo, i) {
          grid.appendChild(buildTile(photo, i));
        });

        M.qsa('[data-gal-open]', grid).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var i = parseInt(btn.getAttribute('data-gal-index'), 10) || 0;
            openLightbox(photos, i, btn);
          });
        });
      };
      render();
      document.addEventListener('languagechange', render);
    }).catch(function () {
      if (countEl) countEl.textContent = '';
      message(grid, 'gal.error');
    });
  }

  /* -------------------------------------------------------------- Lightbox */

  var CLOSE_ICON = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" width="18" height="18">'
    + '<path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/></svg>';
  var PREV_ICON = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" width="20" height="20">'
    + '<path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/></svg>';
  var NEXT_ICON = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" width="20" height="20">'
    + '<path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/></svg>';

  var CAPTION_ID = 'm-gal-caption';
  var FOCUSABLE_SEL = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  var box = {
    el: null, dialog: null, img: null, captionEl: null, posEl: null, liveEl: null,
    closeBtn: null, prevBtn: null, nextBtn: null,
    photos: [], index: 0, opener: null,
    prevHtmlOverflow: '', prevBodyOverflow: ''
  };

  function circleBtn(iconHtml, side) {
    return M.el('button', {
      type: 'button',
      class: 'm-lightbox-btn m-lightbox-' + side,
      html: iconHtml
    });
  }

  function isOpen() { return !!box.el && box.el.style.display !== 'none'; }

  /** Build the lightbox DOM once, on first use, and append it to <body>. */
  function build() {
    if (box.el) return;

    // display:none stays inline — isOpen() reads it as the open flag.
    var overlay = M.el('div', { class: 'm-lightbox-scrim', style: 'display:none' });

    var dialog = M.el('div', {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': M.t('gal.viewer'),
      'data-i18n-aria': 'gal.viewer',
      'aria-describedby': CAPTION_ID,
      tabindex: '-1',
      class: 'm-lightbox'
    });

    var stage = M.el('div', { class: 'm-lightbox-stage' });

    var img = M.el('img', { class: 'm-lightbox-img' });

    var closeBtn = circleBtn(CLOSE_ICON, 'close');
    closeBtn.setAttribute('data-i18n-aria', 'gal.close');
    closeBtn.setAttribute('aria-label', M.t('gal.close'));

    var prevBtn = circleBtn(PREV_ICON, 'prev');
    prevBtn.setAttribute('data-i18n-aria', 'gal.prev');
    prevBtn.setAttribute('aria-label', M.t('gal.prev'));

    var nextBtn = circleBtn(NEXT_ICON, 'next');
    nextBtn.setAttribute('data-i18n-aria', 'gal.next');
    nextBtn.setAttribute('aria-label', M.t('gal.next'));

    stage.appendChild(img);
    stage.appendChild(closeBtn);
    stage.appendChild(prevBtn);
    stage.appendChild(nextBtn);

    var captionBar = M.el('div', { class: 'm-lightbox-bar' });
    var captionEl = M.el('p', { id: CAPTION_ID, class: 'm-lightbox-caption' });
    var posEl = M.el('span', { class: 'm-lightbox-pos' });
    captionBar.appendChild(captionEl);
    captionBar.appendChild(posEl);

    var liveEl = M.el('div', { class: 'visually-hidden', 'aria-live': 'polite', 'aria-atomic': 'true' });

    dialog.appendChild(stage);
    dialog.appendChild(captionBar);
    dialog.appendChild(liveEl);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeLightbox();
    });
    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', function () { step(-1); });
    nextBtn.addEventListener('click', function () { step(1); });
    document.addEventListener('keydown', onKeydown);

    box.el = overlay;
    box.dialog = dialog;
    box.img = img;
    box.captionEl = captionEl;
    box.posEl = posEl;
    box.liveEl = liveEl;
    box.closeBtn = closeBtn;
    box.prevBtn = prevBtn;
    box.nextBtn = nextBtn;
  }

  function onKeydown(e) {
    if (!isOpen()) return;
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'Tab') {
      trapTab(e);
    }
  }

  function trapTab(e) {
    var nodes = M.qsa(FOCUSABLE_SEL, box.dialog).filter(function (n) {
      return !n.disabled && n.style.display !== 'none';
    });
    if (!nodes.length) return;
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /** Hide (and later restore) everything outside the lightbox from AT and Tab. */
  function setBackgroundInert(on) {
    Array.prototype.forEach.call(document.body.children, function (node) {
      if (node === box.el || node.tagName === 'SCRIPT') return;
      if (on) {
        node.setAttribute('data-gal-prev-hidden', node.hasAttribute('aria-hidden') ? node.getAttribute('aria-hidden') : '');
        node.setAttribute('aria-hidden', 'true');
        try { node.inert = true; } catch (e) { /* unsupported */ }
      } else {
        var prev = node.getAttribute('data-gal-prev-hidden');
        if (prev) node.setAttribute('aria-hidden', prev); else node.removeAttribute('aria-hidden');
        node.removeAttribute('data-gal-prev-hidden');
        try { node.inert = false; } catch (e) { /* unsupported */ }
      }
    });
  }

  function renderCurrent() {
    var photo = box.photos[box.index];
    if (!photo) return;
    var caption = M.pick(photo.caption);

    box.img.src = photo.full;
    box.img.alt = caption;
    box.captionEl.textContent = caption;

    var pos = M.t('gal.position')
      .replace('%N%', M.num(box.index + 1))
      .replace('%TOTAL%', M.num(box.photos.length));
    box.posEl.textContent = pos;
    box.liveEl.textContent = pos + (caption ? ' — ' + caption : '');

    var multi = box.photos.length > 1;
    box.prevBtn.style.display = multi ? 'inline-flex' : 'none';
    box.nextBtn.style.display = multi ? 'inline-flex' : 'none';
  }

  function step(delta) {
    var n = box.photos.length;
    if (!n) return;
    box.index = (box.index + delta + n) % n;
    renderCurrent();
  }

  function openLightbox(photos, index, opener) {
    if (!photos || !photos.length) return;
    build();

    box.photos = photos;
    box.index = index || 0;
    box.opener = opener || null;

    renderCurrent();

    box.prevHtmlOverflow = document.documentElement.style.overflow;
    box.prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    setBackgroundInert(true);
    box.el.style.display = 'flex';
    box.dialog.focus();
  }

  function closeLightbox() {
    if (!isOpen()) return;
    box.el.style.display = 'none';

    document.documentElement.style.overflow = box.prevHtmlOverflow;
    document.body.style.overflow = box.prevBodyOverflow;

    setBackgroundInert(false);

    if (box.opener && typeof box.opener.focus === 'function') box.opener.focus();
    box.opener = null;
  }

  // Keep an open lightbox's caption, position and control labels in step with
  // the rest of the site when the language toggle is used mid-view.
  document.addEventListener('languagechange', function () {
    if (isOpen()) renderCurrent();
  });

  function init() {
    initGrid();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}(window, document));
