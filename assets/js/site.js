/* ==========================================================================
   Ghonar Chala High School — site.js
   One file: i18n engine, chrome behaviour, inline icons, notice rendering.
   Loaded with `defer` on every page. Exposes a single global: window.M
   Self-contained — shares nothing with the root design's assets/js/.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var M = {};
  var LANG_KEY = 'gc-modern-lang';
  var DEFAULT_LANG = 'bn';   // Bangla-first: English is the opt-in, not the default

  /* ---------------------------------------------------------- DOM helpers */

  M.qs = function (sel, root) { return (root || document).querySelector(sel); };
  M.qsa = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /**
   * Build an element. Text always goes through textContent — never innerHTML —
   * so a notice title containing < & " can never break markup or inject
   * anything. `html` is accepted only for the hand-authored icon strings below.
   */
  M.el = function (tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;   // icons only, authored here
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

  M.clear = function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); };

  /* ---------------------------------------------------------------- Icons */

  var ICONS = {
    phone: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58z"/></svg>',
    mail: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/></svg>',
    pin: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>',
    clock: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/></svg>',
    facebook: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/></svg>',
    arrowRight: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/></svg>',
    arrowUp: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5"/></svg>',
    menu: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" width="22" height="22"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/></svg>',
    book: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/></svg>',
    people: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.63 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/></svg>',
    award: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M9.669.864 8 0 6.331.864l-1.858.282-.842 1.68-1.337 1.32L2.6 6l-.306 1.854 1.337 1.32.842 1.68 1.858.282L8 12l1.669-.864 1.858-.282.842-1.68 1.337-1.32L13.4 6l.306-1.854-1.337-1.32-.842-1.68zm1.196 1.193.684 1.365 1.086 1.072L12.387 6l.248 1.506-1.086 1.072-.684 1.365-1.51.229L8 10.874l-1.355-.702-1.51-.229-.684-1.365-1.086-1.072L3.614 6l-.25-1.506 1.087-1.072.684-1.365 1.51-.229L8 1.126l1.356.702z"/><path d="M4 11.794V16l4-1 4 1v-4.206l-2.018.306L8 13.126 6.018 12.1z"/></svg>',
    calendar: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/></svg>',
    flask: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6.5 1a.5.5 0 0 0 0 1h.5v2.5a1 1 0 0 1-.146.522L1.884 12.63A1.5 1.5 0 0 0 3.166 15h9.668a1.5 1.5 0 0 0 1.282-2.37L9.146 5.022A1 1 0 0 1 9 4.5V2h.5a.5.5 0 0 0 0-1zM8 2v2.5c0 .37.103.733.297 1.048L10.2 8.5H5.8l1.903-2.952A2 2 0 0 0 8 4.5V2zm-2.845 7.5h5.69l2.44 3.786a.5.5 0 0 1-.428.79H3.143a.5.5 0 0 1-.427-.79z"/></svg>',
    briefcase: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v8A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-8A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1zM6 2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V3H6zM1.5 4h13a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5"/></svg>',
    globe: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m7.5-6.923c-.67.204-1.335.82-1.887 1.855A8 8 0 0 0 5.145 4H7.5zM4.09 4a9.3 9.3 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.03 7.03 0 0 0 2.255 4zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a7 7 0 0 0-.656 2.5zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5zm3.653 0v2.5h2.99a12.5 12.5 0 0 0-.337-2.5zM5.145 12q.208.58.468 1.068c.552 1.035 1.218 1.65 1.887 1.855V12zm.182 2.472a7 7 0 0 1-.597-.933A9.3 9.3 0 0 1 4.09 12H2.255a7 7 0 0 0 3.072 2.472M3.82 11a13.7 13.7 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5zm6.853 3.472A7 7 0 0 0 13.745 12H11.91a9.3 9.3 0 0 1-.64 1.539 7 7 0 0 1-.597.933M8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855q.26-.487.468-1.068zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.7 13.7 0 0 1-.312 2.5m-.653-8.472c.218.284.418.598.597.933A9.3 9.3 0 0 1 11.91 4h1.835a7 7 0 0 0-3.072-2.472zM10.855 4a8 8 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4zM11.49 8.5c-.03.877-.138 1.718-.312 2.5H8.5V8.5zm-3.99 0V11H4.822A12.5 12.5 0 0 1 4.51 8.5z"/></svg>',
    file: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5zM4.5 7a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z"/></svg>'
  };

  /** Returns the raw SVG string for an icon name, or '' if unknown. */
  M.icon = function (name) { return ICONS[name] || ''; };

  /** Returns a <span> wrapping the icon SVG. */
  M.iconEl = function (name, cls) {
    return M.el('span', { class: cls || '', html: ICONS[name] || '', 'aria-hidden': 'true' });
  };

  /* ------------------------------------------------------- Numbers & dates */

  var BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  var BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                   'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  var BN_MONTHS_SHORT = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                         'জুলাই', 'আগস্ট', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে'];
  var EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
  var EN_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /**
   * Latin digits -> Bangla digits. Applied to dates and counts only — never to
   * EIIN, phone numbers or e-mail, which stay Latin so they stay dialable.
   */
  M.bnNum = function (value) {
    return String(value).replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  };

  /** Latin digits in the current language. */
  M.num = function (value) {
    return M.lang === 'bn' ? M.bnNum(value) : String(value);
  };

  function parseISO(iso) {
    var parts = String(iso || '').split('-');
    var d = new Date(+parts[0], (+parts[1] || 1) - 1, +parts[2] || 1);
    return isNaN(d.getTime()) ? null : d;
  }

  /** "2025-08-30" -> "30 August 2025" / "৩০ আগস্ট ২০২৫" */
  M.formatDate = function (iso, lang) {
    var d = parseISO(iso);
    if (!d) return iso || '';
    var l = lang || M.lang;
    if (l === 'bn') {
      return M.bnNum(d.getDate()) + ' ' + BN_MONTHS[d.getMonth()] + ' ' + M.bnNum(d.getFullYear());
    }
    return d.getDate() + ' ' + EN_MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  };

  /** Day + short month, for the date chip. */
  M.dateParts = function (iso, lang) {
    var d = parseISO(iso);
    if (!d) return { day: '', mon: '' };
    var l = lang || M.lang;
    return l === 'bn'
      ? { day: M.bnNum(d.getDate()), mon: BN_MONTHS_SHORT[d.getMonth()] }
      : { day: String(d.getDate()), mon: EN_MONTHS_SHORT[d.getMonth()] };
  };

  /* ----------------------------------------------------------------- i18n */

  /**
   * Every translatable string on the site. Markup carries `data-i18n="key"`
   * and ships the English text inline, so the page is fully readable before —
   * or without — JavaScript.
   */
  var I18N = {
    en: {
      /* chrome */
      'skip': 'Skip to main content',
      'brand.name': 'Ghonar Chala High School',
      'brand.sub': 'Sakhipur, Tangail — Est. 1985',
      'nav.label': 'Main menu',
      'nav.toggle': 'Open or close the menu',
      'nav.home': 'Home',
      'nav.institution': 'The School',
      'nav.academics': 'Academics',
      'nav.teachers': 'Teachers',
      'nav.committee': 'Managing Committee',
      'nav.gallery': 'Gallery',
      'nav.about': 'About',
      'nav.admissions': 'Admissions',
      'nav.news': 'News',
      'nav.contact': 'Contact',
      'lang.label': 'Language',
      'lang.enTitle': 'Read this site in English',
      'lang.bnTitle': 'এই সাইটটি বাংলায় পড়ুন',
      'top.label': 'Back to top',
      'crumb.home': 'Home',

      /* topbar */
      'top.board': 'Dhaka Education Board',
      'top.call': 'Call the office',

      /* footer */
      'footer.blurb': 'A government-recognised secondary school serving the villages of Kachua and Sakhipur since 1985 — steady teaching, small classes, and a fair chance for every student.',
      'footer.explore': 'Explore',
      'footer.resources': 'Resources',
      'footer.contact': 'Contact',
      'footer.facebook': 'Facebook page',
      'footer.rights': '© %YEAR% Ghonar Chala High School. All rights reserved.',
      'footer.meta': 'EIIN 114612 · Dhaka Education Board',
      'link.ministry': 'Ministry of Education',
      'link.dshe': 'Directorate of Secondary & Higher Education',
      'link.board': 'Dhaka Education Board',
      'link.nctb': 'NCTB — Textbooks',
      'link.banbeis': 'BANBEIS',

      /* home */
      'title.home': 'Ghonar Chala High School — Sakhipur, Tangail',
      'title.about': 'About the school — Ghonar Chala High School',
      'title.admissions': 'Admissions — Ghonar Chala High School',
      'title.news': 'News & notices — Ghonar Chala High School',
      'title.contact': 'Contact — Ghonar Chala High School',
      'title.academics': 'Academics — Ghonar Chala High School',
      'title.teachers': 'Teachers — Ghonar Chala High School',
      'title.committee': 'Managing Committee — Ghonar Chala High School',
      'title.gallery': 'Gallery — Ghonar Chala High School',
      'title.notFound': 'Page not found — Ghonar Chala High School',
      'meta.home': 'Ghonar Chala High School, Sakhipur, Tangail — an MPO-listed secondary school teaching classes six to ten in Science, Business Studies and Humanities since 1985.',
      'meta.about': 'The history, mission, facilities and leadership of Ghonar Chala High School, founded 1985 at Ghonar Chala Bazar, Sakhipur, Tangail.',
      'meta.academics': 'Classes, streams and curriculum at Ghonar Chala High School — classes six to ten, the Science, Business Studies and Humanities streams, assessment and the SSC examination.',
      'meta.teachers': 'The teaching staff of Ghonar Chala High School, Ghonar Chala Bazar, Kachua, Sakhipur, Tangail.',
      'meta.committee': 'The managing committee of Ghonar Chala High School, Ghonar Chala Bazar, Kachua, Sakhipur, Tangail.',
      'meta.admissions': 'How to apply to Ghonar Chala High School: the admission process step by step, required documents, dates and who to contact.',
      'meta.news': 'Notices and announcements from the Ghonar Chala High School office — reopening dates, examinations, events and admissions.',
      'meta.gallery': 'Photographs of Ghonar Chala High School — the main building, daily assembly, ceremonies and school events.',
      'meta.contact': 'Address, telephone numbers, e-mail, office hours and map for Ghonar Chala High School, Ghonar Chala Bazar, Kachua, Sakhipur, Tangail-1951.',
      'meta.notFound': 'The page you were looking for could not be found on the Ghonar Chala High School website.',
      'home.hero.eyebrow': 'Established 1985',
      'home.hero.title': 'A steady education, close to home.',
      'home.hero.text': 'Ghonar Chala High School has taught the young people of Kachua and Sakhipur for four decades — classes six through ten, three streams, and one promise: every student gets a fair chance.',
      'home.hero.cta1': 'Apply for admission',
      'home.hero.cta2': 'Read the latest news',
      'home.stat1': 'Founded',
      'home.stat2': 'Recognised',
      'home.stat3': 'Classes taught',
      'home.stat4': 'Academic streams',
      'home.stat1v': '1985',
      'home.stat2v': '1988',
      'home.stat3v': 'Six – Ten',
      'home.stat4v': 'Three',
      'home.about.eyebrow': 'Who we are',
      'home.about.title': 'Forty years in one village, and still growing',
      'home.about.p1': 'The school opened its doors on 10 January 1985 at Ghonar Chala Bazar, and won government recognition three years later. Today it runs under the Board of Intermediate and Secondary Education, Dhaka, as an MPO-listed non-government secondary school.',
      'home.about.p2': 'We teach the national NCTB curriculum from class six to class ten. In classes nine and ten students choose Science, Business Studies or Humanities, and sit the SSC examination under the Dhaka Board.',
      'home.about.cta': 'More about the school',
      'home.pillars.eyebrow': 'What we offer',
      'home.pillars.title': 'A full secondary education, without leaving the village',
      'home.pillar1.title': 'Three academic streams',
      'home.pillar1.text': 'Science, Business Studies and Humanities from class nine, each following the national curriculum and leading to the SSC examination.',
      'home.pillar2.title': 'Teachers who stay',
      'home.pillar2.text': 'A settled, MPO-listed teaching staff led by Headmaster Md. Nazrul Islam, supported by a managing committee drawn from the community.',
      'home.pillar3.title': 'Room to grow',
      'home.pillar3.text': 'Bright brick classrooms, a science laboratory and library, a full-size playing field, clean drinking water and separate facilities for girls and boys.',
      'home.news.eyebrow': 'Notice board',
      'home.news.title': 'Latest news',
      'home.news.all': 'All notices',
      'home.cta.eyebrow': 'Admissions',
      'home.cta.title': 'Admissions for the 2026 session are open',
      'home.cta.text': 'Forms are available from the school office. The entrance test is held in December — call us, or read the full admissions guide.',
      'home.cta.b1': 'Admissions guide',
      'home.cta.b2': 'Call 01309-114612',
      'home.visit.eyebrow': 'Come and see',
      'home.visit.title': 'Visit the school',
      'home.visit.text': 'The office is open Sunday to Thursday, 9:00 am to 4:00 pm. You are welcome to walk in — no appointment needed.',
      'home.visit.cta': 'Directions and contact',

      /* about */
      'about.title': 'About the school',
      'about.eyebrow': 'About us',
      'about.lead': 'Four decades of secondary education at Ghonar Chala Bazar, in the Kachua union of Sakhipur, Tangail.',
      'about.history.title': 'Our history',
      'about.history.p1': 'Ghonar Chala High School was founded on 10 January 1985 at Ghonar Chala Bazar, in the Kachua union of Sakhipur upazila, Tangail district. It was built by the village for the village: before it opened, the nearest secondary school meant a long walk for children who often did not make the journey at all.',
      'about.history.p2': 'Three years later, on 1 January 1988, the school received government recognition. It operates today under the Board of Intermediate and Secondary Education, Dhaka, with EIIN 114612, as an MPO-listed non-government secondary school — meaning the government carries part of the teachers\' salaries.',
      'about.mission.title': 'What we set out to do',
      'about.mission.p1': 'To give rural students a secondary education that is genuinely good, genuinely affordable, and open to everyone. We hold that examination results are only half the picture: discipline, honesty and a sense of duty to one\'s country matter just as much to how a young person turns out.',
      'about.academics.title': 'Teaching',
      'about.academics.p1': 'We teach classes six through ten, following the syllabus set by the National Curriculum and Textbook Board. From class nine, students choose between Science, Business Studies and Humanities, and sit the SSC examination under the Dhaka Board.',
      'about.facilities.title': 'Facilities',
      'about.fac1': 'Bright, airy brick classrooms',
      'about.fac2': 'Science laboratory and library',
      'about.fac3': 'Full-size playing field and sports equipment',
      'about.fac4': 'Safe drinking water; separate facilities for girls and boys',
      'about.fac5': 'Regular parents\' meetings',
      'about.people.title': 'Who leads the school',
      'about.head.role': 'Headmaster',
      'about.head.name': 'Md. Nazrul Islam',
      'about.head.note': 'Heads the school and serves as member secretary of the managing committee.',
      'about.pres.role': 'President, Managing Committee',
      'about.pres.name': 'Alhaj Amzad Hossen Master',
      'about.pres.note': 'A former assistant headmaster of this school and former chairman of Kalia Union Parishad.',
      'about.facts.title': 'Key facts',
      'fact.name': 'Name',
      'fact.nameBn': 'Bangla name',
      'fact.nameEn': 'English name',
      'fact.founded': 'Founded',
      'fact.recognised': 'Recognised',
      'fact.board': 'Education board',
      'fact.type': 'Type',
      'fact.classes': 'Classes',
      'fact.streams': 'Streams',
      'fact.area': 'Setting',
      'fact.address': 'Address',
      'fact.founded.v': '10 January 1985',
      'fact.recognised.v': '1 January 1988',
      'fact.board.v': 'Dhaka',
      'fact.type.v': 'Non-government, MPO-listed',
      'fact.classes.v': 'Six – Ten',
      'fact.streams.v': 'Science, Business Studies, Humanities',
      'fact.area.v': 'Rural plain',
      'fact.address.v': 'Ghonar Chala Bazar, Kachua, Sakhipur, Tangail-1951',
      'fact.spelling.note': 'Sakhipur Upazila is also written সখীপুর in Bangla.',
      'about.streams.title': 'The three streams',
      'stream.science': 'Science',
      'stream.science.sub': 'Physics, Chemistry, Biology and Higher Mathematics.',
      'stream.business': 'Business Studies',
      'stream.business.sub': 'Accounting, Business Entrepreneurship and Finance.',
      'stream.humanities': 'Humanities',
      'stream.humanities.sub': 'Geography, Civics, History and Economics.',

      /* admissions */
      'adm.title': 'Admissions',
      'adm.eyebrow': 'Admissions',
      'adm.lead': 'How to join Ghonar Chala High School — the process, the papers, and who to ask.',
      'adm.intro.title': 'Everyone is welcome to apply',
      'adm.intro.p1': 'We admit students into classes six through ten, across all three streams. The process is deliberately simple and the same for every applicant: come to the office, take a form, and sit the test.',
      'adm.steps.title': 'The process, step by step',
      'adm.step1.title': 'Applications open',
      'adm.step1.text': 'Forms for the coming academic year are usually issued in December of the previous year.',
      'adm.step2.title': 'Collect and complete the form',
      'adm.step2.text': 'Application forms are handed out at the school office. Fill the form in and return it there.',
      'adm.step3.title': 'Entrance test',
      'adm.step3.text': 'For most classes, selection rests on the previous year\'s results together with an entrance test.',
      'adm.step4.title': 'Confirmation of admission',
      'adm.step4.text': 'Selected students are notified, and a parent or guardian completes the admission with the documents below.',
      'adm.docs.title': 'What to bring',
      'adm.doc1': 'Testimonial and mark sheet from the previous class',
      'adm.doc2': 'Photocopy of the birth registration certificate',
      'adm.doc3': 'Photocopy of the guardian\'s national ID card',
      'adm.doc4': 'Recent passport-size photographs',
      'adm.aside.title': 'Admissions office',
      'adm.aside.text': 'Come to the school office at Ghonar Chala Bazar, or call us during office hours.',
      'adm.aside.office': 'Office',
      'adm.aside.mobile': 'Mobile',
      'adm.aside.hours': 'Hours',
      'adm.aside.hoursV': 'Sunday – Thursday, 9:00 am – 4:00 pm',
      'adm.aside.cta': 'Admission notices',
      'adm.dates.title': 'Dates for the 2026 session',
      'adm.dates.text': 'The entrance test for the 2026 academic year will be held on 10 December 2025 at 9:00 am in the main building. Application forms are available from the school office.',
      'adm.dates.cta': 'Read the full notice',
      'adm.help.title': 'Not sure where to start?',
      'adm.help.text': 'Call the office on 01309-114612, or follow our Facebook page for deadlines and announcements as they are published.',
      'adm.help.b1': 'Contact the school',
      'adm.help.b2': 'Facebook page',

      /* news */
      'news.title': 'News & notices',
      'news.eyebrow': 'Notice board',
      'news.lead': 'Announcements from the school office — reopening dates, examinations, events and admissions.',
      'news.count': '%N% notices',
      'news.count1': '1 notice',
      'news.empty': 'There are no notices at the moment. Please check back soon.',
      'news.error': 'The notices could not be loaded. Please refresh the page and try again.',
      'news.loading': 'Loading notices…',
      'news.pinned': 'Pinned',
      'news.back': 'All notices',
      'news.published': 'Published',
      'news.notFound': 'That notice could not be found.',
      'news.notFoundText': 'It may have been removed, or the link may be incomplete.',
      'news.other': 'Other notices',

      /* contact */
      'contact.title': 'Contact',
      'contact.eyebrow': 'Contact',
      'contact.lead': 'Where to find us, and how to reach the school office.',
      'contact.details.title': 'School office',
      'contact.address': 'Address',
      'contact.phone': 'Office telephone',
      'contact.mobile': 'Mobile',
      'contact.email': 'E-mail',
      'contact.hours': 'Office hours',
      'contact.hoursV': 'Sunday – Thursday, 9:00 am – 4:00 pm',
      'contact.social': 'Facebook',
      'contact.socialV': 'Ghonar Chala High School (official)',
      'contact.map.title': 'Find us',
      'contact.map.text': 'The school stands beside Ghonar Chala Bazar in the Kachua union of Sakhipur upazila, Tangail.',
      'contact.map.label': 'Map showing the location of Ghonar Chala High School',
      'contact.map.cta': 'Open in Google Maps',
      'contact.visit.title': 'Visiting',
      'contact.visit.text': 'Parents and prospective students are welcome to walk in during office hours — no appointment is needed. For admissions questions, ask for the office at the main building.',
      'contact.who.title': 'Who to ask',
      'contact.who.adm': 'Admissions and forms',
      'contact.who.admV': 'School office — 01309-114612',
      'contact.who.acad': 'Academic matters',
      'contact.who.acadV': 'Headmaster, Md. Nazrul Islam',
      'contact.who.other': 'Anything else',

      /* b */
      'acad.title': 'Academics',
      'acad.eyebrow': 'Academics',
      'acad.lead': 'Classes six through ten, three streams, and the NCTB curriculum, leading to the SSC examination under the Dhaka Board.',
      'acad.overview.title': 'Classes and curriculum',
      'acad.overview.p1': 'Ghonar Chala High School teaches classes six through ten, following the syllabus set by the National Curriculum and Textbook Board (NCTB). Students sit the Secondary School Certificate (SSC) examination under the Board of Intermediate and Secondary Education, Dhaka.',
      'acad.overview.p2': 'Classes six, seven and eight follow a single general syllabus with no streams. From class nine, students choose one of three streams and follow it through to the SSC examination in class ten.',
      'acad.structure.title': 'Class-by-class structure',
      'acad.th.class': 'Class',
      'acad.th.level': 'Level',
      'acad.th.stream': 'Stream',
      'acad.class.six': 'Six',
      'acad.class.seven': 'Seven',
      'acad.class.eight': 'Eight',
      'acad.class.nine': 'Nine',
      'acad.class.ten': 'Ten',
      'acad.level.lower': 'Lower secondary',
      'acad.level.secondary': 'Secondary',
      'acad.stream.general': 'General (no streams)',
      'acad.stream.threeway': 'Science / Business Studies / Humanities',
      'acad.links.title': 'Educational resources',
      'acad.cta.title': 'Want to apply?',
      'acad.cta.text': 'Learn about the admission process, required documents and dates.',
      'acad.cta.button': 'View admissions info',
      'acad.assess.title': 'Assessment and examinations',
      'acad.assess.li1': 'Continuous class assessment and class tests',
      'acad.assess.li2': 'Half-yearly and annual examinations',
      'acad.assess.li3': 'A selection (test) examination in class ten',
      'acad.assess.li4': 'SSC examination under the Dhaka Education Board',
      'acad.assess.note': 'Examination schedules and results are announced on the notice board.',
      'teach.title': 'Teaching staff',
      'teach.joined': 'Joined',
      'teach.eyebrow': 'Our people',
      'teach.lead': 'The teachers who lead classes at Ghonar Chala High School.',
      'teach.intro': 'Ghonar Chala High School is staffed by teachers covering the NCTB syllabus for classes six to ten, under the Board of Intermediate and Secondary Education, Dhaka. Profiles are added here as the school records them.',
      'teach.loading': 'Loading teacher profiles…',
      'teach.note': 'More teacher profiles will be added to this list as the school records them.',
      'teach.empty': 'No teacher profiles have been published yet.',
      'teach.error': 'Teacher profiles could not be loaded. Please refresh the page and try again.',
      'comm.title': 'Managing committee',
      'comm.eyebrow': 'Governance',
      'comm.lead': 'The community members who oversee Ghonar Chala High School alongside the headmaster.',
      'comm.intro': 'The managing committee is drawn from the local community and works with the headmaster to run the school\'s administration, under the rules of the Board of Intermediate and Secondary Education, Dhaka.',
      'comm.loading': 'Loading committee members…',
      'comm.note': 'More committee members will be added to this list as records are updated.',
      'comm.empty': 'No committee members have been published yet.',
      'comm.error': 'Committee member profiles could not be loaded. Please refresh the page and try again.',

      /* c */
      'gal.title': 'Photo gallery',
      'gal.eyebrow': 'Gallery',
      'gal.lead': 'Moments from campus life — students, events, and the buildings of Ghonar Chala High School.',
      'gal.loading': 'Loading photos…',
      'gal.empty': 'There are no photos in the gallery yet. Please check back soon.',
      'gal.error': 'The photos could not be loaded. Please refresh the page and try again.',
      'gal.count': '%N% photos',
      'gal.count1': '1 photo',
      'gal.open': 'View larger: %CAPTION%',
      'gal.close': 'Close',
      'gal.prev': 'Previous photo',
      'gal.next': 'Next photo',
      'gal.viewer': 'Photo viewer',
      'gal.position': 'Photo %N% of %TOTAL%',
      'nf.eyebrow': 'Page not found',
      'nf.title': 'We can\'t find that page',
      'nf.lead': 'The page you were looking for may have been moved, renamed, or no longer exists. Here are a few places to try instead.',
      'nf.home': 'Go to the homepage'
    },

    bn: {
      /* chrome */
      'skip': 'মূল অংশে যান',
      'brand.name': 'ঘোনার চালা উচ্চ বিদ্যালয়',
      'brand.sub': 'সখিপুর, টাঙ্গাইল — প্রতিষ্ঠা ১৯৮৫',
      'nav.label': 'প্রধান মেনু',
      'nav.toggle': 'মেনু খুলুন বা বন্ধ করুন',
      'nav.home': 'হোম',
      'nav.institution': 'প্রতিষ্ঠান',
      'nav.academics': 'একাডেমিক',
      'nav.teachers': 'শিক্ষকমণ্ডলী',
      'nav.committee': 'পরিচালনা পর্ষদ',
      'nav.gallery': 'গ্যালারি',
      'nav.about': 'পরিচিতি',
      'nav.admissions': 'ভর্তি',
      'nav.news': 'নোটিশ',
      'nav.contact': 'যোগাযোগ',
      'lang.label': 'ভাষা',
      'lang.enTitle': 'Read this site in English',
      'lang.bnTitle': 'এই সাইটটি বাংলায় পড়ুন',
      'top.label': 'উপরে ফিরে যান',
      'crumb.home': 'হোম',

      /* topbar */
      'top.board': 'ঢাকা শিক্ষা বোর্ড',
      'top.call': 'অফিসে ফোন করুন',

      /* footer */
      'footer.blurb': '১৯৮৫ সাল থেকে সখিপুরের কচুয়া অঞ্চলের শিক্ষার্থীদের জন্য নিবেদিত একটি স্বীকৃত মাধ্যমিক বিদ্যালয় — নিয়মিত পাঠদান, ছোট শ্রেণি এবং প্রত্যেক শিক্ষার্থীর জন্য সমান সুযোগ।',
      'footer.explore': 'সাইটের পাতা',
      'footer.resources': 'গুরুত্বপূর্ণ লিংক',
      'footer.contact': 'যোগাযোগ',
      'footer.facebook': 'ফেসবুক পেজ',
      'footer.rights': '© %YEAR% ঘোনার চালা উচ্চ বিদ্যালয়। সর্বস্বত্ব সংরক্ষিত।',
      'footer.meta': 'EIIN 114612 · ঢাকা শিক্ষা বোর্ড',
      'link.ministry': 'শিক্ষা মন্ত্রণালয়',
      'link.dshe': 'মাধ্যমিক ও উচ্চশিক্ষা অধিদপ্তর',
      'link.board': 'ঢাকা শিক্ষা বোর্ড',
      'link.nctb': 'এনসিটিবি — পাঠ্যপুস্তক',
      'link.banbeis': 'ব্যানবেইস',

      /* home */
      'title.home': 'ঘোনার চালা উচ্চ বিদ্যালয় (Ghonar Chala High School) — সখিপুর, টাঙ্গাইল',
      'title.about': 'প্রতিষ্ঠান পরিচিতি — ঘোনার চালা উচ্চ বিদ্যালয়',
      'title.admissions': 'ভর্তি তথ্য — ঘোনার চালা উচ্চ বিদ্যালয়',
      'title.news': 'নোটিশ বোর্ড — ঘোনার চালা উচ্চ বিদ্যালয়',
      'title.contact': 'যোগাযোগ — ঘোনার চালা উচ্চ বিদ্যালয়',
      'title.academics': 'একাডেমিক তথ্য — ঘোনার চালা উচ্চ বিদ্যালয়',
      'title.teachers': 'শিক্ষকমণ্ডলী — ঘোনার চালা উচ্চ বিদ্যালয়',
      'title.committee': 'পরিচালনা পর্ষদ — ঘোনার চালা উচ্চ বিদ্যালয়',
      'title.gallery': 'ফটো গ্যালারি — ঘোনার চালা উচ্চ বিদ্যালয়',
      'title.notFound': 'পাতাটি পাওয়া যায়নি — ঘোনার চালা উচ্চ বিদ্যালয়',
      'meta.home': 'ঘোনার চালা উচ্চ বিদ্যালয়, সখিপুর, টাঙ্গাইল — ১৯৮৫ সাল থেকে ষষ্ঠ থেকে দশম শ্রেণি পর্যন্ত বিজ্ঞান, ব্যবসায় শিক্ষা ও মানবিক বিভাগে পাঠদানরত একটি এমপিওভুক্ত মাধ্যমিক বিদ্যালয়।',
      'meta.about': '১৯৮৫ সালে ঘোনার চালা বাজারে প্রতিষ্ঠিত ঘোনার চালা উচ্চ বিদ্যালয়ের ইতিহাস, লক্ষ্য, সুযোগ-সুবিধা ও পরিচালনা সংক্রান্ত তথ্য।',
      'meta.academics': 'ঘোনার চালা উচ্চ বিদ্যালয়ের শ্রেণি, বিভাগ ও পাঠ্যক্রম — ষষ্ঠ থেকে দশম শ্রেণি, বিজ্ঞান, ব্যবসায় শিক্ষা ও মানবিক বিভাগ, মূল্যায়ন ও এসএসসি পরীক্ষা।',
      'meta.teachers': 'ঘোনার চালা উচ্চ বিদ্যালয়, ঘোনার চালা বাজার, কচুয়া, সখিপুর, টাঙ্গাইলের শিক্ষকমণ্ডলী।',
      'meta.committee': 'ঘোনার চালা উচ্চ বিদ্যালয়, ঘোনার চালা বাজার, কচুয়া, সখিপুর, টাঙ্গাইলের পরিচালনা পর্ষদ।',
      'meta.admissions': 'ঘোনার চালা উচ্চ বিদ্যালয়ে ভর্তির প্রক্রিয়া, প্রয়োজনীয় কাগজপত্র, সময়সূচি ও যোগাযোগের তথ্য।',
      'meta.news': 'ঘোনার চালা উচ্চ বিদ্যালয়ের অফিস থেকে প্রকাশিত নোটিশ ও ঘোষণা — শ্রেণি কার্যক্রম, পরীক্ষা, অনুষ্ঠান ও ভর্তি সংক্রান্ত তথ্য।',
      'meta.gallery': 'ঘোনার চালা উচ্চ বিদ্যালয়ের ছবি — মূল ভবন, প্রাত্যহিক সমাবেশ, সংবর্ধনা ও বিদ্যালয়ের নানা আয়োজন।',
      'meta.contact': 'ঘোনার চালা উচ্চ বিদ্যালয়, ঘোনার চালা বাজার, কচুয়া, সখিপুর, টাঙ্গাইল-১৯৫১ — ঠিকানা, ফোন নম্বর, ই-মেইল, অফিস সময় ও মানচিত্র।',
      'meta.notFound': 'আপনি যে পাতাটি খুঁজছেন সেটি ঘোনার চালা উচ্চ বিদ্যালয়ের ওয়েবসাইটে পাওয়া যায়নি।',
      'home.hero.eyebrow': 'প্রতিষ্ঠা ১৯৮৫',
      'home.hero.title': 'ঘরের কাছেই মানসম্মত শিক্ষা।',
      'home.hero.text': 'চার দশক ধরে কচুয়া ও সখিপুরের শিক্ষার্থীদের পাঠদান করে আসছে ঘোনার চালা উচ্চ বিদ্যালয় — ষষ্ঠ থেকে দশম শ্রেণি, তিনটি বিভাগ, আর একটিই অঙ্গীকার: প্রত্যেক শিক্ষার্থীর জন্য সমান সুযোগ।',
      'home.hero.cta1': 'ভর্তির তথ্য',
      'home.hero.cta2': 'সর্বশেষ নোটিশ',
      'home.stat1': 'প্রতিষ্ঠাকাল',
      'home.stat2': 'স্বীকৃতি',
      'home.stat3': 'শ্রেণি',
      'home.stat4': 'বিভাগ',
      'home.stat1v': '১৯৮৫',
      'home.stat2v': '১৯৮৮',
      'home.stat3v': 'ষষ্ঠ – দশম',
      'home.stat4v': 'তিনটি',
      'home.about.eyebrow': 'আমাদের পরিচয়',
      'home.about.title': 'এক গ্রামে চল্লিশ বছর, আজও এগিয়ে চলা',
      'home.about.p1': '১৯৮৫ সালের ১০ জানুয়ারি ঘোনার চালা বাজারে বিদ্যালয়টির যাত্রা শুরু হয় এবং তিন বছরের মাথায় এটি সরকারি স্বীকৃতি লাভ করে। বর্তমানে এটি মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, ঢাকা-এর অধীনে পরিচালিত একটি এমপিওভুক্ত বেসরকারি মাধ্যমিক বিদ্যালয়।',
      'home.about.p2': 'ষষ্ঠ থেকে দশম শ্রেণি পর্যন্ত এনসিটিবি নির্ধারিত জাতীয় পাঠ্যসূচি অনুসরণ করা হয়। নবম ও দশম শ্রেণিতে শিক্ষার্থীরা বিজ্ঞান, ব্যবসায় শিক্ষা বা মানবিক বিভাগ বেছে নেয় এবং ঢাকা বোর্ডের অধীনে এসএসসি পরীক্ষায় অংশ নেয়।',
      'home.about.cta': 'বিদ্যালয় সম্পর্কে বিস্তারিত',
      'home.pillars.eyebrow': 'আমাদের কার্যক্রম',
      'home.pillars.title': 'গ্রাম ছেড়ে না গিয়েই পূর্ণাঙ্গ মাধ্যমিক শিক্ষা',
      'home.pillar1.title': 'তিনটি বিভাগ',
      'home.pillar1.text': 'নবম শ্রেণি থেকে বিজ্ঞান, ব্যবসায় শিক্ষা ও মানবিক — প্রতিটি বিভাগেই জাতীয় পাঠ্যসূচি অনুসরণ করে এসএসসি পরীক্ষার প্রস্তুতি।',
      'home.pillar2.title': 'অভিজ্ঞ শিক্ষকমণ্ডলী',
      'home.pillar2.text': 'প্রধান শিক্ষক মোঃ নজরুল ইসলামের নেতৃত্বে একটি স্থায়ী এমপিওভুক্ত শিক্ষকমণ্ডলী এবং এলাকাবাসীর প্রতিনিধিত্বে গঠিত পরিচালনা পর্ষদ।',
      'home.pillar3.title': 'প্রয়োজনীয় সুযোগ-সুবিধা',
      'home.pillar3.text': 'আলো-বাতাসপূর্ণ পাকা শ্রেণিকক্ষ, বিজ্ঞানাগার ও গ্রন্থাগার, খেলার মাঠ, বিশুদ্ধ খাবার পানি এবং ছাত্র-ছাত্রীদের জন্য পৃথক শৌচাগার।',
      'home.news.eyebrow': 'নোটিশ বোর্ড',
      'home.news.title': 'সর্বশেষ নোটিশ',
      'home.news.all': 'সব নোটিশ',
      'home.cta.eyebrow': 'ভর্তি',
      'home.cta.title': '২০২৬ শিক্ষাবর্ষের ভর্তি কার্যক্রম চলছে',
      'home.cta.text': 'আবেদন ফরম বিদ্যালয় অফিস থেকে সংগ্রহ করা যাবে। ভর্তি পরীক্ষা অনুষ্ঠিত হবে ডিসেম্বর মাসে — বিস্তারিত জানতে ফোন করুন বা ভর্তির নিয়মাবলি দেখুন।',
      'home.cta.b1': 'ভর্তির নিয়মাবলি',
      'home.cta.b2': 'ফোন: 01309-114612',
      'home.visit.eyebrow': 'সরাসরি আসুন',
      'home.visit.title': 'বিদ্যালয় পরিদর্শন',
      'home.visit.text': 'অফিস খোলা থাকে রবি থেকে বৃহস্পতিবার, সকাল ৯টা থেকে বিকাল ৪টা পর্যন্ত। পূর্ব অনুমতির প্রয়োজন নেই — যেকোনো সময় আসতে পারেন।',
      'home.visit.cta': 'ঠিকানা ও যোগাযোগ',

      /* about */
      'about.title': 'প্রতিষ্ঠান পরিচিতি',
      'about.eyebrow': 'পরিচিতি',
      'about.lead': 'টাঙ্গাইলের সখিপুর উপজেলার কচুয়া ইউনিয়নের ঘোনার চালা বাজারে চার দশকের মাধ্যমিক শিক্ষা।',
      'about.history.title': 'আমাদের ইতিহাস',
      'about.history.p1': 'ঘোনার চালা উচ্চ বিদ্যালয় ১৯৮৫ সালের ১০ জানুয়ারি টাঙ্গাইল জেলার সখিপুর উপজেলার কচুয়া ইউনিয়নের ঘোনার চালা বাজারে প্রতিষ্ঠিত হয়। এটি গড়ে উঠেছিল এলাকাবাসীরই উদ্যোগে — বিদ্যালয়টি প্রতিষ্ঠার আগে নিকটতম মাধ্যমিক বিদ্যালয়ে যেতে শিক্ষার্থীদের দীর্ঘ পথ পাড়ি দিতে হতো।',
      'about.history.p2': 'প্রতিষ্ঠার তিন বছরের মাথায়, ১৯৮৮ সালের ১ জানুয়ারি, বিদ্যালয়টি সরকারি স্বীকৃতি লাভ করে। বর্তমানে এটি মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, ঢাকা-এর অধীনে EIIN 114612 নম্বরে পরিচালিত একটি এমপিওভুক্ত বেসরকারি মাধ্যমিক বিদ্যালয়। এমপিওভুক্ত হওয়ায় শিক্ষকদের বেতন-ভাতার একটি অংশ সরকার বহন করে।',
      'about.mission.title': 'আমাদের লক্ষ্য',
      'about.mission.p1': 'গ্রামীণ জনপদের শিক্ষার্থীদের জন্য মানসম্মত, সাশ্রয়ী ও অন্তর্ভুক্তিমূলক মাধ্যমিক শিক্ষা নিশ্চিত করা। আমরা বিশ্বাস করি, একাডেমিক ফলাফলের পাশাপাশি নৈতিক মূল্যবোধ, শৃঙ্খলা ও দেশপ্রেম একজন শিক্ষার্থীর পূর্ণাঙ্গ বিকাশের জন্য অপরিহার্য।',
      'about.academics.title': 'শিক্ষা কার্যক্রম',
      'about.academics.p1': 'ষষ্ঠ থেকে দশম শ্রেণি পর্যন্ত পাঠদান করা হয় এবং জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (এনসিটিবি) নির্ধারিত পাঠ্যসূচি অনুসরণ করা হয়। নবম শ্রেণি থেকে শিক্ষার্থীরা বিজ্ঞান, ব্যবসায় শিক্ষা ও মানবিক বিভাগের যেকোনো একটি বেছে নেয় এবং ঢাকা বোর্ডের অধীনে এসএসসি পরীক্ষায় অংশগ্রহণ করে।',
      'about.facilities.title': 'সুযোগ-সুবিধা',
      'about.fac1': 'আলো-বাতাসপূর্ণ পাকা শ্রেণিকক্ষ',
      'about.fac2': 'বিজ্ঞানাগার ও গ্রন্থাগার',
      'about.fac3': 'খেলার মাঠ ও ক্রীড়া সামগ্রী',
      'about.fac4': 'বিশুদ্ধ খাবার পানি ও পৃথক ছাত্র-ছাত্রী শৌচাগার',
      'about.fac5': 'নিয়মিত অভিভাবক সমাবেশ',
      'about.people.title': 'বিদ্যালয় পরিচালনা',
      'about.head.role': 'প্রধান শিক্ষক',
      'about.head.name': 'মোঃ নজরুল ইসলাম',
      'about.head.note': 'বিদ্যালয়ের প্রধান শিক্ষক এবং পরিচালনা পর্ষদের সদস্য সচিব।',
      'about.pres.role': 'সভাপতি, পরিচালনা পর্ষদ',
      'about.pres.name': 'আলহাজ্ব আমজাদ হোসেন মাস্টার',
      'about.pres.note': 'ঘোনার চালা উচ্চ বিদ্যালয়ের সাবেক সহকারী প্রধান শিক্ষক এবং কালিয়া ইউনিয়ন পরিষদের সাবেক চেয়ারম্যান।',
      'about.facts.title': 'এক নজরে',
      'fact.name': 'প্রতিষ্ঠানের নাম',
      'fact.nameBn': 'বাংলা নাম',
      'fact.nameEn': 'ইংরেজি নাম',
      'fact.founded': 'প্রতিষ্ঠাকাল',
      'fact.recognised': 'স্বীকৃতি',
      'fact.board': 'শিক্ষা বোর্ড',
      'fact.type': 'ধরন',
      'fact.classes': 'শ্রেণি',
      'fact.streams': 'বিভাগ',
      'fact.area': 'এলাকা',
      'fact.address': 'ঠিকানা',
      'fact.founded.v': '১০ জানুয়ারি ১৯৮৫',
      'fact.recognised.v': '১ জানুয়ারি ১৯৮৮',
      'fact.board.v': 'ঢাকা',
      'fact.type.v': 'বেসরকারি (এমপিওভুক্ত)',
      'fact.classes.v': 'ষষ্ঠ – দশম',
      'fact.streams.v': 'বিজ্ঞান, ব্যবসায় শিক্ষা, মানবিক',
      'fact.area.v': 'গ্রামীণ সমতল',
      'fact.address.v': 'ঘোনার চালা বাজার, কচুয়া, সখিপুর, টাঙ্গাইল-১৯৫১',
      'fact.spelling.note': 'সখিপুর উপজেলাকে অনেকে সখীপুরও লেখেন।',
      'about.streams.title': 'তিনটি বিভাগ',
      'stream.science': 'বিজ্ঞান',
      'stream.science.sub': 'পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান ও উচ্চতর গণিত।',
      'stream.business': 'ব্যবসায় শিক্ষা',
      'stream.business.sub': 'হিসাববিজ্ঞান, ব্যবসায় উদ্যোগ ও ফিন্যান্স।',
      'stream.humanities': 'মানবিক',
      'stream.humanities.sub': 'ভূগোল, পৌরনীতি, ইতিহাস ও অর্থনীতি।',

      /* admissions */
      'adm.title': 'ভর্তি তথ্য',
      'adm.eyebrow': 'ভর্তি',
      'adm.lead': 'ঘোনার চালা উচ্চ বিদ্যালয়ে ভর্তির প্রক্রিয়া, প্রয়োজনীয় কাগজপত্র ও যোগাযোগ।',
      'adm.intro.title': 'সকলকে আবেদনের জন্য স্বাগতম',
      'adm.intro.p1': 'ষষ্ঠ থেকে দশম শ্রেণি পর্যন্ত তিনটি বিভাগেই ভর্তির সুযোগ রয়েছে। আমাদের ভর্তি প্রক্রিয়া স্বচ্ছ ও সহজ এবং প্রত্যেক আবেদনকারীর জন্য অভিন্ন — অফিসে আসুন, ফরম সংগ্রহ করুন, পরীক্ষায় অংশ নিন।',
      'adm.steps.title': 'ভর্তি প্রক্রিয়া',
      'adm.step1.title': 'আবেদন গ্রহণ শুরু',
      'adm.step1.text': 'প্রতি বছর সাধারণত ডিসেম্বর মাসে পরবর্তী শিক্ষাবর্ষের জন্য ভর্তির আবেদন গ্রহণ করা হয়।',
      'adm.step2.title': 'ফরম সংগ্রহ ও পূরণ',
      'adm.step2.text': 'আগ্রহী শিক্ষার্থীদের বিদ্যালয় অফিস থেকে আবেদন ফরম সংগ্রহ করে পূরণ করে জমা দিতে হয়।',
      'adm.step3.title': 'ভর্তি পরীক্ষা',
      'adm.step3.text': 'নির্দিষ্ট কিছু শ্রেণির ক্ষেত্রে পূর্ববর্তী শিক্ষাগত ফলাফল ও ভর্তি পরীক্ষার ভিত্তিতে যোগ্যতা নির্ধারণ করা হয়।',
      'adm.step4.title': 'ভর্তি নিশ্চিতকরণ',
      'adm.step4.text': 'নির্বাচিত শিক্ষার্থীদের জানানো হয় এবং অভিভাবককে প্রয়োজনীয় কাগজপত্রসহ ভর্তি প্রক্রিয়া সম্পন্ন করতে হয়।',
      'adm.docs.title': 'প্রয়োজনীয় কাগজপত্র',
      'adm.doc1': 'পূর্ববর্তী শ্রেণির প্রশংসাপত্র ও নম্বরপত্র',
      'adm.doc2': 'জন্ম নিবন্ধন সনদের ফটোকপি',
      'adm.doc3': 'অভিভাবকের জাতীয় পরিচয়পত্রের ফটোকপি',
      'adm.doc4': 'সদ্য তোলা পাসপোর্ট সাইজের ছবি',
      'adm.aside.title': 'ভর্তি সংক্রান্ত যোগাযোগ',
      'adm.aside.text': 'ঘোনার চালা বাজারে অবস্থিত বিদ্যালয় অফিসে সরাসরি আসুন, অথবা অফিস সময়ে ফোন করুন।',
      'adm.aside.office': 'অফিস',
      'adm.aside.mobile': 'মোবাইল',
      'adm.aside.hours': 'সময়',
      'adm.aside.hoursV': 'রবি – বৃহস্পতি, সকাল ৯টা – বিকাল ৪টা',
      'adm.aside.cta': 'ভর্তি নোটিশ দেখুন',
      'adm.dates.title': '২০২৬ শিক্ষাবর্ষের সময়সূচি',
      'adm.dates.text': '২০২৬ শিক্ষাবর্ষের ভর্তি পরীক্ষা আগামী ১০ ডিসেম্বর ২০২৫ তারিখ সকাল ৯:০০ টায় মূল ভবনে অনুষ্ঠিত হবে। আবেদন ফরম বিদ্যালয়ের অফিস থেকে সংগ্রহ করা যাবে।',
      'adm.dates.cta': 'সম্পূর্ণ নোটিশ পড়ুন',
      'adm.help.title': 'কোথা থেকে শুরু করবেন বুঝতে পারছেন না?',
      'adm.help.text': '01309-114612 নম্বরে বিদ্যালয় অফিসে ফোন করুন, অথবা সময়সীমা ও সর্বশেষ ঘোষণা জানতে আমাদের ফেসবুক পেজ অনুসরণ করুন।',
      'adm.help.b1': 'যোগাযোগ করুন',
      'adm.help.b2': 'ফেসবুক পেজ',

      /* news */
      'news.title': 'নোটিশ বোর্ড',
      'news.eyebrow': 'নোটিশ',
      'news.lead': 'বিদ্যালয় অফিস থেকে প্রকাশিত ঘোষণা — শ্রেণি কার্যক্রম, পরীক্ষা, অনুষ্ঠান ও ভর্তি সংক্রান্ত তথ্য।',
      'news.count': '%N%টি নোটিশ',
      'news.count1': '১টি নোটিশ',
      'news.empty': 'এই মুহূর্তে কোনো নোটিশ নেই। কিছুদিন পর আবার দেখুন।',
      'news.error': 'নোটিশ লোড করা যায়নি। পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।',
      'news.loading': 'নোটিশ লোড হচ্ছে…',
      'news.pinned': 'গুরুত্বপূর্ণ',
      'news.back': 'সব নোটিশ',
      'news.published': 'প্রকাশকাল',
      'news.notFound': 'নোটিশটি খুঁজে পাওয়া যায়নি।',
      'news.notFoundText': 'নোটিশটি সরিয়ে ফেলা হয়ে থাকতে পারে, অথবা লিংকটি অসম্পূর্ণ।',
      'news.other': 'অন্যান্য নোটিশ',

      /* contact */
      'contact.title': 'যোগাযোগ',
      'contact.eyebrow': 'যোগাযোগ',
      'contact.lead': 'বিদ্যালয়ের অবস্থান এবং অফিসে যোগাযোগের মাধ্যম।',
      'contact.details.title': 'বিদ্যালয় অফিস',
      'contact.address': 'ঠিকানা',
      'contact.phone': 'অফিস টেলিফোন',
      'contact.mobile': 'মোবাইল',
      'contact.email': 'ই-মেইল',
      'contact.hours': 'অফিস সময়',
      'contact.hoursV': 'রবি – বৃহস্পতি, সকাল ৯টা – বিকাল ৪টা',
      'contact.social': 'ফেসবুক',
      'contact.socialV': 'ঘোনার চালা উচ্চ বিদ্যালয় (অফিশিয়াল)',
      'contact.map.title': 'আমাদের অবস্থান',
      'contact.map.text': 'বিদ্যালয়টি টাঙ্গাইলের সখিপুর উপজেলার কচুয়া ইউনিয়নে ঘোনার চালা বাজারের পাশে অবস্থিত।',
      'contact.map.label': 'ঘোনার চালা উচ্চ বিদ্যালয়ের অবস্থান নির্দেশক মানচিত্র',
      'contact.map.cta': 'গুগল ম্যাপে দেখুন',
      'contact.visit.title': 'পরিদর্শন',
      'contact.visit.text': 'অফিস সময়ে অভিভাবক ও আগ্রহী শিক্ষার্থীরা সরাসরি আসতে পারেন — পূর্ব অনুমতির প্রয়োজন নেই। ভর্তি সংক্রান্ত তথ্যের জন্য মূল ভবনের অফিসে যোগাযোগ করুন।',
      'contact.who.title': 'কার সাথে যোগাযোগ করবেন',
      'contact.who.adm': 'ভর্তি ও ফরম',
      'contact.who.admV': 'বিদ্যালয় অফিস — 01309-114612',
      'contact.who.acad': 'শিক্ষা সংক্রান্ত বিষয়',
      'contact.who.acadV': 'প্রধান শিক্ষক, মোঃ নজরুল ইসলাম',
      'contact.who.other': 'অন্যান্য',

      /* b */
      'acad.title': 'একাডেমিক তথ্য',
      'acad.eyebrow': 'একাডেমিক',
      'acad.lead': 'ষষ্ঠ থেকে দশম শ্রেণি, তিনটি বিভাগ এবং এনসিটিবি পাঠ্যক্রম অনুসরণ করে ঢাকা বোর্ডের অধীনে এসএসসি পরীক্ষা পর্যন্ত।',
      'acad.overview.title': 'শ্রেণি ও পাঠ্যক্রম',
      'acad.overview.p1': 'ঘোনার চালা উচ্চ বিদ্যালয়ে ষষ্ঠ থেকে দশম শ্রেণি পর্যন্ত পাঠদান করা হয়, যা জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (এনসিটিবি) নির্ধারিত পাঠ্যসূচি অনুসরণ করে। শিক্ষার্থীরা মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, ঢাকার অধীনে মাধ্যমিক স্কুল সার্টিফিকেট (এসএসসি) পরীক্ষায় অংশগ্রহণ করে।',
      'acad.overview.p2': 'ষষ্ঠ, সপ্তম ও অষ্টম শ্রেণিতে কোনো বিভাগ ছাড়াই একটি সাধারণ পাঠ্যসূচি অনুসরণ করা হয়। নবম শ্রেণি থেকে শিক্ষার্থীরা তিনটি বিভাগের একটি বেছে নেয় এবং দশম শ্রেণিতে এসএসসি পরীক্ষা পর্যন্ত তা অনুসরণ করে।',
      'acad.structure.title': 'শ্রেণিভিত্তিক কাঠামো',
      'acad.th.class': 'শ্রেণি',
      'acad.th.level': 'স্তর',
      'acad.th.stream': 'বিভাগ',
      'acad.class.six': 'ষষ্ঠ',
      'acad.class.seven': 'সপ্তম',
      'acad.class.eight': 'অষ্টম',
      'acad.class.nine': 'নবম',
      'acad.class.ten': 'দশম',
      'acad.level.lower': 'নিম্ন মাধ্যমিক',
      'acad.level.secondary': 'মাধ্যমিক',
      'acad.stream.general': 'সাধারণ (বিভাগ নেই)',
      'acad.stream.threeway': 'বিজ্ঞান / ব্যবসায় শিক্ষা / মানবিক',
      'acad.links.title': 'শিক্ষা সহায়ক লিংক',
      'acad.cta.title': 'ভর্তি হতে চান?',
      'acad.cta.text': 'ভর্তি প্রক্রিয়া, প্রয়োজনীয় কাগজপত্র ও সময়সূচি সম্পর্কে জানুন।',
      'acad.cta.button': 'ভর্তি তথ্য দেখুন',
      'acad.assess.title': 'মূল্যায়ন ও পরীক্ষা',
      'acad.assess.li1': 'শ্রেণিভিত্তিক ধারাবাহিক মূল্যায়ন ও শ্রেণি পরীক্ষা',
      'acad.assess.li2': 'অর্ধবার্ষিক ও বার্ষিক পরীক্ষা',
      'acad.assess.li3': 'দশম শ্রেণিতে নির্বাচনী (টেস্ট) পরীক্ষা',
      'acad.assess.li4': 'ঢাকা শিক্ষা বোর্ডের অধীনে এসএসসি পরীক্ষা',
      'acad.assess.note': 'পরীক্ষার সময়সূচি ও ফলাফল সংক্রান্ত ঘোষণা নোটিশ বোর্ডে প্রকাশ করা হয়।',
      'teach.title': 'শিক্ষকমণ্ডলী',
      'teach.joined': 'যোগদান',
      'teach.eyebrow': 'আমাদের শিক্ষক',
      'teach.lead': 'ঘোনার চালা উচ্চ বিদ্যালয়ে যাঁরা পাঠদান করেন।',
      'teach.intro': 'ঘোনার চালা উচ্চ বিদ্যালয়ে মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, ঢাকার অধীনে ষষ্ঠ থেকে দশম শ্রেণির জন্য এনসিটিবি পাঠ্যসূচি অনুসরণকারী শিক্ষকমণ্ডলী রয়েছেন। বিদ্যালয় তথ্য নথিভুক্ত করার সাথে সাথে এখানে প্রোফাইল যুক্ত করা হবে।',
      'teach.loading': 'শিক্ষকদের তথ্য লোড হচ্ছে…',
      'teach.note': 'বিদ্যালয় তথ্য নথিভুক্ত করার সাথে সাথে এই তালিকায় আরও শিক্ষকের প্রোফাইল যুক্ত করা হবে।',
      'teach.empty': 'এখনও কোনো শিক্ষকের প্রোফাইল প্রকাশ করা হয়নি।',
      'teach.error': 'শিক্ষকদের তথ্য লোড করা যায়নি। পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।',
      'comm.title': 'পরিচালনা পর্ষদ',
      'comm.eyebrow': 'পরিচালনা',
      'comm.lead': 'প্রধান শিক্ষকের পাশাপাশি যাঁরা ঘোনার চালা উচ্চ বিদ্যালয় পরিচালনায় দায়িত্ব পালন করেন।',
      'comm.intro': 'পরিচালনা পর্ষদ স্থানীয় এলাকাবাসী নিয়ে গঠিত এবং মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, ঢাকার বিধি অনুযায়ী প্রধান শিক্ষকের সাথে বিদ্যালয়ের প্রশাসনিক কার্যক্রম পরিচালনা করে।',
      'comm.loading': 'পরিচালনা পর্ষদের তথ্য লোড হচ্ছে…',
      'comm.note': 'তথ্য হালনাগাদ করার সাথে সাথে এই তালিকায় আরও সদস্য যুক্ত করা হবে।',
      'comm.empty': 'এখনও পরিচালনা পর্ষদের কোনো সদস্যের তথ্য প্রকাশ করা হয়নি।',
      'comm.error': 'পরিচালনা পর্ষদের তথ্য লোড করা যায়নি। পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।',

      /* c */
      'gal.title': 'ফটো গ্যালারি',
      'gal.eyebrow': 'গ্যালারি',
      'gal.lead': 'ঘোনার চালা উচ্চ বিদ্যালয়ের ক্যাম্পাস জীবনের মুহূর্ত — শিক্ষার্থী, অনুষ্ঠান ও বিদ্যালয় ভবন।',
      'gal.loading': 'ছবি লোড হচ্ছে…',
      'gal.empty': 'গ্যালারিতে এখনো কোনো ছবি যোগ করা হয়নি। কিছুদিন পর আবার দেখুন।',
      'gal.error': 'ছবি লোড করা যায়নি। পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।',
      'gal.count': '%N%টি ছবি',
      'gal.count1': '১টি ছবি',
      'gal.open': 'বড় করে দেখুন: %CAPTION%',
      'gal.close': 'বন্ধ করুন',
      'gal.prev': 'আগের ছবি',
      'gal.next': 'পরের ছবি',
      'gal.viewer': 'ছবি প্রদর্শক',
      'gal.position': '%TOTAL%টির মধ্যে %N% নম্বর ছবি',
      'nf.eyebrow': 'পাতা পাওয়া যায়নি',
      'nf.title': 'এই পাতাটি খুঁজে পাওয়া যাচ্ছে না',
      'nf.lead': 'আপনি যে পাতাটি খুঁজছেন তা সরিয়ে ফেলা হয়ে থাকতে পারে, নাম পরিবর্তন হয়ে থাকতে পারে, অথবা এটি আর নেই। নিচের যেকোনো পাতায় যেতে পারেন।',
      'nf.home': 'হোম পেজে যান'
    }
  };

  var THIS_YEAR = new Date().getFullYear();

  M.I18N = I18N;
  M.lang = DEFAULT_LANG;

  /** Path back to the site root. Pages in a sub-folder (notices/<id>.html) set
   *  <html data-root="../"> so data and links resolve from anywhere. */
  M.root = document.documentElement.getAttribute('data-root') || '';

  /** Look up a key in the active language, falling back to English then the key. */
  M.t = function (key, lang) {
    var l = lang || M.lang;
    var dict = I18N[l] || I18N.en;
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    if (Object.prototype.hasOwnProperty.call(I18N.en, key)) return I18N.en[key];
    return key;
  };

  /**
   * Apply the dictionary to every element carrying a data-i18n* attribute.
   * `data-i18n` sets text; the -placeholder / -aria / -title / -alt variants
   * set the matching attribute. Keys absent from the dictionary are left as
   * authored, so a missing translation degrades to the English in the markup.
   */
  function applyDict(lang) {
    var dict = I18N[lang] || I18N.en;

    M.qsa('[data-i18n]').forEach(function (node) {
      var key = node.getAttribute('data-i18n');
      if (!Object.prototype.hasOwnProperty.call(dict, key)) return;
      var value = dict[key];
      if (value.indexOf('%YEAR%') !== -1) {
        value = value.replace('%YEAR%', lang === 'bn' ? M.bnNum(THIS_YEAR) : String(THIS_YEAR));
      }
      node.textContent = value;
    });

    [['data-i18n-placeholder', 'placeholder'],
     ['data-i18n-aria', 'aria-label'],
     ['data-i18n-title', 'title'],
     ['data-i18n-alt', 'alt']].forEach(function (pair) {
      M.qsa('[' + pair[0] + ']').forEach(function (node) {
        var key = node.getAttribute(pair[0]);
        if (!Object.prototype.hasOwnProperty.call(dict, key)) return;
        node.setAttribute(pair[1], dict[key]);
      });
    });

    // <title> and <meta name="description">, keyed off <html>'s own attributes.
    var root = document.documentElement;
    var titleKey = root.getAttribute('data-title-key');
    if (titleKey && Object.prototype.hasOwnProperty.call(dict, titleKey)) {
      document.title = dict[titleKey];
    }
    var descKey = root.getAttribute('data-desc-key');
    var descEl = document.querySelector('meta[name="description"]');
    if (descKey && descEl && Object.prototype.hasOwnProperty.call(dict, descKey)) {
      descEl.setAttribute('content', dict[descKey]);
    }
  }

  /**
   * Switch language: update <html lang>, re-apply the dictionary, persist the
   * choice, and let dynamic renderers redraw via a `languagechange` event.
   */
  M.setLang = function (lang, opts) {
    lang = (lang === 'bn') ? 'bn' : 'en';
    M.lang = lang;
    document.documentElement.setAttribute('lang', lang);
    applyDict(lang);

    M.qsa('[data-lang-btn]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang-btn') === lang ? 'true' : 'false');
    });

    if (!opts || opts.persist !== false) {
      try { window.localStorage.setItem(LANG_KEY, lang); } catch (e) { /* private mode */ }
    }

    document.documentElement.removeAttribute('data-lang-pending');
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
  };

  M.storedLang = function () {
    try {
      var v = window.localStorage.getItem(LANG_KEY);
      return v === 'bn' || v === 'en' ? v : null;
    } catch (e) { return null; }
  };

  function initLang() {
    M.qsa('[data-lang-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        M.setLang(btn.getAttribute('data-lang-btn'));
      });
    });
    M.setLang(M.storedLang() || DEFAULT_LANG, { persist: false });
  }

  /* -------------------------------------------------------------- Notices */

  var noticesPromise = null;

  /** Fetch data/notices.json once per page load. */
  M.loadNotices = function () {
    if (!noticesPromise) {
      noticesPromise = fetch(M.root + 'data/notices.json', { cache: 'no-cache' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          var list = (data && data.notices) || [];
          // Newest first; pinned notices float to the top.
          return list.slice().sort(function (a, b) {
            if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
            return String(b.date).localeCompare(String(a.date));
          });
        });
    }
    return noticesPromise;
  };

  /** Pick the string for the active language from a {en, bn} pair. */
  M.pick = function (pair) {
    if (pair === null || pair === undefined) return '';
    if (typeof pair === 'string') return pair;
    return pair[M.lang] || pair.en || '';
  };

  /**
   * Render an array of inline "runs" into a parent node.
   * A run is either a plain string or {b: "..."} for bold. Text is always set
   * through textContent, so notice copy can never inject markup.
   */
  function renderRuns(parent, runs) {
    (Array.isArray(runs) ? runs : [runs]).forEach(function (run) {
      if (run === null || run === undefined) return;
      if (typeof run === 'string') {
        parent.appendChild(document.createTextNode(run));
      } else if (run.b) {
        parent.appendChild(M.el('strong', { text: run.b }));
      }
    });
  }

  /**
   * Render a notice body — an array of typed blocks — into `target`.
   * Blocks: {type:'p'|'h'|'list', en: …, bn: …}. This is the whole
   * "rich text" system; it replaces a Markdown parser plus a sanitizer.
   */
  M.renderBody = function (target, body) {
    M.clear(target);
    (body || []).forEach(function (block) {
      var content = block[M.lang] !== undefined ? block[M.lang] : block.en;
      if (content === undefined || content === null) return;

      if (block.type === 'h') {
        target.appendChild(M.el('h2', { text: typeof content === 'string' ? content : '' }));
      } else if (block.type === 'list') {
        var ul = M.el('ul');
        content.forEach(function (item) {
          var li = M.el('li');
          renderRuns(li, item);
          ul.appendChild(li);
        });
        target.appendChild(ul);
      } else {
        var p = M.el('p');
        renderRuns(p, content);
        target.appendChild(p);
      }
    });
  };

  /**
   * One row in a notice list. Built from divs rather than spans because the
   * row carries block content (summary, meta) inside the link.
   */
  M.noticeRow = function (notice, opts) {
    var parts = M.dateParts(notice.date);
    var chip = M.el('div', { class: 'm-date-chip' }, [
      M.el('span', { class: 'm-date-day', text: parts.day }),
      M.el('span', { class: 'm-date-mon', text: parts.mon })
    ]);

    var body = M.el('div', { class: 'flex-grow-1' });
    body.appendChild(M.el('h3', { class: 'm-notice-title', text: M.pick(notice.title) }));

    var summary = M.pick(notice.summary);
    if (summary && !(opts && opts.compact)) {
      body.appendChild(M.el('p', { class: 'm-notice-summary', text: summary }));
    }

    var meta = M.el('p', { class: 'm-notice-meta' });
    meta.appendChild(M.el('span', { class: 'm-tag', text: M.pick(notice.category) }));
    if (notice.pinned) {
      meta.appendChild(document.createTextNode(' '));
      meta.appendChild(M.el('span', { class: 'm-tag m-tag-pin', text: M.t('news.pinned') }));
    }
    meta.appendChild(document.createTextNode(' '));
    meta.appendChild(M.el('time', { datetime: notice.date, text: M.formatDate(notice.date) }));
    body.appendChild(meta);

    return M.el('a', {
      class: 'm-notice',
      href: M.root + 'notices/' + encodeURIComponent(notice.id) + '.html'
    }, [chip, body]);
  };

  /* --------------------------------------------------------------- Chrome */

  function initHeader() {
    var header = M.qs('[data-header]');
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initBackToTop() {
    var btn = M.qs('[data-top]');
    if (!btn) return;
    btn.innerHTML = ICONS.arrowUp;
    var onScroll = function () { btn.classList.toggle('is-on', window.scrollY > 500); };
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    onScroll();
  }

  /** Fill every [data-icon="name"] placeholder with its SVG. */
  function initIcons() {
    M.qsa('[data-icon]').forEach(function (node) {
      var svg = ICONS[node.getAttribute('data-icon')];
      if (svg) node.innerHTML = svg;
    });
  }

  /**
   * Mark the nav link matching this page. A page may also declare a
   * `data-group` (e.g. about/teachers/committee all sit under "institution"),
   * which lights up the parent dropdown toggle as well.
   */
  function initActiveNav() {
    var root = document.documentElement;
    var page = root.getAttribute('data-page');
    var group = root.getAttribute('data-group');
    if (!page && !group) return;
    M.qsa('[data-nav]').forEach(function (link) {
      var value = link.getAttribute('data-nav');
      if (page && value === page) link.setAttribute('aria-current', 'page');
      else if (group && value === group) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function init() {
    initIcons();
    initActiveNav();
    initLang();
    initHeader();
    initBackToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.M = M;
}(window, document));
