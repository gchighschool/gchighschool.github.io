/* ==========================================================================
   ঘোনার চালা উচ্চ বিদ্যালয় — site.js
   Shared helpers + chrome behaviour. Loaded with `defer` on every page.
   Exposes a single global: window.GC
   ========================================================================== */
(function (window, document) {
  'use strict';

  var GC = {};

  /* ---------------------------------------------------------- DOM helpers */

  GC.qs  = function (sel, root) { return (root || document).querySelector(sel); };
  GC.qsa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /**
   * Build an element. Text is always set via textContent, never innerHTML —
   * this is what prevents notice titles containing < & " from breaking markup.
   */
  GC.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;         // callers must pass sanitized HTML
        else if (k.indexOf('data-') === 0 || k.indexOf('aria-') === 0) node.setAttribute(k, v);
        else if (k in node) node[k] = v;
        else node.setAttribute(k, v);
      });
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  };

  GC.clear = function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); };

  /* ------------------------------------------------------ Numbers & dates */

  var BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  var BN_MONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন',
                   'জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

  /**
   * Latin digits -> Bangla digits.
   * Used for dates, counts and pagination — NOT for EIIN, phone numbers or
   * emails, which stay Latin so they remain searchable and dialable.
   */
  GC.bnNum = function (value) {
    return String(value).replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  };

  // Detect whether this engine's ICU actually produces Bangla digits.
  var hasBnICU = (function () {
    try {
      return /[০-৯]/.test(new Intl.DateTimeFormat('bn-BD', { day: 'numeric' }).format(new Date(2020, 0, 5)));
    } catch (e) { return false; }
  }());

  /** ISO "2025-08-30" -> "৩০ আগস্ট ২০২৫" */
  GC.formatDate = function (iso) {
    if (!iso) return '';
    var parts = String(iso).split('-');
    var d = new Date(+parts[0], (+parts[1] || 1) - 1, +parts[2] || 1);
    if (isNaN(d.getTime())) return iso;
    if (hasBnICU) {
      try {
        return new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
      } catch (e) { /* fall through */ }
    }
    return GC.bnNum(d.getDate()) + ' ' + BN_MONTHS[d.getMonth()] + ' ' + GC.bnNum(d.getFullYear());
  };

  /** <time datetime="2025-08-30">৩০ আগস্ট ২০২৫</time> */
  GC.timeEl = function (iso) {
    return GC.el('time', { datetime: iso, text: GC.formatDate(iso) });
  };

  /** A notice is "new" for 14 days. Derived, never stored. */
  GC.isNew = function (iso, days) {
    var t = Date.parse(iso);
    if (isNaN(t)) return false;
    return (Date.now() - t) < (days || 14) * 86400000 && t <= Date.now();
  };

  /* -------------------------------------------------------- Data fetching */

  /**
   * Fetch JSON with a timeout, one retry, and a session-scoped last-good copy.
   * The cache can only ever hold data that came from the real file, so unlike
   * a hardcoded fallback array it cannot drift out of sync.
   */
  GC.getJSON = function (url) {
    var key = 'gc:' + url;

    function attempt(reload) {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
      var opts = { signal: ctrl ? ctrl.signal : undefined };
      if (reload) opts.cache = 'reload';
      return fetch(url, opts).then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      });
    }

    return attempt(false)
      .catch(function () { return attempt(true); })
      .then(function (data) {
        try { sessionStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
        return { data: data, stale: false };
      })
      .catch(function (err) {
        var cached = null;
        try { cached = sessionStorage.getItem(key); } catch (e) {}
        if (cached) {
          try { return { data: JSON.parse(cached), stale: true }; } catch (e) {}
        }
        throw err;
      });
  };

  /* ------------------------------------------------------- Standard states */

  GC.stateLoading = function (message) {
    return GC.el('div', { class: 'gc-state' }, [
      GC.el('div', { class: 'spinner-border text-secondary', role: 'status' }, [
        GC.el('span', { class: 'visually-hidden', text: 'লোড হচ্ছে…' })
      ]),
      GC.el('p', { class: 'mt-3 mb-0', text: message || 'তথ্য লোড হচ্ছে…' })
    ]);
  };

  GC.stateEmpty = function (message) {
    return GC.el('div', { class: 'gc-state' }, [
      GC.el('i', { class: 'bi bi-inbox', 'aria-hidden': 'true' }),
      GC.el('p', { class: 'mb-0', text: message || 'কোনো তথ্য পাওয়া যায়নি।' })
    ]);
  };

  /** Honest failure: says what happened, offers a retry and an out-of-band channel. */
  GC.stateError = function (onRetry, dataUrl) {
    var actions = GC.el('div', { class: 'mt-3 d-flex flex-wrap gap-2 justify-content-center' });
    if (onRetry) {
      var btn = GC.el('button', { type: 'button', class: 'btn btn-sm btn-primary', text: 'আবার চেষ্টা করুন' });
      btn.addEventListener('click', onRetry);
      actions.appendChild(btn);
    }
    actions.appendChild(GC.el('a', {
      class: 'btn btn-sm btn-outline-primary',
      href: 'https://facebook.com/ghonarchalahighschoolofficial/',
      rel: 'noopener', target: '_blank',
      text: 'ফেসবুক পেজ দেখুন'
    }));
    if (dataUrl) {
      actions.appendChild(GC.el('a', { class: 'btn btn-sm btn-outline-secondary', href: dataUrl, text: 'মূল ডেটা ফাইল' }));
    }
    return GC.el('div', { class: 'gc-state gc-state--error' }, [
      GC.el('i', { class: 'bi bi-exclamation-triangle', 'aria-hidden': 'true' }),
      GC.el('p', { class: 'mb-0', text: 'তথ্য লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।' }),
      actions
    ]);
  };

  GC.staleBanner = function () {
    return GC.el('div', { class: 'alert alert-warning py-2 px-3 small mb-3', role: 'status' }, [
      GC.el('i', { class: 'bi bi-wifi-off me-2', 'aria-hidden': 'true' }),
      'সংরক্ষিত সংস্করণ দেখানো হচ্ছে — সর্বশেষ তথ্যের জন্য পৃষ্ঠাটি রিফ্রেশ করুন।'
    ]);
  };

  /**
   * Load JSON into a mount point with loading / error / empty handling.
   * Every JSON-driven page on the site goes through this.
   */
  GC.render = function (opts) {
    var mount = typeof opts.mount === 'string' ? GC.qs(opts.mount) : opts.mount;
    if (!mount) return;

    function run() {
      GC.clear(mount);
      mount.appendChild(GC.stateLoading(opts.loadingMessage));
      GC.getJSON(opts.url).then(function (result) {
        GC.clear(mount);
        if (result.stale) mount.appendChild(GC.staleBanner());
        opts.onData(result.data, mount);
      }).catch(function (err) {
        if (window.console) console.error('[GC] ' + opts.url, err);
        GC.clear(mount);
        mount.appendChild(GC.stateError(run, opts.url));
      });
    }
    run();
  };

  /* ------------------------------------------------------ Text utilities */

  /** NFC-normalise so Bangla typed on one keyboard matches text pasted from another. */
  GC.norm = function (s) {
    s = String(s || '').toLowerCase();
    return s.normalize ? s.normalize('NFC') : s;
  };

  GC.initials = function (name) {
    var t = String(name || '').trim();
    return t ? t.charAt(0) : '?';
  };

  /* ------------------------------------------------------- Chrome behaviour */

  function markActiveNav() {
    var page = document.body.getAttribute('data-page');
    if (!page) return;
    // notice-view shares the "notices" nav item.
    var target = page === 'notice-view' ? 'notices' : page;
    var link = GC.qs('.gc-nav [data-nav="' + target + '"]');
    if (link) link.setAttribute('aria-current', 'page');
  }

  function setFooterYear() {
    GC.qsa('[data-year]').forEach(function (n) {
      n.textContent = GC.bnNum(new Date().getFullYear());
    });
  }

  function initBackToTop() {
    var btn = GC.qs('.gc-top');
    if (!btn) return;
    function toggle() { btn.classList.toggle('is-visible', window.scrollY > 400); }
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    toggle();
  }

  /** WCAG 2.2.2 — never auto-advance for someone who asked for reduced motion. */
  function initCarousel() {
    var root = GC.qs('#gcHero');
    if (!root || !window.bootstrap) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var carousel = window.bootstrap.Carousel.getOrCreateInstance(root);
    if (reduce) carousel.pause();

    var toggle = GC.qs('[data-carousel-toggle]');
    if (!toggle) return;
    var playing = !reduce;
    function paint() {
      toggle.innerHTML = '';
      toggle.appendChild(GC.el('i', { class: 'bi ' + (playing ? 'bi-pause-fill' : 'bi-play-fill'), 'aria-hidden': 'true' }));
      toggle.setAttribute('aria-label', playing ? 'স্লাইড থামান' : 'স্লাইড চালু করুন');
    }
    toggle.addEventListener('click', function () {
      playing = !playing;
      if (playing) carousel.cycle(); else carousel.pause();
      paint();
    });
    paint();
  }

  function init() {
    markActiveNav();
    setFooterYear();
    initBackToTop();
    initCarousel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.GC = GC;
}(window, document));
