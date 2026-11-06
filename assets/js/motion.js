/* ==========================================================================
   Ghonar Chala High School — motion.js
   Motion & polish layer: scroll reveal + stat count-up. Everything else in
   the brief (card/button hover, ken-burns, header/nav/lang transitions)
   is pure CSS and lives in anim.css — it needs no JS to work.

   Loaded with `defer`. Works whether it lands before or after news.js —
   the notice lists render asynchronously either way, and the reveal
   scanner re-runs on the `languagechange` event and via a MutationObserver,
   so newly-inserted notice rows are always picked up.

   SAFETY CONTRACT: this file may only ever *reveal* content, never hide it
   for longer than intended. `html.m-motion` — the class anim.css keys its
   one hidden-state rule off — is added ONLY here, ONLY after confirming
   IntersectionObserver exists and the visitor hasn't asked for reduced
   motion. If this script fails to load, throws, or is blocked, that class
   is never added and nothing in anim.css is ever hidden.

   Deliberately self-contained: does not depend on window.M (site.js's
   global). That keeps this file safe to load in any order relative to
   site.js/news.js, and matches the "shares nothing" convention those files
   already use for the theme's assets.
   ========================================================================== */
(function (window, document) {
  'use strict';

  /* ----------------------------------------------------- Feature checks */

  var reduceMotion = false;
  try {
    reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { reduceMotion = false; }

  var hasIO = 'IntersectionObserver' in window;

  var raf = window.requestAnimationFrame || function (cb) {
    return window.setTimeout(function () { cb(new Date().getTime()); }, 16);
  };

  /* ------------------------------------------------------- DOM helpers */

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* ========================================================================
     Scroll reveal
     ======================================================================== */

  var REVEAL_SELECTORS = [
    '.m-section-head', '.m-card', '.m-stat', '.m-steps li', '.m-figure',
    '.m-notice', '.m-hero-body > *', '.m-facts', '.m-contact-list li'
  ];

  var STAGGER_MS = 70;
  var STAGGER_MAX_STEPS = 6; // long notice lists shouldn't queue for a full second

  function initReveal() {
    // Reduced motion, or no IntersectionObserver: leave the page exactly as
    // authored. `html.m-motion` is never added, so anim.css's hidden-state
    // rule never applies to anything — nothing to reveal, nothing hidden.
    if (reduceMotion || !hasIO) return;

    document.documentElement.className += ' m-motion';

    var io = new IntersectionObserver(onIntersect, {
      threshold: 0.12,
      // Trigger a touch before the element's edge actually reaches the
      // viewport edge, so the reveal reads as timed with the scroll rather
      // than lagging behind it.
      rootMargin: '0px 0px -6% 0px'
    });

    function onIntersect(entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        el.className += ' m-reveal-in';
        if (hasClass(el, 'm-stat')) countUpStat(el);
      });
    }

    function hasClass(el, name) {
      return (' ' + el.className + ' ').indexOf(' ' + name + ' ') !== -1;
    }

    // Bootstrap grid columns (.col, .col-md-4, .col-lg-4, …) sit between a
    // card/stat and the row that actually groups its siblings for layout —
    // stagger relative to that row, or every card/stat ends up "alone" and
    // nothing appears staggered at all.
    function groupParent(el) {
      var p = el.parentElement;
      if (p && /(^|\s)col(-\S+)?(\s|$)/.test(p.className)) return p.parentElement || p;
      return p;
    }

    function tag(el, delay) {
      el.__mRevealed = true;
      el.className += ' m-reveal';
      if (delay) el.style.transitionDelay = delay + 'ms';
      io.observe(el);
    }

    function scan() {
      REVEAL_SELECTORS.forEach(function (sel) {
        var lastParent = null;
        var i = 0;
        qsa(sel).forEach(function (el) {
          if (el.__mRevealed) return; // already tagged on a previous scan
          var parent = groupParent(el);
          if (parent !== lastParent) { lastParent = parent; i = 0; }
          tag(el, Math.min(i, STAGGER_MAX_STEPS) * STAGGER_MS);
          i++;
        });
      });
    }

    scan();

    // The dictionary swap (`languagechange`) doesn't touch static markup,
    // but news.js fully re-renders notice lists on it — new nodes, so a
    // fresh scan is needed to tag and observe them.
    document.addEventListener('languagechange', scan);

    // Belt-and-suspenders for the same case: notices also arrive the first
    // time purely from an async fetch, with no languagechange involved.
    if ('MutationObserver' in window) {
      var queued = false;
      var mo = new MutationObserver(function () {
        if (queued) return;
        queued = true;
        window.setTimeout(function () { queued = false; scan(); }, 30);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }

    // No blanket "reveal everything after N seconds" fallback here on
    // purpose: IntersectionObserver already reveals anything in view at
    // load (near-instantly) and anything scrolled to later, for as long as
    // it stays observed — a timed fallback would instead force-reveal
    // still-below-the-fold content the visitor hasn't scrolled to yet,
    // defeating the point of a scroll reveal for anyone who pauses on the
    // page. Nothing here can leave content hidden forever: worst case for
    // an element that never intersects is that it never has to be shown.
  }

  /* ========================================================================
     Stat count-up
     Counts a .m-stat-value up from 0 the first time its .m-stat wrapper is
     revealed. Only ever touches values that are PURELY digits (Latin or
     Bangla) — "Six – Ten" / "ষষ্ঠ – দশম" and the like are left completely
     untouched, in whatever script they happen to be in.
     ======================================================================== */

  var BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  var RE_ASCII_DIGITS = /^[0-9]+$/;
  var RE_BN_DIGITS = /^[০-৯]+$/;
  var RE_BN_DIGIT = /[০-৯]/g;
  var RE_ASCII_DIGIT = /[0-9]/g;

  function toBnDigits(n) {
    return String(n).replace(RE_ASCII_DIGIT, function (d) { return BN_DIGITS[+d]; });
  }
  function fromBnDigits(s) {
    return s.replace(RE_BN_DIGIT, function (d) { return String(BN_DIGITS.indexOf(d)); });
  }

  function countUpStat(statEl) {
    var valueEl = statEl.querySelector ? statEl.querySelector('.m-stat-value') : null;
    if (!valueEl || valueEl.__mCounted) return;
    valueEl.__mCounted = true;

    var original = valueEl.textContent;
    var trimmed = original.replace(/^\s+|\s+$/g, '');
    var bangla = RE_BN_DIGITS.test(trimmed);
    var latin = RE_ASCII_DIGITS.test(trimmed);
    if (!bangla && !latin) return; // not a pure number — leave exactly as authored

    var target = parseInt(bangla ? fromBnDigits(trimmed) : trimmed, 10);
    if (!isFinite(target)) return; // guard against anything unexpected

    var duration = 1100;
    var startTime = null;

    function frame(ts) {
      if (startTime === null) startTime = ts;
      var p = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      var current = Math.round(eased * target);
      valueEl.textContent = bangla ? toBnDigits(current) : String(current);
      if (p < 1) {
        raf(frame);
      } else {
        valueEl.textContent = original; // restore the exact authored string
      }
    }
    raf(frame);
  }

  /* --------------------------------------------------------------- Init */

  function init() {
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window, document));
